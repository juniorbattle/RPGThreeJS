/** Isolated native-clock presentation probe; never instantiates GameApp/RunSystem/save/combat. */
import '../../src/styles/traversal.css';
import { T0_ROAD_AUTHORING } from '../../src/traversal/TraversalT0Authoring';
import { T1_ROAD_AUTHORING } from '../../src/traversal/TraversalT1Authoring';
import { createT3RoadAuthoring } from '../../src/traversal/TraversalT3Authoring';
import { TraversalRouteRiskRenderer } from '../../src/traversal/TraversalRouteRiskRenderer';
import { TraversalRouteRewardRenderer } from '../../src/traversal/TraversalRouteRewardRenderer';
import { TraversalRouteRenderer } from '../../src/traversal/TraversalRouteRenderer';
import { TraversalWorldRenderer } from '../../src/traversal/TraversalWorldRenderer';
import { TRAVERSAL_T0_WORLD_PRESENTATION } from '../../src/traversal/TraversalT0World';
import { buildTraversalCaravan } from '../../src/traversal/TraversalCaravan';
import { anchoredRoadSpeed, setRoadGroundDepth } from '../../src/traversal/TraversalRoadAnchor';
import { createRouteRun, advanceRouteRun, resetRouteSpeed, forecastRouteDistance, setRouteLane } from '../../src/traversal/TraversalRouteRun';
import { createRouteRisk, resolveRouteRisk } from '../../src/traversal/TraversalRouteRisk';
import { createRouteReward, resolveRouteReward } from '../../src/traversal/TraversalRouteReward';
import { prefersReducedMotion } from '../../src/ui/ReducedMotion';
const params=new URLSearchParams(location.search), leg=params.get('leg')??'T0';
const authoring=leg==='T1'?T1_ROAD_AUTHORING:leg==='T3'?createT3RoadAuthoring(()=>{throw Error('No campaign owner in isolated lab');}):T0_ROAD_AUTHORING;
const segment=authoring.resolveSegment(leg==='T0'?3:2), hazards=authoring.hazards(segment.id), pickups=authoring.pickups(segment.id);
const target=pickups.find(p=>p.progress01===.5)!;
const firstHazard=hazards[0]!;
if(!target||!firstHazard||firstHazard.progress01!==.31)throw Error('Expected unchanged authored reset/pickup pair');
document.body.innerHTML='<main class="traversal-t0" data-view="route" data-phase="RUNNING"><div class="traversal-world"></div><figure class="traversal-vehicle"></figure><nav style="position:absolute;z-index:50000;top:8px;left:8px;display:flex;gap:8px"><button id="start">Démarrer</button><button id="pause">Pause</button><button id="dispose">Retirer</button></nav><script id="proof" type="application/json"></script></main>';
const root=document.querySelector<HTMLElement>('main')!,vehicle=root.querySelector<HTMLElement>('figure')!,proof=root.querySelector('#proof')!;
buildTraversalCaravan(vehicle);vehicle.style.transition='none';
for(const b of root.querySelectorAll<HTMLElement>('button'))b.style.cssText='min-width:44px;min-height:44px;background:#142c40;color:#fff1d1;border:2px solid #c3a56a';
const world=new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);root.querySelector('.traversal-world')!.append(world.routeElement);
const risk=new TraversalRouteRiskRenderer(),reward=new TraversalRouteRewardRenderer(),road=new TraversalRouteRenderer();
risk.reset(hazards);reward.reset(pickups);risk.bindVehicle(vehicle);root.append(road.element,risk.element,reward.element);
// Deliberately use unit distance scale to exercise an already-visible future anchor.
// This isolated presentation configuration is not the production roadEntryScale.
let run=createRouteRun(segment,0,1),riskState=createRouteRisk(segment.id),rewardState=createRouteReward(segment.id);
let started=false,paused=false,disposed=false,previous=performance.now(),samples:object[]=[];
const game=params.get('motion')==='game';
root.dataset.reducedMotion=String(prefersReducedMotion(game));
if(game){const style=document.createElement('style');style.textContent='.traversal-t0 *{animation:none!important;transition:none!important}';root.append(style);}
function render():void{
 const width=innerWidth,height=innerHeight;
 vehicle.style.setProperty('--traversal-lane-y',`${run.lane===0?65:81}%`);setRoadGroundDepth(vehicle,height*(run.lane===0?.65:.81));
 world.updateRoute(road.distance,width);
 risk.update(hazards,riskState,run.progress01,run.elapsedMs,segment.durationMs,road.distance,width,!disposed,p=>forecastRouteDistance(run,segment,p),height);
 reward.update(pickups,rewardState,run.progress01,run.elapsedMs,segment.durationMs,road.distance,width,!disposed,p=>forecastRouteDistance(run,segment,p),height);
 const marks=[...root.querySelectorAll<HTMLElement>('[data-risk-hazard],[data-reward-pickup]')].map(e=>{const b=e.getBoundingClientRect(),i=e.querySelector('img')!;return{id:e.dataset.riskHazard??e.dataset.rewardPickup,hidden:e.hidden,left:b.left,right:b.right,x:(Number(e.dataset.roadLeft)+Number(e.dataset.roadRight))/2,collected:e.dataset.collected,decoded:i.complete&&i.naturalWidth>0};});
 const s={elapsed:run.elapsedMs,progress:run.progress01,reset:run.speedResetAtMs,distance:road.distance,width,lane:run.lane,marks};
 if(started&&!paused&&!disposed&&samples.length<1600)samples.push(s);
 proof.textContent=JSON.stringify({state:s,samples,started,paused,disposed,leg,target:target.id,hazard:firstHazard.id,risk:riskState,reward:rewardState,noOwnersInstantiated:true,unitScaleProbe:true,reduced:root.dataset.reducedMotion});
}
function step(now:number):void{
 const delta=Math.min(1000,Math.max(0,now-previous));previous=now;
 if(!started||paused||disposed||document.hidden)return;
 const before=run;run=advanceRouteRun(run,segment,delta);
 const contact=[risk.nextContact(hazards,before.progress01),reward.nextContact(pickups,before.progress01)].filter(x=>x!==null).sort((a,b)=>a!.progress01-b!.progress01)[0]??null;
 road.advance(run.elapsedMs-before.elapsedMs,anchoredRoadSpeed(before,run,segment,road.distance,contact,1));
 const r=resolveRouteReward(rewardState,pickups,before.progress01,run.progress01,run.lane,true);rewardState=r.state;
 for(const o of r.outcomes)if(o.result==='COLLECTED')reward.collect(o.pickup,run.elapsedMs);
 const h=resolveRouteRisk(riskState,hazards,before.progress01,run.progress01,run.lane,true);riskState=h.state;
 for(const o of h.outcomes)if(o.result==='COLLISION'){run=resetRouteSpeed(run,segment);risk.impact(o.hazard,run.elapsedMs);risk.reforecastUnseen(road.distance,innerWidth);reward.reforecastUnseen(road.distance,innerWidth);}
}
document.querySelector('#start')!.addEventListener('click',()=>{started=true;previous=performance.now();});
document.querySelector('#pause')!.addEventListener('click',()=>{step(performance.now());paused=!paused;render();});
document.querySelector('#dispose')!.addEventListener('click',()=>{disposed=true;render();});
addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){step(performance.now());run=setRouteLane(run,e.key==='ArrowUp'?0:1);render();}});
addEventListener('resize',()=>{step(performance.now());render();});
document.addEventListener('visibilitychange',()=>{previous=performance.now();render();});
render();function frame(now:number):void{step(now);render();if(!disposed)requestAnimationFrame(frame);}requestAnimationFrame(frame);
