// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import type { HeldVideoCinematic, VideoCinematicResult, VideoCinematicResultReason } from './CinematicTypes';
import type { NarrativeStage } from './NarrativeStage';
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

  it('opens live NarrativeStage dialogue while moving media has one passive owner', async () => {
    const surface = document.createElement('section');
    let finishMedia!: (result: VideoCinematicResult) => void;
    const presentCinematic = vi.fn(() => new Promise<VideoCinematicResult>((resolve) => { finishMedia = resolve; }));
    const stage = {
      presentCinematic,
      get frozenSurface() { return surface; },
    } as unknown as NarrativeStage;
    const openLiveDialogue = vi.fn(async () => undefined);
    const openHeldDialogue = vi.fn(async () => undefined);
    const openFallbackDialogue = vi.fn(async () => undefined);
    const preserveBackdrop = vi.fn();
    const pending = presentCinematicDialogue({
      player: { playHeld: vi.fn() },
      stage,
      cinematicId: 'pilot',
      playback: { reducedMotion: false },
      openLiveDialogue,
      openHeldDialogue,
      openFallbackDialogue,
      preserveBackdrop,
    });
    await Promise.resolve();
    expect(openLiveDialogue).toHaveBeenCalledTimes(1);
    expect(presentCinematic).toHaveBeenCalledWith('pilot', { reducedMotion: false, passive: true });
    expect(openHeldDialogue).not.toHaveBeenCalled();
    expect(openFallbackDialogue).not.toHaveBeenCalled();
    finishMedia({ id: 'pilot', reason: 'ended', played: true });
    await expect(pending).resolves.toEqual({ presentation: 'held', reason: 'ended' });
    expect(preserveBackdrop).toHaveBeenCalledWith(surface);
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
