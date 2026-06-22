import type {
  CampaignNode, GameState, InventoryState, RunGraph, RunLoot, RunNode, RunNodeType, RunState,
} from './types';
import { getReputationRule } from './reputation';

const EMPTY_INVENTORY = (): InventoryState => ({
  consumables: {},
  accessories: {},
  materials: {},
  weapons: {},
});

const NODE_POOLS: Record<RunNodeType, string[]> = {
  combat: ['forest_patrol', 'forest_ambush', 'village_defense'],
  event: ['mystery_help', 'mystery_treasure', 'mystery_shrine'],
  mystery: ['mystery_treasure', 'mystery_shrine', 'mystery_ambush'],
  recruitment: ['mystery_recruit'],
  shop: ['valmir'],
  refuge: ['forest_refuge'],
  story: ['lion_intro', 'lion_oath', 'village_choice'],
  boss: ['lion_chief'],
};

const LABELS: Record<RunNodeType, string[]> = {
  combat: ['Escarmouche', 'Patrouille ennemie', 'Lisière assiégée'],
  event: ['Rencontre sur la route', 'Appel dans les bois', 'Vestiges oubliés'],
  mystery: ['Sentier voilé', 'Clairière inconnue', 'Signe inquiétant'],
  recruitment: ['Voyageur solitaire'],
  shop: ['Marchand itinérant'],
  refuge: ['Refuge du Lion'],
  story: ['Serment sur la route', 'Écho de la chronique', 'Choix décisif'],
  boss: ['Porte du Sceau'],
};

const ICONS: Record<RunNodeType, string> = {
  combat: '⚔', event: '◇', mystery: '?', recruitment: '♟',
  shop: '¤', refuge: '⌂', story: '◆', boss: '♛',
};

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0]!;
}

function weightedContent(type: RunNodeType, random: () => number, reputation: number): string {
  if (type !== 'event' && type !== 'mystery') return pick(NODE_POOLS[type], random);
  const rule = getReputationRule(reputation);
  const candidates = type === 'mystery'
    ? [
      { id: 'mystery_ambush', tag: 'hostile' },
      { id: 'mystery_treasure', tag: 'neutral' },
      { id: 'mystery_shrine', tag: 'helpful' },
    ]
    : [
      { id: 'mystery_help', tag: 'helpful' },
      { id: 'mystery_treasure', tag: 'neutral' },
      { id: 'mystery_shrine', tag: 'helpful' },
    ];
  const weighted = candidates.map((candidate) => ({
    ...candidate,
    weight: candidate.tag === 'hostile'
      ? rule.ambushWeightMultiplier
      : (rule.eventWeightModifiers[candidate.tag] ?? 1),
  }));
  const total = weighted.reduce((sum, candidate) => sum + candidate.weight, 0);
  let roll = random() * total;
  for (const candidate of weighted) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.id;
  }
  return weighted.at(-1)!.id;
}

function makeNode(
  id: string,
  type: RunNodeType,
  depth: number,
  lane: number,
  random: () => number,
  reputation: number,
): RunNode {
  return {
    id,
    type,
    depth,
    links: [],
    contentId: weightedContent(type, random, reputation),
    label: pick(LABELS[type], random),
    icon: ICONS[type],
    x: (depth - 5.5) * 1.55,
    z: lane * 1.45,
  };
}

function connect(nodes: RunNode[], fromIds: string[], toIds: string[]): void {
  for (let index = 0; index < fromIds.length; index += 1) {
    const node = nodes.find((candidate) => candidate.id === fromIds[index]);
    if (!node) continue;
    node.links = toIds.length === 1
      ? [...toIds]
      : [toIds[index % toIds.length]!, toIds[(index + 1) % toIds.length]!];
  }
}

export function generateRunGraph(seed: number, reputation = 50): RunGraph {
  const random = seededRandom(seed);
  const nodes: RunNode[] = [];
  const layers: string[][] = [];
  const layout: Array<Array<{ type: RunNodeType; lane: number }>> = [
    [{ type: 'story', lane: 0 }],
    [{ type: 'event', lane: -1 }, { type: 'combat', lane: 1 }],
    [{ type: 'combat', lane: -1 }, { type: 'mystery', lane: 1 }],
    [{ type: 'shop', lane: -1 }, { type: 'recruitment', lane: 1 }],
    [{ type: 'refuge', lane: 0 }],
    [{ type: 'combat', lane: -1 }, { type: 'event', lane: 1 }],
    [{ type: 'mystery', lane: -1 }, { type: 'combat', lane: 1 }],
    [{ type: 'shop', lane: -1 }, { type: 'story', lane: 1 }],
    [{ type: 'refuge', lane: 0 }],
    [{ type: 'combat', lane: -1 }, { type: 'event', lane: 1 }],
    [{ type: 'mystery', lane: -1 }, { type: 'combat', lane: 1 }],
    [{ type: 'boss', lane: 0 }],
  ];

  layout.forEach((layer, depth) => {
    const ids: string[] = [];
    layer.forEach((entry, index) => {
      const id = `run-${depth}-${index}`;
      ids.push(id);
      nodes.push(makeNode(id, entry.type, depth, entry.lane, random, reputation));
    });
    layers.push(ids);
  });
  for (let depth = 0; depth < layers.length - 1; depth += 1) {
    connect(nodes, layers[depth]!, layers[depth + 1]!);
  }
  return { nodes };
}

export function createRunState(seed = Date.now() & 0x7fffffff, reputation = 50): RunState {
  const graph = generateRunGraph(seed, reputation);
  const start = graph.nodes.find((node) => node.depth === 0)!;
  return {
    id: `lion-${seed}`,
    seed,
    regionId: 'lion-forest',
    status: 'active',
    currentNodeId: start.id,
    checkpointNodeId: start.id,
    revealedNodeIds: [start.id, ...start.links],
    visitedNodeIds: [start.id],
    temporaryLoot: { gold: 0, inventory: EMPTY_INVENTORY() },
    graph,
  };
}

export function getRunNode(run: RunState, nodeId = run.currentNodeId): RunNode | undefined {
  return run.graph.nodes.find((node) => node.id === nodeId);
}

export function toCampaignNodes(run: RunState): CampaignNode[] {
  return run.graph.nodes.map((node) => {
    const type: CampaignNode['type'] = node.type === 'combat'
      ? 'random-combat'
      : node.type === 'boss'
        ? 'boss'
        : node.type === 'shop'
          ? 'shop'
          : node.type === 'mystery' || node.type === 'event' || node.type === 'recruitment'
            ? 'mystery'
            : 'story';
    return {
      id: node.id,
      type,
      x: node.x,
      z: node.z,
      icon: node.icon,
      label: node.label,
      links: node.links,
      combatId: node.type === 'combat' || node.type === 'boss' ? node.contentId : undefined,
      dialogueId: ['event', 'mystery', 'recruitment', 'story'].includes(node.type) ? node.contentId : undefined,
      shopId: node.type === 'shop' ? node.contentId : undefined,
    };
  });
}

export function getAvailableRunNodes(run: RunState): RunNode[] {
  const current = getRunNode(run);
  return current
    ? current.links
      .map((id) => getRunNode(run, id))
      .filter((node): node is RunNode => Boolean(node))
    : [];
}

export function enterRunNode(run: RunState, nodeId: string): RunNode | null {
  const available = getAvailableRunNodes(run);
  const next = available.find((node) => node.id === nodeId);
  if (!next) return null;
  run.currentNodeId = next.id;
  if (!run.visitedNodeIds.includes(next.id)) run.visitedNodeIds.push(next.id);
  for (const id of [next.id, ...next.links]) {
    if (!run.revealedNodeIds.includes(id)) run.revealedNodeIds.push(id);
  }
  return next;
}

export function addTemporaryLoot(
  run: RunState,
  loot: { gold?: number; itemId?: string; category?: keyof InventoryState; quantity?: number },
): void {
  if (loot.gold) run.temporaryLoot.gold += Math.max(0, loot.gold);
  if (!loot.itemId || !loot.category) return;
  const quantity = Math.max(0, loot.quantity ?? 1);
  run.temporaryLoot.inventory[loot.category][loot.itemId] =
    (run.temporaryLoot.inventory[loot.category][loot.itemId] ?? 0) + quantity;
}

export function secureRunLoot(state: GameState): RunLoot {
  const secured = structuredClone(state.run.temporaryLoot);
  state.gold += secured.gold;
  for (const category of Object.keys(secured.inventory) as (keyof InventoryState)[]) {
    for (const [itemId, quantity] of Object.entries(secured.inventory[category])) {
      state.inventory[category][itemId] = (state.inventory[category][itemId] ?? 0) + quantity;
    }
  }
  state.run.temporaryLoot = { gold: 0, inventory: EMPTY_INVENTORY() };
  state.run.checkpointNodeId = state.run.currentNodeId;
  return secured;
}

export function failRunToCheckpoint(state: GameState): void {
  state.run.status = 'failed';
  state.run.currentNodeId = state.run.checkpointNodeId;
  state.run.temporaryLoot = { gold: 0, inventory: EMPTY_INVENTORY() };
  state.currentNodeId = state.run.checkpointNodeId;
  state.run.status = 'active';
}
