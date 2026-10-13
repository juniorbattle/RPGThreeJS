import type { DialogueSequence, DialogueStep } from '../game/types';
import { DialogueStagingDirector, segmentNarrativeText } from './DialogueStagingDirector';
import { createGenericNarrativeTableau, type NarrativeAddressResolution, type NarrativeChoiceScreenLane, type NarrativeDialogueMode, type NarrativeDialogueSurfaceMode, type NarrativeLayoutPlacement, type NarrativeLayoutProfile, type NarrativePresentationStrategy, type NarrativeScreenPosition, type NarrativeSpeakerAssociation, type NarrativeTableauSpec } from './NarrativeTableau';
import type { NarrativeAuthoringMedia } from './NarrativePresentationPolicy';
import { applyFinalDialoguePresentationPlan, type DialoguePresentationSegmentMode } from './DialoguePresentationSegments';
import type { NarrativeActorEntryEffect, NarrativeStagedActorExitSpec } from './NarrativeTableau';

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
  dialogueSurfaceMode?: NarrativeDialogueSurfaceMode;
  speakerCardPolicy?: 'VISIBLE' | 'SETUP_THEN_CHOICES_ONLY';
  choiceScreenLanes?: readonly NarrativeChoiceScreenLane[];
  presentationStrategy?: NarrativePresentationStrategy;
  mediaSubjects?: readonly string[];
  visibleStaticCast?: readonly string[];
  castOwnership?: 'VIDEO_OWNS_CAST' | 'STAGE_OWNS_CAST' | 'ENVIRONMENT_ONLY';
  segmentMode?: DialoguePresentationSegmentMode;
  transitionFromPrevious?: 'NONE' | 'VIDEO_TO_TABLEAU' | 'TRAVEL_TO_TABLEAU' | 'HOLD_TO_TABLEAU' | 'TABLEAU_RESTAGE';
  speakerVisibleBeforeLine?: boolean;
  speakerFacing?: 'LEFT' | 'RIGHT' | 'FORWARD';
  speakerLookTarget?: string | null;
  addressedTo?: string | null;
  addressResolution?: NarrativeAddressResolution;
  speakerEntryEffect?: NarrativeActorEntryEffect;
  actorExits?: readonly NarrativeStagedActorExitSpec[];
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
    displayText: 'Le camp du Lion est en vue. Alaric a déjà les rapports, les absents ont leurs noms et les témoins leur mémoire : nous pouvons seulement entrer avec ce que nous avons fait.',
    rationale: 'The dossier tableau already establishes the approach; every mandate fact remains in the displayed line.',
    sourceTextPreserved: true,
    reviewed: true,
  },
  {
    dialogueId: 'final_refuge',
    stepId: '3',
    classification: 'REDUNDANT_EXPOSITION',
    displayText: 'Notre renommée nous a précédés. Alaric a les registres de Bois-Clair, les récits de la route, les témoins et les preuves : un nom ouvre l’audience, il ne réécrit pas les traces.',
    rationale: 'Earlier tableaux carry the chronology while the complete evidence list and consequence remain explicit.',
    sourceTextPreserved: true,
    reviewed: true,
  },
]);

const TEXT_REDUCTION_BY_STEP = new Map(
  NARRATIVE_TEXT_REDUCTIONS.map((entry) => [`${entry.dialogueId}:${entry.stepId}`, entry]),
);

function defaultMode(step: DialogueStep): NarrativeDialogueMode {
  if (step.choices?.length) return 'SPATIAL_CHOICE';
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
  const resolvedTableau = applyFinalDialoguePresentationPlan(
    sequence,
    tableau ?? createGenericNarrativeTableau(sequence),
  );
  const director = new DialogueStagingDirector(sequence, resolvedTableau, {
    mediaMode: options.mediaMode ?? 'STILL',
    hasMovingMedia: options.hasMovingMedia ?? false,
  });
  return (step) => {
    const decision = director.resolve(step);
    const reduction = getNarrativeTextReduction(sequence.id, step.id);
    const displayText = reduction?.displayText ?? step.text;
    const mode: NarrativeDialogueMode = step.choices?.length ? 'SPATIAL_CHOICE' : defaultMode(step);
    const anchorId = decision.layoutPlacement === 'LEFT' || decision.layoutPlacement === 'LEFT_UPPER'
      ? 'card-left'
      : decision.layoutPlacement === 'CENTER_LOWER' || decision.layoutPlacement === 'CENTER_UPPER'
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
      displayText,
      displaySegments: segmentNarrativeText(displayText, decision.maxCharactersPerSegment || 168),
      showPortrait: false,
      phaseId: decision.currentVisualState,
      layoutProfile: decision.layoutProfile,
      layoutPlacement: decision.layoutPlacement,
      speakerScreenPosition: decision.speakerScreenPosition,
      speakerAssociation: decision.speakerAssociation,
      dialogueSurfaceMode: decision.dialogueSurfaceMode,
      speakerCardPolicy: decision.speakerCardPolicy,
      choiceScreenLanes: decision.choiceScreenLanes,
      presentationStrategy: decision.presentationStrategy,
      mediaSubjects: decision.currentMediaSubjects,
      visibleStaticCast: decision.visibleStaticCast,
      castOwnership: decision.castOwnership,
      segmentMode: decision.segmentMode,
      transitionFromPrevious: decision.transitionFromPrevious,
      speakerVisibleBeforeLine: decision.speakerVisibleBeforeLine,
      speakerFacing: decision.speakerFacing,
      speakerLookTarget: decision.speakerLookTarget,
      addressedTo: decision.addressedTo,
      addressResolution: decision.addressResolution,
      speakerEntryEffect: decision.speakerEntryEffect,
      actorExits: decision.actorExits,
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
  }
  return [...represented];
}

export function getNarrativeTextReduction(dialogueId: string, stepId: string): NarrativeTextReduction | undefined {
  return TEXT_REDUCTION_BY_STEP.get(`${dialogueId}:${stepId}`);
}
