import { itemById, unitById } from './catalog';
import type { GameState, InventoryState, ItemCategory, UnitInstance } from './types';

function adjust(inventory: InventoryState, category: ItemCategory, itemId: string, amount: number): void {
  inventory[category][itemId] = Math.max(0, (inventory[category][itemId] ?? 0) + amount);
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
  return true;
}

export function buyItem(state: GameState, shopId: string, itemId: string): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  if (!shop || !item || (shop.stock[itemId] ?? 0) < 1 || state.gold < item.price) return false;
  state.gold -= item.price;
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) - 1;
  adjust(state.inventory, item.category, itemId, 1);
  return true;
}

export function sellItem(state: GameState, shopId: string, itemId: string): boolean {
  const shop = state.shops[shopId];
  const item = itemById.get(itemId);
  if (!shop || !item || (state.inventory[item.category][itemId] ?? 0) < 1) return false;
  adjust(state.inventory, item.category, itemId, -1);
  shop.stock[itemId] = (shop.stock[itemId] ?? 0) + 1;
  state.gold += Math.floor(item.price / 2);
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
