import type { DialogueSequence, DialogueStep } from '../game/types';
import type { NarrativeDialogueMode, NarrativeTableauSpec } from './NarrativeTableau';

export type NarrativeTextClassification = 'AGENCY_DIALOGUE' | 'CINEMATIC_DIALOGUE' | 'VISUAL_REPLACEABLE' | 'REDUNDANT_EXPOSITION';

export interface NarrativeDialogueStepPresentation {
  mode: NarrativeDialogueMode;
  anchorId?: string;
  displayText?: string;
  classification?: NarrativeTextClassification;
  showPortrait: boolean;
}

export interface NarrativeTextReduction {
  dialogueId: string;
  stepId: string;
  classification: 'VISUAL_REPLACEABLE' | 'REDUNDANT_EXPOSITION';
  displayText: string;
  rationale: string;
  sourceTextPreserved: true;
  reviewed: true;
}

export type NarrativeDialogueResolver = (step: DialogueStep) => NarrativeDialogueStepPresentation;

type StepPreset = Omit<NarrativeDialogueStepPresentation, 'showPortrait'>;

const STEP_PRESETS: Readonly<Record<string, Readonly<Record<string, StepPreset>>>> = Object.freeze({
  lion_briefing: Object.freeze<Record<string, StepPreset>>({
    '1': { mode: 'SPEAKER_CARD', anchorId: 'lion-side', classification: 'CINEMATIC_DIALOGUE' },
    '1a': { mode: 'HELD_DIALOGUE', anchorId: 'lion-side', classification: 'CINEMATIC_DIALOGUE' },
    '1b': { mode: 'SPEAKER_CARD', anchorId: 'clan-side', classification: 'CINEMATIC_DIALOGUE' },
    '2': { mode: 'SPEAKER_CARD', anchorId: 'clan-side', classification: 'CINEMATIC_DIALOGUE' },
    '3': { mode: 'SPATIAL_CHOICE', anchorId: 'clan-side', classification: 'AGENCY_DIALOGUE' },
    '4': { mode: 'CINEMATIC_SUBTITLE', anchorId: 'lion-side', classification: 'CINEMATIC_DIALOGUE' },
    '5': { mode: 'CINEMATIC_SUBTITLE', anchorId: 'lion-side', classification: 'CINEMATIC_DIALOGUE' },
  }),
  pre_opening_trail: Object.freeze<Record<string, StepPreset>>({
    '1': { mode: 'SPEAKER_CARD', anchorId: 'forest-left', classification: 'CINEMATIC_DIALOGUE' },
    '2': { mode: 'HELD_DIALOGUE', anchorId: 'forest-left', classification: 'CINEMATIC_DIALOGUE' },
    '3': { mode: 'SPEAKER_CARD', anchorId: 'forest-left', classification: 'CINEMATIC_DIALOGUE' },
  }),
  post_opening_trail: Object.freeze<Record<string, StepPreset>>({
    '1': { mode: 'SPEAKER_CARD', anchorId: 'aftermath-left', classification: 'CINEMATIC_DIALOGUE' },
    '2': { mode: 'SPEAKER_CARD', anchorId: 'aftermath-left', classification: 'CINEMATIC_DIALOGUE' },
    '3': { mode: 'CINEMATIC_SUBTITLE', anchorId: 'aftermath-left', classification: 'CINEMATIC_DIALOGUE' },
  }),
  village_choice: Object.freeze<Record<string, StepPreset>>({
    '1a': { mode: 'SPEAKER_CARD', anchorId: 'village-left', classification: 'VISUAL_REPLACEABLE' },
    '2a': { mode: 'SPEAKER_CARD', anchorId: 'village-right', classification: 'VISUAL_REPLACEABLE' },
    '3': { mode: 'SPEAKER_CARD', anchorId: 'village-left', classification: 'AGENCY_DIALOGUE' },
    '4': { mode: 'SPEAKER_CARD', anchorId: 'village-right', classification: 'AGENCY_DIALOGUE' },
    '5': { mode: 'SPATIAL_CHOICE', anchorId: 'village-center', classification: 'AGENCY_DIALOGUE' },
  }),
  final_refuge: Object.freeze<Record<string, StepPreset>>({
    '1': { mode: 'SPEAKER_CARD', anchorId: 'refuge-left', classification: 'REDUNDANT_EXPOSITION' },
    '3': { mode: 'SPEAKER_CARD', anchorId: 'refuge-left', classification: 'REDUNDANT_EXPOSITION' },
  }),
});

export const NARRATIVE_TEXT_REDUCTIONS = Object.freeze<NarrativeTextReduction[]>([
  {
    dialogueId: 'village_choice',
    stepId: '1a',
    classification: 'VISUAL_REPLACEABLE',
    displayText: 'Les flammes divisent la place : captifs au nord, réserves et puits menacés au sud.',
    rationale: 'The living scene carries the divided-place geography while the concise line retains both objectives.',
    sourceTextPreserved: true,
    reviewed: true,
  },
  {
    dialogueId: 'village_choice',
    stepId: '2a',
    classification: 'VISUAL_REPLACEABLE',
    displayText: 'Ils attendent notre division : captifs par le vieux pont, coffres par la porte basse. Nous ne pouvons tenir les deux.',
    rationale: 'The presentation removes repeated staging prose while retaining the two routes and tactical limit.',
    sourceTextPreserved: true,
    reviewed: true,
  },
  {
    dialogueId: 'final_refuge',
    stepId: '1',
    classification: 'REDUNDANT_EXPOSITION',
    displayText: 'Le camp du Lion est en vue. Avant les portes, mesurez ce que nous portons et risquons : le Sceau ne se donne pas, Alaric ne pardonne pas.',
    rationale: 'The dossier tableau already establishes the approach; every mandate fact remains in the displayed line.',
    sourceTextPreserved: true,
    reviewed: true,
  },
  {
    dialogueId: 'final_refuge',
    stepId: '3',
    classification: 'REDUNDANT_EXPOSITION',
    displayText: 'Alaric pèsera tout le dossier — Bois-Clair, réfugiés, témoins, convoi, conduite et preuves. La renommée n’en changera aucun fait.',
    rationale: 'Earlier tableaux carry the chronology while the complete evidence list and consequence remain explicit.',
    sourceTextPreserved: true,
    reviewed: true,
  },
]);

const TEXT_REDUCTION_BY_STEP = new Map(
  NARRATIVE_TEXT_REDUCTIONS.map((entry) => [`${entry.dialogueId}:${entry.stepId}`, entry]),
);

function defaultMode(step: DialogueStep): NarrativeDialogueMode {
  if (step.choices?.length) return step.choices.length === 2 ? 'SPATIAL_CHOICE' : 'HELD_DIALOGUE';
  return step.text.length > 190 ? 'HELD_DIALOGUE' : 'SPEAKER_CARD';
}

export function createNarrativeDialogueResolver(
  sequence: DialogueSequence,
  tableau?: NarrativeTableauSpec,
): NarrativeDialogueResolver {
  const visuallyCovered = new Set(tableau?.cast.visualActors ?? []);
  const presets = STEP_PRESETS[sequence.id] ?? {};
  return (step) => {
    const preset = presets[step.id];
    const reduction = TEXT_REDUCTION_BY_STEP.get(`${sequence.id}:${step.id}`);
    const actorId = step.actorId;
    return {
      mode: preset?.mode ?? defaultMode(step),
      ...(preset?.anchorId ? { anchorId: preset.anchorId } : {}),
      ...(reduction ? { displayText: reduction.displayText, classification: reduction.classification } : preset?.classification ? { classification: preset.classification } : {}),
      showPortrait: Boolean(actorId && !visuallyCovered.has(actorId)),
    };
  };
}

export function resolveRepresentedDialogueActors(
  sequence: DialogueSequence,
  resolver: NarrativeDialogueResolver,
): string[] {
  return [...new Set(sequence.steps.filter((step) => resolver(step).showPortrait).map((step) => step.actorId).filter((id): id is string => Boolean(id)))];
}

export function getNarrativeTextReduction(dialogueId: string, stepId: string): NarrativeTextReduction | undefined {
  return TEXT_REDUCTION_BY_STEP.get(`${dialogueId}:${stepId}`);
}
