import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const PRODUCTION = process.argv.includes('--production');
const PRODUCTION_PORT = Number(process.env.CIN6D6_PORT ?? 5242);
const BASE_URL = process.env.CIN6D6_BASE_URL ?? (PRODUCTION ? `http://127.0.0.1:${PRODUCTION_PORT}` : 'http://127.0.0.1:5173');
const OUTPUT_DIR = resolve(process.env.CIN6D6_ROUTE_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin6d6/browser-qa/routes'));
const [viewportWidth, viewportHeight] = (process.env.CIN6D6_VIEWPORT ?? '1920x1080').split('x').map(Number);
const VIEWPORT = { width: viewportWidth, height: viewportHeight };
const SCENARIO_FILTER = process.env.CIN6D6_ROUTE_SCENARIO ?? '';
const CIN8_GROUP = process.env.CIN6D6_ROUTE_GROUP === 'cin8';
const REDUCED_MOTION = process.env.CIN6D6_REDUCED_MOTION === '1';
const BLOCK_MEDIA = process.env.CIN6D6_BLOCK_MEDIA === '1';
let productionModels;
if (PRODUCTION) {
  const models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  productionModels = { ...await models.ssrLoadModule('/src/game/store.ts'), ...await models.ssrLoadModule('/src/game/runSystem.ts') };
  await models.close();
}

async function installHooks(page) {
  if (PRODUCTION) await page.route('**/assets/game-*.js', async (route) => {
    const response = await route.fetch(), source = await response.text();
    const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
    if (!pattern.test(source)) throw new Error('Built bootstrap hook missing');
    // Browser-response fixture only, matching the established T3 production driver. The dist
    // bytes and production gate stay unchanged; only expose the instance for a combat result.
    await route.fulfill({ response, body: source.replace(pattern, (match, name) =>
      match.replace(';window.addEventListener', `;window.__cin8App=${name};window.addEventListener`)) });
  });
  if (BLOCK_MEDIA) await page.route('**/assets/cinematics/*.mp4', (route) => route.abort('failed'));
}

function diagnosticsFor(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[VFX Preview]')
      && !(BLOCK_MEDIA && message.text().includes('net::ERR_FAILED'))) diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
  return diagnostics;
}

function isExpectedMediaFailure(failure) {
  return /\.mp4 net::ERR_ABORTED$/.test(failure)
    || (BLOCK_MEDIA && /\/assets\/cinematics\/[^/]+\.mp4 net::ERR_FAILED$/.test(failure));
}

async function installNodeSave(page, nodeId, flags = {}, reputation = 60, seed = 6101) {
  if (PRODUCTION) {
    const state = productionModels.createInitialState();
    state.run = productionModels.createRunState(seed);
    state.currentNodeId = state.run.currentNodeId;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.flags.prologueSeen = true;
    state.settings.reducedGraphics = REDUCED_MOTION;
    Object.assign(state.flags, flags); state.reputation = reputation;
    const nodes = new Map(state.run.graph.nodes.map((node) => [node.id, node]));
    const previous = new Map([[state.run.currentNodeId, null]]), queue = [state.run.currentNodeId];
    // Find the fixture path with the same authored graph as the DEV driver.
    while (queue.length && !previous.has(nodeId)) {
      const current = queue.shift();
      for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
    }
    if (!previous.has(nodeId)) throw new Error(`No run path to ${nodeId}`);
    const path = []; for (let id = nodeId; id; id = previous.get(id)) path.unshift(id);
    for (const id of path.slice(1)) {
      state.resolvedNodeIds.push(state.currentNodeId);
      if (!productionModels.enterRunNode(state.run, id)) throw new Error(`Could not enter ${id}`);
      state.currentNodeId = id; state.visitedNodeIds = [...state.run.visitedNodeIds]; state.stepCounter++;
    }
    await page.goto(`${BASE_URL}/?presentation=narrative&media=video`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((fixture) => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(fixture)), state);
    await page.reload({ waitUntil: 'domcontentloaded' });
    return;
  }
  await page.goto(`${BASE_URL}/?presentation=narrative&media=video&qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ nodeId: targetId, flags: targetFlags, reputation: targetReputation, seed: targetSeed, reducedMotion }) => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { createRunState, enterRunNode } = await import('/src/game/runSystem.ts');
    const state = createInitialState();
    state.run = createRunState(targetSeed);
    state.currentNodeId = state.run.currentNodeId;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.flags.prologueSeen = true;
    state.settings.reducedGraphics = reducedMotion;
    Object.assign(state.flags, targetFlags);
    state.reputation = targetReputation;

    const nodes = new Map(state.run.graph.nodes.map((node) => [node.id, node]));
    const queue = [state.run.currentNodeId];
    const previous = new Map([[state.run.currentNodeId, null]]);
    while (queue.length && !previous.has(targetId)) {
      const currentId = queue.shift();
      for (const nextId of nodes.get(currentId)?.links ?? []) {
        if (previous.has(nextId)) continue;
        previous.set(nextId, currentId);
        queue.push(nextId);
      }
    }
    if (!previous.has(targetId)) throw new Error(`No run path to ${targetId}`);
    const path = [];
    for (let cursor = targetId; cursor; cursor = previous.get(cursor)) path.unshift(cursor);
    for (const id of path.slice(1)) {
      if (!state.resolvedNodeIds.includes(state.currentNodeId)) state.resolvedNodeIds.push(state.currentNodeId);
      const entered = enterRunNode(state.run, id);
      if (!entered) throw new Error(`Could not enter ${id}`);
      state.currentNodeId = entered.id;
      state.visitedNodeIds = [...state.run.visitedNodeIds];
      state.stepCounter += 1;
    }
    state.resolvedNodeIds = state.resolvedNodeIds.filter((id) => id !== targetId);
    new SaveRepository().saveAuto(state);
  }, { nodeId, flags, reputation, seed, reducedMotion: REDUCED_MOTION });
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function continueSavedNode(page) {
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function recordVideo(page, trace) {
  if (!trace) return;
  const video = page.locator('.narrative-stage video').first();
  if (!await video.count()) return;
  const src = await video.evaluate((element) => element.currentSrc || element.querySelector('source')?.src).catch(() => null);
  if (src) trace.media.add(src.split('/').at(-1)?.replace('.mp4', '') ?? src);
}

async function waitForDialogueSequence(page, sequenceId, trace) {
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${sequenceId}"]`);
  for (let index = 0; index < 720; index += 1) {
    await recordVideo(page, trace);
    if (await dialogue.isVisible().catch(() => false)) return dialogue;
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (!BLOCK_MEDIA && await skip.count()) await skip.evaluate((button) => button.click());
    else await page.waitForTimeout(75);
  }
  throw new Error(`${sequenceId}: dialogue did not become visible after its presentation lead-in.`);
}

async function readPresentation(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.narrative-stage');
    if (!(stage instanceof HTMLElement)) return null;
    return {
      mode: stage.dataset.presentationMode ?? null,
      beat: stage.dataset.presentationBeat ?? null,
      visualFamily: stage.dataset.visualFamily ?? null,
      fallbackActive: stage.dataset.fallbackActive ?? null,
      castOwnership: stage.dataset.narrativeCastOwnership ?? null,
      staticActors: stage.querySelectorAll('.narrative-cast__actor').length,
      primarySurfaces: stage.querySelectorAll(':scope [data-narrative-layer="media"] > .narrative-media-surface, :scope [data-narrative-layer="media"] > .cinematic-overlay').length,
      primaryInvariant: stage.dataset.primarySurfaceInvariant ?? null,
      dialogueSequence: stage.querySelector('.dialogue')?.getAttribute('data-dialogue-sequence') ?? null,
      surface: stage.dataset.narrativeMediaSurface ?? null,
      dialogueStepsOnHold: stage.dataset.dialogueStepsOnHold ?? null,
      choiceStepsOnHold: stage.dataset.choiceStepsOnHold ?? null,
      movingMedia: stage.querySelectorAll('.cinematic-overlay:not(.cinematic-overlay--frozen)').length,
    };
  });
}

async function finishDialogue(page, sequenceId, choiceIndex = 0, trace = undefined) {
  const dialogue = await waitForDialogueSequence(page, sequenceId, trace);
  let usedChoice = false;
  for (let index = 0; index < 100; index += 1) {
    if (!await dialogue.count()) return;
    trace?.dialogues.add(sequenceId);
    const video = page.locator('.narrative-stage video').first();
    if (await video.count()) {
      const src = await video.evaluate((element) => element.currentSrc);
      if (src) trace?.media.add(src.split('/').at(-1)?.replace('.mp4', '') ?? src);
    }
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (!BLOCK_MEDIA && await skip.count()) {
      await skip.evaluate((button) => button.click());
      await page.waitForTimeout(50);
      continue;
    }
    const choices = dialogue.locator('.dialogue-choice:not([disabled]):visible');
    if (await choices.count()) {
      const bounds = await choices.evaluateAll((buttons) => buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { label: button.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          withinViewport: rect.x >= -1 && rect.y >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1 };
      }));
      if (bounds.some((button) => !button.withinViewport)) throw new Error(`${sequenceId}: choice outside viewport ${JSON.stringify(bounds)}`);
      const selected = choices.nth(usedChoice ? 0 : Math.min(choiceIndex, (await choices.count()) - 1));
      await selected.focus();
      if (!await selected.evaluate((button) => button === document.activeElement)) throw new Error('Choice keyboard focus failed');
      trace?.choiceBounds?.push({ sequenceId, stepId: await dialogue.getAttribute('data-dialogue-step'), bounds, keyboardActivation: true });
      await page.keyboard.press('Enter');
      usedChoice = true;
    } else {
      await dialogue.locator('.dialogue__box').click({ force: true });
    }
    await page.waitForTimeout(55);
  }
  throw new Error(`${sequenceId}: dialogue did not complete.`);
}

async function finishCurrentDialogue(page, trace) {
  const dialogue = page.locator('.dialogue').first();
  const sequenceId = await dialogue.getAttribute('data-dialogue-sequence');
  if (!sequenceId) throw new Error('Visible dialogue has no sequence id.');
  await finishDialogue(page, sequenceId, 0, trace);
}

async function waitForBoundaryOrCombat(page, trace) {
  for (let index = 0; index < 720; index += 1) {
    await recordVideo(page, trace);
    if (await page.locator('iframe.combat-frame').count()) return 'combat';
    const journey = page.locator('.journey-overlay:visible').first();
    if (await journey.count()) return 'journey';
    const dialogue = page.locator('.dialogue:visible').first();
    if (await dialogue.count()) {
      await finishCurrentDialogue(page, trace);
      continue;
    }
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (!BLOCK_MEDIA && await skip.count()) {
      const src = await page.locator('.narrative-stage video').first().evaluate((element) => element.currentSrc).catch(() => null);
      if (src) trace.media.add(src.split('/').at(-1)?.replace('.mp4', '') ?? src);
      await skip.evaluate((button) => button.click());
      continue;
    }
    await page.waitForTimeout(75);
  }
  throw new Error('Flow did not reach a Journey boundary or combat.');
}

async function winCombat(page, trace) {
  const frame = page.locator('iframe.combat-frame');
  await frame.waitFor({ state: 'attached', timeout: 40_000 });
  const combat = page.frameLocator('iframe.combat-frame');
  if (PRODUCTION) {
    // Attachment precedes iframe navigation, especially with reduced-motion transitions.
    await page.waitForFunction(() => document.querySelector('iframe.combat-frame')?.contentWindow?.__BOOTED === true,
      null, { timeout: 40000 });
    const actualFrame = await (await frame.elementHandle()).contentFrame();
    if (!actualFrame) throw new Error('Real combat frame missing');
    await actualFrame.evaluate(() => {
      const session = window.parent.__cin8App.combat.session;
      if (!session) throw new Error('Combat session missing');
      window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: true, combatId: session.config.id,
        inventory: session.inventory, participants: session.preferredUnitIds,
        unitHealth: Object.fromEntries(session.clan.map((unit) => [unit.id, unit.currentHealth])) }, location.origin);
    });
    trace.combats += 1;
    await frame.waitFor({ state: 'detached', timeout: 20000 });
    return;
  }
  const victory = combat.locator('[data-qa="victory"]');
  await victory.waitFor({ state: 'visible', timeout: 40_000 });
  const tutorial = combat.locator('#tutorial:not(.hidden)');
  if (await tutorial.count()) await tutorial.locator('[data-action="skip"]').click();
  const bossTutorial = combat.locator('#boss-tutorial:not(.hidden)');
  if (await bossTutorial.count()) await bossTutorial.locator('[data-action="start"]').click();
  trace.combats += 1;
  await victory.click();
  const action = combat.locator('#combat-result-action');
  await action.waitFor({ state: 'visible', timeout: 20_000 });
  if (await bossTutorial.count()) await bossTutorial.locator('[data-action="start"]').click();
  await action.click();
  await frame.waitFor({ state: 'detached', timeout: 20_000 });
}

async function loadSavedTruth(page) {
  return page.evaluate(async (production) => {
    const state = production ? JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6'))
      : new (await import('/src/game/store.ts')).SaveRepository().loadAuto();
    return state ? {
      currentNodeId: state.currentNodeId,
      resolvedNodeIds: state.resolvedNodeIds,
      flags: state.flags,
      endingId: state.endingId,
      memberDefinitions: state.clan.members.map((member) => member.definitionId),
    } : null;
  }, PRODUCTION);
}

async function checkResolvedResume(page) {
  const before = await loadSavedTruth(page);
  const replayed = [];
  const observer = (request) => { if (/\/assets\/cinematics\/[^/]+\.mp4/.test(request.url())) replayed.push(request.url()); };
  page.on('request', observer);
  try {
    await page.reload({ waitUntil: 'networkidle' });
    await continueSavedNode(page);
    // Resume settles via the existing coordinator; no QA victory or route click is performed.
    await page.waitForTimeout(1500);
    const after = await loadSavedTruth(page);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Resolved-node resume changed canonical truth');
    if (replayed.length || await page.locator('iframe.combat-frame,.cinematic-overlay').count()) {
      throw new Error(`Resolved-node resume replayed media/combat: ${JSON.stringify(replayed)}`);
    }
    return { truthUnchanged: true, currentNodeId: after.currentNodeId, endingId: after.endingId,
      replayedVideos: replayed, combatFrames: 0, overlays: 0 };
  } finally { page.off('request', observer); }
}

function assertDialogueTableau(stage, label) {
  // The registry retains historical HOLD beat metadata; current dialogue segments explicitly
  // transfer to STATIC_TABLEAU before enabling dialogue. Assert the active surface and owner.
  if (!stage || stage.surface !== 'STATIC_TABLEAU' || stage.castOwnership !== 'STAGE_OWNS_CAST'
    || stage.staticActors < 1 || stage.staticActors > 4 || stage.primarySurfaces !== 1
    || stage.primaryInvariant === 'FAIL' || stage.movingMedia
    || stage.dialogueStepsOnHold !== '0' || stage.choiceStepsOnHold !== '0') {
    throw new Error(`${label}: invalid interactive tableau: ${JSON.stringify(stage)}.`);
  }
}

async function runNodeScenario(context, scenario) {
  const page = await context.newPage();
  await installHooks(page);
  const diagnostics = diagnosticsFor(page);
  const trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [] };
  try {
    await installNodeSave(page, scenario.nodeId, scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    await waitForDialogueSequence(page, scenario.dialogueId, trace);
    const initialPresentation = await readPresentation(page);
    const expectedMode = scenario.expectedMode ?? 'STATIC_TABLEAU';
    if (initialPresentation?.mode !== expectedMode) {
      throw new Error(`${scenario.id}: expected ${expectedMode}, got ${JSON.stringify(initialPresentation)}.`);
    }
    if (initialPresentation.primarySurfaces > 1 || initialPresentation.primaryInvariant === 'FAIL') {
      throw new Error(`${scenario.id}: multiple primary surfaces: ${JSON.stringify(initialPresentation)}.`);
    }
    assertDialogueTableau(initialPresentation, scenario.id);
    await finishDialogue(page, scenario.dialogueId, scenario.choiceIndex ?? 0, trace);
    let settled = await waitForBoundaryOrCombat(page, trace);
    if (settled === 'combat') {
      await winCombat(page, trace);
      settled = await waitForBoundaryOrCombat(page, trace);
    }
    const truth = await loadSavedTruth(page);
    const assertion = scenario.assertTruth(truth);
    if (!assertion) throw new Error(`${scenario.id}: saved truth assertion failed.`);
    const capture = `${scenario.id}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    let continuation = null;
    if (scenario.expectedNextNodeId) {
      if (settled !== 'journey') throw new Error(`${scenario.id}: direct handoff did not reach Journey.`);
      const available = PRODUCTION ? productionModels.getAvailableRunNodes(await page.evaluate(() => window.__cin8App.state)).map((node) => node.id)
        : await page.evaluate(async () => {
        const { SaveRepository } = await import('/src/game/store.ts');
        const { getAvailableRunNodes } = await import('/src/game/runSystem.ts');
        const state = new SaveRepository().loadAuto(); return state ? getAvailableRunNodes(state).map((node) => node.id) : [];
      });
      if (available.length !== 1 || available[0] !== scenario.expectedNextNodeId) {
        throw new Error(`${scenario.id}: expected only ${scenario.expectedNextNodeId}, got ${JSON.stringify(available)}.`);
      }
      await page.locator('[data-journey-continue]:visible').click();
      await page.locator(scenario.expectedArrivalSelector).waitFor({ state: 'visible', timeout: 40_000 });
      const traversalMounts = await page.locator('.traversal-t0').count();
      if (traversalMounts) throw new Error(`${scenario.id}: direct handoff mounted Traversal.`);
      const arrivalCapture = `${scenario.id}-arrival.png`;
      await page.screenshot({ path: resolve(OUTPUT_DIR, arrivalCapture), fullPage: false });
      continuation = { available, arrivalSurface: scenario.expectedArrivalSelector, traversalMounts, arrivalCapture };
    }
    const expectedAbortedMediaRequests = diagnostics.requestFailures.filter((failure) => /\.mp4 net::ERR_ABORTED$/.test(failure));
    const requestFailures = diagnostics.requestFailures.filter((failure) => !isExpectedMediaFailure(failure));
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || requestFailures.length) {
      throw new Error(`${scenario.id}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    const resume = await checkResolvedResume(page);
    return {
      id: scenario.id,
      nodeId: scenario.nodeId,
      settled,
      dialogues: [...trace.dialogues],
      media: [...trace.media],
      combats: trace.combats,
      choiceBounds: trace.choiceBounds,
      initialPresentation,
      truth: scenario.pickTruth(truth),
      capture,
      continuation,
      resume,
      diagnostics: { ...diagnostics, requestFailures },
      expectedAbortedMediaRequests: expectedAbortedMediaRequests.length,
      pass: true,
    };
  } finally {
    await page.close();
  }
}

async function runFinaleScenario(context, scenario) {
  const page = await context.newPage();
  await installHooks(page);
  const diagnostics = diagnosticsFor(page);
  const trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [] };
  try {
    await installNodeSave(page, 'lion-final-judgement', scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    await waitForDialogueSequence(page, 'lion_finale_judgement', trace);
    const judgementPresentation = await readPresentation(page);
    assertDialogueTableau(judgementPresentation, scenario.id);
    await finishDialogue(page, 'lion_finale_judgement', scenario.choiceIndex, trace);
    let settled = await waitForBoundaryOrCombat(page, trace);
    if (settled !== 'combat') throw new Error(`${scenario.id}: judgement did not reach combat.`);
    await winCombat(page, trace);
    for (let index = 0; index < 8; index += 1) {
      settled = await waitForBoundaryOrCombat(page, trace);
      if (settled === 'journey' && trace.dialogues.has('epilogue')) break;
      if (settled === 'journey') {
        const continueButton = page.locator('[data-journey-continue]:visible').first();
        if (await continueButton.count()) await continueButton.click();
        else break;
      }
      if (settled === 'combat') throw new Error(`${scenario.id}: unexpected second combat.`);
    }
    const truth = await loadSavedTruth(page);
    if (!scenario.assertTruth(truth) || !trace.dialogues.has('epilogue')) {
      throw new Error(`${scenario.id}: finale truth or epilogue assertion failed: ${JSON.stringify({ trace: [...trace.dialogues], truth })}`);
    }
    const expectedAbortedMediaRequests = diagnostics.requestFailures.filter((failure) => /\.mp4 net::ERR_ABORTED$/.test(failure));
    const requestFailures = diagnostics.requestFailures.filter((failure) => !isExpectedMediaFailure(failure));
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || requestFailures.length) {
      throw new Error(`${scenario.id}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    const capture = `${scenario.id}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    const resume = await checkResolvedResume(page);
    return {
      id: scenario.id,
      settled,
      dialogues: [...trace.dialogues],
      media: [...trace.media],
      combats: trace.combats,
      choiceBounds: trace.choiceBounds,
      judgementPresentation,
      truth: scenario.pickTruth(truth),
      capture,
      resume,
      diagnostics: { ...diagnostics, requestFailures },
      expectedAbortedMediaRequests: expectedAbortedMediaRequests.length,
      pass: true,
    };
  } finally {
    await page.close();
  }
}

async function runOpeningScenario(context) {
  const page = await context.newPage(); await installHooks(page);
  const diagnostics = diagnosticsFor(page), trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [] };
  try {
    await page.goto(`${BASE_URL}/?presentation=narrative&media=video`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-action="new"]').click();
    await page.locator('[data-prologue-skip]').waitFor({ state: 'visible' });
    if (REDUCED_MOTION) await page.evaluate(() => { window.__cin8App.state.settings.reducedGraphics = true; });
    await page.locator('[data-prologue-skip]').click();
    await finishDialogue(page, 'acte_ouverture', 0, trace);
    await waitForDialogueSequence(page, 'camp_departure', trace);
    const camp = await readPresentation(page); assertDialogueTableau(camp, 'opening camp');
    await page.screenshot({ path: resolve(OUTPUT_DIR, 'opening-camp.png') });
    await finishDialogue(page, 'camp_departure', 0, trace);
    if (await waitForBoundaryOrCombat(page, trace) !== 'journey') throw new Error('Opening departure boundary missing');
    await page.locator('[data-journey-continue]:visible').click();
    await waitForDialogueSequence(page, 'lion_briefing', trace);
    const audience = await readPresentation(page); assertDialogueTableau(audience, 'opening audience');
    await page.screenshot({ path: resolve(OUTPUT_DIR, 'opening-audience.png') });
    await finishDialogue(page, 'lion_briefing', 0, trace);
    if (await waitForBoundaryOrCombat(page, trace) !== 'journey') throw new Error('Audience route boundary missing');
    const truth = await loadSavedTruth(page);
    if (truth.flags.lionMissionAccepted !== true) throw new Error('Audience choice not owned by campaign truth');
    const resume = await checkResolvedResume(page);
    const unexpected = diagnostics.requestFailures.filter((failure) => !isExpectedMediaFailure(failure));
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || unexpected.length) throw new Error(`Opening diagnostics: ${JSON.stringify(diagnostics)}`);
    return { id: 'opening-camp-audience', camp, audience, dialogues: [...trace.dialogues], media: [...trace.media],
      truth: { lionMissionAccepted: true }, resume, choiceBounds: trace.choiceBounds,
      diagnostics: { ...diagnostics, requestFailures: unexpected }, pass: true };
  } finally { await page.close(); }
}

const nodeScenarios = [
  {
    id: 'cedric-recruit', nodeId: 'lion-nomad-crossroads', dialogueId: 'mystery_recruit', choiceIndex: 0,
    flags: { lionMissionAccepted: true, lionMandateHonour: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.recruitedCedric === true && truth.memberDefinitions.includes('rogue'),
    pickTruth: (truth) => ({ recruitedCedric: truth.flags.recruitedCedric, roguePresent: truth.memberDefinitions.includes('rogue') }),
  },
  {
    id: 'cedric-decline', nodeId: 'lion-nomad-crossroads', dialogueId: 'mystery_recruit', choiceIndex: 1,
    flags: { lionMissionAccepted: true, lionMandateHonour: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.recruitedCedric !== true && !truth.memberDefinitions.includes('rogue'),
    pickTruth: (truth) => ({ recruitedCedric: Boolean(truth.flags.recruitedCedric), roguePresent: truth.memberDefinitions.includes('rogue') }),
  },
  {
    id: 'bois-clair-saved', nodeId: 'lion-village-choice', dialogueId: 'village_choice', choiceIndex: 0,
    expectedMode: 'CINEMATIC_HOLD',
    expectedNextNodeId: 'lion-second-refuge', expectedArrivalSelector: '.exploration-stop[data-refuge-node="lion-second-refuge"]',
    flags: { lionMissionAccepted: true, lionMandateHonour: true, helpedRefugees: true, prioritizedVillage: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.missionSuccess === true && truth.flags.missionGreed !== true,
    pickTruth: (truth) => ({ missionSuccess: truth.flags.missionSuccess, missionGreed: Boolean(truth.flags.missionGreed) }),
  },
  {
    id: 'bois-clair-sacrificed', nodeId: 'lion-village-choice', dialogueId: 'village_choice', choiceIndex: 1,
    expectedMode: 'CINEMATIC_HOLD',
    flags: { lionMissionAccepted: true, lionMandateAdvance: true, exploitedRefugees: true, prioritizedLoot: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.missionSuccess === false && truth.flags.missionGreed === true,
    pickTruth: (truth) => ({ missionSuccess: truth.flags.missionSuccess, missionGreed: truth.flags.missionGreed }),
  },
  {
    id: 'garen-recruit', nodeId: 'lion-lancer-recruit', dialogueId: 'mystery_lancer_recruit', choiceIndex: 0,
    flags: { missionSuccess: true, protectedWitnesses: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.memberDefinitions.includes('lancer'),
    pickTruth: (truth) => ({ lancerPresent: truth.memberDefinitions.includes('lancer') }),
  },
  {
    id: 'witnesses-protected', nodeId: 'lion-witnesses', dialogueId: 'witnesses_on_road', choiceIndex: 0,
    flags: { missionSuccess: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.protectedWitnesses === true && truth.flags.silencedWitnesses !== true,
    pickTruth: (truth) => ({ protectedWitnesses: truth.flags.protectedWitnesses, silencedWitnesses: Boolean(truth.flags.silencedWitnesses) }),
  },
  {
    id: 'shadow-evidence', nodeId: 'lion-shadow-signs', dialogueId: 'shadow_signs', choiceIndex: 0,
    expectedNextNodeId: 'lion-final-refuge', expectedArrivalSelector: '.dialogue[data-dialogue-sequence="final_refuge"]',
    flags: { missionSuccess: true, protectedWitnesses: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.flags.shadowEvidence === true && truth.flags.shadowFragments !== true,
    pickTruth: (truth) => ({ shadowEvidence: truth.flags.shadowEvidence, shadowFragments: Boolean(truth.flags.shadowFragments) }),
  },
  {
    id: 'final-refuge-story', nodeId: 'lion-final-refuge', dialogueId: 'final_refuge', choiceIndex: 0,
    flags: { missionSuccess: true, protectedWitnesses: true, shadowEvidence: true, shadowRevealed: true }, reputation: 60, seed: 6101,
    assertTruth: (truth) => truth?.resolvedNodeIds.includes('lion-final-refuge'),
    pickTruth: (truth) => ({ resolved: truth.resolvedNodeIds.includes('lion-final-refuge'), endingId: truth.endingId }),
  },
];

const finaleScenarios = [
  {
    id: 'serpent-ending', choiceIndex: 0, seed: 6101, reputation: 60,
    flags: { lionMandateHonour: true, helpedRefugees: true, prioritizedVillage: true, missionSuccess: true, protectedWitnesses: true, shadowEvidence: true, shadowRevealed: true },
    assertTruth: (truth) => truth?.flags.serpentGeneralDefeated === true && truth.endingId?.startsWith('lion-seal-serpent'),
    pickTruth: (truth) => ({ serpentGeneralDefeated: truth.flags.serpentGeneralDefeated, endingId: truth.endingId }),
  },
  {
    id: 'voluntary-lion-trial-ending', choiceIndex: 1, seed: 6101, reputation: 60,
    flags: { lionMandateHonour: true, helpedRefugees: true, prioritizedVillage: true, missionSuccess: true, protectedWitnesses: true, shadowEvidence: true, shadowRevealed: true },
    assertTruth: (truth) => truth?.flags.lionTrialRequested === true && truth.flags.lionTrialWon === true && truth.endingId?.startsWith('lion-seal-trial'),
    pickTruth: (truth) => ({ lionTrialRequested: truth.flags.lionTrialRequested, lionTrialWon: truth.flags.lionTrialWon, endingId: truth.endingId }),
  },
  {
    id: 'non-voluntary-lion-trial-ending', choiceIndex: 0, seed: 6104, reputation: 60,
    flags: { lionMandateAdvance: true, exploitedRefugees: true, prioritizedLoot: true, missionGreed: true, silencedWitnesses: true, shadowFragments: true, liedToAlaric: true },
    assertTruth: (truth) => truth?.flags.lionTrialRequested !== true && truth.flags.lionTrialWon === true && truth.endingId?.startsWith('lion-seal-trial'),
    pickTruth: (truth) => ({ lionTrialRequested: Boolean(truth.flags.lionTrialRequested), lionTrialWon: truth.flags.lionTrialWon, endingId: truth.endingId }),
  },
];

for (const [sourceId, id] of [['serpent-ending', 'serpent-ending-concealed'], ['voluntary-lion-trial-ending', 'lion-trial-ending-concealed']]) {
  const original = finaleScenarios.find((entry) => entry.id === sourceId);
  finaleScenarios.push({ ...original, id,
    flags: { ...original.flags, shadowRevealed: false, shadowConcealed: true },
    assertTruth: (truth) => original.assertTruth(truth)
      && truth.endingId === (sourceId === 'serpent-ending' ? 'lion-seal-serpent' : 'lion-seal-trial'),
  });
}

const selected = (entry) => SCENARIO_FILTER ? SCENARIO_FILTER.split(',').includes(entry.id)
  : !CIN8_GROUP || finaleScenarios.includes(entry) || ['bois-clair-saved', 'bois-clair-sacrificed'].includes(entry.id);

if (SCENARIO_FILTER && SCENARIO_FILTER.split(',').some((id) => ![...nodeScenarios, ...finaleScenarios].some((entry) => entry.id === id))) {
  throw new Error(`Unknown CIN6D6_ROUTE_SCENARIO: ${SCENARIO_FILTER}`);
}
await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const productionServer = PRODUCTION ? await preview({ preview: { host: '127.0.0.1', port: PRODUCTION_PORT, strictPort: true } }) : null;
const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: REDUCED_MOTION ? 'reduce' : 'no-preference' });
const result = { schemaVersion: 1, viewport: VIEWPORT, reducedMotion: REDUCED_MOTION, blockedMedia: BLOCK_MEDIA,
  method: PRODUCTION ? 'BUILT_PRODUCTION_REAL_GAMEAPP_V6_COMBAT_RESULT_FIXTURE_ONLY' : 'DEV_REAL_GAMEAPP_V6_QA_VICTORY', opening: [], nodes: [], finales: [], pass: false };
let failed = false;
try {
  if (PRODUCTION && CIN8_GROUP && !SCENARIO_FILTER) {
    try { result.opening.push(await runOpeningScenario(context)); }
    catch (error) { failed = true; result.opening.push({ id: 'opening-camp-audience', pass: false, error: error.stack }); }
  }
  for (const scenario of nodeScenarios.filter(selected)) {
    try {
      result.nodes.push(await runNodeScenario(context, scenario));
    } catch (error) {
      failed = true;
      result.nodes.push({ id: scenario.id, pass: false, error: error instanceof Error ? error.stack : String(error) });
    }
  }
  for (const scenario of finaleScenarios.filter(selected)) {
    try {
      result.finales.push(await runFinaleScenario(context, scenario));
    } catch (error) {
      failed = true;
      result.finales.push({ id: scenario.id, pass: false, error: error instanceof Error ? error.stack : String(error) });
    }
  }
  result.pass = !failed;
} finally {
  await context.close();
  await browser.close();
  if (productionServer) await new Promise((resolve, reject) => productionServer.httpServer.close((error) => error ? reject(error) : resolve()));
}
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (failed) process.exitCode = 1;
