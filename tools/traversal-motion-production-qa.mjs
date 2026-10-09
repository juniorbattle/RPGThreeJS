/** Native production clocks/input; V6-origin and combat-result fixtures.
 * Certifies motion/lifecycle only, never earned campaign or tactical outcomes. */
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import { beginJob, registerJob } from './qa/qa-job.mjs';

const arg=(name,fallback)=>process.argv.find(x=>x.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const motion=arg('motion','normal');assert.ok(['normal','os'].includes(motion));
const port=Number(arg('port',motion==='os'?'5281':'5280'));
const output=arg('output',`tmp/traversal/motion-1002-${motion}`);
const viewports=arg('viewports','1440x810,620x780,390x844').split(',');
const legs=arg('legs','T0,T1,T3').split(',');assert.ok(legs.every(leg=>['T0','T1','T3'].includes(leg)));
const pursuitCheck=arg('pursuit-check','0')==='1';
const gaitCheck=arg('gait-check','0')==='1';
const reducedChargeCheck=arg('reduced-charge-check','0')==='1';
assert.ok(!gaitCheck||(pursuitCheck&&motion==='normal'&&legs.length===1&&legs[0]==='T0'),'Gait smoke requires one normal T0 Pursuit scenario');
assert.ok(!reducedChargeCheck||(pursuitCheck&&motion==='normal'&&legs.length===1&&legs[0]==='T0'),'Reduced charge smoke requires one normal T0 Pursuit scenario');
assert.ok(viewports.every(value=>/^\d+x\d+$/.test(value)&&value.split('x').every(n=>Number(n)>0)),'Invalid viewports');
const parameters={motion,viewports,legs,branch:'event',gameReducedMotion:false,pursuitCheck,
  gaitCheck,reducedChargeCheck,
  scope:'native production motion with V6-origin/combat-result fixtures; not earned campaign'};
const requiredAssertions=['continuous-departure','opaque-swap','reveal-momentum','clock-zero-during-reveal','full-exit-before-arrival','single-canonical-arrival','native-keyboard-focus','responsive-controls',
  ...(motion==='os'?['os-covered-exit']:['forward-exit-and-resize','accelerating-arrival'])];
if(pursuitCheck)requiredAssertions.push('pursuit-contact-single','pursuit-ordinary-pool','pursuit-exact-road-resume','pursuit-miss-full-exit','pursuit-no-node-resolution');
if(gaitCheck)requiredAssertions.push('pursuit-six-clocked-poses','pursuit-os-or-game-static-pose','pursuit-sheet-failure-static-fallback');
if(reducedChargeCheck)requiredAssertions.push('pursuit-reduced-charge-visible','pursuit-reduced-charge-os-or-game-static','pursuit-reduced-charge-terminal-exit');
if(process.argv.includes('--register')){
  const registered=registerJob({runId:process.env.AUTONOMY_RUN_ID,jobId:process.env.DEMO_QA_JOB_ID,output,
    driver:'tools/traversal-motion-production-qa.mjs',port,parameters,requiredAssertions});
  console.log(JSON.stringify({jobId:registered.jobId,output:registered.output,registered:true}));process.exit(0);
}
const job=beginJob({output,driver:'tools/traversal-motion-production-qa.mjs',port,parameters,requiredAssertions});
const report={parameters,startedAt:new Date().toISOString(),runs:[],captures:[],errors:[],failures:[],assertions:{}};
let server,browser,models;
try{
  models=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});
  const {createInitialState}=await models.ssrLoadModule('/src/game/store.ts');
  const {createRunState,enterRunNode}=await models.ssrLoadModule('/src/game/runSystem.ts');
  const origins={};
  for(const [leg,target] of [['T1','lion-first-refuge'],['T3','lion-second-refuge']]){
    const seed=createInitialState();seed.run=createRunState(6101);
    seed.flags={...seed.flags,prologueSeen:true,lionMissionAccepted:true,helpedRefugees:true};
    const previous=new Map([[seed.run.currentNodeId,null]]),queue=[seed.run.currentNodeId];
    while(queue.length&&!previous.has(target)){
      const id=queue.shift();for(const next of seed.run.graph.nodes.find(n=>n.id===id)?.links??[])
        if(!previous.has(next)){previous.set(next,id);queue.push(next);}
    }
    const path=[];for(let id=target;id;id=previous.get(id))path.unshift(id);
    for(const id of path.slice(1)){seed.resolvedNodeIds.push(seed.run.currentNodeId);assert.ok(enterRunNode(seed.run,id));
      seed.currentNodeId=id;seed.visitedNodeIds=[...seed.run.visitedNodeIds];seed.stepCounter++;}
    seed.settings.reducedGraphics=false;origins[leg]=seed;
  }
  await models.close();models=null;
  server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
  browser=await chromium.launch({headless:true});
  for(const leg of parameters.legs)for(const dimensions of parameters.viewports){
    const [width,height]=dimensions.split('x').map(Number),branch=`lion-${leg==='T0'?'first':leg==='T1'?'second':'final'}-trial-event`;
    const entry={leg,viewport:{width,height},branch,captures:[],keyboard:[],complete:false};report.runs.push(entry);
    console.log(`${motion}/${leg}/${dimensions}: start`);
    const context=await browser.newContext({viewport:{width,height},reducedMotion:motion==='os'?'reduce':'no-preference'});
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(`${leg}/${dimensions}: ${e.message}`));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(`${leg}/${dimensions}: ${m.text()}`);});
    await page.route('**/assets/game-*.js',async route=>{
      const response=await route.fetch(),source=await response.text();
      const pattern=/const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      assert.ok(pattern.test(source),'Production bootstrap hook missing');
      await route.fulfill({response,body:source.replace(pattern,(match,name)=>match.replace(';window.addEventListener',`;window.__motionApp=${name};window.addEventListener`))});
    });
    if(leg!=='T0'){
      const seed=structuredClone(origins[leg]);seed.reputation=65;
      if(leg==='T3')seed.mysteryAssignments[branch]='mystery_dragon_roost';
      await page.addInitScript(seed=>localStorage.setItem('rpg-threejs:autosave:v6',JSON.stringify(seed)),seed);
    }
    await page.goto(`http://127.0.0.1:${port}/?qa=1`);await page.waitForFunction(()=>!!window.__motionApp);
    if(leg==='T0')await page.evaluate(async()=>{const app=window.__motionApp;app.qaEnabled=true;app.traversalT0QaEnabled=true;await app.startTraversalT0Qa();app.state.settings.reducedGraphics=false;
      // Explicit origin fixture: production eligibility requires the audience already resolved.
      if(!app.state.resolvedNodeIds.includes('lion-audience'))app.state.resolvedNodeIds.push('lion-audience');
    });
    else await page.locator('[data-action="continue"]').click();
    await page.evaluate(()=>{
      const app=window.__motionApp,proof=window.__motionProof={samples:[],handoffs:[],arrivals:[],returns:[],combats:[],pursuit:[],roadBattles:[]};
      const roadCombat=app.startTraversalPursuitCombat.bind(app);
      app.startTraversalPursuitCombat=async contact=>{
        const scene=app.activeTraversal;
        const truth=()=>JSON.stringify({current:app.state.currentNodeId,runCurrent:app.state.run.currentNodeId,visited:app.state.run.visitedNodeIds,resolved:app.state.resolvedNodeIds,branches:app.state.run.traversalBranches,flags:app.state.flags});
        const road=()=>({elapsed:scene.routeRun.elapsedMs,distance:scene.routeRenderer.distance,stage:scene.session.stageIndex,progress:scene.session.routeProgress01});
        const entry={contact,before:road(),truthBefore:truth(),savedBefore:localStorage.getItem('rpg-threejs:autosave:v6')};proof.roadBattles.push(entry);
        await roadCombat(contact);
        entry.sameMount=app.activeTraversal===scene;entry.after=road();entry.truthAfter=truth();entry.savedAfter=localStorage.getItem('rpg-threejs:autosave:v6');
        entry.focusedLane=document.activeElement?.dataset.traversalLane;
      };
      const original=app.commitRunNodeChoice.bind(app);app.commitRunNodeChoice=(...args)=>{proof.handoffs.push(args[0]);return original(...args);};
      const arrival=app.completeTraversalArrival.bind(app);app.completeTraversalArrival=(...args)=>{
        const scene=app.activeTraversal,root=scene.element,r=root.querySelector('.traversal-vehicle').getBoundingClientRect();
        proof.arrivals.push({destination:args[0],left:r.left,width:r.width,viewport:innerWidth,speed:scene.speed,
          fade:Number(root.style.getPropertyValue('--arrival-fade')),node:app.state.run.currentNodeId,resolved:app.state.resolvedNodeIds.includes(args[0])});
        return arrival(...args);
      };
      let departure=null,serial=0,lastSegment='',afterDeparture=0;
      const sample=()=>{
        const scene=app.activeTraversal;
        if(scene){
          const root=scene.element,segment=root.dataset.routeSegment;
          if(scene.pursuitCharge)proof.pursuit.push({window:scene.pursuitCharge.windowId,phase:scene.pursuitCharge.phase,left:scene.pursuitCharge.left,speed:scene.pursuitCharge.speed,lane:scene.pursuitCharge.lane,time:performance.now()});
          if(scene.departure&&scene.departure!==departure){departure=scene.departure;serial++;}
          const active=Boolean(scene.departure),arriving=scene.session.phase==='ARRIVING';
          if(active)afterDeparture=12;else afterDeparture=Math.max(0,afterDeparture-1);
          const globalCover=document.querySelector('.scene-transition--traversal');
          const cover=globalCover?Number(getComputedStyle(globalCover).opacity):0;
          if(segment!==lastSegment&&lastSegment&&root.dataset.view==='route'&&!active){proof.returns.push({segment,speed:scene.speed,elapsed:scene.routeRun.elapsedMs,globalCover:cover});}
          if(root.dataset.view==='route')lastSegment=segment;
          if(active||arriving||afterDeparture){
            const r=root.querySelector('.traversal-vehicle').getBoundingClientRect();
            proof.samples.push({time:performance.now(),serial,departure:active,kind:scene.departure?.kind,segment,view:root.dataset.view,phase:scene.session.phase,
              transition:root.dataset.transition,opacity:Number(root.style.getPropertyValue('--transition-opacity')),fade:Number(root.style.getPropertyValue('--arrival-fade')||0),
              speed:scene.speed,min:scene.routeSegment.vMin,elapsed:scene.routeRun.elapsedMs,duration:scene.routeSegment.durationMs,distance:scene.routeRenderer.distance,
              offset:Number(root.dataset.vehicleOffset),left:r.left,right:r.right,width:r.width,viewport:innerWidth,globalCover:cover});
          }
        }
        window.__motionSampler=requestAnimationFrame(sample);
      };sample();
    });
    const captured=new Set();
    const capture=async label=>{if(captured.has(label))return;captured.add(label);
      const file=`${leg}-${width}-${label}.png`;await page.screenshot({path:`${output}/${file}`});entry.captures.push(file);report.captures.push({file,leg,viewport:{width,height},motion,label});};
    async function activate(selector,label){
      const locator=page.locator(selector);if(!await locator.count())return false;
      for(let tab=0;tab<35;tab++){
        if(await locator.evaluate(e=>document.activeElement===e))break;
        await page.keyboard.press('Tab');
      }
      const focused=await locator.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {focused:document.activeElement===e,outline:s.outlineStyle,width:r.width,height:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
      assert.ok(focused.focused,`Native Tab reaches ${label}`);assert.notEqual(focused.outline,'none','Visible focus');
      assert.ok(focused.x>=-1&&focused.right<=width+1&&focused.y>=-1&&focused.bottom<=height+1,'Focused control in viewport');
      if(width<1000)assert.ok(focused.width>=43&&focused.height>=43,'Touch-sized action');
      entry.keyboard.push({label,...focused});await page.keyboard.press('Enter');return true;
    }
    async function poseSamples(duration){
      return page.evaluate(duration=>new Promise(resolve=>{
        const samples=[],start=performance.now();
        const sample=()=>{const root=window.__motionApp.activeTraversal?.element;
          const sprite=root?.querySelector('.traversal-route-pursuit__proxy:not([hidden]) .traversal-pursuer-sprite, .traversal-pursuit-charge:not([hidden]) .traversal-pursuer-sprite');
          if(sprite){const r=sprite.getBoundingClientRect(),style=getComputedStyle(sprite);samples.push({time:performance.now(),frame:sprite.dataset.frame,asset:sprite.dataset.asset,reduced:sprite.dataset.reducedMotion,background:style.backgroundPosition,backgroundImage:style.backgroundImage,animation:style.animationName,left:r.left,top:r.top,width:r.width,height:r.height,os:matchMedia('(prefers-reduced-motion: reduce)').matches,game:window.__motionApp.state.settings.reducedGraphics});}
          if(performance.now()-start>=duration)resolve(samples);else requestAnimationFrame(sample);
        };requestAnimationFrame(sample);
      }),duration);
    }
    async function verifyGait(){
      entry.gait={normal:await poseSamples(650)};
      assert.equal(new Set(entry.gait.normal.map(s=>s.frame)).size,6,'Six distinct clock-selected poses');
      assert.ok(entry.gait.normal.every(s=>s.asset==='sheet'&&s.animation==='none'&&s.reduced==='false'));
      await capture('gallop-normal');
      await page.emulateMedia({reducedMotion:'reduce'});
      entry.gait.os=await poseSamples(180);
      assert.ok(entry.gait.os.length>=3&&entry.gait.os.slice(2).every(s=>s.os&&!s.game&&s.reduced==='true'&&s.frame==='0'),'OS-only selects a static pose');
      await capture('gallop-os-static');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>{window.__motionApp.state.settings.reducedGraphics=true;});
      entry.gait.game=await poseSamples(180);
      assert.ok(entry.gait.game.length>=3&&entry.gait.game.slice(2).every(s=>!s.os&&s.game&&s.reduced==='true'&&s.frame==='0'),'Game-only selects a static pose');
      await page.evaluate(()=>{window.__motionApp.state.settings.reducedGraphics=false;});
      await page.route('**/shadow-pursuer-run-v1.png?qaMissing=1',route=>route.fulfill({status:200,contentType:'image/png',body:'invalid image'}));
      await page.locator('.traversal-pursuer-sprite__loader').evaluateAll(images=>images.forEach(image=>{image.src+="?qaMissing=1";}));
      await page.waitForFunction(()=>[...document.querySelectorAll('.traversal-pursuer-sprite')].every(sprite=>sprite.dataset.asset==='fallback'));
      entry.gait.fallback=await poseSamples(180);
      assert.ok(entry.gait.fallback.length>=3&&entry.gait.fallback.every(s=>s.asset==='fallback'&&s.backgroundImage==='none'),'Failed sheet retains only static art');
      entry.gait.fallbackImage=await page.locator('.traversal-route-pursuit__proxy:not([hidden]) .traversal-pursuer-sprite__fallback').evaluate(image=>({complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,display:getComputedStyle(image).display}));
      assert.deepEqual(entry.gait.fallbackImage,{complete:true,width:640,height:336,display:'block'});
      await capture('gallop-sheet-fallback');
      await page.locator('.traversal-pursuer-sprite__loader').evaluateAll(images=>images.forEach(image=>{image.src=image.src.split('?')[0];}));
      await page.waitForFunction(()=>[...document.querySelectorAll('.traversal-pursuer-sprite')].every(sprite=>sprite.dataset.asset==='sheet'));
      entry.gait.restored=await poseSamples(180);
      assert.ok(new Set(entry.gait.restored.map(s=>s.frame)).size>=2,'Normal pose cadence resumes');
    }
    async function chargeSamples(duration){
      return page.evaluate(duration=>new Promise(resolve=>{
        const samples=[],start=performance.now();
        const sample=()=>{const scene=window.__motionApp.activeTraversal,actor=scene?.element.querySelector('.traversal-pursuit-charge'),sprite=actor?.querySelector('.traversal-pursuer-sprite');
          if(actor&&sprite&&scene.pursuitCharge){const r=actor.getBoundingClientRect(),style=getComputedStyle(actor);
            samples.push({elapsed:scene.pursuitCharge.elapsedSeconds,logicalLeft:scene.pursuitCharge.left,phase:actor.dataset.phase,lane:actor.dataset.lane,hidden:actor.hidden,opacity:Number(style.opacity),left:r.left,top:r.top,width:r.width,height:r.height,frame:sprite.dataset.frame,reduced:actor.dataset.reducedMotion,os:matchMedia('(prefers-reduced-motion: reduce)').matches,game:window.__motionApp.state.settings.reducedGraphics});}
          if(performance.now()-start>=duration)resolve(samples);else requestAnimationFrame(sample);
        };requestAnimationFrame(sample);
      }),duration);
    }
    async function verifyReducedCharge(){
      await page.emulateMedia({reducedMotion:'reduce'});
      entry.reducedCharge={os:await chargeSamples(800)};
      await capture('charge-os-visible');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>{window.__motionApp.state.settings.reducedGraphics=true;});
      entry.reducedCharge.game=await chargeSamples(180);
      await capture('charge-game-visible');
      for(const [mode,samples] of Object.entries(entry.reducedCharge)){
        const settled=samples.slice(2);
        assert.ok(settled.length>=3&&settled.some(s=>s.elapsed>.6),'Long reduced charge sampled beyond former fade deadline');
        assert.ok(settled.every(s=>s.phase==='CHARGING'&&!s.hidden&&s.opacity===1&&s.frame==='0'&&s.reduced==='true'&&s.os===(mode==='os')&&s.game===(mode==='game')),'Visible static charge with independent OS/game preference');
        assert.ok(settled.every(s=>Math.abs(s.left-settled[0].left)<.1&&Math.abs(s.top-settled[0].top)<.1),'Stationary reduced actor');
        assert.ok(settled[0].left>=0&&settled[0].left+settled[0].width<=width,'Whole reduced charge silhouette in viewport');
        assert.ok(settled.at(-1).logicalLeft>settled[0].logicalLeft,'Logical charge continues while visual actor stays still');
      }
      await page.evaluate(()=>{window.__motionApp.state.settings.reducedGraphics=false;});
    }
    const deadline=Date.now()+240000;let lanesChecked=false,skipped=false,resized=false,lastScene='',gaitChecked=false,reducedChargeChecked=false;
    while(Date.now()<deadline){
      const s=await page.evaluate(()=>{const app=window.__motionApp,scene=app.activeTraversal,root=scene?.element;return {segment:root?.dataset.routeSegment,view:root?.dataset.view,phase:scene?.session.phase,departure:!!scene?.departure,transition:root?.dataset.transition,opacity:Number(root?.style.getPropertyValue('--transition-opacity')),progress:scene?.routeRun.progress01,lane:scene?.session.currentLane,speed:scene?.speed,min:scene?.routeSegment.vMin,fade:Number(root?.style.getPropertyValue('--arrival-fade')||0),left:root?.querySelector('.traversal-vehicle').getBoundingClientRect().left,chargePhase:scene?.pursuitCharge?.phase,chargeLeft:root?.querySelector('.traversal-pursuit-charge:not([hidden])')?.getBoundingClientRect().left,arrivals:window.__motionProof.arrivals.length};});
      if(s.arrivals===1){entry.complete=true;break;}
      const sceneKey=`${s.segment}/${s.view}/${s.phase}`;if(sceneKey!==lastScene){lastScene=sceneKey;console.log(`${motion}/${leg}/${dimensions}: ${sceneKey}`);}
      if(motion==='normal'&&!resized&&s.phase==='ARRIVING'&&s.left>width*.65&&s.left<width){
        const changed={width:width===1440?1800:1440,height:900};
        await page.setViewportSize(changed);await page.waitForTimeout(70);
        const observed=await page.evaluate(()=>{const scene=window.__motionApp.activeTraversal;return {left:scene.element.querySelector('.traversal-vehicle').getBoundingClientRect().left,viewport:innerWidth,arrivals:window.__motionProof.arrivals.length};});
        assert.equal(observed.arrivals,0,'No premature handoff during resize');entry.resize={from:width,to:changed.width,...observed};
        await page.setViewportSize({width,height});resized=true;
      }
      if(s.departure&&s.view==='checkpoint'&&s.opacity<.5)await capture('departure-visible');
      if(s.departure&&s.view==='route'&&s.opacity<.8&&s.opacity>.02)await capture('reveal-moving');
      if(s.view==='checkpoint'&&s.opacity<.02&&!s.transition)await capture(`checkpoint-${s.segment}`);
      if(s.phase==='ARRIVING'&&s.fade===0&&s.left<width)await capture('arrival-visible');
      if(s.phase==='ARRIVING'&&s.left>=width)await capture('arrival-exited');
      if(pursuitCheck&&s.phase==='RUNNING'&&s.view==='route'&&!s.transition){
        const desired=s.segment==='route-3'||s.segment==='route-6'?1:0;
        if(s.lane!==desired)await page.keyboard.press(desired?'ArrowDown':'ArrowUp');
        if(s.segment==='route-3'&&s.progress>.73&&s.progress<.78)await capture('pursuit-approach');
        if(gaitCheck&&!gaitChecked&&s.segment==='route-3'&&s.progress>.60&&await page.locator('.traversal-route-pursuit__proxy:not([hidden]) .traversal-pursuer-sprite[data-asset="sheet"]').count()){
          gaitChecked=true;await verifyGait();
        }
        if(gaitCheck&&s.chargePhase==='CHARGING'&&s.chargeLeft>width*.45&&s.chargeLeft<width*.75)await capture('gallop-charge');
        if(reducedChargeCheck&&!reducedChargeChecked&&s.segment==='route-5a'&&s.chargePhase==='CHARGING'){
          reducedChargeChecked=true;await verifyReducedCharge();
          await page.waitForFunction(()=>window.__motionApp.activeTraversal?.pursuitCharge?.phase==='EXITED',{},{timeout:5000});
          entry.reducedCharge.exit=await page.locator('.traversal-pursuit-charge').evaluate(actor=>({phase:actor.dataset.phase,hidden:actor.hidden,display:getComputedStyle(actor).display}));
          assert.deepEqual(entry.reducedCharge.exit,{phase:'EXITED',hidden:true,display:'none'},'Terminal exit clears charge actor');
        }
      }
      if(!lanesChecked&&s.view==='route'&&!s.transition&&s.progress>.1&&s.progress<.5){
        await activate('[data-traversal-lane="1"]:visible:not([disabled])','lower lane');
        await page.keyboard.press('ArrowUp');
        const lane=await page.evaluate(()=>window.__motionApp.activeTraversal.session.currentLane);assert.equal(lane,0);lanesChecked=true;
      }
      if(await activate(`[data-traversal-fork-choice="${branch}"]:visible:not([disabled])`,'authored fork')){}
      else if(leg==='T0'&&!skipped&&await activate('[data-traversal-skip]:visible:not([disabled])','optional return'))skipped=true;
      else await activate('[data-traversal-confirm]:visible:not([disabled])','checkpoint continue');
      const refuge=page.locator('.exploration-stop [data-action="continue"]:visible');if(await refuge.count())await refuge.click();
      const journey=page.locator('[data-journey-continue]:visible:not([disabled])');if(await journey.count()&&!s.segment)await journey.first().click();
      const choices=page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if(await choices.count())await choices.first().click();else {const box=page.locator('.dialogue .dialogue__box:visible');if(await box.count())await box.first().click();}
      const skip=page.locator('.cinematic-overlay__skip:visible:not([disabled])');if(await skip.count())await skip.first().click();
      const frame=page.frames().find(f=>f.url().includes('legacy-combat'));
      if(frame)await frame.evaluate(()=>{if(window.__motionSent||!window.__BOOTED)return;const session=window.parent.__motionApp.combat.session;if(!session)return;
        window.__motionSent=true;window.parent.__motionProof.combats.push(session.config.id);
        if(window.parent.__motionProof.roadBattles.at(-1)&&!window.parent.__motionProof.roadBattles.at(-1).after){
          const entry=window.parent.__motionProof.roadBattles.at(-1);entry.config={id:session.config.id,rank:session.config.encounterRank,enemies:session.config.enemyVisualIds};
        }
        window.parent.postMessage({type:'rpg-threejs:combat-result',victory:true,combatId:session.config.id,inventory:session.inventory,participants:session.preferredUnitIds,unitHealth:Object.fromEntries(session.clan.map(unit=>[unit.id,unit.currentHealth]))},location.origin);
      }).catch(()=>{});
      await page.waitForTimeout(35);
    }
    const proof=await page.evaluate(()=>{cancelAnimationFrame(window.__motionSampler);const app=window.__motionApp;return {...window.__motionProof,branch:app.state.run.traversalBranches,gameReduced:app.state.settings.reducedGraphics,osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches};});
    Object.assign(entry,proof);
    if(gaitCheck)assert.ok(gaitChecked,'Live articulated-pose checks executed');
    if(reducedChargeCheck)assert.ok(reducedChargeChecked,'Live reduced-charge checks executed');
    if(pursuitCheck){
      assert.equal(proof.roadBattles.length,1,'Exactly one physical collision handoff');const battle=proof.roadBattles[0];
      assert.ok(['forest_patrol','forest_ambush','wolf_pack'].includes(battle.config.id));assert.equal(battle.config.rank,'normal');
      assert.ok(battle.config.enemies.every(id=>['serpent_raider','serpent_brute','wolf','cave_rat'].includes(id)),'No boss/elite');
      assert.equal(battle.sameMount,true);assert.deepEqual(battle.after,battle.before,'Exact mounted road clocks/progress restored');
      assert.equal(battle.truthAfter,battle.truthBefore,'No canonical node/branch/flag changes');assert.equal(battle.savedAfter,battle.savedBefore,'Existing autosave cadence');
      assert.ok(['0','1'].includes(battle.focusedLane),'Focus returns to a lane control');
      const misses=[...new Set(proof.pursuit.filter(s=>s.phase==='EXITED').map(s=>s.window))];assert.ok(misses.length>=1,'A genuine missed charge finishes');
      for(const window of misses){const samples=proof.pursuit.filter(s=>s.window===window);assert.ok(samples.some(s=>s.phase==='EXITED'&&s.left>=1463),'Full right exit');
        assert.equal(new Set(samples.map(s=>s.lane)).size,1,'Committed lane');assert.ok(samples.at(-1).speed>samples[0].speed,'Accelerating overtake');}
    }
    assert.ok(entry.complete,`${leg}/${width}: native arrival reached`);assert.ok(lanesChecked,'Keyboard lanes exercised');
    assert.equal(proof.gameReduced,false);assert.equal(proof.osReduced,motion==='os');assert.equal(proof.branch[leg],branch);
    assert.equal(proof.arrivals.length,1);const arrival=proof.arrivals[0];
    assert.ok(arrival.left>=arrival.viewport+arrival.width*.1+4,'Full trailing-edge exit before callback');assert.ok(arrival.speed>0,'Forward speed until handoff');assert.equal(arrival.resolved,false,'Destination agency unresolved');
    assert.ok(proof.handoffs.includes(branch),'Existing selected branch handoff');
    const groups=[...new Set(proof.samples.filter(s=>s.departure).map(s=>s.serial))];assert.ok(groups.length,'Native checkpoint departure sampled');
    entry.departures=groups.map(serial=>{
      const samples=proof.samples.filter(s=>s.serial===serial&&s.departure),checkpoint=samples.filter(s=>s.view==='checkpoint'),route=samples.filter(s=>s.view==='route');
      assert.ok(checkpoint.length>=2&&route.length>=2,'Both departure surfaces sampled');
      assert.ok(route.some(s=>s.opacity>=.999),'Swap remains opaque');assert.ok(route.every(s=>s.elapsed===0),'New route clock zero through reveal');
      const reveal=route.filter(s=>s.opacity<.95&&s.opacity>.02);assert.ok(reveal.length>=2,'Visible reveal sampled');
      assert.ok(reveal.every(s=>s.speed>=s.min),'Reveal already engaged');assert.ok(reveal.at(-1).distance>reveal[0].distance,'Moving world through reveal');
      const continued=proof.samples.filter(s=>s.serial===serial&&!s.departure&&s.phase!=='ARRIVING');assert.ok(continued.some(s=>s.elapsed>0&&s.speed>=s.min),'No second restart');
      if(motion==='normal')assert.ok(checkpoint.at(-1).offset>checkpoint[0].offset+20*width/1440,'Readable forward displacement');
      else assert.ok(checkpoint.every(s=>Math.abs(s.offset)<.1),'No large reduced departure displacement');
      return {serial,kind:checkpoint[0].kind,checkpointFrames:checkpoint.length,revealFrames:reveal.length,clockStayedZero:true,minRevealSpeed:Math.min(...reveal.map(s=>s.speed)),displacement:checkpoint.at(-1).offset-checkpoint[0].offset};
    });
    const exit=proof.samples.filter(s=>s.phase==='ARRIVING');assert.ok(exit.length>=3,'Exit sampled');
    assert.ok(exit.every(s=>s.speed>0),'No near stop');
    if(motion==='normal'){
      const visible=exit.filter(s=>s.left<s.viewport);assert.ok(visible.length>=3,'Visible exit sequence');
      assert.ok(visible.every(s=>s.fade===0),'Fade begins only after complete exit');
      assert.ok(visible.at(-1).left>visible[0].left+width*.5,'Crosses viewport');
      assert.ok(visible.at(-1).speed>visible[0].speed,'Caravan accelerates before leaving view');
      assert.ok(resized,'Actual native arrival resize exercised');
    }else{
      assert.ok(exit.some(s=>s.fade>0&&s.fade<1),'Gentle reduction fade');
      assert.ok(exit.filter(s=>s.fade<.999).every(s=>s.offset===0),'No large visible reduced exit displacement');assert.equal(arrival.fade,1);
    }
    assert.ok(proof.returns.length>=2,'Native canonical returns observed');
    assert.ok(proof.returns.every(s=>s.speed>=1),'Canonical return mounted with momentum');
    console.log(`${motion}/${leg}/${dimensions}: PASS ${proof.samples.length} frames ${entry.departures.length} departures`);
    await context.close();
  }
  for(const name of requiredAssertions)report.assertions[name]=true;
}catch(error){report.failures.push(error.stack??String(error));}
finally{
  await browser?.close();await models?.close();if(server)await new Promise((resolve,reject)=>server.httpServer.close(e=>e?reject(e):resolve()));
  report.endedAt=new Date().toISOString();report.pass=!report.failures.length&&!report.errors.length;
  await mkdir(output,{recursive:true});await writeFile(`${output}/results.json`,JSON.stringify(report,null,2)+'\n');
  const receipt=job.finish(report);console.log(JSON.stringify({pass:report.pass,runs:report.runs.length,captures:report.captures.length,failures:report.failures,errors:report.errors,receipt:receipt.status}));if(!report.pass)process.exitCode=1;
}
