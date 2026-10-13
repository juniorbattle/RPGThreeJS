// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyJourneyBackdrop } from './JourneyBackdrop';

describe('Journey static cinematic backdrop', () => {
  afterEach(() => vi.restoreAllMocks());

  it('copies the freeze pixels into a passive detached canvas without retaining a decoder', () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const surface = document.createElement('section');
    const source = document.createElement('canvas');
    source.className = 'cinematic-overlay__freeze-frame';
    source.width = 1920;
    source.height = 1080;
    surface.append(source, document.createElement('video'));
    const snapshot = copyJourneyBackdrop(surface);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.isConnected).toBe(false);
    expect(snapshot?.classList.contains('journey-surface--snapshot')).toBe(true);
    expect(snapshot?.querySelector('video')).toBeNull();
    expect(snapshot?.getAttribute('aria-hidden')).toBe('true');
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 1920, 1080);
  });

  it('falls back safely when no valid decoded freeze is available', () => {
    const surface = document.createElement('section');
    expect(copyJourneyBackdrop(surface)).toBeNull();
    const source = document.createElement('canvas');
    source.className = 'cinematic-overlay__freeze-frame';
    source.width = 1920;
    source.height = 1080;
    surface.append(source);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(copyJourneyBackdrop(surface)).toBeNull();
  });

  it('falls back safely when the browser refuses to copy the decoded frame', () => {
    const surface = document.createElement('section');
    const source = document.createElement('canvas');
    source.className = 'cinematic-overlay__freeze-frame';
    source.width = 1920;
    source.height = 1080;
    surface.append(source);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: () => { throw new DOMException('canvas is not origin-clean'); },
    } as unknown as CanvasRenderingContext2D);
    expect(copyJourneyBackdrop(surface)).toBeNull();
  });
});
