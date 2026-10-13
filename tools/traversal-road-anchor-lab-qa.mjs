/** Isolated authored pair at unit scale: native future-visible reset/retention, no campaign acceptance. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve,relative,extname } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { beginJob,registerJob } from './qa/qa-job.mjs';
const output=process.env.ANCHOR_QA_OUTPUT??'tmp/traversal/road-1945-visible-lab',port=5300;
const parameters={scope:'isolated native authored early-road pair at unit distance scale; no GameApp/RunSystem/save/combat; no production entry or earned gold claim',legs:['T0','T1','T3'],cases:[{width:1440,height:810,motion:'normal'},{width:390,height:844,motion:'os'},{width:620,height:780,motion:'game'}]};
const requiredAssertions=['visible-future-anchor-reset','native-unaligned-crossing','retention-full-exit','pause-resize-disposal','no-campaign-owners'];
const options={runId:process.env.AUTONOMY_RUN_ID,jobId:process.env.DEMO_QA_JOB_ID,output,driver:'tools/traversal-road-anchor-lab-qa.mjs',port,parameters,requiredAssertions};
if(process.argv.includes('--register')){console.log(JSON.stringify({registered:registerJob(options).jobId}));process.exit(0);}
const job=beginJob(options),report={parameters,startedAt:new Date().toISOString(),cases:[],errors:[],assertions:[],captures:[]};
const hash=b=>createHash('sha256').update(b).digest('hex');let server,browser;
try{
 const compiled=await build({entryPoints:['tools/traversal/road-anchor-lab.ts'],outfile:output+'/lab.js',bundle:true,minify:true,format:'esm',metafile:true,define:{'import.meta.env.DEV':'false'}});
 report.bundleInputs=await Promise.all(Object.keys(compiled.metafile.inputs).sort().map(async path=>({path,sha256:hash(await readFile(path))})));
 report.bundle=await Promise.all(['lab.js','lab.css'].map(async path=>({path,sha256:hash(await readFile(output+'/'+path))})));
 await writeFile(output+'/index.html','<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/lab.css"><body><script type="module" src="/lab.js"></script></body></html>');
 server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://127.0.0.1:'+port).pathname;let file;
  if(['/','/lab.js','/lab.css'].includes(path))file=resolve(output,path==='/'?'index.html':path.slice(1));
  else if(path.startsWith('/assets/')){file=resolve('public','.'+path);const rel=relative(resolve('public/assets'),file);assert.ok(rel&&!rel.startsWith('..')&&!rel.includes(':')&&extname(file)==='.png');}
  else{res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',extname(file)==='.png'?'image/png':extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':'text/html');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});browser=await chromium.launch({headless:true});
 const proof=page=>page.locator('#proof').textContent().then(JSON.parse);
 for(const leg of parameters.legs)for(const c of parameters.cases){
  const page=await browser.newPage({viewport:{width:c.width,height:c.height},reducedMotion:c.motion==='os'?'reduce':'no-preference'});
  page.on('pageerror',e=>report.errors.push(e.message));await page.goto(`http://127.0.0.1:${port}/?leg=${leg}&motion=${c.motion}`);
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('img')].map(i=>i.decode())));
  await page.keyboard.press('Tab');assert.equal(await page.locator('#start').evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Enter');
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).state.progress>.295);
  await page.locator('#pause').click();const paused=await proof(page);await page.waitForTimeout(200);assert.deepEqual((await proof(page)).state,paused.state);
  report.diagnostic={leg,...c,paused};
  const future=paused.state.marks.find(m=>m.id===paused.target);assert.ok(paused.state.progress<.31&&future&&!future.hidden&&future.left<c.width&&future.right>0,'Future pickup must actually be visible before reset');
  await page.setViewportSize({width:c.width-40,height:c.height});await page.waitForFunction(width=>JSON.parse(document.querySelector('#proof').textContent).state.width===width,c.width-40);const resized=await proof(page);assert.equal(resized.state.elapsed,paused.state.elapsed);assert.ok(Math.abs(resized.state.marks.find(m=>m.id===paused.target).x/(c.width-40)-future.x/c.width)<.001);
  await page.setViewportSize({width:c.width,height:c.height});await page.waitForFunction(width=>JSON.parse(document.querySelector('#proof').textContent).state.width===width,c.width);await page.locator('#pause').click();
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).state.reset>=0);
  const reset=await proof(page);assert.equal(reset.risk.collisionCount,1);assert.ok(!reset.state.marks.find(m=>m.id===reset.target).hidden);
  const file=`${leg}-${c.width}-${c.motion}-visible-reset.png`;await page.screenshot({path:output+'/'+file});report.captures.push(file);
  await page.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).reward.collectedPickupIds.length===1);
  const collected=await proof(page);assert.equal(collected.reward.collectedPickupIds[0],collected.target);assert.ok(!collected.state.marks.find(m=>m.id===collected.target).hidden);
  // Avoid a second reset, using a real native lane input after the target crossing.
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(()=>{const p=JSON.parse(document.querySelector('#proof').textContent);return p.state.progress>.6&&p.state.marks.find(m=>m.id===p.target).hidden;});
  const final=await proof(page),frames=final.samples.filter(s=>s.width===c.width),entered=frames.filter(s=>s.progress>.295),anchor=s=>(s.marks.find(m=>m.id===final.target).x/s.width-.25)*1463+s.distance;
  assert.ok(entered.every(s=>Math.abs(anchor(s)-anchor(entered[0]))<.02),'Already visible future anchor never reforecasts');
  const halfWidth=Math.min(72,Math.max(48,c.width*.05))/2;
  assert.ok(entered.every(s=>{const m=s.marks.find(m=>m.id===final.target);return m.hidden===(m.x+halfWidth<0);}), 'Retained target hides only after complete trailing-edge exit');
  assert.ok(final.state.marks.find(m=>m.id===final.target).x+halfWidth<0);
  const crossing=frames.findIndex(s=>s.progress>=.5),a=frames[crossing-1],b=frames[crossing];assert.ok(a&&a.elapsed<6000&&b.elapsed>=6000&&b.elapsed-a.elapsed<40);
  const f=(6000-a.elapsed)/(b.elapsed-a.elapsed),x=a.marks.find(m=>m.id===final.target).x+(b.marks.find(m=>m.id===final.target).x-a.marks.find(m=>m.id===final.target).x)*f;
  assert.ok(Math.abs(x-c.width*.25)<3,'Native unaligned crossing matches physical center');assert.ok(b.elapsed!==6000,'Native frame genuinely straddles authored contact');
  assert.equal(final.reward.collectedPickupIds.length,1);assert.equal(final.reward.collectedGold,5);
  await page.locator('#dispose').click();const disposed=await proof(page);await page.waitForTimeout(100);assert.deepEqual((await proof(page)).state,disposed.state);assert.ok(disposed.state.marks.every(m=>m.hidden));
  assert.ok(final.noOwnersInstantiated&&final.unitScaleProbe);assert.equal(final.reduced,String(c.motion!=='normal'));
  assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
  report.cases.push({leg,...c,paused,reset,final,disposed,nativeCrossing:{before:a.elapsed,after:b.elapsed,contact:6000,x},scope:parameters.scope});await page.close();console.log(`${leg}/${c.width}/${c.motion}: PASS`);
 }
 assert.equal(report.errors.length,0);report.pass=true;report.assertions=requiredAssertions.map(id=>({id,pass:true}));
}catch(e){report.pass=false;report.errors.push(e.stack??String(e));}
finally{await browser?.close();await new Promise(ok=>server?server.close(ok):ok());report.endedAt=new Date().toISOString();await writeFile(output+'/results.json',JSON.stringify(report)+'\n');const receipt=job.finish(report);console.log(JSON.stringify({status:receipt.status,output,cases:report.cases.length,errors:report.errors}));if(!report.pass)process.exitCode=1;}
