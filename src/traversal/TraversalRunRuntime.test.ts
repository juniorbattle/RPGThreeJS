import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { LION_TRAVERSAL_LEGS } from '../game/LionCampaignTravelRelations';
import {
  activateTraversalStage,
  approachTraversalStage,
  beginTraversalArrival,
  beginTraversalNodeResolution,
  chooseTraversalFork,
  completeTraversalRun,
  createTraversalRunSession,
  finishTraversalNodeResolution,
  resumeTraversalRun,
  updateTraversalProgress,
} from './TraversalRunRuntime';

function leg(id: 'T0' | 'T1' | 'T2' | 'T3' | 'T4') {
  return LION_TRAVERSAL_LEGS.find((candidate) => candidate.id === id)!;
}

function resolveCurrentStage(
  session: ReturnType<typeof createTraversalRunSession>,
  currentLeg: ReturnType<typeof leg>,
  nodeId: string,
  progress: number,
) {
  const approached = approachTraversalStage(session, currentLeg, progress);
  const activated = activateTraversalStage(approached, currentLeg, [nodeId]);
  const resolving = beginTraversalNodeResolution(activated);
  return resumeTraversalRun(finishTraversalNodeResolution(resolving, currentLeg));
}

describe('TraversalRunRuntime', () => {
  it('keeps one mounted T0 session across mandatory route interruptions', () => {
    const t0 = leg('T0');
    let session = createTraversalRunSession(t0);
    session = updateTraversalProgress(session, 0.18);
    session = resolveCurrentStage(session, t0, 'lion-opening-ambush', 0.2);

    expect(session.phase).toBe('RUNNING');
    expect(session.stageIndex).toBe(1);
    expect(session.routeProgress01).toBe(0.2);
    expect(session.worldMountState).toBe('MOUNTED');
  });

  it('keeps a fork overlay inside the live Traversal world and preserves exact resume progress', () => {
    const t0 = leg('T0');
    let session = createTraversalRunSession(t0);
    session = resolveCurrentStage(session, t0, 'lion-opening-ambush', 0.16);
    session = resolveCurrentStage(session, t0, 'lion-nomad-crossroads', 0.31);
    session = resolveCurrentStage(session, t0, 'lion-refugees', 0.47);

    const state = createInitialState();
    state.run.currentNodeId = 'lion-refugees';
    state.currentNodeId = 'lion-refugees';
    const available = getAvailableRunNodes(state).map((node) => node.id);

    session = approachTraversalStage(session, t0, 0.61);
    session = activateTraversalStage(session, t0, available);
    expect(session.phase).toBe('FORK_OVERLAY');
    expect(session.worldMountState).toBe('MOUNTED');
    expect(session.worldVisibility).toBe('VISIBLE');
    expect(session.forkOptionIds).toEqual(['lion-first-trial-event', 'lion-first-trial-combat']);

    session = chooseTraversalFork(session, 'lion-first-trial-combat');
    expect(session.phase).toBe('NODE_HANDOFF');
    expect(session.activeNodeId).toBe('lion-first-trial-combat');
    expect(session.routeProgress01).toBe(0.61);

    session = beginTraversalNodeResolution(session);
    expect(session.worldMountState).toBe('MOUNTED');
    expect(session.worldVisibility).toBe('PRESERVED_BEHIND_NODE');

    session = finishTraversalNodeResolution(session, t0);
    session = resumeTraversalRun(session);
    expect(session.phase).toBe('RUNNING');
    expect(session.stageIndex).toBe(t0.stages.length);
    expect(session.routeProgress01).toBe(0.61);
    expect(session.worldMountState).toBe('MOUNTED');
  });

  it('rejects a stale fork option even if a UI callback fires', () => {
    const t0 = leg('T0');
    let session = createTraversalRunSession(t0);
    session = {
      ...session,
      phase: 'FORK_OVERLAY',
      stageIndex: 3,
      routeProgress01: 0.61,
      resumeProgress01: 0.61,
      activeStageNodeIds: ['lion-first-trial-event', 'lion-first-trial-combat'],
      forkOptionIds: ['lion-first-trial-event'],
    };
    expect(() => chooseTraversalFork(session, 'lion-first-trial-combat')).toThrow(/not currently available/);
  });

  it('supports pure travel legs with no interruptions', () => {
    const t2 = leg('T2');
    let session = createTraversalRunSession(t2);
    session = updateTraversalProgress(session, 0.93);
    session = beginTraversalArrival(session, t2, 1);
    expect(session.worldMountState).toBe('MOUNTED');
    session = completeTraversalRun(session);
    expect(session.phase).toBe('COMPLETE');
    expect(session.worldMountState).toBe('RELEASED');
  });

  it('never releases the Traversal world before destination ownership', () => {
    const t4 = leg('T4');
    let session = createTraversalRunSession(t4);
    for (const progress of [0.1, 0.45, 0.8, 1]) {
      session = updateTraversalProgress(session, progress);
      expect(session.worldMountState).toBe('MOUNTED');
    }
    session = beginTraversalArrival(session, t4);
    expect(session.worldMountState).toBe('MOUNTED');
    expect(completeTraversalRun(session).worldMountState).toBe('RELEASED');
  });
});
