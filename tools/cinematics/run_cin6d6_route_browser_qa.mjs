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
const REVIEW_TRANSITION_COPY = process.env.CIN6D6_TRANSITION_COPY === '1';
const CIN8_GROUP = process.env.CIN6D6_ROUTE_GROUP === 'cin8';
const REDUCED_MOTION = process.env.CIN6D6_REDUCED_MOTION === '1';
// OS-only coverage keeps the saved graphics setting false to detect explicit-false overrides.
const OS_REDUCED_MOTION = process.env.CIN6D6_OS_REDUCED_MOTION === '1';
if (OS_REDUCED_MOTION && !PRODUCTION) throw new Error('OS-only motion proof requires built production.');
const APPROVED_VIDEO_IDS = ['camp_departure', 'alaric_audience_arrival', 'bois_clair_arrival', 'bois_clair_saved',
  'bois_clair_sacrificed', 'lion_judgement', 'serpent_route_ending', 'lion_trial_route_ending'];
const BLOCK_MEDIA = process.env.CIN6D6_BLOCK_MEDIA === '1';
const INTERRUPT_PRELUDE = process.env.CIN6D6_INTERRUPT_PRELUDE === '1';
if (INTERRUPT_PRELUDE && (!PRODUCTION || REDUCED_MOTION || OS_REDUCED_MOTION || BLOCK_MEDIA)) {
  throw new Error('Prelude interruption requires built production with normal motion and available media.');
}
let productionModels;
if (PRODUCTION) {
  const models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  productionModels = { ...await models.ssrLoadModule('/src/game/store.ts'), ...await models.ssrLoadModule('/src/game/runSystem.ts') };
  await models.close();
}

async function installHooks(page) {
  if (REVIEW_TRANSITION_COPY) await page.addInitScript(() => {
    const labels = [];
    window.__transitionCopyLabels = labels;
    new MutationObserver(() => {
      for (const label of document.querySelectorAll('.scene-transition__label')) {
        if (labels.some(entry => entry.node === label)) continue;
        labels.push({ node: label, text: label.textContent });
      }
    }).observe(document, { childList: true, subtree: true });
  });
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
  await observeSystemMotion(page);
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function observeSystemMotion(page) {
  if (!OS_REDUCED_MOTION) return;
  await page.waitForFunction(() => window.__cin8App);
  await page.evaluate(() => {
    const player = window.__cin8App.cinematicPlayer;
    if (player.__motionObserved) return;
    player.__motionObserved = true;
    for (const method of ['play', 'playHeld']) {
      const original = player[method].bind(player);
      player[method] = async (id, options = {}) => {
        const outcome = await original(id, options);
        const result = outcome.result ?? outcome;
        const records = JSON.parse(sessionStorage.getItem('cin8-system-motion') ?? '[]');
        records.push({ id, reason: result.reason, played: result.played, requestedMotion: options.reducedMotion,
          osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
          reducedGraphics: window.__cin8App.state.settings.reducedGraphics });
        sessionStorage.setItem('cin8-system-motion', JSON.stringify(records));
        return outcome;
      };
    }
  });
}

async function systemMotionProof(page) {
  if (!OS_REDUCED_MOTION) return null;
  const proof = await page.evaluate(() => ({
    records: JSON.parse(sessionStorage.getItem('cin8-system-motion') ?? '[]'),
    osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    reducedGraphics: window.__cin8App.state.settings.reducedGraphics,
    activeVideos: document.querySelectorAll('.cinematic-overlay video').length,
  }));
  const attempted = proof.records.filter((entry) => APPROVED_VIDEO_IDS.includes(entry.id));
  // This reviewed preparation scenario has no video attempt: require recorded static surfaces.
  const staticPreparation = SCENARIO_FILTER === 'final-refuge-story' && proof.records.length > 0
    && proof.records.every((entry) => /^(dialogue-tableau:|narrative-static:)/.test(entry.id)
      && !entry.played && entry.osReduced && !entry.reducedGraphics);
  if (!proof.osReduced || proof.reducedGraphics || proof.activeVideos || (!attempted.length && !staticPreparation)
    || attempted.some((entry) => !entry.osReduced || entry.reducedGraphics || entry.played || entry.reason !== 'reduced-motion')) {
    throw new Error(`OS-only reduced-motion regression: ${JSON.stringify(proof)}`);
  }
  return proof;
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
  if (REVIEW_TRANSITION_COPY && sequenceId.startsWith('ate_') && trace
    && !trace.ateCopy?.some(entry => entry.sequenceId === sequenceId)) {
    await page.waitForFunction(id => {
      const dialogue = document.querySelector(`.dialogue[data-dialogue-sequence="${id}"]`);
      const text = dialogue?.querySelector('.dialogue__text');
      return dialogue && !dialogue.classList.contains('dialogue--preparing-step')
        && getComputedStyle(dialogue).opacity === '1'
        && dialogue.getAnimations().every(animation => animation.playState === 'finished')
        && text?.dataset.finalText && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
    }, sequenceId);
    const copy = await dialogue.evaluate(element => {
      const brand = element.querySelector('.dialogue__brand span');
      const rect = brand.getBoundingClientRect();
      return { sequenceId: element.dataset.dialogueSequence, title: brand.textContent,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        fitsViewport: rect.width > 0 && rect.height > 0
          && rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
        nextEnabled: !element.querySelector('.dialogue__box').disabled };
    });
    if (!copy.title?.trim() || /^(?:\.{3}|…)$/.test(copy.title.trim()) || !copy.fitsViewport || !copy.nextEnabled) {
      throw new Error(`ATE title/viewport/next-control assertion failed: ${JSON.stringify(copy)}`);
    }
    const capture = `${trace.capturePrefix}-${sequenceId}-copy.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture) });
    (trace.ateCopy ??= []).push({ ...copy, capture });
  }
  let usedChoice = false;
  for (let index = 0; index < 100; index += 1) {
    if (!await dialogue.count()) return;
    trace?.dialogues.add(sequenceId);
    if (PRODUCTION && sequenceId === 'village_choice' && trace?.capturePrefix === 'bois-clair-saved') {
      const stepId = await dialogue.getAttribute('data-dialogue-step');
      trace.villageTableau ??= [];
      if (['1', '3', '5'].includes(stepId) && !trace.villageTableau.some(entry => entry.stepId === stepId)) {
        const savedBefore = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
        await page.waitForFunction(() => {
          const dialogue = document.querySelector('.dialogue[data-dialogue-sequence="village_choice"]');
          const text = dialogue?.querySelector('.dialogue__text');
          const actors = [...document.querySelectorAll('.narrative-stage .narrative-cast__actor')];
          return !dialogue?.classList.contains('dialogue--preparing-step') && actors.length === 4
            && actors.every(actor => actor.querySelector('img')?.naturalWidth > 0 && !actor.classList.contains('is-entering'))
            && text?.dataset.finalText && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
        }, null, { timeout: 10_000 });
        const observation = await dialogue.evaluate(element => {
          const actors = [...document.querySelectorAll('.narrative-stage .narrative-cast__actor')].map(actor => {
            const rect = actor.querySelector('img').getBoundingClientRect();
            return { id: actor.dataset.actorId, group: actor.dataset.actorGroup, facing: actor.dataset.facing,
              position: actor.dataset.screenPosition, centerX: rect.x + rect.width / 2 };
          });
          const text = element.querySelector('.dialogue__text'), rect = text.getBoundingClientRect();
          return { stepId: element.dataset.dialogueStep, actors, text: text.dataset.finalText,
            textFitsViewport: rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
            enabled: !element.querySelector('.dialogue__box').disabled };
        });
        const civilian = observation.actors.find(actor => actor.id === 'villageoise');
        const heroes = observation.actors.filter(actor => actor.group === 'PLAYER_COMPANY');
        if (!civilian || civilian.group !== 'LOCAL_CIVILIAN' || civilian.facing !== 'LEFT'
          || heroes.length !== (stepId === '1' ? 2 : 3) || heroes.some(actor => actor.centerX >= civilian.centerX)
          || !observation.textFitsViewport || !observation.enabled) {
          throw new Error(`Village civilian/hero geography failed: ${JSON.stringify(observation)}`);
        }
        const presentation = await readPresentation(page); assertDialogueTableau(presentation, 'Village relational tableau');
        const capture = `${trace.capturePrefix}-tableau-${stepId}.png`;
        await page.screenshot({ path: resolve(OUTPUT_DIR, capture) });
        if (!savedBefore || savedBefore !== await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'))) {
          throw new Error('Observing village tableau changed stored V6 truth.');
        }
        trace.villageTableau.push({ ...observation, presentation, capture, savedTruthUnchanged: true });
      }
    }
    if (PRODUCTION && sequenceId === 'acte_ouverture' && trace?.capturePrefix === 'opening-camp-audience'
      && !trace.openingCastTransition && await dialogue.getAttribute('data-dialogue-step') === '4') {
      const segment = (await dialogue.getAttribute('data-dialogue-segment') ?? '1/1').split('/');
      if (segment[0] === segment[1]) {
        trace.openingCastTransition = await observeOpeningCastTransition(page);
        continue;
      }
    }
    if (PRODUCTION && sequenceId === 'serpent_pursuit_pre_combat' && trace?.capturePrefix === 'serpent-ending') {
      const stepId = await dialogue.getAttribute('data-dialogue-step');
      trace.serpentTableau ??= [];
      if (!trace.serpentTableau.some(entry => entry.stepId === stepId)) {
        const before = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
        await page.waitForFunction(() => {
          const actors = [...document.querySelectorAll('.narrative-stage .narrative-cast__actor')];
          const dialogue = document.querySelector('.dialogue[data-dialogue-sequence="serpent_pursuit_pre_combat"]');
          const text = dialogue?.querySelector('.dialogue__text');
          return actors.length === 3 && actors.every(actor => {
            const image = actor.querySelector('img');
            return image?.complete && image.naturalWidth > 0 && !actor.classList.contains('is-entering');
          }) && !dialogue?.classList.contains('dialogue--preparing-step') && text?.dataset.finalText
            && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
        }, undefined, { timeout: 10_000 });
        await dialogue.locator('.dialogue__box').focus();
        const observation = await dialogue.evaluate(element => {
          const actors = [...document.querySelectorAll('.narrative-stage .narrative-cast__actor')].map(actor => {
            const image = actor.querySelector('img'), rect = image.getBoundingClientRect();
            // Measure the opaque artwork within object-fit:contain, rather than its tall transparent frame.
            const canvas = document.createElement('canvas');
            canvas.height = 160; canvas.width = Math.ceil(160 * image.naturalWidth / image.naturalHeight);
            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
            for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
              if (pixels[(y * canvas.width + x) * 4 + 3] <= 32) continue;
              left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
            }
            const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
            const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
            const flipped = getComputedStyle(image).transform.startsWith('matrix(-1,');
            const x = rect.x + (rect.width - width) / 2 + width * (flipped ? 1 - (right + 1) / canvas.width : left / canvas.width);
            const y = rect.bottom - height + height * top / canvas.height;
            const bounds = { x, y, width: width * (right - left + 1) / canvas.width, height: height * (bottom - top + 1) / canvas.height };
            return { id: actor.dataset.actorId, position: actor.dataset.screenPosition, facing: actor.dataset.facing,
              group: actor.dataset.actorGroup, speaking: actor.classList.contains('is-speaking'), flipped, bounds,
              visibleWidthRatio: Math.max(0, Math.min(innerWidth, x + bounds.width) - Math.max(0, x)) / bounds.width };
          });
          const box = element.querySelector('.dialogue__box');
          const text = element.querySelector('.dialogue__text'), textRect = text.getBoundingClientRect();
          return { stepId: element.dataset.dialogueStep, actors, boxEnabled: !box.disabled,
            focused: document.activeElement === box, text: text.dataset.finalText,
            textFitsViewport: textRect.left >= -1 && textRect.top >= -1 && textRect.right <= innerWidth + 1 && textRect.bottom <= innerHeight + 1,
            viewport: { width: innerWidth, height: innerHeight } };
        });
        const byId = Object.fromEntries(observation.actors.map(actor => [actor.id, actor]));
        const alaric = byId.alaric, sage = byId.sage_seraphine, serpent = byId.serpent_general_boss;
        observation.alliedEnvelopeGap = sage && alaric ? sage.bounds.x - (alaric.bounds.x + alaric.bounds.width) : null;
        const capture = `${trace.capturePrefix}-confrontation-${stepId}.png`;
        await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
        if (!alaric || !sage || !serpent || !observation.boxEnabled || !observation.focused || !observation.textFitsViewport
          || alaric.position !== 'FAR_LEFT' || sage.position !== 'CENTER_LEFT' || serpent.position !== 'FAR_RIGHT'
          || alaric.facing !== 'RIGHT' || sage.facing !== 'RIGHT' || serpent.facing !== 'LEFT'
          || alaric.flipped || sage.flipped || !serpent.flipped
          || !(alaric.bounds.x + alaric.bounds.width / 2 < sage.bounds.x + sage.bounds.width / 2
            && sage.bounds.x + sage.bounds.width / 2 < serpent.bounds.x + serpent.bounds.width / 2)
          || observation.actors.some(actor => !Number.isFinite(actor.visibleWidthRatio) || actor.visibleWidthRatio < .6)) {
          throw new Error(`Serpent relational tableau is unreadable: ${JSON.stringify(observation)}`);
        }
        if (observation.viewport.width <= 450 && observation.alliedEnvelopeGap < 0) {
          throw new Error(`Narrow allied silhouettes overlap: ${JSON.stringify(observation)}`);
        }
        const presentation = await readPresentation(page);
        assertDialogueTableau(presentation, 'Serpent confrontation');
        const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
        if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Observing Serpent tableau changed saved truth.');
        trace.serpentTableau.push({ ...observation, presentation, capture, savedTruthUnchanged: true });
      }
    }
    if (PRODUCTION && sequenceId === 'ate_lion_council_doubt' && trace?.capturePrefix === 'witnesses-protected'
      && !trace.councilOpening && await dialogue.getAttribute('data-dialogue-step') === '1') {
      const expectedText = 'Les survivants de Bois-Clair ont choisi de parler librement. Leur témoignage compte, mais il ne suffit pas à leur remettre le Sceau.';
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
      // The owner persists this node after its ATE; inspect native live facts without writing them.
      const witnessFlags = await page.evaluate(() => ({ protected: window.__cin8App.state.flags.protectedWitnesses,
        silenced: window.__cin8App.state.flags.silencedWitnesses }));
      if (witnessFlags.protected !== true || witnessFlags.silenced === true) {
        throw new Error('Council opening requires freely protected witnesses.');
      }
      await page.waitForFunction((expected) => {
        const text = document.querySelector('.dialogue[data-dialogue-sequence="ate_lion_council_doubt"] .dialogue__text');
        return text?.querySelector('.dialogue__text-reveal')?.textContent === expected;
      }, expectedText, { timeout: 10_000 });
      const observation = await dialogue.evaluate((element) => {
        const text = element.querySelector('.dialogue__text');
        const box = element.querySelector('.dialogue__box');
        const rect = text.getBoundingClientRect(), boxRect = box.getBoundingClientRect();
        return { stepId: element.dataset.dialogueStep, segment: element.dataset.dialogueSegment,
          text: text.querySelector('.dialogue__text-reveal').textContent,
          withinViewport: rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
          fitsBox: rect.left >= boxRect.left - 1 && rect.right <= boxRect.right + 1 && rect.bottom <= boxRect.bottom + 1,
          boxEnabled: !box.disabled, bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
      });
      if (!observation.withinViewport || !observation.fitsBox || !observation.boxEnabled) {
        throw new Error(`Council opening text/agency does not fit: ${JSON.stringify(observation)}`);
      }
      const presentation = await readPresentation(page);
      assertDialogueTableau(presentation, 'council opening');
      const capture = `${trace.capturePrefix}-council-opening.png`;
      await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        throw new Error('Observing council opening changed saved truth.');
      }
      trace.councilOpening = { ...observation, witnessFlags, presentation, capture, savedTruthUnchanged: true };
    }
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
      const stepId = await dialogue.getAttribute('data-dialogue-step');
      const capture = `${trace?.capturePrefix ?? 'opening'}-${sequenceId}-${stepId}-choices.png`;
      await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
      trace?.choiceBounds?.push({ sequenceId, stepId, bounds, keyboardActivation: true, capture });
      await page.keyboard.press('Enter');
      usedChoice = true;
    } else {
      await dialogue.locator('.dialogue__box').click({ force: true });
    }
    await page.waitForTimeout(55);
  }
  throw new Error(`${sequenceId}: dialogue did not complete.`);
}

async function observeOpeningCastTransition(page) {
  await page.waitForFunction(() => {
    const dialogue = document.querySelector('.dialogue[data-dialogue-sequence="acte_ouverture"]');
    const text = dialogue?.querySelector('.dialogue__text');
    return !dialogue?.classList.contains('dialogue--preparing-step')
      && text?.dataset.finalText && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
  });
  const savedBefore = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
  if (!savedBefore || JSON.parse(savedBefore).version !== 6) throw new Error('Opening requires a stored V6 autosave.');
  await page.screenshot({ path: resolve(OUTPUT_DIR, 'opening-cast-before.png') });
  await page.evaluate(() => {
    const surface = document.querySelector('.narrative-stage .narrative-scene-surface');
    const retained = ['maelor', 'sage_seraphine'].map(id => surface.querySelector(`[data-actor-id="${id}"]`));
    const started = performance.now(), samples = [];
    const sample = () => {
      const actors = [...surface.querySelectorAll('.narrative-cast__actor')];
      samples.push({ elapsedMs: performance.now() - started, phase: surface.dataset.castTransition ?? 'SETTLED',
        actors: actors.map(actor => ({ id: actor.dataset.actorId, facing: actor.dataset.facing,
          animation: getComputedStyle(actor).animationName })),
        retained: retained.every(actor => surface.contains(actor)),
        preparing: document.querySelector('.dialogue')?.classList.contains('dialogue--preparing-step') });
    };
    sample();
    const observer = new MutationObserver(sample);
    observer.observe(surface, { subtree: true, childList: true, attributes: true });
    let frame;
    const tick = () => { sample(); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    window.__openingCastObservation = { finish: () => {
      sample(); observer.disconnect(); cancelAnimationFrame(frame);
      return { samples, durationMs: performance.now() - started };
    } };
  });
  const box = page.locator('.dialogue[data-dialogue-sequence="acte_ouverture"] .dialogue__box');
  await box.focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const dialogue = document.querySelector('.dialogue[data-dialogue-sequence="acte_ouverture"]');
    const surface = document.querySelector('.narrative-scene-surface');
    const text = dialogue?.querySelector('.dialogue__text');
    return dialogue?.dataset.dialogueStep === '5' && !dialogue.classList.contains('dialogue--preparing-step')
      && !surface?.dataset.castTransition && text?.dataset.finalText
      && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
  }, null, { timeout: 10_000 });
  const observation = await page.evaluate(() => {
    const proof = window.__openingCastObservation.finish();
    const dialogue = document.querySelector('.dialogue');
    const box = dialogue.querySelector('.dialogue__box'), text = dialogue.querySelector('.dialogue__text');
    const bounds = text.getBoundingClientRect(), boxBounds = box.getBoundingClientRect();
    return { ...proof, stepId: dialogue.dataset.dialogueStep, text: text.dataset.finalText,
      focused: document.activeElement === box, enabled: !box.disabled,
      fits: bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight
        && bounds.left >= boxBounds.left - 1 && bounds.right <= boxBounds.right + 1 && bounds.bottom <= boxBounds.bottom + 1,
      osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      gameReduced: window.__cin8App.state.settings.reducedGraphics };
  });
  const phase = name => observation.samples.filter(sample => sample.phase === name);
  const ordered = observation.samples.filter((sample, index, samples) => index === 0 || sample.phase !== samples[index - 1].phase);
  if (JSON.stringify(ordered.map(sample => sample.phase)) !== JSON.stringify(['SETTLED', 'EXIT', 'BREATH', 'ENTRY', 'SETTLED'])
    || ordered.at(-1).elapsedMs - ordered[1].elapsedMs > 2000
    || !phase('EXIT').some(sample => sample.actors.length === 4)
    || !phase('BREATH').some(sample => sample.actors.length === 2)
    || !phase('ENTRY').some(sample => sample.actors.length === 4)
    || observation.samples.some(sample => sample.actors.length > 4 || !sample.retained)
    || observation.samples.filter(sample => sample.phase !== 'SETTLED').some(sample => !sample.preparing)
    || !observation.focused || !observation.enabled || !observation.fits
    || (OS_REDUCED_MOTION && (!observation.osReduced || observation.gameReduced
      || observation.samples.some(sample => sample.actors.some(actor => actor.animation !== 'none'))))) {
    throw new Error(`Opening cast continuity/agency failed: ${JSON.stringify(observation)}`);
  }
  const finalCast = observation.samples.at(-1).actors;
  if (JSON.stringify(finalCast.map(actor => [actor.id, actor.facing])) !== JSON.stringify([
    ['kestrel', 'RIGHT'], ['elara', 'RIGHT'], ['maelor', 'LEFT'], ['sage_seraphine', 'LEFT'],
  ])) throw new Error(`Opening authored facing differs: ${JSON.stringify(finalCast)}`);
  const savedAfter = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
  if (savedBefore !== savedAfter) throw new Error('Effect-free opening cast replacement changed stored V6 truth.');
  const presentation = await readPresentation(page); assertDialogueTableau(presentation, 'opening replacement');
  await page.screenshot({ path: resolve(OUTPUT_DIR, 'opening-cast-after.png') });
  return { ...observation, presentation, savedTruthUnchanged: true,
    captures: ['opening-cast-before.png', 'opening-cast-after.png'] };
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

async function checkPreludeInterruption(page, sequenceId, trace) {
  if (!INTERRUPT_PRELUDE) return null;
  await page.waitForFunction(() => {
    const overlay = document.querySelector('.cinematic-overlay');
    const video = overlay?.querySelector('video');
    return overlay?.getAttribute('data-cinematic-first-frame-painted') === 'true' && video?.currentTime > 0;
  }, null, { timeout: 20000 });
  const interrupted = await page.locator('.cinematic-overlay video').evaluate((video) => ({
    src: video.currentSrc, currentTime: video.currentTime, paused: video.paused,
  }));
  if (!APPROVED_VIDEO_IDS.some((id) => interrupted.src.endsWith(`/${id}.mp4`))) throw new Error('Unapproved interruption source');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
  await page.screenshot({ path: resolve(OUTPUT_DIR, `${trace.capturePrefix}-prelude-interrupt.png`) });
  await page.reload({ waitUntil: 'networkidle' });
  await continueSavedNode(page);
  await waitForDialogueSequence(page, sequenceId, trace);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Unresolved prelude reload changed saved truth before player choice');
  const tableau = await readPresentation(page);
  assertDialogueTableau(tableau, 'unresolved prelude resume');
  return { interrupted, truthUnchanged: true, resumedDialogue: sequenceId, tableau };
}

async function runNodeScenario(context, scenario) {
  const page = await context.newPage();
  await installHooks(page);
  const diagnostics = diagnosticsFor(page);
  const trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [], capturePrefix: scenario.id };
  try {
    await installNodeSave(page, scenario.nodeId, scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    const interruption = await checkPreludeInterruption(page, scenario.dialogueId, trace);
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
    const transitionLabels = REVIEW_TRANSITION_COPY ? await page.evaluate(() =>
      (window.__transitionCopyLabels ?? []).map(entry => entry.text)) : undefined;
    if (transitionLabels?.some(text => /^(?:\.{3}|…)$/.test(text?.trim() ?? ''))) {
      throw new Error(`Mounted transition placeholder: ${JSON.stringify(transitionLabels)}`);
    }
    if (PRODUCTION && scenario.id === 'witnesses-protected' && !trace.councilOpening) {
      throw new Error('Protected witnesses never displayed the council opening.');
    }
    if (PRODUCTION && scenario.id === 'bois-clair-saved' && trace.villageTableau?.length !== 3) {
      throw new Error('Village first tableau/restage/choice observations missing.');
    }
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
      councilOpening: trace.councilOpening ?? null,
      villageTableau: trace.villageTableau ?? null,
      ateCopy: trace.ateCopy ?? null,
      transitionLabels,
      initialPresentation,
      truth: scenario.pickTruth(truth),
      capture,
      continuation,
      resume,
      systemMotion: await systemMotionProof(page),
      interruption,
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
  const trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [], capturePrefix: scenario.id };
  try {
    await installNodeSave(page, 'lion-final-judgement', scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    const interruption = await checkPreludeInterruption(page, 'lion_finale_judgement', trace);
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
    if (PRODUCTION && scenario.id === 'serpent-ending'
      && (trace.serpentTableau?.length !== 3 || !['1', '2', '3'].every(id => trace.serpentTableau.some(entry => entry.stepId === id)))) {
      throw new Error('Serpent confrontation did not expose every authored speaker step.');
    }
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
      serpentTableau: trace.serpentTableau ?? null,
      truth: scenario.pickTruth(truth),
      capture,
      resume,
      systemMotion: await systemMotionProof(page),
      interruption,
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
  const diagnostics = diagnosticsFor(page), trace = { dialogues: new Set(), media: new Set(), combats: 0, choiceBounds: [], capturePrefix: 'opening-camp-audience' };
  try {
    await page.goto(`${BASE_URL}/?presentation=narrative&media=video`, { waitUntil: 'domcontentloaded' });
    await observeSystemMotion(page);
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
    if (!trace.openingCastTransition) throw new Error('Opening cast replacement was not observed.');
    return { id: 'opening-camp-audience', camp, audience, openingCastTransition: trace.openingCastTransition, dialogues: [...trace.dialogues], media: [...trace.media],
      truth: { lionMissionAccepted: true }, resume, choiceBounds: trace.choiceBounds, systemMotion: await systemMotionProof(page),
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

if (SCENARIO_FILTER && SCENARIO_FILTER.split(',').some((id) => ![{ id: 'opening-camp-audience' }, ...nodeScenarios, ...finaleScenarios].some((entry) => entry.id === id))) {
  throw new Error(`Unknown CIN6D6_ROUTE_SCENARIO: ${SCENARIO_FILTER}`);
}
await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const productionServer = PRODUCTION ? await preview({ preview: { host: '127.0.0.1', port: PRODUCTION_PORT, strictPort: true } }) : null;
const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: REDUCED_MOTION || OS_REDUCED_MOTION ? 'reduce' : 'no-preference' });
const result = { schemaVersion: 1, viewport: VIEWPORT, reducedMotion: REDUCED_MOTION, osReducedMotion: OS_REDUCED_MOTION, blockedMedia: BLOCK_MEDIA,
  interruptPrelude: INTERRUPT_PRELUDE,
  method: PRODUCTION ? 'BUILT_PRODUCTION_REAL_GAMEAPP_V6_COMBAT_RESULT_FIXTURE_ONLY' : 'DEV_REAL_GAMEAPP_V6_QA_VICTORY', opening: [], nodes: [], finales: [], pass: false };
let failed = false;
try {
  if (PRODUCTION && ((CIN8_GROUP && !SCENARIO_FILTER) || SCENARIO_FILTER.split(',').includes('opening-camp-audience'))) {
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
  if (OS_REDUCED_MOTION && CIN8_GROUP && !SCENARIO_FILTER && !failed) {
    const records = [...result.opening, ...result.nodes, ...result.finales]
      .flatMap((entry) => entry.systemMotion.records).filter((entry) => APPROVED_VIDEO_IDS.includes(entry.id));
    result.systemMotionCoverage = { slots: [...new Set(records.map((entry) => entry.id))], attempts: records.length };
    if (APPROVED_VIDEO_IDS.some((id) => !result.systemMotionCoverage.slots.includes(id))) {
      failed = true;
      result.systemMotionCoverage.error = 'OS-only run did not exercise all eight approved slots';
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
