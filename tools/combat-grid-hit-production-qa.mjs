/** Native pointer reachability on the production battlefield; no combat mutation helpers. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {preview} from 'vite';
import {beginJob} from './qa/qa-job.mjs';

const port=Number(process.env.GRID_QA_PORT??5264);
const output=resolve(process.env.GRID_QA_OUTPUT??'tmp/demo/grid-hit-production');
const parameters={viewports:[[620,780],[1366,768],[390,844],[560,780],[561,780],[700,780],[701,780],[1240,780],[1241,780],[620,600]],motion:['no-preference','reduce'],boundaryMotion:'no-preference',campaignAcceptance:false};
const requiredAssertions=['NATIVE_GRID_HIT_TARGETS','NATIVE_MOVE_AND_UNDO','HOVER_PRESERVES_TACTICAL_STATE'];
const job=beginJob({driver:'tools/combat-grid-hit-production-qa.mjs',port,output,parameters,requiredAssertions});
const report={pass:false,errors:[],cases:[],campaignAcceptance:false,runtimeMutationInjected:false,outcomeInjected:false,nativeRuntimeActions:true};
const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser=await chromium.launch({headless:true});
let page;
const truth=()=>page.evaluate(()=>{const g=window.G;return{round:g.round,turnIdx:g.turnIdx,over:g.over,moved:g.movedThisTurn,
 active:g.active?.id,units:g.units.map(u=>({id:u.id,hp:u.hp,ap:u.ap,gx:u.gx,gz:u.gz,alive:u.alive,statuses:u.statuses})),inventory:{...g.inv}};});
async function scan(cells){
 const observations=[];
 for(const cell of cells){
  const point=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),cell);
  await page.mouse.move(point.screenX,point.screenY);
  const hit=await page.evaluate(({gx,gz,screenX,screenY})=>{const e=document.elementFromPoint(screenX,screenY);return{
    canvas:e?.tagName==='CANVAS',element:e?.tagName,elementId:e?.id,hover:window.G.hover&&{gx:window.G.hover.gx,gz:window.G.hover.gz},
    inBounds:screenX>=0&&screenY>=0&&screenX<innerWidth&&screenY<innerHeight,
    margins:[[-6,0],[6,0],[0,-6],[0,6]].map(([dx,dy])=>({dx,dy,canvas:document.elementFromPoint(screenX+dx,screenY+dy)?.tagName==='CANVAS',
      inBounds:screenX+dx>=0&&screenY+dy>=0&&screenX+dx<innerWidth&&screenY+dy<innerHeight}))};},{...cell,...point});
  observations.push({...cell,...point,method:'NATIVE_CENTER_RAYCAST_AND_DOM_MARGIN_HIT_TEST',...hit});
 }
 return observations;
}
function assertHits(hits){for(const h of hits){assert.equal(h.inBounds,true,`Offscreen cell ${h.gx},${h.gz}`);assert.equal(h.canvas,true,`HUD intercepts cell ${h.gx},${h.gz}`);assert.deepEqual(h.hover,{gx:h.gx,gz:h.gz},'Native hover disagrees with projected cell');for(const margin of h.margins){assert.equal(margin.inBounds,true,'Offscreen target margin');assert.equal(margin.canvas,true,`HUD intercepts margin of cell ${h.gx},${h.gz}`);}}}
try {
 for(const [width,height] of parameters.viewports)for(const motion of parameters.motion){
  if((![1366,620,390].includes(width)||height===600)&&motion!==parameters.boundaryMotion)continue;
  page=await browser.newPage({viewport:{width,height},reducedMotion:motion});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  const row={width,height,motion,pass:false,captures:[]};report.cases.push(row);
  await writeFile(resolve(output,'progress.json'),JSON.stringify({at:new Date().toISOString(),width,height,motion,stage:'boot',completed:report.cases.filter(c=>c.pass).length}));
  await page.goto(`http://127.0.0.1:${port}/legacy-combat.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__BOOTED===true,null,{timeout:60000});
  row.motionObserved=await page.evaluate(()=>({osRequestsReduction:matchMedia('(prefers-reduced-motion: reduce)').matches,graphicsReduced:document.body.classList.contains('reduced-graphics')}));
  assert.equal(row.motionObserved.osRequestsReduction,motion==='reduce');
  assert.equal(await page.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnit),'undefined');
  if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await page.locator('#tutorial [data-action="skip"]').click();
  await page.locator('#menu [data-d="auto"]').click();await page.locator('#menu [data-d="start"]').click();
  await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy&&window.G.active?.team==='player',null,{timeout:60000});
  row.before=await truth();
  await page.locator('#menu [data-a="move"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>window.G.mode),'move');
  const cells=await page.evaluate(()=>window.G.grid.flat().filter(c=>c.walkable).map(c=>({gx:c.gx,gz:c.gz})));
  assert.equal(cells.length,32,'Standalone grid shape changed: review the scenario');
  row.moveHits=await scan(cells);assertHits(row.moveHits);assert.deepEqual(await truth(),row.before,'Hover mutated tactical truth');
  await writeFile(resolve(output,'progress.json'),JSON.stringify({at:new Date().toISOString(),width,height,motion,stage:'move-hit-pass',completed:report.cases.filter(c=>c.pass).length}));
  const name=`${width}-${height}-${motion}-move.png`;await page.screenshot({path:resolve(output,name)});row.captures.push(name);
  await page.locator('#panel .stats-toggle').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#panel .stats-toggle').getAttribute('aria-expanded'),'true');
  row.expandedHits=await scan(cells);assertHits(row.expandedHits);assert.deepEqual(await truth(),row.before);
  row.panel=await page.locator('#panel').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,overflow:getComputedStyle(e).overflow};});
  const expanded=`${width}-${height}-${motion}-expanded.png`;await page.screenshot({path:resolve(output,expanded)});row.captures.push(expanded);
  await page.locator('#panel .stats-toggle').focus();await page.keyboard.press('Enter');
  const destination=await page.evaluate(()=>{const g=window.G;return g.reach.list.filter(c=>!g.grid[c.gx][c.gz].occupant).sort((a,b)=>b.gx-a.gx)[0];});
  assert.ok(destination,'No native movement candidate');
  const point=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),destination);
  await page.mouse.click(point.screenX,point.screenY);
  await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy,null,{timeout:30000});
  row.moved=await truth();assert.equal(row.moved.active,row.before.active);assert.equal(row.moved.moved,true);
  assert.deepEqual(await page.evaluate(()=>({gx:window.G.active.gx,gz:window.G.active.gz})),{gx:destination.gx,gz:destination.gz});
  await page.locator('#menu [data-a="undo"]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy&&!window.G.movedThisTurn,null,{timeout:30000});
  row.undone=await truth();assert.deepEqual(row.undone,row.before,'Native undo changed tactical truth');
  await page.locator('#menu [data-a="attack"]').first().focus();await page.keyboard.press('Enter');
  await page.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)').first().focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>window.G.mode),'target');
  row.targetHits=await scan(cells);assertHits(row.targetHits);assert.deepEqual(await truth(),row.before,'Target preview mutated tactical truth');
  await writeFile(resolve(output,'progress.json'),JSON.stringify({at:new Date().toISOString(),width,height,motion,stage:'target-hit-pass',completed:report.cases.filter(c=>c.pass).length}));
  await page.locator('body').press('Escape');assert.equal(await page.evaluate(()=>window.G.mode),'menu');
  assert.deepEqual(await truth(),row.before);
  await page.locator('#menu [data-a="move"]').click();await page.mouse.click(point.screenX,point.screenY);
  await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy,null,{timeout:30000});
  const attackBefore=await truth();
  await page.locator('#menu [data-a="attack"]').first().click();await page.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)').last().click();
  const target=await page.evaluate(()=>{const g=window.G;return g.pending?.centers.find(c=>g.grid[c.gx][c.gz].occupant?.alive&&g.grid[c.gx][c.gz].occupant.team==='foe');});
  assert.ok(target,'Native movement did not reach an actual attack target');
  const targetPoint=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),target);
  await page.mouse.click(targetPoint.screenX,targetPoint.screenY);await page.waitForFunction(()=>window.G.over||window.G.mode==='menu'&&!window.G.busy,null,{timeout:30000});
  row.nativeAttack={target,before:attackBefore,after:await truth()};
  const attacker=row.nativeAttack.after.units.find(u=>u.id===attackBefore.active);
  assert.ok(attacker.ap<attackBefore.units.find(u=>u.id===attackBefore.active).ap,'Native target click did not spend AP');
  row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.equal(row.overflow,0);
  row.pass=true;console.log(`GRID ${width} ${motion} PASS`);await page.close();
 }
 assert.deepEqual(report.errors,[]);report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;if(page)await page.screenshot({path:resolve(output,'failure.png')}).catch(()=>{});console.error(error.stack);}
finally{await browser.close();await new Promise(r=>server.httpServer.close(r));report.endedAt=new Date().toISOString();await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');job.finish(report);}
