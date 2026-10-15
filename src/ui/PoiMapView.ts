import type { PoiMapModel } from '../game/runSystem';
import { LION_POI_POSITIONS, LION_POI_REGIONS, lionPoiMapPhase } from '../campaign/LionPoiMap';
import './poi-map.css';

interface PoiMapOptions {
  root:HTMLElement;onMove:(id:string)=>Promise<void>;onBypass:(id:string)=>void;
  onCompany:()=>void;onSave:()=>void;onMenu:()=>void;onReducedMotion:()=>void;
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const statusLabels={available:'Disponible',locked:'Verrouillé',resolved:'Résolu',neutralized:'Neutralisé'};
const kindLabels={primary:'Jalon',mystery:'Rencontre',combat:'Combat',elite:'Élite',chest:'Coffre',refuge:'Refuge'};
const roleLabels={primary:'Jalon principal',structuring:'Étape structurante',secondary:'Point secondaire'};
const participationLabels={required:'Requis',optional:'Facultatif',alternative:'Alternative exclusive'};
const icons={primary:'◆',mystery:'◇',combat:'⚔',elite:'♜',chest:'▣',refuge:'⌂'};

/** Geographical atlas and native intentions only; no writable campaign state. */
export class PoiMapView {
  private element:HTMLElement|null=null;
  private selectedId='';
  constructor(private readonly options:PoiMapOptions){}
  open(model:PoiMapModel,focusId=model.currentNodeId,reducedMotion=false):void {
    this.render(model,lionPoiMapPhase(model.currentNodeId),focusId,reducedMotion);
  }

  private render(model:PoiMapModel,phase:number,focusId:string,reducedMotion:boolean):void {
    this.close();this.selectedId=focusId;
    const current=model.nodes.find(n=>n.id===model.currentNodeId)!;
    const region=LION_POI_REGIONS[phase]!;
    const own=new Set(model.nodes.filter(n=>n.region===phase).map(n=>n.id));
    const nodes=model.nodes.filter(n=>own.has(n.id)||model.edges.some(e=>
      (own.has(e.from)&&e.to===n.id)||(own.has(e.to)&&e.from===n.id)));
    const positions=new Map(nodes.map(n=>[n.id,LION_POI_POSITIONS[n.id]??[850,300] as readonly[number,number]]));
    for(const n of nodes)if(n.region!==phase)positions.set(n.id,n.region<phase?[80,80]:[870,475]);
    const seen=new Set<string>();
    const paths=model.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)).map(e=>{
      const key=[e.from,e.to].sort().join(':');if(seen.has(key))return '';seen.add(key);
      const [x,y]=positions.get(e.from)!,[tx,ty]=positions.get(e.to)!;
      const bend=(Math.abs(ty-y)>100?1:-1)*Math.min(48,Math.abs(tx-x)*.22);
      const d=`M${x} ${y} C${x+(tx-x)*.35} ${y+bend} ${x+(tx-x)*.65} ${ty-bend} ${tx} ${ty}`;
      return `<path class="poi-path-shadow" d="${d}"/><path class="poi-path ${e.unlocked?'poi-path--open':''}" d="${d}"/>`;
    }).join('');
    const element=document.createElement('section');element.className='poi-map';
    element.dataset.region=String(phase);element.dataset.reducedMotion=String(reducedMotion);
    element.setAttribute('aria-label','Carte de campagne');
    element.innerHTML=`<header class="poi-map__header"><div class="poi-map__heading"><span>Chronique du Lion</span><h1>Carte de campagne</h1></div><p class="poi-map__resources">Or <b>${model.gold}</b><span>·</span> Butin <b>${model.temporaryGold}</b><span>·</span> Réputation <b>${model.reputation}</b></p><nav aria-label="Actions de campagne"><button data-poi-action="company">Compagnie</button><button data-poi-action="save">Sauvegarder</button><button data-poi-action="menu">Menu</button><button data-poi-action="motion" aria-pressed="${reducedMotion}">Mouvement réduit</button></nav></header>
      <div class="poi-map__atlas-bar"><div class="poi-map__regions" role="tablist" aria-label="Régions de campagne">${LION_POI_REGIONS.map((r,i)=>`<button role="tab" id="poi-region-${i}" data-poi-region="${i}" aria-selected="${i===phase}" tabindex="${i===phase?0:-1}" aria-controls="poi-atlas">${r.shortTitle}</button>`).join('')}</div><button data-poi-action="locate">Ma position</button></div>
      <div class="poi-map__land" id="poi-atlas" role="tabpanel" aria-labelledby="poi-region-${phase}" tabindex="0" aria-label="${escape(region.title)}. Carte défilante, glisser ou utiliser les flèches."><div class="poi-map__canvas"><img class="poi-map__geography" src="${region.image}" alt="" draggable="false"/><svg viewBox="0 0 960 520" aria-hidden="true">${paths}</svg>
      ${nodes.map(n=>{const [x,y]=positions.get(n.id)!;return `<button class="poi-marker poi-marker--${n.status} poi-marker--${n.role} poi-marker--${n.kind} ${n.id===model.currentNodeId?'poi-marker--current':''} ${n.region!==phase?'poi-marker--border':''}" data-poi-id="${escape(n.id)}" data-poi-reachable="${n.canMove}" style="left:${x/9.6}%;top:${y/5.2}%" aria-label="${escape(n.label)}, ${roleLabels[n.role]}, ${kindLabels[n.kind]}, ${participationLabels[n.participation]}, ${statusLabels[n.status]}${n.id===model.currentNodeId?', position actuelle':''}${n.reusable?', services réutilisables':''}"><span class="poi-marker__icon" aria-hidden="true">${icons[n.kind]}</span><span class="poi-marker__name">${escape(n.label)}</span>${n.status==='resolved'?'<span class="poi-marker__check" aria-hidden="true">✓</span>':n.status==='neutralized'?'<span class="poi-marker__check poi-marker__check--neutral" aria-hidden="true">—</span>':''}${n.id===model.currentNodeId?'<span class="poi-marker__position">Vous êtes ici</span>':''}</button>`;}).join('')}</div></div>
      <div class="poi-map__map-caption"><span>${escape(region.title)}</span><span>Glisser ou défiler pour explorer · Flèches : points d’intérêt</span></div>
      <footer class="poi-map__footer"><div class="poi-map__detail" aria-live="polite"></div><div class="poi-map__legend"><p><span>◆ Jalon</span> <span>◉ Structurant</span> <span>◇ Rencontre</span> <span>⚔ Combat</span> <span>♜ Élite</span> <span>⌂ Refuge</span></p><p>✓ Résolu · — Neutralisé<br>Les chemins ouverts se parcourent dans les deux sens.</p></div></footer>`;
    this.options.root.append(element);this.element=element;
    const land=element.querySelector<HTMLElement>('.poi-map__land')!;
    const update=()=>{
      const n=model.nodes.find(n=>n.id===this.selectedId)??current;
      const canMove=n.canMove||(n.id===model.currentNodeId&&n.canActivate);
      element.querySelector('.poi-map__detail')!.innerHTML=`<div><span class="poi-map__detail-role">${roleLabels[n.role]} · ${participationLabels[n.participation]}</span><h2>${escape(n.label)}</h2><p>${kindLabels[n.kind]} · ${statusLabels[n.status]}${n.id===model.currentNodeId?' · Position actuelle':''}${n.reusable?' · Services réutilisables':''}</p><p>${escape(n.hint??'')}</p>${n.kind==='elite'?'<strong class="poi-map__danger">Combat d’élite · Préparez votre compagnie.</strong>':''}</div><div class="poi-map__detail-actions"><button data-poi-action="move" ${canMove?'':'disabled'}>${n.id===model.currentNodeId?(n.reusable?'Ouvrir le refuge':'Ouvrir'):'Se rendre'}</button>${n.canBypass?'<button data-poi-action="bypass">Contourner</button>':''}</div>`;
      element.querySelectorAll<HTMLButtonElement>('[data-poi-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poiId===n.id)));
    };
    const select=(id:string,scroll=false)=>{
      if(this.selectedId!==id){this.selectedId=id;update();}
      if(scroll)element.querySelector(`[data-poi-id="${CSS.escape(id)}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    };
    element.addEventListener('click',event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
      if(button.dataset.poiId){select(button.dataset.poiId);return;}
      if(button.dataset.poiRegion!==undefined){const regionIndex=Number(button.dataset.poiRegion);
        const target=model.nodes.find(n=>n.region===regionIndex&&n.id===model.currentNodeId)??model.nodes.find(n=>n.region===regionIndex)!;
        this.render(model,regionIndex,target.id,reducedMotion);
        this.element?.querySelector<HTMLButtonElement>(`[data-poi-region="${regionIndex}"]`)?.focus();return;}
      switch(button.dataset.poiAction){
        case'move':{const restoreFocus=document.activeElement===button;button.disabled=true;void this.options.onMove(this.selectedId).catch(()=>{
          if(this.element===element){const message=document.createElement('p');message.setAttribute('role','alert');
            message.textContent='Déplacement interrompu. Réessayez.';element.querySelector('.poi-map__detail')?.append(message);}
        }).finally(()=>{if(this.element===element){button.disabled=false;
          if(restoreFocus&&document.activeElement===document.body)button.focus();}});break;}
        case'bypass':this.options.onBypass(this.selectedId);break;
        case'company':this.options.onCompany();break;case'save':this.options.onSave();break;
        case'menu':this.options.onMenu();break;case'motion':this.options.onReducedMotion();break;
        case'locate':this.render(model,lionPoiMapPhase(model.currentNodeId),model.currentNodeId,reducedMotion);break;
      }
    });
    element.addEventListener('focusin',event=>{const id=(event.target as HTMLElement).dataset.poiId;if(id)select(id,true);});
    // Native hover tooltips preview detail without changing selection or removing focused actions.
    for(const marker of element.querySelectorAll<HTMLElement>('[data-poi-id]')) {
      const n=model.nodes.find(n=>n.id===marker.dataset.poiId)!;
      marker.title=`${n.label} · ${roleLabels[n.role]} · ${statusLabels[n.status]}\n${n.hint??''}`;
    }
    element.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      const active=document.activeElement as HTMLElement;
      if(active.dataset.poiRegion!==undefined){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(phase+(event.key==='ArrowLeft'?-1:1)+3)%3;
        this.render(model,next,model.nodes.find(n=>n.region===next)!.id,reducedMotion);
        this.element?.querySelector<HTMLButtonElement>(`[data-poi-region="${next}"]`)?.focus();return;}
      const id=active.dataset.poiId;if(!id)return;event.preventDefault();
      if(event.key==='Home'&&lionPoiMapPhase(model.currentNodeId)!==phase){
        this.render(model,lionPoiMapPhase(model.currentNodeId),model.currentNodeId,reducedMotion);return;}
      const [x,y]=positions.get(id)!;
      const candidates=nodes.filter(n=>n.id!==id).map(n=>{const [nx,ny]=positions.get(n.id)!;const dx=nx-x,dy=ny-y;
        const forward=event.key==='ArrowLeft'?-dx:event.key==='ArrowRight'?dx:event.key==='ArrowUp'?-dy:dy;
        return {id:n.id,forward,score:Math.hypot(dx,dy)+Math.abs(event.key==='ArrowLeft'||event.key==='ArrowRight'?dy:dx)*1.5};
      }).filter(n=>n.forward>0).sort((a,b)=>a.score-b.score);
      const next=event.key==='Home'?model.currentNodeId:event.key==='End'?nodes.filter(n=>n.region===phase).at(-1)?.id:candidates[0]?.id;
      if(next)element.querySelector<HTMLButtonElement>(`[data-poi-id="${CSS.escape(next)}"]`)?.focus();
    });
    let drag:{x:number;y:number;left:number;top:number;id:number}|null=null;
    land.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||event.button!==0||(event.target as Element).closest('button'))return;
      drag={x:event.clientX,y:event.clientY,left:land.scrollLeft,top:land.scrollTop,id:event.pointerId};
      land.setPointerCapture(event.pointerId);land.classList.add('poi-map__land--dragging');event.preventDefault();
    });
    land.addEventListener('pointermove',event=>{if(drag){land.scrollLeft=drag.left+drag.x-event.clientX;land.scrollTop=drag.top+drag.y-event.clientY;}});
    const end=()=>{drag=null;land.classList.remove('poi-map__land--dragging');};
    land.addEventListener('pointerup',end);land.addEventListener('pointercancel',end);land.addEventListener('lostpointercapture',end);
    update();const focus=element.querySelector<HTMLButtonElement>(`[data-poi-id="${CSS.escape(focusId)}"]`);
    focus?.focus({preventScroll:true});focus?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
  }
  close():void {this.element?.remove();this.element=null;}
}
