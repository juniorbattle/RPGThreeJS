/** Seconds, shared by entry, narrative, combat, fork and return presentation. */
export const TRAVERSAL_RHYTHM = Object.freeze({ brake: .4, hold: .12, fade: .36, restart: .4 });
export function transitionEase(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
