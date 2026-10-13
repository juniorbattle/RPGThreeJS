import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {resolve,relative,isAbsolute} from 'node:path';
import {beginJob} from './qa/qa-job.mjs';
const castMotion=process.env.SALVATION_QA_CAST_MOTION==='1';
const parameters={viewport:[1366,768],timeoutMinutes:8,castMotion};
const requiredAssertions=['NATIVE_SALVATION_40_PERCENT','NATIVE_SALVATION_2_AP_COST',...(castMotion?['LIVE_OS_CAST_BASELINE','NATIVE_CAST_COMPLETION_AFTER_TOGGLES']:[])];
const output=resolve(process.env.SALVATION_QA_OUTPUT??'tmp/demo/salvation-production-smoke');
const port=Number(process.env.SALVATION_QA_PORT??5257);
const rel=relative(resolve('tmp'),output);
if(isAbsolute(rel)||rel.startsWith('..'))throw new Error('Output must stay in ignored tmp/');
const job=castMotion?beginJob({driver:'tools/combat-salvation-production-qa.mjs',output,port,parameters,requiredAssertions,jobId:process.env.SALVATION_QA_JOB_ID}):null;
if(!job)await mkdir(output);
const server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'no-preference'});
const report={method:'BUILT_PRODUCTION_STANDALONE_COMBAT_NATIVE_INPUTS_AUTHORED_DEFAULT_PARTY',campaignAcceptance:false,fixtureStateWritten:false,runtimeMutated:false,outcomeInjected:false,errors:[],actions:[],pass:false};
report.bundleHashes=await Promise.all((await readdir('dist/assets')).filter(n=>/^combat-.*\.js$/.test(n)).map(async n=>({file:n,sha256:createHash('sha256').update(await readFile('dist/assets/'+n)).digest('hex')})));
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
const state=()=>page.evaluate(()=>{const g=window.G;return{mode:g.mode,busy:g.busy,over:g.over,round:g.round,active:g.active&&{id:g.active.id,kind:g.active.kind,team:g.active.team,hp:g.active.hp,maxhp:g.active.maxhp,ap:g.active.ap,gx:g.active.gx,gz:g.active.gz},units:g.units.map(u=>({id:u.id,name:u.name,team:u.team,hp:u.hp,maxhp:u.maxhp,gx:u.gx,gz:u.gz,alive:u.alive}))};});
async function startCastProbe(){
  await page.evaluate(()=>{
    if(window.__castMotionProbe)window.__castMotionProbe.done=true;
    const u=G.active,probe=window.__castMotionProbe={samples:[],phaseHistory:[],baseline:{y:G.grid[u.gx][u.gz].topY,spriteX:Math.abs(u.spr.scale.x),spriteY:u.spr.scale.y,outlineX:Math.abs(u.outline.scale.x),outlineY:u.outline.scale.y},started:false,done:false};
    function observe(){
      if(probe.done)return;
      if(u._motionPlaying&&!probe.started){probe.started=true;const sign=u.spriteFacing*(u.visualFacingX<0?-1:1);probe.baseline.spriteX=sign*probe.baseline.spriteX;probe.baseline.outlineX=sign*probe.baseline.outlineX;}
      if(probe.started&&!G.busy){probe.done=true;return;}
      if(probe.started){const sample={at:performance.now(),moving:!!u._motionPlaying,effective:document.body.classList.contains('reduced-graphics'),os:matchMedia('(prefers-reduced-motion: reduce)').matches,requested:window.__COMBAT_DIAGNOSTICS.requestedReducedGraphics,y:u.grp.position.y,spriteX:u.spr.scale.x,spriteY:u.spr.scale.y,outlineX:u.outline.scale.x,outlineY:u.outline.scale.y};
        const previous=probe.samples.at(-1);if(!previous||previous.os!==sample.os||previous.effective!==sample.effective)probe.phaseHistory.push({at:sample.at,index:probe.samples.length,os:sample.os,effective:sample.effective});probe.samples.push(sample);}
      requestAnimationFrame(observe);
    }requestAnimationFrame(observe);
  });
}
async function toggleCastProbe(){
  await page.waitForFunction(()=>{const p=window.__castMotionProbe,s=p.samples.at(-1);if(!p.done&&s?.moving&&!s.effective&&!s.os&&s.y>p.baseline.y+1e-4){p.firstReducedFrom=p.samples.length;return true;}return false;},null,{timeout:10000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>{const p=window.__castMotionProbe;if(p.samples.slice(p.firstReducedFrom).filter(s=>s.moving&&s.effective&&s.os).length>=3){p.normalAgainFrom=p.samples.length;return true;}return false;},null,{timeout:4000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>{const p=window.__castMotionProbe;if(p.samples.slice(p.normalAgainFrom).some(s=>s.moving&&!s.effective&&!s.os)){p.finalReducedFrom=p.samples.length;return true;}return false;},null,{timeout:4000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>{const p=window.__castMotionProbe;return p.samples.slice(p.finalReducedFrom).filter(s=>s.moving&&s.effective&&s.os).length>=3;},null,{timeout:4000});
  report.castCaptureObservation=await page.evaluate(()=>({moving:!!G.active?._motionPlaying,busy:G.busy,effective:document.body.classList.contains('reduced-graphics'),os:matchMedia('(prefers-reduced-motion: reduce)').matches}));
  await page.screenshot({path:output+'/cast-live-os-reduced.png'});
}
async function finishCastProbe(){
  await page.waitForFunction(()=>window.__castMotionProbe.done,null,{timeout:30000});
  const p=await page.evaluate(()=>window.__castMotionProbe),b=p.baseline;
  assert.ok(p.samples.every(s=>s.requested===false),'Game reduction must remain false');
  const reduced=p.samples.filter((s,i)=>i>0&&s.moving&&s.effective&&s.os&&p.samples[i-1].effective&&p.samples[i-1].os);
  assert.ok(reduced.length>=2,'Need consecutive rendered reduced cast samples');
  assert.ok(reduced.filter(s=>p.samples.indexOf(s)>=p.finalReducedFrom).length>=2,'Final OS reduction needs its own consecutive moving samples');
  for(const s of reduced){assert.ok(Math.abs(s.y-b.y)<1e-6,'Reduced caster lift remains');assert.ok(Math.abs(s.spriteX-b.spriteX)<1e-6&&Math.abs(s.spriteY-b.spriteY)<1e-6,'Reduced caster squash remains');assert.ok(Math.abs(s.outlineX-b.outlineX)<1e-6&&Math.abs(s.outlineY-b.outlineY)<1e-6,'Reduced outline squash remains');}
  assert.ok(p.samples.some(s=>s.moving&&!s.effective&&!s.os&&s.y>b.y+1e-4),'Normal caster lift was lost');
  report.castMotion=p;await page.emulateMedia({reducedMotion:'no-preference'});
}
async function cell(c){const p=await page.evaluate(c=>window.__qaHelpers.getCellScreenPosition(c.gx,c.gz),c);for(const [dx,dy]of[[0,0],[8,0],[-8,0],[0,8],[0,-8]]){const x=p.screenX+dx,y=p.screenY+dy;await page.mouse.move(x,y);await page.waitForTimeout(30);if(await page.evaluate(({x,y,gx,gz})=>document.elementFromPoint(x,y)?.tagName==='CANVAS'&&window.G.hover?.gx===gx&&window.G.hover?.gz===gz,{x,y,...c})){await page.mouse.click(x,y);return true;}}return false;}
async function cancel(){await page.keyboard.press('Escape');}
async function settle(){await page.waitForFunction(()=>window.G.over||!window.G.busy&&window.G.mode==='menu',null,{timeout:30000});}
try{
  await page.goto(`http://127.0.0.1:${port}/legacy-combat.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__BOOTED===true);
  assert.equal(await page.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnit),'undefined');
  if(await page.locator('#tutorial:not(.hidden) [data-action="skip"]').isVisible())await page.locator('#tutorial [data-action="skip"]').click();
  await page.locator('#menu [data-d="auto"]').click();await page.locator('#menu [data-d="start"]').click();
  const deadline=Date.now()+8*60*1000;
  for(let i=0;i<80&&Date.now()<deadline;i++){
    await page.waitForFunction(()=>window.G.over||window.G.mode==='menu'&&!window.G.busy&&window.G.active?.team==='player',null,{timeout:60000});
    const before=await state();if(before.over)break;
    console.log(`SMOKE ${i} ${before.active.kind} AP${before.active.ap}`);
    if(before.active.ap>2&&before.active.kind==='cleric'){
      await page.locator('#menu [data-a="skill"]').click();const option=page.locator('#skillmenu [data-s="w_salvation"]:not(:disabled)');
      if(await option.count()){
        await option.click();const pending=await page.evaluate(()=>window.G.pending&&({spec:window.G.pending.spec,centers:window.G.pending.centers}));
        const target=before.units.find(u=>u.alive&&u.team==='player'&&u.hp<u.maxhp&&pending?.centers.some(c=>c.gx===u.gx&&c.gz===u.gz));
        if(target){
          await page.screenshot({path:output+'/before-salvation.png'});
          if(castMotion)await startCastProbe();
          const clicked=await cell(target);
          if(!clicked&&castMotion)await page.evaluate(()=>{window.__castMotionProbe.done=true;});
          if(clicked){
            if(castMotion)await toggleCastProbe();
            await settle();if(castMotion)await finishCastProbe();const after=await state(),healed=after.units.find(u=>u.id===target.id);
            report.salvation={targetId:target.id,spec:pending.spec,before,after,expected:Math.min(target.maxhp,target.hp+Math.round(target.maxhp*.4))};
            assert.equal(pending.spec.healPercent,.4);assert.equal(healed.hp,report.salvation.expected);assert.equal(pending.spec.ap,2);
            assert.equal(after.active.id,before.active.id);assert.equal(after.active.ap,before.active.ap-2);
            await page.screenshot({path:output+'/after-salvation.png'});assert.deepEqual(report.errors,[]);report.pass=true;break;
          }
        }
      }await cancel();
    }
    if(before.active.ap>0&&await page.locator('#menu [data-a="attack"]:not(:disabled)').count()){
      await page.locator('#menu [data-a="attack"]:not(:disabled)').first().click();await page.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)').last().click();
      const targets=await page.evaluate(()=>{const g=window.G;return(g.pending?.centers??[]).filter(c=>g.grid[c.gx][c.gz].occupant?.team==='foe').map(c=>({gx:c.gx,gz:c.gz}));});
      let acted=false;for(const c of targets)if(await cell(c)){acted=true;break;}
      if(acted){await settle();report.actions.push({kind:'attack',before,after:await state()});continue;}await cancel();
    }
    if(await page.locator('#menu [data-a="move"]:not(:disabled)').count()){
      await page.locator('#menu [data-a="move"]').click();
      const centers=await page.evaluate(()=>{const g=window.G,u=g.active,foes=g.units.filter(f=>f.alive&&f.team==='foe');return(g.reach?.list??[]).filter(c=>!g.grid[c.gx][c.gz].occupant).map(c=>({...c,rank:Math.min(...foes.map(f=>Math.abs(c.gx-f.gx)+Math.abs(c.gz-f.gz)))})).sort((a,b)=>a.rank-b.rank);});
      let acted=false;for(const c of centers)if(await cell(c)){acted=true;break;}
      if(acted){await settle();report.actions.push({kind:'move',before,after:await state()});continue;}await cancel();
    }
    await page.locator('#menu [data-a="wait"]').click();report.actions.push({kind:'wait',before});
  }assert.equal(report.pass,true,'No real Salvation cast before bounded deadline');
}catch(e){report.failure=e.stack;report.lastState=await state().catch(()=>null);await page.screenshot({path:output+'/failure.png'}).catch(()=>{});process.exitCode=1;}
finally{if(castMotion)report.castMotion=await page.evaluate(()=>{const p=window.__castMotionProbe;if(p)p.done=true;return p??null;}).catch(()=>report.castMotion??null);await browser.close();await new Promise(r=>server.httpServer.close(r));report.endedAt=new Date().toISOString();await writeFile(output+'/results.json',JSON.stringify(report,null,2)+'\n');if(job&&job.finish(report).status!=='SUCCEEDED')process.exitCode=1;console.log(JSON.stringify({pass:report.pass,salvation:report.salvation,failure:report.failure}));}
