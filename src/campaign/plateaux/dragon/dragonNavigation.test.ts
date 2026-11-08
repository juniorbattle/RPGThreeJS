/**
 * Set 1.20.0, post-demo Lot 2: the Dragon plateau runs on the same RunSystem navigation rules as the Lion (TRAVERSAL
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
import { DRAGON_GUARDIANS, DRAGON_OPTIONAL_POIS, DRAGON_ROUTE } from './dragonTopology';
import { DRAGON_PLATEAU_BINDING } from './dragonPlateau';

function dragonState(): GameState {
  const state = createInitialState();
  state.run = createPlateauRunState('dragon', 20261108);
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

describe('Dragon plateau navigation (set 1.20.0, Lot 2 draft)', () => {
  it('builds a Lion-sized run: 21 canonical nodes, 12 optional POIs and two guardians, all with the dragon- prefix', () => {
    const state = dragonState();
    expect(state.run.id).toBe('dragon-20261108');
    expect(plateauCampaignForRun(state.run)).toBe(DRAGON_PLATEAU_BINDING);
    expect(state.run.graph.nodes).toHaveLength(33);
    expect(DRAGON_ROUTE).toHaveLength(21);
    expect(DRAGON_OPTIONAL_POIS).toHaveLength(12);
    expect(Object.keys(state.run.poiExpedition!.elites)).toEqual(DRAGON_GUARDIANS.map((guardian) => guardian.id));
    expect(state.run.graph.nodes.every((node) => node.id.startsWith('dragon-'))).toBe(true);
    expect(canMove(state)).toEqual(['dragon-audience']);
  });

  it('commits a chosen branch until the chapter resolves, neutralizing the other branch', () => {
    const state = dragonState();
    for (const id of ['dragon-audience', 'dragon-opening-ambush', 'dragon-wolf-envoy', 'dragon-terrorized-village']) play(state, id);
    expect(canMove(state)).toEqual(expect.arrayContaining(['dragon-first-trial-combat', 'dragon-first-trial-event']));
    expect(status(state, 'dragon-first-refuge')).toBe('locked');
    play(state, 'dragon-first-trial-event');
    expect(status(state, 'dragon-first-trial-combat')).toBe('neutralized');
    expect(activePoiBranchCommitment(state)).toEqual({
      forkNodeId: 'dragon-first-trial-event', resolvingNodeId: 'dragon-first-refuge', targetNodeId: 'dragon-first-refuge',
    });
    expect(canMove(state)).toEqual(['dragon-first-refuge']);
    play(state, 'dragon-first-refuge');
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(canMove(state)).toContain('dragon-captive-wolf');
  });

  it('posts the lift guardian on its chest once the mine road is resolved, and its victory opens the chest', () => {
    const state = dragonState();
    for (const id of ['dragon-audience', 'dragon-opening-ambush', 'dragon-wolf-envoy', 'dragon-terrorized-village',
      'dragon-first-trial-combat', 'dragon-first-refuge', 'dragon-captive-wolf', 'dragon-cliff-road']) play(state, id);
    settlePoiNavigation(state);
    const threat = selectPoiMap(state).threats.find((entry) => entry.id === 'dragon-guardian-terrace');
    expect(threat).toMatchObject({ positionId: 'dragon-poi-terrace-cache', label: 'Champion du Loup' });
    const entered = enterPoi(state, 'dragon-poi-terrace-cache');
    expect(entered?.interception).toBe(true);
    const encounter = state.run.poiExpedition!.encounter!;
    expect(commitPoiEliteFight(state, encounter.id)).toBe('dragon_guardian_champion');
    const result: CombatResult = { combatId: 'dragon_guardian_champion', victory: true, participants: [], unitHealth: {} };
    const reputation = state.reputation;
    expect(resolvePoiEliteVictory(state, encounter.id, result)).toBe(true);
    // Post-demo values are authored at the post-demo scale: the guardian's +1 is not recalibrated.
    expect(state.reputation).toBe(reputation + 1);
    expect(state.run.poiExpedition!.elites['dragon-guardian-terrace']!.defeated).toBe(true);
    expect(enterPoi(state, 'dragon-poi-terrace-cache')?.activate).toBe(true);
  });

  it('plays the whole route to the judgement, with travel back to a resolved POI in one movement', () => {
    const state = dragonState();
    const route = ['dragon-audience', 'dragon-opening-ambush', 'dragon-wolf-envoy', 'dragon-terrorized-village', 'dragon-first-trial-combat',
      'dragon-first-refuge', 'dragon-captive-wolf', 'dragon-cliff-road', 'dragon-second-trial-event', 'dragon-wolf-lair', 'dragon-second-refuge',
      'dragon-shaman-traces', 'dragon-freed-pilgrims', 'dragon-final-trial-combat', 'dragon-crystal-altar', 'dragon-final-refuge'];
    for (const id of route) play(state, id);
    const travelled = travelToResolvedPoi(state, 'dragon-second-refuge');
    expect(travelled?.route.at(-1)).toBe('dragon-second-refuge');
    play(state, 'dragon-final-refuge');
    expect(canMove(state)).toContain('dragon-judgement');
    expect(status(state, 'dragon-second-trial-combat')).toBe('neutralized');
    expect(status(state, 'dragon-final-trial-event')).toBe('neutralized');
  });
});
