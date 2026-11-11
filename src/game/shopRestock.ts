import type { CampaignChapterId } from '../campaign/plateaux/campaignIds';
import type { GameState } from './types';

/**
 * Final audit 2026-11-11, OD-2026-11-11-E (B5): the refuges' one shop is restocked each time the company begins a new
 * plateau, so gold keeps a use after the Lion. Only existing items, at their existing prices: consumables, the forge's
 * materials, and one more of each shop accessory (a second ring or belt equips another hero). Red gems, which pay for
 * skill upgrades, grow from plateau to plateau. Weapons are not restocked: the shop keeps its T1 weapons and T2 weapons
 * still come from the forge (OD-2026-11-05-D). A restock only tops the stock up: nothing the company sold back is lost.
 */
const BASE_RESTOCK: Readonly<Record<string, number>> = Object.freeze({
  potion: 10, antidote: 6, revive_vial: 3, ether: 3, bomb: 3,
  grenade_incendiaire: 3, grenade_entravante: 2, grenade_aveuglante: 2,
  iron_ore: 10,
  strength_ring: 1, life_belt: 1, agility_boots: 1, magic_pendant: 1, wisdom_crown: 1, warding_buckle: 1,
});

const RED_GEMS_BY_PLATEAU: Readonly<Partial<Record<CampaignChapterId, number>>> = Object.freeze({
  bear: 4, dragon: 5, scorpion: 6, finale: 6,
});

/** The shop every refuge opens (GameApp opens it by this id). */
export const REFUGE_SHOP_ID = 'valmir';

/** The stock a plateau's restock tops the shop up to, or null for the Lion, whose stock is the starting one. */
export function plateauRestock(chapterId: CampaignChapterId): Readonly<Record<string, number>> | null {
  const gems = RED_GEMS_BY_PLATEAU[chapterId];
  return gems === undefined ? null : { ...BASE_RESTOCK, red_gem: gems };
}

/**
 * Tops the refuge shop up to the plateau's restock, once per plateau begun. RunSystem calls it when a new plateau
 * starts (`continueCampaign`); it writes only the existing shop stock, no new save field. Returns whether it restocked.
 */
export function restockShopForPlateau(state: GameState, chapterId: CampaignChapterId): boolean {
  const restock = plateauRestock(chapterId);
  const shop = state.shops[REFUGE_SHOP_ID];
  if (!restock || !shop) return false;
  for (const [itemId, quantity] of Object.entries(restock)) {
    shop.stock[itemId] = Math.max(shop.stock[itemId] ?? 0, quantity);
  }
  return true;
}
