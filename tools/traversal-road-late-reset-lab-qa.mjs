/** Isolated authored late-reset presentation proof; scripted reset, native clock/input, no campaign. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, relative, extname } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { beginJob, registerJob } from './qa/qa-job.mjs';
const output = process.env.ANCHOR_QA_OUTPUT ?? 'tmp/traversal/road-0007-late-lab', port = 5314;
const parameters = { scope: 'isolated T0 authored .68 rock, scripted 10082.9ms reset, native RAF/input; no campaign/save/combat/earned gold',
  cases: ['normal','os','game'].flatMap(motion => [[1440,810],[620,780],[390,844]].map(([width,height]) => ({motion,width,height}))) };
const requiredAssertions = ['late-reset-frozen-visible-anchor','native-unaligned-contact','bounded-monotone-camera','once-only-risk','retention-full-exit','no-campaign-owners'];
const options = {runId:process.env.AUTONOMY_RUN_ID,jobId:process.env.DEMO_QA_JOB_ID,output,driver:'tools/traversal-road-late-reset-lab-qa.mjs',port,parameters,requiredAssertions};
if (process.argv.includes('--register')) { console.log(JSON.stringify({registered:registerJob(options).jobId})); process.exit(0); }
const job = beginJob(options), report = {parameters,startedAt:new Date().toISOString(),cases:[],errors:[],assertions:[],captures:[]};
const hash = b => createHash('sha256').update(b).digest('hex'); let server,browser;
try {
  const compiled = await build({entryPoints:['tools/traversal/road-late-reset-lab.ts'],outfile:output+'/lab.js',bundle:true,minify:true,metafile:true,define:{'import.meta.env.DEV':'false'}});
  report.bundleInputs = await Promise.all(Object.keys(compiled.metafile.inputs).sort().map(async path => ({path,sha256:hash(await readFile(path))})));
  report.bundle = await Promise.all(['lab.js','lab.css'].map(async path => ({path,sha256:hash(await readFile(output+'/'+path))})));
  await writeFile(output+'/index.html','<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/lab.css"><body><script type="module" src="/lab.js"></script></body></html>');
  server = createServer(async(req,res) => {try {
    const path = new URL(req.url,'http://127.0.0.1:'+port).pathname; let file;
    if (['/','/lab.js','/lab.css'].includes(path)) file=resolve(output,path==='/'?'index.html':path.slice(1));
    else if (path.startsWith('/assets/')) {file=resolve('public','.'+path);const r=relative(resolve('public/assets'),file);assert.ok(r&&!r.startsWith('..')&&!r.includes(':')&&extname(file)==='.png');}
    else {res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',extname(file)==='.png'?'image/png':extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':'text/html');res.end(await readFile(file));
  } catch {res.writeHead(404);res.end();} });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  for (const c of parameters.cases) {
    const page=await browser.newPage({viewport:{width:c.width,height:c.height},reducedMotion:c.motion==='os'?'reduce':'no-preference'});
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/?motion=${c.motion}`);
    await page.evaluate(()=>Promise.all([...document.querySelectorAll('img')].map(i=>i.decode())));
    await page.keyboard.press('Tab'); assert.ok(await page.locator('#start').evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).resetDone);
    const file=`T0-${c.width}-${c.motion}-late-reset.png`;await page.screenshot({path:output+'/'+file});report.captures.push(file);
    await page.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).state.elapsed>=13000);
    const final=await page.evaluate(()=>JSON.parse(document.querySelector('#proof').textContent)), frames=final.samples;
    assert.ok(final.scriptedIsolatedReset&&final.noOwnersInstantiated);assert.equal(final.reduced,String(c.motion!=='normal'));
    assert.ok(frames.every((s,i)=>i===0||s.distance>=frames[i-1].distance));
    assert.ok(frames.every(s=>Number.isFinite(s.visualSpeed)&&s.visualSpeed>0&&s.visualSpeed<=2*2.5*1.686));
    assert.ok(frames.every(s=>s.decoded&&(s.reset===-1||s.reset===10082.9)));
    const anchor=s=>(s.x/c.width-.25)*1463+s.distance;
    assert.ok(frames.every(s=>Math.abs(anchor(s)-anchor(frames[0]))<.02));
    const k=frames.findIndex(s=>s.elapsed>=10200),a=frames[k-1],b=frames[k];
    assert.ok(a&&a.elapsed<10200&&b.elapsed>10200&&b.elapsed-a.elapsed<40);
    const x=a.x+(b.x-a.x)*(10200-a.elapsed)/(b.elapsed-a.elapsed);
    assert.ok(Math.abs(x-c.width*.25)<3);
    assert.equal(final.risk.collisionCount,1);assert.deepEqual(final.risk.resolvedHazardIds,[final.target]);
    assert.ok(!b.hidden&&frames.some(s=>s.elapsed>10200&&!s.hidden)&&final.state.hidden&&final.state.right===0);
    const halfWidth=Math.min(c.height*.24,c.width*(c.width<=1000?.16:.14))*(c.width<=700?1.26:.98)/2;
    assert.ok(frames.every(s=>s.hidden===(s.x+halfWidth<0)));assert.ok(final.state.x+halfWidth<0);
    assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
    report.cases.push({...c,final,contact:{before:a.elapsed,after:b.elapsed,x,expected:c.width*.25}});
    await page.close();console.log(`${c.width}/${c.motion}: PASS`);
  }
  assert.equal(report.errors.length,0);report.pass=true;report.assertions=requiredAssertions.map(id=>({id,pass:true}));
} catch(e) {report.pass=false;report.errors.push(e.stack??String(e));}
finally {await browser?.close();await new Promise(ok=>server?server.close(ok):ok());report.endedAt=new Date().toISOString();await writeFile(output+'/results.json',JSON.stringify(report)+'\n');const receipt=job.finish(report);console.log(JSON.stringify({status:receipt.status,output,cases:report.cases.length,errors:report.errors}));if(!report.pass)process.exitCode=1;}
