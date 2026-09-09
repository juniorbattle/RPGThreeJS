import type { DialogueSequence, DialogueStep } from '../game/types';
import { DialogueStagingDirector } from './DialogueStagingDirector';
import { createGenericNarrativeTableau, type NarrativeDialogueMode, type NarrativeLayoutPlacement, type NarrativeLayoutProfile, type NarrativePresentationStrategy, type NarrativeScreenPosition, type NarrativeSpeakerAssociation, type NarrativeTableauSpec } from './NarrativeTableau';
import type { NarrativeAuthoringMedia } from './NarrativePresentationPolicy';

export type NarrativeTextClassification = 'AGENCY_DIALOGUE' | 'CINEMATIC_DIALOGUE' | 'VISUAL_REPLACEABLE' | 'REDUNDANT_EXPOSITION';

export interface NarrativeDialogueStepPresentation {
  mode: NarrativeDialogueMode;
  anchorId?: string;
  displayText?: string;
  displaySegments?: readonly string[];
  classification?: NarrativeTextClassification;
  showPortrait: boolean;
  phaseId?: string;
  layoutProfile?: NarrativeLayoutProfile;
  layoutPlacement?: NarrativeLayoutPlacement;
  speakerScreenPosition?: NarrativeScreenPosition;
  speakerAssociation?: NarrativeSpeakerAssociation;
  speakerCardPolicy?: 'VISIBLE' | 'SETUP_THEN_CHOICES_ONLY';
  presentationStrategy?: NarrativePresentationStrategy;
  mediaSubjects?: readonly string[];
  visibleStaticCast?: readonly string[];
  castOwnership?: 'VIDEO_OWNS_CAST' | 'STAGE_OWNS_CAST' | 'ENVIRONMENT_ONLY';
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
  return 'SPEAKER_CARD';
}

export interface NarrativeDialogueResolverOptions {
  mediaMode?: NarrativeAuthoringMedia;
  hasMovingMedia?: boolean;
}

export function createNarrativeDialogueResolver(
  sequence: DialogueSequence,
  tableau?: NarrativeTableauSpec,
  options: NarrativeDialogueResolverOptions = {},
): NarrativeDialogueResolver {
  const resolvedTableau = tableau ?? createGenericNarrativeTableau(sequence);
  const director = new DialogueStagingDirector(sequence, resolvedTableau, {
    mediaMode: options.mediaMode ?? 'STILL',
    hasMovingMedia: options.hasMovingMedia ?? false,
  });
  return (step) => {
    const decision = director.resolve(step);
    const mode: NarrativeDialogueMode = step.choices?.length
      ? 'SPATIAL_CHOICE'
      : decision.layoutProfile === 'DIALOGUE_BOTTOM_BAND_RESERVED'
        ? 'CINEMATIC_SUBTITLE'
        : decision.layoutProfile === 'HELD_VIDEO_DIALOGUE'
          ? 'HELD_DIALOGUE'
        : defaultMode(step);
    const anchorId = decision.layoutPlacement === 'LEFT'
      ? 'card-left'
      : decision.layoutPlacement === 'CENTER_LOWER'
        ? 'card-center'
      : decision.layoutPlacement === 'TOP_CENTER'
        ? 'card-top'
        : decision.layoutPlacement === 'BOTTOM_CENTER'
          ? 'card-bottom'
          : decision.layoutPlacement === 'SPATIAL'
            ? 'choice-left'
            : 'card-right';
    return {
      mode,
      anchorId,
      displaySegments: decision.displaySegments,
      showPortrait: false,
      phaseId: decision.currentVisualState,
      layoutProfile: decision.layoutProfile,
      layoutPlacement: decision.layoutPlacement,
      speakerScreenPosition: decision.speakerScreenPosition,
      speakerAssociation: decision.speakerAssociation,
      speakerCardPolicy: decision.speakerCardPolicy,
      presentationStrategy: decision.presentationStrategy,
      mediaSubjects: decision.currentMediaSubjects,
      visibleStaticCast: decision.visibleStaticCast,
      castOwnership: decision.castOwnership,
    };
  };
}

export function resolveRepresentedDialogueActors(
  sequence: DialogueSequence,
  resolver: NarrativeDialogueResolver,
): string[] {
  const represented = new Set<string>();
  for (const step of sequence.steps) {
    const presentation = resolver(step);
    for (const actorId of presentation.visibleStaticCast ?? []) represented.add(actorId);
    for (const actorId of presentation.mediaSubjects ?? []) represented.add(actorId);
    if (presentation.showPortrait && step.actorId) represented.add(step.actorId);
    if (presentation.presentationStrategy === 'OFFSCREEN_CONTEXTUAL' && step.actorId) represented.add(step.actorId);
  }
  return [...represented];
}

export function getNarrativeTextReduction(dialogueId: string, stepId: string): NarrativeTextReduction | undefined {
  return TEXT_REDUCTION_BY_STEP.get(`${dialogueId}:${stepId}`);
}
