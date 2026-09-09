import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN671_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN671_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin671/browser-qa'));
const ALL_VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }];
const VIEWPORTS = process.env.CIN671_VIEWPORT
  ? ALL_VIEWPORTS.filter(({ width, height }) => `${width}x${height}` === process.env.CIN671_VIEWPORT)
  : ALL_VIEWPORTS;

const qaUrl = (extra = '') => `${BASE_URL}/?presentation=narrative&media=stills&qa=1&cin6a=golden${extra}`;

async function capture(page, viewport, name) {
  await settleDialogue(page);
  const file = `${viewport.width}x${viewport.height}-${name}.png`;
  await page.screenshot({ path: resolve(OUTPUT_DIR, file), fullPage: false });
  return file;
}

async function finishDialogue(page, chooseFirst = false) {
  const startingSequence = await page.locator('.dialogue').getAttribute('data-dialogue-sequence');
  for (let count = 0; count < 80; count += 1) {
    const dialogue = page.locator('.dialogue');
    if (!await dialogue.count()) return;
    if (await dialogue.getAttribute('data-dialogue-sequence') !== startingSequence) return;
    const choices = dialogue.locator('.dialogue-choice:not([disabled])');
    if (await choices.count()) {
      if (!chooseFirst) throw new Error(`Unexpected choice in ${await dialogue.getAttribute('aria-label')}`);
      await choices.first().click();
    } else {
      await dialogue.locator('.dialogue__box').click();
    }
    await page.waitForTimeout(25);
  }
  throw new Error('Dialogue did not complete after 80 presentation advances.');
}

async function settleDialogue(page) {
  if (!await page.locator('.dialogue__text').count()) return;
  let stableReads = 0;
  let previous = '';
  for (let count = 0; count < 40 && stableReads < 3; count += 1) {
    const current = await page.locator('.dialogue__text').textContent();
    stableReads = current === previous ? stableReads + 1 : 0;
    previous = current ?? '';
    await page.waitForTimeout(75);
  }
  await page.waitForTimeout(250);
}

async function advanceDialogueTo(page, stepId) {
  for (let count = 0; count < 40; count += 1) {
    const dialogue = page.locator('.dialogue');
    if (await dialogue.getAttribute('data-dialogue-step') === stepId) return;
    const choices = dialogue.locator('.dialogue-choice:not([disabled])');
    if (await choices.count()) await choices.first().click();
    else await dialogue.locator('.dialogue__box').click();
    await page.waitForTimeout(25);
  }
  throw new Error(`Dialogue did not reach ${stepId}.`);
}

async function advanceToChoice(page) {
  for (let count = 0; count < 40; count += 1) {
    const choices = page.locator('.dialogue-choice:not([disabled])');
    if (await choices.count()) return;
    await page.locator('.dialogue__box').click();
    await page.waitForTimeout(25);
  }
  throw new Error('Dialogue did not reach an enabled choice.');
}

async function auditRevealStability(page, label) {
  const metrics = await page.locator('.dialogue__box').evaluate((card) => new Promise((resolveAudit) => {
    const samples = [];
    const started = performance.now();
    const sample = () => {
      const rect = card.getBoundingClientRect();
      const text = card.querySelector('.dialogue__text');
      const reveal = card.querySelector('.dialogue__text-reveal');
      const finalLength = text instanceof HTMLElement ? (text.dataset.finalText ?? '').length : 0;
      const revealLength = reveal?.textContent?.length ?? 0;
      const contentOverflow = [...card.querySelectorAll('.dialogue__speaker-block,.dialogue__text,.dialogue__outcomes')]
        .filter((element) => element instanceof HTMLElement && !element.hidden && getComputedStyle(element).display !== 'none')
        .some((element) => {
          const contentRect = element.getBoundingClientRect();
          return contentRect.top < rect.top - 1 || contentRect.bottom > rect.bottom + 1;
        });
      samples.push({
        width: rect.width,
        height: rect.height,
        scrollHeight: card.scrollHeight,
        clientHeight: card.clientHeight,
        revealLength,
        finalLength,
        contentOverflow,
      });
      if ((finalLength > 0 && revealLength >= finalLength) || performance.now() - started > 4_000) {
        resolveAudit(samples);
        return;
      }
      window.setTimeout(sample, 16);
    };
    sample();
  }));
  const widths = metrics.map((sample) => sample.width);
  const heights = metrics.map((sample) => sample.height);
  const widthDelta = Math.max(...widths) - Math.min(...widths);
  const heightDelta = Math.max(...heights) - Math.min(...heights);
  const scrollViolations = metrics.filter((sample) => sample.contentOverflow).length;
  if (widthDelta > 1 || heightDelta > 1) throw new Error(`${label}: progressive text shifted card geometry by ${widthDelta}x${heightDelta}px.`);
  if (scrollViolations) throw new Error(`${label}: progressive text produced ${scrollViolations} scrolling samples.`);
  return { sampleCount: metrics.length, widthDelta, heightDelta, scrollViolations, completedReveal: metrics.at(-1)?.revealLength === metrics.at(-1)?.finalLength };
}

async function sceneMetrics(page) {
  return page.locator('.narrative-stage').evaluate((stage) => {
    const card = stage.querySelector('.dialogue__box');
    const cardRect = card?.getBoundingClientRect();
    const cardStyle = card ? getComputedStyle(card) : null;
    const dialogue = stage.querySelector('.dialogue');
    const cardContentOverflow = card && cardRect ? [...card.querySelectorAll('.dialogue__speaker-block,.dialogue__text,.dialogue__outcomes')]
      .filter((element) => element instanceof HTMLElement && !element.hidden && getComputedStyle(element).display !== 'none')
      .some((element) => {
        const contentRect = element.getBoundingClientRect();
        return contentRect.top < cardRect.top - 1 || contentRect.bottom > cardRect.bottom + 1;
      }) : false;
    const choiceButtons = [...stage.querySelectorAll('.dialogue-choice')].map((button) => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, visible: rect.width > 0 && rect.height > 0 };
    });
    return {
      mediaMode: stage.getAttribute('data-narrative-authoring-media'),
      surfaceKind: stage.getAttribute('data-narrative-media-surface'),
      tableau: stage.getAttribute('data-narrative-tableau'),
      phase: stage.getAttribute('data-narrative-visual-phase'),
      layout: dialogue?.getAttribute('data-narrative-layout') ?? stage.getAttribute('data-narrative-layout-profile'),
      placement: dialogue?.getAttribute('data-narrative-placement') ?? stage.getAttribute('data-narrative-layout-placement'),
      agencyState: dialogue?.getAttribute('data-narrative-agency-state') ?? 'NONE',
      speakerCardPolicy: dialogue?.getAttribute('data-narrative-speaker-card-policy') ?? 'NONE',
      strategy: stage.getAttribute('data-narrative-presentation-strategy'),
      speaker: stage.getAttribute('data-narrative-speaker'),
      videoCount: stage.querySelectorAll('video').length,
      canvasCount: stage.querySelectorAll('canvas').length,
      staticActorCount: stage.querySelectorAll('.narrative-cast__actor').length,
      automaticPortraitCount: stage.querySelectorAll('.dialogue__portrait.is-visible').length,
      modalOwners: document.querySelectorAll('[aria-modal="true"]').length,
      card: cardRect ? {
        left: cardRect.left,
        right: cardRect.right,
        top: cardRect.top,
        bottom: cardRect.bottom,
        widthRatio: cardRect.width / innerWidth,
        visible: cardStyle?.display !== 'none' && cardRect.width > 0 && cardRect.height > 0,
        hidden: card instanceof HTMLElement ? card.hidden : false,
        overflowX: cardStyle?.overflowX,
        overflowY: cardStyle?.overflowY,
        scrollHeight: card instanceof HTMLElement ? card.scrollHeight : 0,
        clientHeight: card instanceof HTMLElement ? card.clientHeight : 0,
        contentOverflow: cardContentOverflow,
      } : null,
      choices: choiceButtons,
      viewport: { width: innerWidth, height: innerHeight },
      overflowX: document.documentElement.scrollWidth > innerWidth,
      overflowY: document.documentElement.scrollHeight > innerHeight,
    };
  });
}

function assertNarrativeMetrics(metrics, label) {
  if (metrics.mediaMode !== 'STILL' || metrics.surfaceKind !== 'STILL') throw new Error(`${label}: not on the authoritative still surface.`);
  if (metrics.videoCount !== 0 || metrics.canvasCount !== 0) throw new Error(`${label}: video/canvas leaked into still mode.`);
  if (metrics.automaticPortraitCount !== 0) throw new Error(`${label}: automatic DialogueView portrait overlaid the tableau.`);
  const cardWidthLimit = metrics.layout === 'DIALOGUE_BOTTOM_BAND_RESERVED' ? 0.55 : 0.46;
  if (metrics.card?.visible && metrics.card.widthRatio > cardWidthLimit) throw new Error(`${label}: normal narrative card is too wide (${metrics.card.widthRatio}).`);
  if (metrics.card?.visible && ['auto', 'scroll'].includes(metrics.card.overflowY)) throw new Error(`${label}: normal narrative card enables scrolling.`);
  if (metrics.card?.visible && metrics.card.contentOverflow) throw new Error(`${label}: normal narrative card content exceeds its reserved bounds.`);
  if (metrics.overflowX || metrics.overflowY) throw new Error(`${label}: page overflow detected.`);
  if (metrics.modalOwners > 1) throw new Error(`${label}: multiple modal owners detected.`);
  if (metrics.choices.some((choice) => !choice.visible)) throw new Error(`${label}: an authored choice is inaccessible.`);
  if (metrics.choices.length && metrics.card?.visible) throw new Error(`${label}: active choices retained a visible speaker card.`);
  if (metrics.choices.length && metrics.agencyState !== 'ACTIVE') throw new Error(`${label}: choices are visible outside the declared ACTIVE agency state.`);
}

function assertProfile(metrics, label, layout, placement) {
  if (metrics.layout !== layout || metrics.placement !== placement) {
    throw new Error(`${label}: expected ${layout}/${placement}, received ${metrics.layout}/${metrics.placement}.`);
  }
}

async function installSave(page, path) {
  await page.goto(qaUrl(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (nodePath) => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { enterRunNode } = await import('/src/game/runSystem.ts');
    const state = createInitialState();
    state.resolvedNodeIds.push('lion-camp');
    for (const id of nodePath) {
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
  }, path);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function startChronicle(page, viewport) {
  await page.goto(qaUrl(), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Nouvelle chronique' }).click();
  await page.locator('[data-prologue-skip]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-prologue-skip]').click();
  await page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  const revealStability = await auditRevealStability(page, 'opening-company');
  const openingCapture = await capture(page, viewport, '00-opening-company-cast');
  const openingMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(openingMetrics, 'opening-company');
  assertProfile(openingMetrics, 'opening-company', 'INTRO_CAST_PRESENTATION', 'TOP_CENTER');
  const openingCast = await page.locator('.narrative-stage').evaluate((stage) => {
    const actors = [...stage.querySelectorAll('.narrative-cast__actor')];
    const first = actors[0];
    if (first instanceof HTMLElement) first.dataset.qaStableActor = 'opening';
    return {
      ownership: stage.getAttribute('data-narrative-cast-ownership'),
      actorIds: actors.map((actor) => actor.getAttribute('data-actor-id')),
      active: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'ACTIVE').length,
      listeners: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'LISTENING').length,
    };
  });
  if (openingCast.ownership !== 'STAGE_OWNS_CAST' || openingCast.actorIds.length < 6 || openingCast.active !== 1 || openingCast.listeners < 5) {
    throw new Error(`Opening company cast is incomplete: ${JSON.stringify(openingCast)}`);
  }
  await page.locator('.dialogue__box').click();
  await page.waitForTimeout(40);
  const actorNodeStable = await page.locator('.narrative-stage').evaluate((stage) => Boolean(stage.querySelector('[data-qa-stable-actor="opening"]')));
  if (!actorNodeStable) throw new Error('Opening company cast was rebuilt for a speaker-only change.');
  await finishDialogue(page);
  await page.locator('[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"] .narrative-scene-surface').waitFor({ state: 'visible', timeout: 20_000 });
  return { capture: openingCapture, metrics: openingMetrics, revealStability, cast: openingCast, actorNodeStable };
}

async function runCoreCampaign(page, viewport) {
  const opening = await startChronicle(page, viewport);
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible' });
  const singleRoute = await capture(page, viewport, '08-single-route');
  const singleMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(singleMetrics, 'single-route');
  assertProfile(singleMetrics, 'single-route', 'CHOICE_SINGLE_ROUTE_CONTINUE', 'LOWER_RIGHT');
  await page.locator('[data-journey-continue]').click();

  await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 20_000 });
  const audience = {};
  audience.alaric = await capture(page, viewport, '01-audience-alaric');
  audience.alaricMetrics = await sceneMetrics(page);
  assertProfile(audience.alaricMetrics, 'audience-alaric', 'DIALOGUE_SPEAKER_FOCUS', 'RIGHT');
  await advanceDialogueTo(page, '1b');
  audience.alistair = await capture(page, viewport, '02-audience-alistair');
  audience.alistairMetrics = await sceneMetrics(page);
  assertProfile(audience.alistairMetrics, 'audience-alistair', 'DIALOGUE_SPEAKER_FOCUS', 'LEFT');
  await advanceDialogueTo(page, '2');
  audience.seraphine = await capture(page, viewport, '03-audience-seraphine');
  audience.seraphineMetrics = await sceneMetrics(page);
  assertProfile(audience.seraphineMetrics, 'audience-seraphine', 'ADVISER_EXCHANGE', 'RIGHT');
  await advanceDialogueTo(page, '3');
  audience.maelor = await capture(page, viewport, '04-audience-maelor-setup');
  audience.maelorMetrics = await sceneMetrics(page);
  assertProfile(audience.maelorMetrics, 'audience-maelor-setup', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  if (audience.maelorMetrics.agencyState !== 'SETUP' || !audience.maelorMetrics.card?.visible || audience.maelorMetrics.choices.length) throw new Error('Audience choice setup is not isolated from active choices.');
  await page.locator('.dialogue__box').click();
  await page.locator('.dialogue-choice').first().waitFor({ state: 'visible' });
  audience.choice = await capture(page, viewport, '05-audience-choice');
  audience.choiceMetrics = await sceneMetrics(page);
  assertProfile(audience.choiceMetrics, 'audience-choice', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  for (const [label, metrics] of Object.entries(audience).filter(([, value]) => typeof value === 'object')) assertNarrativeMetrics(metrics, `audience-${label}`);
  await page.locator('.dialogue-choice:not([disabled])').first().click();
  await finishDialogue(page);

  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-journey-continue]').click();
  await page.locator('[data-narrative-tableau="FOREST_THREAT_TABLEAU"] .dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  const preCombat = await capture(page, viewport, '10-pre-combat-threat');
  const preCombatMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(preCombatMetrics, 'pre-combat');
  assertProfile(preCombatMetrics, 'pre-combat', 'DIALOGUE_BOTTOM_BAND_RESERVED', 'BOTTOM_CENTER');
  await finishDialogue(page);

  const combatFrame = page.locator('iframe.combat-frame');
  await combatFrame.waitFor({ state: 'attached', timeout: 40_000 });
  const combatDocument = page.frameLocator('iframe.combat-frame');
  const combatQa = combatDocument.locator('[data-qa="victory"]');
  await combatQa.waitFor({ state: 'visible', timeout: 40_000 });
  const tutorial = combatDocument.locator('#tutorial:not(.hidden)');
  if (await tutorial.count()) await tutorial.locator('[data-action="skip"]').click();
  const combat = await capture(page, viewport, '11-combat-only');
  const combatIsolation = {
    narrativeStages: await page.locator('.narrative-stage').count(),
    dialogues: await page.locator('.dialogue').count(),
    journeyOverlays: await page.locator('.journey-overlay').count(),
    combatFrames: await combatFrame.count(),
  };
  if (combatIsolation.narrativeStages || combatIsolation.dialogues || combatIsolation.journeyOverlays || combatIsolation.combatFrames !== 1) throw new Error('Combat isolation failed.');
  await combatQa.click();
  const resultAction = combatDocument.locator('#combat-result-action');
  await resultAction.waitFor({ state: 'visible', timeout: 20_000 });
  await resultAction.click();
  await combatFrame.waitFor({ state: 'detached', timeout: 20_000 });
  await page.locator('[data-narrative-tableau="FOREST_AFTERMATH_TABLEAU"] .dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  const postCombat = await capture(page, viewport, '12-post-combat-aftermath');
  const postCombatMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(postCombatMetrics, 'post-combat');
  assertProfile(postCombatMetrics, 'post-combat', 'DIALOGUE_SIDE_COMPACT', 'RIGHT');
  if (await page.locator('.travel-view').count()) throw new Error('TravelView appeared between combat and aftermath.');
  return { opening, singleRoute, singleMetrics, audience, preCombat, preCombatMetrics, combat, combatIsolation, postCombat, postCombatMetrics };
}

async function runEventsAndAte(page, viewport) {
  await installSave(page, ['lion-audience', 'lion-opening-ambush']);
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-journey-continue]').click();
  await page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  await advanceToChoice(page);
  const multiSpeaker = await capture(page, viewport, '06-event-multi-speaker-choice');
  const multiSpeakerMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(multiSpeakerMetrics, 'multi-speaker-event');
  assertProfile(multiSpeakerMetrics, 'multi-speaker-event', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  await finishDialogue(page, true);
  await page.locator('.dialogue[data-dialogue-sequence="ate_serpent_scout_report"]').waitFor({ state: 'visible', timeout: 20_000 });
  const nomadAte = await capture(page, viewport, '13-ate-contextual');
  const nomadAteMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(nomadAteMetrics, 'nomad-ate');
  await finishDialogue(page);
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-journey-continue]').click();
  await page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  await advanceToChoice(page);
  const refugee = await capture(page, viewport, '07-refugee-choice');
  const refugeeMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(refugeeMetrics, 'refugee-event');
  assertProfile(refugeeMetrics, 'refugee-event', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  await finishDialogue(page, true);
  await page.locator('.dialogue[data-dialogue-sequence="ate_village_fear"]').waitFor({ state: 'visible', timeout: 20_000 });
  const refugeeAte = await capture(page, viewport, '14-ate-refugees');
  const refugeeAteMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(refugeeAteMetrics, 'refugee-ate');
  return {
    multiSpeaker,
    multiSpeakerMetrics,
    refugee,
    refugeeMetrics,
    nomadAte,
    nomadAteMetrics,
    refugeeAte,
    refugeeAteMetrics,
  };
}

async function runValmirFork(page, viewport) {
  await installSave(page, [
    'lion-audience', 'lion-opening-ambush', 'lion-nomad-crossroads', 'lion-refugees',
    'lion-first-trial-event', 'lion-first-refuge', 'lion-reserve-trail', 'lion-valmir-road',
  ]);
  await page.locator('[data-narrative-tableau="VALMIR_FORK_TABLEAU"] .journey-overlay--branch').waitFor({ state: 'visible', timeout: 20_000 });
  const fork = await capture(page, viewport, '09-valmir-fork');
  const forkMetrics = await sceneMetrics(page);
  assertNarrativeMetrics(forkMetrics, 'valmir-fork');
  assertProfile(forkMetrics, 'valmir-fork', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  const routes = await page.locator('[data-journey-choice]').evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('data-journey-choice'),
    geography: element.parentElement?.getAttribute('data-route-geography'),
    label: element.textContent?.trim(),
  })));
  if (routes.length !== 2 || routes[0]?.geography !== 'LEFT' || routes[1]?.geography !== 'RIGHT') throw new Error('Valmir route geography is not spatially authoritative.');
  return { fork, forkMetrics, routes };
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
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    try {
      const campaign = await runCoreCampaign(page, viewport);
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      const events = await runEventsAndAte(page, viewport);
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      const fork = await runValmirFork(page, viewport);
      results.push({ viewport, campaign, events, fork, consoleErrors, pageErrors, pass: true });
    } catch (error) {
      failed = true;
      results.push({ viewport, consoleErrors, pageErrors, pass: false, error: error instanceof Error ? error.stack : String(error) });
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
