import { craftRecipeById, getFinalStats, getResolvedSkills, itemById, unitById } from './catalog';
import { getShopPrice } from './reputation';
import type { CraftRecipeDefinition, GameState, InventoryState, ItemCategory, UnitInstance } from './types';

function adjust(inventory: InventoryState, category: ItemCategory, itemId: string, amount: number): void {
  inventory[category][itemId] = Math.max(0, (inventory[category][itemId] ?? 0) + amount);
}

export const MAX_SKILL_UPGRADE_LEVEL = 2;
export const REST_COST_PER_WOUNDED_UNIT = 10;

export function getSkillUpgradeCost(currentLevel: number): number | null {
  return currentLevel >= MAX_SKILL_UPGRADE_LEVEL ? null : currentLevel + 1;
}

export function getWoundedUnitCount(state: GameState): number {
  return state.clan.members.filter((unit) => unit.currentHealth < getFinalStats(unit).maxHealth).length;
}

export function getRestCost(state: GameState): number {
  return getWoundedUnitCount(state) * REST_COST_PER_WOUNDED_UNIT;
}

export function equipWeapon(state: GameState, unitId: string, slot: 0 | 1, weaponId: string): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  const definition = unit && unitById.get(unit.definitionId);
  if (
    !unit
    || !definition
    || slot >= definition.weaponSlotCount
    || !definition.allowedWeaponIds.includes(weaponId)
    || unit.equipment.weaponIds.includes(weaponId)
    || (state.inventory.weapons[weaponId] ?? 0) < 1
  ) return false;
  const previous = unit.equipment.weaponIds[slot];
  if (!previous) return false;
  adjust(state.inventory, 'weapons', previous, 1);
  adjust(state.inventory, 'weapons', weaponId, -1);
  unit.equipment.weaponIds[slot] = weaponId;
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

export function upgradeSkill(state: GameState, unitId: string, skillId: string): boolean {
  const unit = state.clan.members.find((candidate) => candidate.id === unitId);
  if (!unit) return false;
  if (!getResolvedSkills(unit).includes(skillId)) return false;
  const currentLevel = Math.max(0, Math.min(MAX_SKILL_UPGRADE_LEVEL, unit.skillUpgrades[skillId] ?? 0));
  const cost = getSkillUpgradeCost(currentLevel);
  if (cost === null || (state.inventory.materials.red_gem ?? 0) < cost) return false;
  adjust(state.inventory, 'materials', 'red_gem', -cost);
  unit.skillUpgrades[skillId] = currentLevel + 1;
  return true;
}

export function buyItem(state: GameState, shopId: string, itemId: string, useTemporaryLoot = true): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  const price = item ? getShopPrice(item.price, state.reputation) : 0;
  const availableGold = useTemporaryLoot ? state.run.temporaryLoot.gold : state.gold;
  if (!shop || !item || (shop.stock[itemId] ?? 0) < 1 || availableGold < price) return false;
  if (useTemporaryLoot) state.run.temporaryLoot.gold -= price;
  else state.gold -= price;
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) - 1;
  adjust(useTemporaryLoot ? state.run.temporaryLoot.inventory : state.inventory, item.category, itemId, 1);
  return true;
}

export function sellItem(state: GameState, shopId: string, itemId: string, useTemporaryLoot = true): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  if (!shop || !item || (state.inventory[item.category][itemId] ?? 0) < 1) return false;
  adjust(state.inventory, item.category, itemId, -1);
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) + 1;
  if (useTemporaryLoot) state.run.temporaryLoot.gold += Math.floor(item.price / 2);
  else state.gold += Math.floor(item.price / 2);
  return true;
}

function hasIngredients(state: GameState, recipe: CraftRecipeDefinition): boolean {
  for (const [itemId, quantity] of Object.entries(recipe.inputs.weapons ?? {})) {
    if ((state.inventory.weapons[itemId] ?? 0) < quantity) return false;
  }
  for (const [itemId, quantity] of Object.entries(recipe.inputs.accessories ?? {})) {
    if ((state.inventory.accessories[itemId] ?? 0) < quantity) return false;
  }
  return true;
}

export function canCraftItem(state: GameState, recipeId: string): boolean {
  const recipe = craftRecipeById.get(recipeId);
  if (!recipe) return false;
  if (!itemById.has(recipe.output.itemId)) return false;
  return state.gold >= recipe.inputs.gold && hasIngredients(state, recipe);
}

export function craftItem(state: GameState, recipeId: string): boolean {
  const recipe = craftRecipeById.get(recipeId);
  if (!recipe || !canCraftItem(state, recipeId)) return false;
  state.gold -= recipe.inputs.gold;
  for (const [itemId, quantity] of Object.entries(recipe.inputs.weapons ?? {})) {
    adjust(state.inventory, 'weapons', itemId, -quantity);
  }
  for (const [itemId, quantity] of Object.entries(recipe.inputs.accessories ?? {})) {
    adjust(state.inventory, 'accessories', itemId, -quantity);
  }
  adjust(state.inventory, recipe.output.category, recipe.output.itemId, recipe.output.quantity);
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
