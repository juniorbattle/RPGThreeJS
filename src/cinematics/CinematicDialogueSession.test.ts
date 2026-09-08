// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import type { HeldVideoCinematic, VideoCinematicResultReason } from './CinematicTypes';
import { presentCinematicDialogue } from './CinematicDialogueSession';

function heldResult(reason: VideoCinematicResultReason, withSurface = true) {
  const release = vi.fn();
  const held: HeldVideoCinematic = {
    result: { id: 'pilot', reason, played: reason === 'ended' },
    surface: withSurface ? document.createElement('section') : null,
    release,
  };
  const playHeld = vi.fn().mockResolvedValue(held);
  return { player: { playHeld }, release };
}

describe('cinematic dialogue session', () => {
  it('plays once, keeps the healthy surface through dialogue, then releases once', async () => {
    const { player, release } = heldResult('ended');
    const order: string[] = [];
    const openHeldDialogue = vi.fn(async () => { order.push('dialogue'); });
    const openFallbackDialogue = vi.fn(async () => undefined);

    await expect(presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: { reducedMotion: false },
      openHeldDialogue,
      openFallbackDialogue,
    })).resolves.toEqual({ presentation: 'held', reason: 'ended' });

    expect(player.playHeld).toHaveBeenCalledTimes(1);
    expect(player.playHeld).toHaveBeenCalledWith('pilot', { reducedMotion: false });
    expect(openHeldDialogue).toHaveBeenCalledTimes(1);
    expect(openFallbackDialogue).not.toHaveBeenCalled();
    expect(order).toEqual(['dialogue']);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('copies presentation context before releasing the held owner', async () => {
    const { player, release } = heldResult('ended');
    const preserveBackdrop = vi.fn();
    await presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: {},
      openHeldDialogue: async () => undefined,
      openFallbackDialogue: async () => undefined,
      preserveBackdrop,
    });
    expect(preserveBackdrop).toHaveBeenCalledTimes(1);
    expect(preserveBackdrop.mock.invocationCallOrder[0]).toBeLessThan(release.mock.invocationCallOrder[0]!);
  });

  it('still releases the held owner if passive backdrop capture fails unexpectedly', async () => {
    const { player, release } = heldResult('ended');
    await expect(presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: {},
      openHeldDialogue: async () => undefined,
      openFallbackDialogue: async () => undefined,
      preserveBackdrop: () => { throw new Error('snapshot copy failed'); },
    })).resolves.toEqual({ presentation: 'held', reason: 'ended' });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('uses the held presentation immediately after skip', async () => {
    const { player, release } = heldResult('skipped');
    const openHeldDialogue = vi.fn(async () => undefined);
    const openFallbackDialogue = vi.fn(async () => undefined);
    await expect(presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: { reducedMotion: false },
      openHeldDialogue,
      openFallbackDialogue,
    })).resolves.toEqual({ presentation: 'held', reason: 'skipped' });
    expect(openHeldDialogue).toHaveBeenCalledTimes(1);
    expect(openFallbackDialogue).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each(['reduced-motion', 'unavailable', 'autoplay-rejected', 'error', 'timeout'] as const)(
    'releases %s media and opens classic dialogue exactly once',
    async (reason) => {
      const { player, release } = heldResult(reason, reason !== 'reduced-motion');
      const openHeldDialogue = vi.fn(async () => undefined);
      const openFallbackDialogue = vi.fn(async () => undefined);
      await expect(presentCinematicDialogue({
        player,
        cinematicId: 'pilot',
        playback: { reducedMotion: reason === 'reduced-motion' },
        openHeldDialogue,
        openFallbackDialogue,
      })).resolves.toEqual({ presentation: 'fallback', reason });
      expect(player.playHeld).toHaveBeenCalledTimes(1);
      expect(openHeldDialogue).not.toHaveBeenCalled();
      expect(openFallbackDialogue).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledTimes(1);
    },
  );

  it('releases the surface even when dialogue presentation throws', async () => {
    const { player, release } = heldResult('ended');
    await expect(presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: {},
      openHeldDialogue: async () => { throw new Error('dialogue failed'); },
      openFallbackDialogue: async () => undefined,
    })).rejects.toThrow('dialogue failed');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('opens classic dialogue if the player rejects unexpectedly', async () => {
    const player = { playHeld: vi.fn().mockRejectedValue(new Error('unexpected player failure')) };
    const openHeldDialogue = vi.fn(async () => undefined);
    const openFallbackDialogue = vi.fn(async () => undefined);
    await expect(presentCinematicDialogue({
      player,
      cinematicId: 'pilot',
      playback: {},
      openHeldDialogue,
      openFallbackDialogue,
    })).resolves.toEqual({ presentation: 'fallback', reason: 'error' });
    expect(openHeldDialogue).not.toHaveBeenCalled();
    expect(openFallbackDialogue).toHaveBeenCalledTimes(1);
  });
});
