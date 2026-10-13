import type { LionPlayableTraversalLegId } from '../campaign/LionCampaignTravelRelations';
import type { TraversalLane } from './TraversalRunRuntime';
import { beatPassedProgress } from './TraversalRoadSpace';

/** Presentation data for an authored road; campaign and RunSystem own its nodes. */
export interface TraversalRoute<LegId extends LionPlayableTraversalLegId = LionPlayableTraversalLegId> {
  readonly legId: LegId;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly distanceKm: number;
  readonly beats: readonly TraversalRouteBeat[];
}

export type TraversalBeatType = 'campaign-node' | 'fork';
export type TraversalBeatPlacement = 'LANE' | 'CENTERED';
export type TraversalContentCategory = 'MANDATORY_EVENT' | 'OPTIONAL_EVENT' | 'OPTIONAL_COMBAT'
  | 'ROUTE_CHOICE';
export type TraversalInteractionPolicy = 'OPTIONAL_CONFIRM' | 'MANDATORY_CONFIRM';
export type TraversalBeatCrossing = 'NONE' | 'TRIGGERED' | 'BYPASSED';

export interface TraversalRouteBeat {
  readonly id: string;
  readonly type: TraversalBeatType;
  readonly category: TraversalContentCategory;
  readonly engagement: 'LANE' | 'ROUTE';
  readonly progress01: number;
  readonly lane: TraversalLane | null;
  readonly placement: TraversalBeatPlacement;
  readonly label: string;
  readonly marker: 'danger' | 'speech' | 'fork';
  readonly interactionPolicy: TraversalInteractionPolicy;
  readonly campaignNodeIds: readonly string[];
  readonly characterId?: string;
  readonly visualAsset?: string;
  /** References independent presentation geography, never owns its rendering. */
  readonly locationId?: string;
  readonly mirrorX?: boolean;
  /** Conditional encounter on a road selected by RunSystem, not a second branch authority. */
  readonly branchNodeId?: string;
  readonly formation?: readonly string[];
}

/** Map the authored stage roads, selected-branch road, and arrival road onto campaign progress. */
export function traversalRouteProgressBounds(route: TraversalRoute, segmentIndex: number): {
  readonly start: number;
  readonly end: number;
} {
  const stages = route.beats.filter(beat => !beat.branchNodeId);
  const branches = route.beats.filter(beat => beat.branchNodeId);
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex > stages.length + 1
    || !branches.length || branches.some(beat => beat.progress01 !== branches[0]!.progress01)) {
    throw new Error(`Invalid authored road progress for ${route.legId} segment ${segmentIndex}.`);
  }
  const branchProgress = branches[0]!.progress01;
  const start = segmentIndex === 0 ? 0
    : segmentIndex <= stages.length ? stages[segmentIndex - 1]!.progress01 : branchProgress;
  const end = segmentIndex < stages.length ? stages[segmentIndex]!.progress01
    : segmentIndex === stages.length ? branchProgress : 1;
  if (!(start < end)) throw new Error(`Unordered authored road progress for ${route.legId} segment ${segmentIndex}.`);
  return { start, end };
}

/** Canonical situations meet their authored checkpoint at the same route progress. */
export function traversalContactProgress(beat: TraversalRouteBeat): number {
  return beat.progress01;
}

/** Physical engagement and optional narrative refusal are separate concerns. */
export function resolveTraversalBeatCrossing(
  beat: TraversalRouteBeat,
  previousProgress01: number,
  nextProgress01: number,
  lane: TraversalLane,
): TraversalBeatCrossing {
  if (nextProgress01 <= previousProgress01) return 'NONE';
  const contact = traversalContactProgress(beat);
  if (previousProgress01 < contact && nextProgress01 >= contact) {
    if (beat.engagement === 'ROUTE' || beat.lane === lane) return 'TRIGGERED';
  }
  const passed = beatPassedProgress(beat.progress01);
  return beat.interactionPolicy === 'OPTIONAL_CONFIRM' && previousProgress01 < passed && nextProgress01 >= passed
    ? 'BYPASSED' : 'NONE';
}
