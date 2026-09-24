import {
  FINAL_DIALOGUE_PRESENTATION_PLANS as reviewed,
  FINAL_DIALOGUE_CANONICAL_PRESENTATION_SHAPES as reviewedShapes,
} from './FinalDialoguePresentation.generated';
import { CAMPAIGN_GRAMMAR_DIALOGUES } from '../game/campaignGrammarContent';
import { dialoguePresentationShapeSignature } from '../game/dialoguePresentationShape';
import { stageActors } from './NarrativeTableau';
import type { FinalDialoguePresentationPlan } from './DialoguePresentationSegments';

export { FINAL_DIALOGUE_PACING_BASELINE, FINAL_DIALOGUE_RUNTIME_PRESENTATION_PLANS } from './FinalDialoguePresentation.generated';

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
