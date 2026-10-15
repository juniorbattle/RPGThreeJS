// @vitest-environment happy-dom
import {afterEach,describe,expect,it} from 'vitest';
import {PoiEncounterView} from './PoiEncounterView';
afterEach(()=>document.body.replaceChildren());
describe('native elite/chest dialog agency',()=>{
  it('focuses safe retreat, traps keyboard, supports Escape and restores previous focus',async()=>{
    const root=document.createElement('div');document.body.append(root);
    const previous=document.createElement('button');root.append(previous);previous.focus();
    const view=new PoiEncounterView(root),choice=view.choose({title:'Sentinelle',description:'Combat ou repli'});
    expect(root.querySelector('[role=dialog]')?.getAttribute('aria-modal')).toBe('true');
    expect((document.activeElement as HTMLElement).dataset.poiDialogAction).toBe('retreat');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
    expect((document.activeElement as HTMLElement).dataset.poiDialogAction).toBe('fight');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    expect(await choice).toBe('retreat');expect(document.activeElement).toBe(previous);expect(previous.inert).toBe(false);
  });
  it('settles one native choice despite double activation and displays escaped owner-attributed reward text',async()=>{
    const root=document.createElement('div');document.body.append(root);const view=new PoiEncounterView(root);
    const choice=view.choose({title:'Menace',description:'Passage occupé'});
    const button=root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=fight]')!;button.click();button.click();
    expect(await choice).toBe('fight');expect(root.querySelector('[role=dialog]')).toBeNull();
    const reward=view.reward({title:'Coffre ouvert',description:'Butin temporaire',lines:['1 × <potion>']});
    expect(root.querySelector('li')?.textContent).toBe('1 × <potion>');expect(root.querySelector('potion')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-poi-dialog-action=close]')!.click();await reward;
  });
});
