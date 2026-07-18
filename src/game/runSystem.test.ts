import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues } from './content';
import { createInitialState, migrateState } from './store';
import {
  addTemporaryLoot, createRunState, failRunToCheckpoint, generateRunGraph, getAvailableRunNodes,
  getLionConductScore, getLionConductTier, secureRunLoot,
} from './runSystem';
import type { GameState } from './types';

function choicesAt(state: GameState, nodeId: string) {
  state.run.currentNodeId = nodeId;
  state.currentNodeId = nodeId;
  return getAvailableRunNodes(state);
}

describe('hybrid run system', () => {
  it('reproduces route structure while varying only equivalent creature encounters by seed', () => {
    expect(generateRunGraph(42)).toEqual(generateRunGraph(42));
    expect(generateRunGraph(42)).not.toEqual(generateRunGraph(43));
    for (const seed of [42, 43]) {
      const graph = generateRunGraph(seed);
      expect(graph.nodes.some((node) => node.contentId === 'seeded-intrigue')).toBe(false);
    }
  });

  it('creates a 18-node Lion braid with two refuges and three reconverging trials', () => {
    const graph = generateRunGraph(7);
    expect(graph.nodes).toHaveLength(18);
    expect(Math.max(...graph.nodes.map((node) => node.depth))).toBe(14);
    expect(graph.nodes.filter((node) => node.type === 'refuge')).toHaveLength(2);
    expect(graph.nodes.filter((node) => node.type === 'shop')).toHaveLength(0);
    expect(graph.nodes[0]!.id).toBe('lion-camp');
    expect(graph.nodes.some((node) => node.contentId === 'lion_finale_judgement')).toBe(true);

    for (const nodeId of ['lion-refugees', 'lion-valmir-road', 'lion-witnesses']) {
      const node = graph.nodes.find((candidate) => candidate.id === nodeId)!;
      const choices = node.links.map((id) => graph.nodes.find((candidate) => candidate.id === id)!);
      expect(choices.map((choice) => choice.type).sort()).toEqual(['combat', 'event']);
      expect(new Set(choices.flatMap((choice) => choice.links)).size).toBe(1);
    }
  });

  it('keeps every structural node reachable and every branch connected to the finale', () => {
    const graph = generateRunGraph(11);
    const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
    for (const node of graph.nodes) {
      for (const link of node.links) incoming.set(link, (incoming.get(link) ?? 0) + 1);
    }
    expect(graph.nodes.filter((node) => node.id !== 'lion-camp').every((node) => (incoming.get(node.id) ?? 0) > 0)).toBe(true);

    const reachesFinale = (nodeId: string, visited = new Set<string>()): boolean => {
      if (nodeId === 'lion-final-judgement') return true;
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);
      const node = graph.nodes.find((candidate) => candidate.id === nodeId);
      return Boolean(node?.links.some((link) => reachesFinale(link, new Set(visited))));
    };
    expect(graph.nodes.every((node) => reachesFinale(node.id))).toBe(true);

    let node = graph.nodes.find((candidate) => candidate.id === 'lion-camp')!;
    const path = [node.id];
    while (node.links.length > 0) {
      node = graph.nodes.find((candidate) => candidate.id === node.links[0])!;
      path.push(node.id);
    }
    expect(path).toHaveLength(15);
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

  it('derives conduct from moral decisions rather than combat reputation', () => {
    expect(getLionConductScore({ helpedRefugees: true, prioritizedVillage: true })).toBe(3);
    expect(getLionConductTier({ helpedRefugees: true })).toBe('honour');
    expect(getLionConductTier({ exploitedRefugees: true })).toBe('infamy');
    expect(getLionConductTier({ helpedRefugees: true, prioritizedLoot: true })).toBe('uncertain');
  });

  it('offers helpful trials and creatures for honour, but greed and reprisals for infamy', () => {
    const honour = createInitialState();
    honour.run = createRunState(20);
    honour.flags.helpedRefugees = true;
    expect(choicesAt(honour, 'lion-refugees').map((node) => node.contentId)).toEqual(['mystery_help', 'spider_nest']);

    const infamy = createInitialState();
    infamy.run = createRunState(20);
    infamy.flags.exploitedRefugees = true;
    expect(choicesAt(infamy, 'lion-refugees').map((node) => node.contentId)).toEqual(['mystery_treasure', 'serpent_reprisals']);
    expect(choicesAt(infamy, 'lion-valmir-road').map((node) => node.contentId)).toEqual(['old_shrine_event', 'serpent_duelist_trial']);
    expect(choicesAt(infamy, 'lion-witnesses').map((node) => node.contentId)).toEqual(['serpent_informant', 'serpent_hunters']);
  });

  it('backs every adaptive route variant with existing dialogue or combat content', () => {
    for (const flags of [{ helpedRefugees: true }, {}, { exploitedRefugees: true }]) {
      const state = createInitialState();
      state.run = createRunState(25);
      Object.assign(state.flags, flags);
      for (const gateId of ['lion-refugees', 'lion-valmir-road', 'lion-witnesses']) {
        for (const node of choicesAt(state, gateId)) {
          expect(node.type === 'combat' ? combatConfigs.has(node.contentId) : dialogues.has(node.contentId), `${gateId}:${node.contentId}`).toBe(true);
        }
      }
    }
  });

  it('locks revealed assignments and never repeats narrative events across the three trials', () => {
    for (const flags of [{ helpedRefugees: true }, {}, { exploitedRefugees: true }]) {
      const state = createInitialState();
      state.run = createRunState(21);
      Object.assign(state.flags, flags);
      const eventIds = [
        choicesAt(state, 'lion-refugees')[0]!.contentId,
        choicesAt(state, 'lion-valmir-road')[0]!.contentId,
        choicesAt(state, 'lion-witnesses')[0]!.contentId,
      ];
      expect(new Set(eventIds).size).toBe(3);
    }

    const state = createInitialState();
    state.run = createRunState(22);
    state.flags.helpedRefugees = true;
    const first = choicesAt(state, 'lion-refugees').map((node) => node.contentId);
    state.flags.helpedRefugees = false;
    state.flags.exploitedRefugees = true;
    expect(choicesAt(state, 'lion-refugees').map((node) => node.contentId)).toEqual(first);
  });

  it('keeps elites after the first refuge and substitutes the final elite temptation after one is completed', () => {
    for (const flags of [{ helpedRefugees: true }, {}, { exploitedRefugees: true }]) {
      const state = createInitialState();
      state.run = createRunState(23);
      Object.assign(state.flags, flags);
      const firstCombat = choicesAt(state, 'lion-refugees').find((node) => node.type === 'combat')!;
      expect(combatConfigs.get(firstCombat.contentId)?.encounterRank).toBe('normal');
    }

    const state = createInitialState();
    state.run = createRunState(24);
    state.flags.helpedRefugees = true;
    const secondCombat = choicesAt(state, 'lion-valmir-road').find((node) => node.type === 'combat')!;
    expect(secondCombat.contentId).toBe('troll_crossing');
    expect(combatConfigs.get(secondCombat.contentId)?.encounterRank).toBe('elite');
    state.resolvedNodeIds.push(secondCombat.id);
    expect(choicesAt(state, 'lion-witnesses')[0]!.contentId).toBe('mystery_shrine');
  });

  it('upgrades stale saved routes while preserving conduct and temporary loot', () => {
    const stale = createInitialState();
    stale.flags.helpedRefugees = true;
    stale.run.temporaryLoot.gold = 75;
    stale.run.graph.nodes = stale.run.graph.nodes.filter((node) => node.id !== 'lion-final-trial-event');
    stale.run.currentNodeId = 'lion-reserve-trail';
    stale.currentNodeId = 'lion-reserve-trail';

    const migrated = migrateState(stale);
    expect(migrated.run.graph.nodes).toHaveLength(18);
    expect(migrated.run.currentNodeId).toBe('lion-reserve-trail');
    expect(migrated.flags.helpedRefugees).toBe(true);
    expect(migrated.run.temporaryLoot.gold).toBe(75);
  });

  it('banks temporary loot at a refuge and drops it after defeat', () => {
    const state = createInitialState();
    state.run = createRunState(8);
    const initialGold = state.gold;
    addTemporaryLoot(state.run, { gold: 45 });
    addTemporaryLoot(state.run, { category: 'consumables', itemId: 'potion', quantity: 2 });
    addTemporaryLoot(state.run, { category: 'materials', itemId: 'red_gem', quantity: 2 });
    secureRunLoot(state);
    expect(state.gold).toBe(initialGold + 45);
    expect(state.inventory.consumables.potion).toBe(5);
    expect(state.inventory.materials.red_gem).toBe(2);
    addTemporaryLoot(state.run, { gold: 30 });
    failRunToCheckpoint(state);
    expect(state.run.temporaryLoot.gold).toBe(0);
    expect(state.run.currentNodeId).toBe(state.run.checkpointNodeId);
  });
});
