import { describe, expect, it } from 'vitest';
import {
  buyItem, buyItems, equipWeapon, getBuyUnitPrice, getMaxBuyQuantity, getMaxSellQuantity, getSellUnitPrice, sellItem, sellItems,
} from './management';
import { getShopPrice } from './reputation';
import { itemById } from './catalog';
import { createInitialState } from './store';

// Playtest 2026-11-11: « pouvoir acheter en multiple des items ». The owner buys or sells a whole quantity at once.
describe('buying and selling in quantity', () => {
  it('debits the exact total at the current reputation price, takes it from the stock and fills the bag', () => {
    const state = createInitialState();
    state.gold = 500;
    state.reputation = 85; // Renommé: 15 × 0.78 = 11.7, rounded per unit to 12.
    const unit = getBuyUnitPrice(state, 'potion')!;
    expect(unit).toBe(getShopPrice(itemById.get('potion')!.price, 85));
    expect(unit).toBe(12);
    const stock = state.shops.valmir!.stock.potion!;
    const bag = state.inventory.consumables.potion ?? 0;
    expect(buyItems(state, 'valmir', 'potion', 3)).toBe(true);
    expect(state.gold).toBe(500 - 36); // 3 × 12, never round(3 × 11.7) = 35.
    expect(state.shops.valmir!.stock.potion).toBe(stock - 3);
    expect(state.inventory.consumables.potion).toBe(bag + 3);
  });

  it('bounds the quantity by the gold held and by the stock', () => {
    const state = createInitialState();
    state.reputation = 30; // Méfiant: potion at 17.
    state.gold = 60;
    expect(getMaxBuyQuantity(state, 'valmir', 'potion')).toBe(3);
    state.gold = 10_000;
    expect(getMaxBuyQuantity(state, 'valmir', 'potion')).toBe(state.shops.valmir!.stock.potion);
    state.gold = 16;
    expect(getMaxBuyQuantity(state, 'valmir', 'potion')).toBe(0);
    expect(getMaxBuyQuantity(state, 'valmir', 'unknown_item')).toBe(0);
    expect(getMaxBuyQuantity(state, 'nowhere', 'potion')).toBe(0);
  });

  it('is atomic: a quantity beyond the gold or the stock, or not a whole positive number, changes nothing', () => {
    const state = createInitialState();
    state.gold = 60;
    const untouched = JSON.stringify(state);
    expect(buyItems(state, 'valmir', 'potion', 4)).toBe(false); // 4 × 17 = 68 > 60
    expect(JSON.stringify(state)).toBe(untouched);
    state.gold = 10_000;
    const rich = JSON.stringify(state);
    const stock = state.shops.valmir!.stock.revive_vial!;
    expect(buyItems(state, 'valmir', 'revive_vial', stock + 1)).toBe(false);
    for (const quantity of [0, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(buyItems(state, 'valmir', 'potion', quantity)).toBe(false);
    expect(JSON.stringify(state)).toBe(rich);
    expect(buyItems(state, 'valmir', 'revive_vial', stock)).toBe(true);
    expect(state.shops.valmir!.stock.revive_vial).toBe(0);
    expect(buyItems(state, 'valmir', 'revive_vial', 1)).toBe(false);
  });

  it('sells only what the bag carries, at half the base price per unit, in one transaction', () => {
    const state = createInitialState();
    state.gold = 0;
    state.inventory.materials.iron_ore = 5;
    const stock = state.shops.valmir!.stock.iron_ore!;
    expect(getSellUnitPrice('iron_ore')).toBe(Math.floor(itemById.get('iron_ore')!.price / 2));
    expect(getMaxSellQuantity(state, 'valmir', 'iron_ore')).toBe(5);
    const before = JSON.stringify(state);
    expect(sellItems(state, 'valmir', 'iron_ore', 6)).toBe(false);
    expect(sellItems(state, 'valmir', 'iron_ore', 0)).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
    expect(sellItems(state, 'valmir', 'iron_ore', 4)).toBe(true);
    expect(state.inventory.materials.iron_ore).toBe(1);
    expect(state.shops.valmir!.stock.iron_ore).toBe(stock + 4);
    expect(state.gold).toBe(4 * getSellUnitPrice('iron_ore')!);
  });

  it('never sells a worn weapon: only the carried copies count', () => {
    const state = createInitialState();
    const alistair = state.clan.members.find((unit) => unit.id === 'warrior')!;
    state.inventory.weapons.steel_greatsword = 1;
    expect(equipWeapon(state, alistair.id, 'steel_greatsword')).toBe(true);
    expect(getMaxSellQuantity(state, 'valmir', 'steel_greatsword')).toBe(0);
    expect(sellItems(state, 'valmir', 'steel_greatsword', 1)).toBe(false);
    expect(alistair.equipment.weaponIds).toEqual(['steel_greatsword']);
  });

  it('keeps buyItem and sellItem as a quantity of one, and adds no save field', () => {
    const state = createInitialState();
    state.gold = 100;
    const keys = Object.keys(state).sort();
    expect(buyItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.gold).toBe(83);
    expect(sellItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.gold).toBe(90);
    expect(Object.keys(state).sort()).toEqual(keys);
  });
});
