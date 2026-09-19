import { describe, expect, it } from 'vitest';
import {
  TRAVERSAL_PRODUCTION_GATE,
  evaluateTraversalProductionGate,
  isTraversalProductionEnabledForLeg,
} from './TraversalFeaturePolicy';

describe('TraversalFeaturePolicy', () => {
  it('is hard-disabled by default until design and required assets are ready', () => {
    expect(TRAVERSAL_PRODUCTION_GATE.enabled).toBe(false);
    expect(TRAVERSAL_PRODUCTION_GATE.designAssetsReady).toBe(false);
    expect(evaluateTraversalProductionGate('T0')).toEqual({
      allowed: false,
      reason: 'FEATURE_DISABLED',
    });
  });

  it('prepares rollout for T0 only', () => {
    expect([...TRAVERSAL_PRODUCTION_GATE.rolloutLegIds]).toEqual(['T0']);
    expect(isTraversalProductionEnabledForLeg('T0')).toBe(false);
    for (const id of ['T1', 'T2', 'T3', 'T4'] as const) {
      expect(isTraversalProductionEnabledForLeg(id)).toBe(false);
    }
  });

  it('contains no runtime override surface', () => {
    const source = JSON.stringify(TRAVERSAL_PRODUCTION_GATE);
    expect(source).not.toContain('DEV');
    expect(source).not.toContain('query');
    expect(source).not.toContain('env');
  });
});
