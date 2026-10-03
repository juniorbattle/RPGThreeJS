/** Earned production campaign proof: actual tactical inputs and bounded native campaign continuation. */
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { beginJob, demoJobOptions } from './qa/qa-job.mjs';

const port = Number(process.env.DEMO_QA_PORT ?? 5249);
const output = resolve(process.env.DEMO_QA_OUTPUT ?? 'tmp/demo/continuous-production');
const earnedSavePath=process.env.DEMO_QA_EARNED_SAVE;
const priorProofPath=process.env.DEMO_QA_PRIOR_PROOF;
const target=process.env.DEMO_QA_TARGET??'first-refuge';
const routePlan=process.env.DEMO_QA_ROUTE??'rescue';
const finalePlan=process.env.DEMO_QA_FINALE??(routePlan==='rescue'?'serpent':'trial');
const defeatNodeId=process.env.DEMO_QA_DEFEAT_NODE??'lion-village-choice';
const nativeDefeatWait=process.env.DEMO_QA_DEFEAT_WAIT==='1';
const viewport=(process.env.DEMO_QA_VIEWPORT??'1366x768').split('x').map(Number);
assert.ok(viewport.length===2&&viewport.every(n=>Number.isInteger(n)&&n>0),'Invalid viewport');
assert.ok(['first-refuge','second-refuge','ending','defeat-recovery'].includes(target),'Unknown bounded target');
if(target==='defeat-recovery')assert.equal(defeatNodeId,'lion-village-choice','Only the observed Bois-Clair defeat boundary is currently supported');
assert.ok(!nativeDefeatWait||target==='defeat-recovery','Native defeat wait requires the recovery target');
assert.ok(['rescue','sacrifice'].includes(routePlan),'Unknown authored route plan');
assert.ok(['serpent','trial'].includes(finalePlan),'Unknown authored finale intent');
if(Boolean(earnedSavePath)!==Boolean(priorProofPath))throw new Error('Earned resume requires both save and its actual input proof');
const earnedText=earnedSavePath?await readFile(earnedSavePath,'utf8'):null;
const priorProof=priorProofPath?JSON.parse(await readFile(priorProofPath,'utf8')):null;
if(priorProof){
  assert.equal(priorProof.pass,true,'Certified continuation requires successful prior proof');
  assert.equal(priorProof.failure,undefined,'Certified continuation cannot contain a failed assertion');
  assert.deepEqual(priorProof.errors,[]);
  assert.equal(priorProof.runtimeMutated,false);assert.equal(priorProof.combatOutcomeInjected,false);
  assert.ok(priorProof.battles.length&&priorProof.battles.every(b=>b.pass));
  const save=JSON.parse(earnedText);assert.equal(save.version,6);
  assert.ok(save.resolvedNodeIds.includes('lion-opening-ambush'));
  assert.deepEqual(save,priorProof.resumed,'Earned resume must match the exact verified resumed owner state');
  assert.ok(['lion-first-refuge','lion-second-refuge'].includes(save.currentNodeId));
  assert.equal(save.flags[`refugeSecured:${save.currentNodeId}`],true);
  assert.equal(save.run.temporaryLoot.gold,0);
}
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const jobOptions=demoJobOptions();
const qaJob=beginJob(jobOptions);
const server = await preview({preview:{host:'127.0.0.1',port,strictPort:true}});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:viewport[0],height:viewport[1]},
  reducedMotion:process.env.DEMO_QA_OS_MOTION==='1'?'reduce':'no-preference'});
const page = await context.newPage();
const report = {schemaVersion:1, recordedAt:new Date().toISOString(), method:'FRESH_PRODUCTION_CHRONICLE_NORMAL_PLAYER_INPUTS_REAL_COMBAT',
  fixtureStateWritten:false, combatOutcomeInjected:false, runtimeMutated:false, inputs:[], nodes:[], battles:[], captures:[], errors:[], pass:false};
report.qaJobReceipt=qaJob.receiptPath;
Object.assign(report,{target,routePlan,finalePlan,defeatNodeId,nativeDefeatWait,viewport:{width:viewport[0],height:viewport[1]},
  osReducedMotion:process.env.DEMO_QA_OS_MOTION==='1',observationHook:'Built bootstrap exposes GameApp for read-only snapshots; no owner method invoked',refuges:[],choices:[]});
report.nativeTacticalPolicy='Champion healer retains AP from the first turn, follows allies using native reachable cells, and prioritizes unlocked Salvation; all actions use existing native controls';
report.driverSha256=createHash('sha256').update(await readFile('tools/demo-continuous-production-qa.mjs')).digest('hex');
report.productionBundles=await Promise.all((await readdir('dist/assets')).filter(name=>/^(game|combat)-.*\.js$/.test(name))
  .map(async name=>({path:`dist/assets/${name}`,sha256:createHash('sha256').update(await readFile(`dist/assets/${name}`)).digest('hex')})));
if(priorProof){
  report.method='EARNED_PRODUCTION_CONTINUATION_NORMAL_PLAYER_INPUTS_REAL_COMBAT';
  report.earnedResume={savePath:earnedSavePath,priorProofPath,kind:'EXACT_VERIFIED_RESUMED_OWNER_STATE',sha256:createHash('sha256').update(earnedText).digest('hex'),proofSha256:createHash('sha256').update(await readFile(priorProofPath)).digest('hex')};
  report.nodes=[...priorProof.nodes];report.battles=structuredClone(priorProof.battles);
  report.inheritedBattleCount=report.battles.length;report.priorInputs=structuredClone(priorProof.inputs);
}
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('[VFX Preview]'))report.errors.push(message.text());});
page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')report.errors.push(`${request.url()}: ${request.failure()?.errorText}`);});
report.timeoutMinutes=jobOptions.parameters.timeoutMinutes;
const deadline=Date.now()+report.timeoutMinutes*60*1000;
async function capture(name){await page.screenshot({path:resolve(output,`${name}.png`)});report.captures.push(`${name}.png`);
  report.geometry??=[];report.geometry.push(await page.evaluate(name=>{
    const controls=[...document.querySelectorAll('.dialogue-choice,.exploration-stop button,[data-traversal-fork-choice],[data-traversal-confirm],[data-journey-choice],[data-journey-continue]')]
      .filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return{label:e.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
    return{name,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,controls,
      sequence:document.querySelector('.dialogue')?.dataset.dialogueSequence,step:document.querySelector('.dialogue')?.dataset.dialogueStep};
  },name));
}
async function state(){return page.evaluate(()=>JSON.parse(JSON.stringify(window.__demoQaApp.state)));}
async function click(selector){const button=page.locator(selector).first();await button.click();report.inputs.push({action:'click',selector});}
async function keyboardActivate(selector){await page.locator(selector).first().focus();await page.keyboard.press('Enter');report.inputs.push({action:'keyboard Enter',selector});}
async function choose(){
  const dialogue=page.locator('.dialogue:visible');
  const sequence=await dialogue.getAttribute('data-dialogue-sequence'),step=await dialogue.getAttribute('data-dialogue-step');
  const plans={reserve_trail:{'1':routePlan==='rescue'?1:0},village_choice:{'5':routePlan==='rescue'?0:1},
    old_shrine_event:{'1':routePlan==='rescue'?0:1},mystery_dragon_roost:{'1':1},
    serpent_informant:{'1':routePlan==='rescue'?0:1},mystery_lancer_recruit:{'1':routePlan==='rescue'?0:1},
    witnesses_on_road:{'1':routePlan==='rescue'?0:1},shadow_signs:{'1':0},
    lion_finale_judgement:{record:0,shadow:0,intent:finalePlan==='serpent'?0:1}};
  const index=plans[sequence]?.[step]??0;
  const button=dialogue.locator('.dialogue-choice:visible').nth(index);
  assert.equal(await button.isEnabled(),true,`Authored choice disabled: ${sequence}/${step}/${index}`);
  const text=await button.innerText();report.choices.push({sequence,step,index,text});
  await button.focus();await page.keyboard.press('Enter');report.inputs.push({action:'keyboard choice',sequence,step,index,text});
}
async function cancel(frame){await frame.locator('body').press('Escape');}
async function combatState(frame){return frame.evaluate(()=>{const g=window.G;return{round:g.round,turnIdx:g.turnIdx,mode:g.mode,busy:g.busy,
  over:g.over,moved:g.movedThisTurn,attacks:g.basicAttacksThisTurn,active:g.active&&{id:g.active.campaignId,name:g.active.name,team:g.active.team,
    gx:g.active.gx,gz:g.active.gz,hp:g.active.hp,maxhp:g.active.maxhp,ap:g.active.ap,skills:[...g.active.skills]},
  units:g.units.map(u=>({id:u.campaignId||u.id,name:u.name,team:u.team,gx:u.gx,gz:u.gz,hp:u.hp,maxhp:u.maxhp,alive:u.alive,downed:!!u.downed})),
  inventory:{...g.inv},diagnostics:window.__COMBAT_DIAGNOSTICS};});}
async function cellClick(frame,cell){
  const point=await frame.evaluate(({gx,gz})=>window.__qaHelpers.getCellScreenPosition(gx,gz),cell);
  const box=await page.locator('iframe.combat-frame').boundingBox();
  for(const [dx,dy] of [[0,0],[8,0],[-8,0],[0,8],[0,-8]]){
    const x=point.screenX+dx,y=point.screenY+dy;
    await page.mouse.move(box.x+x,box.y+y);await page.waitForTimeout(30);
    const hit=await frame.evaluate(({x,y,gx,gz})=>document.elementFromPoint(x,y)?.tagName==='CANVAS'&&window.G.hover?.gx===gx&&window.G.hover?.gz===gz,{x,y,...cell});
    if(hit){await page.mouse.click(box.x+x,box.y+y);return true;}
  }return false;
}
async function settled(frame){await frame.waitForFunction(()=>window.G.over||!window.G.busy&&window.G.mode==='menu',null,{timeout:30000});}
async function attack(frame,battle){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="attack"]:not(:disabled)').first();
  if(!await button.count())return false;
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
  const wounded=before.units.filter(u=>u.team==='player'&&u.alive&&u.hp<u.maxhp*.75);
  const fallen=before.units.filter(u=>u.team==='player'&&u.downed&&!u.alive);
  if(!wounded.length&&!fallen.length)return false;
  const item=frame.locator('#menu [data-a="item"]:not(:disabled)');if(!await item.count())return false;
  const itemId=fallen.length&&before.inventory.revive_vial>0?'revive_vial':'potion';
  const targets=itemId==='revive_vial'?fallen:wounded.sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp);
  if(!(before.inventory[itemId]>0)||!targets.length)return false;
  await item.click();const selected=frame.locator(`#skillmenu [data-i="${itemId}"]:not(:disabled)`);
  if(!await selected.count()){await cancel(frame);return false;} await selected.click();
  const centers=await frame.evaluate(()=>window.G.pending?.centers??[]);
  if(!centers.length){await cancel(frame);return false;}
  let chosen=false;
  for(const target of targets){if(centers.some(c=>c.gx===target.gx&&c.gz===target.gz)&&await cellClick(frame,target)){chosen=true;break;}}
  if(!chosen){await cancel(frame);return false;}
  await settled(frame); const after=await combatState(frame);
  if(after.inventory[itemId]===before.inventory[itemId]){await cancel(frame);return false;}
  battle.actions.push({kind:itemId,before,after});return true;
}
async function skill(frame,battle){
  const before=await combatState(frame),menu=frame.locator('#menu [data-a="skill"]:not(:disabled)');
  if(!await menu.count()){
    if(battle.combatId==='lion_chief')(battle.skillAttempts??=[]).push({round:before.round,active:before.active,nativeMenuEnabled:false});
    return false;
  }
  const wounded=before.units.filter(u=>u.team==='player'&&u.alive&&u.hp<u.maxhp*.95);
  const ids=(before.active.id==='white_mage'&&wounded.length
    ?['w_salvation','w_purify']:['n_dark_bolt','a_precise_shot','ar_calibrated_shot','w_break_guard']
  ).filter(id=>before.active.skills.includes(id));
  for(const id of ids){
    await menu.click();const option=frame.locator(`#skillmenu [data-s="${id}"]:not(:disabled)`);
    const attempt={skillId:id,round:before.round,active:before.active,available:await option.count()>0};
    if(battle.combatId==='lion_chief'){
      attempt.menu=await frame.locator('#skillmenu [data-s]:not([data-s="_back"])').evaluateAll(buttons=>buttons.map(b=>({id:b.dataset.s,disabled:b.disabled,text:b.textContent.trim()})));
      (battle.skillAttempts??=[]).push(attempt);
    }
    if(!await option.count()){await cancel(frame);continue;}
    await option.click();
    const pending=await frame.evaluate(()=>window.G.pending&&({spec:window.G.pending.spec,centers:window.G.pending.centers.map(c=>{
      const u=window.G.grid[c.gx]?.[c.gz]?.occupant;return{...c,targetId:u&&(u.campaignId||u.id)};
    })}));
    if(!pending){await cancel(frame);continue;}
    const targets=(id.startsWith('w_s')||id==='w_purify'?wounded:before.units.filter(u=>u.team==='foe'&&u.alive))
      .sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp);
    attempt.eligibleCenters=pending.centers.filter(c=>targets.some(t=>t.id===c.targetId));
    for(const cell of attempt.eligibleCenters){
      const target=targets.find(t=>t.id===cell.targetId);
      if(!await cellClick(frame,cell))continue;
      await settled(frame);const after=await combatState(frame);
      if(after.active?.id===before.active.id&&after.active.ap===before.active.ap){await cancel(frame);continue;}
      battle.actions.push({kind:'skill',skillId:id,targetId:target.id,spec:pending.spec,before,after});
      await capture(`combat-${battle.index}-${id}-${battle.actions.length}`);
      if(id==='w_salvation'&&process.env.DEMO_QA_VERIFY_SALVATION==='1'){
        const healed=after.units.find(u=>u.id===target.id);
        assert.equal(pending.spec.healPercent,.4,'Lumière Salvatrice lost its authored 40 percent heal in the action spec');
        assert.equal(healed.hp,Math.min(target.maxhp,target.hp+Math.round(target.maxhp*.4)));
        battle.actions.at(-1).verifiedHealing=true;
      }
      return true;
    }await cancel(frame);
  }return false;
}
async function move(frame,battle,{support=false}={}){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="move"]:not(:disabled)');
  if(!await button.count())return false;await button.click();
  const candidates=await frame.evaluate(support=>{const g=window.G,u=g.active,foes=g.units.filter(e=>e.team==='foe'&&e.alive);
    const allies=g.units.filter(e=>e.team===u.team&&e.alive&&e!==u);
    // This is a pilot preference only. Native reach and subsequent pointer
    // activation remain the authority for every move; no outcome is predicted.
    const distance=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gz-b.gz);
    const rank=c=>{if(support){
      const nearestFoe=Math.min(...foes.map(e=>distance(c,e)));
      const uncovered=allies.filter(a=>distance(c,a)>3).length;
      const woundedGap=allies.filter(a=>a.hp<a.maxhp*.95).reduce((sum,a)=>sum+Math.max(0,distance(c,a)-3),0);
      return (nearestFoe<3?1000:0)+uncovered*100+woundedGap*200+Math.abs(nearestFoe-4)*5;
    }
    let score=Infinity;for(const e of foes)for(const w of u.weapons){
      const d=Math.abs(c.gx-e.gx)+Math.abs(c.gz-e.gz),inRange=w.weaponType==='long_spear'
        ?Math.max(Math.abs(c.gx-e.gx),Math.abs(c.gz-e.gz))===1:d>=w.min&&d<=w.max;
      score=Math.min(score,(inRange?0:100)+d);
    }return score;};
    return(g.reach?.list??[]).filter(c=>(c.gx!==u.gx||c.gz!==u.gz)&&!g.grid[c.gx][c.gz].occupant)
      .map(c=>({gx:c.gx,gz:c.gz,score:rank(c)})).filter(c=>!support||c.score<rank(u)).sort((a,b)=>a.score-b.score);},support);
  for(const cell of candidates){if(await cellClick(frame,cell)){
    await page.waitForTimeout(50); const start=await combatState(frame);
    if(start.mode==='move'&&!start.busy)continue;
    await settled(frame); const after=await combatState(frame);
    battle.actions.push({kind:support?'move-support':'move',cell,before,after});return true;
  }}await cancel(frame);return false;
}
async function battle(){
  const element=page.locator('iframe.combat-frame');await element.waitFor({state:'attached'});
  const frame=await(await element.elementHandle()).contentFrame();
  await frame.waitForFunction(()=>window.__BOOTED===true,null,{timeout:60000});
  const entry={index:report.battles.length,nodeId:(await state()).currentNodeId,
    combatId:await page.evaluate(()=>window.__demoQaApp.combat.session?.config.id),actions:[],pass:false}; report.battles.push(entry);
  assert.equal(await frame.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnit),'undefined','Production mutation helper present');
  for(const selector of ['#tutorial:not(.hidden) [data-action="skip"]','#boss-tutorial:not(.hidden) [data-action="start"]']){
    if(await frame.locator(selector).isVisible().catch(()=>false))await frame.locator(selector).click();
  }
  await frame.locator('#menu [data-d="auto"]').click();
  entry.deployed=await frame.evaluate(()=>window.G.deployedUnits.length);assert.ok(entry.deployed>0&&entry.deployed<=4,'Deployment exceeds the existing four-unit cap');
  entry.ownerBefore=await state();
  entry.autosaveBefore=JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')));
  await capture(`combat-${entry.index}-deployment`);
  await frame.locator('#menu [data-d="start"]').click();
  for(let index=0;index<300&&Date.now()<deadline;index++){
    if(index%5===0){console.log(`BATTLE ${entry.nodeId} iteration ${index}, actions ${entry.actions.length}`);
      await writeFile(resolve(output,'progress.json'),JSON.stringify({at:new Date().toISOString(),nodeId:entry.nodeId,combat:await combatState(frame),actions:entry.actions.map(a=>a.kind)},null,2)+'\n');}
    await frame.waitForFunction(()=>window.G.over||window.G.mode==='menu'&&window.G.active?.team==='player'&&!window.G.busy,null,{timeout:60000});
    const current=await combatState(frame);if(current.over)break;
    if(nativeDefeatWait&&entry.nodeId===defeatNodeId){
      await frame.locator('#menu [data-a="wait"]').click();entry.actions.push({kind:'wait-for-native-defeat',before:current});continue;
    }
    if(current.active.ap<=0){await frame.locator('#menu [data-a="wait"]').click();entry.actions.push({kind:'wait',before:current});continue;}
    // A novice weapon unlocks no skills. Conserve only for a skill that the
    // native combat payload actually exposes, never for an assumed class skill.
    const conserveArcher=current.active.id==='archer'&&current.active.skills.some(id=>['a_precise_shot','ar_calibrated_shot'].includes(id));
    const supportHealer=entry.combatId==='lion_chief'&&current.active.id==='white_mage'&&current.active.skills.includes('w_salvation');
    if(supportHealer){
      if(await skill(frame,entry))continue;
      if(await heal(frame,entry))continue;
      if(await move(frame,entry,{support:true}))continue;
      await frame.locator('#menu [data-a="wait"]').click();entry.actions.push({kind:'wait-support-ap',before:current});continue;
    }
    if(entry.combatId==='lion_chief'&&conserveArcher&&current.active.ap===1&&current.attacks===0){
      await frame.locator('#menu [data-a="wait"]').click();entry.actions.push({kind:'wait-conserve-ap',before:current});continue;
    }
    if(await skill(frame,entry))continue;
    if(await heal(frame,entry))continue;
    if(await attack(frame,entry))continue;
    if(await move(frame,entry))continue;
    const before=await combatState(frame);
    await frame.locator('#menu [data-a="wait"]').click(); entry.actions.push({kind:'wait',before});
  }
  entry.result=await combatState(frame);
  assert.equal(entry.result.over,true,'Battle did not finish before bounded deadline');
  await capture(`combat-${entry.index}-result`);
  entry.resultText=await frame.locator('.combat-result-card').innerText();
  if(target==='defeat-recovery'&&entry.resultText.includes('Défaite')){
    assert.equal(entry.nodeId,defeatNodeId,'Defeat occurred before the requested native recovery boundary');
    assert.equal(entry.result.units.filter(u=>u.team==='player'&&u.alive).length,0);
    assert.ok(entry.actions.length>0,'Native defeat requires actual player actions');
    const savedBefore=JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')));
    assert.deepEqual(savedBefore,entry.autosaveBefore,'Combat altered autosave before defeat acknowledgement');
    const action=frame.getByRole('button',{name:'Revenir à la carte',exact:true});
    await action.focus();assert.equal(await action.evaluate(e=>e===document.activeElement),true);
    const bounds=await action.boundingBox();
    assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport[0]&&bounds.y+bounds.height<=viewport[1],
      'Defeat return control is clipped');
    await capture(`combat-${entry.index}-native-defeat-return-focus`);
    await action.press('Enter');report.inputs.push({action:'keyboard Enter',selector:'iframe #combat-result-action',outcome:'native defeat'});
    await element.waitFor({state:'detached',timeout:30000});
    await page.waitForFunction(id=>window.__demoQaApp?.state.currentNodeId===id,savedBefore.run.checkpointNodeId);
    const departure=page.locator('[data-journey-continue]:visible:not([inert])');
    await departure.waitFor({state:'visible',timeout:30000});
    assert.equal((await departure.textContent()).trim(),'Prendre la route');
    assert.equal(await departure.isEnabled(),true);assert.equal(await departure.evaluate(e=>!!e.closest('[inert]')),false);
    await departure.focus();assert.equal(await departure.evaluate(e=>e===document.activeElement),true);
    const recovered=await state();
    const expected=structuredClone(savedBefore),downstream=new Set();
    const nodes=new Map(expected.run.graph.nodes.map(node=>[node.id,node]));
    const visit=id=>{if(downstream.has(id))return;downstream.add(id);for(const next of nodes.get(id)?.links??[])visit(next);};
    for(const id of nodes.get(expected.run.checkpointNodeId)?.links??[])visit(id);
    expected.currentNodeId=expected.run.currentNodeId=expected.run.checkpointNodeId;
    expected.run.status='active';expected.run.temporaryLoot.gold=0;
    for(const category of Object.keys(expected.run.temporaryLoot.inventory))expected.run.temporaryLoot.inventory[category]={};
    if(expected.run.bypassedRouteNodeIds)expected.run.bypassedRouteNodeIds=expected.run.bypassedRouteNodeIds.filter(id=>!downstream.has(id));
    if(expected.run.traversalBranches)expected.run.traversalBranches=Object.fromEntries(Object.entries(expected.run.traversalBranches).filter(([,id])=>!downstream.has(id)));
    assert.deepEqual(recovered,expected,'Full recovery differs from the existing checkpoint rule');
    assert.equal(recovered.currentNodeId,savedBefore.run.checkpointNodeId);
    assert.equal(recovered.run.currentNodeId,savedBefore.run.checkpointNodeId);
    assert.equal(recovered.run.status,'active');
    assert.equal(recovered.run.temporaryLoot.gold,0);
    for(const inventory of Object.values(recovered.run.temporaryLoot.inventory))assert.deepEqual(inventory,{});
    for(const key of Object.keys(savedBefore).filter(key=>!['currentNodeId','run'].includes(key))){
      assert.deepEqual(recovered[key],savedBefore[key],`Defeat changed autosaved ${key}`);
    }
    assert.equal(recovered.run.traversalBranches?.T1,undefined,'Failed leg branch survives checkpoint recovery');
    assert.equal(recovered.run.traversalBranches?.T3,undefined);
    assert.equal(recovered.run.traversalBranches?.T0,savedBefore.run.traversalBranches?.T0);
    for(const key of ['checkpointNodeId','graph','visitedNodeIds','revealedNodeIds'])assert.deepEqual(recovered.run[key],savedBefore.run[key]);
    const savedAfter=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
    assert.deepEqual(JSON.parse(savedAfter),recovered,'Recovery agency precedes durable owner truth');
    await writeFile(resolve(output,'earned-defeat-recovery-v6.json'),savedAfter+'\n');
    await page.waitForTimeout(400);await capture('native-defeat-recovered');
    await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
    await page.waitForFunction(id=>window.__demoQaApp?.state.currentNodeId===id,recovered.currentNodeId);
    await departure.waitFor({state:'visible',timeout:30000});
    assert.equal((await departure.textContent()).trim(),'Prendre la route');
    assert.equal(await departure.isEnabled(),true);assert.equal(await departure.evaluate(e=>!!e.closest('[inert]')),false);
    await departure.focus();assert.equal(await departure.evaluate(e=>e===document.activeElement),true);
    const resumed=await state();assert.deepEqual(resumed,recovered,'Defeat recovery reload changed V6 truth');
    assert.equal(await page.locator('iframe.combat-frame').count(),0,'Reload replayed defeated combat');
    await capture('native-defeat-recovered-resumed');
    entry.pass=true;entry.outcome='defeat';entry.ownerAfter=recovered;
    report.defeatRecovery={nodeId:entry.nodeId,checkpoint:recovered.currentNodeId,savedBefore,recovered,resumed,
      returnControlBounds:bounds,mode:await page.locator('body').getAttribute('data-mode'),
      expected,departureLabel:await departure.textContent(),pass:true};
    report.resumed=resumed;assert.deepEqual(report.errors,[]);report.pass=true;
    return;
  }
  assert.ok(entry.resultText.includes('Victoire'),`Actual battle ended without victory: ${entry.resultText}`);
  assert.equal(entry.result.units.filter(u=>u.team==='foe'&&u.alive).length,0);
  assert.ok(entry.actions.some(a=>a.kind==='attack'));entry.pass=true;
  entry.outcome='victory';
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
  report.motionEvidence=await page.evaluate(()=>({
    osRequested:matchMedia('(prefers-reduced-motion: reduce)').matches,
    gameRequested:window.__demoQaApp.state.settings.reducedGraphics,
  }));
  assert.equal(report.motionEvidence.osRequested,report.osReducedMotion,'OS motion emulation does not match the requested scenario');
  if(report.osReducedMotion)assert.equal(report.motionEvidence.gameRequested,false,'OS-only motion proof requires normal game graphics');
  for(let index=0;index<12000&&Date.now()<deadline;index++){
    const live=await state();if(report.nodes.at(-1)!==live.currentNodeId){report.nodes.push(live.currentNodeId);console.log(`NODE ${live.currentNodeId}`);}
    const hub=page.locator('.exploration-stop:visible:not([inert])');
    if(await hub.count()){
      const nodeId=await hub.getAttribute('data-refuge-node');
      const stop=target==='first-refuge'&&nodeId==='lion-first-refuge'||target==='second-refuge'&&nodeId==='lion-second-refuge';
      report.refuge=live;await capture(`${nodeId}-earned`);
      assert.ok(report.battles.length&&report.battles.every(b=>b.pass));
      assert.ok(live.resolvedNodeIds.includes('lion-opening-ambush'));
      assert.equal(live.flags[`refugeSecured:${nodeId}`],true);assert.equal(live.run.temporaryLoot.gold,0);
      if(nodeId==='lion-second-refuge'){
        assert.ok(live.resolvedNodeIds.includes('lion-village-choice'));
        assert.equal(live.run.traversalBranches.T1,'lion-second-trial-event');
        assert.equal(live.flags.missionSuccess,routePlan==='rescue');
        assert.equal(Boolean(live.flags.missionGreed),routePlan==='sacrifice');
      }
      const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      assert.deepEqual(JSON.parse(saved),live,'Earned refuge agency precedes durable owner truth');
      await writeFile(resolve(output,`earned-${nodeId}-v6.json`),saved+'\n');
      if(nodeId==='lion-first-refuge')await writeFile(resolve(output,'earned-first-refuge-v6.json'),saved+'\n');
      await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
      await page.locator(`.exploration-stop[data-refuge-node="${nodeId}"]:visible:not([inert])`).waitFor({timeout:30000});
      report.resumed=await state();assert.deepEqual(report.resumed,live,'Earned refuge reload changed V6 truth');
      assert.equal(await page.locator('iframe.combat-frame').count(),0);await capture(`${nodeId}-earned-resumed`);
      report.refuges.push({nodeId,entry:live,resumed:report.resumed});
      if(stop){assert.deepEqual(report.errors,[]);report.pass=true;break;}
      const rest=page.locator('.exploration-stop [data-action="rest"]:not(:disabled)');
      if(await rest.count()){
        await keyboardActivate('.exploration-stop [data-action="rest"]:not(:disabled)');
        await hub.waitFor({state:'visible'});await page.waitForTimeout(150);
        const rested=await state();assert.ok(rested.gold<live.gold,'Native rest did not debit owner gold');
        assert.ok(rested.clan.members.every(u=>u.currentHealth>0),'Native rest left downed clan member');
        report.refuges.at(-1).rested=rested;await capture(`${nodeId}-native-rest`);
      }
      if(nodeId==='lion-second-refuge'&&target==='ending'){
        await keyboardActivate('.exploration-stop [data-action="shop"]');
        const buy='.management [data-trade="buy"][data-item="sacred_crosier"]';
        await page.locator(buy).waitFor({state:'visible'});assert.equal(await page.locator(buy).isEnabled(),true);
        const before=await state(),price=Number.parseInt(await page.locator(buy).innerText(),10);
        await keyboardActivate(buy);const bought=await state();assert.equal(bought.gold,before.gold-price);
        assert.equal(bought.inventory.weapons.sacred_crosier,(before.inventory.weapons.sacred_crosier??0)+1);
        report.refuges.at(-1).purchase={itemId:'sacred_crosier',price,before,after:bought};
        await page.keyboard.press('Escape');await hub.waitFor({state:'visible'});
      }
      await keyboardActivate('.exploration-stop [data-action="clan"]');
      await page.locator('.management [data-action="close"]').waitFor({state:'visible'});
      if(nodeId==='lion-second-refuge'&&target==='ending'){
        await keyboardActivate('.management [data-unit="white_mage"]');
        await keyboardActivate('.management [data-equip-slot="weapon"]');
        await keyboardActivate('.management [data-preview-item="sacred_crosier"]');
        await keyboardActivate('.management [data-equip-confirm="sacred_crosier"]');
        const equipped=await state();assert.deepEqual(equipped.clan.members.find(u=>u.id==='white_mage').equipment.weaponIds,['sacred_crosier']);
        report.refuges.at(-1).equipped=equipped;await capture(`${nodeId}-native-sacred-crosier`);
      }
      await page.keyboard.press('Escape');await hub.waitFor({state:'visible'});
      await keyboardActivate('.exploration-stop [data-action="continue"]');continue;
    }
    if(target==='ending'&&live.endingId&&await page.locator('.journey-overlay--terminal:visible').count()){
      report.ending=live;await capture(`ending-${live.endingId}`);
      assert.equal(live.run.status,'completed');assert.ok(live.resolvedNodeIds.includes('lion-final-judgement'));
      assert.equal(live.run.temporaryLoot.gold,0);
      assert.equal(live.endingId,finalePlan==='serpent'?'lion-seal-serpent-truth':'lion-seal-trial-truth');
      const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      assert.deepEqual(JSON.parse(saved),live);await writeFile(resolve(output,'earned-ending-v6.json'),saved+'\n');
      await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
      await page.waitForFunction(id=>window.__demoQaApp?.state.endingId===id,live.endingId);
      await page.locator('.journey-overlay--terminal:visible').waitFor({timeout:30000});
      assert.equal(await page.locator('.dialogue:visible,iframe.combat-frame,.traversal-road:visible').count(),0);
      report.resumed=await state();assert.deepEqual(report.resumed,live);await capture(`ending-${live.endingId}-resumed`);
      assert.deepEqual(report.errors,[]);report.pass=true;break;
    }
    if(await page.locator('iframe.combat-frame').count()){await battle();if(report.defeatRecovery?.pass)break;continue;}
    if(await page.locator('.prologue-view').count()){await page.keyboard.press('Enter');}
    else if(await page.locator('.cinematic-overlay__skip:visible').count()){await click('.cinematic-overlay__skip:visible');}
    else if(await page.locator('.dialogue-choice:visible:not(:disabled)').count()){await choose();}
    else if(await page.locator('.dialogue:visible').count()){await page.keyboard.press('Enter');}
    else if(await page.locator('[data-traversal-fork-choice="lion-first-trial-event"]:visible:not(:disabled)').count()){await click('[data-traversal-fork-choice="lion-first-trial-event"]:not(:disabled)');}
    else if(await page.locator('[data-traversal-fork-choice="lion-second-trial-event"]:visible:not(:disabled)').count()){await keyboardActivate('[data-traversal-fork-choice="lion-second-trial-event"]:not(:disabled)');}
    else if(await page.locator('[data-traversal-fork-choice="lion-final-trial-event"]:visible:not(:disabled)').count()){await keyboardActivate('[data-traversal-fork-choice="lion-final-trial-event"]:not(:disabled)');}
    else if(await page.locator('[data-traversal-confirm]:visible:not(:disabled)').count()){await click('[data-traversal-confirm]:visible:not(:disabled)');}
    else if(await page.locator('[data-journey-continue]:visible:not(:disabled)').count()){await click('[data-journey-continue]:visible:not(:disabled)');}
    else if(await page.locator('[data-journey-choice]:visible:not(:disabled)').count()){await click('[data-journey-choice]:visible:not(:disabled)');}
    await page.waitForTimeout(100);
  }
  assert.equal(report.pass,true,`Did not reach earned ${target} before the bounded deadline`);
  report.salvationVerified=report.battles.slice(report.inheritedBattleCount??0).some(b=>b.actions.some(a=>a.verifiedHealing));
  if(target==='ending'&&process.env.DEMO_QA_VERIFY_SALVATION==='1')assert.equal(report.salvationVerified,true,'No new verified Salvation cast occurred');
}catch(error){report.pass=false;report.failure=error.stack;await capture('failure-state').catch(()=>{});
  report.lastState=await state().catch(()=>null);console.error(error.stack);process.exitCode=1;
}finally{
  const save=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')).catch(()=>null);
  if(save)await writeFile(resolve(output,'last-earned-autosave-v6.json'),save+'\n');
  const live=await state().catch(()=>null);
  if(live)await writeFile(resolve(output,'last-earned-owner-state-v6.json'),JSON.stringify(live,null,2)+'\n');
  await context.close();await browser.close();await new Promise((accept,reject)=>server.httpServer.close(error=>error?reject(error):accept()));
  report.endedAt=new Date().toISOString();await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  if(qaJob.finish(report).status!=='SUCCEEDED')process.exitCode=1;
}
console.log(JSON.stringify({pass:report.pass,nodes:report.nodes,battles:report.battles.map(b=>({node:b.nodeId,pass:b.pass,actions:b.actions.length})),failure:report.failure},null,2));
