// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {GameApp} from './GameApp';
import {createInitialState,SaveRepository} from './store';
import {LION_CANONICAL_POI_IDS} from '../campaign/LionPoiAuthoring';
import {syncPoiElites} from './poiExpedition';
import {enterPoi,commitPoiEliteFight} from './runSystem';
import {sceneTransition} from '../ui/SceneTransition';
import type {GameState,CombatResult,CombatConfig,RunNode} from './types';

afterEach(()=>{localStorage.clear();document.body.replaceChildren();vi.restoreAllMocks();});
function fixture(current='lion-nomad-crossroads'){
  const root=document.createElement('div');document.body.append(root);const app=new GameApp(root,document.createElement('canvas'));
  const owner=app as unknown as {state:GameState;mode:string;choosePoi(id:string):Promise<void>;showPoiMap():void;
    continueChronicle():Promise<void>;waitOnPoi():Promise<void>;resolveCombat(result:CombatResult,node:RunNode,rewards:CombatConfig['rewards']):Promise<void>;
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
describe('mechanical GameApp expedition integration, not native battle evidence',()=>{
  it('opens the real approved chest popup, saves attribution first and ignores a rapid second entry',async()=>{
    const {app,owner,root}=fixture();
    const pending=owner.choosePoi('lion-poi-opening-supplies');
    await owner.choosePoi('lion-poi-opening-supplies');
    expect(root.querySelectorAll('[role=dialog]')).toHaveLength(1);
    const saved=new SaveRepository().loadAuto()!;
    expect(saved.resolvedNodeIds.filter(id=>id==='lion-poi-opening-supplies')).toHaveLength(1);
    expect(saved.run.temporaryLoot.inventory.consumables.potion).toBe(1);
    expect(saved.inventory.consumables.potion).toBe(4);expect(saved.gold).toBe(150);
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
    expect(saved.run.temporaryLoot.gold).toBe(120);expect(saved.run.poiExpedition?.elites['lion-elite-valley-sentinel']?.defeated).toBe(true);
    expect(saved.flags.serpentGeneralDefeated).toBeUndefined();expect(saved.run.status).toBe('active');app.dispose();
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
  it('rear modal retreats to the recorded adjacent safe POI without replay or a second turn',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road'),exp=owner.state.run.poiExpedition!;
    const elite=exp.elites['lion-elite-valley-sentinel']!;elite.positionId='lion-poi-valley-serpent';elite.patrolIndex=1;
    exp.previousSafeNodeId='lion-reserve-trail';const before=structuredClone(owner.state);
    const pending=owner.waitOnPoi();
    expect(root.querySelector('[role=dialog]')?.textContent).toContain('point sûr précédent');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=retreat]')!.click();await pending;
    expect(owner.state.currentNodeId).toBe('lion-reserve-trail');expect(exp.turn).toBe(1);
    expect(owner.state.resolvedNodeIds).toEqual(before.resolvedNodeIds);expect(owner.state.run.temporaryLoot).toEqual(before.run.temporaryLoot);app.dispose();
  });
  it('a mobile defeat uses the actual saved checkpoint owner, loses unsecured loot and leaves the elite alive',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road');owner.state.gold=44;owner.state.run.temporaryLoot.gold=71;
    vi.spyOn(owner.combat,'start').mockImplementation(({config})=>({ready:Promise.resolve(),
      result:Promise.resolve({combatId:config.id,victory:false,participants:[],unitHealth:{}})}));
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=fight]')!.click();await pending;
    const saved=new SaveRepository().loadAuto()!;
    expect(saved.currentNodeId).toBe('lion-first-refuge');expect(saved.gold).toBe(44);expect(saved.run.temporaryLoot.gold).toBe(0);
    expect(saved.run.poiExpedition!.elites['lion-elite-valley-sentinel']!.defeated).toBe(false);
    expect(saved.resolvedNodeIds).not.toContain('lion-poi-valley-bridge-cache');expect(saved.run.poiExpedition!.encounter).toBeUndefined();app.dispose();
  });
  it('replays one durable deferred step after an already-attributed chest reload without another popup, reward or redraw tick',async()=>{
    const {app,owner,root}=fixture('lion-valmir-road'),elite=owner.state.run.poiExpedition!.elites['lion-elite-valley-sentinel']!;
    elite.positionId='lion-poi-valley-serpent';elite.patrolIndex=1;
    const pending=owner.choosePoi('lion-poi-valley-bridge-cache');
    const saved=new SaveRepository().loadAuto()!;
    expect(saved.run.poiExpedition?.pendingStep?.step).toBe(1);
    expect(saved.run.poiExpedition?.elites['lion-elite-valley-sentinel']?.positionId).toBe('lion-poi-valley-serpent');
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=close]')!.click();await pending;
    new SaveRepository().saveAuto(saved);await owner.continueChronicle();
    const exp=owner.state.run.poiExpedition!;
    expect(root.querySelector('[role=dialog]')).toBeNull();expect(exp.turn).toBe(1);expect(exp.pendingStep).toBeUndefined();
    expect(exp.elites['lion-elite-valley-sentinel']!.positionId).toBe('lion-valmir-road');
    expect(owner.state.run.temporaryLoot.gold).toBe(35);expect(owner.state.run.temporaryLoot.inventory.consumables.potion).toBe(1);
    const before=structuredClone(owner.state);owner.showPoiMap();expect(owner.state).toEqual(before);app.dispose();
  });
  it('a saved combat-phase elite resumes its real bridge config without invoking the underlying node resolver',async()=>{
    const {app,owner}=fixture('lion-valmir-road');enterPoi(owner.state,'lion-poi-valley-bridge-cache');
    const encounter=owner.state.run.poiExpedition!.encounter!;commitPoiEliteFight(owner.state,encounter.id);new SaveRepository().saveAuto(owner.state);
    const canonical=vi.spyOn(owner,'resolveCombat');
    const start=vi.spyOn(owner.combat,'start').mockImplementation(({config})=>({ready:Promise.resolve(),result:Promise.resolve({combatId:config.id,victory:true,participants:[],unitHealth:{}})}));
    await owner.continueChronicle();expect(start.mock.calls[0]?.[0].config.id).toBe('poi_elite_valley_sentinel');expect(canonical).not.toHaveBeenCalled();
    expect(owner.state.run.temporaryLoot.gold).toBe(120);expect(owner.state.resolvedNodeIds).not.toContain('lion-poi-valley-bridge-cache');app.dispose();
  });
});
