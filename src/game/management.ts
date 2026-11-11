import { craftRecipeById, craftRecipes, getEquippedWeaponTier, getFinalStats, getResolvedSkills, isSkillUnlockedForHero, itemById, unitById, weaponById } from './catalog';
import { getShopPrice } from './reputation';
import type { CraftRecipeDefinition, GameState, InventoryState, ItemCategory, UnitInstance } from './types';

function adjust(inventory: InventoryState, category: ItemCategory, itemId: string, amount: number): void {
  inventory[category][itemId] = Math.max(0, (inventory[category][itemId] ?? 0) + amount);
}

export const MAX_SKILL_UPGRADE_LEVEL = 2;
export const REST_COST_PER_WOUNDED_UNIT = 15;

export function getSkillUpgradeCost(currentLevel: number): number | null {
  return currentLevel >= MAX_SKILL_UPGRADE_LEVEL ? null : currentLevel + 1;
}

export function getWoundedUnitCount(state: GameState): number {
  return state.clan.members.filter((unit) => unit.currentHealth < getFinalStats(unit).maxHealth).length;
}

export function getFallenUnitCount(state: GameState): number {
  return state.clan.members.filter((unit) => unit.currentHealth === 0).length;
}

export function getRestCost(state: GameState): number {
  return getWoundedUnitCount(state) * REST_COST_PER_WOUNDED_UNIT;
}

export function equipWeapon(state: GameState, unitId: string, weaponId: string): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  const definition = unit && unitById.get(unit.definitionId);
  if (
    !unit
    || !definition
    || !definition.allowedWeaponIds.includes(weaponId)
    || unit.equipment.weaponIds.includes(weaponId)
    || (state.inventory.weapons[weaponId] ?? 0) < 1
  ) return false;
  const previous = unit.equipment.weaponIds[0];
  if (!previous) return false;
  adjust(state.inventory, 'weapons', previous, 1);
  adjust(state.inventory, 'weapons', weaponId, -1);
  unit.equipment.weaponIds[0] = weaponId;
  unit.currentHealth = Math.min(unit.currentHealth, getFinalStats(unit).maxHealth);
  return true;
}

export function equipAccessory(state: GameState, unitId: string, slot: 0 | 1, accessoryId: string | null): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  if (!unit) return false;
  if (accessoryId && (state.inventory.accessories[accessoryId] ?? 0) < 1) return false;
  const previous = unit.equipment.accessoryIds[slot];
  if (previous) adjust(state.inventory, 'accessories', previous, 1);
  if (accessoryId) adjust(state.inventory, 'accessories', accessoryId, -1);
  unit.equipment.accessoryIds[slot] = accessoryId;
  unit.currentHealth = Math.min(unit.currentHealth, getFinalStats(unit).maxHealth);
  return true;
}

export function restUnits(state: GameState): boolean {
  const cost = getRestCost(state);
  if (cost <= 0 || state.gold < cost) return false;
  state.gold -= cost;
  for (const unit of state.clan.members) {
    unit.currentHealth = getFinalStats(unit).maxHealth;
  }
  return true;
}

const CONSUMABLE_HEAL_AMOUNT: Record<string, number> = {
  potion: 55,
};

export function useConsumable(state: GameState, unitId: string, itemId: string): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  if (!unit) return false;
  if ((state.inventory.consumables[itemId] ?? 0) < 1) return false;
  const maxHealth = getFinalStats(unit).maxHealth;
  if (itemId === 'revive_vial') {
    if (unit.currentHealth > 0) return false;
    unit.currentHealth = Math.floor(maxHealth * 0.5);
  } else {
    const healAmount = CONSUMABLE_HEAL_AMOUNT[itemId];
    if (healAmount === undefined) return false;
    if (unit.currentHealth >= maxHealth) return false;
    unit.currentHealth = Math.min(maxHealth, unit.currentHealth + healAmount);
  }
  adjust(state.inventory, 'consumables', itemId, -1);
  return true;
}

export function upgradeSkill(state: GameState, unitId: string, skillId: string): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  if (!unit) return false;
  if (!getResolvedSkills(unit).includes(skillId)) return false;
  if (!isSkillUnlockedForHero(unit, skillId)) return false;
  const currentLevel = Math.max(0, Math.min(MAX_SKILL_UPGRADE_LEVEL, unit.skillUpgrades[skillId] ?? 0));
  const cost = getSkillUpgradeCost(currentLevel);
  if (cost === null || (state.inventory.materials.red_gem ?? 0) < cost) return false;
  adjust(state.inventory, 'materials', 'red_gem', -cost);
  unit.skillUpgrades[skillId] = currentLevel + 1;
  return true;
}

/** The unit price the refuge shop asks for an item today, by reputation (OD-2026-11-05-C). */
export function getBuyUnitPrice(state: GameState, itemId: string): number | null {
  const item = itemById.get(itemId);
  return item ? getShopPrice(item.price, state.reputation) : null;
}

/** The shop takes an item back at half its base price, whatever the reputation. */
export function getSellUnitPrice(itemId: string): number | null {
  const item = itemById.get(itemId);
  return item ? Math.floor(item.price / 2) : null;
}

/** How many of an item the company can buy in one go: bounded by the shop's stock and the gold it holds. */
export function getMaxBuyQuantity(state: GameState, shopId: string, itemId: string): number {
  const stock = state.shops[shopId]?.stock[itemId] ?? 0;
  const price = getBuyUnitPrice(state, itemId);
  if (price === null || stock < 1) return 0;
  return Math.max(0, Math.min(stock, Math.floor(state.gold / price)));
}

/** How many of an item the company can sell in one go: only what the bag carries, never what a hero wears. */
export function getMaxSellQuantity(state: GameState, shopId: string, itemId: string): number {
  const item = itemById.get(itemId);
  if (!state.shops[shopId] || !item) return 0;
  return Math.max(0, state.inventory[item.category][itemId] ?? 0);
}

function validQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

/**
 * Buys `quantity` of an item in one transaction (playtest 2026-11-11): either every unit is bought at today's
 * reputation price and the exact total is debited, or nothing changes.
 */
export function buyItems(state: GameState, shopId: string, itemId: string, quantity: number): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  const price = getBuyUnitPrice(state, itemId);
  if (!shop || !item || price === null || !validQuantity(quantity)) return false;
  if (quantity > getMaxBuyQuantity(state, shopId, itemId)) return false;
  state.gold -= price * quantity;
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) - quantity;
  adjust(state.inventory, item.category, itemId, quantity);
  return true;
}

/** Sells `quantity` carried units of an item in one transaction, or nothing at all. */
export function sellItems(state: GameState, shopId: string, itemId: string, quantity: number): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  const price = getSellUnitPrice(itemId);
  if (!shop || !item || price === null || !validQuantity(quantity)) return false;
  if (quantity > getMaxSellQuantity(state, shopId, itemId)) return false;
  adjust(state.inventory, item.category, itemId, -quantity);
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) + quantity;
  state.gold += price * quantity;
  return true;
}

export function buyItem(state: GameState, shopId: string, itemId: string, _useTemporaryLoot = true): boolean {
  return buyItems(state, shopId, itemId, 1);
}

export function sellItem(state: GameState, shopId: string, itemId: string, _useTemporaryLoot = true): boolean {
  return sellItems(state, shopId, itemId, 1);
}

export interface ForgeIngredient {
  category: 'weapons' | 'accessories' | 'materials';
  itemId: string;
  quantity: number;
  carried: number;
  /** Worn items the recipe may take once the carried ones run out. */
  worn: number;
}

/**
 * Heroes whose worn item the recipe may take (OD-2026-11-05-C). A worn weapon counts only when its wearer can wield the
 * recipe's weapon, which takes its place, so no hero is ever left unarmed; worn accessories always count.
 */
function forgeWearers(state: GameState, recipe: CraftRecipeDefinition, category: 'weapons' | 'accessories', itemId: string): UnitInstance[] {
  if (category === 'accessories') return state.clan.members.filter((unit) => unit.equipment.accessoryIds.includes(itemId));
  if (recipe.output.category !== 'weapons') return [];
  return state.clan.members.filter((unit) => unit.equipment.weaponIds.includes(itemId)
    && (unitById.get(unit.definitionId)?.allowedWeaponIds.includes(recipe.output.itemId) ?? false));
}

export function getForgeIngredients(state: GameState, recipe: CraftRecipeDefinition): ForgeIngredient[] {
  const entry = (category: ForgeIngredient['category'], itemId: string, quantity: number): ForgeIngredient => {
    const carried = state.inventory[category][itemId] ?? 0;
    if (category === 'materials') return { category, itemId, quantity, carried, worn: 0 };
    const wearers = forgeWearers(state, recipe, category, itemId);
    const worn = category === 'weapons'
      ? Math.min(wearers.length, recipe.output.quantity)
      : wearers.reduce((count, unit) => count + unit.equipment.accessoryIds.filter((id) => id === itemId).length, 0);
    return { category, itemId, quantity, carried, worn };
  };
  return [
    ...Object.entries(recipe.inputs.weapons ?? {}).map(([itemId, quantity]) => entry('weapons', itemId, quantity)),
    ...Object.entries(recipe.inputs.accessories ?? {}).map(([itemId, quantity]) => entry('accessories', itemId, quantity)),
    ...Object.entries(recipe.inputs.materials ?? {}).map(([itemId, quantity]) => entry('materials', itemId, quantity)),
  ];
}

/** The forge prices its work by reputation, like the refuge shop (OD-2026-11-05-C). */
export function getCraftGoldCost(state: GameState, recipe: CraftRecipeDefinition): number {
  return getShopPrice(recipe.inputs.gold, state.reputation);
}

/**
 * Whether the shop and the forge should offer an item: any non-weapon, or a weapon that a member who can wield it would
 * not find weaker than the weapon he holds, nor already holds (OD-2026-11-07-H). Same-tier variants stay on offer.
 */
export function isUsefulToCompany(state: GameState, itemId: string): boolean {
  if (itemById.get(itemId)?.category !== 'weapons') return true;
  const tier = weaponById.get(itemId)?.tier ?? 0;
  return state.clan.members.some((unit) => unitById.get(unit.definitionId)?.allowedWeaponIds.includes(itemId)
    && getEquippedWeaponTier(unit) <= tier && unit.equipment.weaponIds[0] !== itemId);
}

/** Recipes worth listing: accessories, and weapons that a member of the company can wield. */
export function getForgeRecipes(state: GameState): CraftRecipeDefinition[] {
  return craftRecipes.filter((recipe) => isUsefulToCompany(state, recipe.output.itemId));
}

export function canCraftItem(state: GameState, recipeId: string): boolean {
  const recipe = craftRecipeById.get(recipeId);
  if (!recipe) return false;
  if (!itemById.has(recipe.output.itemId)) return false;
  return state.gold >= getCraftGoldCost(state, recipe)
    && getForgeIngredients(state, recipe).every((ingredient) => ingredient.carried + ingredient.worn >= ingredient.quantity);
}

/**
 * Crafts from carried items first, then worn ones. The crafted weapon takes the place of the worn weapon it consumed; a
 * crafted accessory takes the first accessory slot the recipe freed; anything else goes to the inventory.
 */
export function craftItem(state: GameState, recipeId: string): boolean {
  const recipe = craftRecipeById.get(recipeId);
  if (!recipe || !canCraftItem(state, recipeId)) return false;
  state.gold -= getCraftGoldCost(state, recipe);
  let weaponSlot: { unit: UnitInstance; index: number } | null = null;
  const freedSlots: Array<{ unit: UnitInstance; slot: 0 | 1 }> = [];
  for (const ingredient of getForgeIngredients(state, recipe)) {
    const fromBag = Math.min(ingredient.carried, ingredient.quantity);
    adjust(state.inventory, ingredient.category, ingredient.itemId, -fromBag);
    let missing = ingredient.quantity - fromBag;
    if (missing <= 0 || ingredient.category === 'materials') continue;
    for (const unit of forgeWearers(state, recipe, ingredient.category, ingredient.itemId)) {
      if (ingredient.category === 'weapons') {
        if (missing <= 0 || weaponSlot) break;
        weaponSlot = { unit, index: unit.equipment.weaponIds.indexOf(ingredient.itemId) };
        missing -= 1;
        continue;
      }
      for (const slot of [0, 1] as const) {
        if (missing <= 0 || unit.equipment.accessoryIds[slot] !== ingredient.itemId) continue;
        unit.equipment.accessoryIds[slot] = null;
        freedSlots.push({ unit, slot });
        missing -= 1;
      }
    }
  }
  let toInventory = recipe.output.quantity;
  const changed = new Set(freedSlots.map(({ unit }) => unit));
  if (weaponSlot && recipe.output.category === 'weapons') {
    weaponSlot.unit.equipment.weaponIds[weaponSlot.index] = recipe.output.itemId;
    changed.add(weaponSlot.unit);
    toInventory -= 1;
  } else if (recipe.output.category === 'accessories' && freedSlots[0]) {
    freedSlots[0].unit.equipment.accessoryIds[freedSlots[0].slot] = recipe.output.itemId;
    toInventory -= 1;
  }
  if (toInventory > 0) adjust(state.inventory, recipe.output.category, recipe.output.itemId, toInventory);
  for (const unit of changed) unit.currentHealth = Math.min(unit.currentHealth, getFinalStats(unit).maxHealth);
  return true;
}

export function excludeUnit(state: GameState, unitId: string): boolean {
  const index = state.clan.members.findIndex((unit) => unit.id === unitId);
  const unit = state.clan.members[index];
  if (index < 0 || !unit || unit.narrativeLocked || state.clan.members.length <= 1) return false;
  returnEquipment(state, unit);
  state.clan.members.splice(index, 1);
  state.deployment.unitIds = state.deployment.unitIds.filter((id) => id !== unitId);
  return true;
}

function returnEquipment(state: GameState, unit: UnitInstance): void {
  for (const weaponId of unit.equipment.weaponIds) adjust(state.inventory, 'weapons', weaponId, 1);
  for (const accessoryId of unit.equipment.accessoryIds) {
    if (accessoryId) adjust(state.inventory, 'accessories', accessoryId, 1);
  }
}
