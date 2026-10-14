import { combatConfigs } from './content';
import { getItemCategory } from './catalog';
import { addTemporaryLoot, getRunNode, isPoiNeutralized } from './runSystem';
import type { CombatConfig, GameState } from './types';

export interface AuthoredPoiChest {
  nodeId: string;
  contentId: string;
  gold: number;
  items: Readonly<Record<string, number>>;
}
/** No new campaign placement/reward has been approved. Authoring must populate this explicitly. */
export const APPROVED_POI_CHESTS: readonly AuthoredPoiChest[] = Object.freeze([]);

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
 * fails closed. Returns existing owner-attributed temporary loot for a future direct popup. */
export function createPoiChestAdapter(catalogue: readonly AuthoredPoiChest[] = APPROVED_POI_CHESTS) {
  return (state: GameState, nodeId: string): AuthoredPoiChest | null => {
    const authored=catalogue.find(c=>c.nodeId===nodeId);
    const node=getRunNode(state.run,nodeId);
    if (!authored || !node || node.contentId!==authored.contentId || state.run.status!=='active'
      || state.run.currentNodeId!==nodeId || state.resolvedNodeIds.includes(nodeId)
      || isPoiNeutralized(state,nodeId) || !Number.isInteger(authored.gold) || authored.gold<0
      || Object.entries(authored.items).some(([id,q])=>!getItemCategory(id)||!Number.isInteger(q)||q<=0)) return null;
    addTemporaryLoot(state.run,{gold:authored.gold});
    for(const [itemId,quantity] of Object.entries(authored.items)) addTemporaryLoot(state.run,{itemId,quantity,category:getItemCategory(itemId)!});
    state.resolvedNodeIds.push(nodeId);
    return structuredClone(authored);
  };
}
