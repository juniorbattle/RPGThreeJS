import { describe, expect, it } from 'vitest';
import {
  TRAVERSAL_PRODUCTION_GATE,
  evaluateTraversalProductionGate,
  isTraversalProductionEnabledForLeg,
} from './TraversalFeaturePolicy';

describe('TraversalFeaturePolicy', () => {
  it('deliberately opens the reviewed production T0 gate', () => {
    expect(TRAVERSAL_PRODUCTION_GATE.enabled).toBe(true);
    expect(TRAVERSAL_PRODUCTION_GATE.designAssetsReady).toBe(true);
    expect(evaluateTraversalProductionGate('T0')).toEqual({
      allowed: true,
      reason: 'ALLOWED',
    });
  });

  it('prepares rollout for T0 only', () => {
    expect([...TRAVERSAL_PRODUCTION_GATE.rolloutLegIds]).toEqual(['T0']);
    expect(isTraversalProductionEnabledForLeg('T0')).toBe(true);
    for (const id of ['T1', 'T2', 'T3', 'T4'] as const) {
      expect(isTraversalProductionEnabledForLeg(id)).toBe(false);
      expect(evaluateTraversalProductionGate(id).reason).toBe('LEG_NOT_IN_ROLLOUT');
    }
  });

  it('contains no runtime override surface', () => {
    const source = JSON.stringify(TRAVERSAL_PRODUCTION_GATE);
    expect(source).not.toContain('DEV');
    expect(source).not.toContain('query');
    expect(source).not.toContain('env');
  });
});
