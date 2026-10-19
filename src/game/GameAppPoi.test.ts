// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState, SaveRepository, migrateState } from './store';
import { sceneTransition } from '../ui/SceneTransition';
import type { GameState, RunNode } from './types';
import { getRunNode } from './runSystem';
import type { PoiMapView } from '../ui/PoiMapView';

afterEach(()=>{document.body.replaceChildren();localStorage.clear();vi.restoreAllMocks();});
function fixture() {
  const root=document.createElement('div');document.body.append(root);
  const app=new GameApp(root,document.createElement('canvas'));
  const owner=app as unknown as {
    state:GameState; mode:string;
    poiMap:PoiMapView;routeCommitInFlight:boolean;
    resolveRunNode(node:RunNode,initial:boolean):Promise<void>;
    choosePoi(id:string):Promise<void>;ignorePoi(id:string):void;
    enterCampaignPresentation():Promise<void>;startCombat(id:string,node:RunNode):Promise<void>;
    continueChronicle():Promise<void>;
    enterJourney():Promise<void>;failJourneyToTravel(error:unknown):Promise<void>;
    playDialogue(...args:unknown[]):Promise<void>;
  };
  owner.state=createInitialState();return {app,owner};
}
describe('GameApp POI owner handoffs',()=>{
  it('releases the intent guard on a failed save without animating or entering content',async()=>{
    const {app,owner}=fixture();owner.mode='TRAVEL';
    vi.spyOn(SaveRepository.prototype,'saveAuto').mockImplementation(()=>{throw new Error('Storage unavailable');});
    const animation=vi.spyOn(owner.poiMap,'animateTravel'),content=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    await expect(owner.choosePoi('lion-audience')).rejects.toThrow('Storage unavailable');
    expect(owner.routeCommitInFlight).toBe(false);expect(animation).not.toHaveBeenCalled();expect(content).not.toHaveBeenCalled();app.dispose();
  });
  it('saves the owner movement before animating and prevents a second intent until the content handoff',async()=>{
    const {app,owner}=fixture();owner.mode='TRAVEL';
    let finish!:()=>void;
    const animation=vi.spyOn(owner.poiMap,'animateTravel').mockImplementation((from,to)=>{
      expect([from,to]).toEqual(['lion-camp','lion-audience']);
      expect(new SaveRepository().loadAuto()!.currentNodeId).toBe(to);
      return new Promise<void>(resolve=>{finish=resolve;});
    });
    const content=vi.spyOn(owner,'resolveRunNode').mockImplementation(async()=>{expect(owner.routeCommitInFlight).toBe(false);});
    const pending=owner.choosePoi('lion-audience');
    expect(owner.routeCommitInFlight).toBe(true);expect(content).not.toHaveBeenCalled();
    await owner.choosePoi('lion-opening-ambush');expect(animation).toHaveBeenCalledOnce();
    finish();await pending;expect(content).toHaveBeenCalledOnce();expect(owner.routeCommitInFlight).toBe(false);app.dispose();
  });
  it('does not resume content over a disposed app after an interrupted travel animation',async()=>{
    const {app,owner}=fixture();owner.mode='TRAVEL';let finish!:()=>void;
    vi.spyOn(owner.poiMap,'animateTravel').mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve;}));
    const content=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    const pending=owner.choosePoi('lion-audience');const saved=localStorage.getItem('rpg-threejs:autosave:v6');
    app.dispose();finish();await pending;
    expect(content).not.toHaveBeenCalled();expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(saved);expect(owner.routeCommitInFlight).toBe(false);
  });
  it.each([
    ['lion-nomad-crossroads',true],['lion-reserve-trail',true],['lion-witnesses',true],
    ['lion-refugees',false],['lion-second-trial-event',false],['lion-first-trial-combat',false],
  ] as const)('resumes historical V6 boundary %s through its current owner (resolved=%s)',async(id,resolved)=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId=owner.state.currentNodeId=id;
    owner.state.run.traversalBranches={T0:'lion-first-trial-combat',T1:'lion-second-trial-event'};
    owner.state.run.temporaryLoot.gold=23;
    if(resolved)owner.state.resolvedNodeIds.push(id);
    owner.state=migrateState(owner.state); // Initialize only the newly versioned expedition facts.
    new SaveRepository().saveAuto(owner.state);const saved=structuredClone(owner.state);
    vi.spyOn(sceneTransition,'run').mockImplementation(async options=>{await options.task();});
    const encounter=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    const map=vi.spyOn(owner,'enterCampaignPresentation').mockResolvedValue();
    await owner.continueChronicle();
    if(resolved){expect(map).toHaveBeenCalledOnce();expect(encounter).not.toHaveBeenCalled();}
    else {expect(encounter).toHaveBeenCalledWith(expect.objectContaining({id}),true);expect(map).not.toHaveBeenCalled();}
    expect(owner.state).toEqual(saved);expect(new SaveRepository().loadAuto()).toEqual(saved);
    expect(document.querySelector('.traversal-road,.traversal-fork-overlay')).toBeNull();app.dispose();
  });
  it('rebuilds final-refuge preparation on exact V6 reload without opening a hub or securing loot',async()=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-refuge';
    owner.state.resolvedNodeIds.push('lion-final-refuge');owner.state.run.temporaryLoot.gold=17;
    owner.state=migrateState(owner.state);new SaveRepository().saveAuto(owner.state);const before=structuredClone(owner.state);
    vi.spyOn(sceneTransition,'run').mockImplementation(async options=>{await options.task();});
    const preparation=vi.spyOn(owner,'enterJourney').mockResolvedValue();
    const resolve=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    await owner.continueChronicle();
    expect(preparation).toHaveBeenCalledOnce();expect(resolve).not.toHaveBeenCalled();
    expect(document.querySelector('.poi-map,.exploration-stop')).toBeNull();
    expect(owner.state).toEqual(before);expect(new SaveRepository().loadAuto()).toEqual(before);app.dispose();
  });
  it('presents a completed ending through its terminal agency on reload without replay or changing V6',async()=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-judgement';
    owner.state.resolvedNodeIds.push('lion-final-judgement');
    owner.state.run.status='completed';owner.state.endingId='lion-seal-serpent-truth';
    owner.state.flags.serpentGeneralDefeated=true;
    new SaveRepository().saveAuto(owner.state);const before=structuredClone(owner.state);
    document.body.dataset.campaignSurface='poi-map';
    vi.spyOn(sceneTransition,'run').mockImplementation(async options=>{await options.task();});
    const terminal=vi.spyOn(owner,'enterJourney').mockResolvedValue();
    const resolve=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    await owner.continueChronicle();
    expect(terminal).toHaveBeenCalledOnce();expect(resolve).not.toHaveBeenCalled();
    expect(document.querySelector('.poi-map')).toBeNull();expect(document.body.dataset.campaignSurface).toBeUndefined();
    expect(owner.state).toEqual(before);expect(new SaveRepository().loadAuto()).toEqual(before);app.dispose();
  });
  it('keeps active and incomplete completed boundaries on the map without fabricating an ending',async()=>{
    const {app,owner}=fixture();const terminal=vi.spyOn(owner,'enterJourney').mockResolvedValue();
    await owner.enterCampaignPresentation();expect(document.querySelector('.poi-map')).not.toBeNull();
    owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-judgement';
    owner.state.run.status='completed';
    await owner.enterCampaignPresentation();expect(terminal).not.toHaveBeenCalled();
    owner.state.endingId='lion-seal-serpent-truth';owner.state.flags.lionFinaleSerpentPursuitSelected=true;
    await owner.enterCampaignPresentation();expect(terminal).not.toHaveBeenCalled();app.dispose();
  });
  it('restores focused title agency after a failed terminal presentation, retaining the exact ending save',async()=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-judgement';
    owner.state.run.status='completed';owner.state.endingId='lion-seal-trial-truth';
    new SaveRepository().saveAuto(owner.state);const before=structuredClone(owner.state);
    document.body.dataset.campaignSurface='poi-map';vi.spyOn(console,'error').mockImplementation(()=>{});
    await owner.failJourneyToTravel(new Error('terminal fixture failure'));
    expect(document.querySelector('.title-screen')).not.toBeNull();expect(document.querySelector('.poi-map')).toBeNull();
    expect(document.body.dataset.campaignSurface).toBeUndefined();
    expect(document.activeElement?.getAttribute('data-action')).toBe('continue');
    expect(owner.state).toEqual(before);expect(new SaveRepository().loadAuto()).toEqual(before);app.dispose();
  });
  it('reloads an old bypassed optional current POI onto the map without activating it',async()=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId='lion-refugees';owner.state.currentNodeId='lion-refugees';
    owner.state.run.bypassedRouteNodeIds=['lion-refugees'];
    owner.state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads'];
    new SaveRepository().saveAuto(owner.state);
    vi.spyOn(sceneTransition,'run').mockImplementation(async options=>{await options.task();});
    const resolve=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    await owner.continueChronicle();
    expect(resolve).not.toHaveBeenCalled();expect(document.querySelector('.poi-map')).not.toBeNull();
    expect(owner.state.resolvedNodeIds).not.toContain('lion-refugees');app.dispose();
  });
  it('resumes a genuine pending finale on a resolved story node without replaying a won finale',async()=>{
    const {app,owner}=fixture();owner.state.resolvedNodeIds.push('lion-final-judgement');
    owner.state.flags.lionFinaleSerpentPursuitSelected=true;
    const combat=vi.spyOn(owner,'startCombat').mockResolvedValue();
    vi.spyOn(owner,'enterCampaignPresentation').mockResolvedValue();
    const finale=getRunNode(owner.state.run,'lion-final-judgement')!;
    await owner.resolveRunNode(finale,true);expect(combat).toHaveBeenCalledWith('serpent_captain',finale);
    combat.mockClear();owner.state.flags.serpentGeneralDefeated=true;
    await owner.resolveRunNode(finale,true);expect(combat).not.toHaveBeenCalled();app.dispose();
  });
  it('refuses an already-resolved combat before tactical entry, even on a resume',async()=>{
    const {app,owner}=fixture();owner.state.resolvedNodeIds.push('lion-opening-ambush');
    const combat=vi.spyOn(owner,'startCombat').mockResolvedValue();
    const boundary=vi.spyOn(owner,'enterCampaignPresentation').mockResolvedValue();
    await owner.resolveRunNode(getRunNode(owner.state.run,'lion-opening-ambush')!,true);
    expect(combat).not.toHaveBeenCalled();expect(boundary).toHaveBeenCalledOnce();app.dispose();
  });
  it('refuses the neutralized encounter without touching dialogue/rewards',async()=>{
    const {app,owner}=fixture();owner.state.run.traversalBranches={T0:'lion-first-trial-combat'};
    const dialogue=vi.spyOn(owner,'playDialogue').mockResolvedValue();
    vi.spyOn(owner,'enterCampaignPresentation').mockResolvedValue();
    const before=structuredClone(owner.state);
    await owner.resolveRunNode(getRunNode(owner.state.run,'lion-first-trial-event')!,true);
    expect(dialogue).not.toHaveBeenCalled();expect(owner.state).toEqual(before);app.dispose();
  });
  it('revalidates stale/remote map intentions against RunSystem',async()=>{
    const {app,owner}=fixture();owner.mode='TRAVEL';const before=structuredClone(owner.state);
    const resolve=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    await owner.choosePoi('lion-first-refuge');
    expect(resolve).not.toHaveBeenCalled();expect(owner.state).toEqual(before);app.dispose();
  });
  it('uses the authored bypass consequence exactly once and keeps event unresolved',()=>{
    const {app,owner}=fixture();owner.mode='TRAVEL';
    owner.state.run.currentNodeId='lion-nomad-crossroads';owner.state.currentNodeId='lion-nomad-crossroads';
    owner.state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads'];
    const reputation=owner.state.reputation;
    owner.ignorePoi('lion-refugees');owner.ignorePoi('lion-refugees');
    expect(owner.state.reputation).toBe(reputation-2);expect(owner.state.flags.ignoredRefugees).toBe(true);
    expect(owner.state.resolvedNodeIds).not.toContain('lion-refugees');
    expect(owner.state.run.visitedNodeIds).not.toContain('lion-refugees');app.dispose();
  });
});
