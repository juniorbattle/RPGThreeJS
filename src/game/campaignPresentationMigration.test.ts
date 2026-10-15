// @vitest-environment happy-dom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {GameApp} from './GameApp';
import {createInitialState,SaveRepository} from './store';
import {getAvailableRunNodes} from './runSystem';
import type {GameState,RunNode} from './types';
import type {JourneyBoundaryOutcome,JourneyBoundaryRequest} from '../journey/JourneyCampaignBoundary';
import {sceneTransition} from '../ui/SceneTransition';

function deferred<T>(){let resolve!:(value:T)=>void,reject!:(error:Error)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
interface Owner {
  state:GameState;mode:string;journeyUnavailable:boolean;journeyBoundary:unknown;saves:SaveRepository;
  enterCampaignPresentation():Promise<void>;runJourneyBoundary():Promise<void>;
  commitRunNodeChoice(id:string):Promise<boolean>;choosePoi(id:string):Promise<void>;
  resolveRunNode(node:RunNode,initial:boolean):Promise<void>;
}
const apps:GameApp[]=[];
function fixture(preparation=false){
  const root=document.createElement('div');document.body.append(root);
  const app=new GameApp(root,document.createElement('canvas'));apps.push(app);
  const owner=app as unknown as Owner;owner.state=createInitialState();owner.mode='NARRATIVE';
  if(preparation){owner.state.run.currentNodeId=owner.state.currentNodeId='lion-final-refuge';owner.state.resolvedNodeIds.push('lion-final-refuge');}
  const outcome=deferred<JourneyBoundaryOutcome>(),ready=deferred<void>();
  const boundary={present:vi.fn((_request:JourneyBoundaryRequest)=>outcome.promise),waitUntilSurfaceReady:vi.fn(()=>ready.promise),dispose:vi.fn()};
  owner.journeyBoundary=boundary;return {app,owner,boundary,outcome,ready};
}
const aborted={kind:'aborted',id:null} as JourneyBoundaryOutcome;
describe('POI campaign presentation lifecycle after physical retirement',()=>{
  beforeEach(()=>{vi.useFakeTimers();vi.spyOn(console,'error').mockImplementation(()=>{});vi.spyOn(console,'warn').mockImplementation(()=>{});});
  afterEach(()=>{for(const app of apps.splice(0))app.dispose();vi.useRealTimers();vi.restoreAllMocks();document.body.replaceChildren();document.body.className='';delete document.body.dataset.campaignSurface;localStorage.clear();});
  it('keeps final preparation under cover until Journey is ready without committing or changing campaign truth',async()=>{
    const {owner,boundary,outcome,ready}=fixture(true),before=structuredClone(owner.state);
    const save=vi.spyOn(owner.saves,'saveAuto'),resolve=vi.spyOn(owner,'resolveRunNode').mockResolvedValue();
    const completion=owner.enterCampaignPresentation();
    await vi.advanceTimersByTimeAsync(440);expect(boundary.present).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20);expect(boundary.present).not.toHaveBeenCalled();
    document.querySelector('.scene-transition')!.dispatchEvent(new Event('transitionend'));
    await vi.advanceTimersByTimeAsync(0);expect(boundary.present).toHaveBeenCalledOnce();
    expect(sceneTransition.isActive).toBe(true);expect(document.body.classList.contains('scene-transition--locked')).toBe(true);
    expect(boundary.present.mock.calls[0]![0].available).toEqual(getAvailableRunNodes(owner.state));
    expect(boundary.present.mock.calls[0]![0].presentationOnly).toEqual({eyebrow:'Préparation',title:'Avant le jugement',continueLabel:'Carte de campagne'});
    expect(owner.state).toEqual(before);expect(resolve).not.toHaveBeenCalled();expect(save).toHaveBeenCalledOnce();
    ready.resolve();await vi.runAllTimersAsync();expect(sceneTransition.isActive).toBe(false);
    outcome.resolve(aborted);await completion;expect(owner.state).toEqual(before);
  });
  it('retains one authoritative guarded Journey commit and releases its mutex before resolution',async()=>{
    const {owner,boundary,outcome}=fixture(),available=getAvailableRunNodes(owner.state),steps=owner.state.stepCounter;
    const resolve=vi.spyOn(owner,'resolveRunNode').mockImplementation(async()=>{
      expect((owner as unknown as {routeCommitInFlight:boolean}).routeCommitInFlight).toBe(false);
      // A duplicate, stale selection must already be rejected when resolution begins.
      expect(await owner.commitRunNodeChoice(available[0]!.id)).toBe(false);
    });
    const completion=owner.runJourneyBoundary();
    expect(boundary.present.mock.calls[0]![0].available).toEqual(available);
    outcome.resolve({kind:'node',id:available[0]!.id} as JourneyBoundaryOutcome);await completion;
    expect(owner.state.run.currentNodeId).toBe(available[0]!.id);expect(owner.state.stepCounter).toBe(steps+1);
    expect(resolve).toHaveBeenCalledOnce();expect(await owner.commitRunNodeChoice(available[0]!.id)).toBe(false);
    expect(owner.state.stepCounter).toBe(steps+1);
  });
  it.each(['before-ready','after-ready'] as const)('recovers %s Journey failure to POI after releasing the cover and never recurses',async timing=>{
    const {owner,boundary,outcome,ready}=fixture(true),before=structuredClone(owner.state);
    const completion=owner.enterCampaignPresentation();await vi.advanceTimersByTimeAsync(460);
    document.querySelector('.scene-transition')!.dispatchEvent(new Event('transitionend'));
    await vi.advanceTimersByTimeAsync(0);expect(boundary.present).toHaveBeenCalledOnce();
    if(timing==='after-ready'){ready.resolve();await vi.runAllTimersAsync();}
    outcome.reject(new Error('Explicit presentation failure fixture'));await vi.runAllTimersAsync();await completion;
    expect(sceneTransition.isActive).toBe(false);expect(document.body.classList.contains('scene-transition--locked')).toBe(false);
    expect(owner.journeyUnavailable).toBe(true);expect(owner.mode).toBe('TRAVEL');
    expect(document.querySelectorAll('.poi-map')).toHaveLength(1);expect(document.querySelector('.travel-view,.traversal-road')).toBeNull();
    expect(owner.state).toEqual(before);await owner.enterCampaignPresentation();
    expect(boundary.present).toHaveBeenCalledOnce();expect(document.querySelectorAll('.poi-map')).toHaveLength(1);
  });
  it('resolves an accepted map intention once then returns and backtracks without replaying effects',async()=>{
    const {owner}=fixture();owner.mode='TRAVEL';
    const resolve=vi.spyOn(owner,'resolveRunNode').mockImplementation(async node=>{
      // Explicit lifecycle fixture; actual native combat has separate production evidence.
      owner.state.resolvedNodeIds.push(node.id);await owner.enterCampaignPresentation();
    });
    const steps=owner.state.stepCounter;await owner.choosePoi('lion-audience');
    expect(resolve).toHaveBeenCalledOnce();expect(owner.state.stepCounter).toBe(steps+1);
    expect(document.querySelector('.poi-map')).not.toBeNull();const before=structuredClone(owner.state);
    await owner.choosePoi('lion-audience');await owner.choosePoi('lion-camp');await owner.choosePoi('lion-audience');
    expect(resolve).toHaveBeenCalledOnce();expect(owner.state).toEqual(before);
  });
});
