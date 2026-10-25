// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {GameApp} from './GameApp';
import {createInitialState} from './store';
import {dialogues,POST_NODE_ATE} from './content';
import {bypassPoi,selectPoiMap} from './runSystem';
import {resolveOptionalEncounterIgnoreConsequence} from './OptionalEncounterConsequencePolicy';
import {CampaignStatusHud,selectCampaignStatus} from '../ui/CampaignStatusHud';
import {resolveCharacterVisualProfile} from '../render/CharacterVisualRegistry';
afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();});
function ignoreHarness(){
 const state=createInitialState();state.run.currentNodeId=state.currentNodeId='lion-nomad-crossroads';
 state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads'];
 const statusHud=new CampaignStatusHud(()=>selectCampaignStatus(state));
 const app=Object.assign(Object.create(GameApp.prototype),{state,statusHud,mode:'TRAVEL',routeCommitInFlight:false,
  saves:{saveAuto:vi.fn()},showPoiMap:vi.fn()});
 return {app,state,statusHud};
}
it('applies authored refugee bypass once in the owner without visits, resolution or saves',()=>{
 const {app,state}=ignoreHarness(),before=state.reputation;
 expect(bypassPoi(state,'lion-opening-ambush')).toBeNull();expect(bypassPoi(state,'lion-refugees')).not.toBeNull();
 expect(bypassPoi(state,'lion-refugees')).toBeNull();expect(state.reputation).toBe(before-2);
 expect(state.flags.ignoredRefugees).toBe(true);expect(state.run.visitedNodeIds).not.toContain('lion-refugees');
 expect(state.resolvedNodeIds).not.toContain('lion-refugees');expect(app.saves.saveAuto).not.toHaveBeenCalled();
});
it.each(['mystery_help','mystery_treasure'])('requires the real first trial even when its assignment is %s',contentId=>{
 const {state}=ignoreHarness();state.mysteryAssignments['lion-first-trial-event']=contentId;selectPoiMap(state);
 const before=structuredClone(state);expect(bypassPoi(state,'lion-first-trial-event')).toBeNull();expect(state).toEqual(before);
});
it.each(['lion-refugees','lion-first-trial-event'])('keeps active %s dialogue effects as sole authority',nodeId=>{
 const {app,state}=ignoreHarness();app.mode='NARRATIVE';state.run.currentNodeId=state.currentNodeId=nodeId;
 const before=structuredClone(state);app.ignorePoi(nodeId);expect(state).toEqual(before);
 expect(dialogues.get('mystery_help')!.steps[0]!.choices![1]!.effects).toEqual([
  {type:'addReputation',amount:-2},{type:'setFlag',key:'abandonedMerchant',value:true}]);
});
it('applies actual merchant abandonment dialogue once without an additional map ignore effect',async()=>{
 const {app,state}=ignoreHarness(),before=state.reputation;
 await app.applyEffects(dialogues.get('mystery_help')!.steps[0]!.choices![1]!.effects);
 expect(bypassPoi(state,'lion-first-trial-event')).toBeNull();expect(state.reputation).toBe(before-2);
 expect(state.flags.abandonedMerchant).toBe(true);expect(app.saves.saveAuto).not.toHaveBeenCalled();
});
it.each(['mystery_recruit','roadside_peddler','wolf_pack','chest','gold','ward','obstacle','mystery_treasure'])(
 'does not infer a penalty for %s',contentId=>expect(resolveOptionalEncounterIgnoreConsequence('T0',{id:contentId,contentId})).toBeNull());

it('secures loot, stages actual clan, gathers once, then opens management and preserves later ATE', async () => {
  const state = createInitialState();
  state.run.temporaryLoot.gold = 40;
  state.run.temporaryLoot.inventory.materials.red_gem = 2;
  const gold = state.gold, gems = state.inventory.materials.red_gem ?? 0;
  const order: string[] = [];
  const app = Object.assign(Object.create(GameApp.prototype), { state, mode: 'RESULT',
    saves: { saveAuto: vi.fn() }, soundSettings: { close: vi.fn() }, uiSounds: { play: vi.fn() },
    activeNarrativeStage: null, statusHud: new CampaignStatusHud(() => selectCampaignStatus(state)),
    playJourneyCinematic: vi.fn(async (id: string) => { order.push(id); }),
    playDialogue: vi.fn(async (id: string, _label: string, options: any) => {
      order.push(id);
      expect(state.gold).toBe(gold + 40);
      expect(state.inventory.materials.red_gem).toBe(gems + 2);
      expect(state.run.temporaryLoot.gold).toBe(0);
      const cast = options.tableau.phases[0].staticCast.map((actor: any) => actor.actorId);
      expect(cast.length).toBeLessThanOrEqual(4);
      const party=new Set(state.clan.members.map(member=>resolveCharacterVisualProfile(member.definitionId)!.unitId));
      const speakers=new Set(dialogues.get('first_refuge_gathering')!.steps.map(step=>step.actorId));
      for(const phase of options.tableau.phases){expect(phase.staticCast.length).toBeLessThanOrEqual(4);
        for(const actor of phase.staticCast)expect(speakers.has(actor.actorId)||party.has(actor.actorId)).toBe(true);}
      expect(cast.some((id:string)=>party.has(id))).toBe(true);
      expect(options.tableau.tableauBackgroundId).toBe('first_refuge_gathering_environment');
    }),
    exploration: {
      prepareBackground: vi.fn(async () => undefined),
      open: vi.fn(async () => { order.push('management'); return 'continue'; }),
    },
    playPostNodeNarrative: vi.fn(async () => { order.push('later-narrative'); return false; }),
    enterCampaignPresentation: vi.fn(async () => undefined),
  });
  const refuge = state.run.graph.nodes.find(node => node.id === 'lion-first-refuge')!;
  await app.resolveRunNode(refuge, false);
  expect(order).toEqual(['first_refuge_arrival', 'first_refuge_gathering', 'management', 'later-narrative']);
  await app.resolveRunNode(refuge, false);
  expect(app.playDialogue).toHaveBeenCalledOnce();
  expect(state.gold).toBe(gold + 40);
  expect(POST_NODE_ATE['lion-first-refuge']).toContain('ate_first_refuge_watch');
});
