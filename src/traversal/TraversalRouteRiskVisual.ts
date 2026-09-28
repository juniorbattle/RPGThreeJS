import type { TraversalRouteHazard } from './TraversalRouteRisk';

export type TraversalRouteRiskVisualKind = 'fallen-branch' | 'boulder' | 'roadblock';
export type TraversalRouteRiskVisualVariant = 'a' | 'b';

const RISK_ASSET_ROOT = '/assets/generated/lion-phase/traversal/t0/risk';

// These authored roadblocks read as rocks in the painted world. Their gameplay
// kind, lane, contact progress, and collision resolution remain unchanged.
const BOULDER_HAZARD_IDS = new Set(['t0:r3:block-2', 't0:r4:block-1']);
// Route 5B deliberately shows both timber variants in its alternating hazards.
const AUTHORED_VARIANTS: Readonly<Record<string, TraversalRouteRiskVisualVariant>> = {
  't0:r5b:block-1': 'a',
};

function stableVariant(id: string): TraversalRouteRiskVisualVariant {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return ((hash >>> 2) & 1) === 0 ? 'a' : 'b';
}

export function resolveRouteRiskVisual(hazard: TraversalRouteHazard): {
  readonly kind: TraversalRouteRiskVisualKind;
  readonly variant: TraversalRouteRiskVisualVariant;
  readonly src: string;
} {
  const kind = hazard.kind === 'fallen-branch' ? 'fallen-branch'
    : BOULDER_HAZARD_IDS.has(hazard.id) ? 'boulder' : 'roadblock';
  const variant = AUTHORED_VARIANTS[hazard.id] ?? stableVariant(hazard.id);
  return { kind, variant, src: `${RISK_ASSET_ROOT}/${kind}-${variant}.png` };
}
