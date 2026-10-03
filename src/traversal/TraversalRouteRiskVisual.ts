import type { TraversalRouteHazard } from './TraversalRouteRisk';

export type TraversalRouteRiskVisualKind = 'fallen-branch' | 'boulder' | 'roadblock';
export type TraversalRouteRiskVisualVariant = 'a' | 'b';

const RISK_ASSET_ROOT = '/assets/generated/lion-phase/traversal/t0/risk';

// OD-2026-10-03-A: active obstacle art is rock-only. Historical gameplay kinds
// and authored IDs/lanes/contact times/severity remain unchanged, including remapped legs.
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
  const kind = 'boulder';
  const variant = AUTHORED_VARIANTS[hazard.id] ?? stableVariant(hazard.id);
  return { kind, variant, src: `${RISK_ASSET_ROOT}/${kind}-${variant}.png` };
}
