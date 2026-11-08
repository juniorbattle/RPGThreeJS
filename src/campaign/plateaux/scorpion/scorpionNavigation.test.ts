/**
 * Set 1.20.0, post-demo Lot 3: the Scorpion plateau runs on the same RunSystem navigation rules as the Lion (TRAVERSAL
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
import { SCORPION_GUARDIANS, SCORPION_OPTIONAL_POIS, SCORPION_ROUTE } from './scorpionTopology';
import { SCORPION_PLATEAU_BINDING } from './scorpionPlateau';

function scorpionState(): GameState {
  const state = createInitialState();
  state.run = createPlateauRunState('scorpion', 20261108);
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

describe('Scorpion plateau navigation (set 1.20.0, Lot 3 draft)', () => {
  it('builds a Lion-sized run: 21 canonical nodes, 12 optional POIs and two guardians, all with the scorpion- prefix', () => {
    const state = scorpionState();
    expect(state.run.id).toBe('scorpion-20261108');
    expect(plateauCampaignForRun(state.run)).toBe(SCORPION_PLATEAU_BINDING);
    expect(state.run.graph.nodes).toHaveLength(33);
    expect(SCORPION_ROUTE).toHaveLength(21);
    expect(SCORPION_OPTIONAL_POIS).toHaveLength(12);
    expect(Object.keys(state.run.poiExpedition!.elites)).toEqual(SCORPION_GUARDIANS.map((guardian) => guardian.id));
    expect(state.run.graph.nodes.every((node) => node.id.startsWith('scorpion-'))).toBe(true);
    expect(canMove(state)).toEqual(['scorpion-audience']);
  });

  it('commits a chosen branch until the chapter resolves, neutralizing the other branch', () => {
    const state = scorpionState();
    for (const id of ['scorpion-audience', 'scorpion-opening-ambush', 'scorpion-scholars', 'scorpion-phoenix-faithful']) play(state, id);
    expect(canMove(state)).toEqual(expect.arrayContaining(['scorpion-first-trial-combat', 'scorpion-first-trial-event']));
    expect(status(state, 'scorpion-first-refuge')).toBe('locked');
    play(state, 'scorpion-first-trial-event');
    expect(status(state, 'scorpion-first-trial-combat')).toBe('neutralized');
    expect(activePoiBranchCommitment(state)).toEqual({
      forkNodeId: 'scorpion-first-trial-event', resolvingNodeId: 'scorpion-first-refuge', targetNodeId: 'scorpion-first-refuge',
    });
    expect(canMove(state)).toEqual(['scorpion-first-refuge']);
    play(state, 'scorpion-first-refuge');
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(canMove(state)).toContain('scorpion-warded-path');
  });

  it('posts the flame keeper on its chest once the ruin road is resolved, and its victory opens the chest', () => {
    const state = scorpionState();
    for (const id of ['scorpion-audience', 'scorpion-opening-ambush', 'scorpion-scholars', 'scorpion-phoenix-faithful',
      'scorpion-first-trial-combat', 'scorpion-first-refuge', 'scorpion-warded-path', 'scorpion-ruin-road']) play(state, id);
    settlePoiNavigation(state);
    const threat = selectPoiMap(state).threats.find((entry) => entry.id === 'scorpion-guardian-ruins');
    expect(threat).toMatchObject({ positionId: 'scorpion-poi-ruin-cache', label: 'Gardien de flamme' });
    const entered = enterPoi(state, 'scorpion-poi-ruin-cache');
    expect(entered?.interception).toBe(true);
    const encounter = state.run.poiExpedition!.encounter!;
    expect(commitPoiEliteFight(state, encounter.id)).toBe('scorpion_guardian_flamekeeper');
    const result: CombatResult = { combatId: 'scorpion_guardian_flamekeeper', victory: true, participants: [], unitHealth: {} };
    const reputation = state.reputation;
    expect(resolvePoiEliteVictory(state, encounter.id, result)).toBe(true);
    // Post-demo values are authored at the post-demo scale: the guardian's +1 is not recalibrated.
    expect(state.reputation).toBe(reputation + 1);
    expect(state.run.poiExpedition!.elites['scorpion-guardian-ruins']!.defeated).toBe(true);
    expect(enterPoi(state, 'scorpion-poi-ruin-cache')?.activate).toBe(true);
  });

  it('plays the whole route to the judgement, with travel back to a resolved POI in one movement', () => {
    const state = scorpionState();
    const route = ['scorpion-audience', 'scorpion-opening-ambush', 'scorpion-scholars', 'scorpion-phoenix-faithful', 'scorpion-first-trial-combat',
      'scorpion-first-refuge', 'scorpion-warded-path', 'scorpion-ruin-road', 'scorpion-second-trial-event', 'scorpion-phoenix-temple', 'scorpion-second-refuge',
      'scorpion-prophet-traces', 'scorpion-temple-witnesses', 'scorpion-final-trial-combat', 'scorpion-corrupted-texts', 'scorpion-final-refuge'];
    for (const id of route) play(state, id);
    const travelled = travelToResolvedPoi(state, 'scorpion-second-refuge');
    expect(travelled?.route.at(-1)).toBe('scorpion-second-refuge');
    play(state, 'scorpion-final-refuge');
    expect(canMove(state)).toContain('scorpion-judgement');
    expect(status(state, 'scorpion-second-trial-combat')).toBe('neutralized');
    expect(status(state, 'scorpion-final-trial-event')).toBe('neutralized');
  });
});
