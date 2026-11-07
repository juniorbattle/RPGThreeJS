// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {nextStorySteps,PoiMapView,poiMarkerState,suggestedPoi} from './PoiMapView';
import {createInitialState} from '../game/store';
import type {GameState} from '../game/types';
import {selectPoiMap, type PoiMapModel} from '../game/runSystem';

afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();vi.unstubAllGlobals();});
function fixture(onMove=vi.fn(async(_id:string)=>{}),prepare=(model:PoiMapModel)=>{void model;},onSound=vi.fn()){
  const root=document.createElement('div');document.body.append(root);
  const state=createInitialState(),model=selectPoiMap(state),before=structuredClone(state);
  prepare(model);
  const view=new PoiMapView({root,onMove,onBypass:vi.fn(),onCompany:vi.fn(),onSave:vi.fn(),onMenu:vi.fn(),onSound});
  view.open(model);return {view,model,state,before,onMove,onSound,root};
}
const marker=(id:string)=>document.querySelector<HTMLButtonElement>(`[data-poi-id="${id}"]`)!;
const action=()=>document.querySelector<HTMLButtonElement>('[data-poi-action="move"]')!;
describe('POI atlas focus and authority intentions',()=>{
  it('keeps programmatic focus silent and emits one cue for a changed pointer selection',()=>{
    const {onSound,onMove,state,before}=fixture();
    marker('lion-audience').focus();expect(onSound).not.toHaveBeenCalled();
    const camp=marker('lion-camp');camp.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse'}));camp.focus();camp.click();
    expect(onSound).toHaveBeenCalledExactlyOnceWith('navigate');camp.click();expect(onSound).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
  });
  it('keeps a distinct noninteractive player pawn at the actual POI while selecting another destination',()=>{
    const {state,before,model}=fixture();
    const pawn=document.querySelector<SVGGElement>('.poi-map__pawn')!;
    expect(pawn.dataset.node).toBe(model.currentNodeId);expect(pawn.closest('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(pawn.getAttribute('tabindex')).toBeNull();expect(pawn.querySelector('button')).toBeNull();
    const position=pawn.getAttribute('transform');marker('lion-audience').focus();
    expect(pawn.getAttribute('transform')).toBe(position);expect(pawn.dataset.node).toBe(model.currentNodeId);expect(state).toEqual(before);
  });
  it('emphasizes only selected legal adjacent paths while preserving remote and locked connections',()=>{
    const {onMove,state,before}=fixture();
    const all=[...document.querySelectorAll<SVGPathElement>('.poi-path')];expect(all.length).toBeGreaterThan(4);
    marker('lion-audience').focus();
    const selected=document.querySelector<SVGPathElement>('.poi-path--selected')!;
    expect([selected.dataset.from,selected.dataset.to].sort()).toEqual(['lion-audience','lion-camp']);
    expect(selected.classList.contains('poi-path--adjacent')).toBe(true);
    marker('lion-opening-ambush').focus();expect(document.querySelector('.poi-path--selected')).toBeNull();
    expect(document.querySelectorAll('.poi-path')).toHaveLength(all.length);expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
  });
  it('does not display a pawn at an off-region exit when browsing a previously earned region',()=>{
    fixture(undefined,model=>{model.currentNodeId='lion-reserve-trail';});
    expect(document.querySelector<SVGGElement>('.poi-map__pawn')!.dataset.node).toBe('lion-reserve-trail');
    document.querySelector<HTMLButtonElement>('[data-poi-region="0"]')!.click();expect(document.querySelector('.poi-map__pawn')).toBeNull();
  });
  it('offers no Wait and shows no turn count (set 1.18.0)',()=>{
    fixture();
    expect(document.querySelector('[data-poi-action="wait"]')).toBeNull();
    expect(document.querySelector('.poi-map__map-caption')!.textContent).not.toMatch(/Tour/);
    expect(document.querySelector('.poi-map__panel')!.textContent).not.toContain('Attendre');
  });
  it('states a challenge place with its condition and prime, in text and on the marker',()=>{
    fixture(undefined,model=>{const node=model.nodes.find(node=>node.id==='lion-audience')!;node.challenge={condition:'3 héros au plus',prime:'2 gemmes rouges'};});
    marker('lion-audience').focus();
    expect(marker('lion-audience').querySelector('.poi-marker__challenge')!.textContent).toBe('Défi');
    expect(marker('lion-audience').getAttribute('aria-label')).toContain('défi : 3 héros au plus, prime 2 gemmes rouges');
    expect(document.querySelector('.poi-map__challenge')!.textContent).toContain('3 héros au plus · Prime : 2 gemmes rouges');
  });
  it('keeps the committed destination and focused action intact while hovering another point',async()=>{
    const {onMove,state,before}=fixture();marker('lion-audience').focus();
    const selectedAction=action();selectedAction.focus();
    marker('lion-opening-ambush').dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
    expect(action()).toBe(selectedAction);expect(document.activeElement).toBe(selectedAction);
    expect(marker('lion-opening-ambush').title).toContain('Étape structurante');
    selectedAction.click();await Promise.resolve();
    expect(onMove).toHaveBeenCalledExactlyOnceWith('lion-audience');expect(state).toEqual(before);
  });
  it('updates detail and destination from native marker focus, preserving mandatory labels and remote locks',()=>{
    const {onMove,state,before}=fixture();marker('lion-opening-ambush').focus();
    expect(document.querySelector('.poi-map__detail')!.textContent).toContain('Étape de l’histoire · Fermé');
    expect(marker('lion-opening-ambush').getAttribute('aria-label')).toContain('Fermé');
    expect(action().disabled).toBe(true);action().click();expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
  });
  it('browses only earned regions through roving tabs without moving or unlocking campaign content',()=>{
    const {onMove,state,before}=fixture(undefined,model=>{model.nodes.find(n=>n.id==='lion-witnesses')!.status='resolved';});
    const tab=document.querySelector<HTMLButtonElement>('[data-poi-region="0"]')!;tab.focus();
    tab.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));
    expect(document.querySelector('.poi-map')!.getAttribute('data-region')).toBe('2');
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('2');
    expect([...document.querySelectorAll<HTMLElement>('[role="tab"]')].filter(t=>t.tabIndex===0)).toHaveLength(1);
    marker('lion-final-judgement').focus();expect(action().disabled).toBe(true);
    action().click();expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
    marker('lion-final-judgement').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    expect(document.querySelector('.poi-map')!.getAttribute('data-region')).toBe('0');expect(document.activeElement).toBe(marker('lion-camp'));
  });
  it('retains region-tab focus after pointer selection and supports Home/Left/Right',()=>{
    fixture(undefined,model=>{model.nodes.find(n=>n.id==='lion-reserve-trail')!.status='resolved';});document.querySelector<HTMLButtonElement>('[data-poi-region="1"]')!.click();
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('1');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('0');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('1');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('0');
  });
  it('does not reveal future regions even when their border POIs exist in the model',()=>{
    const {state,before,model}=fixture();
    expect(model.nodes.some(n=>n.region===2)).toBe(true);
    expect(document.querySelector('[role="tablist"]')).toBeNull();
    expect(document.querySelector('[data-poi-region="1"]')).toBeNull();
    expect(document.querySelector('[data-poi-region="2"]')).toBeNull();
    expect(state).toEqual(before);
  });
  it('discovers the current region without requiring its first content to be resolved',()=>{
    fixture(undefined,model=>{model.currentNodeId='lion-reserve-trail';});
    expect(document.querySelector('[data-poi-region="1"]')).not.toBeNull();
    expect(document.querySelector('[data-poi-region="2"]')).toBeNull();
    document.querySelector<HTMLElement>('[data-poi-region="1"]')!.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));
    expect(document.querySelector('.poi-map')!.getAttribute('data-region')).toBe('1');
  });
  it('opens optional help with modal focus, traps Tab and restores the opener with Escape without any intention',()=>{
    const {state,before,onMove}=fixture();
    const help=document.querySelector<HTMLButtonElement>('[data-poi-action="help"]')!;
    const backdrop=document.querySelector<HTMLElement>('.poi-map__panel-backdrop')!;
    expect(backdrop.hidden).toBe(true);help.focus();help.click();
    expect(backdrop.hidden).toBe(false);expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector<HTMLElement>('.poi-map__viewport')!.inert).toBe(true);
    const close=document.querySelector<HTMLElement>('[data-poi-action="close-panel"]')!;
    expect(document.activeElement).toBe(close);
    const tab=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});close.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);expect(document.activeElement).toBe(close);
    close.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    expect(backdrop.hidden).toBe(true);expect(document.activeElement).toBe(help);
    expect(help.getAttribute('aria-expanded')).toBe('false');expect(state).toEqual(before);expect(onMove).not.toHaveBeenCalled();
  });
  it('opens selected details on demand without replacing or losing the selected move control',()=>{
    const {onMove}=fixture();marker('lion-audience').focus();const move=action();
    const details=document.querySelector<HTMLButtonElement>('[data-poi-action="details"]')!;details.click();
    expect(document.querySelector('.poi-map__panel-detail')!.textContent).toContain('Audience');
    document.querySelector<HTMLButtonElement>('[data-poi-action="close-panel"]')!.click();
    expect(document.activeElement).toBe(details);expect(action()).toBe(move);expect(onMove).not.toHaveBeenCalled();
  });
  it('names a guardian, its post, challenge and available fight outside optional explanations (set 1.18.0)',()=>{
    fixture(undefined,model=>{model.threats=[{id:'test-threat',label:'Sentinelle',region:0,positionId:'lion-audience',canFight:true,challenge:{condition:'3 héros au plus',prime:'2 gemmes rouges'}}];});
    const summary=document.querySelector('.poi-map__threat-summary')!;
    expect(summary.textContent).toContain('Sentinelle');expect(summary.textContent).toContain('garde « Audience');
    expect(summary.textContent).toContain('Défi : 3 héros au plus · Prime : 2 gemmes rouges');
    expect(summary.textContent).not.toMatch(/Patrouille|Traque|contesté|→/);
    expect(summary.querySelector('[data-poi-action="elite-fight"]')!.textContent).toBe('Affronter le gardien');
    expect(marker('lion-audience').getAttribute('aria-label')).toContain('gardé par Sentinelle');
    expect(document.querySelector<HTMLElement>('.poi-map__panel-backdrop')!.hidden).toBe(true);
  });
  it('skips travel for unchanged/front-intercept position and for the game reduced-motion setting',()=>{
    const {view,model,onMove,state,before}=fixture();
    expect(view.animateTravel('lion-camp','lion-camp')).toBeUndefined();
    view.open(model,model.currentNodeId,true);
    expect(view.animateTravel('lion-camp','lion-audience')).toBeUndefined();
    expect(document.querySelector('.poi-map__traveller')).toBeNull();expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
  });
  it('honors OS-only reduction even with the game setting false',()=>{
    vi.stubGlobal('matchMedia',()=>({matches:true}));const {view}=fixture();
    expect(view.animateTravel('lion-camp','lion-audience')).toBeUndefined();
    expect(document.querySelector('.poi-map__traveller')).toBeNull();
  });
  it.each([false,true])('moves only the art token along the existing path and settles cleanly (reverse=%s)',async reverse=>{
    const {view,state,before,onMove}=fixture();
    const path=document.querySelector<SVGPathElement>('.poi-path[data-from="lion-camp"][data-to="lion-audience"]')!;
    Object.defineProperty(path,'getTotalLength',{value:()=>100});
    Object.defineProperty(path,'getPointAtLength',{value:(distance:number)=>({x:distance,y:20})});
    let step!:(time:number)=>void;vi.stubGlobal('requestAnimationFrame',(callback:(time:number)=>void)=>{step=callback;return 1;});vi.stubGlobal('cancelAnimationFrame',vi.fn());
    const pending=view.animateTravel(reverse?'lion-audience':'lion-camp',reverse?'lion-camp':'lion-audience');
    expect(document.querySelector<HTMLElement>('.poi-map')!.inert).toBe(true);
    step(0);expect(document.querySelector('.poi-map__traveller')!.getAttribute('data-x')).toBe(reverse?'100':'0');
    step(1500);await pending;expect(document.querySelector('.poi-map__traveller')).toBeNull();
    expect(document.querySelector<SVGGElement>('.poi-map__pawn')!.dataset.node).toBe(reverse?'lion-camp':'lion-audience');
    expect(document.querySelector<HTMLElement>('.poi-map')!.inert).toBe(false);expect(state).toEqual(before);expect(onMove).not.toHaveBeenCalled();view.close();
  });
  it('settles an in-flight animation on close without leaving a callback or transient state behind',async()=>{
    const {view}=fixture();const path=document.querySelector<SVGPathElement>('.poi-path[data-from="lion-camp"]')!;
    Object.defineProperty(path,'getTotalLength',{value:()=>100});Object.defineProperty(path,'getPointAtLength',{value:()=>({x:0,y:0})});
    const pending=view.animateTravel('lion-camp','lion-audience');expect(pending).toBeInstanceOf(Promise);view.close();await pending;
    expect(document.querySelector('.poi-map')).toBeNull();
  });
  it('restores an action rejected by its owner without a second mutation or abandoned disabled button',async()=>{
    const onMove=vi.fn(async()=>{throw new Error('Rejected owner intent fixture');});fixture(onMove);
    marker('lion-audience').focus();const selectedAction=action();selectedAction.focus();selectedAction.click();expect(selectedAction.disabled).toBe(true);
    selectedAction.blur(); // Browser disabling may release keyboard focus to BODY.
    await vi.waitFor(()=>expect(selectedAction.disabled).toBe(false));expect(onMove).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(selectedAction);
    expect(document.querySelector('[role="alert"]')!.textContent).toContain('Réessayez');
  });
});

/** The operator's 2026-11-03 run: the first refuge secured, the merchant helped, the refugees left behind. */
function afterFirstRefuge(at:string):GameState{
  const state=createInitialState();
  state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads','lion-poi-opening-supplies','lion-poi-opening-cache','lion-first-trial-event','lion-first-refuge'];
  Object.assign(state.flags,{lionMissionAccepted:true,ignoredRefugees:true,'refugeSecured:lion-first-refuge':true,'clanArrival:lion-first-refuge':true});
  state.run.bypassedRouteNodeIds=['lion-refugees'];state.run.traversalBranches={T0:'lion-first-trial-event'};
  state.run.currentNodeId=state.currentNodeId=at;return state;
}
describe('POI atlas guidance',()=>{
  it('selects the next step without moving anyone: the audience at the start, the road out once the refuge is left',()=>{
    expect(suggestedPoi(selectPoiMap(createInitialState()))).toBe('lion-audience');
    // After the audience the camp is reachable again but has nothing left to open: the ambush road comes first.
    const afterAudience=createInitialState();afterAudience.resolvedNodeIds=['lion-audience'];afterAudience.flags.lionMissionAccepted=true;
    afterAudience.run.currentNodeId=afterAudience.currentNodeId='lion-audience';
    expect(suggestedPoi(selectPoiMap(afterAudience))).toBe('lion-opening-ambush');
    expect(suggestedPoi(selectPoiMap(afterFirstRefuge('lion-first-refuge')))).toBe('lion-reserve-trail');
    // From a point already behind the company, the way back to the refuge comes before the refugees left aside.
    expect(suggestedPoi(selectPoiMap(afterFirstRefuge('lion-first-trial-combat')))).toBe('lion-first-refuge');
  });
  it('opens on that step with its action ready, names the region it leads to and keeps the refuge reopenable',()=>{
    const root=document.createElement('div');document.body.append(root);
    const state=afterFirstRefuge('lion-first-refuge'),model=selectPoiMap(state),before=structuredClone(state);
    new PoiMapView({root,onMove:vi.fn(async()=>{}),onBypass:vi.fn(),onCompany:vi.fn(),onSave:vi.fn(),onMenu:vi.fn()}).open(model);
    expect(marker('lion-reserve-trail').getAttribute('aria-pressed')).toBe('true');
    expect(action().disabled).toBe(false);expect(action().textContent).toBe('Se rendre');
    expect(marker('lion-reserve-trail').textContent).toContain('Vers II · Bois-Clair');
    marker('lion-first-refuge').focus();expect(action().textContent).toBe('Ouvrir le refuge');
    expect(state).toEqual(before);
  });
  it('dims only the points the company cannot reach from where it stands',()=>{
    fixture();
    expect(marker('lion-camp').classList.contains('poi-marker--far')).toBe(false);
    expect(marker('lion-audience').classList.contains('poi-marker--far')).toBe(false);
    expect(marker('lion-opening-ambush').classList.contains('poi-marker--far')).toBe(true);
    expect(marker('lion-first-refuge').classList.contains('poi-marker--far')).toBe(true);
  });
  it('shows the company leader as the pawn and turns them along the road while travelling',async()=>{
    const {view}=fixture(undefined,model=>{model.currentNodeId='lion-audience';});
    const pawn=document.querySelector<SVGGElement>('.poi-map__pawn')!;
    expect(pawn.querySelector('image')!.getAttribute('href')).toContain('alistair');
    const path=document.querySelector<SVGPathElement>('.poi-path[data-from=lion-camp][data-to=lion-audience]')!;
    Object.defineProperty(path,'getTotalLength',{value:()=>100});
    Object.defineProperty(path,'getPointAtLength',{value:(distance:number)=>({x:distance,y:20})});
    const pending=view.animateTravel('lion-audience','lion-camp');
    expect(pawn.querySelector('.poi-map__pawn-figure')!.getAttribute('transform')).toBe('scale(-1 1)');
    view.close();await pending;
  });
});

describe('a readable map (OD-2026-11-07-A)',()=>{
  it('reads each point in one of four states and marks the next story step with a banner',()=>{
    const {model,state,before}=fixture();
    const camp=model.nodes.find(n=>n.id==='lion-camp')!,ambush=model.nodes.find(n=>n.id==='lion-opening-ambush')!;
    expect(poiMarkerState(camp,model.currentNodeId)).toBe('todo');
    expect(poiMarkerState(ambush,model.currentNodeId)).toBe('closed');
    expect(marker('lion-opening-ambush').dataset.poiState).toBe('closed');
    const steps=nextStorySteps(model);
    expect(steps.length).toBeGreaterThan(0);
    for(const next of steps){
      expect(marker(next).classList.contains('poi-marker--next')).toBe(true);
      expect(marker(next).querySelector('.poi-marker__next')?.textContent).toBe('Prochaine étape');
      expect(marker(next).getAttribute('aria-label')).toContain('prochaine étape');
    }
    expect(document.querySelectorAll('.poi-marker--next')).toHaveLength(steps.length);
    expect(state).toEqual(before);
  });
  it('keeps permanent names for the position, the reachable points and the next step only; the rest show on focus',()=>{
    const {model}=fixture();
    for(const n of model.nodes.filter(node=>node.region===0)){
      const named=n.id===model.currentNodeId||n.canMove||nextStorySteps(model).includes(n.id);
      expect(marker(n.id).classList.contains('poi-marker--named'),n.id).toBe(named);
      // The name stays in the accessible label either way.
      expect(marker(n.id).getAttribute('aria-label')).toContain(n.label);
    }
  });
  it('states type, path and state in plain words, with risk and reward for a point still to do, and keeps a visible legend',()=>{
    fixture();
    marker('lion-audience').focus();
    const detail=document.querySelector('.poi-map__detail')!.textContent!;
    expect(detail).toContain('Jalon · Étape de l’histoire · À faire');
    expect(detail).toMatch(/Risque [◆◇]{3} · Gain [◆◇]{3}/);
    expect(detail).not.toContain('Alternative exclusive');
    const legend=document.querySelector<HTMLDetailsElement>('.poi-map__legend-box')!;
    // Open on a wide screen; folded on a narrow one, where it would cover the top of the map.
    expect(legend.open).toBe(window.innerWidth>1050);
    expect(legend.textContent).toContain('Prochaine étape');
    expect(legend.textContent).toContain('✠ Élite');
    expect(legend.textContent).toContain('Gardien d’un coffre');expect(legend.textContent).toContain('Défi');
    expect(legend.closest('.poi-map__atlas-bar')).not.toBeNull();
    expect(document.querySelector('.poi-map__panel')!.textContent).not.toContain('◉');
  });
});

describe('the next step at a fork (OD-2026-11-07-A)',()=>{
  it('marks both branches of an exclusive choice, so the banner never leans toward one',()=>{
    const state=createInitialState();
    state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads'];
    state.flags.lionMissionAccepted=true;
    state.run.currentNodeId=state.currentNodeId='lion-nomad-crossroads';
    const model=selectPoiMap(state);
    const steps=nextStorySteps(model).sort();
    expect(steps).toEqual(['lion-first-trial-combat','lion-first-trial-event']);
    const root=document.createElement('div');document.body.append(root);
    new PoiMapView({root,onMove:vi.fn(async()=>{}),onBypass:vi.fn(),onCompany:vi.fn(),onSave:vi.fn(),onMenu:vi.fn()}).open(model);
    expect([...root.querySelectorAll<HTMLElement>('.poi-marker--next')].map(m=>m.dataset.poiId).sort()).toEqual(steps);
  });
});

describe('the branch commitment on the map (set 1.17.0)',()=>{
  it('states the commitment and its target with text, focusable, and explains why other places are closed',()=>{
    const state=createInitialState();
    state.resolvedNodeIds=['lion-audience','lion-opening-ambush','lion-nomad-crossroads','lion-first-trial-event'];
    state.flags.lionMissionAccepted=true;state.run.traversalBranches={T0:'lion-first-trial-event'};
    state.run.currentNodeId=state.currentNodeId='lion-first-trial-event';
    const model=selectPoiMap(state);
    expect(model.commitment?.resolvingNodeId).toBe('lion-first-refuge');
    const root=document.createElement('div');document.body.append(root);
    new PoiMapView({root,onMove:vi.fn(async()=>{}),onBypass:vi.fn(),onCompany:vi.fn(),onSave:vi.fn(),onMenu:vi.fn()}).open(model);
    const banner=root.querySelector<HTMLElement>('.poi-map__commitment')!;
    expect(banner.textContent).toBe('Engagé : jusqu’à « Refuge du Lion » · Retour, voyage et lieux annexes reprendront ensuite.');
    expect(banner.tabIndex).toBe(0);
    marker('lion-nomad-crossroads').focus();
    expect(root.querySelector('.poi-map__detail')!.textContent).toContain('Fermé pendant l’engagement');
    expect(action().disabled).toBe(true);
    marker('lion-first-refuge').focus();
    expect(action().disabled).toBe(false);
  });
  it('shows no banner when nothing is committed',()=>{
    fixture();
    expect(document.querySelector('.poi-map__commitment')).toBeNull();
  });
});
