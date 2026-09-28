import type { TraversalRouteHazard } from './TraversalRouteRisk';

/** Authored T0 rhythm. Contacts sit inside active driving, clear of every handoff. */
const AUTHORED_HAZARDS: TraversalRouteHazard[] = [
  { id: 't0:r1:branch-1', segmentId: 'route-1', progress01: .38, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r2:branch-1', segmentId: 'route-2', progress01: .48, lane: 1, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r3:branch-1', segmentId: 'route-3', progress01: .32, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r3:block-2', segmentId: 'route-3', progress01: .68, lane: 1, kind: 'roadblock', severity: 1 },
  { id: 't0:r4:block-1', segmentId: 'route-4', progress01: .31, lane: 1, kind: 'roadblock', severity: 1 },
  { id: 't0:r4:branch-2', segmentId: 'route-4', progress01: .68, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r5a:branch-1', segmentId: 'route-5a', progress01: .30, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r5a:block-2', segmentId: 'route-5a', progress01: .66, lane: 1, kind: 'roadblock', severity: 1 },
  { id: 't0:r5b:block-1', segmentId: 'route-5b', progress01: .27, lane: 1, kind: 'roadblock', severity: 1 },
  { id: 't0:r5b:branch-2', segmentId: 'route-5b', progress01: .53, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r5b:block-3', segmentId: 'route-5b', progress01: .68, lane: 1, kind: 'roadblock', severity: 2 },
  { id: 't0:r6:branch-1', segmentId: 'route-6', progress01: .24, lane: 0, kind: 'fallen-branch', severity: 1 },
  { id: 't0:r6:block-2', segmentId: 'route-6', progress01: .49, lane: 1, kind: 'roadblock', severity: 2 },
  { id: 't0:r6:branch-3', segmentId: 'route-6', progress01: .75, lane: 0, kind: 'fallen-branch', severity: 2 },
];
export const T0_ROUTE_HAZARDS: readonly TraversalRouteHazard[] = Object.freeze(
  AUTHORED_HAZARDS.map(hazard => Object.freeze(hazard)));

export function t0RouteHazards(segmentId: string): readonly TraversalRouteHazard[] {
  return T0_ROUTE_HAZARDS.filter(hazard => hazard.segmentId === segmentId);
}
