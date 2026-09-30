import type { TraversalRoutePickup } from './TraversalRouteReward';

/** Production T0 pickups. Each branch offers the same nine-pickup path value. */
const AUTHORED_PICKUPS: TraversalRoutePickup[] = [
  { id: 't0:r1:reward-1', segmentId: 'route-1', progress01: .65, lane: 1, gold: 5 },
  { id: 't0:r2:reward-1', segmentId: 'route-2', progress01: .22, lane: 0, gold: 5 },
  { id: 't0:r3:reward-1', segmentId: 'route-3', progress01: .18, lane: 1, gold: 5 },
  { id: 't0:r3:reward-2', segmentId: 'route-3', progress01: .50, lane: 0, gold: 5 },
  { id: 't0:r4:reward-1', segmentId: 'route-4', progress01: .18, lane: 0, gold: 5 },
  { id: 't0:r4:reward-2', segmentId: 'route-4', progress01: .50, lane: 1, gold: 5 },
  { id: 't0:r5a:reward-1', segmentId: 'route-5a', progress01: .18, lane: 1, gold: 5 },
  { id: 't0:r5a:reward-2', segmentId: 'route-5a', progress01: .48, lane: 0, gold: 5 },
  { id: 't0:r5b:reward-1', segmentId: 'route-5b', progress01: .15, lane: 0, gold: 5 },
  { id: 't0:r5b:reward-2', segmentId: 'route-5b', progress01: .82, lane: 0, gold: 5 },
  { id: 't0:r6:reward-1', segmentId: 'route-6', progress01: .88, lane: 1, gold: 5 },
];
export const T0_ROUTE_PICKUPS: readonly TraversalRoutePickup[] = Object.freeze(
  AUTHORED_PICKUPS.map(pickup => Object.freeze(pickup)));

export function t0RoutePickups(segmentId: string): readonly TraversalRoutePickup[] {
  return T0_ROUTE_PICKUPS.filter(pickup => pickup.segmentId === segmentId);
}
