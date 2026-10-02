import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { beginJob, demoJobOptions, ignoredOutput, registerJob, sameExecution, syncJobs } from './qa-job.mjs';

const syncAsOwner=job=>{const previous=process.env.AUTONOMY_QA_WORKER;delete process.env.AUTONOMY_QA_WORKER;try{return syncJobs(job);}finally{if(previous!==undefined)process.env.AUTONOMY_QA_WORKER=previous;}};

function fixture(t) {
  const root=mkdtempSync(resolve(tmpdir(),'rpg-qa-job-'));
  const workerFlag=process.env.AUTONOMY_QA_WORKER;
  t.after(()=>{if(workerFlag===undefined)delete process.env.AUTONOMY_QA_WORKER;else process.env.AUTONOMY_QA_WORKER=workerFlag;assert.ok(root.startsWith(resolve(tmpdir(),'rpg-qa-job-')));rmSync(root,{recursive:true,force:true});});
  for(const d of ['.git','tools','src','dist/assets','docs/autonomy','tmp'])mkdirSync(resolve(root,d),{recursive:true});
  writeFileSync(resolve(root,'src/fixture.ts'),'// fixture source\n');
  writeFileSync(resolve(root,'tools/driver.mjs'),'// fixture driver\n');
  writeFileSync(resolve(root,'dist/assets/game.js'),'// fixture build\n');
  writeFileSync(resolve(root,'.git/codex-autonomy.lock'),JSON.stringify({runId:'owner'}));
  writeFileSync(resolve(root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json'),JSON.stringify({activeTask:'DEMO',unknownField:'preserved',live:{}}));
  writeFileSync(resolve(root,'docs/autonomy/AUTONOMOUS_WORK_STATE.md'),'# State\nTask DEMO\n');
  execFileSync('git',['init','--initial-branch=dev',root],{stdio:'pipe'});
  execFileSync('git',['-C',root,'add','--','src/fixture.ts','tools/driver.mjs'],{stdio:'pipe'});
  execFileSync('git',['-C',root,'-c','user.name=QA Fixture','-c','user.email=qa@example.invalid','-c','commit.gpgsign=false','commit','-m','Fixture source'],{stdio:'pipe'});
  return {root,runId:'owner',jobId:'job1',output:'tmp/job1',driver:'tools/driver.mjs',port:5258,parameters:{target:'defeat-recovery'},requiredAssertions:['exact-v6','visible-departure']};
}
function result(job,pass=true) {const report={pass,errors:[],assertions:['exact-v6','visible-departure']};writeFileSync(resolve(job.root,job.output,'results.json'),JSON.stringify(report));return report;}

test('register requires owned lock and leaves output available to the worker',t=>{
  const job=fixture(t);assert.throws(()=>registerJob({...job,runId:'other'}),/lock holder/);
  registerJob(job);assert.throws(()=>registerJob(job),/already registered/);
  const s=JSON.parse(readFileSync(resolve(job.root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json')));
  assert.equal(s.activeTask,'DEMO');assert.equal(s.unknownField,'preserved');assert.equal(s.live.qaJobs[0].status,'PLANNED');
  assert.match(readFileSync(resolve(job.root,'docs/autonomy/AUTONOMOUS_WORK_STATE.md'),'utf8'),/job1: PLANNED/);
});
test('worker receipt survives independently and sync does not accept evidence automatically',t=>{
  const job=fixture(t);registerJob(job);const worker=beginJob(job),report=result(job);assert.equal(worker.finish(report).status,'SUCCEEDED');
  assert.equal(JSON.parse(readFileSync(resolve(job.root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json'))).live.qaJobs[0].status,'PLANNED','Worker must not write owner state');
  assert.throws(()=>syncJobs(job),/worker cannot mutate/);
  const jobs=syncAsOwner(job);assert.equal(jobs[0].status,'SUCCEEDED');assert.equal(jobs[0].acceptance,'NOT_ACCEPTED');assert.equal(jobs[0].provenanceMatches,true);assert.equal(jobs[0].eligibleForReview,true);assert.match(jobs[0].resultSha256,/^[0-9a-f]{64}$/);
});
test('receipt preserves early worker failure after the parent stops waiting',t=>{
  const job=fixture(t);registerJob(job);
  const module=pathToFileURL(resolve('tools/qa/qa-job.mjs')).href;
  const script=`import {beginJob} from ${JSON.stringify(module)};beginJob(${JSON.stringify(job)});process.exit(17);`;
  assert.throws(()=>execFileSync(process.execPath,['--input-type=module','-e',script],{stdio:'pipe'}),e=>e.status===17);
  const receipt=JSON.parse(readFileSync(resolve(job.root,job.output,'qa-job.json')));assert.equal(receipt.status,'FAILED');assert.equal(receipt.exitCode,17);
});
test('sync rejects reuse after result tampering or assertions changing',t=>{
  const job=fixture(t);registerJob(job);const worker=beginJob(job);worker.finish(result(job));
  writeFileSync(resolve(job.root,job.output,'results.json'),'{}');assert.equal(syncAsOwner(job)[0].eligibleForReview,false);
  writeFileSync(resolve(job.root,'tools/driver.mjs'),'// new assertions\n');assert.equal(syncAsOwner(job)[0].matchesCurrentExecution,false);
});
test('demo registration and worker share canonical public parameters',()=>{
  const options=demoJobOptions({DEMO_QA_TARGET:'defeat-recovery',DEMO_QA_OS_MOTION:'1',DEMO_QA_VIEWPORT:'390x844'});
  assert.equal(options.parameters.osReducedMotion,true);assert.deepEqual(options.parameters.viewport,[390,844]);assert.ok(options.requiredAssertions.includes('EXACT_V6_CHECKPOINT_RECOVERY'));
});
test('bounded campaign timeout is recorded and invalid budgets are rejected',()=>{
  assert.equal(demoJobOptions({}).parameters.timeoutMinutes,25);
  assert.equal(demoJobOptions({DEMO_QA_TIMEOUT_MINUTES:'35'}).parameters.timeoutMinutes,35);
  for(const value of ['0','46','Infinity','3.5','bad'])assert.throws(()=>demoJobOptions({DEMO_QA_TIMEOUT_MINUTES:value}),/timeout/);
});
test('failed proof and changed build cannot become successful receipts',t=>{
  // A failure remains a failure after JSON normalization of optional observations.
  const job=fixture(t);registerJob(job);const worker=beginJob(job);writeFileSync(resolve(job.root,'dist/assets/game.js'),'// changed build\n');
  assert.equal(worker.finish(result(job)).status,'FAILED');assert.equal(syncAsOwner(job)[0].provenanceStable,false);
  assert.equal(JSON.parse(readFileSync(resolve(job.root,job.output,'results.json'))).pass,false);
});
test('receipt compares JSON values when optional observations are undefined',t=>{
  const job=fixture(t);registerJob(job);const worker=beginJob(job);
  const report={pass:true,errors:[],geometry:[{width:390,sequence:undefined,step:undefined}]};
  writeFileSync(resolve(job.root,job.output,'results.json'),JSON.stringify(report));
  assert.equal(worker.finish(report).status,'SUCCEEDED');
  assert.equal(syncAsOwner(job)[0].eligibleForReview,true);
});
test('parameter drift, source drift and output overwrite are rejected',t=>{
  const job=fixture(t);registerJob(job);assert.throws(()=>beginJob({...job,parameters:{target:'ending'}}),/parameters changed/);
  writeFileSync(resolve(job.root,'tools/driver.mjs'),'// changed assertions\n');assert.throws(()=>beginJob(job),/changed after registration/);
});
test('only ignored output children are allowed',t=>{
  const job=fixture(t);for(const output of ['docs/reports/proof','tmp','../outside'])assert.throws(()=>ignoredOutput(job.root,output),/ignored tmp/);
});
test('in-repository symlinks cannot redirect QA into tracked evidence',t=>{
  const job=fixture(t);symlinkSync(resolve(job.root,'docs'),resolve(job.root,'tmp/redirect'),'junction');
  assert.throws(()=>ignoredOutput(job.root,'tmp/redirect/historical'),/symlink escapes/);
});
test('pass with a failed assertion is not a successful receipt',t=>{
  const job=fixture(t);registerJob(job);const worker=beginJob(job),report={...result(job),failure:'An assertion failed'};
  writeFileSync(resolve(job.root,job.output,'results.json'),JSON.stringify(report));assert.equal(worker.finish(report).status,'FAILED');
});
test('unknown Git identity is refused rather than treated as matching provenance',t=>{
  const job=fixture(t);writeFileSync(resolve(job.root,'.git/HEAD'),'ref: refs/heads/missing\n');
  assert.throws(()=>registerJob(job),/Git provenance unavailable/);assert.equal(sameExecution({gitHead:null},{gitHead:null}),false);
});
test('save/proof hashes and registered requirements remain bound to the receipt',t=>{
  const job=fixture(t);writeFileSync(resolve(job.root,'tmp/save.json'),'{}');writeFileSync(resolve(job.root,'tmp/proof.json'),'{}');
  job.parameters={...job.parameters,earnedSavePath:'tmp/save.json',priorProofPath:'tmp/proof.json'};
  registerJob(job);const worker=beginJob(job);worker.finish(result(job));
  writeFileSync(resolve(job.root,'tmp/save.json'),'{"changed":true}');assert.equal(syncAsOwner(job)[0].matchesCurrentExecution,false);
  const file=resolve(job.root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json'),state=JSON.parse(readFileSync(file));state.live.qaJobs[0].requiredAssertions=['WEAKER'];writeFileSync(file,JSON.stringify(state));
  assert.equal(syncAsOwner(job)[0].requestMatches,false);
});
test('a planned worker cannot start after takeover or overwrite legacy output',t=>{
  const job=fixture(t);registerJob(job);writeFileSync(resolve(job.root,'.git/codex-autonomy.lock'),JSON.stringify({runId:'new-owner'}));
  assert.throws(()=>beginJob(job),/lock holder/);
  mkdirSync(resolve(job.root,job.output));writeFileSync(resolve(job.root,job.output,'results.json'),'historical');
  assert.throws(()=>beginJob({...job,runId:null}),/Never overwrite/);assert.equal(readFileSync(resolve(job.root,job.output,'results.json'),'utf8'),'historical');
});
test('detached QA worker finishes its receipt after the launching parent exits',async t=>{
  const job=fixture(t);registerJob(job);
  const module=pathToFileURL(resolve('tools/qa/qa-job.mjs')).href;
  const child=`import {beginJob} from ${JSON.stringify(module)};import {writeFileSync} from 'node:fs';const job=${JSON.stringify(job)};const w=beginJob(job);setTimeout(()=>{const r={pass:true,errors:[]};writeFileSync(${JSON.stringify(resolve(job.root,job.output,'results.json'))},JSON.stringify(r));w.finish(r);},400);`;
  const parent=`import {spawn} from 'node:child_process';import {existsSync} from 'node:fs';const p=spawn(process.execPath,['--input-type=module','-e',${JSON.stringify(child)}],{detached:true,windowsHide:true,stdio:'ignore'});p.unref();const deadline=Date.now()+3000;while(!existsSync(${JSON.stringify(resolve(job.root,job.output,'qa-job.json'))})){if(Date.now()>deadline)process.exit(18);await new Promise(r=>setTimeout(r,10));}process.exit(17);`;
  assert.throws(()=>execFileSync(process.execPath,['--input-type=module','-e',parent],{stdio:'pipe',timeout:5000}),e=>e.status===17);
  const file=resolve(job.root,job.output,'qa-job.json'),deadline=Date.now()+3000;
  while(JSON.parse(readFileSync(file)).status==='RUNNING'){assert.ok(Date.now()<deadline,'Detached worker did not finish');await new Promise(r=>setTimeout(r,20));}
  assert.equal(JSON.parse(readFileSync(file)).status,'SUCCEEDED');assert.equal(syncJobs(job)[0].eligibleForReview,true);
});
