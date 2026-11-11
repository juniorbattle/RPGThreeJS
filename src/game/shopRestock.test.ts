import { describe, expect, it } from 'vitest';
import { loadLionEndForBearQa } from '../qa/postDemoQaSaves';
import { itemById } from './catalog';
import { continueCampaign } from './plateauProgression';
import { plateauRestock, REFUGE_SHOP_ID, restockShopForPlateau } from './shopRestock';
import { createInitialState } from './store';

describe('the refuge shop is restocked at each plateau (final audit 2026-11-11, OD-2026-11-11-E B5)', () => {
  it('restocks only existing consumables, materials and accessories, never weapons, with more red gems each plateau', () => {
    expect(plateauRestock('lion')).toBeNull();
    const gems = (['bear', 'dragon', 'scorpion', 'finale'] as const).map((id) => plateauRestock(id)!.red_gem);
    expect(gems).toEqual([4, 5, 6, 6]);
    for (const id of ['bear', 'dragon', 'scorpion', 'finale'] as const) {
      for (const itemId of Object.keys(plateauRestock(id)!)) {
        const item = itemById.get(itemId);
        expect(item, itemId).toBeDefined();
        expect(item!.category).not.toBe('weapons');
      }
    }
  });

  it('tops the stock up without taking back what the company sold to the shop', () => {
    const state = createInitialState();
    const stock = state.shops[REFUGE_SHOP_ID]!.stock;
    stock.potion = 0;
    stock.red_gem = 0;
    stock.ether = 9; // sold back by the company: kept
    stock.steel_greatsword = 0;
    expect(restockShopForPlateau(state, 'bear')).toBe(true);
    expect(stock.potion).toBe(10);
    expect(stock.red_gem).toBe(4);
    expect(stock.ether).toBe(9);
    expect(stock.steel_greatsword).toBe(0);
    expect(restockShopForPlateau(state, 'lion')).toBe(false);
  });

  it('restocks when RunSystem begins the next plateau', async () => {
    const state = await loadLionEndForBearQa('honour');
    const stock = state.shops[REFUGE_SHOP_ID]!.stock;
    stock.potion = 0;
    stock.red_gem = 0;
    expect(continueCampaign(state, 7)).not.toBeNull();
    expect(stock.potion).toBe(10);
    expect(stock.red_gem).toBe(4);
  });
});
