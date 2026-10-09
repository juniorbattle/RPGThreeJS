/** Actual Tab/cell inputs against built combat. No combat-state or outcome writes. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {beginJob} from './qa/qa-job.mjs';
const movementMotion=process.env.BATTLEFIELD_QA_MOVEMENT==='1';
export const parameters={viewports:[[1366,768],[620,780],[390,844]],motionModes:['no-preference','reduce'],movementMotion};
export const requiredAssertions=['ACTUAL_TAB_BATTLEFIELD','TRANSIENT_CURSOR_ONLY','MODIFIER_CHORD_NON_INTERFERENCE','NATIVE_INVALID_AND_LEGAL_MOVE','NATIVE_TARGET_EXECUTION','CANCEL_AND_RETURN_FOCUS','NATIVE_CONTROLS','POINTER_REGRESSION',...(movementMotion?['ORDINARY_MOVE_LIVE_OS_REDUCTION','UNCHANGED_MOVEMENT_COMPLETION']:[])];
const output=process.env.BATTLEFIELD_QA_OUTPUT??'tmp/demo/battlefield-keyboard-production';
const port=Number(process.env.BATTLEFIELD_QA_PORT??5275);
const job=beginJob({driver:'tools/combat-battlefield-keyboard-production-qa.mjs',output,port,parameters,requiredAssertions,jobId:process.env.BATTLEFIELD_QA_JOB_ID});
const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser=await chromium.launch({headless:true});
const report={schemaVersion:1,method:'ACTUAL_TAB_NATIVE_BUILT_STANDALONE',runtimeMutated:false,outcomeInjected:false,fixtureStateWritten:false,campaignAcceptance:false,errors:[],cases:[],pass:false};
try{
  for(const [width,height] of parameters.viewports)for(const reducedMotion of parameters.motionModes){
    const context=await browser.newContext({viewport:{width,height},reducedMotion});
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
    const entry={width,height,reducedMotion,inputs:[],checks:[],captures:[],pass:false};report.cases.push(entry);
    const read=()=>page.evaluate(()=>({mode:G.mode,busy:G.busy,over:G.over,round:G.round,turnIdx:G.turnIdx,moved:G.movedThisTurn,basicAttacks:G.basicAttacksThisTurn,
      active:G.active&&{id:G.active.id,gx:G.active.gx,gz:G.active.gz,ap:G.active.ap,team:G.active.team},
      units:G.units.map(u=>({id:u.id,gx:u.gx,gz:u.gz,hp:u.hp,ap:u.ap,alive:u.alive,statuses:{...u.statuses}})),inventory:{...G.inv},
      focus:document.activeElement?.id||document.activeElement?.getAttribute('data-a')||document.activeElement?.tagName}));
    const truth=s=>({round:s.round,turnIdx:s.turnIdx,moved:s.moved,basicAttacks:s.basicAttacks,active:s.active,units:s.units,inventory:s.inventory});
    const unchanged=async(before,label)=>{assert.deepEqual(truth(await read()),truth(before),label);entry.checks.push(label);};
    async function key(value){await page.keyboard.press(value);entry.inputs.push({key:value});}
    async function modifierChords(label){
      const snapshot=async()=>({state:await read(),presentation:await page.evaluate(()=>({
        cursor:{gx:document.querySelector('#combat-battlefield').dataset.cursorGx,gz:document.querySelector('#combat-battlefield').dataset.cursorGz},
        pending:G.pending?{spec:JSON.parse(JSON.stringify(G.pending.spec)),centers:G.pending.centers.map(c=>({gx:c.gx,gz:c.gz})),keys:[...G.pending.keys].sort()}:null,
        announcement:document.querySelector('#combat-cell-status').textContent,
        submenuHidden:document.querySelector('#skillmenu').classList.contains('hidden')
      }))});
      const before=await snapshot();
      for(const modifier of ['Control','Alt','Meta','Control+Alt','Meta+Shift'])for(const input of ['ArrowRight','Enter','Space','Escape','a','m','u']){
        await page.evaluate(()=>{
          window.__modifierDelivered=null;
          window.addEventListener('keydown',function observe(e){
            if(['Control','Alt','Meta','Shift'].includes(e.key))return;
            window.__modifierDelivered={key:e.key,ctrl:e.ctrlKey,alt:e.altKey,meta:e.metaKey,shift:e.shiftKey,prevented:e.defaultPrevented,target:e.target?.id};
            window.removeEventListener('keydown',observe);
          });
        });
        const chord=modifier+'+'+input;await key(chord);
        const delivered=await page.evaluate(()=>window.__modifierDelivered);
        assert.ok(delivered&&(delivered.ctrl||delivered.alt||delivered.meta),'Modifier chord must reach the page: '+chord);
        assert.equal(delivered.target,'combat-battlefield','Modifier chord must reach the focused battlefield');
        assert.equal(delivered.prevented,false,'Combat must leave modifier chord unclaimed: '+chord);
        assert.deepEqual(await snapshot(),before,label+': '+chord+' changed native state/cursor/action/focus');
        entry.inputs.at(-1).delivered=delivered;
      }
      entry.checks.push(label+' modifier chords preserve native state/cursor/action/focus');
    }
    async function tabTo(selector){
      const control=page.locator(selector).first();await control.waitFor({state:'visible'});
      for(let step=0;step<70;step++){
        if(await control.evaluate(e=>e===document.activeElement))return;
        await key('Tab');
      }
      throw Error('Native Tab could not reach '+selector);
    }
    async function activate(selector,keyValue='Enter'){await tabTo(selector);await key(keyValue);}
    async function nav(cell){
      assert.equal(await page.locator('#combat-battlefield').evaluate(e=>e===document.activeElement),true,'Canvas must own cell navigation');
      const pos=await page.locator('#combat-battlefield').evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)}));
      for(let n=pos.gx;n<cell.gx;n++)await key('ArrowRight');
      for(let n=pos.gx;n>cell.gx;n--)await key('ArrowLeft');
      for(let n=pos.gz;n<cell.gz;n++)await key('ArrowDown');
      for(let n=pos.gz;n>cell.gz;n--)await key('ArrowUp');
      assert.deepEqual(await page.locator('#combat-battlefield').evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)})),{gx:cell.gx,gz:cell.gz});
    }
    async function focusDock(label){
      assert.equal(await page.evaluate(()=>document.activeElement?.matches('#menu button:not(:disabled)')),true,label);
      const b=await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,outline:s.outlineStyle};});
      assert.ok(b.x>=0&&b.y>=0&&b.right<=width+1&&b.bottom<=height+1,'Focused dock control clipped');
      if(width<=620)assert.ok(b.width>=44&&b.height>=44,'Dock touch target too small');
      entry.checks.push(label);
    }
    async function capture(name){
      await page.evaluate(()=>document.fonts.ready);
      const file=`${width}-${reducedMotion}-${name}.png`;await page.screenshot({path:resolve(output,file)});entry.captures.push(file);
    }
    async function startMovementProbe(destination) {
      await page.evaluate(destination => {
        const u=G.active, samples=[], baseline={spriteX:Math.abs(u.spr.scale.x),spriteY:u.spr.scale.y,outlineX:Math.abs(u.outline.scale.x),outlineY:u.outline.scale.y};
        const path=[],origin={gx:u.gx,gz:u.gz};let cursor=destination;
        for(let guard=0;guard<200;guard++){
          const c=G.grid[cursor.gx][cursor.gz];path.unshift({gx:c.gx,gz:c.gz,x:c.mesh.position.x,y:c.topY,z:c.mesh.position.z});
          if(cursor.gx===origin.gx&&cursor.gz===origin.gz)break;
          const prev=G.reach.prev[cursor.gx+','+cursor.gz];if(!prev)throw Error('Native move path missing');cursor={gx:prev[0],gz:prev[1]};
        }
        const probe=window.__ordinaryMovementProbe={samples,baseline,path,started:false,done:false};
        function terrainAt(x,z){
          let nearest={distance:Infinity,y:0};
          for(let i=1;i<path.length;i++){
            const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
            const distance=Math.hypot(x-(a.x+t*dx),z-(a.z+t*dz));if(distance<nearest.distance)nearest={distance,y:a.y+t*(b.y-a.y)};
          }
          return nearest;
        }
        function observe() {
          if(G.busy)probe.started=true;
          if(probe.started&&!G.busy){probe.done=true;return;}
          if(probe.started)samples.push({time:performance.now(),effective:document.body.classList.contains('reduced-graphics'),os:matchMedia('(prefers-reduced-motion: reduce)').matches,requested:window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics,
            terrain:terrainAt(u.grp.position.x,u.grp.position.z),x:u.grp.position.x,y:u.grp.position.y,z:u.grp.position.z,tilt:u.spr.rotation.z,scaleX:Math.abs(u.spr.scale.x),scaleY:u.spr.scale.y,outlineTilt:u.outline.rotation.z,outlineX:Math.abs(u.outline.scale.x),outlineY:u.outline.scale.y});
          requestAnimationFrame(observe);
        }
        requestAnimationFrame(observe);
      },destination);
    }
    async function finishMovementProbe() {
      await page.waitForFunction(()=>window.__ordinaryMovementProbe.done);
      const probe=await page.evaluate(()=>window.__ordinaryMovementProbe);
      entry.ordinaryMovement=probe;
      assert.ok(probe.samples.length>=3,'Native move needs multiple rendered samples');
      assert.ok(probe.samples.some(s=>s.effective)&&probe.samples.some(s=>!s.effective),'Live OS change must reach both movement modes');
      assert.ok(probe.samples.every(s=>s.requested===false),'Game preference must remain normal throughout movement');
      const initialReduced=reducedMotion==='reduce',first=probe.samples[0],last=probe.samples.at(-1);
      assert.equal(first.os,initialReduced);assert.equal(first.effective,initialReduced);
      assert.equal(last.os,!initialReduced);assert.equal(last.effective,!initialReduced);
      const reduced=probe.samples.filter((s,i)=>s.effective&&s.os&&(i===0||(probe.samples[i-1].effective&&probe.samples[i-1].os)));
      assert.ok(reduced.length>=2,'Reduced motion needs successive rendered movement samples');
      for(const s of reduced){
        assert.ok(s.terrain.distance<1e-6&&Math.abs(s.y-s.terrain.y)<1e-6,'Reduced movement leaves native path terrain line');
        assert.ok(Math.abs(s.tilt)<1e-6&&Math.abs(s.outlineTilt)<1e-6,'Reduced movement retains decorative tilt');
        assert.ok(Math.abs(s.scaleX-probe.baseline.spriteX)<1e-6&&Math.abs(s.scaleY-probe.baseline.spriteY)<1e-6,'Reduced movement retains sprite squash');
        assert.ok(Math.abs(s.outlineX-probe.baseline.outlineX)<1e-6&&Math.abs(s.outlineY-probe.baseline.outlineY)<1e-6,'Reduced movement retains outline squash');
      }
      assert.ok(probe.samples.some(s=>!s.effective&&!s.os&&(Math.abs(s.tilt)>1e-4||Math.abs(s.scaleY-probe.baseline.spriteY)>1e-4)),'Normal movement decoration was lost');
      await page.emulateMedia({reducedMotion});
    }

    await page.goto(`http://127.0.0.1:${port}/legacy-combat.html`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__BOOTED);
    entry.motion=await page.evaluate(()=>({os:matchMedia('(prefers-reduced-motion: reduce)').matches,requested:window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics,effective:document.body.classList.contains('reduced-graphics')}));
    assert.equal(entry.motion.os,reducedMotion==='reduce');assert.equal(entry.motion.requested,false,'OS-only case needs normal requested game graphics');assert.equal(entry.motion.effective,entry.motion.os||entry.motion.requested);
    assert.equal(await page.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnitNextToEnemy),'undefined','Production mutation helper exposed');
    if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await activate('#tutorial [data-action="skip"]');
    await activate('#menu [data-unit]');
    const zone=await page.evaluate(()=>G.deployZone.find(c=>!c.occupant));
    await tabTo('#combat-battlefield');await nav(zone);
    const deploymentBefore=await read();await key('Enter');
    assert.equal((await read()).units.filter(u=>u.alive).length,deploymentBefore.units.filter(u=>u.alive).length+1,'Native keyboard placement');
    await modifierChords('Deployment occupied cell');
    await key('Enter');assert.equal((await read()).units.length,deploymentBefore.units.length,'Native keyboard removal');entry.checks.push('Native manual keyboard deployment/removal');
    await activate('#menu [data-d="auto"]');await activate('#menu [data-d="start"]');
    await page.waitForFunction(()=>G.mode==='menu'&&!G.busy&&G.active?.team==='player');
    await tabTo('#combat-battlefield');
    const focus=await page.locator('#combat-battlefield').evaluate(e=>({focused:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth,described:e.getAttribute('aria-describedby')}));
    assert.ok(focus.focused&&focus.outline!=='none'&&focus.width==='3px'&&focus.described.includes('combat-cell-status'));
    await key('Shift+Tab');assert.notEqual((await read()).focus,'combat-battlefield');await key('Tab');assert.equal((await read()).focus,'combat-battlefield');
    entry.checks.push('Actual Tab/Shift+Tab canvas entry/exit with visible focus');
    const inspectionBefore=await read();await nav({gx:0,gz:0});await key('ArrowLeft');await key('ArrowUp');
    await nav({gx:7,gz:3});await key('ArrowRight');await key('ArrowDown');
    await unchanged(inspectionBefore,'Grid edges/arrows preserve all tactical truth');
    const occupant=inspectionBefore.units.find(u=>u.alive);await nav(occupant);await key('Enter');await key('Space');await unchanged(inspectionBefore,'Canvas inspection Enter/Space never ends a turn');
    assert.ok((await page.locator('#combat-cell-status').textContent()).includes('PV'));
    await modifierChords('Menu inspection');
    await capture('inspection-focus');
    await activate('#menu [data-a="move"]');assert.equal((await read()).focus,'combat-battlefield');
    const beforeInvalid=await read();await nav(beforeInvalid.active);await key('Enter');await unchanged(beforeInvalid,'Origin-cell Enter cannot move or spend AP');
    assert.match(await page.locator('#combat-cell-status').textContent(),/indisponible/);
    await key('Escape');await focusDock('Escape restores enabled dock focus');
    await activate('#menu [data-a="move"]');
    const destination=await page.evaluate(()=>G.reach.list.filter(c=>c.gx!==G.active.gx||c.gz!==G.active.gz).sort((a,b)=>{
      const distance=c=>Math.min(...G.units.filter(u=>u.alive&&u.team==='foe').map(u=>Math.abs(c.gx-u.gx)+Math.abs(c.gz-u.gz)));return distance(a)-distance(b);
    })[0]);assert.ok(destination,'No native reachable destination');
    await nav(destination);await capture('move-cursor');
    await modifierChords('Legal move cursor');
    if(movementMotion){
      assert.ok(Math.abs(destination.gx-inspectionBefore.active.gx)+Math.abs(destination.gz-inspectionBefore.active.gz)>=3,'Live movement proof needs a multi-step native path');
      await startMovementProbe(destination);
    }
    await key('Enter');
    if(movementMotion){
      await page.waitForFunction(()=>G.busy&&window.__ordinaryMovementProbe.samples.length>=2);
      await page.emulateMedia({reducedMotion:reducedMotion==='reduce'?'no-preference':'reduce'});
    }
    await page.waitForFunction(()=>G.mode==='menu'&&!G.busy);const moved=await read();
    assert.equal(moved.active.gx,destination.gx);assert.equal(moved.active.gz,destination.gz);assert.equal(moved.active.ap,inspectionBefore.active.ap);assert.equal(moved.moved,true);
    await focusDock('Legal native move restores dock focus');entry.checks.push('Exactly one native reachable move');
    if(movementMotion){
      const occupancy=await page.evaluate(({origin,destination})=>({origin:G.grid[origin.gx][origin.gz].occupant?.id??null,destination:G.grid[destination.gx][destination.gz].occupant?.id}),{origin:inspectionBefore.active,destination});
      assert.equal(occupancy.origin,null);assert.equal(occupancy.destination,moved.active.id);assert.equal(moved.busy,false);
      await finishMovementProbe();await capture('move-reduced-settled');entry.checks.push('Live OS movement decoration changes without altering native completion');
    }
    const attackBefore=await read();
    for(const input of ['Enter','Space']){
      await activate('#menu [data-a="attack"]:not(:disabled)',input);await unchanged(attackBefore,'Native attack '+input+' opens submenu only');
      await activate('#skillmenu [data-ch="_back"]',input);await focusDock('Retour restores dock focus');
    }
    await activate('#menu [data-a="attack"]:not(:disabled)');await activate('#skillmenu [data-ch="0"]');
    assert.equal((await read()).focus,'combat-battlefield');assert.equal((await read()).mode,'target');
    const invalid=await page.evaluate(()=>G.grid.flat().find(c=>!G.pending.keys.has(c.gx+','+c.gz)));assert.ok(invalid);
    await nav(invalid);await key('Enter');await unchanged(attackBefore,'Invalid target Enter does not resolve/spend AP');
    await key('Escape');await focusDock('Target Escape restores native attack focus');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.a),'attack');
    await activate('#menu [data-a="attack"]:not(:disabled)');await activate('#skillmenu [data-ch="0"]');
    const target=await page.evaluate(()=>G.pending.centers.find(c=>G.grid[c.gx][c.gz].occupant?.alive&&G.grid[c.gx][c.gz].occupant.team==='foe'));
    assert.ok(target,'No living foe in native attack centers after native approach');
    const spec=await page.evaluate(()=>({key:G.pending.spec.key,ap:G.pending.spec.ap}));entry.target={cell:target,spec,before:await read()};
    await nav(target);await modifierChords('Legal attack target');await capture('target-preview');await key('Enter');await page.waitForFunction(()=>!G.busy&&(G.mode==='menu'||G.over),null,{timeout:60000});
    entry.target.after=await read();assert.equal(entry.target.after.basicAttacks,attackBefore.basicAttacks+1,'One native attack only');
    assert.equal(entry.target.after.active.ap,attackBefore.active.ap-spec.ap,'Native attack AP cost');await focusDock('Native target execution restores enabled dock');
    await capture('target-resolved');entry.checks.push('Native legal foe target resolves once');
    // A fresh native battle gives pointer regression its own earned first-turn AP.
    // The first keyboard attack spent the standalone archer's sole AP; never refill it.
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__BOOTED);
    if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await page.locator('#tutorial [data-action="skip"]').click();
    await page.locator('#menu [data-d="auto"]').click();await page.locator('#menu [data-d="start"]').click();
    await page.waitForFunction(()=>G.mode==='menu'&&!G.busy&&G.active?.team==='player');
    await page.locator('#menu [data-a="move"]').click();
    const pointerDestination=await page.evaluate(()=>G.reach.list.filter(c=>c.gx!==G.active.gx||c.gz!==G.active.gz).sort((a,b)=>{
      const distance=c=>Math.min(...G.units.filter(u=>u.alive&&u.team==='foe').map(u=>Math.abs(c.gx-u.gx)+Math.abs(c.gz-u.gz)));return distance(a)-distance(b);
    })[0]);assert.ok(pointerDestination);
    const pointerMove=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),pointerDestination);
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.screenX,p.screenY)?.id,pointerMove),'combat-battlefield');
    await page.mouse.click(pointerMove.screenX,pointerMove.screenY);await page.waitForFunction(()=>G.mode==='menu'&&!G.busy);
    entry.pointerMethod='FRESH_STANDALONE_NATIVE_AUTO_START_MOVE_ATTACK';entry.inputs.push({pointerMove:pointerDestination});
    const pointerBefore=await read();await page.locator('#menu [data-a="attack"]:not(:disabled)').first().click();await page.locator('#skillmenu [data-ch="0"]').click();
    const pointerTarget=await page.evaluate(()=>G.pending.centers.find(c=>G.grid[c.gx][c.gz].occupant?.alive&&G.grid[c.gx][c.gz].occupant.team==='foe'));assert.ok(pointerTarget);
    const point=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),pointerTarget);
    const hit=await page.evaluate(({screenX,screenY})=>document.elementFromPoint(screenX,screenY)?.id,point);assert.equal(hit,'combat-battlefield','Pointer target covered by UI');
    const pointerCost=await page.evaluate(()=>G.pending.spec.ap);await page.mouse.move(point.screenX,point.screenY);await page.mouse.click(point.screenX,point.screenY);
    await page.waitForFunction(()=>!G.busy&&(G.mode==='menu'||G.over),null,{timeout:60000});const pointerAfter=await read();
    entry.pointer={before:pointerBefore,after:pointerAfter,cost:pointerCost,cell:pointerTarget};
    assert.equal(pointerAfter.basicAttacks,pointerBefore.basicAttacks+1);assert.equal(pointerAfter.active.ap,pointerBefore.active.ap-pointerCost);entry.checks.push('Pointer target resolves through shared native activation');
    const waitBefore=await read();await activate('#menu [data-a="wait"]');await page.waitForFunction(({round,turnIdx})=>G.round!==round||G.turnIdx!==turnIdx,waitBefore);
    assert.equal((await read()).turnIdx,waitBefore.turnIdx+1);entry.checks.push('Native Wait advances one turn');
    assert.deepEqual(report.errors,[]);entry.pass=true;await context.close();
  }
  report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{
  await browser.close();await new Promise(r=>server.httpServer.close(r));report.endedAt=new Date().toISOString();
  await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');job.finish(report);
  console.log(JSON.stringify({pass:report.pass,cases:report.cases.map(c=>({width:c.width,motion:c.reducedMotion,pass:c.pass})),failure:report.failure}));
}
