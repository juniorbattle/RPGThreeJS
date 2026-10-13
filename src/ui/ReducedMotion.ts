/** Either the game setting or the OS preference can request less motion. */
export function prefersReducedMotion(requested?: boolean): boolean {
  return requested === true || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** Subscribe to OS changes; the caller keeps ownership of its game setting. */
export function onReducedMotionChange(callback: () => void): () => void {
  const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  query?.addEventListener('change', callback);
  return () => query?.removeEventListener('change', callback);
}
