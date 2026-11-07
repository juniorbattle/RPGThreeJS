import { describe, expect, it } from 'vitest';
import {
  buyItem, canCraftItem, craftItem, equipAccessory, equipWeapon, excludeUnit,
  getCraftGoldCost, getFallenUnitCount, getForgeIngredients, getForgeRecipes, isUsefulToCompany, restUnits, sellItem, upgradeSkill, useConsumable,
} from './management';
import { createInitialState, migrateState } from './store';
import {
  createRecruitInstance, createUnitInstance, craftRecipeById, craftRecipes, getEquippedWeaponTier, getLockedSkillReason, getMaxUnlockedSkillAp, getResolvedSkills, getUnlockedSkillsForHero,
  getWeaponProfileLabel, getWeaponSkillUnlockLabel, isSkillUnlockedForHero, isUltimateUnlockedForHero, resolveInitialSkillId,
  describeItemSkillEffects, getWeaponOpenedSkill, itemById, requiredWeaponTierForSkillAp, toCombatant, unitById, weaponById, weapons,
  WEAPON_TIER_RULE, weaponTierLabel,
} from './catalog';
import type { CraftRecipeDefinition } from './types';
import { getFinalStats } from './catalog';
import { skillById } from './skills';
import { combatantPayloadSchema } from '../combat/protocol';
import { renderCombatSkillRows } from '../combat/combatHudPresentation';

const getFinalStatsMax = (unit: Parameters<typeof getFinalStats>[0]) => getFinalStats(unit).maxHealth;

describe('clan management', () => {
  it('swaps equipment without losing inventory items', () => {
    const state = createInitialState();
    const unit = state.clan.members[0]!;
    state.inventory.weapons.steel_greatsword = 1;
    state.inventory.accessories.strength_ring = 1;

    expect(equipWeapon(state, unit.id, 'steel_greatsword')).toBe(true);
    expect(unit.equipment.weaponIds).toEqual(['steel_greatsword']);
    expect(state.inventory.weapons.novice_greatsword).toBe(1);
    expect(state.inventory.weapons.steel_greatsword).toBe(0);
    expect(equipWeapon(state, unit.id, 'steel_greatsword')).toBe(false);

    expect(equipAccessory(state, unit.id, 0, 'strength_ring')).toBe(true);
    expect(unit.equipment.accessoryIds[0]).toBe('strength_ring');
    expect(state.inventory.accessories.strength_ring).toBe(0);
    expect(equipAccessory(state, unit.id, 0, null)).toBe(true);
    expect(state.inventory.accessories.strength_ring).toBe(1);
  });

  it('validates shop gold and persistent stock', () => {
    const state = createInitialState();
    state.gold = 100;
    const initialGold = state.gold;
    const initialStock = state.shops.valmir!.stock.potion!;
    expect(buyItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.gold).toBe(initialGold - 17);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock - 1);
    expect(sellItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.gold).toBe(initialGold - 10);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock);
  });

  it('protects narrative members from exclusion', () => {
    const state = createInitialState();
    expect(excludeUnit(state, 'warrior')).toBe(false);
  });

  it('replaces equipment skills without levels', () => {
    const state = createInitialState();
    const knight = state.clan.members.find((unit) => unit.id === 'warrior')!;
    state.inventory.accessories.strength_ring = 1;
    expect(getResolvedSkills(knight)).toContain('w_break_guard');
    expect(getResolvedSkills(knight)).not.toContain('d_cursed_blade');
    expect(equipAccessory(state, knight.id, 0, 'strength_ring')).toBe(true);
    expect(getResolvedSkills(knight)).not.toContain('w_break_guard');
    expect(getResolvedSkills(knight)).toContain('d_cursed_blade');
    expect(knight).not.toHaveProperty('level');
    expect(knight).not.toHaveProperty('xp');
  });

  it('keeps the initial skill slot free when an accessory swaps it, even with a novice weapon (playtest 2026-11-06)', () => {
    const state = createInitialState();
    const knight = state.clan.members.find((unit) => unit.id === 'warrior')!;
    expect(getEquippedWeaponTier(knight)).toBe(0);
    expect(getUnlockedSkillsForHero(knight)).toEqual(['w_break_guard']);
    state.inventory.accessories.strength_ring = 1;
    expect(equipAccessory(state, knight.id, 0, 'strength_ring')).toBe(true);
    // Anneau de Force: Brise-Garde becomes Lame Maudite (2 AP) and stays usable without a T1 weapon.
    expect(resolveInitialSkillId(knight)).toBe('d_cursed_blade');
    expect(getUnlockedSkillsForHero(knight)).toEqual(['d_cursed_blade']);
    expect(isSkillUnlockedForHero(knight, 'd_cursed_blade')).toBe(true);
    expect(getLockedSkillReason(knight, 'd_cursed_blade')).toBe('');
    // The other skills keep their weapon-tier rule.
    expect(isSkillUnlockedForHero(knight, 'w_charge')).toBe(false);
    // Without the ring, Lame Maudite is not one of Alistair's skills.
    expect(getUnlockedSkillsForHero({ definitionId: 'warrior', equipment: { weaponIds: ['novice_greatsword'], accessoryIds: [null, null] } })).toEqual(['w_break_guard']);
  });

  it('rests wounded units to their calculated maximum health for a gold cost', () => {
    const state = createInitialState();
    state.clan.members[0]!.currentHealth = 12;
    const beforeGold = state.gold;
    expect(restUnits(state)).toBe(true);
    expect(state.clan.members[0]!.currentHealth).toBe(140);
    expect(state.gold).toBe(beforeGold - 15);
    expect(restUnits(state)).toBe(false);
  });

  it('heals a wounded unit with a potion from inventory', () => {
    const state = createInitialState();
    state.inventory.consumables.potion = 2;
    state.clan.members[0]!.currentHealth = 50;
    expect(useConsumable(state, state.clan.members[0]!.id, 'potion')).toBe(true);
    expect(state.clan.members[0]!.currentHealth).toBe(105);
    expect(state.inventory.consumables.potion).toBe(1);
  });

  it('refuses to heal a full-health unit with a potion', () => {
    const state = createInitialState();
    state.inventory.consumables.potion = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'potion')).toBe(false);
    expect(state.inventory.consumables.potion).toBe(1);
  });

  it('revives a fallen unit with a revive vial to 50% HP', () => {
    const state = createInitialState();
    state.inventory.consumables.revive_vial = 1;
    state.clan.members[0]!.currentHealth = 0;
    expect(getFallenUnitCount(state)).toBe(1);
    expect(useConsumable(state, state.clan.members[0]!.id, 'revive_vial')).toBe(true);
    expect(state.clan.members[0]!.currentHealth).toBe(70);
    expect(state.inventory.consumables.revive_vial).toBe(0);
    expect(getFallenUnitCount(state)).toBe(0);
  });

  it('refuses to revive a unit that is still alive', () => {
    const state = createInitialState();
    state.inventory.consumables.revive_vial = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'revive_vial')).toBe(false);
    expect(state.inventory.consumables.revive_vial).toBe(1);
  });

  it('upgrades resolved skills with escalating red gem costs', () => {
    const state = createInitialState();
    state.inventory.materials.red_gem = 3;
    state.inventory.weapons.steel_greatsword = 1;
    const knight = state.clan.members[0]!;
    equipWeapon(state, knight.id, 'steel_greatsword');
    expect(upgradeSkill(state, knight.id, 'w_break_guard')).toBe(true);
    expect(knight.skillUpgrades.w_break_guard).toBe(1);
    expect(state.inventory.materials.red_gem).toBe(2);
    expect(upgradeSkill(state, knight.id, 'w_break_guard')).toBe(true);
    expect(knight.skillUpgrades.w_break_guard).toBe(2);
    expect(state.inventory.materials.red_gem).toBe(0);
    expect(upgradeSkill(state, knight.id, 'w_break_guard')).toBe(false);
    expect(upgradeSkill(state, knight.id, 'unknown')).toBe(false);
  });

  it('crafts fixed shop recipes by consuming permanent ingredients and gold', () => {
    const state = createInitialState();
    state.reputation = 50;
    state.inventory.weapons.steel_greatsword = 1;
    state.inventory.accessories.strength_ring = 1;
    const beforeGold = state.gold;

    expect(canCraftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(craftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(state.gold).toBe(beforeGold - 60);
    expect(state.inventory.weapons.steel_greatsword).toBe(0);
    expect(state.inventory.accessories.strength_ring).toBe(0);
    expect(state.inventory.weapons.lion_guard_greatsword).toBe(1);
    expect(craftItem(state, 'craft_lion_guard_greatsword')).toBe(false);
  });

  it('blocks craft recipes with missing ingredients or insufficient gold', () => {
    const state = createInitialState();
    state.gold = 0;

    expect(canCraftItem(state, 'craft_lion_guard_greatsword')).toBe(false);
    expect(craftItem(state, 'craft_unknown')).toBe(false);
    state.gold = 250;
    expect(canCraftItem(state, 'craft_windstep_longbow')).toBe(false);
  });

  it('craft recipes with material inputs consume materials correctly', () => {
    const state = createInitialState();
    state.inventory.materials.iron_ore = 3;
    state.inventory.weapons.steel_greatsword = 1;
    state.gold = 200;
    state.reputation = 50;

    const recipe: CraftRecipeDefinition = {
      id: 'test_material_recipe',
      name: 'Test Material Recipe',
      description: 'Test recipe with materials',
      inputs: { weapons: { steel_greatsword: 1 }, materials: { iron_ore: 2 }, gold: 80 },
      output: { itemId: 'lion_guard_greatsword', category: 'weapons', quantity: 1 },
      preview: 'test',
    };

    expect(state.inventory.materials.iron_ore).toBe(3);
    expect(state.inventory.weapons.steel_greatsword).toBe(1);

    craftRecipeById.set(recipe.id, recipe);

    expect(canCraftItem(state, recipe.id)).toBe(true);
    expect(craftItem(state, recipe.id)).toBe(true);
    expect(state.inventory.materials.iron_ore).toBe(1);
    expect(state.inventory.weapons.steel_greatsword).toBe(0);
    expect(state.gold).toBe(120);
    expect(state.inventory.weapons.lion_guard_greatsword).toBe(1);

    craftRecipeById.delete(recipe.id);
  });

  it('blocks craft when required materials are missing', () => {
    const state = createInitialState();
    state.inventory.weapons.steel_greatsword = 1;
    state.gold = 200;
    state.inventory.materials.iron_ore = 1;

    const recipe: CraftRecipeDefinition = {
      id: 'test_missing_material',
      name: 'Test Missing Material',
      description: 'Test recipe missing materials',
      inputs: { weapons: { steel_greatsword: 1 }, materials: { iron_ore: 2 }, gold: 80 },
      output: { itemId: 'lion_guard_greatsword', category: 'weapons', quantity: 1 },
      preview: 'test',
    };

    craftRecipeById.set(recipe.id, recipe);

    expect(canCraftItem(state, recipe.id)).toBe(false);
    expect(craftItem(state, recipe.id)).toBe(false);

    craftRecipeById.delete(recipe.id);
  });
});

// OD-2026-11-05-C: an affordable forge that works on what the heroes wear and prices its work by reputation.
describe('affordable forge', () => {
  const ENTRY_RECIPES = ['craft_steel_greatsword', 'craft_sacred_crosier', 'craft_mystic_grimoire', 'craft_longbow', 'craft_steel_dagger',
    'craft_life_belt', 'craft_strength_ring', 'craft_magic_pendant', 'craft_agility_boots'];
  const hero = (state: ReturnType<typeof createInitialState>, id: string) => state.clan.members.find((unit) => unit.definitionId === id)!;

  it('starts a chronicle with 250 gold', () => {
    expect(createInitialState().gold).toBe(250);
  });

  it('makes every entry recipe cheaper than the shop, even after selling the novice weapon', () => {
    for (const id of ENTRY_RECIPES) {
      const recipe = craftRecipeById.get(id)!;
      const output = itemById.get(recipe.output.itemId)!;
      const ore = (recipe.inputs.materials?.iron_ore ?? 0) * itemById.get('iron_ore')!.price;
      const novice = Object.keys(recipe.inputs.weapons ?? {})[0];
      const resale = novice ? Math.floor(itemById.get(novice)!.price / 2) : 0;
      expect(recipe.inputs.gold + ore, id).toBeLessThan(output.price - resale);
      expect(Object.keys(recipe.inputs.materials ?? {}), id).toEqual(['iron_ore']);
    }
  });

  it('upgrades the novice weapon a hero wears in place, so no hero is left unarmed', () => {
    const state = createInitialState();
    state.reputation = 50;
    state.inventory.materials.iron_ore = 2;
    const alistair = hero(state, 'warrior');
    expect(getForgeIngredients(state, craftRecipeById.get('craft_steel_greatsword')!)[0]).toMatchObject({ carried: 0, worn: 1 });
    expect(craftItem(state, 'craft_steel_greatsword')).toBe(true);
    expect(alistair.equipment.weaponIds).toEqual(['steel_greatsword']);
    expect(state.inventory.weapons.novice_greatsword ?? 0).toBe(0);
    expect(state.inventory.weapons.steel_greatsword ?? 0).toBe(0);
    expect(state.inventory.materials.iron_ore).toBe(0);
    expect(state.gold).toBe(250 - 90);
    expect(getEquippedWeaponTier(alistair)).toBe(1);
  });

  it('takes carried items before worn ones', () => {
    const state = createInitialState();
    state.inventory.materials.iron_ore = 2;
    state.inventory.weapons.novice_greatsword = 1;
    const alistair = hero(state, 'warrior');
    expect(craftItem(state, 'craft_steel_greatsword')).toBe(true);
    expect(alistair.equipment.weaponIds).toEqual(['novice_greatsword']);
    expect(state.inventory.weapons.novice_greatsword).toBe(0);
    expect(state.inventory.weapons.steel_greatsword).toBe(1);
  });

  it('forges the Lion blade from the sword and ring Alistair wears, freeing the ring slot', () => {
    const state = createInitialState();
    state.reputation = 50;
    const alistair = hero(state, 'warrior');
    alistair.equipment.weaponIds = ['steel_greatsword'];
    alistair.equipment.accessoryIds = ['strength_ring', null];
    expect(canCraftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(craftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(alistair.equipment.weaponIds).toEqual(['lion_guard_greatsword']);
    expect(alistair.equipment.accessoryIds).toEqual([null, null]);
    expect(state.inventory.weapons.lion_guard_greatsword ?? 0).toBe(0);
    expect(state.gold).toBe(250 - 60);
  });

  it('puts a crafted accessory in the slot its worn ingredients left', () => {
    const state = createInitialState();
    const marian = hero(state, 'white_mage');
    marian.equipment.accessoryIds = ['magic_pendant', 'wisdom_crown'];
    expect(craftItem(state, 'craft_sage_seal')).toBe(true);
    expect(marian.equipment.accessoryIds).toEqual(['sage_seal', null]);
    expect(state.inventory.accessories.sage_seal ?? 0).toBe(0);
  });

  it('never takes a worn weapon whose wearer could not wield the result', () => {
    const state = createInitialState();
    state.inventory.materials.iron_ore = 2;
    const marian = hero(state, 'white_mage');
    marian.equipment.weaponIds = ['steel_greatsword'];
    expect(getForgeIngredients(state, craftRecipeById.get('craft_burn_greatsword')!)[0]).toMatchObject({ carried: 0, worn: 0 });
    expect(craftItem(state, 'craft_burn_greatsword')).toBe(false);
    expect(marian.equipment.weaponIds).toEqual(['steel_greatsword']);
  });

  it('prices the forge by reputation, like the shop', () => {
    const state = createInitialState();
    const recipe = craftRecipeById.get('craft_steel_greatsword')!;
    state.reputation = 30;
    expect(getCraftGoldCost(state, recipe)).toBe(103);
    state.reputation = 50;
    expect(getCraftGoldCost(state, recipe)).toBe(90);
    state.reputation = 70;
    expect(getCraftGoldCost(state, recipe)).toBe(81);
    state.reputation = 50;
    state.gold = 89;
    state.inventory.materials.iron_ore = 2;
    expect(canCraftItem(state, recipe.id)).toBe(false);
  });

  it('lists accessory recipes and only the weapons someone in the company can wield', () => {
    const state = createInitialState();
    const listed = getForgeRecipes(state).map((recipe) => recipe.id);
    expect(listed).toEqual(expect.arrayContaining(['craft_steel_greatsword', 'craft_sacred_crosier', 'craft_mystic_grimoire', 'craft_longbow', 'craft_life_belt', 'craft_sage_seal']));
    for (const hidden of ['craft_steel_dagger', 'craft_venom_dagger', 'craft_chill_spear', 'craft_burn_cannon', 'craft_curse_scythe']) expect(listed).not.toContain(hidden);
    state.clan.members.push(createUnitInstance('rogue'));
    expect(getForgeRecipes(state).map((recipe) => recipe.id)).toEqual(expect.arrayContaining(['craft_steel_dagger', 'craft_venom_dagger']));
  });
});

// OD-2026-11-05-D: every demo hero can reach a T2 weapon, and the shop and forge stay coherent in what they offer and ask.
describe('coherent shop and masterwork forge', () => {
  const DEMO = ['warrior', 'white_mage', 'dark_mage', 'archer', 'rogue', 'lancer'];

  it('gives every demo hero a T2 weapon from the forge, and Garen brings his own since no refuge follows his arrival', () => {
    for (const id of DEMO) {
      const allowed = unitById.get(id)!.allowedWeaponIds;
      const t2 = craftRecipes.filter((recipe) => recipe.output.category === 'weapons' && weaponById.get(recipe.output.itemId)?.tier === 2
        && allowed.includes(recipe.output.itemId));
      expect(t2.length, id).toBeGreaterThan(0);
    }
    const garen = createRecruitInstance('lancer');
    expect(garen.equipment.weaponIds).toEqual(['griffon_spear']);
    expect(getEquippedWeaponTier(garen)).toBe(2);
    expect(isSkillUnlockedForHero(garen, 'l_haft_recoil')).toBe(true);
    expect(garen.currentHealth).toBe(getFinalStatsMax(garen));
    expect(createRecruitInstance('rogue').equipment.weaponIds).toEqual(['novice_dagger']);
  });

  it('never asks more for a recipe than its result is worth, counting what it consumes', () => {
    // An input is worth its price, except a novice weapon: nobody sells one, so it is worth what selling it would earn.
    const worth = (id: string) => (weaponById.get(id)?.tier === 0 ? Math.floor(itemById.get(id)!.price / 2) : itemById.get(id)!.price);
    for (const recipe of craftRecipes) {
      const consumed = [...Object.entries(recipe.inputs.weapons ?? {}), ...Object.entries(recipe.inputs.accessories ?? {}), ...Object.entries(recipe.inputs.materials ?? {})]
        .reduce((sum, [id, quantity]) => sum + worth(id) * quantity, recipe.inputs.gold);
      expect(consumed, recipe.id).toBeLessThanOrEqual(itemById.get(recipe.output.itemId)!.price);
    }
  });

  it('orders the demo weapons novice, then T1, then T2 by price', () => {
    for (const id of DEMO) {
      const byTier = new Map<number, number[]>();
      for (const weaponId of unitById.get(id)!.allowedWeaponIds) {
        const weapon = weaponById.get(weaponId)!;
        byTier.set(weapon.tier, [...(byTier.get(weapon.tier) ?? []), weapon.price]);
      }
      expect(Math.max(...byTier.get(0)!), id).toBeLessThan(Math.min(...byTier.get(1)!));
      expect(Math.max(...byTier.get(1)!), id).toBeLessThan(Math.min(...byTier.get(2)!));
    }
  });

  it('offers only weapons someone in the company can wield', () => {
    const state = createInitialState();
    expect(isUsefulToCompany(state, 'steel_greatsword')).toBe(true);
    expect(isUsefulToCompany(state, 'steel_dagger')).toBe(false);
    expect(isUsefulToCompany(state, 'sacred_mace')).toBe(false);
    expect(isUsefulToCompany(state, 'potion')).toBe(true);
    expect(isUsefulToCompany(state, 'agility_boots')).toBe(true);
    state.clan.members.push(createUnitInstance('rogue'));
    expect(isUsefulToCompany(state, 'steel_dagger')).toBe(true);
  });
});

describe('weapon progression', () => {
  it('initial heroes carry their first skill into combat and V6 reload without buying equipment', () => {
    const state = createInitialState();
    const saved = JSON.stringify(state);
    const expected = ['w_break_guard', 'w_salvation', 'n_dark_bolt', 'a_precise_shot'];
    for (const [index, hero] of state.clan.members.entries()) {
      expect(getEquippedWeaponTier(hero)).toBe(0);
      expect(toCombatant(hero).skills).toEqual([expected[index]]);
      expect(isUltimateUnlockedForHero(hero)).toBe(false);
    }
    expect(JSON.stringify(state)).toBe(saved);
    const loaded = migrateState(JSON.parse(saved));
    expect(loaded.clan.members.map(hero => toCombatant(hero).skills)).toEqual(expected.map(id => [id]));
    expect(getUnlockedSkillsForHero(createUnitInstance('paladin'))).toEqual([]);
  });

  it('rogue and lancer retain their first skill after recruitment and V6 reload while higher skills stay gated', () => {
    const state = createInitialState();
    for (const definitionId of ['rogue', 'lancer']) state.clan.members.push(createUnitInstance(definitionId));
    const saved = JSON.stringify(state);
    const reloaded = migrateState(JSON.parse(saved));
    for (const hero of reloaded.clan.members) {
      const skills = unitById.get(hero.definitionId)!.skillIds;
      expect(getEquippedWeaponTier(hero)).toBe(0);
      expect(toCombatant(hero).skills).toEqual([skills[0]]);
      expect(getLockedSkillReason(hero, skills[0]!)).toBe('');
      for (const skill of skills.slice(1)) expect(isSkillUnlockedForHero(hero, skill)).toBe(false);
      expect(isUltimateUnlockedForHero(hero)).toBe(false);
    }
    expect(JSON.stringify(state)).toBe(saved);
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_dagger')!)).toBe('Compétence initiale disponible');
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_spear')!)).toBe('Compétence initiale disponible');
  });

  it('a T1 weapon opens the 3 AP skill (OD-2026-11-07-B)', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(getEquippedWeaponTier(warrior)).toBe(1);
    expect(getUnlockedSkillsForHero(warrior)).toEqual(['w_break_guard', 'w_charge']);
  });

  it('a T2 weapon opens the 4 AP skill, through its swap: the Espadon du Lion gives Rempart du Serment', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.lion_guard_greatsword = 1;
    equipWeapon(state, warrior.id, 'lion_guard_greatsword');
    expect(getEquippedWeaponTier(warrior)).toBe(2);
    const unlocked = getUnlockedSkillsForHero(warrior);
    expect(unlocked).toEqual(['w_break_guard', 'w_charge', 'p_oathwall']);
    expect(unlocked).not.toContain('w_whirl');
  });

  it('each weapon tier opens one more skill, with no tier beyond T2 needed', () => {
    expect([0, 1, 2].map(getMaxUnlockedSkillAp)).toEqual([2, 3, 4]);
    expect([2, 3, 4].map(requiredWeaponTierForSkillAp)).toEqual([0, 1, 2]);
    expect(Math.max(...weapons.map(weapon => weapon.tier))).toBe(2);
    // Every demo hero's 4 AP skill is reachable with a T2 weapon of the demo.
    for (const id of ['white_mage', 'dark_mage', 'archer', 'rogue', 'lancer']) {
      const hero = unitById.get(id)!;
      const t2 = hero.allowedWeaponIds.map(weaponId => weaponById.get(weaponId)).find(weapon => weapon?.tier === 2)!;
      expect(t2, id).toBeDefined();
      const opened = getWeaponOpenedSkill(t2, { definitionId: id, equipment: { weaponIds: [], accessoryIds: [null, null] } });
      expect(opened?.ap, id).toBe(4);
    }
  });

  it('ultimate remains locked regardless of weapon tier', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.lion_guard_greatsword = 1;
    equipWeapon(state, warrior.id, 'lion_guard_greatsword');
    expect(isUltimateUnlockedForHero(warrior)).toBe(false);
    const unlocked = getUnlockedSkillsForHero(warrior);
    expect(unlocked).not.toContain('w_lion_surge');
  });

  it('locked skill reason text is correct', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('');
    // OD-2026-11-07-H: tiers read T1, T2, T3; the novice weapon is T1.
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('Débloquée avec arme T2');
    expect(getLockedSkillReason(warrior, 'w_whirl')).toBe('Débloquée avec arme T3');
    expect(getLockedSkillReason(warrior, 'w_lion_surge')).toBe('Ultime — éveil spécial requis');
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('');
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('');
    expect(getLockedSkillReason(warrior, 'w_whirl')).toBe('Débloquée avec arme T3');
  });

  it('shows weapon tiers as T1, T2 and T3 everywhere, from unchanged data tiers (OD-2026-11-07-H)', () => {
    expect([0, 1, 2].map(weaponTierLabel)).toEqual(['T1', 'T2', 'T3']);
    expect(WEAPON_TIER_RULE).toBe('Le palier de l’arme ouvre les compétences : T1 celle à 2 PA, T2 celle à 3 PA, T3 celle à 4 PA.');
    expect(weaponById.get('novice_greatsword')!.tier).toBe(0);
    expect(weaponById.get('lion_guard_greatsword')!.tier).toBe(2);
    expect(craftRecipeById.get('craft_steel_greatsword')!.preview).toMatch(/^T2 espadon/);
    expect(craftRecipeById.get('craft_lion_guard_greatsword')!.preview).toMatch(/^T3 espadon/);
    expect(craftRecipeById.get('craft_lion_guard_greatsword')!.name).toBe('Forger l’Espadon du Lion');
    expect(craftRecipes.every(recipe => !/\bT0\b/.test(recipe.preview ?? ''))).toBe(true);
  });

  it('never offers a weapon weaker than the one every wielder holds; same-tier variants stay (OD-2026-11-07-H)', () => {
    const state = createInitialState();
    const warrior = state.clan.members.find(unit => unit.definitionId === 'warrior')!;
    expect(isUsefulToCompany(state, 'steel_greatsword')).toBe(true);
    // Alistair already holds the novice greatsword: it is not offered again.
    expect(isUsefulToCompany(state, 'novice_greatsword')).toBe(false);
    warrior.equipment.weaponIds[0] = 'steel_greatsword';
    expect(isUsefulToCompany(state, 'novice_greatsword')).toBe(false);
    expect(isUsefulToCompany(state, 'ember_greatsword')).toBe(true);
    warrior.equipment.weaponIds[0] = 'lion_guard_greatsword';
    expect(isUsefulToCompany(state, 'steel_greatsword')).toBe(false);
    expect(getForgeRecipes(state).some(recipe => recipe.output.itemId === 'ember_greatsword')).toBe(false);
    // The weapon he already holds is not offered again either.
    expect(getForgeRecipes(state).some(recipe => recipe.output.itemId === 'lion_guard_greatsword')).toBe(false);
    warrior.equipment.weaponIds[0] = 'steel_greatsword';
    expect(isUsefulToCompany(state, 'steel_greatsword')).toBe(false);
    expect(getForgeRecipes(state).some(recipe => recipe.output.itemId === 'lion_guard_greatsword')).toBe(true);
    // Garen arrives with the Lance du Griffon: the steel spear and the hooked spear are no longer offered.
    state.clan.members.push(createRecruitInstance('lancer'));
    expect(isUsefulToCompany(state, 'steel_spear')).toBe(false);
    expect(getForgeRecipes(state).some(recipe => recipe.output.itemId === 'frost_spear')).toBe(false);
    expect(isUsefulToCompany(state, 'potion')).toBe(true);
  });

  it('weapon skill unlock label is correct', () => {
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_greatsword')!)).toBe('Compétence initiale disponible');
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_mace')!)).toBe('Aucune compétence active');
    expect(getWeaponSkillUnlockLabel(weaponById.get('steel_greatsword')!)).toBe('Débloque : compétence 3 PA');
    expect(getWeaponSkillUnlockLabel(weaponById.get('lion_guard_greatsword')!)).toBe('Débloque : compétence 4 PA');
  });

  it('names what each item does to skills, for one hero or for every demo hero it concerns', () => {
    const bare = { definitionId: 'warrior', equipment: { weaponIds: [] as string[], accessoryIds: [null, null] as [null, null] } };
    expect(describeItemSkillEffects('steel_greatsword')).toEqual(['Alistair : débloque Charge (3 PA)']);
    expect(describeItemSkillEffects('steel_greatsword', bare)).toEqual(['débloque Charge (3 PA)']);
    expect(describeItemSkillEffects('lion_guard_greatsword')).toEqual(['Alistair : débloque Rempart du Serment (4 PA), Tourbillon d\'Acier devient Rempart du Serment']);
    expect(describeItemSkillEffects('windstep_longbow')).toEqual(['Kestrel : débloque Pluie de Flèches (4 PA), Bond du Faucon devient Pas d\'Ombre']);
    expect(describeItemSkillEffects('longbow')).toEqual(['Kestrel : débloque Bond du Faucon (3 PA), Tir Précis devient Tir Calibré']);
    expect(describeItemSkillEffects('strength_ring')).toEqual(['Alistair : Brise-Garde devient Lame Maudite']);
    expect(describeItemSkillEffects('sage_seal')).toEqual(['Marian : Purification devient Rune de Vigueur']);
    expect(describeItemSkillEffects('novice_greatsword')).toEqual(['Alistair : Brise-Garde (2 PA)']);
    expect(describeItemSkillEffects('life_belt')).toEqual([]);
  });

  it('never lets a swap weaken a skill: the Tir Calibré of the Arc long matches or beats the Tir Précis (OD-2026-11-07-B)', () => {
    const precise = skillById.get('a_precise_shot')!, calibrated = skillById.get('ar_calibrated_shot')!;
    expect(calibrated.ap).toBe(precise.ap);
    expect(calibrated.power).toBeGreaterThanOrEqual(precise.power!);
    expect(calibrated.crit).toBeGreaterThanOrEqual(precise.crit!);
    expect(calibrated.acc).toBeGreaterThanOrEqual(precise.acc!);
    expect(calibrated.status).toBe(precise.status);
    expect(calibrated.statusTurns).toBeGreaterThanOrEqual(precise.statusTurns!);
  });

  it('weapon profile label is correct', () => {
    expect(getWeaponProfileLabel(weaponById.get('novice_grimoire')!)).toBe('magique');
    expect(getWeaponProfileLabel(weaponById.get('steel_rapier')!)).toBe('précision');
    expect(getWeaponProfileLabel(weaponById.get('lion_guard_greatsword')!)).toBe('défensif');
  });

  it('toCombatant only includes unlocked skills', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    expect(toCombatant(warrior).skills).toEqual(['w_break_guard']);
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    const payload = toCombatant(warrior);
    expect(payload.skills).toContain('w_break_guard');
    expect(payload.skills).toContain('w_charge');
    expect(payload.skills).not.toContain('w_whirl');
    // OD-2026-11-07-E: combat lists only the skills the hero can use, never a locked one or the ultimate.
    expect(payload).not.toHaveProperty('lockedSkills');
    expect(combatantPayloadSchema.parse(payload).skills).toEqual(['w_break_guard', 'w_charge']);
    const rows = renderCombatSkillRows(payload.skills.map(id => ({ id, name: id, cost: 2, description: 'x', disabled: false })));
    expect(rows).not.toContain('w_whirl');
    expect(rows).not.toContain('Arme T');
  });

  it('upgradeSkill rejects locked skills', () => {
    const state = createInitialState();
    state.inventory.materials.red_gem = 3;
    const warrior = state.clan.members[0]!;
    expect(upgradeSkill(state, warrior.id, 'w_charge')).toBe(false);
    expect(upgradeSkill(state, warrior.id, 'w_break_guard')).toBe(true);
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(upgradeSkill(state, warrior.id, 'w_break_guard')).toBe(true);
  });

  it('equipWeapon clamps currentHealth to new maxHealth', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.lion_guard_greatsword = 1;
    equipWeapon(state, warrior.id, 'lion_guard_greatsword');
    warrior.currentHealth = 190;
    equipWeapon(state, warrior.id, 'novice_greatsword');
    expect(warrior.currentHealth).toBe(140);
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
      roster: ['warrior', 'white_mage', 'dark_mage', 'archer'],
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
            accessoryIds: unit.equipment.accessoryIds.slice(0, 2) as [string | null, string | null],
          },
        })),
      },
    };
    const migrated = migrateState(v2);
    expect(migrated.version).toBe(6);
    expect(migrated.clan.members[0]!.equipment.weaponIds).toEqual(['novice_greatsword']);
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

describe('equipment identity', () => {
  it('weapons do not have innateModifier field', () => {
    for (const weapon of Object.values(weaponById)) {
      expect(weapon).not.toHaveProperty('innateModifier');
    }
  });

  it('normal accessories do not have innateGiftModifier', () => {
    const state = createInitialState();
    for (const id of Object.keys(state.inventory.accessories)) {
      const item = itemById.get(id);
      if (item?.category === 'accessories') {
        expect(item.innateGiftModifier).toBeUndefined();
      }
    }
  });

  it('innateGiftModifier is optional and safe when absent', () => {
    const state = createInitialState();
    const unit = state.clan.members[0]!;
    state.inventory.accessories.strength_ring = 1;
    expect(equipAccessory(state, unit.id, 0, 'strength_ring')).toBe(true);
  });

  it('all grimoire weapons have range 1', () => {
    for (const id of ['novice_grimoire', 'mystic_grimoire', 'abyssal_grimoire']) {
      expect(weaponById.get(id)!.range, id).toBe(1);
    }
  });

  it('all crosier weapons have range 1', () => {
    for (const id of ['novice_crosier', 'sacred_crosier', 'miracle_crosier']) {
      expect(weaponById.get(id)!.range, id).toBe(1);
    }
  });

  it('all wand weapons have range 1', () => {
    for (const id of ['novice_wand', 'orb_scepter', 'harmony_scepter']) {
      expect(weaponById.get(id)!.range, id).toBe(1);
    }
  });

  it('rapier weapons still have range 2', () => {
    for (const id of ['novice_rapier', 'steel_rapier', 'crimson_rapier']) {
      expect(weaponById.get(id)!.range, id).toBe(2);
    }
  });

  it('toCombatant payload for dark_mage has weapon range 1', () => {
    const state = createInitialState();
    const darkMage = state.clan.members.find((u) => u.definitionId === 'dark_mage')!;
    const payload = toCombatant(darkMage);
    expect(payload.weapons[0]!.range).toBe(1);
  });

  it('toCombatant payload for white_mage has weapon range 1', () => {
    const state = createInitialState();
    const whiteMage = state.clan.members.find((u) => u.definitionId === 'white_mage')!;
    const payload = toCombatant(whiteMage);
    expect(payload.weapons[0]!.range).toBe(1);
  });

  it('toCombatant payload for enchanter has weapon range 1', () => {
    const enchanter = createUnitInstance('enchanter');
    const payload = toCombatant(enchanter);
    expect(payload.weapons[0]!.range).toBe(1);
  });

  it('getWeaponProfileLabel still returns magique for magical weapons', () => {
    expect(getWeaponProfileLabel(weaponById.get('novice_grimoire')!)).toBe('magique');
    expect(getWeaponProfileLabel(weaponById.get('novice_crosier')!)).toBe('magique');
    expect(getWeaponProfileLabel(weaponById.get('novice_wand')!)).toBe('magique');
  });
});

describe('weapon affix variants', () => {
  const variantIds = ['ember_greatsword', 'venom_dagger', 'frost_spear', 'hex_grimoire', 'eclipse_longbow', 'inferno_cannon', 'shadow_scythe'];

  it('all variant weapons exist in catalog', () => {
    for (const id of variantIds) {
      expect(weaponById.has(id), id).toBe(true);
    }
  });

  it('all variant weapons have basicAttackStatus', () => {
    for (const id of variantIds) {
      const weapon = weaponById.get(id)!;
      expect(weapon.basicAttackStatus, id).toBeDefined();
    }
  });

  it('all variant affix statuses are allowed (no staggered/stun)', () => {
    const allowed = ['burn', 'poison', 'slow', 'root', 'blind', 'weak', 'curse'];
    for (const id of variantIds) {
      const status = weaponById.get(id)!.basicAttackStatus!.status;
      expect(allowed, id).toContain(status);
    }
  });

  it('ember_greatsword is in warrior allowedWeaponIds', () => {
    const state = createInitialState();
    const warrior = state.clan.members.find((u) => u.definitionId === 'warrior')!;
    const def = warrior;
    expect(def.equipment.weaponIds).toContain('novice_greatsword');
  });

  it('each variant is in the correct unit allowedWeaponIds', () => {
    const expected: Record<string, string> = {
      ember_greatsword: 'warrior',
      venom_dagger: 'rogue',
      frost_spear: 'lancer',
      hex_grimoire: 'dark_mage',
      eclipse_longbow: 'archer',
      inferno_cannon: 'artillerist',
      shadow_scythe: 'dark_knight',
    };
    for (const [weaponId, unitId] of Object.entries(expected)) {
      const unit = unitById.get(unitId)!;
      expect(unit.allowedWeaponIds, `${weaponId} in ${unitId}`).toContain(weaponId);
    }
  });

  it('new material recipes can be crafted when ingredients are available', () => {
    const state = createInitialState();
    state.inventory.weapons.steel_greatsword = 1;
    state.inventory.materials.iron_ore = 2;
    state.gold = 200;

    expect(canCraftItem(state, 'craft_burn_greatsword')).toBe(true);
    expect(craftItem(state, 'craft_burn_greatsword')).toBe(true);
    expect(state.inventory.weapons.ember_greatsword).toBe(1);
    expect(state.inventory.materials.iron_ore).toBe(0);
  });

  it('new material recipes fail when materials are missing', () => {
    const state = createInitialState();
    state.inventory.weapons.steel_greatsword = 1;
    state.gold = 200;
    state.inventory.materials.iron_ore = 1;

    expect(canCraftItem(state, 'craft_burn_greatsword')).toBe(false);
    expect(craftItem(state, 'craft_burn_greatsword')).toBe(false);
  });

  it('starting inventory has only consumables', () => {
    const state = createInitialState();
    expect(state.inventory.consumables).toEqual({ potion: 4, revive_vial: 1, antidote: 2 });
    expect(Object.keys(state.inventory.accessories)).toHaveLength(0);
    expect(Object.keys(state.inventory.materials)).toHaveLength(0);
    expect(Object.keys(state.inventory.weapons)).toHaveLength(0);
  });

  it('shop stock holds the T1 weapon of each demo hero and no weapon of another hero (OD-2026-11-05-D)', () => {
    const state = createInitialState();
    const stock = state.shops.valmir!.stock;
    for (const id of ['steel_greatsword', 'sacred_crosier', 'mystic_grimoire', 'longbow', 'steel_dagger', 'steel_spear']) expect(stock[id], id).toBe(1);
    for (const id of ['sacred_mace', 'steel_scythe', 'steel_rapier', 'orb_scepter', 'steel_shuriken', 'siege_cannon']) expect(stock[id], id).toBeUndefined();
    const stockedWeapons = Object.keys(stock).filter((id) => weaponById.has(id));
    expect(stockedWeapons.every((id) => weaponById.get(id)!.tier === 1)).toBe(true);
  });

  it('shop stock includes materials and wisdom_crown', () => {
    const state = createInitialState();
    const stock = state.shops.valmir!.stock;
    expect(stock.iron_ore).toBeGreaterThanOrEqual(1);
    expect(stock.red_gem).toBeGreaterThanOrEqual(1);
    expect(stock.wisdom_crown).toBeGreaterThanOrEqual(1);
    expect(stock.warding_buckle).toBeGreaterThanOrEqual(1);
  });

  it('ether is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.ether = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'ether')).toBe(false);
    expect(state.inventory.consumables.ether).toBe(1);
  });

  it('antidote is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.antidote = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'antidote')).toBe(false);
    expect(state.inventory.consumables.antidote).toBe(1);
  });

  it('bomb is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.bomb = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'bomb')).toBe(false);
    expect(state.inventory.consumables.bomb).toBe(1);
  });

  it('starting inventory does not include grenades', () => {
    const state = createInitialState();
    expect(state.inventory.consumables.grenade_incendiaire ?? 0).toBe(0);
    expect(state.inventory.consumables.grenade_entravante ?? 0).toBe(0);
    expect(state.inventory.consumables.grenade_aveuglante ?? 0).toBe(0);
  });

  it('grenade_incendiaire is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.grenade_incendiaire = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'grenade_incendiaire')).toBe(false);
    expect(state.inventory.consumables.grenade_incendiaire).toBe(1);
  });

  it('grenade_entravante is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.grenade_entravante = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'grenade_entravante')).toBe(false);
    expect(state.inventory.consumables.grenade_entravante).toBe(1);
  });

  it('grenade_aveuglante is not usable from management (combat-only)', () => {
    const state = createInitialState();
    state.inventory.consumables.grenade_aveuglante = 1;
    expect(useConsumable(state, state.clan.members[0]!.id, 'grenade_aveuglante')).toBe(false);
    expect(state.inventory.consumables.grenade_aveuglante).toBe(1);
  });
});
