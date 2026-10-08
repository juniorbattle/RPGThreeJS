import {
  FINAL_DIALOGUE_PRESENTATION_PLANS as reviewed,
  FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES as reviewedShapes,
  FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS as reviewedRuntime,
} from './FinalDialoguePresentation.generated';
import { CAMPAIGN_GRAMMAR_DIALOGUES } from '../game/campaignGrammarContent';
import { dialoguePresentationShapeSignature } from '../game/dialoguePresentationShape';
import { stageActors } from './NarrativeTableau';
import type { FinalDialoguePresentationPlan } from './DialoguePresentationSegments';

export { FINAL_DIALOGUE_PACING_BASELINE } from './FinalDialoguePresentation.generated';

const runtimePlans = reviewedRuntime as unknown as Readonly<Record<string, Readonly<Record<string, FinalDialoguePresentationPlan>>>>;
const serpentConfrontationShape = '1@alaric@0|2@serpent_general_boss@0|3@sage_seraphine@0';
const serpentConfrontation = runtimePlans.serpent_pursuit_pre_combat![serpentConfrontationShape]!;

/** Authored relational correction for this runtime shape; generated historical plans stay intact. */
const alliedSerpentConfrontation: FinalDialoguePresentationPlan = {
  ...serpentConfrontation,
  segments: serpentConfrontation.segments.map(segment => ({
    ...segment,
    actors: segment.actors.map(actor => actor.actorId === 'alaric'
      ? { ...actor, screenPosition: 'FAR_LEFT', dramaticSide: 'LEFT', facing: 'RIGHT' }
      : actor.actorId === 'sage_seraphine'
        ? { ...actor, screenPosition: 'CENTER_LEFT', facing: 'RIGHT', lookTarget: 'serpent_general_boss' }
        : actor),
    stepDirections: segment.stepDirections.map(direction => direction.stepId === '1'
      ? { ...direction, facing: 'RIGHT', resolution: 'AUTHORED_CONVERSATION_TARGET' }
      : direction),
  })),
};

export const FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS = Object.freeze({
  ...runtimePlans,
  serpent_pursuit_pre_combat: Object.freeze({
    ...runtimePlans.serpent_pursuit_pre_combat,
    [serpentConfrontationShape]: alliedSerpentConfrontation,
  }),
});

/** Additive authored static plans; the reviewed cinematic lock remains byte-for-byte intact. */
export const CAMPAIGN_GRAMMAR_PLANS: Readonly<Record<string, FinalDialoguePresentationPlan>> = Object.freeze(
  Object.fromEntries(CAMPAIGN_GRAMMAR_DIALOGUES.map(sequence => {
    const cast = [...new Set(sequence.steps.map(step => step.actorId!))];
    const actors = stageActors(cast).map(actor => ({ ...actor, scale: 1, lookTarget: actor.lookTarget ?? null, entryEffect: actor.entryEffect ?? 'NONE' as const, group: actor.actorId === 'villageoise' ? 'LOCAL_CIVILIAN' as const : 'PLAYER_COMPANY' as const, dramaticSide: actor.facing === 'RIGHT' ? 'LEFT' as const : 'RIGHT' as const }));
    const plan: FinalDialoguePresentationPlan = {
      dialogueId: sequence.id, originalMode: 'STATIC_TABLEAU', sourceVideo: null,
      sourceVideoClassification: null, dialogueStartsAfterMedia: true,
      normalDialogueDuringVideo: 0, dialogueStepsOnHold: 0, choiceStepsOnHold: 0,
      finalFrameCast: [], finalFrameCastReferenceOnly: true,
      allowedHoldSpeakers: [], forbiddenHoldSpeakers: cast,
      segments: [{ id: `${sequence.id}:gathering`, mode: 'STATIC_TABLEAU',
        stepIds: sequence.steps.map(step => step.id), visibleCast: cast, allowedSpeakers: cast,
        forbiddenSpeakers: [], actors, exits: [], transitionFromPrevious: 'NONE',
        rationale: 'One stable local composition with all speakers represented before their lines.',
        stepDirections: sequence.steps.map(step => {
          const actor = actors.find(candidate => candidate.actorId === step.actorId)!;
          return { stepId: step.id, speakerId: step.actorId!, addressedTo: actor.lookTarget,
            lookTarget: actor.lookTarget, facing: actor.facing, resolution: 'AUTHORED_CONVERSATION_TARGET' };
        }),
      }],
    };
    return [sequence.id, plan];
  })),
);

export const FINAL_DIALOGUE_PRESENTATION_PLANS = Object.freeze({ ...reviewed, ...CAMPAIGN_GRAMMAR_PLANS });
export const FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES = Object.freeze({ ...reviewedShapes,
  ...Object.fromEntries(CAMPAIGN_GRAMMAR_DIALOGUES.map(sequence => [sequence.id, dialoguePresentationShapeSignature(sequence)])),
});
