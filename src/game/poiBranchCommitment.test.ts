// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, SaveRepository } from './store';
import { activePoiBranchCommitment, bypassPoi, enterPoi as enterOwnerPoi, getAvailableRunNodes, runNodesAllowedByCommitment, selectPoiMap, settlePoiNavigation, travelToResolvedPoi } from './runSystem';
import * as expedition from './poiExpedition';
import { retreatPoiElite } from './poiExpedition';
import { LOT_E_ELITES } from '../campaign/LionPoiAuthoring';
import type { GameState } from './types';
import { calibrateLionAmount } from './lionReputationCalibration';

afterEach(() => localStorage.clear());

/** Set 1.17.0 (OD-2026-11-07-C). Pure authority fixtures mark content resolved; they are not played combat evidence. */
function enterPoi(state: GameState, id: string) { settlePoiNavigation(state); return enterOwnerPoi(state, id); }

/** Every step on the shortest graph path to \`target\` resolved and visited, as a company that walked there. */
function walkTo(target: string): GameState {
  const state = createInitialState();
  state.flags.lionMissionAccepted = true;
  const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
  const previous = new Map<string, string | null>([[state.run.currentNodeId, null]]);
  const queue = [state.run.currentNodeId];
  while (queue.length && !previous.has(target)) {
    const current = queue.shift()!;
    for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
  }
  const path: string[] = [];
  for (let id: string | null | undefined = target; id; id = previous.get(id)) path.unshift(id);
  for (const id of path) {
    if (!state.resolvedNodeIds.includes(id)) state.resolvedNodeIds.push(id);
    if (!state.run.visitedNodeIds.includes(id)) state.run.visitedNodeIds.push(id);
  }
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.run.currentNodeId = state.currentNodeId = target;
  return state;
}
const movable = (state: GameState) => selectPoiMap(state).nodes.filter(n => n.canMove).map(n => n.id).sort();

describe('branch commitment (set 1.17.0)', () => {
  it('commits on arrival at the chosen branch, opens only the next step, and releases on the chapter resolution', () => {
    const state = walkTo('lion-valmir-road');
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(movable(state).length).toBeGreaterThan(2);
    expect(enterPoi(state, 'lion-second-trial-event')?.activate).toBe(true);
    // Arrival records the branch: the company is committed to it until the village choice is resolved.
    expect(activePoiBranchCommitment(state)).toEqual({ forkNodeId: 'lion-second-trial-event',
      resolvingNodeId: 'lion-village-choice', targetNodeId: 'lion-second-trial-event' });
    const onBranch = selectPoiMap(state);
    expect(onBranch.commitment?.targetNodeId).toBe('lion-second-trial-event');
    expect(onBranch.nodes.filter(n => n.canMove)).toEqual([]);
    expect(onBranch.nodes.find(n => n.id === 'lion-second-trial-event')!.canActivate).toBe(true);
    expect(enterPoi(state, 'lion-valmir-road')).toBeNull();
    expect(enterPoi(state, 'lion-second-trial-event')?.activate).toBe(true);
    state.resolvedNodeIds.push('lion-second-trial-event');
    // Branch resolved: the village choice is the only step; travel and bypass wait.
    expect(activePoiBranchCommitment(state)?.targetNodeId).toBe('lion-village-choice');
    expect(movable(state)).toEqual(['lion-village-choice']);
    const map = selectPoiMap(state);
    expect(map.nodes.some(n => n.canTravel || n.canBypass)).toBe(false);
    expect(travelToResolvedPoi(state, 'lion-first-refuge')).toBeNull();
    expect(enterPoi(state, 'lion-poi-valley-supplies')).toBeNull();
    expect(enterPoi(state, 'lion-village-choice')?.activate).toBe(true);
    state.resolvedNodeIds.push('lion-village-choice');
    // Resolved: every other rule applies again.
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(selectPoiMap(state).commitment).toBeNull();
    expect(movable(state)).toContain('lion-second-trial-event');
    expect(selectPoiMap(state).nodes.some(n => n.canTravel)).toBe(true);
  });

  it('applies to all three authored forks, each with its own resolving POI', () => {
    const cases = [
      ['lion-first-trial-combat', 'lion-first-refuge'],
      ['lion-second-trial-combat', 'lion-village-choice'],
      ['lion-final-trial-event', 'lion-shadow-signs'],
    ] as const;
    for (const [fork, resolving] of cases) {
      const state = walkTo(fork);
      // walkTo may resolve the other branch of an earlier fork on its way; only this chapter stays open.
      state.resolvedNodeIds = state.resolvedNodeIds.filter(id => id !== resolving);
      delete state.flags[`refugeSecured:${resolving}`];
      expect(activePoiBranchCommitment(state), fork).toMatchObject({ forkNodeId: fork, resolvingNodeId: resolving, targetNodeId: resolving });
      expect(movable(state), fork).toEqual([resolving]);
    }
  });

  it('keeps the commitment while company and save stay available; Wait no longer exists (set 1.18.0)', () => {
    const state = walkTo('lion-second-trial-event');
    expect(activePoiBranchCommitment(state)).not.toBeNull();
    expect('waitPoiTurn' in expedition).toBe(false);
    settlePoiNavigation(state);
    expect(activePoiBranchCommitment(state)?.targetNodeId).toBe('lion-village-choice');
  });

  it('resumes from wherever a Lot E safe return leaves the company', () => {
    const state = walkTo('lion-second-trial-event');
    const elite = LOT_E_ELITES[0]!;
    Object.assign(state.run.poiExpedition!.elites[elite.id]!, { active: true, defeated: false, positionId: 'lion-second-trial-event' });
    state.run.poiExpedition!.encounter = { id: `${elite.id}:0:rear`, eliteId: elite.id, kind: 'rear', originNodeId: 'lion-second-trial-event',
      targetNodeId: 'lion-second-trial-event', safeReturnNodeId: 'lion-valmir-road', phase: 'choice' };
    expect(retreatPoiElite(state, selectPoiMap(state))).toBe(true);
    expect(state.run.currentNodeId).toBe('lion-valmir-road');
    // Back on the road behind the branch: only steps toward the village choice move; side places stay closed.
    const steps = movable(state);
    expect(steps.length).toBeGreaterThan(0);
    for (const id of steps) expect(['lion-second-trial-event', 'lion-second-trial-combat']).toContain(id);
    expect(steps).not.toContain('lion-reserve-trail');
    expect(selectPoiMap(state).nodes.some(n => n.canTravel)).toBe(false);
  });

  it('resumes committed from new and old V6 saves without any new field, and releases an old earned refuge', () => {
    const saves = new SaveRepository();
    const state = walkTo('lion-second-trial-event');
    state.run.traversalBranches = { ...state.run.traversalBranches, T1: 'lion-second-trial-event' };
    // A first save normalizes the fixture (it activates the region's mobile elites), as the real game does.
    saves.saveAuto(state);
    const normalized = saves.loadAuto()!;
    saves.saveAuto(normalized);
    const loaded = saves.loadAuto()!;
    expect(loaded).toEqual(normalized);
    expect(JSON.stringify(loaded)).not.toContain('commitment');
    expect(movable(loaded)).toEqual(['lion-village-choice']);
    // An older save interrupted on an unresolved branch, before traversalBranches existed: activation resumes.
    const interrupted = walkTo('lion-valmir-road');
    interrupted.run.currentNodeId = interrupted.currentNodeId = 'lion-second-trial-combat';
    delete interrupted.run.traversalBranches;
    expect(activePoiBranchCommitment(interrupted)?.targetNodeId).toBe('lion-second-trial-combat');
    expect(movable(interrupted)).toEqual([]);
    expect(selectPoiMap(interrupted).nodes.find(n => n.id === 'lion-second-trial-combat')!.canActivate).toBe(true);
    // A historical trial bypass recorded the branch while the company stood elsewhere: the next step leads to it.
    const historical = walkTo('lion-nomad-crossroads');
    historical.run.traversalBranches = { T0: 'lion-first-trial-event' };
    expect(activePoiBranchCommitment(historical)?.targetNodeId).toBe('lion-first-trial-event');
    expect(movable(historical)).toEqual(['lion-first-trial-event']);
    // A pre-V2 save whose first refuge was earned is not committed.
    historical.flags['refugeSecured:lion-first-refuge'] = true;
    expect(activePoiBranchCommitment(historical)).toBeNull();
  });

  it('refuses bypass while committed and keeps the authored refugee bypass on the way in', () => {
    const state = walkTo('lion-nomad-crossroads');
    const reputation = state.reputation;
    expect(enterPoi(state, 'lion-first-trial-event')?.activate).toBe(true);
    expect(state.flags.ignoredRefugees).toBe(true);
    expect(state.reputation).toBe(reputation + calibrateLionAmount({ kind: 'consequence', amount: -2 }));
    expect(bypassPoi(state, 'lion-refugees')).toBeNull();
  });

  it('always finds a route toward the target from every open POI, so the commitment never falls back to free movement', () => {
    const cases = [
      ['lion-first-trial-event', 'lion-first-refuge'],
      ['lion-second-trial-combat', 'lion-village-choice'],
      ['lion-final-trial-combat', 'lion-shadow-signs'],
    ] as const;
    for (const [fork, resolving] of cases) {
      for (const branchResolved of [false, true]) {
        const base = walkTo(fork);
        base.resolvedNodeIds = base.resolvedNodeIds.filter(id => id !== resolving && (branchResolved || id !== fork));
        delete base.flags[`refugeSecured:${resolving}`];
        const leg = fork.startsWith('lion-first') ? 'T0' : fork.startsWith('lion-second') ? 'T1' : 'T3';
        base.run.traversalBranches = { ...base.run.traversalBranches, [leg]: fork };
        const open = selectPoiMap(base).nodes.filter(n => n.status !== 'locked').map(n => n.id);
        for (const standing of open) {
          const state = structuredClone(base);
          state.run.currentNodeId = state.currentNodeId = standing;
          expect(selectPoiMap(state).commitment, `${fork} ${branchResolved} from ${standing}`).not.toBeNull();
        }
      }
    }
  });

  it('keeps the legacy Journey commit inside the commitment', () => {
    const state = walkTo('lion-second-trial-event');
    const allowed = runNodesAllowedByCommitment(state, getAvailableRunNodes(state)).map(node => node.id);
    expect(allowed.every(id => id === 'lion-village-choice')).toBe(true);
    const free = walkTo('lion-village-choice');
    expect(runNodesAllowedByCommitment(free, getAvailableRunNodes(free))).toEqual(getAvailableRunNodes(free));
  });
});
