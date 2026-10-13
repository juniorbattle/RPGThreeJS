// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CinematicPreloader } from './CinematicPreloader';
import { CinematicRegistry } from './CinematicRegistry';

const manifest = {
  version: 1 as const,
  cinematics: [
    { id: 'a', title: 'A', sources: [{ src: '/a.webm', type: 'video/webm' as const }] },
    { id: 'b', title: 'B', sources: [{ src: '/b.webm', type: 'video/webm' as const }] },
    { id: 'c', title: 'C', sources: [{ src: '/c.webm', type: 'video/webm' as const }] },
    { id: 'd', title: 'D', sources: [{ src: '/d.webm', type: 'video/webm' as const }] },
    { id: 'placeholder', title: 'Placeholder', sources: [], placeholderOnly: true },
  ],
};

function createPreloader(options: { maxEntries?: number } = {}) {
  const created: HTMLVideoElement[] = [];
  const preloader = new CinematicPreloader(new CinematicRegistry(manifest), {
    ...options,
    createVideoElement: () => {
      const video = document.createElement('video');
      created.push(video);
      return video;
    },
  });
  return { preloader, created };
}

describe('cinematic preloader', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('deduplicates repeated preload requests', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a', 'a', 'b', 'a']);
    preloader.preload(['a', 'b']);
    expect(created).toHaveLength(2);
    expect(preloader.size).toBe(2);
    expect(preloader.retainedCount).toBe(2);
    expect(preloader.statusOf('a')).toBe('preloading');
  });

  it('never starts playback', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { preloader, created } = createPreloader();
    preloader.preload(['a', 'b']);
    expect(play).not.toHaveBeenCalled();
    expect(created.every((video) => video.autoplay === false)).toBe(true);
    expect(created.every((video) => video.muted && video.preload === 'auto')).toBe(true);
    expect(created.every((video) => video.isConnected === false)).toBe(true);
  });

  it('prepares local sources without touching the DOM tree', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a']);
    expect(created[0]?.querySelectorAll('source')).toHaveLength(1);
    expect(created[0]?.querySelector('source')?.getAttribute('src')).toBe('/a.webm');
    expect(document.querySelector('video')).toBeNull();
    preloader.clear();
  });

  it('skips unknown IDs and placeholder-only descriptors without failing', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['absent', 'placeholder', '']);
    expect(created).toHaveLength(0);
    expect(preloader.statusOf('absent')).toBe('skipped');
    expect(preloader.statusOf('placeholder')).toBe('skipped');
    expect(preloader.has('')).toBe(false);
    expect(preloader.retainedCount).toBe(0);
  });

  it('skips descriptors the browser cannot play', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    const { preloader } = createPreloader();
    preloader.preload(['a']);
    expect(preloader.statusOf('a')).toBe('skipped');
    expect(preloader.retainedCount).toBe(0);
  });

  it('marks a media error non-fatal and releases the element', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a']);
    expect(() => created[0]?.dispatchEvent(new Event('error'))).not.toThrow();
    expect(preloader.statusOf('a')).toBe('failed');
    expect(preloader.retainedCount).toBe(0);
    expect(preloader.size).toBe(1);
    preloader.preload(['a']);
    expect(created).toHaveLength(1);
  });

  it('promotes a loaded candidate to ready', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a']);
    created[0]?.dispatchEvent(new Event('loadeddata'));
    expect(preloader.statusOf('a')).toBe('ready');
  });

  it('releases named candidates and clears every retained resource', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a', 'b']);
    preloader.release(['a', 'absent-id']);
    expect(preloader.has('a')).toBe(false);
    expect(preloader.size).toBe(1);
    expect(created[0]?.hasAttribute('src')).toBe(false);
    expect(created[0]?.querySelectorAll('source')).toHaveLength(0);
    preloader.clear();
    expect(preloader.size).toBe(0);
    expect(preloader.retainedCount).toBe(0);
    expect(created[1]?.querySelectorAll('source')).toHaveLength(0);
  });

  it('stops retaining media once the bound is exceeded', () => {
    const { preloader } = createPreloader({ maxEntries: 2 });
    preloader.preload(['a', 'b', 'c', 'd']);
    expect(preloader.retainedCount).toBe(2);
    expect(preloader.has('a')).toBe(false);
    expect(preloader.has('d')).toBe(true);
    preloader.clear();
  });

  it('stays inert after clear', () => {
    const { preloader, created } = createPreloader();
    preloader.preload(['a']);
    preloader.clear();
    expect(() => created[0]?.dispatchEvent(new Event('error'))).not.toThrow();
    expect(preloader.size).toBe(0);
  });
});
