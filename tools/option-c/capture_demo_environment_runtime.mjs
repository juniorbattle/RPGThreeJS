import { mkdir, writeFile } from 'node:fs/promises';
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
const reviewRoot = path.join(packRoot, 'runtime-review');
const baseUrl = process.env.OPTION_C_BASE_URL ?? 'http://127.0.0.1:5173/';
const packUrlMarker = '/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1/';

const viewports = [
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1366x768', width: 1366, height: 768 },
];

const captures = [
  { surface: 'travel', slug: 'forest-road', context: 'edge:lion-audience>lion-opening-ambush' },
  { surface: 'travel', slug: 'bois-clair', context: 'edge:lion-second-trial-event>lion-village-choice' },
  { surface: 'travel', slug: 'final-refuge', context: 'edge:lion-shadow-signs>lion-final-refuge' },

  { surface: 'tableau', slug: 'lion-camp', context: 'dialogue:acte_ouverture' },
  { surface: 'tableau', slug: 'alaric-audience', context: 'dialogue:lion_briefing' },
  { surface: 'tableau', slug: 'forest-road', context: 'dialogue:post_opening_trail' },
  { surface: 'tableau', slug: 'first-refuge', context: 'dialogue:forest_refuge' },
  { surface: 'tableau', slug: 'valmir-road', context: 'dialogue:reserve_trail' },
  { surface: 'tableau', slug: 'bois-clair-burning', context: 'dialogue:pre_village_defense' },
  { surface: 'tableau', slug: 'second-refuge', context: 'dialogue:rep_event_refuge_supply_offer' },
  { surface: 'tableau', slug: 'witness-road', context: 'dialogue:witnesses_on_road' },
  { surface: 'tableau', slug: 'shadow-ruins', context: 'dialogue:shadow_signs' },
  { surface: 'tableau', slug: 'lion-judgement', context: 'dialogue:ate_alaric_reports' },
  { surface: 'tableau', slug: 'serpent-finale', context: 'dialogue:ate_serpent_general_warning' },
  { surface: 'tableau', slug: 'lion-trial', context: 'dialogue:lion_trial_aftermath' },

  { surface: 'strategic', slug: 'forest-route', context: 'combat:forest_ambush' },
  { surface: 'strategic', slug: 'bois-clair-burning', context: 'combat:village_defense' },
  { surface: 'strategic', slug: 'lion-sanctum', context: 'combat:lion_chief' },

  { surface: 'combat-stage', slug: 'forest-route', context: 'combat:forest_ambush' },
  { surface: 'combat-stage', slug: 'bois-clair-burning', context: 'combat:village_defense' },
  { surface: 'combat-stage', slug: 'lion-sanctum', context: 'combat:lion_chief' },
];

function runtimeUrl(capture) {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'forest-road');
  url.searchParams.set('surface', capture.surface);
  url.searchParams.set('context', capture.context);
  url.searchParams.set('character', 'kestrel');
  url.searchParams.set('animation', 'idle');
  url.searchParams.set('tableauState', 'active');
  return url.toString();
}

function screenshotName(capture) {
  return `${capture.surface}_${capture.slug}.png`;
}

async function decodedDimensions(page, expectedUrl) {
  return page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  }, expectedUrl);
}

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
    let recordRuntimeRequests = true;

    page.on('request', (request) => {
      if (!activeLog || !recordRuntimeRequests || !request.url().includes(packUrlMarker) || !request.url().endsWith('.png')) return;
      activeLog.environmentRequests.push(request.url());
    });
    page.on('response', async (response) => {
      if (!activeLog || !recordRuntimeRequests || !response.url().includes(packUrlMarker) || !response.url().endsWith('.png')) return;
      const headers = await response.allHeaders();
      activeLog.environmentResponses.push({
        url: response.url(),
        status: response.status(),
        contentLength: Number(headers['content-length'] ?? 0),
      });
      if (!response.ok()) activeLog.failedEnvironmentRequests.push(`${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', (request) => {
      if (!activeLog || !recordRuntimeRequests || !request.url().includes(packUrlMarker) || !request.url().endsWith('.png')) return;
      activeLog.failedEnvironmentRequests.push(`${request.failure()?.errorText ?? 'FAILED'} ${request.url()}`);
    });
    page.on('console', (message) => {
      if (activeLog && message.type() === 'error') activeLog.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => {
      if (activeLog) activeLog.consoleErrors.push(error.message);
    });

    const outputDirectory = path.join(reviewRoot, 'screenshots', viewport.label);
    await mkdir(outputDirectory, { recursive: true });

    for (const capture of captures) {
      activeLog = {
        viewport: viewport.label,
        ...capture,
        environmentRequests: [],
        environmentResponses: [],
        failedEnvironmentRequests: [],
        consoleErrors: [],
      };
      recordRuntimeRequests = true;
      await page.goto(runtimeUrl(capture), { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForFunction(
        ({ contextId }) => document.body.dataset.optionCProofReady === 'true'
          && document.body.dataset.optionCEnvironmentReady === 'true'
          && document.body.dataset.optionCEnvironmentContext === contextId,
        { contextId: capture.context },
        { timeout: capture.surface === 'combat-stage' ? 30_000 : 20_000 },
      );
      const runtimeState = await page.evaluate(() => ({ ...document.body.dataset }));
      const expectedUrl = new URL(runtimeState.optionCEnvironmentUrl, baseUrl).toString();
      recordRuntimeRequests = false;
      const dimensions = await decodedDimensions(page, expectedUrl);
      await page.addStyleTag({ content: '.option-c-phase4b__controls{display:none!important}' });
      await page.waitForTimeout(capture.surface === 'combat-stage' ? 300 : 120);
      const outputPath = path.join(outputDirectory, screenshotName(capture));
      await page.screenshot({ path: outputPath, animations: 'disabled' });

      const requestCounts = new Map();
      for (const url of activeLog.environmentRequests) requestCounts.set(url, (requestCounts.get(url) ?? 0) + 1);
      const duplicateLoads = [...requestCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
      const unexpectedEnvironmentRequests = [...requestCounts.keys()].filter((url) => url !== expectedUrl);
      results.push({
        ...activeLog,
        screenshot: path.relative(projectRoot, outputPath).replaceAll('\\', '/'),
        selectedAssetId: runtimeState.optionCEnvironmentAsset,
        selectedVisualFamily: runtimeState.optionCEnvironmentFamily,
        selectedUrl: expectedUrl,
        decodedDimensions: dimensions,
        duplicateLoads,
        unexpectedEnvironmentRequests,
        runtimeMetrics: {
          totalContexts: Number(runtimeState.optionCEnvironmentTotalContexts),
          mappedContexts: Number(runtimeState.optionCEnvironmentMappedContexts),
          unmappedContexts: Number(runtimeState.optionCEnvironmentUnmappedContexts),
          fallbackContexts: Number(runtimeState.optionCEnvironmentFallbackContexts),
          manifestAssets: Number(runtimeState.optionCEnvironmentManifestAssets),
          visualFamilies: Number(runtimeState.optionCEnvironmentVisualFamilies),
          noGlobalPreload: runtimeState.optionCEnvironmentGlobalPreload === 'false',
          environmentFailures: Number(runtimeState.optionCEnvironmentFailures),
        },
      });
      activeLog = null;
    }
    await browserContext.close();
  }
} finally {
  await browser.close();
}

const allConsoleErrors = results.flatMap((result) => result.consoleErrors);
const allFailedRequests = results.flatMap((result) => result.failedEnvironmentRequests);
const totalDuplicateLoads = results.reduce((sum, result) => sum + result.duplicateLoads, 0);
const allUnexpectedRequests = results.flatMap((result) => result.unexpectedEnvironmentRequests);
const report = {
  schemaVersion: 1,
  packId: 'demo-environment-pack-v1',
  baseUrl,
  generatedAt: new Date().toISOString(),
  summary: {
    screenshots: results.length,
    viewport1920x1080: results.filter((result) => result.viewport === '1920x1080').length,
    viewport1366x768: results.filter((result) => result.viewport === '1366x768').length,
    visualFamiliesCaptured: [...new Set(results.map((result) => result.selectedVisualFamily))].sort(),
    selectedAssetsCaptured: [...new Set(results.map((result) => result.selectedAssetId))].sort(),
    failedEnvironmentRequests: allFailedRequests.length,
    consoleErrors: allConsoleErrors.length,
    duplicateEnvironmentLoads: totalDuplicateLoads,
    unexpectedEnvironmentRequests: allUnexpectedRequests.length,
    noGlobalOptionCPreload: results.every((result) => result.runtimeMetrics.noGlobalPreload),
    decodedDimensionsValid: results.every((result) => result.decodedDimensions.width > 0 && result.decodedDimensions.height > 0),
  },
  captures: results,
};

await mkdir(reviewRoot, { recursive: true });
await writeFile(path.join(reviewRoot, 'runtime-network-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (
  report.summary.screenshots !== captures.length * viewports.length
  || report.summary.visualFamiliesCaptured.length !== 13
  || report.summary.failedEnvironmentRequests !== 0
  || report.summary.consoleErrors !== 0
  || report.summary.duplicateEnvironmentLoads !== 0
  || report.summary.unexpectedEnvironmentRequests !== 0
  || !report.summary.noGlobalOptionCPreload
  || !report.summary.decodedDimensionsValid
) {
  console.error(JSON.stringify(report.summary, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report.summary, null, 2));
}
