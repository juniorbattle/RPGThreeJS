import { combatConfigs } from '../game/content';
import type { CombatConfig } from '../game/types';

const ROAD_POOL = ['wolf_pack', 'spider_nest', 'forest_patrol'] as const;
export function resolveRoadEncounterId(seed: number): string {
  return ROAD_POOL[(seed >>> 0) % ROAD_POOL.length]!;
}

/** Reuses the combat engine and authored enemy composition, never campaign entry or dialogue. */
export function createRoadEncounterConfig(combatId: string): CombatConfig {
  if (!(ROAD_POOL as readonly string[]).includes(combatId)) throw new Error('Unsupported basic road encounter.');
  const source = combatConfigs.get(combatId);
  if (!source) throw new Error(`Missing generic combat composition: ${combatId}`);
  const config = structuredClone(source);
  delete config.preCombatDialogueId;
  delete config.postCombatDialogueId;
  config.encounterLabel = combatId === 'wolf_pack' ? 'Loups des sous-bois'
    : combatId === 'spider_nest' ? 'Araignées de la forêt' : 'Patrouille hostile';
  config.objective = 'Repoussez les ennemis pour reprendre votre traversée.';
  config.rewards = { gold: 0, reputation: 0, materials: {} };
  return config;
}
