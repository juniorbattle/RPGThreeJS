import annex from '../../docs/project/RPGThreeJS_LOT_E_MANIFEST_AUTHORING_FINAL_2026-10-15.json';
import type { CombatConfig, RunNode } from '../game/types';

export interface PoiRewards {
  temporaryGold: number;
  reputation: number;
  materials: Record<string, number>;
}
export interface FixedPoiDefinition {
  id: string; label: string; region: 0|1|2; kind: 'chest'|'combat';
  role: 'secondary'; participation: 'optional'; prerequisiteResolved: string[]; edges: string[];
  contentId?: string;
  chestLoot?: {temporaryGold: number; temporaryItems: Record<string, number>};
  combat?: {sceneId: string; variants: {id: string; enemyVisualIds: string[]}[]; rewards: PoiRewards};
}
export interface EliteDefinition {
  id: string; label: string; region: 1|2; activateAfterResolved: string;
  allowedPositions: string[]; spawnPosition: string;
  mode: 'cyclic_patrol'|'bounded_one_edge_graph_chase';
  combat: {id: string; sceneId: string; enemies: string[]; rewards: PoiRewards};
}

/** The operator's exact approved annex is the single catalogue; no UI-authored payloads. */
export const LOT_E_POIS = annex.fixedPoiCandidates as FixedPoiDefinition[];
export const LOT_E_ELITES = annex.mobileEliteActors as EliteDefinition[];
export const LION_CANONICAL_POI_IDS: readonly string[] = annex.protectedCanonicalIds;
export const LOT_E_EDGES = LOT_E_POIS.flatMap(poi => poi.edges.map(to => ({from: poi.id, to})));

export function poiVariantIndex(seed: number, poiId: string, count: number): number {
  let hash = 2166136261;
  for (const char of `${seed}:${poiId}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % count;
}

export function makeExpeditionNodes(seed: number): RunNode[] {
  return LOT_E_POIS.map(poi => ({
    id: poi.id, type: poi.kind === 'chest' ? 'chest' : 'combat',
    // No return edges are inserted into the directed canonical recovery graph.
    depth: [4,8,13][poi.region]!, links: [], x: 0, z: 0,
    contentId: poi.contentId ?? poi.combat!.variants[poiVariantIndex(seed, poi.id, poi.combat!.variants.length)]!.id,
    label: poi.label, icon: poi.kind === 'chest' ? '▣' : '⚔',
    difficulty: poi.kind === 'chest' ? 'safe' : 'standard',
    risk: poi.kind === 'chest' ? 0 : 2, reward: 2,
    hint: poi.kind === 'chest' ? 'Réserves facultatives · Butin temporaire, une seule ouverture.'
      : 'Combat facultatif · Formation stable et récompense unique.',
  }));
}

const rewards = (value: PoiRewards): CombatConfig['rewards'] => ({
  gold: value.temporaryGold, reputation: value.reputation, materials: {...value.materials},
});
export function lotECombatConfigs(): CombatConfig[] {
  return [
    ...LOT_E_POIS.flatMap(poi => poi.combat?.variants.map(variant => ({
      id: variant.id, sceneId: poi.combat!.sceneId, objective: 'Remportez ce combat facultatif.',
      encounterLabel: poi.label, encounterRank: 'normal' as const,
      enemyVisualIds: [...variant.enemyVisualIds], escortVisualIds: [], maxPlayerUnits: 4,
      rewards: rewards(poi.combat!.rewards),
    })) ?? []),
    ...LOT_E_ELITES.map(elite => ({
      id: elite.combat.id, sceneId: elite.combat.sceneId, objective: 'Affrontez la menace pour libérer le passage.',
      encounterLabel: elite.label, encounterRank: 'elite' as const,
      enemyVisualIds: [...elite.combat.enemies], escortVisualIds: [], maxPlayerUnits: 3,
      rewards: rewards(elite.combat.rewards),
    })),
  ];
}
