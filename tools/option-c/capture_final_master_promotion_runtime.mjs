import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const projectRoot = process.cwd();
const qaRoot = path.join(
  projectRoot,
  'public',
  'assets',
  'dev',
  'option-c',
  'non-combat-masters-v1',
  'qa',
  'runtime-proof',
);
const reportPath = path.join(qaRoot, 'final-master-promotion-runtime-report.json');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const manifest = JSON.parse(await readFile(
  path.join(projectRoot, 'public/assets/characters/pixel/character-system-v2-manifest.json'),
  'utf8',
));
const manifestById = new Map(manifest.units.map((unit) => [unit.unitId, unit]));
const actors = [
  { characterId: 'alaric', proofRole: 'KEY_STORY' },
  { characterId: 'maelor', proofRole: 'KEY_STORY' },
  { characterId: 'sage_seraphine', proofRole: 'SERAPHINE_CANONICAL' },
  { characterId: 'villageoise', proofRole: 'ACTIVE_CIVILIAN' },
  { characterId: 'alistair', proofRole: 'EXISTING_COMBAT_HERO_MASTER_OUTSIDE_COMBAT' },
  { characterId: 'wounded_merchant', proofRole: 'LEGACY_NPC_MIGRATED_TO_MASTER' },
].map((actor) => ({
  ...actor,
  src: manifestById.get(actor.characterId)?.master?.src,
}));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const characterResponses = [];
const characterRequestFailures = [];
const consoleErrors = [];
const pageErrors = [];

function observe(page) {
  page.on('response', (response) => {
    if (response.url().includes('/assets/characters/pixel/')) {
      characterResponses.push({ url: response.url(), status: response.status() });
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('/assets/characters/pixel/')) {
      characterRequestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
}

let assetProof;
let tableauProof;
let strategicProof;
let combatStageProof;
try {
  const tableauPage = await context.newPage();
  observe(tableauPage);
  const tableauUrl = new URL(baseUrl);
  tableauUrl.searchParams.set('devOptionC', 'forest-road');
  tableauUrl.searchParams.set('surface', 'tableau');
  tableauUrl.searchParams.set('context', 'dialogue:ate_alaric_reports');
  tableauUrl.searchParams.set('character', 'kestrel');
  tableauUrl.searchParams.set('animation', 'idle');
  tableauUrl.searchParams.set('tableauState', 'active');
  tableauUrl.searchParams.set('tableauCase', '2-actors');
  await tableauPage.goto(tableauUrl.href, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await tableauPage.waitForFunction(() => (
    document.body.dataset.optionCProofReady === 'true'
    && document.body.dataset.optionCTableauProofCase === '2-actors'
    && document.querySelectorAll('.narrative-cast__actor').length === 2
    && Boolean(document.querySelector('.dialogue__box'))
  ), undefined, { timeout: 60_000 });

  assetProof = await tableauPage.evaluate(async (requestedActors) => Promise.all(requestedActors.map(async (actor) => {
    const image = new Image();
    image.src = actor.src;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const drawing = canvas.getContext('2d', { willReadFrequently: true });
    drawing.drawImage(image, 0, 0);
    const pixels = drawing.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let top = canvas.height;
    let right = 0;
    let bottom = 0;
    let visiblePixels = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[((y * canvas.width) + x) * 4 + 3] <= 12) continue;
        visiblePixels += 1;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
    }
    return {
      ...actor,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      visiblePixels,
      alphaBounds: { left, top, right, bottom },
    };
  })), actors);

  tableauProof = await tableauPage.evaluate(() => ({
    status: document.body.dataset.optionCProofReady === 'true' ? 'PASS' : 'FAIL',
    dialogueId: document.body.dataset.optionCTableauDialogue,
    castCount: document.querySelectorAll('.narrative-cast__actor').length,
    actorIds: Array.from(document.querySelectorAll('.narrative-cast__actor')).map((element) => element.dataset.actorId),
    dialogueVisible: Boolean(document.querySelector('.dialogue__box')),
  }));
  await mkdir(qaRoot, { recursive: true });
  await tableauPage.screenshot({
    path: path.join(qaRoot, 'dialogue-static-tableau.png'),
    animations: 'disabled',
  });
  await tableauPage.close();

  const strategicPage = await context.newPage();
  observe(strategicPage);
  const strategicUrl = new URL('/legacy-combat.html', baseUrl);
  strategicUrl.searchParams.set('charv2qa', '1');
  await strategicPage.goto(strategicUrl.href, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await strategicPage.waitForFunction(() => (
    document.body.dataset.characterSystemV2StrategicReady === 'true'
    && Boolean(window.__CHARACTER_SYSTEM_V2_STRATEGIC_PROOF__)
  ), undefined, { timeout: 60_000 });
  strategicProof = await strategicPage.evaluate(() => window.__CHARACTER_SYSTEM_V2_STRATEGIC_PROOF__);
  await strategicPage.close();

  const combatPage = await context.newPage();
  observe(combatPage);
  const combatUrl = new URL(baseUrl);
  combatUrl.searchParams.set('devOptionC', 'combat-poses-v2-runtime');
  combatUrl.searchParams.set('scenario', 'all-three');
  combatUrl.searchParams.set('environment', 'bois_clair_burning_stage');
  await combatPage.goto(combatUrl.href, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await combatPage.waitForFunction(() => (
    document.body.dataset.optionCCombatPosesV2Ready === 'true'
    && document.body.dataset.optionCCombatPosesV2Scenario === 'all-three'
    && Boolean(window.__OPTION_C_COMBAT_POSES_V2_PROOF__)
  ), undefined, { timeout: 60_000 });
  combatStageProof = await combatPage.evaluate(() => window.__OPTION_C_COMBAT_POSES_V2_PROOF__);
  await combatPage.screenshot({
    path: path.join(qaRoot, 'combat-stage-v2.png'),
    animations: 'disabled',
  });
  await combatPage.close();
} finally {
  await context.close();
  await browser.close();
}

const assetResults = assetProof.map((asset) => {
  const unit = manifestById.get(asset.characterId);
  const boundsMatch = unit.alphaBounds
    ? JSON.stringify(asset.alphaBounds) === JSON.stringify(unit.alphaBounds)
      && unit.baseline === asset.alphaBounds.bottom
    : true;
  const httpStatuses = characterResponses
    .filter((response) => new URL(response.url).pathname === asset.src)
    .map((response) => response.status);
  return {
    ...asset,
    expectedAlphaBounds: unit.alphaBounds ?? null,
    expectedBaseline: unit.baseline ?? null,
    checks: {
      HTTP_200: httpStatuses.includes(200) ? 'PASS' : 'FAIL',
      NON_BLANK: asset.visiblePixels > 0 ? 'PASS' : 'FAIL',
      CANVAS_512: asset.naturalWidth === 512 && asset.naturalHeight === 512 ? 'PASS' : 'FAIL',
      ALPHA_BOUNDS_AND_BASELINE: boundsMatch ? 'PASS' : 'FAIL',
      MASTER_AUTHORITY: asset.src === `/assets/characters/pixel/masters/${asset.characterId}.png` ? 'PASS' : 'FAIL',
    },
  };
});
const allAssetChecksPass = assetResults.every((asset) => Object.values(asset.checks).every((value) => value === 'PASS'));
const strategicUsesPrepare = strategicProof.status === 'PASS'
  && strategicProof.units.every((unit) => (
    unit.src === `/assets/characters/pixel/combat/${unit.unitId}/prepare.png`
    && unit.usesFullPortraitAsMapSprite === false
  ));
const combatStageUsesV2 = combatStageProof.status === 'PASS'
  && combatStageProof.canonicalAssetsPromoted === true
  && combatStageProof.checks.assetManifestLock === 'PASS'
  && combatStageProof.units.length === 3
  && characterResponses.some((response) => (
    new URL(response.url).pathname.includes('/assets/characters/pixel/combat/')
    && response.status === 200
  ));
const checks = {
  SIX_REQUIRED_ACTOR_ROLES: assetResults.length === 6 ? 'PASS' : 'FAIL',
  MASTER_ASSETS_HTTP_200: allAssetChecksPass ? 'PASS' : 'FAIL',
  NO_TRANSPARENT_OR_BLANK_ACTOR: assetResults.every((asset) => asset.visiblePixels > 0) ? 'PASS' : 'FAIL',
  SCALE_FRAMING_METADATA: assetResults.every((asset) => asset.checks.ALPHA_BOUNDS_AND_BASELINE === 'PASS') ? 'PASS' : 'FAIL',
  DIALOGUE_STATIC_TABLEAU: tableauProof.status === 'PASS' && tableauProof.castCount === 2 && tableauProof.dialogueVisible ? 'PASS' : 'FAIL',
  STRATEGIC_PREPARE: strategicUsesPrepare ? 'PASS' : 'FAIL',
  COMBAT_STAGE_V2: combatStageUsesV2 ? 'PASS' : 'FAIL',
  CHARACTER_404S: characterRequestFailures.length === 0
    && characterResponses.every((response) => response.status < 400) ? 'PASS' : 'FAIL',
  PAGE_ERRORS: pageErrors.length === 0 ? 'PASS' : 'FAIL',
};
const status = Object.values(checks).every((value) => value === 'PASS') ? 'PASS' : 'FAIL';
const report = {
  schemaVersion: 1,
  mission: 'Option C final master promotion runtime proof',
  generatedAt: new Date().toISOString(),
  status,
  checks,
  assets: assetResults,
  tableau: tableauProof,
  strategic: strategicProof,
  combatStage: combatStageProof,
  characterResponses,
  characterRequestFailures,
  consoleErrors,
  pageErrors,
  screenshots: [
    'public/assets/dev/option-c/non-combat-masters-v1/qa/runtime-proof/dialogue-static-tableau.png',
    'public/assets/dev/option-c/non-combat-masters-v1/qa/runtime-proof/combat-stage-v2.png',
  ],
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status,
  checks,
  actors: assetResults.map((asset) => `${asset.characterId}:${asset.proofRole}`),
  report: path.relative(projectRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (status !== 'PASS') process.exitCode = 1;
