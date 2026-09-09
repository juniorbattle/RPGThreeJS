import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN67_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN67_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin67/browser-qa'));
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
];

async function finishDialogue(page, chooseFirst = false) {
  for (let count = 0; count < 32; count += 1) {
    const dialogue = page.locator('.dialogue');
    if (!await dialogue.count()) return;
    const choices = dialogue.locator('.dialogue-choice:not([disabled])');
    if (await choices.count()) {
      if (!chooseFirst) throw new Error('Unexpected dialogue choice');
      await choices.first().click();
    } else {
      await dialogue.locator('.dialogue__box').click();
    }
    await page.waitForTimeout(40);
  }
  throw new Error('Dialogue did not complete');
}

async function advanceDialogueTo(page, stepId) {
  for (let count = 0; count < 16; count += 1) {
    const dialogue = page.locator('.dialogue');
    if (await dialogue.getAttribute('data-dialogue-step') === stepId) return;
    await dialogue.locator('.dialogue__box').click();
    await page.waitForTimeout(40);
  }
  throw new Error(`Dialogue did not reach ${stepId}`);
}

async function sampleMotion(page, scope) {
  const video = page.locator(`${scope} video`).first();
  await video.waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForFunction((selector) => {
    const element = document.querySelector(selector);
    return element instanceof HTMLVideoElement && element.readyState >= 2 && !element.paused;
  }, `${scope} video`, { timeout: 30_000 });
  const before = await video.evaluate((element) => element.currentTime);
  await page.waitForTimeout(900);
  const after = await video.evaluate((element) => element.currentTime);
  const pump = await page.locator(`${scope} .cinematic-overlay`).getAttribute('data-cinematic-frame-pump');
  const canvasCount = await page.locator(`${scope} canvas.cinematic-overlay__freeze-frame`).count();
  if (after <= before) throw new Error(`Media did not advance in ${scope}: ${before} -> ${after}`);
  if (canvasCount !== 1) throw new Error(`Expected one canvas in ${scope}, found ${canvasCount}`);
  return { before, after, delta: after - before, pump, canvasCount };
}

async function capture(page, viewport, name) {
  const file = `${viewport.width}x${viewport.height}-${name}.png`;
  await page.screenshot({ path: resolve(OUTPUT_DIR, file), fullPage: false });
  return file;
}

async function layoutMetrics(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const buttons = [...element.querySelectorAll('button:not([disabled])')].map((button) => {
      const box = button.getBoundingClientRect();
      return {
        label: button.textContent?.trim() ?? '',
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        visible: box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight,
      };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      bodyOverflowX: document.documentElement.scrollWidth > innerWidth,
      bodyOverflowY: document.documentElement.scrollHeight > innerHeight,
      buttons,
    };
  });
}

async function startChronicle(page) {
  await page.goto(`${BASE_URL}/?presentation=narrative&qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Nouvelle chronique' }).click();
  await page.locator('[data-prologue-skip]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-prologue-skip]').click();
  await page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  await finishDialogue(page);
  await page.locator('[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"] .cinematic-overlay').waitFor({ state: 'attached', timeout: 30_000 });
}

async function runCampaignRoundTrip(page, viewport) {
  await startChronicle(page);
  const campMotion = await sampleMotion(page, '[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"]');
  await page.locator('[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"] .cinematic-overlay__skip').click();
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible' });
  const singleRoute = await capture(page, viewport, '03-single-route');
  const singleMetrics = await layoutMetrics(page, '.narrative-stage');
  await page.locator('[data-journey-continue]').click();

  await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .dialogue--speaker-card[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 30_000 });
  const audienceMotion = await sampleMotion(page, '[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"]');
  const audienceMoving = await capture(page, viewport, '01-audience-moving-speaker');
  await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .cinematic-overlay__skip').click();
  await advanceDialogueTo(page, '3');
  await page.locator('.dialogue--spatial-choice .dialogue-choice').first().waitFor({ state: 'visible' });
  const audienceHeld = await capture(page, viewport, '02-audience-held-interactive');
  const audienceMetrics = await layoutMetrics(page, '.narrative-stage');
  const audienceSurface = await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .cinematic-overlay').getAttribute('data-cinematic-freeze-surface');
  const audienceModalOwners = await page.locator('[aria-modal="true"]').count();
  await page.locator('.dialogue--spatial-choice .dialogue-choice:not([disabled])').first().click();
  await page.locator('.dialogue[data-dialogue-step="4"] .dialogue__box').click();
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('[data-journey-continue]').click();

  await page.locator('[data-narrative-tableau="FOREST_THREAT_TABLEAU"] .dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('[data-narrative-tableau="FOREST_THREAT_TABLEAU"] .cinematic-overlay__skip').click();
  await finishDialogue(page);
  const combatFrame = page.locator('iframe.combat-frame');
  await combatFrame.waitFor({ state: 'attached', timeout: 40_000 });
  const combatDocument = page.frameLocator('iframe.combat-frame');
  const combatQa = combatDocument.locator('[data-qa="victory"]');
  await combatQa.waitFor({ state: 'visible', timeout: 40_000 });
  const tutorial = combatDocument.locator('#tutorial:not(.hidden)');
  if (await tutorial.count()) {
    await tutorial.locator('[data-action="skip"]').click();
    await tutorial.waitFor({ state: 'hidden' });
  }
  const combat = await capture(page, viewport, '05-combat-clean');
  const combatIsolation = {
    narrativeStages: await page.locator('.narrative-stage').count(),
    cinematicOverlays: await page.locator('.cinematic-overlay').count(),
    dialogueLayers: await page.locator('.dialogue').count(),
    journeyOverlays: await page.locator('.journey-overlay').count(),
    combatFrames: await combatFrame.count(),
  };
  await combatQa.click();
  const resultAction = page.frameLocator('iframe.combat-frame').locator('#combat-result-action');
  await resultAction.waitFor({ state: 'visible', timeout: 20_000 });
  await resultAction.click();
  await combatFrame.waitFor({ state: 'detached', timeout: 20_000 });
  await page.locator('[data-narrative-tableau="FOREST_AFTERMATH_TABLEAU"] .dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 20_000 });
  const postCombat = await capture(page, viewport, '06-post-combat-narrative');
  const postCombatMetrics = await layoutMetrics(page, '.narrative-stage');
  const postCombatIsolation = {
    travelViews: await page.locator('.travel-view').count(),
    journeyOverlays: await page.locator('.journey-overlay').count(),
    combatFrames: await page.locator('iframe.combat-frame').count(),
    narrativeStages: await page.locator('.narrative-stage').count(),
    dialogueStep: await page.locator('.dialogue').getAttribute('data-dialogue-step'),
  };
  await finishDialogue(page);
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 20_000 });
  const nextLabel = await page.locator('.journey-overlay__title').textContent();

  return {
    motion: { camp: campMotion, audience: audienceMotion },
    captures: { audienceMoving, audienceHeld, singleRoute, combat, postCombat },
    metrics: { audience: audienceMetrics, singleRoute: singleMetrics, postCombat: postCombatMetrics },
    audience: { heldSurface: audienceSurface, modalOwners: audienceModalOwners },
    combatIsolation,
    postCombatIsolation,
    nextLabel,
  };
}

async function installValmirSave(page) {
  await page.goto(`${BASE_URL}/?presentation=narrative`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { enterRunNode } = await import('/src/game/runSystem.ts');
    const state = createInitialState();
    const path = [
      'lion-audience',
      'lion-opening-ambush',
      'lion-nomad-crossroads',
      'lion-refugees',
      'lion-first-trial-event',
      'lion-first-refuge',
      'lion-reserve-trail',
      'lion-valmir-road',
    ];
    state.resolvedNodeIds.push('lion-camp');
    for (const id of path) {
      const node = enterRunNode(state.run, id);
      if (!node) throw new Error(`Could not enter ${id}`);
      state.currentNodeId = node.id;
      state.visitedNodeIds = [...state.run.visitedNodeIds];
      state.stepCounter += 1;
      if (!state.resolvedNodeIds.includes(node.id)) state.resolvedNodeIds.push(node.id);
      if (node.type === 'refuge') state.run.checkpointNodeId = node.id;
    }
    state.flags.prologueSeen = true;
    new SaveRepository().saveAuto(state);
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('[data-narrative-tableau="VALMIR_FORK_TABLEAU"] .cinematic-overlay').waitFor({ state: 'attached', timeout: 30_000 });
}

async function runValmir(page, viewport) {
  await installValmirSave(page);
  const motion = await sampleMotion(page, '[data-narrative-tableau="VALMIR_FORK_TABLEAU"]');
  await page.locator('[data-narrative-tableau="VALMIR_FORK_TABLEAU"] .cinematic-overlay__skip').click();
  await page.locator('.journey-overlay--branch').waitFor({ state: 'visible' });
  const fork = await capture(page, viewport, '04-valmir-fork');
  const metrics = await layoutMetrics(page, '.narrative-stage');
  const options = await page.locator('[data-journey-choice]').evaluateAll((elements) => elements.map((element) => ({
    id: (element instanceof HTMLElement ? element.dataset.journeyChoice : undefined) ?? '',
    label: element.textContent?.trim() ?? '',
    geography: element.parentElement?.dataset.routeGeography ?? '',
  })));
  await page.locator('[data-journey-choice="lion-second-trial-event"]').click();
  await page.locator('.dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 20_000 });
  const nextSpeaker = await page.locator('.dialogue__speaker').textContent();
  return { motion, capture: fork, metrics, options, nextSpeaker };
}

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requestFailures = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
    try {
      const campaign = await runCampaignRoundTrip(page, viewport);
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      const valmir = await runValmir(page, viewport);
      results.push({ viewport, campaign, valmir, consoleErrors, pageErrors, requestFailures, pass: true });
    } catch (error) {
      failed = true;
      results.push({ viewport, consoleErrors, pageErrors, requestFailures, pass: false, error: error instanceof Error ? error.stack : String(error) });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(results, null, 2));
if (failed) process.exitCode = 1;
