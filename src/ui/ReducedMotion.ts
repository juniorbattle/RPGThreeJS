/** Either the game setting or the OS preference can request less motion. */
export function prefersReducedMotion(requested?: boolean): boolean {
  return requested === true || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}
