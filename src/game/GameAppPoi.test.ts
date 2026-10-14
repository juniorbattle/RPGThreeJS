// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState, SaveRepository } from './store';
import { sceneTransition } from '../ui/SceneTransition';
import type { GameState, RunNode } from './types';
import { getRunNode } from './runSystem';

afterEach(()=>{document.body.replaceChildren();localStorage.clear();vi.restoreAllMocks();});
function fixture() {
  const root=document.createElement('div');document.body.append(root);
  const app=new GameApp(root,document.createElement('canvas'));
  const owner=app as unknown as {
    state:GameState; mode:string;
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
  it('rebuilds final-refuge preparation on exact V6 reload without opening a hub or securing loot',async()=>{
    const {app,owner}=fixture();
    owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-refuge';
    owner.state.resolvedNodeIds.push('lion-final-refuge');owner.state.run.temporaryLoot.gold=17;
    new SaveRepository().saveAuto(owner.state);const before=structuredClone(owner.state);
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
