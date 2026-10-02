/** QA receipts survive an orchestrator cutoff. Workers write only ignored outputs. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (parent, child) => { const r = relative(parent, child); return r !== '..' && !r.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(r); };
export function ignoredOutput(root, output) {
  const tmp = resolve(root, 'tmp'), path = resolve(root, output);
  assert.ok(path !== tmp && inside(tmp, path), 'QA output must be a child of ignored tmp/');
  let existing = path;
  while (!existsSync(existing)) existing = dirname(existing);
  const physicalOutput=resolve(realpathSync(existing),relative(existing,path));
  assert.ok(inside(resolve(realpathSync(root),'tmp'),physicalOutput), 'QA output symlink escapes ignored tmp/');
  return path;
}
function driverFile(root, driver) {
  const path = resolve(root, driver);
  assert.ok(inside(resolve(root, 'tools'), path) && path.endsWith('.mjs'), 'Driver must be an existing tools/*.mjs file');
  assert.ok(inside(resolve(realpathSync(root),'tools'), realpathSync(path)), 'Driver symlink escapes tools/');
  return path;
}
function git(root, args) { try { return execFileSync('git', ['--no-optional-locks', ...args], {cwd:root, encoding:'utf8', stdio:['ignore','pipe','ignore']}).trim(); } catch { throw new Error('Git provenance unavailable'); } }
export function provenance(root, driver, parameters={}) {
  const path = driverFile(root, driver), assets = resolve(root, 'dist/assets');
  assert.ok(existsSync(assets), 'Build production before starting QA');
  const build = readdirSync(assets).filter(n => /\.(?:js|css)$/.test(n)).sort().map(n => {
    const asset=resolve(assets,n);assert.ok(inside(resolve(realpathSync(root),'dist'),realpathSync(asset)),'Build symlink escapes dist/');
    return {path:`dist/assets/${n}`, sha256:hash(readFileSync(asset))};
  });
  assert.ok(build.length, 'Production bundle inventory is empty');
  const html = resolve(root, 'dist/index.html');
  if (existsSync(html)) build.push({path:'dist/index.html',sha256:hash(readFileSync(html))});
  const inputs=[];
  for(const role of ['earnedSavePath','priorProofPath'])if(parameters[role]) {
    const input=resolve(root,parameters[role]);
    assert.ok(input.endsWith('.json')&&!/(^|[/\\])(?:auth|credentials|token|secret|\.env[^/\\]*)\./i.test(input),'Only public JSON QA inputs may be hashed');
    assert.ok(inside(resolve(realpathSync(root),'tmp'),realpathSync(input))||inside(resolve(realpathSync(root),'docs/reports'),realpathSync(input)),'QA input must stay in tmp/ or docs/reports/');
    inputs.push({role,path:relative(root,input).replaceAll('\\','/'),sha256:hash(readFileSync(input))});
  }
  return {gitHead:git(root,['rev-parse','HEAD']), sourceTree:git(root,['rev-parse','HEAD:src']),
    sourceDiffSha256:hash(git(root,['diff','HEAD','--','src'])),driver:{path:relative(root,path).replaceAll('\\','/'),sha256:hash(readFileSync(path))},inputs,
    receiptToolSha256:hash(readFileSync(fileURLToPath(import.meta.url))),build};
}
export function sameExecution(a, b) {
  if(!a?.gitHead||!a?.sourceTree||!b?.gitHead||!b?.sourceTree)return false;
  const identity = p => ({driver:p.driver,receiptToolSha256:p.receiptToolSha256,build:p.build,inputs:p.inputs,sourceTree:p.sourceTree,sourceDiffSha256:p.sourceDiffSha256});
  return JSON.stringify(identity(a)) === JSON.stringify(identity(b));
}
function atomicJson(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(value,null,2)+'\n', {flag:'wx'});
  renameSync(temp,path);
}
function ownedState(root, runId, readOnly=false) {
  assert.ok(readOnly||process.env.AUTONOMY_QA_WORKER!=='1','A QA worker cannot mutate shared state');
  const lock=JSON.parse(readFileSync(resolve(root,'.git/codex-autonomy.lock'),'utf8'));
  assert.equal(lock.runId,runId,'Only the execution lock holder may update live.qaJobs');
  return JSON.parse(readFileSync(resolve(root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json'),'utf8'));
}
function writeJobs(root, state) {
  const mdPath=resolve(root,'docs/autonomy/AUTONOMOUS_WORK_STATE.md');
  const md=readFileSync(mdPath,'utf8');
  const jobs=state.live.qaJobs;
  const block=['<!-- QA_JOBS_START -->','## Live QA jobs','',...jobs.map(j => `- ${j.jobId}: ${j.status}; port ${j.port}; receipt \`${j.receiptPath}\`; ${j.acceptance ?? 'NOT_ACCEPTED'}`),'<!-- QA_JOBS_END -->'].join('\n');
  const next=md.includes('<!-- QA_JOBS_START -->')?md.replace(/<!-- QA_JOBS_START -->[\s\S]*?<!-- QA_JOBS_END -->/,block):`${md.trimEnd()}\n\n${block}\n`;
  atomicJson(resolve(root,'docs/autonomy/AUTONOMOUS_WORK_STATE.json'),state);
  writeFileSync(mdPath,next);
}
export function registerJob({root=process.cwd(),runId,jobId,output,driver,port,parameters={},requiredAssertions=[]}) {
  assert.match(jobId,/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/,'Invalid job ID');
  assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535,'Invalid QA port');
  const path=ignoredOutput(root,output);
  assert.ok(!existsSync(path),'Never overwrite an existing QA output');
  const state=ownedState(root,runId); state.live??={}; state.live.qaJobs??=[];
  assert.ok(!state.live.qaJobs.some(j=>j.jobId===jobId||j.output===relative(root,path).replaceAll('\\','/')),'Job ID/output already registered');
  const job={schemaVersion:1,jobId,runId,status:'PLANNED',registeredAt:new Date().toISOString(),pid:null,port,
    command:['node',driver],parameters,requiredAssertions,output:relative(root,path).replaceAll('\\','/'),
    receiptPath:relative(root,resolve(path,'qa-job.json')).replaceAll('\\','/'),provenance:provenance(root,driver,parameters),acceptance:'NOT_ACCEPTED'};
  state.live.qaJobs.push(job); writeJobs(root,state); return job;
}
export function syncJobs({root=process.cwd(),runId}) {
  const state=ownedState(root,runId); state.live??={}; state.live.qaJobs??=[];
  for(const job of state.live.qaJobs) {
    const receipt=resolve(ignoredOutput(root,job.output),'qa-job.json');
    if(!existsSync(receipt))continue;
    const result=JSON.parse(readFileSync(receipt,'utf8'));
    assert.equal(result.jobId,job.jobId,'Receipt/job identity mismatch');
    assert.equal(result.runId,job.runId,'Receipt/run identity mismatch');
    assert.equal(result.output,job.output,'Receipt/output identity mismatch');
    Object.assign(job,{status:result.status,pid:result.pid,startedAt:result.startedAt,endedAt:result.endedAt,
      exitCode:result.exitCode,resultPath:result.resultPath,resultSha256:result.resultSha256,
      provenanceMatches:sameExecution(job.provenance,result.provenance),provenanceStable:result.provenanceStable,acceptance:'NOT_ACCEPTED'});
    job.requestMatches=isDeepStrictEqual(job.parameters,result.parameters)&&isDeepStrictEqual(job.requiredAssertions,result.requiredAssertions)&&job.port===result.port&&isDeepStrictEqual(job.command,result.command);
    try {job.matchesCurrentExecution=sameExecution(result.provenance,provenance(root,job.provenance.driver.path,job.parameters));} catch {job.matchesCurrentExecution=false;}
    const evidence=resolve(ignoredOutput(root,job.output),'results.json');
    job.resultDigestMatches=existsSync(evidence)&&hash(readFileSync(evidence))===result.resultSha256;
    job.eligibleForReview=job.status==='SUCCEEDED'&&job.requestMatches&&job.provenanceMatches&&job.provenanceStable&&job.matchesCurrentExecution&&job.resultDigestMatches;
  }
  writeJobs(root,state);return state.live.qaJobs;
}
export function beginJob({root=process.cwd(),runId=process.env.AUTONOMY_RUN_ID??null,jobId=process.env.DEMO_QA_JOB_ID??`manual-${randomUUID()}`,output,driver,port,parameters={},requiredAssertions=[]}) {
  const path=ignoredOutput(root,output), receipt=resolve(path,'qa-job.json');
  const start=provenance(root,driver,parameters);
  if(runId) {
    const state=ownedState(root,runId,true);
    const planned=state.live?.qaJobs?.find(j=>j.jobId===jobId&&j.runId===runId);
    assert.ok(planned,'Register live.qaJobs before launching an autonomous QA worker');
    assert.equal(planned.output,relative(root,path).replaceAll('\\','/'));
    assert.equal(planned.port,port);
    assert.deepEqual(planned.parameters,parameters,'QA parameters changed after registration');
    assert.deepEqual(planned.requiredAssertions,requiredAssertions,'QA assertions changed after registration');
    assert.ok(sameExecution(planned.provenance,start),'QA source/driver/build changed after registration');
  }
  assert.ok(!existsSync(path),'Never overwrite an existing QA output');
  mkdirSync(dirname(path),{recursive:true});mkdirSync(path);
  const record={schemaVersion:1,jobId,runId,status:'RUNNING',startedAt:new Date().toISOString(),endedAt:null,pid:process.pid,port,
    output:relative(root,path).replaceAll('\\','/'),command:['node',driver],parameters,requiredAssertions,provenance:start,acceptance:'NOT_ACCEPTED'};
  writeFileSync(receipt,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  process.env.AUTONOMY_QA_WORKER='1';
  let finished=false;
  const fallback=code=>{if(!finished){record.status='FAILED';record.exitCode=code||1;record.endedAt=new Date().toISOString();record.reason='Worker exited before final result/cleanup';atomicJson(receipt,record);}};
  process.once('exit',fallback);
  return {receiptPath:record.output+'/qa-job.json', finish(report) {
    assert.ok(!finished,'QA receipt already finalized');
    try {record.provenanceStable=sameExecution(start,provenance(root,driver,parameters));} catch {record.provenanceStable=false;}
    const result=resolve(path,'results.json');
    assert.ok(existsSync(result),'Write results.json before finalizing receipt');
    const persisted=JSON.parse(readFileSync(result,'utf8'));
    assert.deepEqual(persisted,JSON.parse(JSON.stringify(report)),'Receipt must describe the persisted JSON result');
    if(!record.provenanceStable) {report.pass=false;report.failure='Source/driver/build changed during QA';atomicJson(result,report);}
    record.status=report.pass===true&&!report.failure&&Array.isArray(report.errors)&&!report.errors.length&&record.provenanceStable?'SUCCEEDED':'FAILED';
    if(record.status==='FAILED'&&report.pass===true){report.pass=false;atomicJson(result,report);}
    record.exitCode=record.status==='SUCCEEDED'?0:1;record.endedAt=new Date().toISOString();record.resultPath=record.output+'/results.json';record.resultSha256=hash(readFileSync(result));
    atomicJson(receipt,record);finished=true;process.removeListener('exit',fallback);return record;
  }};
}
export function demoJobOptions(env=process.env) {
  const target=env.DEMO_QA_TARGET??'first-refuge',routePlan=env.DEMO_QA_ROUTE??'rescue';
  const timeoutMinutes=Number(env.DEMO_QA_TIMEOUT_MINUTES??25);
  assert.ok(Number.isInteger(timeoutMinutes)&&timeoutMinutes>=1&&timeoutMinutes<=45,'QA timeout must be an integer from 1 to 45 minutes');
  return {driver:'tools/demo-continuous-production-qa.mjs',output:env.DEMO_QA_OUTPUT??'tmp/demo/continuous-production',port:Number(env.DEMO_QA_PORT??5249),
    parameters:{target,routePlan,timeoutMinutes,finalePlan:env.DEMO_QA_FINALE??(routePlan==='rescue'?'serpent':'trial'),defeatNodeId:env.DEMO_QA_DEFEAT_NODE??'lion-village-choice',
      nativeDefeatWait:env.DEMO_QA_DEFEAT_WAIT==='1',viewport:(env.DEMO_QA_VIEWPORT??'1366x768').split('x').map(Number),osReducedMotion:env.DEMO_QA_OS_MOTION==='1',
      earnedSavePath:env.DEMO_QA_EARNED_SAVE??null,priorProofPath:env.DEMO_QA_PRIOR_PROOF??null,verifySalvation:env.DEMO_QA_VERIFY_SALVATION==='1'},
    requiredAssertions:target==='defeat-recovery'?['EXACT_V6_CHECKPOINT_RECOVERY','VISIBLE_T1_DEPARTURE','EXACT_RELOAD']:['EARNED_LINEAGE','NATIVE_INPUTS','EXACT_RELOAD']};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [action,...args]=process.argv.slice(2), values={};
  for(const arg of args) {const match=arg.match(/^--([a-z-]+)=(.*)$/s);assert.ok(match,'Use --name=value arguments');assert.ok(['run-id','job-id','output','driver','port','parameters','assertions'].includes(match[1]),'Unknown argument');assert.ok(!(match[1] in values),'Duplicate argument');values[match[1]]=match[2];}
  assert.ok(values['run-id'],'--run-id is required');
  if(action==='register-demo') {assert.ok(Object.keys(values).every(k=>['run-id','job-id'].includes(k)),'Demo parameters come from DEMO_QA_* env');console.log(JSON.stringify(registerJob({...demoJobOptions(),runId:values['run-id'],jobId:values['job-id']})));}
  else if(action==='register')console.log(JSON.stringify(registerJob({runId:values['run-id'],jobId:values['job-id'],output:values.output,driver:values.driver,port:Number(values.port),parameters:JSON.parse(values.parameters??'{}'),requiredAssertions:JSON.parse(values.assertions??'[]')})));
  else {assert.equal(action,'sync','Only register and sync are supported');console.log(JSON.stringify(syncJobs({runId:values['run-id']})));}
}
