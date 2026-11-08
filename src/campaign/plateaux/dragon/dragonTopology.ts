/**
 * Set 1.20.0, post-demo Lot 2 — DRAFT, not canon until the operator approves the Dragon plateau.
 *
 * The Dragon plateau (roadmap §3.3): the Pics Célestes, the Ancien Dragon Kaelen, the Cristal d'Écho stolen by the Clan
 * du Loup. It follows the Bear's template (the Lion's size): 21 canonical nodes in three regions, three exclusive forks
 * with branch commitment, refuges, 12 optional POIs and two stationary guardians posted on optional chests. Place names
 * are descriptive only: no place, clan, character or object outside the roadmap, its status, the facts already
 * established and the operator's decisions. Data only: nothing here imports RunSystem.
 */
import type { EliteDefinition, FixedPoiDefinition } from '../../LionPoiAuthoring';
import type { PlateauLeg, PlateauPoiMetadata, PlateauRouteNode, PlateauTopology } from '../PlateauTopology';

type Node = PlateauRouteNode;
const node = (value: Node): Node => Object.freeze({ ...value, links: [...value.links] });

export const DRAGON_ROUTE: readonly Node[] = Object.freeze([
  node({ id: 'dragon-camp', type: 'story', depth: 0, lane: 0, contentId: 'dragon_arrival', label: 'Pied des Pics Célestes', icon: '◆',
    links: ['dragon-audience'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'La compagnie atteint les Pics Célestes avec deux Sceaux.' }),
  node({ id: 'dragon-audience', type: 'story', depth: 1, lane: 0, contentId: 'dragon_audience', label: 'Audience de Kaelen', icon: '♛',
    links: ['dragon-opening-ambush'], risk: 0, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Entendre la requête de l’Ancien Dragon Kaelen avant de monter vers le repaire du Loup.' }),
  node({ id: 'dragon-opening-ambush', type: 'combat', depth: 2, lane: 0, contentId: 'dragon_wolf_patrol', label: 'Patrouille du Loup', icon: '⚔',
    links: ['dragon-wolf-envoy'], risk: 1, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Une patrouille du Loup tient le premier sentier des contreforts.' }),
  node({ id: 'dragon-wolf-envoy', type: 'event', depth: 3, lane: 0, contentId: 'dragon_wolf_envoy', label: 'Émissaire du Loup', icon: '◇',
    links: ['dragon-terrorized-village'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Un émissaire du Loup attend la compagnie sous un drapeau de trêve.' }),
  node({ id: 'dragon-terrorized-village', type: 'event', depth: 4, lane: 0, contentId: 'dragon_terrorized_village', label: 'Hameau terrorisé', icon: '◇',
    links: ['dragon-first-trial-event', 'dragon-first-trial-combat'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Un hameau des contreforts vit dans la peur des raids du Loup.' }),
  node({ id: 'dragon-first-trial-event', type: 'event', depth: 5, lane: -1, contentId: 'dragon_wolf_traps', label: 'Pièges du Loup', icon: '◇',
    links: ['dragon-first-refuge'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Des pièges du Loup couvrent le sentier des pèlerins.' }),
  node({ id: 'dragon-first-trial-combat', type: 'combat', depth: 5, lane: 1, contentId: 'dragon_wolf_scouts', label: 'Éclaireurs du Loup', icon: '⚔',
    links: ['dragon-first-refuge'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des éclaireurs du Loup surveillent le chemin de l’ermitage.' }),
  node({ id: 'dragon-first-refuge', type: 'refuge', depth: 6, lane: 0, contentId: 'dragon_hermitage', label: 'Ermitage des contreforts', icon: '⌂',
    links: ['dragon-captive-wolf'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Un ermitage du Dragon où la compagnie peut se préparer.' }),
  node({ id: 'dragon-captive-wolf', type: 'event', depth: 7, lane: 0, contentId: 'dragon_captive_wolf', label: 'Guerrier du Loup blessé', icon: '◇',
    links: ['dragon-cliff-road'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'mystery',
    hint: 'Un guerrier du Loup blessé gît au bord des terrasses.' }),
  node({ id: 'dragon-cliff-road', type: 'combat', depth: 8, lane: 0, contentId: 'dragon_crest_creatures', label: 'Créatures des crêtes', icon: '⚔',
    links: ['dragon-second-trial-event', 'dragon-second-trial-combat'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des créatures des montagnes harcèlent la route des terrasses.' }),
  node({ id: 'dragon-second-trial-event', type: 'event', depth: 9, lane: -1, contentId: 'dragon_crystal_clues', label: 'Inscriptions du Cristal', icon: '◇',
    links: ['dragon-wolf-lair'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Une paroi gravée parle de l’usage du Cristal d’Écho.' }),
  node({ id: 'dragon-second-trial-combat', type: 'combat', depth: 9, lane: 1, contentId: 'dragon_corrupted_wyrm', label: 'Wyrm corrompu', icon: '⚔',
    links: ['dragon-wolf-lair'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Un wyrm rendu fou par une énergie sombre barre le passage.' }),
  node({ id: 'dragon-wolf-lair', type: 'story', depth: 10, lane: 0, contentId: 'dragon_wolf_lair', label: 'Repaire du Loup', icon: '⌂',
    links: ['dragon-second-refuge'], risk: 3, reward: 4, difficulty: 'decisive', moralTone: 'honour',
    hint: 'Le Clan du Loup garde le Cristal d’Écho dans son repaire.' }),
  node({ id: 'dragon-second-refuge', type: 'refuge', depth: 11, lane: 0, contentId: 'dragon_pilgrims_shelter', label: 'Abri des pèlerins', icon: '⌂',
    links: ['dragon-shaman-traces'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Un abri de pèlerins où la compagnie peut se préparer.' }),
  node({ id: 'dragon-shaman-traces', type: 'event', depth: 12, lane: 0, contentId: 'dragon_shaman_traces', label: 'Camp déserté du Loup', icon: '◇',
    links: ['dragon-freed-pilgrims'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'mystery',
    hint: 'Le camp déserté du Loup garde des traces étrangères au clan.' }),
  node({ id: 'dragon-freed-pilgrims', type: 'event', depth: 13, lane: 0, contentId: 'dragon_freed_pilgrims', label: 'Pèlerins libérés', icon: '◇',
    links: ['dragon-final-trial-event', 'dragon-final-trial-combat'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'honour',
    hint: 'Les pèlerins retenus au repaire veulent témoigner devant Kaelen.' }),
  node({ id: 'dragon-final-trial-event', type: 'event', depth: 14, lane: -1, contentId: 'dragon_young_dragon', label: 'Nid du jeune dragon', icon: '◇',
    links: ['dragon-crystal-altar'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Un jeune dragon blessé par les Ombres se terre dans son nid.' }),
  node({ id: 'dragon-final-trial-combat', type: 'combat', depth: 14, lane: 1, contentId: 'dragon_shadow_touched', label: 'Bêtes sous l’emprise des Ombres', icon: '⚔',
    links: ['dragon-crystal-altar'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Des bêtes des montagnes sous l’emprise des Ombres gardent la montée vers l’autel.' }),
  node({ id: 'dragon-crystal-altar', type: 'mystery', depth: 15, lane: 0, contentId: 'dragon_crystal_altar', label: 'Autel du Cristal', icon: '?',
    links: ['dragon-final-refuge'], risk: 2, reward: 4, difficulty: 'dangerous', moralTone: 'mystery',
    hint: 'L’autel où le Cristal d’Écho tenait l’équilibre des Pics porte une souillure.' }),
  node({ id: 'dragon-final-refuge', type: 'refuge', depth: 16, lane: 0, contentId: 'dragon_final_refuge', label: 'Veillée sur les Pics', icon: '⌂',
    links: ['dragon-judgement'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Rassembler ce que la compagnie a vu avant de comparaître devant Kaelen.' }),
  node({ id: 'dragon-judgement', type: 'boss', depth: 17, lane: 0, contentId: 'dragon_judgement', label: 'Jugement de Kaelen', icon: '♛',
    links: [], risk: 3, reward: 3, difficulty: 'decisive', moralTone: 'pragmatic',
    hint: 'Kaelen rend son jugement. Le Sceau sera accordé par alliance ou par l’épreuve.' }),
]);

const stage = (nodeIds: string[], mode: 'MANDATORY_INTERRUPT' | 'IN_TRAVERSAL_FORK') => Object.freeze({ nodeIds: Object.freeze(nodeIds), mode });

/** Three legs with one exclusive fork each, as the Lion's T0, T1 and T3 and the Bear's B0, B1 and B3. */
export const DRAGON_LEGS: readonly PlateauLeg[] = Object.freeze([
  Object.freeze({ id: 'D0', originNodeId: 'dragon-audience', destinationNodeId: 'dragon-first-refuge', stages: Object.freeze([
    stage(['dragon-opening-ambush'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-wolf-envoy'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-terrorized-village'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-first-trial-event', 'dragon-first-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'D1', originNodeId: 'dragon-first-refuge', destinationNodeId: 'dragon-wolf-lair', stages: Object.freeze([
    stage(['dragon-captive-wolf'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-cliff-road'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-second-trial-event', 'dragon-second-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'D3', originNodeId: 'dragon-second-refuge', destinationNodeId: 'dragon-crystal-altar', stages: Object.freeze([
    stage(['dragon-shaman-traces'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-freed-pilgrims'], 'MANDATORY_INTERRUPT'),
    stage(['dragon-final-trial-event', 'dragon-final-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
]);

export const DRAGON_BRANCH_COMMITMENTS = Object.freeze([
  Object.freeze({ legId: 'D0', resolvingNodeId: 'dragon-first-refuge' }),
  Object.freeze({ legId: 'D1', resolvingNodeId: 'dragon-wolf-lair' }),
  Object.freeze({ legId: 'D3', resolvingNodeId: 'dragon-crystal-altar' }),
]);

const chest = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], gold: number,
  items: Record<string, number>): FixedPoiDefinition => ({
  id, label, region, kind: 'chest', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
  contentId: `poi_chest_${id.replace('dragon-poi-', 'dragon_').replaceAll('-', '_')}`, chestLoot: { temporaryGold: gold, temporaryItems: items },
});
const encounter = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], sceneId: string,
  variants: [string[], string[]], gold: number, materials: Record<string, number>): FixedPoiDefinition => {
  const base = id.replace('dragon-poi-', 'dragon_poi_').replaceAll('-', '_');
  return {
    id, label, region, kind: 'combat', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
    combat: { sceneId, variants: [{ id: `${base}_a`, enemyVisualIds: variants[0] }, { id: `${base}_b`, enemyVisualIds: variants[1] }],
      // Post-demo scale: a routine victory gives no reputation.
      rewards: { temporaryGold: gold, reputation: 0, materials } },
  };
};

/** Twelve optional POIs on the Lot E pattern: six chests and six two-variant encounters, on the Bear's slots. */
export const DRAGON_OPTIONAL_POIS: readonly FixedPoiDefinition[] = Object.freeze([
  chest('dragon-poi-foothill-supplies', 0, 'Réserve des contreforts', ['dragon-wolf-envoy'], ['dragon-wolf-envoy', 'dragon-poi-foothill-wolves'], 35, { potion: 1 }),
  encounter('dragon-poi-foothill-wolves', 0, 'Meute des contreforts', ['dragon-wolf-envoy'], ['dragon-poi-foothill-supplies', 'dragon-terrorized-village'],
    'forest_route', [['wolf', 'wolf'], ['wolf', 'wolf', 'wolf']], 30, {}),
  encounter('dragon-poi-foothill-beasts', 0, 'Bêtes du ravin', ['dragon-wolf-envoy'], ['dragon-wolf-envoy', 'dragon-poi-foothill-cache'],
    'forest_route', [['wild_boar', 'forest_badger'], ['wild_boar', 'wild_boar']], 25, { iron_ore: 1 }),
  chest('dragon-poi-foothill-cache', 0, 'Cache du sentier', ['dragon-wolf-envoy'], ['dragon-poi-foothill-beasts', 'dragon-wolf-envoy'], 45, { antidote: 1 }),
  chest('dragon-poi-terrace-supplies', 1, 'Dépôt des terrasses', ['dragon-captive-wolf'], ['dragon-captive-wolf', 'dragon-poi-terrace-ravine'], 40, { iron_ore: 2 }),
  encounter('dragon-poi-terrace-ravine', 1, 'Ravine des crêtes', ['dragon-captive-wolf'], ['dragon-poi-terrace-supplies', 'dragon-cliff-road'],
    'forest_route', [['young_wyrm', 'cave_rat', 'cave_rat'], ['wild_boar', 'young_wyrm']], 35, {}),
  chest('dragon-poi-terrace-cache', 1, 'Cache du Loup', ['dragon-cliff-road'], ['dragon-cliff-road', 'dragon-poi-terrace-raiders'], 65, { red_gem: 1, potion: 1 }),
  encounter('dragon-poi-terrace-raiders', 1, 'Pillards du Loup', ['dragon-cliff-road'], ['dragon-poi-terrace-cache', 'dragon-cliff-road'],
    'forest_route', [['wolf_raider', 'wolf'], ['wolf_raider', 'wolf_hunter']], 40, { iron_ore: 1 }),
  chest('dragon-poi-peak-supplies', 2, 'Réserves des cimes', ['dragon-shaman-traces'], ['dragon-shaman-traces', 'dragon-freed-pilgrims'], 45, { ether: 1 }),
  encounter('dragon-poi-peak-hunters', 2, 'Chasseurs du Loup', ['dragon-freed-pilgrims'], ['dragon-freed-pilgrims', 'dragon-final-trial-event'],
    'lion_sanctum', [['wolf_hunter', 'wolf_raider', 'wolf'], ['wolf_raider', 'wolf_hunter', 'wolf_raider']], 45, {}),
  encounter('dragon-poi-peak-watch', 2, 'Veille des cimes', ['dragon-freed-pilgrims'], ['dragon-freed-pilgrims', 'dragon-final-trial-combat'],
    'lion_sanctum', [['young_wyrm', 'wolf', 'wolf'], ['wolf', 'young_wyrm', 'wolf']], 45, { iron_ore: 1 }),
  chest('dragon-poi-peak-reserve', 2, 'Réserve des cimes gardée', ['dragon-crystal-altar'], ['dragon-crystal-altar'], 75, { red_gem: 1, revive_vial: 1 }),
]);

/** Set 1.18.0 pattern: two stationary guardians posted on two optional chests, fought in two waves (set 1.19.0). */
export const DRAGON_GUARDIANS: readonly EliteDefinition[] = Object.freeze<EliteDefinition[]>([
  {
    id: 'dragon-guardian-terrace', label: 'Champion du Loup', region: 1, activateAfterResolved: 'dragon-cliff-road',
    allowedPositions: ['dragon-poi-terrace-cache'], spawnPosition: 'dragon-poi-terrace-cache', mode: 'cyclic_patrol',
    combat: { id: 'dragon_guardian_champion', sceneId: 'forest_route', enemies: ['wolf_champion', 'wolf_raider', 'wolf'],
      rewards: { temporaryGold: 65, reputation: 1, materials: { iron_ore: 2 } } },
  },
  {
    id: 'dragon-guardian-peak', label: 'Wyrm des cimes', region: 2, activateAfterResolved: 'dragon-freed-pilgrims',
    allowedPositions: ['dragon-poi-peak-reserve'], spawnPosition: 'dragon-poi-peak-reserve', mode: 'cyclic_patrol',
    combat: { id: 'dragon_guardian_wyrm', sceneId: 'lion_sanctum', enemies: ['shadow_wyrm', 'young_wyrm', 'young_wyrm'],
      rewards: { temporaryGold: 75, reputation: 1, materials: { red_gem: 1 } } },
  },
]);

export const DRAGON_GUARD_POSTS: Readonly<Record<string, string>> = Object.freeze({
  'dragon-guardian-terrace': 'dragon-poi-terrace-cache',
  'dragon-guardian-peak': 'dragon-poi-peak-reserve',
});

const meta = (region: 0 | 1 | 2, role: PlateauPoiMetadata['role'], participation: PlateauPoiMetadata['participation']): PlateauPoiMetadata =>
  ({ region, role, participation });

export const DRAGON_POI_METADATA: Readonly<Record<string, PlateauPoiMetadata>> = Object.freeze({
  'dragon-camp': meta(0, 'primary', 'required'),
  'dragon-audience': meta(0, 'primary', 'required'),
  'dragon-opening-ambush': meta(0, 'structuring', 'required'),
  'dragon-wolf-envoy': meta(0, 'structuring', 'required'),
  'dragon-terrorized-village': meta(0, 'secondary', 'required'),
  'dragon-first-trial-event': meta(0, 'secondary', 'alternative'),
  'dragon-first-trial-combat': meta(0, 'secondary', 'alternative'),
  'dragon-first-refuge': meta(0, 'primary', 'required'),
  'dragon-captive-wolf': meta(1, 'structuring', 'required'),
  'dragon-cliff-road': meta(1, 'structuring', 'required'),
  'dragon-second-trial-event': meta(1, 'secondary', 'alternative'),
  'dragon-second-trial-combat': meta(1, 'secondary', 'alternative'),
  'dragon-wolf-lair': meta(1, 'primary', 'required'),
  'dragon-second-refuge': meta(1, 'primary', 'required'),
  'dragon-shaman-traces': meta(2, 'structuring', 'required'),
  'dragon-freed-pilgrims': meta(2, 'structuring', 'required'),
  'dragon-final-trial-event': meta(2, 'secondary', 'alternative'),
  'dragon-final-trial-combat': meta(2, 'secondary', 'alternative'),
  'dragon-crystal-altar': meta(2, 'primary', 'required'),
  'dragon-final-refuge': meta(2, 'primary', 'required'),
  'dragon-judgement': meta(2, 'primary', 'required'),
  ...Object.fromEntries(DRAGON_OPTIONAL_POIS.map((poi) => [poi.id, meta(poi.region, poi.role, poi.participation)])),
});

export const DRAGON_TOPOLOGY: PlateauTopology = Object.freeze({
  plateauId: 'dragon',
  startNodeId: 'dragon-camp',
  route: DRAGON_ROUTE,
  legs: DRAGON_LEGS,
  localRoutes: Object.freeze([]),
  localRoutesRequire: Object.freeze([]),
  gatedTrial: Object.freeze({ nodeIds: Object.freeze(['dragon-first-trial-event', 'dragon-first-trial-combat']), gatedNodeId: 'dragon-first-refuge' }),
  metadata: DRAGON_POI_METADATA,
  optionalPois: DRAGON_OPTIONAL_POIS,
  guardians: DRAGON_GUARDIANS,
  guardPosts: DRAGON_GUARD_POSTS,
  finalRefugeNodeId: 'dragon-final-refuge',
});
