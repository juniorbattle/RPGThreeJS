/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Drafts and canon"), post-demo: the content registry of the post-demo plateaux.
 *
 * Kept apart from the Lion's registries (`content.ts`), so a draft is never taken for Lion content, never recalibrated
 * and never counted by the demo's audits. Every entry here is a playable DRAFT, identifiable as such, until the
 * operator approves its plateau; it reaches `dev` only on the operator's order.
 */
import { BEAR_DIALOGUES, BEAR_SCENE_BUILDERS } from '../campaign/plateaux/bear/bearDialogues';
import { BEAR_FINALE } from '../campaign/plateaux/bear/bearFinale';
import { buildPlateauEpilogue, buildPlateauJudgement, type PlateauFinaleDefinition } from './plateauFinale';
import { BEAR_STORY_COMBATS, bearOptionalCombats } from '../campaign/plateaux/bear/bearCombat';
import { getPlateau, type CampaignChapterId } from '../campaign/plateaux/PlateauRegistry';
import { combatConfigSchema, dialogueSequenceSchema, type CombatConfig, type DialogueSequence, type GameState } from './types';
import { withChallenge } from './challenges';

export const POST_DEMO_DIALOGUES: ReadonlyMap<string, DialogueSequence> = new Map(
  [...BEAR_DIALOGUES].map((dialogue) => {
    const parsed = dialogueSequenceSchema.parse(dialogue);
    return [parsed.id, parsed];
  }),
);

export const POST_DEMO_COMBATS: ReadonlyMap<string, CombatConfig> = new Map(
  [...BEAR_STORY_COMBATS, ...bearOptionalCombats()].map((combat) => {
    const parsed = combatConfigSchema.parse(withChallenge(combatConfigSchema.parse(combat)));
    return [parsed.id, parsed];
  }),
);

/** The chapter a post-demo content ID belongs to, by its prefix (`bear_`), or null for the Lion's content. */
export function postDemoChapterOf(contentId: string): CampaignChapterId | null {
  const chapter = (['bear', 'dragon', 'scorpion', 'finale'] as const).find((id) => contentId.startsWith(`${id}_`));
  return chapter ?? null;
}

/** A draft is post-demo content whose plateau the operator has not approved yet. */
export function isDraftContent(contentId: string): boolean {
  const chapter = postDemoChapterOf(contentId);
  return chapter !== null && getPlateau(chapter).status !== 'canon';
}

export function plateauDialogues(chapterId: CampaignChapterId): DialogueSequence[] {
  return [...POST_DEMO_DIALOGUES.values()].filter((dialogue) => postDemoChapterOf(dialogue.id) === chapterId);
}

/** The finale definition of each built post-demo plateau. */
export const PLATEAU_FINALES: Readonly<Partial<Record<CampaignChapterId, PlateauFinaleDefinition>>> = Object.freeze({ bear: BEAR_FINALE });

const SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  ...BEAR_SCENE_BUILDERS,
  [BEAR_FINALE.judgementDialogueId]: (state: Readonly<GameState>) => buildPlateauJudgement(BEAR_FINALE, state),
  [BEAR_FINALE.epilogueDialogueId]: (state: Readonly<GameState>) => buildPlateauEpilogue(BEAR_FINALE, state),
});

export function isPostDemoSceneBuilt(dialogueId: string): boolean {
  return dialogueId in SCENE_BUILDERS;
}

/** A post-demo dialogue as the state shapes it: a state-built scene, or an authored draft. */
export function resolvePostDemoDialogue(dialogueId: string, state: Readonly<GameState>): DialogueSequence | undefined {
  const builder = SCENE_BUILDERS[dialogueId];
  return builder ? dialogueSequenceSchema.parse(builder(state)) : POST_DEMO_DIALOGUES.get(dialogueId);
}

/** Every state-built scene of a chapter, under the given states, for audits and the coherence validator. */
export function builtPlateauScenes(chapterId: CampaignChapterId, states: readonly Readonly<GameState>[]): DialogueSequence[] {
  return Object.keys(SCENE_BUILDERS).filter((id) => postDemoChapterOf(id) === chapterId)
    .flatMap((id) => states.map((state) => dialogueSequenceSchema.parse(SCENE_BUILDERS[id]!(state))));
}

export function postDemoSceneIds(chapterId: CampaignChapterId): string[] {
  return Object.keys(SCENE_BUILDERS).filter((id) => postDemoChapterOf(id) === chapterId);
}

export function getPostDemoCombat(combatId: string): CombatConfig | undefined {
  return POST_DEMO_COMBATS.get(combatId);
}
