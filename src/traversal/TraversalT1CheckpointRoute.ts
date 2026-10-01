import type { TraversalCheckpointSegment } from './TraversalCheckpointRoute';

/** Existing T1 interrupts/fork followed by the Bois-Clair destination boundary. */
export const T1_ROUTE_SEGMENTS: readonly TraversalCheckpointSegment[] = Object.freeze(([
  { id: 't1-route-1', durationMs: 12000, vMin: 1, vMax: 2.25, checkpointKind: 'CANONICAL',
    nextCheckpointId: 'lion-reserve-trail', worldSectionId: 'reserve-halt', railLabel: 'Réserves' },
  { id: 't1-route-2', durationMs: 15000, vMin: 1, vMax: 2.35, checkpointKind: 'CANONICAL',
    nextCheckpointId: 'lion-valmir-road', worldSectionId: 'valmir-road', railLabel: 'Bois-Clair' },
  { id: 't1-route-3', durationMs: 12000, vMin: 1.05, vMax: 2.45, checkpointKind: 'FORK',
    nextCheckpointId: 'fork', worldSectionId: 't1-junction', railLabel: 'Fourche' },
  { id: 't1-route-4', durationMs: 15000, vMin: 1.05, vMax: 2.5, checkpointKind: 'BRANCH',
    worldSectionId: 't1-selected-route', railLabel: 'Passage' },
  { id: 't1-route-5', durationMs: 20000, vMin: 1.2, vMax: 2.7, checkpointKind: 'ARRIVAL', railLabel: 'Bois-Clair' },
] satisfies TraversalCheckpointSegment[]).map(segment => Object.freeze(segment)));

export function resolveT1RouteSegment(index: number, selectedBranch?: string): TraversalCheckpointSegment {
  const segment = T1_ROUTE_SEGMENTS[index];
  if (!segment) throw new Error(`No T1 route segment at ${index}.`);
  if (segment.checkpointKind !== 'BRANCH') return segment;
  if (selectedBranch !== 'lion-second-trial-event' && selectedBranch !== 'lion-second-trial-combat') {
    throw new Error('T1 branch road requires the canonical RunSystem fork selection.');
  }
  return Object.freeze({ ...segment, id: selectedBranch === 'lion-second-trial-event' ? 't1-route-4a' : 't1-route-4b',
    nextCheckpointId: selectedBranch, routeVariant: selectedBranch });
}
