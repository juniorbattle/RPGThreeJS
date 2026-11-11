import { itemById } from '../game/catalog';
import { canCraftItem, getForgeRecipes, isUsefulToCompany } from '../game/management';
import type { CraftRecipeDefinition, GameState, ItemCategory } from '../game/types';

/**
 * Sorting and filtering of the refuge shop and forge lists (playtest 2026-11-11: « trier par type d'items achetables ou
 * forgeables »). Presentation only: the lists come from the owners' own rules (isUsefulToCompany, getForgeRecipes,
 * canCraftItem), and a filter only hides or orders lines; it never offers anything those rules leave out.
 */

export type ShopFilter = 'all' | ItemCategory;
export type ForgeFilter = 'all' | 'weapons' | 'accessories';

/** The order in which types are listed and grouped. */
export const SHOP_CATEGORY_ORDER: readonly ItemCategory[] = ['weapons', 'accessories', 'consumables', 'materials'];

export const SHOP_CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapons: 'Armes',
  accessories: 'Accessoires',
  consumables: 'Consommables',
  materials: 'Matériaux',
};

export interface ShopEntry { id: string; quantity: number; category: ItemCategory }

/**
 * The lines the shop lists: to buy, what is in stock and useful to the company (OD-2026-11-05-D, OD-2026-11-07-H);
 * to sell, everything the bag carries. Grouped by type in SHOP_CATEGORY_ORDER, the stock's own order kept within a type.
 */
export function shopEntries(state: GameState, shopId: string, mode: 'buy' | 'sell'): ShopEntry[] {
  const source = mode === 'buy'
    ? Object.entries(state.shops[shopId]?.stock ?? {})
    : SHOP_CATEGORY_ORDER.flatMap((category) => Object.entries(state.inventory[category]));
  const entries: ShopEntry[] = [];
  for (const [id, quantity] of source) {
    const item = itemById.get(id);
    if (!item || quantity < 1 || (mode === 'buy' && !isUsefulToCompany(state, id))) continue;
    entries.push({ id, quantity, category: item.category });
  }
  return SHOP_CATEGORY_ORDER.flatMap((category) => entries.filter((entry) => entry.category === category));
}

export function filterShopEntries(entries: readonly ShopEntry[], filter: ShopFilter): ShopEntry[] {
  return filter === 'all' ? [...entries] : entries.filter((entry) => entry.category === filter);
}

/** How many lines each filter would show; types with no line are left out, except the active one. */
export function shopFilterCounts(entries: readonly ShopEntry[], active: ShopFilter): Array<{ filter: ShopFilter; count: number }> {
  const counts: Array<{ filter: ShopFilter; count: number }> = [{ filter: 'all', count: entries.length }];
  for (const category of SHOP_CATEGORY_ORDER) {
    const count = entries.filter((entry) => entry.category === category).length;
    if (count > 0 || active === category) counts.push({ filter: category, count });
  }
  return counts;
}

export interface ForgeEntry { recipe: CraftRecipeDefinition; category: 'weapons' | 'accessories'; ready: boolean }

/** The recipes the forge lists (getForgeRecipes), each with its result's type and whether it can be forged now. */
export function forgeEntries(state: GameState): ForgeEntry[] {
  return getForgeRecipes(state).flatMap((recipe) => {
    const category = recipe.output.category;
    if (category !== 'weapons' && category !== 'accessories') return [];
    return [{ recipe, category, ready: canCraftItem(state, recipe.id) }];
  });
}

/** Filters by type of result, optionally to what can be forged now, and lists what is ready before what is not. */
export function filterForgeEntries(entries: readonly ForgeEntry[], filter: ForgeFilter, readyOnly: boolean): { ready: ForgeEntry[]; later: ForgeEntry[] } {
  const shown = entries.filter((entry) => filter === 'all' || entry.category === filter);
  return { ready: shown.filter((entry) => entry.ready), later: readyOnly ? [] : shown.filter((entry) => !entry.ready) };
}

export function forgeFilterCounts(entries: readonly ForgeEntry[], readyOnly: boolean): Array<{ filter: ForgeFilter; count: number }> {
  const visible = readyOnly ? entries.filter((entry) => entry.ready) : entries;
  return (['all', 'weapons', 'accessories'] as const).map((filter) => ({
    filter,
    count: visible.filter((entry) => filter === 'all' || entry.category === filter).length,
  }));
}
