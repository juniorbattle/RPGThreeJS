/**
 * Set 1.20.0, post-demo: the refuge gatherings of the built post-demo plateaux, by refuge node. Presentation data the
 * refuge flow and the coherence validator both read.
 */
import { BEAR_REFUGE_PRESENTATION } from './bear/bearPresentation';
import { DRAGON_REFUGE_PRESENTATION } from './dragon/dragonPresentation';
import { SCORPION_REFUGE_PRESENTATION } from './scorpion/scorpionPresentation';
import { FINALE_REFUGE_PRESENTATION } from './finale/finalePresentation';
import type { CampaignChapterId } from './campaignIds';

/** The refuge presentation of every built post-demo plateau, by refuge node. */
export const POST_DEMO_REFUGE_PRESENTATION: Readonly<Record<string, {
  environmentContext: string;
  environmentRole: 'STATIC_TABLEAU' | 'HOLD_SOURCE';
  eyebrow: string;
  description: string;
  gatheringDialogueId?: string;
  awaitedFinal: string;
  /** The refuge's final image, once it exists; until then the borrowed demo plate shows, marked provisional. */
  image?: string;
}>> = Object.freeze({ ...BEAR_REFUGE_PRESENTATION, ...DRAGON_REFUGE_PRESENTATION,
  ...SCORPION_REFUGE_PRESENTATION, ...FINALE_REFUGE_PRESENTATION });

function gatherings(refuges: object): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(Object.entries(refuges as Record<string, { gatheringDialogueId?: string }>)
    .flatMap(([nodeId, refuge]) => refuge.gatheringDialogueId ? [[nodeId, refuge.gatheringDialogueId]] : [])));
}

export const POST_DEMO_REFUGE_GATHERINGS: Readonly<Partial<Record<CampaignChapterId, Readonly<Record<string, string>>>>> = Object.freeze({
  bear: gatherings(BEAR_REFUGE_PRESENTATION),
  dragon: gatherings(DRAGON_REFUGE_PRESENTATION),
  scorpion: gatherings(SCORPION_REFUGE_PRESENTATION),
  finale: gatherings(FINALE_REFUGE_PRESENTATION),
});
