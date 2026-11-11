/**
 * Set 1.22.0 (OD-2026-11-11-E, final audit B8): reduced motion is the in-game setting alone, off by default and kept on
 * the device (MotionPreference.ts). The operating system's preference no longer requests it, so a player whose system
 * turns animations off still sees the game's motion until they choose otherwise in Réglages.
 */
export function prefersReducedMotion(requested?: boolean): boolean {
  return requested === true;
}

/**
 * Kept for its callers: the OS preference no longer changes the game's motion, so there is nothing to observe. The game
 * setting reaches every running surface through its owner (GameApp), not through this subscription.
 */
export function onReducedMotionChange(_callback: () => void): () => void {
  return () => {};
}
