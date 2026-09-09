import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN67_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN67_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin67/browser-qa'));
const ALL_VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
];
const VIEWPORTS = process.env.CIN67_VIEWPORT
  ? ALL_VIEWPORTS.filter(({ width, height }) => `${width}x${height}` === process.env.CIN67_VIEWPORT)
  : ALL_VIEWPORTS;

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

async function finishDialogueChainToJourney(page) {
  for (let sequenceCount = 0; sequenceCount < 8; sequenceCount += 1) {
    const nextSurface = await Promise.race([
      page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'journey'),
      page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'dialogue'),
    ]);
    if (nextSurface === 'journey') return;
    await finishDialogue(page);
  }
  throw new Error('Narrative follow-up chain did not settle.');
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

async function auditRevealStability(page, label) {
  const samples = await page.locator('.dialogue__box').evaluate((card) => new Promise((resolveAudit) => {
    const values = [];
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
      values.push({ width: rect.width, height: rect.height, scrollHeight: card.scrollHeight, clientHeight: card.clientHeight, finalLength, revealLength, contentOverflow });
      if ((finalLength > 0 && revealLength >= finalLength) || performance.now() - started > 4_000) resolveAudit(values);
      else window.setTimeout(sample, 16);
    };
    sample();
  }));
  const widthDelta = Math.max(...samples.map((sample) => sample.width)) - Math.min(...samples.map((sample) => sample.width));
  const heightDelta = Math.max(...samples.map((sample) => sample.height)) - Math.min(...samples.map((sample) => sample.height));
  const scrollViolations = samples.filter((sample) => sample.contentOverflow).length;
  if (widthDelta > 1 || heightDelta > 1) throw new Error(`${label}: progressive text shifted card geometry by ${widthDelta}x${heightDelta}px.`);
  if (scrollViolations) throw new Error(`${label}: progressive text produced ${scrollViolations} scrolling samples.`);
  return { sampleCount: samples.length, widthDelta, heightDelta, scrollViolations, completedReveal: samples.at(-1)?.revealLength === samples.at(-1)?.finalLength };
}

async function installStartupSampler(page) {
  await page.evaluate(() => {
    const samples = [];
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const stage = document.querySelector('.narrative-stage');
      if (!(stage instanceof HTMLElement)) {
        samples.push({ at: performance.now(), readiness: 'NO_STAGE', shieldVisible: false, dialogueActive: false, choiceActive: false });
        return;
      }
      const shield = stage.querySelector('.narrative-media-transition');
      const shieldVisible = shield instanceof HTMLElement
        && getComputedStyle(shield).display !== 'none'
        && Number(getComputedStyle(shield).opacity) > 0.05;
      const readiness = stage.dataset.narrativeSurfaceReadiness ?? '';
      samples.push({
        at: performance.now(),
        readiness,
        shieldVisible,
        dialogueActive: Boolean(stage.querySelector('.dialogue:not([inert])')),
        choiceActive: Boolean(stage.querySelector('.dialogue-choice:not([disabled])')),
      });
      if (performance.now() - startedAt > 12_000) window.clearInterval(timer);
    }, 16);
    window.__cin671StartupSampler = { samples, timer };
  });
}

async function readStartupDiagnostics(page, scope) {
  return page.locator(scope).evaluate((stage) => {
    const sampler = window.__cin671StartupSampler;
    if (sampler) window.clearInterval(sampler.timer);
    const samples = sampler?.samples ?? [];
    const timeline = JSON.parse(stage.getAttribute('data-narrative-media-timeline') ?? '[]');
    const eventTime = Object.fromEntries(timeline.map((entry) => [entry.event, entry.at]));
    return {
      timeline,
      firstCanvasDraw: eventTime.FIRST_CANVAS_DRAW,
      transitionReveal: eventTime.TRANSITION_REVEAL,
      firstDialogueActivation: eventTime.FIRST_DIALOGUE_ACTIVATION,
      blackExposureSamples: samples.filter((sample) => sample.readiness === 'PREPARING' && !sample.shieldVisible).length,
      noStageSamples: samples.filter((sample) => sample.readiness === 'NO_STAGE').length,
      dialogueDuringLoadingSamples: samples.filter((sample) => sample.readiness === 'PREPARING' && sample.dialogueActive).length,
      choiceDuringLoadingSamples: samples.filter((sample) => sample.readiness === 'PREPARING' && sample.choiceActive).length,
      sampleCount: samples.length,
    };
  });
}

function assertStartupDiagnostics(diagnostics, label) {
  if (!(diagnostics.firstCanvasDraw >= 0)) throw new Error(`${label}: no successful authoritative canvas draw was recorded.`);
  if (!(diagnostics.transitionReveal > diagnostics.firstCanvasDraw)) throw new Error(`${label}: transition revealed before the first canvas draw.`);
  if (!(diagnostics.firstDialogueActivation >= diagnostics.transitionReveal)) throw new Error(`${label}: dialogue activated before the prepared surface was revealed.`);
  if (diagnostics.blackExposureSamples) throw new Error(`${label}: transition shield exposed ${diagnostics.blackExposureSamples} preparing samples.`);
  if (diagnostics.noStageSamples) throw new Error(`${label}: ${diagnostics.noStageSamples} samples exposed no NarrativeStage between narrative surfaces.`);
  if (diagnostics.dialogueDuringLoadingSamples) throw new Error(`${label}: dialogue was active during media preparation.`);
  if (diagnostics.choiceDuringLoadingSamples) throw new Error(`${label}: a choice was active during media preparation.`);
}

async function installHandoffSampler(page) {
  await page.evaluate(() => {
    const samples = [];
    const timer = window.setInterval(() => {
      const stage = document.querySelector('.narrative-stage');
      const transition = document.querySelector('.scene-transition');
      const combat = document.querySelector('iframe.combat-frame');
      const transitionOpacity = transition instanceof HTMLElement ? Number(getComputedStyle(transition).opacity) : 0;
      const covered = transition instanceof HTMLElement && transitionOpacity > 0.05;
      samples.push({
        at: performance.now(),
        hasStage: stage instanceof HTMLElement,
        hasCombat: combat instanceof HTMLElement,
        covered,
        staleInteraction: transition instanceof HTMLElement
          && stage instanceof HTMLElement
          && stage.getAttribute('data-narrative-interaction') !== 'LOCKED',
      });
    }, 16);
    window.__cin671HandoffSampler = { samples, timer };
  });
}

async function readHandoffDiagnostics(page) {
  return page.evaluate(() => {
    const sampler = window.__cin671HandoffSampler;
    if (sampler) window.clearInterval(sampler.timer);
    const samples = sampler?.samples ?? [];
    return {
      sampleCount: samples.length,
      uncoveredSamples: samples.filter((sample) => !sample.hasStage && !sample.hasCombat && !sample.covered).length,
      staleInteractionSamples: samples.filter((sample) => sample.staleInteraction).length,
    };
  });
}

function assertHandoffDiagnostics(diagnostics, label) {
  if (!diagnostics.sampleCount) throw new Error(`${label}: no real-time handoff samples were captured.`);
  if (diagnostics.uncoveredSamples) throw new Error(`${label}: ${diagnostics.uncoveredSamples} samples had no visible surface or covering transition.`);
  if (diagnostics.staleInteractionSamples) throw new Error(`${label}: stale narrative interaction remained enabled under transition.`);
}

async function videoCompositionMetrics(page, scope) {
  return page.locator(scope).evaluate((stage) => ({
    mediaMode: stage.getAttribute('data-narrative-authoring-media'),
    surfaceKind: stage.getAttribute('data-narrative-media-surface'),
    staticCast: stage.querySelectorAll('.narrative-cast__actor').length,
    automaticPortraits: stage.querySelectorAll('.dialogue__portrait.is-visible').length,
    strategy: stage.getAttribute('data-narrative-presentation-strategy'),
  }));
}

function assertNoVideoCastDuplication(metrics, label) {
  if (metrics.mediaMode !== 'VIDEO') throw new Error(`${label}: explicit video authoring mode was not selected.`);
  if (metrics.staticCast !== 0 || metrics.automaticPortraits !== 0) {
    throw new Error(`${label}: runtime cast duplicated characters over moving or held video.`);
  }
}

async function layoutMetrics(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const dialogue = element.querySelector('.dialogue');
    const card = element.querySelector('.dialogue__box');
    const cardRect = card?.getBoundingClientRect();
    const cardStyle = card ? getComputedStyle(card) : null;
    const cardContentOverflow = card && cardRect ? [...card.querySelectorAll('.dialogue__speaker-block,.dialogue__text,.dialogue__outcomes')]
      .filter((child) => child instanceof HTMLElement && !child.hidden && getComputedStyle(child).display !== 'none')
      .some((child) => {
        const childRect = child.getBoundingClientRect();
        return childRect.top < cardRect.top - 1 || childRect.bottom > cardRect.bottom + 1;
      }) : false;
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
      layout: dialogue?.getAttribute('data-narrative-layout') ?? element.getAttribute('data-narrative-layout-profile'),
      placement: dialogue?.getAttribute('data-narrative-placement') ?? element.getAttribute('data-narrative-layout-placement'),
      agencyState: dialogue?.getAttribute('data-narrative-agency-state') ?? 'NONE',
      speakerCardPolicy: dialogue?.getAttribute('data-narrative-speaker-card-policy') ?? 'NONE',
      card: cardRect ? {
        visible: cardStyle?.display !== 'none' && cardRect.width > 0 && cardRect.height > 0,
        hidden: card instanceof HTMLElement ? card.hidden : false,
        widthRatio: cardRect.width / innerWidth,
        overflowY: cardStyle?.overflowY,
        scrollHeight: card instanceof HTMLElement ? card.scrollHeight : 0,
        clientHeight: card instanceof HTMLElement ? card.clientHeight : 0,
        contentOverflow: cardContentOverflow,
      } : null,
      choiceCount: element.querySelectorAll('.dialogue-choice').length,
      buttons,
    };
  });
}

function assertLayoutProfile(metrics, label, layout, placement) {
  if (metrics.layout !== layout || metrics.placement !== placement) throw new Error(`${label}: expected ${layout}/${placement}, received ${metrics.layout}/${metrics.placement}.`);
  if (metrics.bodyOverflowX || metrics.bodyOverflowY) throw new Error(`${label}: page overflow detected.`);
  if (metrics.card?.visible && (['auto', 'scroll'].includes(metrics.card.overflowY) || metrics.card.contentOverflow)) throw new Error(`${label}: dialogue card scrolls or clips its reserved content.`);
  const cardWidthLimit = metrics.layout === 'DIALOGUE_BOTTOM_BAND_RESERVED' ? 0.55 : 0.46;
  if (metrics.card?.visible && metrics.card.widthRatio > cardWidthLimit) throw new Error(`${label}: dialogue card fell back to full width.`);
  if (metrics.choiceCount && (metrics.card?.visible || metrics.agencyState !== 'ACTIVE')) throw new Error(`${label}: active choices retained a speaker card or invalid agency state.`);
}

async function startChronicle(page, viewport) {
  await page.goto(`${BASE_URL}/?presentation=narrative&media=video&qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Nouvelle chronique' }).click();
  await page.locator('[data-prologue-skip]').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('[data-prologue-skip]').click();
  await page.locator('.dialogue').waitFor({ state: 'visible', timeout: 20_000 });
  const revealStability = await auditRevealStability(page, 'video-opening-company');
  await page.waitForTimeout(350);
  const openingCapture = await capture(page, viewport, '00-opening-company-static-cast');
  const opening = await page.locator('.narrative-stage').evaluate((stage) => {
    const actors = [...stage.querySelectorAll('.narrative-cast__actor')];
    const firstActor = actors[0];
    if (firstActor instanceof HTMLElement) firstActor.dataset.qaStableActor = 'opening';
    return {
      surfaceKind: stage.getAttribute('data-narrative-media-surface'),
      castOwnership: stage.getAttribute('data-narrative-cast-ownership'),
      actorIds: actors.map((actor) => actor.getAttribute('data-actor-id')),
      active: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'ACTIVE').length,
      listeners: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'LISTENING').length,
      layout: stage.querySelector('.dialogue')?.getAttribute('data-narrative-layout'),
      placement: stage.querySelector('.dialogue')?.getAttribute('data-narrative-placement'),
    };
  });
  if (opening.castOwnership !== 'STAGE_OWNS_CAST' || opening.actorIds.length < 6 || opening.active !== 1 || opening.listeners < 5) {
    throw new Error(`Opening company tableau did not preserve its full stable cast: ${JSON.stringify(opening)}`);
  }
  if (opening.layout !== 'INTRO_CAST_PRESENTATION' || opening.placement !== 'TOP_CENTER') throw new Error(`Video opening used ${opening.layout}/${opening.placement}.`);
  await page.locator('.dialogue__box').click();
  await page.waitForTimeout(50);
  const actorNodeStable = await page.locator('.narrative-stage').evaluate((stage) => Boolean(stage.querySelector('[data-qa-stable-actor="opening"]')));
  if (!actorNodeStable) throw new Error('Opening company speaker change rebuilt the full cast.');
  await finishDialogue(page);
  await page.locator('[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"] .cinematic-overlay').waitFor({ state: 'attached', timeout: 30_000 });
  return { ...opening, revealStability, actorNodeStable, capture: openingCapture };
}

async function runCampaignRoundTrip(page, viewport) {
  const opening = await startChronicle(page, viewport);
  const campMotion = await sampleMotion(page, '[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"]');
  await page.locator('[data-narrative-tableau="CAMP_DEPARTURE_TABLEAU"] .cinematic-overlay__skip').click();
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible' });
  const singleRoute = await capture(page, viewport, '03-single-route');
  const singleMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(singleMetrics, 'video-single-route', 'CHOICE_SINGLE_ROUTE_CONTINUE', 'LOWER_RIGHT');
  await installStartupSampler(page);
  await page.locator('[data-journey-continue]').click();

  const audienceTransition = page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .narrative-media-transition');
  await audienceTransition.waitFor({ state: 'attached', timeout: 10_000 });
  const audienceTransitionCapture = await capture(page, viewport, '00-audience-media-transition');
  await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .dialogue--speaker-card[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 30_000 });
  const audienceStartup = await readStartupDiagnostics(page, '[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"]');
  assertStartupDiagnostics(audienceStartup, 'audience-startup');
  const audienceMotion = await sampleMotion(page, '[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"]');
  const audienceMovingComposition = await videoCompositionMetrics(page, '[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"]');
  assertNoVideoCastDuplication(audienceMovingComposition, 'audience-moving');
  const audienceMoving = await capture(page, viewport, '01-audience-moving-speaker');
  const audienceMovingMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(audienceMovingMetrics, 'video-audience-moving', 'DIALOGUE_SPEAKER_FOCUS', 'RIGHT');
  await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .cinematic-overlay__skip').click();
  await advanceDialogueTo(page, '1a');
  const heldDialogueMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(heldDialogueMetrics, 'video-held-dialogue', 'HELD_VIDEO_DIALOGUE', 'LEFT');
  await advanceDialogueTo(page, '3');
  const choiceSetupMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(choiceSetupMetrics, 'video-audience-choice-setup', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  if (choiceSetupMetrics.agencyState !== 'SETUP' || !choiceSetupMetrics.card?.visible || choiceSetupMetrics.choiceCount) throw new Error('Video audience choice setup is not isolated.');
  await page.locator('.dialogue__box').click();
  await page.locator('.dialogue--spatial-choice .dialogue-choice').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(350);
  const audienceHeld = await capture(page, viewport, '02-audience-held-interactive');
  const audienceMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(audienceMetrics, 'video-audience-choice', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
  const audienceSurface = await page.locator('[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"] .cinematic-overlay').getAttribute('data-cinematic-freeze-surface');
  const audienceHeldComposition = await videoCompositionMetrics(page, '[data-narrative-tableau="ALARIC_AUDIENCE_TABLEAU"]');
  assertNoVideoCastDuplication(audienceHeldComposition, 'audience-held');
  const audienceModalOwners = await page.locator('[aria-modal="true"]').count();
  await page.locator('.dialogue--spatial-choice .dialogue-choice:not([disabled])').first().click();
  await page.locator('.dialogue[data-dialogue-step="4"] .dialogue__box').click();
  await page.locator('.journey-overlay--single').waitFor({ state: 'visible', timeout: 30_000 });
  await installStartupSampler(page);
  await page.locator('[data-journey-continue]').click();

  await page.locator('[data-narrative-tableau="FOREST_THREAT_TABLEAU"] .dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 30_000 });
  const forestStartup = await readStartupDiagnostics(page, '[data-narrative-tableau="FOREST_THREAT_TABLEAU"]');
  assertStartupDiagnostics(forestStartup, 'forest-startup');
  const forestComposition = await videoCompositionMetrics(page, '[data-narrative-tableau="FOREST_THREAT_TABLEAU"]');
  assertNoVideoCastDuplication(forestComposition, 'forest-moving');
  if (forestComposition.strategy !== 'OFFSCREEN_CONTEXTUAL') throw new Error('Forest video mismatch did not use explicit offscreen staging.');
  const forestDialogueMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(forestDialogueMetrics, 'video-pre-combat', 'DIALOGUE_BOTTOM_BAND_RESERVED', 'BOTTOM_CENTER');
  await page.locator('[data-narrative-tableau="FOREST_THREAT_TABLEAU"] .cinematic-overlay__skip').click();
  await installHandoffSampler(page);
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
  const narrativeToCombat = await readHandoffDiagnostics(page);
  assertHandoffDiagnostics(narrativeToCombat, 'narrative-to-combat');
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
  await installHandoffSampler(page);
  await resultAction.click();
  await combatFrame.waitFor({ state: 'detached', timeout: 20_000 });
  await page.locator('[data-narrative-tableau="FOREST_AFTERMATH_TABLEAU"] .dialogue[data-dialogue-step="1"]').waitFor({ state: 'visible', timeout: 20_000 });
  const combatToNarrative = await readHandoffDiagnostics(page);
  assertHandoffDiagnostics(combatToNarrative, 'combat-to-narrative');
  const postCombat = await capture(page, viewport, '06-post-combat-narrative');
  const postCombatMetrics = await layoutMetrics(page, '.narrative-stage');
  assertLayoutProfile(postCombatMetrics, 'video-post-combat', 'DIALOGUE_SIDE_COMPACT', 'RIGHT');
  const postCombatIsolation = {
    travelViews: await page.locator('.travel-view').count(),
    journeyOverlays: await page.locator('.journey-overlay').count(),
    combatFrames: await page.locator('iframe.combat-frame').count(),
    narrativeStages: await page.locator('.narrative-stage').count(),
    dialogueStep: await page.locator('.dialogue').getAttribute('data-dialogue-step'),
  };
  await finishDialogueChainToJourney(page);
  const nextLabel = await page.locator('.journey-overlay__title').textContent();

  return {
    opening,
    motion: { camp: campMotion, audience: audienceMotion },
    captures: { audienceTransition: audienceTransitionCapture, audienceMoving, audienceHeld, singleRoute, combat, postCombat },
    metrics: { audience: audienceMetrics, audienceMoving: audienceMovingMetrics, heldDialogue: heldDialogueMetrics, choiceSetup: choiceSetupMetrics, singleRoute: singleMetrics, postCombat: postCombatMetrics },
    audience: { heldSurface: audienceSurface, modalOwners: audienceModalOwners, movingComposition: audienceMovingComposition, heldComposition: audienceHeldComposition },
    startup: { audience: audienceStartup, forest: forestStartup },
    handoffs: { narrativeToCombat, combatToNarrative },
    forestComposition,
    combatIsolation,
    postCombatIsolation,
    nextLabel,
  };
}

async function installValmirSave(page) {
  await page.goto(`${BASE_URL}/?presentation=narrative&media=video`, { waitUntil: 'domcontentloaded' });
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
  assertLayoutProfile(metrics, 'video-valmir-fork', 'CHOICE_TWO_PATH_SPATIAL', 'SPATIAL');
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
