/** Real built GameApp first-road visual proof. Origin/combat fixtures; no earned campaign acceptance. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer,preview} from 'vite';
import {beginJob,registerJob} from './qa/qa-job.mjs';
const output=process.env.ROCK_QA_OUTPUT??'tmp/traversal/rock-1430',port=5285;
const parameters={legs:['T0','T1','T3'],viewports:['1440x810','620x780','390x844'],motion:['normal','os'],
 scope:'real built-game first-road rock-only visuals; V6 origins and combat-result fixtures; no earned/combat/lifetime/depth acceptance'};
const requiredAssertions=['rock-only-active-art','authored-leg-inputs','real-first-road-visible','normal-os-responsive-focus'];
if(process.argv.includes('--register')){const j=registerJob({runId:process.env.AUTONOMY_RUN_ID,jobId:process.env.DEMO_QA_JOB_ID,
 output,driver:'tools/traversal-rock-production-qa.mjs',port,parameters,requiredAssertions});console.log(JSON.stringify({registered:j.jobId}));process.exit(0);}
const job=beginJob({output,driver:'tools/traversal-rock-production-qa.mjs',port,parameters,requiredAssertions});
const report={parameters,runs:[],errors:[],assertions:[],startedAt:new Date().toISOString()};
let models,server,browser;
try{
 models=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});
 const {createInitialState}=await models.ssrLoadModule('/src/game/store.ts');
 const {createRunState,enterRunNode}=await models.ssrLoadModule('/src/game/runSystem.ts');
 const origins={};
 for(const [leg,target] of [['T1','lion-first-refuge'],['T3','lion-second-refuge']]){
  const seed=createInitialState();seed.run=createRunState(6101);seed.flags={...seed.flags,prologueSeen:true,lionMissionAccepted:true,helpedRefugees:true};
  const previous=new Map([[seed.run.currentNodeId,null]]),queue=[seed.run.currentNodeId];
  while(queue.length&&!previous.has(target)){const id=queue.shift();for(const next of seed.run.graph.nodes.find(n=>n.id===id)?.links??[])if(!previous.has(next)){previous.set(next,id);queue.push(next);}}
  const path=[];for(let id=target;id;id=previous.get(id))path.unshift(id);
  for(const id of path.slice(1)){seed.resolvedNodeIds.push(seed.run.currentNodeId);assert.ok(enterRunNode(seed.run,id));seed.currentNodeId=id;seed.visitedNodeIds=[...seed.run.visitedNodeIds];seed.stepCounter++;}
  seed.settings.reducedGraphics=false;origins[leg]=seed;
 }
 await models.close();models=null;server=await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
 browser=await chromium.launch({headless:true});
 for(const motion of parameters.motion)for(const leg of parameters.legs)for(const dimensions of parameters.viewports){
  const [width,height]=dimensions.split('x').map(Number);
  const page=await browser.newPage({viewport:{width,height},reducedMotion:motion==='os'?'reduce':'no-preference'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.route('**/assets/game-*.js',async route=>{const response=await route.fetch(),source=await response.text();
   const pattern=/const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
   assert.ok(pattern.test(source));await route.fulfill({response,body:source.replace(pattern,(match,name)=>match.replace(';window.addEventListener',`;window.__rockApp=${name};window.addEventListener`))});});
  if(leg!=='T0')await page.addInitScript(seed=>localStorage.setItem('rpg-threejs:autosave:v6',JSON.stringify(seed)),origins[leg]);
  await page.goto(`http://127.0.0.1:${port}/?qa=1`);await page.waitForFunction(()=>!!window.__rockApp);
  if(leg==='T0')await page.evaluate(async()=>{const a=window.__rockApp;a.qaEnabled=true;a.traversalT0QaEnabled=true;await a.startTraversalT0Qa();a.state.settings.reducedGraphics=false;});
  else await page.locator('[data-action="continue"]').click();
  const target=leg==='T0'?'route-1':`${leg.toLowerCase()}-route-1`;
  const deadline=Date.now()+90000;let found=false,fixtureCombats=0;
  while(Date.now()<deadline){
   const visible=await page.evaluate(target=>{const scene=window.__rockApp.activeTraversal,root=scene?.element;
    return root?.dataset.routeSegment===target&&root.dataset.view==='route'&&!root.dataset.transition
      && [...root.querySelectorAll('[data-risk-hazard]')].some(e=>!e.hidden&&!e.parentElement.hidden&&e.getBoundingClientRect().left<innerWidth-20);},target);
   if(visible){found=true;break;}
   for(const selector of ['.exploration-stop [data-action="continue"]:visible','[data-journey-continue]:visible:not([disabled])',
    '[data-traversal-confirm]:visible:not([disabled])','.dialogue .dialogue__choices button:visible:not([disabled])','.dialogue .dialogue__box:visible',
    '.cinematic-overlay__skip:visible:not([disabled])']){const control=page.locator(selector);if(await control.count())await control.first().click();}
   const frame=page.frames().find(f=>f.url().includes('legacy-combat'));
   if(frame){const sent=await frame.evaluate(()=>{if(window.__rockSent||!window.__BOOTED)return false;const session=window.parent.__rockApp.combat.session;if(!session)return false;
    window.__rockSent=true;window.parent.postMessage({type:'rpg-threejs:combat-result',victory:true,combatId:session.config.id,
     inventory:session.inventory,participants:session.preferredUnitIds,unitHealth:Object.fromEntries(session.clan.map(u=>[u.id,u.currentHealth]))},location.origin);return true;}).catch(()=>false);if(sent)fixtureCombats++;}
   await page.waitForTimeout(40);
  }
  assert.ok(found,`${leg}/${width}/${motion}: visible first road`);
  const entry=await page.evaluate(()=>{const a=window.__rockApp,s=a.activeTraversal,r=s.element;
   return {leg:s.authoring.legId,segment:r.dataset.routeSegment,gameReduced:a.state.settings.reducedGraphics,osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
    hazards:s.authoring.routeSegments.flatMap(seg=>s.authoring.hazards(seg.id)),
    marks:[...r.querySelectorAll('[data-risk-hazard]')].map(e=>{const b=e.getBoundingClientRect(),i=e.querySelector('img');return {id:e.dataset.riskHazard,lane:e.dataset.riskLane,
     visual:e.dataset.riskVisual,src:i.getAttribute('src'),hidden:e.hidden,decoded:i.complete&&i.naturalWidth>0,left:b.left,right:b.right,top:b.top,bottom:b.bottom};})};});
  assert.equal(entry.leg,leg);assert.equal(entry.segment,target);assert.equal(entry.gameReduced,false);assert.equal(entry.osReduced,motion==='os');
  assert.ok(entry.hazards.length>0&&entry.marks.length>0);
  assert.ok(entry.marks.every(m=>/^boulder-[ab]$/.test(m.visual)&&/\/boulder-[ab]\.png$/.test(m.src)&&m.decoded));
  assert.ok(entry.marks.some(m=>!m.hidden&&m.left<width&&m.right>0&&m.top>=0&&m.bottom<=height));
  const selector='[data-traversal-lane="1"]:visible:not([disabled])';
  const button=page.locator(selector);
  for(let i=0;i<30&&!await button.evaluate(e=>document.activeElement===e);i++)await page.keyboard.press('Tab');
  const focus=await button.evaluate(e=>{const b=e.getBoundingClientRect();return {focused:document.activeElement===e,outline:getComputedStyle(e).outlineStyle,width:b.width,height:b.height,left:b.left,right:b.right,bottom:b.bottom};});
  assert.equal(focus.focused,true);assert.notEqual(focus.outline,'none');assert.ok(focus.left>=0&&focus.right<=width&&focus.bottom<=height);
  if(width<=620)assert.ok(focus.width>=44&&focus.height>=44);
  await page.keyboard.press('Enter');
  await page.screenshot({path:`${output}/${leg}-${width}-${motion}-rock.png`});
  report.runs.push({...entry,viewport:{width,height},motion,focus,fixtureCombats});
  console.log(`${leg}/${width}/${motion}:rock PASS`);await page.close();
 }
 assert.equal(report.errors.length,0);report.pass=true;report.assertions=requiredAssertions.map(id=>({id,pass:true}));
}catch(e){report.pass=false;report.errors.push(e.stack??String(e));}
finally{await models?.close();await browser?.close();await server?.httpServer?.close();report.endedAt=new Date().toISOString();
 await writeFile(`${output}/results.json`,JSON.stringify(report,null,2)+'\n');const receipt=job.finish(report);
 console.log(JSON.stringify({status:receipt.status,runs:report.runs.length,output,errors:report.errors}));if(!report.pass)process.exitCode=1;}
