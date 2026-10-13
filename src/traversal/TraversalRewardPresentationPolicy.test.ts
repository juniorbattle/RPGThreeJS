import { describe, expect, it } from 'vitest';
import { resolveTraversalRewardEnabled } from './TraversalRewardPresentationPolicy';

describe('Route Reward activation', () => {
  it.each([
    [false, '', true],
    [false, '?traversalReward=0', true],
    [false, '?traversalReward=1', true],
    [true, '', true],
    [true, '?traversalReward=1', true],
    [true, '?traversalReward=0', false],
  ])('resolves dev=%s search=%s to %s', (dev, search, expected) => {
    expect(resolveTraversalRewardEnabled({ dev, search })).toBe(expected);
  });

  it('is independent of Route Risk in both environments', () => {
    for (const dev of [false, true]) {
      for (const risk of ['0', '1']) {
        expect(resolveTraversalRewardEnabled({ dev, search: `?traversalRisk=${risk}` })).toBe(true);
        expect(resolveTraversalRewardEnabled({ dev, search: `?traversalRisk=${risk}&traversalReward=1` })).toBe(true);
        expect(resolveTraversalRewardEnabled({ dev, search: `?traversalRisk=${risk}&traversalReward=0` })).toBe(!dev);
      }
    }
  });
});
