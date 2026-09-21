import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='tools/traversal/qa/convergence/targeted';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const seed of [0,1,2]){
 const page=await browser.newPage({viewport:{width:960,height:720}});
 await page.goto(`http://127.0.0.1:5174/tools/traversal/taxonomy-review.html?seed=${seed}`);
 await page.waitForFunction(()=>window.review);
 await page.evaluate(()=>{const {scene,settle}=window.review;scene.moveToLane(1);scene.advance(20);settle();scene.skipDecision();scene.advance(20);settle();scene.element.querySelector('[data-traversal-confirm]').click();settle();scene.advance(12);settle();});
 await page.waitForTimeout(800);
 results.push(await page.evaluate(()=>{const {scene}=window.review;const e=scene.element.querySelector('[data-traversal-beat="t0:enemy:wolf-scouts"]');return{seed:window.review.state.run.seed,phase:scene.session.phase,label:e.getAttribute('aria-label'),scale:e.getBoundingClientRect().height/scene.element.querySelector('.traversal-vehicle').getBoundingClientRect().height};}));
 await page.screenshot({path:`${out}/enemy-seed-${seed}.png`});
 if(seed===2){
  const flee=await page.evaluate(()=>{const {scene}=window.review;scene.skipDecision();scene.advance(.5);return{phase:scene.session.phase,lane:scene.session.currentLane,passed:scene.session.bypassedBeatIds.includes('t0:enemy:wolf-scouts'),visible:!scene.element.querySelector('[data-traversal-beat="t0:enemy:wolf-scouts"]').hidden};});
  assert.deepEqual(flee,{phase:'RUNNING',lane:0,passed:false,visible:true});results.push({flee});
  await page.screenshot({path:out+'/flee-visible.png'});
  await page.evaluate(()=>{const {scene,settle}=window.review;scene.advance(12);settle();scene.skipDecision();scene.advance(.5);});
  const ignored=await page.evaluate(()=>{const {scene,state}=window.review;return{phase:scene.session.phase,recorded:state.run.bypassedRouteNodeIds?.includes('lion-nomad-crossroads')??false,visible:!scene.element.querySelector('[data-traversal-beat="t0:stage:1:lion-nomad-crossroads"]').hidden};});
  assert.deepEqual(ignored,{phase:'RUNNING',recorded:false,visible:true});results.push({ignored});
  await page.screenshot({path:out+'/ignored-visible.png'});
  await page.evaluate(()=>window.review.scene.advance(5));
  assert.equal(await page.evaluate(()=>window.review.state.run.bypassedRouteNodeIds.includes('lion-nomad-crossroads')),true);

  await page.evaluate(()=>{const {scene,settle}=window.review;scene.skipDecision();for(let i=0;i<800&&scene.session.phase!=='FORK_OVERLAY';i++){scene.advance(.1);settle();if(scene.session.phase==='DECISION')scene.skipDecision();}});
  await page.waitForTimeout(500);await page.screenshot({path:`${out}/fork-narrow.png`});
  await page.locator('[data-traversal-fork-choice="lion-first-trial-combat"]').click();
  const before=await page.evaluate(()=>window.review.state.run.traversalBranches?.T0);assert.equal(before,undefined);
  await page.evaluate(()=>window.review.scene.advanceTransition(.48));
  await page.waitForTimeout(100);
  const covered=await page.evaluate(()=>{const {scene,state}=window.review;const c=scene.element.querySelector('.traversal-transition');return{branch:state.run.traversalBranches.T0,opacity:getComputedStyle(c).opacity,top:document.elementFromPoint(innerWidth-150,innerHeight/2)?.className};});
  assert.equal(covered.branch,'lion-first-trial-combat');assert.equal(covered.opacity,'1');assert.equal(covered.top,'traversal-transition');results.push(covered);
  await page.screenshot({path:`${out}/fork-full-cover.png`});
  await page.evaluate(()=>window.review.settle());
  await page.evaluate(()=>window.review.scene.advance(2));
  assert.equal(await page.locator('.traversal-t0').getAttribute('data-phase'),'RUNNING');
  await page.screenshot({path:`${out}/combat-variant-resumed.png`});
 }
 await page.close();
}
await writeFile(`${out}/report.json`,JSON.stringify(results,null,2));await browser.close();console.log(results);
