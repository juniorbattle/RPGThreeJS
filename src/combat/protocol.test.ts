import { describe, expect, it } from 'vitest';
import { combatInitializeMessageSchema, combatResultMessageSchema } from './protocol';
import { combatConfigs } from '../game/content';
import { createInitialState } from '../game/store';
import { toCombatant } from '../game/catalog';

describe('combat protocol', () => {
  it('validates initialization without URL payloads', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    state.clan.members[0]!.currentHealth = 77;
    state.clan.members[0]!.skillUpgrades.w_break_guard = 2;
    const clan = state.clan.members.map(toCombatant);
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan,
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.devQa).toBe(false);
    expect(clan[0]!.currentHealth).toBe(77);
    expect(clan[0]!.skillUpgrades.w_break_guard).toBe(2);
  });

  it('accepts the development QA flag only as an explicit initialization field', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map(toCombatant),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
      devQa: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.devQa).toBe(true);
  });

  it('rejects incomplete combat results', () => {
    expect(combatResultMessageSchema.safeParse({
      type: 'rpg-threejs:combat-result',
      victory: true,
    }).success).toBe(false);
  });

  it('validates combat result health payloads', () => {
    expect(combatResultMessageSchema.safeParse({
      type: 'rpg-threejs:combat-result',
      victory: true,
      combatId: 'forest_patrol',
      inventory: { potion: 1 },
      participants: ['knight'],
      unitHealth: { knight: 23 },
    }).success).toBe(true);
  });
});
