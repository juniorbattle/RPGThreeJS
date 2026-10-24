// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicPreloader } from './CinematicPreloader';
import { CinematicRegistry } from './CinematicRegistry';
import { resolveNarrativeAuthoringMedia } from './NarrativePresentationPolicy';

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); document.body.replaceChildren(); });

it('blocks even injected stale descriptors before production creates or preloads a video', async () => {
  vi.stubEnv('PROD', true);
  const registry = new CinematicRegistry({ version: 1, cinematics: [{ id: 'camp_departure', title: 'Legacy',
    sources: [{ src: '/assets/cinematics/camp_departure.mp4', type: 'video/mp4' }] }] });
  const createVideoElement = vi.fn(() => document.createElement('video'));
  const create = vi.spyOn(document, 'createElement');
  const mediaEvents = vi.fn();
  const player = new CinematicPlayer(registry);
  const preloader = new CinematicPreloader(registry, { createVideoElement });
  preloader.preload(['camp_departure']);
  expect(await player.play('camp_departure', { onMediaEvent: mediaEvents })).toEqual({ id: 'camp_departure', reason: 'unavailable', played: false });
  const held = await player.playHeld('camp_departure');
  expect(held.surface).toBeNull(); held.release();
  expect(held.result.played).toBe(false);
  expect(mediaEvents).not.toHaveBeenCalled();
  expect(createVideoElement).not.toHaveBeenCalled();
  expect(create.mock.calls.filter(([tag]) => tag === 'video')).toEqual([]);
  expect(preloader.retainedCount).toBe(0);
  expect(preloader.statusOf('camp_departure')).toBe('skipped');
  expect(player.isPlaying).toBe(false);
});

it.each([false, true])('cannot restore videos through legacy URLs (dev=%s)', dev => {
  for (const search of ['', '?media=video', '?journey=cinematic', '?presentation=narrative&media=video']) {
    expect(resolveNarrativeAuthoringMedia({ search, dev })).toBe('STILL');
  }
});
