import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const tag = process.argv[2] ?? 'final';
const out = `${process.env.TRAVERSAL_QA_ROOT ?? 'tools/traversal/qa/freeze'}/${tag}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1463, height: 823 }, recordVideo: { dir: out, size: { width: 1463, height: 823 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${process.env.TRAVERSAL_QA_PORT ?? 5182}/tools/traversal/taxonomy-review.html`);
await page.waitForFunction(() => window.review);
await page.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
await page.evaluate(() => { window.review.scene.advance(20); window.review.settle(); });
await page.screenshot({ path: `${out}/merchant.png` });
await page.addStyleTag({ content: '.traversal-world__entities,.traversal-world__markers,.traversal-world__occlusion,.traversal-vehicle,.traversal-hud,.traversal-event-panel,.traversal-lanes,.traversal-world__foreground {visibility:hidden!important}' });
const boundaries = [850,2050,3250,4850,5250,6850,8050,9650,10450];
for (const boundary of boundaries) {
  await page.evaluate(async x => {
    const { TRAVERSAL_T0_WORLD } = await import('/src/traversal/TraversalT0World.ts');
    const renderer = window.review.scene.worldRenderer;
    renderer.update(x - innerWidth / 2, innerWidth, 'main', new Set());
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  }, boundary);
  await page.screenshot({ path: `${out}/seam-${boundary}.png` });
  if(tag!=='baseline') {
    const diagnostic=await page.addStyleTag({content:'.traversal-world__sections {filter:contrast(1.8) brightness(1.25)}'});
    await page.screenshot({path:`${out}/diagnostic-${boundary}.png`});
    await diagnostic.evaluate(e=>e.remove());
  }
}
if(tag!=='baseline') {
 for(const branch of ['lion-first-trial-event','lion-first-trial-combat']) {
  for(const boundary of [6850,8050,9650,10450]) {
   await page.evaluate(({boundary,branch})=>window.review.scene.worldRenderer.update(boundary-innerWidth/2,innerWidth,branch,new Set(['opening-ambush'])),{boundary,branch});
   await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
   await page.screenshot({path:`${out}/${branch}-seam-${boundary}.png`});
  }
 }
 // Continuous Chromium RAF scrolling of the entire road, actors hidden, normal presentation.
 for(const branch of ['main','lion-first-trial-event','lion-first-trial-combat']) {
  await page.evaluate(branch=>new Promise(resolve=>{
   const start=performance.now();const from=branch==='main'?0:7200;const to=10500;
   const tick=now=>{const camera=Math.min(to,from+(now-start)*.8);
    window.review.scene.worldRenderer.update(camera,innerWidth,branch,new Set(['opening-ambush']));
    if(camera<to)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);
  }),branch);
 }
}
const assets = await page.evaluate(async () => {
  const { TRAVERSAL_WORLD_ASSETS } = await import('/src/traversal/TraversalT0World.ts');
  return Promise.all(Object.entries(TRAVERSAL_WORLD_ASSETS).map(async ([name, src]) => {
    const i = new Image(); i.src = src; await i.decode();
    const c = document.createElement('canvas'); c.width=i.width; c.height=i.height;
    const ctx=c.getContext('2d');ctx.drawImage(i,0,0);
    const d=ctx.getImageData(0,0,c.width,c.height).data;
    let minAlpha=255, nonOpaque=0;
    for(let n=3;n<d.length;n+=4){minAlpha=Math.min(minAlpha,d[n]);if(d[n]<255)nonOpaque++;}
    return {name,src,width:i.width,height:i.height,minAlpha,nonOpaque};
  }));
});
const proportions=await page.evaluate(()=>[...document.querySelectorAll('.traversal-world-section__terrain img')].map(i=>{
 const r=i.getBoundingClientRect();return{src:i.getAttribute('src'),visible:r.height>0,sourceRatio:i.naturalWidth/i.naturalHeight,renderRatio:r.width/r.height};
}).filter(i=>i.visible));
for(const i of proportions)assert.ok(Math.abs(i.sourceRatio-i.renderRatio)<.001,`Distorted terrain: ${i.src}`);
assert.deepEqual(errors,[]);
await writeFile(`${out}/seams.json`,JSON.stringify({boundaries,assets,proportions,errors},null,2));
await context.close();
await page.video().saveAs(`${out}/seam-scroll.webm`);
await browser.close();
console.log({out,errors,assets});
