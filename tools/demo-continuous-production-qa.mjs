/** Earned production campaign proof: fresh chronicle, actual tactical inputs, first-refuge V6 resume. */
import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const port = Number(process.env.DEMO_QA_PORT ?? 5249);
const output = resolve(process.env.DEMO_QA_OUTPUT ?? 'tmp/demo/continuous-production');
const earnedSavePath=process.env.DEMO_QA_EARNED_SAVE;
const priorProofPath=process.env.DEMO_QA_PRIOR_PROOF;
if(Boolean(earnedSavePath)!==Boolean(priorProofPath))throw new Error('Earned resume requires both save and its actual input proof');
const earnedText=earnedSavePath?await readFile(earnedSavePath,'utf8'):null;
const priorProof=priorProofPath?JSON.parse(await readFile(priorProofPath,'utf8')):null;
if(priorProof){
  assert.equal(priorProof.runtimeMutated,false);assert.equal(priorProof.combatOutcomeInjected,false);
  assert.ok(priorProof.battles.length&&priorProof.battles.every(b=>b.pass));
  const save=JSON.parse(earnedText);assert.equal(save.version,6);
  assert.ok(save.resolvedNodeIds.includes('lion-opening-ambush'));
  assert.deepEqual(save,priorProof.lastState??priorProof.resumed??priorProof.refuge,'Earned resume must match the exact observed owner state');
}
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, {recursive:true});
const server = await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1366,height:768}});
const page = await context.newPage();
const report = {schemaVersion:1, recordedAt:new Date().toISOString(), method:'FRESH_PRODUCTION_CHRONICLE_NORMAL_PLAYER_INPUTS_REAL_COMBAT',
  fixtureStateWritten:false, combatOutcomeInjected:false, runtimeMutated:false, inputs:[], nodes:[], battles:[], captures:[], errors:[], pass:false};
if(priorProof){
  report.method='EARNED_PRODUCTION_CONTINUATION_NORMAL_PLAYER_INPUTS_REAL_COMBAT';
  report.earnedResume={savePath:earnedSavePath,priorProofPath,kind:'EXACT_OBSERVED_OWNER_STATE_RECOVERY_SNAPSHOT',sha256:createHash('sha256').update(earnedText).digest('hex')};
  report.nodes=[...priorProof.nodes];report.battles=structuredClone(priorProof.battles);
}
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('[VFX Preview]'))report.errors.push(message.text());});
page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')report.errors.push(`${request.url()}: ${request.failure()?.errorText}`);});
const deadline=Date.now()+20*60*1000;
async function capture(name){await page.screenshot({path:resolve(output,`${name}.png`)});report.captures.push(`${name}.png`);}
async function state(){return page.evaluate(()=>JSON.parse(JSON.stringify(window.__demoQaApp.state)));}
async function click(selector){const button=page.locator(selector).first();await button.click();report.inputs.push({action:'click',selector});}
async function cancel(frame){await frame.locator('body').press('Escape');}
async function combatState(frame){return frame.evaluate(()=>{const g=window.G;return{round:g.round,turnIdx:g.turnIdx,mode:g.mode,busy:g.busy,
  over:g.over,moved:g.movedThisTurn,attacks:g.basicAttacksThisTurn,active:g.active&&{id:g.active.campaignId,name:g.active.name,team:g.active.team,
    gx:g.active.gx,gz:g.active.gz,hp:g.active.hp,maxhp:g.active.maxhp,ap:g.active.ap},
  units:g.units.map(u=>({id:u.campaignId||u.id,name:u.name,team:u.team,gx:u.gx,gz:u.gz,hp:u.hp,maxhp:u.maxhp,alive:u.alive,downed:!!u.downed})),
  inventory:{...g.inv},diagnostics:window.__COMBAT_DIAGNOSTICS};});}
async function cellClick(frame,cell){
  const point=await frame.evaluate(({gx,gz})=>{const p=window.__qaHelpers.getCellScreenPosition(gx,gz);
    return {...p,canvas:document.elementFromPoint(p.screenX,p.screenY)?.tagName==='CANVAS'};},cell);
  if(!point.canvas)return false;
  const box=await page.locator('iframe.combat-frame').boundingBox();
  await page.mouse.move(box.x+point.screenX,box.y+point.screenY);
  await page.mouse.click(box.x+point.screenX,box.y+point.screenY);
  return true;
}
async function settled(frame){await frame.waitForFunction(()=>window.G.over||!window.G.busy&&window.G.mode==='menu',null,{timeout:30000});}
async function attack(frame,battle){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="attack"]:not(:disabled)').first();
  if(!await button.count()||before.active.ap<3)return false;
  await button.click();
  const charges=frame.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)');
  if(!await charges.count()){await cancel(frame);return false;}
  await charges.last().click();
  const candidates=await frame.evaluate(()=>{const g=window.G;return(g.pending?.centers??[])
    .filter(c=>{const u=g.grid[c.gx]?.[c.gz]?.occupant;return u?.alive&&u.team!==g.active.team;})
    .sort((a,b)=>g.grid[a.gx][a.gz].occupant.hp-g.grid[b.gx][b.gz].occupant.hp)
    .map(c=>({gx:c.gx,gz:c.gz}));});
  for(const cell of candidates){if(await cellClick(frame,cell)){
    await page.waitForTimeout(50);
    const started=await combatState(frame);
    if(started.mode==='target'&&!started.busy)continue;
    if(!battle.impactCaptured){await capture(`combat-${battle.index}-actual-impact`);battle.impactCaptured=true;}
    await settled(frame); const after=await combatState(frame);
    battle.actions.push({kind:'attack',cell,before,after});
    return true;
  }}
  await cancel(frame);return false;
}
async function heal(frame,battle){
  const before=await combatState(frame);
  if(before.active.hp>=before.active.maxhp*.5||before.active.ap<1||!(before.inventory.potion>0))return false;
  const item=frame.locator('#menu [data-a="item"]:not(:disabled)');if(!await item.count())return false;
  await item.click();const potion=frame.locator('#skillmenu [data-i="potion"]:not(:disabled)');
  if(!await potion.count()){await cancel(frame);return false;} await potion.click();
  if(!await cellClick(frame,before.active)){await cancel(frame);return false;}
  await settled(frame); const after=await combatState(frame);
  if(after.inventory.potion===before.inventory.potion){await cancel(frame);return false;}
  battle.actions.push({kind:'potion',before,after});return true;
}
async function move(frame,battle){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="move"]:not(:disabled)');
  if(!await button.count())return false;await button.click();
  const candidates=await frame.evaluate(()=>{const g=window.G,u=g.active,foes=g.units.filter(e=>e.team==='foe'&&e.alive);
    const rank=c=>{let score=Infinity;for(const e of foes)for(const w of u.weapons){
      const d=Math.abs(c.gx-e.gx)+Math.abs(c.gz-e.gz),inRange=w.weaponType==='long_spear'
        ?Math.max(Math.abs(c.gx-e.gx),Math.abs(c.gz-e.gz))===1:d>=w.min&&d<=w.max;
      score=Math.min(score,(inRange?0:100)+d);
    }return score;};
    return(g.reach?.list??[]).filter(c=>(c.gx!==u.gx||c.gz!==u.gz)&&!g.grid[c.gx][c.gz].occupant)
      .map(c=>({gx:c.gx,gz:c.gz,score:rank(c)})).sort((a,b)=>a.score-b.score)
      .filter(c=>c.score<rank(u));});
  for(const cell of candidates){if(await cellClick(frame,cell)){
    await page.waitForTimeout(50); const start=await combatState(frame);
    if(start.mode==='move'&&!start.busy)continue;
    await settled(frame); const after=await combatState(frame);
    battle.actions.push({kind:'move',cell,before,after});return true;
  }}await cancel(frame);return false;
}
async function battle(){
  const element=page.locator('iframe.combat-frame');await element.waitFor({state:'attached'});
  const frame=await(await element.elementHandle()).contentFrame();
  await frame.waitForFunction(()=>window.__BOOTED===true,null,{timeout:60000});
  const entry={index:report.battles.length,nodeId:(await state()).currentNodeId,actions:[],pass:false}; report.battles.push(entry);
  assert.equal(await frame.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnit),'undefined','Production mutation helper present');
  for(const selector of ['#tutorial:not(.hidden) [data-action="skip"]','#boss-tutorial:not(.hidden) [data-action="start"]']){
    if(await frame.locator(selector).isVisible().catch(()=>false))await frame.locator(selector).click();
  }
  await frame.locator('#menu [data-d="auto"]').click();
  entry.deployed=await frame.evaluate(()=>window.G.deployedUnits.length);assert.equal(entry.deployed,4);
  await capture(`combat-${entry.index}-deployment`);
  await frame.locator('#menu [data-d="start"]').click();
  for(let index=0;index<300&&Date.now()<deadline;index++){
    if(index%5===0)console.log(`BATTLE ${entry.nodeId} iteration ${index}, actions ${entry.actions.length}`);
    await frame.waitForFunction(()=>window.G.over||window.G.mode==='menu'&&window.G.active?.team==='player'&&!window.G.busy,null,{timeout:60000});
    const current=await combatState(frame);if(current.over)break;
    if(await heal(frame,entry))continue;
    if(await attack(frame,entry))continue;
    if(await move(frame,entry))continue;
    const before=await combatState(frame);
    await frame.locator('#menu [data-a="wait"]').click(); entry.actions.push({kind:'wait',before});
  }
  entry.result=await combatState(frame);
  await capture(`combat-${entry.index}-result`);
  entry.resultText=await frame.locator('.combat-result-card').innerText();
  assert.ok(entry.resultText.includes('Victoire'),`Actual battle ended without victory: ${entry.resultText}`);
  assert.equal(entry.result.units.filter(u=>u.team==='foe'&&u.alive).length,0);
  assert.ok(entry.actions.some(a=>a.kind==='attack'));entry.pass=true;
  await frame.locator('#combat-result-action').click();await element.waitFor({state:'detached',timeout:30000});
  entry.ownerAfter=await state();
  assert.ok(entry.ownerAfter.resolvedNodeIds.includes(entry.nodeId));
  console.log(JSON.stringify({battle:entry.nodeId,realVictory:true,rounds:entry.result.round,actions:entry.actions.length}));
}
try{
  await page.route('**/assets/game-*.js',async route=>{const response=await route.fetch(),source=await response.text();
    const pattern=/const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
    if(!pattern.test(source))throw new Error('Built bootstrap observation hook missing');
    await route.fulfill({response,body:source.replace(pattern,(match,name)=>match.replace(';window.addEventListener',`;window.__demoQaApp=${name};window.addEventListener`))});});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')),null);
  if(earnedText){
    await page.evaluate(text=>localStorage.setItem('rpg-threejs:autosave:v6',text),earnedText);
    await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
    await page.waitForFunction(nodeId=>window.__demoQaApp?.state.currentNodeId===nodeId,JSON.parse(earnedText).currentNodeId);
  }else await click('.title-screen [data-action="new"]');
  for(let index=0;index<12000&&Date.now()<deadline;index++){
    const live=await state();if(report.nodes.at(-1)!==live.currentNodeId){report.nodes.push(live.currentNodeId);console.log(`NODE ${live.currentNodeId}`);}
    if(await page.locator('.exploration-stop[data-refuge-node="lion-first-refuge"]:visible:not([inert])').count()){
      report.refuge=live;await capture('first-refuge-earned');
      assert.ok(report.battles.length&&report.battles.every(b=>b.pass));
      assert.ok(live.resolvedNodeIds.includes('lion-opening-ambush'));
      assert.equal(live.flags['refugeSecured:lion-first-refuge'],true);assert.equal(live.run.temporaryLoot.gold,0);
      const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      assert.deepEqual(JSON.parse(saved),live,'Earned refuge agency precedes durable owner truth');
      await writeFile(resolve(output,'earned-first-refuge-v6.json'),saved+'\n');
      await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
      await page.locator('.exploration-stop[data-refuge-node="lion-first-refuge"]:visible:not([inert])').waitFor({timeout:30000});
      report.resumed=await state();assert.deepEqual(report.resumed,live,'Earned first-refuge reload changed V6 truth');
      assert.equal(await page.locator('iframe.combat-frame').count(),0);await capture('first-refuge-earned-resumed');
      assert.deepEqual(report.errors,[]);report.pass=true;break;
    }
    if(await page.locator('iframe.combat-frame').count()){await battle();continue;}
    if(await page.locator('.prologue-view').count()){await page.keyboard.press('Enter');}
    else if(await page.locator('.cinematic-overlay__skip:visible').count()){await click('.cinematic-overlay__skip:visible');}
    else if(await page.locator('.dialogue-choice:visible:not(:disabled)').count()){await click('.dialogue-choice:visible:not(:disabled)');}
    else if(await page.locator('.dialogue:visible').count()){await page.keyboard.press('Enter');}
    else if(await page.locator('[data-traversal-fork-choice="lion-first-trial-event"]:visible:not(:disabled)').count()){await click('[data-traversal-fork-choice="lion-first-trial-event"]:not(:disabled)');}
    else if(await page.locator('[data-traversal-confirm]:visible:not(:disabled)').count()){await click('[data-traversal-confirm]:visible:not(:disabled)');}
    else if(await page.locator('[data-journey-continue]:visible:not(:disabled)').count()){await click('[data-journey-continue]:visible:not(:disabled)');}
    else if(await page.locator('[data-journey-choice]:visible:not(:disabled)').count()){await click('[data-journey-choice]:visible:not(:disabled)');}
    await page.waitForTimeout(100);
  }
  assert.equal(report.pass,true,'Did not reach earned first refuge before the bounded deadline');
}catch(error){report.failure=error.stack;await capture('failure-state').catch(()=>{});
  report.lastState=await state().catch(()=>null);console.error(error.stack);process.exitCode=1;
}finally{
  const save=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')).catch(()=>null);
  if(save)await writeFile(resolve(output,'last-earned-autosave-v6.json'),save+'\n');
  const live=await state().catch(()=>null);
  if(live)await writeFile(resolve(output,'last-earned-owner-state-v6.json'),JSON.stringify(live,null,2)+'\n');
  await context.close();await browser.close();await new Promise((accept,reject)=>server.httpServer.close(error=>error?reject(error):accept()));
  report.endedAt=new Date().toISOString();await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({pass:report.pass,nodes:report.nodes,battles:report.battles.map(b=>({node:b.nodeId,pass:b.pass,actions:b.actions.length})),failure:report.failure},null,2));
