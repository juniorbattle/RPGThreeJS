import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const proofRoot = process.env.FINAL_CHARACTER_QA_ROOT
  ? path.resolve(projectRoot, process.env.FINAL_CHARACTER_QA_ROOT)
  : path.join(projectRoot, 'public', 'assets', 'dev', 'option-c', 'village-militia-poses-v1', 'runtime-proof');
const screenshotRoot = path.join(proofRoot, 'screenshots');
const reportPath = path.join(proofRoot, 'runtime-proof-report.json');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const viewport = { width: 1366, height: 768 };
const poses = ['prepare', 'dash', 'attack', 'cast'];
const scenarios = poses.map((pose) => ({
  id: `militia-pair-${pose}`,
  pose,
  expectedUnits: [`militia-spearman-${pose}`, `militia-slinger-${pose}`],
}));

function runtimeUrl(scenario) {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'combat-poses-v2-runtime');
  url.searchParams.set('scenario', scenario.id);
  url.searchParams.set('environment', 'forest_route_stage');
  return url.href;
}

await mkdir(screenshotRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  for (const scenario of scenarios) {
    const page = await context.newPage();
    const evidence = { consoleErrors: [], pageErrors: [], failedRequests: [], assetResponses: [] };
    page.on('console', (message) => {
      if (message.type() === 'error') evidence.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
    page.on('requestfailed', (request) => evidence.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'unknown',
    }));
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/assets/characters/pixel/combat/village_militia_') || url.includes('/demo-environment-pack-v1/combat-stage/')) {
        evidence.assetResponses.push({ url, status: response.status() });
      }
    });

    await page.goto(runtimeUrl(scenario), { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForFunction(
      (scenarioId) => document.body.dataset.optionCCombatPosesV2Ready === 'true'
        && document.body.dataset.optionCCombatPosesV2Scenario === scenarioId
        && !document.body.dataset.optionCCombatPosesV2Failure
        && Boolean(window.__OPTION_C_COMBAT_POSES_V2_PROOF__),
      scenario.id,
      { timeout: 60_000 },
    );
    const runtime = await page.evaluate(() => window.__OPTION_C_COMBAT_POSES_V2_PROOF__);
    const screenshot = path.join(screenshotRoot, `${scenario.id}__1366x768.png`);
    await page.screenshot({ path: screenshot, type: 'png' });
    captures.push({
      scenario: scenario.id,
      pose: scenario.pose,
      expectedUnits: scenario.expectedUnits,
      screenshot: path.relative(projectRoot, screenshot).replaceAll('\\', '/'),
      runtime,
      evidence,
    });
    await page.close();
  }
  await context.close();
} finally {
  await browser.close();
}

const allErrors = captures.flatMap((capture) => [
  ...capture.evidence.consoleErrors,
  ...capture.evidence.pageErrors,
  ...capture.evidence.failedRequests.map((failure) => `${failure.url}: ${failure.error}`),
]);
const failedAssets = captures.flatMap((capture) => capture.evidence.assetResponses.filter((response) => response.status >= 400));
const coverage = captures.length === 4
  && poses.every((pose) => captures.some((capture) => capture.pose === pose))
  && captures.every((capture) => {
    const ids = capture.runtime?.units?.map((unit) => unit.id) ?? [];
    return capture.expectedUnits.every((id) => ids.includes(id));
  });
const runtimePass = captures.every((capture) => (
  capture.runtime?.status === 'PASS'
  && capture.runtime.devOnly === true
  && capture.runtime.canonicalAssetsPromoted === true
  && capture.runtime.gameplayChanged === false
  && capture.runtime.combatLogicChanged === false
  && capture.runtime.vfxChanged === false
  && capture.runtime.environmentChanged === false
  && capture.runtime.units.length === 2
  && capture.runtime.units.every((unit) => Object.values(unit.checks).every((value) => value === 'PASS'))
));
const status = coverage && runtimePass && allErrors.length === 0 && failedAssets.length === 0 ? 'PASS' : 'FAIL';
const report = {
  schemaVersion: 1,
  mission: 'Village Militia Combat Poses V1 DEV Combat Stage proof',
  status,
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewport,
  environment: 'forest_route_stage',
  poseCoverage: poses,
  screenshotCount: captures.length,
  checks: {
    runtimeCoverage: coverage ? 'PASS' : 'FAIL',
    combatStageRuntime: runtimePass ? 'PASS' : 'FAIL',
    productionAssetsPromoted: captures.every((capture) => capture.runtime?.canonicalAssetsPromoted === true) ? 'PASS' : 'FAIL',
    consoleAndPageErrors: allErrors.length === 0 ? 'PASS' : 'FAIL',
    assetResponses: failedAssets.length === 0 ? 'PASS' : 'FAIL',
    gameplayChanged: 'NO',
    combatLogicChanged: 'NO',
    vfxChanged: 'NO',
    environmentChanged: 'NO',
  },
  errors: allErrors,
  failedAssets,
  captures,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status,
  screenshotCount: captures.length,
  checks: report.checks,
  report: path.relative(projectRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (status !== 'PASS') process.exitCode = 1;
