import '../../src/styles/app.css';
import '../../src/ui/dialogue-alignment.css';
import { dialogues } from '../../src/game/content';
import { createInitialState } from '../../src/game/store';
import { resolveNarrativeDialogueTableau } from '../../src/cinematics/NarrativeTableau';
import { applyFinalDialoguePresentationPlan } from '../../src/cinematics/DialoguePresentationSegments';
import { createNarrativeDialogueResolver } from '../../src/cinematics/NarrativeDialogueAdapter';
import { NarrativeSceneSurface } from '../../src/cinematics/NarrativeSceneSurface';
import { DialogueView, resolveDialogueBackdrop } from '../../src/ui/DialogueView';

const root = document.querySelector<HTMLElement>('#proof-root')!;
const media = document.querySelector<HTMLElement>('#proof-media')!;
const view = new DialogueView({ root, getState: createInitialState, applyEffects: async () => undefined });
let activeDialogueId = '';
let surface: NarrativeSceneSurface | undefined;

const catalog = [...dialogues.values()].sort((a, b) => a.id.localeCompare(b.id)).map((sequence) => {
  const base = resolveNarrativeDialogueTableau(sequence.id, sequence);
  if (!base) throw new Error(`No tableau for ${sequence.id}`);
  const tableau = applyFinalDialoguePresentationPlan(sequence, base);
  return {
    dialogueId: sequence.id,
    family: tableau.family ?? 'FALLBACK',
    phases: (tableau.phases ?? []).map((phase) => ({
      phaseId: phase.id,
      stepIds: [...phase.stepIds],
      actorIds: phase.staticCast.map((actor) => actor.actorId),
      semanticPositions: phase.staticCast.map((actor) => ({ actorId: actor.actorId, screenPosition: actor.screenPosition })),
    })),
    steps: sequence.steps.map((step) => ({ stepId: step.id, actorId: step.actorId ?? '', choiceCount: step.choices?.length ?? 0 })),
  };
});

async function show(dialogueId: string, stepId: string, activateChoices = false): Promise<void> {
  const sequence = dialogues.get(dialogueId);
  const step = sequence?.steps.find((candidate) => candidate.id === stepId);
  if (!sequence || !step) throw new Error(`Unknown ${dialogueId}:${stepId}`);
  const base = resolveNarrativeDialogueTableau(dialogueId, sequence);
  if (!base) throw new Error(`No tableau for ${dialogueId}`);
  const tableau = applyFinalDialoguePresentationPlan(sequence, base);
  const presentation = createNarrativeDialogueResolver(sequence, tableau)(step);
  if (!surface || activeDialogueId !== dialogueId) {
    surface?.dispose();
    surface = new NarrativeSceneSurface(media, tableau, { reducedMotion: true });
    surface.bindDialogue(sequence);
    surface.mount(tableau.stillImage ?? resolveDialogueBackdrop(sequence), presentation.phaseId);
    activeDialogueId = dialogueId;
  }
  const currentSurface = surface;
  void view.play({ ...sequence, steps: [step] }, {
    mode: 'narrative-stage',
    reducedMotion: true,
    stepPresentation: () => presentation,
    beforeStepChange: async () => {
      await currentSurface.setPhase(
        presentation.phaseId!, step.actorId, presentation.layoutPlacement,
        presentation.speakerFacing, presentation.speakerLookTarget,
        presentation.addressedTo, presentation.addressResolution,
      );
    },
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const overlay = root.querySelector<HTMLElement>('.dialogue');
    if (overlay?.dataset.dialogueStep === stepId && !overlay.classList.contains('dialogue--preparing-step')) break;
    await new Promise((done) => setTimeout(done, 20));
  }
  const overlay = root.querySelector<HTMLElement>('.dialogue');
  if (overlay?.dataset.dialogueStep !== stepId) throw new Error(`Dialogue failed to render ${dialogueId}:${stepId}`);
  if (activateChoices) {
    for (let attempt = 0; attempt < 8 && !root.querySelector('.dialogue-choice'); attempt += 1) {
      root.querySelector<HTMLButtonElement>('.dialogue__box')?.click();
      await new Promise((done) => setTimeout(done, 0));
    }
    if (!root.querySelector('.dialogue-choice')) throw new Error(`Choices failed to render ${dialogueId}:${stepId}`);
  }
  await currentSurface.whenRenderable();
  await Promise.all([...root.querySelectorAll<HTMLImageElement>('.dialogue__card-portrait img')].map((image) => image.decode().catch(() => undefined)));
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
}

(window as Window & { tableauProof?: { catalog: typeof catalog; show: typeof show } }).tableauProof = { catalog, show };
