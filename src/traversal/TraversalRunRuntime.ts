import type {
  LionTraversalLeg,
  LionTraversalStage,
} from '../campaign/LionCampaignTravelRelations';

export type TraversalRunPhase =
  | 'RUNNING'
  | 'DECISION'
  | 'LOCAL_INTERACTION'
  | 'APPROACHING_STAGE'
  | 'FORK_OVERLAY'
  | 'NODE_HANDOFF'
  | 'NODE_RESOLUTION'
  | 'RESUMING'
  | 'ARRIVING'
  | 'COMPLETE';

export type TraversalWorldMountState = 'MOUNTED' | 'RELEASED';
export type TraversalWorldVisibility = 'VISIBLE' | 'PRESERVED_BEHIND_NODE';
export type TraversalLane = 0 | 1;
export type TraversalLaneDirection = -1 | 1;

export interface TraversalRunSession {
  readonly legId: LionTraversalLeg['id'];
  readonly originNodeId: string;
  readonly destinationNodeId: string;
  readonly phase: TraversalRunPhase;
  readonly stageIndex: number;
  readonly routeProgress01: number;
  readonly resumeProgress01: number;
  readonly currentLane: TraversalLane;
  readonly consumedBeatIds: readonly string[];
  readonly bypassedBeatIds: readonly string[];
  readonly pendingBeatId: string | null;
  readonly worldMountState: TraversalWorldMountState;
  readonly worldVisibility: TraversalWorldVisibility;
  readonly activeStageNodeIds: readonly string[];
  readonly forkOptionIds: readonly string[];
  readonly activeNodeId: string | null;
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function stageAt(session: TraversalRunSession, leg: LionTraversalLeg): LionTraversalStage | undefined {
  return leg.stages[session.stageIndex];
}

function requireSameLeg(session: TraversalRunSession, leg: LionTraversalLeg): void {
  if (session.legId !== leg.id) {
    throw new Error('Traversal session ' + session.legId + ' cannot consume leg ' + leg.id + '.');
  }
}

export function createTraversalRunSession(
  leg: LionTraversalLeg,
  initialLane: TraversalLane = 0,
): TraversalRunSession {
  return Object.freeze({
    legId: leg.id,
    originNodeId: leg.originNodeId,
    destinationNodeId: leg.destinationNodeId,
    phase: 'RUNNING',
    stageIndex: 0,
    routeProgress01: 0,
    resumeProgress01: 0,
    currentLane: initialLane,
    consumedBeatIds: Object.freeze([]),
    bypassedBeatIds: Object.freeze([]),
    pendingBeatId: null,
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
    activeStageNodeIds: Object.freeze([]),
    forkOptionIds: Object.freeze([]),
    activeNodeId: null,
  });
}

/** A presentation hold, before any RunSystem choice is committed. */
export function pauseTraversalForDecision(session: TraversalRunSession, beatId: string): TraversalRunSession {
  if (session.phase !== 'RUNNING' || !beatId || session.consumedBeatIds.includes(beatId)) {
    throw new Error('Traversal decision requires a fresh beat in RUNNING.');
  }
  return Object.freeze({ ...session, phase: 'DECISION', pendingBeatId: beatId,
    resumeProgress01: session.routeProgress01 });
}

export function releaseTraversalDecision(session: TraversalRunSession): TraversalRunSession {
  if (!['DECISION', 'LOCAL_INTERACTION'].includes(session.phase)) throw new Error('Traversal has no pending decision.');
  return Object.freeze({ ...session, phase: 'RUNNING', pendingBeatId: null });
}

export function beginTraversalLocalInteraction(session: TraversalRunSession): TraversalRunSession {
  if (session.phase !== 'DECISION') throw new Error('Local interaction requires a pending decision.');
  return Object.freeze({ ...session, phase: 'LOCAL_INTERACTION' });
}

export function moveTraversalLane(
  session: TraversalRunSession,
  direction: TraversalLaneDirection,
): TraversalRunSession {
  if (!['RUNNING', 'APPROACHING_STAGE'].includes(session.phase)) return session;
  const currentLane = Math.max(0, Math.min(1, session.currentLane + direction)) as TraversalLane;
  if (currentLane === session.currentLane) return session;
  return Object.freeze({ ...session, currentLane });
}

export function consumeTraversalBeat(
  session: TraversalRunSession,
  beatId: string,
): TraversalRunSession {
  if (!beatId || session.consumedBeatIds.includes(beatId)) return session;
  return Object.freeze({
    ...session,
    consumedBeatIds: Object.freeze([...session.consumedBeatIds, beatId]),
  });
}

export function bypassTraversalBeat(session: TraversalRunSession, beatId: string): TraversalRunSession {
  const consumed = consumeTraversalBeat(session, beatId);
  if (consumed.bypassedBeatIds.includes(beatId)) return consumed;
  return Object.freeze({ ...consumed, bypassedBeatIds: Object.freeze([...consumed.bypassedBeatIds, beatId]) });
}

export function updateTraversalProgress(
  session: TraversalRunSession,
  routeProgress01: number,
): TraversalRunSession {
  if (!['RUNNING', 'APPROACHING_STAGE', 'RESUMING'].includes(session.phase)) {
    throw new Error('Cannot advance traversal while phase is ' + session.phase + '.');
  }
  return Object.freeze({
    ...session,
    routeProgress01: clampProgress(routeProgress01),
  });
}

export function approachTraversalStage(
  session: TraversalRunSession,
  leg: LionTraversalLeg,
  routeProgress01: number,
): TraversalRunSession {
  requireSameLeg(session, leg);
  const stage = stageAt(session, leg);
  if (!stage) throw new Error('Traversal ' + leg.id + ' has no stage at index ' + session.stageIndex + '.');
  const progress = clampProgress(routeProgress01);
  return Object.freeze({
    ...session,
    phase: 'APPROACHING_STAGE',
    routeProgress01: progress,
    resumeProgress01: progress,
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
    activeStageNodeIds: Object.freeze([...stage.nodeIds]),
    forkOptionIds: Object.freeze([]),
    activeNodeId: null,
  });
}

export function activateTraversalStage(
  session: TraversalRunSession,
  leg: LionTraversalLeg,
  availableNodeIds: readonly string[],
): TraversalRunSession {
  requireSameLeg(session, leg);
  if (session.phase !== 'APPROACHING_STAGE') {
    throw new Error('Traversal stage can only activate from APPROACHING_STAGE, got ' + session.phase + '.');
  }
  const stage = stageAt(session, leg);
  if (!stage) throw new Error('Traversal ' + leg.id + ' has no stage at index ' + session.stageIndex + '.');

  const available = stage.nodeIds.filter((nodeId) => availableNodeIds.includes(nodeId));
  if (!available.length) {
    throw new Error('RunSystem exposed no valid node for ' + leg.id + ' stage ' + session.stageIndex + '.');
  }

  if (stage.mode === 'IN_TRAVERSAL_FORK') {
    return Object.freeze({
      ...session,
      phase: 'FORK_OVERLAY',
      worldMountState: 'MOUNTED',
      worldVisibility: 'VISIBLE',
      forkOptionIds: Object.freeze([...available]),
      activeNodeId: null,
    });
  }

  if (available.length !== 1) {
    throw new Error('Mandatory traversal stage expected one available node, got ' + available.length + '.');
  }
  return Object.freeze({
    ...session,
    phase: 'NODE_HANDOFF',
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
    forkOptionIds: Object.freeze([]),
    activeNodeId: available[0]!,
  });
}

export function chooseTraversalFork(
  session: TraversalRunSession,
  nodeId: string,
): TraversalRunSession {
  if (session.phase !== 'FORK_OVERLAY') {
    throw new Error('Traversal fork choice requires FORK_OVERLAY, got ' + session.phase + '.');
  }
  if (!session.forkOptionIds.includes(nodeId)) {
    throw new Error('Traversal fork option "' + nodeId + '" is not currently available.');
  }
  return Object.freeze({
    ...session,
    phase: 'NODE_HANDOFF',
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
    activeNodeId: nodeId,
  });
}

export function beginTraversalNodeResolution(
  session: TraversalRunSession,
): TraversalRunSession {
  if (session.phase !== 'NODE_HANDOFF' || !session.activeNodeId) {
    throw new Error('Traversal node resolution requires a selected/mandatory node handoff.');
  }
  return Object.freeze({
    ...session,
    phase: 'NODE_RESOLUTION',
    worldMountState: 'MOUNTED',
    worldVisibility: 'PRESERVED_BEHIND_NODE',
  });
}

export function finishTraversalNodeResolution(
  session: TraversalRunSession,
  leg: LionTraversalLeg,
): TraversalRunSession {
  requireSameLeg(session, leg);
  if (session.phase !== 'NODE_RESOLUTION') {
    throw new Error('Traversal node can only finish from NODE_RESOLUTION, got ' + session.phase + '.');
  }
  const consumedBeatIds = session.activeNodeId && !session.consumedBeatIds.includes(session.activeNodeId)
    ? Object.freeze([...session.consumedBeatIds, session.activeNodeId])
    : session.consumedBeatIds;
  return Object.freeze({
    ...session,
    phase: 'RESUMING',
    stageIndex: session.stageIndex + 1,
    routeProgress01: session.resumeProgress01,
    consumedBeatIds,
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
    activeStageNodeIds: Object.freeze([]),
    forkOptionIds: Object.freeze([]),
    activeNodeId: null,
  });
}

export function resumeTraversalRun(
  session: TraversalRunSession,
): TraversalRunSession {
  if (session.phase !== 'RESUMING') {
    throw new Error('Traversal can only resume from RESUMING, got ' + session.phase + '.');
  }
  return Object.freeze({
    ...session,
    phase: 'RUNNING',
    routeProgress01: session.resumeProgress01,
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
  });
}

export function beginTraversalArrival(
  session: TraversalRunSession,
  leg: LionTraversalLeg,
  routeProgress01 = 1,
): TraversalRunSession {
  requireSameLeg(session, leg);
  if (session.stageIndex < leg.stages.length) {
    throw new Error('Traversal ' + leg.id + ' still has unresolved route stages.');
  }
  if (!['RUNNING', 'RESUMING'].includes(session.phase)) {
    throw new Error('Traversal arrival cannot start from ' + session.phase + '.');
  }
  return Object.freeze({
    ...session,
    phase: 'ARRIVING',
    routeProgress01: clampProgress(routeProgress01),
    resumeProgress01: clampProgress(routeProgress01),
    worldMountState: 'MOUNTED',
    worldVisibility: 'VISIBLE',
  });
}

export function completeTraversalRun(
  session: TraversalRunSession,
): TraversalRunSession {
  if (session.phase !== 'ARRIVING') {
    throw new Error('Traversal can only complete from ARRIVING, got ' + session.phase + '.');
  }
  return Object.freeze({
    ...session,
    phase: 'COMPLETE',
    routeProgress01: 1,
    resumeProgress01: 1,
    worldMountState: 'RELEASED',
    worldVisibility: 'VISIBLE',
  });
}
