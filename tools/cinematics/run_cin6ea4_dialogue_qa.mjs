import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

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
  ['Serpent pursuit', 'serpent_pursuit_pre_combat'],
  ['Serpent aftermath', 'serpent_general_aftermath'],
  ['Lion finale', 'lion_finale_judgement'],
  ['epilogue', 'epilogue'],
].map(([label, dialogueId]) => ({ label, dialogueId }));

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
    const [content, tableaux, segments, surfaceModule, adapter, dialogueModule, store, stageModule, playerModule, registryModule, presentationResolver] = await Promise.all([
      import('/src/game/content.ts'),
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
    window.__cin6ea4 = { content, tableaux, segments, surfaceModule, adapter, dialogueModule, store, stageModule, playerModule, registryModule, presentationResolver };
  });
}

async function renderScenario(page, scenario) {
  const stepId = selectedStep(scenario);
  await page.evaluate(async ({ dialogueId, stepId }) => {
    const modules = window.__cin6ea4;
    window.__cin6ea4View?.close();
    window.__cin6ea4Surface?.dispose();
    document.body.replaceChildren();
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    const sequence = modules.content.dialogues.get(dialogueId);
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
  }, { dialogueId: scenario.dialogueId, stepId });
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
      await loadHarness(page);
      const prefix = `${viewport.width}x${viewport.height}`;
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
      results.push({ viewport, representativeScenarios: metrics, targetedScenarios: targetedMetrics, transitionProbe, fivePlusCastSplit: { uniqueCast: openingUniqueCast.size, maxActorsPerTableau: Math.max(...openingAudit.segments.map((segment) => segment.visibleCast.length)) }, screenshots: 5, consoleErrors, pageErrors, pass: true });
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
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify({ baseline: visualAudit.baseline, doctrine: 'STATIC_TABLEAU_FIRST', representativeScenarioCount: REPRESENTATIVE_SCENARIOS.length, targetedScenarioCount: TARGETED_SCENARIOS.length, results }, null, 2)}\n`);
console.log(JSON.stringify(results.map((result) => ({ viewport: result.viewport, pass: result.pass, representativeScenarios: result.representativeScenarios?.length ?? 0, targetedScenarios: result.targetedScenarios?.length ?? 0, transitions: result.transitionProbe ? 4 : 0, error: result.error })), null, 2));
if (failed) process.exitCode = 1;
