import type { LionPlayableTraversalLegId, LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { GameState } from '../game/types';
import type { TraversalOccluder } from './TraversalDepth';
import type { TraversalCheckpointSegment } from './TraversalCheckpointRoute';
import type { TraversalRoute } from './TraversalRouteModel';
import type { TraversalRouteHazard } from './TraversalRouteRisk';
import type { TraversalRoutePickup } from './TraversalRouteReward';
import type { TraversalRoutePursuitWindow } from './TraversalRoutePursuit';
import type { TraversalWorldPresentation } from './TraversalWorldModel';

/** A complete visual road input. It cannot select campaign nodes or secure loot. */
export interface TraversalRoadAuthoring<LegId extends LionPlayableTraversalLegId = LionPlayableTraversalLegId> {
  readonly legId: LegId;
  readonly routeSegments: readonly TraversalCheckpointSegment[];
  readonly resolveSegment: (index: number, selectedBranch?: string) => TraversalCheckpointSegment;
  readonly resolveRoute: (leg: LionTraversalLeg, state: GameState) => TraversalRoute<LegId>;
  readonly world: TraversalWorldPresentation;
  readonly occluders: readonly TraversalOccluder[];
  readonly foregroundLayerAsset: string;
  readonly hazards: (segmentId: string) => readonly TraversalRouteHazard[];
  readonly pickups: (segmentId: string) => readonly TraversalRoutePickup[];
  readonly pursuitWindow: (segmentId: string) => TraversalRoutePursuitWindow | undefined;
}
