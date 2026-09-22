import type { LionTraversalLegId } from '../campaign/LionCampaignTravelRelations';

/**
 * Production safety gate for the playable Traversal runtime.
 *
 * FAIL-CLOSED by design:
 * - no query-string override
 * - no DEV override
 * - no environment-variable override
 * - no automatic asset detection
 *
 * Enabling Traversal requires an intentional source change and review.
 */
export const TRAVERSAL_PRODUCTION_GATE = Object.freeze({
  enabled: false,
  designAssetsReady: false,
  rolloutLegIds: Object.freeze(['T0'] as const satisfies readonly LionTraversalLegId[]),
});

export interface TraversalGateDecision {
  readonly allowed: boolean;
  readonly reason:
    | 'FEATURE_DISABLED'
    | 'DESIGN_ASSETS_NOT_READY'
    | 'LEG_NOT_IN_ROLLOUT'
    | 'ALLOWED';
}

export function evaluateTraversalProductionGate(
  legId: LionTraversalLegId,
): TraversalGateDecision {
  if (!TRAVERSAL_PRODUCTION_GATE.enabled) {
    return { allowed: false, reason: 'FEATURE_DISABLED' };
  }
  if (!TRAVERSAL_PRODUCTION_GATE.designAssetsReady) {
    return { allowed: false, reason: 'DESIGN_ASSETS_NOT_READY' };
  }
  if (!(TRAVERSAL_PRODUCTION_GATE.rolloutLegIds as readonly LionTraversalLegId[]).includes(legId)) {
    return { allowed: false, reason: 'LEG_NOT_IN_ROLLOUT' };
  }
  return { allowed: true, reason: 'ALLOWED' };
}

export function isTraversalProductionEnabledForLeg(
  legId: LionTraversalLegId,
): boolean {
  return evaluateTraversalProductionGate(legId).allowed;
}
