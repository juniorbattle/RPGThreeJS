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

type RouteDifficulty = NonNullable<RunNode['difficulty']>;
type RouteMoralTone = NonNullable<RunNode['moralTone']>;

interface LionRouteNode {
  id: string;
  type: RunNodeType;
  depth: number;
  lane: number;
  contentId: string;
  label: string;
  icon: string;
  links: string[];
  risk: number;
  reward: number;
  difficulty: RouteDifficulty;
  moralTone: RouteMoralTone;
  hint: string;
}

const INTRIGUE_EVENTS = [
  'mystery_help',
  'mystery_recruit',
  'mystery_ambush',
  'serpent_duelist_trial',
  'mystery_troll_crossing',
  'mystery_dragon_roost',
  'mystery_treasure',
  'mystery_shrine',
] as const;

const LION_ROUTE_TEMPLATE: readonly LionRouteNode[] = [
  {
    id: 'lion-camp',
    type: 'story',
    depth: 0,
    lane: 0,
    contentId: 'camp_departure',
    label: 'Camp du Lion',
    icon: '◆',
    links: ['lion-opening-act'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'La compagnie se rassemble avant de demander le premier Sceau.',
  },
  {
    id: 'lion-opening-act',
    type: 'story',
    depth: 1,
    lane: 0,
    contentId: 'acte_ouverture',
    label: 'Acte I — L’Appel de l’Honneur',
    icon: '★',
    links: ['lion-audience'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Séraphine et Maelor présentent les enjeux et la mission du clan.',
  },
  {
    id: 'lion-audience',
    type: 'story',
    depth: 2,
    lane: 0,
    contentId: 'lion_briefing',
    label: 'Audience d’Alaric',
    icon: '♛',
    links: ['lion-refugees', 'lion-veiled-path'],
    risk: 0,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Recevoir la mission du Vieux Lion et choisir votre premier engagement.',
  },
  {
    id: 'lion-refugees',
    type: 'event',
    depth: 3,
    lane: -1,
    contentId: 'refugee_trial',
    label: 'Route des réfugiés',
    icon: '◇',
    links: ['lion-serpent-checkpoint', 'lion-intrigue-early'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Un détour plus lent qui teste votre compassion.',
  },
  {
    id: 'lion-patrol',
    type: 'combat',
    depth: 3,
    lane: 0,
    contentId: 'forest_patrol',
    label: 'Patrouille Serpent',
    icon: '⚔',
    links: ['lion-serpent-checkpoint', 'lion-intrigue-early'],
    risk: 2,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Une route directe, gardée par des éclaireurs ennemis.',
  },
  {
    id: 'lion-veiled-path',
    type: 'mystery',
    depth: 3,
    lane: 1,
    contentId: 'seeded-intrigue',
    label: 'Sentier voilé',
    icon: '?',
    links: ['lion-intrigue-early', 'lion-serpent-checkpoint'],
    risk: 2,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'mystery',
    hint: 'Un raccourci incertain : recrue, embuscade ou secret ancien.',
  },
  {
    id: 'lion-serpent-checkpoint',
    type: 'combat',
    depth: 4,
    lane: -0.65,
    contentId: 'serpent_checkpoint',
    label: 'Barrage des Serpents',
    icon: '⚔',
    links: ['lion-first-refuge'],
    risk: 2,
    reward: 3,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Un poste avancé protège la route de Bois-Clair.',
  },
  {
    id: 'lion-intrigue-early',
    type: 'mystery',
    depth: 4,
    lane: 0.65,
    contentId: 'seeded-intrigue',
    label: 'Intrigue des sous-bois',
    icon: '?',
    links: ['lion-first-refuge'],
    risk: 3,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'mystery',
    hint: 'Une situation secondaire peut renforcer ou salir votre réputation.',
  },
  {
    id: 'lion-first-refuge',
    type: 'refuge',
    depth: 5,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Refuge du Lion',
    icon: '⌂',
    links: ['lion-valmir-road', 'lion-reserve-trail'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Sécuriser le butin, acheter, améliorer et préparer Bois-Clair.',
  },
  {
    id: 'lion-valmir-road',
    type: 'combat',
    depth: 6,
    lane: -0.75,
    contentId: 'road_to_valmir',
    label: 'Route de Bois-Clair',
    icon: '⚔',
    links: ['lion-village-choice'],
    risk: 2,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'honour',
    hint: 'La voie la plus claire vers les habitants menacés.',
  },
  {
    id: 'lion-reserve-trail',
    type: 'event',
    depth: 6,
    lane: 0.75,
    contentId: 'reserve_trail',
    label: 'Chemin des réserves',
    icon: '◇',
    links: ['lion-village-choice'],
    risk: 2,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'greed',
    hint: 'Une route rentable, mais les villageois risquent d’en payer le prix.',
  },
  {
    id: 'lion-village-choice',
    type: 'story',
    depth: 7,
    lane: 0,
    contentId: 'village_choice',
    label: 'Bois-Clair assiégé',
    icon: '⌂',
    links: ['lion-second-refuge'],
    risk: 3,
    reward: 4,
    difficulty: 'decisive',
    moralTone: 'pragmatic',
    hint: 'Choisir ce qui sera sauvé : les habitants, les réserves, ou votre nom.',
  },
  {
    id: 'lion-second-refuge',
    type: 'refuge',
    depth: 8,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Dernier feu du Lion',
    icon: '⌂',
    links: ['lion-witnesses', 'lion-shadow-signs'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Dernière halte avant de faire rapport à Alaric.',
  },
  {
    id: 'lion-witnesses',
    type: 'event',
    depth: 9,
    lane: -0.75,
    contentId: 'witnesses_on_road',
    label: 'Témoins de Valmir',
    icon: '◇',
    links: ['lion-final-judgement'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Des survivants peuvent confirmer vos actes... ou votre abandon.',
  },
  {
    id: 'lion-shadow-signs',
    type: 'mystery',
    depth: 9,
    lane: 0.75,
    contentId: 'shadow_signs',
    label: 'Signes des Ombres',
    icon: '?',
    links: ['lion-final-judgement'],
    risk: 2,
    reward: 4,
    difficulty: 'dangerous',
    moralTone: 'mystery',
    hint: 'Une piste sombre relie les Serpents à une menace plus ancienne.',
  },
  {
    id: 'lion-final-judgement',
    type: 'boss',
    depth: 10,
    lane: 0,
    contentId: 'lion_finale_judgement',
    label: 'Jugement du Sceau',
    icon: '♛',
    links: [],
    risk: 3,
    reward: 3,
    difficulty: 'decisive',
    moralTone: 'pragmatic',
    hint: 'Alaric rend son verdict. Le Sceau sera accordé par respect ou par force.',
  },
];

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

function weightedIntrigue(random: () => number, reputation: number): string {
  const rule = getReputationRule(reputation);
  const weighted = INTRIGUE_EVENTS.map((id) => {
    const tag = id === 'mystery_ambush' || id === 'serpent_duelist_trial' || id === 'mystery_troll_crossing' || id === 'mystery_dragon_roost'
      ? 'hostile'
      : id === 'mystery_treasure'
        ? 'neutral'
        : 'helpful';
    return {
      id,
      weight: tag === 'hostile'
        ? rule.ambushWeightMultiplier
        : (rule.eventWeightModifiers[tag] ?? 1),
    };
  });
  const total = weighted.reduce((sum, candidate) => sum + candidate.weight, 0);
  let roll = random() * total;
  for (const candidate of weighted) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.id;
  }
  return weighted.at(-1)!.id;
}

function makeLionNode(template: LionRouteNode, random: () => number, reputation: number): RunNode {
  return {
    id: template.id,
    type: template.type,
    depth: template.depth,
    links: [...template.links],
    contentId: template.contentId === 'seeded-intrigue'
      ? weightedIntrigue(random, reputation)
      : template.contentId,
    label: template.label,
    icon: template.icon,
    x: (template.depth - 4.5) * 1.45,
    z: template.lane * 1.45,
    risk: template.risk,
    reward: template.reward,
    difficulty: template.difficulty,
    moralTone: template.moralTone,
    hint: template.hint,
  };
}

export function generateRunGraph(seed: number, reputation = 30): RunGraph {
  const random = seededRandom(seed);
  return {
    nodes: LION_ROUTE_TEMPLATE.map((node) => makeLionNode(node, random, reputation)),
  };
}

export function createRunState(seed = Date.now() & 0x7fffffff, reputation = 30): RunState {
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
      combatId: node.type === 'combat' ? node.contentId : undefined,
      dialogueId: ['event', 'mystery', 'recruitment', 'story', 'boss'].includes(node.type) ? node.contentId : undefined,
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
