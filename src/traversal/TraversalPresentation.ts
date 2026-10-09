import type { LionPlayableTraversalLegId, LionTraversalLegId } from '../campaign/LionCampaignTravelRelations';
import type { TraversalRunSession } from './TraversalRunRuntime';
import type { TraversalRouteBeat } from './TraversalRouteModel';
import { TraversalT0Scene } from './TraversalT0Scene';
import { TraversalT1Scene } from './TraversalT1Scene';
import { TraversalT3Scene } from './TraversalT3Scene';
import type { TraversalRoadSceneOptions } from './TraversalRoadScene';

/** The campaign boundary uses this surface without owning any road-specific presentation. */
export interface TraversalPresentationScene {
  readonly route: {
    readonly destinationNodeId: string;
    readonly beats: readonly TraversalRouteBeat[];
  };
  readonly session: TraversalRunSession;
  readonly activeNodeId: string | null;
  open(): void;
  canResumeNode(nodeId: string): boolean;
  beginNodeResolution(nodeId: string): void;
  resumeNode(nodeId: string): void;
  resumeRoadCombat(windowId: string): boolean;
  completeArrival(): void;
  dispose(): void;
}

type TraversalPresentationFactory = (options: TraversalRoadSceneOptions) => TraversalPresentationScene;

// Register a leg only after its complete scene, authored world, transitions and QA exist.
// A campaign relation or rollout flag alone cannot cause a T0 world to present another leg.
const PRESENTATIONS: Partial<Record<LionPlayableTraversalLegId, TraversalPresentationFactory>> = {
  T0: (options) => new TraversalT0Scene(options),
  T1: (options) => new TraversalT1Scene(options),
  T3: (options) => new TraversalT3Scene(options),
};

export function hasAuthoredTraversalPresentation(legId: LionTraversalLegId): boolean {
  return Object.hasOwn(PRESENTATIONS, legId);
}

export function createTraversalPresentation(options: TraversalRoadSceneOptions): TraversalPresentationScene {
  const factory = PRESENTATIONS[options.leg.id];
  if (!factory) throw new Error(`Traversal presentation is not authored for ${options.leg.id}.`);
  return factory(options);
}
