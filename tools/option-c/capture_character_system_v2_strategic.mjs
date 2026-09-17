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
  'full-roster-rebuild',
  'qa',
  'production-runtime-proof',
);
const screenshotRoot = path.join(qaRoot, 'strategic-screenshots');
const reportPath = path.join(qaRoot, 'strategic-runtime-report.json');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const viewports = [
  { label: '1366x768', width: 1366, height: 768 },
  { label: '1920x1080', width: 1920, height: 1080 },
];

const url = new URL('/legacy-combat.html', baseUrl);
url.searchParams.set('charv2qa', '1');

const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const evidence = { consoleErrors: [], pageErrors: [], failedRequests: [], productionAssetResponses: [] };
    page.on('console', (message) => {
      if (message.type() === 'error') evidence.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
    page.on('requestfailed', (request) => evidence.failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? 'unknown',
    }));
    page.on('response', (response) => {
      if (response.url().includes('/assets/characters/pixel/combat/')) {
        evidence.productionAssetResponses.push({ url: response.url(), status: response.status() });
      }
    });

    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForFunction(() => document.body.dataset.characterSystemV2StrategicReady === 'true'
      && Boolean(window.__CHARACTER_SYSTEM_V2_STRATEGIC_PROOF__), undefined, { timeout: 60_000 });
    await page.waitForTimeout(250);
    const runtime = await page.evaluate(() => window.__CHARACTER_SYSTEM_V2_STRATEGIC_PROOF__);
    const outputDirectory = path.join(screenshotRoot, viewport.label);
    await mkdir(outputDirectory, { recursive: true });
    const outputPath = path.join(outputDirectory, 'hero-small-boss.png');
    await page.screenshot({ path: outputPath, type: 'png', animations: 'disabled' });
    captures.push({
      viewport,
      screenshot: path.relative(projectRoot, outputPath).replaceAll('\\', '/'),
      runtime,
      ...evidence,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

const errors = captures.flatMap((capture) => [
  ...capture.consoleErrors,
  ...capture.pageErrors,
  ...capture.failedRequests.map((failure) => `${failure.url}: ${failure.error}`),
]);
const expectedIds = ['alistair', 'goblin', 'lion_champion'];
const hierarchyPass = captures.every((capture) => {
  const units = new Map(capture.runtime.units.map((unit) => [unit.unitId, unit]));
  return units.get('goblin').visibleWorldHeight < units.get('alistair').visibleWorldHeight
    && units.get('alistair').visibleWorldHeight < units.get('lion_champion').visibleWorldHeight;
});
const productionSourcesPass = captures.every((capture) => (
  expectedIds.every((unitId) => capture.runtime.units.some((unit) => (
    unit.unitId === unitId
    && unit.src === `/assets/characters/pixel/combat/${unitId}/prepare.png`
    && unit.usesFullPortraitAsMapSprite === false
  )))
  && capture.productionAssetResponses.length >= expectedIds.length
  && capture.productionAssetResponses.every((response) => response.status === 200)
));
const sharedScalePass = captures.every((capture) => (
  new Set(capture.runtime.units.map((unit) => unit.worldUnitsPerPixel)).size === 1
  && capture.runtime.units.every((unit) => unit.worldUnitsPerPixel === 0.00625 && unit.spriteScaleY === 1)
));
const groundingPass = captures.every((capture) => capture.runtime.units.every((unit) => unit.baselineError <= 0.000001));
const status = captures.length === 2
  && captures.every((capture) => capture.runtime.status === 'PASS')
  && errors.length === 0
  && hierarchyPass
  && productionSourcesPass
  && sharedScalePass
  && groundingPass ? 'PASS' : 'FAIL';

const report = {
  schemaVersion: 1,
  mission: 'Character System V2 — Strategic Combat Runtime Proof',
  generatedAt: new Date().toISOString(),
  status,
  requiredViewports: viewports.map((viewport) => viewport.label),
  checks: {
    HERO_SMALL_BOSS_COVERAGE: captures.every((capture) => capture.runtime.units.length === 3) ? 'PASS' : 'FAIL',
    PREPARE_POSE_SOURCE: productionSourcesPass ? 'PASS' : 'FAIL',
    RELATIVE_SCALE_HIERARCHY: hierarchyPass ? 'PASS' : 'FAIL',
    SHARED_PHYSICAL_SCALE: sharedScalePass ? 'PASS' : 'FAIL',
    GROUNDING: groundingPass ? 'PASS' : 'FAIL',
    FULL_PORTRAIT_MAP_USAGE: productionSourcesPass ? 'NO' : 'YES',
  },
  errorCount: errors.length,
  captures,
};
await mkdir(qaRoot, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status: report.status,
  checks: report.checks,
  screenshots: captures.length,
  errorCount: report.errorCount,
  report: path.relative(projectRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (status !== 'PASS') process.exitCode = 1;
