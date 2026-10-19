import { combatConfigs } from './content';
import { getItemCategory } from './catalog';
import { creditRunReward, getRunNode, isPoiNeutralized } from './runSystem';
import type { CombatConfig, GameState } from './types';
import { LOT_E_POIS } from '../campaign/LionPoiAuthoring';

export interface AuthoredPoiChest {
  nodeId: string;
  contentId: string;
  gold: number;
  items: Readonly<Record<string, number>>;
}
/** Exact six-chest catalogue approved by OD-2026-10-15-B; all grants immediately enter usable holdings. */
export const APPROVED_POI_CHESTS: readonly AuthoredPoiChest[] = Object.freeze(LOT_E_POIS
  .filter(poi=>poi.chestLoot).map(poi=>({nodeId:poi.id,contentId:poi.contentId!,
    gold:poi.chestLoot!.temporaryGold,items:poi.chestLoot!.temporaryItems})));

/** Existing tactical authority supplies both ordinary and genuinely ranked elite payloads. */
export function poiCombatPayload(state: GameState, nodeId: string, elite = false): CombatConfig | null {
  const node = getRunNode(state.run,nodeId);
  if (!node || state.run.status !== 'active' || state.resolvedNodeIds.includes(nodeId)
    || isPoiNeutralized(state,nodeId) || node.type !== 'combat') return null;
  const config = combatConfigs.get(node.contentId);
  if (!config || (elite && config.encounterRank !== 'elite')) return null;
  return config;
}

/** Authoring seam, never called with a payload received from map UI. Empty production catalogue
 * fails closed. Returns existing owner-attributed usable loot for a future direct popup. */
export function createPoiChestAdapter(catalogue: readonly AuthoredPoiChest[] = APPROVED_POI_CHESTS) {
  return (state: GameState, nodeId: string): AuthoredPoiChest | null => {
    const authored=catalogue.find(c=>c.nodeId===nodeId);
    const node=getRunNode(state.run,nodeId);
    if (!authored || !node || node.contentId!==authored.contentId || state.run.status!=='active'
      || state.run.currentNodeId!==nodeId || state.resolvedNodeIds.includes(nodeId)
      || isPoiNeutralized(state,nodeId) || !Number.isInteger(authored.gold) || authored.gold<0
      || Object.entries(authored.items).some(([id,q])=>!getItemCategory(id)||!Number.isInteger(q)||q<=0)) return null;
    creditRunReward(state,{gold:authored.gold});
    for(const [itemId,quantity] of Object.entries(authored.items)) creditRunReward(state,{itemId,quantity,category:getItemCategory(itemId)!});
    state.resolvedNodeIds.push(nodeId);
    return structuredClone(authored);
  };
}
