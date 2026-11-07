import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/store';
import { equipWeapon } from '../game/management';
import { candidateWearers, previewCraft, previewEquip } from './shopPreview';

/** Playtest 2026-11-07: the fiche shows what a purchase or a recipe changes, read from the owners on a private copy. */
describe('shop and forge previews', () => {
  it('reads a weapon change for its wielder without touching the state', () => {
    const state = createInitialState();
    const before = JSON.stringify(state);
    const change = previewEquip(state, 'warrior', 'steel_greatsword')!;
    expect(change).toMatchObject({ name: 'Alistair', slotLabel: 'Arme', replacedName: 'Espadon novice', gained: ['Charge (3 PA)'], lost: [], swapped: [] });
    expect(change.stats).toContainEqual({ label: 'Puissance', before: 20, after: 25 });
    expect(change.stats).toContainEqual({ label: 'PV', before: 140, after: 165 });
    expect(JSON.stringify(state)).toBe(before);
    expect(previewEquip(state, 'white_mage', 'steel_greatsword')).toBeNull();
    expect(candidateWearers(state, 'steel_greatsword').map(unit => unit.id)).toEqual(['warrior']);
  });

  it('names a swap once, in both directions', () => {
    const state = createInitialState();
    expect(previewEquip(state, 'archer', 'longbow')).toMatchObject({ gained: ['Bond du Faucon (3 PA)'], lost: [], swapped: ['Tir Précis devient Tir Calibré (2 PA)'] });
    state.inventory.weapons.longbow = 1;
    expect(equipWeapon(state, 'archer', 'longbow')).toBe(true);
    expect(previewEquip(state, 'archer', 'novice_longbow')).toMatchObject({ gained: [], lost: ['Bond du Faucon (3 PA)'], swapped: ['Tir Calibré devient Tir Précis (2 PA)'] });
  });

  it('puts an accessory in the first free slot and gives its stat change', () => {
    const state = createInitialState();
    const change = previewEquip(state, 'warrior', 'life_belt')!;
    expect(change).toMatchObject({ slotLabel: 'Accessoire 1', replacedName: null });
    expect(change.stats).toEqual([{ label: 'PV', before: 140, after: 160 }]);
  });

  it('says which hero a forged weapon goes to, or that it goes to the bag', () => {
    const state = createInitialState();
    state.gold = 500; state.inventory.materials.iron_ore = 2;
    const before = JSON.stringify(state);
    const worn = previewCraft(state, 'craft_steel_greatsword')!;
    expect(worn).toMatchObject({ ready: true, toBag: false, missing: [] });
    expect(worn.wearer).toMatchObject({ name: 'Alistair', replacedName: 'Espadon novice', gained: ['Charge (3 PA)'] });
    expect(worn.consumed.find(entry => entry.itemId === 'novice_greatsword')).toMatchObject({ fromBag: 0, wornBy: ['Alistair'], missing: 0 });
    expect(JSON.stringify(state)).toBe(before);
    state.inventory.weapons.novice_greatsword = 1;
    const carried = previewCraft(state, 'craft_steel_greatsword')!;
    expect(carried).toMatchObject({ ready: true, toBag: true, wearer: null });
    expect(carried.consumed.find(entry => entry.itemId === 'novice_greatsword')).toMatchObject({ fromBag: 1, wornBy: [] });
  });

  it('reads a recipe the company cannot afford yet, with what is missing and where to find it', () => {
    const state = createInitialState();
    state.gold = 10;
    const preview = previewCraft(state, 'craft_steel_greatsword')!;
    expect(preview.ready).toBe(false);
    expect(preview.missing).toEqual([
      { itemId: 'iron_ore', name: 'Minerai de fer', have: 0, need: 2, inShop: true },
      { itemId: 'gold', name: 'Or', have: 10, need: preview.gold, inShop: false },
    ]);
    expect(preview.wearer?.name).toBe('Alistair');
    expect(state.gold).toBe(10);
  });
});
