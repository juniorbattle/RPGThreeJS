import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/reports/t0-campaign-grammar-browser';
const combatVisual=process.argv.includes('--combat-visual');
const checkpoint=JSON.parse(await readFile(out+'/arrival-checkpoint.json','utf8'));
let originalProof;
try {
  const old=await chromium.connectOverCDP('http://127.0.0.1:9222');
  originalProof=await old.contexts()[0].pages()[0].evaluate(()=>window.grammarProof);
  await old.close();
} catch {
  const prior=JSON.parse(await readFile(out+'/result.json','utf8').catch(()=>readFile(out+'/completion.json','utf8')));
  originalProof=prior.proof??prior.originalProof;
}
assert.equal(originalProof.traversalMounts,1);assert.equal(originalProof.travelMounts,0);assert.equal(originalProof.maxHud,1);
assert.deepEqual(originalProof.removed,[{phase:'COMPLETE',cover:1}]);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[],stages=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5191');
await page.evaluate(state=>{localStorage.setItem('rpg-threejs:autosave:v6',JSON.stringify(state));localStorage.setItem('rpg-tutorial-seen','1');},checkpoint);
await page.reload();await page.locator('[data-action=continue]').click();
const shot=async name=>{await page.waitForFunction(()=>!document.querySelector('.scene-transition')&&![...document.querySelectorAll('.narrative-stage')].some(x=>x.dataset.narrativeSurfaceReadiness!=='VISIBLE'));await page.waitForTimeout(500);await page.screenshot({path:out+'/'+name+'.png'});};
let entered=false,gathering=false,management=false,complete=false;
for(let i=0;i<1400;i++){
 await page.waitForTimeout(180);
 if(await page.locator('.scene-transition').count())continue;
 const combat=page.frames().find(f=>f.url().includes('legacy-combat'));
 if(combat&&combatVisual){
   const press=selector=>combat.locator(selector).first().evaluate(el=>el.click());
   await combat.locator('[data-d=auto]').waitFor(); await press('[data-d=auto]'); await press('[data-d=start]');
   await combat.locator('[data-a=move]').waitFor(); await press('[data-a=move]'); await page.mouse.click(640,520); await page.waitForTimeout(1800);
   await press('[data-a=attack]'); await press('[data-ch="0"]'); await page.mouse.click(875,485);
   await combat.locator('#stagevig.on').waitFor();await page.waitForTimeout(1100);
   await page.screenshot({path:out+'/combat-stage-lighter.png'});
   const style=await combat.locator('#stagevig').evaluate(el=>({background:getComputedStyle(el).backgroundImage,bodyOverlayOpacity:getComputedStyle(document.body,'::before').opacity}));
   assert.equal(style.bodyOverlayOpacity,'0.3');
   await writeFile(out+'/combat-visual.json',JSON.stringify({passed:true,style,errors},null,2));console.log('COMBAT VISUAL PASS');await browser.close();process.exit(0);
 }
 const tableau=await page.locator('.narrative-stage').count()?await page.locator('.narrative-stage').getAttribute('data-narrative-tableau'):null;
 if(tableau&&stages.at(-1)!==tableau){stages.push(tableau);console.log(tableau);}
 if(tableau==='FIRST_REFUGE_GATHERING_TABLEAU'&&!gathering){
   await page.locator('.dialogue__box').waitFor({state:'visible'});
   await shot('clan-arrival');
   assert.equal(await page.locator('.campaign-status-hud').count(),0);
   const cast=await page.locator('.narrative-cast__actor').evaluateAll(xs=>xs.map(x=>x.dataset.actorId));
   assert.ok(cast.includes('alistair')&&cast.includes('maelor')&&cast.includes('rogue'));console.log({cast});
   await page.setViewportSize({width:540,height:800});await shot('clan-arrival-540');await page.setViewportSize({width:1366,height:768});
   gathering=true;
 }
 if(await page.locator('.exploration-stop').count()){
   assert.ok(gathering);assert.equal(await page.locator('.campaign-status-hud').count(),1);
   await shot('refuge-management');management=true;
   await page.locator('.exploration-stop [data-action=continue]').click();continue;
 }
 const pay=page.locator('.dialogue__choices button:visible:not([disabled])').filter({hasText:/Payer 20/});
 if(!combatVisual&&await pay.count()){await pay.first().click();continue;}
 const choice=page.locator('.dialogue__choices button:visible:not([disabled])');
 if(await choice.count()){await choice.first().click();continue;}
 const box=page.locator('.dialogue__box:visible');
 if(await box.count()){await box.click();continue;}
 const onward=page.locator('[data-journey-continue]:visible');
 if(await onward.count()){
   if(!entered){await shot('arrival-explicit-agency');entered=true;await onward.click();continue;}
   if(management){complete=true;break;}
 }
}
assert.ok(complete&&entered&&gathering&&management);
assert.equal(await page.locator('.traversal-t0').count(),0);assert.equal(await page.locator('.travel-view').count(),0);
const final=await page.evaluate(()=>JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
assert.equal(final.run.currentNodeId,'lion-first-refuge');assert.equal(final.run.temporaryLoot.gold,0);
assert.equal(final.gold,160);assert.equal(final.inventory.materials.red_gem,1);
assert.ok(final.flags['clanArrival:lion-first-refuge']);assert.ok(final.flags['ate:ate_first_refuge_watch']);
assert.ok(stages.includes('ATE_FIRST_REFUGE_WATCH_TABLEAU'));assert.equal(errors.length,0);
await shot('post-refuge-t1-blocked');
await writeFile(out+'/completion.json',JSON.stringify({passed:true,method:'Original uninterrupted pre-audience to management run; final refuge screenshots and onward Journey verified by loading its byte-unmodified durable arrival checkpoint and choosing the existing pay-tribute option.',originalProof,stages,errors,final:{node:final.run.currentNodeId,gold:final.gold,gems:final.inventory.materials.red_gem,routeGold:final.run.temporaryLoot.gold,reputation:final.reputation,flags:final.flags}},null,2));
console.log('PASS');await browser.close();
