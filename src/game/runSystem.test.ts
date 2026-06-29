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

  it('creates a guided Lion route with two refuge hubs', () => {
    const graph = generateRunGraph(7);
    expect(Math.max(...graph.nodes.map((node) => node.depth))).toBe(9);
    expect(graph.nodes.filter((node) => node.type === 'refuge')).toHaveLength(2);
    expect(graph.nodes.filter((node) => node.type === 'shop')).toHaveLength(0);
    expect(graph.nodes[0]!.id).toBe('lion-camp');
    expect(graph.nodes.some((node) => node.contentId === 'lion_finale_judgement')).toBe(true);
  });

  it('describes route risk, reward and narrative hints for TravelView', () => {
    const graph = generateRunGraph(11);
    expect(graph.nodes.every((node) => typeof node.risk === 'number')).toBe(true);
    expect(graph.nodes.every((node) => typeof node.reward === 'number')).toBe(true);
    expect(graph.nodes.every((node) => typeof node.hint === 'string' && node.hint.length > 0)).toBe(true);
  });

  it('never exposes more than two route choices from one node', () => {
    const graph = generateRunGraph(12);
    expect(graph.nodes.every((node) => node.links.length <= 2)).toBe(true);
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
