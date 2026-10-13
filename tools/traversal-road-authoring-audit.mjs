/** Structural/presentation audit of every existing authored road/branch; no campaign simulation. */
import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'tmp/traversal/road-1945-authoring-audit';
assert.ok(/^tmp\/traversal\/[a-zA-Z0-9_-]+$/.test(output));await mkdir(output,{recursive:false});
const report={scope:'all existing authoring descriptors; deterministic native model at 16.7ms; no browser/earned/save acceptance',startedAt:new Date().toISOString(),roads:[],errors:[]};let server;
try{
 server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});
 const {T0_ROAD_AUTHORING}=await server.ssrLoadModule('/src/traversal/TraversalT0Authoring.ts'),{T1_ROAD_AUTHORING}=await server.ssrLoadModule('/src/traversal/TraversalT1Authoring.ts'),{createT3RoadAuthoring}=await server.ssrLoadModule('/src/traversal/TraversalT3Authoring.ts');
 const {createRouteRun,advanceRouteRun,forecastRouteDistance}=await server.ssrLoadModule('/src/traversal/TraversalRouteRun.ts');
 const {roadEntryScale,roadVehicleHeight}=await server.ssrLoadModule('/src/traversal/TraversalRoadAnchor.ts');
 const {resolveRouteRiskVisual}=await server.ssrLoadModule('/src/traversal/TraversalRouteRiskVisual.ts');
 for(const a of [T0_ROAD_AUTHORING,T1_ROAD_AUTHORING,createT3RoadAuthoring(()=>{throw Error('Audit cannot read campaign state');})])for(let index=0;index<a.routeSegments.length;index++){
  const branches=a.routeSegments[index].checkpointKind==='BRANCH'?[`lion-${a.legId==='T0'?'first':a.legId==='T1'?'second':'final'}-trial-event`,`lion-${a.legId==='T0'?'first':a.legId==='T1'?'second':'final'}-trial-combat`]:[undefined];
  for(const branch of branches){const segment=a.resolveSegment(index,branch),hazards=a.hazards(segment.id),pickups=a.pickups(segment.id),events=[...hazards,...pickups].sort((x,y)=>x.progress01-y.progress01);
   assert.ok(events.length&&new Set(events.map(e=>e.id)).size===events.length);assert.ok(events.every(e=>e.segmentId===segment.id&&[0,1].includes(e.lane)&&e.progress01>0&&e.progress01<1));
   assert.ok(hazards.every(h=>resolveRouteRiskVisual(h).kind==='boulder'));assert.ok(pickups.every(p=>p.gold===5));
   const gaps=events.slice(1).map((e,i)=>(e.progress01-events[i].progress01)*segment.durationMs);
   // Native lane interpolation lasts380ms. Record the actual margin rather than inventing an acceptance standard.
   assert.ok(gaps.every(ms=>ms>380),'Authored crossing gaps exceed one existing lane transition');
   const sizes=[];
   for(const [width,height] of [[1440,810],[620,780],[390,844]]){
    const initial=createRouteRun(segment,index),contacts=[...hazards.map(h=>({progress01:h.progress01,halfWidth:roadVehicleHeight(width,height)*(width<=700?1.26:.98)/2})),...pickups.map(p=>({progress01:p.progress01,halfWidth:Math.min(72,Math.max(48,width*.05))/2}))];
    const scale=roadEntryScale(initial,segment,width,contacts);assert.ok(Number.isFinite(scale)&&scale>=1);
    const marks=events.map(e=>{const half=contacts.find(c=>c.progress01===e.progress01).halfWidth,anchor=forecastRouteDistance(initial,segment,e.progress01)*scale;let state=initial,distance=0,entry=null;
     assert.ok(width*.25+anchor*width/1463-half>=width+7.99,'Each authored mark starts completely outside');
     while(state.progress01<e.progress01){const next=advanceRouteRun(state,segment,Math.min(16.7,e.progress01*segment.durationMs-state.elapsedMs));distance+=(state.speed+next.speed)/2*(next.elapsedMs-state.elapsedMs)*.28*scale;state=next;if(entry===null&&width*.25+(anchor-distance)*width/1463-half<=width)entry=state.elapsedMs;}
     assert.ok(entry!==null&&Number.isFinite(entry),'Actual full-edge entry observed');
     const approachMs=e.progress01*segment.durationMs-entry;assert.ok(approachMs>380,'Baseline full-edge-to-contact time exceeds one native lane transition');
     return{id:e.id,lane:e.lane,progress:e.progress01,halfWidth:half,baselineEdgeToContactMs:approachMs};});sizes.push({width,height,scale,marks});
   }
   report.roads.push({leg:a.legId,segment:segment.id,branch,events,gapsMs:gaps,sizes});
  }
 }
 const paths=['src/traversal/TraversalT0Authoring.ts','src/traversal/TraversalT1Authoring.ts','src/traversal/TraversalT3Authoring.ts','src/traversal/TraversalT0Risk.ts','src/traversal/TraversalT0Reward.ts','src/traversal/TraversalT0CheckpointRoute.ts','src/traversal/TraversalT1CheckpointRoute.ts','src/traversal/TraversalT3CheckpointRoute.ts','src/traversal/TraversalRouteRun.ts','src/traversal/TraversalRoadAnchor.ts','src/traversal/TraversalRouteRiskVisual.ts','tools/traversal-road-authoring-audit.mjs'];
 report.inputs=await Promise.all(paths.map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')})));
 report.pass=true;
}catch(e){report.pass=false;report.errors.push(e.stack??String(e));process.exitCode=1;}finally{await server?.close();report.endedAt=new Date().toISOString();await writeFile(output+'/results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,roads:report.roads.length,errors:report.errors}));}
