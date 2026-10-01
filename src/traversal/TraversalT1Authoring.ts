import type { TraversalRoadAuthoring } from './TraversalRoadAuthoring';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';
import { T1_ROUTE_SEGMENTS, resolveT1RouteSegment } from './TraversalT1CheckpointRoute';
import { resolveTraversalT1Route } from './TraversalT1Route';
import { TRAVERSAL_T1_WORLD_PRESENTATION } from './TraversalT1World';

/** Same bounded T0 road mechanics, mapped to T1's existing shorter stage sequence. */
const TEMPLATE_SEGMENTS: Readonly<Record<string, string>> = Object.freeze({
  't1-route-1': 'route-1', 't1-route-2': 'route-2', 't1-route-3': 'route-4',
  't1-route-4a': 'route-5a', 't1-route-4b': 'route-5b', 't1-route-5': 'route-6',
});
const id = (value: string): string => `t1:${value}`;
export const T1_ROAD_AUTHORING: TraversalRoadAuthoring<'T1'> = Object.freeze({
  ...T0_ROAD_AUTHORING, legId: 'T1', routeSegments: T1_ROUTE_SEGMENTS, resolveSegment: resolveT1RouteSegment,
  resolveRoute: resolveTraversalT1Route, world: TRAVERSAL_T1_WORLD_PRESENTATION,
  hazards: (segmentId: string) => T0_ROAD_AUTHORING.hazards(TEMPLATE_SEGMENTS[segmentId] ?? '')
    .map(hazard => Object.freeze({ ...hazard, id: id(hazard.id), segmentId })),
  pickups: (segmentId: string) => T0_ROAD_AUTHORING.pickups(TEMPLATE_SEGMENTS[segmentId] ?? '')
    .map(pickup => Object.freeze({ ...pickup, id: id(pickup.id), segmentId })),
  pursuitWindow: (segmentId: string) => {
    const window = T0_ROAD_AUTHORING.pursuitWindow(TEMPLATE_SEGMENTS[segmentId] ?? '');
    return window ? Object.freeze({ ...window, id: id(window.id), segmentId }) : undefined;
  },
});
