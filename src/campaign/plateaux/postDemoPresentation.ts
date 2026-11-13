/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo: the scenes and characters of every built post-demo
 * plateau, in one place for the narrative stage and the character registry. A scene with its final tableau (`image`)
 * shows it; one without borrows its approved Lion tableau (`environmentContext`), marked provisional. A character with
 * its final master (`master`) shows it; one without is staged with its stand-in silhouette. Presentation only.
 */
import { BEAR_CHRONICLE_END_IMAGE, BEAR_PROVISIONAL_ACTORS, BEAR_PROVISIONAL_SCENES, type ProvisionalActor } from './bear/bearPresentation';
import { DRAGON_CHRONICLE_END_IMAGE, DRAGON_PROVISIONAL_ACTORS, DRAGON_PROVISIONAL_SCENES } from './dragon/dragonPresentation';
import { SCORPION_CHRONICLE_END_IMAGE, SCORPION_PROVISIONAL_ACTORS, SCORPION_PROVISIONAL_SCENES } from './scorpion/scorpionPresentation';
import { FINALE_CHRONICLE_END_IMAGE, FINALE_PROVISIONAL_ACTORS, FINALE_PROVISIONAL_SCENES } from './finale/finalePresentation';
import type { CampaignChapterId } from './campaignIds';

export const POST_DEMO_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string; image?: string }>> = Object.freeze({
  ...BEAR_PROVISIONAL_SCENES,
  ...DRAGON_PROVISIONAL_SCENES,
  ...SCORPION_PROVISIONAL_SCENES,
  ...FINALE_PROVISIONAL_SCENES,
});

export const POST_DEMO_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([...BEAR_PROVISIONAL_ACTORS, ...DRAGON_PROVISIONAL_ACTORS,
  ...SCORPION_PROVISIONAL_ACTORS, ...FINALE_PROVISIONAL_ACTORS]);

/**
 * The plateaux whose final images are all integrated (OD-2026-11-11-F, F1): their content no longer carries the
 * "Image provisoire" mark. The Bear since the operator's acceptance of 2026-11-12, the Dragon since his order of the same
 * day to integrate it, the Scorpion since his order of the same day (« Intègre le Scorpion »), the final act since his
 * order of 2026-11-13 (« Intègre l’acte final »).
 */
export const POST_DEMO_FINAL_ART_CHAPTERS: ReadonlySet<CampaignChapterId> = new Set<CampaignChapterId>(['bear', 'dragon', 'scorpion', 'finale']);

/** The chronicle-end image of a plateau with its own, by the plateau's terminal node; the final act ends at the breach. */
export const POST_DEMO_CHRONICLE_END_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  'bear-judgement': BEAR_CHRONICLE_END_IMAGE,
  'dragon-judgement': DRAGON_CHRONICLE_END_IMAGE,
  'scorpion-judgement': SCORPION_CHRONICLE_END_IMAGE,
  'finale-breach': FINALE_CHRONICLE_END_IMAGE,
});
