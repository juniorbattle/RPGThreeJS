/**
 * Set 1.20.0, post-demo: the refuge gatherings of the built post-demo plateaux, by refuge node. Presentation data the
 * refuge flow and the coherence validator both read.
 */
import { BEAR_REFUGE_PRESENTATION } from './bear/bearPresentation';
import type { CampaignChapterId } from './campaignIds';

/** The refuge presentation of every built post-demo plateau, by refuge node. */
export const POST_DEMO_REFUGE_PRESENTATION: Readonly<Record<string, {
  environmentContext: string;
  environmentRole: 'STATIC_TABLEAU' | 'HOLD_SOURCE';
  eyebrow: string;
  description: string;
  gatheringDialogueId?: string;
}>> = Object.freeze({ ...BEAR_REFUGE_PRESENTATION });

export const POST_DEMO_REFUGE_GATHERINGS: Readonly<Partial<Record<CampaignChapterId, Readonly<Record<string, string>>>>> = Object.freeze({
  bear: Object.freeze(Object.fromEntries(Object.entries(BEAR_REFUGE_PRESENTATION)
    .flatMap(([nodeId, refuge]) => 'gatheringDialogueId' in refuge && refuge.gatheringDialogueId ? [[nodeId, refuge.gatheringDialogueId]] : []))),
});
