import type { CinematicPlayer } from './CinematicPlayer';
import type { HeldVideoCinematic, VideoCinematicPlaybackOptions, VideoCinematicResult, VideoCinematicResultReason } from './CinematicTypes';
import type { NarrativeStage } from './NarrativeStage';

export interface CinematicDialogueSessionOptions {
  player: Pick<CinematicPlayer, 'playHeld'>;
  cinematicId: string;
  playback: VideoCinematicPlaybackOptions;
  openHeldDialogue: () => Promise<void>;
  openFallbackDialogue: () => Promise<void>;
  stage?: NarrativeStage;
  openLiveDialogue?: () => Promise<void>;
  preserveBackdrop?: (surface: HTMLElement) => void;
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
  if (options.stage && options.openLiveDialogue) {
    const mediaPromise = options.stage.presentCinematic(options.cinematicId, { ...options.playback, passive: true });
    const dialoguePromise = Promise.resolve().then(options.openLiveDialogue);
    const [mediaOutcome, dialogueOutcome] = await Promise.allSettled([mediaPromise, dialoguePromise]);
    const result: VideoCinematicResult = mediaOutcome.status === 'fulfilled'
      ? mediaOutcome.value
      : { id: options.cinematicId, reason: 'error', played: false, error: mediaOutcome.reason };
    const surface = options.stage.frozenSurface;
    if (surface) {
      try { options.preserveBackdrop?.(surface); } catch {}
    }
    if (dialogueOutcome.status === 'rejected') throw dialogueOutcome.reason;
    return { presentation: surface && HELD_DIALOGUE_REASONS.has(result.reason) ? 'held' : 'fallback', reason: result.reason };
  }

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
    try {
      options.preserveBackdrop?.(held.surface!);
    } catch {
      // A passive backdrop is optional presentation; capture failure must not undo dialogue.
    } finally {
      held.release();
    }
  }
  return { presentation: 'held', reason: held.result.reason };
}
