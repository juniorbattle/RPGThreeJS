import { describe, expect, it } from 'vitest';
import { combatInitializeMessageSchema, combatResultMessageSchema } from './protocol';
import { combatConfigs } from '../game/content';
import { createInitialState } from '../game/store';
import { toCombatant } from '../game/catalog';

describe('combat protocol', () => {
  it('validates initialization without URL payloads', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map(toCombatant),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects incomplete combat results', () => {
    expect(combatResultMessageSchema.safeParse({
      type: 'rpg-threejs:combat-result',
      victory: true,
    }).success).toBe(false);
  });
});
