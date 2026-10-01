import type { TraversalCheckpointSegment } from './TraversalCheckpointRoute';

/** Existing T3 interrupts/fork followed by the Shadow Ruins destination boundary. */
export const T3_ROUTE_SEGMENTS: readonly TraversalCheckpointSegment[] = Object.freeze(([
  { id: 't3-route-1', durationMs: 12000, vMin: 1, vMax: 2.25, checkpointKind: 'CANONICAL',
    nextCheckpointId: 'lion-lancer-recruit', worldSectionId: 'lancer-halt', railLabel: 'Lancier' },
  { id: 't3-route-2', durationMs: 15000, vMin: 1, vMax: 2.35, checkpointKind: 'CANONICAL',
    nextCheckpointId: 'lion-witnesses', worldSectionId: 'witness-road', railLabel: 'Ruines' },
  { id: 't3-route-3', durationMs: 12000, vMin: 1.05, vMax: 2.45, checkpointKind: 'FORK',
    nextCheckpointId: 'fork', worldSectionId: 't3-junction', railLabel: 'Fourche' },
  { id: 't3-route-4', durationMs: 15000, vMin: 1.05, vMax: 2.5, checkpointKind: 'BRANCH',
    worldSectionId: 't3-selected-route', railLabel: 'Passage' },
  { id: 't3-route-5', durationMs: 20000, vMin: 1.2, vMax: 2.7, checkpointKind: 'ARRIVAL', railLabel: 'Ruines' },
] satisfies TraversalCheckpointSegment[]).map(segment => Object.freeze(segment)));

export function resolveT3RouteSegment(index: number, selectedBranch?: string): TraversalCheckpointSegment {
  const segment = T3_ROUTE_SEGMENTS[index];
  if (!segment) throw new Error(`No T3 route segment at ${index}.`);
  if (segment.checkpointKind !== 'BRANCH') return segment;
  if (selectedBranch !== 'lion-final-trial-event' && selectedBranch !== 'lion-final-trial-combat') {
    throw new Error('T3 branch road requires the canonical RunSystem fork selection.');
  }
  return Object.freeze({ ...segment, id: selectedBranch === 'lion-final-trial-event' ? 't3-route-4a' : 't3-route-4b',
    nextCheckpointId: selectedBranch, routeVariant: selectedBranch });
}
