import { craftRecipeById, getFinalStats, getUnlockedSkillsForHero, itemById, unitById, weaponById } from '../game/catalog';
import { craftItem, equipAccessory, equipWeapon, getCraftGoldCost, getForgeIngredients } from '../game/management';
import { skillById } from '../game/skills';
import type { GameState, UnitInstance, UnitStats } from '../game/types';

/**
 * What a purchase, a sale or a forge recipe would change, read before the player confirms (playtest 2026-11-07).
 * Every preview runs the real owner function (equipWeapon, equipAccessory, craftItem) on a private copy of the state
 * and reads the outcome, so it can never disagree with what the action does. The real state is never touched.
 */

export interface StatChange { label: string; before: number; after: number }

export interface HeroChange {
  unitId: string;
  name: string;
  slotLabel: string;
  /** The item the hero wore in that slot, which goes back to the bag (or into the forge). */
  replacedName: string | null;
  stats: StatChange[];
  gained: string[];
  lost: string[];
  /** A skill an item swaps for another: "Tir Précis devient Tir Calibré (2 PA)". */
  swapped: string[];
  innate: string | null;
}

const WEAPON_STATS = [['Puissance', 'damage'], ['Précision', 'accuracyBonus'], ['Critique', 'critBonus'], ['Portée', 'range']] as const;
const UNIT_STATS: ReadonlyArray<readonly [string, keyof UnitStats]> = [
  ['PV', 'maxHealth'], ['FOR', 'strength'], ['MAG', 'magic'], ['END', 'endurance'], ['DEX', 'dexterity'], ['CHA', 'charisma'], ['DÉPLAC.', 'moveRange'],
];
const ULTIMATE_AP = 5;

const skillLabel = (id: string): string => {
  const skill = skillById.get(id);
  return skill ? `${skill.name} (${skill.ap} PA)` : id;
};
const usableSkills = (unit: UnitInstance): string[] =>
  getUnlockedSkillsForHero(unit).filter((id) => (skillById.get(id)?.ap ?? 0) < ULTIMATE_AP);

function heroChange(before: UnitInstance, after: UnitInstance, slot: 'weapon' | 0 | 1, itemId: string): HeroChange {
  const stats: StatChange[] = [];
  if (slot === 'weapon') {
    const was = weaponById.get(before.equipment.weaponIds[0] ?? '');
    const now = weaponById.get(after.equipment.weaponIds[0] ?? '');
    if (was && now) for (const [label, key] of WEAPON_STATS) if (was[key] !== now[key]) stats.push({ label, before: was[key], after: now[key] });
  }
  const statsBefore = getFinalStats(before), statsAfter = getFinalStats(after);
  for (const [label, key] of UNIT_STATS) if (statsBefore[key] !== statsAfter[key]) stats.push({ label, before: statsBefore[key], after: statsAfter[key] });
  const skillsBefore = usableSkills(before), skillsAfter = usableSkills(after);
  const replacedId = slot === 'weapon' ? before.equipment.weaponIds[0] : before.equipment.accessoryIds[slot];
  const modifier = itemById.get(itemId)?.innateGiftModifier;
  let gained = skillsAfter.filter((id) => !skillsBefore.includes(id));
  let lost = skillsBefore.filter((id) => !skillsAfter.includes(id));
  // The new item's swaps apply; the replaced item's swaps are undone.
  const pairs = [
    ...Object.entries(itemById.get(itemId)?.skillModifier?.replaces ?? {}),
    ...Object.entries((replacedId && itemById.get(replacedId)?.skillModifier?.replaces) || {}).map(([source, replacement]) => [replacement, source] as [string, string]),
  ];
  const swapped: string[] = [];
  for (const [from, to] of pairs) {
    if (!lost.includes(from) || !gained.includes(to)) continue;
    swapped.push(`${skillById.get(from)?.name ?? from} devient ${skillLabel(to)}`);
    lost = lost.filter((id) => id !== from);
    gained = gained.filter((id) => id !== to);
  }
  return {
    unitId: before.id,
    name: before.name,
    slotLabel: slot === 'weapon' ? 'Arme' : `Accessoire ${slot + 1}`,
    replacedName: replacedId ? itemById.get(replacedId)?.name ?? replacedId : null,
    stats,
    gained: gained.map(skillLabel),
    lost: lost.map(skillLabel),
    swapped,
    innate: modifier && (!modifier.targetHeroId || modifier.targetHeroId === before.definitionId) ? modifier.label : null,
  };
}

/** The accessory slot a new accessory goes to: the first free one, else none (the player picks one on the sheet). */
export function freeAccessorySlot(unit: UnitInstance): 0 | 1 | null {
  if (!unit.equipment.accessoryIds[0]) return 0;
  if (!unit.equipment.accessoryIds[1]) return 1;
  return null;
}

/**
 * What equipping one more copy of an item would change for a hero, as if the copy were in the bag. Null when the hero
 * cannot take it: a weapon they cannot wield or already hold, or an accessory with no slot given and none free.
 */
export function previewEquip(state: GameState, unitId: string, itemId: string, slot?: 0 | 1): HeroChange | null {
  const before = state.clan.members.find((unit) => unit.id === unitId);
  const item = itemById.get(itemId);
  if (!before || !item || (item.category !== 'weapons' && item.category !== 'accessories')) return null;
  const copy = structuredClone(state);
  copy.inventory[item.category][itemId] = (copy.inventory[item.category][itemId] ?? 0) + 1;
  if (item.category === 'weapons') {
    if (!equipWeapon(copy, unitId, itemId)) return null;
    return heroChange(before, copy.clan.members.find((unit) => unit.id === unitId)!, 'weapon', itemId);
  }
  const target = slot ?? freeAccessorySlot(before);
  if (target === null || !equipAccessory(copy, unitId, target, itemId)) return null;
  return heroChange(before, copy.clan.members.find((unit) => unit.id === unitId)!, target, itemId);
}

/** The members who could wield a weapon and do not hold it yet; for an accessory, every member. */
export function candidateWearers(state: GameState, itemId: string): UnitInstance[] {
  const item = itemById.get(itemId);
  if (item?.category === 'weapons') {
    return state.clan.members.filter((unit) => unitById.get(unit.definitionId)?.allowedWeaponIds.includes(itemId)
      && !unit.equipment.weaponIds.includes(itemId));
  }
  return item?.category === 'accessories' ? [...state.clan.members] : [];
}

/** The members wearing an item now. */
export function currentWearers(state: GameState, itemId: string): UnitInstance[] {
  return state.clan.members.filter((unit) => unit.equipment.weaponIds.includes(itemId) || unit.equipment.accessoryIds.includes(itemId));
}

export interface CraftMissing { itemId: string; name: string; have: number; need: number; inShop: boolean }
export interface CraftConsumed { itemId: string; name: string; quantity: number; fromBag: number; wornBy: string[]; missing: number }
export interface CraftPreview {
  ready: boolean;
  gold: number;
  outputId: string;
  outputName: string;
  missing: CraftMissing[];
  consumed: CraftConsumed[];
  /** The hero who wears the result at once, in place of the item the recipe takes from them. */
  wearer: HeroChange | null;
  /** True when the result goes to the bag. */
  toBag: boolean;
}

/**
 * What a recipe takes and gives. A recipe the company cannot afford yet is read as if the missing items and gold were
 * in the bag, so the player still sees where the result would go and what it would change.
 */
export function previewCraft(state: GameState, recipeId: string, shopId = 'valmir'): CraftPreview | null {
  const recipe = craftRecipeById.get(recipeId);
  const output = recipe && itemById.get(recipe.output.itemId);
  if (!recipe || !output) return null;
  const ingredients = getForgeIngredients(state, recipe);
  const gold = getCraftGoldCost(state, recipe);
  const stock = state.shops[shopId]?.stock ?? {};
  const missing: CraftMissing[] = ingredients.filter((entry) => entry.carried + entry.worn < entry.quantity).map((entry) => ({
    itemId: entry.itemId, name: itemById.get(entry.itemId)?.name ?? entry.itemId,
    have: entry.carried + entry.worn, need: entry.quantity, inShop: (stock[entry.itemId] ?? 0) > 0,
  }));
  if (state.gold < gold) missing.push({ itemId: 'gold', name: 'Or', have: state.gold, need: gold, inShop: false });
  const copy = structuredClone(state);
  for (const entry of ingredients) {
    const lack = entry.quantity - entry.carried - entry.worn;
    if (lack > 0) copy.inventory[entry.category][entry.itemId] = (copy.inventory[entry.category][entry.itemId] ?? 0) + lack;
  }
  copy.gold = Math.max(copy.gold, gold);
  const crafted = craftItem(copy, recipeId);
  const consumed: CraftConsumed[] = ingredients.map((entry) => {
    const lack = Math.max(0, entry.quantity - entry.carried - entry.worn);
    const wornBy = entry.category === 'materials' ? [] : state.clan.members.filter((unit) => {
      const after = copy.clan.members.find((candidate) => candidate.id === unit.id)!;
      const count = (equipment: UnitInstance['equipment']) => [...equipment.weaponIds, ...equipment.accessoryIds].filter((id) => id === entry.itemId).length;
      return crafted && count(after.equipment) < count(unit.equipment);
    }).map((unit) => unit.name);
    return { itemId: entry.itemId, name: itemById.get(entry.itemId)?.name ?? entry.itemId, quantity: entry.quantity,
      fromBag: Math.min(entry.carried, entry.quantity), wornBy, missing: lack };
  });
  let wearer: HeroChange | null = null;
  if (crafted) {
    for (const unit of state.clan.members) {
      const after = copy.clan.members.find((candidate) => candidate.id === unit.id)!;
      if (output.category === 'weapons' && after.equipment.weaponIds[0] === output.id && unit.equipment.weaponIds[0] !== output.id) {
        wearer = heroChange(unit, after, 'weapon', output.id);
        break;
      }
      const slot = ([0, 1] as const).find((index) => after.equipment.accessoryIds[index] === output.id && unit.equipment.accessoryIds[index] !== output.id);
      if (output.category === 'accessories' && slot !== undefined) { wearer = heroChange(unit, after, slot, output.id); break; }
    }
  }
  const bagBefore = state.inventory[output.category][output.id] ?? 0;
  return {
    ready: missing.length === 0,
    gold,
    outputId: output.id,
    outputName: output.name,
    missing,
    consumed,
    wearer,
    toBag: crafted && (copy.inventory[output.category][output.id] ?? 0) > bagBefore,
  };
}
