import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

// Contextual production acceptance uses the actual GameApp; the historical isolated
// DEV staging harness below retains its original behaviour and evidence scope.
if (process.argv.includes('--production-contextual')) {
  await runContextualProduction();
  process.exit(process.exitCode ?? 0);
}

const BASE_URL = process.env.CIN6EA4_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN6EA4_OUTPUT_DIR ?? 'tmp/cinematics/cin6ea4/browser-qa');
const VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }];
const REPRESENTATIVE_SCENARIOS = [
  ['opening company', 'acte_ouverture'],
  ['camp exchange', 'camp_departure'],
  ['Audience of Alaric', 'lion_briefing'],
  ['road pre-combat', 'pre_opening_trail'],
  ['road aftermath', 'post_opening_trail'],
  ['Cedric recruitment', 'mystery_recruit'],
  ['first refuge ATE', 'ate_first_refuge_watch'],
  ['Valmir approach', 'pre_valmir_road'],
  ['Valmir aftermath', 'post_valmir_road'],
  ['second refuge', 'ate_bois_clair_night_watch'],
  ['Garen recruitment', 'mystery_lancer_recruit'],
  ['Bois-Clair defence aftermath', 'village_defense_aftermath'],
  ['Bois-Clair raid aftermath', 'village_raid_aftermath'],
  ['witnesses', 'witnesses_on_road'],
  ['young-dragon event', 'mystery_dragon_roost'],
  ['ruins aftermath', 'post_ruins_guardians'],
  ['shadow evidence', 'shadow_signs'],
  ['final refuge', 'final_refuge'],
].map(([label, dialogueId]) => ({ label, dialogueId }));

const HONOUR_FLAGS = {
  helpedRefugees: true,
  prioritizedVillage: true,
  missionSuccess: true,
  protectedWitnesses: true,
};

const FINALE_SCENARIOS = [
  {
    label: 'Lion finale dynamic opening',
    dialogueId: 'lion_finale_judgement',
    stepId: 'open',
    flags: HONOUR_FLAGS,
    expectedActor: 'alaric',
  },
  {
    label: 'Serpent finale pursuit',
    dialogueId: 'serpent_pursuit_pre_combat',
    stepId: '3',
    flags: { ...HONOUR_FLAGS, shadowEvidence: true, shadowRevealed: true },
    expectedActor: 'sage_seraphine',
  },
  {
    label: 'Serpent finale aftermath',
    dialogueId: 'serpent_general_aftermath',
    stepId: '1',
    flags: { ...HONOUR_FLAGS, serpentGeneralDefeated: true, shadowEvidence: true },
    expectedActor: 'sage_seraphine',
  },
  {
    label: 'voluntary Lion Trial',
    dialogueId: 'pre_lion_chief',
    stepId: '1',
    flags: { ...HONOUR_FLAGS, lionTrialRequested: true },
    expectedActor: 'alaric',
    expectedTag: 'Épreuve demandée',
  },
  {
    label: 'non-voluntary Lion Trial',
    dialogueId: 'pre_lion_chief',
    stepId: '1',
    flags: { missionGreed: true, silencedWitnesses: true, lionTrialRequested: false },
    expectedActor: 'alaric',
    expectedTag: 'Reconnaissance refusée',
  },
  {
    label: 'final refuge recruited company',
    dialogueId: 'final_refuge',
    stepId: 'r5-garen-final-pledge',
    flags: { ...HONOUR_FLAGS, recruitedCedric: true, recruitedLancer: true },
    expectedActor: 'lancer',
  },
  {
    label: 'epilogue terminal presentation',
    dialogueId: 'epilogue',
    stepId: '3',
    flags: { ...HONOUR_FLAGS, serpentGeneralDefeated: true, shadowEvidence: true, shadowRevealed: true },
    expectedActor: 'sage_seraphine',
  },
];

const TARGETED_SCENARIOS = [
  { label: 'direct-response facing', dialogueId: 'acte_ouverture', stepId: '3', expectedResolution: 'DIRECT_RESPONSE', expectedTarget: 'maelor' },
  { label: 'authored-target facing', dialogueId: 'ate_maelor_seal_analysis', stepId: '1', expectedResolution: 'AUTHORED_CONVERSATION_TARGET', expectedTarget: 'sage_seraphine' },
  { label: 'Maelor to Alaric', dialogueId: 'lion_briefing', stepId: '3', expectedResolution: 'EXPLICIT_ADDRESSEE', expectedTarget: 'alaric', expectedPosition: 'CENTER_LEFT', expectedFacing: 'RIGHT' },
  { label: 'Maelor to company', dialogueId: 'acte_ouverture', stepId: '2', expectedResolution: 'EXPLICIT_ADDRESSEE', expectedTarget: 'sage_seraphine', expectedPosition: 'CENTER_LEFT', expectedFacing: 'LEFT' },
  { label: 'five-plus cast split', dialogueId: 'acte_ouverture', stepId: '5', expectedActorCount: 4 },
];

const visualAudit = JSON.parse(await readFile(resolve('tools/cinematics/specs/final_dialogue_visual_segments.json'), 'utf8'));
const auditByDialogue = new Map(visualAudit.entries.map((entry) => [entry.dialogueId, entry]));

function selectedStep(scenario) {
  if (scenario.stepId) return scenario.stepId;
  const entry = auditByDialogue.get(scenario.dialogueId);
  if (!entry) throw new Error(`Missing visual audit entry for representative scenario ${scenario.dialogueId}.`);
  if (scenario.dialogueId === 'lion_briefing') return '3';
  if (scenario.dialogueId === 'camp_departure') return '1b';
  const staticSegment = entry.segments.find((segment) => segment.mode === 'STATIC_TABLEAU') ?? entry.segments.at(-1);
  return staticSegment.stepIds[0];
}

async function loadHarness(page) {
  await page.goto(`${BASE_URL}/docs/reports/cin-6e-a-4r-dialogue-review.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    if (!document.querySelector('link[data-cin6ea4-runtime-css]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/src/styles/app.css';
      css.dataset.cin6ea4RuntimeCss = 'true';
      document.head.append(css);
      await new Promise((resolveLoad, rejectLoad) => {
        css.addEventListener('load', resolveLoad, { once: true });
        css.addEventListener('error', rejectLoad, { once: true });
      });
    }
    const [content, contextual, tableaux, segments, surfaceModule, adapter, dialogueModule, store, stageModule, playerModule, registryModule, presentationResolver] = await Promise.all([
      import('/src/game/content.ts'),
      import('/src/game/contextualDialogueContent.ts'),
      import('/src/cinematics/NarrativeTableau.ts'),
      import('/src/cinematics/DialoguePresentationSegments.ts'),
      import('/src/cinematics/NarrativeSceneSurface.ts'),
      import('/src/cinematics/NarrativeDialogueAdapter.ts'),
      import('/src/ui/DialogueView.ts'),
      import('/src/game/store.ts'),
      import('/src/cinematics/NarrativeStage.ts'),
      import('/src/cinematics/CinematicPlayer.ts'),
      import('/src/cinematics/CinematicRegistry.ts'),
      import('/src/cinematics/NarrativePresentationResolver.ts'),
    ]);
    window.__cin6ea4 = { content, contextual, tableaux, segments, surfaceModule, adapter, dialogueModule, store, stageModule, playerModule, registryModule, presentationResolver };
  });
}

async function renderScenario(page, scenario) {
  const stepId = selectedStep(scenario);
  await page.evaluate(async ({ dialogueId, stepId, flags = {} }) => {
    const modules = window.__cin6ea4;
    window.__cin6ea4View?.close();
    window.__cin6ea4Surface?.dispose();
    document.body.replaceChildren();
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    const state = modules.store.createInitialState();
    state.flags = { ...flags };
    const resolved = modules.contextual.resolveGameDialogue(dialogueId, state);
    const sequence = resolved?.sequence;
    if (!sequence) throw new Error(`Missing runtime dialogue ${dialogueId}.`);
    const base = modules.tableaux.resolveNarrativeDialogueTableau(dialogueId, sequence)
      ?? modules.tableaux.createGenericNarrativeTableau(sequence);
    const tableau = modules.segments.applyFinalDialoguePresentationPlan(sequence, base);
    const phase = tableau.phases.find((candidate) => candidate.stepIds.includes(stepId));
    const step = sequence.steps.find((candidate) => candidate.id === stepId);
    if (!phase || !step) throw new Error(`Missing ${dialogueId}:${stepId} staging data.`);

    const stage = document.createElement('section');
    stage.className = 'narrative-stage';
    stage.dataset.narrativeTableau = tableau.id;
    const media = document.createElement('div');
    media.className = 'narrative-stage__media';
    media.dataset.narrativeLayer = 'media';
    const dialogue = document.createElement('div');
    dialogue.className = 'narrative-stage__dialogue';
    dialogue.dataset.narrativeLayer = 'dialogue';
    stage.append(media, dialogue);
    document.body.append(stage);

    const resolver = modules.adapter.createNarrativeDialogueResolver(sequence, tableau, { mediaMode: 'STILL' });
    const presentation = resolver(step);
    const sceneSurface = new modules.surfaceModule.NarrativeSceneSurface(media, tableau, { reducedMotion: true });
    sceneSurface.bindDialogue(sequence);
    sceneSurface.mount(tableau.stillImage ?? modules.dialogueModule.resolveDialogueBackdrop(sequence), presentation.phaseId ?? phase.id);
    await sceneSurface.whenRenderable();
    await sceneSurface.setPhase(
      presentation.phaseId ?? phase.id,
      step.actorId,
      presentation.layoutPlacement,
      presentation.speakerFacing,
      presentation.speakerLookTarget,
      presentation.addressedTo,
      presentation.addressResolution,
    );
    const oneStep = { ...sequence, steps: [{ ...step, next: null }] };
    const view = new modules.dialogueModule.DialogueView({
      root: dialogue,
      getState: modules.store.createInitialState,
      applyEffects: async () => undefined,
    });
    void view.play(oneStep, {
      mode: 'narrative-stage',
      root: dialogue,
      reducedMotion: true,
      stepPresentation: resolver,
      beforeStepChange: async (nextStep, presentation) => {
        await sceneSurface.setPhase(
          presentation.phaseId,
          nextStep.actorId,
          presentation.layoutPlacement,
          presentation.speakerFacing,
          presentation.speakerLookTarget,
          presentation.addressedTo,
          presentation.addressResolution,
        );
      },
    });
    window.__cin6ea4View = view;
    window.__cin6ea4Surface = sceneSurface;
  }, { dialogueId: scenario.dialogueId, stepId, flags: scenario.flags ?? {} });
  const dialogue = page.locator(`.dialogue[data-dialogue-step="${stepId}"]`);
  await dialogue.waitFor({ state: 'visible', timeout: 10_000 });
  if (await dialogue.getAttribute('data-narrative-agency-state') === 'SETUP') {
    await dialogue.locator('.dialogue__box').click();
    await dialogue.locator('.dialogue-choice').first().waitFor({ state: 'visible', timeout: 5_000 });
  }
  await page.waitForTimeout(360);
  return page.locator('.narrative-stage').evaluate((stage, label) => {
    const dialogue = stage.querySelector('.dialogue');
    const card = stage.querySelector('.dialogue__box');
    const actors = [...stage.querySelectorAll('.narrative-cast__actor')];
    const surface = stage.querySelector('.narrative-scene-surface');
    const activeActor = actors.find((actor) => actor.getAttribute('data-cast-state') === 'ACTIVE');
    const buttons = [...stage.querySelectorAll('button:not([disabled])')].filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(button).visibility !== 'hidden';
    });
    const viewport = { width: innerWidth, height: innerHeight };
    const inViewport = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
    };
    return {
      label,
      stepId: dialogue?.getAttribute('data-dialogue-step'),
      actorId: dialogue?.getAttribute('data-dialogue-actor'),
      stepTag: dialogue?.querySelector('.dialogue__tag')?.textContent?.trim(),
      phaseId: dialogue?.getAttribute('data-narrative-phase'),
      segmentMode: dialogue?.getAttribute('data-narrative-scene-mode'),
      actorIds: actors.map((actor) => actor.getAttribute('data-actor-id')),
      actorPositions: actors.map((actor) => actor.getAttribute('data-screen-position')),
      actorFacings: actors.map((actor) => actor.getAttribute('data-facing')),
      actorGroups: actors.map((actor) => actor.getAttribute('data-actor-group')),
      actorSides: actors.map((actor) => actor.getAttribute('data-dramatic-side')),
      actorScales: actors.map((actor) => actor.getAttribute('data-physical-scale')),
      activeActors: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'ACTIVE').map((actor) => actor.getAttribute('data-actor-id')),
      missingActorImages: actors.filter((actor) => !actor.querySelector('img')).map((actor) => actor.getAttribute('data-actor-id')),
      speakerPosition: activeActor?.getAttribute('data-screen-position'),
      speakerFacing: activeActor?.getAttribute('data-facing'),
      speakerLookTarget: activeActor?.getAttribute('data-look-target'),
      addressedTo: surface?.getAttribute('data-addressed-to'),
      addressResolution: surface?.getAttribute('data-address-resolution'),
      cardOverflow: card instanceof HTMLElement ? (() => {
        const cardRect = card.getBoundingClientRect();
        return [...card.querySelectorAll('.dialogue__speaker-block,.dialogue__text,.dialogue__outcomes')]
          .filter((element) => element instanceof HTMLElement && !element.hidden && getComputedStyle(element).display !== 'none')
          .some((element) => {
            const rect = element.getBoundingClientRect();
            return rect.top < cardRect.top - 1 || rect.bottom > cardRect.bottom + 1;
          });
      })() : true,
      buttonRects: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return { text: button.textContent?.trim(), left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      }),
      buttonsInViewport: buttons.every(inViewport),
      bodyOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
      modalOwners: stage.querySelectorAll('[aria-modal="true"]').length,
      viewport,
    };
  }, scenario.label);
}

function assertMetrics(metrics, scenario) {
  if (!metrics.actorIds.includes(metrics.actorId)) throw new Error(`${scenario.label}: speaker ${metrics.actorId} is not staged.`);
  if (!metrics.activeActors.includes(metrics.actorId)) throw new Error(`${scenario.label}: speaker ${metrics.actorId} is not active before the line.`);
  if (metrics.actorIds.length > 4) throw new Error(`${scenario.label}: ${metrics.actorIds.length} actors exceed the static-tableau maximum.`);
  if (new Set(metrics.actorPositions).size !== metrics.actorPositions.length) throw new Error(`${scenario.label}: actors share screen positions.`);
  if (metrics.actorScales.some((scale) => scale !== '1')) throw new Error(`${scenario.label}: physical scale drifted.`);
  if (metrics.segmentMode !== 'STATIC_TABLEAU') throw new Error(`${scenario.label}: dialogue did not use STATIC_TABLEAU.`);
  if (metrics.actorGroups.some((group) => !['PLAYER_COMPANY', 'LION_COURT', 'LOCAL_CIVILIAN', 'REFUGEE', 'ANTAGONIST', 'RECRUIT_CANDIDATE', 'NEUTRAL'].includes(group))) throw new Error(`${scenario.label}: invalid actor group.`);
  if (metrics.actorSides.some((side) => !['LEFT', 'CENTER', 'RIGHT'].includes(side))) throw new Error(`${scenario.label}: invalid dramatic side.`);
  if (scenario.expectedResolution && metrics.addressResolution !== scenario.expectedResolution) throw new Error(`${scenario.label}: expected ${scenario.expectedResolution}, received ${metrics.addressResolution}.`);
  if (scenario.expectedTarget && (metrics.addressedTo !== scenario.expectedTarget || metrics.speakerLookTarget !== scenario.expectedTarget)) throw new Error(`${scenario.label}: expected address target ${scenario.expectedTarget}, received ${metrics.addressedTo}/${metrics.speakerLookTarget}.`);
  if (scenario.expectedPosition && metrics.speakerPosition !== scenario.expectedPosition) throw new Error(`${scenario.label}: expected stable position ${scenario.expectedPosition}, received ${metrics.speakerPosition}.`);
  if (scenario.expectedFacing && metrics.speakerFacing !== scenario.expectedFacing) throw new Error(`${scenario.label}: expected facing ${scenario.expectedFacing}, received ${metrics.speakerFacing}.`);
  if (scenario.expectedActorCount && metrics.actorIds.length !== scenario.expectedActorCount) throw new Error(`${scenario.label}: expected ${scenario.expectedActorCount} actors, received ${metrics.actorIds.length}.`);
  if (metrics.missingActorImages.length) throw new Error(`${scenario.label}: missing canonical images for ${metrics.missingActorImages.join(', ')}.`);
  if (metrics.cardOverflow || !metrics.buttonsInViewport || metrics.bodyOverflow) throw new Error(`${scenario.label}: dialogue UI overflow or viewport collision: ${JSON.stringify({ cardOverflow: metrics.cardOverflow, buttonsInViewport: metrics.buttonsInViewport, bodyOverflow: metrics.bodyOverflow, viewport: metrics.viewport, buttonRects: metrics.buttonRects })}.`);
  if (metrics.modalOwners !== 1) throw new Error(`${scenario.label}: expected one modal owner, found ${metrics.modalOwners}.`);
  if (scenario.expectedActor && metrics.actorId !== scenario.expectedActor) throw new Error(`${scenario.label}: expected speaker ${scenario.expectedActor}, received ${metrics.actorId}.`);
  if (scenario.expectedTag && metrics.stepTag !== scenario.expectedTag) throw new Error(`${scenario.label}: expected tag ${scenario.expectedTag}, received ${metrics.stepTag}.`);
}

async function runLiveLionOpeningProbe(page) {
  await page.goto(`${BASE_URL}/?qa=1&cinematic=1&presentation=narrative&media=stills`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-cinematic-qa="real-dialogue"]').click();
  await page.locator('.dialogue[data-dialogue-step="open"]').waitFor({ state: 'visible', timeout: 10_000 });
  return page.locator('.narrative-stage').evaluate((stage) => {
    const dialogue = stage.querySelector('.dialogue');
    const actors = [...stage.querySelectorAll('.narrative-cast__actor')];
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    return {
      stepId: dialogue?.getAttribute('data-dialogue-step'),
      actorId: dialogue?.getAttribute('data-dialogue-actor'),
      surfaceMode: dialogue?.getAttribute('data-narrative-scene-mode'),
      stageStepId: stage.dataset.narrativeDialogueStep,
      castOwnership: stage.dataset.narrativeCastOwnership,
      fallbackActive: stage.dataset.fallbackActive,
      activeActors: actors.filter((actor) => actor.getAttribute('data-cast-state') === 'ACTIVE').map((actor) => actor.getAttribute('data-actor-id')),
      missingActorImages: actors.filter((actor) => !actor.querySelector('img')).map((actor) => actor.getAttribute('data-actor-id')),
      travelViewVisible: [...document.querySelectorAll('.travel-view')].some(visible),
      cinematicOverlayVisible: [...document.querySelectorAll('.cinematic-overlay')].some(visible),
      bodyOverflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
    };
  });
}

function assertLiveLionOpeningProbe(probe) {
  if (probe.stepId !== 'open' || probe.stageStepId !== 'open') throw new Error(`Live Lion opening did not resolve open: ${JSON.stringify(probe)}.`);
  if (probe.actorId !== 'alaric' || !probe.activeActors.includes('alaric')) throw new Error(`Live Lion opening did not stage active Alaric: ${JSON.stringify(probe)}.`);
  if (probe.surfaceMode !== 'STATIC_TABLEAU' || probe.castOwnership !== 'STAGE_OWNS_CAST') throw new Error(`Live Lion opening ownership mismatch: ${JSON.stringify(probe)}.`);
  if (probe.fallbackActive !== 'false' || probe.travelViewVisible || probe.cinematicOverlayVisible) throw new Error(`Live Lion opening retained an unexpected fallback/Travel/video surface: ${JSON.stringify(probe)}.`);
  if (probe.missingActorImages.length || probe.bodyOverflow) throw new Error(`Live Lion opening cast/viewport failure: ${JSON.stringify(probe)}.`);
}

async function runTransitionProbe(page) {
  return page.evaluate(async () => {
    const modules = window.__cin6ea4;
    window.__cin6ea4View?.close();
    window.__cin6ea4Surface?.dispose();
    document.body.replaceChildren();
    const sequence = modules.content.dialogues.get('lion_briefing');
    const tableau = modules.segments.applyFinalDialoguePresentationPlan(sequence, modules.tableaux.ALARIC_AUDIENCE_TABLEAU);
    const registry = new modules.registryModule.CinematicRegistry({ version: 1, cinematics: [] });
    const player = new modules.playerModule.CinematicPlayer(registry);
    const stage = new modules.stageModule.NarrativeStage({ registry, player, transitionRevealMs: 0, dev: true });
    stage.setTableau(tableau);
    stage.bindDialogue(sequence);
    const phaseId = tableau.phases[0].id;
    const backdrop = tableau.stillImage ?? modules.dialogueModule.resolveDialogueBackdrop(sequence);

    await stage.presentDialogueTableau(backdrop, phaseId, 'VIDEO');
    const videoToTableau = {
      transition: stage.element.dataset.narrativePreludeTransition,
      kind: stage.currentMediaSurfaceKind,
      cast: stage.element.querySelectorAll('.narrative-cast__actor').length,
      normalDialogueDuringVideo: stage.element.dataset.normalDialogueDuringVideo,
    };

    const travel = modules.presentationResolver.getResolvedPresentationBeat('edge:lion-audience>lion-opening-ambush');
    await stage.presentTravelStill(travel, { fallbackAsset: backdrop, reducedMotion: true });
    const travelBefore = stage.currentMediaSurfaceKind;
    await stage.presentDialogueTableau(backdrop, phaseId, 'TRAVEL');
    const travelToTableau = {
      previousKind: travelBefore,
      transition: stage.element.dataset.narrativePreludeTransition,
      kind: stage.currentMediaSurfaceKind,
    };

    const residue = document.createElement('p');
    residue.textContent = 'dialogue residue';
    stage.dialogueLayer.append(residue);
    const hold = modules.presentationResolver.getResolvedPresentationBeat('dialogue:lion_briefing');
    await stage.enterCinematicHold(hold, backdrop);
    const tableauToHold = {
      holdSemantics: stage.element.dataset.narrativeHoldSemantics,
      dialogueSteps: stage.element.dataset.dialogueStepsOnHold,
      choiceSteps: stage.element.dataset.choiceStepsOnHold,
      dialogueChildren: stage.dialogueLayer.childElementCount,
      dialogueInert: stage.dialogueLayer.inert,
      cast: stage.element.querySelectorAll('.narrative-cast__actor').length,
    };

    await stage.presentDialogueTableau(backdrop, phaseId, 'HOLD');
    const holdToTableau = {
      transition: stage.element.dataset.narrativePreludeTransition,
      kind: stage.currentMediaSurfaceKind,
      cast: stage.element.querySelectorAll('.narrative-cast__actor').length,
    };
    stage.dispose();
    return { videoToTableau, travelToTableau, tableauToHold, holdToTableau };
  });
}

function assertTransitionProbe(probe) {
  if (JSON.stringify(probe.videoToTableau) !== JSON.stringify({ transition: 'VIDEO_TO_TABLEAU', kind: 'STATIC_TABLEAU', cast: 4, normalDialogueDuringVideo: '0' })) throw new Error(`VIDEO->TABLEAU probe failed: ${JSON.stringify(probe.videoToTableau)}.`);
  if (JSON.stringify(probe.travelToTableau) !== JSON.stringify({ previousKind: 'TRAVEL_STILL', transition: 'TRAVEL_TO_TABLEAU', kind: 'STATIC_TABLEAU' })) throw new Error(`TRAVEL->TABLEAU probe failed: ${JSON.stringify(probe.travelToTableau)}.`);
  if (JSON.stringify(probe.tableauToHold) !== JSON.stringify({ holdSemantics: 'DIALOGUE_FREE', dialogueSteps: '0', choiceSteps: '0', dialogueChildren: 0, dialogueInert: true, cast: 0 })) throw new Error(`TABLEAU->HOLD probe failed: ${JSON.stringify(probe.tableauToHold)}.`);
  if (JSON.stringify(probe.holdToTableau) !== JSON.stringify({ transition: 'HOLD_TO_TABLEAU', kind: 'STATIC_TABLEAU', cast: 4 })) throw new Error(`HOLD->TABLEAU probe failed: ${JSON.stringify(probe.holdToTableau)}.`);
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
      const liveLionOpeningProbe = await runLiveLionOpeningProbe(page);
      assertLiveLionOpeningProbe(liveLionOpeningProbe);
      const prefix = `${viewport.width}x${viewport.height}`;
      await page.screenshot({ path: resolve(OUTPUT_DIR, `${prefix}-live-lion-open.png`) });
      await loadHarness(page);
      await page.screenshot({ path: resolve(OUTPUT_DIR, `${prefix}-review-overview.png`) });
      const metrics = [];
      for (const scenario of REPRESENTATIVE_SCENARIOS) {
        const scenarioMetrics = await renderScenario(page, scenario);
        assertMetrics(scenarioMetrics, scenario);
        metrics.push({ ...scenario, ...scenarioMetrics });
        if (['acte_ouverture', 'lion_briefing', 'village_defense_aftermath', 'lion_finale_judgement'].includes(scenario.dialogueId)) {
          await page.screenshot({ path: resolve(OUTPUT_DIR, `${prefix}-${scenario.dialogueId}.png`) });
        }
      }
      const finaleMetrics = [];
      for (const scenario of FINALE_SCENARIOS) {
        const scenarioMetrics = await renderScenario(page, scenario);
        assertMetrics(scenarioMetrics, scenario);
        finaleMetrics.push({ ...scenario, ...scenarioMetrics });
        if (['lion_finale_judgement', 'pre_lion_chief', 'final_refuge', 'epilogue'].includes(scenario.dialogueId)) {
          await page.screenshot({ path: resolve(OUTPUT_DIR, `${prefix}-finale-${scenario.dialogueId}-${scenario.stepId}.png`) });
        }
      }
      const targetedMetrics = [];
      for (const scenario of TARGETED_SCENARIOS) {
        const scenarioMetrics = await renderScenario(page, scenario);
        assertMetrics(scenarioMetrics, scenario);
        targetedMetrics.push({ ...scenario, ...scenarioMetrics });
      }
      const openingAudit = auditByDialogue.get('acte_ouverture');
      const openingUniqueCast = new Set(openingAudit.segments.flatMap((segment) => segment.visibleCast));
      if (openingUniqueCast.size < 5 || openingAudit.segments.some((segment) => segment.visibleCast.length > 4)) throw new Error('Five-plus cast split probe failed.');
      const transitionProbe = await runTransitionProbe(page);
      assertTransitionProbe(transitionProbe);
      if (consoleErrors.length || pageErrors.length) throw new Error(`Browser errors: ${JSON.stringify({ consoleErrors, pageErrors })}`);
      results.push({ viewport, liveLionOpeningProbe, representativeScenarios: metrics, finaleScenarios: finaleMetrics, targetedScenarios: targetedMetrics, transitionProbe, fivePlusCastSplit: { uniqueCast: openingUniqueCast.size, maxActorsPerTableau: Math.max(...openingAudit.segments.map((segment) => segment.visibleCast.length)) }, screenshots: 10, consoleErrors, pageErrors, pass: true });
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
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify({ baseline: visualAudit.baseline, doctrine: 'STATIC_TABLEAU_FIRST', representativeScenarioCount: REPRESENTATIVE_SCENARIOS.length, finaleScenarioCount: FINALE_SCENARIOS.length, targetedScenarioCount: TARGETED_SCENARIOS.length, results }, null, 2)}\n`);
console.log(JSON.stringify(results.map((result) => ({ viewport: result.viewport, pass: result.pass, liveLionOpen: result.liveLionOpeningProbe?.stepId ?? null, representativeScenarios: result.representativeScenarios?.length ?? 0, finaleScenarios: result.finaleScenarios?.length ?? 0, targetedScenarios: result.targetedScenarios?.length ?? 0, transitions: result.transitionProbe ? 4 : 0, error: result.error })), null, 2));
if (failed) process.exitCode = 1;

async function runContextualProduction() {
  const { createServer, preview } = await import('vite');
  const { beginJob } = await import('../qa/qa-job.mjs');
  const assert = (await import('node:assert/strict')).default;
  const output = process.env.CIN6EA4_OUTPUT_DIR;
  assert.ok(output?.startsWith('tmp/'), 'Contextual production requires a unique ignored output');
  const port = Number(process.env.CIN6EA4_PORT ?? 5373);
  const nightWatch = process.env.CIN6EA4_NIGHT_WATCH === '1';
  const councilContinuation = !nightWatch && process.env.CIN6EA4_COUNCIL_CONTINUATION === '1';
  const parameters = nightWatch ? {
    mode: 'bois-clair-night-tableau-production', cells: ['1366x768-normal'], contexts: ['bois-clair-night-watch'], gameReducedMotion: false,
    method: 'fixture-origin native ATE selection; first authored step pages only; corrected night plate and four actors; no earned campaign claim',
  } : councilContinuation ? {
    mode: 'contextual-council-continuation-production',
    cells: ['1366x768-normal'], contexts: ['protected-witness-council'], gameReducedMotion: false,
    method: 'fixture-origin native owner selection; council steps 1 through 3; keyboard advancement without target refocus; static presentation only',
  } : {
    mode: 'contextual-static-production',
    cells: ['1366x768-os', '620x780-os', '620x780-normal'],
    contexts: ['protected-witness-council', 'first-refuge-exploitation', 'displaced-family'],
    gameReducedMotion: false,
    method: 'fixture-origin native owner selection; first authored step pages only; keyboard advancement; static player observations',
  };
  const requiredAssertions = nightWatch ? [
    'Native night watch first-step pages concatenate to the authored contextual text at PC1366 normal',
    'Corrected night plate is loaded byte-identically; exactly four stage-owned actors, one STATIC_TABLEAU, readable text and enabled controls',
    'No moving media, combat or driver owner writes after fixture origin; owner and stored V6 invariant during observations; clean diagnostics',
  ] : councilContinuation ? [
    'Council steps 1, 2 and 3 concatenate separately to their complete protected-witness text with canonical speakers',
    'Native protected witness facts are observed after the declared fixture origin; no subsequent owner, flag or outcome writes by the driver',
    'One STATIC_TABLEAU, Champion left facing Alaric right with stable reciprocal facing and look targets, at most four actors',
    'Automatic enabled dialogue focus stays visible through native Enter advancement without refocusing the target; settled text fits',
    'Every observation preserves complete live owner state and stored V6 bytes; normal OS/game motion, zero combat and clean diagnostics',
    'Complete accessible control names include the current segment and action during progressive reveal; at least one observation precedes completed reveal',
  ] : [
    'All first-step pages concatenate to the authored factual acknowledgement in each context and cell',
    'Native live facts match protected witnesses or refugee exploitation; no event or outcome injection',
    'One STATIC_TABLEAU with one to four actors; settled text and enabled controls fit; no moving media',
    'OS-only cells keep game setting false and native static player results played=false with OS reduction true',
    'Each static observation preserves complete stored save bytes; Enter advances existing dialogue controls; clean diagnostics and zero combat',
  ];
  const job = beginJob({ output, driver: 'tools/cinematics/run_cin6ea4_dialogue_qa.mjs', port, parameters, requiredAssertions });
  const report = { schemaVersion: 1, parameters, results: [], errors: [], pass: false,
    scope: nightWatch ? 'Fixture-origin nighttime ATE first-step presentation only at PC1366 normal; no earned campaign, other steps, outcomes, balance, mobile or global acceptance' : councilContinuation
      ? 'Fixture-origin protected council steps 1 through 3 at PC1366 normal; no earned lineage, node completion, reload, OS/mobile or dynamic cast-transition acceptance'
      : 'Fixture-origin first-step contextual static presentation; no earned campaign, node completion, reload, autofocus or dynamic cast-transition acceptance' };
  let models, server, browser;
  try {
    models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
    const { createInitialState } = await models.ssrLoadModule('/src/game/store.ts');
    const { createRunState, enterRunNode } = await models.ssrLoadModule('/src/game/runSystem.ts');
    const { resolveGameDialogue } = await models.ssrLoadModule('/src/game/contextualDialogueContent.ts');
    const { demoEnvironmentPlateForContext } = await models.ssrLoadModule('/src/render/demoEnvironmentPack.ts');
    server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
    browser = await chromium.launch({ headless: true });
    const cases = [
      { id: 'protected-witness-council', nodeId: 'lion-witnesses', sequence: 'ate_lion_council_doubt', seed: 6101, flags: { missionSuccess: true },
        expected: 'Les survivants de Bois-Clair ont choisi de parler librement. Leur témoignage compte, mais il ne suffit pas à leur remettre le Sceau.' },
      { id: 'first-refuge-exploitation', nodeId: 'lion-first-refuge', sequence: 'ate_first_refuge_watch', seed: 6101,
        flags: { lionMissionAccepted: true, lionMandateAdvance: true, exploitedRefugees: true },
        expected: 'Les feux sont bas. Une famille arrivée après nous raconte que notre compagnie lui a vendu le chemin du refuge contre ses quarante dernières pièces. Le refuge écoute cette version avec une attention que notre bannière ne peut pas commander.' },
      { id: 'displaced-family', nodeId: 'lion-final-refuge', sequence: 'rep_event_displaced_family_demand', seed: 26,
        flags: { lionMissionAccepted: true, lionMandateAdvance: true, exploitedRefugees: true, missionSuccess: true },
        expected: 'Vous avez vendu l’itinéraire contre les quarante dernières pièces de familles qui n’avaient déjà presque rien. Je ne demande pas que vous réécriviez la route. Je demande ce que vous faites maintenant pour leur prochain convoi.' },
    ];
    cases.push({ id: 'bois-clair-night-watch', nodeId: 'lion-second-refuge', sequence: 'ate_bois_clair_night_watch', seed: 6101, flags: { missionSuccess: true } });
    const councilSteps = {
      '1': { actor: 'lion_champion', text: cases[0].expected },
      '2': { actor: 'alaric', text: 'Les survivants de Bois-Clair ont choisi de parler librement. Ils ne demandent ni faveur ni vengeance : ils apportent des faits. Le Lion les entendra.' },
      '3': { actor: 'lion_champion', text: 'Des témoins libres, alors. Leur parole n’offre pas le Sceau, mais elle interdit que nous jugions ces étrangers sur de simples rumeurs.' },
    };
    for (const cell of parameters.cells) for (const scenario of cases.filter(entry => parameters.contexts.includes(entry.id))) {
      const [width, height] = cell.split('-')[0].split('x').map(Number), os = cell.endsWith('-os');
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: os ? 'reduce' : 'no-preference' });
      const page = await context.newPage(), errors = [], segments = [];
      let choiceControls = null;
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => { if (!/\.mp4$/.test(new URL(request.url()).pathname) || request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${request.url()} ${request.failure()?.errorText}`); });
      try {
        await page.route('**/assets/game-*.js', async route => {
          const response = await route.fetch(), source = await response.text();
          const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
          assert.ok(pattern.test(source), 'Built bootstrap hook missing');
          await route.fulfill({ response, body: source.replace(pattern, (match, name) => match.replace(';window.addEventListener', `;window.__contextualApp=${name};window.addEventListener`)) });
        });
        const state = createInitialState(); state.run = createRunState(scenario.seed);
        state.currentNodeId = state.run.currentNodeId; state.visitedNodeIds = [...state.run.visitedNodeIds];
        state.flags.prologueSeen = true; state.settings.reducedGraphics = false;
        Object.assign(state.flags, scenario.flags); state.reputation = 60;
        const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
        const previous = new Map([[state.currentNodeId, null]]), queue = [state.currentNodeId];
        // Build the declared origin fixture using the authored graph, never a failed save.
        while (queue.length && !previous.has(scenario.nodeId)) {
          const current = queue.shift();
          for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
        }
        assert.ok(previous.has(scenario.nodeId), 'No authored path to fixture origin');
        const path = []; for (let id = scenario.nodeId; id; id = previous.get(id)) path.unshift(id);
        for (const id of path.slice(1)) {
          state.resolvedNodeIds.push(state.currentNodeId); assert.ok(enterRunNode(state.run, id));
          state.currentNodeId = id; state.visitedNodeIds = [...state.run.visitedNodeIds]; state.stepCounter++;
        }
        if (nightWatch) scenario.expected = resolveGameDialogue(scenario.sequence, state).sequence.steps[0].text;
        await page.goto(`http://127.0.0.1:${port}/?presentation=narrative&media=video`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(fixture => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(fixture)), state);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__contextualApp);
        await page.evaluate(() => {
          window.__contextualMotion = [];
          const player = window.__contextualApp.cinematicPlayer;
          for (const method of ['play', 'playHeld']) {
            const original = player[method].bind(player);
            player[method] = async (id, options = {}) => {
              const outcome = await original(id, options), result = outcome.result ?? outcome;
              window.__contextualMotion.push({ id, played: result.played, reason: result.reason,
                osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches, gameReduced: window.__contextualApp.state.settings.reducedGraphics });
              return outcome;
            };
          }
        });
        await page.getByRole('button', { name: 'Continuer', exact: true }).click();
        const deadline = Date.now() + 180000;
        while (Date.now() < deadline) {
          assert.equal(await page.locator('iframe').count(), 0, 'Unexpected combat in static context');
          const dialogue = page.locator('.dialogue:visible').first();
          if (await dialogue.count()) {
            const sequence = await dialogue.getAttribute('data-dialogue-sequence'), step = await dialogue.getAttribute('data-dialogue-step');
            if (segments.length && (sequence !== scenario.sequence || !(councilContinuation ? step in councilSteps : step === '1'))) break;
            const visibleChoices = dialogue.locator('.dialogue-choice:visible:not([disabled])');
            if (segments.length && sequence === scenario.sequence && await visibleChoices.count()) {
              choiceControls = await visibleChoices.evaluateAll(buttons => buttons.map(button => {
                const r = button.getBoundingClientRect();
                return { text: button.textContent, withinViewport: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1,
                  width: r.width, height: r.height };
              }));
              assert.ok(choiceControls.every(control => control.withinViewport && control.width >= 24 && control.height >= 24));
              const choice = scenario.id === 'displaced-family' ? visibleChoices.nth(1) : visibleChoices.first();
              await choice.focus(); assert.ok(await choice.evaluate(button => document.activeElement === button));
              await page.screenshot({ path: resolve(output, `${cell}-${scenario.id}-choices.png`) });
              break;
            }
            let accessibleNameDuringReveal = null;
            if (councilContinuation && sequence === scenario.sequence) {
              await page.waitForFunction(() => {
                const element = document.querySelector('.dialogue');
                return element && !element.classList.contains('dialogue--preparing-step')
                  && element.querySelector('.dialogue__text')?.dataset.finalText;
              });
              accessibleNameDuringReveal = await dialogue.evaluate(element => {
                const box = element.querySelector('.dialogue__box'), text = element.querySelector('.dialogue__text');
                return { label: box.getAttribute('aria-label'), text: text.dataset.finalText,
                  action: element.querySelector('.dialogue__continue').textContent,
                  revealed: text.querySelector('.dialogue__text-reveal').textContent, focused: document.activeElement === box };
              });
              assert.ok(accessibleNameDuringReveal.focused && accessibleNameDuringReveal.label?.includes(accessibleNameDuringReveal.text)
                && accessibleNameDuringReveal.label.includes(accessibleNameDuringReveal.action), 'Incomplete accessible dialogue control name');
              assert.equal(await dialogue.getByRole('button', { name: accessibleNameDuringReveal.label, exact: true }).count(), 1);
            }
            await page.waitForFunction(() => {
              const dialogue = document.querySelector('.dialogue'), text = dialogue?.querySelector('.dialogue__text');
              return dialogue && !dialogue.classList.contains('dialogue--preparing-step') && getComputedStyle(dialogue).opacity === '1'
                && text?.dataset.finalText && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
            }, null, { timeout: 15000 });
            if (sequence === scenario.sequence && (councilContinuation ? step in councilSteps : step === '1')) {
              const before = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
              const ownerBefore = (councilContinuation || nightWatch) ? await page.evaluate(() => JSON.stringify(window.__contextualApp.state)) : null;
              assert.ok(typeof before === 'string' && before.length > 0, 'Stored save missing at observation');
              assert.equal(JSON.parse(before).version, 6, 'Observation requires an existing V6 save');
              const observation = await dialogue.evaluate(element => {
                const stage = element.closest('.narrative-stage'), text = element.querySelector('.dialogue__text'), box = element.querySelector('.dialogue__box');
                const fits = node => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; };
                const t = text.getBoundingClientRect(), b = box.getBoundingClientRect();
                return { segment: element.dataset.dialogueSegment, text: text.dataset.finalText,
                  mode: stage.dataset.presentationMode, surfaces: stage.querySelectorAll(':scope [data-narrative-layer="media"] > .narrative-media-surface, :scope [data-narrative-layer="media"] > .cinematic-overlay').length,
                  mediaSurface: stage.dataset.narrativeMediaSurface, castOwnership: stage.dataset.narrativeCastOwnership, primaryInvariant: stage.dataset.primarySurfaceInvariant,
                  actors: stage.querySelectorAll('.narrative-cast__actor').length, textFits: fits(text) && t.top >= b.top - 1 && t.bottom <= b.bottom + 1 && t.left >= b.left - 1 && t.right <= b.right + 1,
                  boxFits: fits(box), boxEnabled: !box.disabled, activeVideos: stage.querySelectorAll('video').length,
                  osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches, gameReduced: window.__contextualApp.state.settings.reducedGraphics,
                  facts: { protectedWitnesses: window.__contextualApp.state.flags.protectedWitnesses, silencedWitnesses: window.__contextualApp.state.flags.silencedWitnesses, exploitedRefugees: window.__contextualApp.state.flags.exploitedRefugees } };
              });
              if (councilContinuation) {
                const continuity = await dialogue.evaluate(element => {
                  const box = element.querySelector('.dialogue__box'), style = getComputedStyle(box);
                  return { step: element.dataset.dialogueStep, speaker: element.dataset.dialogueActor,
                    focused: document.activeElement === box, outline: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth),
                    cast: [...element.closest('.narrative-stage').querySelectorAll('.narrative-cast__actor')].map(actor => ({
                      id: actor.dataset.actorId, position: actor.dataset.screenPosition, facing: actor.dataset.facing, lookTarget: actor.dataset.lookTarget,
                    })) };
                });
                assert.equal(continuity.speaker, councilSteps[step].actor);
                assert.ok(continuity.focused && continuity.outline !== 'none' && continuity.outlineWidth > 0, 'Automatic council focus missing or invisible');
                assert.deepEqual(continuity.cast, [
                  { id: 'lion_champion', position: 'LEFT', facing: 'RIGHT', lookTarget: 'alaric' },
                  { id: 'alaric', position: 'RIGHT', facing: 'LEFT', lookTarget: 'lion_champion' },
                ], 'Council relationship or stable facing changed');
                Object.assign(observation, continuity, { accessibleNameDuringReveal });
              }
              assert.equal(observation.mode, 'STATIC_TABLEAU'); assert.equal(observation.surfaces, 1);
              assert.equal(observation.mediaSurface, 'STATIC_TABLEAU'); assert.equal(observation.castOwnership, 'STAGE_OWNS_CAST'); assert.notEqual(observation.primaryInvariant, 'FAIL');
              assert.ok(observation.actors >= 1 && observation.actors <= 4); assert.ok(observation.textFits && observation.boxFits && observation.boxEnabled);
              assert.equal(observation.activeVideos, 0); assert.equal(observation.osReduced, os); assert.equal(observation.gameReduced, false);
              if (nightWatch) {
                const plate = demoEnvironmentPlateForContext('dialogue:ate_bois_clair_night_watch', 'STATIC_TABLEAU');
                const backdrop = await dialogue.evaluate(element => getComputedStyle(element.closest('.narrative-stage').querySelector('.narrative-media-surface')).backgroundImage);
                assert.ok(backdrop.includes(plate.publicUrl), 'Wrong nighttime backdrop');
                const response = await page.request.get(plate.publicUrl);
                assert.ok(response.ok(), 'Night plate load failed');
                const { createHash } = await import('node:crypto');
                assert.equal(createHash('sha256').update(await response.body()).digest('hex'), plate.sha256);
                assert.equal(observation.actors, 4);
                Object.assign(observation, { backdrop, assetId: plate.assetId, sha256: plate.sha256 });
              } else if (scenario.id === 'protected-witness-council') { assert.equal(observation.facts.protectedWitnesses, true); assert.notEqual(observation.facts.silencedWitnesses, true); }
              else assert.equal(observation.facts.exploitedRefugees, true);
              const capture = `${cell}-${scenario.id}-${councilContinuation ? `step-${step}-` : ''}${observation.segment.replace('/', '-')}.png`;
              await page.screenshot({ path: resolve(output, capture) });
              assert.equal(await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6')), before, 'Observation changed stored save');
              if (councilContinuation || nightWatch) assert.equal(await page.evaluate(() => JSON.stringify(window.__contextualApp.state)), ownerBefore, 'Observation changed live owner state');
              assert.ok(!segments.some(entry => entry.segment === observation.segment && (!councilContinuation || entry.step === step)), 'Keyboard did not advance the observed page');
              segments.push({ ...observation, savedBytesUnchanged: true, capture });
              if (councilContinuation && step === '3' && observation.segment.split('/')[0] === observation.segment.split('/')[1]) break;
            }
            const choices = dialogue.locator('.dialogue-choice:visible:not([disabled])');
            const control = await choices.count() ? choices.first() : dialogue.locator('.dialogue__box');
            if (!councilContinuation || sequence !== scenario.sequence) await control.focus();
            await page.keyboard.press('Enter');
          } else {
            const leave = page.locator(`.exploration-stop[data-refuge-node="${nightWatch ? 'lion-second-refuge' : 'lion-first-refuge'}"] [data-action="continue"]:visible`);
            if (await leave.count()) { await leave.focus(); await page.keyboard.press('Enter'); }
            else await page.waitForTimeout(50);
          }
          await page.waitForTimeout(60);
        }
        const normalize = text => text.replace(/\s+/g, ' ').trim();
        if (councilContinuation) {
          for (const [step, expected] of Object.entries(councilSteps)) {
            assert.equal(normalize(segments.filter(entry => entry.step === step).map(entry => entry.text).join(' ')), normalize(expected.text), `Incomplete council step ${step}`);
          }
          assert.ok(segments.some(entry => entry.accessibleNameDuringReveal.revealed !== entry.accessibleNameDuringReveal.text), 'No accessible-name observation during progressive reveal');
        } else assert.equal(normalize(segments.map(entry => entry.text).join(' ')), normalize(scenario.expected), 'Incomplete or inconsistent contextual text');
        const motion = await page.evaluate(() => window.__contextualMotion);
        if (os) assert.ok(motion.length && motion.every(entry => /^(dialogue-tableau:|narrative-static:)/.test(entry.id) && entry.played === false && entry.osReduced && entry.gameReduced === false), 'Missing native OS-only static observations');
        assert.equal(errors.length, 0, JSON.stringify(errors));
        report.results.push({ cell, context: scenario.id, origin: scenario.nodeId, seed: scenario.seed, segments, choiceControls, motion, keyboardAdvancement: true, pass: true });
      } catch (error) {
        report.results.push({ cell, context: scenario.id, segments, pass: false, error: error.stack ?? String(error) });
        report.errors.push(`${cell}/${scenario.id}: ${error.message}`);
        await page.screenshot({ path: resolve(output, `${cell}-${scenario.id}-failure.png`) }).catch(() => {});
      } finally { await context.close(); }
    }
    report.pass = report.errors.length === 0 && report.results.length === parameters.cells.length * parameters.contexts.length;
  } catch (error) { report.errors.push(error.stack ?? String(error)); }
  finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolveClose, reject) => server.httpServer.close(error => error ? reject(error) : resolveClose()));
    if (models) await models.close();
  }
  await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  job.finish(report);
  console.log(JSON.stringify({ pass: report.pass, cases: report.results.length, errors: report.errors }));
  if (!report.pass) process.exitCode = 1;
}
