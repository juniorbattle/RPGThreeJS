import type { CinematicPlayer } from './CinematicPlayer';
import type { HeldVideoCinematic, VideoCinematicPlaybackOptions, VideoCinematicResultReason } from './CinematicTypes';

export interface CinematicDialogueSessionOptions {
  player: Pick<CinematicPlayer, 'playHeld'>;
  cinematicId: string;
  playback: VideoCinematicPlaybackOptions;
  openHeldDialogue: () => Promise<void>;
  openFallbackDialogue: () => Promise<void>;
}

export interface CinematicDialogueSessionResult {
  presentation: 'held' | 'fallback';
  reason: VideoCinematicResultReason;
}

const HELD_DIALOGUE_REASONS: ReadonlySet<VideoCinematicResultReason> = new Set([
  'ended',
  'skipped',
]);

/**
 * Owns one Journey cinematic-to-dialogue presentation lifecycle.
 *
 * This coordinator deliberately knows nothing about dialogue content, effects, campaign state,
 * combat, or route selection. Its only authority is presentation ownership and cleanup.
 */
export async function presentCinematicDialogue(
  options: CinematicDialogueSessionOptions,
): Promise<CinematicDialogueSessionResult> {
  let held: HeldVideoCinematic;
  try {
    held = await options.player.playHeld(options.cinematicId, options.playback);
  } catch {
    await options.openFallbackDialogue();
    return { presentation: 'fallback', reason: 'error' };
  }
  const canPresentHeld = held.surface !== null && HELD_DIALOGUE_REASONS.has(held.result.reason);

  if (!canPresentHeld) {
    held.release();
    await options.openFallbackDialogue();
    return { presentation: 'fallback', reason: held.result.reason };
  }

  try {
    await options.openHeldDialogue();
  } finally {
    held.release();
  }
  return { presentation: 'held', reason: held.result.reason };
}
