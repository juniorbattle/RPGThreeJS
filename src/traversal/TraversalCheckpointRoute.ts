import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { TraversalRoute, TraversalRouteBeat } from './TraversalRouteModel';
import type { TraversalRouteSegment } from './TraversalRouteRun';

export type TraversalCheckpointKind = 'CANONICAL' | 'FORK' | 'BRANCH' | 'ARRIVAL';

/** Timed road and its next visual contact; RunSystem still owns node availability. */
export interface TraversalCheckpointSegment extends TraversalRouteSegment {
  readonly checkpointKind: TraversalCheckpointKind;
  readonly worldSectionId?: string;
  readonly railLabel: string;
}

export interface TraversalRouteAuthoringIssue {
  readonly code: 'ROUTE_BOUNDARY' | 'SEGMENT_COUNT' | 'CHECKPOINT_MAPPING'
    | 'BEAT_MAPPING' | 'BEAT_PROGRESS' | 'DUPLICATE_ID' | 'MISSING_LOCATION';
  readonly subjectId: string;
  readonly detail: string;
}

/** Fail closed before a new leg is registered as an authored presentation. */
export function auditTraversalRouteAuthoring(
  leg: LionTraversalLeg,
  route: TraversalRoute,
  segments: readonly TraversalCheckpointSegment[],
  locationIds: ReadonlySet<string>,
): TraversalRouteAuthoringIssue[] {
  const issues: TraversalRouteAuthoringIssue[] = [];
  const add = (code: TraversalRouteAuthoringIssue['code'], subjectId: string, detail: string): void => {
    issues.push({ code, subjectId, detail });
  };
  if (route.legId !== leg.id || route.originNodeId !== leg.originNodeId
    || route.destinationNodeId !== leg.destinationNodeId) {
    add('ROUTE_BOUNDARY', leg.id, `${leg.id} route does not match its campaign relation.`);
  }
  if (segments.length !== leg.stages.length + 2) {
    add('SEGMENT_COUNT', leg.id, `${leg.id} needs one road per stage, a selected branch road, and an arrival road.`);
  }
  const seen = new Set<string>();
  for (const segment of segments) {
    if (seen.has(segment.id)) add('DUPLICATE_ID', segment.id, 'Route segment ID is repeated.');
    seen.add(segment.id);
    if (segment.worldSectionId && !locationIds.has(segment.worldSectionId)) {
      add('MISSING_LOCATION', segment.id, `Unknown checkpoint location ${segment.worldSectionId}.`);
    }
  }
  const beatsByNodeSet = (nodeIds: readonly string[]): TraversalRouteBeat[] => route.beats.filter(beat =>
    !beat.branchNodeId && beat.campaignNodeIds.length === nodeIds.length
      && beat.campaignNodeIds.every((id, index) => id === nodeIds[index]));
  const matchedBeatIds = new Set<string>();
  let previousProgress = 0;
  leg.stages.forEach((stage, index) => {
    const segment = segments[index];
    const kind = stage.mode === 'IN_TRAVERSAL_FORK' ? 'FORK' : 'CANONICAL';
    const checkpointId = kind === 'FORK' ? 'fork' : stage.nodeIds[0];
    if (!segment || segment.checkpointKind !== kind || segment.nextCheckpointId !== checkpointId) {
      add('CHECKPOINT_MAPPING', `${leg.id}:${index}`, `Stage ${index} needs ${kind} checkpoint ${checkpointId}.`);
    }
    const matches = beatsByNodeSet(stage.nodeIds);
    if (matches.length !== 1 || matches[0]?.type !== (kind === 'FORK' ? 'fork' : 'campaign-node')) {
      add('BEAT_MAPPING', `${leg.id}:${index}`, `Stage ${index} needs exactly one matching route beat.`);
    }
    if (matches.length === 1) matchedBeatIds.add(matches[0]!.id);
    const progress = matches[0]?.progress01;
    if (progress === undefined || !Number.isFinite(progress) || progress <= previousProgress || progress >= 1) {
      add('BEAT_PROGRESS', `${leg.id}:${index}`, `Stage ${index} has invalid or unordered road progress.`);
    } else previousProgress = progress;
  });
  const fork = leg.stages.find(stage => stage.mode === 'IN_TRAVERSAL_FORK');
  const branchSegment = segments[leg.stages.length];
  const arrivalSegment = segments[leg.stages.length + 1];
  if (!branchSegment || branchSegment.checkpointKind !== 'BRANCH' || branchSegment.nextCheckpointId) {
    add('CHECKPOINT_MAPPING', `${leg.id}:branch`, 'Selected branch road must resolve its checkpoint from the RunSystem choice.');
  }
  if (!arrivalSegment || arrivalSegment.checkpointKind !== 'ARRIVAL' || arrivalSegment.nextCheckpointId) {
    add('CHECKPOINT_MAPPING', `${leg.id}:arrival`, 'Last road must end at the destination anchor.');
  }
  for (const nodeId of fork?.nodeIds ?? []) {
    const matches = route.beats.filter(beat => beat.branchNodeId === nodeId
      && beat.campaignNodeIds.length === 1 && beat.campaignNodeIds[0] === nodeId);
    if (matches.length !== 1 || matches[0]?.progress01 === undefined
      || matches[0].progress01 <= previousProgress || matches[0].progress01 >= 1) {
      add('BEAT_MAPPING', nodeId, `Branch ${nodeId} needs one beat after its fork.`);
    }
    if (matches.length === 1) matchedBeatIds.add(matches[0]!.id);
  }
  for (const beat of route.beats) {
    if (!matchedBeatIds.has(beat.id)) add('BEAT_MAPPING', beat.id, 'Beat is not part of this campaign relation.');
    if (seen.has(beat.id)) add('DUPLICATE_ID', beat.id, 'Route beat ID is repeated.');
    seen.add(beat.id);
    if (beat.locationId && !locationIds.has(beat.locationId)) {
      add('MISSING_LOCATION', beat.id, `Unknown beat location ${beat.locationId}.`);
    }
    if (!Number.isFinite(beat.progress01) || beat.progress01 <= 0 || beat.progress01 >= 1) {
      add('BEAT_PROGRESS', beat.id, 'Beat progress must be inside the road.');
    }
  }
  return issues;
}
