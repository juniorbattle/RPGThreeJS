import { describe, expect, it } from 'vitest';
import {
  buyItem, canCraftItem, craftItem, equipAccessory, equipWeapon, excludeUnit,
  getCraftGoldCost, getFallenUnitCount, getForgeIngredients, getForgeRecipes, restUnits, sellItem, upgradeSkill, useConsumable,
} from './management';
import { createInitialState, migrateState } from './store';
import {
  createUnitInstance, craftRecipeById, getEquippedWeaponTier, getLockedSkillReason, getMaxUnlockedSkillAp, getResolvedSkills, getUnlockedSkillsForHero,
  getWeaponProfileLabel, getWeaponSkillUnlockLabel, isSkillUnlockedForHero, isUltimateUnlockedForHero,
  itemById, toCombatant, unitById, weaponById,
} from './catalog';
import type { CraftRecipeDefinition } from './types';

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
    expect(state.gold).toBe(beforeGold - 70);
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
    expect(state.gold).toBe(250 - 70);
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

  it('T1 hero unlocks only the 2AP skill', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(getEquippedWeaponTier(warrior)).toBe(1);
    const unlocked = getUnlockedSkillsForHero(warrior);
    expect(unlocked).toContain('w_break_guard');
    expect(unlocked).not.toContain('w_charge');
    expect(unlocked).not.toContain('w_whirl');
    expect(unlocked).not.toContain('w_lion_surge');
  });

  it('T2 hero unlocks 2AP and 3AP skills', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.lion_guard_greatsword = 1;
    equipWeapon(state, warrior.id, 'lion_guard_greatsword');
    expect(getEquippedWeaponTier(warrior)).toBe(2);
    const unlocked = getUnlockedSkillsForHero(warrior);
    expect(unlocked).toContain('w_break_guard');
    expect(unlocked).toContain('w_charge');
    expect(unlocked).not.toContain('w_whirl');
  });

  it('T3 helper would unlock 4AP skills', () => {
    expect(getMaxUnlockedSkillAp(3)).toBe(4);
  });

  it('ultimate remains locked regardless of weapon tier', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    state.inventory.weapons.lion_guard_greatsword = 1;
    equipWeapon(state, warrior.id, 'lion_guard_greatsword');
    expect(isUltimateUnlockedForHero(warrior)).toBe(false);
    const unlocked = getUnlockedSkillsForHero(warrior);
    expect(unlocked).not.toContain('w_lion_surge');
    expect(unlocked).not.toContain('p_oathwall');
  });

  it('locked skill reason text is correct', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('');
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('Débloquée avec arme T2');
    expect(getLockedSkillReason(warrior, 'w_whirl')).toBe('Débloquée avec arme T3');
    expect(getLockedSkillReason(warrior, 'w_lion_surge')).toBe('Ultimate — éveil spécial requis');
    state.inventory.weapons.steel_greatsword = 1;
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('');
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('Débloquée avec arme T2');
  });

  it('weapon skill unlock label is correct', () => {
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_greatsword')!)).toBe('Compétence initiale disponible');
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_mace')!)).toBe('Aucune compétence active');
    expect(getWeaponSkillUnlockLabel(weaponById.get('steel_greatsword')!)).toBe('Compétence 2 PA disponible');
    expect(getWeaponSkillUnlockLabel(weaponById.get('lion_guard_greatsword')!)).toBe('Débloque : compétence 3 PA');
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
    expect(payload.skills).not.toContain('w_charge');
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

  it('shop stock includes all 12 T1 weapons', () => {
    const state = createInitialState();
    const stock = state.shops.valmir!.stock;
    const t1Weapons = ['steel_greatsword', 'sacred_mace', 'steel_scythe', 'steel_spear', 'mystic_grimoire', 'sacred_crosier', 'steel_rapier', 'orb_scepter', 'longbow', 'steel_shuriken', 'steel_dagger', 'siege_cannon'];
    for (const id of t1Weapons) {
      expect(stock[id], id).toBeGreaterThanOrEqual(1);
    }
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
