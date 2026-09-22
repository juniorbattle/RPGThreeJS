import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=`${process.env.TRAVERSAL_QA_ROOT ?? 'tools/traversal/qa/caravan-depth'}/runtime`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const viewport of [{width:1463,height:823},{width:960,height:720}]){
 const context=await browser.newContext({viewport,recordVideo:{dir:out,size:viewport}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(`http://127.0.0.1:${process.env.TRAVERSAL_QA_PORT ?? 5184}/tools/traversal/taxonomy-review.html`);
 await page.waitForFunction(()=>window.review);
 await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 const prefix=`${viewport.width}`;
 const overlaps=[];const transitions=[];
 for(const lane of [0,1]) for(const progress of [.015,.09,.2,.3,.4,.49,.54,.6,.75,.8,.91]){
  await page.evaluate(({lane,progress})=>{
   const s=window.review.scene;
   s.controller.sessionState={...s.session,currentLane:lane,routeProgress01:progress,stageIndex:[.2,.4,.6].filter(p=>progress>p).length};
   s.presentedBranch=progress>.8?'lion-first-trial-event':'main';
   window.review.state.run.traversalBranches=progress>.8?{T0:'lion-first-trial-event'}:{};
   s.renderRuntimeState();s.updateWorldTransforms();
  },{lane,progress});
  await page.waitForTimeout(420);
  overlaps.push(await page.evaluate(({lane,progress})=>{
   const v=document.querySelector('.traversal-vehicle').getBoundingClientRect();
   const plants=[...document.querySelectorAll('[data-occluder]')].filter(e=>!e.hidden).map(e=>({id:e.dataset.occluder,r:e.getBoundingClientRect()}));
   return {lane,progress,vehicleHeight:v.height,localOverlapEnvelopes:plants.filter(p=>p.r.left<v.right&&p.r.right>v.left&&p.r.top<v.bottom).map(p=>({id:p.id,heightRatio:(v.bottom-Math.max(v.top,p.r.top))/v.height})),visiblePlants:plants.length};
  },{lane,progress}));
  await page.screenshot({path:`${out}/${prefix}-lane-${lane}-${progress}.png`});
 }
 // Real CSS lane transitions, fixed scene depth/camera: no z-order handoff.
 await page.evaluate(()=>{const s=window.review.scene;s.presentedBranch='main';window.review.state.run.traversalBranches={};s.controller.sessionState={...s.session,routeProgress01:.3,stageIndex:1};s.renderRuntimeState();});
 for(const lane of [0,1,0,1,0,1]){
  await page.evaluate(lane=>{const s=window.review.scene;s.moveToLane(lane);s.updateWorldTransforms();},lane);
  await page.waitForTimeout(130);
  transitions.push(await page.evaluate(()=>({lane:window.review.scene.session.currentLane,
   vehicleTop:document.querySelector('.traversal-vehicle').getBoundingClientRect().top,
   actorPlane:getComputedStyle(document.querySelector('.traversal-world__actors')).zIndex,
   foregroundPlane:getComputedStyle(document.querySelector('.traversal-world__occlusion')).zIndex,
   plants:[...document.querySelectorAll('[data-occluder]')].filter(e=>!e.hidden).map(e=>({id:e.dataset.occluder,left:e.style.left,top:e.style.top}))})));
  await page.screenshot({path:`${out}/${prefix}-transition-toward-${lane}.png`});
  await page.waitForTimeout(400);
 }
 // QA-only lower human using the existing merchant sprite, never canonical authoring.
 await page.evaluate(()=>{
  const s=window.review.scene; const e=s.element.querySelector('[data-traversal-beat="t0:merchant:roadside"]')
    ?? s.element.querySelector('[data-category="OPTIONAL_EVENT"][data-scale="human"]');
  s.element.querySelectorAll('.traversal-entity').forEach(actor=>actor.hidden=actor!==e);
  s.element.querySelectorAll('.traversal-marker-anchor').forEach(marker=>marker.hidden=true);
  e.hidden=false;e.style.left=`${innerWidth*640/1463}px`;e.style.top='81%';e.dataset.qaOnly='lower-human-proof';
  const m=s.element.querySelector(`[data-marker-for="${e.dataset.traversalBeat}"]`);m.hidden=false;m.style.left=e.style.left;m.style.top=e.style.top;
 });
 await page.screenshot({path:`${out}/${prefix}-qa-lower-human.png`});
 const state=await page.evaluate(()=>({
  planes:[...document.querySelectorAll('[data-depth-plane]')].map(e=>({plane:e.dataset.depthPlane,z:getComputedStyle(e).zIndex})),
  wheels:[...document.querySelectorAll('[data-wheel]')].map(e=>({id:e.dataset.wheel,rect:e.getBoundingClientRect().toJSON()})),
  markers:[...document.querySelectorAll('.traversal-marker-anchor')].filter(e=>!e.hidden).map(e=>({id:e.dataset.markerFor,rect:e.getBoundingClientRect().toJSON()})),
  art:[...document.querySelectorAll('.traversal-world-section__terrain img')].filter(i=>i.getBoundingClientRect().height>0).map(i=>({src:i.src,native:i.naturalWidth/i.naturalHeight,rendered:i.getBoundingClientRect().width/i.getBoundingClientRect().height})),
  plantCount:document.querySelectorAll('[data-occluder]').length,
 }));
 assert.equal(state.wheels.length,4);
 for(const art of state.art)assert.ok(Math.abs(art.native-art.rendered)<.001);
 assert.deepEqual(errors,[]);
 for(const transition of transitions){assert.equal(transition.actorPlane,'20');assert.equal(transition.foregroundPlane,'30');assert.deepEqual(transition.plants,transitions[0].plants);}
 assert.ok(overlaps.filter(o=>o.lane===0).every(o=>o.localOverlapEnvelopes.length===0));
 assert.ok(overlaps.some(o=>o.lane===1&&o.localOverlapEnvelopes.some(p=>p.heightRatio>.1)));
 results.push({viewport,state,overlaps,transitions,errors});
 await context.close();await page.video().saveAs(`${out}/${prefix}-depth-review.webm`);
}
await writeFile(`${out}/report.json`,JSON.stringify(results,null,2));
await browser.close();console.log('Depth viewport evidence captured without runtime errors.');
