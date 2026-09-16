import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const qaRoot = path.join(
  projectRoot,
  'public',
  'assets',
  'dev',
  'option-c',
  'combat-poses-v2',
  'qa',
  'runtime-scale-proof',
);
const screenshotRoot = path.join(qaRoot, 'screenshots');
const reportPath = path.join(qaRoot, 'runtime-scale-report.json');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const pilotAssetMarker = '/assets/dev/option-c/combat-poses-v2/';
const stageAssetMarker = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/combat-stage/';

const viewports = [
  { label: '1366x768', width: 1366, height: 768 },
  { label: '1920x1080', width: 1920, height: 1080 },
];

const compositions = [
  {
    scenario: 'alistair-vs-goblin',
    environment: 'forest_route_stage',
    proof: 'ALISTAIR_VS_GOBLIN',
  },
  {
    scenario: 'alistair-vs-lion-champion',
    environment: 'lion_sanctum_stage',
    proof: 'ALISTAIR_VS_LION_CHAMPION',
  },
  {
    scenario: 'all-three',
    environment: 'bois_clair_burning_stage',
    proof: 'ALL_THREE_COMPARISON_BOARD',
  },
];

function runtimeUrl(composition) {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'combat-poses-v2-runtime');
  url.searchParams.set('scenario', composition.scenario);
  url.searchParams.set('environment', composition.environment);
  return url.href;
}

function allPass(values) {
  return values.every((value) => value === 'PASS');
}

const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    for (const composition of compositions) {
      const page = await context.newPage();
      const evidence = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        assetResponses: [],
      };
      page.on('console', (message) => {
        if (message.type() === 'error') evidence.consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
      page.on('requestfailed', (request) => evidence.failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText ?? 'unknown',
      }));
      page.on('response', (response) => {
        if (response.url().includes(pilotAssetMarker) || response.url().includes(stageAssetMarker)) {
          evidence.assetResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await page.goto(runtimeUrl(composition), { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForFunction(
        ({ scenario, environment }) => document.body.dataset.optionCCombatPosesV2Ready === 'true'
          && document.body.dataset.optionCCombatPosesV2Scenario === scenario
          && document.body.dataset.optionCCombatPosesV2Environment === environment
          && !document.body.dataset.optionCCombatPosesV2Failure
          && Boolean(window.__OPTION_C_COMBAT_POSES_V2_PROOF__),
        { scenario: composition.scenario, environment: composition.environment },
        { timeout: 60_000 },
      );
      await page.waitForTimeout(250);
      const runtime = await page.evaluate(() => window.__OPTION_C_COMBAT_POSES_V2_PROOF__);
      const bodyDataset = await page.evaluate(() => ({ ...document.body.dataset }));
      const outputDirectory = path.join(screenshotRoot, viewport.label);
      await mkdir(outputDirectory, { recursive: true });
      const outputPath = path.join(outputDirectory, `${composition.scenario}__${composition.environment}.png`);
      await page.screenshot({ path: outputPath, type: 'png', animations: 'disabled' });
      captures.push({
        viewport,
        ...composition,
        screenshot: path.relative(projectRoot, outputPath).replaceAll('\\', '/'),
        runtime,
        bodyDataset,
        ...evidence,
      });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const allErrors = captures.flatMap((capture) => [
  ...capture.consoleErrors,
  ...capture.pageErrors,
  ...capture.failedRequests.map((failure) => `${failure.url}: ${failure.error}`),
]);
const failedAssetResponses = captures
  .flatMap((capture) => capture.assetResponses)
  .filter((response) => response.status !== 200);
const unitResults = Object.fromEntries(['alistair', 'goblin', 'lion-champion'].map((unitId) => {
  const appearances = captures.flatMap((capture) => capture.runtime.units.filter((unit) => unit.id === unitId));
  const pass = appearances.length >= 4 && appearances.every((unit) => (
    unit.scaleCorrection === 1
    && Math.abs(unit.measuredVisibleWorldHeight - unit.targetWorldHeight) <= 0.000001
    && allPass(Object.values(unit.checks))
  ));
  return [unitId, { status: pass ? 'PASS' : 'FAIL', appearances: appearances.length }];
}));
const allThreeCaptures = captures.filter((capture) => capture.scenario === 'all-three');
const globalChecks = {
  ALISTAIR_RUNTIME_SCALE: unitResults.alistair.status,
  GOBLIN_RUNTIME_SCALE: unitResults.goblin.status,
  LION_CHAMPION_RUNTIME_SCALE: unitResults['lion-champion'].status,
  RELATIVE_SIZE_HIERARCHY: allThreeCaptures.length === 2
    && allThreeCaptures.every((capture) => capture.runtime.checks.relativeSizeHierarchy === 'PASS') ? 'PASS' : 'FAIL',
  GROUNDING: captures.every((capture) => capture.runtime.checks.grounding === 'PASS') ? 'PASS' : 'FAIL',
  PIXEL_DENSITY_COHERENCE: captures.every((capture) => capture.runtime.checks.pixelDensityCoherence === 'PASS') ? 'PASS' : 'FAIL',
  COMBAT_STAGE_READABILITY: captures.every((capture) => (
    capture.runtime.checks.silhouetteReadability === 'PASS'
    && capture.runtime.checks.weaponReadability === 'PASS'
    && capture.runtime.checks.backgroundContrast === 'PASS'
    && capture.runtime.checks.vfxSafeSpace === 'PASS'
  )) ? 'PASS' : 'FAIL',
};
const proofCoverage = captures.length === viewports.length * compositions.length
  && viewports.every((viewport) => captures.filter((capture) => capture.viewport.label === viewport.label).length === compositions.length)
  && compositions.every((composition) => captures.some((capture) => capture.environment === composition.environment));
const protections = {
  CANONICAL_ASSETS_CHANGED: 'NO',
  GAMEPLAY_CHANGED: 'NO',
  COMBAT_LOGIC_CHANGED: 'NO',
  VFX_CHANGED: 'NO',
  ENVIRONMENT_CHANGED: 'NO',
  COMMIT: 'NO',
  PUSH: 'NO',
};
const pilotGatePass = proofCoverage
  && allErrors.length === 0
  && failedAssetResponses.length === 0
  && allPass(Object.values(globalChecks))
  && captures.every((capture) => (
    capture.runtime.status === 'PASS'
    && capture.runtime.devOnly === true
    && capture.runtime.canonicalAssetsPromoted === false
    && capture.runtime.gameplayChanged === false
    && capture.runtime.combatLogicChanged === false
    && capture.runtime.vfxChanged === false
    && capture.runtime.environmentChanged === false
  ));
const report = {
  schemaVersion: 1,
  mission: 'Option C Combat Poses V2 — Pilot Runtime Scale Proof',
  generatedAt: new Date().toISOString(),
  baseUrl,
  status: pilotGatePass ? 'PASS' : 'FAIL',
  requiredViewports: viewports.map((viewport) => viewport.label),
  requiredEnvironments: compositions.map((composition) => composition.environment),
  proofCoverage: proofCoverage ? 'PASS' : 'FAIL',
  errorCount: allErrors.length,
  failedAssetResponseCount: failedAssetResponses.length,
  checks: {
    ...globalChecks,
    PILOT_RUNTIME_GATE: pilotGatePass ? 'PASS' : 'FAIL',
    AUTHORIZED_FOR_FULL_ROSTER_PRODUCTION: pilotGatePass ? 'YES' : 'NO',
  },
  protections,
  unitResults,
  captures,
};
await mkdir(qaRoot, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status: report.status,
  proofCoverage: report.proofCoverage,
  checks: report.checks,
  screenshots: captures.length,
  errorCount: report.errorCount,
  failedAssetResponseCount: report.failedAssetResponseCount,
  report: path.relative(projectRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
