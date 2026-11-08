/**
 * Set 1.20.0, post-demo Lot 1: the Bear plateau runs on the same RunSystem navigation rules as the Lion (TRAVERSAL
 * "Post-demo plateaux"): connected movement, activation, once-only resolution, exclusive forks with branch commitment,
 * refuges, optional POIs, stationary guardians on their posts and travel to resolved POIs. Pure authority fixtures mark
 * content resolved; they are not played content.
 */
import { describe, expect, it } from 'vitest';
import {
  activePoiBranchCommitment,
  commitPoiEliteFight,
  createPlateauRunState,
  enterPoi,
  plateauCampaignForRun,
  resolvePoiEliteVictory,
  selectPoiMap,
  settlePoiNavigation,
  travelToResolvedPoi,
} from '../../../game/runSystem';
import { createInitialState } from '../../../game/store';
import type { CombatResult, GameState } from '../../../game/types';
import { BEAR_GUARDIANS, BEAR_OPTIONAL_POIS, BEAR_ROUTE } from './bearTopology';
import { BEAR_PLATEAU_BINDING } from './bearPlateau';

function bearState(): GameState {
  const state = createInitialState();
  state.run = createPlateauRunState('bear', 20261108);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  return state;
}

/** Arrive at a POI through RunSystem, then mark its content resolved as GameApp does after playing it. */
function play(state: GameState, id: string): void {
  settlePoiNavigation(state);
  const entered = enterPoi(state, id) ?? travelToResolvedPoi(state, id);
  if (!entered) throw new Error(`Refused: ${id} (from ${state.run.currentNodeId})`);
  if (!state.resolvedNodeIds.includes(id)) state.resolvedNodeIds.push(id);
  if (id.endsWith('refuge')) state.flags[`refugeSecured:${id}`] = true;
}

const canMove = (state: GameState) => selectPoiMap(state).nodes.filter((node) => node.canMove).map((node) => node.id).sort();
const status = (state: GameState, id: string) => selectPoiMap(state).nodes.find((node) => node.id === id)?.status;

describe('Bear plateau navigation (set 1.20.0, Lot 1 draft)', () => {
  it('builds a Lion-sized run: 21 canonical nodes, 12 optional POIs and two guardians, all with the bear- prefix', () => {
    const state = bearState();
    expect(state.run.id).toBe('bear-20261108');
    expect(plateauCampaignForRun(state.run)).toBe(BEAR_PLATEAU_BINDING);
    expect(state.run.graph.nodes).toHaveLength(33);
    expect(BEAR_ROUTE).toHaveLength(21);
    expect(BEAR_OPTIONAL_POIS).toHaveLength(12);
    expect(Object.keys(state.run.poiExpedition!.elites)).toEqual(BEAR_GUARDIANS.map((guardian) => guardian.id));
    expect(state.run.graph.nodes.every((node) => node.id.startsWith('bear-'))).toBe(true);
    expect(canMove(state)).toEqual(['bear-audience']);
  });

  it('commits a chosen branch until the chapter resolves, neutralizing the other branch', () => {
    const state = bearState();
    for (const id of ['bear-audience', 'bear-opening-ambush', 'bear-raven-messenger', 'bear-trapped-miners']) play(state, id);
    expect(canMove(state)).toEqual(expect.arrayContaining(['bear-first-trial-combat', 'bear-first-trial-event']));
    expect(status(state, 'bear-first-refuge')).toBe('locked');
    play(state, 'bear-first-trial-event');
    expect(status(state, 'bear-first-trial-combat')).toBe('neutralized');
    expect(activePoiBranchCommitment(state)).toEqual({
      forkNodeId: 'bear-first-trial-event', resolvingNodeId: 'bear-first-refuge', targetNodeId: 'bear-first-refuge',
    });
    expect(canMove(state)).toEqual(['bear-first-refuge']);
    play(state, 'bear-first-refuge');
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(canMove(state)).toContain('bear-ore-convoy');
  });

  it('posts the lift guardian on its chest once the mine road is resolved, and its victory opens the chest', () => {
    const state = bearState();
    for (const id of ['bear-audience', 'bear-opening-ambush', 'bear-raven-messenger', 'bear-trapped-miners',
      'bear-first-trial-combat', 'bear-first-refuge', 'bear-ore-convoy', 'bear-mine-road']) play(state, id);
    settlePoiNavigation(state);
    const threat = selectPoiMap(state).threats.find((entry) => entry.id === 'bear-guardian-lift');
    expect(threat).toMatchObject({ positionId: 'bear-poi-mine-lift-cache', label: 'Contremaître du Corbeau' });
    const entered = enterPoi(state, 'bear-poi-mine-lift-cache');
    expect(entered?.interception).toBe(true);
    const encounter = state.run.poiExpedition!.encounter!;
    expect(commitPoiEliteFight(state, encounter.id)).toBe('bear_guardian_foreman');
    const result: CombatResult = { combatId: 'bear_guardian_foreman', victory: true, participants: [], unitHealth: {} };
    const reputation = state.reputation;
    expect(resolvePoiEliteVictory(state, encounter.id, result)).toBe(true);
    // Post-demo values are authored at the post-demo scale: the guardian's +1 is not recalibrated.
    expect(state.reputation).toBe(reputation + 1);
    expect(state.run.poiExpedition!.elites['bear-guardian-lift']!.defeated).toBe(true);
    expect(enterPoi(state, 'bear-poi-mine-lift-cache')?.activate).toBe(true);
  });

  it('plays the whole route to the judgement, with travel back to a resolved POI in one movement', () => {
    const state = bearState();
    const route = ['bear-audience', 'bear-opening-ambush', 'bear-raven-messenger', 'bear-trapped-miners', 'bear-first-trial-combat',
      'bear-first-refuge', 'bear-ore-convoy', 'bear-mine-road', 'bear-second-trial-event', 'bear-sacred-mines', 'bear-second-refuge',
      'bear-raven-camp', 'bear-miners-testimony', 'bear-final-trial-combat', 'bear-dark-vein', 'bear-final-refuge'];
    for (const id of route) play(state, id);
    const travelled = travelToResolvedPoi(state, 'bear-second-refuge');
    expect(travelled?.route.at(-1)).toBe('bear-second-refuge');
    play(state, 'bear-final-refuge');
    expect(canMove(state)).toContain('bear-judgement');
    expect(status(state, 'bear-second-trial-combat')).toBe('neutralized');
    expect(status(state, 'bear-final-trial-event')).toBe('neutralized');
  });
});
