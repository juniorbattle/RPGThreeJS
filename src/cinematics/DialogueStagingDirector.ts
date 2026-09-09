import type { DialogueSequence, DialogueStep } from '../game/types';
import {
  createGenericNarrativeTableau,
  NARRATIVE_LAYOUT_PROFILE_RULES,
  resolveNarrativeStepLayout,
  resolveNarrativeStepPlacement,
  type NarrativeLayoutPlacement,
  type NarrativeLayoutProfile,
  type NarrativePresentationStrategy,
  type NarrativeRole,
  type NarrativeTableauSpec,
  type NarrativeVisualPhaseSpec,
} from './NarrativeTableau';
import type { NarrativeAuthoringMedia } from './NarrativePresentationPolicy';

export interface DialogueStagingDecision {
  dialogueId: string;
  stepId: string;
  speakerId: string;
  speakerRole: NarrativeRole;
  currentVisualState: string;
  currentMediaSubjects: readonly string[];
  visibleStaticCast: readonly string[];
  castOwnership: 'VIDEO_OWNS_CAST' | 'STAGE_OWNS_CAST' | 'ENVIRONMENT_ONLY';
  choiceState: 'NONE' | 'CHOICE';
  speakerCardPolicy: 'VISIBLE' | 'SETUP_THEN_CHOICES_ONLY';
  effectsState: 'NONE' | 'STEP_EFFECTS' | 'CHOICE_EFFECTS' | 'STEP_AND_CHOICE_EFFECTS';
  layoutProfile: NarrativeLayoutProfile;
  layoutPlacement: NarrativeLayoutPlacement;
  anchor: NarrativeLayoutPlacement;
  maxCharactersPerSegment: number;
  maxLines: number;
  presentationStrategy: NarrativePresentationStrategy;
  displaySegments: readonly string[];
  mediaRemasterLater: boolean;
  offscreenReason?: string;
}

export interface DialogueStagingPlan {
  dialogueId: string;
  tableauId: string;
  mediaMode: NarrativeAuthoringMedia;
  decisions: readonly DialogueStagingDecision[];
}

export interface DialogueStagingDirectorOptions {
  mediaMode: NarrativeAuthoringMedia;
  hasMovingMedia?: boolean;
}

const KNOWN_VIDEO_SUBJECTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  lion_briefing: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
  pre_opening_trail: ['sage_seraphine'],
  village_choice: ['villageoise', 'serpent_raider', 'alistair'],
  shadow_signs: ['sage_seraphine', 'elara'],
  final_refuge: ['maelor', 'sage_seraphine', 'alistair'],
  lion_finale_judgement: ['alaric', 'lion_champion'],
});

function sentencePieces(text: string): string[] {
  const matches = text.match(/[^.!?…]+(?:[.!?…]+[”»]?|$)/gu);
  return (matches ?? [text]).map((part) => part.trim()).filter(Boolean);
}

/** Presentation-only pagination. The concatenated segments are exactly the canonical text. */
export function segmentNarrativeText(text: string, targetCharacters = 168): string[] {
  if (text.length <= targetCharacters) return [text];
  const sentences = sentencePieces(text).flatMap((sentence) => {
    if (sentence.length <= targetCharacters) return [sentence];
    const chunks: string[] = [];
    let chunk = '';
    for (const word of sentence.split(/\s+/u)) {
      if (!chunk || `${chunk} ${word}`.length <= targetCharacters) chunk = chunk ? `${chunk} ${word}` : word;
      else {
        chunks.push(chunk);
        chunk = word;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
  const segments: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }
    if (`${current} ${sentence}`.length <= targetCharacters) {
      current = `${current} ${sentence}`;
      continue;
    }
    segments.push(current);
    current = sentence;
  }
  if (current) segments.push(current);
  return segments.length ? segments : [text];
}

function effectsState(step: DialogueStep): DialogueStagingDecision['effectsState'] {
  const stepEffects = step.effects.length > 0;
  const choiceEffects = Boolean(step.choices?.some((choice) => choice.effects.length || choice.contest));
  if (stepEffects && choiceEffects) return 'STEP_AND_CHOICE_EFFECTS';
  if (stepEffects) return 'STEP_EFFECTS';
  if (choiceEffects) return 'CHOICE_EFFECTS';
  return 'NONE';
}

function anchorFor(placement: NarrativeLayoutPlacement): DialogueStagingDecision['anchor'] {
  return placement;
}

function speakerRole(step: DialogueStep): NarrativeRole {
  if (step.actorId === 'alaric') return 'AUTHORITY';
  if (step.actorId === 'sage_seraphine' || step.actorId === 'maelor') return 'ADVISER';
  return 'CURRENT_SPEAKER';
}

function phaseForStep(phases: readonly NarrativeVisualPhaseSpec[], stepId: string): NarrativeVisualPhaseSpec {
  const phase = phases.find((candidate) => candidate.stepIds.includes(stepId));
  if (!phase) throw new Error(`No declared NarrativeStage visual phase for dialogue step '${stepId}'.`);
  return phase;
}

export class DialogueStagingDirector {
  readonly plan: DialogueStagingPlan;

  constructor(
    sequence: DialogueSequence,
    tableau: NarrativeTableauSpec,
    options: DialogueStagingDirectorOptions,
  ) {
    const phases = tableau.phases ?? createGenericNarrativeTableau(sequence).phases ?? [];
    const knownVideoSubjects = KNOWN_VIDEO_SUBJECTS[sequence.id];
    const decisions = sequence.steps.map((step): DialogueStagingDecision => {
      const phase = phaseForStep(phases, step.id);
      let layoutProfile = phase.stepIds.length === sequence.steps.length
        ? resolveNarrativeStepLayout(sequence, step, tableau.family ?? 'FALLBACK')
        : phase.layoutProfile;
      const heldBeat = tableau.beats.find((beat) => beat.dialogueStepId === step.id)?.kind === 'HELD_DIALOGUE';
      if (!step.choices?.length && heldBeat) layoutProfile = 'HELD_VIDEO_DIALOGUE';
      const layoutPlacement = phase.stepIds.length === sequence.steps.length || layoutProfile !== phase.layoutProfile
        ? resolveNarrativeStepPlacement(layoutProfile, step)
        : phase.layoutPlacement;
      const layoutRule = NARRATIVE_LAYOUT_PROFILE_RULES[layoutProfile];
      const speakerId = step.actorId ?? `speaker:${step.speaker}`;
      const staticCast = phase.staticCast.map((actor) => actor.actorId);
      const visibleStaticCast = options.mediaMode === 'VIDEO' && options.hasMovingMedia ? [] : staticCast;
      const castOwnership: DialogueStagingDecision['castOwnership'] = options.mediaMode === 'VIDEO' && options.hasMovingMedia
        ? 'VIDEO_OWNS_CAST'
        : staticCast.length
          ? 'STAGE_OWNS_CAST'
          : 'ENVIRONMENT_ONLY';
      const videoSubjects = knownVideoSubjects ?? phase.mediaSubjects;
      const currentMediaSubjects = options.mediaMode === 'VIDEO' && options.hasMovingMedia
        ? videoSubjects
        : phase.mediaSubjects;
      let presentationStrategy: NarrativePresentationStrategy;
      let offscreenReason: string | undefined;
      if (options.mediaMode === 'VIDEO' && options.hasMovingMedia) {
        if (currentMediaSubjects.includes(speakerId)) presentationStrategy = 'IN_SCENE';
        else {
          presentationStrategy = 'OFFSCREEN_CONTEXTUAL';
          offscreenReason = `Existing moving media for ${sequence.id} does not visually cover ${speakerId}; compact contextual dialogue preserves the canonical exchange without a sprite overlay.`;
        }
      } else if (staticCast.includes(speakerId)) {
        presentationStrategy = staticCast.length > 1 ? 'SPEAKER_FOCUS' : 'IN_SCENE';
      } else {
        presentationStrategy = 'STATIC_RESTAGE';
      }
      const mediaRemasterLater = Boolean(
        tableau.mediaRemasterNeeded
        || (options.mediaMode === 'VIDEO' && options.hasMovingMedia && !currentMediaSubjects.includes(speakerId)),
      );
      return {
        dialogueId: sequence.id,
        stepId: step.id,
        speakerId,
        speakerRole: speakerRole(step),
        currentVisualState: phase.id,
        currentMediaSubjects,
        visibleStaticCast,
        castOwnership,
        choiceState: step.choices?.length ? 'CHOICE' : 'NONE',
        speakerCardPolicy: step.choices?.length ? 'SETUP_THEN_CHOICES_ONLY' : 'VISIBLE',
        effectsState: effectsState(step),
        layoutProfile,
        layoutPlacement,
        anchor: anchorFor(layoutPlacement),
        maxCharactersPerSegment: layoutRule.maxCharactersPerSegment,
        maxLines: layoutRule.maxLines,
        presentationStrategy,
        displaySegments: segmentNarrativeText(step.text, layoutRule.maxCharactersPerSegment || 168),
        mediaRemasterLater,
        ...(offscreenReason ? { offscreenReason } : {}),
      };
    });
    this.plan = Object.freeze({
      dialogueId: sequence.id,
      tableauId: tableau.id,
      mediaMode: options.mediaMode,
      decisions: Object.freeze(decisions),
    });
  }

  resolve(step: DialogueStep): DialogueStagingDecision {
    const decision = this.plan.decisions.find((candidate) => candidate.stepId === step.id);
    if (!decision) throw new Error(`DialogueStagingDirector has no presentation decision for ${this.plan.dialogueId}:${step.id}.`);
    return decision;
  }
}
