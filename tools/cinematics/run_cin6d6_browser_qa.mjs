import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN6D6_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN6D6_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin6d6/browser-qa'));
const [viewportWidth, viewportHeight] = (process.env.CIN6D6_VIEWPORT ?? '1920x1080').split('x').map(Number);
const VIEWPORT = { width: viewportWidth, height: viewportHeight };
const VIEWPORT_ID = `${VIEWPORT.width}x${VIEWPORT.height}`;
const URL = `${BASE_URL}/?journey=cinematic&presentation=narrative&media=video&qa=1&cin6a=golden`;

function diagnosticsFor(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[VFX Preview]')) diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
  return diagnostics;
}

async function skipLeadInUntil(page, locator, label) {
  for (let index = 0; index < 320; index += 1) {
    if (await locator.isVisible().catch(() => false)) return locator;
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) await skip.evaluate((button) => button.click());
    else await page.waitForTimeout(60);
  }
  throw new Error(`${label} did not become visible.`);
}

async function waitForDialogue(page, sequenceId) {
  return skipLeadInUntil(page, page.locator(`.dialogue[data-dialogue-sequence="${sequenceId}"]`), sequenceId);
}

async function waitForAnyDialogue(page) {
  return skipLeadInUntil(page, page.locator('.dialogue:visible').first(), 'dialogue');
}

async function readStage(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.narrative-stage');
    if (!(stage instanceof HTMLElement)) return null;
    const mediaLayer = stage.querySelector('[data-narrative-layer="media"]');
    return {
      mode: stage.dataset.presentationMode ?? null,
      beat: stage.dataset.presentationBeat ?? null,
      family: stage.dataset.visualFamily ?? null,
      fallbackActive: stage.dataset.fallbackActive ?? null,
      surface: stage.dataset.narrativeMediaSurface ?? null,
      ownership: stage.dataset.narrativeCastOwnership ?? null,
      primaryInvariant: stage.dataset.primarySurfaceInvariant ?? null,
      primarySurfaces: mediaLayer?.querySelectorAll(':scope > .narrative-media-surface, :scope > .cinematic-overlay').length ?? 0,
      staticActors: stage.querySelectorAll('.narrative-cast__actor').length,
      dialogues: stage.querySelectorAll('.dialogue').length,
      choices: [...stage.querySelectorAll('.dialogue-choice:not([disabled])')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent?.replace(/\s+/g, ' ').trim() ?? '', left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      }),
    };
  });
}

function assertStage(stage, expectedMode, label) {
  if (!stage || stage.mode !== expectedMode) throw new Error(`${label}: expected ${expectedMode}, got ${JSON.stringify(stage)}.`);
  if (stage.primarySurfaces > 1 || stage.primaryInvariant === 'FAIL') throw new Error(`${label}: multiple primary surfaces: ${JSON.stringify(stage)}.`);
  if ((expectedMode === 'CINEMATIC_VIDEO' || expectedMode === 'CINEMATIC_HOLD') && stage.staticActors) {
    throw new Error(`${label}: media-owned cast duplicated by ${stage.staticActors} static actors.`);
  }
  if (expectedMode === 'TRAVEL_STILL' && (stage.staticActors || stage.dialogues)) {
    throw new Error(`${label}: Travel Still contains static actors or dialogue: ${JSON.stringify(stage)}.`);
  }
  if (expectedMode === 'STATIC_TABLEAU' && !stage.staticActors) throw new Error(`${label}: tableau has no foreground cast.`);
}

async function capture(page, name) {
  const file = `${VIEWPORT_ID}-${name}.png`;
  await page.screenshot({ path: resolve(OUTPUT_DIR, file), fullPage: false });
  return file;
}

async function finishDialogue(page, sequenceId, choiceIndex = 0) {
  const dialogue = await waitForDialogue(page, sequenceId);
  let choiceMetrics = [];
  for (let index = 0; index < 120; index += 1) {
    if (!await dialogue.count()) return choiceMetrics;
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) {
      await skip.evaluate((button) => button.click());
      continue;
    }
    const choices = dialogue.locator('.dialogue-choice:not([disabled]):visible');
    const choiceCount = await choices.count();
    if (choiceCount) {
      if (!choiceMetrics.length) {
        choiceMetrics = await choices.evaluateAll((elements) => elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { text: element.textContent?.replace(/\s+/g, ' ').trim() ?? '', left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        }));
      }
      await choices.nth(Math.min(choiceIndex, choiceCount - 1)).click();
    } else {
      await dialogue.locator('.dialogue__box').click({ force: true });
    }
    await page.waitForTimeout(55);
  }
  throw new Error(`${sequenceId}: dialogue did not complete.`);
}

async function finishCurrentDialogue(page) {
  const dialogue = await waitForAnyDialogue(page);
  const id = await dialogue.getAttribute('data-dialogue-sequence');
  if (!id) throw new Error('Visible dialogue has no sequence id.');
  return finishDialogue(page, id);
}

async function waitForJourney(page) {
  for (let index = 0; index < 400; index += 1) {
    const journey = page.locator('.journey-overlay:visible').first();
    if (await journey.count()) return journey;
    if (await page.locator('.dialogue:visible').count()) {
      await finishCurrentDialogue(page);
      continue;
    }
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) await skip.evaluate((button) => button.click());
    else await page.waitForTimeout(75);
  }
  const state = await page.evaluate(() => ({
    bodyMode: document.body.dataset.mode ?? null,
    bodyClass: document.body.className,
    stage: document.querySelector('.narrative-stage')?.outerHTML.slice(0, 600) ?? null,
    dialogues: document.querySelectorAll('.dialogue').length,
    journeys: document.querySelectorAll('.journey-overlay').length,
    combats: document.querySelectorAll('iframe.combat-frame').length,
    exploration: document.querySelectorAll('.exploration-stop').length,
    chrome: document.querySelector('#ui-root')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) ?? null,
  }));
  throw new Error(`Journey boundary did not become visible: ${JSON.stringify(state)}.`);
}

async function clickJourney(page, index = 0) {
  const single = page.locator('[data-journey-continue]:visible').first();
  if (await single.count()) return single.click();
  const choices = page.locator('.journey-overlay__choice:not([disabled]):visible');
  if (!await choices.count()) throw new Error('Journey boundary has no actionable route.');
  return choices.nth(Math.min(index, (await choices.count()) - 1)).click();
}

async function winCombat(page) {
  const frame = page.locator('iframe.combat-frame');
  await frame.waitFor({ state: 'attached', timeout: 40_000 });
  const combat = page.frameLocator('iframe.combat-frame');
  const victory = combat.locator('[data-qa="victory"]');
  await victory.waitFor({ state: 'visible', timeout: 40_000 });
  const tutorial = combat.locator('#tutorial:not(.hidden)');
  if (await tutorial.count()) await tutorial.locator('[data-action="skip"]').click();
  const bossTutorial = combat.locator('#boss-tutorial:not(.hidden)');
  if (await bossTutorial.count()) await bossTutorial.locator('[data-action="start"]').click();
  await victory.click();
  const action = combat.locator('#combat-result-action');
  await action.waitFor({ state: 'visible', timeout: 20_000 });
  if (await bossTutorial.count()) await bossTutorial.locator('[data-action="start"]').click();
  await action.click();
  await frame.waitFor({ state: 'detached', timeout: 20_000 });
}

async function installNodeSave(page, nodeId, flags = {}, reputation = 60, seed = 6101) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ nodeId: targetId, flags: targetFlags, reputation: targetReputation, seed: targetSeed }) => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { createRunState, enterRunNode } = await import('/src/game/runSystem.ts');
    const state = createInitialState();
    state.run = createRunState(targetSeed);
    state.currentNodeId = state.run.currentNodeId;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.flags.prologueSeen = true;
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
  }, { nodeId, flags, reputation, seed });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function runOpening(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-action="new"]').click();
  await page.locator('[data-prologue-skip]').click();
  await waitForDialogue(page, 'acte_ouverture');
  await installFlashSampler(page);
  await finishDialogue(page, 'acte_ouverture');

  await waitForDialogue(page, 'camp_departure');
  const campHold = await readStage(page);
  assertStage(campHold, 'CINEMATIC_HOLD', 'camp hold');
  const campShot = await capture(page, 'a-camp-hold');
  await finishDialogue(page, 'camp_departure');

  await waitForJourney(page);
  const campDeparture = await readStage(page);
  assertStage(campDeparture, 'TRAVEL_STILL', 'camp to audience');
  await clickJourney(page);

  await waitForDialogue(page, 'lion_briefing');
  const audienceHold = await readStage(page);
  assertStage(audienceHold, 'CINEMATIC_HOLD', 'audience hold');
  const audienceShot = await capture(page, 'a-audience-hold');
  const audienceChoices = await finishDialogue(page, 'lion_briefing', 0);
  if (audienceChoices.length !== 2) throw new Error(`Audience expected two choices, got ${audienceChoices.length}.`);

  await waitForJourney(page);
  const road = await readStage(page);
  assertStage(road, 'TRAVEL_STILL', 'audience to road');
  const roadShot = await capture(page, 'a-road-travel-still');
  await clickJourney(page);

  await waitForDialogue(page, 'pre_opening_trail');
  const forestHold = await readStage(page);
  assertStage(forestHold, 'CINEMATIC_HOLD', 'forest precombat hold');
  const forestShot = await capture(page, 'a-forest-precombat-hold');
  await finishDialogue(page, 'pre_opening_trail');
  await winCombat(page);

  await waitForDialogue(page, 'post_opening_trail');
  const postCombat = await readStage(page);
  assertStage(postCombat, 'STATIC_TABLEAU', 'opening postcombat tableau');
  const postShot = await capture(page, 'a-postcombat-tableau');
  await finishDialogue(page, 'post_opening_trail');
  await waitForJourney(page);
  const flashes = await readFlashSampler(page);

  return { id: 'A', pass: true, campHold, campDeparture, audienceHold, audienceChoices, road, forestHold, postCombat, flashes, screenshots: [campShot, audienceShot, roadShot, forestShot, postShot] };
}

async function runRefuge(page, id, nodeId, expectedBeat, flags) {
  await installNodeSave(page, nodeId, flags);
  await skipLeadInUntil(page, page.locator('.exploration-stop:visible'), `${nodeId} refuge gameplay`);
  await page.locator('.exploration-stop [data-action="continue"]').click();
  await waitForJourney(page);
  const departure = await readStage(page);
  assertStage(departure, 'TRAVEL_STILL', `${nodeId} departure`);
  if (departure.beat !== expectedBeat) throw new Error(`${nodeId}: expected ${expectedBeat}, got ${departure.beat}.`);
  const screenshot = await capture(page, `${id.toLowerCase()}-${nodeId}-departure`);
  return { id, pass: true, departure, screenshot };
}

async function runValmir(page) {
  await installNodeSave(page, 'lion-valmir-road', { lionMissionAccepted: true, helpedRefugees: true, recruitedCedric: true });
  const dialogue = await waitForAnyDialogue(page);
  const sequenceId = await dialogue.getAttribute('data-dialogue-sequence');
  if (!sequenceId) throw new Error('Valmir precombat dialogue has no id.');
  const precombat = await readStage(page);
  assertStage(precombat, 'STATIC_TABLEAU', 'Valmir precombat tableau');
  await finishDialogue(page, sequenceId);
  await winCombat(page);
  await waitForJourney(page);
  const fork = await readStage(page);
  assertStage(fork, 'CINEMATIC_HOLD', 'Valmir fork');
  const routeChoices = await page.locator('.journey-overlay__choice:not([disabled]):visible').count();
  if (routeChoices !== 2) throw new Error(`Valmir fork expected two routes, got ${routeChoices}.`);
  const valmirVideoRequested = await page.evaluate(() => performance.getEntriesByType('resource')
    .some((entry) => entry.name.includes('/assets/cinematics/valmir_route_fork.mp4')));
  if (!valmirVideoRequested) throw new Error('Valmir fork cinematic was not requested before the Travel Still choice surface.');
  const screenshot = await capture(page, 'e-valmir-fork');
  return { id: 'E', pass: true, precombat, fork, routeChoices, valmirVideoRequested, screenshot };
}

async function installFlashSampler(page) {
  await page.evaluate(() => {
    const samples = [];
    const timer = window.setInterval(() => {
      const transition = document.querySelector('.scene-transition');
      const covered = transition instanceof HTMLElement && Number(getComputedStyle(transition).opacity) > 0.05;
      const hasSurface = Boolean(document.querySelector('.narrative-stage,.journey-overlay,.dialogue,iframe.combat-frame,.exploration-stop,.travel-view'));
      samples.push({
        at: performance.now(),
        travel: Boolean(document.querySelector('.travel-view')),
        black: !hasSurface && !covered,
        mode: document.querySelector('[data-app-mode]')?.getAttribute('data-app-mode') ?? null,
        transitionOpacity: transition instanceof HTMLElement ? getComputedStyle(transition).opacity : null,
        bodyChildren: document.body.children.length,
      });
    }, 16);
    window.__cin6d6Sampler = { samples, timer };
  });
}

async function readFlashSampler(page) {
  return page.evaluate(() => {
    const sampler = window.__cin6d6Sampler;
    if (!sampler) return { travelViewFlashes: 0, blackFlashes: 0 };
    window.clearInterval(sampler.timer);
    return {
      travelViewFlashes: sampler.samples.filter((sample) => sample.travel).length,
      blackFlashes: sampler.samples.filter((sample) => sample.black).length,
      blackDetails: sampler.samples.filter((sample) => sample.black),
    };
  });
}

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT });
const result = { schemaVersion: 1, viewport: VIEWPORT, flows: [], pass: false };
try {
  result.flashes = { travelViewFlashes: 0, blackFlashes: 0, blackDetails: [] };
  result.diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  if (process.env.CIN6D6_VALMIR_ONLY !== '1') {
    const openingPage = await context.newPage();
    const openingDiagnostics = diagnosticsFor(openingPage);
    const opening = await runOpening(openingPage);
    result.flows.push(opening);
    result.flashes = opening.flashes;
    result.diagnostics = openingDiagnostics;
    await openingPage.close();
  }

  if (VIEWPORT.width === 1920 && process.env.CIN6D6_CORE_ONLY !== '1') {
    if (process.env.CIN6D6_VALMIR_ONLY !== '1') {
      const firstRefugePage = await context.newPage();
      result.flows.push(await runRefuge(firstRefugePage, 'D', 'lion-first-refuge', 'edge:lion-first-refuge>lion-reserve-trail', { lionMissionAccepted: true, helpedRefugees: true }));
      await firstRefugePage.close();
      const secondRefugePage = await context.newPage();
      result.flows.push(await runRefuge(secondRefugePage, 'H', 'lion-second-refuge', 'edge:lion-second-refuge>lion-lancer-recruit', { lionMissionAccepted: true, helpedRefugees: true, missionSuccess: true }));
      await secondRefugePage.close();
    }
    const valmirPage = await context.newPage();
    result.flows.push(await runValmir(valmirPage));
    await valmirPage.close();
  }

  const actionableFailures = (result.diagnostics?.requestFailures ?? []).filter((failure) => !/\.mp4 net::ERR_ABORTED$/u.test(failure));
  if (result.diagnostics?.consoleErrors.length || result.diagnostics?.pageErrors.length || actionableFailures.length) {
    throw new Error(`Browser diagnostics were not clean: ${JSON.stringify({ ...result.diagnostics, requestFailures: actionableFailures })}`);
  }
  if (result.flashes.travelViewFlashes || result.flashes.blackFlashes) throw new Error(`Visual flashes detected: ${JSON.stringify(result.flashes)}.`);
  result.pass = true;
} catch (error) {
  result.error = error instanceof Error ? error.stack : String(error);
} finally {
  await context.close();
  await browser.close();
}
await writeFile(resolve(OUTPUT_DIR, `results-${VIEWPORT_ID}.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
