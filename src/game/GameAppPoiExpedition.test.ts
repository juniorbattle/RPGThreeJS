// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {GameApp} from './GameApp';
import {createInitialState,SaveRepository} from './store';
import {LION_CANONICAL_POI_IDS} from '../campaign/LionPoiAuthoring';
import {syncPoiElites} from './poiExpedition';
import {enterPoi,commitPoiEliteFight} from './runSystem';
import {combatConfigs} from './content';
import {sceneTransition} from '../ui/SceneTransition';
import type {GameState,CombatResult,CombatConfig,RunNode} from './types';

afterEach(()=>{localStorage.clear();document.body.replaceChildren();vi.restoreAllMocks();});
function fixture(current='lion-nomad-crossroads'){
  const root=document.createElement('div');document.body.append(root);const app=new GameApp(root,document.createElement('canvas'));
  const owner=app as unknown as {state:GameState;mode:string;choosePoi(id:string):Promise<void>;showPoiMap():void;
    continueChronicle():Promise<void>;resolveCombat(result:CombatResult,node:RunNode,rewards:CombatConfig['rewards']):Promise<void>;
    combat:{start(input:{config:CombatConfig}):{ready:Promise<void>;result:Promise<CombatResult>}}};
  owner.state=createInitialState();const until=LION_CANONICAL_POI_IDS.indexOf(current);
  owner.state.resolvedNodeIds=LION_CANONICAL_POI_IDS.slice(0,until+1).filter(id=>!id.endsWith('-trial-combat'));
  owner.state.run.currentNodeId=owner.state.currentNodeId=current;
  owner.state.run.visitedNodeIds=[...owner.state.resolvedNodeIds];owner.state.visitedNodeIds=[...owner.state.resolvedNodeIds];
  if(until>=LION_CANONICAL_POI_IDS.indexOf('lion-first-refuge')){
    owner.state.run.checkpointNodeId='lion-first-refuge';owner.state.flags['refugeSecured:lion-first-refuge']=true;
  }
  syncPoiElites(owner.state);owner.showPoiMap();
  vi.spyOn(sceneTransition,'run').mockImplementation(async options=>{await options.task();});
  return {app,owner,root};
}
function savedRearEncounter(owner:{state:GameState}):void {
  const exp=owner.state.run.poiExpedition!,elite=exp.elites['lion-elite-valley-sentinel']!;
  elite.positionId='lion-valmir-road';exp.previousSafeNodeId='lion-reserve-trail';exp.turn=2;
  exp.encounter={id:'lion-elite-valley-sentinel:2:rear',eliteId:'lion-elite-valley-sentinel',kind:'rear',originNodeId:'lion-valmir-road',
    targetNodeId:'lion-valmir-road',safeReturnNodeId:'lion-reserve-trail',phase:'choice'};
  new SaveRepository().saveAuto(owner.state);
}
describe('mechanical GameApp expedition integration, not native battle evidence',()=>{
  it('opens the real approved chest popup, saves attribution first and ignores a rapid second entry',async()=>{
    const {app,owner,root}=fixture();
    const pending=owner.choosePoi('lion-poi-opening-supplies');
    await owner.choosePoi('lion-poi-opening-supplies');
    expect(root.querySelectorAll('[role=dialog]')).toHaveLength(1);
    const saved=new SaveRepository().loadAuto()!;
    expect(saved.resolvedNodeIds.filter(id=>id==='lion-poi-opening-supplies')).toHaveLength(1);
    expect(saved.run.temporaryLoot.inventory.consumables.potion).toBeUndefined();
    expect(saved.inventory.consumables.potion).toBe(5);expect(saved.gold).toBe(250);
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=close]')!.click();await pending;
    expect(root.querySelector('.poi-map')).not.toBeNull();expect(owner.state.run.poiExpedition?.pendingStep).toBeUndefined();
    app.dispose();
  });
  it('front native modal cancellation preserves source, content, visits, branch and turn',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');const before=structuredClone(owner.state);
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');
    expect(root.querySelector('[role=dialog]')?.textContent).toContain('Se replier');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await pending;
    expect(owner.state).toEqual(before);app.dispose();
  });
  it('routes a simulated mobile tactical result through its independent owner and persists exactly once',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road'),canonical=vi.spyOn(owner,'resolveCombat');
    const start=vi.spyOn(owner.combat,'start').mockImplementation(({config})=>({ready:Promise.resolve(),
      result:Promise.resolve({combatId:config.id,victory:true,participants:[],unitHealth:{}})}));
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=fight]')!.click();await pending;
    expect(start.mock.calls[0]?.[0].config.id).toBe('poi_elite_valley_sentinel');
    expect(canonical).not.toHaveBeenCalled();
    const saved=new SaveRepository().loadAuto()!;
    expect(saved.currentNodeId).toBe('lion-valmir-road');expect(saved.resolvedNodeIds).not.toContain('lion-poi-valley-bridge-cache');
    expect(saved.gold).toBe(370);expect(saved.run.temporaryLoot.gold).toBe(0);expect(saved.run.poiExpedition?.elites['lion-elite-valley-sentinel']?.defeated).toBe(true);
    expect(saved.flags.serpentGeneralDefeated).toBeUndefined();expect(saved.run.status).toBe('active');app.dispose();
  });
  it.each([
    [['a','b','c'],true,'Défi réussi · 3 héros au plus · +2 gemmes rouges'],
    [['a','b','c','d'],false,'Défi manqué · 3 héros au plus · pas de prime'],
  ] as const)('a guardian victory with %j heroes saves its prime with the rewards and states the verdict (set 1.18.0)',async(participants,held,notice)=>{
    const {app,owner,root}=fixture('lion-valmir-road'),gems=owner.state.inventory.materials.red_gem??0;
    const start=vi.spyOn(owner.combat,'start').mockImplementation(({config})=>({ready:Promise.resolve(),
      result:Promise.resolve({combatId:config.id,victory:true,participants:[...participants],unitHealth:{},rounds:4,itemsUsed:0})}));
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=fight]')!.click();await pending;
    expect(start.mock.calls[0]?.[0].config).toMatchObject({maxPlayerUnits:3,challenge:{kind:'max_heroes',limit:3,primeRedGems:2}});
    const saved=new SaveRepository().loadAuto()!;
    // Base guardian reward (1 gem) plus the prime when the condition holds; saved together with the defeated fact.
    expect(saved.inventory.materials.red_gem??0).toBe(gems+1+(held?2:0));
    expect(saved.run.poiExpedition?.elites['lion-elite-valley-sentinel']?.defeated).toBe(true);
    expect(document.querySelector('.save-notice')?.textContent).toBe(notice);app.dispose();
  });
  it.each([
    [3,true,'Défi réussi · 3 héros au plus · +1 gemme rouge'],
    [4,false,'Défi manqué · 3 héros au plus · pas de prime'],
  ] as const)('an ordinary Lot E challenge won with %i heroes credits its prime with the rewards and states it back on the map',async(heroes,held,notice)=>{
    const {app,owner}=fixture('lion-nomad-crossroads'),gems=owner.state.inventory.materials.red_gem??0;
    const node=owner.state.run.graph.nodes.find(candidate=>candidate.id==='lion-poi-opening-wolves')!;
    const units=owner.state.clan.members.slice(0,heroes);
    await owner.resolveCombat({combatId:node.contentId,victory:true,participants:units.map(unit=>unit.id),
      unitHealth:Object.fromEntries(units.map(unit=>[unit.id,unit.currentHealth])),rounds:3,itemsUsed:0},node,combatConfigs.get(node.contentId)!.rewards);
    // The wolves already give one red gem; the initiation prime adds one more when the condition holds.
    expect(owner.state.inventory.materials.red_gem??0).toBe(gems+1+(held?1:0));
    expect(owner.state.resolvedNodeIds).toContain('lion-poi-opening-wolves');
    expect(document.querySelector('.save-notice')?.textContent).toBe(notice);app.dispose();
  });
  it('reload reconstructs an interrupted independent encounter before any underlying chest activation',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');
    const first=owner.choosePoi('lion-poi-valley-bridge-cache');
    const saved=new SaveRepository().loadAuto()!;expect(saved.run.poiExpedition?.encounter?.phase).toBe('choice');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await first;
    new SaveRepository().saveAuto(saved);
    const resumed=owner.continueChronicle();await vi.waitFor(()=>expect(root.querySelector('[role=dialog]')).not.toBeNull());
    expect(owner.state.resolvedNodeIds).not.toContain('lion-poi-valley-bridge-cache');
    expect(owner.state.run.temporaryLoot.gold).toBe(0);
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await resumed;
    expect(owner.state.run.poiExpedition?.encounter).toBeUndefined();app.dispose();
  });
  it('a rear encounter saved by an older save retreats to its recorded safe POI without replay or a second turn',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');savedRearEncounter(owner);const before=structuredClone(owner.state);app.dispose();
    const replacement=new GameApp(root,document.createElement('canvas')),resumed=replacement as unknown as typeof owner;
    const pending=resumed.continueChronicle();
    await vi.waitFor(()=>expect(root.querySelector('[role=dialog]')?.textContent).toContain('point sûr précédent'));
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await pending;
    expect(resumed.state.currentNodeId).toBe('lion-reserve-trail');expect(resumed.state.run.poiExpedition!.turn).toBe(2);
    expect(resumed.state.resolvedNodeIds).toEqual(before.resolvedNodeIds);expect(resumed.state.run.temporaryLoot).toEqual(before.run.temporaryLoot);
    replacement.dispose();
  });
  it('disposing a front interception preserves the exact saved choice for a new app instead of applying a synthetic retreat',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');
    const before=structuredClone(owner.state),saved=localStorage.getItem('rpg-threejs:autosave:v6');
    expect(before.run.poiExpedition?.encounter?.phase).toBe('choice');expect(before.run.poiExpedition?.encounter?.kind).toBe('front');
    expect(root.querySelector('[role=dialog]')?.textContent).toContain('Défi · 3 héros au plus · Prime : 2 gemmes rouges');
    app.dispose();await pending;
    expect(owner.state).toEqual(before);expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(saved);
    expect(root.querySelector('.poi-map')).toBeNull();expect(root.querySelector('[role=dialog]')).toBeNull();
    const replacement=new GameApp(root,document.createElement('canvas'));
    const resumedOwner=replacement as unknown as typeof owner;
    const resumed=resumedOwner.continueChronicle();
    await vi.waitFor(()=>expect(root.querySelector('[role=dialog]')).not.toBeNull());
    expect(resumedOwner.state).toEqual(before);
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await resumed;
    expect(resumedOwner.state.run.poiExpedition?.encounter).toBeUndefined();replacement.dispose();
  });
  it('disposing an attributed chest preserves it without saving or redrawing, then resumes without another popup',async()=>{
    const {app,owner,root}=fixture('lion-reserve-trail');
    const pending=owner.choosePoi('lion-poi-valley-supplies');
    const before=structuredClone(owner.state),saved=localStorage.getItem('rpg-threejs:autosave:v6');
    expect(root.querySelector('[role=dialog]')).not.toBeNull();expect(before.run.poiExpedition?.pendingStep).toBeUndefined();
    app.dispose();await pending;
    expect(owner.state).toEqual(before);expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(saved);
    expect(root.querySelector('.poi-map')).toBeNull();expect(root.querySelector('[role=dialog]')).toBeNull();
    const replacement=new GameApp(root,document.createElement('canvas'));
    const resumedOwner=replacement as unknown as typeof owner;await resumedOwner.continueChronicle();
    expect(resumedOwner.state.run.poiExpedition?.turn).toBe(before.run.poiExpedition?.turn);
    expect(resumedOwner.state.run.temporaryLoot).toEqual(before.run.temporaryLoot);
    expect(resumedOwner.state.inventory).toEqual(before.inventory);
    expect(root.querySelector('[role=dialog]')).toBeNull();replacement.dispose();
  });
  it('mobile defeat reloads the exact saved combat phase without checkpoint relocation, reward or save writes',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');owner.state.gold=115;
    let reference='';let expected!:GameState;
    vi.spyOn(owner.combat,'start').mockImplementation(({config})=>{
      reference=localStorage.getItem('rpg-threejs:autosave:v6')!;expected=JSON.parse(reference);
      owner.state.gold=1;owner.state.inventory.consumables.potion=0;owner.state.settings.reducedGraphics=true;
      return {ready:Promise.resolve(),result:Promise.resolve({combatId:config.id,victory:false,participants:[],unitHealth:{}})};
    });
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=fight]')!.click();await pending;
    expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(reference);
    expected.settings.reducedGraphics=true;expect(owner.state).toEqual(expected);
    expect(owner.state.currentNodeId).toBe('lion-valmir-road');expect(owner.state.run.poiExpedition!.encounter!.phase).toBe('combat');
    expect(owner.state.run.poiExpedition!.elites['lion-elite-valley-sentinel']!.defeated).toBe(false);
    expect(root.querySelector('[data-action=resume-save]')).toBe(document.activeElement);
    expect(root.textContent).toContain('changements non sauvegardés');app.dispose();
  });
  it('an older save with a pending step reloads without moving its guardian, popup, reward or redraw tick',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road'),exp=owner.state.run.poiExpedition!;
    exp.elites['lion-elite-valley-sentinel']!.positionId='lion-poi-valley-serpent';exp.elites['lion-elite-valley-sentinel']!.patrolIndex=1;
    exp.turn=1;exp.pendingStep={step:1,fromNodeId:'lion-reserve-trail',toNodeId:'lion-valmir-road'};
    const gold=owner.state.gold;new SaveRepository().saveAuto(owner.state);app.dispose();
    const replacement=new GameApp(root,document.createElement('canvas')),resumed=replacement as unknown as typeof owner;
    await resumed.continueChronicle();
    const next=resumed.state.run.poiExpedition!;
    expect(root.querySelector('[role=dialog]')).toBeNull();expect(next.turn).toBe(1);expect(next.pendingStep).toBeUndefined();
    expect(next.elites['lion-elite-valley-sentinel']!.positionId).toBe('lion-poi-valley-bridge-cache');
    expect(resumed.state.gold).toBe(gold);expect(resumed.state.run.temporaryLoot.gold).toBe(0);
    const before=structuredClone(resumed.state);resumed.showPoiMap();expect(resumed.state).toEqual(before);replacement.dispose();
  });
  it('a saved combat-phase elite resumes its real bridge config without invoking the underlying node resolver',async()=>{
    const {app,owner}=fixture('lion-valmir-road');enterPoi(owner.state,'lion-poi-valley-bridge-cache');
    const encounter=owner.state.run.poiExpedition!.encounter!;commitPoiEliteFight(owner.state,encounter.id);new SaveRepository().saveAuto(owner.state);
    const canonical=vi.spyOn(owner,'resolveCombat');
    const start=vi.spyOn(owner.combat,'start').mockImplementation(({config})=>({ready:Promise.resolve(),result:Promise.resolve({combatId:config.id,victory:true,participants:[],unitHealth:{}})}));
    await owner.continueChronicle();expect(start.mock.calls[0]?.[0].config.id).toBe('poi_elite_valley_sentinel');expect(canonical).not.toHaveBeenCalled();
    expect(owner.state.gold).toBe(370);expect(owner.state.run.temporaryLoot.gold).toBe(0);expect(owner.state.resolvedNodeIds).not.toContain('lion-poi-valley-bridge-cache');app.dispose();
  });
});
