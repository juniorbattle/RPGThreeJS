// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createInitialState, SaveRepository } from './store';
import { bypassPoi, enterPoi, failRunToCheckpoint, isPoiNeutralized, selectPoiMap } from './runSystem';
import type { GameState } from './types';

// Pure authority fixtures explicitly mark content resolved; these are not played combat evidence.
function resolveFixture(state: GameState, id: string): void {
  expect(enterPoi(state,id)?.activate).toBe(true);
  state.resolvedNodeIds.push(id);
}
function crossroads(): GameState {
  const state=createInitialState();
  resolveFixture(state,'lion-audience');resolveFixture(state,'lion-opening-ambush');resolveFixture(state,'lion-nomad-crossroads');
  return state;
}
const node=(s:GameState,id:string)=>selectPoiMap(s).nodes.find(n=>n.id===id)!;

describe('authoritative connected POI navigation',()=>{
  it('preserves both directions of a legitimate bypass connection without replay or mandatory shortcuts',()=>{
    const state=crossroads();expect(bypassPoi(state,'lion-refugees')).not.toBeNull();
    resolveFixture(state,'lion-first-trial-event');
    const before={flags:structuredClone(state.flags),resolved:[...state.resolvedNodeIds],steps:state.stepCounter,
      gold:state.gold,loot:structuredClone(state.run.temporaryLoot),reputation:state.reputation};
    expect(node(state,'lion-nomad-crossroads').canMove).toBe(true);
    expect(enterPoi(state,'lion-nomad-crossroads')?.activate).toBe(false);
    expect(node(state,'lion-first-trial-event').canMove).toBe(true);
    expect(enterPoi(state,'lion-first-trial-event')?.activate).toBe(false);
    expect({flags:state.flags,resolved:state.resolvedNodeIds,steps:state.stepCounter,gold:state.gold,
      loot:state.run.temporaryLoot,reputation:state.reputation}).toEqual(before);
    const invalid=createInitialState();invalid.run.bypassedRouteNodeIds=['lion-audience','lion-opening-ambush'];
    expect(selectPoiMap(invalid).edges.some(e=>e.from==='lion-camp'&&e.to==='lion-nomad-crossroads')).toBe(false);
    expect(node(invalid,'lion-nomad-crossroads').status).toBe('locked');
  });
  it('refuses movement and bypass after the campaign has ended',()=>{
    const state=crossroads();resolveFixture(state,'lion-refugees');state.mysteryAssignments={};state.run.status='completed';
    const before=structuredClone(state);
    expect(enterPoi(state,'lion-refugees')).toBeNull();expect(bypassPoi(state,'lion-refugees')).toBeNull();
    expect(enterPoi(state,'lion-first-trial-event')).toBeNull();
    expect(selectPoiMap(state).nodes.every(n=>!n.canMove&&!n.canActivate&&!n.canBypass)).toBe(true);
    expect(state).toEqual(before);
  });
  it('refuses teleport and future content without skipping the real opening battle',()=>{
    const state=createInitialState(); const graph=structuredClone(state.run.graph);
    expect(enterPoi(state,'lion-first-refuge')).toBeNull();resolveFixture(state,'lion-audience');
    expect(node(state,'lion-opening-ambush').canMove).toBe(true);
    expect(node(state,'lion-nomad-crossroads').status).toBe('locked');
    expect(enterPoi(state,'lion-nomad-crossroads')).toBeNull();
    expect(state.run.graph.nodes.map(n=>n.links)).toEqual(graph.nodes.map(n=>n.links));
  });
  it('backtracks through resolved POIs without repeating activation or changing consequences',()=>{
    const state=crossroads(); const facts={resolved:[...state.resolvedNodeIds],gold:state.gold,loot:structuredClone(state.run.temporaryLoot),reputation:state.reputation,steps:state.stepCounter};
    expect(enterPoi(state,'lion-opening-ambush')?.activate).toBe(false);
    expect(enterPoi(state,'lion-audience')?.activate).toBe(false);
    expect(enterPoi(state,'lion-opening-ambush')?.activate).toBe(false);
    expect(enterPoi(state,'lion-nomad-crossroads')?.activate).toBe(false);
    expect({resolved:state.resolvedNodeIds,gold:state.gold,loot:state.run.temporaryLoot,reputation:state.reputation,steps:state.stepCounter}).toEqual(facts);
  });
  it('bypasses only authored optional content once and allows compatible revisits',()=>{
    const state=crossroads();expect(bypassPoi(state,'lion-opening-ambush')).toBeNull();
    expect(bypassPoi(state,'lion-refugees')?.legId).toBe('T0');
    expect(bypassPoi(state,'lion-refugees')).toBeNull();
    expect(state.resolvedNodeIds).not.toContain('lion-refugees');
    expect(node(state,'lion-refugees').status).toBe('available');
    expect(node(state,'lion-first-trial-event').canMove).toBe(true);
    const map=selectPoiMap(state);
    for(const candidate of map.nodes.filter(n=>n.canMove))expect(map.edges.some(e=>
      e.unlocked&&((e.from===map.currentNodeId&&e.to===candidate.id)||(e.to===map.currentNodeId&&e.from===candidate.id)))).toBe(true);
    expect(enterPoi(state,'lion-first-trial-event')?.activate).toBe(true);
    state.resolvedNodeIds.push('lion-first-trial-event');
    expect(enterPoi(state,'lion-refugees')?.activate).toBe(true);
  });
  it('neutralizes only the incompatible fork without resolving/rewarding it or skipping the chosen battle',()=>{
    const state=crossroads();resolveFixture(state,'lion-refugees');
    expect(enterPoi(state,'lion-first-trial-combat')?.activate).toBe(true);
    expect(isPoiNeutralized(state,'lion-first-trial-event')).toBe(true);
    expect(state.resolvedNodeIds).not.toContain('lion-first-trial-event');
    expect(enterPoi(state,'lion-first-refuge')).toBeNull();
    state.resolvedNodeIds.push('lion-first-trial-combat');
    expect(enterPoi(state,'lion-refugees')?.activate).toBe(false);
    expect(enterPoi(state,'lion-first-trial-event')?.activate).toBe(false);
    expect(enterPoi(state,'lion-first-refuge')?.activate).toBe(true);
  });
  it('materializes eligible adaptive content before first visit, stable across V6 reload',()=>{
    const state=crossroads();state.flags.lionMandateAdvance=true;resolveFixture(state,'lion-refugees');
    const content=node(state,'lion-first-trial-event').contentId;
    expect(state.mysteryAssignments['lion-first-trial-event']).toBe(content);
    expect(enterPoi(state,'lion-first-trial-event')?.node.contentId).toBe(content);
    state.flags.lionMandateAdvance=false;state.flags.lionMandateHonour=true;
    const saves=new SaveRepository();saves.saveAuto(state);const loaded=saves.loadAuto()!;
    expect(loaded).toEqual(state);expect(node(loaded,'lion-first-trial-event').contentId).toBe(content);
    expect(loaded.version).toBe(6);
  });
  it('preserves old V6 interruptions without converting a visit to victory, and clears a losing branch on rollback',()=>{
    const state=crossroads();resolveFixture(state,'lion-refugees');
    state.run.currentNodeId='lion-first-trial-combat';state.currentNodeId=state.run.currentNodeId;
    state.run.visitedNodeIds.push(state.currentNodeId);
    expect(node(state,'lion-first-trial-event').status).toBe('neutralized');
    expect(state.resolvedNodeIds).not.toContain('lion-first-trial-combat');
    state.run.traversalBranches={T0:'lion-first-trial-combat'};
    failRunToCheckpoint(state);
    expect(state.run.currentNodeId).toBe('lion-camp');
    expect(node(state,'lion-first-trial-event').status).toBe('available');
    expect(state.resolvedNodeIds).not.toContain('lion-first-trial-combat');
  });
  it('keeps refuge services reusable, final narrative refuge non-reusable, and future primary locked',()=>{
    const state=crossroads();resolveFixture(state,'lion-refugees');resolveFixture(state,'lion-first-trial-event');resolveFixture(state,'lion-first-refuge');
    state.flags['refugeSecured:lion-first-refuge']=true;
    expect(enterPoi(state,'lion-first-refuge')?.activate).toBe(true);
    expect(node(state,'lion-first-refuge').reusable).toBe(true);
    expect(node(state,'lion-final-refuge').reusable).toBe(false);
    expect(node(state,'lion-village-choice').status).toBe('locked');
    const saves=new SaveRepository();saves.saveAuto(state);const loaded=saves.loadAuto()!;
    expect(node(loaded,'lion-first-trial-combat').status).toBe('neutralized');
    expect(loaded).toEqual(state);
  });
});
