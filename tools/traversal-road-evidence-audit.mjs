/** Read-only audit of terminal native road receipts. Produces review material, never acceptance. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {ignoredOutput,provenance,sameExecution} from './qa/qa-job.mjs';

const arg=(name)=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const jobs=arg('jobs')?.split(',');assert.ok(jobs?.length,'Explicit job selection required');
assert.equal(new Set(jobs).size,jobs.length,'Duplicate job selection');
const inventoryCount=Number(arg('inventory-count'));assert.ok(Number.isInteger(inventoryCount)&&inventoryCount>0,'Explicit physical inventory count required');
const proofHash=arg('proof-sha256');assert.match(proofHash??'',/^[a-f0-9]{64}$/,'Explicit frozen proof identity required');
const output=ignoredOutput(process.cwd(),arg('output'));
assert.ok(!existsSync(output),'Never overwrite an existing audit');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const state=read('docs/autonomy/AUTONOMOUS_WORK_STATE.json');
const publicRelative=rel=>{
  assert.ok(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../'));
  assert.ok(/^(?:src|tools|dist|public|docs\/reports|tmp)\//.test(rel.replaceAll('\\','/')),'Input outside public evidence directories');
  assert.ok(!/(?:^|[/\\])(?:\.env[^/\\]*|auth\.json|credentials[^/\\]*|[^/\\]*\.pem)$/i.test(rel),'Secret path refused');
};
const safePublic=p=>{
  const absolute=resolve(p),rel=relative(process.cwd(),absolute);
  publicRelative(rel);
  const physical=relative(realpathSync(process.cwd()),realpathSync(absolute));
  publicRelative(physical);
  return absolute;
};
const proofPath=safePublic(arg('proof'));assert.equal(hash(proofPath),proofHash,'Frozen proof identity differs');
const frozen=read(proofPath).frozenInputs;
assert.ok(frozen,'Frozen physical inventory required');
let frozenCount=0;const frozenPaths=new Set();
for(const entries of Object.values(frozen)){
  assert.ok(Array.isArray(entries)&&entries.length>0,'Malformed inventory group');
  for(const e of entries){
    assert.ok(e&&typeof e.path==='string');assert.match(e.sha256??'',/^[a-f0-9]{64}$/,'Malformed inventory identity');
    const absolute=safePublic(e.path);assert.ok(!frozenPaths.has(absolute.toLowerCase()),'Duplicate inventory path');frozenPaths.add(absolute.toLowerCase());
    assert.equal(hash(absolute),e.sha256,`Physical input drift: ${e.path}`);frozenCount++;
  }
}
assert.equal(frozenCount,inventoryCount,'Physical inventory count differs');
const report={status:'REVIEW_REQUIRED',generatedAt:new Date().toISOString(),frozenCount,
  auditDriver:{path:'tools/traversal-road-evidence-audit.mjs',sha256:hash('tools/traversal-road-evidence-audit.mjs')},
  receiptHelper:{path:'tools/qa/qa-job.mjs',sha256:hash('tools/qa/qa-job.mjs')},
  frozenProof:{path:arg('proof'),sha256:proofHash,inventoryCount},jobs:[],limitations:[
  'Fixture origins/bootstrap/settings and prior combat outcomes; no earned campaign, save/replay/defeat/refuge or tactical acceptance.',
  'Contact centers are endpoint-linear interpolation proxies across native authored-event brackets; no exact subframe/global frame-budget claim.',
  'Arrival-road driver stops at ARRIVING; no complete caravan exit, owner callback or disposal proof.',
  'Rock asset family and perceptual depth/readability need independent source and selected visual review.',
  'Cover telemetry is scene-local; outer SceneTransition coverage is not sampled by these drivers.',
  'First pouch may enter under cover. Optional capture labels and vacuous depth predicates are not acceptance.'
]};
for(const id of jobs){
  const planned=state.live.qaJobs.find(j=>j.jobId===id);assert.ok(planned,`Unknown job ${id}`);
  const jobOutput=ignoredOutput(process.cwd(),planned.output);
  assert.equal(resolve(planned.receiptPath),resolve(jobOutput,'qa-job.json'),'Receipt outside planned output');
  assert.equal(relative(realpathSync(jobOutput),realpathSync(planned.receiptPath)),'qa-job.json','Receipt physical path differs');
  const receipt=read(safePublic(planned.receiptPath));
  assert.equal(receipt.status,'SUCCEEDED');assert.equal(receipt.jobId,id);assert.equal(receipt.runId,planned.runId);
  assert.equal(receipt.output,planned.output);assert.equal(receipt.port,planned.port);
  assert.ok(isDeepStrictEqual(receipt.parameters,planned.parameters));
  assert.ok(isDeepStrictEqual(receipt.requiredAssertions,planned.requiredAssertions));
  assert.ok(isDeepStrictEqual(receipt.command,planned.command));
  assert.ok(receipt.provenanceStable&&sameExecution(planned.provenance,receipt.provenance));
  assert.ok(['tools/traversal-road-elements-production-qa.mjs','tools/traversal-road-more-routes-production-qa.mjs'].includes(receipt.provenance.driver.path),'Unsupported native road driver');
  assert.ok(sameExecution(receipt.provenance,provenance(process.cwd(),receipt.provenance.driver.path,receipt.parameters)),'Current execution differs');
  assert.equal(resolve(receipt.resultPath),resolve(jobOutput,'results.json'),'Result outside planned output');
  assert.equal(relative(realpathSync(jobOutput),realpathSync(receipt.resultPath)),'results.json','Result physical path differs');
  assert.equal(hash(safePublic(receipt.resultPath)),receipt.resultSha256);
  const result=read(safePublic(receipt.resultPath));assert.equal(result.pass,true);assert.equal(result.errors.length,0);
  assert.ok(isDeepStrictEqual(result.parameters,receipt.parameters));
  assert.ok(result.runs.length>0);
  for(const id of receipt.requiredAssertions)assert.ok(result.assertions.some(a=>a.id===id&&a.pass===true),`Missing final assertion ${id}`);
  const key=r=>[r.leg,r.dimensions,r.motion,r.road,r.path].join('/');
  const expected=[];
  for(const leg of receipt.parameters.legs)for(const dimensions of receipt.parameters.viewports)for(const road of receipt.parameters.roads)
    for(const path of road==='early-reset'?receipt.parameters.earlyPaths:receipt.parameters.paths)expected.push(key({leg,dimensions,motion:receipt.parameters.motion,road,path}));
  assert.deepEqual(result.runs.map(key).sort(),expected.sort(),'Requested case matrix differs');
  const entry={jobId:id,receiptPath:planned.receiptPath,receiptSha256:hash(planned.receiptPath),resultPath:receipt.resultPath,resultSha256:receipt.resultSha256,parameters:receipt.parameters,provenance:receipt.provenance,cases:[]};
  for(const run of result.runs){
    assert.ok(run.summary&&run.samples.length>100,'Incomplete case');
    const driving=run.samples.filter(s=>s.view==='route'&&s.cover<.01&&s.progress>.01);
    const marks=driving[0].marks.map(({id})=>id),measurements=[];
    for(const markId of marks){
      const frames=run.samples.filter(s=>s.view==='route').map(s=>({s,m:s.marks.find(m=>m.id===markId)}));
      assert.ok(frames.every(f=>f.m),'Mark identity lost');
      const index=frames.findIndex(f=>f.s.progress>=f.m.progress),after=frames[index],before=frames[index-1];
      assert.ok(before&&after&&!after.m.hidden);
      const contact=after.m.progress*after.s.duration,gap=after.s.elapsed-before.s.elapsed;
      assert.equal(before.s.width,after.s.width,'No contact interpolation across resize');
      assert.ok(before.s.elapsed<contact&&after.s.elapsed>=contact&&gap>0&&gap<40);
      const x=before.m.x+(after.m.x-before.m.x)*(contact-before.s.elapsed)/gap;
      const error=Math.abs(x-after.s.width*.25);assert.ok(error<3);
      const visible=frames.filter(f=>!f.m.hidden),first=visible[0];assert.ok(first);
      const depth=visible.filter(f=>Math.abs(f.m.renderedGround-f.s.vehicle.renderedGround)>10);
      const last=visible.at(-1),exited=frames.some(f=>f.m.predictedRight<0&&f.s.cover<.01);
      measurements.push({id:markId,family:after.m.family,contactBracketMs:gap,interpolatedContactErrorPx:error,
        visibleFrames:visible.length,nearDepthFrames:depth.filter(f=>f.m.renderedGround>f.s.vehicle.renderedGround).length,
        farDepthFrames:depth.filter(f=>f.m.renderedGround<f.s.vehicle.renderedGround).length,
        firstVisibleLocalCover:first.s.cover,firstVisibleLeft:first.m.left,firstVisibleViewport:first.s.width,
        lastVisibleRight:last.m.right,fullExitWithLocalCoverClear:exited});
    }
    entry.cases.push({leg:run.leg,dimensions:run.dimensions,motion:run.motion,road:run.road,path:run.path,
      priorCombatFixtures:run.priorCombatFixtures,summary:run.summary,measurements,
      captures:run.captures.map(file=>{
        assert.ok(typeof file==='string'&&/^[a-zA-Z0-9_-]+\.png$/.test(file),'Capture must be a local PNG basename');
        const p=safePublic(`${planned.output}/${file}`),physical=relative(realpathSync(jobOutput),realpathSync(p));
        assert.ok(physical!==''&&!isAbsolute(physical)&&physical!=='..'&&!physical.startsWith('..\\')&&!physical.startsWith('../'),'Capture outside planned output');
        return {file,path:`${planned.output}/${file}`,sha256:hash(p)};
      })});
  }
  report.jobs.push(entry);
}
mkdirSync(output,{recursive:true});writeFileSync(`${output}/audit.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,frozenCount,jobs:report.jobs.length,cases:report.jobs.reduce((n,j)=>n+j.cases.length,0),output}));
