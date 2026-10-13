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

  it('opens only the accepted T0/T1/T3 rollout', () => {
    expect([...TRAVERSAL_PRODUCTION_GATE.rolloutLegIds]).toEqual(['T0', 'T1', 'T3']);
    expect(isTraversalProductionEnabledForLeg('T0')).toBe(true);
    expect(isTraversalProductionEnabledForLeg('T1')).toBe(true);
    expect(isTraversalProductionEnabledForLeg('T3')).toBe(true);
    for (const id of ['T2', 'T4'] as const) {
      expect(isTraversalProductionEnabledForLeg(id)).toBe(false);
      expect(evaluateTraversalProductionGate(id).reason).toBe('RETIRED_PLAYABLE_LEG');
    }
  });

  it('contains no runtime override surface', () => {
    const source = JSON.stringify(TRAVERSAL_PRODUCTION_GATE);
    expect(source).not.toContain('DEV');
    expect(source).not.toContain('query');
    expect(source).not.toContain('env');
  });
});
