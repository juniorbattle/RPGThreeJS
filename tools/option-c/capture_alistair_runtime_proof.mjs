import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const candidateRoot = path.join(repoRoot, 'public', 'assets', 'dev', 'option-c', 'phase4c', 'alistair');
const screenshotRoot = path.join(candidateRoot, 'reviews', 'runtime');
const reportPath = path.join(candidateRoot, 'qa', 'alistair-runtime-qa.json');
const baseUrl = process.env.OPTION_C_PROOF_URL ?? 'http://127.0.0.1:5173/';
const viewports = [
  { width: 1920, height: 1080, label: '1920x1080' },
  { width: 1366, height: 768, label: '1366x768' },
];
const candidateUrlFragment = '/assets/dev/option-c/phase4c/alistair/normalized/alistair-';
const results = [];

function proofUrl(surface, { animation = 'idle', tableauState = 'listening' } = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'forest-road');
  url.searchParams.set('character', 'alistair');
  url.searchParams.set('surface', surface);
  url.searchParams.set('animation', animation);
  url.searchParams.set('tableauState', tableauState);
  return url.href;
}

function observe(page) {
  const evidence = { consoleErrors: [], pageErrors: [], failedRequests: [], candidateResponses: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  page.on('requestfailed', (request) => evidence.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown',
  }));
  page.on('response', (response) => {
    if (response.url().includes('/assets/dev/option-c/phase4c/alistair/')) {
      evidence.candidateResponses.push({ url: response.url(), status: response.status() });
    }
  });
  return evidence;
}

async function waitOuter(page, surface) {
  await page.waitForFunction(
    (expected) => document.body.dataset.optionCProofReady === 'true'
      && document.body.dataset.optionCProofSurface === expected
      && document.body.dataset.optionCProofCharacter === 'alistair'
      && !document.body.dataset.optionCProofFailure,
    surface,
    { timeout: 30_000 },
  );
}

async function waitImages(page) {
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 30_000 },
  );
}

async function combatFrame(page, surface) {
  await page.waitForSelector('iframe.combat-frame', { state: 'attached', timeout: 30_000 });
  const frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat.html'));
  if (!frame) throw new Error('Real combat iframe did not attach.');
  await frame.waitForFunction(
    (expected) => document.body.dataset.optionCProofReady === 'true'
      && document.body.dataset.optionCProofSurface === expected
      && document.body.dataset.optionCProofCharacter === 'alistair'
      && !document.body.dataset.optionCAssetFailure,
    surface,
    { timeout: 30_000 },
  );
  if (surface === 'combat-stage') {
    await frame.waitForFunction(
      () => document.body.dataset.optionCCombatStageActive === 'true'
        && document.querySelector('#stagetitle')?.classList.contains('on'),
      undefined,
      { timeout: 60_000 },
    );
  }
  return frame;
}

async function hideControls(page) {
  await page.locator('.option-c-phase4b__controls').evaluateAll((elements) => {
    for (const element of elements) element.style.display = 'none';
  });
}

async function outerMetrics(page) {
  return page.evaluate((assetFragment) => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const actor = document.querySelector('.narrative-cast__actor[data-actor-id="alistair"]');
    const image = actor?.querySelector('img');
    const actorRect = rect('.narrative-cast__actor[data-actor-id="alistair"]');
    const dialogueRect = rect('.dialogue__box');
    const overlap = actorRect && dialogueRect
      ? Math.max(0, Math.min(actorRect.x + actorRect.width, dialogueRect.x + dialogueRect.width) - Math.max(actorRect.x, dialogueRect.x))
        * Math.max(0, Math.min(actorRect.y + actorRect.height, dialogueRect.y + dialogueRect.height) - Math.max(actorRect.y, dialogueRect.y))
      : 0;
    return {
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      bodyDataset: { ...document.body.dataset },
      actor: actorRect,
      actorFacing: actor?.getAttribute('data-facing') ?? null,
      actorClasses: actor?.className ?? null,
      actorImage: image instanceof HTMLImageElement ? image.getAttribute('src') : null,
      candidateImageMounted: image instanceof HTMLImageElement && (image.getAttribute('src') ?? '').includes(assetFragment),
      dialogue: dialogueRect,
      actorDialogueOverlapPixels: overlap,
      imageRendering: image ? getComputedStyle(image).imageRendering : null,
    };
  }, candidateUrlFragment);
}

async function innerMetrics(frame) {
  return frame.evaluate((assetFragment) => ({
    bodyDataset: { ...document.body.dataset },
    diagnostics: window.__COMBAT_DIAGNOSTICS ?? null,
    stageHeader: document.querySelector('#stagetitle')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    stageHeaderVisible: document.querySelector('#stagetitle')?.classList.contains('on') ?? false,
    selectedPanel: document.querySelector('#panel')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    candidateTextureActive: document.body.dataset.optionCAnimationState !== undefined
      && !document.body.dataset.optionCAssetFailure,
    requestedCandidateFragment: assetFragment,
  }), candidateUrlFragment);
}

async function captureTableau(browser, viewport, tableauState) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const evidence = observe(page);
  await page.goto(proofUrl('tableau', { tableauState }), { waitUntil: 'domcontentloaded' });
  await waitOuter(page, 'tableau');
  await waitImages(page);
  await page.waitForTimeout(1_800);
  const metrics = await outerMetrics(page);
  await hideControls(page);
  const outputDir = path.join(screenshotRoot, viewport.label);
  await mkdir(outputDir, { recursive: true });
  const file = path.join(outputDir, `tableau-${tableauState}.png`);
  await page.screenshot({ path: file, type: 'png' });
  results.push({
    surface: 'STATIC_TABLEAU',
    variant: tableauState,
    viewport,
    file: path.relative(repoRoot, file).replaceAll('\\', '/'),
    metrics,
    ...evidence,
  });
  await page.close();
}

async function captureCombat(browser, viewport, surface) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const evidence = observe(page);
  const animation = surface === 'combat-stage' ? 'attack' : 'idle';
  await page.goto(proofUrl(surface, { animation }), { waitUntil: 'domcontentloaded' });
  await waitOuter(page, surface);
  const frame = await combatFrame(page, surface);
  if (surface === 'strategic') await page.waitForTimeout(800);
  const outer = await outerMetrics(page);
  const inner = await innerMetrics(frame);
  await hideControls(page);
  const outputDir = path.join(screenshotRoot, viewport.label);
  await mkdir(outputDir, { recursive: true });
  const file = path.join(outputDir, `${surface}.png`);
  await page.screenshot({ path: file, type: 'png' });
  results.push({
    surface: surface === 'strategic' ? 'STRATEGIC' : 'COMBAT_STAGE',
    variant: animation,
    viewport,
    file: path.relative(repoRoot, file).replaceAll('\\', '/'),
    outer,
    inner,
    ...evidence,
  });
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    await captureTableau(browser, viewport, 'listening');
    await captureTableau(browser, viewport, 'mirrored');
    await captureCombat(browser, viewport, 'strategic');
    await captureCombat(browser, viewport, 'combat-stage');
  }
} finally {
  await browser.close();
}

const errors = results.flatMap((result) => [
  ...result.consoleErrors,
  ...result.pageErrors,
  ...result.failedRequests.map((failure) => `${failure.url}: ${failure.error}`),
]);
const failedCandidateResponses = results.flatMap((result) => result.candidateResponses).filter((response) => response.status !== 200);
const tableauPass = results.filter((result) => result.surface === 'STATIC_TABLEAU').every((result) => (
  result.metrics.candidateImageMounted
  && result.metrics.actor
  && result.metrics.actorDialogueOverlapPixels === 0
  && result.metrics.scroll.width <= result.viewport.width
  && result.metrics.scroll.height <= result.viewport.height
));
const strategicPass = results.filter((result) => result.surface === 'STRATEGIC').every((result) => (
  result.inner.bodyDataset.optionCProofCharacter === 'alistair'
  && result.inner.bodyDataset.optionCProofSurface === 'strategic'
  && result.inner.bodyDataset.optionCAnimationState === 'idle'
  && result.inner.candidateTextureActive
));
const stagePass = results.filter((result) => result.surface === 'COMBAT_STAGE').every((result) => (
  result.inner.bodyDataset.optionCProofCharacter === 'alistair'
  && result.inner.bodyDataset.optionCProofSurface === 'combat-stage'
  && result.inner.bodyDataset.optionCCombatStageActive === 'true'
  && result.inner.stageHeaderVisible
  && result.inner.candidateTextureActive
));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseUrl,
  candidate: 'Alistair FINAL_PRODUCTION_CANDIDATE',
  requiredViewports: viewports.map((viewport) => viewport.label),
  status: errors.length === 0 && failedCandidateResponses.length === 0 && tableauPass && strategicPass && stagePass ? 'PASS' : 'FAIL',
  surfaceStatus: {
    STATIC_TABLEAU: tableauPass ? 'PASS' : 'FAIL',
    STRATEGIC: strategicPass ? 'PASS' : 'FAIL',
    COMBAT_STAGE: stagePass ? 'PASS' : 'FAIL',
  },
  errorCount: errors.length,
  failedCandidateResponseCount: failedCandidateResponses.length,
  results,
};
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  status: report.status,
  surfaceStatus: report.surfaceStatus,
  captures: results.length,
  errors: errors.length,
  report: path.relative(repoRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
