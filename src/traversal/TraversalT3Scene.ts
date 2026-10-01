import { selectTraversalBranch } from '../game/runSystem';
import { TraversalRoadScene, type TraversalRoadSceneOptions } from './TraversalRoadScene';
import { createT3RoadAuthoring } from './TraversalT3Authoring';
import type { TraversalRoute } from './TraversalRouteModel';

/** Authored T3 adapter; GameApp/RunSystem retain campaign, branch and loot authority. */
export class TraversalT3Scene extends TraversalRoadScene {
  declare route: TraversalRoute<'T3'>;
  constructor(options: TraversalRoadSceneOptions) {
    if (options.leg.id !== 'T3') throw new Error('TraversalT3Scene only accepts the canonical T3 leg.');
    super(options, createT3RoadAuthoring(options.getState), {
      selectBranch: nodeId => selectTraversalBranch(options.getState().run, 'T3', nodeId),
      optionalDecision: () => undefined,
    });
  }
}
