import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const packRoot = path.join(
  projectRoot,
  'public',
  'assets',
  'dev',
  'option-c',
  'phase4b',
  'environment',
  'demo-environment-pack-v1',
);
const runtimeReviewRoot = path.join(packRoot, 'runtime-review');
const closeoutRoot = path.join(runtimeReviewRoot, 'final-closeout');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const packUrlMarker = '/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1/';
const beatMap = JSON.parse(await readFile(path.join(packRoot, 'beat-background-map.json'), 'utf8'));

const viewports = [
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1366x768', width: 1366, height: 768 },
];

const captures = [
  {
    kind: 'travel',
    surface: 'travel',
    slug: 'lion-camp-departure',
    context: 'edge:lion-camp>lion-audience',
    expectedCurrent: 'lion-camp',
    expectedDestination: 'lion-audience',
    expectedHeading: 'Camp du Lion',
    expectedRoute: 'Audience d’Alaric',
  },
  {
    kind: 'travel',
    surface: 'travel',
    slug: 'forest-road-progression',
    context: 'edge:lion-audience>lion-opening-ambush',
    expectedCurrent: 'lion-audience',
    expectedDestination: 'lion-opening-ambush',
    expectedHeading: 'Audience d’Alaric',
    expectedRoute: 'Piste des bêtes',
  },
  {
    kind: 'travel',
    surface: 'travel',
    slug: 'bois-clair-transition',
    context: 'edge:lion-second-trial-event>lion-village-choice',
    expectedCurrent: 'lion-second-trial-event',
    expectedDestination: 'lion-village-choice',
    expectedHeading: 'Vieux sanctuaire',
    expectedRoute: 'Bois-Clair assiégé',
  },
  {
    kind: 'travel',
    surface: 'travel',
    slug: 'final-refuge-to-judgement',
    context: 'edge:lion-final-refuge>lion-final-judgement',
    expectedCurrent: 'lion-final-refuge',
    expectedDestination: 'lion-final-judgement',
    expectedHeading: 'Refuge avant le Sceau',
    expectedRoute: 'Jugement du Sceau',
  },
  {
    kind: 'tableau',
    surface: 'tableau',
    slug: '1-actor',
    context: 'dialogue:lion_finale_judgement',
    tableauCase: '1-actor',
    expectedDialogue: 'lion_finale_judgement',
    expectedCastCount: 1,
  },
  {
    kind: 'tableau',
    surface: 'tableau',
    slug: '2-actors-lion-court',
    context: 'dialogue:ate_alaric_reports',
    tableauCase: '2-actors',
    expectedDialogue: 'ate_alaric_reports',
    expectedCastCount: 2,
  },
  {
    kind: 'tableau',
    surface: 'tableau',
    slug: '3-actors-player-company',
    context: 'dialogue:post_opening_trail',
    tableauCase: '3-actors',
    expectedDialogue: 'post_opening_trail',
    expectedCastCount: 3,
  },
  {
    kind: 'tableau',
    surface: 'tableau',
    slug: '4-actors-court-geography',
    context: 'dialogue:lion_briefing',
    tableauCase: '4-actors',
    expectedDialogue: 'lion_briefing',
    expectedCastCount: 4,
  },
  { kind: 'combat-grounding', surface: 'combat-stage', slug: 'forest-route', context: 'combat:forest_ambush' },
  { kind: 'combat-grounding', surface: 'combat-stage', slug: 'bois-clair-burning', context: 'combat:village_defense' },
  { kind: 'combat-grounding', surface: 'combat-stage', slug: 'lion-sanctum', context: 'combat:lion_chief' },
];

function expectedAsset(capture) {
  const role = capture.surface === 'travel'
    ? 'TRAVEL'
    : capture.surface === 'tableau'
      ? 'STATIC_TABLEAU'
      : 'COMBAT_STAGE';
  const mapping = beatMap.mappings[capture.context];
  const plate = mapping?.plates?.find((candidate) => candidate.surfaceRole === role);
  if (!mapping || !plate) throw new Error(`Missing ${role} mapping for ${capture.context}`);
  return { assetId: plate.assetId, visualFamily: mapping.visualFamily };
}

function runtimeUrl(capture) {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'forest-road');
  url.searchParams.set('surface', capture.surface);
  url.searchParams.set('context', capture.context);
  url.searchParams.set('character', 'kestrel');
  url.searchParams.set('animation', 'idle');
  url.searchParams.set('tableauState', 'active');
  if (capture.tableauCase) url.searchParams.set('tableauCase', capture.tableauCase);
  return url.toString();
}

async function copyBeforeCaptures() {
  for (const viewport of viewports) {
    const destination = path.join(closeoutRoot, 'combat-grounding', 'before', viewport.label);
    await mkdir(destination, { recursive: true });
    for (const slug of ['forest-route', 'bois-clair-burning', 'lion-sanctum']) {
      const source = path.join(runtimeReviewRoot, 'screenshots', viewport.label, `combat-stage_${slug}.png`);
      await copyFile(source, path.join(destination, `combat-stage_${slug}.png`));
    }
  }
}

await copyBeforeCaptures();

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of viewports) {
    const browserContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await browserContext.newPage();
    let activeLog = null;
    page.on('requestfailed', (request) => {
      if (activeLog && request.url().includes(packUrlMarker)) {
        activeLog.failedRequests.push(`${request.failure()?.errorText ?? 'FAILED'} ${request.url()}`);
      }
    });
    page.on('response', (response) => {
      if (activeLog && response.url().includes(packUrlMarker) && response.status() >= 400) {
        activeLog.failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on('console', (message) => {
      if (activeLog && message.type() === 'error') activeLog.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => {
      if (activeLog) activeLog.consoleErrors.push(error.message);
    });

    for (const capture of captures) {
      const mapping = expectedAsset(capture);
      activeLog = {
        viewport: viewport.label,
        kind: capture.kind,
        surface: capture.surface,
        slug: capture.slug,
        context: capture.context,
        expectedAssetId: mapping.assetId,
        expectedVisualFamily: mapping.visualFamily,
        failedRequests: [],
        consoleErrors: [],
      };
      await page.goto(runtimeUrl(capture), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForFunction(
        ({ contextId, assetId }) => document.body.dataset.optionCProofReady === 'true'
          && document.body.dataset.optionCEnvironmentReady === 'true'
          && document.body.dataset.optionCEnvironmentContext === contextId
          && document.body.dataset.optionCEnvironmentAsset === assetId,
        { contextId: capture.context, assetId: mapping.assetId },
        { timeout: capture.surface === 'combat-stage' ? 30_000 : 20_000 },
      );
      if (capture.kind === 'tableau') {
        await page.waitForFunction(
          ({ proofCase, castCount }) => document.body.dataset.optionCTableauProofCase === proofCase
            && document.body.dataset.optionCTableauCastCount === String(castCount)
            && document.querySelectorAll('.narrative-cast__actor').length === castCount,
          { proofCase: capture.tableauCase, castCount: capture.expectedCastCount },
        );
      }
      await page.addStyleTag({ content: '.option-c-phase4b__controls{display:none!important}' });
      await page.waitForTimeout(capture.surface === 'combat-stage' ? 350 : 180);

      const runtimeState = await page.evaluate(() => ({ ...document.body.dataset }));
      const details = capture.kind === 'travel'
        ? await page.evaluate(() => ({
            currentNode: document.body.dataset.optionCTravelCurrentNode,
            destinations: (document.body.dataset.optionCTravelDestinations ?? '').split(',').filter(Boolean),
            heading: document.querySelector('.travel-view__heading strong')?.textContent?.trim(),
            routes: Array.from(document.querySelectorAll('.route-choice__title')).map((element) => element.textContent?.trim()),
          }))
        : capture.kind === 'tableau'
          ? await page.evaluate(() => ({
              dialogue: document.body.dataset.optionCTableauDialogue,
              castCount: Number(document.body.dataset.optionCTableauCastCount),
              dialogueCard: document.querySelector('.dialogue__box')?.getBoundingClientRect().toJSON(),
              actors: Array.from(document.querySelectorAll('.narrative-cast__actor')).map((element) => ({
                actorId: element.dataset.actorId,
                screenPosition: element.dataset.screenPosition,
                group: element.dataset.actorGroup,
                dramaticSide: element.dataset.dramaticSide,
                state: element.classList.contains('is-speaking') ? 'SPEAKING' : element.classList.contains('is-listening') ? 'LISTENING' : 'BACKGROUND',
              })),
            }))
          : await (async () => {
              const combatFrame = page.frames().find((frame) => frame.url().includes('/legacy-combat.html'));
              if (!combatFrame) throw new Error('Combat proof iframe was not found.');
              return combatFrame.evaluate(() => ({
                fit: JSON.parse(document.body.dataset.optionCCombatStageFit ?? 'null'),
                grounding: JSON.parse(document.body.dataset.optionCCombatStageGrounding ?? 'null'),
              }));
            })();

      const outputDirectory = capture.kind === 'combat-grounding'
        ? path.join(closeoutRoot, 'combat-grounding', 'after', viewport.label)
        : path.join(closeoutRoot, capture.kind, viewport.label);
      await mkdir(outputDirectory, { recursive: true });
      const outputPath = path.join(outputDirectory, `${capture.kind}_${capture.slug}.png`);
      await page.screenshot({ path: outputPath, animations: 'disabled' });

      const assertions = {
        selectedAsset: runtimeState.optionCEnvironmentAsset === mapping.assetId,
        selectedFamily: runtimeState.optionCEnvironmentFamily === mapping.visualFamily,
        context: runtimeState.optionCEnvironmentContext === capture.context,
        travelCurrent: capture.kind !== 'travel' || details.currentNode === capture.expectedCurrent,
        travelDestination: capture.kind !== 'travel' || details.destinations.includes(capture.expectedDestination),
        travelHeading: capture.kind !== 'travel' || details.heading === capture.expectedHeading,
        travelRoute: capture.kind !== 'travel' || details.routes.includes(capture.expectedRoute),
        tableauDialogue: capture.kind !== 'tableau' || details.dialogue === capture.expectedDialogue,
        tableauCastCount: capture.kind !== 'tableau' || details.castCount === capture.expectedCastCount,
        groundingMetadata: capture.kind !== 'combat-grounding' || Boolean(details.fit && details.grounding),
      };
      results.push({
        ...activeLog,
        screenshot: path.relative(projectRoot, outputPath).replaceAll('\\', '/'),
        selectedAssetId: runtimeState.optionCEnvironmentAsset,
        selectedVisualFamily: runtimeState.optionCEnvironmentFamily,
        details,
        assertions,
        pass: Object.values(assertions).every(Boolean)
          && activeLog.failedRequests.length === 0
          && activeLog.consoleErrors.length === 0,
      });
      activeLog = null;
    }
    await browserContext.close();
  }
} finally {
  await browser.close();
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  packId: 'demo-environment-pack-v1',
  harnessFinding: 'HARNESS_ONLY_FIXED_STATE',
  summary: {
    screenshots: results.length,
    travelProofs: results.filter((result) => result.kind === 'travel' && result.pass).length,
    tableauProofs: results.filter((result) => result.kind === 'tableau' && result.pass).length,
    combatGroundingProofs: results.filter((result) => result.kind === 'combat-grounding' && result.pass).length,
    failedRequests: results.flatMap((result) => result.failedRequests).length,
    consoleErrors: results.flatMap((result) => result.consoleErrors).length,
    failures: results.filter((result) => !result.pass).length,
  },
  captures: results,
};
await mkdir(closeoutRoot, { recursive: true });
await writeFile(path.join(closeoutRoot, 'final-closeout-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const expectedScreenshots = captures.length * viewports.length;
if (
  report.summary.screenshots !== expectedScreenshots
  || report.summary.travelProofs !== 8
  || report.summary.tableauProofs !== 8
  || report.summary.combatGroundingProofs !== 6
  || report.summary.failedRequests !== 0
  || report.summary.consoleErrors !== 0
  || report.summary.failures !== 0
) {
  console.error(JSON.stringify(report.summary, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report.summary, null, 2));
}
