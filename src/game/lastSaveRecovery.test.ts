// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {createInitialState,migrateState,SaveRepository} from './store';
import {creditRunReward,getRunNode} from './runSystem';
import {buyItem,useConsumable} from './management';
import {GameApp} from './GameApp';
import type {GameState,CombatResult,CombatConfig,RunNode} from './types';

const auto='rpg-threejs:autosave:v6',manual='rpg-threejs:manual:v6';
afterEach(()=>{localStorage.clear();document.body.replaceChildren();vi.restoreAllMocks();});
describe('last actual save is the complete recovery authority',()=>{
  it.each(['active','completed'] as const)('consolidates only the remaining legacy pool once for a %s V6 without moving checkpoint or facts',status=>{
    const old=createInitialState();old.run.status=status;old.run.currentNodeId=old.currentNodeId='lion-valmir-road';
    old.run.checkpointNodeId='lion-first-refuge';old.resolvedNodeIds=['lion-opening-ambush'];old.flags.rewardAlreadyPaid=true;
    old.run.temporaryLoot.gold=71;old.run.temporaryLoot.inventory.materials.red_gem=2;
    old.run.temporaryLoot.inventory.weapons.steel_spear=1;old.run.temporaryLoot.inventory.consumables.potion=3;
    const expected=structuredClone(old);expected.gold+=71;expected.inventory.materials.red_gem=2;expected.inventory.weapons.steel_spear=1;expected.inventory.consumables.potion!+=3;
    expected.run.temporaryLoot={gold:0,inventory:{consumables:{},weapons:{},accessories:{},materials:{}}};
    const loaded=migrateState(old);
    // Expedition migration is separately established; compare all original gameplay fields.
    const comparable=structuredClone(loaded);
    expect(comparable).toEqual(expected);expect(migrateState(loaded)).toEqual(loaded);
  });
  it('new rewards can be spent and consumed immediately, while recovery restores the saved gains AND their spent/resolved facts',()=>{
    const state=createInitialState(),saves=new SaveRepository();
    creditRunReward(state,{gold:40});creditRunReward(state,{category:'consumables',itemId:'potion',quantity:1});
    state.resolvedNodeIds.push('lion-poi-opening-supplies');state.flags.rewardAlreadyPaid=true;
    expect(buyItem(state,'valmir','potion')).toBe(true);state.clan.members[0]!.currentHealth=1;
    expect(useConsumable(state,state.clan.members[0]!.id,'potion')).toBe(true);
    saves.saveAuto(state);const expected=saves.loadAuto()!,bytes=localStorage.getItem(auto);
    state.gold+=999;state.inventory.consumables.potion=0;state.shops.valmir!.stock.potion=0;
    state.resolvedNodeIds=[];state.flags.rewardAlreadyPaid=false;state.clan.members.splice(1);state.deployment.unitIds=[];
    state.run.checkpointNodeId='lion-camp';state.run.traversalBranches={T1:'lion-second-trial-combat'};
    expect(saves.loadRecovery(state)).toEqual(expected);expect(localStorage.getItem(auto)).toBe(bytes);
    expect(saves.loadRecovery(state)).toEqual(expected); // no cumulation across repeat losses
  });
  it('rejects unrelated autosaves, uses only a same-run manual fallback and never writes either slot',()=>{
    const current=createInitialState(),saves=new SaveRepository();saves.saveManual(current);
    const other=createInitialState();other.run.id+='-other';saves.saveAuto(other);
    const bytes=[localStorage.getItem(auto),localStorage.getItem(manual)];
    expect(saves.loadRecovery(current)?.run.id).toBe(current.run.id);
    expect([localStorage.getItem(auto),localStorage.getItem(manual)]).toEqual(bytes);
    current.run.seed+=1;expect(saves.loadRecovery(current)).toBeNull();
  });
  it('ignores corrupt recovery bytes without overwriting them or fabricating a new game',()=>{
    localStorage.setItem(auto,'{broken');vi.spyOn(console,'warn').mockImplementation(()=>{});
    expect(new SaveRepository().loadRecovery(createInitialState())).toBeNull();expect(localStorage.getItem(auto)).toBe('{broken');
  });
  it('ordinary loss restores every saved field, keeps current preferences live and resumes unresolved content only on explicit input',async()=>{
    const root=document.createElement('div');document.body.append(root);const app=new GameApp(root,document.createElement('canvas'));
    const owner=app as unknown as {state:GameState;resolveCombat(r:CombatResult,n:RunNode,rewards:CombatConfig['rewards']):Promise<void>;
      resolveRunNode(n:RunNode,initial:boolean):Promise<void>;playStandaloneCinematic(...args:unknown[]):Promise<void>};
    owner.state=migrateState(createInitialState());owner.state.run.currentNodeId=owner.state.currentNodeId='lion-poi-opening-wolves';
    owner.state.run.checkpointNodeId='lion-first-refuge';new SaveRepository().saveAuto(owner.state);
    const saved=new SaveRepository().loadAuto()!,bytes=localStorage.getItem(auto);owner.state.gold=0;owner.state.inventory.consumables.potion=0;
    owner.state.settings.reducedGraphics=true;const resume=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    vi.spyOn(owner,'playStandaloneCinematic').mockResolvedValue();
    await owner.resolveCombat({combatId:'unused-loss-fixture',victory:false,participants:[],unitHealth:{}},getRunNode(owner.state.run)!,{gold:90,reputation:2,materials:{}});
    saved.settings.reducedGraphics=true;expect(owner.state).toEqual(saved);expect(localStorage.getItem(auto)).toBe(bytes);
    expect(resume).not.toHaveBeenCalled();expect(root.querySelector('[data-action=resume-save]')).toBe(document.activeElement);
    root.querySelector<HTMLButtonElement>('[data-action=resume-save]')!.click();
    await vi.waitFor(()=>expect(resume).toHaveBeenCalledWith(expect.objectContaining({id:saved.currentNodeId}),true));
    expect(localStorage.getItem(auto)).toBe(bytes);app.dispose();
  });
});
