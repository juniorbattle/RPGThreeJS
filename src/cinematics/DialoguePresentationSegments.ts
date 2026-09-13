import type { DialogueSequence } from '../game/types';
import { FINAL_DIALOGUE_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';
import {
  createGenericNarrativeTableau,
  resolveNarrativeStepLayout,
  resolveNarrativeStepPlacement,
  type NarrativeActorEntryEffect,
  type NarrativeActorGroup,
  type NarrativeActorExitEffect,
  type NarrativeAddressResolution,
  type NarrativeDramaticSide,
  type NarrativeScreenPosition,
  type NarrativeStagedActorSpec,
  type NarrativeTableauSpec,
  type NarrativeVisualPhaseSpec,
} from './NarrativeTableau';
import type { CinematicReductionClassification } from './CinematicReductionPolicy';

export type DialoguePresentationSegmentMode = 'STATIC_TABLEAU';
export type DialoguePreludeTransition = 'NONE' | 'VIDEO_TO_TABLEAU' | 'TRAVEL_TO_TABLEAU' | 'HOLD_TO_TABLEAU' | 'TABLEAU_RESTAGE';

export interface FinalDialoguePresentationSegment {
  id: string;
  mode: DialoguePresentationSegmentMode;
  stepIds: readonly string[];
  visibleCast: readonly string[];
  allowedSpeakers: readonly string[];
  forbiddenSpeakers: readonly string[];
  actors: readonly {
    actorId: string;
    screenPosition: NarrativeScreenPosition;
    scale: number;
    facing: 'LEFT' | 'RIGHT' | 'FORWARD';
    lookTarget: string | null;
    group: NarrativeActorGroup;
    dramaticSide: NarrativeDramaticSide;
    depth: number;
    narrativeRole: NarrativeStagedActorSpec['narrativeRole'];
    entryEffect: NarrativeActorEntryEffect;
  }[];
  exits: readonly {
    actorId: string;
    kind: 'STAGE_OUT' | 'NARRATIVE_EXIT';
    effect: NarrativeActorExitEffect;
    reason: string;
  }[];
  stepDirections: readonly {
    stepId: string;
    speakerId: string;
    addressedTo: string | null;
    lookTarget: string | null;
    facing: 'LEFT' | 'RIGHT' | 'FORWARD';
    resolution: NarrativeAddressResolution;
  }[];
  transitionFromPrevious: DialoguePreludeTransition;
  rationale: string;
}

export interface FinalDialoguePresentationPlan {
  dialogueId: string;
  originalMode: string;
  sourceVideo: string | null;
  sourceVideoClassification: CinematicReductionClassification | null;
  dialogueStartsAfterMedia: true;
  normalDialogueDuringVideo: 0;
  dialogueStepsOnHold: 0;
  choiceStepsOnHold: 0;
  finalFrameCast: readonly string[];
  finalFrameCastReferenceOnly: true;
  allowedHoldSpeakers: readonly string[];
  forbiddenHoldSpeakers: readonly string[];
  segments: readonly FinalDialoguePresentationSegment[];
}

const PLANS = FINAL_DIALOGUE_PRESENTATION_PLANS as unknown as Readonly<Record<string, FinalDialoguePresentationPlan>>;

export function resolveFinalDialoguePresentationPlan(dialogueId: string): FinalDialoguePresentationPlan | undefined {
  return PLANS[dialogueId];
}

function phaseForSegment(
  sequence: DialogueSequence,
  base: NarrativeTableauSpec,
  segment: FinalDialoguePresentationSegment,
): NarrativeVisualPhaseSpec {
  const firstStep = sequence.steps.find((step) => segment.stepIds.includes(step.id)) ?? sequence.steps[0]!;
  const basePhases = base.phases ?? createGenericNarrativeTableau(sequence).phases ?? [];
  const template = basePhases.find((phase) => phase.stepIds.includes(firstStep.id)) ?? basePhases[0];
  if (!template) throw new Error(`No tableau phase template for ${sequence.id}:${segment.id}.`);
  const staticCast: NarrativeStagedActorSpec[] = segment.actors.map((actor) => ({ ...actor }));
  const stagedSpeaker = staticCast.find((actor) => actor.actorId === firstStep.actorId);
  const layoutProfile = resolveNarrativeStepLayout(sequence, firstStep, base.family ?? 'FALLBACK');
  const layoutPlacement = resolveNarrativeStepPlacement(layoutProfile, firstStep, stagedSpeaker);
  return {
    ...template,
    id: segment.id,
    stepIds: segment.stepIds,
    surfaceMode: segment.mode,
    layoutProfile,
    layoutPlacement,
    staticCast,
    mediaSubjects: [],
    negativeSpaceIntent: segment.rationale,
    cameraIntent: 'Stable full-scale canonical-sprite composition with restrained speaker emphasis and step-resolved facing.',
    exits: segment.exits,
    stepDirections: segment.stepDirections,
    precedingTransition: segment.transitionFromPrevious,
  };
}

/** Applies generated presentation segmentation without changing canonical dialogue truth. */
export function applyFinalDialoguePresentationPlan(
  sequence: DialogueSequence,
  tableau?: NarrativeTableauSpec,
): NarrativeTableauSpec {
  const base = tableau ?? createGenericNarrativeTableau(sequence);
  const plan = resolveFinalDialoguePresentationPlan(sequence.id);
  if (!plan) return base;
  const phases = plan.segments.map((segment) => phaseForSegment(sequence, base, segment));
  const beats = base.beats.map((beat) => {
    if (!beat.dialogueStepId) return beat;
    const step = sequence.steps.find((candidate) => candidate.id === beat.dialogueStepId);
    if (!step) return beat;
    return {
      ...beat,
      kind: step.choices?.length
        ? 'SPATIAL_CHOICE' as const
        : 'SPEAKER_CARD' as const,
    };
  });
  const visualActors = [...new Set(plan.segments.flatMap((segment) => [...segment.visibleCast]))];
  return Object.freeze({
    ...base,
    phases: Object.freeze(phases),
    beats: Object.freeze(beats),
    cast: Object.freeze({ ...base.cast, visualActors: Object.freeze(visualActors) }),
  });
}
