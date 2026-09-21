import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const out='tools/traversal/qa/freeze';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seams=JSON.parse(await readFile(`${out}/final/seams.json`,'utf8'));
const assets=[];
for(const asset of seams.assets){
 const path=`public${asset.src}`;
 const current=sha(await readFile(path));
 const baseline=sha(execFileSync('git',['show',`a4a253ee89c5f1dd1851b3d5a573270b8aa5f54f:${path}`],{maxBuffer:32*1024*1024}));
 assert.equal(current,baseline);assets.push({path,current,baseline});
}
const tests=JSON.parse(await readFile(`${out}/full-tests.json`,'utf8'));
assert.equal(tests.success,true);
const journeys=[];
for(const mode of ['meet-fight','ignore-flee','avoid']){
 const report=JSON.parse(await readFile(`${out}/live-final/${mode}/report.json`,'utf8'));
 assert.equal(report.returned,true);assert.deepEqual(report.errors,[]);
 let held;const returns=[];
 for(const state of report.states){
  if(['LOCAL_INTERACTION','NODE_HANDOFF','NODE_RESOLUTION'].includes(state.phase))held=state;
  if(state.phase==='RUNNING'&&held){
   assert.equal(state.lane,held.lane,`${mode}: return lane changed`);
   assert.equal(state.progress,held.progress,`${mode}: return position changed`);
   returns.push({lane:state.lane,progress:state.progress});held=undefined;
  }
 }
 journeys.push({mode,returned:true,errors:report.errors,returns});
}
const result={baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 tests:{total:tests.numTotalTests,passed:tests.numPassedTests,failed:tests.numFailedTests,
 files:tests.testResults.length,focused:tests.testResults.filter(r=>r.name.includes('/traversal/')||r.name.endsWith('/TraversalTravelReturn.test.ts')||r.name.endsWith('/traversalRouteAuthority.test.ts')).reduce((n,r)=>n+r.assertionResults.length,0)},assets,journeys};
await writeFile(`${out}/final-audit.json`,JSON.stringify(result,null,2));
console.log({tests:result.tests,assetsVerified:assets.length,journeys});
