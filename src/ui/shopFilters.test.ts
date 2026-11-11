import { describe, expect, it } from 'vitest';
import { itemById, weaponById } from '../game/catalog';
import { canCraftItem, equipWeapon, getForgeRecipes, isUsefulToCompany } from '../game/management';
import { createInitialState } from '../game/store';
import {
  filterForgeEntries, filterShopEntries, forgeEntries, forgeFilterCounts, SHOP_CATEGORY_ORDER, shopEntries, shopFilterCounts,
} from './shopFilters';

// Playtest 2026-11-11: « trier par type d'items achetables ou forgeables ».
describe('shop filters', () => {
  it('lists the useful stock grouped by type, weapons first, and filters one type', () => {
    const state = createInitialState();
    const entries = shopEntries(state, 'valmir', 'buy');
    const order = entries.map((entry) => SHOP_CATEGORY_ORDER.indexOf(entry.category));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(entries.every((entry) => isUsefulToCompany(state, entry.id) && entry.quantity > 0)).toBe(true);
    const consumables = filterShopEntries(entries, 'consumables');
    expect(consumables.length).toBeGreaterThan(0);
    expect(consumables.every((entry) => itemById.get(entry.id)!.category === 'consumables')).toBe(true);
    expect(filterShopEntries(entries, 'all')).toEqual(entries);
    const counts = shopFilterCounts(entries, 'all');
    expect(counts[0]).toEqual({ filter: 'all', count: entries.length });
    expect(counts.slice(1).reduce((sum, entry) => sum + entry.count, 0)).toBe(entries.length);
  });

  it('keeps OD-2026-11-07-H under every filter: no weapon already worn or weaker than what its wielders hold', () => {
    const state = createInitialState();
    const alistair = state.clan.members.find((unit) => unit.id === 'warrior')!;
    state.inventory.weapons.steel_greatsword = 1;
    expect(equipWeapon(state, alistair.id, 'steel_greatsword')).toBe(true);
    const weapons = filterShopEntries(shopEntries(state, 'valmir', 'buy'), 'weapons');
    expect(weapons.map((entry) => entry.id)).not.toContain('steel_greatsword');
    expect(weapons.every((entry) => weaponById.has(entry.id) && isUsefulToCompany(state, entry.id))).toBe(true);
  });

  it('lists the whole bag to sell, and a sold-out type stays as the active filter with no line', () => {
    const state = createInitialState();
    state.inventory.materials.iron_ore = 2;
    const entries = shopEntries(state, 'valmir', 'sell');
    expect(filterShopEntries(entries, 'materials').map((entry) => entry.id)).toContain('iron_ore');
    state.inventory.materials = {};
    const after = shopEntries(state, 'valmir', 'sell');
    expect(shopFilterCounts(after, 'materials').find((entry) => entry.filter === 'materials')).toEqual({ filter: 'materials', count: 0 });
    expect(shopFilterCounts(after, 'all').some((entry) => entry.filter === 'materials')).toBe(false);
  });
});

describe('forge filters', () => {
  it('lists every useful recipe once, ready ones first, filtered by type of result', () => {
    const state = createInitialState();
    state.gold = 1000;
    state.inventory.materials.iron_ore = 2;
    const entries = forgeEntries(state);
    expect(entries.map((entry) => entry.recipe.id)).toEqual(getForgeRecipes(state).map((recipe) => recipe.id));
    expect(entries.every((entry) => entry.ready === canCraftItem(state, entry.recipe.id))).toBe(true);
    const all = filterForgeEntries(entries, 'all', false);
    expect(all.ready.length).toBeGreaterThan(0);
    expect(all.later.length).toBeGreaterThan(0);
    expect(all.ready.length + all.later.length).toBe(entries.length);
    expect(all.ready.every((entry) => entry.ready)).toBe(true);
    expect(all.later.every((entry) => !entry.ready)).toBe(true);
    const accessories = filterForgeEntries(entries, 'accessories', false);
    expect([...accessories.ready, ...accessories.later].every((entry) => entry.recipe.output.category === 'accessories')).toBe(true);
    const readyOnly = filterForgeEntries(entries, 'all', true);
    expect(readyOnly.later).toEqual([]);
    expect(readyOnly.ready).toEqual(all.ready);
    const counts = forgeFilterCounts(entries, true);
    expect(counts.find((entry) => entry.filter === 'all')!.count).toBe(all.ready.length);
  });

  it('shows nothing ready when the company has no gold', () => {
    const state = createInitialState();
    state.gold = 0;
    const { ready, later } = filterForgeEntries(forgeEntries(state), 'all', false);
    expect(ready).toEqual([]);
    expect(later.length).toBe(getForgeRecipes(state).length);
  });
});
