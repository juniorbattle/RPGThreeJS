import { describe, expect, it } from 'vitest';
import { bypassTraversalNode, createRunState, enterRunNode, failRunToCheckpoint, getAvailableRunNodes, selectTraversalBranch } from './runSystem';
import { createInitialState } from './store';
import { runStateSchema } from './types';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';

function afterAmbush() {
  const run = createRunState(42);
  run.currentNodeId = 'lion-opening-ambush';
  return run;
}

describe('T0 canonical route participation', () => {
  it('clears downstream route choices when returning to an earlier checkpoint', () => {
    const state = createInitialState();
    state.run = afterAmbush();
    state.run.checkpointNodeId = 'lion-audience';
    enterRunNode(state.run, 'lion-nomad-crossroads');
    bypassTraversalNode(state.run, 'T0', 'lion-refugees');
    selectTraversalBranch(state.run, 'T0', 'lion-first-trial-event');
    failRunToCheckpoint(state);
    expect(state.run.bypassedRouteNodeIds).toEqual([]);
    expect(state.run.traversalBranches).toEqual({});
    expect(getAvailableRunNodes(state.run).map(node => node.id)).toEqual(['lion-opening-ambush']);
  });
  it('bypasses optional encounters without visits, rewards, or fake node entry', () => {
    const run = afterAmbush();
    enterRunNode(run, 'lion-nomad-crossroads');
    const original = structuredClone(run);
    expect(bypassTraversalNode(run, 'T0', 'lion-nomad-crossroads')).toBe(false);
    expect(getAvailableRunNodes(run).map(node => node.id)).toEqual(['lion-refugees']);
    expect(bypassTraversalNode(run, 'T0', 'lion-refugees')).toBe(true);
    expect(getAvailableRunNodes(run).map(node => node.id)).toEqual(['lion-first-trial-event', 'lion-first-trial-combat']);
    expect(run.currentNodeId).toBe(original.currentNodeId);
    expect(run.visitedNodeIds).toEqual(original.visitedNodeIds);
    expect(run.temporaryLoot).toEqual(original.temporaryLoot);
    expect(run.graph).toEqual(original.graph);
  });

  it.each(['lion-first-trial-event', 'lion-first-trial-combat'])('records %s without entering it and requires its consequence before arrival', selected => {
    const run = afterAmbush();
    enterRunNode(run, 'lion-nomad-crossroads');
    bypassTraversalNode(run, 'T0', 'lion-refugees');
    const visited = [...run.visitedNodeIds];
    expect(selectTraversalBranch(run, 'T0', selected)).toBe(true);
    expect(run.currentNodeId).toBe('lion-nomad-crossroads');
    expect(run.visitedNodeIds).toEqual(visited);
    expect(getAvailableRunNodes(run).map(node => node.id)).toEqual([selected]);
    expect(selectTraversalBranch(run, 'T0', selected)).toBe(false);
    const bypassed = structuredClone(run);
    expect(bypassTraversalNode(bypassed, 'T0', selected)).toBe(selected === 'lion-first-trial-event');
    if (selected === 'lion-first-trial-event') expect(getAvailableRunNodes(bypassed).map(node => node.id)).toEqual(['lion-first-refuge']);
    expect(enterRunNode(run, 'lion-first-refuge')).toBeNull();
    expect(enterRunNode(run, selected)?.id).toBe(selected);
    expect(getAvailableRunNodes(run).map(node => node.id)).toEqual(['lion-first-refuge']);
    expect(enterRunNode(run, 'lion-first-refuge')?.id).toBe('lion-first-refuge');
    expect(run.visitedNodeIds).toContain(selected);
    expect(run.traversalBranches?.T0).toBe(selected);
  });

  it('enters the chosen event only on the later canonical commit', () => {
    const run = afterAmbush();
    enterRunNode(run, 'lion-nomad-crossroads');
    enterRunNode(run, 'lion-refugees');
    expect(selectTraversalBranch(run, 'T0', 'lion-first-trial-event')).toBe(true);
    expect(enterRunNode(run, 'lion-first-trial-combat')).toBeNull();
    expect(enterRunNode(run, 'lion-first-trial-event')?.id).toBe('lion-first-trial-event');
    expect(getAvailableRunNodes(run).map(node => node.id)).toEqual(['lion-first-refuge']);
  });

  it('refuses unavailable nodes and mandatory interruptions', () => {
    const run = afterAmbush();
    const snapshot = structuredClone(run);
    expect(bypassTraversalNode(run, 'T0', 'lion-refugees')).toBe(false);
    expect(selectTraversalBranch(run, 'T0', 'lion-first-trial-event')).toBe(false);
    expect(bypassTraversalNode(run, 'T1', 'lion-reserve-trail')).toBe(false);
    expect(run).toEqual(snapshot);
    run.currentNodeId = 'lion-audience';
    expect(bypassTraversalNode(run, 'T0', 'lion-opening-ambush')).toBe(false);
  });

  it('loads old saves and round-trips selected-but-unentered road choices', () => {
    const run = afterAmbush();
    expect(runStateSchema.parse(run)).toEqual(run);
    enterRunNode(run, 'lion-nomad-crossroads');
    bypassTraversalNode(run, 'T0', 'lion-refugees');
    selectTraversalBranch(run, 'T0', 'lion-first-trial-event');
    const loaded = runStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(getAvailableRunNodes(loaded).map(node => node.id)).toEqual(['lion-first-trial-event']);
    expect(loaded.currentNodeId).toBe('lion-nomad-crossroads');
  });

  it('preserves an already bypassed branch in a legacy save without replaying its outcome', () => {
    const run = afterAmbush();
    run.traversalBranches = { T0: 'lion-first-trial-event' };
    run.bypassedRouteNodeIds = ['lion-nomad-crossroads', 'lion-refugees', 'lion-first-trial-event'];
    const loaded = runStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(getAvailableRunNodes(loaded).map(node => node.id)).toEqual(['lion-first-refuge']);
    expect(loaded.visitedNodeIds).not.toContain('lion-first-trial-event');
  });
});

describe('shared authored road choice authority', () => {
  it.each(['T1', 'T3'] as const)('keeps %s selection downstream of availability, save-compatible, and separate from entry', legId => {
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === legId)!;
    const fork = leg.stages.at(-1)!;
    for (const selected of fork.nodeIds) {
      const run = createRunState(42);
      run.currentNodeId = leg.originNodeId;
      const untouched = structuredClone(run);
      expect(selectTraversalBranch(run, legId, selected)).toBe(false);
      expect(run).toEqual(untouched);
      run.currentNodeId = leg.stages.at(-2)!.nodeIds[0]!;
      const before = structuredClone(run);
      expect(selectTraversalBranch(run, legId, selected)).toBe(true);
      expect(run.currentNodeId).toBe(before.currentNodeId);
      expect(run.visitedNodeIds).toEqual(before.visitedNodeIds);
      expect(run.temporaryLoot).toEqual(before.temporaryLoot);
      expect(run.graph).toEqual(before.graph);
      expect(selectTraversalBranch(run, legId, selected)).toBe(false);
      expect(bypassTraversalNode(run, legId, selected)).toBe(false);
      const loaded = runStateSchema.parse(JSON.parse(JSON.stringify(run)));
      expect(getAvailableRunNodes(loaded).map(node => node.id)).toEqual([selected]);
      const unselected = fork.nodeIds.find(id => id !== selected)!;
      expect(enterRunNode(loaded, unselected)).toBeNull();
      expect(enterRunNode(loaded, leg.destinationNodeId)).toBeNull();
      expect(enterRunNode(loaded, selected)?.id).toBe(selected);
      expect(getAvailableRunNodes(loaded).map(node => node.id)).toEqual([leg.destinationNodeId]);
    }
  });

  it('rejects retired and unknown road IDs without mutation', () => {
    const run = afterAmbush();
    const before = structuredClone(run);
    for (const legId of ['T2', 'T4', 'unknown']) {
      expect(selectTraversalBranch(run, legId, 'lion-first-trial-event')).toBe(false);
      expect(bypassTraversalNode(run, legId, 'lion-refugees')).toBe(false);
    }
    expect(run).toEqual(before);
  });
});
