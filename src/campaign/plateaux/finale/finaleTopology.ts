/**
 * Set 1.20.0 (TRAVERSAL "Post-demo plateaux"), post-demo Lot 4 — canon since the operator accepted the final act
 * (OD-2026-11-09-A).
 *
 * The corrupted capital (roadmap §3.7, Phase 1): the escape from the arena and the road to the breach, a small POI map
 * under the plateaux's rules (connected movement, once-only resolution, one exclusive fork with branch commitment, a
 * refuge with its services, optional chests and one encounter, one stationary guardian fought in two waves). The
 * capital stays unnamed, as the roadmap leaves it. Place names are descriptive only. Data only: nothing here imports
 * RunSystem.
 */
import type { EliteDefinition, FixedPoiDefinition } from '../../LionPoiAuthoring';
import type { PlateauLeg, PlateauPoiMetadata, PlateauRouteNode, PlateauTopology } from '../PlateauTopology';

type Node = PlateauRouteNode;
const node = (value: Node): Node => Object.freeze({ ...value, links: [...value.links] });

export const FINALE_ROUTE: readonly Node[] = Object.freeze([
  node({ id: 'finale-arena-gate', type: 'story', depth: 0, lane: 0, contentId: 'finale_capital_arrival', label: 'Portes de l’arène', icon: '◆',
    links: ['finale-burning-streets'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'La compagnie s’échappe de l’arène en flammes vers la capitale.' }),
  node({ id: 'finale-burning-streets', type: 'combat', depth: 1, lane: 0, contentId: 'finale_burning_streets', label: 'Rues en flammes', icon: '⚔',
    links: ['finale-allied-rally'], risk: 2, reward: 2, difficulty: 'standard', moralTone: 'neutral',
    hint: 'Des démons occupent les rues qui descendent de l’arène.' }),
  node({ id: 'finale-allied-rally', type: 'story', depth: 2, lane: 0, contentId: 'finale_allied_rally', label: 'Ralliement des clans', icon: '♛',
    links: ['finale-trapped-citizens', 'finale-demon-square'], risk: 0, reward: 3, difficulty: 'safe', moralTone: 'honour',
    hint: 'Les clans que la compagnie a gagnés la rejoignent ; les autres se montrent aussi.' }),
  node({ id: 'finale-trapped-citizens', type: 'event', depth: 3, lane: -1, contentId: 'finale_trapped_citizens', label: 'Habitants sous les décombres', icon: '◇',
    links: ['finale-last-refuge'], risk: 1, reward: 3, difficulty: 'safe', moralTone: 'honour',
    hint: 'Des habitants sont pris sous les décombres d’une rue effondrée.' }),
  node({ id: 'finale-demon-square', type: 'combat', depth: 3, lane: 1, contentId: 'finale_demon_square', label: 'Place des démons', icon: '⚔',
    links: ['finale-last-refuge'], risk: 3, reward: 3, difficulty: 'dangerous', moralTone: 'neutral',
    hint: 'Un démon massif tient la grande place, sur la route la plus courte.' }),
  node({ id: 'finale-last-refuge', type: 'refuge', depth: 4, lane: 0, contentId: 'finale_last_refuge', label: 'Dernière veillée', icon: '⌂',
    links: ['finale-breach'], risk: 0, reward: 1, difficulty: 'safe', moralTone: 'neutral',
    hint: 'Une dernière halte avant la brèche, pour rassembler ce que la compagnie sait des Ombres.' }),
  node({ id: 'finale-breach', type: 'boss', depth: 5, lane: 0, contentId: 'finale_breach', label: 'La brèche', icon: '♛',
    links: [], risk: 3, reward: 3, difficulty: 'decisive', moralTone: 'pragmatic',
    hint: 'Maelor attend au cœur de la brèche, et ce qu’il sert attend derrière lui.' }),
]);

const stage = (nodeIds: string[], mode: 'MANDATORY_INTERRUPT' | 'IN_TRAVERSAL_FORK') => Object.freeze({ nodeIds: Object.freeze(nodeIds), mode });

/** One leg with one exclusive fork: a small map, under the plateaux's rules. */
export const FINALE_LEGS: readonly PlateauLeg[] = Object.freeze([
  Object.freeze({ id: 'F0', originNodeId: 'finale-arena-gate', destinationNodeId: 'finale-last-refuge', stages: Object.freeze([
    stage(['finale-burning-streets'], 'MANDATORY_INTERRUPT'),
    stage(['finale-allied-rally'], 'MANDATORY_INTERRUPT'),
    stage(['finale-trapped-citizens', 'finale-demon-square'], 'IN_TRAVERSAL_FORK'),
  ]) }),
]);

export const FINALE_BRANCH_COMMITMENTS = Object.freeze([
  Object.freeze({ legId: 'F0', resolvingNodeId: 'finale-last-refuge' }),
]);

/** Optional POIs: two chests, one two-variant encounter and one guarded chest. */
export const FINALE_OPTIONAL_POIS: readonly FixedPoiDefinition[] = Object.freeze<FixedPoiDefinition[]>([
  { id: 'finale-poi-armoury', label: 'Armurerie pillée', region: 0, kind: 'chest', role: 'secondary', participation: 'optional',
    prerequisiteResolved: ['finale-burning-streets'], edges: ['finale-burning-streets', 'finale-poi-ruins'],
    contentId: 'poi_chest_finale_armoury', chestLoot: { temporaryGold: 60, temporaryItems: { potion: 2 } } },
  { id: 'finale-poi-ruins', label: 'Maisons effondrées', region: 0, kind: 'combat', role: 'secondary', participation: 'optional',
    prerequisiteResolved: ['finale-burning-streets'], edges: ['finale-poi-armoury', 'finale-allied-rally'],
    // the collapsed houses lie in the burning streets that run down from the arena
    combat: { sceneId: 'finale_burning_streets', variants: [{ id: 'finale_poi_ruins_a', enemyVisualIds: ['breach_demon', 'breach_demon'] },
      { id: 'finale_poi_ruins_b', enemyVisualIds: ['breach_demon', 'cave_rat', 'breach_demon'] }],
    // Post-demo scale: a routine victory gives no reputation.
    rewards: { temporaryGold: 50, reputation: 0, materials: { iron_ore: 1 } } } },
  { id: 'finale-poi-market', label: 'Marché abandonné', region: 0, kind: 'chest', role: 'secondary', participation: 'optional',
    prerequisiteResolved: ['finale-allied-rally'], edges: ['finale-allied-rally', 'finale-poi-reserve'],
    contentId: 'poi_chest_finale_market', chestLoot: { temporaryGold: 70, temporaryItems: { ether: 1, antidote: 1 } } },
  { id: 'finale-poi-reserve', label: 'Réserve des remparts', region: 0, kind: 'chest', role: 'secondary', participation: 'optional',
    prerequisiteResolved: ['finale-allied-rally'], edges: ['finale-allied-rally', 'finale-poi-market'],
    contentId: 'poi_chest_finale_reserve', chestLoot: { temporaryGold: 90, temporaryItems: { red_gem: 1, revive_vial: 1 } } },
]);

/** Set 1.18.0 pattern: one stationary guardian posted on an optional chest, fought in two waves (set 1.19.0). */
export const FINALE_GUARDIANS: readonly EliteDefinition[] = Object.freeze<EliteDefinition[]>([
  {
    id: 'finale-guardian-ramparts', label: 'Démon des remparts', region: 0, activateAfterResolved: 'finale-allied-rally',
    allowedPositions: ['finale-poi-reserve'], spawnPosition: 'finale-poi-reserve', mode: 'cyclic_patrol',
    // fought at the foot of the ramparts, by the reserve it guards
    combat: { id: 'finale_guardian_ramparts', sceneId: 'finale_rampart_reserve', enemies: ['demon_brute', 'breach_demon', 'breach_demon'],
      rewards: { temporaryGold: 90, reputation: 1, materials: { red_gem: 1 } } },
  },
]);

export const FINALE_GUARD_POSTS: Readonly<Record<string, string>> = Object.freeze({ 'finale-guardian-ramparts': 'finale-poi-reserve' });

const meta = (role: PlateauPoiMetadata['role'], participation: PlateauPoiMetadata['participation']): PlateauPoiMetadata =>
  ({ region: 0, role, participation });

export const FINALE_POI_METADATA: Readonly<Record<string, PlateauPoiMetadata>> = Object.freeze({
  'finale-arena-gate': meta('primary', 'required'),
  'finale-burning-streets': meta('structuring', 'required'),
  'finale-allied-rally': meta('primary', 'required'),
  'finale-trapped-citizens': meta('secondary', 'alternative'),
  'finale-demon-square': meta('secondary', 'alternative'),
  'finale-last-refuge': meta('primary', 'required'),
  'finale-breach': meta('primary', 'required'),
  ...Object.fromEntries(FINALE_OPTIONAL_POIS.map((poi) => [poi.id, meta(poi.role, poi.participation)])),
});

export const FINALE_TOPOLOGY: PlateauTopology = Object.freeze({
  plateauId: 'finale',
  startNodeId: 'finale-arena-gate',
  route: FINALE_ROUTE,
  legs: FINALE_LEGS,
  localRoutes: Object.freeze([]),
  localRoutesRequire: Object.freeze([]),
  gatedTrial: Object.freeze({ nodeIds: Object.freeze(['finale-trapped-citizens', 'finale-demon-square']), gatedNodeId: 'finale-last-refuge' }),
  metadata: FINALE_POI_METADATA,
  optionalPois: FINALE_OPTIONAL_POIS,
  guardians: FINALE_GUARDIANS,
  guardPosts: FINALE_GUARD_POSTS,
  finalRefugeNodeId: 'finale-last-refuge',
});
