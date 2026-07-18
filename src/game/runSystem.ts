import type {
  CampaignNode, GameState, InventoryState, RunGraph, RunLoot, RunNode, RunNodeType, RunState,
} from './types';

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

export type LionConductTier = 'honour' | 'uncertain' | 'infamy';

type AdaptiveRouteVariant = Pick<
  LionRouteNode,
  'type' | 'contentId' | 'label' | 'icon' | 'risk' | 'reward' | 'difficulty' | 'moralTone' | 'hint'
>;

const LION_CONDUCT_FLAG_WEIGHTS: Readonly<Record<string, number>> = {
  helpedRefugees: 2,
  exploitedRefugees: -2,
  alaricDoubt: -1,
  lionMandateHonour: 1,
  helpedMerchant: 1,
  abandonedMerchant: -1,
  recruitedCedric: 1,
  recruitedLancer: 1,
  returnedLostTreasure: 1,
  claimedLostTreasure: -1,
  prioritizedVillage: 1,
  prioritizedLoot: -1,
  shrineRested: 1,
  shrineLooted: -1,
  preservedShrine: 1,
  desecratedShrine: -1,
  missionSuccess: 2,
  missionGreed: -2,
  protectedWitnesses: 1,
  silencedWitnesses: -1,
  protectedInformant: 1,
  betrayedInformant: -1,
  shadowEvidence: 1,
  shadowFragments: -1,
};

export function getLionConductScore(flags: Record<string, boolean>): number {
  return Object.entries(LION_CONDUCT_FLAG_WEIGHTS).reduce(
    (score, [flag, weight]) => score + (flags[flag] ? weight : 0),
    0,
  );
}

export function getLionConductTier(flags: Record<string, boolean>): LionConductTier {
  const score = getLionConductScore(flags);
  if (score >= 2) return 'honour';
  if (score <= -2) return 'infamy';
  return 'uncertain';
}

const LION_ROUTE_TEMPLATE: readonly LionRouteNode[] = [
  {
    id: 'lion-camp',
    type: 'story',
    depth: 0,
    lane: 0,
    contentId: 'camp_departure',
    label: 'Camp du Lion',
    icon: '◆',
    links: ['lion-audience'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'La compagnie se rassemble avant de demander le premier Sceau.',
  },
  {
    id: 'lion-audience',
    type: 'story',
    depth: 1,
    lane: 0,
    contentId: 'lion_briefing',
    label: 'Audience d’Alaric',
    icon: '♛',
    links: ['lion-opening-ambush'],
    risk: 0,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Recevoir la mission du Vieux Lion avant de prendre la route.',
  },
  {
    id: 'lion-opening-ambush',
    type: 'combat',
    depth: 2,
    lane: 0,
    contentId: 'forest_ambush',
    label: 'Piste des bêtes',
    icon: '⚔',
    links: ['lion-refugees'],
    risk: 1,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Des créatures affamées rôdent sur la première piste.',
  },
  {
    id: 'lion-refugees',
    type: 'event',
    depth: 3,
    lane: 0,
    contentId: 'refugee_trial',
    label: 'Route des réfugiés',
    icon: '◇',
    links: ['lion-first-trial-event', 'lion-first-trial-combat'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Des familles affamées mettent votre parole à l’épreuve.',
  },
  {
    id: 'lion-first-trial-event',
    type: 'event',
    depth: 4,
    lane: -0.75,
    contentId: 'mystery_recruit',
    label: 'Rencontre sur la route',
    icon: '◇',
    links: ['lion-first-refuge'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'pragmatic',
    hint: 'Une rencontre peut renforcer la compagnie ou éprouver sa conduite.',
  },
  {
    id: 'lion-first-trial-combat',
    type: 'combat',
    depth: 4,
    lane: 0.75,
    contentId: 'forest_patrol',
    label: 'Piste contestée',
    icon: '⚔',
    links: ['lion-first-refuge'],
    risk: 2,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Un affrontement direct permet de sécuriser le chemin du refuge.',
  },
  {
    id: 'lion-first-refuge',
    type: 'refuge',
    depth: 5,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Refuge du Lion',
    icon: '⌂',
    links: ['lion-reserve-trail'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Sécuriser le butin, acheter, améliorer et préparer Bois-Clair.',
  },
  {
    id: 'lion-reserve-trail',
    type: 'event',
    depth: 6,
    lane: 0,
    contentId: 'reserve_trail',
    label: 'Chemin des réserves',
    icon: '◇',
    links: ['lion-valmir-road'],
    risk: 2,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'greed',
    hint: 'Les réserves de Bois-Clair opposent urgence et appât du gain.',
  },
  {
    id: 'lion-valmir-road',
    type: 'combat',
    depth: 7,
    lane: 0,
    contentId: 'road_to_valmir',
    label: 'Route de Bois-Clair',
    icon: '⚔',
    links: ['lion-second-trial-event', 'lion-second-trial-combat'],
    risk: 2,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Des créatures ont envahi la voie menant aux habitants menacés.',
  },
  {
    id: 'lion-second-trial-event',
    type: 'event',
    depth: 8,
    lane: -0.75,
    contentId: 'old_shrine_event',
    label: 'Vieux sanctuaire',
    icon: '◇',
    links: ['lion-village-choice'],
    risk: 1,
    reward: 3,
    difficulty: 'safe',
    moralTone: 'greed',
    hint: 'Un sanctuaire oublié offre repos ou richesse.',
  },
  {
    id: 'lion-second-trial-combat',
    type: 'combat',
    depth: 8,
    lane: 0.75,
    contentId: 'serpent_checkpoint',
    label: 'Barrage renforcé',
    icon: '⚔',
    links: ['lion-village-choice'],
    risk: 3,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'neutral',
    hint: 'Après le refuge, la compagnie peut affronter une opposition plus dangereuse.',
  },
  {
    id: 'lion-village-choice',
    type: 'story',
    depth: 9,
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
    depth: 10,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Dernier feu du Lion',
    icon: '⌂',
    links: ['lion-witnesses'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Dernière halte avant de rassembler les conséquences de vos actes.',
  },
  {
    id: 'lion-witnesses',
    type: 'event',
    depth: 11,
    lane: 0,
    contentId: 'witnesses_on_road',
    label: 'Témoins de Bois-Clair',
    icon: '◇',
    links: ['lion-final-trial-event', 'lion-final-trial-combat'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Les survivants peuvent confirmer vos actes ou dénoncer votre abandon.',
  },
  {
    id: 'lion-final-trial-event',
    type: 'event',
    depth: 12,
    lane: -0.75,
    contentId: 'mystery_dragon_roost',
    label: 'Dernière tentation',
    icon: '◇',
    links: ['lion-shadow-signs'],
    risk: 2,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'greed',
    hint: 'Une dernière rencontre mesure ce que vaut encore votre parole.',
  },
  {
    id: 'lion-final-trial-combat',
    type: 'combat',
    depth: 12,
    lane: 0.75,
    contentId: 'ruins_guardians',
    label: 'Ruines infestées',
    icon: '⚔',
    links: ['lion-shadow-signs'],
    risk: 2,
    reward: 3,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Un dernier passage hostile mène aux traces laissées par les Ombres.',
  },
  {
    id: 'lion-shadow-signs',
    type: 'mystery',
    depth: 13,
    lane: 0,
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
    depth: 14,
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

const FIRST_EVENT_VARIANTS: Readonly<Record<LionConductTier, AdaptiveRouteVariant>> = {
  honour: {
    type: 'event', contentId: 'mystery_help', label: 'Marchand blessé', icon: '◇', risk: 1, reward: 2,
    difficulty: 'safe', moralTone: 'honour', hint: 'Aider un voyageur éprouve la générosité de la compagnie.',
  },
  uncertain: {
    type: 'event', contentId: 'mystery_recruit', label: 'Éclaireur nomade', icon: '◇', risk: 1, reward: 2,
    difficulty: 'safe', moralTone: 'pragmatic', hint: 'Un éclaireur propose son arc contre une part de vos réserves.',
  },
  infamy: {
    type: 'event', contentId: 'mystery_treasure', label: 'Chariot abandonné', icon: '◇', risk: 1, reward: 3,
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Des biens perdus peuvent être rendus ou ajoutés à votre butin.',
  },
};

const FIRST_COMBAT_VARIANTS: Readonly<Record<LionConductTier, AdaptiveRouteVariant>> = {
  honour: {
    type: 'combat', contentId: 'spider_nest', label: 'Nid venimeux', icon: '⚔', risk: 2, reward: 2,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Des créatures venimeuses ont envahi le sentier du refuge.',
  },
  uncertain: {
    type: 'combat', contentId: 'forest_patrol', label: 'Patrouille Serpent', icon: '⚔', risk: 2, reward: 2,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Des éclaireurs Serpent surveillent la route sans renfort élite.',
  },
  infamy: {
    type: 'combat', contentId: 'serpent_reprisals', label: 'Premières représailles', icon: '⚔', risk: 2, reward: 2,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Les Serpents profitent de votre réputation fragile pour frapper.',
  },
};

const SECOND_EVENT_VARIANT: AdaptiveRouteVariant = {
  type: 'event', contentId: 'old_shrine_event', label: 'Vieux sanctuaire', icon: '◇', risk: 1, reward: 3,
  difficulty: 'safe', moralTone: 'greed', hint: 'Un sanctuaire oublié offre repos ou richesse.',
};

const SECOND_COMBAT_VARIANTS: Readonly<Record<LionConductTier, AdaptiveRouteVariant>> = {
  honour: {
    type: 'combat', contentId: 'troll_crossing', label: 'Passage du troll', icon: '⚔', risk: 3, reward: 4,
    difficulty: 'dangerous', moralTone: 'honour', hint: 'Une élite monstrueuse garde les réserves volées de Bois-Clair.',
  },
  uncertain: {
    type: 'combat', contentId: 'serpent_checkpoint', label: 'Barrage renforcé', icon: '⚔', risk: 2, reward: 3,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Une troupe Serpent ordinaire verrouille la route du village.',
  },
  infamy: {
    type: 'combat', contentId: 'serpent_duelist_trial', label: 'Duelliste des représailles', icon: '⚔', risk: 3, reward: 4,
    difficulty: 'dangerous', moralTone: 'neutral', hint: 'Un combattant élite a été envoyé pour punir votre conduite.',
  },
};

const FINAL_EVENT_VARIANTS: Readonly<Record<LionConductTier, AdaptiveRouteVariant>> = {
  honour: {
    type: 'event', contentId: 'mystery_dragon_roost', label: 'Nid du jeune dragon', icon: '◇', risk: 3, reward: 4,
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Une dernière tentation oppose les gemmes à la retenue.',
  },
  uncertain: {
    type: 'event', contentId: 'mystery_dragon_roost', label: 'Nid du jeune dragon', icon: '◇', risk: 3, reward: 4,
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Une dernière tentation oppose les gemmes à la retenue.',
  },
  infamy: {
    type: 'event', contentId: 'serpent_informant', label: 'Informateur traqué', icon: '◇', risk: 2, reward: 3,
    difficulty: 'dangerous', moralTone: 'pragmatic', hint: 'Protéger ou vendre un informateur déterminera votre dernier témoignage.',
  },
};

const MANDATE_FIRST_EVENT_HONOUR: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_help', label: 'Marchand blessé', icon: '◇', risk: 1, reward: 2,
  difficulty: 'safe', moralTone: 'honour', hint: 'Le mandat du Lion vous appelle à secourir les voyageurs de la route.',
};

const MANDATE_FIRST_EVENT_ADVANCE: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_recruit', label: 'Éclaireur nomade', icon: '◇', risk: 1, reward: 2,
  difficulty: 'safe', moralTone: 'pragmatic', hint: 'L’avance du Lion attire les pragmatiques — un éclaireur propose ses services.',
};

const MANDATE_FIRST_COMBAT_HONOUR: AdaptiveRouteVariant = {
  type: 'combat', contentId: 'spider_nest', label: 'Nid venimeux', icon: '⚔', risk: 2, reward: 2,
  difficulty: 'standard', moralTone: 'neutral', hint: 'Des créatures venimeuses bloquent le sentier mandaté par le Lion.',
};

const MANDATE_FIRST_COMBAT_ADVANCE: AdaptiveRouteVariant = {
  type: 'combat', contentId: 'serpent_reprisals', label: 'Représailles anticipées', icon: '⚔', risk: 2, reward: 2,
  difficulty: 'standard', moralTone: 'neutral', hint: 'Les Serpents ont vent de votre avance — ils frappent plus tôt que prévu.',
};

const MANDATE_SECOND_COMBAT_ADVANCE: AdaptiveRouteVariant = {
  type: 'combat', contentId: 'serpent_checkpoint', label: 'Barrage préparé', icon: '⚔', risk: 2, reward: 3,
  difficulty: 'standard', moralTone: 'neutral', hint: 'L’avance du Lion a mis les Serpents en alerte — le barrage est renforcé.',
};

const FINAL_EVENT_AFTER_ELITE: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_shrine', label: 'Autel des voyageurs', icon: '◇', risk: 1, reward: 3,
  difficulty: 'safe', moralTone: 'greed', hint: 'Après l’épreuve élite, un dernier autel mesure votre retenue.',
};

const LANCER_RECRUIT_VARIANT: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_lancer_recruit', label: 'Volontaire de Bois-Clair', icon: '◇', risk: 1, reward: 3,
  difficulty: 'safe', moralTone: 'honour', hint: 'Un jeune lancier de Bois-Clair offre sa lance au clan.',
};

const FINAL_COMBAT_VARIANTS: Readonly<Record<LionConductTier, AdaptiveRouteVariant>> = {
  honour: {
    type: 'combat', contentId: 'ruins_guardians', label: 'Ruines infestées', icon: '⚔', risk: 2, reward: 3,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Des monstres occupent le passage vers les traces des Ombres.',
  },
  uncertain: {
    type: 'combat', contentId: 'ruins_guardians', label: 'Ruines infestées', icon: '⚔', risk: 2, reward: 3,
    difficulty: 'standard', moralTone: 'neutral', hint: 'Des monstres occupent le passage vers les traces des Ombres.',
  },
  infamy: {
    type: 'combat', contentId: 'serpent_hunters', label: 'Chasseurs Serpent', icon: '⚔', risk: 3, reward: 3,
    difficulty: 'dangerous', moralTone: 'neutral', hint: 'Une seconde troupe de représailles ferme la route du retour.',
  },
};

const SEEDED_CREATURE_VARIANTS: Readonly<Record<string, readonly string[]>> = {
  'lion-opening-ambush': ['forest_ambush', 'wolf_pack'],
  'lion-valmir-road': ['road_to_valmir', 'marsh_crossing'],
};

const ELITE_ROUTE_CONTENT_IDS = new Set(['troll_crossing', 'serpent_duelist_trial', 'young_dragon_roost']);

function completedEliteEncounter(state: GameState): boolean {
  const resolved = new Set(state.resolvedNodeIds);
  return state.run.graph.nodes.some((node) => resolved.has(node.id) && ELITE_ROUTE_CONTENT_IDS.has(node.contentId));
}

function selectAdaptiveVariant(state: GameState, nodeId: string): AdaptiveRouteVariant | null {
  const tier = getLionConductTier(state.flags);
  const mandateHonour = !!state.flags.lionMandateHonour;
  const mandateAdvance = !!state.flags.lionMandateAdvance;
  if (nodeId === 'lion-first-trial-event') {
    if (mandateHonour) return MANDATE_FIRST_EVENT_HONOUR;
    if (mandateAdvance) return MANDATE_FIRST_EVENT_ADVANCE;
    return FIRST_EVENT_VARIANTS[tier];
  }
  if (nodeId === 'lion-first-trial-combat') {
    if (mandateHonour) return MANDATE_FIRST_COMBAT_HONOUR;
    if (mandateAdvance) return MANDATE_FIRST_COMBAT_ADVANCE;
    return FIRST_COMBAT_VARIANTS[tier];
  }
  if (nodeId === 'lion-second-trial-event') return SECOND_EVENT_VARIANT;
  if (nodeId === 'lion-second-trial-combat') {
    if (mandateAdvance) return MANDATE_SECOND_COMBAT_ADVANCE;
    return SECOND_COMBAT_VARIANTS[tier];
  }
  if (nodeId === 'lion-final-trial-event') {
    if (mandateHonour && state.flags.missionSuccess) return LANCER_RECRUIT_VARIANT;
    return tier !== 'infamy' && completedEliteEncounter(state) ? FINAL_EVENT_AFTER_ELITE : FINAL_EVENT_VARIANTS[tier];
  }
  if (nodeId === 'lion-final-trial-combat') return FINAL_COMBAT_VARIANTS[tier];
  return null;
}

function adaptiveVariantByContentId(nodeId: string, contentId: string): AdaptiveRouteVariant | null {
  const candidates = nodeId === 'lion-first-trial-event'
    ? [...Object.values(FIRST_EVENT_VARIANTS), MANDATE_FIRST_EVENT_HONOUR, MANDATE_FIRST_EVENT_ADVANCE]
    : nodeId === 'lion-first-trial-combat'
      ? [...Object.values(FIRST_COMBAT_VARIANTS), MANDATE_FIRST_COMBAT_HONOUR, MANDATE_FIRST_COMBAT_ADVANCE]
      : nodeId === 'lion-second-trial-event'
        ? [SECOND_EVENT_VARIANT]
        : nodeId === 'lion-second-trial-combat'
          ? [...Object.values(SECOND_COMBAT_VARIANTS), MANDATE_SECOND_COMBAT_ADVANCE]
          : nodeId === 'lion-final-trial-event'
            ? [...Object.values(FINAL_EVENT_VARIANTS), FINAL_EVENT_AFTER_ELITE, LANCER_RECRUIT_VARIANT]
            : nodeId === 'lion-final-trial-combat'
              ? Object.values(FINAL_COMBAT_VARIANTS)
              : [];
  return candidates.find((candidate) => candidate.contentId === contentId) ?? null;
}

function resolveAdaptiveNode(state: GameState, node: RunNode): RunNode {
  if (state.run.visitedNodeIds.includes(node.id)) return node;
  const assignment = state.mysteryAssignments[node.id];
  const variant = (assignment ? adaptiveVariantByContentId(node.id, assignment) : null)
    ?? selectAdaptiveVariant(state, node.id);
  if (!variant) return node;
  Object.assign(node, variant);
  state.mysteryAssignments[node.id] = variant.contentId;
  return node;
}

function makeLionNode(template: LionRouteNode, seed: number): RunNode {
  const creatureVariants = SEEDED_CREATURE_VARIANTS[template.id];
  const contentId = creatureVariants
    ? creatureVariants[((seed >>> 0) + template.depth) % creatureVariants.length]!
    : template.contentId;
  return {
    id: template.id,
    type: template.type,
    depth: template.depth,
    links: [...template.links],
    contentId,
    label: template.label,
    icon: template.icon,
    x: (template.depth - 7.5) * 1.25,
    z: template.lane * 1.45,
    risk: template.risk,
    reward: template.reward,
    difficulty: template.difficulty,
    moralTone: template.moralTone,
    hint: template.hint,
  };
}

export function generateRunGraph(seed: number): RunGraph {
  return {
    nodes: LION_ROUTE_TEMPLATE.map((node) => makeLionNode(node, seed)),
  };
}

export function createRunState(seed = Date.now() & 0x7fffffff): RunState {
  const graph = generateRunGraph(seed);
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

export function getAvailableRunNodes(source: RunState | GameState): RunNode[] {
  const state = 'run' in source ? source : null;
  const run: RunState = state ? state.run : source as RunState;
  const current = getRunNode(run);
  return current
    ? current.links
      .map((id) => getRunNode(run, id))
      .filter((node): node is RunNode => Boolean(node))
      .map((node) => state ? resolveAdaptiveNode(state, node) : node)
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
