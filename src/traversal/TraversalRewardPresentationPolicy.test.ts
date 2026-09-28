import { describe, expect, it } from 'vitest';
import { resolveTraversalRewardEnabled } from './TraversalRewardPresentationPolicy';

describe('Route Reward activation', () => {
  it('is off in production and normal DEV, and independent of Route Risk', () => {
    expect(resolveTraversalRewardEnabled({ dev: false, search: '?traversalReward=1' })).toBe(false);
    expect(resolveTraversalRewardEnabled({ dev: true, search: '' })).toBe(false);
    expect(resolveTraversalRewardEnabled({ dev: true, search: '?traversalReward=0' })).toBe(false);
    expect(resolveTraversalRewardEnabled({ dev: true, search: '?traversalReward=1' })).toBe(true);
    expect(resolveTraversalRewardEnabled({ dev: true, search: '?traversalReward=1&traversalRisk=0' })).toBe(true);
  });
});
