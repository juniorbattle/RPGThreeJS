/**
 * Set 1.20.0 (WORLD_AND_CHARACTERS "Provisional images"), post-demo: the provisional scenes and stand-in characters of
 * every built post-demo plateau, in one place for the narrative stage and the character registry. Presentation only.
 */
import { BEAR_PROVISIONAL_ACTORS, BEAR_PROVISIONAL_SCENES, type ProvisionalActor } from './bear/bearPresentation';
import { DRAGON_PROVISIONAL_ACTORS, DRAGON_PROVISIONAL_SCENES } from './dragon/dragonPresentation';
import { SCORPION_PROVISIONAL_ACTORS, SCORPION_PROVISIONAL_SCENES } from './scorpion/scorpionPresentation';
import { FINALE_PROVISIONAL_ACTORS, FINALE_PROVISIONAL_SCENES } from './finale/finalePresentation';

export const POST_DEMO_PROVISIONAL_SCENES: Readonly<Record<string, { environmentContext: string; awaitedFinal: string }>> = Object.freeze({
  ...BEAR_PROVISIONAL_SCENES,
  ...DRAGON_PROVISIONAL_SCENES,
  ...SCORPION_PROVISIONAL_SCENES,
  ...FINALE_PROVISIONAL_SCENES,
});

export const POST_DEMO_PROVISIONAL_ACTORS: readonly ProvisionalActor[] = Object.freeze([...BEAR_PROVISIONAL_ACTORS, ...DRAGON_PROVISIONAL_ACTORS,
  ...SCORPION_PROVISIONAL_ACTORS, ...FINALE_PROVISIONAL_ACTORS]);
