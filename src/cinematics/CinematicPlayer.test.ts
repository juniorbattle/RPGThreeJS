// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';

const registry = () => new CinematicRegistry({
  version: 1,
  cinematics: [
    { id: 'placeholder', title: 'Placeholder', sources: [], placeholderOnly: true },
    { id: 'video', title: 'Video', sources: [{ src: '/video.webm', type: 'video/webm' }] },
    { id: 'poster-video', title: 'Poster', sources: [{ src: '/poster.webm', type: 'video/webm' }], poster: '/poster.png' },
  ],
});

describe('cinematic player', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('settles placeholder skip once and removes the overlay', async () => {
    const player = new CinematicPlayer(registry());
    const resultPromise = player.play('placeholder', { reducedMotion: false, placeholderDurationMs: 5_000 });
    document.querySelector<HTMLButtonElement>('.cinematic-overlay__skip')?.click();
    await expect(resultPromise).resolves.toMatchObject({ reason: 'placeholder', played: false });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(player.isPlaying).toBe(false);
  });

  it('continues immediately for missing IDs and reduced motion', async () => {
    const player = new CinematicPlayer(registry());
    await expect(player.play('missing', { reducedMotion: false })).resolves.toMatchObject({ reason: 'unavailable' });
    await expect(player.play('placeholder', { reducedMotion: true })).resolves.toMatchObject({ reason: 'reduced-motion' });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('aborts active playback and restores previous focus', async () => {
    const focus = document.createElement('button');
    document.body.append(focus);
    focus.focus();
    const controller = new AbortController();
    const player = new CinematicPlayer(registry());
    const resultPromise = player.play('placeholder', { signal: controller.signal, reducedMotion: false, placeholderDurationMs: 5_000 });
    controller.abort();
    await expect(resultPromise).resolves.toMatchObject({ reason: 'aborted' });
    expect(document.activeElement).toBe(focus);
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('handles autoplay rejection without leaving media or listeners active', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('Blocked', 'NotAllowedError'));
    const player = new CinematicPlayer(registry());
    await expect(player.play('video', { reducedMotion: false })).resolves.toMatchObject({ reason: 'autoplay-rejected' });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(player.isPlaying).toBe(false);
  });

  it('settles ended playback and cleans the media overlay', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const player = new CinematicPlayer(registry());
    const resultPromise = player.play('video', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('ended'));
    await expect(resultPromise).resolves.toMatchObject({ reason: 'ended', played: true });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('settles media errors once and cleans the overlay', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const player = new CinematicPlayer(registry());
    const resultPromise = player.play('video', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('error'));
    await expect(resultPromise).resolves.toMatchObject({ reason: 'error', played: false });
    expect(player.isPlaying).toBe(false);
  });

  it('bounds stalled media with a timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const player = new CinematicPlayer(registry());
    const resultPromise = player.play('video', { reducedMotion: false, stallTimeoutMs: 100 });
    document.querySelector('video')?.dispatchEvent(new Event('stalled'));
    await vi.advanceTimersByTimeAsync(100);
    await expect(resultPromise).resolves.toMatchObject({ reason: 'timeout', played: false });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('accepts only one active playback owner', async () => {
    const player = new CinematicPlayer(registry());
    const first = player.play('placeholder', { reducedMotion: false, placeholderDurationMs: 5_000 });
    await expect(player.play('placeholder', { reducedMotion: false })).resolves.toMatchObject({ reason: 'busy' });
    player.abort();
    await expect(first).resolves.toMatchObject({ reason: 'aborted' });
  });
});

describe('cinematic player hold', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('keeps an ended presentation mounted on its final frame', async () => {
    const player = new CinematicPlayer(registry());
    const pending = player.playHeld('video', { reducedMotion: false });
    const video = document.querySelector('video');
    video?.dispatchEvent(new Event('loadeddata'));
    video?.dispatchEvent(new Event('ended'));
    const held = await pending;
    expect(held.result).toMatchObject({ reason: 'ended', played: true });
    expect(held.surface).toBe(document.querySelector('.cinematic-overlay'));
    expect(document.querySelector('.cinematic-overlay--frozen')).not.toBeNull();
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__video')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__skip')?.hidden).toBe(true);
    expect(player.isPlaying).toBe(false);
  });

  it('releases a held presentation exactly once', async () => {
    const player = new CinematicPlayer(registry());
    const pending = player.playHeld('video', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('ended'));
    const held = await pending;
    held.release();
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    held.release();
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('holds a skipped presentation at the same boundary as an ended one', async () => {
    const player = new CinematicPlayer(registry());
    const pending = player.playHeld('video', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('loadeddata'));
    document.querySelector<HTMLButtonElement>('.cinematic-overlay__skip')?.click();
    const held = await pending;
    expect(held.result.reason).toBe('skipped');
    expect(held.surface).not.toBeNull();
    expect(document.querySelector('.cinematic-overlay--frozen')).not.toBeNull();
  });

  it('degrades a frameless hold to the descriptor poster', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    const player = new CinematicPlayer(registry());
    const held = await player.playHeld('poster-video', { reducedMotion: false });
    expect(held.result.reason).toBe('unavailable');
    const poster = document.querySelector<HTMLElement>('.cinematic-overlay__poster');
    expect(poster?.hidden).toBe(false);
    expect(poster?.style.backgroundImage).toContain('/poster.png');
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(true);
    held.release();
  });

  it('degrades a frameless posterless hold to the text fallback', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    const player = new CinematicPlayer(registry());
    const held = await player.playHeld('video', { reducedMotion: false });
    expect(held.result.reason).toBe('unavailable');
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__poster')?.hidden).toBe(true);
    held.release();
  });

  it('mounts nothing to hold for reduced motion or unknown IDs', async () => {
    const player = new CinematicPlayer(registry());
    await expect(player.playHeld('video', { reducedMotion: true })).resolves.toMatchObject({ surface: null });
    await expect(player.playHeld('absent', { reducedMotion: false })).resolves.toMatchObject({ surface: null });
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('holds a timed-out presentation without leaving playback active', async () => {
    vi.useFakeTimers();
    const player = new CinematicPlayer(registry());
    const pending = player.playHeld('video', { reducedMotion: false, stallTimeoutMs: 50 });
    document.querySelector('video')?.dispatchEvent(new Event('stalled'));
    await vi.advanceTimersByTimeAsync(50);
    const held = await pending;
    expect(held.result.reason).toBe('timeout');
    expect(held.surface).not.toBeNull();
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(false);
    expect(player.isPlaying).toBe(false);
    held.release();
  });
});
