import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript(() => {
  const pending = new Set(), keys = new Set();
  const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => {
    const id = request(time => { pending.delete(id); callback(time); }); pending.add(id); return id;
  };
  window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
  const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
  window.addEventListener = (type, listener, options) => { if(type==='keydown') keys.add(listener); add(type,listener,options); };
  window.removeEventListener = (type, listener, options) => { if(type==='keydown') keys.delete(listener); remove(type,listener,options); };
  window.lifetimeCounts = () => ({raf:pending.size,keydown:keys.size,scenes:document.querySelectorAll('.traversal-t0').length});
});
await page.goto('http://127.0.0.1:5186/tools/traversal/taxonomy-review.html');
await page.waitForFunction(()=>window.review);
const cycles = await page.evaluate(() => {
  const old = window.review.scene, Ctor = old.constructor, options = old.options;
  old.dispose();
  const results = [];
  for (let i=0;i<6;i++) {
    const scene = new Ctor(options); scene.open(); scene.open();
    const open = window.lifetimeCounts();
    scene.dispose(); scene.dispose();
    results.push({open,disposed:window.lifetimeCounts()});
  }
  return results;
});
for (const cycle of cycles) {
  assert.deepEqual(cycle.open,{raf:1,keydown:1,scenes:1});
  assert.deepEqual(cycle.disposed,{raf:0,keydown:0,scenes:0});
}
const cdp = await page.context().newCDPSession(page);
await cdp.send('HeapProfiler.collectGarbage');
const counters = await cdp.send('Memory.getDOMCounters');
await writeFile('tools/traversal/qa/final-convergence/lifetime.json',JSON.stringify({cycles,counters},null,2));
await browser.close();
console.log({cycles:cycles.length,duplicateRafOrKeyListeners:false,counters});
