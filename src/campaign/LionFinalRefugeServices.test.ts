import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { enterPoi, selectPoiMap } from '../game/runSystem';
import type { GameState } from '../game/types';
import { LION_FINALE_SERPENT_SELECTED_FLAG, LION_FINALE_TRIAL_SELECTED_FLAG } from '../game/lionFinale';
import { areLionFinalRefugeServicesOpen, hasLionJudgementBegun } from './LionFinalRefugeServices';

const atResolvedFinalRefuge = () => {
  const state = createInitialState();
  state.run.currentNodeId = state.currentNodeId = 'lion-final-refuge';
  state.resolvedNodeIds.push('lion-final-refuge');
  return state;
};

it('opens the final refuge services only at the resolved final refuge, before the judgement (set 1.15.0)', () => {
  const state = atResolvedFinalRefuge();
  const before = structuredClone(state);
  expect(hasLionJudgementBegun(state)).toBe(false);
  expect(areLionFinalRefugeServicesOpen(state)).toBe(true);
  // A pure derivation of existing facts: it never writes a field.
  expect(state).toEqual(before);
});

it('keeps the services closed before the dialogue resolves the node, or elsewhere on the map', () => {
  const unresolved = createInitialState();
  unresolved.run.currentNodeId = unresolved.currentNodeId = 'lion-final-refuge';
  expect(areLionFinalRefugeServicesOpen(unresolved)).toBe(false);
  const elsewhere = atResolvedFinalRefuge();
  elsewhere.run.currentNodeId = elsewhere.currentNodeId = 'lion-shadow-signs';
  expect(areLionFinalRefugeServicesOpen(elsewhere)).toBe(false);
});

it.each([
  ['the judgement node was entered', (state: ReturnType<typeof createInitialState>) => { state.run.visitedNodeIds.push('lion-final-judgement'); }],
  ['the judgement node is resolved', (state: ReturnType<typeof createInitialState>) => { state.resolvedNodeIds.push('lion-final-judgement'); }],
  ['the Serpent finale was chosen', (state: ReturnType<typeof createInitialState>) => { state.flags[LION_FINALE_SERPENT_SELECTED_FLAG] = true; }],
  ['the Lion trial was chosen', (state: ReturnType<typeof createInitialState>) => { state.flags[LION_FINALE_TRIAL_SELECTED_FLAG] = true; }],
  ['the chronicle is completed', (state: ReturnType<typeof createInitialState>) => { state.run.status = 'completed'; }],
])('closes the services once %s', (_label, arrange) => {
  const state = atResolvedFinalRefuge();
  arrange(state);
  expect(areLionFinalRefugeServicesOpen(state)).toBe(false);
});

describe('map reuse of the final refuge services (set 1.15.0)', () => {
  const walkToFinalRefuge = () => {
    const state = createInitialState();
    const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
    const previous = new Map<string, string | null>([[state.run.currentNodeId, null]]);
    const queue = [state.run.currentNodeId];
    while (queue.length && !previous.has('lion-final-refuge')) {
      const current = queue.shift()!;
      for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
    }
    const path: string[] = [];
    for (let id: string | null | undefined = 'lion-final-refuge'; id; id = previous.get(id)) path.unshift(id);
    for (const id of path) if (!state.resolvedNodeIds.includes(id)) state.resolvedNodeIds.push(id);
    state.run.currentNodeId = state.currentNodeId = 'lion-final-refuge';
    if (!state.run.visitedNodeIds.includes('lion-final-refuge')) state.run.visitedNodeIds.push('lion-final-refuge');
    return state;
  };
  const finalNode = (state: GameState) => selectPoiMap(state).nodes.find(node => node.id === 'lion-final-refuge')!;

  it('marks the resolved final refuge reusable and openable in place, like the two refuges', () => {
    const state = walkToFinalRefuge();
    expect(finalNode(state)).toMatchObject({ status: 'resolved', reusable: true, canActivate: true, type: 'story' });
    const resolvedBefore = [...state.resolvedNodeIds], flagsBefore = { ...state.flags };
    expect(enterPoi(state, 'lion-final-refuge')?.activate).toBe(true);
    expect(state.resolvedNodeIds).toEqual(resolvedBefore);
    expect(state.flags).toEqual(flagsBefore);
  });

  it('stops reusing it once the judgement has begun, and before the dialogue resolves it', () => {
    const begun = walkToFinalRefuge();
    begun.run.visitedNodeIds.push('lion-final-judgement');
    expect(finalNode(begun)).toMatchObject({ reusable: false, canActivate: false });
    const unresolved = walkToFinalRefuge();
    unresolved.resolvedNodeIds = unresolved.resolvedNodeIds.filter(id => id !== 'lion-final-refuge');
    expect(finalNode(unresolved).reusable).toBe(false);
  });
});
