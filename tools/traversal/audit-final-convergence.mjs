import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'tools/traversal/qa/final-convergence';
const baseline = '96954e7bb6b1416f4899858ee860079b776d48d5';
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), baseline);
assert.equal(git('rev-parse', '@{u}'), baseline);
assert.equal(git('branch', '--show-current'), 'campaign-structure-1');
const protectedPaths = ['src/game/runSystem.ts','src/game/types.ts','src/combat','src/render/CharacterVisualRegistry.ts','src/narrative','public/assets'];
for (const path of protectedPaths) assert.equal(git('diff','--name-only',baseline,'--',path),'',path);
const seams = await json(`${root}/seams/seams.json`);
const paths = [...new Set(seams.assets.map(a=>`public${a.src}`).concat([
  'public/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/chassis.png',
  'public/assets/generated/lion-phase/traversal/t0/vehicle/traversal-caravan/candidates/mechanical.png',
  'public/assets/generated/lion-phase/traversal/t0/depth-v1/foreground/ferns.png',
  'public/assets/generated/lion-phase/traversal/t0/depth-v1/foreground/roots.png',
]))];
const originals = [];
for (const path of paths) {
  const before = sha(execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:32*1024*1024}));
  const after = sha(await readFile(path)); assert.equal(after,before,path);
  originals.push({path,sha256:after});
}
const extraction = await json(`${root}/caravan/extraction.json`);
for (const asset of extraction.assets) assert.equal(sha(await readFile(asset.path)),asset.sha256);
const source = 'C:/Users/miche/.codex/generated_images/01a0c677-76ff-7541-9cda-9c0c558d8db0/exec-476dc05b-3a1a-4045-bde7-398c1bafb461.png';
assert.equal(sha(await readFile(source)),sha(await readFile(`${root}/caravan/source-sheet.png`)));
const reference = 'docs/references/traversal/t0/approved-closed-caravan.png';
assert.equal(sha(await readFile(reference)),sha(await readFile('C:/Users/miche/AppData/Local/Temp/codex-clipboard-07b9a6ae-ebb6-4885-876c-857ef24e01cc.png')));
const tests = {};
for (const name of ['focused-tests','full-tests']) {
  const r = await json(`${root}/${name}.json`); assert.equal(r.success,true);
  tests[name] = {passed:r.numPassedTests,failed:r.numFailedTests,files:r.testResults.length};
}
const journeys = [];
for (const mode of ['meet-fight','ignore-flee','avoid']) {
  const r = await json(`${root}/live-final/${mode}/report.json`);
  assert.equal(r.returned,true); assert.deepEqual(r.errors,[]);
  assert.ok(r.states.some(s=>s.phase==='DECISION'&&s.progress===.91&&s.category==='MANDATORY_EVENT'));
  journeys.push({mode,returned:r.returned,errors:r.errors,verifiedReturns:r.verifiedReturns});
}
const release = await json(`${root}/release-check.json`);
assert.equal(release.production.traversalCount,0); assert.deepEqual(release.errors,[]);
assert.deepEqual(seams.errors,[]);
const depth = await json(`${root}/runtime/report.json`);
for (const r of depth) { assert.deepEqual(r.errors,[]); assert.equal(r.state.wheels.length,4); }
const gate = await readFile('src/traversal/TraversalFeaturePolicy.ts','utf8');
assert.ok(gate.includes('enabled: false')&&gate.includes('designAssetsReady: false')&&gate.includes("['T0']"));
const result = {baseline,branch:'campaign-structure-1',uncommitted:true,unpushed:true,tests,journeys,
  originals,newAssets:extraction.assets,rawSourceSha256:sha(await readFile(source)),referenceSha256:sha(await readFile(reference)),
  protectedPaths,production:release.production,gate:{enabled:false,designAssetsReady:false,rolloutLegIds:['T0']}};
await writeFile(`${root}/final-audit.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({tests,journeys,originalsVerified:originals.length,newAssets:extraction.assets.length,production:release.production},null,2));
