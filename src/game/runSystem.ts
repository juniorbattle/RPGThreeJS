import type {
  CampaignNode, GameState, InventoryState, RunGraph, RunLoot, RunNode, RunNodeType, RunState, CombatResult,
} from './types';
import { getLionConductTier, type LionConductTier } from './lionNarrative';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { changeReputation } from './reputation';
import { LION_FIRST_TRIAL, LION_OPENING_LOCAL_ROUTES, openingLocalRoutesUnlocked, LION_POI_METADATA,
  type LionPoiRole, type LionPoiParticipation } from '../campaign/LionPoiTopology';
import { resolveOptionalEncounterIgnoreConsequence } from './OptionalEncounterConsequencePolicy';
import { LOT_E_POIS, LOT_E_ELITES, makeExpeditionNodes } from '../campaign/LionPoiAuthoring';
import { applyCombatProgress } from './combatProgress';
import { initialPoiExpedition, expeditionEdges, recordPoiMovement, eliteAtPoi,
  beginPoiEliteEncounter, settlePoiStep, selectPoiThreats, type PoiThreatView } from './poiExpedition';

export { getLionConductScore, getLionConductTier } from './lionNarrative';
export type { LionConductTier } from './lionNarrative';

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

type AdaptiveRouteVariant = Pick<
  LionRouteNode,
  'type' | 'contentId' | 'label' | 'icon' | 'risk' | 'reward' | 'difficulty' | 'moralTone' | 'hint'
>;

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
    links: ['lion-nomad-crossroads'],
    risk: 1,
    reward: 2,
    difficulty: 'standard',
    moralTone: 'neutral',
    hint: 'Des créatures affamées rôdent sur la première piste.',
  },
  {
    id: 'lion-nomad-crossroads',
    type: 'event',
    depth: 3,
    lane: 0,
    contentId: 'mystery_recruit',
    label: 'Croisement du rôdeur',
    icon: '◇',
    links: ['lion-refugees'],
    risk: 1,
    reward: 2,
    difficulty: 'safe',
    moralTone: 'pragmatic',
    hint: 'Un éclaireur nomade propose ses services à la compagnie.',
  },
  {
    id: 'lion-refugees',
    type: 'event',
    depth: 4,
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
    depth: 5,
    lane: -0.75,
    contentId: 'mystery_help',
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
    depth: 5,
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
    depth: 6,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Refuge du Lion',
    icon: '⌂',
    links: ['lion-reserve-trail'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Acheter, améliorer et préparer Bois-Clair.',
  },
  {
    id: 'lion-reserve-trail',
    type: 'event',
    depth: 7,
    lane: 0,
    contentId: 'reserve_trail',
    label: 'Chemin des réserves',
    icon: '◇',
    links: ['lion-valmir-road'],
    risk: 2,
    reward: 3,
    difficulty: 'dangerous',
    moralTone: 'greed',
    hint: 'Un convoi emporte les réserves de Bois-Clair tandis que le siège continue plus loin.',
  },
  {
    id: 'lion-valmir-road',
    type: 'combat',
    depth: 8,
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
    depth: 9,
    lane: -0.75,
    contentId: 'old_shrine_event',
    label: 'Vieux sanctuaire',
    icon: '◇',
    links: ['lion-village-choice'],
    risk: 1,
    reward: 3,
    difficulty: 'safe',
    moralTone: 'greed',
    hint: 'Un sanctuaire encore actif offre un abri sûr et un reliquaire plein de ressources.',
  },
  {
    id: 'lion-second-trial-combat',
    type: 'combat',
    depth: 9,
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
    depth: 10,
    lane: 0,
    contentId: 'village_choice',
    label: 'Bois-Clair assiégé',
    icon: '⌂',
    links: ['lion-second-refuge'],
    risk: 3,
    reward: 4,
    difficulty: 'decisive',
    moralTone: 'pragmatic',
    hint: 'Le village est divisé entre les captifs au nord et ses réserves vitales au sud.',
  },
  {
    id: 'lion-second-refuge',
    type: 'refuge',
    depth: 11,
    lane: 0,
    contentId: 'forest_refuge',
    label: 'Dernier feu du Lion',
    icon: '⌂',
    links: ['lion-lancer-recruit'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Dernière halte avant de rassembler les conséquences de vos actes.',
  },
  {
    id: 'lion-lancer-recruit',
    type: 'event',
    depth: 12,
    lane: 0,
    contentId: 'mystery_lancer_recruit',
    label: 'Volontaire de Bois-Clair',
    icon: '◇',
    links: ['lion-witnesses'],
    risk: 1,
    reward: 3,
    difficulty: 'safe',
    moralTone: 'honour',
    hint: 'Un jeune lancier de Bois-Clair veut voir ce que votre clan fera du Sceau.',
  },
  {
    id: 'lion-witnesses',
    type: 'event',
    depth: 13,
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
    depth: 14,
    lane: -0.75,
    contentId: 'mystery_dragon_roost',
    label: 'Nid du jeune dragon',
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
    depth: 14,
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
    depth: 15,
    lane: 0,
    contentId: 'shadow_signs',
    label: 'Signes des Ombres',
    icon: '?',
    links: ['lion-final-refuge'],
    risk: 2,
    reward: 4,
    difficulty: 'dangerous',
    moralTone: 'mystery',
    hint: 'Une piste sombre relie les Serpents à une menace plus ancienne.',
  },
  {
    id: 'lion-final-refuge',
    type: 'story',
    depth: 16,
    lane: 0,
    contentId: 'final_refuge',
    label: 'Refuge avant le Sceau',
    icon: '⌂',
    links: ['lion-final-judgement'],
    risk: 0,
    reward: 1,
    difficulty: 'safe',
    moralTone: 'neutral',
    hint: 'Rassembler le dossier complet avant de comparaître devant Alaric.',
  },
  {
    id: 'lion-final-judgement',
    type: 'boss',
    depth: 17,
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
    difficulty: 'safe', moralTone: 'honour', hint: 'Un voyageur blessé demande des ressources alors que Bois-Clair reste devant vous.',
  },
  uncertain: {
    type: 'event', contentId: 'mystery_help', label: 'Marchand blessé', icon: '◇', risk: 1, reward: 2,
    difficulty: 'safe', moralTone: 'pragmatic', hint: 'Un voyageur blessé demande des ressources alors que Bois-Clair reste devant vous.',
  },
  infamy: {
    type: 'event', contentId: 'mystery_treasure', label: 'Chariot abandonné', icon: '◇', risk: 1, reward: 3,
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Un chariot de réfugiés abandonné attend encore ses propriétaires — ou quelqu’un qui décidera à leur place.',
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
  difficulty: 'safe', moralTone: 'greed', hint: 'Un sanctuaire encore actif offre un abri sûr et un reliquaire plein de ressources.',
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
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Un jeune dragon protège des gemmes près de la route des ruines.',
  },
  uncertain: {
    type: 'event', contentId: 'mystery_dragon_roost', label: 'Nid du jeune dragon', icon: '◇', risk: 3, reward: 4,
    difficulty: 'dangerous', moralTone: 'greed', hint: 'Un jeune dragon protège des gemmes près de la route des ruines.',
  },
  infamy: {
    type: 'event', contentId: 'serpent_informant', label: 'Informateur traqué', icon: '◇', risk: 2, reward: 3,
    difficulty: 'dangerous', moralTone: 'pragmatic', hint: 'Un déserteur Serpent traqué propose des informations que ses anciens alliés veulent faire taire.',
  },
};

const MANDATE_FIRST_EVENT_HONOUR: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_help', label: 'Marchand blessé', icon: '◇', risk: 1, reward: 2,
  difficulty: 'safe', moralTone: 'honour', hint: 'Le mandat du Lion vous pousse vers Bois-Clair lorsqu’un voyageur blessé réclame du temps et des ressources.',
};

const MANDATE_FIRST_EVENT_ADVANCE: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_help', label: 'Marchand blessé', icon: '◇', risk: 1, reward: 2,
  difficulty: 'safe', moralTone: 'pragmatic', hint: 'L’avance du Lion sécurise vos réserves, mais un voyageur blessé réclame maintenant une part de ce soutien.',
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
  difficulty: 'safe', moralTone: 'greed', hint: 'Après l’épreuve élite, un autel de passage encore actif protège la route au prix de l’offrande qu’il enferme.',
};

const LANCER_RECRUIT_VARIANT: AdaptiveRouteVariant = {
  type: 'event', contentId: 'mystery_lancer_recruit', label: 'Volontaire de Bois-Clair', icon: '◇', risk: 1, reward: 3,
  difficulty: 'safe', moralTone: 'honour', hint: 'Un lancier de Bois-Clair veut décider lui-même ce que votre bannière mérite après le village.',
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
    return FIRST_EVENT_VARIANTS[tier] ?? null;
  }
  if (nodeId === 'lion-first-trial-combat') {
    if (mandateHonour) return MANDATE_FIRST_COMBAT_HONOUR;
    if (mandateAdvance) return MANDATE_FIRST_COMBAT_ADVANCE;
    return FIRST_COMBAT_VARIANTS[tier] ?? null;
  }
  if (nodeId === 'lion-second-trial-event') return SECOND_EVENT_VARIANT;
  if (nodeId === 'lion-second-trial-combat') {
    if (mandateAdvance) return MANDATE_SECOND_COMBAT_ADVANCE;
    return SECOND_COMBAT_VARIANTS[tier] ?? null;
  }
  if (nodeId === 'lion-final-trial-event') {
    return tier !== 'infamy' && completedEliteEncounter(state)
      ? FINAL_EVENT_AFTER_ELITE
      : FINAL_EVENT_VARIANTS[tier] ?? null;
  }
  if (nodeId === 'lion-final-trial-combat') return FINAL_COMBAT_VARIANTS[tier] ?? null;
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
            ? [...Object.values(FINAL_EVENT_VARIANTS), FINAL_EVENT_AFTER_ELITE, LANCER_RECRUIT_VARIANT] // Retained for legacy mysteryAssignments compatibility — do not use for new run generation.
            : nodeId === 'lion-final-trial-combat'
              ? Object.values(FINAL_COMBAT_VARIANTS)
              : [];
  return candidates.find((candidate) => candidate.contentId === contentId) ?? null;
}

function resolveAdaptiveNode(state: GameState, node: RunNode): RunNode {
  if (state.run.visitedNodeIds.includes(node.id)) return node;
  const assignment = state.mysteryAssignments[node.id];
  // The saved graph already carries the fully authored variant, including mandate-specific
  // hints. Content IDs can be shared by variants; rematching by ID would rewrite that data.
  if (assignment === node.contentId) return node;
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
    nodes: [...LION_ROUTE_TEMPLATE.map((node) => makeLionNode(node, seed)), ...makeExpeditionNodes(seed)],
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
    poiExpedition: initialPoiExpedition(),
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

export function getAvailableRunEdges(run: RunState): { fromNodeId: string; toNodeId: string }[] {
  const current = getRunNode(run);
  const expand = (fromNodeId: string, ids: readonly string[], seen = new Set<string>()): { fromNodeId: string; toNodeId: string }[] => {
    // Branch selection narrows the braid before following bypassed encounters.
    const selected = Object.values(run.traversalBranches ?? {}).find((id) => ids.includes(id));
    return (selected ? [selected] : ids).flatMap((id) => {
      if (seen.has(id)) return [];
      const nextSeen = new Set([...seen, id]);
      return run.bypassedRouteNodeIds?.includes(id)
        ? expand(id, getRunNode(run, id)?.links ?? [], nextSeen) : [{ fromNodeId, toNodeId: id }];
    });
  };
  return current ? expand(current.id, current.links) : [];
}

export function getAvailableRunNodes(source: RunState | GameState): RunNode[] {
  const state = 'run' in source ? source : null;
  const run: RunState = state ? state.run : source as RunState;
  return [...new Set(getAvailableRunEdges(run).map(edge => edge.toNodeId))]
      .map((id) => getRunNode(run, id))
      .filter((node): node is RunNode => Boolean(node))
      .map((node) => state ? resolveAdaptiveNode(state, node) : node);
}

/** Records road choice only. No visit, dialogue, reward, or current-node mutation. */
export function selectTraversalBranch(run: RunState, legId: string, nodeId: string): boolean {
  const leg = LION_TRAVERSAL_LEGS.find((candidate) => candidate.id === legId);
  const stage = leg?.stages.find((candidate) => candidate.mode === 'IN_TRAVERSAL_FORK' && candidate.nodeIds.includes(nodeId));
  if (!stage || run.traversalBranches?.[legId] || !getAvailableRunNodes(run).some((node) => node.id === nodeId)) return false;
  run.traversalBranches = { ...run.traversalBranches, [legId]: nodeId };
  if (!run.revealedNodeIds.includes(nodeId)) run.revealedNodeIds.push(nodeId);
  return true;
}

/** Canonical opt-out: advance route availability without pretending the event happened. */
export function bypassTraversalNode(run: RunState, legId: string, nodeId: string): boolean {
  const leg = LION_TRAVERSAL_LEGS.find((candidate) => candidate.id === legId);
  const stage = leg?.stages.find((candidate) => candidate.nodeIds.includes(nodeId));
  const optional = stage?.mode === 'OPTIONAL_INTERRUPT'
    || ((stage?.branchEncounterMode === 'OPTIONAL_INTERRUPT' || stage?.optionalBranchNodeIds?.includes(nodeId))
      && run.traversalBranches?.[legId] === nodeId);
  if (!optional || !getAvailableRunNodes(run).some((node) => node.id === nodeId)) return false;
  run.bypassedRouteNodeIds = [...new Set([...(run.bypassedRouteNodeIds ?? []), nodeId])];
  for (const node of getAvailableRunNodes(run)) {
    if (!run.revealedNodeIds.includes(node.id)) run.revealedNodeIds.push(node.id);
  }
  return true;
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

export type PoiStatus = 'available' | 'locked' | 'resolved' | 'neutralized';
export type PoiKind = 'primary' | 'mystery' | 'combat' | 'elite' | 'chest' | 'refuge';
export interface PoiMapNode extends RunNode {
  region: number;
  role: LionPoiRole;
  participation: LionPoiParticipation;
  status: PoiStatus;
  kind: PoiKind;
  reusable: boolean;
  canMove: boolean;
  canActivate: boolean;
  canBypass: boolean;
}
export interface PoiMapModel {
  currentNodeId: string;
  gold: number;
  temporaryGold: number;
  reputation: number;
  nodes: PoiMapNode[];
  edges: { from: string; to: string; unlocked: boolean }[];
  threats: PoiThreatView[];
  turn: number;
}

function poiForkChoice(state: GameState, leg: typeof LION_TRAVERSAL_LEGS[number], ids: readonly string[]): string | undefined {
  // A mere historical visit survives defeat and is not an irrevocable branch fact.
  return state.run.traversalBranches?.[leg.id]
    ?? ids.find(id => state.resolvedNodeIds.includes(id))
    // Old V6 interruptions may predate traversalBranches. Preserve their actual active encounter.
    ?? (ids.includes(state.run.currentNodeId) ? state.run.currentNodeId : undefined);
}

export function isPoiNeutralized(state: GameState, nodeId: string): boolean {
  return LION_TRAVERSAL_LEGS.some(leg => leg.stages.some(stage => {
    if (stage.mode !== 'IN_TRAVERSAL_FORK' || !stage.nodeIds.includes(nodeId)) return false;
    const choice = poiForkChoice(state, leg, stage.nodeIds);
    return Boolean(choice && stage.nodeIds.includes(choice) && choice !== nodeId);
  }));
}

/** Directed progression is preserved; this set does not use the reversible presentation edges. */
function unlockedPoiIds(state: GameState): Set<string> {
  const unlocked = new Set(state.run.graph.nodes.filter(n => n.depth === 0).map(n => n.id));
  // A legitimately earned old refuge stays earned, including pre-V2 optional-trial saves.
  for (const id of ['lion-first-refuge','lion-second-refuge']) {
    if (state.flags[`refugeSecured:${id}`] || state.resolvedNodeIds.includes(id)) unlocked.add(id);
  }
  if (openingLocalRoutesUnlocked(state.resolvedNodeIds)) {
    for (const edge of LION_OPENING_LOCAL_ROUTES) unlocked.add(edge.to);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of state.run.graph.nodes) {
      const cleared = node.depth === 0 || state.resolvedNodeIds.includes(node.id)
        || Boolean(poiOptionalLeg(node.id) && state.run.bypassedRouteNodeIds?.includes(node.id));
      if (!unlocked.has(node.id) || !cleared || isPoiNeutralized(state, node.id)) continue;
      for (const id of node.links) {
        if (id === 'lion-first-refuge' && !LION_FIRST_TRIAL.some(trial=>state.resolvedNodeIds.includes(trial))) continue;
        if (!unlocked.has(id)) { unlocked.add(id); changed = true; }
      }
    }
  }
  // Preserve an authentic old interrupted encounter, never infer its outcome.
  unlocked.add(state.run.currentNodeId);
  for (const poi of LOT_E_POIS) {
    if (poi.prerequisiteResolved.every(id => state.resolvedNodeIds.includes(id))) unlocked.add(poi.id);
  }
  return unlocked;
}

function poiOptionalLeg(nodeId: string): typeof LION_TRAVERSAL_LEGS[number] | undefined {
  // V2 requires an actual trial. The historical optional-trial bypass field is kept in V6
  // but cannot open the refuge or create a new bypass intent.
  if (LION_FIRST_TRIAL.includes(nodeId)) return undefined;
  return LION_TRAVERSAL_LEGS.find(leg => leg.stages.some(stage => stage.nodeIds.includes(nodeId)
    && (stage.mode === 'OPTIONAL_INTERRUPT' || stage.branchEncounterMode === 'OPTIONAL_INTERRUPT'
      || stage.optionalBranchNodeIds?.includes(nodeId))));
}

/** Read model uses existing authoritative adaptive assignments, never a presentation-owned variant. */
export function selectPoiMap(state: GameState): PoiMapModel {
  const unlocked = unlockedPoiIds(state);
  const current = getRunNode(state.run);
  const neighbors = new Set([
    ...(current?.links ?? []),
    ...state.run.graph.nodes.filter(n => n.links.includes(state.run.currentNodeId)).map(n => n.id),
  ]);
  const localEdges = [
    ...LION_OPENING_LOCAL_ROUTES.map(edge=>({...edge, unlocked:openingLocalRoutesUnlocked(state.resolvedNodeIds)})),
    ...expeditionEdges().map(edge=>({...edge, unlocked:unlocked.has(edge.from)&&unlocked.has(edge.to)})),
  ];
  for (const edge of localEdges.filter(e=>e.unlocked)) {
    if (edge.from===state.run.currentNodeId) neighbors.add(edge.to);
    if (edge.to===state.run.currentNodeId) neighbors.add(edge.from);
  }
  // An authored bypass contracts that optional edge, while the POI itself remains revisitable.
  const legitimateBypasses = (state.run.bypassedRouteNodeIds ?? []).filter(id=>poiOptionalLeg(id) && !isPoiNeutralized(state,id));
  // Geography is derived from durable bypass facts, never from the direction of the current
  // successor query. Each contracted connection remains available from either endpoint.
  const bypassEdges = state.run.graph.nodes.flatMap(origin=>getAvailableRunEdges({
    ...state.run, currentNodeId:origin.id, bypassedRouteNodeIds:legitimateBypasses,
  }).filter(edge=>edge.fromNodeId!==origin.id && legitimateBypasses.includes(edge.fromNodeId))
    .map(edge=>({fromNodeId:origin.id,toNodeId:edge.toNodeId})));
  for (const edge of bypassEdges) {
    if(edge.fromNodeId===state.run.currentNodeId)neighbors.add(edge.toNodeId);
    if(edge.toNodeId===state.run.currentNodeId)neighbors.add(edge.fromNodeId);
  }
  const nodes = state.run.graph.nodes.map(raw => {
    const active = state.run.status === 'active';
    const node = active && unlocked.has(raw.id) ? resolveAdaptiveNode(state, raw) : raw;
    const neutralized = isPoiNeutralized(state, node.id);
    const status: PoiStatus = state.resolvedNodeIds.includes(node.id) ? 'resolved'
      : neutralized ? 'neutralized' : unlocked.has(node.id) ? 'available' : 'locked';
    const reusable = node.type === 'refuge' && Boolean(state.flags[`refugeSecured:${node.id}`]);
    const kind: PoiKind = node.type === 'chest' ? 'chest' : node.type === 'refuge' ? 'refuge'
      : node.type === 'combat' ? (ELITE_ROUTE_CONTENT_IDS.has(node.contentId) ? 'elite' : 'combat')
      : node.type === 'story' || node.type === 'boss' ? 'primary' : 'mystery';
    const canMove = active && node.id !== state.run.currentNodeId && neighbors.has(node.id) && unlocked.has(node.id);
    const metadata=LION_POI_METADATA[node.id];
    return { ...node, region:metadata?.region??0,role:metadata?.role??'secondary',
      participation:metadata?.participation??'required',status, kind, reusable, canMove,
      canActivate: active && !neutralized && unlocked.has(node.id) && node.depth > 0 && (status === 'available' || reusable),
      canBypass: active && Boolean(poiOptionalLeg(node.id)) && !neutralized && status === 'available'
        && !state.run.bypassedRouteNodeIds?.includes(node.id) && (canMove || node.id === state.run.currentNodeId),
    };
  });
  const geography = {nodes, edges:[...state.run.graph.nodes.flatMap(n=>n.links.map(id=>({from:n.id,to:id,unlocked:unlocked.has(n.id)&&unlocked.has(id)}))),
    ...bypassEdges.map(edge=>({from:edge.fromNodeId,to:edge.toNodeId,unlocked:unlocked.has(edge.fromNodeId)&&unlocked.has(edge.toNodeId)})),
    ...localEdges.filter(edge=>!bypassEdges.some(b=>b.fromNodeId===edge.from&&b.toNodeId===edge.to))]};
  return {currentNodeId:state.run.currentNodeId, gold:state.gold, temporaryGold:state.run.temporaryLoot.gold,
    reputation:state.reputation, nodes,
    edges:geography.edges, threats:selectPoiThreats(state, geography), turn:state.run.poiExpedition?.turn??0,
  };
}

/** Revalidated movement/activation with authored optional bypass. Never grants resolution, loot or combat results. */
export function enterPoi(state: GameState, nodeId: string): { node: RunNode; activate: boolean; interception?:boolean } | null {
  if (state.run.status !== 'active' || state.run.poiExpedition?.encounter || state.run.poiExpedition?.pendingStep) return null;
  const map = selectPoiMap(state);
  const selected = map.nodes.find(n => n.id === nodeId);
  if (!selected || state.run.status !== 'active'
    || (!selected.canMove && !(nodeId === state.run.currentNodeId && selected.canActivate))) return null;
  const threat = eliteAtPoi(state, nodeId);
  if (threat) {
    beginPoiEliteEncounter(state,threat.id,'front',nodeId);
    return {node:getRunNode(state.run,nodeId)!,activate:false,interception:true};
  }
  // Choosing a direct local trial route ignores the compatible refugee encounter.
  // Its authored consequence belongs to this truth owner and is never a UI effect.
  if (LION_FIRST_TRIAL.includes(nodeId)
    && !state.resolvedNodeIds.includes('lion-refugees')) bypassPoi(state,'lion-refugees');
  const node = getRunNode(state.run, nodeId)!;
  const origin = map.nodes.find(n=>n.id===state.run.currentNodeId);
  recordPoiMovement(state,state.run.currentNodeId,nodeId,
    origin?.status==='resolved'||origin?.status==='neutralized'||origin?.id==='lion-camp');
  if (!isPoiNeutralized(state, nodeId)) {
    for (const leg of LION_TRAVERSAL_LEGS) for (const stage of leg.stages) {
      if (stage.mode === 'IN_TRAVERSAL_FORK' && stage.nodeIds.includes(nodeId)
        && !state.run.traversalBranches?.[leg.id]) {
        state.run.traversalBranches = {...state.run.traversalBranches, [leg.id]:nodeId};
      }
    }
  }
  state.run.currentNodeId = nodeId;
  state.currentNodeId = nodeId;
  if (!state.run.visitedNodeIds.includes(nodeId)) state.run.visitedNodeIds.push(nodeId);
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  for (const id of [nodeId,...node.links]) if (!state.run.revealedNodeIds.includes(id)) state.run.revealedNodeIds.push(id);
  if (selected.canActivate && selected.status === 'available') {
    state.stepCounter += 1;
    if (['event','mystery','recruitment'].includes(node.type) && !state.seenUniqueEvents.includes(node.contentId)) state.seenUniqueEvents.push(node.contentId);
  }
  return {node, activate:selected.canActivate};
}

/** Lifecycle boundary: arrival content is complete before a pending threat step is evaluated. */
export function settlePoiNavigation(state: GameState): void {
  settlePoiStep(state,selectPoiMap(state));
}

export function commitPoiEliteFight(state: GameState, encounterId: string): string|null {
  const encounter=state.run.poiExpedition?.encounter;
  const def=LOT_E_ELITES.find(def=>def.id===encounter?.eliteId);
  const elite=def&&state.run.poiExpedition?.elites[def.id];
  if (!encounter||encounter.id!==encounterId||!def||!elite?.active||elite.defeated
    ||state.run.status!=='active'||state.run.currentNodeId!==encounter.originNodeId) return null;
  encounter.phase='combat'; return def.combat.id;
}

/** A mobile tactical result cannot resolve any RunNode or execute a canonical narrative hook. */
export function resolvePoiEliteVictory(state: GameState, encounterId: string, result: CombatResult): boolean {
  const expedition=state.run.poiExpedition, encounter=expedition?.encounter;
  const def=LOT_E_ELITES.find(def=>def.id===encounter?.eliteId);
  const elite=def&&expedition?.elites[def.id];
  if (!result.victory||!encounter||encounter.id!==encounterId||encounter.phase!=='combat'
    ||!def||!elite?.active||elite.defeated||result.combatId!==def.combat.id||state.run.status!=='active') return false;
  applyCombatProgress(state,result,3);
  creditRunReward(state,{gold:def.combat.rewards.temporaryGold});
  for(const [itemId,quantity] of Object.entries(def.combat.rewards.materials))
    creditRunReward(state,{category:'materials',itemId,quantity});
  changeReputation(state,def.combat.rewards.reputation,`combat:${result.combatId}`);
  elite.defeated=true;elite.active=false;
  delete expedition!.encounter;
  return true;
}

/** Only authored optional events may be bypassed; this owner applies their existing once-only consequence. */
export function bypassPoi(state: GameState, nodeId: string): { legId: string; node: RunNode } | null {
  if (state.run.status !== 'active') return null;
  const model = selectPoiMap(state);
  if (!model.nodes.find(n=>n.id===nodeId)?.canBypass) return null;
  const leg = poiOptionalLeg(nodeId)!;
  const node = getRunNode(state.run,nodeId)!;
  const fork = leg.stages.find(s=>s.mode==='IN_TRAVERSAL_FORK' && s.nodeIds.includes(nodeId));
  if (fork && !state.run.traversalBranches?.[leg.id]) state.run.traversalBranches={...state.run.traversalBranches,[leg.id]:nodeId};
  state.run.bypassedRouteNodeIds=[...new Set([...(state.run.bypassedRouteNodeIds??[]),nodeId])];
  const consequence=resolveOptionalEncounterIgnoreConsequence(leg.id,node);
  if (consequence && !state.flags[consequence.flag]) {
    changeReputation(state,consequence.reputation,`traversal-ignore:${node.id}`);
    state.flags[consequence.flag]=true;
  }
  for(const id of node.links) if(!state.run.revealedNodeIds.includes(id))state.run.revealedNodeIds.push(id);
  return {legId:leg.id,node};
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

/** Consolidate only remaining legacy holdings; never advance a recovery marker. */
export function consolidateLegacyLoot(state: GameState): RunLoot {
  const secured = structuredClone(state.run.temporaryLoot);
  state.gold += secured.gold;
  for (const category of Object.keys(secured.inventory) as (keyof InventoryState)[]) {
    for (const [itemId, quantity] of Object.entries(secured.inventory[category])) {
      state.inventory[category][itemId] = (state.inventory[category][itemId] ?? 0) + quantity;
    }
  }
  state.run.temporaryLoot = { gold: 0, inventory: EMPTY_INVENTORY() };
  return secured;
}

/** Current reward owner; the old temporary pool is only a V6 compatibility field. */
export function creditRunReward(state: GameState, loot: {gold?: number; itemId?: string; category?: keyof InventoryState; quantity?: number}): void {
  consolidateLegacyLoot(state);
  if (loot.gold) state.gold += Math.max(0, loot.gold);
  if (loot.itemId && loot.category) state.inventory[loot.category][loot.itemId] =
    (state.inventory[loot.category][loot.itemId] ?? 0) + Math.max(0, loot.quantity ?? 1);
}

export function secureRunLoot(state: GameState): RunLoot {
  const secured = consolidateLegacyLoot(state);
  state.run.checkpointNodeId = state.run.currentNodeId;
  return secured;
}

/** Historical directed-checkpoint compatibility helper; production defeat uses SaveRepository. */
export function failRunToCheckpoint(state: GameState): void {
  const replayable = new Set<string>();
  const visit = (id: string) => {
    if (replayable.has(id)) return;
    replayable.add(id);
    getRunNode(state.run, id)?.links.forEach(visit);
  };
  getRunNode(state.run, state.run.checkpointNodeId)?.links.forEach(visit);
  if (state.run.bypassedRouteNodeIds) state.run.bypassedRouteNodeIds = state.run.bypassedRouteNodeIds.filter(id => !replayable.has(id));
  if (state.run.traversalBranches) state.run.traversalBranches = Object.fromEntries(
    Object.entries(state.run.traversalBranches).filter(([, id]) => !replayable.has(id)),
  );
  state.run.status = 'failed';
  state.run.currentNodeId = state.run.checkpointNodeId;
  state.run.temporaryLoot = { gold: 0, inventory: EMPTY_INVENTORY() };
  state.currentNodeId = state.run.checkpointNodeId;
  state.run.status = 'active';
  if (state.run.poiExpedition) {
    delete state.run.poiExpedition.pendingStep;
    delete state.run.poiExpedition.encounter;
    delete state.run.poiExpedition.previousSafeNodeId;
  }
}
