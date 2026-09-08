/**
 * Copies a reviewed cinematic freeze canvas into a decoder-free Journey backdrop.
 *
 * The returned canvas is detached and passive. It retains no video element, media listeners,
 * CinematicOverlay owner, or gameplay authority.
 */
export function copyJourneyBackdrop(surface: HTMLElement): HTMLCanvasElement | null {
  const source = surface.querySelector<HTMLCanvasElement>('.cinematic-overlay__freeze-frame');
  if (!source || source.hidden || source.width <= 0 || source.height <= 0) return null;
  const snapshot = document.createElement('canvas');
  snapshot.width = source.width;
  snapshot.height = source.height;
  try {
    const context = snapshot.getContext('2d');
    if (!context) return null;
    context.drawImage(source, 0, 0, source.width, source.height);
  } catch {
    return null;
  }
  snapshot.className = 'journey-surface journey-surface--snapshot';
  snapshot.dataset.journeyBackdrop = 'cinematic-snapshot';
  snapshot.setAttribute('aria-hidden', 'true');
  return snapshot;
}
