import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const tag = process.argv[2] ?? 'baseline';
const out = `tools/traversal/qa/final-convergence/${tag}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1463, height: 823 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto('http://127.0.0.1:5186/tools/traversal/taxonomy-review.html');
await page.waitForFunction(() => window.review);
await page.evaluate(async () => Promise.all([...document.images].map(image => image.decode().catch(() => {}))));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
const trace = [];
cdp.on('Tracing.dataCollected', ({ value }) => trace.push(...value));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
const samples = [];
for (const [name, progress, branch] of [['start', .02, 'main'], ['quarter', .25, 'main'], ['middle', .50, 'main'], ['three-quarter', .73, 'main'], ['branch-A', .83, 'lion-first-trial-event'], ['branch-B', .83, 'lion-first-trial-combat'], ['end', .965, 'lion-first-trial-combat']]) {
  await page.evaluate(({ progress, branch }) => {
    const { scene, state } = window.review;
    scene.presentedBranch = branch;
    state.run.traversalBranches = branch === 'main' ? {} : { T0: branch };
    scene.controller.sessionState = { ...scene.session, phase: 'RUNNING', currentLane: 1, routeProgress01: progress, stageIndex: branch === 'main' ? Math.floor(progress * 5) : progress > .9 ? 4 : 3 };
    scene.speed = .012;
    scene.renderRuntimeState();
  }, { progress, branch });
  await page.evaluate(async () => Promise.all([...document.images].map(image => image.decode().catch(() => {}))));
  await page.waitForTimeout(250);
  const before = await cdp.send('Performance.getMetrics');
  const sample = await page.evaluate(async ({ name }) => {
    const scene = window.review.scene;
    const frames = [], costs = [];
    let previous, start, calls = 0;
    const original = scene.updateWorldTransforms;
    scene.updateWorldTransforms = function (...args) { calls++; return original.apply(this, args); };
    performance.mark(`profile-${name}-start`);
    await new Promise(resolve => {
      const tick = now => {
        start ??= now;
        if (previous !== undefined) frames.push(now - previous);
        const t = performance.now();
        // Exercise the real movement notification/render path without modal stops.
        scene.inAnimationFrame = true;
        scene.controller.advanceTo(scene.session.routeProgress01 + (previous === undefined ? 0 : (now - previous) * .000012));
        scene.inAnimationFrame = false;
        if (scene.frameRenderPending) { scene.frameRenderPending = false; scene.renderRuntimeState(); }
        else scene.updateWorldTransforms();
        costs.push(performance.now() - t);
        previous = now;
        if (now - start < 3000) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
    performance.mark(`profile-${name}-end`);
    scene.updateWorldTransforms = original;
    const stats = values => { const sorted = [...values].sort((a,b) => a-b); return { mean: values.reduce((a,b)=>a+b,0)/values.length, p95: sorted[Math.floor(sorted.length*.95)], max: sorted.at(-1) }; };
    return { name, frames: stats(frames), fps: 1000 / stats(frames).mean, longFramesOver33ms: frames.filter(t=>t>33.4).length,
      updateCost: stats(costs), worldUpdatesPerFrame: calls / costs.length,
      dom: document.querySelectorAll('*').length, images: document.images.length,
      visibleSections: [...document.querySelectorAll('[data-world-section]')].filter(e=>!e.hidden).length,
      visiblePlants: [...document.querySelectorAll('[data-occluder]')].filter(e=>!e.hidden).length,
      visibleActors: [...document.querySelectorAll('.traversal-entity')].filter(e=>!e.hidden).length };
  }, { name });
  const after = await cdp.send('Performance.getMetrics');
  const map = result => Object.fromEntries(result.metrics.map(m=>[m.name,m.value]));
  const a=map(after), b=map(before);
  sample.metrics = Object.fromEntries(['LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration','LayoutCount','RecalcStyleCount'].map(key=>[key,a[key]-b[key]]));
  sample.heap = a.JSHeapUsedSize;
  samples.push(sample);
  await page.screenshot({ path: `${out}/${name}.png` });
}
const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
await cdp.send('Tracing.end'); await complete;
const events = {};
for (const e of trace) if (e.ph === 'X' && ['Paint','Layout','UpdateLayoutTree','PrePaint','Layerize','CompositeLayers'].includes(e.name)) {
  const v = events[e.name] ??= { count:0, durationMs:0 }; v.count++; v.durationMs += (e.dur??0)/1000;
}
await writeFile(`${out}/trace.json`, JSON.stringify({traceEvents:trace}));
await writeFile(`${out}/profile.json`, JSON.stringify({tag,method:'Chromium RAF presentation sweep, real controller advance notifications, seven 3-second windows; modal decisions excluded',samples,events,errors},null,2));
console.log(JSON.stringify({tag,samples,events,errors},null,2));
await browser.close();
