import { describe, expect, it } from 'vitest';
import {
  buyItem, canCraftItem, craftItem, equipAccessory, equipWeapon, excludeUnit,
  getFallenUnitCount, restUnits, sellItem, upgradeSkill, useConsumable,
} from './management';
import { createInitialState, migrateState } from './store';
import {
  createUnitInstance, getEquippedWeaponTier, getLockedSkillReason, getMaxUnlockedSkillAp, getResolvedSkills, getUnlockedSkillsForHero,
  getWeaponProfileLabel, getWeaponSkillUnlockLabel, isSkillUnlockedForHero, isUltimateUnlockedForHero,
  itemById, toCombatant, weaponById,
} from './catalog';

describe('clan management', () => {
  it('swaps equipment without losing inventory items', () => {
    const state = createInitialState();
    const unit = state.clan.members[0]!;

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
    state.run.temporaryLoot.gold = 100;
    const initialGold = state.run.temporaryLoot.gold;
    const initialStock = state.shops.valmir!.stock.potion!;
    expect(buyItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.run.temporaryLoot.gold).toBe(initialGold - 17);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock - 1);
    expect(sellItem(state, 'valmir', 'potion')).toBe(true);
    expect(state.run.temporaryLoot.gold).toBe(initialGold - 10);
    expect(state.shops.valmir!.stock.potion).toBe(initialStock);
  });

  it('protects narrative members from exclusion', () => {
    const state = createInitialState();
    expect(excludeUnit(state, 'warrior')).toBe(false);
  });

  it('replaces equipment skills without levels', () => {
    const state = createInitialState();
    const knight = state.clan.members.find((unit) => unit.id === 'warrior')!;
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
    const beforeGold = state.gold;

    expect(canCraftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(craftItem(state, 'craft_lion_guard_greatsword')).toBe(true);
    expect(state.gold).toBe(beforeGold - 120);
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
});

describe('weapon progression', () => {
  it('T0 hero has no unlocked active skills', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
    expect(getEquippedWeaponTier(warrior)).toBe(0);
    expect(getUnlockedSkillsForHero(warrior)).toHaveLength(0);
  });

  it('T1 hero unlocks only the 2AP skill', () => {
    const state = createInitialState();
    const warrior = state.clan.members[0]!;
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
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('Débloquée avec arme T1');
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('Débloquée avec arme T2');
    expect(getLockedSkillReason(warrior, 'w_whirl')).toBe('Débloquée avec arme T3');
    expect(getLockedSkillReason(warrior, 'w_lion_surge')).toBe('Ultimate — éveil spécial requis');
    equipWeapon(state, warrior.id, 'steel_greatsword');
    expect(getLockedSkillReason(warrior, 'w_break_guard')).toBe('');
    expect(getLockedSkillReason(warrior, 'w_charge')).toBe('Débloquée avec arme T2');
  });

  it('weapon skill unlock label is correct', () => {
    expect(getWeaponSkillUnlockLabel(weaponById.get('novice_greatsword')!)).toBe('Aucune compétence active');
    expect(getWeaponSkillUnlockLabel(weaponById.get('steel_greatsword')!)).toBe('Débloque : compétence 2 PA');
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
    expect(toCombatant(warrior).skills).toHaveLength(0);
    equipWeapon(state, warrior.id, 'steel_greatsword');
    const payload = toCombatant(warrior);
    expect(payload.skills).toContain('w_break_guard');
    expect(payload.skills).not.toContain('w_charge');
  });

  it('upgradeSkill rejects locked skills', () => {
    const state = createInitialState();
    state.inventory.materials.red_gem = 3;
    const warrior = state.clan.members[0]!;
    expect(upgradeSkill(state, warrior.id, 'w_break_guard')).toBe(false);
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
