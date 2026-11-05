/**
 * The player's reduced-motion choice from the settings menu (OD-2026-11-05-B). It is kept on this device, outside the
 * saves, so loading a chronicle never overrides it. The OS preference still applies on its own (ReducedMotion.ts).
 */
const MOTION_PREFERENCE_KEY = 'rpg-threejs:motion-preference:v1';

/** The stored choice, or null when the player never chose (the game then keeps its default, motion on). */
export function readMotionPreference(): boolean | null {
  try {
    const raw = localStorage.getItem(MOTION_PREFERENCE_KEY);
    if (raw === null) return null;
    const value = JSON.parse(raw) as { reduced?: unknown } | null;
    return typeof value?.reduced === 'boolean' ? value.reduced : null;
  } catch {
    return null;
  }
}

export function writeMotionPreference(reduced: boolean): void {
  try { localStorage.setItem(MOTION_PREFERENCE_KEY, JSON.stringify({ reduced })); }
  catch { /* A denied preference write never blocks the change for this session. */ }
}
