import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const candidateMode = process.env.HERO_SCALE_LANCER_CANDIDATE === '1';
const outputRoot = path.join(
  projectRoot,
  'public',
  'assets',
  'dev',
  'option-c',
  'hero-scale-parity-v1',
  ...(candidateMode ? ['candidate'] : []),
  'runtime-proof',
);
const baseUrl = process.env.HERO_SCALE_BASE_URL ?? 'http://127.0.0.1:5173';
const viewport = { width: 1366, height: 768 };
const heroIds = ['alistair', 'white_mage', 'dark_mage', 'archer', 'rogue', 'lancer'];
const primaryIds = ['alistair', 'archer', 'rogue', 'lancer'];
const travelActors = [
  { unitId: 'alistair', actorId: 'alistair' },
  { unitId: 'white_mage', actorId: 'marian' },
  { unitId: 'dark_mage', actorId: 'elara' },
  { unitId: 'archer', actorId: 'kestrel' },
  { unitId: 'rogue', actorId: 'cedric' },
  { unitId: 'lancer', actorId: 'lancer' },
];

await mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch({ headless: true });
const browserErrors = [];
const failedRequests = [];
const characterResponses = [];
const screenshots = [];
const records = {};
const interceptedCandidateRequests = [];

const candidateRoot = path.join(
  projectRoot,
  'public',
  'assets',
  'dev',
  'option-c',
  'hero-scale-parity-v1',
  'candidate',
);
const candidateManifestPath = path.join(candidateRoot, 'manifests', 'lancer-1.12-candidate-manifest.json');
const candidateManifest = candidateMode
  ? JSON.parse(await readFile(candidateManifestPath, 'utf8'))
  : null;
const candidateRoutes = candidateMode
  ? new Map([
      ['/assets/characters/pixel/masters/lancer.png', path.join(candidateRoot, 'masters', 'lancer.png')],
      ...['prepare', 'dash', 'attack', 'cast'].map((pose) => [
        `/assets/characters/pixel/combat/lancer/${pose}.png`,
        path.join(candidateRoot, 'combat', 'lancer', `${pose}.png`),
      ]),
    ])
  : new Map();
const configuredCandidateRoutes = candidateMode
  ? await Promise.all([...candidateRoutes].map(async ([urlPath, filePath]) => ({
      path: urlPath,
      candidatePath: path.relative(projectRoot, filePath).replaceAll('\\', '/'),
      sha256: createHash('sha256').update(await readFile(filePath)).digest('hex'),
    })))
  : [];
const candidateRouteHashes = new Map(configuredCandidateRoutes.map((record) => [record.path, record.sha256]));

function proofName(name) {
  return candidateMode ? `lancer-1.12-${name}` : name;
}

async function installCandidateRoutes(context) {
  for (const [urlPath, filePath] of candidateRoutes) {
    await context.route(`**${urlPath}`, async (route) => {
      interceptedCandidateRequests.push({
        path: urlPath,
        candidatePath: path.relative(projectRoot, filePath).replaceAll('\\', '/'),
        sha256: candidateRouteHashes.get(urlPath),
      });
      await route.fulfill({ path: filePath, contentType: 'image/png' });
    });
  }
}

function observe(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push({ label, kind: 'console', message: message.text() });
  });
  page.on('pageerror', (error) => browserErrors.push({ label, kind: 'pageerror', message: error.message }));
  page.on('requestfailed', (request) => failedRequests.push({ label, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.includes('/assets/characters/pixel/')) {
      characterResponses.push({ label, path: url.pathname, status: response.status() });
    }
  });
}

async function loadUiHarness(page) {
  await page.goto(`${baseUrl}/docs/reports/cin-6e-a-4r-dialogue-review.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await page.evaluate(async () => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/src/styles/app.css';
    document.head.append(css);
    await new Promise((resolve, reject) => {
      css.addEventListener('load', resolve, { once: true });
      css.addEventListener('error', reject, { once: true });
    });
    const [store, catalog, travel, management] = await Promise.all([
      import('/src/game/store.ts'),
      import('/src/game/catalog.ts'),
      import('/src/ui/TravelView.ts'),
      import('/src/ui/ManagementView.ts'),
    ]);
    window.__heroScaleUiQa = { store, catalog, travel, management };
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
  });
}

async function fullPartyState(page) {
  return page.evaluate(() => {
    const modules = window.__heroScaleUiQa;
    const state = modules.store.createInitialState();
    for (const id of ['rogue', 'lancer']) {
      if (!state.clan.members.some((unit) => unit.definitionId === id)) {
        state.clan.members.push(modules.catalog.createUnitInstance(id, true));
      }
    }
    window.__heroScaleState = state;
    return state.clan.members.map((unit) => ({ id: unit.id, definitionId: unit.definitionId, name: unit.name }));
  });
}

async function captureTravel(page) {
  const context = await page.evaluate(() => {
    const modules = window.__heroScaleUiQa;
    document.body.replaceChildren();
    const view = new modules.travel.TravelView({
      root: document.body,
      getState: () => window.__heroScaleState,
      onSelect: async () => undefined,
      onOpenClan: () => undefined,
      onSave: () => undefined,
      onOpenMenu: () => undefined,
    });
    view.open();
    window.__heroScaleActiveView = view;
    return { partyCount: document.querySelectorAll('.travel-hero').length };
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.travel-hero__sprite')].every((image) => image.complete && image.naturalWidth === 512));
  await page.waitForTimeout(100);
  const metrics = await page.evaluate((actors) => {
    return actors.map(({ unitId, actorId }) => {
      const actor = document.querySelector(`.travel-hero[data-character-id="${actorId}"]`);
      const image = actor?.querySelector('img');
      if (!actor || !image) return { unitId, actorId, present: false };
      const actorStyle = getComputedStyle(actor);
      const imageStyle = getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      return {
        unitId,
        actorId,
        present: true,
        src: new URL(image.src).pathname,
        naturalSize: [image.naturalWidth, image.naturalHeight],
        actorTransform: actorStyle.transform,
        imageTransform: imageStyle.transform,
        objectFit: imageStyle.objectFit,
        displayRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    });
  }, travelActors);
  const screenshot = path.join(outputRoot, proofName('travel-company-lineup.png'));
  await page.screenshot({ path: screenshot, animations: 'disabled' });
  screenshots.push(path.relative(projectRoot, screenshot).replaceAll('\\', '/'));
  records.travel = { ...context, result: 'CAPTURED', metrics };
}

async function captureCompanyRegister(page) {
  const context = await page.evaluate(() => {
    const modules = window.__heroScaleUiQa;
    window.__heroScaleActiveView?.close?.();
    document.body.replaceChildren();
    const view = new modules.management.ManagementView({
      root: document.body,
      getState: () => window.__heroScaleState,
      onChange: () => undefined,
    });
    void view.open('clan');
    window.__heroScaleActiveView = view;
    const lancer = window.__heroScaleState.clan.members.find((unit) => unit.definitionId === 'lancer');
    document.querySelector(`[data-unit="${lancer?.id ?? ''}"]`)?.click();
    return { selectedUnitId: lancer?.id ?? null };
  });
  await page.waitForFunction(() => {
    const image = document.querySelector('.unit-stage__figure img');
    return image?.complete && image.naturalWidth === 512 && image.alt === 'Garen';
  });
  await page.waitForTimeout(100);
  const metrics = await page.evaluate(() => {
    const image = document.querySelector('.unit-stage__figure img');
    const style = getComputedStyle(image);
    const rect = image.getBoundingClientRect();
    return {
      src: new URL(image.src).pathname,
      naturalSize: [image.naturalWidth, image.naturalHeight],
      transform: style.transform,
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      displayRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      rosterMasterSources: [...document.querySelectorAll('.roster-card__portrait img')].map((item) => new URL(item.src).pathname),
    };
  });
  const screenshot = path.join(outputRoot, proofName('company-register-garen.png'));
  await page.screenshot({ path: screenshot, animations: 'disabled' });
  screenshots.push(path.relative(projectRoot, screenshot).replaceAll('\\', '/'));
  records.companyRegister = { ...context, result: 'CAPTURED', metrics };
}

async function mountCombatIframe(page) {
  return page.evaluate(async ({ primaryIds }) => {
    const modules = window.__heroScaleUiQa;
    window.__heroScaleActiveView?.close?.();
    document.body.replaceChildren();
    const style = document.createElement('style');
    style.textContent = 'html,body{width:100%;height:100%;margin:0;background:#050914} iframe{display:block;width:100%;height:100%;border:0}';
    document.head.append(style);
    const state = window.__heroScaleState;
    const definitions = { alistair: 'warrior', archer: 'archer', rogue: 'rogue', lancer: 'lancer' };
    const selected = primaryIds.map((unitId) => state.clan.members.find((unit) => unit.definitionId === definitions[unitId])).filter(Boolean);
    const clan = selected.map((unit) => modules.catalog.toCombatant(unit, { qaUnlockAllSkills: true }));
    const iframe = document.createElement('iframe');
    iframe.src = '/legacy-combat.html?campaign=1&qa=1&stageqa=1';
    iframe.setAttribute('title', 'Hero scale parity strategic and Combat Stage proof');
    document.body.append(iframe);
    const result = await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Combat iframe initialization timeout')), 60_000);
      const onMessage = (event) => {
        if (event.source !== iframe.contentWindow || event.origin !== location.origin) return;
        if (event.data?.type === 'rpg-threejs:combat-ready') {
          const config = {
            id: 'hero-scale-parity-audit',
            sceneId: 'forest_route',
            objective: 'Audit visuel de parité des héros.',
            encounterLabel: 'Hero Scale Parity Audit',
            encounterRank: 'normal',
            enemyVisualIds: ['serpent_raider'],
            escortVisualIds: [],
            maxPlayerUnits: 4,
            rewards: { gold: 0, reputation: 0, materials: {} },
          };
          iframe.contentWindow.postMessage({
            type: 'rpg-threejs:combat-initialize',
            config,
            clan,
            inventory: {},
            preferredUnitIds: selected.map((unit) => unit.id),
            reducedGraphics: true,
            devQa: true,
            qaFullAp: true,
            qaDeployAll: true,
          }, location.origin);
        }
        if (event.data?.type === 'rpg-threejs:combat-initialized') {
          window.clearTimeout(timeout);
          window.removeEventListener('message', onMessage);
          resolve({ clan: clan.map((unit) => ({ id: unit.id, name: unit.name, portrait: unit.portrait })) });
        }
      };
      window.addEventListener('message', onMessage);
    });
    return result;
  }, { primaryIds });
}

async function captureCombatSurfaces(page) {
  const mounted = await mountCombatIframe(page);
  const frame = page.frames().find((candidate) => candidate.url().includes('/legacy-combat.html'));
  if (!frame) throw new Error('Combat iframe frame was not found.');
  await frame.waitForFunction(() => window.__BOOTED === true && Boolean(window.__qaHelpers), undefined, { timeout: 60_000 });
  await frame.locator('[data-qa="prepare"]').click();
  await frame.waitForFunction(() => window.__qaHelpers.getGameMode() !== 'deploy', undefined, { timeout: 15_000 });
  await frame.locator('#tutorial [data-action="skip"]').click().catch(() => undefined);
  await frame.locator('#boss-tutorial [data-action="start"]').click().catch(() => undefined);
  await frame.waitForTimeout(500);
  const strategicMetrics = await frame.evaluate(() => ({
    activeUnitName: window.__qaHelpers.getActiveUnitName(),
    gameMode: window.__qaHelpers.getGameMode(),
    canvas: (() => {
      const rect = document.querySelector('canvas').getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })(),
  }));
  const strategicScreenshot = path.join(outputRoot, proofName('strategic-primary-heroes.png'));
  await page.screenshot({ path: strategicScreenshot, animations: 'disabled' });
  screenshots.push(path.relative(projectRoot, strategicScreenshot).replaceAll('\\', '/'));
  records.strategic = { result: 'CAPTURED', clan: mounted.clan, metrics: strategicMetrics };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const active = await frame.evaluate(() => window.__qaHelpers.getActiveUnitName());
    if (active === 'Garen') break;
    await frame.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await frame.waitForTimeout(450);
  }
  const activeBeforeStage = await frame.evaluate(() => window.__qaHelpers.getActiveUnitName());
  if (activeBeforeStage !== 'Garen') {
    throw new Error(`Unable to make Garen active for Combat Stage proof; active=${activeBeforeStage}`);
  }
  await frame.locator('[data-pose-qa="hold"]').click();
  await frame.waitForTimeout(900);
  const combatStageMetrics = await frame.evaluate(() => {
    const hint = document.querySelector('#hint')?.textContent?.trim() ?? '';
    return {
      activeUnitName: window.__qaHelpers.getActiveUnitName(),
      gameMode: window.__qaHelpers.getGameMode(),
      hint,
      stageActive: hint.includes('Garen [lancer]') && hint.includes('PREPARE'),
    };
  });
  const combatStageScreenshot = path.join(outputRoot, proofName('combat-stage-garen-prepare.png'));
  await page.screenshot({ path: combatStageScreenshot, animations: 'disabled' });
  screenshots.push(path.relative(projectRoot, combatStageScreenshot).replaceAll('\\', '/'));
  records.combatStage = { result: 'CAPTURED', metrics: combatStageMetrics };

  await frame.locator('[data-pose-qa="cycle"]').click();
  await frame.waitForTimeout(350);
  await frame.locator('[data-pose-qa="cycle"]').click();
  await frame.waitForFunction(
    () => (document.querySelector('#hint')?.textContent ?? '').includes('Garen [lancer]')
      && (document.querySelector('#hint')?.textContent ?? '').includes('ATTACK'),
    undefined,
    { timeout: 15_000 },
  );
  await frame.waitForTimeout(500);
  const combatStageAttackMetrics = await frame.evaluate(() => {
    const hint = document.querySelector('#hint')?.textContent?.trim() ?? '';
    return {
      activeUnitName: window.__qaHelpers.getActiveUnitName(),
      gameMode: window.__qaHelpers.getGameMode(),
      hint,
      stageActive: hint.includes('Garen [lancer]') && hint.includes('ATTACK'),
    };
  });
  const combatStageAttackScreenshot = path.join(outputRoot, proofName('combat-stage-garen-attack.png'));
  await page.screenshot({ path: combatStageAttackScreenshot, animations: 'disabled' });
  screenshots.push(path.relative(projectRoot, combatStageAttackScreenshot).replaceAll('\\', '/'));
  const combatStageAttackCanvasScreenshot = path.join(outputRoot, proofName('combat-stage-garen-attack-canvas.png'));
  await frame.locator('#qa-combat-controls').evaluate((element) => {
    element.dataset.previousVisibility = element.style.visibility;
    element.style.visibility = 'hidden';
  });
  await frame.locator('canvas').screenshot({ path: combatStageAttackCanvasScreenshot, animations: 'disabled' });
  await frame.locator('#qa-combat-controls').evaluate((element) => {
    element.style.visibility = element.dataset.previousVisibility ?? '';
    delete element.dataset.previousVisibility;
  });
  screenshots.push(path.relative(projectRoot, combatStageAttackCanvasScreenshot).replaceAll('\\', '/'));
  records.combatStageAttack = {
    result: 'CAPTURED',
    metrics: combatStageAttackMetrics,
    cleanCanvasScreenshot: path.relative(projectRoot, combatStageAttackCanvasScreenshot).replaceAll('\\', '/'),
  };
}

try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  if (candidateMode) await installCandidateRoutes(context);
  const page = await context.newPage();
  observe(page, 'hero-scale-parity');
  await loadUiHarness(page);
  records.party = await fullPartyState(page);
  await captureTravel(page);
  await captureCompanyRegister(page);
  await captureCombatSurfaces(page);
  await context.close();
} finally {
  await browser.close();
}

const requestedMasterPaths = heroIds.map((id) => `/assets/characters/pixel/masters/${id}.png`);
const requestedPreparePaths = primaryIds.map((id) => `/assets/characters/pixel/combat/${id}/prepare.png`);
const successfulPaths = new Set(characterResponses.filter((response) => response.status === 200).map((response) => response.path));
const sourceCoverage = {
  masters: requestedMasterPaths.every((item) => successfulPaths.has(item)),
  primaryPrepare: requestedPreparePaths.every((item) => successfulPaths.has(item)),
  candidateMaster: !candidateMode || interceptedCandidateRequests.some((item) => item.path === '/assets/characters/pixel/masters/lancer.png'),
  candidatePrepare: !candidateMode || interceptedCandidateRequests.some((item) => item.path === '/assets/characters/pixel/combat/lancer/prepare.png'),
  candidateAllFive: !candidateMode || configuredCandidateRoutes.every(
    (record) => interceptedCandidateRequests.some((item) => item.path === record.path && item.sha256 === record.sha256),
  ),
};
const report = {
  schemaVersion: 1,
  mission: candidateMode
    ? 'Lancer 1.12x DEV candidate — focused live runtime proof'
    : 'Hero Scale Parity V1 — focused live runtime proof',
  status: browserErrors.length === 0
    && failedRequests.length === 0
    && sourceCoverage.masters
    && sourceCoverage.primaryPrepare
    && sourceCoverage.candidateMaster
    && sourceCoverage.candidatePrepare
    && sourceCoverage.candidateAllFive
    ? 'PASS'
    : 'FAIL',
  baseUrl,
  viewport,
  devCandidateOverride: candidateMode,
  productionRuntimeModified: false,
  candidateManifest: candidateMode
    ? path.relative(projectRoot, candidateManifestPath).replaceAll('\\', '/')
    : null,
  candidateTransform: candidateManifest?.transform ?? null,
  configuredCandidateRoutes,
  interceptedCandidateRequests,
  records,
  sourceCoverage,
  characterResponses,
  browserErrors,
  failedRequests,
  screenshots,
};
const reportPath = path.join(outputRoot, proofName('runtime-proof-report.json'));
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status: report.status,
  sourceCoverage,
  screenshots,
  browserErrors,
  failedRequests,
  report: path.relative(projectRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
