// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {PoiMapView} from './PoiMapView';
import {createInitialState} from '../game/store';
import {selectPoiMap} from '../game/runSystem';

afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();});
function fixture(onMove=vi.fn(async(_id:string)=>{})){
  const root=document.createElement('div');document.body.append(root);
  const state=createInitialState(),model=selectPoiMap(state),before=structuredClone(state);
  const view=new PoiMapView({root,onMove,onBypass:vi.fn(),onCompany:vi.fn(),onSave:vi.fn(),onMenu:vi.fn(),onReducedMotion:vi.fn()});
  view.open(model);return {view,model,state,before,onMove,root};
}
const marker=(id:string)=>document.querySelector<HTMLButtonElement>(`[data-poi-id="${id}"]`)!;
const action=()=>document.querySelector<HTMLButtonElement>('[data-poi-action="move"]')!;
describe('POI atlas focus and authority intentions',()=>{
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
    expect(document.querySelector('.poi-map__detail')!.textContent).toContain('Étape structurante · Requis');
    expect(marker('lion-opening-ambush').getAttribute('aria-label')).toContain('Verrouillé');
    expect(action().disabled).toBe(true);action().click();expect(onMove).not.toHaveBeenCalled();expect(state).toEqual(before);
  });
  it('browses three regions through roving tabs without moving or unlocking campaign content',()=>{
    const {onMove,state,before}=fixture();
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
    fixture();document.querySelector<HTMLButtonElement>('[data-poi-region="1"]')!.click();
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('1');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('0');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('1');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiRegion).toBe('0');
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
