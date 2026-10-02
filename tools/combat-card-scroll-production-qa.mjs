/** Scoped native inspection scrolling; tactical truth and broad focus acceptance are separate. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {beginJob} from './qa/qa-job.mjs';
const port=Number(process.env.CARD_QA_PORT??5267),output=resolve(process.env.CARD_QA_OUTPUT??'tmp/demo/card-scroll');
const parameters={cases:[[390,844,'no-preference'],[390,844,'reduce'],[390,600,'no-preference'],[560,780,'no-preference'],[620,780,'no-preference'],[620,780,'reduce'],[1366,768,'no-preference'],[1366,768,'reduce']],campaignAcceptance:false};
const job=beginJob({driver:'tools/combat-card-scroll-production-qa.mjs',port,output,parameters,requiredAssertions:['NATIVE_CARD_SCROLL','NATIVE_TOGGLE_FOCUS_RETENTION','FOCUSED_TOGGLE_VISIBLE','CARD_PREVIEW_PRESERVES_TACTICAL_TRUTH','NATIVE_STATUS_AND_APTITUDE_CONTENT']});
const report={pass:false,errors:[],cases:[],runtimeMutationInjected:false,campaignAcceptance:false,focusRetentionAccepted:false};
const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}}),browser=await chromium.launch({headless:true});
let page;
const truth=()=>page.evaluate(()=>({round:window.G.round,turn:window.G.turnIdx,active:window.G.active.id,mode:window.G.mode,units:window.G.units.map(u=>({id:u.id,hp:u.hp,ap:u.ap,gx:u.gx,gz:u.gz,statuses:u.statuses})),inv:{...window.G.inv}}));
try{
 for(const [width,height,motion]of parameters.cases){
  page=await browser.newPage({viewport:{width,height},reducedMotion:motion});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${port}/legacy-combat.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__BOOTED===true,null,{timeout:30000});
  if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await page.locator('#tutorial [data-action="skip"]').click();
  await page.locator('#menu [data-d="auto"]').click();await page.locator('#menu [data-d="start"]').click();await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy&&window.G.active?.team==='player',null,{timeout:60000});
  const row={width,height,motion,pass:false,before:await truth()};report.cases.push(row);
  await page.locator('#menu [data-a="move"]').focus();await page.keyboard.press('Enter');row.moveTruth=await truth();
  await page.locator('#panel .stats-toggle').focus();await page.keyboard.press('Enter');
  row.focusAfterNativeToggle=await page.evaluate(()=>({tag:document.activeElement.tagName,statsToggle:document.activeElement.matches('#panel .stats-toggle')}));
  assert.equal(await page.locator('#panel .stats-toggle').getAttribute('aria-expanded'),'true');
  assert.equal(row.focusAfterNativeToggle.statsToggle,true,'Native toggle rebuild lost keyboard focus');
  row.focusedToggle=await page.locator('#panel .stats-toggle').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('#panel').getBoundingClientRect();return{focused:document.activeElement===e,top:r.top,bottom:r.bottom,left:r.left,right:r.right,panelTop:p.top,panelBottom:p.bottom};});
  assert.equal(row.focusedToggle.focused,true);assert.ok(row.focusedToggle.top>=row.focusedToggle.panelTop&&row.focusedToggle.bottom<=row.focusedToggle.panelBottom);
  row.panel=await page.locator('#panel').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,overflowY:getComputedStyle(e).overflowY,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};});
  assert.equal(row.panel.overflowY,'auto','Current expanded markup must scroll within its cap');
  await page.mouse.move(row.panel.x+row.panel.width-15,row.panel.y+row.panel.height/2);await page.mouse.wheel(0,600);await page.waitForTimeout(100);
  row.lastStat=await page.locator('#panel .du-stat').last().evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('#panel'),b=p.getBoundingClientRect();return{text:e.textContent.trim(),top:r.top,bottom:r.bottom,panelTop:b.top,panelBottom:b.bottom,scrollTop:p.scrollTop};});
  if(row.panel.scrollHeight>row.panel.clientHeight)assert.ok(row.lastStat.scrollTop>0);
  assert.ok(row.lastStat.top>=row.lastStat.panelTop&&row.lastStat.bottom<=row.lastStat.panelBottom);
  assert.deepEqual(await truth(),row.moveTruth,'Inspection scrolling changed tactical truth');
  row.capture=`${width}-${height}-${motion}-scrolled.png`;await page.screenshot({path:resolve(output,row.capture)});
  // The toggle remains focused after wheel input; Space must collapse without refocusing it.
  await page.keyboard.press('Space');assert.equal(await page.locator('#panel .stats-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#panel .stats-toggle').evaluate(e=>document.activeElement===e),true);
  await page.keyboard.press('Enter');assert.equal(await page.locator('#panel .stats-toggle').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#panel .stats-toggle').evaluate(e=>document.activeElement===e),true);
  assert.deepEqual(await truth(),row.moveTruth);
  await page.keyboard.press('Escape');
  // Spend the active unit's single initial AP through its real basic attack.
  await page.locator('#menu [data-a="attack"]').first().focus();await page.keyboard.press('Enter');
  await page.locator('#skillmenu [data-ch="0"]').focus();await page.keyboard.press('Enter');
  const cell=await page.evaluate(()=>window.G.pending.centers.find(c=>{const p=window.__qaHelpers.getCellScreenPosition(c.gx,c.gz);return document.elementFromPoint(p.screenX,p.screenY)?.tagName==='CANVAS';}));
  assert.ok(cell,'No native attack center accessible');
  const point=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),cell);await page.mouse.click(point.screenX,point.screenY);
  await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy,null,{timeout:30000});
  row.exhausted=await page.evaluate(()=>({ap:window.G.active.ap,started:window.G.active._hasStartedTurn,statusLabels:[...document.querySelectorAll('#panel .status-chip')].map(e=>e.getAttribute('aria-label'))}));
  assert.equal(row.exhausted.ap,0);assert.equal(row.exhausted.started,true);assert.ok(row.exhausted.statusLabels.includes('Essoufflé'));
  const statusTruth=await truth();await page.locator('#panel .stats-toggle').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#panel .stats-toggle').evaluate(e=>document.activeElement===e),true);assert.deepEqual(await truth(),statusTruth);
  row.statusCapture=`${width}-${height}-${motion}-status.png`;await page.screenshot({path:resolve(output,row.statusCapture)});
  const cleric=await page.evaluate(()=>{const u=window.G.units.find(u=>u.team==='player'&&u.weapons[0]?.weaponType==='crosier');return u&&{gx:u.gx,gz:u.gz};});assert.ok(cleric);
  const clericPoint=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),cleric);await page.mouse.click(clericPoint.screenX,clericPoint.screenY);
  row.aptitude=await page.locator('#panel .du-aptitude').textContent();assert.match(row.aptitude,/Main Bienveillante/);
  const aptitudeTruth=await truth();await page.locator('#panel .stats-toggle').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#panel .stats-toggle').evaluate(e=>document.activeElement===e),true);assert.deepEqual(await truth(),aptitudeTruth);
  row.aptitudeCapture=`${width}-${height}-${motion}-aptitude.png`;await page.screenshot({path:resolve(output,row.aptitudeCapture)});
  row.pass=true;console.log(`CARD ${width}x${height} ${motion} PASS`);await page.close();
 }
 assert.deepEqual(report.errors,[]);report.focusRetentionAccepted=true;report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;if(page)await page.screenshot({path:resolve(output,'failure.png')}).catch(()=>{});console.error(error.stack);}
finally{await browser.close();await new Promise(r=>server.httpServer.close(r));report.endedAt=new Date().toISOString();await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');job.finish(report);}
