import {describe, expect, it} from 'vitest';
import {createInitialState, migrateState} from './store';
import {LOT_E_ELITES, LOT_E_POIS, LION_CANONICAL_POI_IDS, poiVariantIndex} from '../campaign/LionPoiAuthoring';
import {combatConfigs} from './content';
import {combatConfigSchema, type CombatResult, type GameState} from './types';
import {enterPoi, selectPoiMap, settlePoiNavigation, commitPoiEliteFight, resolvePoiEliteVictory, failRunToCheckpoint} from './runSystem';
import {retreatPoiElite, syncPoiElites, waitPoiTurn} from './poiExpedition';
import {createPoiChestAdapter} from './poiContentAdapters';

/** Explicit mechanical fixtures, never used as native campaign evidence or earned saves. */
function fixture(current='lion-nomad-crossroads'): GameState {
  const state=createInitialState();
  const until=LION_CANONICAL_POI_IDS.indexOf(current);
  state.resolvedNodeIds=LION_CANONICAL_POI_IDS.slice(0,until+1).filter(id=>!id.endsWith('-trial-combat'));
  state.run.currentNodeId=state.currentNodeId=current;
  state.run.visitedNodeIds=[...state.resolvedNodeIds];state.visitedNodeIds=[...state.resolvedNodeIds];
  state.run.checkpointNodeId=until>=LION_CANONICAL_POI_IDS.indexOf('lion-second-refuge')?'lion-second-refuge':'lion-first-refuge';
  if(until>=LION_CANONICAL_POI_IDS.indexOf('lion-first-refuge'))state.flags['refugeSecured:lion-first-refuge']=true;
  if(until>=LION_CANONICAL_POI_IDS.indexOf('lion-second-refuge'))state.flags['refugeSecured:lion-second-refuge']=true;
  syncPoiElites(state);return state;
}
function result(combatId:string,victory=true):CombatResult {
  return {combatId,victory,participants:[],unitHealth:{}};
}
function winElite(state:GameState):boolean {
  const id=state.run.poiExpedition!.encounter!.id;
  return resolvePoiEliteVictory(state,id,result(commitPoiEliteFight(state,id)!));
}

describe('approved complete Lot E catalogue and additive V6',()=>{
  it('has exactly 21 protected +12 optional nodes, six chests, twelve valid independent variants and two independent elites',()=>{
    const state=createInitialState();expect(state.run.graph.nodes).toHaveLength(33);
    expect(new Set(state.run.graph.nodes.map(node=>node.id)).size).toBe(33);
    expect(LOT_E_POIS.filter(poi=>poi.chestLoot)).toHaveLength(6);
    expect(LOT_E_POIS.filter(poi=>poi.combat)).toHaveLength(6);
    expect(LOT_E_ELITES).toHaveLength(2);
    for(const poi of LOT_E_POIS){
      expect(state.run.graph.nodes.find(node=>node.id===poi.id)?.links).toEqual([]);
      for(const variant of poi.combat?.variants??[]){
        const config=combatConfigSchema.parse(combatConfigs.get(variant.id));
        expect(config.enemyVisualIds).toEqual(variant.enemyVisualIds);
        expect(config.preCombatDialogueId).toBeUndefined();expect(config.postCombatDialogueId).toBeUndefined();
        expect(config.isBoss).not.toBe(true);expect(config.rewards.gold).toBe(poi.combat!.rewards.temporaryGold);
      }
    }
    for(const elite of LOT_E_ELITES){
      expect(state.run.graph.nodes.some(node=>node.id===elite.id)).toBe(false);
      const config=combatConfigs.get(elite.combat.id)!;
      expect(config.encounterRank).toBe('elite');expect(config.enemyVisualIds).toEqual(elite.combat.enemies);
      expect(config.maxPlayerUnits).toBe(3);expect(config.preCombatDialogueId).toBeUndefined();
    }
  });
  it.each(['lion-audience','lion-first-trial-event','lion-first-refuge','lion-valmir-road','lion-second-refuge','lion-final-refuge','lion-final-judgement'])(
    'preserves every old fact at %s and stabilizes the additive roundtrip',current=>{
      const state=fixture(current);state.run.graph.nodes=state.run.graph.nodes.filter(node=>LION_CANONICAL_POI_IDS.includes(node.id));
      delete state.run.poiExpedition;
      state.mysteryAssignments['lion-first-trial-event']='authored-existing-assignment';
      state.run.traversalBranches={T0:'lion-first-trial-event',T1:'lion-second-trial-event'};
      state.run.temporaryLoot.gold=71;state.flags.helpedRefugees=true;
      if(current==='lion-final-judgement'){state.run.status='completed';state.endingId='lion-seal-serpent-truth';}
      const old=structuredClone(state),loaded=migrateState(JSON.parse(JSON.stringify(state)));
      const comparable=structuredClone(loaded);delete comparable.run.poiExpedition;
      comparable.run.graph.nodes=comparable.run.graph.nodes.filter(node=>LION_CANONICAL_POI_IDS.includes(node.id));
      expect(comparable).toEqual(old);expect(loaded.run.graph.nodes).toHaveLength(33);
      expect(migrateState(JSON.parse(JSON.stringify(loaded)))).toEqual(loaded);
      if(state.run.status==='completed')expect(Object.values(loaded.run.poiExpedition!.elites).every(elite=>!elite.active)).toBe(true);
    });
  it('each ordinary POI reaches both variants by seed, keeps fixed rewards and cannot reroll on defeat/reload',()=>{
    for(const poi of LOT_E_POIS.filter(poi=>poi.combat)){
      const choices=new Set(Array.from({length:80},(_,seed)=>poiVariantIndex(seed,poi.id,2)));
      expect(choices).toEqual(new Set([0,1]));
      const state=fixture('lion-first-refuge'),before=state.run.graph.nodes.find(node=>node.id===poi.id)!.contentId;
      failRunToCheckpoint(state);
      expect(migrateState(state).run.graph.nodes.find(node=>node.id===poi.id)!.contentId).toBe(before);
    }
  });
  it('the exact optional economy is 980 gold,6 reputation,10 gems,13 ore and7 temporary consumables',()=>{
    const rewards=[...LOT_E_POIS.flatMap(poi=>poi.combat?[poi.combat.rewards]:[]),...LOT_E_ELITES.map(elite=>elite.combat.rewards)];
    expect(rewards.reduce((sum,r)=>sum+r.temporaryGold,0)+LOT_E_POIS.reduce((sum,poi)=>sum+(poi.chestLoot?.temporaryGold??0),0)).toBe(980);
    expect(rewards.reduce((sum,r)=>sum+r.reputation,0)).toBe(6);
    expect(rewards.reduce((sum,r)=>sum+(r.materials.red_gem??0),0)).toBe(10);
    expect(rewards.reduce((sum,r)=>sum+(r.materials.iron_ore??0),0)).toBe(13);
    expect(LOT_E_POIS.reduce((sum,poi)=>sum+Object.values(poi.chestLoot?.temporaryItems??{}).reduce((a,b)=>a+b,0),0)).toBe(7);
  });
});

describe('canonical gates and one-time optional contents',()=>{
  it('opens neither detour nor first refuge before the mandatory real canonical facts',()=>{
    const state=createInitialState();
    expect(selectPoiMap(state).nodes.filter(node=>node.id.startsWith('lion-poi-')).every(node=>node.status==='locked')).toBe(true);
    const open=fixture();
    for(const id of ['lion-first-refuge','lion-second-trial-event','lion-village-choice','lion-final-judgement']){
      expect(selectPoiMap(open).nodes.find(node=>node.id===id)?.canMove).toBe(false);
    }
    expect(selectPoiMap(open).nodes.filter(node=>node.id.startsWith('lion-poi-opening-')).every(node=>node.status==='available')).toBe(true);
    const map=selectPoiMap(open);
    expect(map.edges.find(edge=>edge.from==='lion-poi-opening-patrol'&&edge.to==='lion-refugees')?.unlocked).toBe(true);
  });
  it.each(LOT_E_POIS.filter(poi=>poi.chestLoot).map(poi=>poi.id))('opens %s exactly once, with temporary items/gold and stable reload',id=>{
    const def=LOT_E_POIS.find(poi=>poi.id===id)!;
    const state=fixture(def.prerequisiteResolved[0]);
    state.currentNodeId=state.run.currentNodeId=id;
    const gold=state.gold,permanent=structuredClone(state.inventory);
    const payload=createPoiChestAdapter()(state,id);
    expect(payload?.gold).toBe(def.chestLoot!.temporaryGold);
    expect(state.gold).toBe(gold);expect(state.inventory).toEqual(permanent);
    expect(state.run.temporaryLoot.inventory.consumables).toEqual(def.chestLoot!.temporaryItems);
    const loaded=migrateState(state),before=structuredClone(loaded);
    expect(createPoiChestAdapter()(loaded,id)).toBeNull();expect(loaded).toEqual(before);
  });
  it('ordinary optional wins cannot resolve required Valmir or the canonical final trial',()=>{
    for(const [current,optional,protectedId] of [
      ['lion-reserve-trail','lion-poi-valley-marsh','lion-valmir-road'],
      ['lion-witnesses','lion-poi-seal-ruin-encounter','lion-final-trial-combat'],
    ]){
      const state=fixture(current);state.resolvedNodeIds.push(optional!);
      expect(state.resolvedNodeIds).not.toContain(protectedId);
      const locked=protectedId==='lion-valmir-road'?'lion-second-trial-event':'lion-shadow-signs';
      expect(selectPoiMap(state).nodes.find(node=>node.id===locked)?.status).toBe('locked');
    }
  });
});

describe('graph-mobile encounters, turns and real owner boundaries',()=>{
  it('front interception writes no position/visit/branch, cancellation ticks zero and redraw/reload never advance',()=>{
    const state=fixture('lion-valmir-road');selectPoiMap(state);const before=structuredClone(state);
    const id='lion-poi-valley-bridge-cache';
    expect(enterPoi(state,id)?.interception).toBe(true);
    expect(state.currentNodeId).toBe(before.currentNodeId);expect(state.visitedNodeIds).toEqual(before.visitedNodeIds);
    expect(state.run.traversalBranches).toEqual(before.run.traversalBranches);
    for(let n=0;n<5;n++)selectPoiMap(state);
    const resumed=migrateState(state);expect(resumed).toEqual(state);
    expect(retreatPoiElite(state,selectPoiMap(state))).toBe(true);expect(state).toEqual(before);
  });
  it('front victory rewards only its elite, once; underlying chest stays unopened, defeated survives loss/reload',()=>{
    const state=fixture('lion-valmir-road');const resolved=[...state.resolvedNodeIds];
    enterPoi(state,'lion-poi-valley-bridge-cache');const encounterId=state.run.poiExpedition!.encounter!.id;
    const combatId=commitPoiEliteFight(state,encounterId)!;
    expect(resolvePoiEliteVictory(state,encounterId,result(combatId))).toBe(true);
    expect(state.run.temporaryLoot.gold).toBe(120);expect(state.resolvedNodeIds).toEqual(resolved);
    expect(state.currentNodeId).toBe('lion-valmir-road');expect(state.flags.serpentGeneralDefeated).toBeUndefined();
    expect(resolvePoiEliteVictory(state,encounterId,result(combatId))).toBe(false);
    failRunToCheckpoint(state);const loaded=migrateState(state);
    expect(loaded.run.temporaryLoot.gold).toBe(0);
    expect(loaded.run.poiExpedition!.elites['lion-elite-valley-sentinel']?.defeated).toBe(true);
    expect(selectPoiMap(loaded).threats).toHaveLength(0);
  });
  it('rear interception retreats to the real adjacent safe origin without replay or another turn',()=>{
    const state=fixture('lion-valmir-road'),exp=state.run.poiExpedition!;
    const elite=exp.elites['lion-elite-valley-sentinel']!;
    elite.positionId='lion-poi-valley-serpent';elite.patrolIndex=1;
    exp.previousSafeNodeId='lion-reserve-trail';const before=structuredClone(state);
    expect(waitPoiTurn(state,selectPoiMap(state))).toBe(true);
    expect(exp.encounter?.kind).toBe('rear');expect(exp.turn).toBe(1);
    expect(retreatPoiElite(state,selectPoiMap(state))).toBe(true);
    expect(state.currentNodeId).toBe('lion-reserve-trail');expect(exp.turn).toBe(1);
    expect(state.resolvedNodeIds).toEqual(before.resolvedNodeIds);expect(state.gold).toBe(before.gold);
    expect(exp.elites['lion-elite-valley-sentinel']!.positionId).toBe('lion-valmir-road');
  });
  it('rejects the rear threat movement when no safe retreat exists, retaining an explicit fight or alternate route',()=>{
    const state=fixture('lion-valmir-road'),exp=state.run.poiExpedition!,elite=exp.elites['lion-elite-valley-sentinel']!;
    elite.positionId='lion-poi-valley-serpent';elite.patrolIndex=1;
    expect(waitPoiTurn(state,selectPoiMap(state))).toBe(true);
    expect(exp.encounter).toBeUndefined();expect(elite.positionId).toBe('lion-poi-valley-serpent');
    const map=selectPoiMap(state);expect(map.threats[0]?.contested).toBe(true);expect(map.threats[0]?.canFight).toBe(true);
    expect(map.nodes.some(node=>node.canMove&&node.id!==elite.positionId)).toBe(true);
  });
  it('has no activation in I, spawns only after real prerequisites, and defers a player-occupied spawn',()=>{
    const state=fixture();expect(selectPoiMap(state).threats).toHaveLength(0);
    state.resolvedNodeIds.push('lion-valmir-road');state.run.currentNodeId=state.currentNodeId='lion-poi-valley-bridge-cache';
    syncPoiElites(state);expect(state.run.poiExpedition!.elites['lion-elite-valley-sentinel']!.active).toBe(false);
    state.run.currentNodeId=state.currentNodeId='lion-valmir-road';syncPoiElites(state);
    expect(state.run.poiExpedition!.elites['lion-elite-valley-sentinel']!.active).toBe(true);
  });
  it.each(LOT_E_ELITES.map(elite=>elite.id))('resolved-only bounded zone of %s retains a legal continuation',eliteId=>{
    const def=LOT_E_ELITES.find(elite=>elite.id===eliteId)!;
    const initial=fixture(def.activateAfterResolved);
    // Resolved optional zone permits inert backtracking; this is a graph proof, never played wins.
    initial.resolvedNodeIds.push(...LOT_E_POIS.filter(poi=>poi.region===def.region).map(poi=>poi.id));
    const queue=[initial],seen=new Set<string>();let collisions=0;
    for(let n=0;n<queue.length;n++){
      const state=queue[n]!,exp=state.run.poiExpedition!,elite=exp.elites[eliteId]!;
      const key=JSON.stringify([state.currentNodeId,elite.positionId,elite.defeated,exp.previousSafeNodeId,exp.encounter?.kind]);
      if(seen.has(key))continue;seen.add(key);expect(seen.size).toBeLessThan(500);
      expect(def.allowedPositions).toContain(elite.positionId);
      if(exp.encounter){
        collisions++;const retreat=structuredClone(state);expect(retreatPoiElite(retreat,selectPoiMap(retreat))).toBe(true);queue.push(retreat);
        const victory=structuredClone(state);expect(winElite(victory)).toBe(true);
        expect(victory.resolvedNodeIds).toEqual(state.resolvedNodeIds);
        const defeat=structuredClone(state);failRunToCheckpoint(defeat);expect(defeat.run.poiExpedition!.elites[eliteId]!.defeated).toBe(false);
        continue;
      }
      const map=selectPoiMap(state);
      const moves=map.nodes.filter(node=>node.canMove&&(!LION_CANONICAL_POI_IDS.includes(node.id)||state.resolvedNodeIds.includes(node.id)));
      expect(moves.length+Number(map.threats.some(threat=>threat.canFight))).toBeGreaterThan(0);
      const waiting=structuredClone(state);expect(waitPoiTurn(waiting,selectPoiMap(waiting))).toBe(true);queue.push(waiting);
      for(const move of moves){const next=structuredClone(state);expect(enterPoi(next,move.id)).not.toBeNull();settlePoiNavigation(next);queue.push(next);}
    }
    expect(seen.size).toBeGreaterThan(10);expect(collisions).toBeGreaterThan(0);
  });
  it.each(LOT_E_ELITES.map(elite=>elite.id))('exhausts resolution masks, collisions, outcomes and reloads for %s, with a path to a real canonical trial',eliteId=>{
    const def=LOT_E_ELITES.find(elite=>elite.id===eliteId)!;
    const optional=LOT_E_POIS.filter(poi=>poi.region===def.region);
    const goals=def.region===1?['lion-second-trial-event','lion-second-trial-combat']:['lion-final-trial-event','lion-final-trial-combat'];
    const anchors=def.region===1?['lion-first-refuge','lion-reserve-trail','lion-valmir-road']:['lion-second-refuge','lion-lancer-recruit','lion-witnesses'];
    const prohibited=def.region===1?['lion-village-choice','lion-second-refuge']:['lion-shadow-signs','lion-final-refuge','lion-final-judgement'];
    const allowed=new Set([...anchors,...goals,...optional.map(poi=>poi.id)]);
    const base=fixture(def.activateAfterResolved);
    const states:GameState[]=[],keys=new Map<string,number>(),reverse=new Map<number,Set<number>>(),terminal=new Set<number>();
    let victories=0,defeats=0,retreats=0,chests=0,ordinaryResolutions=0,reloads=0;
    function add(state:GameState,parent?:number):number {
      selectPoiMap(state); // Materialize existing adaptive data before comparing durable snapshots.
      const exp=state.run.poiExpedition!;
      const key=JSON.stringify([state.currentNodeId,state.resolvedNodeIds.filter(id=>id.startsWith('lion-poi-')).sort(),
        Object.values(exp.elites).map(elite=>[elite.active,elite.positionId,elite.patrolIndex,elite.defeated]),
        exp.previousSafeNodeId,exp.encounter&&[exp.encounter.eliteId,exp.encounter.kind,exp.encounter.phase,exp.encounter.safeReturnNodeId],
        state.run.traversalBranches]);
      let index=keys.get(key);
      if(index===undefined){index=states.length;keys.set(key,index);states.push(state);expect(states.length).toBeLessThan(20000);}
      if(parent!==undefined){const incoming=reverse.get(index)??new Set<number>();incoming.add(parent);reverse.set(index,incoming);}
      return index;
    }
    for(let mask=0;mask<(1<<optional.length);mask++){
      const state=structuredClone(base);
      for(let bit=0;bit<optional.length;bit++)if(mask&(1<<bit)){
        state.resolvedNodeIds.push(optional[bit]!.id);state.run.visitedNodeIds.push(optional[bit]!.id);
      }
      state.visitedNodeIds=[...state.run.visitedNodeIds];add(state);
    }
    for(let index=0;index<states.length;index++){
      const state=states[index]!,map=selectPoiMap(state),exp=state.run.poiExpedition!;
      const roundtrip=migrateState(JSON.parse(JSON.stringify(state)));
      expect(roundtrip).toEqual(JSON.parse(JSON.stringify(state)));reloads++;
      for(const id of prohibited)expect(map.nodes.find(node=>node.id===id)?.status).toBe('locked');
      for(const actor of LOT_E_ELITES)expect(actor.allowedPositions).toContain(exp.elites[actor.id]!.positionId);
      if(goals.includes(state.currentNodeId)){
        expect(state.resolvedNodeIds).not.toContain(state.currentNodeId);expect(exp.encounter).toBeUndefined();terminal.add(index);continue;
      }
      if(exp.encounter){
        const retreat=structuredClone(state),turn=exp.turn;
        expect(retreatPoiElite(retreat,selectPoiMap(retreat))).toBe(true);expect(retreat.run.poiExpedition!.turn).toBe(turn);
        add(retreat,index);retreats++;
        const victory=structuredClone(state);expect(winElite(victory)).toBe(true);
        expect(victory.resolvedNodeIds).toEqual(state.resolvedNodeIds);add(victory,index);victories++;
        const defeat=structuredClone(state),liveElite=exp.encounter.eliteId;
        const encounterId=defeat.run.poiExpedition!.encounter!.id,combatId=commitPoiEliteFight(defeat,encounterId)!;
        expect(resolvePoiEliteVictory(defeat,encounterId,result(combatId,false))).toBe(false);
        failRunToCheckpoint(defeat);expect(defeat.run.poiExpedition!.elites[liveElite]!.defeated).toBe(false);
        expect(defeat.run.temporaryLoot.gold).toBe(0);add(defeat,index);defeats++;continue;
      }
      const waiting=structuredClone(state);expect(waitPoiTurn(waiting,selectPoiMap(waiting))).toBe(true);add(waiting,index);
      for(const node of map.nodes.filter(node=>node.canMove&&allowed.has(node.id))){
        const enteredState=structuredClone(state),entered=enterPoi(enteredState,node.id);expect(entered).not.toBeNull();
        if(entered!.interception){add(enteredState,index);continue;}
        if(goals.includes(node.id)){expect(entered!.activate).toBe(true);add(enteredState,index);continue;}
        if(entered!.activate&&node.type==='combat'){
          const defeat=structuredClone(enteredState);failRunToCheckpoint(defeat);add(defeat,index);defeats++;
          // Assumed ordinary-owner success is a graph fixture only; native wins are separate proof.
          enteredState.resolvedNodeIds.push(node.id);ordinaryResolutions++;
        }else if(entered!.activate&&node.type==='chest'){
          expect(createPoiChestAdapter()(enteredState,node.id)).not.toBeNull();chests++;
        }
        settlePoiNavigation(enteredState);add(enteredState,index);
      }
    }
    // Reverse reachability proves every enumerated reachable state has a finite continuation,
    // rather than merely asserting that some immediate button is enabled.
    const reachable=new Set(terminal),work=[...terminal];
    for(let index=0;index<work.length;index++)for(const prior of reverse.get(work[index]!)??[])
      if(!reachable.has(prior)){reachable.add(prior);work.push(prior);}
    expect(terminal.size).toBeGreaterThan(0);expect(reachable.size).toBe(states.length);
    expect(states.length).toBeGreaterThan(100);expect(reloads).toBe(states.length);
    expect(victories).toBeGreaterThan(0);expect(defeats).toBeGreaterThan(0);expect(retreats).toBeGreaterThan(0);
    expect(chests).toBeGreaterThan(0);expect(ordinaryResolutions).toBeGreaterThan(0);
  },60000);
});
