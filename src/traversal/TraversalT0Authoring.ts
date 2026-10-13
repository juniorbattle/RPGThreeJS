import type { TraversalRoadAuthoring } from './TraversalRoadAuthoring';
import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { GameState } from '../game/types';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import { T0_ROUTE_SEGMENTS, resolveT0RouteSegment } from './TraversalT0CheckpointRoute';
import { TRAVERSAL_OCCLUDERS } from './TraversalT0Foreground';
import { resolveTraversalT0Route } from './TraversalT0Route';
import { t0RouteHazards } from './TraversalT0Risk';
import { t0RoutePickups } from './TraversalT0Reward';
import { t0RoutePursuitWindow } from './TraversalT0Pursuit';
import { TRAVERSAL_T0_WORLD_PRESENTATION } from './TraversalT0World';

/** T0 remains the sole production authoring package until other legs have art and QA. */
export const T0_ROAD_AUTHORING: TraversalRoadAuthoring<'T0'> = Object.freeze({
  legId: 'T0',
  routeSegments: T0_ROUTE_SEGMENTS,
  resolveSegment: resolveT0RouteSegment,
  resolveRoute: (leg: LionTraversalLeg, state: GameState) => resolveTraversalT0Route(leg, state.run.graph.nodes,
    state.clan.members.map(member => member.definitionId), state.run.seed),
  world: TRAVERSAL_T0_WORLD_PRESENTATION,
  occluders: TRAVERSAL_OCCLUDERS,
  foregroundLayerAsset: TRAVERSAL_T0_ASSETS.foregroundLayer,
  hazards: t0RouteHazards,
  pickups: t0RoutePickups,
  pursuitWindow: t0RoutePursuitWindow,
});
