/**
 * Set 1.20.0 (TRAVERSAL "Post-demo plateaux"), post-demo Lot 1: the topology every plateau gives RunSystem.
 *
 * Each plateau follows the Lion's template (P4): three POI regions, refuges, exclusive forks with branch commitment,
 * optional chests and encounters, challenges and stationary guardians. RunSystem applies one set of navigation rules
 * (connected movement, activation, once-only resolution, travel to resolved POIs, branch commitment, guardian posts and
 * waves) to whichever topology the current run belongs to. The Lion's topology is built from its existing tables, so
 * the Lion keeps the exact rules it had. Data only: nothing here imports RunSystem.
 */
import type { GameState, RunNodeType } from '../../game/types';
import type { EliteDefinition, FixedPoiDefinition } from '../LionPoiAuthoring';
import type { LionTraversalStage } from '../LionCampaignTravelRelations';

/** A stretch of the route holding its encounters and, at most, one exclusive fork (the Lion's T0, T1 and T3). */
export interface PlateauLeg {
  readonly id: string;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
  readonly stages: readonly LionTraversalStage[];
}

export interface PlateauPoiMetadata {
  region: 0 | 1 | 2;
  role: 'primary' | 'structuring' | 'secondary';
  participation: 'required' | 'optional' | 'alternative';
}

/** One canonical node of an authored route. */
export interface PlateauRouteNode {
  id: string;
  type: RunNodeType;
  depth: number;
  lane: number;
  contentId: string;
  label: string;
  icon: string;
  links: string[];
  risk: number;
  reward: number;
  difficulty: 'safe' | 'standard' | 'dangerous' | 'decisive';
  moralTone: 'honour' | 'pragmatic' | 'greed' | 'mystery' | 'neutral';
  hint: string;
}

export interface PlateauTopology {
  plateauId: string;
  startNodeId: string;
  /** The canonical route of a post-demo plateau. The Lion builds its own graph, with its adaptive variants. */
  route?: readonly PlateauRouteNode[];
  legs: readonly PlateauLeg[];
  /** Local edges that open once their prerequisites are resolved (the Lion's opening routes). */
  localRoutes: readonly { from: string; to: string }[];
  localRoutesRequire: readonly string[];
  /** A fork whose follower opens only once one of its branches is resolved; its branches are never bypassed. */
  gatedTrial?: { nodeIds: readonly string[]; gatedNodeId: string; bypassOnDirectRouteNodeId?: string };
  metadata: Readonly<Record<string, PlateauPoiMetadata>>;
  optionalPois: readonly FixedPoiDefinition[];
  guardians: readonly EliteDefinition[];
  /** Set 1.18.0: each guardian's post, an optional chest. */
  guardPosts: Readonly<Record<string, string>>;
  finalRefugeNodeId: string;
  /** Set 1.15.0 services at a final refuge of `story` type; absent when the final refuge is an ordinary refuge. */
  finalRefugeServicesAvailable?: (state: Readonly<GameState>) => boolean;
}

/** Geography edges of a topology's optional POIs. */
export function optionalPoiEdges(topology: PlateauTopology): { from: string; to: string }[] {
  return topology.optionalPois.flatMap((poi) => poi.edges.map((to) => ({ from: poi.id, to })));
}
