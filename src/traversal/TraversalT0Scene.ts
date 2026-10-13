import { selectTraversalBranch } from '../game/runSystem';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';
import { TraversalRoadScene, type TraversalRoadSceneOptions } from './TraversalRoadScene';
import type { TraversalT0Route } from './TraversalT0Route';

/** Compatibility surface for the only approved production road. */
export type TraversalT0SceneOptions = TraversalRoadSceneOptions;

export class TraversalT0Scene extends TraversalRoadScene {
  declare route: TraversalT0Route;

  constructor(options: TraversalT0SceneOptions) {
    if (options.leg.id !== 'T0') throw new Error('TraversalT0Scene only accepts the canonical T0 leg.');
    super(options, T0_ROAD_AUTHORING, {
      selectBranch: nodeId => selectTraversalBranch(options.getState().run, options.leg.id, nodeId),
      optionalDecision: beat => beat.campaignNodeIds.includes('lion-refugees') ? {
        confirmLabel: 'Aider',
        skipLabel: 'Passer',
        hint: 'Une mère et son enfant cherchent de l’aide sur la route.',
      } : undefined,
    });
  }
}
