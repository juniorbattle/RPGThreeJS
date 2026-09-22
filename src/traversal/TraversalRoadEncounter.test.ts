import { expect, it } from 'vitest';
import { combatConfigs } from '../game/content';
import { createRoadEncounterConfig, resolveRoadEncounterId } from './TraversalRoadEncounter';

it('reuses seeded authored enemy pools without canonical narrative hooks or rewards', () => {
  expect(new Set([0, 1, 2].map(resolveRoadEncounterId)).size).toBe(3);
  for (const seed of [0, 1, 2, -42, 1000]) {
    const id = resolveRoadEncounterId(seed);
    const original = structuredClone(combatConfigs.get(id)!);
    const local = createRoadEncounterConfig(id);
    expect(local.enemyVisualIds).toEqual(original.enemyVisualIds);
    expect(local.preCombatDialogueId).toBeUndefined();
    expect(local.postCombatDialogueId).toBeUndefined();
    expect(local.rewards).toEqual({ gold: 0, reputation: 0, materials: {} });
    expect(combatConfigs.get(id)).toEqual(original);
  }
  expect(() => createRoadEncounterConfig('lion-chief')).toThrow();
});
