/** Native-clock isolated production bundle. No real campaign or collision handoff acceptance. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, relative, extname } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { beginJob, registerJob } from './qa/qa-job.mjs';

const output = process.env.CHARGE_QA_OUTPUT ?? 'tmp/traversal/pursuit-1430', port = 5284;
const parameters = { scope: 'isolated minified candidate with native RAF and controls; no campaign owner/save/combat',
  viewports: ['1440x810','620x780','390x844'], motion: ['normal','os','game'], legs: ['T0','T1','T3'] };
const requiredAssertions = ['committed-lane-acceleration','genuine-miss-full-exit','contact-freezes-once',
  'pause-resize-input-boundaries','normal-os-game-reduction','keyboard-focus-responsive','failed-art-disposal','isolated-owner-scope'];
if (process.argv.includes('--register')) {
  const job = registerJob({ runId: process.env.AUTONOMY_RUN_ID, jobId: process.env.DEMO_QA_JOB_ID,
    output, driver: 'tools/traversal-pursuit-charge-qa.mjs', port, parameters, requiredAssertions });
  console.log(JSON.stringify({ registered: job.jobId })); process.exit(0);
}
const job = beginJob({ output, driver: 'tools/traversal-pursuit-charge-qa.mjs', port, parameters, requiredAssertions });
const report = { parameters, startedAt: new Date().toISOString(), cases: [], errors: [], assertions: [], bundleInputs: [], assets: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let server, browser;
const observedAssets = new Map();
try {
  const compiled = await build({ entryPoints: ['tools/traversal/pursuit-charge-lab.ts'], outfile: `${output}/lab.js`,
    bundle: true, minify: true, format: 'esm', metafile: true, define: { 'import.meta.env.DEV': 'false' } });
  report.bundleInputs = await Promise.all(Object.keys(compiled.metafile.inputs).sort().map(async path => ({ path, sha256: hash(await readFile(path)) })));
  report.bundle = await Promise.all(['lab.js','lab.css'].map(async path => ({ path, sha256: hash(await readFile(`${output}/${path}`)) })));
  await writeFile(`${output}/index.html`, '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/lab.css"><body><script type="module" src="/lab.js"></script></body></html>');
  server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, `http://localhost:${port}`).pathname;
      let file;
      if (['/','/lab.js','/lab.css'].includes(path)) file = resolve(output, path === '/' ? 'index.html' : path.slice(1));
      else if (path.startsWith('/assets/')) {
        file = resolve('public', `.${path}`);
        const rel = relative(resolve('public/assets'), file);
        assert.ok(rel && !rel.startsWith('..') && !rel.includes(':') && extname(file) === '.png');
      } else { res.writeHead(404); res.end(); return; }
      const bytes = await readFile(file);
      if (path.startsWith('/assets/')) observedAssets.set(relative(process.cwd(), file).replaceAll('\\','/'), hash(bytes));
      res.setHeader('Content-Type', extname(file) === '.png' ? 'image/png' : extname(file) === '.js' ? 'text/javascript' : extname(file) === '.css' ? 'text/css' : 'text/html');
      res.end(bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok); });
  browser = await chromium.launch({ headless: true });
  const proof = page => page.locator('#proof').textContent().then(JSON.parse);
  const errors = page => { page.on('pageerror', e => report.errors.push(e.message)); };
  const visit = (page, leg, motion, segment) => page.goto(`http://127.0.0.1:${port}/?leg=${leg}&motion=${motion}${segment ? `&segment=${segment}` : ''}`);
  for (const viewport of [{width:1440,height:810},{width:620,height:780},{width:390,height:844}]) {
    for (const motion of parameters.motion) for (const leg of parameters.legs) {
      const page = await browser.newPage({ viewport, reducedMotion: motion === 'os' ? 'reduce' : 'no-preference' }); errors(page);
      await visit(page, leg, motion);
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll('img')].map(i => i.decode()));
        await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)));
      });
      await page.keyboard.press('Tab'); assert.equal(await page.locator('#miss').evaluate(e => e === document.activeElement), true);
      const controls = await page.locator('button').evaluateAll(elements => elements.map(e => {
        const r=e.getBoundingClientRect(); return {width:r.width,height:r.height,left:r.left,right:r.right,bottom:r.bottom}; }));
      assert.ok(controls.every(r => r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= viewport.width && r.bottom <= viewport.height));
      const controlsClear=()=>page.locator('button').evaluateAll(elements=>elements.every(e=>{
        const r=e.getBoundingClientRect(),status=document.querySelector('#status').getBoundingClientRect();
        const point=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return e.contains(point) && (r.bottom<=status.top || r.top>=status.bottom || r.right<=status.left || r.left>=status.right);
      }));
      assert.equal(await controlsClear(),true,'Status must not obscure responsive controls');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => JSON.parse(document.querySelector('#proof').textContent).state.elapsedSeconds > .7);
      if (leg === 'T0' && motion !== 'game') await page.screenshot({path:`${output}/${leg}-${viewport.width}-${motion}-miss.png`});
      await page.waitForFunction(() => JSON.parse(document.querySelector('#proof').textContent).state.phase === 'EXITED');
      const miss = await proof(page);
      assert.equal(miss.observations.length, 1); assert.equal(miss.observations[0].kind, 'MISS_EXITED');
      assert.equal(miss.state.left, miss.geometry.viewportRight); assert.equal(miss.state.lane, miss.samples[0].lane);
      const moving = miss.samples.filter(s => s.phase === 'CHARGING');
      report.cases.push({leg,viewport,motion,window:miss.window,miss,contact:null});
      assert.ok(moving.length >= 3 && moving.at(-1).speed > moving[0].speed * 2,
        `Acceleration samples=${moving.length} first=${moving[0]?.speed} last=${moving.at(-1)?.speed}`);
      assert.ok(moving.every((s,i) => !i || s.left >= moving[i-1].left && s.speed >= moving[i-1].speed));
      assert.ok(moving.slice(1).every((s,i) => s.time - moving[i].time < .25),'Charge must have a readable native frame sequence');
      for(const s of moving) assert.ok(Math.abs(s.speed - (180 + 950*s.time)) < .001);
      assert.ok(moving.every(s => s.lane === miss.state.lane && s.caravanLane !== s.lane));
      assert.equal(miss.reduced, String(motion !== 'normal'));
      const depth=await page.locator('.traversal-pursuit-charge').evaluate(e=>({z:getComputedStyle(e).zIndex,top:e.style.top}));
      assert.equal(depth.z,miss.state.lane === 0 ? '21' : '23');
      assert.equal(depth.top,miss.state.lane === 0 ? '65%' : '81%');
      assert.ok(moving.every(s => motion === 'normal' ? s.animation === 'traversal-charge-stride' : s.animation === 'none'));
      if (motion !== 'normal') assert.ok(moving.every(s => Math.abs(s.spriteLeft - moving[0].spriteLeft) < .1));
      await page.locator('#contact').click();
      await page.waitForFunction(() => JSON.parse(document.querySelector('#proof').textContent).state.phase === 'COLLISION_PENDING');
      const contact = await proof(page); await page.waitForTimeout(150); const frozen = await proof(page);
      assert.deepEqual(frozen.state, contact.state); assert.equal(frozen.observations.length, 1);
      assert.equal(contact.observations[0].kind, 'CONTACT');
      assert.ok(Math.abs(contact.state.left + contact.geometry.pursuerWidth - contact.geometry.caravanLeft) < .001);
      if(motion === 'normal') {
        const grounds=await page.evaluate(()=>({shadow:document.querySelector('.traversal-pursuit-charge').getBoundingClientRect().bottom,
          caravan:document.querySelector('figure').getBoundingClientRect().bottom}));
        assert.ok(Math.abs(grounds.shadow-grounds.caravan) < 6,'Contact actors must share a ground line');
      }
      assert.equal(await page.locator('#status').textContent(), 'Contact isolé : mapping canonique manquant');
      assert.equal(await controlsClear(),true,'Terminal status must not obscure responsive controls');
      assert.deepEqual(await page.evaluate(() => [Object.keys(localStorage),Object.keys(sessionStorage)]), [[],[]]);
      assert.equal(await page.locator('#contact').evaluate(e => e === document.activeElement), true);
      if (leg === 'T0' && motion === 'normal') await page.screenshot({path:`${output}/${leg}-${viewport.width}-${motion}-contact.png`});
      report.cases.at(-1).contact=contact; await page.close();
    }
  }
  // Every remaining authored window is read through its actual authoring seam.
  for (const [leg,segment] of [['T0','route-5a'],['T0','route-5b'],['T0','route-6'],['T1','t1-route-4b'],['T1','t1-route-5'],['T3','t3-route-4b'],['T3','t3-route-5']]) {
    const page=await browser.newPage({viewport:{width:1440,height:810}}); errors(page); await visit(page,leg,'normal',segment);
    await page.locator('#miss').click(); await page.waitForFunction(() => JSON.parse(document.querySelector('#proof').textContent).state.phase === 'EXITED');
    const result=await proof(page); assert.equal(result.observations[0].kind,'MISS_EXITED'); assert.equal(result.observations.length,1);
    report.cases.push({leg,segment,result}); await page.close();
  }
  for(const motion of parameters.motion) {
  const page = await browser.newPage({viewport:{width:620,height:780},reducedMotion:motion==='os'?'reduce':'no-preference'}); errors(page); await visit(page,'T0',motion);
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('img')].map(i=>i.decode()));});
  await page.locator('#miss').click(); await page.waitForTimeout(80);
  await page.setViewportSize({width:390,height:844});
  const resized=await proof(page); assert.equal(resized.state.phase,'CHARGING'); assert.equal(resized.geometry.viewportRight,1463);
  await page.locator('#pause').click();
  const paused = await proof(page); await page.waitForTimeout(250); assert.deepEqual((await proof(page)).state,paused.state);
  assert.equal(await page.locator('.traversal-pursuit-charge img').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.setViewportSize({width:620,height:780});
  assert.deepEqual((await proof(page)).state,paused.state); await page.locator('#pause').click();
  await page.locator('#lane').click();
  await page.waitForFunction(() => JSON.parse(document.querySelector('#proof').textContent).state.phase === 'COLLISION_PENDING');
  const boundary=await proof(page); assert.equal(boundary.state.lane,paused.state.lane); assert.equal(boundary.observations.length,1);
  await page.locator('#dispose').click(); assert.equal(await page.locator('.traversal-pursuit-charge').count(),0);
  const disposed=await proof(page); await page.waitForTimeout(200); assert.deepEqual((await proof(page)).state,disposed.state);
  report.cases.push({motion,resized,boundary,paused,disposed}); await page.close();
  }
  const missing=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}); errors(missing);
  await missing.route('**/shadow-pursuer.png',r=>r.abort()); await visit(missing,'T0','os');
  await missing.waitForFunction(()=>document.querySelector('.traversal-pursuit-charge').dataset.assetFailed==='true');
  await missing.locator('#contact').click(); await missing.waitForFunction(()=>JSON.parse(document.querySelector('#proof').textContent).state.phase==='COLLISION_PENDING');
  assert.equal((await proof(missing)).observations[0].kind,'CONTACT');
  await missing.screenshot({path:`${output}/missing-shadow.png`}); report.cases.push({missingAsset:await proof(missing)}); await missing.close();
  for (const input of report.bundleInputs) assert.equal(hash(await readFile(input.path)),input.sha256,'Candidate input changed during QA');
  report.assets=[...observedAssets].map(([path,sha256])=>({path,sha256}));
  for (const asset of report.assets) assert.equal(hash(await readFile(asset.path)),asset.sha256);
  assert.equal(report.errors.length,0); report.assertions=requiredAssertions.map(id=>({id,pass:true})); report.pass=true;
} catch (error) { report.pass=false; report.errors.push(error.stack ?? String(error)); }
finally {
  await browser?.close(); if(server?.listening) await new Promise(ok=>server.close(ok));
  report.endedAt=new Date().toISOString();
  await writeFile(`${output}/results.json`, JSON.stringify(report,null,2)+'\n');
  const receipt=job.finish(report); console.log(JSON.stringify({pass:report.pass,cases:report.cases.length,status:receipt.status,errors:report.errors,output}));
  if(!report.pass) process.exitCode=1;
}
