import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=`${process.env.TRAVERSAL_QA_ROOT ?? 'tools/traversal/qa/freeze'}/targeted`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const branch of ['lion-first-trial-event','lion-first-trial-combat']) {
 const page=await browser.newPage({viewport:{width:1463,height:823}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`http://127.0.0.1:${process.env.TRAVERSAL_QA_PORT ?? 5182}/tools/traversal/taxonomy-review.html?seed=2`);
 await page.waitForFunction(()=>window.review);
 const capture=async name=>{await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/${branch}-${name}.png`});};
 for(let step=0;step<15;step++) {
  await page.evaluate(()=>{window.review.scene.advance(20);window.review.settle();});
  const s=await page.evaluate(()=>({phase:window.review.scene.session.phase,progress:window.review.scene.session.routeProgress01}));
  if(s.phase==='FORK_OVERLAY')break;
  assert.equal(s.phase,'DECISION');
  await capture(`decision-${s.progress}`);
  const hide=await page.addStyleTag({content:'.traversal-entity__marker {visibility:hidden}'});
  await capture(`subject-${s.progress}`);await hide.evaluate(e=>e.remove());
  const r=await page.evaluate(()=>{
    const {scene}=window.review;
    const beat=scene.route.beats.find(b=>b.id===scene.session.pendingBeatId);
    const actor=scene.element.querySelector(`[data-traversal-beat="${beat.id}"]`);
    const before=scene.session.currentLane;
    const ratio=actor.getBoundingClientRect().height/scene.element.querySelector('.traversal-vehicle').getBoundingClientRect().height;
    if(beat.category==='MANDATORY_EVENT') {scene.element.querySelector('[data-traversal-confirm]').click();window.review.settle();return {id:beat.id,ratio};}
    scene.skipDecision();scene.advance(.5);
    return {id:beat.id,category:beat.category,lane:beat.lane,before,after:scene.session.currentLane,ratio,
      recorded:scene.session.bypassedBeatIds.includes(beat.id),visible:!actor.hidden,assisted:scene.element.dataset.assistedBypass};
  });
  if(r.category==='OPTIONAL_EVENT'){assert.equal(r.lane,0);assert.equal(r.after,r.before);assert.equal(r.assisted,'false');assert.equal(r.recorded,false);assert.equal(r.visible,true);}
  results.push(r);await capture(`passing-${s.progress}`);
  await page.evaluate(()=>{const {scene}=window.review;scene.advance(5);scene.moveToLane(scene.session.routeProgress01<.3?1:0);});
 }
 await capture('pre-fork');
 await page.locator(`[data-traversal-fork-choice="${branch}"]`).click();
 await capture('selection');
 assert.equal(await page.evaluate(()=>window.review.state.run.traversalBranches?.T0),undefined);
 await page.evaluate(()=>window.review.scene.advanceTransition(.48));
 await capture('covered');
 const covered=await page.evaluate(()=>{const {scene,state}=window.review;return{branch:state.run.traversalBranches.T0,opacity:getComputedStyle(scene.element.querySelector('.traversal-transition')).opacity,oldFork:!!scene.element.querySelector('[data-world-section="forest-junction"]'),sign:!!scene.element.querySelector('[data-location-prop="junction-sign"]')};});
 assert.deepEqual(covered,{branch,opacity:'1',oldFork:false,sign:false});results.push(covered);
 await page.evaluate(()=>window.review.scene.advanceTransition(.36));
 await capture('first-reveal');
 await page.evaluate(()=>{const {scene}=window.review;scene.previousFrameMs=performance.now();scene.frameId=requestAnimationFrame(scene.tick);});
 await page.waitForTimeout(3000);
 await capture('three-seconds');
 const running=await page.evaluate(()=>({phase:window.review.scene.session.phase,progress:window.review.scene.session.routeProgress01}));
 assert.equal(running.phase,'RUNNING');assert.ok(running.progress>.82);results.push(running);
 assert.deepEqual(errors,[]);await page.close();
}
await writeFile(`${out}/report.json`,JSON.stringify(results,null,2));
await browser.close();console.log(results);
