import { POST_DEMO_MOMENTS } from '../../campaign/plateaux/postDemoPresentation';
import { postDemoMomentPlays } from '../../campaign/plateaux/postDemoMoments';
import type { ShotPainter } from '../opening/openingPainters';
import type { ImageFrame } from '../opening/openingShots';
import type { LivingScript } from './LivingTableauPlayer';

/**
 * The living tableaux of the post-demo moments (set 1.20.0, "Post-demo moments"), keyed by moment id. The moment tables
 * were validated on 2026-11-13 (PLATEAU_MOMENTS_DRAFT_2026-11-13); a script joins this list once the operator has judged
 * the Borin arrival mock-up in motion (question 4 A). Until a moment has a script here, it goes straight to its dialogue.
 */
const POST_DEMO_SCRIPTS: Readonly<Record<string, LivingScript>> = Object.freeze({});

/** The registered scripts of the moments that play: approved, on an approved tableau. */
export const POST_DEMO_LIVING_TABLEAUX: Readonly<Record<string, LivingScript>> = Object.freeze(Object.fromEntries(
  Object.entries(POST_DEMO_SCRIPTS).filter(([id]) => POST_DEMO_MOMENTS.some((moment) => moment.id === id && postDemoMomentPlays(moment))),
));

/**
 * The backdrop a dialogue keeps after a post-demo moment, or before an outcome: light, fire and weather on the dialogue's
 * own painting, never a figure. `image` is that painting, so a backdrop never lights another picture.
 */
export interface PostDemoBackdrop {
  readonly image: string;
  readonly frame: ImageFrame;
  backdrop(): ShotPainter;
}

/** Filled with the scripts, by the dialogue whose painting each backdrop is drawn for. */
export const POST_DEMO_LIVING_BACKDROPS: Readonly<Record<string, PostDemoBackdrop>> = Object.freeze({});

/** The backdrop of a post-demo dialogue, only when its environment shows the painting the backdrop is made for. */
export function postDemoBackdropFor(dialogueId: string, environmentImage: string, backdrops = POST_DEMO_LIVING_BACKDROPS): PostDemoBackdrop | undefined {
  const backdrop = backdrops[dialogueId];
  return backdrop && environmentImage.includes(backdrop.image) ? backdrop : undefined;
}
