/**
 * Set 1.20.0 (post-demo, Lot 1): the static staging of a post-demo scene, draft or canon, until its scenes get their
 * reviewed plans with the final images (OD-2026-11-08-B). Like the campaign-grammar plans, it is one stable local composition per group of lines, built
 * from the scene as played: every speaker is represented before their line, never more than four actors are visible
 * (a longer cast is restaged in framed subsets), the company holds the left and the plateau's people the right.
 * Presentation only: it reads the sequence and decides no truth.
 */
import type { DialogueSequence } from '../game/types';
import type { FinalDialoguePresentationPlan, FinalDialoguePresentationSegment } from './DialoguePresentationSegments';
import { stageActors, type NarrativeActorGroup, type NarrativeScreenPosition } from './NarrativeTableau';

export const DRAFT_VISIBLE_ACTOR_CAP = 4;

const COMPANY: readonly string[] = Object.freeze(['sage_seraphine', 'maelor', 'alistair']);

function groupOf(actorId: string): NarrativeActorGroup {
  if (COMPANY.includes(actorId)) return 'PLAYER_COMPANY';
  if (actorId.startsWith('raven_')) return 'ANTAGONIST';
  if (actorId === 'bear_miner') return 'LOCAL_CIVILIAN';
  return 'NEUTRAL';
}

/** Company first, so `stageActors` places it on the left and the plateau's people on the right. */
function ordered(cast: readonly string[]): string[] {
  return [...cast.filter((id) => COMPANY.includes(id)), ...cast.filter((id) => !COMPANY.includes(id))];
}

const LEFT_SLOTS: Readonly<Record<number, readonly NarrativeScreenPosition[]>> = Object.freeze({
  1: ['LEFT'], 2: ['FAR_LEFT', 'CENTER_LEFT'], 3: ['FAR_LEFT', 'LEFT', 'CENTER_LEFT'],
});
const RIGHT_SLOTS: Readonly<Record<number, readonly NarrativeScreenPosition[]>> = Object.freeze({
  1: ['RIGHT'], 2: ['CENTER_RIGHT', 'FAR_RIGHT'], 3: ['CENTER_RIGHT', 'RIGHT', 'FAR_RIGHT'],
});

/**
 * When the company faces the plateau's people, it holds the left and they hold the right, each side looking across.
 * A company alone among itself keeps the generic spread. Null when no facing applies.
 */
function facingPlacement(cast: readonly string[], actorId: string): { screenPosition: NarrativeScreenPosition; facing: 'LEFT' | 'RIGHT'; lookTarget: string } | null {
  const company = cast.filter((id) => COMPANY.includes(id));
  const others = cast.filter((id) => !COMPANY.includes(id));
  if (!company.length || !others.length) return null;
  const mine = company.includes(actorId);
  const side = mine ? company : others;
  const slots = (mine ? LEFT_SLOTS : RIGHT_SLOTS)[side.length]!;
  return {
    screenPosition: slots[side.indexOf(actorId)]!,
    facing: mine ? 'RIGHT' : 'LEFT',
    lookTarget: mine ? others[0]! : company.at(-1)!,
  };
}

/** Consecutive groups of lines whose speakers fit the visible-actor cap. */
function groups(sequence: DialogueSequence): { stepIds: string[]; cast: string[] }[] {
  const result: { stepIds: string[]; cast: string[] }[] = [];
  for (const step of sequence.steps) {
    const speaker = step.actorId;
    const current = result.at(-1);
    if (current && (!speaker || current.cast.includes(speaker) || current.cast.length < DRAFT_VISIBLE_ACTOR_CAP)) {
      current.stepIds.push(step.id);
      if (speaker && !current.cast.includes(speaker)) current.cast.push(speaker);
      continue;
    }
    result.push({ stepIds: [step.id], cast: speaker ? [speaker] : [] });
  }
  return result;
}

export function postDemoDraftPresentationPlan(sequence: DialogueSequence): FinalDialoguePresentationPlan {
  const segments: FinalDialoguePresentationSegment[] = groups(sequence).map((group, index) => {
    const cast = ordered(group.cast);
    const actors = stageActors(cast).map((actor) => {
      const placed = facingPlacement(cast, actor.actorId);
      const staged = placed ? { ...actor, ...placed } : actor;
      return {
        ...staged,
        scale: 1,
        lookTarget: staged.lookTarget ?? null,
        entryEffect: staged.entryEffect ?? 'NONE' as const,
        group: groupOf(staged.actorId),
        dramaticSide: staged.facing === 'RIGHT' ? 'LEFT' as const : staged.facing === 'LEFT' ? 'RIGHT' as const : 'CENTER' as const,
        depth: staged.depth ?? 2,
        narrativeRole: staged.narrativeRole ?? 'LISTENER',
      };
    });
    return {
      id: `${sequence.id}:draft-${index + 1}`,
      mode: 'STATIC_TABLEAU',
      stepIds: group.stepIds,
      visibleCast: cast,
      allowedSpeakers: cast,
      forbiddenSpeakers: [],
      actors,
      exits: [],
      stepDirections: sequence.steps.filter((step) => group.stepIds.includes(step.id) && step.actorId).map((step) => {
        const actor = actors.find((candidate) => candidate.actorId === step.actorId)!;
        return { stepId: step.id, speakerId: step.actorId!, addressedTo: actor.lookTarget, lookTarget: actor.lookTarget,
          facing: actor.facing, resolution: 'AUTHORED_CONVERSATION_TARGET' as const };
      }),
      transitionFromPrevious: index === 0 ? 'NONE' : 'TABLEAU_RESTAGE',
      rationale: 'Draft staging: one stable composition per group of lines, at most four visible actors, company left.',
    };
  });
  const speakers = [...new Set(sequence.steps.map((step) => step.actorId).filter((id): id is string => Boolean(id)))];
  return {
    dialogueId: sequence.id, originalMode: 'STATIC_TABLEAU', sourceVideo: null, sourceVideoClassification: null,
    dialogueStartsAfterMedia: true, normalDialogueDuringVideo: 0, dialogueStepsOnHold: 0, choiceStepsOnHold: 0,
    finalFrameCast: [], finalFrameCastReferenceOnly: true, allowedHoldSpeakers: [], forbiddenHoldSpeakers: speakers,
    segments,
  };
}
