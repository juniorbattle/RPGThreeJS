/** Motion regression supplement: game reduction and corrupted-art native return. Combat-result fixture is lifecycle-only. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { beginJob, registerJob } from './qa/qa-job.mjs';
const output=process.env.MOTION_PROBE_OUTPUT??'tmp/traversal/motion-1002-probe',port=5282;
const parameters={cases:['game','missing-shadow','missing-ground'],viewports:['1440x810','620x780','390x844'],scope:'T0 native production game reduction, hit targets and corrupt-art return momentum; combat fixture only'};
const requiredAssertions=['game-setting-reduction','lane-keyboard-focus','hit-targets','missing-art-handoff-return','engaged-return'];
if(process.argv.includes('--register')){const j=registerJob({runId:process.env.AUTONOMY_RUN_ID,jobId:process.env.DEMO_QA_JOB_ID,output,driver:'tools/traversal-motion-fallback-qa.mjs',port,parameters,requiredAssertions});console.log(JSON.stringify({jobId:j.jobId,registered:true}));process.exit(0);}
const job=beginJob({output,driver:'tools/traversal-motion-fallback-qa.mjs',port,parameters,requiredAssertions});
const report={parameters,startedAt:new Date().toISOString(),cases:[],errors:[],failures:[],assertions:{}};
let server,browser;
try {
  server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});browser=await chromium.launch({headless:true});
  for(const mode of parameters.cases){
    const context=await browser.newContext({viewport:{width:1440,height:810},reducedMotion:mode==='os'?'reduce':'no-preference'});
    const page=await context.newPage(),entry={mode,expectedDecodeErrors:[],views:[],interceptedRequests:0};report.cases.push(entry);
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'){if(mode==='missing-ground'&&m.text().includes('[Traversal]'))entry.expectedDecodeErrors.push(m.text());else report.errors.push(m.text());}});
    await page.route('**/assets/game-*.js',async route=>{const response=await route.fetch(),source=await response.text();
      const pattern=/const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      assert.ok(pattern.test(source));await route.fulfill({response,body:source.replace(pattern,(match,name)=>match.replace(';window.addEventListener',`;window.__probeApp=${name};window.addEventListener`))});});
    if(mode.startsWith('missing'))await page.route(mode==='missing-shadow'?'**/shadow-pursuer.png':'**/t0/world-v1/forest-road.png',route=>{entry.interceptedRequests++;return route.fulfill({status:200,contentType:'image/png',body:'invalid-image-for-scoped-fallback-probe'});});
    await page.goto(`http://127.0.0.1:${port}/?qa=1`);await page.waitForFunction(()=>!!window.__probeApp);
    await page.evaluate(async mode=>{const app=window.__probeApp;app.qaEnabled=true;app.traversalT0QaEnabled=true;await app.startTraversalT0Qa();app.state.settings.reducedGraphics=mode==='game';window.__probeScene=app.activeTraversal;},mode);
    await page.waitForFunction(()=>{const s=window.__probeApp.activeTraversal;return s?.element.dataset.view==='route'&&!s.element.dataset.transition&&s.routeRun.progress01>.1;});
    await page.evaluate(()=>cancelAnimationFrame(window.__probeScene.frameId));
    for(const viewport of [{width:1440,height:810},{width:620,height:780},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.evaluate(()=>window.__probeScene.updateWorldTransforms());await page.waitForTimeout(70);
      await page.locator('[data-traversal-lane="1"]').focus();await page.keyboard.press('Enter');
      const down=await page.evaluate(()=>window.__probeScene.session.currentLane);assert.equal(down,1);
      await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>window.__probeScene.session.currentLane),0);
      const proof=await page.evaluate(()=>{const root=window.__probeScene.element;
        const buttons=[...root.querySelectorAll('button:not([disabled])')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect(),style=getComputedStyle(b);return {label:b.textContent,lane:b.dataset.traversalLane,width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom,hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),outline:style.outlineStyle};});
        return {buttons,focused:document.activeElement?.getAttribute('data-traversal-lane'),gameReduced:window.__probeApp.state.settings.reducedGraphics,osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
          animations:[...root.querySelectorAll('.traversal-route-pursuit__image,.traversal-vehicle__dust')].map(e=>getComputedStyle(e).animationName),groundDecoded:[...root.querySelectorAll('.traversal-world-section__ground')].some(i=>i.naturalWidth>0),shadowDecoded:[...root.querySelectorAll('.traversal-entity__shadow,.traversal-route-pursuit__image')].some(i=>i.naturalWidth>0)};});
      assert.equal(proof.focused,'1');assert.equal(proof.gameReduced,mode==='game');assert.equal(proof.osReduced,mode==='os');
      assert.ok(proof.buttons.every(b=>b.x>=-1&&b.y>=-1&&b.right<=viewport.width+1&&b.bottom<=viewport.height+1&&b.hit),'Visible native button hit tests');
      const lanes=proof.buttons.filter(b=>b.lane!==undefined);assert.ok(lanes.length>0,'Native lane targets required');
      assert.ok(lanes.every(b=>b.width>=(viewport.width<=620?44:30)&&b.height>=(viewport.width<=620?44:30)),'Actual lane targets: desktop30, intermediate/mobile44');
      if(mode==='os')assert.ok(proof.animations.every(name=>name==='none'),'OS decorative animation suppressed');
      const file=`${mode}-route-${viewport.width}.png`;await page.screenshot({path:`${output}/${file}`});entry.views.push({viewport,file,...proof});
    }
    await page.setViewportSize({width:1440,height:810});
    await page.evaluate(()=>{const s=window.__probeScene;s.updateWorldTransforms();s.previousFrameMs=performance.now();s.frameId=requestAnimationFrame(s.tick);});
    const deadline=Date.now()+60000;
    while(Date.now()<deadline){
      const box=page.locator('.dialogue .dialogue__box:visible');if(await box.count())await box.first().click();
      const choices=page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');if(await choices.count())await choices.first().click();
      const frame=page.frames().find(f=>f.url().includes('legacy-combat'));
      if(frame)await frame.evaluate(()=>{if(window.__probeSent||!window.__BOOTED)return;const session=window.parent.__probeApp.combat.session;if(!session)return;window.__probeSent=true;
        window.parent.__probeCombatId=session.config.id;
        window.parent.postMessage({type:'rpg-threejs:combat-result',victory:true,combatId:session.config.id,inventory:session.inventory,participants:session.preferredUnitIds,unitHealth:Object.fromEntries(session.clan.map(u=>[u.id,u.currentHealth]))},location.origin);}).catch(()=>{});
      const returned=await page.evaluate(()=>{const app=window.__probeApp,s=app.activeTraversal;return s===window.__probeScene&&s.element.dataset.routeSegment==='route-2'&&s.element.dataset.view==='route'&&!s.element.dataset.transition;});
      if(returned){entry.returned=true;break;}await page.waitForTimeout(80);
    }
    assert.ok(entry.returned,'Unavailable art never blocks existing combat handoff/return');
    entry.returnMomentum=await page.evaluate(()=>{const scene=window.__probeApp.activeTraversal;return {speed:scene.speed,min:scene.routeSegment.vMin,elapsed:scene.routeRun.elapsedMs,gameReduced:window.__probeApp.state.settings.reducedGraphics};});assert.ok(entry.returnMomentum.speed>=entry.returnMomentum.min,'Return already moving');assert.equal(entry.returnMomentum.gameReduced,mode==='game');
    entry.combatId=await page.evaluate(()=>window.__probeCombatId);assert.ok(entry.combatId,'Actual combat fixture result recorded');
    if(mode==='missing-ground'){assert.ok(entry.expectedDecodeErrors.length);assert.equal(entry.views[0].groundDecoded,false);}
    if(mode.startsWith('missing'))assert.ok(entry.interceptedRequests>0,'Missing-art request actually intercepted');
    if(mode==='missing-shadow')assert.equal(entry.views[0].shadowDecoded,false,'Shadow decoding actually failed');
    await context.close();
  }
  for(const name of requiredAssertions)report.assertions[name]=true;
}catch(error){report.failures.push(error.stack??String(error));}
finally{await browser?.close();if(server)await new Promise((resolve,reject)=>server.httpServer.close(e=>e?reject(e):resolve()));
  report.endedAt=new Date().toISOString();report.pass=!report.errors.length&&!report.failures.length;await writeFile(`${output}/results.json`,JSON.stringify(report,null,2)+'\n');
  const receipt=job.finish(report);console.log(JSON.stringify({pass:report.pass,failures:report.failures,errors:report.errors,receipt:receipt.status}));if(!report.pass)process.exitCode=1;}
