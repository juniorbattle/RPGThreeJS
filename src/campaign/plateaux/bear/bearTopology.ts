/**
 * Set 1.20.0, post-demo Lot 1 — canon since the operator accepted the Bear plateau (OD-2026-11-08-B).
 *
 * The Bear plateau (roadmap §3.2): the Montagnes de la Résilience, the Ancien Ours Borin, the Raven exploiting the
 * sacred mines. It follows the Lion's template (P4) and, by default, its size: 21 canonical nodes in three regions,
 * three exclusive forks with branch commitment, refuges, 12 optional POIs and two stationary guardians posted on
 * optional chests. Place names are descriptive only: no place, clan, character or object outside the roadmap, its
 * status, the demo's facts and the operator's decisions. Data only: nothing here imports RunSystem.
 */
import type { EliteDefinition, FixedPoiDefinition } from '../../LionPoiAuthoring';
import type { PlateauLeg, PlateauPoiMetadata, PlateauRouteNode, PlateauTopology } from '../PlateauTopology';

type Node = PlateauRouteNode;
const node = (value: Node): Node => Object.freeze({ ...value, links: [...value.links] });

export const BEAR_ROUTE: readonly Node[] = Object.freeze([
  node({ id: 'bear-camp', type: 'story', depth: 0, lane: 0, contentId: 'bear_arrival', label: 'Pied des Montagnes', icon: '◆',
    links: ['bear-audience'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'La compagnie atteint les Montagnes de la Résilience avec le Sceau du Lion.' }),
  node({ id: 'bear-audience', type: 'story', depth: 1, lane: 0, contentId: 'bear_audience', label: 'Audience de Borin', icon: '♛',
    links: ['bear-opening-ambush'], risk: 0, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Entendre la requête de l’Ancien Ours Borin avant de monter vers les mines.' }),
  node({ id: 'bear-opening-ambush', type: 'combat', depth: 2, lane: 0, contentId: 'bear_pass_beasts', label: 'Bêtes des éboulis', icon: '⚔',
    links: ['bear-raven-messenger'], risk: 1, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des bêtes affamées rôdent sur le premier col.' }),
  node({ id: 'bear-raven-messenger', type: 'event', depth: 3, lane: 0, contentId: 'bear_raven_messenger', label: 'Messager du Corbeau', icon: '◇',
    links: ['bear-trapped-miners'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Un messager du Corbeau attend la compagnie à l’écart du sentier.' }),
  node({ id: 'bear-trapped-miners', type: 'event', depth: 4, lane: 0, contentId: 'bear_trapped_miners', label: 'Mineurs pris au piège', icon: '◇',
    links: ['bear-first-trial-event', 'bear-first-trial-combat'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'honour',
    hint: 'Un éboulement a enfermé des mineurs de l’Ours.' }),
  node({ id: 'bear-first-trial-event', type: 'event', depth: 5, lane: -1, contentId: 'bear_raven_traps', label: 'Pièges du Corbeau', icon: '◇',
    links: ['bear-first-refuge'], risk: 1, reward: 2, difficulty: 'safe', moralTone: 'pragmatic',
    hint: 'Des pièges du Corbeau barrent le sentier des patrouilles de l’Ours.' }),
  node({ id: 'bear-first-trial-combat', type: 'combat', depth: 5, lane: 1, contentId: 'bear_raven_scouts', label: 'Éclaireurs du Corbeau', icon: '⚔',
    links: ['bear-first-refuge'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des éclaireurs du Corbeau surveillent le sentier de l’avant-poste.' }),
  node({ id: 'bear-first-refuge', type: 'refuge', depth: 6, lane: 0, contentId: 'bear_outpost', label: 'Avant-poste de l’Ours', icon: '⌂',
    links: ['bear-ore-convoy'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Un avant-poste de l’Ours où la compagnie peut se préparer.' }),
  node({ id: 'bear-ore-convoy', type: 'event', depth: 7, lane: 0, contentId: 'bear_ore_convoy', label: 'Convoi de minerai', icon: '◇',
    links: ['bear-mine-road'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Un convoi du Corbeau descend des galeries chargé de minerai sombre.' }),
  node({ id: 'bear-mine-road', type: 'combat', depth: 8, lane: 0, contentId: 'bear_raven_patrol', label: 'Route des mines', icon: '⚔',
    links: ['bear-second-trial-event', 'bear-second-trial-combat'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Une patrouille du Corbeau tient la route des mines sacrées.' }),
  node({ id: 'bear-second-trial-event', type: 'event', depth: 9, lane: -1, contentId: 'bear_ancient_relic', label: 'Galerie effondrée', icon: '◇',
    links: ['bear-sacred-mines'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Une galerie effondrée garde un ancien artefact de l’Ours.' }),
  node({ id: 'bear-second-trial-combat', type: 'combat', depth: 9, lane: 1, contentId: 'bear_corrupted_beast', label: 'Bête corrompue', icon: '⚔',
    links: ['bear-sacred-mines'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Une bête de la montagne, rendue folle près des galeries, barre le passage.' }),
  node({ id: 'bear-sacred-mines', type: 'story', depth: 10, lane: 0, contentId: 'bear_sacred_mines', label: 'Les mines sacrées', icon: '⌂',
    links: ['bear-second-refuge'], risk: 3, reward: 4, difficulty: 'decisive', moralTone: 'honour',
    hint: 'Le Corbeau exploite les mines sacrées de l’Ours.' }),
  node({ id: 'bear-second-refuge', type: 'refuge', depth: 11, lane: 0, contentId: 'bear_miners_refuge', label: 'Refuge des mineurs', icon: '⌂',
    links: ['bear-raven-camp'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Un abri de mineurs où la compagnie peut se préparer.' }),
  node({ id: 'bear-raven-camp', type: 'event', depth: 12, lane: 0, contentId: 'bear_raven_camp', label: 'Campement du Corbeau', icon: '◇',
    links: ['bear-miners-testimony'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'mystery',
    hint: 'Le campement abandonné du Corbeau garde encore ses ordres.' }),
  node({ id: 'bear-miners-testimony', type: 'event', depth: 13, lane: 0, contentId: 'bear_miners_testimony', label: 'Mineurs libérés', icon: '◇',
    links: ['bear-final-trial-event', 'bear-final-trial-combat'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'honour',
    hint: 'Les mineurs libérés veulent témoigner devant Borin.' }),
  node({ id: 'bear-final-trial-event', type: 'event', depth: 14, lane: -1, contentId: 'bear_mountain_shrine', label: 'Sanctuaire de la montagne', icon: '◇',
    links: ['bear-dark-vein'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'greed',
    hint: 'Un sanctuaire de l’Ours garde des offrandes laissées à la montagne.' }),
  node({ id: 'bear-final-trial-combat', type: 'combat', depth: 14, lane: 1, contentId: 'bear_gallery_guardians', label: 'Gardiens des galeries', icon: '⚔',
    links: ['bear-dark-vein'], risk: 3, reward: 4, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Des créatures corrompues gardent la descente vers le filon.' }),
  node({ id: 'bear-dark-vein', type: 'mystery', depth: 15, lane: 0, contentId: 'bear_dark_vein', label: 'Le filon sombre', icon: '?',
    links: ['bear-final-refuge'], risk: 2, reward: 4, difficulty: 'dangerous', moralTone: 'mystery',
    hint: 'Au fond des galeries, le minerai que convoitait le Corbeau.' }),
  node({ id: 'bear-final-refuge', type: 'refuge', depth: 16, lane: 0, contentId: 'bear_final_refuge', label: 'Veillée avant le Sceau', icon: '⌂',
    links: ['bear-judgement'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Rassembler ce que la compagnie a vu avant de comparaître devant Borin.' }),
  node({ id: 'bear-judgement', type: 'boss', depth: 17, lane: 0, contentId: 'bear_judgement', label: 'Jugement de Borin', icon: '♛',
    links: [], risk: 3, reward: 3, difficulty: 'decisive', moralTone: 'pragmatic',
    hint: 'Borin rend son jugement. Le Sceau sera accordé par alliance ou par l’épreuve.' }),
]);

const stage = (nodeIds: string[], mode: 'MANDATORY_INTERRUPT' | 'IN_TRAVERSAL_FORK') => Object.freeze({ nodeIds: Object.freeze(nodeIds), mode });

/** Three legs with one exclusive fork each, as the Lion's T0, T1 and T3. Every canonical encounter is required. */
export const BEAR_LEGS: readonly PlateauLeg[] = Object.freeze([
  Object.freeze({ id: 'B0', originNodeId: 'bear-audience', destinationNodeId: 'bear-first-refuge', stages: Object.freeze([
    stage(['bear-opening-ambush'], 'MANDATORY_INTERRUPT'),
    stage(['bear-raven-messenger'], 'MANDATORY_INTERRUPT'),
    stage(['bear-trapped-miners'], 'MANDATORY_INTERRUPT'),
    stage(['bear-first-trial-event', 'bear-first-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'B1', originNodeId: 'bear-first-refuge', destinationNodeId: 'bear-sacred-mines', stages: Object.freeze([
    stage(['bear-ore-convoy'], 'MANDATORY_INTERRUPT'),
    stage(['bear-mine-road'], 'MANDATORY_INTERRUPT'),
    stage(['bear-second-trial-event', 'bear-second-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
  Object.freeze({ id: 'B3', originNodeId: 'bear-second-refuge', destinationNodeId: 'bear-dark-vein', stages: Object.freeze([
    stage(['bear-raven-camp'], 'MANDATORY_INTERRUPT'),
    stage(['bear-miners-testimony'], 'MANDATORY_INTERRUPT'),
    stage(['bear-final-trial-event', 'bear-final-trial-combat'], 'IN_TRAVERSAL_FORK'),
  ]) }),
]);

export const BEAR_BRANCH_COMMITMENTS = Object.freeze([
  Object.freeze({ legId: 'B0', resolvingNodeId: 'bear-first-refuge' }),
  Object.freeze({ legId: 'B1', resolvingNodeId: 'bear-sacred-mines' }),
  Object.freeze({ legId: 'B3', resolvingNodeId: 'bear-dark-vein' }),
]);

const chest = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], gold: number,
  items: Record<string, number>): FixedPoiDefinition => ({
  id, label, region, kind: 'chest', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
  contentId: `poi_chest_${id.replace('bear-poi-', '').replaceAll('-', '_')}`, chestLoot: { temporaryGold: gold, temporaryItems: items },
});
const encounter = (id: string, region: 0 | 1 | 2, label: string, prerequisiteResolved: string[], edges: string[], sceneId: string,
  variants: [string[], string[]], gold: number, materials: Record<string, number>): FixedPoiDefinition => {
  const base = id.replace('bear-poi-', 'bear_poi_').replaceAll('-', '_');
  return {
    id, label, region, kind: 'combat', role: 'secondary', participation: 'optional', prerequisiteResolved, edges,
    combat: { sceneId, variants: [{ id: `${base}_a`, enemyVisualIds: variants[0] }, { id: `${base}_b`, enemyVisualIds: variants[1] }],
      // Post-demo scale: a routine victory gives no reputation.
      rewards: { temporaryGold: gold, reputation: 0, materials } },
  };
};

/** Twelve optional POIs on the Lion's Lot E pattern: six chests and six two-variant encounters. */
export const BEAR_OPTIONAL_POIS: readonly FixedPoiDefinition[] = Object.freeze([
  chest('bear-poi-pass-supplies', 0, 'Réserve du col', ['bear-raven-messenger'], ['bear-raven-messenger', 'bear-poi-pass-patrol'], 30, { potion: 1 }),
  encounter('bear-poi-pass-patrol', 0, 'Éclaireurs du col', ['bear-raven-messenger'], ['bear-poi-pass-supplies', 'bear-trapped-miners'],
    'bear_mountain_pass', [['raven_scout', 'raven_scout'], ['raven_scout', 'raven_scout', 'raven_scout']], 25, {}),
  encounter('bear-poi-pass-beasts', 0, 'Bêtes du détour', ['bear-raven-messenger'], ['bear-raven-messenger', 'bear-poi-pass-cache'],
    'bear_mountain_pass', [['wild_boar', 'forest_badger'], ['wild_boar', 'wild_boar']], 20, { iron_ore: 1 }),
  chest('bear-poi-pass-cache', 0, 'Cache du sentier', ['bear-raven-messenger'], ['bear-poi-pass-beasts', 'bear-raven-messenger'], 40, { antidote: 1 }),
  chest('bear-poi-mine-supplies', 1, 'Dépôt des mineurs', ['bear-ore-convoy'], ['bear-ore-convoy', 'bear-poi-mine-gully'], 35, { iron_ore: 2 }),
  encounter('bear-poi-mine-gully', 1, 'Ravine des éboulis', ['bear-ore-convoy'], ['bear-poi-mine-supplies', 'bear-mine-road'],
    'bear_mountain_pass', [['cave_rat', 'cave_rat', 'wild_boar'], ['wild_boar', 'forest_badger', 'cave_rat']], 30, {}),
  chest('bear-poi-mine-lift-cache', 1, 'Cache du monte-charge', ['bear-mine-road'], ['bear-mine-road', 'bear-poi-mine-ravens'], 60, { red_gem: 1, potion: 1 }),
  encounter('bear-poi-mine-ravens', 1, 'Ronde du Corbeau', ['bear-mine-road'], ['bear-poi-mine-lift-cache', 'bear-mine-road'],
    'bear_mountain_pass', [['raven_scout', 'raven_miner'], ['raven_miner', 'raven_miner']], 35, { iron_ore: 1 }),
  chest('bear-poi-depths-supplies', 2, 'Réserves des galeries', ['bear-raven-camp'], ['bear-raven-camp', 'bear-miners-testimony'], 40, { ether: 1 }),
  encounter('bear-poi-depths-hunters', 2, 'Traqueurs du Corbeau', ['bear-miners-testimony'], ['bear-miners-testimony', 'bear-final-trial-event'],
    'bear_mine_galleries', [['raven_scout', 'raven_miner', 'raven_scout'], ['raven_miner', 'raven_scout', 'raven_miner']], 40, {}),
  encounter('bear-poi-depths-watch', 2, 'Veille des profondeurs', ['bear-miners-testimony'], ['bear-miners-testimony', 'bear-final-trial-combat'],
    'bear_mine_galleries', [['cave_rat', 'skeleton', 'cave_rat'], ['skeleton', 'cave_rat', 'skeleton']], 40, { iron_ore: 1 }),
  chest('bear-poi-depths-reserve', 2, 'Réserve des profondeurs', ['bear-dark-vein'], ['bear-dark-vein'], 70, { red_gem: 1, revive_vial: 1 }),
]);

/** Set 1.18.0 pattern: two stationary guardians posted on two optional chests, fought in two waves (set 1.19.0). */
export const BEAR_GUARDIANS: readonly EliteDefinition[] = Object.freeze<EliteDefinition[]>([
  {
    id: 'bear-guardian-lift', label: 'Contremaître du Corbeau', region: 1, activateAfterResolved: 'bear-mine-road',
    allowedPositions: ['bear-poi-mine-lift-cache'], spawnPosition: 'bear-poi-mine-lift-cache', mode: 'cyclic_patrol',
    combat: { id: 'bear_guardian_foreman', sceneId: 'bear_mountain_pass', enemies: ['raven_foreman', 'raven_miner', 'raven_scout'],
      rewards: { temporaryGold: 60, reputation: 1, materials: { iron_ore: 2 } } },
  },
  {
    id: 'bear-guardian-depths', label: 'Bête des profondeurs', region: 2, activateAfterResolved: 'bear-miners-testimony',
    allowedPositions: ['bear-poi-depths-reserve'], spawnPosition: 'bear-poi-depths-reserve', mode: 'cyclic_patrol',
    combat: { id: 'bear_guardian_depths', sceneId: 'bear_mine_galleries', enemies: ['depth_beast', 'cave_rat', 'cave_rat'],
      rewards: { temporaryGold: 70, reputation: 1, materials: { red_gem: 1 } } },
  },
]);

export const BEAR_GUARD_POSTS: Readonly<Record<string, string>> = Object.freeze({
  'bear-guardian-lift': 'bear-poi-mine-lift-cache',
  'bear-guardian-depths': 'bear-poi-depths-reserve',
});

const meta = (region: 0 | 1 | 2, role: PlateauPoiMetadata['role'], participation: PlateauPoiMetadata['participation']): PlateauPoiMetadata =>
  ({ region, role, participation });

export const BEAR_POI_METADATA: Readonly<Record<string, PlateauPoiMetadata>> = Object.freeze({
  'bear-camp': meta(0, 'primary', 'required'),
  'bear-audience': meta(0, 'primary', 'required'),
  'bear-opening-ambush': meta(0, 'structuring', 'required'),
  'bear-raven-messenger': meta(0, 'structuring', 'required'),
  'bear-trapped-miners': meta(0, 'secondary', 'required'),
  'bear-first-trial-event': meta(0, 'secondary', 'alternative'),
  'bear-first-trial-combat': meta(0, 'secondary', 'alternative'),
  'bear-first-refuge': meta(0, 'primary', 'required'),
  'bear-ore-convoy': meta(1, 'structuring', 'required'),
  'bear-mine-road': meta(1, 'structuring', 'required'),
  'bear-second-trial-event': meta(1, 'secondary', 'alternative'),
  'bear-second-trial-combat': meta(1, 'secondary', 'alternative'),
  'bear-sacred-mines': meta(1, 'primary', 'required'),
  'bear-second-refuge': meta(1, 'primary', 'required'),
  'bear-raven-camp': meta(2, 'structuring', 'required'),
  'bear-miners-testimony': meta(2, 'structuring', 'required'),
  'bear-final-trial-event': meta(2, 'secondary', 'alternative'),
  'bear-final-trial-combat': meta(2, 'secondary', 'alternative'),
  'bear-dark-vein': meta(2, 'primary', 'required'),
  'bear-final-refuge': meta(2, 'primary', 'required'),
  'bear-judgement': meta(2, 'primary', 'required'),
  ...Object.fromEntries(BEAR_OPTIONAL_POIS.map((poi) => [poi.id, meta(poi.region, poi.role, poi.participation)])),
});

export const BEAR_TOPOLOGY: PlateauTopology = Object.freeze({
  plateauId: 'bear',
  startNodeId: 'bear-camp',
  route: BEAR_ROUTE,
  legs: BEAR_LEGS,
  localRoutes: Object.freeze([]),
  localRoutesRequire: Object.freeze([]),
  gatedTrial: Object.freeze({ nodeIds: Object.freeze(['bear-first-trial-event', 'bear-first-trial-combat']), gatedNodeId: 'bear-first-refuge' }),
  metadata: BEAR_POI_METADATA,
  optionalPois: BEAR_OPTIONAL_POIS,
  guardians: BEAR_GUARDIANS,
  guardPosts: BEAR_GUARD_POSTS,
  finalRefugeNodeId: 'bear-final-refuge',
});
