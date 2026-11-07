import type { PoiMapModel } from '../game/runSystem';
import { ratingScale, runNodePresentation } from './RunNodePresentation';
import { resolvePixelSheet } from '../combat/pixel/PixelSpriteSheets';
import { LION_POI_POSITIONS, LION_POI_REGIONS, LION_POI_REGION_EXITS, lionPoiMapPhase, lionPoiPathBends } from '../campaign/LionPoiMap';
import './poi-map.css';
import { onReducedMotionChange, prefersReducedMotion } from './ReducedMotion';
import type { UiSoundFeedback } from './UiSoundPlayer';

interface PoiMapOptions {
  root:HTMLElement;onMove:(id:string)=>Promise<void>;onBypass:(id:string)=>void;
  onCompany:()=>void;onSave:()=>void;onMenu:()=>void;
  onWait?:()=>Promise<void>;onFightElite?:(id:string)=>Promise<void>;
  /** The game's single settings menu (OD-2026-11-05-B). */onSettings?:()=>void;onSound?:UiSoundFeedback;
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const statusLabels={available:'À faire',locked:'Fermé',resolved:'Fait',neutralized:'Écarté'};
const kindLabels={primary:'Jalon',mystery:'Rencontre',combat:'Combat',elite:'Élite',chest:'Coffre',refuge:'Refuge'};
const roleLabels={primary:'Jalon principal',structuring:'Étape structurante',secondary:'Point secondaire'};
const participationLabels={required:'Étape de l’histoire',optional:'Facultatif',alternative:'Au choix, une seule branche'};
const icons={primary:'◆',mystery:'◇',combat:'⚔',elite:'✠',chest:'▣',refuge:'⌂'};

type PoiNode=PoiMapModel['nodes'][number];
/** How a point reads at a glance (OD-2026-11-07-A): to do within reach, to do further on, done, or not open yet. */
export function poiMarkerState(node:PoiNode,currentId:string):'todo'|'far'|'done'|'closed'{
  if(node.status==='locked')return 'closed';
  if(node.status==='resolved'||node.status==='neutralized')return 'done';
  return node.canMove||node.id===currentId?'todo':'far';
}

/**
 * The story's next step: the nearest required points still to do, reached over open roads. Every branch of an exclusive
 * choice at that distance is marked, so the banner never leans toward one of them. Presentation only.
 */
export function nextStorySteps(model:PoiMapModel):string[]{
  const byId=new Map(model.nodes.map(n=>[n.id,n]));
  const todo=(id:string)=>{const n=byId.get(id);return n?.status==='available'&&n.participation!=='optional';};
  if(todo(model.currentNodeId))return [model.currentNodeId];
  let frontier=[model.currentNodeId];const seen=new Set(frontier);
  while(frontier.length){
    const next:string[]=[];
    for(const id of frontier)for(const edge of model.edges){
      const other=!edge.unlocked?undefined:edge.from===id?edge.to:edge.to===id?edge.from:undefined;
      if(other&&!seen.has(other)){seen.add(other);next.push(other);}
    }
    const found=next.filter(todo);
    if(found.length)return found;
    frontier=next;
  }
  return [];
}

/**
 * Where the map's selection starts: the current point while it still has something to open; otherwise the step the
 * company would most likely take next: a reachable point the story still needs, leaving the region before turning
 * back, and among equals a point with something to open before one already emptied, such as the camp after the audience;
 * then the first step on the open roads towards the nearest required point still to do; then an optional point
 * within reach. Selection only: nothing moves until the player confirms.
 */
export function suggestedPoi(model:PoiMapModel):string{
  const current=model.nodes.find(n=>n.id===model.currentNodeId);
  if(!current||(current.status==='available'&&current.canActivate))return model.currentNodeId;
  const rank=(n:PoiMapModel['nodes'][number])=>(n.participation==='required'?0:2)+(n.region>current.region?0:1);
  const within=model.nodes.filter(n=>n.canMove&&n.status==='available').sort((a,b)=>rank(a)-rank(b)||Number(b.canActivate)-Number(a.canActivate));
  const needed=within.find(n=>n.participation!=='optional');
  if(needed)return needed.id;
  const byId=new Map(model.nodes.map(n=>[n.id,n])),firstStep=new Map<string,string>();
  const queue=model.nodes.filter(n=>n.canMove).map(n=>{firstStep.set(n.id,n.id);return n.id;});
  for(const id of queue){
    const node=byId.get(id);
    if(node?.status==='available'&&node.participation==='required')return firstStep.get(id)!;
    for(const edge of model.edges){
      const other=!edge.unlocked?undefined:edge.from===id?edge.to:edge.to===id?edge.from:undefined;
      if(other&&other!==model.currentNodeId&&!firstStep.has(other)){firstStep.set(other,firstStep.get(id)!);queue.push(other);}
    }
  }
  return within[0]?.id??model.currentNodeId;
}

/** The company's leader stands on the atlas as a small figure on a gilded base: the pawn reads as this company. */
const LEADER=resolvePixelSheet('alistair');
const PAWN_SCALE=0.5;
function pawnFigure():string{
  if(!LEADER)return `<circle cx="0" cy="-30" r="6"/><path d="M-5 -23 Q-9 -19 -5 -14 L-8 -6 L8 -6 L5 -14 Q9 -19 5 -23 Z"/>`;
  const [cellWidth,cellHeight]=LEADER.cell,bounds=LEADER.idleBoundsPx,column=Math.max(0,LEADER.cells.indexOf('idle'));
  const width=(bounds.right-bounds.left)*PAWN_SCALE,height=(bounds.bottom-bounds.top)*PAWN_SCALE;
  return `<svg class="poi-map__pawn-sprite" x="${-width/2}" y="${-height+1}" width="${width}" height="${height}" viewBox="${column*cellWidth+bounds.left} ${bounds.top} ${bounds.right-bounds.left} ${bounds.bottom-bounds.top}" preserveAspectRatio="xMidYMax meet"><image href="${LEADER.file}" width="${cellWidth*LEADER.cells.length}" height="${cellHeight}"/></svg>`;
}

/** Geographical atlas and native intentions only; no writable campaign state. */
export class PoiMapView {
  private element:HTMLElement|null=null;
  private selectedId='';
  private finishTravel:(()=>void)|null=null;
  constructor(private readonly options:PoiMapOptions){}
  open(model:PoiMapModel,focusId=suggestedPoi(model),reducedMotion=false):void {
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
    const nextSteps=new Set(nextStorySteps(model));
    const nodeLabel=(id:string)=>model.nodes.find(node=>node.id===id)?.label??id;
    const seen=new Set<string>();
    const paths=model.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)).map(e=>{
      const key=[e.from,e.to].sort().join(':');if(seen.has(key))return '';seen.add(key);
      const [x,y]=positions.get(e.from)!,[tx,ty]=positions.get(e.to)!;
      const bend=(Math.abs(ty-y)>100?1:-1)*Math.min(48,Math.abs(tx-x)*.22);
      const bends=lionPoiPathBends(e.from,e.to,phase);
      const d=bends?`M${x} ${y} ${bends.map(([px,py])=>`L${px} ${py}`).join(' ')} L${tx} ${ty}`
        :`M${x} ${y} C${x+(tx-x)*.35} ${y+bend} ${x+(tx-x)*.65} ${ty-bend} ${tx} ${ty}`;
      const neighbor=e.from===model.currentNodeId?e.to:e.to===model.currentNodeId?e.from:undefined;
      const adjacent=e.unlocked&&model.nodes.some(n=>n.id===neighbor&&n.canMove);
      return `<path class="poi-path-shadow ${e.unlocked?'poi-path-shadow--open':''}" d="${d}"/><path class="poi-path ${e.unlocked?'poi-path--open':''} ${adjacent?'poi-path--adjacent':''}" data-from="${escape(e.from)}" data-to="${escape(e.to)}" d="${d}"/>`;
    }).join('');
    const element=document.createElement('section');element.className='poi-map';
    element.dataset.region=String(phase);element.dataset.reducedMotion=String(reducedMotion);
    element.setAttribute('aria-label','Carte de campagne');
    element.innerHTML=`<header class="poi-map__header"><div class="poi-map__heading"><span>Carte de campagne</span><h1 id="poi-region-title">${region.shortTitle}</h1></div><p class="poi-map__resources">Or <b>${model.gold}</b><span>·</span> Réputation <b>${model.reputation}</b></p><nav aria-label="Actions de campagne" data-gamepad-menu data-gamepad-back="[data-poi-id][aria-pressed=true]">${this.options.onSettings?'<button data-poi-action="settings">Réglages</button>':''}<button data-poi-action="company">Compagnie</button><button data-poi-action="save">Sauvegarder</button><button data-poi-action="menu">Menu</button><button data-poi-action="wait" aria-label="Attendre un tour sans déplacement. Les menaces actives peuvent avancer." title="Avance un tour sans déplacement ; les menaces actives peuvent avancer. Ne soigne pas la compagnie.">Attendre<span class="poi-map__wait-note">1 tour sur place</span></button><button data-poi-action="help" aria-controls="poi-map-panel" aria-expanded="false">Aide</button></nav></header>
      <div class="poi-map__viewport">
      <div class="poi-map__atlas-bar">${discovered.length>1?`<div class="poi-map__regions" role="tablist" aria-label="Régions découvertes">${discovered.map(({r,i})=>`<button role="tab" id="poi-region-${i}" data-poi-region="${i}" aria-selected="${i===phase}" tabindex="${i===phase?0:-1}" aria-controls="poi-atlas">${r.shortTitle}</button>`).join('')}</div>`:''}<details class="poi-map__legend-box"${window.innerWidth>1050?' open':''}><summary>Légende</summary><ul><li><span class="poi-legend__mark poi-legend__mark--todo" aria-hidden="true">◇</span>À faire, à portée</li><li><span class="poi-legend__mark poi-legend__mark--next" aria-hidden="true">⚑</span>Prochaine étape</li><li><span class="poi-legend__mark poi-legend__mark--done" aria-hidden="true">✓</span>Fait</li><li><span class="poi-legend__mark poi-legend__mark--closed" aria-hidden="true"></span>Pas encore ouvert</li><li><span class="poi-legend__mark poi-legend__mark--threat" aria-hidden="true">♜</span>Menace mobile</li><li class="poi-legend__kinds">✠ Élite</li></ul></details><button data-poi-action="locate">Ma position</button></div>
      <div class="poi-map__land" id="poi-atlas" role="${discovered.length>1?'tabpanel':'region'}" aria-labelledby="${discovered.length>1?`poi-region-${phase}`:'poi-region-title'}" tabindex="0" aria-label="${escape(region.title)}. Carte défilante, glisser ou utiliser les flèches."><div class="poi-map__canvas"><img class="poi-map__geography" src="${region.image}" alt="" draggable="false"/><svg viewBox="0 0 960 520" aria-hidden="true">${paths}</svg>
      ${nodes.map(n=>{const [x,y]=positions.get(n.id)!;const threat=threats.find(threat=>threat.positionId===n.id);const state=poiMarkerState(n,model.currentNodeId);const isNext=nextSteps.has(n.id);const named=n.id===model.currentNodeId||n.canMove||isNext||n.region!==phase;return `<button class="poi-marker poi-marker--${n.status} poi-marker--${n.role} poi-marker--${n.kind} ${n.id===model.currentNodeId?'poi-marker--current':''} ${named?'poi-marker--named':''} ${isNext?'poi-marker--next':''} ${n.region!==phase?'poi-marker--border':''} ${n.region>phase?'poi-marker--outbound':''} ${threat?'poi-marker--occupied':''} ${n.canMove||n.canTravel||n.id===model.currentNodeId?'':'poi-marker--far'}" data-poi-state="${state}" data-poi-id="${escape(n.id)}" data-poi-reachable="${n.canMove}" data-gamepad-confirm="[data-poi-action=move],[data-poi-action=details]" style="left:${x/9.6}%;top:${y/5.2}%" aria-label="${escape(n.label)}, ${roleLabels[n.role]}, ${kindLabels[n.kind]}, ${participationLabels[n.participation]}, ${statusLabels[n.status]}${n.id===model.currentNodeId?', position actuelle':''}${isNext?', prochaine étape':''}${n.reusable?', services réutilisables':''}${n.canTravel?', voyage rapide en 1 tour':''}${threat?', passage occupé par '+escape(threat.label):''}${n.region>phase?', vers '+escape(LION_POI_REGIONS[n.region]!.shortTitle):''}">${isNext?'<span class="poi-marker__next" aria-hidden="true">Prochaine étape</span>':''}<span class="poi-marker__icon" aria-hidden="true">${icons[n.kind]}</span><span class="poi-marker__name">${escape(n.label)}${n.region>phase?`<small class="poi-marker__toward">Vers ${escape(LION_POI_REGIONS[n.region]!.shortTitle)}</small>`:''}</span>${n.status==='resolved'?'<span class="poi-marker__check" aria-hidden="true">✓</span>':n.status==='neutralized'?'<span class="poi-marker__check poi-marker__check--neutral" aria-hidden="true">—</span>':''}</button>`;}).join('')}
      ${threats.map(threat=>{const position=positions.get(threat.positionId);if(!position)return '';return `<span class="poi-threat" data-poi-elite-id="${escape(threat.id)}" style="left:${position[0]/9.6}%;top:${position[1]/5.2}%" aria-hidden="true">♜</span>`;}).join('')}
      <svg class="poi-map__party-layer" viewBox="0 0 960 520" aria-hidden="true">${current.region===phase?(()=>{const [x,y]=positions.get(current.id)!;return `<g class="poi-map__pawn" data-node="${escape(current.id)}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})"><g class="poi-map__pawn-piece" transform="translate(0 1)"><ellipse class="poi-map__pawn-shadow" cx="1" cy="1" rx="15" ry="4.5"/><ellipse class="poi-map__pawn-base" cx="0" cy="0" rx="12" ry="3.6"/><g class="poi-map__pawn-figure">${pawnFigure()}</g></g></g>`;})():''}</svg></div></div>
      <div class="poi-map__map-caption"><span>${escape(region.title)} · Tour ${model.turn}</span></div>
</div>
      <footer class="poi-map__footer"><div class="poi-map__detail" aria-live="polite"></div></footer>
      <div class="poi-map__panel-backdrop" hidden><aside class="poi-map__panel" id="poi-map-panel" aria-labelledby="poi-panel-title" tabindex="-1"><header><h2 id="poi-panel-title">Repères de voyage</h2><button data-poi-action="close-panel" aria-label="Fermer les informations">Fermer</button></header><div class="poi-map__panel-detail"></div><section><h3>Explorer la carte</h3><p>Sélectionnez un lieu pour voir son état, puis choisissez « Se rendre ». Les chemins ouverts se parcourent dans les deux sens. Les lieux verrouillés conservent leurs conditions d’accès.</p><p>Glissez ou faites défiler la carte. Au clavier, les flèches passent entre les points d’intérêt ; Entrée sélectionne le lieu. « Ma position » recentre votre emplacement.</p><p>Les régions se découvrent en progressant. « Attendre » avance un tour sans déplacement ; les menaces actives peuvent alors avancer. Cela ne soigne pas la compagnie.</p></section><section><h3>Or et sauvegardes</h3><p>L’or et les objets gagnés sont utilisables immédiatement. En cas de défaite, la dernière sauvegarde de cette partie est rechargée : seuls les changements non sauvegardés sont annulés.</p></section><section class="poi-map__legend"><h3>Légende</h3><p><span>◆ Jalon</span> <span>◇ Rencontre</span> <span>⚔ Combat</span> <span>✠ Élite</span> <span>▣ Coffre</span> <span>⌂ Refuge</span> <span>♜ Menace mobile</span></p><p>Anneau doré : à faire, à portée · ⚑ Prochaine étape · ✓ Fait · — Écarté (autre branche) · petit point : pas encore ouvert</p></section></aside></div>`;
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
      const canMove=n.canMove||(n.id===model.currentNodeId&&n.canActivate)||n.canTravel;
      element.querySelector('.poi-map__detail')!.innerHTML=`<div class="poi-map__selection"><h2>${escape(n.label)}</h2><p>${kindLabels[n.kind]} · ${participationLabels[n.participation]} · ${statusLabels[n.status]}${n.id===model.currentNodeId?' · Vous êtes ici':''}${nextSteps.has(n.id)?' · Prochaine étape':''}${n.reusable?' · Refuge réutilisable':''}${n.canTravel?' · Voyage rapide · 1 tour':''}</p>${n.status==='available'?(()=>{const meta=runNodePresentation(n);return `<p class="poi-map__stakes">Risque ${ratingScale(meta.risk)} · Gain ${ratingScale(meta.reward)}</p>`;})():''}${n.status==='locked'?`<p class="poi-map__lock-hint">${escape(n.hint??'')}</p>`:''}</div><div class="poi-map__detail-actions" data-gamepad-back="[data-poi-id][aria-pressed=true]"><button data-poi-action="details" aria-controls="poi-map-panel" aria-expanded="false">Détails</button><button data-poi-action="move" ${canMove?'':'disabled'}>${n.id===model.currentNodeId?(n.reusable?'Ouvrir le refuge':'Ouvrir'):'Se rendre'}</button>${n.canBypass?'<button data-poi-action="bypass">Contourner</button>':''}</div>`;
      const threatBrief=threats.map(threat=>`<div class="poi-map__threat-brief" data-poi-threat="${escape(threat.id)}"><strong>♜ ${escape(threat.label)}${threat.contested?' · Passage contesté':''}</strong><p>${threat.mode==='cyclic_patrol'?'Patrouille':'Traque locale'} · ${escape(nodeLabel(threat.positionId))} → ${escape(nodeLabel(threat.nextPositionId))}</p></div>`).join('');
      element.querySelector('.poi-map__panel-detail')!.innerHTML=`<section><span class="poi-map__detail-role">${roleLabels[n.role]} · ${participationLabels[n.participation]}</span><h3>${escape(n.label)}</h3><p>${kindLabels[n.kind]} · ${statusLabels[n.status]}${n.reusable?' · Services réutilisables':''}</p><p>${escape(n.hint??'')}</p></section>${threatBrief}`;
      // Threat intent stays visible even with the optional explanations closed.
      if(threats.length)element.querySelector('.poi-map__detail')!.insertAdjacentHTML('beforeend',`<div class="poi-map__threat-summary">${threats.map(threat=>`<p><strong>♜ ${escape(threat.label)}${threat.contested?' · Passage contesté':''}</strong> · ${threat.mode==='cyclic_patrol'?'Patrouille':'Traque locale'} · ${escape(nodeLabel(threat.positionId))} → ${escape(nodeLabel(threat.nextPositionId))}${threat.canFight?` <button data-poi-action="elite-fight" data-elite-id="${escape(threat.id)}">Affronter la menace</button>`:''}</p>`).join('')}</div>`);
      element.querySelectorAll<HTMLButtonElement>('[data-poi-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poiId===n.id)));
      const legs=n.canTravel?n.travelRoute.slice(1).map((id,index)=>[n.travelRoute[index]!,id] as const):n.canMove?[[model.currentNodeId,n.id] as const]:[];
      element.querySelectorAll<SVGPathElement>('.poi-path').forEach(path=>path.classList.toggle('poi-path--selected',legs.some(([from,to])=>
        path.dataset.from===from&&path.dataset.to===to||path.dataset.to===from&&path.dataset.from===to)));
    };
    const select=(id:string,scroll=false)=>{
      if(this.selectedId!==id){this.selectedId=id;update();}
      if(scroll)element.querySelector(`[data-poi-id="${CSS.escape(id)}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    };
    let pointerSelectionChanged=false;
    element.addEventListener('pointerdown',event=>{
      const id=(event.target as Element).closest<HTMLElement>('[data-poi-id]')?.dataset.poiId;
      pointerSelectionChanged=Boolean(id&&id!==this.selectedId);
    });
    element.addEventListener('click',event=>{
      if(element.dataset.travelling==='true')return;
      const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
      if(button.dataset.poiId){const changed=pointerSelectionChanged||button.dataset.poiId!==this.selectedId;pointerSelectionChanged=false;select(button.dataset.poiId);if(changed)this.options.onSound?.('navigate');return;}
      if(button.dataset.poiRegion!==undefined){const regionIndex=Number(button.dataset.poiRegion);
        if(regionIndex!==phase)this.options.onSound?.('navigate');
        const target=model.nodes.find(n=>n.region===regionIndex&&n.id===model.currentNodeId)??model.nodes.find(n=>n.region===regionIndex)!;
        this.render(model,regionIndex,target.id,reducedMotion);
        this.element?.querySelector<HTMLButtonElement>(`[data-poi-region="${regionIndex}"]`)?.focus();return;}
      switch(button.dataset.poiAction){
        case'help':case'details':openPanel(button);this.options.onSound?.('confirm');break;
        case'close-panel':closePanel();this.options.onSound?.('back');break;
        case'settings':this.options.onSettings?.();break;
        case'move':{const restoreFocus=document.activeElement===button;button.disabled=true;void this.options.onMove(this.selectedId).catch(()=>{
          if(this.element===element){const message=document.createElement('p');message.setAttribute('role','alert');
            message.textContent='Déplacement interrompu. Réessayez.';element.querySelector('.poi-map__detail')?.append(message);}
        }).finally(()=>{if(this.element===element){button.disabled=false;
          if(restoreFocus&&document.activeElement===document.body)button.focus();}});break;}
        case'bypass':this.options.onBypass(this.selectedId);break;
        case'company':this.options.onSound?.('confirm');this.options.onCompany();break;case'save':this.options.onSave();break;
        case'menu':this.options.onMenu();break;
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
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePanel();this.options.onSound?.('back');}
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
        if(next!==phase)this.options.onSound?.('navigate');
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
      if(next){element.querySelector<HTMLButtonElement>(`[data-poi-id="${CSS.escape(next)}"]`)?.focus();if(next!==id)this.options.onSound?.('navigate');}
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

  /**
   * Animate only a movement already committed/saved by RunSystem via GameApp. A set 1.16.0 travel passes its route:
   * the pawn follows each leg drawn on the displayed region, in one quick eased run, and stops where the drawn
   * route ends (the map then redraws at the destination). Reduced motion places the pawn directly.
   */
  animateTravel(from:string,to:string,route:readonly string[]=[from,to]):Promise<void>|undefined{
    this.finishTravel?.();
    const element=this.element;
    if(!element||from===to||document.hidden||prefersReducedMotion(element.dataset.reducedMotion==='true'))return;
    const paths=[...element.querySelectorAll<SVGPathElement>('.poi-path')];
    const legs:{path:SVGPathElement;length:number;reverse:boolean;to:string}[]=[];
    for(let index=1;index<route.length;index++){
      const legFrom=route[index-1]!,legTo=route[index]!;
      const path=paths.find(p=>(p.dataset.from===legFrom&&p.dataset.to===legTo)||(p.dataset.from===legTo&&p.dataset.to===legFrom));
      if(!path||typeof path.getTotalLength!=='function')break;
      const length=path.getTotalLength();
      if(!Number.isFinite(length)||length<=0)break;
      legs.push({path,length,reverse:path.dataset.from!==legFrom,to:legTo});
    }
    if(!legs.length)return;
    const token=element.querySelector<SVGGElement>('.poi-map__pawn');if(!token)return;
    const total=legs.reduce((sum,leg)=>sum+leg.length,0);
    const position=(distance:number)=>{
      let rest=Math.max(0,Math.min(total,distance)),leg=legs[0]!;
      for(const candidate of legs){leg=candidate;if(rest<=candidate.length)break;rest-=candidate.length;}
      const along=Math.min(leg.length,rest),p=leg.path.getPointAtLength(leg.reverse?leg.length-along:along);
      const ahead=leg.path.getPointAtLength(leg.reverse?0:leg.length),behind=leg.path.getPointAtLength(leg.reverse?leg.length:0);
      token.querySelector('.poi-map__pawn-figure')?.setAttribute('transform',ahead.x<behind.x?'scale(-1 1)':'');
      token.setAttribute('transform',`translate(${p.x} ${p.y})`);token.dataset.x=String(p.x);token.dataset.y=String(p.y);};
    token.classList.add('poi-map__traveller');position(0);
    // One edge keeps its established pace; a longer route stays quick.
    const duration=legs.length===1?Math.max(650,Math.min(1100,total*2)):Math.max(900,Math.min(2200,total*1.2));
    element.dataset.travelling='true';element.inert=true; // No reentrant map intent during the short handoff.
    return new Promise(resolve=>{
      let frame=0,start:number|undefined;
      const finish=()=>{cancelAnimationFrame(frame);clearTimeout(watchdog);unsubscribe();document.removeEventListener('visibilitychange',hidden);position(total);token.dataset.node=legs.at(-1)!.to;token.classList.remove('poi-map__traveller');delete element.dataset.travelling;element.inert=false;this.finishTravel=null;resolve();};
      const hidden=()=>{if(document.hidden)finish();};
      const unsubscribe=onReducedMotionChange(()=>{if(prefersReducedMotion())finish();});
      const watchdog=window.setTimeout(finish,duration+400);
      document.addEventListener('visibilitychange',hidden);
      this.finishTravel=finish;
      const step=(time:number)=>{
        start??=time;
        if(this.element!==element||prefersReducedMotion(element.dataset.reducedMotion==='true')){finish();return;}
        const progress=Math.min(1,(time-start)/duration),eased=progress*progress*(3-2*progress);
        position(total*eased);
        if(progress===1)finish();else frame=requestAnimationFrame(step);
      };
      frame=requestAnimationFrame(step);
    });
  }
  close():void {this.finishTravel?.();this.element?.remove();this.element=null;}
}
