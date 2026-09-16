import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { toCombatant } from '../../src/game/catalog';
import { combatConfigs } from '../../src/game/content';
import { enterRunNode } from '../../src/game/runSystem';
import { createInitialState } from '../../src/game/store';
import productionManifest from '../../src/render/data/demo-environment-pack-v1.production.json';

const BASE_URL = process.env.OPTION_C_PRODUCTION_URL ?? 'http://127.0.0.1:4173';
const OUTPUT_PATH = resolve(
  process.cwd(),
  'docs',
  'art-direction',
  'option-c',
  'environment-production',
  'demo-environment-pack-v1',
  'production-smoke.json',
);
const PRODUCTION_MARKER = productionManifest.productionPublicRoot;
const AUTO_SAVE_KEY = 'rpg-threejs:autosave:v6';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assetUrl(assetId: string): string {
  const asset = productionManifest.assets.find((candidate) => candidate.assetId === assetId);
  invariant(asset, `Missing production asset ${assetId}`);
  return new URL(asset.publicUrl, BASE_URL).toString();
}

async function installSave(page: Page, state: ReturnType<typeof createInitialState>): Promise<void> {
  await page.goto(`${BASE_URL}/?journey=travel&presentation=narrative&media=stills`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ key, value }) => {
    localStorage.clear();
    localStorage.setItem(key, value);
  }, { key: AUTO_SAVE_KEY, value: JSON.stringify(state) });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function smokeTravelAndTableau(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const failedEnvironmentRequests: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes(PRODUCTION_MARKER) && !response.ok()) {
      failedEnvironmentRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes(PRODUCTION_MARKER)) {
      failedEnvironmentRequests.push(`${request.failure()?.errorText ?? 'FAILED'} ${request.url()}`);
    }
  });

  const travelState = createInitialState();
  travelState.flags.prologueSeen = true;
  if (!travelState.resolvedNodeIds.includes('lion-camp')) travelState.resolvedNodeIds.push('lion-camp');
  await installSave(page, travelState);
  await page.locator('.travel-view').waitFor({ state: 'visible', timeout: 30_000 });
  const travel = await page.locator('.travel-view').evaluate((element) => ({
    contextId: element.getAttribute('data-travel-context'),
    assetId: element.getAttribute('data-travel-backdrop'),
    visualFamily: element.getAttribute('data-travel-visual-family'),
    background: (element as HTMLElement).style.getPropertyValue('--travel-sky'),
    destinationLabels: [...element.querySelectorAll('.route-choice__title')].map((node) => node.textContent?.trim()),
  }));
  invariant(travel.contextId === 'edge:lion-camp>lion-audience', `Travel context mismatch: ${JSON.stringify(travel)}`);
  invariant(travel.assetId === 'lion_camp_travel', `Travel asset mismatch: ${JSON.stringify(travel)}`);
  invariant(
    travel.background.includes(new URL(assetUrl('lion_camp_travel')).pathname),
    `Travel URL mismatch: ${travel.background}`,
  );

  const audienceState = createInitialState();
  audienceState.flags.prologueSeen = true;
  if (!audienceState.resolvedNodeIds.includes('lion-camp')) audienceState.resolvedNodeIds.push('lion-camp');
  const audienceNode = enterRunNode(audienceState.run, 'lion-audience');
  invariant(audienceNode, 'Could not enter lion-audience for production smoke');
  audienceState.currentNodeId = audienceNode.id;
  audienceState.visitedNodeIds = [...audienceState.run.visitedNodeIds];
  audienceState.stepCounter += 1;
  await installSave(page, audienceState);
  await page.locator('.dialogue[data-dialogue-sequence="lion_briefing"]').waitFor({ state: 'visible', timeout: 30_000 });
  const tableau = await page.locator('.narrative-stage').evaluate((stage) => ({
    tableauId: stage.getAttribute('data-narrative-tableau'),
    castOwnership: stage.getAttribute('data-narrative-cast-ownership'),
    actors: [...stage.querySelectorAll('.narrative-cast__actor')].map((actor) => actor.getAttribute('data-actor-id')),
    background: stage.querySelector('.narrative-scene-surface__environment')?.getAttribute('style') ?? '',
  }));
  invariant(tableau.tableauId === 'ALARIC_AUDIENCE_TABLEAU', `Tableau mismatch: ${JSON.stringify(tableau)}`);
  invariant(tableau.actors.length === 4, `Expected four tableau actors, got ${tableau.actors.length}`);
  invariant(tableau.castOwnership === 'STAGE_OWNS_CAST', `Tableau cast ownership mismatch: ${tableau.castOwnership}`);
  invariant(
    tableau.background.includes(new URL(assetUrl('alaric_audience_tableau')).pathname),
    `Tableau URL mismatch: ${tableau.background}`,
  );
  invariant(failedEnvironmentRequests.length === 0, `Environment request failures: ${failedEnvironmentRequests.join('; ')}`);

  await context.close();
  return { travel, tableau, failedEnvironmentRequests };
}

async function smokeCombat(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  combatId: string,
  expectedStrategicAssetId: string,
  expectedStageAssetId: string,
) {
  const config = combatConfigs.get(combatId);
  invariant(config, `Missing combat config ${combatId}`);
  const state = createInitialState();
  const payload = {
    type: 'rpg-threejs:combat-initialize',
    config,
    clan: state.clan.members.map((unit) => toCombatant(unit, { qaUnlockAllSkills: true })),
    inventory: { ...state.inventory.consumables },
    preferredUnitIds: ['warrior', 'archer', 'white_mage', 'dark_mage'],
    reducedGraphics: false,
    devQa: true,
    qaFullAp: true,
    qaDeployAll: true,
    devOptionCProof: false,
    devOptionCProofCharacter: 'kestrel',
  };
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const environmentResponses: Array<{ url: string; status: number }> = [];
  const failedEnvironmentRequests: string[] = [];
  page.on('response', (response) => {
    if (!response.url().includes(PRODUCTION_MARKER)) return;
    environmentResponses.push({ url: response.url(), status: response.status() });
    if (!response.ok()) failedEnvironmentRequests.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes(PRODUCTION_MARKER)) {
      failedEnvironmentRequests.push(`${request.failure()?.errorText ?? 'FAILED'} ${request.url()}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('rpg-tutorial-seen', '1');
    localStorage.setItem('rpg-boss-tutorial-seen', '1');
    document.body.replaceChildren();
  });
  await page.evaluate(async (message) => {
    await new Promise<void>((resolveReady, rejectReady) => {
      const iframe = document.createElement('iframe');
      iframe.id = 'production-combat-smoke';
      iframe.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0';
      const timeout = window.setTimeout(() => rejectReady(new Error('Combat iframe initialization timed out')), 30_000);
      window.addEventListener('message', (event) => {
        if (event.source !== iframe.contentWindow || event.origin !== location.origin) return;
        const data = event.data as { type?: string };
        if (data.type === 'rpg-threejs:combat-ready') iframe.contentWindow?.postMessage(message, location.origin);
        if (data.type === 'rpg-threejs:combat-initialized') {
          window.clearTimeout(timeout);
          resolveReady();
        }
      });
      iframe.src = '/legacy-combat.html?campaign=1&qa=1';
      document.body.append(iframe);
    });
  }, payload);

  const frame = page.frames().find((candidate) => candidate.url().includes('/legacy-combat.html'));
  invariant(frame, `Combat iframe missing for ${combatId}`);
  const strategicUrl = assetUrl(expectedStrategicAssetId);
  await page.waitForFunction(
    ({ expected }) => performance.getEntriesByType('resource').some((entry) => entry.name === expected),
    { expected: strategicUrl },
    { timeout: 30_000 },
  ).catch(() => undefined);
  await frame.locator('[data-qa="prepare"]').click();
  await frame.waitForFunction(() => Boolean((window as unknown as { __qaHelpers?: unknown }).__qaHelpers));
  await frame.evaluate(() => {
    const helpers = (window as unknown as {
      __qaHelpers: { restoreActiveUnitAp: () => unknown };
    }).__qaHelpers;
    const game = (window as unknown as {
      G: {
        active: { gx: number; gz: number; team: string };
        units: Array<{ gx: number; gz: number; team: string; alive: boolean }>;
        grid: Array<Array<{ gx: number; gz: number; walkable: boolean; occupant: unknown }>>;
      };
    }).G;
    const unit = game.active;
    const enemy = game.units.find((candidate) => candidate.alive && candidate.team !== unit.team);
    if (!enemy) throw new Error('No enemy available for production Stage smoke');
    const destination = game.grid.flat().find((cell) =>
      cell.walkable
      && !cell.occupant
      && Math.abs(cell.gx - enemy.gx) + Math.abs(cell.gz - enemy.gz) === 2,
    );
    if (!destination) throw new Error('No range-two cell available for production Stage smoke');
    game.grid[unit.gx]![unit.gz]!.occupant = null;
    unit.gx = destination.gx;
    unit.gz = destination.gz;
    destination.occupant = unit;
    helpers.restoreActiveUnitAp();
  });
  await frame.locator('[data-a="attack"]').click();
  await frame.locator('[data-ch="0"]').click();
  await frame.waitForTimeout(500);
  const attackState = await frame.evaluate(() => ({
    mode: (window as unknown as { __qaHelpers: { getGameMode: () => string } }).__qaHelpers.getGameMode(),
    busy: (window as unknown as { __qaHelpers: { isGameBusy: () => boolean } }).__qaHelpers.isGameBusy(),
    active: (window as unknown as { __qaHelpers: { getActiveUnitName: () => string } }).__qaHelpers.getActiveUnitName(),
    menu: document.querySelector('#menu')?.textContent?.replace(/\s+/g, ' ').trim(),
  }));
  invariant(attackState.mode === 'target', `${combatId}: attack did not enter target mode: ${JSON.stringify(attackState)}`);
  const target = await frame.evaluate(() => {
    const helpers = (window as unknown as {
      __qaHelpers: {
        getNearestEnemyScreenPosition: () => { gx: number; gz: number; screenX: number; screenY: number };
        getCellScreenPosition: (gx: number, gz: number) => { screenX: number; screenY: number };
      };
    }).__qaHelpers;
    const enemy = helpers.getNearestEnemyScreenPosition();
    return { enemy, cell: helpers.getCellScreenPosition(enemy.gx, enemy.gz) };
  });
  const iframeBox = await page.locator('#production-combat-smoke').boundingBox();
  invariant(iframeBox, `Combat iframe has no layout box for ${combatId}`);
  await page.mouse.click(iframeBox.x + target.cell.screenX, iframeBox.y + target.cell.screenY);
  await frame.waitForFunction(() => Boolean((window as unknown as { G?: { stage?: boolean } }).G?.stage), undefined, { timeout: 10_000 });

  const stageUrl = assetUrl(expectedStageAssetId);
  await page.waitForTimeout(300);
  invariant(environmentResponses.some((response) => response.url === strategicUrl && response.status === 200),
    `${combatId}: strategic production plate was not loaded`);
  invariant(environmentResponses.some((response) => response.url === stageUrl && response.status === 200),
    `${combatId}: Combat Stage production plate was not loaded`);
  invariant(failedEnvironmentRequests.length === 0,
    `${combatId}: environment request failures: ${failedEnvironmentRequests.join('; ')}`);

  await context.close();
  return { combatId, sceneId: config.sceneId, strategicUrl, stageUrl, environmentResponses, failedEnvironmentRequests };
}

const browser = await chromium.launch({ headless: true });
const report: Record<string, unknown> = {
  schemaVersion: 1,
  packId: productionManifest.packId,
  status: productionManifest.status,
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
};
try {
  report.travelAndTableau = await smokeTravelAndTableau(browser);
  report.combat = [
    await smokeCombat(browser, 'forest_ambush', 'forest_route_strategic', 'forest_route_stage'),
    await smokeCombat(browser, 'village_defense', 'bois_clair_burning_strategic', 'bois_clair_burning_stage'),
    await smokeCombat(browser, 'lion_chief', 'lion_sanctum_strategic', 'lion_sanctum_stage'),
  ];
  report.summary = {
    pass: true,
    travelContexts: 1,
    fourActorTableaux: 1,
    strategicEnvironments: 3,
    combatStageEnvironments: 3,
    failedEnvironmentRequests: 0,
    devEnvironmentOverrideUsed: false,
  };
} catch (error) {
  report.summary = { pass: false };
  report.error = error instanceof Error ? error.stack : String(error);
} finally {
  await browser.close();
}

await mkdir(resolve(OUTPUT_PATH, '..'), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report.summary, null, 2));
if (!(report.summary as { pass?: boolean }).pass) process.exitCode = 1;
