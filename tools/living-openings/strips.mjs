// Frame strips (t = 0.25, 0.5, 1, 2, 4 s) of the first shots of every cinematic, composed as the player does.
// Usage: node tools/living-openings/strips.mjs [out-dir] [id,id]; REDUCED=1, ALLSHOTS=1, TIMES=0.25,0.5 are optional.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const base = process.env.BASE ?? 'http://localhost:5186';
const dir = process.argv[2] ?? 'tmp/living-openings/strips';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const reduced = process.env.REDUCED === '1';
const times = (process.env.TIMES ?? '0.25,0.5,1,2,4').split(',').map(Number);
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`${base}/tools/living-openings/probe.html`);
await page.waitForFunction(() => window.probeReady === true, null, { timeout: 60000 });
const ids = only ?? await page.evaluate(() => window.probe.ALL_IDS());
for (const id of ids) {
  const shots = await page.evaluate((id) => window.probe.shotsOf(id), id);
  const shotIndexes = process.env.ALLSHOTS === '1' ? shots.map((_, i) => i) : [0, ...(shots.length > 1 ? [1] : [])];
  for (const index of shotIndexes) {
    const ts = times.filter(t => t < shots[index].seconds);
    const strip = await page.evaluate(async ({ id, index, ts, reduced }) => {
      const urls = await window.probe.framesOf(id, index, ts, reduced, 456);
      const imgs = await Promise.all(urls.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
      const w = 456, h = imgs[0].height, pad = 4, label = 22;
      const c = document.createElement('canvas'); c.width = imgs.length * (w + pad) - pad; c.height = h + label;
      const x = c.getContext('2d'); x.fillStyle = '#0b0c12'; x.fillRect(0, 0, c.width, c.height);
      imgs.forEach((im, k) => { x.drawImage(im, k * (w + pad), label); x.fillStyle = '#f4d98b'; x.font = '600 14px sans-serif'; x.fillText(`t = ${ts[k].toFixed(2).replace(/\.?0+$/, '')} s`, k * (w + pad) + 6, 16); });
      return c.toDataURL('image/jpeg', 0.84);
    }, { id, index, ts, reduced });
    writeFileSync(`${dir}/${id}__${index}_${shots[index].id}.jpg`, Buffer.from(strip.split(',')[1], 'base64'));
    process.stdout.write('.');
  }
}
console.log('\ndone', dir);
await browser.close();
