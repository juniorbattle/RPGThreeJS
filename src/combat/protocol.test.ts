import { describe, expect, it } from 'vitest';
import {
  combatInitializeMessageSchema,
  combatInitializedMessageSchema,
  combatResultMessageSchema,
  combatantPayloadSchema,
  weaponPayloadSchema,
} from './protocol';
import { combatConfigs } from '../game/content';
import { createInitialState } from '../game/store';
import { equipWeapon } from '../game/management';
import { toCombatant } from '../game/catalog';

describe('combat protocol', () => {
  it('validates initialization without URL payloads', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, state.clan.members[0]!.id, 'steel_greatsword');
    state.clan.members[0]!.currentHealth = 77;
    state.clan.members[0]!.skillUpgrades.w_break_guard = 2;
    const clan = state.clan.members.map((u) => toCombatant(u));
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
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
      devQa: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.devQa).toBe(true);
  });

  it('recognizes a fully initialized combat scene', () => {
    expect(combatInitializedMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialized',
    }).success).toBe(true);
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
      participants: ['warrior'],
      unitHealth: { warrior: 23 },
    }).success).toBe(true);
  });

  it('validates combat result with dead units (hp: 0)', () => {
    expect(combatResultMessageSchema.safeParse({
      type: 'rpg-threejs:combat-result',
      victory: true,
      combatId: 'forest_patrol',
      inventory: { potion: 1 },
      participants: ['warrior', 'cleric'],
      unitHealth: { warrior: 23, cleric: 0 },
    }).success).toBe(true);
  });
});

describe('weapon basic attack status affixes', () => {
  const baseWeapon = {
    id: 'test_weapon',
    name: 'Test Weapon',
    description: 'Test',
    category: 'weapons' as const,
    price: 100,
    icon: '⚔',
    type: 'greatsword' as const,
    damage: 20,
    range: 1,
    accuracyBonus: 5,
    critBonus: 5,
  };

  it('accepts a weapon with basicAttackStatus using allowed statuses', () => {
    for (const status of ['burn', 'poison', 'slow', 'root', 'blind', 'weak', 'curse'] as const) {
      const parsed = weaponPayloadSchema.safeParse({
        ...baseWeapon,
        basicAttackStatus: { status, chance: 0.15, turns: 1 },
      });
      expect(parsed.success, status).toBe(true);
    }
  });

  it('accepts a weapon without basicAttackStatus', () => {
    const parsed = weaponPayloadSchema.safeParse(baseWeapon);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.basicAttackStatus).toBeUndefined();
  });

  it('rejects staggered as a weapon basicAttackStatus', () => {
    const parsed = weaponPayloadSchema.safeParse({
      ...baseWeapon,
      basicAttackStatus: { status: 'staggered', chance: 0.15, turns: 1 },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects stun as a weapon basicAttackStatus', () => {
    const parsed = weaponPayloadSchema.safeParse({
      ...baseWeapon,
      basicAttackStatus: { status: 'stun', chance: 0.15, turns: 1 },
    });
    expect(parsed.success).toBe(false);
  });

  it('preserves basicAttackStatus through combatantPayloadSchema', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    const payload = toCombatant(warrior);
    const weaponWithAffix = {
      ...payload.weapons[0]!,
      basicAttackStatus: { status: 'burn' as const, chance: 0.15, turns: 1 },
    };
    const combatant = {
      ...payload,
      weapons: [weaponWithAffix],
    };
    const parsed = combatantPayloadSchema.safeParse(combatant);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.weapons[0]?.basicAttackStatus?.status).toBe('burn');
    expect(parsed.data?.weapons[0]?.basicAttackStatus?.chance).toBe(0.15);
  });
});

describe('V10C.3B QA protocol fields', () => {
  it('accepts qaFullAp: true', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
      devQa: true,
      qaFullAp: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.qaFullAp).toBe(true);
  });

  it('defaults qaFullAp to false when omitted', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.qaFullAp).toBe(false);
  });

  it('existing valid payloads still parse without qaFullAp', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
      devQa: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.devQa).toBe(true);
    expect(parsed.data?.qaFullAp).toBe(false);
  });
});

describe('V10C.3B.2 qaDeployAll protocol field', () => {
  it('accepts qaDeployAll: true', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: [],
      reducedGraphics: false,
      devQa: true,
      qaDeployAll: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.qaDeployAll).toBe(true);
  });

  it('defaults qaDeployAll to false when omitted', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.qaDeployAll).toBe(false);
  });

  it('existing valid payloads still parse without qaDeployAll', () => {
    const state = createInitialState();
    const config = combatConfigs.get('forest_patrol')!;
    const parsed = combatInitializeMessageSchema.safeParse({
      type: 'rpg-threejs:combat-initialize',
      config,
      clan: state.clan.members.map((u) => toCombatant(u)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
      devQa: true,
      qaFullAp: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.qaDeployAll).toBe(false);
  });
});
