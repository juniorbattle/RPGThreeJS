import { describe, expect, it } from 'vitest';
import { buyItem, equipAccessory, equipWeapon, excludeUnit, sellItem } from './management';
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

    expect(migrated.version).toBe(5);
    expect(migrated.run.graph.nodes.length).toBeGreaterThanOrEqual(9);
    expect(migrated.inventory.consumables.potion).toBe(2);
    expect(migrated.clan.members).toHaveLength(4);
    expect(migrated.deployment.unitIds).toHaveLength(4);
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
    expect(migrated.version).toBe(5);
    expect(migrated.clan.members[0]!.equipment.weaponIds).toEqual(['iron_sword', 'wooden_spear']);
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
    expect(migrated.version).toBe(5);
    expect(migrated.run.visitedNodeIds.length).toBeGreaterThan(1);
    expect(migrated.clan.members[0]).not.toHaveProperty('level');
  });
});
