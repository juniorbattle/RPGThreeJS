import type { PoiMapModel } from '../game/runSystem';
import { LION_POI_POSITIONS, lionPoiMapPhase } from '../campaign/LionPoiMap';
import './poi-map.css';

interface PoiMapOptions {
  root: HTMLElement;
  onMove: (id: string) => Promise<void>;
  onBypass: (id: string) => void;
  onCompany: () => void;
  onSave: () => void;
  onMenu: () => void;
  onReducedMotion: () => void;
}
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const statusLabels = {available:'Disponible', locked:'Verrouillé', resolved:'Résolu', neutralized:'Neutralisé'};
const kindLabels = {primary:'Jalon', mystery:'Rencontre', combat:'Combat', elite:'Élite', chest:'Coffre', refuge:'Refuge'};

/** Display and native intentions only; never receives a writable GameState. */
export class PoiMapView {
  private element: HTMLElement | null = null;
  private selectedId = '';
  constructor(private readonly options: PoiMapOptions) {}

  open(model: PoiMapModel, focusId = model.currentNodeId, reducedMotion = false): void {
    this.close();
    this.selectedId = focusId;
    const current = model.nodes.find(n => n.id === model.currentNodeId)!;
    const phase = lionPoiMapPhase(current.depth);
    const nodes = model.nodes.filter(n => lionPoiMapPhase(n.depth) === phase
      || model.edges.some(e => (e.from === current.id && e.to === n.id) || (e.to === current.id && e.from === n.id)));
    const positions = new Map(nodes.map(n => [n.id, LION_POI_POSITIONS[n.id] ?? [850,300]]));
    // Border anchors for adjacent phases, without inventing campaign locations.
    for(const n of nodes) if(lionPoiMapPhase(n.depth)!==phase) positions.set(n.id, n.depth<current.depth?[90,80]:[870,80]);
    const paths = model.edges.filter(e => positions.has(e.from) && positions.has(e.to)).map(e => {
      const [x,y]=positions.get(e.from)!; const [tx,ty]=positions.get(e.to)!;
      return `<path class="poi-path ${e.unlocked?'poi-path--open':''}" d="M${x} ${y} Q${(x+tx)/2} ${y-30} ${tx} ${ty}"/>`;
    }).join('');
    const trees = Array.from({length:42},(_,i)=>{
      const x=40+(i*137)%880,y=65+(i*83)%405;
      return `<g transform="translate(${x},${y})"><path d="M0 14v16" stroke="#243c34" stroke-width="5"/><path d="M-15 17L0-17 15 17Z" fill="#314d39"/><path d="M-10 2L0-23 10 2Z" fill="#486244"/></g>`;
    }).join('');
    const element=document.createElement('section'); element.className='poi-map';
    element.setAttribute('aria-label','Carte de campagne');
    element.innerHTML=`<header class="poi-map__header"><div><span>Chronique du Lion</span><h1>Carte de campagne</h1></div><p>Or ${model.gold} · Butin ${model.temporaryGold} · Réputation ${model.reputation}</p><nav aria-label="Actions de campagne"><button data-poi-action="company">Compagnie</button><button data-poi-action="save">Sauvegarder</button><button data-poi-action="menu">Menu</button></nav></header>
      <div class="poi-map__land"><div class="poi-map__canvas"><svg viewBox="0 0 960 520" aria-hidden="true"><defs><pattern id="poi-grain" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1h2M4 5h2" stroke="#92a076" stroke-opacity=".12"/></pattern></defs><rect width="960" height="520" fill="#506b50"/><path d="M0 110Q250 10 550 95T960 80V0H0Z" fill="#6e7757"/><path d="M0 440Q190 490 400 450T960 430V520H0Z" fill="#3c5944"/><path d="M820 0Q690 100 780 210T900 520" fill="none" stroke="#709092" stroke-width="32"/><path d="M830 0Q710 100 790 210T910 520" fill="none" stroke="#aec1b2" stroke-opacity=".3" stroke-width="5"/><rect width="960" height="520" fill="url(#poi-grain)"/>${trees}${paths}</svg>
      ${nodes.map(n=>{const [x,y]=positions.get(n.id)!;return `<button class="poi-marker poi-marker--${n.status} ${n.id===model.currentNodeId?'poi-marker--current':''}" data-poi-id="${escape(n.id)}" data-poi-reachable="${n.canMove}" style="left:${x/9.6}%;top:${y/5.2}%" aria-label="${escape(n.label)}, ${kindLabels[n.kind]}, ${statusLabels[n.status]}${n.reusable?', refuge réutilisable':''}"><span class="poi-marker__icon">${escape(n.icon)}</span><span class="poi-marker__name">${escape(n.label)}</span>${n.status==='resolved'?'<span class="poi-marker__check" aria-hidden="true">✓</span>':''}</button>`;}).join('')}</div></div>
      <footer class="poi-map__footer"><div class="poi-map__detail" aria-live="polite"></div><p class="poi-map__legend">◇ Rencontre · ⚔ Combat · ⌂ Refuge · ✓ Résolu<br>Les chemins ouverts se parcourent dans les deux sens.</p></footer>`;
    this.options.root.append(element); this.element=element;
    const motion=document.createElement('button');motion.type='button';motion.dataset.poiAction='motion';
    motion.textContent='Mouvement réduit';motion.setAttribute('aria-pressed',String(reducedMotion));
    element.querySelector('nav')!.append(motion);
    const update=()=>{
      const n=model.nodes.find(n=>n.id===this.selectedId)??current;
      const canMove=n.canMove || (n.id===model.currentNodeId && n.canActivate);
      element.querySelector('.poi-map__detail')!.innerHTML=`<h2>${escape(n.label)}</h2><p>${kindLabels[n.kind]} · ${statusLabels[n.status]}${n.id===model.currentNodeId?' · Position actuelle':''}${n.reusable?' · Services réutilisables':''}</p><p>${escape(n.hint??'')}</p><div><button data-poi-action="move" ${canMove?'':'disabled'}>${n.id===model.currentNodeId?(n.reusable?'Ouvrir le refuge':'Ouvrir'):'Se rendre'}</button>${n.canBypass?'<button data-poi-action="bypass">Contourner</button>':''}</div>`;
      element.querySelectorAll<HTMLButtonElement>('[data-poi-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poiId===n.id)));
    };
    element.addEventListener('click',event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('button'); if(!button||button.disabled)return;
      if(button.dataset.poiId){this.selectedId=button.dataset.poiId;update();return;}
      switch(button.dataset.poiAction){
        case'move':button.disabled=true;void this.options.onMove(this.selectedId);break;
        case'bypass':this.options.onBypass(this.selectedId);break;
        case'company':this.options.onCompany();break;
        case'save':this.options.onSave();break;
        case'menu':this.options.onMenu();break;
        case'motion':this.options.onReducedMotion();break;
      }
    });
    element.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
      const buttons=[...element.querySelectorAll<HTMLButtonElement>('[data-poi-id]')];
      const index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;
      event.preventDefault(); const next=buttons[(index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+buttons.length)%buttons.length]!;
      next.focus();this.selectedId=next.dataset.poiId!;update();
    });
    update();element.querySelector<HTMLButtonElement>(`[data-poi-id="${CSS.escape(focusId)}"]`)?.focus();
  }
  close(): void {this.element?.remove();this.element=null;}
}
