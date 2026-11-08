/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Drafts and canon"), post-demo: the content registry of the post-demo plateaux.
 *
 * Kept apart from the Lion's registries (`content.ts`), so a draft is never taken for Lion content, never recalibrated
 * and never counted by the demo's audits. Every entry here is a playable DRAFT, identifiable as such, until the
 * operator approves its plateau; it reaches `dev` only on the operator's order.
 */
import { BEAR_DIALOGUES } from '../campaign/plateaux/bear/bearDialogues';
import { BEAR_STORY_COMBATS, bearOptionalCombats } from '../campaign/plateaux/bear/bearCombat';
import { getPlateau, type CampaignChapterId } from '../campaign/plateaux/PlateauRegistry';
import { combatConfigSchema, dialogueSequenceSchema, type CombatConfig, type DialogueSequence } from './types';
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
