import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const proofRoot = path.join(repoRoot, 'docs', 'art-direction', 'option-c', 'phase4b-runtime-proof');
const screenshotRoot = path.join(proofRoot, 'screenshots');
const baseUrl = process.env.OPTION_C_PROOF_URL ?? 'http://127.0.0.1:5173/';
const viewports = [
  { width: 1920, height: 1080, label: '1920x1080' },
  { width: 1366, height: 768, label: '1366x768' },
];
const primarySurfaces = ['travel', 'tableau', 'strategic', 'combat-stage'];
const animationStates = ['idle', 'dash', 'attack', 'skill'];
const animationCaptureDelay = { idle: 220, dash: 260, attack: 360, skill: 430 };
const results = [];

function proofUrl(surface, animation = 'idle', tableauState = 'active') {
  const url = new URL(baseUrl);
  url.searchParams.set('devOptionC', 'forest-road');
  url.searchParams.set('surface', surface);
  url.searchParams.set('animation', animation);
  url.searchParams.set('tableauState', tableauState);
  return url.href;
}

async function waitForProof(page, surface) {
  await page.waitForFunction(
    (target) => document.body.dataset.optionCProofReady === 'true'
      && document.body.dataset.optionCProofSurface === target
      && !document.body.dataset.optionCProofFailure,
    surface,
    { timeout: 20_000 },
  );
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 20_000 },
  );
}

async function waitForCombatFrame(page, surface) {
  await page.waitForSelector('iframe.combat-frame', { state: 'attached', timeout: 20_000 });
  const frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat.html'));
  if (!frame) throw new Error('Real combat iframe did not attach.');
  await frame.waitForFunction(
    (target) => document.body.dataset.optionCProofReady === 'true'
      && document.body.dataset.optionCProofSurface === target
      && !document.body.dataset.optionCAssetFailure,
    surface,
    { timeout: 20_000 },
  );
  if (surface === 'combat-stage') {
    await frame.waitForFunction(
      () => document.body.dataset.optionCCombatStageActive === 'true'
        && document.querySelector('#stagetitle')?.classList.contains('on'),
      undefined,
      { timeout: 20_000 },
    );
  }
  return frame;
}

async function freezeStageOnDamage(frame) {
  const stateHandle = await frame.waitForFunction(() => {
    const damage = [...document.querySelectorAll('.float')]
      .filter((element) => /^-\d+/.test(element.textContent ?? ''))
      .sort((left, right) => Number.parseFloat(getComputedStyle(right).opacity || '0')
        - Number.parseFloat(getComputedStyle(left).opacity || '0'))[0];
    const ready = document.querySelector('#stagetitle')?.classList.contains('on')
      && Boolean(damage)
      && Number.parseFloat(getComputedStyle(damage).opacity || '0') >= 0.45;
    if (!ready) return false;
    // Freeze in the same browser task that observes the damage frame. A
    // separate evaluate call can miss this short-lived frame under software
    // WebGL at 1920x1080.
    window.requestAnimationFrame = () => 0;
    return {
      header: document.querySelector('#stagetitle')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      damageText: damage?.textContent ?? null,
      damageOpacity: damage ? Number.parseFloat(getComputedStyle(damage).opacity || '0') : 0,
    };
  }, undefined, { timeout: 60_000, polling: 'raf' });
  return stateHandle.jsonValue();
}

async function freezeStageOnAttackFrame(frame) {
  const stateHandle = await frame.waitForFunction(() => {
    const frameIndex = Number(document.body.dataset.optionCAnimationFrame ?? 0);
    const ready = document.querySelector('#stagetitle')?.classList.contains('on')
      && document.body.dataset.optionCAnimationState === 'attack'
      && frameIndex >= 2
      && frameIndex <= 6;
    if (!ready) return false;
    // The runtime animation callback has already rendered this frame. Freeze
    // in the same browser task so telemetry and framebuffer cannot diverge.
    window.requestAnimationFrame = () => 0;
    return {
      state: document.body.dataset.optionCAnimationState ?? null,
      frame: frameIndex,
      header: document.querySelector('#stagetitle')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    };
  }, undefined, { timeout: 20_000, polling: 'raf' });
  return stateHandle.jsonValue();
}

async function captureCleanScreenshot(page, outputPath) {
  const controls = page.locator('.option-c-phase4b__controls');
  if (await controls.count()) await controls.evaluate((element) => { element.style.display = 'none'; });
  await page.screenshot({ path: outputPath, type: 'png' });
  if (await controls.count()) await controls.evaluate((element) => { element.style.display = ''; });
}

async function browserFrameRate(frame, sampleMs = 1200) {
  return frame.evaluate((duration) => new Promise((resolve) => {
    let frames = 0;
    const started = performance.now();
    const tick = (now) => {
      frames += 1;
      if (now - started >= duration) {
        resolve({ frames, durationMs: now - started, fps: frames * 1000 / (now - started) });
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), sampleMs);
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0,
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      scroll: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        x: scrollX,
        y: scrollY,
      },
      bodyDataset: { ...document.body.dataset },
      controls: box('.option-c-phase4b__controls'),
      travel: {
        root: box('.travel-view'),
        menu: box('.travel-view__hud-actions'),
        nextStep: box('.travel-view__choices'),
        partyVisible: box('.travel-party')?.visible ?? false,
      },
      tableau: {
        root: box('.narrative-scene-surface'),
        dialogue: box('.dialogue__card'),
        kestrel: box('.narrative-cast__actor[data-actor-id="kestrel"]'),
        kestrelImageRendering: getComputedStyle(document.querySelector('.narrative-cast__actor[data-actor-id="kestrel"] img') ?? document.body).imageRendering,
        kestrelFacing: document.querySelector('.narrative-cast__actor[data-actor-id="kestrel"]')?.getAttribute('data-facing') ?? null,
        kestrelClasses: document.querySelector('.narrative-cast__actor[data-actor-id="kestrel"]')?.className ?? null,
      },
    };
  });
}

async function combatMetrics(frame) {
  const [metrics, fps] = await Promise.all([
    frame.evaluate(() => ({
      bodyDataset: { ...document.body.dataset },
      diagnostics: window.__COMBAT_DIAGNOSTICS ?? null,
      stageHeader: document.querySelector('#stagetitle')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      stageHeaderVisible: document.querySelector('#stagetitle')?.classList.contains('on') ?? false,
      objectiveVisible: Boolean(document.querySelector('#objective')),
      actionBarVisible: Boolean(document.querySelector('#menu:not(.hidden)')),
      selectedUnitVisible: Boolean(document.querySelector('#panel:not(.hidden)')),
      combatStageActive: document.body.dataset.optionCCombatStageActive === 'true',
    })),
    browserFrameRate(frame),
  ]);
  return { ...metrics, fps };
}

async function animationSequence(page, state) {
  const buttonName = state === 'skill' ? 'CAST / SKILL' : state.toUpperCase();
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  const samples = [];
  for (let elapsedMs = 0; elapsedMs <= 1800; elapsedMs += 60) {
    await page.waitForTimeout(elapsedMs === 0 ? 1 : 60);
    samples.push(await page.evaluate((elapsed) => ({
      elapsedMs: elapsed,
      state: document.body.dataset.optionCAnimationState ?? null,
      frame: Number(document.body.dataset.optionCAnimationFrame ?? 0),
    }), elapsedMs));
    if (elapsedMs > 500 && samples.at(-1)?.state === 'idle' && state !== 'idle') break;
  }
  return samples;
}

async function capturePrimary(browser, viewport, surface) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const assetResponses = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), url: message.location().url }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  page.on('response', (response) => {
    if (response.url().includes('/assets/dev/option-c/phase4b/')) assetResponses.push({ url: response.url(), status: response.status() });
  });

  await page.goto(proofUrl(surface, surface === 'combat-stage' ? 'attack' : 'idle'), { waitUntil: 'domcontentloaded' });
  await waitForProof(page, surface);
  const frame = surface === 'strategic' || surface === 'combat-stage'
    ? await waitForCombatFrame(page, surface)
    : null;
  if (surface === 'travel') await page.waitForTimeout(350);
  if (surface === 'tableau') await page.waitForTimeout(1800);
  const file = `${surface}.png`;
  const outputDir = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`);
  await mkdir(outputDir, { recursive: true });
  const outerMetrics = await pageMetrics(page);
  const innerMetrics = frame ? await combatMetrics(frame) : null;
  const attackCaptureState = surface === 'combat-stage' && frame ? await freezeStageOnAttackFrame(frame) : null;
  await captureCleanScreenshot(page, path.join(outputDir, file));
  results.push({
    kind: 'PRIMARY_SURFACE',
    surface,
    viewport,
    file: path.relative(repoRoot, path.join(outputDir, file)).replaceAll('\\', '/'),
    outerMetrics,
    innerMetrics,
    attackCaptureState,
    assetResponses,
    consoleMessages,
    pageErrors,
    failedRequests,
  });
  await page.close();
}

async function captureStageDamageEvidence(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), url: message.location().url }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  await page.goto(proofUrl('combat-stage', 'attack'), { waitUntil: 'domcontentloaded' });
  await waitForProof(page, 'combat-stage');
  const frame = await waitForCombatFrame(page, 'combat-stage');
  const captureState = await freezeStageOnDamage(frame);
  const outputDir = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`);
  const file = path.join(outputDir, 'combat-stage-damage.png');
  await captureCleanScreenshot(page, file);
  results.push({
    kind: 'COMBAT_STAGE_DAMAGE_EVIDENCE',
    surface: 'combat-stage',
    viewport,
    file: path.relative(repoRoot, file).replaceAll('\\', '/'),
    captureState,
    consoleMessages,
    pageErrors,
    failedRequests,
  });
  await page.close();
}

async function captureTableauEvidence(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), url: message.location().url }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  const outputDir = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`);
  await mkdir(outputDir, { recursive: true });
  await page.goto(proofUrl('tableau'), { waitUntil: 'domcontentloaded' });
  await waitForProof(page, 'tableau');

  const sequences = {};
  for (const state of animationStates) {
    const buttonName = state === 'skill' ? 'CAST / SKILL' : state.toUpperCase();
    await page.getByRole('button', { name: buttonName, exact: true }).click();
    await page.waitForTimeout(animationCaptureDelay[state]);
    const filename = `kestrel-${state}-runtime.png`;
    await captureCleanScreenshot(page, path.join(outputDir, filename));
    sequences[state] = await animationSequence(page, state);
  }

  const tableauStates = {};
  await page.getByRole('button', { name: 'IDLE', exact: true }).click();
  await page.waitForTimeout(300);
  for (const entry of [
    ['listening', 'KESTREL LISTENS'],
    ['mirrored', 'MIRRORED'],
    ['center', 'CENTER POSITION'],
    ['right', 'RIGHT POSITION'],
  ]) {
    await page.getByRole('button', { name: entry[1], exact: true }).click();
    await waitForProof(page, 'tableau');
    await page.waitForTimeout(1800);
    const filename = `tableau-${entry[0]}.png`;
    await captureCleanScreenshot(page, path.join(outputDir, filename));
    tableauStates[entry[0]] = await pageMetrics(page);
  }

  results.push({
    kind: 'TABLEAU_AND_ANIMATION_EVIDENCE',
    surface: 'tableau',
    viewport,
    sequences,
    tableauStates,
    consoleMessages,
    pageErrors,
    failedRequests,
  });
  await page.close();
}

async function measureCombatBaseline(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text(), url: message.location().url }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
  const url = new URL('/legacy-combat.html?qa=1', baseUrl);
  await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__COMBAT_DIAGNOSTICS), undefined, { timeout: 20_000 });
  const [diagnostics, fps] = await Promise.all([
    page.evaluate(() => window.__COMBAT_DIAGNOSTICS),
    browserFrameRate(page),
  ]);
  results.push({
    kind: 'COMBAT_PERFORMANCE_BASELINE',
    viewport,
    diagnostics,
    fps,
    consoleMessages,
    pageErrors,
    failedRequests,
  });
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    for (const surface of primarySurfaces) await capturePrimary(browser, viewport, surface);
    await captureStageDamageEvidence(browser, viewport);
    await captureTableauEvidence(browser, viewport);
    await measureCombatBaseline(browser, viewport);
  }
} finally {
  await browser.close();
}

const reportPath = path.join(proofRoot, 'qa', 'browser-qa-results.json');
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseUrl,
  results,
}, null, 2)}\n`, 'utf8');

const primary = results.filter((entry) => entry.kind === 'PRIMARY_SURFACE');
const errors = results.flatMap((entry) => [
  ...entry.consoleMessages.filter((message) => message.type === 'error'),
  ...entry.pageErrors.map((message) => ({ type: 'pageerror', text: message })),
  ...entry.failedRequests.map((request) => ({ type: 'requestfailed', text: `${request.url}: ${request.error}` })),
]);
console.log(JSON.stringify({
  primarySurfaceChecks: primary.length,
  animationViewports: results.filter((entry) => entry.kind === 'TABLEAU_AND_ANIMATION_EVIDENCE').length,
  runtimeConsoleErrors: errors.length,
  output: path.relative(repoRoot, reportPath).replaceAll('\\', '/'),
}, null, 2));
if (primary.length !== 8 || errors.length > 0) process.exitCode = 1;
