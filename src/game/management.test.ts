import { describe, expect, it } from 'vitest';
import {
  buyItem, canCraftItem, craftItem, equipAccessory, equipWeapon, excludeUnit,
  restUnits, sellItem, upgradeSkill,
} from './management';
import { createInitialState, migrateState } from './store';
import { getResolvedSkills } from './catalog';

describe('clan management', () => {
  it('swaps equipment without losing inventory items', () => {
    const state = createInitialState();
    const unit = state.clan.members[0]!;

    expect(equipWeapon(state, unit.id, 0, 'steel_sword')).toBe(true);
    expect(unit.equipment.weaponIds).toEqual(['steel_sword', 'wooden_spear']);
    expect(state.inventory.weapons.iron_sword).toBe(1);
    expect(state.inventory.weapons.steel_sword).toBe(0);
    expect(equipWeapon(state, unit.id, 1, 'steel_sword')).toBe(false);

    expect(equipAccessory(state, unit.id, 0, 'strength_ring')).toBe(true);
    expect(unit.equipment.accessoryIds[0]).toBe('strength_ring');
    expect(state.inventory.accessories.strength_ring).toBe(0);
    expect(equipAccessory(state, unit.id, 0, null)).toBe(true);
    expect(state.inventory.accessories.strength_ring).toBe(1);
  });

  it('validates shop gold and persistent stock', () => {
    const state = createInitialState();
    state.run.temporaryLoot.gold = 100;
    const initialGold = state.run.temporaryLoot.gold;
    const initialStock = state.shops.valmir!.stock.potion!;
    expect(buyItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.run.temporaryLoot.gold).toBe(initialGold - 15);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock - 1);
    expect(sellItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.run.temporaryLoot.gold).toBe(initialGold - 8);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock);
  });

  it('protects narrative members from exclusion', () => {
    const state = createInitialState();
    expect(excludeUnit(state, 'knight')).toBe(false);
  });

  it('grants equipment skills without levels', () => {
    const state = createInitialState();
    const knight = state.clan.members.find((unit) => unit.id === 'knight')!;
    expect(getResolvedSkills(knight)).not.toContain('heavy');
    expect(equipAccessory(state, knight.id, 0, 'strength_ring')).toBe(true);
    expect(getResolvedSkills(knight)).toContain('heavy');
    expect(knight).not.toHaveProperty('level');
    expect(knight).not.toHaveProperty('xp');
  });

  it('rests wounded units to their calculated maximum health for a gold cost', () => {
    const state = createInitialState();
    state.clan.members[0]!.currentHealth = 12;
    const beforeGold = state.gold;
    expect(restUnits(state)).toBe(true);
    expect(state.clan.members[0]!.currentHealth).toBe(140);
    expect(state.gold).toBe(beforeGold - 10);
    expect(restUnits(state)).toBe(false);
  });

  it('upgrades resolved skills with escalating red gem costs', () => {
    const state = createInitialState();
    state.inventory.materials.red_gem = 3;
    const knight = state.clan.members[0]!;
    expect(upgradeSkill(state, knight.id, 'whirl')).toBe(true);
    expect(knight.skillUpgrades.whirl).toBe(1);
    expect(state.inventory.materials.red_gem).toBe(2);
    expect(upgradeSkill(state, knight.id, 'whirl')).toBe(true);
    expect(knight.skillUpgrades.whirl).toBe(2);
    expect(state.inventory.materials.red_gem).toBe(0);
    expect(upgradeSkill(state, knight.id, 'whirl')).toBe(false);
    expect(upgradeSkill(state, knight.id, 'unknown')).toBe(false);
  });

  it('crafts fixed shop recipes by consuming permanent ingredients and gold', () => {
    const state = createInitialState();
    const beforeGold = state.gold;

    expect(canCraftItem(state, 'craft_lion_guard_blade')).toBe(true);
    expect(craftItem(state, 'craft_lion_guard_blade')).toBe(true);
    expect(state.gold).toBe(beforeGold - 80);
    expect(state.inventory.weapons.steel_sword).toBe(0);
    expect(state.inventory.accessories.strength_ring).toBe(0);
    expect(state.inventory.weapons.lion_guard_blade).toBe(1);
    expect(craftItem(state, 'craft_lion_guard_blade')).toBe(false);
  });

  it('blocks craft recipes with missing ingredients or insufficient gold', () => {
    const state = createInitialState();
    state.gold = 0;

    expect(canCraftItem(state, 'craft_lion_guard_blade')).toBe(false);
    expect(craftItem(state, 'craft_unknown')).toBe(false);
    state.gold = 250;
    expect(canCraftItem(state, 'craft_windstep_bow')).toBe(false);
  });
});

describe('save migration', () => {
  it('migrates a v1 save into the categorized v2 state', () => {
    const migrated = migrateState({
      version: 1,
      currentNodeId: 'camp',
      stepCounter: 2,
      resolvedNodeIds: ['camp'],
      combatCooldowns: {},
      mysteryAssignments: {},
      seenUniqueEvents: [],
      flags: { chapterStarted: true },
      gold: 99,
      reputation: 42,
      inventory: { potion: 2, bomb: 1 },
      roster: ['knight', 'cleric', 'mage', 'archer'],
      endingId: null,
    });

    expect(migrated.version).toBe(6);
    expect(migrated.run.graph.nodes.length).toBeGreaterThanOrEqual(9);
    expect(migrated.inventory.consumables.potion).toBe(2);
    expect(migrated.clan.members).toHaveLength(4);
    expect(migrated.deployment.unitIds).toHaveLength(4);
    expect(migrated.clan.members[0]).toHaveProperty('currentHealth');
    expect(migrated.clan.members[0]).toHaveProperty('skillUpgrades');
  });

  it('migrates a v2 weapon into the first v3 weapon slot', () => {
    const current = createInitialState();
    const v2 = {
      ...current,
      version: 2,
      clan: {
        ...current.clan,
        members: current.clan.members.map((unit) => ({
          ...unit,
          level: 1,
          xp: 0,
          equipment: {
            weaponId: unit.equipment.weaponIds[0],
            accessoryIds: unit.equipment.accessoryIds,
          },
        })),
      },
    };
    const migrated = migrateState(v2);
    expect(migrated.version).toBe(6);
    expect(migrated.clan.members[0]!.equipment.weaponIds).toEqual(['iron_sword', 'wooden_spear']);
    expect(migrated.clan.members[0]!.currentHealth).toBe(140);
  });

  it('migrates v3 saves with a route history', () => {
    const current = createInitialState();
    const { visitedNodeIds: _visitedNodeIds, run: _run, reputationHistory: _history, ...v3 } = current;
    const migrated = migrateState({
      ...v3,
      version: 3,
      currentNodeId: 'village',
      resolvedNodeIds: ['camp', 'lion', 'mystery-a'],
      clan: {
        ...v3.clan,
        members: v3.clan.members.map((unit) => ({ ...unit, level: 1, xp: 0 })),
      },
    });
    expect(migrated.version).toBe(6);
    expect(migrated.run.visitedNodeIds.length).toBeGreaterThan(1);
    expect(migrated.clan.members[0]).not.toHaveProperty('level');
    expect(migrated.clan.members[0]).toHaveProperty('skillUpgrades');
  });
});
