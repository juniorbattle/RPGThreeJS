/** Native focused controls must not also invoke battlefield shortcuts. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {beginJob} from './qa/qa-job.mjs';
const output=process.env.KEYBOARD_QA_OUTPUT??'tmp/demo/combat-keyboard-production';
const port=Number(process.env.KEYBOARD_QA_PORT??5262);
const compactSmoke=process.env.KEYBOARD_QA_SCENARIO==='compact-menus';
const parameters={viewports:compactSmoke?[[390,844]]:[[1366,768],[620,780],[390,844]],motionModes:compactSmoke?['reduce']:['no-preference','reduce'],scenario:compactSmoke?'compact-menus':'controls'};
const requiredAssertions=['FOCUSED_NATIVE_ACTIVATION','NO_PARASITIC_END_TURN','BATTLEFIELD_SHORTCUTS',...(compactSmoke?['SUBMENU_TARGET_BOUNDS_AND_SCROLL','OS_OR_GAME_EFFECTIVE_REDUCTION','LIVE_OS_CHANGE_WITHOUT_TACTICAL_MUTATION']:[])];
const job=beginJob({driver:'tools/combat-keyboard-production-qa.mjs',output,port,parameters,requiredAssertions,
  jobId:process.env.KEYBOARD_QA_JOB_ID});
const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser=await chromium.launch({headless:true});
const report={schemaVersion:1,method:'NATIVE_BUILT_STANDALONE_KEYBOARD',runtimeMutated:false,outcomeInjected:false,
  campaignAcceptance:false,errors:[],cases:[],pass:false};
try{
  for(const [width,height] of parameters.viewports)for(const reducedMotion of parameters.motionModes){
    const context=await browser.newContext({viewport:{width,height},reducedMotion});
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    const entry={width,height,reducedMotion,checks:[],pass:false};report.cases.push(entry);
    const state=()=>page.evaluate(()=>({mode:window.G.mode,busy:window.G.busy,round:window.G.round,turnIdx:window.G.turnIdx,
      active:window.G.active&&{id:window.G.active.id,ap:window.G.active.ap,team:window.G.active.team},
      moved:window.G.movedThisTurn,acted:window.G.actedThisTurn,movedBeforeAct:window.G.movedBeforeAct,skillMoved:window.G.skillMovedThisTurn,
      basicAttacks:window.G.basicAttacksThisTurn,itemsUsed:window.G.itemsUsedThisTurn,inventory:window.G.inv,
      units:window.G.units.map(u=>({id:u.id,hp:u.hp,ap:u.ap,alive:u.alive,downed:u.downed,gx:u.gx,gz:u.gz,statuses:u.statuses}))}));
    const unchanged=async(before,label)=>{const after=await state();assert.deepEqual(after,before,label);entry.checks.push(label);};
    async function activate(selector,key='Enter'){
      const control=page.locator(selector).first();await control.focus();
      assert.equal(await control.evaluate(e=>e===document.activeElement),true);
      const bounds=await control.boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height,'Focused control clipped');
      await control.press(key);
    }
    async function inspectSubmenu(action){
      if(!compactSmoke)return;
      const rows=page.locator('#skillmenu button');const measured=[];
      for(let index=0;index<await rows.count();index++){
        const control=rows.nth(index);
        if(await control.isEnabled())await control.focus();
        const bounds=await control.evaluate(e=>{const r=e.getBoundingClientRect(),m=e.closest('#skillmenu'),b=m.getBoundingClientRect(),s=getComputedStyle(e);return{text:e.textContent.trim(),disabled:e.disabled,focused:e===document.activeElement,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,menuTop:b.top+m.clientTop,menuBottom:b.top+m.clientTop+m.clientHeight,scrollTop:m.scrollTop,outline:s.outlineStyle};});
        assert.ok(bounds.width>=44&&bounds.height>=44,'Submenu touch target below44px');
        if(!bounds.disabled){
          assert.ok(bounds.focused&&bounds.outline!=='none','Submenu focus not visible');
          assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width+1&&bounds.bottom<=height+1,'Submenu control outside viewport');
          assert.ok(bounds.y>=bounds.menuTop-1&&bounds.bottom<=bounds.menuBottom+1,'Focused submenu row clipped by scroll container');
        }
        measured.push(bounds);
      }
      assert.equal(measured.at(-1)?.text,'Retour');assert.equal(measured.at(-1)?.focused,true);
      entry.submenus??=[];entry.submenus.push({action,buttons:measured});
      await page.screenshot({path:resolve(output,`${width}-${reducedMotion}-${action}-retour.png`)});
    }
    await page.goto(`http://127.0.0.1:${port}/legacy-combat.html`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__BOOTED);
    if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await activate('#tutorial [data-action="skip"]');
    await activate('#menu [data-d="auto"]');await activate('#menu [data-d="start"]');
    await page.waitForFunction(()=>window.G.mode==='menu'&&!window.G.busy&&window.G.active?.team==='player');
    const before=await state();entry.before=before;
    if(compactSmoke){
      const sample=()=>page.evaluate(()=>({os:matchMedia('(prefers-reduced-motion: reduce)').matches,requested:window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics,effective:window.__COMBAT_DIAGNOSTICS.reducedGraphics,body:document.body.classList.contains('reduced-graphics'),spriteY:G.active.spr.position.y,baseY:G.active.baseY}));
      await page.waitForFunction(()=>window.__COMBAT_DIAGNOSTICS?.reducedGraphics===true);
      const reduced=[];for(let index=0;index<4;index++){await page.waitForTimeout(100);reduced.push(await sample());}
      assert.ok(reduced.every(s=>s.os&&!s.requested&&s.effective&&s.body&&s.spriteY===s.baseY),'OS-only reduction or stable idle sprite missing');
      await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>window.__COMBAT_DIAGNOSTICS.reducedGraphics===false);
      const normal=[];for(let index=0;index<4;index++){await page.waitForTimeout(100);normal.push(await sample());}
      assert.ok(normal.every(s=>!s.os&&!s.requested&&!s.effective&&!s.body));assert.ok(new Set(normal.map(s=>s.spriteY)).size>1,'Normal idle motion unexpectedly frozen');
      await activate('#settings-btn');await activate('#settings [data-s="fxhd"]');await page.waitForFunction(()=>window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics===true&&window.__COMBAT_DIAGNOSTICS.reducedGraphics===true);
      entry.gameOnly=await sample();assert.equal(entry.gameOnly.os,false);assert.equal(entry.gameOnly.body,true);
      await page.emulateMedia({reducedMotion:'reduce'});await activate('#settings [data-s="fxhd"]');await page.waitForFunction(()=>window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics===false&&window.__COMBAT_DIAGNOSTICS.reducedGraphics===true);
      assert.equal(await page.locator('#settings [data-s="fxhd"]').getAttribute('aria-checked'),'true','Checkbox should retain game request');
      await activate('#settings-btn');entry.motion={reduced,normal,restored:await sample()};
      assert.equal(entry.motion.restored.body,true);await unchanged(before,'Live OS/game settings preserve tactical state');
    }
    for(const key of ['Enter','Space']){
      await activate('#menu [data-a="attack"]:not(:disabled)',key);
      await page.locator('#skillmenu:not(.hidden) [data-ch="0"]').waitFor({state:'visible'});
      if(key==='Enter')await inspectSubmenu('attack');
      await unchanged(before,'Attack '+key+' opens submenu without ending turn');
      await activate('#skillmenu [data-ch="0"]',key);
      assert.equal((await state()).mode,'target');assert.equal((await state()).active.id,before.active.id);
      await page.locator('body').press('Escape');await unchanged(before,'Escape cancels native target');
    }
    await activate('#menu [data-a="attack"]:not(:disabled)');
    await activate('#skillmenu [data-ch="_back"]');await unchanged(before,'Native Retour preserves turn');
    for(const action of ['skill','item']){
      const menu=page.locator(`#menu [data-a="${action}"]:not(:disabled)`);
      if(compactSmoke)assert.equal(await menu.count(),1,'Compact smoke requires native '+action+' menu');
      if(await menu.count()){
        await activate(`#menu [data-a="${action}"]:not(:disabled)`);await unchanged(before,action+' Enter preserves turn');
        await inspectSubmenu(action);
        await activate(`#skillmenu [${action==='skill'?'data-s':'data-i'}="_back"]`);
        await unchanged(before,action+' Retour preserves turn');
      }
    }
    await page.locator('#combat-battlefield').focus();
    await page.locator('body').press('a');await page.locator('#skillmenu:not(.hidden)').waitFor({state:'visible'});
    await page.locator('body').press('Escape');await unchanged(before,'Battlefield A and Escape preserved');
    await page.locator('body').press('m');assert.equal((await state()).mode,'move');
    await page.locator('body').press('Escape');await unchanged(before,'Battlefield M and Escape preserved');
    await page.locator('#menu [data-a="attack"]').first().focus();
    await page.screenshot({path:resolve(output,`${width}-${reducedMotion}-focused.png`)});
    await activate('#menu [data-a="wait"]');
    await page.waitForFunction(({round,turnIdx})=>window.G.round!==round||window.G.turnIdx!==turnIdx,before);
    entry.afterWait=await state();assert.equal(entry.afterWait.turnIdx,before.turnIdx+1,'Wait advanced more than one turn');
    entry.checks.push('Native Wait advances exactly one turn');
    entry.pass=true;await context.close();
  }
  assert.deepEqual(report.errors,[]);report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{
  await browser.close();await new Promise(r=>server.httpServer.close(r));report.endedAt=new Date().toISOString();
  await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');job.finish(report);
  console.log(JSON.stringify({pass:report.pass,cases:report.cases.map(c=>({width:c.width,motion:c.reducedMotion,pass:c.pass})),failure:report.failure}));
}
