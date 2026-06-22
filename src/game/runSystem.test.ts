import { describe, expect, it } from 'vitest';
import { createInitialState } from './store';
import {
  addTemporaryLoot, createRunState, failRunToCheckpoint, generateRunGraph, secureRunLoot,
} from './runSystem';

describe('hybrid run system', () => {
  it('reproduces an identical graph from the same seed', () => {
    expect(generateRunGraph(42)).toEqual(generateRunGraph(42));
    expect(generateRunGraph(42)).not.toEqual(generateRunGraph(43));
  });

  it('creates a twelve-step route with two refuges', () => {
    const graph = generateRunGraph(7);
    expect(Math.max(...graph.nodes.map((node) => node.depth))).toBe(11);
    expect(graph.nodes.filter((node) => node.type === 'refuge')).toHaveLength(2);
  });

  it('banks temporary loot at a refuge and drops it after defeat', () => {
    const state = createInitialState();
    state.run = createRunState(8);
    const initialGold = state.gold;
    addTemporaryLoot(state.run, { gold: 45 });
    addTemporaryLoot(state.run, { category: 'consumables', itemId: 'potion', quantity: 2 });
    secureRunLoot(state);
    expect(state.gold).toBe(initialGold + 45);
    expect(state.inventory.consumables.potion).toBe(5);
    addTemporaryLoot(state.run, { gold: 30 });
    failRunToCheckpoint(state);
    expect(state.run.temporaryLoot.gold).toBe(0);
    expect(state.run.currentNodeId).toBe(state.run.checkpointNodeId);
  });
});

