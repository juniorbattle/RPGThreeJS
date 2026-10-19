import type { UiSoundFeedback } from './UiSoundPlayer';
export interface PoiDialogContent {title: string; description: string; lines?: string[]}

/** Accessible presentation only. Resolves native intentions; it never receives writable run state. */
export class PoiEncounterView {
  private element: HTMLElement|null=null;
  private release: (()=>void)|null=null;
  constructor(private readonly root: HTMLElement, private readonly onSound?: UiSoundFeedback) {}

  choose(content: PoiDialogContent): Promise<'fight'|'retreat'> {
    return this.open(content,[{id:'fight',label:'Combattre'},{id:'retreat',label:'Se replier'}],'retreat');
  }
  async reward(content: PoiDialogContent): Promise<void> {
    await this.open(content,[{id:'close',label:'Continuer'}],'close');
  }
  private open<T extends string>(content: PoiDialogContent, actions:{id:T;label:string}[], cancel:T): Promise<T> {
    this.close();
    const previous=document.activeElement as HTMLElement|null;
    const siblings=[...this.root.children].map(element=>({element:element as HTMLElement,inert:(element as HTMLElement).inert}));
    for(const sibling of siblings)sibling.element.inert=true;
    const backdrop=document.createElement('div');backdrop.className='poi-dialog-backdrop';
    const panel=document.createElement('section');panel.className='poi-dialog';
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-labelledby','poi-dialog-title');panel.setAttribute('aria-describedby','poi-dialog-description');
    const title=document.createElement('h2');title.id='poi-dialog-title';title.textContent=content.title;
    const description=document.createElement('p');description.id='poi-dialog-description';description.textContent=content.description;
    panel.append(title,description);
    if(content.lines?.length){const list=document.createElement('ul');for(const text of content.lines){const item=document.createElement('li');item.textContent=text;list.append(item);}panel.append(list);}
    const controls=document.createElement('div');controls.className='poi-dialog__actions';
    for(const action of actions){const button=document.createElement('button');button.type='button';button.dataset.poiDialogAction=action.id;button.textContent=action.label;controls.append(button);}
    panel.append(controls);backdrop.append(panel);this.root.append(backdrop);this.element=backdrop;
    const buttons=[...controls.querySelectorAll('button')];
    const finishFocus=()=>{for(const sibling of siblings)if(sibling.element.isConnected)sibling.element.inert=sibling.inert;
      if(previous?.isConnected&&!previous.closest('[inert]'))previous.focus({preventScroll:true});};
    return new Promise<T>(resolve=>{
      let completed=false;
      const finish=(id:T,native=false)=>{if(completed)return;completed=true;for(const button of buttons)button.disabled=true;
        if(native)this.onSound?.(id==='retreat'?'back':'confirm');
        this.release=null;backdrop.remove();this.element=null;finishFocus();resolve(id);};
      this.release=()=>finish(cancel);
      controls.addEventListener('click',event=>{const id=(event.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset.poiDialogAction as T|undefined;if(id)finish(id,true);});
      backdrop.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();finish(cancel,true);}
        if(event.key==='Tab'){event.preventDefault();const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
      });
      buttons.find(button=>button.dataset.poiDialogAction===cancel)?.focus();
    });
  }
  close():void {this.release?.();this.release=null;this.element?.remove();this.element=null;}
}
