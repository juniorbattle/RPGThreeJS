import { POST_DEMO_MOMENTS } from '../../campaign/plateaux/postDemoPresentation';
import { postDemoMomentPlays } from '../../campaign/plateaux/postDemoMoments';
import type { ShotPainter } from '../opening/openingPainters';
import type { ImageFrame } from '../opening/openingShots';
import type { LivingScript } from './LivingTableauPlayer';
import { BEAR_ARRIVAL } from './plateauArrivals';
import { BEAR_FORCE, BEAR_HONOUR } from './bearMoments';
import { DRAGON_ARRIVAL, DRAGON_FORCE, DRAGON_HONOUR } from './dragonMoments';
import { SCORPION_ARRIVAL, SCORPION_FORCE, SCORPION_HONOUR } from './scorpionMoments';
import {
  BALANCE_DIALOGUE_SCENE, BETRAYAL_DIALOGUE_SCENE, dialogueBackdrop, FEAR_DIALOGUE_SCENE, FINALE_BALANCE, FINALE_BETRAYAL, FINALE_FEAR, FINALE_RESPECT,
  RESPECT_DIALOGUE_SCENE,
} from './finaleMoments';
import { POST_DEMO_FRAME } from './postDemoScenes';

/**
 * The living tableaux of the post-demo moments (set 1.20.0, "Post-demo moments"), keyed by moment id. The moment tables
 * were validated on 2026-11-13 (PLATEAU_MOMENTS_DRAFT_2026-11-13), and the operator judged the Borin arrival mock-up in
 * motion the same day (« Elle convainc »), which opened the twelve others. A moment without a script here goes straight to
 * its dialogue. Each plateau's hero accompanies the advisers: Marian (Bear), Elara (Dragon), Kestrel (Scorpion); the
 * final act gathers the whole company (operator, 2026-11-13).
 */
const POST_DEMO_SCRIPTS: Readonly<Record<string, LivingScript>> = Object.freeze(Object.fromEntries([
  BEAR_ARRIVAL, BEAR_HONOUR, BEAR_FORCE, DRAGON_ARRIVAL, DRAGON_HONOUR, DRAGON_FORCE, SCORPION_ARRIVAL, SCORPION_HONOUR, SCORPION_FORCE,
  FINALE_BETRAYAL, FINALE_RESPECT, FINALE_FEAR, FINALE_BALANCE,
].map((script) => [script.id, script])));

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

const fromScript = (script: LivingScript): PostDemoBackdrop => ({ image: script.shots[0]!.image, frame: POST_DEMO_FRAME, backdrop: () => script.backdrop!() });
const fromScene = (scene: { image: string }, backdrop: () => ShotPainter): PostDemoBackdrop => ({ image: scene.image, frame: POST_DEMO_FRAME, backdrop });

/**
 * By the dialogue whose painting each backdrop is drawn for: each audience keeps its arrival's hall alive, each
 * post-combat dialogue before an outcome keeps its own painting, as the Lion's aftermath dialogues do (set 1.14.0); the
 * betrayal's dialogue and the three epilogues keep their own paintings, with no figure.
 */
export const POST_DEMO_LIVING_BACKDROPS: Readonly<Record<string, PostDemoBackdrop>> = Object.freeze({
  bear_audience: fromScript(BEAR_ARRIVAL), bear_master_spy_aftermath: fromScript(BEAR_HONOUR), bear_trial_aftermath: fromScript(BEAR_FORCE),
  dragon_audience: fromScript(DRAGON_ARRIVAL), dragon_shaman_aftermath: fromScript(DRAGON_HONOUR), dragon_trial_aftermath: fromScript(DRAGON_FORCE),
  scorpion_audience: fromScript(SCORPION_ARRIVAL), scorpion_prophet_aftermath: fromScript(SCORPION_HONOUR), scorpion_trial_aftermath: fromScript(SCORPION_FORCE),
  finale_betrayal: fromScene(BETRAYAL_DIALOGUE_SCENE, dialogueBackdrop(BETRAYAL_DIALOGUE_SCENE, 8301)),
  finale_epilogue_respect: fromScene(RESPECT_DIALOGUE_SCENE, dialogueBackdrop(RESPECT_DIALOGUE_SCENE, 8401)),
  finale_epilogue_fear: fromScene(FEAR_DIALOGUE_SCENE, dialogueBackdrop(FEAR_DIALOGUE_SCENE, 8501)),
  finale_epilogue_balance: fromScene(BALANCE_DIALOGUE_SCENE, dialogueBackdrop(BALANCE_DIALOGUE_SCENE, 8601)),
});

/** The backdrop of a post-demo dialogue, only when its environment shows the painting the backdrop is made for. */
export function postDemoBackdropFor(dialogueId: string, environmentImage: string, backdrops = POST_DEMO_LIVING_BACKDROPS): PostDemoBackdrop | undefined {
  const backdrop = backdrops[dialogueId];
  return backdrop && environmentImage.includes(backdrop.image) ? backdrop : undefined;
}
