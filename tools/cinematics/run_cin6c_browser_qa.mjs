import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN6C_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN6C_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin6c/browser-qa'));
const VIEWPORT = { width: 1920, height: 1080 };
const TARGET_FILTER = process.env.CIN6C_TARGET ?? '';

const DIALOGUE_TARGETS = [
  ['cedric_encounter', 'mystery_recruit'],
  ['garen_encounter', 'mystery_lancer_recruit'],
  ['shrine_reveal_context', 'old_shrine_event'],
  ['injured_merchant_encounter', 'mystery_help'],
  ['abandoned_cart_reveal', 'mystery_treasure'],
  ['young_dragon_encounter', 'mystery_dragon_roost'],
  ['serpent_informant_encounter', 'serpent_informant'],
];

const COMBAT_TARGETS = [
  ['serpent_road_tension', 'forest_patrol', 'pre_serpent_patrol'],
  ['spider_nest_reveal', 'spider_nest', 'pre_spider_nest'],
  ['troll_crossing_reveal', 'troll_crossing', 'pre_troll_crossing'],
  ['serpent_duelist_reveal', 'serpent_duelist_trial', 'pre_serpent_duelist_trial'],
];

function collectDiagnostics(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  return diagnostics;
}

function snapshotDiagnostics(diagnostics) {
  return {
    consoleErrors: [...diagnostics.consoleErrors],
    pageErrors: [...diagnostics.pageErrors],
    requestFailures: [...diagnostics.requestFailures],
  };
}

async function sampleVideo(page, cinematicId, diagnostics) {
  await page.waitForTimeout(750);
  const mountState = await page.evaluate(async () => ({
    url: location.href,
    policy: (await import('/src/journey/JourneyPresentationPolicy.ts')).resolveCampaignPresentation({ search: location.search, dev: true }),
    stages: document.querySelectorAll('.narrative-stage').length,
    stageVideos: document.querySelectorAll('.narrative-stage video.cinematic-overlay__video').length,
    allVideos: document.querySelectorAll('video').length,
    dialogues: [...document.querySelectorAll('.dialogue')].map((dialogue) => ({
      sequence: dialogue.getAttribute('data-dialogue-sequence'),
      mode: dialogue.getAttribute('data-dialogue-mode'),
      parent: dialogue.parentElement?.className ?? '',
    })),
    bodyMode: document.body.getAttribute('data-mode'),
  }));
  console.log(`[CIN-6C browser QA] ${cinematicId} mount ${JSON.stringify({ ...mountState, diagnostics })}`);
  const video = page.locator('.narrative-stage video.cinematic-overlay__video').first();
  await video.waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForFunction((expectedId) => {
    const element = document.querySelector('.narrative-stage video.cinematic-overlay__video');
    return element instanceof HTMLVideoElement
      && element.readyState >= 2
      && element.currentSrc.endsWith(`/assets/cinematics/${expectedId}.mp4`)
      && !element.paused;
  }, cinematicId, { timeout: 30_000 });
  const before = await video.evaluate((element) => element.currentTime);
  await page.waitForTimeout(700);
  const after = await video.evaluate((element) => element.currentTime);
  if (after <= before) throw new Error(`${cinematicId}: decoded media clock did not advance (${before} -> ${after}).`);
  const state = await page.locator('.narrative-stage').evaluate((stage) => ({
    mediaMode: stage.getAttribute('data-narrative-authoring-media'),
    surfaceKind: stage.getAttribute('data-narrative-media-surface'),
    castOwnership: stage.getAttribute('data-narrative-cast-ownership'),
    staticCast: stage.querySelectorAll('.narrative-cast__actor').length,
    automaticPortraits: stage.querySelectorAll('.dialogue__portrait.is-visible').length,
    overlayCount: stage.querySelectorAll('.cinematic-overlay').length,
    framePump: stage.querySelector('.cinematic-overlay')?.getAttribute('data-cinematic-frame-pump') ?? '',
  }));
  if (state.mediaMode !== 'VIDEO' || state.castOwnership !== 'VIDEO_OWNS_CAST') {
    throw new Error(`${cinematicId}: NarrativeStage did not assign cast ownership to video: ${JSON.stringify(state)}`);
  }
  if (state.staticCast !== 0 || state.automaticPortraits !== 0 || state.overlayCount !== 1) {
    throw new Error(`${cinematicId}: duplicated cast or overlay: ${JSON.stringify(state)}`);
  }
  return { before, after, delta: after - before, currentSrc: await video.evaluate((element) => element.currentSrc), state };
}

async function skipToHeldDialogue(page, cinematicId, dialogueId) {
  await page.locator('.narrative-stage .cinematic-overlay__skip').click();
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${dialogueId}"]`);
  await dialogue.waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(() => (
    document.querySelector('.narrative-stage')?.getAttribute('data-narrative-media-surface') === 'HELD_VIDEO'
  ), undefined, { timeout: 20_000 });
  const state = await page.locator('.narrative-stage').evaluate((stage) => ({
    surfaceKind: stage.getAttribute('data-narrative-media-surface'),
    overlayCount: stage.querySelectorAll('.cinematic-overlay').length,
    freezeSurface: stage.querySelector('.cinematic-overlay')?.getAttribute('data-cinematic-freeze-surface') ?? '',
    choiceCount: stage.querySelectorAll('.dialogue-choice:not([disabled])').length,
  }));
  if (state.surfaceKind !== 'HELD_VIDEO' || state.overlayCount !== 1 || state.freezeSurface !== 'canvas') {
    throw new Error(`${cinematicId}: skip did not settle on one healthy held-video surface: ${JSON.stringify(state)}`);
  }
  return state;
}

async function chooseFirstDialogueOption(page, dialogueId) {
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${dialogueId}"]`);
  for (let index = 0; index < 32; index += 1) {
    const choices = dialogue.locator('.dialogue-choice:not([disabled])');
    if (await choices.count()) {
      const labels = await choices.allTextContents();
      await choices.first().click();
      await page.waitForTimeout(80);
      return labels.map((label) => label.trim());
    }
    if (!await dialogue.count()) break;
    await dialogue.locator('.dialogue__box').click();
    await page.waitForTimeout(65);
  }
  throw new Error(`${dialogueId}: no deterministic choice became available.`);
}

async function finishPreCombatDialogue(page, dialogueId) {
  for (let index = 0; index < 32; index += 1) {
    if (await page.locator('iframe.combat-frame').count()) return;
    const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${dialogueId}"]`);
    if (await dialogue.count()) {
      const choices = dialogue.locator('.dialogue-choice:not([disabled])');
      if (await choices.count()) await choices.first().click();
      else await dialogue.locator('.dialogue__box').click();
    }
    await page.waitForTimeout(75);
  }
  throw new Error(`${dialogueId}: pre-combat dialogue did not hand off to combat.`);
}

async function runDialogueTarget(context, cinematicId, dialogueId) {
  const page = await context.newPage();
  const diagnostics = collectDiagnostics(page);
  try {
    await page.goto(`${BASE_URL}/?journey=cinematic&media=video&qa=1&cinematic=1&real=${cinematicId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cinematic-qa="real-selected-dialogue"]').click();
    const motion = await sampleVideo(page, cinematicId, diagnostics);
    await page.locator(`.dialogue[data-dialogue-sequence="${dialogueId}"]`).waitFor({ state: 'visible', timeout: 30_000 });
    const capture = `dialogue-${cinematicId}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    const held = await skipToHeldDialogue(page, cinematicId, dialogueId);
    const choiceLabels = await chooseFirstDialogueOption(page, dialogueId);
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || diagnostics.requestFailures.length) {
      throw new Error(`${cinematicId}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    return { cinematicId, dialogueId, motion, held, choiceLabels, capture, diagnostics: snapshotDiagnostics(diagnostics), pass: true };
  } finally {
    await page.close();
  }
}

async function runCombatTarget(context, cinematicId, combatId, dialogueId) {
  const page = await context.newPage();
  const diagnostics = collectDiagnostics(page);
  try {
    await page.goto(`${BASE_URL}/?journey=cinematic&media=video&qa=1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'QA rencontres' }).click();
    await page.locator(`[data-qa-combat="${combatId}"]`).click();
    const motion = await sampleVideo(page, cinematicId, diagnostics);
    await page.locator(`.dialogue[data-dialogue-sequence="${dialogueId}"]`).waitFor({ state: 'visible', timeout: 30_000 });
    const capture = `combat-${cinematicId}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    const held = await skipToHeldDialogue(page, cinematicId, dialogueId);
    await finishPreCombatDialogue(page, dialogueId);
    await page.locator('iframe.combat-frame').waitFor({ state: 'attached', timeout: 40_000 });
    await page.frameLocator('iframe.combat-frame').locator('[data-qa="victory"]').waitFor({ state: 'visible', timeout: 40_000 });
    const handoff = {
      combatFrames: await page.locator('iframe.combat-frame').count(),
      narrativeStages: await page.locator('.narrative-stage').count(),
      cinematicOverlays: await page.locator('.cinematic-overlay').count(),
    };
    if (handoff.combatFrames !== 1 || handoff.narrativeStages !== 0 || handoff.cinematicOverlays !== 0) {
      throw new Error(`${cinematicId}: pre-combat handoff retained stale presentation: ${JSON.stringify(handoff)}`);
    }
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || diagnostics.requestFailures.length) {
      throw new Error(`${cinematicId}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    return { cinematicId, combatId, dialogueId, motion, held, handoff, capture, diagnostics: snapshotDiagnostics(diagnostics), pass: true };
  } finally {
    await page.close();
  }
}

async function runFinalHold(context) {
  const page = await context.newPage();
  const diagnostics = collectDiagnostics(page);
  try {
    const cinematicId = 'young_dragon_encounter';
    await page.goto(`${BASE_URL}/?qa=1&cinematic=1&real=${cinematicId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cinematic-qa="real-selected-hold"]').click();
    await page.locator('[data-cinematic-release]').waitFor({ state: 'visible', timeout: 20_000 });
    const state = await page.locator('.cinematic-overlay').evaluate((overlay) => {
      const canvas = overlay.querySelector('.cinematic-overlay__freeze-frame');
      return {
        freezeSurface: overlay.getAttribute('data-cinematic-freeze-surface'),
        framePump: overlay.getAttribute('data-cinematic-frame-pump'),
        canvasHidden: canvas instanceof HTMLCanvasElement ? canvas.hidden : true,
        canvasWidth: canvas instanceof HTMLCanvasElement ? canvas.width : 0,
        canvasHeight: canvas instanceof HTMLCanvasElement ? canvas.height : 0,
      };
    });
    if (state.freezeSurface !== 'canvas' || state.canvasHidden || !state.canvasWidth || !state.canvasHeight) {
      throw new Error(`Final-frame hold was not a decoded canvas: ${JSON.stringify(state)}`);
    }
    const capture = 'final-hold-young_dragon_encounter.png';
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    await page.locator('[data-cinematic-release]').click();
    await page.locator('.qa-lab__result').waitFor({ state: 'visible', timeout: 10_000 });
    const residue = await page.locator('.cinematic-overlay, [data-cinematic-release]').count();
    if (residue !== 0) throw new Error(`Final-frame release left ${residue} DOM nodes.`);
    return { cinematicId, state, capture, residue, diagnostics: snapshotDiagnostics(diagnostics), pass: true };
  } finally {
    await page.close();
  }
}

async function runFallbacks(context) {
  const page = await context.newPage();
  const diagnostics = collectDiagnostics(page);
  try {
    await page.goto(`${BASE_URL}/?journey=cinematic&media=video&qa=1&cinematic=1&real=cedric_encounter`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cinematic-qa="reduced"]').click();
    await page.locator('.qa-lab__result').waitFor({ state: 'visible', timeout: 10_000 });
    const reducedText = (await page.locator('.qa-lab__result').textContent()) ?? '';
    if (!reducedText.includes('reduced-motion') || await page.locator('.cinematic-overlay').count()) {
      throw new Error(`Reduced-motion path did not settle immediately: ${reducedText}`);
    }
    await page.locator('[data-cinematic-qa="failure-dialogue"]').click();
    await page.locator('.dialogue[data-dialogue-sequence="lion_finale_judgement"]').waitFor({ state: 'visible', timeout: 20_000 });
    const failureState = {
      dialogueCount: await page.locator('.dialogue[data-dialogue-sequence="lion_finale_judgement"]').count(),
      overlayCount: await page.locator('.cinematic-overlay').count(),
    };
    if (failureState.dialogueCount !== 1 || failureState.overlayCount !== 0) {
      throw new Error(`Media-failure fallback did not preserve dialogue: ${JSON.stringify(failureState)}`);
    }
    return { reducedText, failureState, diagnostics: snapshotDiagnostics(diagnostics), pass: true };
  } finally {
    await page.close();
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT });
const result = {
  viewport: VIEWPORT,
  dialogueTargets: [],
  combatTargets: [],
  finalHold: null,
  fallbacks: null,
  pass: false,
};
let failed = false;
try {
  for (const [cinematicId, dialogueId] of DIALOGUE_TARGETS) {
    if (TARGET_FILTER && TARGET_FILTER !== cinematicId) continue;
    console.log(`[CIN-6C browser QA] dialogue ${cinematicId}`);
    try {
      result.dialogueTargets.push(await runDialogueTarget(context, cinematicId, dialogueId));
    } catch (error) {
      failed = true;
      result.dialogueTargets.push({ cinematicId, dialogueId, pass: false, error: error instanceof Error ? error.stack : String(error) });
    }
  }
  for (const [cinematicId, combatId, dialogueId] of COMBAT_TARGETS) {
    if (TARGET_FILTER && TARGET_FILTER !== cinematicId) continue;
    console.log(`[CIN-6C browser QA] combat ${cinematicId}`);
    try {
      result.combatTargets.push(await runCombatTarget(context, cinematicId, combatId, dialogueId));
    } catch (error) {
      failed = true;
      result.combatTargets.push({ cinematicId, combatId, dialogueId, pass: false, error: error instanceof Error ? error.stack : String(error) });
    }
  }
  if (!TARGET_FILTER) {
    try { result.finalHold = await runFinalHold(context); } catch (error) {
      failed = true;
      result.finalHold = { pass: false, error: error instanceof Error ? error.stack : String(error) };
    }
    try { result.fallbacks = await runFallbacks(context); } catch (error) {
      failed = true;
      result.fallbacks = { pass: false, error: error instanceof Error ? error.stack : String(error) };
    }
  }
  result.pass = !failed;
} finally {
  await context.close();
  await browser.close();
}
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (failed) process.exitCode = 1;
