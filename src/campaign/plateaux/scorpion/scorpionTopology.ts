/**
 * Set 1.20.0, post-demo Lot 3 — canon since the operator accepted the Scorpion plateau (OD-2026-11-08-D).
 *
 * The Scorpion plateau (roadmap §3.4): the Déserts Arides, the Grand Inquisiteur (named by his title only until the
 * operator validates a name, P5), the prophetic codex kept by the Clan du Phénix in its temple. It follows the Bear's
 * template (the Lion's size): 21 canonical nodes in three regions, three exclusive forks with branch commitment, refuges,
 * 12 optional POIs and two stationary guardians posted on optional chests. Place names are descriptive only. Data only:
 * nothing here imports RunSystem.
 */
import type { EliteDefinition, FixedPoiDefinition } from '../../LionPoiAuthoring';
import type { PlateauLeg, PlateauPoiMetadata, PlateauRouteNode, PlateauTopology } from '../PlateauTopology';

type Node = PlateauRouteNode;
const node = (value: Node): Node => Object.freeze({ ...value, links: [...value.links] });

export const SCORPION_ROUTE: readonly Node[] = Object.freeze([
  node({ id: 'scorpion-camp', type: 'story', depth: 0, lane: 0, contentId: 'scorpion_arrival', label: 'Bord des Déserts Arides', icon: '◆',
    links: ['scorpion-audience'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'La compagnie atteint les Déserts Arides avec trois Sceaux.' }),
  node({ id: 'scorpion-audience', type: 'story', depth: 1, lane: 0, contentId: 'scorpion_audience', label: 'Audience du Grand Inquisiteur', icon: '♛',
    links: ['scorpion-opening-ambush'], risk: 0, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Entendre la requête du Grand Inquisiteur avant de marcher vers le Temple du Phénix.' }),
  node({ id: 'scorpion-opening-ambush', type: 'combat', depth: 2, lane: 0, contentId: 'scorpion_dune_beasts', label: 'Bêtes des dunes', icon: '⚔',
    links: ['scorpion-scholars'], risk: 1, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des bêtes des dunes guettent la première piste.' }),
  node({ id: 'scorpion-scholars', type: 'event', depth: 3, lane: 0, contentId: 'scorpion_scholars', label: 'Érudits du Scorpion', icon: '◇',
    links: ['scorpion-phoenix-faithful'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Des érudits du Scorpion ont dressé un camp sur la piste du temple.' }),
  node({ id: 'scorpion-phoenix-faithful', type: 'event', depth: 4, lane: 0, contentId: 'scorpion_phoenix_faithful', label: 'Fidèles du Phénix', icon: '◇',
    links: ['scorpion-first-trial-event', 'scorpion-first-trial-combat'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Des fidèles du Phénix veillent sur la route de leur temple.' }),
  node({ id: 'scorpion-first-trial-event', type: 'event', depth: 5, lane: -1, contentId: 'scorpion_sand_riddle', label: 'Énigme des sables', icon: '◇',
    links: ['scorpion-first-refuge'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Une porte de pierre ne s’ouvre qu’à qui résout son énigme.' }),
  node({ id: 'scorpion-first-trial-combat', type: 'combat', depth: 5, lane: 1, contentId: 'scorpion_phoenix_scouts', label: 'Éclaireurs du Phénix', icon: '⚔',
    links: ['scorpion-first-refuge'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des éclaireurs du Phénix gardent le chemin de l’oasis.' }),
  node({ id: 'scorpion-first-refuge', type: 'refuge', depth: 6, lane: 0, contentId: 'scorpion_oasis', label: 'Oasis des érudits', icon: '⌂',
    links: ['scorpion-warded-path'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Une oasis tenue par les érudits du Scorpion, où la compagnie peut se préparer.' }),
  node({ id: 'scorpion-warded-path', type: 'event', depth: 7, lane: 0, contentId: 'scorpion_warded_path', label: 'Sceaux de garde', icon: '◇',
    links: ['scorpion-ruin-road'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'mystery',
    hint: 'Des sceaux de garde du Phénix ferment la route des ruines.' }),
  node({ id: 'scorpion-ruin-road', type: 'combat', depth: 8, lane: 0, contentId: 'scorpion_temple_sentinels', label: 'Sentinelles du temple', icon: '⚔',
    links: ['scorpion-second-trial-event', 'scorpion-second-trial-combat'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des sentinelles du Phénix tiennent la route des ruines.' }),
  node({ id: 'scorpion-second-trial-event', type: 'event', depth: 9, lane: -1, contentId: 'scorpion_buried_library', label: 'Bibliothèque ensevelie', icon: '◇',
    links: ['scorpion-phoenix-temple'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Une bibliothèque du Phénix dort sous le sable.' }),
  node({ id: 'scorpion-second-trial-combat', type: 'combat', depth: 9, lane: 1, contentId: 'scorpion_flamekeeper', label: 'Gardien de flamme', icon: '⚔',
    links: ['scorpion-phoenix-temple'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Un gardien de flamme du Phénix barre le passage.' }),
  node({ id: 'scorpion-phoenix-temple', type: 'story', depth: 10, lane: 0, contentId: 'scorpion_phoenix_temple', label: 'Temple du Phénix', icon: '⌂',
    links: ['scorpion-second-refuge'], risk: 3, reward: 4, difficulty: 'decisive', moralTone: 'honour',
    hint: 'Le Phénix garde le codex prophétique dans son temple.' }),
  node({ id: 'scorpion-second-refuge', type: 'refuge', depth: 11, lane: 0, contentId: 'scorpion_caravan_shelter', label: 'Abri des caravanes', icon: '⌂',
    links: ['scorpion-prophet-traces'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Un abri de caravanes où la compagnie peut se préparer.' }),
  node({ id: 'scorpion-prophet-traces', type: 'event', depth: 12, lane: 0, contentId: 'scorpion_prophet_traces', label: 'Cellule du Prophète', icon: '◇',
    links: ['scorpion-temple-witnesses'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'mystery',
    hint: 'Une cellule à l’écart du temple garde des écrits qui ne sont pas du Phénix.' }),
  node({ id: 'scorpion-temple-witnesses', type: 'event', depth: 13, lane: 0, contentId: 'scorpion_temple_witnesses', label: 'Fidèles rescapés', icon: '◇',
    links: ['scorpion-final-trial-event', 'scorpion-final-trial-combat'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'honour',
    hint: 'Des fidèles rescapés du temple veulent parler au Grand Inquisiteur.' }),
  node({ id: 'scorpion-final-trial-event', type: 'event', depth: 14, lane: -1, contentId: 'scorpion_sacred_ashes', label: 'Cendres sacrées', icon: '◇',
    links: ['scorpion-corrupted-texts'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Les cendres sacrées du Phénix couvent encore dans un sanctuaire.' }),
  node({ id: 'scorpion-final-trial-combat', type: 'combat', depth: 14, lane: 1, contentId: 'scorpion_lost_faithful', label: 'Fidèles égarés', icon: '⚔',
    links: ['scorpion-corrupted-texts'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Des fidèles égarés, sous l’emprise des Ombres, gardent le sanctuaire.' }),
  node({ id: 'scorpion-corrupted-texts', type: 'mystery', depth: 15, lane: 0, contentId: 'scorpion_corrupted_texts', label: 'Pages souillées', icon: '?',
    links: ['scorpion-final-refuge'], risk: 2, reward: 4, difficulty: 'dangerous', moralTone: 'mystery',
    hint: 'Des pages du codex portent des lignes qui ne sont pas des prophéties.' }),
  node({ id: 'scorpion-final-refuge', type: 'refuge', depth: 16, lane: 0, contentId: 'scorpion_final_refuge', label: 'Veillée au désert', icon: '⌂',
    links: ['scorpion-judgement'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Rassembler ce que la compagnie a vu avant de comparaître devant le Grand Inquisiteur.' }),
  node({ id: 'scorpion-judgement', type: 'boss', depth: 17, lane: 0, contentId: 'scorpion_judgement', label: 'Jugement du Grand Inquisiteur', icon: '♛',
    links: [], risk: 3, reward: 3, difficulty: 'decisive', moralTone: 'pragmatic',
    hint: 'Le Grand Inquisiteur rend son jugement. Le Sceau sera accordé par alliance ou par l’épreuve.' }),
]);

const stage = (nodeIds: string[], mode: 'MANDATORY_INTERRUPT' | 'IN_TRAVERSAL_FORK') => Object.freeze({ nodeIds: Object.freeze(nodeIds), mode });

/** Three legs with one exclusive fork each, as the Lion's, the Bear's and the Dragon's. */
export const SCORPION_LEGS: readonly PlateauLeg[] = Object.freeze([
  Object.freeze({ id: 'S0', originNodeId: 'scorpion-audience', destinationNodeId: 'scorpion-first-refuge', stages: Object.freeze([
    stage(['scorpion-opening-ambush'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-scholars'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-phoenix-faithful'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-first-trial-event', 'scorpion-first-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'S1', originNodeId: 'scorpion-first-refuge', destinationNodeId: 'scorpion-phoenix-temple', stages: Object.freeze([
    stage(['scorpion-warded-path'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-ruin-road'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-second-trial-event', 'scorpion-second-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'S3', originNodeId: 'scorpion-second-refuge', destinationNodeId: 'scorpion-corrupted-texts', stages: Object.freeze([
    stage(['scorpion-prophet-traces'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-temple-witnesses'], 'MANDATORY_INTERRUPT'),
    stage(['scorpion-final-trial-event', 'scorpion-final-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
]);

export const SCORPION_BRANCH_COMMITMENTS = Object.freeze([
  Object.freeze({ legId: 'S0', resolvingNodeId: 'scorpion-first-refuge' }),
  Object.freeze({ legId: 'S1', resolvingNodeId: 'scorpion-phoenix-temple' }),
  Object.freeze({ legId: 'S3', resolvingNodeId: 'scorpion-corrupted-texts' }),
]);

const chest = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], gold: number,
  items: Record<string, number>): FixedPoiDefinition => ({
  id, label, region, kind: 'chest', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
  contentId: `poi_chest_${id.replace('scorpion-poi-', 'scorpion_').replaceAll('-', '_')}`, chestLoot: { temporaryGold: gold, temporaryItems: items },
});
const encounter = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], sceneId: string,
  variants: [string[], string[]], gold: number, materials: Record<string, number>): FixedPoiDefinition => {
  const base = id.replace('scorpion-poi-', 'scorpion_poi_').replaceAll('-', '_');
  return {
    id, label, region, kind: 'combat', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
    combat: { sceneId, variants: [{ id: `${base}_a`, enemyVisualIds: variants[0] }, { id: `${base}_b`, enemyVisualIds: variants[1] }],
      // Post-demo scale: a routine victory gives no reputation.
      rewards: { temporaryGold: gold, reputation: 0, materials } },
  };
};

/**
 * Each optional fight plays in the Scorpion's coded arena of its region: the dune track (region I), the Phoenix's
 * ruins (region II), and in region III the sanctuary of the sacred ashes for its guards, the dunes at dusk for the
 * watch of the sands.
 */
const TRACK = 'scorpion_dune_track';
const RUINS = 'scorpion_phoenix_ruins';
const SANCTUARY = 'scorpion_ash_sanctuary';
const CREST = 'scorpion_dune_crest';

/** Twelve optional POIs on the Lot E pattern: six chests and six two-variant encounters, on the Bear's slots. */
export const SCORPION_OPTIONAL_POIS: readonly FixedPoiDefinition[] = Object.freeze([
  chest('scorpion-poi-dune-supplies', 0, 'Réserve des dunes', ['scorpion-scholars'], ['scorpion-scholars', 'scorpion-poi-dune-serpents'], 40, { potion: 1 }),
  encounter('scorpion-poi-dune-serpents', 0, 'Nid de serpents', ['scorpion-scholars'], ['scorpion-poi-dune-supplies', 'scorpion-phoenix-faithful'],
    TRACK, [['venom_serpent', 'venom_serpent'], ['venom_serpent', 'cave_rat', 'venom_serpent']], 35, {}),
  encounter('scorpion-poi-dune-spiders', 0, 'Araignées des sables', ['scorpion-scholars'], ['scorpion-scholars', 'scorpion-poi-dune-cache'],
    TRACK, [['forest_spider', 'forest_spider'], ['forest_spider', 'cave_rat']], 30, { iron_ore: 1 }),
  chest('scorpion-poi-dune-cache', 0, 'Cache de la piste', ['scorpion-scholars'], ['scorpion-poi-dune-spiders', 'scorpion-scholars'], 50, { antidote: 1 }),
  chest('scorpion-poi-ruin-supplies', 1, 'Dépôt des ruines', ['scorpion-warded-path'], ['scorpion-warded-path', 'scorpion-poi-ruin-sentinels'], 45, { iron_ore: 2 }),
  encounter('scorpion-poi-ruin-sentinels', 1, 'Ronde du Phénix', ['scorpion-warded-path'], ['scorpion-poi-ruin-supplies', 'scorpion-ruin-road'],
    RUINS, [['phoenix_guardian', 'venom_serpent'], ['phoenix_guardian', 'phoenix_guardian']], 40, {}),
  chest('scorpion-poi-ruin-cache', 1, 'Cache des ruines', ['scorpion-ruin-road'], ['scorpion-ruin-road', 'scorpion-poi-ruin-serpents'], 70, { red_gem: 1, potion: 1 }),
  encounter('scorpion-poi-ruin-serpents', 1, 'Serpents des ruines', ['scorpion-ruin-road'], ['scorpion-poi-ruin-cache', 'scorpion-ruin-road'],
    RUINS, [['venom_serpent', 'forest_spider'], ['venom_serpent', 'venom_serpent', 'cave_rat']], 45, { iron_ore: 1 }),
  chest('scorpion-poi-sanctum-supplies', 2, 'Réserves du sanctuaire', ['scorpion-prophet-traces'], ['scorpion-prophet-traces', 'scorpion-temple-witnesses'], 50, { ether: 1 }),
  encounter('scorpion-poi-sanctum-guards', 2, 'Gardes du sanctuaire', ['scorpion-temple-witnesses'], ['scorpion-temple-witnesses', 'scorpion-final-trial-event'],
    SANCTUARY, [['phoenix_guardian', 'phoenix_guardian', 'venom_serpent'], ['phoenix_guardian', 'forest_spider', 'phoenix_guardian']], 50, {}),
  encounter('scorpion-poi-sanctum-watch', 2, 'Veille des sables', ['scorpion-temple-witnesses'], ['scorpion-temple-witnesses', 'scorpion-final-trial-combat'],
    CREST, [['venom_serpent', 'forest_spider', 'cave_rat'], ['forest_spider', 'venom_serpent', 'forest_spider']], 50, { iron_ore: 1 }),
  chest('scorpion-poi-sanctum-reserve', 2, 'Réserve du sanctuaire gardée', ['scorpion-corrupted-texts'], ['scorpion-corrupted-texts'], 80, { red_gem: 1, revive_vial: 1 }),
]);

/** Set 1.18.0 pattern: two stationary guardians posted on two optional chests, fought in two waves (set 1.19.0). */
export const SCORPION_GUARDIANS: readonly EliteDefinition[] = Object.freeze<EliteDefinition[]>([
  {
    id: 'scorpion-guardian-ruins', label: 'Gardien de flamme', region: 1, activateAfterResolved: 'scorpion-ruin-road',
    allowedPositions: ['scorpion-poi-ruin-cache'], spawnPosition: 'scorpion-poi-ruin-cache', mode: 'cyclic_patrol',
    combat: { id: 'scorpion_guardian_flamekeeper', sceneId: RUINS, enemies: ['phoenix_flamekeeper', 'phoenix_guardian', 'venom_serpent'],
      rewards: { temporaryGold: 70, reputation: 1, materials: { iron_ore: 2 } } },
  },
  {
    id: 'scorpion-guardian-sanctum', label: 'Fidèle égaré', region: 2, activateAfterResolved: 'scorpion-temple-witnesses',
    allowedPositions: ['scorpion-poi-sanctum-reserve'], spawnPosition: 'scorpion-poi-sanctum-reserve', mode: 'cyclic_patrol',
    combat: { id: 'scorpion_guardian_zealot', sceneId: SANCTUARY, enemies: ['shadow_zealot', 'phoenix_guardian', 'forest_spider'],
      rewards: { temporaryGold: 80, reputation: 1, materials: { red_gem: 1 } } },
  },
]);

export const SCORPION_GUARD_POSTS: Readonly<Record<string, string>> = Object.freeze({
  'scorpion-guardian-ruins': 'scorpion-poi-ruin-cache',
  'scorpion-guardian-sanctum': 'scorpion-poi-sanctum-reserve',
});

const meta = (region: 0 | 1 | 2, role: PlateauPoiMetadata['role'], participation: PlateauPoiMetadata['participation']): PlateauPoiMetadata =>
  ({ region, role, participation });

export const SCORPION_POI_METADATA: Readonly<Record<string, PlateauPoiMetadata>> = Object.freeze({
  'scorpion-camp': meta(0, 'primary', 'required'),
  'scorpion-audience': meta(0, 'primary', 'required'),
  'scorpion-opening-ambush': meta(0, 'structuring', 'required'),
  'scorpion-scholars': meta(0, 'structuring', 'required'),
  'scorpion-phoenix-faithful': meta(0, 'secondary', 'required'),
  'scorpion-first-trial-event': meta(0, 'secondary', 'alternative'),
  'scorpion-first-trial-combat': meta(0, 'secondary', 'alternative'),
  'scorpion-first-refuge': meta(0, 'primary', 'required'),
  'scorpion-warded-path': meta(1, 'structuring', 'required'),
  'scorpion-ruin-road': meta(1, 'structuring', 'required'),
  'scorpion-second-trial-event': meta(1, 'secondary', 'alternative'),
  'scorpion-second-trial-combat': meta(1, 'secondary', 'alternative'),
  'scorpion-phoenix-temple': meta(1, 'primary', 'required'),
  'scorpion-second-refuge': meta(1, 'primary', 'required'),
  'scorpion-prophet-traces': meta(2, 'structuring', 'required'),
  'scorpion-temple-witnesses': meta(2, 'structuring', 'required'),
  'scorpion-final-trial-event': meta(2, 'secondary', 'alternative'),
  'scorpion-final-trial-combat': meta(2, 'secondary', 'alternative'),
  'scorpion-corrupted-texts': meta(2, 'primary', 'required'),
  'scorpion-final-refuge': meta(2, 'primary', 'required'),
  'scorpion-judgement': meta(2, 'primary', 'required'),
  ...Object.fromEntries(SCORPION_OPTIONAL_POIS.map((poi) => [poi.id, meta(poi.region, poi.role, poi.participation)])),
});

export const SCORPION_TOPOLOGY: PlateauTopology = Object.freeze({
  plateauId: 'scorpion',
  startNodeId: 'scorpion-camp',
  route: SCORPION_ROUTE,
  legs: SCORPION_LEGS,
  localRoutes: Object.freeze([]),
  localRoutesRequire: Object.freeze([]),
  gatedTrial: Object.freeze({ nodeIds: Object.freeze(['scorpion-first-trial-event', 'scorpion-first-trial-combat']), gatedNodeId: 'scorpion-first-refuge' }),
  metadata: SCORPION_POI_METADATA,
  optionalPois: SCORPION_OPTIONAL_POIS,
  guardians: SCORPION_GUARDIANS,
  guardPosts: SCORPION_GUARD_POSTS,
  finalRefugeNodeId: 'scorpion-final-refuge',
});
