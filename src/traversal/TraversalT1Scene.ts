import { selectTraversalBranch } from '../game/runSystem';
import { TraversalRoadScene, type TraversalRoadSceneOptions } from './TraversalRoadScene';
import { T1_ROAD_AUTHORING } from './TraversalT1Authoring';
import type { TraversalRoute } from './TraversalRouteModel';

/** Authored T1 adapter; GameApp/RunSystem retain campaign, branch and loot authority. */
export class TraversalT1Scene extends TraversalRoadScene {
  declare route: TraversalRoute<'T1'>;
  constructor(options: TraversalRoadSceneOptions) {
    if (options.leg.id !== 'T1') throw new Error('TraversalT1Scene only accepts the canonical T1 leg.');
    super(options, T1_ROAD_AUTHORING, {
      selectBranch: nodeId => selectTraversalBranch(options.getState().run, 'T1', nodeId),
      optionalDecision: () => undefined,
    });
  }
}
