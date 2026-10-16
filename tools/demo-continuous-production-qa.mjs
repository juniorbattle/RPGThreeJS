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
const touchInput=process.env.DEMO_QA_TOUCH==='1';
const nativeEquipment=process.env.DEMO_QA_EQUIPMENT==='steel';
const trialPlan=process.env.DEMO_QA_TRIALS??'event';
const explorationPlan=process.env.DEMO_QA_EXPLORATION??'direct';
const checkpointPoiId=process.env.DEMO_QA_CHECKPOINT_POI??null;
assert.ok(['direct','moderate','complete'].includes(explorationPlan),'Unknown Lot E native exploration strategy');
assert.ok(!(explorationPlan==='complete'&&target==='valmir'),'Complete region II exploration requires target second-refuge or later');
const lotE=JSON.parse(await readFile('docs/project/RPGThreeJS_LOT_E_MANIFEST_AUTHORING_FINAL_2026-10-15.json','utf8'));
const viewport=(process.env.DEMO_QA_VIEWPORT??'1366x768').split('x').map(Number);
const preparationContinue='[data-narrative-tableau="FINAL_REFUGE_PREPARATION_TABLEAU"] [data-journey-continue]:visible:not(:disabled)';
const genericJourneyContinue='[data-journey-continue]:visible:not(:disabled):not([data-narrative-tableau="FINAL_REFUGE_PREPARATION_TABLEAU"] [data-journey-continue])';
assert.ok(viewport.length===2&&viewport.every(n=>Number.isInteger(n)&&n>0),'Invalid viewport');
assert.ok(['first-refuge','second-refuge','second-trial','valmir','preparation','ending','terminal','defeat-recovery','expedition-checkpoint'].includes(target),'Unknown bounded target');
assert.ok(target!=='expedition-checkpoint'||lotE.fixedPoiCandidates.some(poi=>poi.id===checkpointPoiId),'Native expedition checkpoint requires an approved optional POI');
assert.ok(['event','combat'].includes(trialPlan),'Unknown authored trial alternative');
assert.ok(!(process.env.DEMO_QA_OS_MOTION==='1'&&process.env.DEMO_QA_GAME_MOTION==='1'),'OS-only and native game reduction are separate acceptance cases');
if(target==='defeat-recovery')assert.ok(['lion-village-choice','lion-second-trial-combat','lion-final-trial-combat',
  ...lotE.fixedPoiCandidates.filter(poi=>poi.combat&&poi.region>0).map(poi=>poi.id)].includes(defeatNodeId),'Unknown authored refuge-checkpoint defeat boundary');
assert.ok(!nativeDefeatWait||target==='defeat-recovery','Native defeat wait requires the recovery target');
assert.ok(['rescue','sacrifice'].includes(routePlan),'Unknown authored route plan');
assert.ok(['serpent','trial'].includes(finalePlan),'Unknown authored finale intent');
if(Boolean(earnedSavePath)!==Boolean(priorProofPath))throw new Error('Earned resume requires both save and its actual input proof');
const earnedText=earnedSavePath?await readFile(earnedSavePath,'utf8'):null;
const priorProof=priorProofPath?JSON.parse(await readFile(priorProofPath,'utf8')):null;
if(priorProof){
  assert.ok(priorProof.qaJobReceipt,'Certified continuation requires its finalized QA receipt');
  const receipt=JSON.parse(await readFile(priorProof.qaJobReceipt,'utf8'));
  assert.equal(receipt.status,'SUCCEEDED','An interrupted or failed worker cannot seed native continuation');
  assert.equal(receipt.exitCode,0);
  assert.equal(receipt.provenanceStable,true,'Prior native execution provenance drifted');
  assert.equal(resolve(receipt.resultPath),resolve(priorProofPath),'Prior receipt describes another result');
  assert.equal(receipt.resultSha256,createHash('sha256').update(await readFile(priorProofPath)).digest('hex'),'Prior native result hash mismatches its receipt');
  assert.equal(priorProof.pass,true,'Certified continuation requires successful prior proof');
  assert.equal(priorProof.failure,undefined,'Certified continuation cannot contain a failed assertion');
  assert.deepEqual(priorProof.errors,[]);
  assert.equal(priorProof.runtimeMutated,false);assert.equal(priorProof.combatOutcomeInjected,false);
  assert.ok(priorProof.battles.length&&priorProof.battles.every(b=>b.pass));
  const save=JSON.parse(earnedText);assert.equal(save.version,6);
  assert.ok(save.resolvedNodeIds.includes('lion-opening-ambush'));
  assert.deepEqual(save,priorProof.resumed,'Earned resume must match the exact verified resumed owner state');
  const optionalCheckpoint=lotE.fixedPoiCandidates.some(poi=>poi.id===save.currentNodeId);
  assert.ok(optionalCheckpoint||['lion-first-refuge','lion-second-refuge','lion-final-refuge','lion-valmir-road','lion-second-trial-combat','lion-final-judgement'].includes(save.currentNodeId));
  if(optionalCheckpoint){
    assert.equal(priorProof.target,'expedition-checkpoint');
    assert.equal(receipt.parameters.target,'expedition-checkpoint');assert.equal(receipt.parameters.checkpointPoiId,save.currentNodeId);
    assert.equal(priorProof.expeditionCheckpoint?.id,save.currentNodeId);assert.equal(priorProof.expeditionCheckpoint?.pass,true);
    assert.ok(save.resolvedNodeIds.includes(save.currentNodeId));
    assert.equal(save.run.poiExpedition.pendingStep,undefined);assert.equal(save.run.poiExpedition.encounter,undefined);
  }else if(save.currentNodeId==='lion-second-trial-combat'){
    assert.equal(target,'second-refuge');assert.equal(priorProof.target,'second-trial');
    assert.ok(save.resolvedNodeIds.includes(save.currentNodeId));assert.ok(save.resolvedNodeIds.includes('lion-valmir-road'));
    assert.ok(save.resolvedNodeIds.includes('lion-first-refuge'));assert.equal(save.flags['refugeSecured:lion-first-refuge'],true);
    assert.equal(save.run.checkpointNodeId,'lion-first-refuge');assert.equal(save.run.traversalBranches.T1,save.currentNodeId);
    assert.ok(save.run.temporaryLoot.gold>0);
    assert.ok(priorProof.battles.some(b=>b.nodeId===save.currentNodeId&&b.pass&&b.outcome==='victory'));
  }else if(save.currentNodeId==='lion-valmir-road'){
    assert.ok(save.resolvedNodeIds.includes(save.currentNodeId));assert.ok(save.run.temporaryLoot.gold>0);
    assert.equal(save.run.checkpointNodeId,'lion-first-refuge');
    const combatId=save.run.graph.nodes.find(node=>node.id===save.currentNodeId)?.contentId;
    assert.ok(['road_to_valmir','marsh_crossing'].includes(combatId));
    assert.ok(priorProof.battles.some(b=>b.nodeId===save.currentNodeId&&b.combatId===combatId&&b.pass&&b.outcome==='victory'));
  }else if(save.currentNodeId==='lion-final-judgement'){
    assert.equal(target,'terminal');assert.equal(save.run.status,'completed');assert.ok(save.endingId);
  }else if(save.currentNodeId==='lion-final-refuge')assert.ok(save.resolvedNodeIds.includes(save.currentNodeId));
  else {assert.equal(save.flags[`refugeSecured:${save.currentNodeId}`],true);assert.equal(save.run.temporaryLoot.gold,0);}
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
  hasTouch:touchInput,isMobile:touchInput,
  reducedMotion:process.env.DEMO_QA_OS_MOTION==='1'?'reduce':'no-preference'});
const page = await context.newPage();
const report = {schemaVersion:1, recordedAt:new Date().toISOString(), method:'FRESH_PRODUCTION_CHRONICLE_NORMAL_PLAYER_INPUTS_REAL_COMBAT',
  fixtureStateWritten:false, combatOutcomeInjected:false, runtimeMutated:false, inputs:[], nodes:[], battles:[], captures:[], errors:[], pass:false};
report.qaJobReceipt=qaJob.receiptPath;report.touchInput=touchInput;report.nativeEquipment=nativeEquipment;
report.expedition={strategy:explorationPlan,phases:{},chests:[],interceptions:[],waits:[],intents:[]};
report.trustedTouch=[];
if(touchInput){
  await context.exposeBinding('__recordQaTouch',(_source,event)=>report.trustedTouch.push(event));
  await context.addInitScript(()=>document.addEventListener('pointerdown',event=>{
    if(event.isTrusted&&event.pointerType==='touch')window.__recordQaTouch({target:event.target.id||event.target.tagName,at:Date.now()});
  },true));
}
Object.assign(report,{target,routePlan,finalePlan,trialPlan,defeatNodeId,nativeDefeatWait,viewport:{width:viewport[0],height:viewport[1]},
  osReducedMotion:process.env.DEMO_QA_OS_MOTION==='1',observationHook:'Built bootstrap exposes GameApp for read-only snapshots; no owner method invoked',refuges:[],choices:[]});
report.nativeTacticalPolicy='Salvation and skill targets prioritize lowest-health eligible native targets; novice crosier uses lowest-charge ally attacks and follows wounded allies; potions below75% for Champion/Raid and50% elsewhere; read-only rejection telemetry; existing native controls only';
report.nativePreparationPolicy='Existing native equipment/shop and paid refuge rest; complete+equipment buys steel, then at Second refuge forges the existing Espadon de Braise recipe for80 permanent gold/2iron; explicit prepared routes may sell existing supplies to fund paid rest; exact native transactions and temporary-loot invariance';
report.nativeNavigationPolicy='Production native adjacent POI intentions; no physical engine or driving fallback';
report.driverSha256=createHash('sha256').update(await readFile('tools/demo-continuous-production-qa.mjs')).digest('hex');
report.productionBundles=await Promise.all((await readdir('dist/assets')).filter(name=>/^(game|combat)-.*\.js$/.test(name))
  .map(async name=>({path:`dist/assets/${name}`,sha256:createHash('sha256').update(await readFile(`dist/assets/${name}`)).digest('hex')})));
if(priorProof){
  report.method='EARNED_PRODUCTION_CONTINUATION_NORMAL_PLAYER_INPUTS_REAL_COMBAT';
  report.earnedResume={savePath:earnedSavePath,priorProofPath,kind:'EXACT_VERIFIED_RESUMED_OWNER_STATE',sha256:createHash('sha256').update(earnedText).digest('hex'),proofSha256:createHash('sha256').update(await readFile(priorProofPath)).digest('hex')};
  report.nodes=[...priorProof.nodes];report.battles=structuredClone(priorProof.battles);
  report.inheritedBattleCount=report.battles.length;report.priorInputs=structuredClone(priorProof.inputs);
  // Resume only the external native pilot's route cursor. No game/save fact is written.
  report.expedition.phases=structuredClone(priorProof.expedition?.phases??{});
}
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('[VFX Preview]'))report.errors.push(message.text());});
page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')report.errors.push(`${request.url()}: ${request.failure()?.errorText}`);});
report.timeoutMinutes=jobOptions.parameters.timeoutMinutes;
if(jobOptions.parameters.timeoutAuthority)report.timeoutAuthority=jobOptions.parameters.timeoutAuthority;
const deadline=Date.now()+report.timeoutMinutes*60*1000;
async function capture(name,timeout=30000){await page.screenshot({path:resolve(output,`${name}.png`),timeout});report.captures.push(`${name}.png`);
  report.geometry??=[];report.geometry.push(await page.evaluate(name=>{
    const controls=[...document.querySelectorAll('.dialogue-choice,.exploration-stop button,.poi-map nav button,.poi-map__atlas-bar button,.poi-map__detail button,.poi-marker[aria-pressed="true"],.poi-dialog button,[data-journey-choice],[data-journey-continue]')]
      .filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return{label:e.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,focused:e===document.activeElement,inert:!!e.closest('[inert]')};});
    const navLabelOverflows=[...document.querySelectorAll('.poi-map__header nav button')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim());
    const land=document.querySelector('.poi-map__land')?.getBoundingClientRect();
    const markerLabels=land?[...document.querySelectorAll('.poi-marker__name')].map(e=>{
      const r=e.getBoundingClientRect();return{label:e.textContent.trim(),left:Math.max(0,land.left,r.left),top:Math.max(0,land.top,r.top),right:Math.min(innerWidth,land.right,r.right),bottom:Math.min(innerHeight,land.bottom,r.bottom)};
    }).filter(r=>r.right>r.left&&r.bottom>r.top):[];
    const markerLabelOverlaps=[];
    for(let i=0;i<markerLabels.length;i++)for(let j=i+1;j<markerLabels.length;j++){
      const a=markerLabels[i],b=markerLabels[j];
      if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)markerLabelOverlaps.push([a.label,b.label]);
    }
    return{name,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,controls,navLabelOverflows,markerLabels,markerLabelOverlaps,
      sequence:document.querySelector('.dialogue')?.dataset.dialogueSequence,step:document.querySelector('.dialogue')?.dataset.dialogueStep};
  },name));
  assert.deepEqual(report.geometry.at(-1).markerLabelOverlaps,[],'Visible native map labels overlap');
  assert.deepEqual(report.geometry.at(-1).navLabelOverflows,[],'Native atlas action labels overflow their button');
}
async function state(){return page.evaluate(()=>JSON.parse(JSON.stringify(window.__demoQaApp.state)));}
async function activateControl(control){if(touchInput)await control.tap();else await control.click();}
async function click(selector){const button=page.locator(selector).first();await activateControl(button);report.inputs.push({action:touchInput?'native touch':'click',selector});}
async function keyboardActivate(selector){const button=page.locator(selector).first();if(touchInput)await button.tap();else {await button.focus();await page.keyboard.press('Enter');}report.inputs.push({action:touchInput?'native touch':'keyboard Enter',selector});}
async function advanceDialogue(){if(touchInput)await activateControl(page.locator('.dialogue:visible .dialogue__box:not(:disabled)').first());else await page.keyboard.press('Enter');}
async function choose(){
  const dialogue=page.locator('.dialogue:visible');
  const sequence=await dialogue.getAttribute('data-dialogue-sequence'),step=await dialogue.getAttribute('data-dialogue-step');
  const plans={reserve_trail:{'1':routePlan==='rescue'?1:0},village_choice:{'5':routePlan==='rescue'?0:1},
    old_shrine_event:{'1':routePlan==='rescue'?0:1},mystery_dragon_roost:{'1':1},
    serpent_informant:{'1':routePlan==='rescue'?0:1},mystery_lancer_recruit:{'1':routePlan==='rescue'?0:1},
    witnesses_on_road:{'1':routePlan==='rescue'?0:1},shadow_signs:{'1':0},
    lion_finale_judgement:{record:0,shadow:0,intent:finalePlan==='serpent'?0:1}};
  if(target==='second-refuge'||target==='first-refuge')plans.rep_event_roadside_intimidation={'1':1};
  const index=plans[sequence]?.[step]??0;
  const button=dialogue.locator('.dialogue-choice:visible').nth(index);
  assert.equal(await button.isEnabled(),true,`Authored choice disabled: ${sequence}/${step}/${index}`);
  const text=await button.innerText();report.choices.push({sequence,step,index,text});
  const tribute=target==='first-refuge'&&sequence==='rep_event_roadside_intimidation'&&step==='1'&&index===1
    ?await state():null;
  const petition=sequence==='rep_event_public_petition'&&step==='1'&&index===0?await state():null;
  const information=sequence==='rep_event_brokered_information'&&step==='1'&&index===0?await state():null;
  if(touchInput)await button.tap();else {await button.focus();await page.keyboard.press('Enter');}report.inputs.push({action:touchInput?'touch choice':'keyboard choice',sequence,step,index,text});
  if(tribute){
    await page.waitForFunction(gold=>window.__demoQaApp.state.gold===gold-20&&window.__demoQaApp.state.flags.r4PaidRoadsideTribute===true,tribute.gold);
    const paid=await state();assert.equal(paid.gold,tribute.gold-20);
    assert.deepEqual(paid.run.temporaryLoot,tribute.run.temporaryLoot);
    report.poi??={native:true};report.poi.legacyDepartureChoice={sequence,step,index,text,goldBefore:tribute.gold,goldAfter:paid.gold,
      authoredCost:20,temporaryLootUnchanged:true,paidFlag:true};
  }
  if(petition){
    assert.notEqual(petition.flags.r4FundedPublicPetition,true,'The native petition must be a fresh authored event');
    await page.waitForFunction(()=>window.__demoQaApp.state.flags.r4FundedPublicPetition===true);
    const after=await state(),expected=structuredClone(petition);
    assert.ok(petition.gold+petition.run.temporaryLoot.gold>=35,'Native funded petition must be affordable');
    const temporaryCost=Math.min(35,petition.run.temporaryLoot.gold),securedCost=35-temporaryCost;
    expected.run.temporaryLoot.gold-=temporaryCost;expected.gold-=securedCost;
    expected.flags.r4FundedPublicPetition=true;
    expected.reputation=Math.min(100,petition.reputation+3);
    expected.reputationHistory.push({delta:3,source:'narrative',value:expected.reputation});
    assert.deepEqual(after,expected,'Native public petition differs from its authored exact consequences');
    (report.nativeDepartureEvents??=[]).push({sequence,step,index,text,before:petition,after,authoredCost:35,temporaryCost,securedCost,reputationDelta:3,markerEvent:'public-petition|public-expectation'});
  }
  if(information){
    assert.notEqual(information.flags.r4BoughtRoadInformation,true,'Road information must be a fresh authored purchase');
    await page.waitForFunction(()=>window.__demoQaApp.state.flags.r4BoughtRoadInformation===true);
    const after=await state(),expected=structuredClone(information);
    assert.ok(information.gold+information.run.temporaryLoot.gold>=25);
    const temporaryCost=Math.min(25,information.run.temporaryLoot.gold),securedCost=25-temporaryCost;
    expected.run.temporaryLoot.gold-=temporaryCost;expected.gold-=securedCost;expected.flags.r4BoughtRoadInformation=true;
    assert.deepEqual(after,expected,'Native road information differs from its exact authored cost/flag');
    (report.nativeDepartureEvents??=[]).push({sequence,step,index,text,before:information,after,authoredCost:25,temporaryCost,securedCost,reputationDelta:0,markerEvent:'brokered-information|roadside-opportunity'});
  }
}
async function cancel(frame){
  if(!touchInput){await frame.locator('body').press('Escape');return;}
  const back=frame.locator('#skillmenu [data-ch="_back"]:visible,#skillmenu [data-s="_back"]:visible,#skillmenu [data-i="_back"]:visible').first();
  if(await back.count())await back.tap();
  else await frame.locator('#menu .is-selected[data-a]:visible').first().tap();
}
async function combatState(frame){return frame.evaluate(()=>{const g=window.G;return{round:g.round,turnIdx:g.turnIdx,mode:g.mode,busy:g.busy,
  over:g.over,moved:g.movedThisTurn,attacks:g.basicAttacksThisTurn,active:g.active&&{id:g.active.campaignId,name:g.active.name,team:g.active.team,
    gx:g.active.gx,gz:g.active.gz,hp:g.active.hp,maxhp:g.active.maxhp,ap:g.active.ap,maxap:g.active.maxap,skills:[...g.active.skills],
    statuses:{...g.active.statuses},weapons:g.active.weapons.map(w=>({name:w.name,weaponType:w.weaponType,min:w.min,max:w.max}))},
  units:g.units.map(u=>({id:u.campaignId||u.id,name:u.name,team:u.team,gx:u.gx,gz:u.gz,hp:u.hp,maxhp:u.maxhp,alive:u.alive,downed:!!u.downed})),
  inventory:{...g.inv},diagnostics:window.__COMBAT_DIAGNOSTICS};});}
async function campaignBattlefieldKeyboard(frame,entry){
  await frame.waitForFunction(()=>G.mode==='menu'&&!G.busy&&G.active?.team==='player');
  const ownerBefore=await state(),before=await combatState(frame);
  const autosaveBefore=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
  const inputs=[];
  const key=async value=>{await page.keyboard.press(value);inputs.push(value);report.inputs.push({action:'native campaign battlefield key',key:value,nodeId:entry.nodeId});};
  const canvas=frame.locator('#combat-battlefield');
  for(let step=0;step<70;step++){
    if(await canvas.evaluate(e=>e===document.activeElement))break;
    await key('Tab');
  }
  assert.equal(await canvas.evaluate(e=>e===document.activeElement),true,'Actual Tab must enter campaign battlefield');
  assert.equal(await page.evaluate(()=>document.activeElement?.matches('iframe.combat-frame')),true,'Campaign iframe must own native focus');
  const focus=await canvas.evaluate(e=>({visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
  assert.ok(focus.visible&&focus.outline!=='none'&&focus.width==='3px','Campaign battlefield focus invisible');
  await key('Shift+Tab');assert.equal(await canvas.evaluate(e=>e===document.activeElement),false,'Native Shift+Tab must leave canvas');
  await key('Tab');assert.equal(await canvas.evaluate(e=>e===document.activeElement),true,'Native Tab must return to canvas');
  const cursorBefore=await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)}));
  await key('ArrowRight');
  const cursor=await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)}));
  assert.ok(cursor.gx>=0&&cursor.gx<8&&cursor.gz>=0&&cursor.gz<4,'Campaign inspection cursor outside native grid');
  assert.deepEqual(cursor,{gx:Math.min(7,cursorBefore.gx+1),gz:cursorBefore.gz},'Campaign ArrowRight must move or clamp at the grid edge');
  assert.ok((await frame.locator('#combat-cell-status').textContent()).trim(),'Campaign cursor status empty');
  const moveCursor=async cell=>{
    const current=await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)}));
    for(let x=current.gx;x!==cell.gx;x+=Math.sign(cell.gx-x))await key(cell.gx>x?'ArrowRight':'ArrowLeft');
    for(let z=current.gz;z!==cell.gz;z+=Math.sign(cell.gz-z))await key(cell.gz>z?'ArrowDown':'ArrowUp');
    assert.deepEqual(await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)})),cell);
  };
  await key('m');assert.equal((await combatState(frame)).mode,'move');
  await moveCursor({gx:before.active.gx,gz:before.active.gz});
  await key('Enter');
  const moveRejected=await frame.locator('#combat-cell-status').textContent();
  assert.ok(moveRejected.includes('Déplacement refusé'),'Campaign illegal move must announce refusal');
  assert.equal((await combatState(frame)).mode,'move','Illegal move must retain selection');
  await key('Escape');
  const attackButton=frame.locator('#menu [data-a="attack"]:not(:disabled)').first();
  assert.equal(await attackButton.count(),1,'Native attack control required for refusal proof');
  await attackButton.focus();await key('Enter');
  const charge=frame.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)').first();
  assert.equal(await charge.count(),1,'Native attack charge required for refusal proof');
  await charge.focus();await key('Enter');
  assert.equal((await combatState(frame)).mode,'target');
  const invalidTarget=await frame.evaluate(()=>{
    if(G.pending.spec.self)return null;
    for(const column of G.grid)for(const cell of column)if(!G.pending.keys.has(cell.gx+','+cell.gz))return {gx:cell.gx,gz:cell.gz};
    return null;
  });
  assert.ok(invalidTarget,'Native attack must expose an illegal target');
  assert.equal(await canvas.evaluate(e=>e===document.activeElement),true,'Native target entry must focus battlefield');
  await moveCursor(invalidTarget);await key('Enter');
  const targetRejected=await frame.locator('#combat-cell-status').textContent();
  assert.ok(targetRejected.includes('Ciblage refusé'),'Campaign illegal target must announce refusal');
  assert.equal((await combatState(frame)).mode,'target','Illegal target must retain selection');
  await key('Escape');
  const restored=await frame.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return{dock:e.matches('#menu button:not(:disabled)'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
  assert.equal(restored.dock,true,'Campaign Escape must restore enabled dock focus');
  assert.ok(restored.x>=0&&restored.y>=0&&restored.right<=viewport[0]+1&&restored.bottom<=viewport[1]+1,'Campaign returned focus clipped');
  if(viewport[0]<=620)assert.ok(restored.width>=44&&restored.height>=44,'Campaign returned dock touch target too small');
  const after=await combatState(frame),ownerAfter=await state();
  const gameplay=snapshot=>{const {diagnostics,...truth}=snapshot;return truth;};
  assert.deepEqual(gameplay(after),gameplay(before),'Campaign keyboard inspection/cancel changed tactical truth');
  assert.deepEqual(ownerAfter,ownerBefore,'Campaign keyboard inspection/cancel changed owner V6 truth');
  assert.equal(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')),autosaveBefore,'Campaign keyboard inspection/cancel wrote autosave');
  await capture(`combat-${entry.index}-native-keyboard-return`);
  entry.battlefieldKeyboard={method:'ACTUAL_TAB_CAMPAIGN_IFRAME_NATIVE_REFUSALS',inputs,focus,cursorBefore,cursor,moveRejected,targetRejected,restored,before,after,renderDiagnosticsExcludedFromTruth:true,ownerUnchanged:true,autosaveUnchanged:true,pass:true};
}
async function campaignParentKeyboardReturn(entry){
  assert.equal(entry.nodeId,'lion-opening-ambush','Parent keyboard proof is scoped to fresh opening aftermath');
  const selector='.dialogue--narrative[data-dialogue-sequence="post_opening_trail"]:not(.dialogue--preparing-step) .dialogue__box:not(:disabled)';
  await page.waitForFunction(selector=>{
    const e=document.querySelector(selector);
    const stage=document.querySelector('[data-narrative-surface-readiness="VISIBLE"][data-narrative-interaction="ACTIVE"]');
    return e&&stage&&e===document.activeElement&&e.getClientRects().length&&!e.closest('[inert]');
  },selector,{timeout:30000});
  const control=page.locator(selector);
  const ownerBefore=await state(),autosaveBefore=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
  assert.ok(ownerBefore.resolvedNodeIds.includes(entry.nodeId),'Parent focus precedes resolved opening truth');
  const focus=await control.evaluate(e=>{const r=e.getBoundingClientRect(),style=getComputedStyle(e);return{
    active:e===document.activeElement,visible:e.matches(':focus-visible'),outline:style.outlineStyle,outlineWidth:style.outlineWidth,
    x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
    sequence:e.closest('.dialogue').dataset.dialogueSequence,step:e.closest('.dialogue').dataset.dialogueStep};});
  assert.ok(focus.active&&focus.visible&&focus.outline!=='none'&&parseFloat(focus.outlineWidth)>0,'Native parent dialogue focus invisible');
  assert.ok(focus.x>=0&&focus.y>=0&&focus.right<=viewport[0]+1&&focus.bottom<=viewport[1]+1,'Native parent focus clipped');
  await page.keyboard.press('Tab');
  const tabAway=await control.evaluate(e=>e!==document.activeElement);
  assert.equal(tabAway,true,'Parent Tab must leave dialogue control');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await control.evaluate(e=>e.isConnected&&e===document.activeElement),true,'Parent Shift+Tab must return to same dialogue control');
  const ownerAfter=await state(),autosaveAfter=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
  assert.deepEqual(ownerAfter,ownerBefore,'Parent Tab navigation changed settled campaign truth');
  assert.equal(autosaveAfter,autosaveBefore,'Parent Tab navigation wrote autosave');
  assert.equal(await page.locator('iframe.combat-frame').count(),0);
  report.inputs.push({action:'native parent Tab/Shift+Tab after result Enter',nodeId:entry.nodeId});
  entry.parentKeyboardReturn={method:'NATIVE_RESULT_ENTER_AUTOMATIC_PARENT_FOCUS',focus,tabAway,ownerBefore,ownerAfter,autosaveUnchanged:true,pass:true};
  await capture(`combat-${entry.index}-native-parent-keyboard-return`);
}
let pendingExpeditionProof;
async function verifyExpeditionSettlement(){
  if(!pendingExpeditionProof)return;
  const after=await state();if(after.run.poiExpedition.pendingStep)return;
  const {before,battleCount}=pendingExpeditionProof;
  const victories=report.battles.slice(battleCount).filter(b=>b.pass&&b.outcome==='victory'&&b.eliteId).map(b=>b.eliteId);
  assertExpeditionStep(before,after,1,{victories});
  (report.expedition.settlements??=[]).push({from:before.currentNodeId,to:after.currentNodeId,turn:after.run.poiExpedition.turn,pass:true});
  pendingExpeditionProof=undefined;
}
async function poiMove(id,pointer=false){
  await verifyExpeditionSettlement();assert.equal(pendingExpeditionProof,undefined,'A new movement preceded the prior native activity settlement');
  const before=await state();
  const marker=`.poi-map [data-poi-id="${id}"]`;
  assert.equal(await page.locator(marker).getAttribute('data-poi-reachable'),'true','POI move must use an unlocked adjacent edge');
  if(pointer){
    await activateControl(page.locator(marker));
    assert.equal(await page.locator(marker).getAttribute('aria-pressed'),'true');
    await activateControl(page.locator('.poi-map [data-poi-action="move"]:not(:disabled)'));
  }else{
    await keyboardActivate(marker);
    await keyboardActivate('.poi-map [data-poi-action="move"]:not(:disabled)');
  }
  await page.waitForFunction(id=>window.__demoQaApp.state.currentNodeId===id
    ||window.__demoQaApp.state.run.poiExpedition?.encounter?.targetNodeId===id,id);
  const after=await state();
  const intercepted=after.currentNodeId===before.currentNodeId&&after.run.poiExpedition?.encounter?.kind==='front';
  assertExpeditionStep(before,after,intercepted||id===before.currentNodeId?0:1,{pending:true});
  if(!intercepted&&id!==before.currentNodeId)pendingExpeditionProof={before,battleCount:report.battles.length};
  report.expedition.intents.push({id,from:before.currentNodeId,to:after.currentNodeId,turnBefore:before.run.poiExpedition?.turn,
    turnAfter:after.run.poiExpedition?.turn,intercepted:!!after.run.poiExpedition?.encounter,
    economyBefore:{gold:before.gold,loot:structuredClone(before.run.temporaryLoot),reputation:before.reputation},
    previouslyResolved:before.resolvedNodeIds.includes(id)});
  report.inputs.push({action:pointer?'native POI adjacent pointer movement':'native POI adjacent movement',id});
}
function assertExpeditionStep(before,after,delta,{pending=false,victories=[]}={}){
  const prior=before.run.poiExpedition,next=after.run.poiExpedition;
  assert.equal(next.turn,prior.turn+delta,'Native expedition turn disagrees with accepted movement/Wait');
  if(!pending)assert.equal(next.pendingStep,undefined,'A closed native activity retained a pending map turn');
  const edges=lotE.fixedPoiCandidates.flatMap(poi=>poi.edges.map(to=>[poi.id,to]));
  for(const def of lotE.mobileEliteActors){
    const a=prior.elites[def.id],b=next.elites[def.id];
    assert.equal(b.defeated,victories.includes(def.id)?true:a.defeated,'Movement changed elite victory without a verified native result');
    assert.ok(def.allowedPositions.includes(b.positionId),'Threat escaped its authored zone');
    assert.ok(b.positionId===a.positionId||edges.some(([from,to])=>from===a.positionId&&to===b.positionId||to===a.positionId&&from===b.positionId),
      'A threat moved more than one approved edge');
    assert.ok(b.lastStep>=a.lastStep&&b.lastStep<=next.turn,'Threat step marker invalid');
  }
}
function assertCanonicalMatch(actual,expected,message){
  const a=structuredClone(actual),b=structuredClone(expected);
  delete a.run.poiExpedition;delete b.run.poiExpedition;assert.deepEqual(a,b,message);
}
async function poiNoReplayPath(ids,mixedInputs=false,captureName='poi-native-backtracking',allowServiceInterceptions=false){
  const before=await state(),intentStart=report.expedition.intents.length,waitStart=report.expedition.waits.length;
  for(const [index,id] of ids.entries()){
    let reached=false;
    for(let attempt=0;attempt<12;attempt++){
      await poiMove(id,mixedInputs&&index%2===0);await page.locator('.poi-map:visible').waitFor();
      assert.equal(await page.locator('.dialogue:visible,iframe.combat-frame,.cinematic-overlay:visible').count(),0,'Resolved service path replayed an activity');
      const intercepted=await page.locator('.poi-dialog-backdrop:visible').count()>0;
      if(intercepted){
        assert.equal(allowServiceInterceptions,true,'Inert POI path opened an interception');
        await handleExpeditionDialog(true);
      }
      if((await state()).currentNodeId===id){reached=true;break;}
      assert.equal(intercepted,true,'Resolved service movement failed without an interception');
      await waitExpeditionTurn();
      if(await page.locator('.poi-dialog-backdrop:visible').count())await handleExpeditionDialog(true);
      expeditionWaitPending=false;
    }
    assert.equal(reached,true,'Native service return exceeded twelve interception/retry decisions');
  }
  await verifyExpeditionSettlement();assert.equal(pendingExpeditionProof,undefined);
  const after=await state();
  const expected=structuredClone(before);expected.currentNodeId=ids.at(-1);expected.run.currentNodeId=ids.at(-1);
  const movementTurns=report.expedition.intents.slice(intentStart).reduce((sum,entry)=>sum+entry.turnAfter-entry.turnBefore,0);
  const waitTurns=report.expedition.waits.length-waitStart;
  assert.equal(after.run.poiExpedition.turn,before.run.poiExpedition.turn+movementTurns+waitTurns,'Resolved movement must count each accepted map edge and explicit Wait once');
  if(!allowServiceInterceptions)assert.equal(movementTurns,ids.length);
  assert.equal(after.run.poiExpedition.pendingStep,undefined,'Inert passage must settle the deferred turn');
  assert.equal(after.run.poiExpedition.encounter,undefined);
  for(const def of lotE.mobileEliteActors)assert.equal(after.run.poiExpedition.elites[def.id].defeated,before.run.poiExpedition.elites[def.id].defeated);
  assertCanonicalMatch(after,expected,'Resolved backtracking changed canonical facts/resources/assignments');
  await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
  await capture(captureName);
  return {ids,before,after,noReplay:true,exactConsequences:true,allowServiceInterceptions,movementTurns,waitTurns};
}

async function navigateExpedition(target){
  const live=await state();if(live.currentNodeId===target)return false;
  const available=new Set(await page.locator('.poi-marker:not(.poi-marker--locked)').evaluateAll(elements=>elements.map(e=>e.dataset.poiId)));
  const edges=[...live.run.graph.nodes.flatMap(node=>node.links.map(to=>({from:node.id,to}))),
    ...lotE.fixedPoiCandidates.flatMap(poi=>poi.edges.map(to=>({from:poi.id,to}))),
    {from:'lion-nomad-crossroads',to:'lion-first-trial-event'},{from:'lion-nomad-crossroads',to:'lion-first-trial-combat'}];
  const queue=[[live.currentNodeId]],seen=new Set([live.currentNodeId]);let path;
  for(let index=0;index<queue.length;index++){
    const route=queue[index],last=route.at(-1);if(last===target){path=route;break;}
    for(const edge of edges){const next=edge.from===last?edge.to:edge.to===last?edge.from:null;
      if(next&&available.has(next)&&!seen.has(next)){seen.add(next);queue.push([...route,next]);}}
  }
  assert.ok(path?.length>1,`No native geographical route from ${live.currentNodeId} to ${target}`);
  await poiMove(path[1],report.expedition.intents.length%2===0);return true;
}
let expeditionWaitPending=false;
async function waitExpeditionTurn(){
  await verifyExpeditionSettlement();assert.equal(pendingExpeditionProof,undefined);
  const before=await state();await keyboardActivate('.poi-map [data-poi-action="wait"]');
  await page.waitForFunction(turn=>window.__demoQaApp.state.run.poiExpedition.turn===turn+1,before.run.poiExpedition.turn);
  const after=await state();assertExpeditionStep(before,after,1);
  report.expedition.waits.push({before,after,explicit:true,pass:true});expeditionWaitPending=false;
}
async function handleExpeditionDialog(forceRetreat=false){
  const dialog=page.locator('.poi-dialog-backdrop:visible');if(!await dialog.count())return false;
  const live=await state(),encounter=live.run.poiExpedition?.encounter;
  if(explorationPlan==='complete'&&encounter&&!(report.expedition.encounterReloads??=[]).some(entry=>entry.eliteId===encounter.eliteId&&entry.kind===encounter.kind)){
    const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
    assert.deepEqual(JSON.parse(saved),live,'Native interception choice was not saved before modal agency');
    await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
    await dialog.waitFor({state:'visible'});
    assert.deepEqual(await state(),live,'Native interception reload changed context, position, resources or turn');
    report.expedition.encounterReloads.push({eliteId:encounter.eliteId,kind:encounter.kind,phase:encounter.phase,exactOwner:true,noTick:true});
  }
  const expectedFocus=encounter?'retreat':'close';
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-poi-dialog-action')),expectedFocus,'Native POI dialog lost its safe initial focus');
  const controls=await dialog.locator('button').evaluateAll(elements=>elements.map(element=>{const r=element.getBoundingClientRect();return{action:element.dataset.poiDialogAction,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
  assert.ok(controls.every(r=>r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.right<=viewport[0]+1&&r.bottom<=viewport[1]+1),'Native POI dialog controls are too small or clipped');
  if(!touchInput){
    await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement?.closest('.poi-dialog')),'Native Tab escaped the modal');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-poi-dialog-action')),expectedFocus);
    assert.deepEqual(await state(),live,'Dialog focus navigation changed owner truth');
  }
  (report.expedition.dialogs??=[]).push({eliteId:encounter?.eliteId,chestId:encounter?undefined:live.currentNodeId,controls,initialFocus:expectedFocus,nativeTrap:!touchInput,pass:true});
  if(!encounter){
    const def=lotE.fixedPoiCandidates.find(poi=>poi.id===live.currentNodeId&&poi.chestLoot);
    assert.ok(def&&live.resolvedNodeIds.includes(def.id),'Chest popup must follow an actual unique owner attribution');
    const intent=report.expedition.intents.findLast(intent=>intent.id===def.id);
    assert.ok(intent&&!intent.previouslyResolved,'A resolved chest must not replay its popup');
    assert.equal(live.gold,intent.economyBefore.gold,'Chest credited secured gold');
    assert.equal(live.run.temporaryLoot.gold,intent.economyBefore.loot.gold+def.chestLoot.temporaryGold);
    const expected=structuredClone(intent.economyBefore.loot.inventory);
    for(const [id,count] of Object.entries(def.chestLoot.temporaryItems))expected.consumables[id]=(expected.consumables[id]??0)+count;
    assert.deepEqual(live.run.temporaryLoot.inventory,expected);
    assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),live,'Chest must save before popup acknowledgement');
    report.expedition.chests.push({id:def.id,gold:def.chestLoot.temporaryGold,items:def.chestLoot.temporaryItems,temporary:true,turn:live.run.poiExpedition.turn});
    await capture(`chest-${def.id}`);
    if(explorationPlan==='complete'&&!report.expedition.chestReload){
      await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
      await page.locator('.poi-map:visible').waitFor();
      const resumed=await state();assertCanonicalMatch(resumed,live,'Interrupted chest reload repeated a reward or changed canonical facts');
      assertExpeditionStep(live,resumed,0);await verifyExpeditionSettlement();
      assert.equal(await page.locator('.poi-dialog-backdrop:visible').count(),0,'Attributed chest reopened its reward popup');
      assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),resumed);
      await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
      await page.locator('.poi-map:visible').waitFor();assert.deepEqual(await state(),resumed,'Second chest reload advanced another turn or repeated attribution');
      report.expedition.chestReload={id:def.id,before:live,after:resumed,exactCanonical:true,grantOnce:true,settledOnce:true};
      await capture(`chest-${def.id}-interrupted-reloaded`);return true;
    }
    await keyboardActivate('[data-poi-dialog-action="close"]');return true;
  }
  const def=lotE.mobileEliteActors.find(elite=>elite.id===encounter.eliteId);assert.ok(def);
  const prior=report.expedition.interceptions.filter(entry=>entry.eliteId===def.id&&entry.choice==='retreat');
  const retreat=forceRetreat||explorationPlan!=='complete'||(def.region===1&&live.clan.members.some(member=>member.currentHealth<=1))
    ||(encounter.kind==='front'&&!prior.some(entry=>entry.kind==='front'))
    ||(encounter.kind==='rear'&&!prior.some(entry=>entry.kind==='rear'));
  await capture(`elite-${def.id}-${encounter.kind}-${retreat?'retreat':'fight'}-${report.expedition.interceptions.length}`);
  await keyboardActivate(`[data-poi-dialog-action="${retreat?'retreat':'fight'}"]`);
  if(retreat){
    await page.locator('.poi-dialog-backdrop').waitFor({state:'detached'});
    const after=await state(),expected=structuredClone(live);
    delete expected.run.poiExpedition.encounter;
    if(encounter.kind==='rear'){
      assert.ok(encounter.safeReturnNodeId,'Rear retreat must offer a real safe return');
      expected.currentNodeId=expected.run.currentNodeId=encounter.safeReturnNodeId;
      delete expected.run.poiExpedition.previousSafeNodeId;
    }
    assert.deepEqual(after,expected,'Native retreat changed facts beyond its exact safe cancellation/return');
    report.expedition.interceptions.push({eliteId:def.id,kind:encounter.kind,choice:'retreat',before:live,after,pass:true});
    if(encounter.kind==='front'&&(def.region===1||explorationPlan==='complete'))expeditionWaitPending=true;
  }else report.expedition.interceptions.push({eliteId:def.id,kind:encounter.kind,choice:'fight',encounterId:encounter.id,pass:true});
  return true;
}
async function explorePoiStep(live){
  if(explorationPlan==='direct')return false;
  if(expeditionWaitPending){
    await waitExpeditionTurn();return true;
  }
  const region=Number(await page.locator('.poi-map').getAttribute('data-region'));
  if(explorationPlan==='complete'&&nativeEquipment&&target==='ending'){
    const recoveries=report.expedition.sealRecoveries??=[];
    let recovery=recoveries.at(-1);
    if((!recovery||recovery.complete)&&region===2&&live.clan.members.some(member=>member.currentHealth<=1)
      &&lotE.mobileEliteActors.every(def=>live.run.poiExpedition.elites[def.id].defeated)){
      assert.ok(live.resolvedNodeIds.includes(live.currentNodeId),'Recovery must start from a resolved native activity');
      recovery={origin:live.currentNodeId,before:live,phase:'to-refuge'};recoveries.push(recovery);
    }
    if(recovery&&!recovery.complete){
      if(recovery.phase==='to-refuge'){
        await navigateExpedition('lion-second-refuge');return true;
      }
      assert.equal(recovery.phase,'return-to-origin');
      if(region===1){await navigateExpedition('lion-lancer-recruit');return true;}
      if(live.currentNodeId!==recovery.origin){await navigateExpedition(recovery.origin);return true;}
      const expected=structuredClone(recovery.rested);expected.currentNodeId=expected.run.currentNodeId=recovery.origin;
      assertCanonicalMatch(live,expected,'Paid seal recovery return changed canonical facts, loot or checkpoint');
      assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),live);
      recovery.after=live;recovery.complete=true;return true;
    }
  }
  if(explorationPlan==='moderate'&&region===1&&live.resolvedNodeIds.includes('lion-valmir-road')){
    const elite=live.run.poiExpedition.elites['lion-elite-valley-sentinel'];
    const seen=report.expedition.interceptions.some(entry=>entry.eliteId==='lion-elite-valley-sentinel');
    if(elite.active&&!seen){await navigateExpedition(elite.positionId);return true;}
  }
  if(explorationPlan==='moderate'&&region===2&&live.resolvedNodeIds.includes('lion-witnesses')){
    const elite=live.run.poiExpedition.elites['lion-elite-seal-warden'];
    const seen=report.expedition.interceptions.some(entry=>entry.eliteId==='lion-elite-seal-warden');
    if(elite.active&&!seen){await navigateExpedition(elite.positionId);return true;}
  }
  if(explorationPlan==='complete'&&region>0){
    const def=lotE.mobileEliteActors.find(elite=>elite.region===region),elite=live.run.poiExpedition.elites[def.id];
    if(region===1&&elite.defeated&&!live.resolvedNodeIds.includes('lion-village-choice')&&!report.expedition.afterElitePreparation){
      if(live.currentNodeId!=='lion-valmir-road')await navigateExpedition('lion-valmir-road');
      else {await preparePoiCompanyAfterValmir();report.expedition.afterElitePreparation={eliteId:def.id,nativePaidService:true};}
      return true;
    }
    const ordinaryDone=region===1?['lion-poi-valley-bridge-cache','lion-poi-valley-serpent'].every(id=>live.resolvedNodeIds.includes(id))
      :report.expedition.interceptions.some(entry=>entry.eliteId===def.id&&entry.kind==='rear'&&entry.choice==='retreat');
    if(elite.active&&!elite.defeated&&ordinaryDone){
      if(region===1&&live.clan.members.some(member=>member.currentHealth<=1)){
        if(live.currentNodeId!=='lion-valmir-road')await navigateExpedition('lion-valmir-road');
        else {
          const before=await state();await preparePoiCompanyAfterValmir();
          report.expedition.eliteRest={eliteId:def.id,before,after:await state(),nativePaidService:true};
        }
        return true;
      }
      const challenge=page.locator(`.poi-map [data-poi-action="elite-fight"][data-elite-id="${def.id}"]:not(:disabled)`);
      if(await challenge.count())await keyboardActivate(`.poi-map [data-poi-action="elite-fight"][data-elite-id="${def.id}"]`);
      else await navigateExpedition(elite.positionId);
      return true;
    }
  }
  const complete=explorationPlan==='complete';
  const phases=[
    {id:'opening',region:0,gate:'lion-nomad-crossroads',optional:complete?['lion-poi-opening-supplies','lion-poi-opening-patrol','lion-poi-opening-wolves','lion-poi-opening-cache']:['lion-poi-opening-wolves','lion-poi-opening-cache'],
      route:complete?['lion-poi-opening-supplies','lion-poi-opening-patrol','lion-refugees','lion-nomad-crossroads','lion-poi-opening-wolves','lion-poi-opening-cache','lion-nomad-crossroads']:['lion-poi-opening-wolves','lion-poi-opening-cache','lion-nomad-crossroads']},
    {id:'valley-before',region:1,gate:'lion-reserve-trail',optional:['lion-poi-valley-supplies','lion-poi-valley-marsh'],route:['lion-poi-valley-supplies','lion-poi-valley-marsh','lion-valmir-road']},
    ...(complete?[{id:'valley-after',region:1,gate:'lion-valmir-road',optional:['lion-poi-valley-bridge-cache','lion-poi-valley-serpent'],route:['lion-poi-valley-bridge-cache','lion-poi-valley-serpent','lion-valmir-road']}]:[]),
    {id:'seal-before',region:2,gate:'lion-lancer-recruit',optional:['lion-poi-seal-witness-supplies'],route:['lion-poi-seal-witness-supplies','lion-witnesses']},
    {id:'seal-after',region:2,gate:'lion-witnesses',optional:complete?['lion-poi-seal-ruin-encounter','lion-poi-seal-hunters']:['lion-poi-seal-hunters'],
      route:complete?['lion-poi-seal-ruin-encounter','lion-witnesses','lion-poi-seal-hunters',`lion-final-trial-${trialPlan}`]:['lion-poi-seal-hunters',`lion-final-trial-${trialPlan}`]},
    ...(complete?[{id:'seal-late',region:2,gate:'lion-shadow-signs',optional:['lion-poi-seal-ruin-supplies'],route:['lion-poi-seal-ruin-supplies','lion-shadow-signs']}]:[]),
  ];
  const phase=phases.find(phase=>phase.region===region&&live.resolvedNodeIds.includes(phase.gate)
    &&!report.expedition.phases[phase.id]?.complete
    &&(report.expedition.phases[phase.id]||phase.optional.some(id=>!live.resolvedNodeIds.includes(id))));
  if(!phase)return false;
  if(region===0&&!priorProof&&!report.poi?.backtracking)return false;
  const progress=report.expedition.phases[phase.id]??={cursor:0,route:phase.route,optional:phase.optional};
  while(progress.cursor<phase.route.length){
    const next=phase.route[progress.cursor];
    if(next===live.currentNodeId&&live.resolvedNodeIds.includes(next)
      ||next.startsWith('lion-poi-')&&live.resolvedNodeIds.includes(next))progress.cursor++;
    else break;
  }
  if(progress.cursor===phase.route.length){progress.complete=true;return false;}
  await navigateExpedition(phase.route[progress.cursor]);return true;
}
async function inspectPoiAtlas(){
  if(report.atlas)return;
  await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
  const before=await state(),initialRegion=await page.locator('.poi-map').getAttribute('data-region');
  const regions=[];
  for(const index of [0,1,2]){
    await keyboardActivate(`.poi-map [data-poi-region="${index}"]`);
    assert.equal(await page.locator(`[data-poi-region="${index}"]`).getAttribute('aria-selected'),'true');
    assert.equal(await page.locator(`[data-poi-region="${index}"]`).evaluate(e=>e===document.activeElement),true,'Region tab lost native focus');
    const controls=await page.locator('.poi-map button').evaluateAll(elements=>elements.map(e=>{
      const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent.trim(),width:r.width,height:r.height};
    }));
    assert.ok(controls.every(c=>c.width>=44&&c.height>=44),'Atlas native target below44px');
    await page.waitForFunction(()=>{const image=document.querySelector('.poi-map__geography');return image?.complete&&image.naturalWidth>0;},null,{timeout:30000});
    const geography=await page.locator('.poi-map__geography').evaluate(async image=>{await image.decode();return{src:image.getAttribute('src'),complete:image.complete,width:image.naturalWidth,height:image.naturalHeight};});
    const threatMotion=await page.locator('.poi-map').evaluate(map=>({
      osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,gameReduced:map.dataset.reducedMotion==='true',
      threats:[...map.querySelectorAll('.poi-threat')].map(element=>({animation:getComputedStyle(element).animationName,duration:getComputedStyle(element).animationDuration})),
    }));
    for(const threat of threatMotion.threats)assert.equal(threat.animation,threatMotion.osReduced||threatMotion.gameReduced?'none':'poi-threat-presence','Threat pulse disagrees with independent OS/game motion controls');
    await capture(`atlas-region-${index}-${viewport[0]}`);
    const borders=[];
    for(const id of await page.locator('.poi-marker--border').evaluateAll(elements=>elements.map(e=>e.dataset.poiId))){
      await keyboardActivate(`.poi-marker[data-poi-id="${id}"]`);
      const bounds=await page.locator(`.poi-marker[data-poi-id="${id}"] .poi-marker__name`).evaluate(e=>{const r=e.getBoundingClientRect(),land=e.closest('.poi-map__land').getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,land:{left:land.left,top:land.top,right:land.right,bottom:land.bottom}};});
      assert.ok(bounds.left>=bounds.land.left-1&&bounds.top>=bounds.land.top-1&&bounds.right<=bounds.land.right+1&&bounds.bottom<=bounds.land.bottom+1,'Native border marker label remained clipped after focus');
      borders.push({id,bounds});
    }
    regions.push({index,controls,geography,borders,threatMotion});
  }
  await keyboardActivate('.poi-map [data-poi-action="locate"]');
  assert.equal(await page.locator('.poi-map').getAttribute('data-region'),initialRegion);
  assert.equal(await page.locator(`[data-poi-id="${before.currentNodeId}"]`).evaluate(e=>e===document.activeElement),true,'Locate did not restore marker focus');
  const land=page.locator('.poi-map__land');
  const geometry=await land.evaluate(e=>({left:e.scrollLeft,top:e.scrollTop,width:e.clientWidth,height:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight}));
  let pan=null;
  if(geometry.scrollWidth>geometry.width+5){
    if(touchInput){
      const box=await land.boundingBox();assert.ok(box);
      const direction=geometry.left>5?-1:1;
      const cdp=await context.newCDPSession(page),y=box.y+Math.min(box.height*.5,180),start=box.x+box.width*(direction===1?.8:.2);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});
      for(let step=1;step<=6;step++){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start-box.width*.55*direction*step/6,y}]});
        await page.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }else {await land.focus();await page.keyboard.press(geometry.left>5?'ArrowLeft':'ArrowRight');}
    await page.waitForFunction(left=>document.querySelector('.poi-map__land').scrollLeft!==left,geometry.left);
    pan=await land.evaluate(e=>({left:e.scrollLeft,top:e.scrollTop}));
    report.inputs.push({action:touchInput?'native touch atlas swipe':'native keyboard atlas scroll',before:geometry,after:pan});
    await capture(`atlas-native-pan-${viewport[0]}`);
    await keyboardActivate('.poi-map [data-poi-action="locate"]');
  }
  assert.deepEqual(await state(),before,'Atlas browsing/focus/pan changed canonical owner facts');
  assert.equal(await page.locator('.traversal-road,.traversal-fork-overlay').count(),0,'Retired physical surface mounted');
  report.atlas={pass:true,regions,geometry,pan,ownerUnchanged:true,nativeTouch:touchInput,viewport,initialRegion};
}
async function returnToPoiMap(){
  // Existing authored post-refuge ATE/reputation dialogue retains player agency before map return.
  const until=Date.now()+60000;
  while(!await page.locator('.poi-map:visible').count()&&Date.now()<until){
    if(await page.locator('.dialogue-choice:visible:not(:disabled)').count())await choose();
    else if(await page.locator('.dialogue:visible').count())await advanceDialogue();
    else if(await page.locator('.cinematic-overlay__skip:visible').count())await click('.cinematic-overlay__skip:visible');
    await page.waitForTimeout(100);
  }
  await page.locator('.poi-map:visible').waitFor({timeout:1000});
}
async function preparePoiCompanyAfterValmir(milestone='lion-valmir-road'){
  const before=await state();
  assert.equal(before.currentNodeId,milestone);assert.ok(before.resolvedNodeIds.includes(milestone));
  const postTrial=milestone==='lion-second-trial-combat',prefix=postTrial?'trial':'valmir';
  const returnPath=await poiNoReplayPath(postTrial?['lion-valmir-road','lion-reserve-trail']:['lion-reserve-trail'],true,`poi-after-${prefix}-return-path`);
  await poiMove('lion-first-refuge',true);
  const hub=page.locator('.exploration-stop:visible:not([inert])');await hub.waitFor({state:'visible'});
  const arrival=await state(),expectedArrival=structuredClone(before);
  expectedArrival.currentNodeId=expectedArrival.run.currentNodeId='lion-first-refuge';
  assertCanonicalMatch(arrival,expectedArrival,'Reopened refuge changed earned Valmir facts, loot or checkpoint');
  assert.equal(arrival.run.poiExpedition.turn,before.run.poiExpedition.turn+(postTrial?3:2));
  assert.equal(arrival.run.poiExpedition.pendingStep?.toNodeId,'lion-first-refuge');
  if(nativeEquipment)await prepareNativeWeapon('lion-first-refuge');
  const rest=page.locator('.exploration-stop [data-action="rest"]:not(:disabled)');
  const cost=Number((await page.locator('.exploration-stop [data-action="rest"]').innerText()).match(/(\d+)\s*or/i)?.[1]??0);
  const funding=[];
  if(cost>(await state()).gold){
    assert.ok(postTrial||nativeEquipment&&explorationPlan==='complete','Only the explicit post-trial/complete equipment scenario may sell existing supplies');
    await keyboardActivate('.exploration-stop [data-action="shop"]');
    await keyboardActivate('.management [data-shop-mode="sell"]');
    for(let i=0;i<10&&(await state()).gold<cost;i++){
      const owner=await state(),id=['red_gem','iron_ore'].find(id=>(owner.inventory.materials[id]??0)>0);
      assert.ok(id,'Existing permanent supplies cannot fund the native rest');
      const sell=`.management [data-trade="sell"][data-item="${id}"]`;
      const price=Number.parseInt(await page.locator(sell).innerText(),10);assert.ok(Number.isInteger(price)&&price>0);
      await keyboardActivate(sell);const sold=await state(),expected=structuredClone(owner);
      expected.gold+=price;expected.inventory.materials[id]-=1;expected.shops.valmir.stock[id]=(expected.shops.valmir.stock[id]??0)+1;
      assert.deepEqual(sold,expected,'Native rest-funding sale changed unrelated truth or temporary loot');
      assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),sold);
      funding.push({id,price,before:owner,after:sold});
    }
    await keyboardActivate('.management [data-action="close"]');await hub.waitFor({state:'visible'});
  }
  const restBefore=await state();
  if(cost){assert.ok(Number.isInteger(cost)&&cost>0&&restBefore.gold>=cost,'Native rest must be affordable and paid');
    await keyboardActivate('.exploration-stop [data-action="rest"]:not(:disabled)');}
  else assert.match(await page.locator('.exploration-stop [data-action="rest"]').innerText(),/Compagnie en pleine forme/);
  await hub.waitFor({state:'visible'});
  const rested=await state(),expectedRest=structuredClone(restBefore);
  expectedRest.gold-=cost;
  for(const [i,member] of expectedRest.clan.members.entries())member.currentHealth=rested.clan.members[i].currentHealth;
  assert.deepEqual(rested,expectedRest,'Native post-Valmir rest changed unrelated earned truth');
  assert.equal(await rest.count(),0,'Native rest did not restore the full party');
  assert.ok(rested.clan.members.every(u=>u.currentHealth>0));
  assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),rested,'Paid post-Valmir rest was not persisted exactly');
  await capture(`poi-after-${prefix}-${cost?'paid-rest':'already-healthy'}`);
  let prepared=rested,supplyPurchase=null;
  if(postTrial&&routePlan==='sacrifice'){
    await keyboardActivate('.exploration-stop [data-action="shop"]');
    await keyboardActivate('.management [data-shop-mode="buy"]');
    const buy='.management [data-trade="buy"][data-item="potion"]';
    await page.locator(buy).waitFor({state:'visible'});
    const price=Number.parseInt(await page.locator(buy).innerText(),10),quantity=2,supplyFunding=[];
    assert.ok(Number.isInteger(price)&&price>0);assert.ok(rested.shops.valmir.stock.potion>=quantity);
    await keyboardActivate('.management [data-shop-mode="sell"]');
    for(let i=0;i<10&&(await state()).gold<price*quantity;i++){
      const owner=await state(),item=[['red_gem','materials'],['antidote','consumables'],['iron_ore','materials']]
        .find(([id,category])=>(owner.inventory[category][id]??0)>0);
      assert.ok(item,'Existing permanent supplies cannot fund the native Raid potions');
      const [id,category]=item,sell=`.management [data-trade="sell"][data-item="${id}"]`;
      const proceeds=Number.parseInt(await page.locator(sell).innerText(),10);assert.ok(Number.isInteger(proceeds)&&proceeds>0);
      await keyboardActivate(sell);const sold=await state(),expected=structuredClone(owner);
      expected.gold+=proceeds;expected.inventory[category][id]-=1;expected.shops.valmir.stock[id]=(expected.shops.valmir.stock[id]??0)+1;
      assert.deepEqual(sold,expected,'Native potion-funding sale changed unrelated truth or temporary loot');
      assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),sold);
      supplyFunding.push({id,category,price:proceeds});
    }
    await keyboardActivate('.management [data-shop-mode="buy"]');
    for(let i=0;i<quantity;i++){
      const owner=await state();assert.ok(owner.gold>=price);assert.equal(await page.locator(buy).isEnabled(),true);
      assert.equal(Number.parseInt(await page.locator(buy).innerText(),10),price);
      await keyboardActivate(buy);const bought=await state(),expected=structuredClone(owner);
      expected.gold-=price;expected.inventory.consumables.potion=(expected.inventory.consumables.potion??0)+1;
      expected.shops.valmir.stock.potion-=1;
      assert.deepEqual(bought,expected,'Native Raid potion purchase changed unrelated V6 truth');
      assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),bought);
    }
    await keyboardActivate('.management [data-action="close"]');await hub.waitFor({state:'visible'});
    prepared=await state();supplyPurchase={quantity,price,funding:supplyFunding,before:rested,after:prepared,exactAutosave:true};
    await capture('poi-after-trial-native-potion-stock');
  }
  const eventIndex=report.nativeDepartureEvents?.length??0;
  await keyboardActivate('.exploration-stop [data-action="continue"]');await returnToPoiMap();
  const departed=await state(),events=report.nativeDepartureEvents?.slice(eventIndex)??[];
  if(events.length){
    assert.equal(events.length,1);const event=events[0];
    assert.ok(['rep_event_public_petition','rep_event_brokered_information'].includes(event.sequence));
    assert.deepEqual(event.before,prepared,'Refuge departure changed truth before the fresh canonical social event');
    const completedEvent=structuredClone(event.after);
    completedEvent.seenUniqueEvents.push(`reputation-director-event|${rested.stepCounter}|lion-social-window-1|${event.markerEvent}`);
    assertCanonicalMatch(departed,completedEvent,'Native departure differs from the completed authored social event and its exact once-only marker');
    assertExpeditionStep(completedEvent,departed,0);
  }else {
    assertCanonicalMatch(departed,prepared,'Resolved refuge departure repeated a one-shot effect');
    assertExpeditionStep(prepared,departed,0);
  }
  const onward=await poiNoReplayPath(['lion-reserve-trail','lion-valmir-road',...(postTrial?[milestone]:[])],true,`poi-after-${prefix}-prepared-return`,true);
  report.poi[postTrial?'trialRefugePreparation':'valmirRefugePreparation']={before,arrival,funding,restBefore,rested,prepared,supplyPurchase,departed,departureEvents:events,nativeCost:cost,servicesTemporaryLootUnchanged:true,checkpointUnchanged:true,
    returnPath,onward,paidRestPersistedExactly:cost>0,skippedAlreadyHealthy:cost===0,exactSavedOwner:true};
}
async function prepareNativeWeapon(nodeId){
  const baseItemId='steel_greatsword',forge=explorationPlan==='complete'&&nodeId==='lion-second-refuge';
  const itemId=forge?'ember_greatsword':baseItemId,unitId='warrior',initial=await state();
  if([itemId,'ember_greatsword'].includes(initial.clan.members.find(u=>u.id===unitId).equipment.weaponIds[0]))return;
  const reuseEquippedBase=forge&&initial.clan.members.find(u=>u.id===unitId).equipment.weaponIds[0]===baseItemId;
  const purchaseId=reuseEquippedBase?'novice_greatsword':baseItemId;
  await keyboardActivate('.exploration-stop [data-action="shop"]');
  const buy=`.management [data-trade="buy"][data-item="${purchaseId}"]`;
  await page.locator(buy).waitFor({state:'visible'});
  const before=await state(),price=Number.parseInt(await page.locator(buy).innerText(),10);
  assert.ok(Number.isInteger(price)&&price>0&&before.gold>=price,'Native weapon purchase must be affordable');
  await keyboardActivate(buy);const bought=await state(),expectedBuy=structuredClone(before);
  expectedBuy.gold-=price;expectedBuy.inventory.weapons[purchaseId]=(expectedBuy.inventory.weapons[purchaseId]??0)+1;
  expectedBuy.shops.valmir.stock[purchaseId]-=1;assert.deepEqual(bought,expectedBuy,'Native purchase changed unrelated truth');
  let prepared=bought;
  if(reuseEquippedBase){
    await keyboardActivate('.management [data-action="close"]');
    await keyboardActivate('.exploration-stop [data-action="clan"]');
    await keyboardActivate(`.management [data-unit="${unitId}"]`);
    await keyboardActivate('.management [data-equip-slot="weapon"]');
    await keyboardActivate(`.management [data-preview-item="${purchaseId}"]`);
    await keyboardActivate(`.management [data-equip-confirm="${purchaseId}"]`);
    const swapped=await state(),expected=structuredClone(bought),hero=expected.clan.members.find(u=>u.id===unitId);
    assert.deepEqual(hero.equipment.accessoryIds,[null,null],'Native forge swap scope expects the earned accessory-free warrior');
    hero.equipment.weaponIds[0]=purchaseId;hero.currentHealth=Math.min(hero.currentHealth,140);
    expected.inventory.weapons[purchaseId]-=1;expected.inventory.weapons[baseItemId]=(expected.inventory.weapons[baseItemId]??0)+1;
    assert.deepEqual(swapped,expected,'Native substitute equipment must return the actual steel blade without healing');
    assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),swapped);
    prepared=swapped;await keyboardActivate('.management [data-action="close"]');
    await keyboardActivate('.exploration-stop [data-action="shop"]');
  }
  if(forge){
    const beforeForge=prepared;
    assert.ok(beforeForge.gold>=80&&(beforeForge.inventory.materials.iron_ore??0)>=2,'Earned permanent resources must fund the existing forge recipe');
    await keyboardActivate('.management [data-shop-mode="craft"]');
    const craft='.management [data-craft="craft_burn_greatsword"]';
    assert.equal(await page.locator(craft).isEnabled(),true);assert.match(await page.locator(craft).getAttribute('aria-label'),/80 or/);
    const ingredientText=await page.locator(craft).locator('..').locator('.craft-recipe__ingredients').innerText();
    assert.match(ingredientText,/Minerai de fer \d+\/2/,'Native forge must disclose its real permanent material cost');
    await capture(`${nodeId}-native-earned-forge-ready`);
    await keyboardActivate(craft);const forged=await state(),expected=structuredClone(beforeForge);
    expected.gold-=80;expected.inventory.weapons[baseItemId]-=1;
    expected.inventory.materials.iron_ore-=2;expected.inventory.weapons[itemId]=(expected.inventory.weapons[itemId]??0)+1;
    assert.deepEqual(forged,expected,'Native forge must consume only the exact existing permanent recipe inputs');
    assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),forged);
    (report.nativeForgePreparation??=[]).push({nodeId,recipeId:'craft_burn_greatsword',cost:80,iron:2,baseItemId,itemId,reuseEquippedBase,purchaseId,before:beforeForge,after:forged,temporaryLootUnchanged:true});
    await capture(`${nodeId}-native-earned-forge`);prepared=forged;
  }
  await keyboardActivate('.management [data-action="close"]');
  await keyboardActivate('.exploration-stop [data-action="clan"]');
  await keyboardActivate(`.management [data-unit="${unitId}"]`);
  await keyboardActivate('.management [data-equip-slot="weapon"]');
  await keyboardActivate(`.management [data-preview-item="${itemId}"]`);
  await keyboardActivate(`.management [data-equip-confirm="${itemId}"]`);
  const equipped=await state(),expectedEquip=structuredClone(prepared),hero=expectedEquip.clan.members.find(u=>u.id===unitId);
  const old=hero.equipment.weaponIds[0];hero.equipment.weaponIds[0]=itemId;
  expectedEquip.inventory.weapons[old]=(expectedEquip.inventory.weapons[old]??0)+1;
  expectedEquip.inventory.weapons[itemId]-=1;
  assert.deepEqual(equipped,expectedEquip,'Native stronger weapon must not heal or change unrelated truth');
  await keyboardActivate('.management [data-action="close"]');
  await keyboardActivate('.exploration-stop [data-action="shop"]');
  await keyboardActivate('.management [data-shop-mode="sell"]');
  const sell=`.management [data-trade="sell"][data-item="${old}"]`;
  const proceeds=Number.parseInt(await page.locator(sell).innerText(),10);
  assert.ok(Number.isInteger(proceeds)&&proceeds>0,'Native previous weapon sale price missing');
  await keyboardActivate(sell);const sold=await state(),expectedSell=structuredClone(equipped);
  expectedSell.gold+=proceeds;expectedSell.inventory.weapons[old]-=1;expectedSell.shops.valmir.stock[old]=(expectedSell.shops.valmir.stock[old]??0)+1;
  assert.deepEqual(sold,expectedSell,'Native sale changed unrelated truth');
  assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),sold);
  (report.nativeWeaponPreparation??=[]).push({nodeId,itemId,purchaseId,unitId,price,old,proceeds,before,bought,equipped,sold});
  await capture(`${nodeId}-native-${forge?'ember-forged':'steel'}-equipment`);
  await keyboardActivate('.management [data-action="close"]');
}
async function cellClick(frame,cell,attempt){
  if(!touchInput){
    const canvas=frame.locator('#combat-battlefield');await canvas.focus();
    const current=await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)}));
    assert.ok(Number.isInteger(current.gx)&&Number.isInteger(current.gz),'Native keyboard cursor missing');
    for(let x=current.gx;x!==cell.gx;x+=Math.sign(cell.gx-x))await page.keyboard.press(cell.gx>x?'ArrowRight':'ArrowLeft');
    for(let z=current.gz;z!==cell.gz;z+=Math.sign(cell.gz-z))await page.keyboard.press(cell.gz>z?'ArrowDown':'ArrowUp');
    assert.deepEqual(await canvas.evaluate(e=>({gx:Number(e.dataset.cursorGx),gz:Number(e.dataset.cursorGz)})),{gx:cell.gx,gz:cell.gz});
    await page.keyboard.press('Enter');report.inputs.push({action:'native battlefield keyboard cell',cell:{gx:cell.gx,gz:cell.gz}});return true;
  }
  const point=await frame.evaluate(({gx,gz})=>window.__qaHelpers.getCellScreenPosition(gx,gz),cell);
  const box=await page.locator('iframe.combat-frame').boundingBox();
  for(const [dx,dy] of [[0,0],[8,0],[-8,0],[0,8],[0,-8]]){
    const x=point.screenX+dx,y=point.screenY+dy;
    const observation=await frame.evaluate(({x,y})=>{const hit=document.elementFromPoint(x,y);return{
      tag:hit?.tagName??null,id:hit?.id??null,classes:hit?.className??null,
      hover:window.G.hover&&{gx:window.G.hover.gx,gz:window.G.hover.gz},mode:window.G.mode,busy:window.G.busy};},{x,y});
    const hit=observation.tag==='CANVAS';
    const pointer={cell:{gx:cell.gx,gz:cell.gz},projected:point,iframe:box,local:{x,y},observation,clicked:hit};
    (report.pointerAttempts??=[]).push(pointer);if(attempt)(attempt.pointerAttempts??=[]).push(pointer);
    if(hit){await page.touchscreen.tap(box.x+x,box.y+y);report.inputs.push({action:'native battlefield touch cell',cell:{gx:cell.gx,gz:cell.gz}});return true;}
  }return false;
}
async function settled(frame){await frame.waitForFunction(()=>window.G.over||!window.G.busy&&window.G.mode==='menu',null,{timeout:30000});}
async function verifyTouchDeployment(frame,entry){
  const owner=await state(),saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
  const deployed=await frame.evaluate(()=>G.deployedUnits.map(u=>u.campaignId||u.id));
  const expected=await frame.evaluate(()=>G.rosterDefs.map(u=>u.campaignId||u.id));
  const seen=new Set(),controls=[];
  const first=async()=>{for(let i=0;i<10;i++){const b=frame.locator('#menu [data-d="prev"]:not(:disabled)');if(!await b.count())return;await b.tap();}throw Error('Native roster never reached first page');};
  await first();
  for(let i=0;i<10;i++){
    for(const id of await frame.locator('#menu [data-unit]').evaluateAll(bs=>bs.map(b=>b.dataset.unit)))seen.add(id);
    for(const button of await frame.locator('#menu .deploy-actions button,#menu .deploy-pages button').all()){
      await button.scrollIntoViewIfNeeded();const r=await button.boundingBox(),panel=await frame.locator('#menu').boundingBox();
      assert.ok(r&&r.width>=44&&r.height>=44,'Native touch deployment target below44px');
      assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=viewport[0]+1&&r.y+r.height<=viewport[1]+1,'Native touch deployment target outside viewport');
      assert.ok(r.y>=panel.y-1&&r.y+r.height<=panel.y+panel.height+1,'Native touch deployment target clipped by its scroll panel');
      controls.push({action:await button.getAttribute('data-d'),...r});
    }
    const next=frame.locator('#menu [data-d="next"]:not(:disabled)');if(!await next.count())break;await next.tap();
  }
  assert.deepEqual([...seen].sort(),[...expected].sort(),'Native touch pagination did not expose the entire roster');
  await first();assert.deepEqual(await frame.evaluate(()=>G.deployedUnits.map(u=>u.campaignId||u.id)),deployed);
  assert.deepEqual(await state(),owner);assert.equal(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')),saved);
  entry.deploymentTouch={controls,roster:[...seen],deployed,exactOwnerUnchanged:true,exactSaveUnchanged:true,nativePagination:true};
}
async function attack(frame,battle,{support=false,exactAp=null}={}){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="attack"]:not(:disabled)').first();
  const attempt={before,support,buttons:await frame.locator('#menu [data-a="attack"]').evaluateAll(bs=>bs.map(b=>({disabled:b.disabled,text:b.textContent.trim(),weaponIndex:b.dataset.wi})))};
  (battle.attackAttempts??=[]).push(attempt);
  if(!await button.count()){attempt.reason='native-attack-disabled';return false;}
  await activateControl(button);
  const charges=frame.locator('#skillmenu [data-ch]:not([data-ch="_back"]):not(:disabled)');
  attempt.charges=await frame.locator('#skillmenu [data-ch]:not([data-ch="_back"])').evaluateAll(bs=>bs.map(b=>({charge:b.dataset.ch,disabled:b.disabled,text:b.textContent.trim()})));
  if(!await charges.count()){attempt.reason='native-charges-disabled';await cancel(frame);return false;}
  const charge=support?charges.first():charges.last();attempt.selectedCharge=await charge.getAttribute('data-ch');await activateControl(charge);
  const native=await frame.evaluate(({support,exactAp})=>{const g=window.G,centers=(g.pending?.centers??[]).map(c=>{
    const u=g.grid[c.gx]?.[c.gz]?.occupant;return{gx:c.gx,gz:c.gz,target:u&&{id:u.campaignId||u.id,team:u.team,alive:u.alive,hp:u.hp,maxhp:u.maxhp}};
  });return{spec:g.pending?.spec,centers,candidates:centers.filter(c=>c.target?.alive&&(support
    ?g.pending.spec.weaponType==='crosier'&&c.target.team===g.active.team&&(exactAp===1?c.target.hp===c.target.maxhp:c.target.hp<c.target.maxhp*.95)
    :c.target.team!==g.active.team)).sort((a,b)=>support?a.target.hp/a.target.maxhp-b.target.hp/b.target.maxhp:a.target.hp-b.target.hp)
    .map(c=>({gx:c.gx,gz:c.gz,targetId:c.target.id}))};},{support,exactAp});
  Object.assign(attempt,native);
  if(exactAp!==null&&native.spec?.ap!==exactAp){attempt.reason='native-cost-outside-scoped-setup';await cancel(frame);return false;}
  for(const cell of native.candidates){if(await cellClick(frame,cell,attempt)){
    await page.waitForTimeout(50);
    const started=await combatState(frame);
    if(started.mode==='target'&&!started.busy){attempt.reason='native-pointer-did-not-start-action';continue;}
    if(!battle.impactCaptured){await capture(`combat-${battle.index}-actual-impact`);battle.impactCaptured=true;}
    await settled(frame); const after=await combatState(frame);
    if(support){const old=before.units.find(u=>u.id===cell.targetId),healed=after.units.find(u=>u.id===cell.targetId);
      if(exactAp===1)assert.equal(healed.hp,old.hp,'Native healthy-ally setup changed clamped HP');
      else assert.ok(healed.hp>old.hp,'Native crosier input did not heal its selected ally');
      assert.ok(after.active?.id!==before.active.id||after.active.ap<before.active.ap,'Native crosier action did not spend AP');}
    battle.actions.push({kind:support?'crosier-heal':'attack',cell,spec:native.spec,before,after});attempt.reason='native-action-resolved';
    return true;
  }}
  attempt.reason??=native.candidates.length?'no-native-pointer-hit':'no-native-eligible-target';await cancel(frame);return false;
}
async function heal(frame,battle){
  const before=await combatState(frame);
  const wounded=before.units.filter(u=>u.team==='player'&&u.alive&&u.hp<u.maxhp*(['lion_chief','village_raid'].includes(battle.combatId)?.75:.5));
  const fallen=before.units.filter(u=>u.team==='player'&&u.downed&&!u.alive);
  if(!wounded.length&&!fallen.length)return false;
  const item=frame.locator('#menu [data-a="item"]:not(:disabled)');if(!await item.count())return false;
  const itemId=fallen.length&&before.inventory.revive_vial>0?'revive_vial':'potion';
  const targets=itemId==='revive_vial'?fallen:wounded.sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp);
  if(!(before.inventory[itemId]>0)||!targets.length)return false;
  await activateControl(item);const selected=frame.locator(`#skillmenu [data-i="${itemId}"]:not(:disabled)`);
  if(!await selected.count()){await cancel(frame);return false;} await activateControl(selected);
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
  // A healthy ally can absorb the native one-AP setup without healing the test target.
  if(process.env.DEMO_QA_VERIFY_SALVATION==='1'&&before.active.id==='white_mage'&&before.active.ap===3
    &&before.attacks===0&&wounded.length&&!report.battles.slice(report.inheritedBattleCount??0).some(b=>b.actions.some(a=>a.verifiedExactly2Ap))
    ){
    await activateControl(menu);const salvation=frame.locator('#skillmenu [data-s="w_salvation"]:not(:disabled)');
    let eligible=false,salvationRange=null;
    if(await salvation.count()){
      await activateControl(salvation);
      eligible=await frame.evaluate(()=>G.pending?.centers.some(c=>{
        const u=G.grid[c.gx]?.[c.gz]?.occupant;return u?.team==='player'&&u.alive&&u.hp<u.maxhp*.95;
      })??false);
      salvationRange=await frame.evaluate(()=>G.pending?.spec.range);
    }
    await cancel(frame);
    if(eligible&&await attack(frame,battle,{support:true,exactAp:1})){
      const setup=battle.actions.at(-1);
      assert.equal(setup.after.active?.id,before.active.id,'Native setup changed caster');
      assert.equal(setup.after.active.ap,2,'Native one-AP setup did not leave exactly two AP');
      setup.exactly2ApSetup=true;return true;
    }
    if(eligible&&await move(frame,battle,{support:true,supportRange:before.active.weapons[0].max,salvationRange}))return true;
  }
  const ids=(before.active.id==='white_mage'&&wounded.length
    ?['w_salvation','w_purify']:['n_dark_bolt','a_precise_shot','ar_calibrated_shot','w_break_guard','ro_sneak_attack','l_long_thrust']
  ).filter(id=>before.active.skills.includes(id));
  for(const id of ids){
    await activateControl(menu);const option=frame.locator(`#skillmenu [data-s="${id}"]:not(:disabled)`);
    const attempt={skillId:id,round:before.round,active:before.active,available:await option.count()>0};
    if(battle.combatId==='lion_chief'){
      attempt.menu=await frame.locator('#skillmenu [data-s]:not([data-s="_back"])').evaluateAll(buttons=>buttons.map(b=>({id:b.dataset.s,disabled:b.disabled,text:b.textContent.trim()})));
      (battle.skillAttempts??=[]).push(attempt);
    }
    if(!await option.count()){await cancel(frame);continue;}
    await activateControl(option);
    const pending=await frame.evaluate(()=>window.G.pending&&({spec:window.G.pending.spec,centers:window.G.pending.centers.map(c=>{
      const u=window.G.grid[c.gx]?.[c.gz]?.occupant;return{...c,targetId:u&&(u.campaignId||u.id)};
    })}));
    if(!pending){await cancel(frame);continue;}
    const targets=(id.startsWith('w_s')||id==='w_purify'?wounded:before.units.filter(u=>u.team==='foe'&&u.alive))
      .sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp);
    attempt.eligibleCenters=targets.flatMap(t=>pending.centers.filter(c=>t.id===c.targetId));
    for(const cell of attempt.eligibleCenters){
      const target=targets.find(t=>t.id===cell.targetId);
      if(id==='w_salvation'&&process.env.DEMO_QA_VERIFY_SALVATION==='1'&&before.active.ap===2)
        await capture(`combat-${battle.index}-salvation-exactly2ap-before-${battle.actions.length}`);
      if(!await cellClick(frame,cell))continue;
      // A final knockout can set over before the native AP deduction has completed.
      await frame.waitForFunction(()=>!G.busy&&(G.over||G.mode==='menu'),null,{timeout:30000});
      const after=await combatState(frame);
      if(after.active?.id===before.active.id&&after.active.ap===before.active.ap){await cancel(frame);continue;}
      battle.actions.push({kind:'skill',skillId:id,targetId:target.id,spec:pending.spec,before,after});
      const initial=battle.initialEquipmentSkills?.find(u=>u.id===before.active.id&&u.skillId===id);
      if(initial){
        assert.equal(pending.spec.ap,2,'Initial competence lost its authored two-AP cost');
        assert.equal(after.active?.id,before.active.id,'Initial competence changed the active caster');
        const knockoutRefunds=before.units.filter(u=>u.team==='foe'&&u.alive
          &&after.units.some(t=>t.id===u.id&&!t.alive)).length;
        const expectedAp=Math.max(0,Math.min(before.active.maxap,before.active.ap+knockoutRefunds)-2);
        assert.equal(after.active.ap,expectedAp,'Initial competence AP disagrees with native cost and capped knockout refunds');
        battle.actions.at(-1).nativeApAccounting={cost:2,knockoutRefunds,maxap:before.active.maxap,expectedAp};
        battle.actions.at(-1).verifiedInitialEquipmentCast=initial;
      }
      await capture(`combat-${battle.index}-${id}-${battle.actions.length}`);
      if(id==='w_salvation'&&process.env.DEMO_QA_VERIFY_SALVATION==='1'){
        const healed=after.units.find(u=>u.id===target.id);
        assert.equal(pending.spec.healPercent,.4,'Lumière Salvatrice lost its authored 40 percent heal in the action spec');
        assert.equal(pending.spec.ap,2,'Lumière Salvatrice lost its authored two-AP cost');
        assert.equal(healed.hp,Math.min(target.maxhp,target.hp+Math.round(target.maxhp*.4)));
        battle.actions.at(-1).verifiedHealing=true;
        if(before.active.ap===2){
          assert.equal(after.active?.id,before.active.id,'Salvation changed the active caster');
          assert.equal(after.active.ap,0,'Salvation from exactly two AP did not consume exactly two AP');
          battle.actions.at(-1).verifiedExactly2Ap=true;
        }
      }
      return true;
    }await cancel(frame);
  }return false;
}
async function move(frame,battle,{support=false,supportRange=3,salvationRange=null}={}){
  const before=await combatState(frame), button=frame.locator('#menu [data-a="move"]:not(:disabled)');
  if(!await button.count())return false;await activateControl(button);
  const candidates=await frame.evaluate(({support,supportRange,salvationRange})=>{const g=window.G,u=g.active,foes=g.units.filter(e=>e.team==='foe'&&e.alive);
    const allies=g.units.filter(e=>e.team===u.team&&e.alive&&e!==u);
    // This is a pilot preference only. Native reach and subsequent pointer
    // activation remain the authority for every move; no outcome is predicted.
    const distance=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gz-b.gz);
    const rank=c=>{if(support){
      const nearestFoe=Math.min(...foes.map(e=>distance(c,e)));
      if(salvationRange){
        // Keep a healthy basic-crosier target and a distinct wounded Salvation
        // target in range; native reach, targeting and AP still decide legality.
        const healthyGap=Math.min(...allies.filter(a=>a.hp===a.maxhp).map(a=>Math.max(0,distance(c,a)-supportRange)));
        const woundedGap=Math.min(...allies.filter(a=>a.hp<a.maxhp*.95).map(a=>{
          const d=distance(c,a);return Math.max(0,salvationRange[0]-d,d-salvationRange[1]);
        }));
        return healthyGap*1000+woundedGap*1000+(nearestFoe<1?1000:0);
      }
      const uncovered=allies.filter(a=>distance(c,a)>supportRange).length;
      const woundedGap=allies.filter(a=>a.hp<a.maxhp*.95).reduce((sum,a)=>sum+Math.max(0,distance(c,a)-supportRange),0);
      return (nearestFoe<(supportRange>=3?3:1)?1000:0)+uncovered*100+woundedGap*200+Math.abs(nearestFoe-4)*5;
    }
    let score=Infinity;for(const e of foes)for(const w of u.weapons){
      const d=Math.abs(c.gx-e.gx)+Math.abs(c.gz-e.gz),inRange=w.weaponType==='long_spear'
        ?Math.max(Math.abs(c.gx-e.gx),Math.abs(c.gz-e.gz))===1:d>=w.min&&d<=w.max;
      score=Math.min(score,(inRange?0:100)+d);
    }return score;};
    return(g.reach?.list??[]).filter(c=>(c.gx!==u.gx||c.gz!==u.gz)&&!g.grid[c.gx][c.gz].occupant)
      .map(c=>({gx:c.gx,gz:c.gz,score:rank(c)})).filter(c=>!support||c.score<rank(u)).sort((a,b)=>a.score-b.score);},{support,supportRange,salvationRange});
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
  const ownerBefore=await state();
  const entry={index:report.battles.length,nodeId:ownerBefore.currentNodeId,eliteId:ownerBefore.run.poiExpedition?.encounter?.eliteId,
    ownerBefore,
    combatId:await page.evaluate(()=>window.__demoQaApp.combat.session?.config.id),actions:[],pass:false}; report.battles.push(entry);
  assert.equal(await frame.evaluate(()=>typeof window.__qaHelpers.teleportActiveUnitNextToEnemy),'undefined','Production mutation helper present');
  for(const selector of ['#tutorial:not(.hidden) [data-action="skip"]','#boss-tutorial:not(.hidden) [data-action="start"]']){
    if(await frame.locator(selector).isVisible().catch(()=>false))await activateControl(frame.locator(selector));
  }
  await activateControl(frame.locator('#menu [data-d="auto"]'));
  entry.deployed=await frame.evaluate(()=>window.G.deployedUnits.length);assert.ok(entry.deployed>0&&entry.deployed<=4,'Deployment exceeds the existing four-unit cap');
  const nativeConfig=await page.evaluate(()=>window.__demoQaApp.combat.session.config);
  assert.ok(entry.deployed<=nativeConfig.maxPlayerUnits,'Native deployment exceeds this actual encounter limit');
  if(entry.eliteId||entry.nodeId.startsWith('lion-poi-')){
    entry.nativeEnemyVisualIds=await frame.evaluate(()=>G.units.filter(unit=>unit.team==='foe').map(unit=>unit.combatPoseUnitId));
    assert.deepEqual(entry.nativeEnemyVisualIds,[...nativeConfig.enemyVisualIds],'Native Lot E formation differs from its approved actual config');
  }
  entry.ownerBefore=await state();
  const preparedEndingParty=target==='ending'&&process.env.DEMO_QA_VERIFY_SALVATION!=='1'
    &&['serpent_captain','lion_chief'].includes(entry.combatId);
  const preparedRaidParty=target==='second-refuge'&&routePlan==='sacrifice'&&entry.combatId==='village_raid';
  const preparedEliteParty=Boolean(entry.eliteId);
  const preparedExpeditionParty=nativeEquipment&&explorationPlan==='complete'&&entry.nodeId.startsWith('lion-poi-seal-');
  const preparedParty=preparedEndingParty||preparedRaidParty||preparedEliteParty||preparedExpeditionParty;
  const intentionalDefeat=nativeDefeatWait&&entry.nodeId===defeatNodeId;
  if(process.env.DEMO_QA_VERIFY_SALVATION==='1'||preparedParty||intentionalDefeat){
    entry.availableRoster=await frame.evaluate(()=>G.rosterDefs.map(u=>({id:u.campaignId||u.id,skills:[...u.skills]})));
    const initialSkills={warrior:'w_break_guard',white_mage:'w_salvation',dark_mage:'n_dark_bolt',archer:'a_precise_shot',rogue:'ro_sneak_attack',lancer:'l_long_thrust'};
    entry.initialEquipmentSkills=[];
    for(const candidate of entry.availableRoster){
      const hero=entry.ownerBefore.clan.members.find(u=>u.id===candidate.id),expected=initialSkills[hero?.definitionId];
      if(expected&&hero.equipment.weaponIds[0]?.startsWith('novice_')){
        assert.deepEqual(candidate.skills,[expected],`Native initial-equipment competence: ${candidate.id}`);
        entry.initialEquipmentSkills.push({id:candidate.id,definitionId:hero.definitionId,weaponId:hero.equipment.weaponIds[0],skillId:expected});
      }
    }
    // Native player deployment rotates unobserved initial competences into the four-unit party.
    const observed=new Set(report.battles.slice(report.inheritedBattleCount??0)
      .flatMap(b=>b.actions.map(a=>a.verifiedInitialEquipmentCast?.id).filter(Boolean)));
    const missing=entry.initialEquipmentSkills.filter(u=>!observed.has(u.id))
      .sort((a,b)=>Number(['rogue','lancer'].includes(b.definitionId))-Number(['rogue','lancer'].includes(a.definitionId)));
    const available=new Set(entry.availableRoster.map(u=>u.id));
    const limit=Number((await frame.locator('#menu .deploy-head b').innerText()).match(/\d+\s*\/\s*(\d+)/)?.[1]);
    assert.ok(Number.isInteger(limit)&&limit>=1&&limit<=4,'Native encounter deployment limit invalid');
    const preferred=preparedEliteParty?['white_mage','warrior','rogue']
      :preparedRaidParty?['white_mage','warrior','rogue','dark_mage']
      :preparedEndingParty||preparedExpeditionParty?['white_mage','warrior','lancer','rogue']:['white_mage','warrior',...missing.map(u=>u.id)];
    let picks=[...new Set([...preferred,...available])].filter(id=>available.has(id)
      &&(!preparedParty||entry.ownerBefore.clan.members.some(u=>u.id===id&&u.currentHealth>0)))
      .slice(0,preparedParty?limit:4);
    if(intentionalDefeat){
      const living=entry.ownerBefore.clan.members.filter(u=>available.has(u.id)&&u.currentHealth>0).sort((a,b)=>a.currentHealth-b.currentHealth);
      assert.ok(living.length);picks=[living[0].id];
      entry.nativeDefeatDeployment={picks,actualHealth:living[0].currentHealth,nativeLivingClanOnly:true};
    }
    assert.ok(picks.length>0&&picks.length<=limit,'Native party must fit the encounter');
    if(preparedEndingParty)entry.preparedEndingParty={preferred,picks,limit,existingLivingClanOnly:true};
    if(preparedRaidParty)entry.preparedRaidParty={preferred,picks,limit,existingLivingClanOnly:true};
    if(preparedEliteParty)entry.preparedEliteParty={preferred,picks,limit,existingLivingClanOnly:true};
    if(preparedExpeditionParty)entry.preparedExpeditionParty={preferred,picks,limit,existingLivingClanOnly:true};
    await activateControl(frame.locator('#menu [data-d="reset"]'));
    for(const id of picks){
      const selector=`#menu [data-unit="${id}"]`;
      for(let pageIndex=0;pageIndex<entry.availableRoster.length&&!await frame.locator(selector).count();pageIndex++){
        const next=frame.locator('#menu [data-d="next"]:not(:disabled)');
        if(!await next.count())break;await activateControl(next);
      }
      assert.equal(await frame.locator(selector).count(),1,`Native deployment card missing: ${id}`);
      await activateControl(frame.locator(selector));
      const cells=await frame.evaluate(()=>G.deployZone.filter(c=>!c.occupant).map(c=>({gx:c.gx,gz:c.gz})));
      let placed=false;
      for(const cell of cells){if(await cellClick(frame,cell)
        &&await frame.evaluate(id=>G.deployedUnits.some(u=>u.campaignId===id),id)){placed=true;break;}}
      assert.equal(placed,true,`Native deployment did not place: ${id}`);
      const previous=frame.locator('#menu [data-d="prev"]:not(:disabled)');
      if(await previous.count())await activateControl(previous);
    }
    entry.nativeDeploymentIds=await frame.evaluate(()=>G.deployedUnits.map(u=>u.campaignId));
    assert.deepEqual(entry.nativeDeploymentIds,picks,'Native deployment does not match selected party');
    entry.deployed=entry.nativeDeploymentIds.length;
  }
  entry.autosaveBefore=JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')));
  if(touchInput)await verifyTouchDeployment(frame,entry);
  await capture(`combat-${entry.index}-deployment`);
  await activateControl(frame.locator('#menu [data-d="start"]'));
  if(entry.index===0&&!priorProof&&['forest_ambush','wolf_pack'].includes(entry.combatId)){
    entry.initialRoster=await frame.evaluate(()=>G.units.map(u=>({id:u.campaignId||u.id,team:u.team,skills:[...u.skills]})));
    assert.equal(entry.initialRoster.filter(u=>u.team==='foe').length,2,'Opening enemy count');
    for(const [id,skill] of Object.entries({warrior:'w_break_guard',white_mage:'w_salvation',dark_mage:'n_dark_bolt',archer:'a_precise_shot'}))
      assert.deepEqual(entry.initialRoster.find(u=>u.id===id)?.skills,[skill],`Initial native skill: ${id}`);
  }
  if(!touchInput&&entry.index===(report.inheritedBattleCount??0))await campaignBattlefieldKeyboard(frame,entry);
  for(let index=0;index<300&&Date.now()<deadline;index++){
    if(index%5===0){console.log(`BATTLE ${entry.nodeId} iteration ${index}, actions ${entry.actions.length}`);
      await writeFile(resolve(output,'progress.json'),JSON.stringify({at:new Date().toISOString(),nodeId:entry.nodeId,combat:await combatState(frame),actions:entry.actions.map(a=>a.kind)},null,2)+'\n');}
    await frame.waitForFunction(()=>window.G.over||window.G.mode==='menu'&&window.G.active?.team==='player'&&!window.G.busy,null,{timeout:60000});
    const current=await combatState(frame);if(current.over)break;
    if(nativeDefeatWait&&entry.nodeId===defeatNodeId){
      await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait-for-native-defeat',before:current});continue;
    }
    if(current.active.ap<=0){await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait',reason:'no-native-ap',before:current});continue;}
    // Conserve only for a skill exposed by the native payload.
    const conserveArcher=current.active.id==='archer'&&current.active.skills.some(id=>['a_precise_shot','ar_calibrated_shot'].includes(id));
    const supportHealer=entry.combatId==='lion_chief'&&current.active.id==='white_mage'&&current.active.skills.includes('w_salvation');
    if(supportHealer){
      if(await skill(frame,entry))continue;
      if(await heal(frame,entry))continue;
      if(await move(frame,entry,{support:true}))continue;
      await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait-support-ap',before:current});continue;
    }
    const noviceSupport=entry.combatId!=='lion_chief'&&current.active.id==='white_mage'&&current.active.weapons[0]?.weaponType==='crosier';
    if(noviceSupport){
      if(await skill(frame,entry))continue;
      // Preserve native Souffle/regen instead of exhausting Salvation's next-turn AP on a weak heal.
      if(current.active.ap===1&&current.active.skills.includes('w_salvation')&&current.units.some(u=>u.team==='player'&&u.alive&&u.id!==current.active.id)){
        await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait-conserve-salvation-ap',reason:'retain-ap-for-runtime-exposed-salvation',before:current});continue;
      }
      if(await attack(frame,entry,{support:true}))continue;
      if(await heal(frame,entry))continue;
      // Native crosiers can damage foes. A lone survivor must not wait only for ally support.
      const loneSurvivor=!current.units.some(u=>u.team==='player'&&u.alive&&u.id!==current.active.id);
      if(loneSurvivor){
        if(await attack(frame,entry))continue;
        if(await move(frame,entry))continue;
      }
      const wounded=current.units.some(u=>u.team==='player'&&u.alive&&u.id!==current.active.id&&u.hp<u.maxhp*.95);
      if(wounded&&await move(frame,entry,{support:true,supportRange:current.active.weapons[0].max}))continue;
      await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait-novice-support',reason:wounded?'no-native-support-hit-or-better-reachable-cell':'retain-ap-for-ally-support',before:current});continue;
    }
    const missingInitialArcher=process.env.DEMO_QA_VERIFY_SALVATION==='1'&&conserveArcher
      &&!report.battles.slice(report.inheritedBattleCount??0)
        .some(b=>b.actions.some(a=>a.verifiedInitialEquipmentCast?.id===current.active.id));
    if((entry.combatId==='lion_chief'||missingInitialArcher)&&conserveArcher&&current.active.ap===1&&current.attacks===0){
      await activateControl(frame.locator('#menu [data-a="wait"]'));entry.actions.push({kind:'wait-conserve-ap',before:current});continue;
    }
    if(await skill(frame,entry))continue;
    if(await heal(frame,entry))continue;
    if(await attack(frame,entry))continue;
    if(await move(frame,entry))continue;
    const before=await combatState(frame);
    await activateControl(frame.locator('#menu [data-a="wait"]')); entry.actions.push({kind:'wait',reason:'skill-item-attack-move-attempts-exhausted',before});
  }
  entry.result=await combatState(frame);
  assert.equal(entry.result.over,true,'Battle did not finish before bounded deadline');
  if(process.env.DEMO_QA_GAME_MOTION==='1'){
    assert.equal(entry.result.diagnostics.requestedReducedGraphics,true,'Combat did not receive the actual saved game preference');
    assert.equal(entry.result.diagnostics.reducedGraphics,true,'Combat did not apply the requested reduced graphics');
  }
  await capture(`combat-${entry.index}-result`);
  entry.resultText=await frame.locator('.combat-result-card').innerText();
  entry.resultControlBounds=await frame.locator('#combat-result-action').boundingBox();
  if(touchInput){
    const r=entry.resultControlBounds;assert.ok(r&&r.width>=44&&r.height>=44,'Native touch result target below44px');
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=viewport[0]+1&&r.y+r.height<=viewport[1]+1,'Native touch result target clipped');
  }
  if(target==='defeat-recovery'&&entry.resultText.includes('Défaite')){
    assert.equal(entry.nodeId,defeatNodeId,'Defeat occurred before the requested native recovery boundary');
    assert.equal(entry.result.units.filter(u=>u.team==='player'&&u.alive).length,0);
    assert.ok(entry.actions.length>0,'Native defeat requires actual player actions');
    const savedBefore=JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')));
    assert.deepEqual(savedBefore,entry.autosaveBefore,'Combat altered autosave before defeat acknowledgement');
    assert.ok(savedBefore.run.temporaryLoot.gold>0,'Recovery must demonstrate actual positive unsecured loot loss');
    const action=frame.getByRole('button',{name:'Revenir à la carte',exact:true});
    await action.focus();assert.equal(await action.evaluate(e=>e===document.activeElement),true);
    const bounds=await action.boundingBox();
    assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport[0]&&bounds.y+bounds.height<=viewport[1],
      'Defeat return control is clipped');
    await capture(`combat-${entry.index}-native-defeat-return-focus`);
    if(touchInput)await action.tap();else await action.press('Enter');report.inputs.push({action:touchInput?'native touch':'keyboard Enter',selector:'iframe #combat-result-action',outcome:'native defeat'});
    await element.waitFor({state:'detached',timeout:30000});
    await page.waitForFunction(id=>window.__demoQaApp?.state.currentNodeId===id,savedBefore.run.checkpointNodeId);
    const departure=page.locator('.poi-map [data-poi-action="move"]:visible');
    await departure.waitFor({state:'visible',timeout:30000});
    assert.equal((await departure.textContent()).trim(),'Ouvrir le refuge');
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
    if(expected.run.poiExpedition){delete expected.run.poiExpedition.pendingStep;delete expected.run.poiExpedition.encounter;delete expected.run.poiExpedition.previousSafeNodeId;}
    assert.deepEqual(recovered,expected,'Full recovery differs from the existing checkpoint rule');
    assert.equal(recovered.currentNodeId,savedBefore.run.checkpointNodeId);
    assert.equal(recovered.run.currentNodeId,savedBefore.run.checkpointNodeId);
    assert.equal(recovered.run.status,'active');
    assert.equal(recovered.run.temporaryLoot.gold,0);
    for(const inventory of Object.values(recovered.run.temporaryLoot.inventory))assert.deepEqual(inventory,{});
    for(const key of Object.keys(savedBefore).filter(key=>!['currentNodeId','run'].includes(key))){
      assert.deepEqual(recovered[key],savedBefore[key],`Defeat changed autosaved ${key}`);
    }
    assert.deepEqual(recovered.run.traversalBranches,expected.run.traversalBranches,
      'Defeat must clear only branch choices downstream of its actual checkpoint');
    for(const key of ['checkpointNodeId','graph','visitedNodeIds','revealedNodeIds'])assert.deepEqual(recovered.run[key],savedBefore.run[key]);
    const savedAfter=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
    assert.deepEqual(JSON.parse(savedAfter),recovered,'Recovery agency precedes durable owner truth');
    await writeFile(resolve(output,'earned-defeat-recovery-v6.json'),savedAfter+'\n');
    await page.waitForTimeout(400);await capture('native-defeat-recovered');
    await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
    await page.waitForFunction(id=>window.__demoQaApp?.state.currentNodeId===id,recovered.currentNodeId);
    await departure.waitFor({state:'visible',timeout:30000});
    assert.equal((await departure.textContent()).trim(),'Ouvrir le refuge');
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
  entry.nativeVictoryHealth=await frame.evaluate(()=>Object.fromEntries(G.deployedUnits
    .map(u=>[u.campaignId||u.name,Math.max(0,Math.round(u.alive?u.hp:0))])));
  if(entry.index===0&&!priorProof&&!touchInput){
    await frame.locator('#combat-result-action').focus();
    await page.keyboard.press('Enter');
    report.inputs.push({action:'native combat result Enter',nodeId:entry.nodeId});
    await element.waitFor({state:'detached',timeout:30000});
    await campaignParentKeyboardReturn(entry);
  }else{
    await activateControl(frame.locator('#combat-result-action'));await element.waitFor({state:'detached',timeout:30000});
  }
  entry.ownerAfter=await state();
  for(const [id,hp] of Object.entries(entry.nativeVictoryHealth)){
    assert.equal(entry.ownerAfter.clan.members.find(u=>u.id===id)?.currentHealth,Math.max(1,hp),
      'Authored victory did not preserve living HP or recover a KO fighter at exactly1HP');
  }
  if(entry.eliteId){
    const def=lotE.mobileEliteActors.find(elite=>elite.id===entry.eliteId);
    assert.equal(entry.combatId,def.combat.id);
    assert.equal(entry.ownerAfter.run.poiExpedition.elites[entry.eliteId].defeated,true);
    assert.deepEqual(entry.ownerAfter.resolvedNodeIds,entry.ownerBefore.resolvedNodeIds,'Elite victory resolved an underlying POI');
    assert.equal(entry.ownerAfter.run.poiExpedition.encounter,undefined);
  }else assert.ok(entry.ownerAfter.resolvedNodeIds.includes(entry.nodeId));
  const lotEDef=entry.eliteId?lotE.mobileEliteActors.find(def=>def.id===entry.eliteId):lotE.fixedPoiCandidates.find(def=>def.id===entry.nodeId);
  if(lotEDef?.combat){
    const rewards=lotEDef.combat.rewards,before=entry.ownerBefore,after=entry.ownerAfter;
    assert.equal(after.gold,before.gold,'Lot E combat credited secured gold');
    assert.equal(after.run.temporaryLoot.gold,before.run.temporaryLoot.gold+rewards.temporaryGold);
    assert.equal(after.reputation,Math.min(100,Math.max(0,before.reputation+rewards.reputation)));
    const materials={...before.run.temporaryLoot.inventory.materials};
    for(const [id,count] of Object.entries(rewards.materials))materials[id]=(materials[id]??0)+count;
    assert.deepEqual(after.run.temporaryLoot.inventory.materials,materials,'Native Lot E material reward differs from the approved exact amount');
    assert.deepEqual(after.flags,before.flags,'Lot E combat fired a canonical flag');
    assert.equal(after.run.poiExpedition.turn,before.run.poiExpedition.turn,'Combat itself advanced a threat turn');
    entry.exactLotERewards={...rewards,temporary:true,pass:true};
  }
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
    const original=JSON.parse(earnedText),resumed=await state(),preserved=structuredClone(resumed);
    const originalIds=new Set(original.run.graph.nodes.map(node=>node.id));
    preserved.run.graph.nodes=preserved.run.graph.nodes.filter(node=>originalIds.has(node.id));
    if(!original.run.poiExpedition)delete preserved.run.poiExpedition;
    assert.deepEqual(preserved,original,'Additive V6 load changed an existing canonical fact');
    report.earnedResume.additiveMigration={originalNodes:original.run.graph.nodes.length,currentNodes:resumed.run.graph.nodes.length,canonicalFactsExact:true};
    if(['first-refuge','second-refuge','valmir','preparation','ending','expedition-checkpoint'].includes(target)&&['lion-first-refuge','lion-second-refuge'].includes(JSON.parse(earnedText).currentNodeId)){
      await page.waitForFunction(()=>[...document.querySelectorAll('.poi-map,.exploration-stop')]
        .some(e=>e.getClientRects().length&&!e.closest('[inert]')));
      if(await page.locator('.poi-map:visible').count()){
        await inspectPoiAtlas();
        if(process.env.DEMO_QA_GAME_MOTION==='1'&&!(await state()).settings.reducedGraphics){
          const before=await state();await keyboardActivate('.poi-map [data-poi-action="motion"]');
          const changed=await state(),expected=structuredClone(before);expected.settings.reducedGraphics=true;
          assert.deepEqual(changed,expected,'Native motion preference changed unrelated V6 truth');
          report.nativeInitialGameMotionControl=true;
        }
        const current=JSON.parse(earnedText).currentNodeId;
        assert.equal((await state()).currentNodeId,current);
        await activateControl(page.locator(`.poi-map [data-poi-id="${current}"]`));
        await activateControl(page.locator('.poi-map [data-poi-action="move"]:not(:disabled)'));
        report.inputs.push({action:'native current refuge pointer reopening',id:current});
        await page.locator('.exploration-stop:visible:not([inert])').waitFor({state:'visible'});
      }
    }
  }else await click('.title-screen [data-action="new"]');
  report.motionEvidence=await page.evaluate(()=>({
    osRequested:matchMedia('(prefers-reduced-motion: reduce)').matches,
    gameRequested:window.__demoQaApp.state.settings.reducedGraphics,
  }));
  report.motionEvidence.nativeGameControl=report.nativeInitialGameMotionControl===true;
  assert.equal(report.motionEvidence.osRequested,report.osReducedMotion,'OS motion emulation does not match the requested scenario');
  if(report.osReducedMotion)assert.equal(report.motionEvidence.gameRequested,false,'OS-only motion proof requires normal game graphics');
  for(let index=0;index<12000&&Date.now()<deadline;index++){
    await verifyExpeditionSettlement();
    if(await handleExpeditionDialog())continue;
    let live=await state();if(report.nodes.at(-1)!==live.currentNodeId){report.nodes.push(live.currentNodeId);console.log(`NODE ${live.currentNodeId}`);}
    if(target==='preparation'){
      assert.notEqual(live.currentNodeId,'lion-final-judgement','Preparation target overrun into judgement');
    }
    if(await page.locator(preparationContinue).count()){
      live=await state();assert.equal(live.currentNodeId,'lion-final-refuge');
      if(!report.preparation){
        await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
        const before=await state(),saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
        if(touchInput){const bounds=await page.locator(preparationContinue).boundingBox();assert.ok(bounds&&bounds.width>=44&&bounds.height>=44,'Preparation touch action below44px');}
        assert.equal((await page.locator('.journey-overlay__title').textContent()).trim(),'Avant le jugement');
        assert.equal(await page.locator('.exploration-stop:visible,iframe.combat-frame').count(),0);
        assert.equal(await page.locator('.narrative-cast__actor').count(),3);
        assert.deepEqual(JSON.parse(saved),before);await capture('poi-final-refuge-preparation');
        if(report.poi?.finalCombatAlternative){
          assert.ok(before.run.temporaryLoot.gold>0,'Final preparation unexpectedly secured the earned T3 loot');
          assert.equal(before.run.checkpointNodeId,'lion-second-refuge');assert.notEqual(before.flags['refugeSecured:lion-final-refuge'],true);
        }
        await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
        await page.locator(preparationContinue).waitFor();
        assert.deepEqual(await state(),before,'Preparation reload changed owner or secured loot');
        report.preparation={before,resumed:await state(),exactV6:true,noHub:true,noNewSecuring:true};
        await capture('poi-final-refuge-preparation-resumed');
        if(target==='preparation'){
          report.resumed=await state();await writeFile(resolve(output,'earned-final-refuge-v6.json'),saved+'\n');
          assert.deepEqual(report.errors,[]);report.pass=true;break;
        }
      }
      await keyboardActivate(preparationContinue);await returnToPoiMap();continue;
    }
    const introduction=await page.locator('.dialogue:visible').evaluateAll(elements=>elements.map(e=>({sequence:e.dataset.dialogueSequence,step:e.dataset.dialogueStep}))) ;
    const introductory=introduction.find(e=>['acte_ouverture','camp_departure'].includes(e.sequence));
    report.introductions??=[];
    if(introductory&&!report.introductions.some(e=>e.sequence===introductory.sequence&&e.step===introductory.step)){
      await page.waitForTimeout(5500);
      const text=await page.locator('.dialogue:visible').innerText();
      report.introductions.push({...introductory,text});
      if(introductory.sequence==='acte_ouverture'&&['3','4','6'].includes(introductory.step)||introductory.sequence==='camp_departure'&&introductory.step==='3')
        await capture(`intro-${introductory.sequence}-${introductory.step}`);
    }
    const hub=page.locator('.exploration-stop:visible:not([inert])');
    if(await hub.count()){
      live=await state();
      const nodeId=await hub.getAttribute('data-refuge-node');
      const stop=target==='first-refuge'&&nodeId==='lion-first-refuge'||target==='second-refuge'&&nodeId==='lion-second-refuge';
      report.refuge=live;await capture(`${nodeId}-earned`);
      assert.ok(report.battles.length&&report.battles.every(b=>b.pass));
      assert.ok(live.resolvedNodeIds.includes('lion-opening-ambush'));
      assert.equal(live.flags[`refugeSecured:${nodeId}`],true);assert.equal(live.run.temporaryLoot.gold,0);
      if(nodeId==='lion-second-refuge'){
        assert.ok(live.resolvedNodeIds.includes('lion-village-choice'));
        assert.ok(live.resolvedNodeIds.includes('lion-reserve-trail'));
        assert.ok(live.resolvedNodeIds.includes('lion-valmir-road'));
        const selected=live.run.traversalBranches.T1;
        assert.ok(['lion-second-trial-event','lion-second-trial-combat'].includes(selected));
        assert.ok(live.resolvedNodeIds.includes(selected));
        assert.ok(!live.resolvedNodeIds.includes(selected.endsWith('-event')?'lion-second-trial-combat':'lion-second-trial-event'));
        assert.equal(live.flags.missionSuccess,routePlan==='rescue');
        assert.equal(Boolean(live.flags.missionGreed),routePlan==='sacrifice');
        const valmirCombatId=live.run.graph.nodes.find(node=>node.id==='lion-valmir-road')?.contentId;
        assert.ok(['road_to_valmir','marsh_crossing'].includes(valmirCombatId));
        if(target==='second-refuge')for(const [id,combatId] of [['lion-valmir-road',valmirCombatId],
          ['lion-village-choice',routePlan==='rescue'?'village_defense':'village_raid']]){
          assert.ok(report.battles.some(b=>b.nodeId===id&&b.combatId===combatId&&b.pass&&b.outcome==='victory'),
            `Second refuge requires verified native ${combatId} victory at ${id}`);
        }
      }
      const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      assert.deepEqual(JSON.parse(saved),live,'Earned refuge agency precedes durable owner truth');
      await writeFile(resolve(output,`earned-${nodeId}-v6.json`),saved+'\n');
      if(nodeId==='lion-first-refuge')await writeFile(resolve(output,'earned-first-refuge-v6.json'),saved+'\n');
      if(target==='first-refuge'||await page.locator('.poi-map').count()===0 && await page.evaluate(()=>document.body.dataset.campaignSurface==='poi-map')){
        if(target==='first-refuge'&&!priorProof){
          assert.ok(live.resolvedNodeIds.includes('lion-refugees'),'Native optional revisit must resolve the authored refugees event');
          assert.ok(report.choices.some(c=>c.sequence==='refugee_trial'),'Native refugees dialogue/choice was not observed');
          assert.ok(live.resolvedNodeIds.includes(`lion-first-trial-${trialPlan}`));
          assert.ok(!live.resolvedNodeIds.includes(`lion-first-trial-${trialPlan==='event'?'combat':'event'}`));
          assert.equal(live.run.traversalBranches.T0,`lion-first-trial-${trialPlan}`);
          report.poi.optionalRevisit={resolved:true,dialogueObserved:true};
        }
        // Complete the refuge visit natively, reopen services, then resume its resolved map POI.
        await keyboardActivate('.exploration-stop [data-action="continue"]');
        await returnToPoiMap();
        let completed=await state();assert.ok(completed.resolvedNodeIds.includes(nodeId));
        if(nodeId==='lion-second-refuge'){
          const excluded=completed.run.traversalBranches.T1.endsWith('-event')?'lion-second-trial-combat':'lion-second-trial-event';
          assert.ok((await page.locator(`.poi-map [data-poi-id="${excluded}"]`).getAttribute('class')).includes('poi-marker--neutralized'));
          assert.equal(completed.run.checkpointNodeId,nodeId);
          report.poi??={native:true};report.poi.secondRefuge={resolved:true,checkpointExact:true,exclusiveAlternativeNeutralized:true,
            missionSuccess:completed.flags.missionSuccess,missionGreed:Boolean(completed.flags.missionGreed)};
          await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
          await capture('poi-second-refuge-resolved');
        }
        if(priorProof&&nodeId==='lion-first-refuge'){
          const branch=completed.run.traversalBranches.T0;
          assert.ok(completed.resolvedNodeIds.includes(branch));
          const shortcut=completed.run.bypassedRouteNodeIds?.includes('lion-refugees');
          const path=shortcut?[branch,'lion-nomad-crossroads',branch]
            :[branch,'lion-refugees','lion-nomad-crossroads','lion-opening-ambush','lion-audience',
              'lion-opening-ambush','lion-nomad-crossroads','lion-refugees',branch];
          report.poi??={native:true};
          report.poi.compatibilityBacktracking=await poiNoReplayPath(path,true);
          report.poi.compatibilityBacktracking.contractedBothDirections=Boolean(shortcut);
          await poiMove(nodeId,true);await hub.waitFor({state:'visible'});
          assertCanonicalMatch(await state(),completed,'Returning to reusable refuge changed canonical V6 truth');
          await keyboardActivate('.exploration-stop [data-action="continue"]');await returnToPoiMap();
          await verifyExpeditionSettlement();assert.equal(pendingExpeditionProof,undefined);
          completed=await state();
        }
        await keyboardActivate(`.poi-map [data-poi-id="${nodeId}"]`);
        await keyboardActivate('.poi-map [data-poi-action="move"]');await hub.waitFor({state:'visible'});
        assert.deepEqual(await state(),completed,'Refuge revisit repeated arrival, reward or changed resources');
        await keyboardActivate('.exploration-stop [data-action="continue"]');await returnToPoiMap();
        await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
        await page.locator('.poi-map:visible').waitFor({timeout:30000});
        report.resumed=await state();assert.deepEqual(report.resumed,completed,'Resolved refuge map reload changed exact V6 truth');
        await keyboardActivate(`.poi-map [data-poi-id="${nodeId}"]`);
        await keyboardActivate('.poi-map [data-poi-action="move"]');await hub.waitFor({state:'visible'});
        assert.deepEqual(await state(),completed,'Refuge services after reload changed V6 without an action');
        report.refuges.push({nodeId,entry:live,resumed:report.resumed,reusable:true,exactV6:true});
        await writeFile(resolve(output,`earned-${nodeId}-v6.json`),JSON.stringify(completed)+'\n');
        if(nodeId==='lion-first-refuge')await writeFile(resolve(output,'earned-first-refuge-v6.json'),JSON.stringify(completed)+'\n');
        await capture(`${nodeId}-poi-reusable-reloaded`);
        if(stop){assert.deepEqual(report.errors,[]);report.pass=true;break;}
      }else{
        await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
        await page.locator(`.exploration-stop[data-refuge-node="${nodeId}"]:visible:not([inert])`).waitFor({timeout:30000});
        report.resumed=await state();assert.deepEqual(report.resumed,live,'Earned refuge reload changed V6 truth');
        assert.equal(await page.locator('iframe.combat-frame').count(),0);await capture(`${nodeId}-earned-resumed`);
        report.refuges.push({nodeId,entry:live,resumed:report.resumed});
        if(stop){assert.deepEqual(report.errors,[]);report.pass=true;break;}
      }
      // A nonterminal POI refuge reaches the same native preparation as a historic arrival.
      if(nativeEquipment)await prepareNativeWeapon(nodeId);
      const servicesBefore=await state();
      const rest=page.locator('.exploration-stop [data-action="rest"]:not(:disabled)');
      const nativeRestCost=await rest.count()?Number((await rest.innerText()).match(/(\d+)\s*or/i)?.[1]):0;
      if(await rest.count()){
        await keyboardActivate('.exploration-stop [data-action="rest"]:not(:disabled)');
        await hub.waitFor({state:'visible'});await page.waitForTimeout(150);
        const rested=await state();assert.ok(rested.gold<servicesBefore.gold,'Native rest did not debit owner gold');
        assert.ok(rested.clan.members.every(u=>u.currentHealth>0),'Native rest left downed clan member');
        assert.deepEqual(rested.run.temporaryLoot,servicesBefore.run.temporaryLoot,'Native rest changed temporary loot');
        report.refuges.at(-1).rested=rested;await capture(`${nodeId}-native-rest`);
      }
      const sealRecovery=report.expedition.sealRecoveries?.at(-1);
      if(nodeId==='lion-second-refuge'&&sealRecovery?.phase==='to-refuge'){
        const rested=await state(),expected=structuredClone(servicesBefore);
        assert.ok(Number.isInteger(nativeRestCost)&&nativeRestCost>0&&nativeRestCost%15===0);
        expected.gold-=nativeRestCost;
        for(const [index,member] of expected.clan.members.entries())member.currentHealth=rested.clan.members[index].currentHealth;
        assert.deepEqual(rested,expected,'Native seal rest must change only paid gold and health');
        assert.equal(await rest.count(),0,'Paid native recovery did not restore the party');
        assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'))),rested);
        Object.assign(sealRecovery,{servicesBefore,rested,cost:nativeRestCost,phase:'return-to-origin',exactSavedOwner:true});
      }
      if(nodeId==='lion-first-refuge'&&target==='defeat-recovery'){
        await keyboardActivate('.exploration-stop [data-action="shop"]');
        const buy='.management [data-trade="buy"][data-item="potion"]';
        await page.locator(buy).waitFor({state:'visible'});
        const entry=await state(),prices=[];
        for(let purchase=0;purchase<4;purchase++){
          const before=await state(),price=Number.parseInt(await page.locator(buy).textContent(),10);
          assert.ok(Number.isInteger(price)&&price>0&&before.gold>=price,'Native potion preparation is not affordable');
          assert.equal(await page.locator(buy).isEnabled(),true);
          await keyboardActivate(buy);
          const bought=await state(),expected=structuredClone(before);
          expected.gold-=price;
          expected.inventory.consumables.potion=(expected.inventory.consumables.potion??0)+1;
          expected.shops.valmir.stock.potion-=1;
          assert.deepEqual(bought,expected,'Native supply purchase changed unrelated V6 truth');
          prices.push(price);
        }
        const prepared=await state();await capture(`${nodeId}-native-potion-stock`);
        await keyboardActivate('.management [data-action="close"]');await hub.waitFor({state:'visible'});
        const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')));
        assert.deepEqual(saved,prepared,'Native potion preparation was not saved before departure');
        await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
        if(await page.locator('.poi-map:visible').count())await poiMove(nodeId,true);
        await hub.waitFor({state:'visible'});
        const resumed=await state();assert.deepEqual(resumed,prepared,'Prepared first-refuge V6 truth changed on reload');
        report.refuges.at(-1).supplyPurchase={quantity:4,prices,goldBefore:entry.gold,goldAfter:prepared.gold,
          potionsBefore:entry.inventory.consumables.potion,potionsAfter:prepared.inventory.consumables.potion,
          stockBefore:entry.shops.valmir.stock.potion,stockAfter:prepared.shops.valmir.stock.potion,
          temporaryLootUnchanged:true,exactV6ReloadVerified:true};
        await capture(`${nodeId}-native-potion-stock-resumed`);
      }
      await keyboardActivate('.exploration-stop [data-action="clan"]');
      await page.locator('.management [data-action="close"]').waitFor({state:'visible'});
      await keyboardActivate('.management [data-action="close"]');await hub.waitFor({state:'visible'});
      await keyboardActivate('.exploration-stop [data-action="continue"]');continue;
    }
    live=await state();
    if(['ending','terminal'].includes(target)&&live.endingId&&await page.locator('.journey-overlay--terminal:visible').count()){
      report.ending=live;await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
      await capture(`ending-${live.endingId}`);
      assert.equal(live.run.status,'completed');assert.ok(live.resolvedNodeIds.includes('lion-final-judgement'));
      assert.equal(live.run.temporaryLoot.gold,0);
      assert.equal(live.endingId,finalePlan==='serpent'?'lion-seal-serpent-truth':'lion-seal-trial-truth');
      const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      assert.deepEqual(JSON.parse(saved),live);await writeFile(resolve(output,'earned-ending-v6.json'),saved+'\n');
      await page.reload({waitUntil:'networkidle'});await click('.title-screen [data-action="continue"]');
      await page.waitForFunction(id=>window.__demoQaApp?.state.endingId===id,live.endingId);
      await page.locator('.journey-overlay--terminal:visible').waitFor({timeout:30000});
      assert.equal(await page.locator('.dialogue:visible,iframe.combat-frame,.traversal-road:visible').count(),0);
      report.resumed=await state();assert.deepEqual(report.resumed,live);
      await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
      await capture(`ending-${live.endingId}-resumed`);
      const menu=page.locator('.journey-overlay--terminal [data-journey-continue]');
      assert.equal((await menu.textContent()).trim(),'Retour au menu');
      const menuSave=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));
      await keyboardActivate('.journey-overlay--terminal [data-journey-continue]');
      await page.locator('.title-screen:visible').waitFor({timeout:30000});
      assert.equal(await page.locator('.poi-map:visible,.traversal-road:visible,.journey-overlay:visible,.dialogue:visible,iframe.combat-frame').count(),0);
      const focused=await page.locator('.title-screen [data-action="continue"]:not(:disabled)').evaluate(e=>e===document.activeElement);
      assert.equal(focused,true,'Terminal return must focus native title Continue');
      assert.deepEqual(await state(),live,'Terminal return changed ending owner');
      assert.equal(await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')),menuSave,'Terminal return changed save bytes');
      report.terminalMenu={nativeKeyboard:!touchInput,nativeTouch:touchInput,titleVisible:true,continueFocused:true,ownerUnchanged:true,savedBytesUnchanged:true};
      await capture(`ending-${live.endingId}-native-menu`);
      assert.deepEqual(report.errors,[]);report.pass=true;break;
    }
    if(await page.locator('iframe.combat-frame').count()){await battle();if(report.defeatRecovery?.pass||report.pass)break;continue;}
    if(await page.locator('.poi-map:visible').count()){
      await inspectPoiAtlas();
      live=await state();
      if(target==='expedition-checkpoint'&&live.currentNodeId===checkpointPoiId&&live.resolvedNodeIds.includes(checkpointPoiId)){
        assert.equal(live.run.poiExpedition.pendingStep,undefined);assert.equal(live.run.poiExpedition.encounter,undefined);
        const earnedHere=report.battles.slice(report.inheritedBattleCount??0).some(b=>b.nodeId===checkpointPoiId&&b.pass&&b.outcome==='victory')
          ||report.expedition.chests.some(chest=>chest.id===checkpointPoiId);
        assert.ok(earnedHere,'An intermediate checkpoint requires a newly completed native optional activity');
        const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));assert.deepEqual(JSON.parse(saved),live);
        await capture('expedition-checkpoint-earned');
        await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
        await page.locator('.poi-map:visible').waitFor();report.resumed=await state();assert.deepEqual(report.resumed,live);
        await writeFile(resolve(output,'earned-expedition-checkpoint-v6.json'),saved+'\n');
        report.expeditionCheckpoint={id:checkpointPoiId,pass:true,native:true,exactReload:true};
        await capture('expedition-checkpoint-reloaded');assert.deepEqual(report.errors,[]);report.pass=true;break;
      }
      report.poi??={native:true};
      const needsValmirPreparation=(['second-refuge','valmir'].includes(target)||explorationPlan!=='direct')
        &&live.currentNodeId==='lion-valmir-road'&&live.resolvedNodeIds.includes(live.currentNodeId)&&!report.poi.valmirRefugePreparation;
      if(!needsValmirPreparation&&await explorePoiStep(live))continue;
      if(target==='second-trial'&&live.currentNodeId==='lion-second-trial-combat'&&live.resolvedNodeIds.includes(live.currentNodeId)){
        assert.ok(report.battles.slice(report.inheritedBattleCount??0).some(b=>b.nodeId===live.currentNodeId&&b.pass&&b.outcome==='victory'));
        assert.ok(live.resolvedNodeIds.includes('lion-first-refuge'));assert.equal(live.flags['refugeSecured:lion-first-refuge'],true);
        assert.equal(live.run.checkpointNodeId,'lion-first-refuge');assert.ok(live.run.temporaryLoot.gold>0);
        assert.equal(live.run.traversalBranches.T1,live.currentNodeId);assert.ok(!live.resolvedNodeIds.includes('lion-second-trial-event'));
        assert.ok((await page.locator('.poi-map [data-poi-id="lion-second-trial-event"]').getAttribute('class')).includes('poi-marker--neutralized'));
        await capture('poi-second-trial-resolved-neutralized');
        const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6'));assert.deepEqual(JSON.parse(saved),live);
        await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
        await page.locator('.poi-map:visible').waitFor();report.resumed=await state();assert.deepEqual(report.resumed,live);
        await writeFile(resolve(output,'earned-second-trial-v6.json'),saved+'\n');await capture('poi-second-trial-native-reloaded');
        assert.deepEqual(report.errors,[]);report.pass=true;break;
      }
      if(process.env.DEMO_QA_GAME_MOTION==='1'&&!live.settings.reducedGraphics){
        const before=await state();await keyboardActivate('.poi-map [data-poi-action="motion"]');
        const changed=await state(),expected=structuredClone(before);expected.settings.reducedGraphics=true;
        assert.deepEqual(changed,expected,'Native motion preference changed unrelated V6 truth');
        report.motionEvidence.gameRequested=true;report.motionEvidence.nativeGameControl=true;continue;
      }
      if((['second-refuge','valmir'].includes(target)||explorationPlan!=='direct')&&live.currentNodeId==='lion-valmir-road'
        &&live.resolvedNodeIds.includes(live.currentNodeId)&&!report.poi.valmirRefugePreparation){
        await preparePoiCompanyAfterValmir();
        if(target==='valmir'){
          const saved=await page.evaluate(()=>localStorage.getItem('rpg-threejs:autosave:v6')),before=await state();
          assert.ok(before.run.temporaryLoot.gold>0);assert.equal(before.run.checkpointNodeId,'lion-first-refuge');
          assert.deepEqual(JSON.parse(saved),before);
          await page.reload({waitUntil:'networkidle'});await keyboardActivate('.title-screen [data-action="continue"]');
          await page.locator('.poi-map:visible').waitFor();report.resumed=await state();assert.deepEqual(report.resumed,before);
          await writeFile(resolve(output,'earned-valmir-v6.json'),saved+'\n');await capture('poi-valmir-positive-loot-reloaded');
          assert.deepEqual(report.errors,[]);report.pass=true;break;
        }continue;
      }
      if(target==='second-refuge'&&live.currentNodeId==='lion-second-trial-combat'
        &&live.resolvedNodeIds.includes(live.currentNodeId)&&!report.poi.trialRefugePreparation){
        await preparePoiCompanyAfterValmir('lion-second-trial-combat');continue;
      }
      if(live.currentNodeId==='lion-final-trial-combat'&&live.resolvedNodeIds.includes(live.currentNodeId)&&!report.poi.finalCombatAlternative){
        const excluded='lion-final-trial-event';
        assert.ok(!live.resolvedNodeIds.includes(excluded));
        assert.ok((await page.locator(`.poi-map [data-poi-id="${excluded}"]`).getAttribute('class')).includes('poi-marker--neutralized'));
        assert.ok(report.battles.slice(report.inheritedBattleCount??0).some(b=>b.nodeId===live.currentNodeId&&b.pass&&b.outcome==='victory'));
        report.poi.finalCombatAlternative={selected:live.currentNodeId,excluded,temporaryLoot:structuredClone(live.run.temporaryLoot),checkpoint:live.run.checkpointNodeId};
        await capture('poi-final-combat-resolved-neutralized');
      }
      if(live.currentNodeId==='lion-reserve-trail'&&!report.poi.secondSection){
        await page.waitForFunction(()=>!document.body.classList.contains('scene-transition--locked'));
        await capture('poi-second-section-reserves');report.poi.secondSection={currentNodeId:live.currentNodeId,resolved:true};
        assert.ok(live.resolvedNodeIds.includes(live.currentNodeId));
      }
      if(live.currentNodeId==='lion-nomad-crossroads'&&!report.poi.backtracking){
        await capture('poi-after-cedric');
        report.poi.backtracking=await poiNoReplayPath(['lion-opening-ambush','lion-audience','lion-opening-ambush','lion-nomad-crossroads']);
        const localRoutes=['lion-refugees','lion-first-trial-event','lion-first-trial-combat'];
        for(const id of localRoutes)assert.equal(await page.locator(`.poi-map [data-poi-id="${id}"]`).getAttribute('data-poi-reachable'),'true',
          'All three V2 local routes must be reachable after the mandatory crossroads');
        report.poi.localRoutes=localRoutes;await capture('poi-v2-three-local-routes');
        if(explorationPlan!=='direct')continue;
        const before=await state();await poiMove(`lion-first-trial-${trialPlan}`);
        const after=await state();assert.equal(after.reputation,before.reputation-2);
        assert.equal(after.flags.ignoredRefugees,true);assert.ok(!after.resolvedNodeIds.includes('lion-refugees'));
        assert.ok(!after.resolvedNodeIds.includes(`lion-first-trial-${trialPlan}`),'Moving cannot resolve the trial');
        report.poi.optionalBypass={before,after,method:'NATIVE_DIRECT_LOCAL_ROUTE'};continue;
      }
      if(live.currentNodeId===`lion-first-trial-${trialPlan}`&&live.resolvedNodeIds.includes(live.currentNodeId)&&!report.poi.optionalRevisitRequested){
        const excluded=`lion-first-trial-${trialPlan==='event'?'combat':'event'}`;
        assert.equal(await page.locator(`[data-poi-id="${excluded}"]`).getAttribute('class').then(c=>c.includes('poi-marker--neutralized')),true);
        assert.ok(!live.resolvedNodeIds.includes(excluded));
        report.poi.neutralization={selected:live.currentNodeId,excluded,notResolved:true};
        await capture('poi-exclusive-neutralization');report.poi.optionalRevisitRequested=true;
        await poiMove('lion-refugees');continue;
      }
      const mapState=await state();
      const current=mapState.run.graph.nodes.find(n=>n.id===mapState.currentNodeId);
      const choices=current.links.filter(id=>!/-trial-(event|combat)$/.test(id)||id.endsWith(`-${trialPlan}`));
      let next=live.currentNodeId==='lion-nomad-crossroads'&&report.poi.optionalBypass&&!report.poi.optionalRevisitRequested?`lion-first-trial-${trialPlan}`:null;
      if(!next)for(const id of choices)if(await page.locator(`.poi-map [data-poi-id="${id}"][data-poi-reachable="true"]`).count()){next=id;break;}
      if(!next&&live.currentNodeId==='lion-nomad-crossroads'&&report.poi.optionalBypass)next=`lion-first-trial-${trialPlan}`;
      if(next){await poiMove(next);continue;}
      assert.ok(!live.currentNodeId.startsWith('lion-poi-'),'Native pilot exhausted its optional route without a canonical exit');
    }
    if(await page.locator('.prologue-view').count()){await page.keyboard.press('Enter');}
    else if(await page.locator('.cinematic-overlay__skip:visible').count()){await click('.cinematic-overlay__skip:visible');}
    else if(await page.locator('.dialogue-choice:visible:not(:disabled)').count()){await choose();}
    else if(await page.locator('.dialogue:visible').count()){await advanceDialogue();}
    else if(await page.locator(genericJourneyContinue).count()){await click(genericJourneyContinue);}
    else if(await page.locator('[data-journey-choice]:visible:not(:disabled)').count()){await click('[data-journey-choice]:visible:not(:disabled)');}
    await page.waitForTimeout(100);
  }
  assert.equal(report.pass,true,`Did not reach earned ${target} before the bounded deadline`);
  const final=await state();
  report.expedition.economy={gold:final.gold,temporaryLoot:final.run.temporaryLoot,reputation:final.reputation,
    inventory:final.inventory,heroes:final.clan.members.map(unit=>({id:unit.definitionId,hp:unit.currentHealth})),checkpoint:final.run.checkpointNodeId};
  if(explorationPlan==='complete'&&!['defeat-recovery','expedition-checkpoint'].includes(target)){
    const upTo=target==='first-refuge'?0:['second-refuge','valmir','second-trial'].includes(target)?1:2;
    for(const poi of lotE.fixedPoiCandidates.filter(poi=>poi.region<=upTo))assert.ok(final.resolvedNodeIds.includes(poi.id),`Complete native exploration missed ${poi.id}`);
    for(const elite of lotE.mobileEliteActors.filter(elite=>elite.region<=upTo))assert.equal(final.run.poiExpedition.elites[elite.id].defeated,true,`Complete native exploration missed elite ${elite.id}`);
  }
  if(touchInput){assert.ok(report.trustedTouch.length>0,'No trusted native touch observed');assert.equal(await page.evaluate(()=>navigator.maxTouchPoints>0),true);}
  if(process.env.DEMO_QA_GAME_MOTION==='1')assert.equal((await state()).settings.reducedGraphics,true,'Requested game motion reduction was never activated');
  report.salvationVerified=report.battles.slice(report.inheritedBattleCount??0).some(b=>b.actions.some(a=>a.verifiedHealing));
  if(process.env.DEMO_QA_VERIFY_SALVATION==='1'){
    const newBattles=report.battles.slice(report.inheritedBattleCount??0);
    report.salvationExactly2ApVerified=newBattles.some(b=>b.actions.some(a=>a.verifiedExactly2Ap));
    assert.equal(report.salvationExactly2ApVerified,true,'No new native exactly-two-AP Salvation cast occurred');
    report.nativeInitialEquipmentHeroes=[...new Set(newBattles.flatMap(b=>(b.initialEquipmentSkills??[]).map(u=>u.definitionId)))].sort();
    if(target==='ending')assert.deepEqual(report.nativeInitialEquipmentHeroes,['archer','dark_mage','lancer','rogue','warrior','white_mage'],'Six native initial-equipment candidates were not observed');
    report.nativeInitialEquipmentCasts=[...new Set(newBattles.flatMap(b=>b.actions
      .map(a=>a.verifiedInitialEquipmentCast?.definitionId).filter(Boolean)))].sort();
    if(target==='ending')assert.deepEqual(report.nativeInitialEquipmentCasts,['archer','dark_mage','lancer','rogue','warrior','white_mage'],'Six fresh native initial-equipment casts were not observed');
  }
}catch(error){report.pass=false;report.failure=error.stack;console.error(error.stack);
  await writeFile(resolve(output,'failure.json'),JSON.stringify({failure:report.failure,at:new Date().toISOString()},null,2)+'\n');
  await capture('failure-state',10000).catch(()=>{});
  report.lastState=await state().catch(()=>null);process.exitCode=1;
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
