import { describe, expect, it } from 'vitest';
import { SpriteFrameAnimationController } from './SpriteFrameAnimation';

type State = 'idle' | 'attack';

const definitions = [
  { state: 'idle', frames: ['i0', 'i1'], frameDurationMs: 200, loop: true },
  { state: 'attack', frames: ['a0', 'a1', 'a2'], frameDurationMs: 100, loop: false, returnState: 'idle' },
] as const;

describe('SpriteFrameAnimationController', () => {
  it('loops without accumulating renderer state', () => {
    const player = new SpriteFrameAnimationController<State>(definitions, 'idle', 0);
    expect(player.sample(0).frameUrl).toBe('i0');
    expect(player.sample(200).frameUrl).toBe('i1');
    expect(player.sample(400).frameUrl).toBe('i0');
  });

  it('plays a one-shot and returns to idle at the exact boundary', () => {
    const player = new SpriteFrameAnimationController<State>(definitions, 'idle', 0);
    player.play('attack', 1_000);
    expect(player.sample(1_200)).toMatchObject({ state: 'attack', frameIndex: 2 });
    expect(player.sample(1_300)).toMatchObject({ state: 'idle', frameIndex: 0 });
    expect(player.currentState()).toBe('idle');
  });

  it('supports deterministic restart and non-restart semantics', () => {
    const player = new SpriteFrameAnimationController<State>(definitions, 'idle', 0);
    player.play('attack', 100);
    player.play('attack', 150, false);
    expect(player.sample(200).frameIndex).toBe(1);
    player.play('attack', 200);
    expect(player.sample(200).frameIndex).toBe(0);
  });
});
