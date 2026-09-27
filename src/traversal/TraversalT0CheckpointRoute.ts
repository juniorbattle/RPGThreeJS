import type { TraversalRouteSegment } from './TraversalRouteRun';

export type T0CheckpointKind = 'CANONICAL' | 'FORK' | 'BRANCH' | 'ARRIVAL';

export interface T0RouteSegment extends TraversalRouteSegment {
  readonly checkpointKind: T0CheckpointKind;
  readonly worldSectionId?: string;
  readonly railLabel: string;
}

/** T0-only authoring. Relations and RunSystem still decide which nodes are available. */
const ROUTES: readonly T0RouteSegment[] = Object.freeze([
  { id: 'route-1', durationMs: 12000, vMin: 1, vMax: 2.25,
    nextCheckpointId: 'lion-opening-ambush', checkpointKind: 'CANONICAL', worldSectionId: 'opening-ambush', railLabel: 'Embuscade' },
  { id: 'route-2', durationMs: 15000, vMin: 1, vMax: 2.35,
    nextCheckpointId: 'lion-nomad-crossroads', checkpointKind: 'CANONICAL', worldSectionId: 'nomad-waystation', railLabel: 'Cédric' },
  { id: 'route-3', durationMs: 15000, vMin: 1, vMax: 2.35,
    nextCheckpointId: 'lion-refugees', checkpointKind: 'CANONICAL', worldSectionId: 'resting-clearing', railLabel: 'Réfugiés' },
  { id: 'route-4', durationMs: 12000, vMin: 1.05, vMax: 2.45,
    nextCheckpointId: 'fork', checkpointKind: 'FORK', worldSectionId: 'forest-junction', railLabel: 'Fourche' },
  { id: 'route-5', durationMs: 15000, vMin: 1.05, vMax: 2.5,
    checkpointKind: 'BRANCH', worldSectionId: 'selected-route', railLabel: 'Épreuve' },
  { id: 'route-6', durationMs: 20000, vMin: 1.2, vMax: 2.7,
    checkpointKind: 'ARRIVAL', railLabel: 'Refuge' },
]);

export const T0_ROUTE_SEGMENTS = ROUTES;
export const T0_ROUTE_DRIVING_MS = ROUTES.reduce((sum, route) => sum + route.durationMs, 0);

export function resolveT0RouteSegment(index: number, selectedBranch?: string): T0RouteSegment {
  const route = ROUTES[index];
  if (!route) throw new Error(`No T0 route segment at ${index}.`);
  if (index !== 4) return route;
  if (selectedBranch !== 'lion-first-trial-event' && selectedBranch !== 'lion-first-trial-combat') {
    throw new Error('Route 5 requires the canonical RunSystem fork selection.');
  }
  return Object.freeze({ ...route, id: selectedBranch === 'lion-first-trial-event' ? 'route-5a' : 'route-5b',
    nextCheckpointId: selectedBranch, routeVariant: selectedBranch });
}
