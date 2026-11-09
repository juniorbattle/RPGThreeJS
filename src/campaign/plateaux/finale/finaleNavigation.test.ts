/**
 * Set 1.20.0, post-demo Lot 4: the corrupted capital runs on the same RunSystem navigation rules as the plateaux
 * (TRAVERSAL "The corrupted capital of the final act is a small POI map under the same rules"): connected movement,
 * once-only resolution, one exclusive fork with branch commitment, a refuge, optional POIs and a stationary guardian.
 * Pure authority fixtures mark content resolved; they are not played content.
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
import { FINALE_GUARDIANS, FINALE_OPTIONAL_POIS, FINALE_ROUTE } from './finaleTopology';
import { FINALE_SCENE_BUILDERS } from './finaleDialogues';
import { FINALE_PLATEAU_BINDING } from './finalePlateau';

function finaleState(): GameState {
  const state = createInitialState();
  state.run = createPlateauRunState('finale', 20261111);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  return state;
}

function play(state: GameState, id: string): void {
  settlePoiNavigation(state);
  const entered = enterPoi(state, id) ?? travelToResolvedPoi(state, id);
  if (!entered) throw new Error(`Refused: ${id} (from ${state.run.currentNodeId})`);
  if (!state.resolvedNodeIds.includes(id)) state.resolvedNodeIds.push(id);
  if (id.endsWith('refuge')) state.flags[`refugeSecured:${id}`] = true;
}

const canMove = (state: GameState) => selectPoiMap(state).nodes.filter((node) => node.canMove).map((node) => node.id).sort();
const status = (state: GameState, id: string) => selectPoiMap(state).nodes.find((node) => node.id === id)?.status;

describe('the corrupted capital (set 1.20.0, Lot 4)', () => {
  it('builds a small map: 7 route POIs, 4 optional POIs and one guardian, all with the finale- prefix', () => {
    const state = finaleState();
    expect(state.run.id).toBe('finale-20261111');
    expect(plateauCampaignForRun(state.run)).toBe(FINALE_PLATEAU_BINDING);
    expect(FINALE_ROUTE).toHaveLength(7);
    expect(FINALE_OPTIONAL_POIS).toHaveLength(4);
    expect(state.run.graph.nodes).toHaveLength(11);
    expect(Object.keys(state.run.poiExpedition!.elites)).toEqual(FINALE_GUARDIANS.map((guardian) => guardian.id));
    expect(state.run.graph.nodes.every((node) => node.id.startsWith('finale-'))).toBe(true);
    expect(state.run.currentNodeId).toBe('finale-arena-gate');
    expect(canMove(state)).toEqual(['finale-burning-streets']);
  });

  it('commits the chosen branch at the fork until the last refuge, neutralizing the other', () => {
    const state = finaleState();
    // The capital's first POI is the run's start, played on arrival.
    state.resolvedNodeIds.push('finale-arena-gate');
    for (const id of ['finale-burning-streets', 'finale-allied-rally']) play(state, id);
    expect(canMove(state)).toEqual(expect.arrayContaining(['finale-trapped-citizens', 'finale-demon-square']));
    expect(status(state, 'finale-last-refuge')).toBe('locked');
    play(state, 'finale-trapped-citizens');
    expect(status(state, 'finale-demon-square')).toBe('neutralized');
    expect(activePoiBranchCommitment(state)?.resolvingNodeId).toBe('finale-last-refuge');
    expect(canMove(state)).toEqual(['finale-last-refuge']);
    play(state, 'finale-last-refuge');
    expect(activePoiBranchCommitment(state)).toBeNull();
    expect(canMove(state)).toContain('finale-breach');
  });

  it('posts the ramparts guardian on its chest once the rally is reached; its victory gives +1 and opens the chest', () => {
    const state = finaleState();
    state.resolvedNodeIds.push('finale-arena-gate');
    for (const id of ['finale-burning-streets', 'finale-allied-rally']) play(state, id);
    settlePoiNavigation(state);
    expect(selectPoiMap(state).threats.find((entry) => entry.id === 'finale-guardian-ramparts'))
      .toMatchObject({ positionId: 'finale-poi-reserve', label: 'Démon des remparts' });
    const entered = enterPoi(state, 'finale-poi-reserve');
    expect(entered?.interception).toBe(true);
    const encounter = state.run.poiExpedition!.encounter!;
    expect(commitPoiEliteFight(state, encounter.id)).toBe('finale_guardian_ramparts');
    const reputation = state.reputation;
    const result: CombatResult = { combatId: 'finale_guardian_ramparts', victory: true, participants: [], unitHealth: {} };
    expect(resolvePoiEliteVictory(state, encounter.id, result)).toBe(true);
    expect(state.reputation).toBe(reputation + 1);
    expect(enterPoi(state, 'finale-poi-reserve')?.activate).toBe(true);
  });
});

describe('the betrayal names the advice the company followed (set 1.20.0, Lot 4)', () => {
  const adviceLine = (flags: Record<string, boolean>) => {
    const state = finaleState();
    Object.assign(state.flags, flags);
    return FINALE_SCENE_BUILDERS.finale_betrayal!(state).steps.find((step) => step.id === 'advice')!.text;
  };

  it('counts a champion humiliated at the Tournament as advice followed, even after honourable plateaux', () => {
    expect(adviceLine({})).toBe('Vous ne m’avez jamais écouté. Peu importe : il me suffisait d’entrer avec vous dans cette arène.');
    expect(adviceLine({ finaleWolfHumiliated: true })).toBe(
      'Dans cette arène, vous m’avez enfin écouté : le champion du Loup humilié devant les clans. Vous avez servi ceux que je sers.');
    expect(adviceLine({ bearMinesSeized: true, finaleRavenHumiliated: true, finalePhoenixHumiliated: true })).toBe(
      'Vous m’avez écouté plus souvent que vous ne le croyez : le filon sombre gardé pour le clan. '
      + 'Et dans cette arène encore, les champions du Corbeau et du Phénix humiliés devant les clans. Chaque fois, vous avez servi ceux que je sers.');
  });
});
