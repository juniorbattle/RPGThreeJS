import type { PoiMapModel } from '../game/runSystem';
import { LION_POI_POSITIONS, LION_POI_REGIONS, LION_POI_REGION_EXITS, lionPoiMapPhase, lionPoiPathBends } from '../campaign/LionPoiMap';
import './poi-map.css';
import { onReducedMotionChange, prefersReducedMotion } from './ReducedMotion';

interface PoiMapOptions {
  root:HTMLElement;onMove:(id:string)=>Promise<void>;onBypass:(id:string)=>void;
  onCompany:()=>void;onSave:()=>void;onMenu:()=>void;onReducedMotion:()=>void;
  onWait?:()=>Promise<void>;onFightElite?:(id:string)=>Promise<void>;
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
  private finishTravel:(()=>void)|null=null;
  constructor(private readonly options:PoiMapOptions){}
  open(model:PoiMapModel,focusId=model.currentNodeId,reducedMotion=false):void {
    this.render(model,lionPoiMapPhase(model.currentNodeId),focusId,reducedMotion);
  }

  private render(model:PoiMapModel,phase:number,focusId:string,reducedMotion:boolean):void {
    this.close();this.selectedId=focusId;
    const current=model.nodes.find(n=>n.id===model.currentNodeId)!;
    const region=LION_POI_REGIONS[phase]!;
    // Reconstruct discovery from earned facts; no new save or presentation state.
    const reachedPhase=Math.max(lionPoiMapPhase(model.currentNodeId),...model.nodes.filter(n=>n.status==='resolved').map(n=>n.region));
    const discovered=LION_POI_REGIONS.map((r,i)=>({r,i})).filter(({i})=>i<=reachedPhase);
    const own=new Set(model.nodes.filter(n=>n.region===phase).map(n=>n.id));
    const nodes=model.nodes.filter(n=>own.has(n.id)||model.edges.some(e=>
      (own.has(e.from)&&e.to===n.id)||(own.has(e.to)&&e.from===n.id)));
    const positions=new Map(nodes.map(n=>[n.id,LION_POI_POSITIONS[n.id]??[850,300] as readonly[number,number]]));
    for(const n of nodes)if(n.region!==phase)positions.set(n.id,n.region<phase?[80,80]:LION_POI_REGION_EXITS[phase]!);
    const threats=model.threats.filter(threat=>threat.region===phase);
    const nodeLabel=(id:string)=>model.nodes.find(node=>node.id===id)?.label??id;
    const seen=new Set<string>();
    const paths=model.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)).map(e=>{
      const key=[e.from,e.to].sort().join(':');if(seen.has(key))return '';seen.add(key);
      const [x,y]=positions.get(e.from)!,[tx,ty]=positions.get(e.to)!;
      const bend=(Math.abs(ty-y)>100?1:-1)*Math.min(48,Math.abs(tx-x)*.22);
      const bends=lionPoiPathBends(e.from,e.to,phase);
      const d=bends?`M${x} ${y} ${bends.map(([px,py])=>`L${px} ${py}`).join(' ')} L${tx} ${ty}`
        :`M${x} ${y} C${x+(tx-x)*.35} ${y+bend} ${x+(tx-x)*.65} ${ty-bend} ${tx} ${ty}`;
      return `<path class="poi-path-shadow" d="${d}"/><path class="poi-path ${e.unlocked?'poi-path--open':''}" data-from="${escape(e.from)}" data-to="${escape(e.to)}" d="${d}"/>`;
    }).join('');
    const element=document.createElement('section');element.className='poi-map';
    element.dataset.region=String(phase);element.dataset.reducedMotion=String(reducedMotion);
    element.setAttribute('aria-label','Carte de campagne');
    element.innerHTML=`<header class="poi-map__header"><div class="poi-map__heading"><span>Carte de campagne</span><h1 id="poi-region-title">${region.shortTitle}</h1></div><p class="poi-map__resources">Or <b>${model.gold}</b><span>·</span> Butin <b>${model.temporaryGold}</b><span>·</span> Réputation <b>${model.reputation}</b></p><nav aria-label="Actions de campagne"><button data-poi-action="company">Compagnie</button><button data-poi-action="save">Sauvegarder</button><button data-poi-action="menu">Menu</button><button data-poi-action="motion" aria-pressed="${reducedMotion}">Mouvement réduit</button><button data-poi-action="wait">Attendre</button><button data-poi-action="help" aria-controls="poi-map-panel" aria-expanded="false">Aide</button></nav></header>
      <div class="poi-map__viewport">
      <div class="poi-map__atlas-bar">${discovered.length>1?`<div class="poi-map__regions" role="tablist" aria-label="Régions découvertes">${discovered.map(({r,i})=>`<button role="tab" id="poi-region-${i}" data-poi-region="${i}" aria-selected="${i===phase}" tabindex="${i===phase?0:-1}" aria-controls="poi-atlas">${r.shortTitle}</button>`).join('')}</div>`:''}<button data-poi-action="locate">Ma position</button></div>
      <div class="poi-map__land" id="poi-atlas" role="${discovered.length>1?'tabpanel':'region'}" aria-labelledby="${discovered.length>1?`poi-region-${phase}`:'poi-region-title'}" tabindex="0" aria-label="${escape(region.title)}. Carte défilante, glisser ou utiliser les flèches."><div class="poi-map__canvas"><img class="poi-map__geography" src="${region.image}" alt="" draggable="false"/><svg viewBox="0 0 960 520" aria-hidden="true">${paths}</svg>
      ${nodes.map(n=>{const [x,y]=positions.get(n.id)!;const threat=threats.find(threat=>threat.positionId===n.id);return `<button class="poi-marker poi-marker--${n.status} poi-marker--${n.role} poi-marker--${n.kind} ${n.id===model.currentNodeId?'poi-marker--current':''} ${n.region!==phase?'poi-marker--border':''} ${n.region>phase?'poi-marker--outbound':''} ${threat?'poi-marker--occupied':''}" data-poi-id="${escape(n.id)}" data-poi-reachable="${n.canMove}" style="left:${x/9.6}%;top:${y/5.2}%" aria-label="${escape(n.label)}, ${roleLabels[n.role]}, ${kindLabels[n.kind]}, ${participationLabels[n.participation]}, ${statusLabels[n.status]}${n.id===model.currentNodeId?', position actuelle':''}${n.reusable?', services réutilisables':''}${threat?', passage occupé par '+escape(threat.label):''}"><span class="poi-marker__icon" aria-hidden="true">${icons[n.kind]}</span><span class="poi-marker__name">${escape(n.label)}</span>${n.status==='resolved'?'<span class="poi-marker__check" aria-hidden="true">✓</span>':n.status==='neutralized'?'<span class="poi-marker__check poi-marker__check--neutral" aria-hidden="true">—</span>':''}${n.id===model.currentNodeId?'<span class="poi-marker__position">Vous êtes ici</span>':''}</button>`;}).join('')}
      ${threats.map(threat=>{const position=positions.get(threat.positionId);if(!position)return '';return `<span class="poi-threat" data-poi-elite-id="${escape(threat.id)}" style="left:${position[0]/9.6}%;top:${position[1]/5.2}%" aria-hidden="true">♜</span>`;}).join('')}</div></div>
      <div class="poi-map__map-caption"><span>${escape(region.title)} · Tour ${model.turn}</span></div></div>
      <footer class="poi-map__footer"><div class="poi-map__detail" aria-live="polite"></div></footer>
      <div class="poi-map__panel-backdrop" hidden><aside class="poi-map__panel" id="poi-map-panel" aria-labelledby="poi-panel-title" tabindex="-1"><header><h2 id="poi-panel-title">Repères de voyage</h2><button data-poi-action="close-panel" aria-label="Fermer les informations">Fermer</button></header><div class="poi-map__panel-detail"></div><section><h3>Explorer la carte</h3><p>Sélectionnez un lieu pour voir son état, puis choisissez « Se rendre ». Les chemins ouverts se parcourent dans les deux sens. Les lieux verrouillés conservent leurs conditions d’accès.</p><p>Glissez ou faites défiler la carte. Au clavier, les flèches passent entre les points d’intérêt ; Entrée sélectionne le lieu. « Ma position » recentre votre emplacement.</p><p>Les régions se découvrent en progressant. « Attendre » avance un tour sans déplacement ; les menaces mobiles peuvent alors se déplacer.</p></section><section class="poi-map__legend"><h3>Légende</h3><p><span>◆ Jalon</span> <span>◉ Structurant</span> <span>◇ Rencontre</span> <span>⚔ Combat</span> <span>▣ Coffre</span> <span>♜ Menace mobile</span> <span>⌂ Refuge</span></p><p>✓ Résolu · — Neutralisé</p></section></aside></div>`;
    this.options.root.append(element);this.element=element;
    const land=element.querySelector<HTMLElement>('.poi-map__land')!;
    const backdrop=element.querySelector<HTMLElement>('.poi-map__panel-backdrop')!;
    let panelOpener:HTMLElement|null=null;
    const closePanel=()=>{
      backdrop.hidden=true;
      const panel=backdrop.querySelector<HTMLElement>('.poi-map__panel')!;panel.removeAttribute('role');panel.removeAttribute('aria-modal');
      for(const child of [element.querySelector<HTMLElement>('.poi-map__header')!,element.querySelector<HTMLElement>('.poi-map__viewport')!,element.querySelector<HTMLElement>('.poi-map__footer')!])child.inert=false;
      element.querySelectorAll('[aria-controls="poi-map-panel"]').forEach(b=>b.setAttribute('aria-expanded','false'));
      if(panelOpener?.isConnected)panelOpener.focus({preventScroll:true});
    };
    const openPanel=(opener:HTMLElement)=>{
      panelOpener=opener;backdrop.hidden=false;
      const panel=backdrop.querySelector<HTMLElement>('.poi-map__panel')!;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
      for(const child of [element.querySelector<HTMLElement>('.poi-map__header')!,element.querySelector<HTMLElement>('.poi-map__viewport')!,element.querySelector<HTMLElement>('.poi-map__footer')!])child.inert=true;
      opener.setAttribute('aria-expanded','true');element.querySelector<HTMLButtonElement>('[data-poi-action="close-panel"]')!.focus();
    };
    const update=()=>{
      const n=model.nodes.find(n=>n.id===this.selectedId)??current;
      const canMove=n.canMove||(n.id===model.currentNodeId&&n.canActivate);
      element.querySelector('.poi-map__detail')!.innerHTML=`<div class="poi-map__selection"><h2>${escape(n.label)}</h2><p>${participationLabels[n.participation]} · ${statusLabels[n.status]}${n.id===model.currentNodeId?' · Vous êtes ici':''}${n.reusable?' · Refuge réutilisable':''}</p>${n.status==='locked'?`<p class="poi-map__lock-hint">${escape(n.hint??'')}</p>`:''}</div><div class="poi-map__detail-actions"><button data-poi-action="details" aria-controls="poi-map-panel" aria-expanded="false">Détails</button><button data-poi-action="move" ${canMove?'':'disabled'}>${n.id===model.currentNodeId?(n.reusable?'Ouvrir le refuge':'Ouvrir'):'Se rendre'}</button>${n.canBypass?'<button data-poi-action="bypass">Contourner</button>':''}</div>`;
      const threatBrief=threats.map(threat=>`<div class="poi-map__threat-brief" data-poi-threat="${escape(threat.id)}"><strong>♜ ${escape(threat.label)}${threat.contested?' · Passage contesté':''}</strong><p>${threat.mode==='cyclic_patrol'?'Patrouille':'Traque locale'} · ${escape(nodeLabel(threat.positionId))} → ${escape(nodeLabel(threat.nextPositionId))}</p></div>`).join('');
      element.querySelector('.poi-map__panel-detail')!.innerHTML=`<section><span class="poi-map__detail-role">${roleLabels[n.role]} · ${participationLabels[n.participation]}</span><h3>${escape(n.label)}</h3><p>${kindLabels[n.kind]} · ${statusLabels[n.status]}${n.reusable?' · Services réutilisables':''}</p><p>${escape(n.hint??'')}</p></section>${threatBrief}`;
      // Threat intent stays visible even with the optional explanations closed.
      if(threats.length)element.querySelector('.poi-map__detail')!.insertAdjacentHTML('beforeend',`<div class="poi-map__threat-summary">${threats.map(threat=>`<p><strong>♜ ${escape(threat.label)}${threat.contested?' · Passage contesté':''}</strong> · ${threat.mode==='cyclic_patrol'?'Patrouille':'Traque locale'} · ${escape(nodeLabel(threat.positionId))} → ${escape(nodeLabel(threat.nextPositionId))}${threat.canFight?` <button data-poi-action="elite-fight" data-elite-id="${escape(threat.id)}">Affronter la menace</button>`:''}</p>`).join('')}</div>`);
      element.querySelectorAll<HTMLButtonElement>('[data-poi-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poiId===n.id)));
    };
    const select=(id:string,scroll=false)=>{
      if(this.selectedId!==id){this.selectedId=id;update();}
      if(scroll)element.querySelector(`[data-poi-id="${CSS.escape(id)}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    };
    element.addEventListener('click',event=>{
      if(element.dataset.travelling==='true')return;
      const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
      if(button.dataset.poiId){select(button.dataset.poiId);return;}
      if(button.dataset.poiRegion!==undefined){const regionIndex=Number(button.dataset.poiRegion);
        const target=model.nodes.find(n=>n.region===regionIndex&&n.id===model.currentNodeId)??model.nodes.find(n=>n.region===regionIndex)!;
        this.render(model,regionIndex,target.id,reducedMotion);
        this.element?.querySelector<HTMLButtonElement>(`[data-poi-region="${regionIndex}"]`)?.focus();return;}
      switch(button.dataset.poiAction){
        case'help':case'details':openPanel(button);break;
        case'close-panel':closePanel();break;
        case'move':{const restoreFocus=document.activeElement===button;button.disabled=true;void this.options.onMove(this.selectedId).catch(()=>{
          if(this.element===element){const message=document.createElement('p');message.setAttribute('role','alert');
            message.textContent='Déplacement interrompu. Réessayez.';element.querySelector('.poi-map__detail')?.append(message);}
        }).finally(()=>{if(this.element===element){button.disabled=false;
          if(restoreFocus&&document.activeElement===document.body)button.focus();}});break;}
        case'bypass':this.options.onBypass(this.selectedId);break;
        case'company':this.options.onCompany();break;case'save':this.options.onSave();break;
        case'menu':this.options.onMenu();break;case'motion':this.options.onReducedMotion();break;
        case'wait':button.disabled=true;void this.options.onWait?.().finally(()=>{if(button.isConnected)button.disabled=false;});break;
        case'elite-fight':if(button.dataset.eliteId){button.disabled=true;void this.options.onFightElite?.(button.dataset.eliteId).finally(()=>{if(button.isConnected)button.disabled=false;});}break;
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
      if(!backdrop.hidden){
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePanel();}
        if(event.key==='Tab'){
          const controls=[...backdrop.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          const first=controls[0],last=controls.at(-1);
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        }
        return;
      }
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      const active=document.activeElement as HTMLElement;
      if(active.dataset.poiRegion!==undefined){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?reachedPhase:(phase+(event.key==='ArrowLeft'?-1:1)+discovered.length)%discovered.length;
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

  /** Animate only a movement already committed/saved by RunSystem via GameApp. */
  animateTravel(from:string,to:string):Promise<void>|undefined{
    this.finishTravel?.();
    const element=this.element;
    if(!element||from===to||document.hidden||prefersReducedMotion(element.dataset.reducedMotion==='true'))return;
    const path=[...element.querySelectorAll<SVGPathElement>('.poi-path')].find(p=>
      (p.dataset.from===from&&p.dataset.to===to)||(p.dataset.from===to&&p.dataset.to===from));
    if(!path||typeof path.getTotalLength!=='function')return;
    const length=path.getTotalLength(),reverse=path.dataset.from!==from;
    if(!Number.isFinite(length)||length<=0)return;
    const token=document.createElementNS('http://www.w3.org/2000/svg','circle');
    token.classList.add('poi-map__traveller');token.setAttribute('r','7');
    const origin=path.getPointAtLength(reverse?length:0);token.setAttribute('cx',String(origin.x));token.setAttribute('cy',String(origin.y));
    path.parentElement!.append(token);element.dataset.travelling='true';element.inert=true; // No reentrant map intent during the short handoff.
    return new Promise(resolve=>{
      let frame=0,start:number|undefined;
      const finish=()=>{cancelAnimationFrame(frame);clearTimeout(watchdog);unsubscribe();document.removeEventListener('visibilitychange',hidden);token.remove();delete element.dataset.travelling;element.inert=false;this.finishTravel=null;resolve();};
      const hidden=()=>{if(document.hidden)finish();};
      const unsubscribe=onReducedMotionChange(()=>{if(prefersReducedMotion())finish();});
      const watchdog=window.setTimeout(finish,900);
      document.addEventListener('visibilitychange',hidden);
      this.finishTravel=finish;
      const step=(time:number)=>{
        start??=time;
        if(this.element!==element||prefersReducedMotion(element.dataset.reducedMotion==='true')){finish();return;}
        const progress=Math.min(1,(time-start)/620),eased=progress*progress*(3-2*progress);
        const p=path.getPointAtLength(length*(reverse?1-eased:eased));
        token.setAttribute('cx',String(p.x));token.setAttribute('cy',String(p.y));
        if(progress===1)finish();else frame=requestAnimationFrame(step);
      };
      frame=requestAnimationFrame(step);
    });
  }
  close():void {this.finishTravel?.();this.element?.remove();this.element=null;}
}
