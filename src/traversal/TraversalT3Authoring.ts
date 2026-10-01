import type { TraversalRoadAuthoring } from './TraversalRoadAuthoring';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';
import { T3_ROUTE_SEGMENTS, resolveT3RouteSegment } from './TraversalT3CheckpointRoute';
import { resolveTraversalT3Route } from './TraversalT3Route';
import { createTraversalT3WorldPresentation } from './TraversalT3World';
import type { GameState } from '../game/types';

/** Same bounded T0 road mechanics, mapped to T3's existing shorter stage sequence. */
const TEMPLATE_SEGMENTS: Readonly<Record<string, string>> = Object.freeze({
  't3-route-1': 'route-1', 't3-route-2': 'route-2', 't3-route-3': 'route-4',
  't3-route-4a': 'route-5a', 't3-route-4b': 'route-5b', 't3-route-5': 'route-6',
});
const id = (value: string): string => `t3:${value}`;
export function createT3RoadAuthoring(getState: () => GameState): TraversalRoadAuthoring<'T3'> {
  return Object.freeze({
    ...T0_ROAD_AUTHORING, legId: 'T3', routeSegments: T3_ROUTE_SEGMENTS, resolveSegment: resolveT3RouteSegment,
    resolveRoute: resolveTraversalT3Route, world: createTraversalT3WorldPresentation(getState),
    hazards: (segmentId: string) => T0_ROAD_AUTHORING.hazards(TEMPLATE_SEGMENTS[segmentId] ?? '')
      .map(hazard => Object.freeze({ ...hazard, id: id(hazard.id), segmentId })),
    pickups: (segmentId: string) => T0_ROAD_AUTHORING.pickups(TEMPLATE_SEGMENTS[segmentId] ?? '')
      .map(pickup => Object.freeze({ ...pickup, id: id(pickup.id), segmentId })),
    pursuitWindow: (segmentId: string) => {
      const window = T0_ROAD_AUTHORING.pursuitWindow(TEMPLATE_SEGMENTS[segmentId] ?? '');
      return window ? Object.freeze({ ...window, id: id(window.id), segmentId }) : undefined;
    },
  });
}
