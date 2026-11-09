/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Drafts and canon"), post-demo: the content registry of the post-demo plateaux.
 *
 * Kept apart from the Lion's registries (`content.ts`), so post-demo content is never taken for Lion content, never
 * recalibrated and never counted by the demo's audits. A plateau's entries are playable DRAFTS, identifiable as such,
 * until the operator approves the plateau (the Bear since OD-2026-11-08-B, the Dragon since OD-2026-11-08-C, the Scorpion since
 * OD-2026-11-08-D, the final act since OD-2026-11-09-A, its endings since OD-2026-11-09-B); they reach `dev` only on the operator's
 * order. Every post-demo plateau shows provisional images until the final-image lot.
 */
import { BEAR_DIALOGUES, BEAR_SCENE_BUILDERS } from '../campaign/plateaux/bear/bearDialogues';
import { BEAR_FINALE } from '../campaign/plateaux/bear/bearFinale';
import { buildPlateauEpilogue, buildPlateauJudgement, type PlateauFinaleDefinition } from './plateauFinale';
import { BEAR_STORY_COMBATS, bearOptionalCombats } from '../campaign/plateaux/bear/bearCombat';
import { DRAGON_DIALOGUES, DRAGON_SCENE_BUILDERS } from '../campaign/plateaux/dragon/dragonDialogues';
import { DRAGON_FINALE } from '../campaign/plateaux/dragon/dragonFinale';
import { DRAGON_STORY_COMBATS, dragonOptionalCombats } from '../campaign/plateaux/dragon/dragonCombat';
import { SCORPION_DIALOGUES, SCORPION_SCENE_BUILDERS } from '../campaign/plateaux/scorpion/scorpionDialogues';
import { SCORPION_FINALE } from '../campaign/plateaux/scorpion/scorpionFinale';
import { SCORPION_STORY_COMBATS, scorpionOptionalCombats } from '../campaign/plateaux/scorpion/scorpionCombat';
import { FINALE_DIALOGUES, FINALE_SCENE_BUILDERS } from '../campaign/plateaux/finale/finaleDialogues';
import { FINALE_STORY_COMBATS, finaleOptionalCombats } from '../campaign/plateaux/finale/finaleCombat';
import { EPILOGUE_COMBATS, EPILOGUE_CONTENT_IDS, EPILOGUE_SCENE_BUILDERS, EPILOGUE_STATUS } from '../campaign/plateaux/finale/finaleEpilogues';
import { getPlateau, type CampaignChapterId } from '../campaign/plateaux/PlateauRegistry';
import { combatConfigSchema, dialogueSequenceSchema, type CombatConfig, type DialogueSequence, type GameState } from './types';
import { withChallenge } from './challenges';

export const POST_DEMO_DIALOGUES: ReadonlyMap<string, DialogueSequence> = new Map(
  [...BEAR_DIALOGUES, ...DRAGON_DIALOGUES, ...SCORPION_DIALOGUES, ...FINALE_DIALOGUES].map((dialogue) => {
    const parsed = dialogueSequenceSchema.parse(dialogue);
    return [parsed.id, parsed];
  }),
);

export const POST_DEMO_COMBATS: ReadonlyMap<string, CombatConfig> = new Map(
  [...BEAR_STORY_COMBATS, ...bearOptionalCombats(), ...DRAGON_STORY_COMBATS, ...dragonOptionalCombats(),
    ...SCORPION_STORY_COMBATS, ...scorpionOptionalCombats(), ...FINALE_STORY_COMBATS, ...finaleOptionalCombats(), ...EPILOGUE_COMBATS].map((combat) => {
    const parsed = combatConfigSchema.parse(withChallenge(combatConfigSchema.parse(combat)));
    return [parsed.id, parsed];
  }),
);

/** The chapter a post-demo content ID belongs to, by its prefix (`bear_`), or null for the Lion's content. */
export function postDemoChapterOf(contentId: string): CampaignChapterId | null {
  const chapter = (['bear', 'dragon', 'scorpion', 'finale'] as const).find((id) => contentId.startsWith(`${id}_`));
  return chapter ?? null;
}

/**
 * A draft is post-demo content whose plateau the operator has not approved yet, or, inside the canon final act, the
 * endings of Lot 5 until he approves them.
 */
export function isDraftContent(contentId: string): boolean {
  const chapter = postDemoChapterOf(contentId);
  if (chapter === null) return false;
  if (EPILOGUE_CONTENT_IDS.has(contentId)) return EPILOGUE_STATUS === 'draft' || getPlateau(chapter).status !== 'canon';
  return getPlateau(chapter).status !== 'canon';
}

/**
 * Post-demo content shows provisional images (WORLD_AND_CHARACTERS "Provisional images"), canon or draft, until the
 * final images of its plateau exist; none does yet.
 */
export function hasProvisionalArt(contentId: string): boolean {
  return postDemoChapterOf(contentId) !== null;
}

/** The on-screen mark of post-demo content, or null for the Lion's. */
export function provisionalMark(contentId: string): string | null {
  if (isDraftContent(contentId)) return 'Brouillon · image provisoire';
  return hasProvisionalArt(contentId) ? 'Image provisoire' : null;
}

export function plateauDialogues(chapterId: CampaignChapterId): DialogueSequence[] {
  return [...POST_DEMO_DIALOGUES.values()].filter((dialogue) => postDemoChapterOf(dialogue.id) === chapterId);
}

/** The finale definition of each built post-demo plateau. */
export const PLATEAU_FINALES: Readonly<Partial<Record<CampaignChapterId, PlateauFinaleDefinition>>> = Object.freeze({
  bear: BEAR_FINALE,
  dragon: DRAGON_FINALE,
  scorpion: SCORPION_FINALE,
});

const finaleBuilders = (finale: PlateauFinaleDefinition) => ({
  [finale.judgementDialogueId]: (state: Readonly<GameState>) => buildPlateauJudgement(finale, state),
  [finale.epilogueDialogueId]: (state: Readonly<GameState>) => buildPlateauEpilogue(finale, state),
});

const SCENE_BUILDERS: Readonly<Record<string, (state: Readonly<GameState>) => DialogueSequence>> = Object.freeze({
  ...BEAR_SCENE_BUILDERS,
  ...finaleBuilders(BEAR_FINALE),
  ...DRAGON_SCENE_BUILDERS,
  ...finaleBuilders(DRAGON_FINALE),
  ...SCORPION_SCENE_BUILDERS,
  ...finaleBuilders(SCORPION_FINALE),
  ...FINALE_SCENE_BUILDERS,
  ...EPILOGUE_SCENE_BUILDERS,
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
