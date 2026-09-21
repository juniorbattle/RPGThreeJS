import { preview } from 'vite';
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.TRAVERSAL_QA_ROOT ?? 'tools/traversal/qa/freeze';
const server=await preview({preview:{port:5183,strictPort:true,host:'127.0.0.1'}});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1463,height:823}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5183/?qa=1&traversal=t0');
 await page.waitForSelector('.title-screen');
 const production={traversalCount:await page.locator('.traversal-t0').count(),titleVisible:await page.locator('.title-screen').isVisible()};
 assert.deepEqual(production,{traversalCount:0,titleVisible:true});
 await page.screenshot({path:`${out}/production-disabled.png`});
 await page.setViewportSize({width:960,height:720});
 await page.goto(`http://127.0.0.1:${process.env.TRAVERSAL_QA_PORT ?? 5182}/tools/traversal/taxonomy-review.html?seed=2`);
 await page.waitForFunction(()=>window.review);
 await page.evaluate(()=>{const {scene,settle}=window.review;for(let i=0;i<10&&scene.session.phase!=='FORK_OVERLAY';i++){
  scene.advance(20);settle();if(scene.session.phase==='DECISION'){
   const b=scene.route.beats.find(b=>b.id===scene.session.pendingBeatId);
   if(b.category==='MANDATORY_EVENT')scene.element.querySelector('[data-traversal-confirm]').click();else scene.skipDecision();settle();
  }
 }});
 await page.screenshot({path:`${out}/fork-narrow.png`});
 await page.locator('[data-traversal-fork-choice="lion-first-trial-event"]').click();
 await page.evaluate(()=>window.review.scene.advanceTransition(.48));
 assert.equal(await page.locator('[data-world-section="forest-junction"]').count(),0);
 await page.screenshot({path:`${out}/covered-narrow.png`});
 await page.evaluate(()=>{window.review.settle();window.review.scene.advance(20);window.review.settle();});
 await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
 const human=await page.evaluate(()=>{const {scene}=window.review;const beat=scene.route.beats.find(b=>b.id===scene.session.pendingBeatId);
 const actor=scene.element.querySelector(`[data-traversal-beat="${beat.id}"]`);
 return{id:beat.id,lane:beat.lane,ratio:actor.getBoundingClientRect().height/scene.element.querySelector('.traversal-vehicle').getBoundingClientRect().height};});
 assert.equal(human.id,'t0:branch:lion-first-trial-event');assert.equal(human.lane,0);assert.ok(human.ratio>.77&&human.ratio<.79);
 const proportions=await page.evaluate(()=>[...document.querySelectorAll('.traversal-world-section__terrain img')].map(i=>{
  const r=i.getBoundingClientRect();return{width:r.width,height:r.height,sourceRatio:i.naturalWidth/i.naturalHeight};
 }).filter(i=>i.height>0));
 for(const i of proportions)assert.ok(Math.abs(i.width/i.height-i.sourceRatio)<.001);
 await page.addStyleTag({content:'.traversal-entity__marker{visibility:hidden}'});
 await page.screenshot({path:`${out}/wounded-person-narrow.png`});
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/release-check.json`,JSON.stringify({production,human,proportions,errors},null,2));
 console.log({production,human,errors});
} finally {await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
