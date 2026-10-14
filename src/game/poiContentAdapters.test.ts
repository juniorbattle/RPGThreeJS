import { describe, expect, it } from 'vitest';
import { createInitialState, migrateState } from './store';
import { createPoiChestAdapter, poiCombatPayload } from './poiContentAdapters';
import { getRunNode } from './runSystem';

describe('future POI content authoring seams, no campaign placements',()=>{
  it('fails closed for every production chest until actual content is authored',()=>{
    const state=createInitialState(),before=structuredClone(state);
    for(const node of state.run.graph.nodes)expect(createPoiChestAdapter()(state,node.id)).toBeNull();
    expect(state).toEqual(before);
  });
  it('attributes fixture-authored chest contents only once as temporary loot across V6 reload',()=>{
    const state=createInitialState();state.run.currentNodeId='lion-first-trial-event';state.currentNodeId=state.run.currentNodeId;
    const node=getRunNode(state.run)!;
    // Mechanical authoring fixture only; never registered in the production campaign catalogue.
    const adapter=createPoiChestAdapter([{nodeId:node.id,contentId:node.contentId,gold:7,items:{potion:1}}]);
    const gold=state.gold;expect(adapter(state,node.id)).not.toBeNull();
    expect(state.gold).toBe(gold);expect(state.run.temporaryLoot.gold).toBe(7);
    expect(state.run.temporaryLoot.inventory.consumables.potion).toBe(1);
    const loaded=migrateState(JSON.parse(JSON.stringify(state))),before=structuredClone(loaded);
    expect(adapter(loaded,node.id)).toBeNull();expect(loaded).toEqual(before);
  });
  it('never relabels an ordinary formation as an elite or reopens resolved combat',()=>{
    const state=createInitialState();expect(poiCombatPayload(state,'lion-opening-ambush',true)).toBeNull();
    const config=poiCombatPayload(state,'lion-opening-ambush');expect(config?.id).toBe(getRunNode(state.run,'lion-opening-ambush')!.contentId);
    state.resolvedNodeIds.push('lion-opening-ambush');expect(poiCombatPayload(state,'lion-opening-ambush')).toBeNull();
  });
});
