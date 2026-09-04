import { describe, expect, it, vi } from 'vitest';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import type { RunNode } from '../game/types';
import { evaluateRouteCommit, isRouteCommitMode, ROUTE_COMMIT_MODES } from './RouteCommitGuard';

function availableAt(nodeId: string): RunNode[] {
  const state = createInitialState();
  state.run.currentNodeId = nodeId;
  state.currentNodeId = nodeId;
  return getAvailableRunNodes(state);
}

describe('route commit guard', () => {
  it('authorizes route commitment only from TRAVEL and JOURNEY', () => {
    expect([...ROUTE_COMMIT_MODES]).toEqual(['TRAVEL', 'JOURNEY']);
    const available = availableAt('lion-refugees');
    const nodeId = available[0]!.id;
    for (const mode of ['TRAVEL', 'JOURNEY']) {
      expect(evaluateRouteCommit({ mode, commitInFlight: false, nodeId, listAvailable: () => available }))
        .toEqual({ authorized: true, node: available[0] });
    }
    for (const mode of ['NARRATIVE', 'COMBAT', 'MANAGEMENT', 'TITLE', 'PROLOGUE', 'QA', 'RESULT', 'journey', 'travel', '']) {
      expect(evaluateRouteCommit({ mode, commitInFlight: false, nodeId, listAvailable: () => available }))
        .toEqual({ authorized: false, rejection: 'unauthorized-mode' });
    }
  });

  it('rejects a duplicate commit while one is already in flight', () => {
    const available = availableAt('lion-refugees');
    expect(evaluateRouteCommit({
      mode: 'JOURNEY', commitInFlight: true, nodeId: available[0]!.id, listAvailable: () => available,
    })).toEqual({ authorized: false, rejection: 'commit-in-flight' });
  });

  it('rejects stale, unknown and empty node references', () => {
    const available = availableAt('lion-refugees');
    for (const nodeId of ['lion-final-judgement', 'lion-camp', 'not-a-node', '']) {
      expect(evaluateRouteCommit({
        mode: 'TRAVEL', commitInFlight: false, nodeId, listAvailable: () => available,
      })).toEqual({ authorized: false, rejection: 'unavailable-node' });
    }
  });

  it('never queries RunSystem for an unauthorized or duplicated commit', () => {
    const listAvailable = vi.fn(() => availableAt('lion-refugees'));
    evaluateRouteCommit({ mode: 'NARRATIVE', commitInFlight: false, nodeId: 'x', listAvailable });
    evaluateRouteCommit({ mode: 'TRAVEL', commitInFlight: true, nodeId: 'x', listAvailable });
    evaluateRouteCommit({ mode: 'TRAVEL', commitInFlight: false, nodeId: '', listAvailable });
    expect(listAvailable).not.toHaveBeenCalled();
  });

  it('returns the authoritative node object, not a copy', () => {
    const available = availableAt('lion-refugees');
    const decision = evaluateRouteCommit({
      mode: 'JOURNEY', commitInFlight: false, nodeId: available[1]!.id, listAvailable: () => available,
    });
    expect(decision.authorized).toBe(true);
    if (decision.authorized) expect(decision.node).toBe(available[1]);
  });

  it('exposes a narrow mode predicate', () => {
    expect(isRouteCommitMode('TRAVEL')).toBe(true);
    expect(isRouteCommitMode('JOURNEY')).toBe(true);
    expect(isRouteCommitMode('RESULT')).toBe(false);
  });
});
