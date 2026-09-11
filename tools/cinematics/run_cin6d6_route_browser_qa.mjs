import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN6D6_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN6D6_ROUTE_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin6d6/browser-qa/routes'));
const [viewportWidth, viewportHeight] = (process.env.CIN6D6_VIEWPORT ?? '1920x1080').split('x').map(Number);
const VIEWPORT = { width: viewportWidth, height: viewportHeight };

function diagnosticsFor(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('[VFX Preview]')) diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
  return diagnostics;
}

async function installNodeSave(page, nodeId, flags = {}, reputation = 60, seed = 6101) {
  await page.goto(`${BASE_URL}/?presentation=narrative&media=video&qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
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
}

async function continueSavedNode(page) {
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function waitForDialogueSequence(page, sequenceId) {
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${sequenceId}"]`);
  for (let index = 0; index < 240; index += 1) {
    if (await dialogue.isVisible().catch(() => false)) return dialogue;
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) await skip.evaluate((button) => button.click());
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
    };
  });
}

async function finishDialogue(page, sequenceId, choiceIndex = 0, trace = undefined) {
  const dialogue = await waitForDialogueSequence(page, sequenceId);
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
    if (await skip.count()) {
      await skip.evaluate((button) => button.click());
      await page.waitForTimeout(50);
      continue;
    }
    const choices = dialogue.locator('.dialogue-choice:not([disabled]):visible');
    if (await choices.count()) {
      await choices.nth(usedChoice ? 0 : Math.min(choiceIndex, (await choices.count()) - 1)).click();
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
  for (let index = 0; index < 240; index += 1) {
    if (await page.locator('iframe.combat-frame').count()) return 'combat';
    const journey = page.locator('.journey-overlay:visible').first();
    if (await journey.count()) return 'journey';
    const dialogue = page.locator('.dialogue:visible').first();
    if (await dialogue.count()) {
      await finishCurrentDialogue(page, trace);
      continue;
    }
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) {
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
  return page.evaluate(async () => {
    const { SaveRepository } = await import('/src/game/store.ts');
    const state = new SaveRepository().loadAuto();
    return state ? {
      currentNodeId: state.currentNodeId,
      resolvedNodeIds: state.resolvedNodeIds,
      flags: state.flags,
      endingId: state.endingId,
      memberDefinitions: state.clan.members.map((member) => member.definitionId),
    } : null;
  });
}

async function runNodeScenario(context, scenario) {
  const page = await context.newPage();
  const diagnostics = diagnosticsFor(page);
  const trace = { dialogues: new Set(), media: new Set(), combats: 0 };
  try {
    await installNodeSave(page, scenario.nodeId, scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    await waitForDialogueSequence(page, scenario.dialogueId);
    const initialPresentation = await readPresentation(page);
    const expectedMode = scenario.expectedMode ?? 'STATIC_TABLEAU';
    if (initialPresentation?.mode !== expectedMode) {
      throw new Error(`${scenario.id}: expected ${expectedMode}, got ${JSON.stringify(initialPresentation)}.`);
    }
    if (initialPresentation.primarySurfaces > 1 || initialPresentation.primaryInvariant === 'FAIL') {
      throw new Error(`${scenario.id}: multiple primary surfaces: ${JSON.stringify(initialPresentation)}.`);
    }
    await finishDialogue(page, scenario.dialogueId, scenario.choiceIndex ?? 0, trace);
    let settled = await waitForBoundaryOrCombat(page, trace);
    if (settled === 'combat') {
      await winCombat(page, trace);
      settled = await waitForBoundaryOrCombat(page, trace);
    }
    const truth = await loadSavedTruth(page);
    const assertion = scenario.assertTruth(truth);
    if (!assertion) throw new Error(`${scenario.id}: saved truth assertion failed.`);
    const expectedAbortedMediaRequests = diagnostics.requestFailures.filter((failure) => /\.mp4 net::ERR_ABORTED$/.test(failure));
    const requestFailures = diagnostics.requestFailures.filter((failure) => !/\.mp4 net::ERR_ABORTED$/.test(failure));
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || requestFailures.length) {
      throw new Error(`${scenario.id}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    const capture = `${scenario.id}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    return {
      id: scenario.id,
      nodeId: scenario.nodeId,
      settled,
      dialogues: [...trace.dialogues],
      media: [...trace.media],
      combats: trace.combats,
      initialPresentation,
      truth: scenario.pickTruth(truth),
      capture,
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
  const diagnostics = diagnosticsFor(page);
  const trace = { dialogues: new Set(), media: new Set(), combats: 0 };
  try {
    await installNodeSave(page, 'lion-final-judgement', scenario.flags, scenario.reputation, scenario.seed);
    await continueSavedNode(page);
    await waitForDialogueSequence(page, 'lion_finale_judgement');
    const judgementPresentation = await readPresentation(page);
    if (judgementPresentation?.mode !== 'CINEMATIC_HOLD' || judgementPresentation.staticActors !== 0) {
      throw new Error(`${scenario.id}: invalid judgement hold: ${JSON.stringify(judgementPresentation)}.`);
    }
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
    const requestFailures = diagnostics.requestFailures.filter((failure) => !/\.mp4 net::ERR_ABORTED$/.test(failure));
    if (diagnostics.consoleErrors.length || diagnostics.pageErrors.length || requestFailures.length) {
      throw new Error(`${scenario.id}: browser diagnostics were not clean: ${JSON.stringify(diagnostics)}`);
    }
    const capture = `${scenario.id}.png`;
    await page.screenshot({ path: resolve(OUTPUT_DIR, capture), fullPage: false });
    return {
      id: scenario.id,
      settled,
      dialogues: [...trace.dialogues],
      media: [...trace.media],
      combats: trace.combats,
      judgementPresentation,
      truth: scenario.pickTruth(truth),
      capture,
      diagnostics: { ...diagnostics, requestFailures },
      expectedAbortedMediaRequests: expectedAbortedMediaRequests.length,
      pass: true,
    };
  } finally {
    await page.close();
  }
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

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT });
const result = { schemaVersion: 1, viewport: VIEWPORT, nodes: [], finales: [], pass: false };
let failed = false;
try {
  for (const scenario of nodeScenarios) {
    try {
      result.nodes.push(await runNodeScenario(context, scenario));
    } catch (error) {
      failed = true;
      result.nodes.push({ id: scenario.id, pass: false, error: error instanceof Error ? error.stack : String(error) });
    }
  }
  for (const scenario of finaleScenarios) {
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
}
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (failed) process.exitCode = 1;
