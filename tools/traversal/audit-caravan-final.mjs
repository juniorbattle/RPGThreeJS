import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const out='tools/traversal/qa/caravan-depth';
const baseline='7cfccfe37e6d5721db96748080b9552d4b4f32fb';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const assets=[];
// Audit original sources, including the three now referenced through clearance derivatives.
for(const asset of (await json('tools/traversal/qa/freeze/final-audit.json')).assets){
 const current=sha(await readFile(asset.path));
 const source=sha(execFileSync('git',['show',`${baseline}:${asset.path}`],{maxBuffer:32*1024*1024}));
 assert.equal(current,source);assets.push({path:asset.path,current,baseline:source});
}
const provenance=await json(`${out}/asset-provenance.json`);
for(const asset of provenance.assets) assert.equal(sha(await readFile(`public${asset.runtimePath}`)),asset.sha256);
const tests=await json(`${out}/full-tests.json`);assert.equal(tests.success,true);
const journeys=[];
for(const mode of ['meet-fight','ignore-flee','avoid','upper-review','lower-review']){
 const report=await json(`${out}/live-final/${mode}/report.json`);
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
const release=await json(`${out}/release-check.json`);
assert.equal(release.production.traversalCount,0);assert.deepEqual(release.errors,[]);
const seams=await json(`${out}/seams/seams.json`);assert.deepEqual(seams.errors,[]);
const depth=await json(`${out}/runtime/report.json`);
for(const viewport of depth){assert.deepEqual(viewport.errors,[]);assert.equal(viewport.state.wheels.length,4);}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(head,baseline);
const protectedPaths=['src/game','src/campaign','src/combat','src/render/CharacterVisualRegistry.ts','public/assets/characters'];
for(const path of protectedPaths)assert.equal(execFileSync('git',['diff','--name-only',baseline,'--',path],{encoding:'utf8'}).trim(),'');
const gate=await readFile('src/traversal/TraversalFeaturePolicy.ts','utf8');
assert.ok(gate.includes('enabled: false'));assert.ok(gate.includes('designAssetsReady: false'));assert.ok(gate.includes("['T0']"));
const result={baseline:head,tests:{total:tests.numTotalTests,passed:tests.numPassedTests,failed:tests.numFailedTests,files:tests.testResults.length,
 focused:tests.testResults.filter(r=>r.name.replaceAll('\\','/').includes('/traversal/')||r.name.endsWith('TraversalTravelReturn.test.ts')||r.name.endsWith('traversalRouteAuthority.test.ts')).reduce((n,r)=>n+r.assertionResults.length,0)},
 originalAssets:assets,newAssetsVerified:provenance.assets.length,journeys,production:release.production,gate:{enabled:false,designAssetsReady:false,rolloutLegIds:['T0']},protectedPaths};
await writeFile(`${out}/final-audit.json`,JSON.stringify(result,null,2));console.log({tests:result.tests,newAssetsVerified:result.newAssetsVerified,journeys,production:result.production});
