// Plays hero skills for real (action flow, spotlight, camera) and keeps frames
// read straight from the canvas, right after each render: page screenshots are
// too slow to catch an action. DOM overlays (HUD, screen flash) are not in them.
// usage: node tools/combat-arena/skill-play.mjs <out.jpg> "skill,foe:skill,…" [frames per skill] [scene] [opponent]
// `foe:` plays the action of the large opponent from where it stands; [opponent] is
// the query that picks it: "boss=lion_chief:lion_champion" or "foes=young_dragon_elite".
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright';

const [,, out = 'tmp/fx-gallery/play.jpg', list = 'w_lion_surge', frameCount = '12', scene = 'forest_route', opponent = ''] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const logs = [];
const rows = [];
for (const skill of list.split(',')) {
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  page.on('pageerror', (e) => logs.push(`${skill} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('Stage QA')) logs.push(`${skill} console: ${m.text()}`); });
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.__shots = [];
    window.requestAnimationFrame = (cb) => raf((t) => {
      cb(t);
      if (!window.__recording) return;
      const gl = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (!gl) return;
      const c = window.__thumb ??= Object.assign(document.createElement('canvas'), { width: 533, height: 300 });
      c.getContext('2d').drawImage(gl, 0, 0, c.width, c.height);
      window.__shots.push({ at: performance.now(), data: c.toDataURL('image/jpeg', 0.72) });
    });
  });
  await page.goto(`http://localhost:5173/legacy-combat.html?qa=1&stageqa=1&scene=${scene}&dtcap=0.5&son=0&${opponent}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('[data-qa=prepare]'), null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
  await page.waitForTimeout(2000);
  const finished = await page.evaluate(async (key) => {
    const play = () => Promise.race([key.startsWith('foe:') ? window.__qaHelpers.playFromFoe(key.slice(4)) : window.__qaHelpers.stagePlay(key), new Promise((r) => setTimeout(r, 30000))]);
    // the first play compiles the shaders and stalls: only the second one is kept
    await play();
    window.__recording = true;
    const start = performance.now();
    await play();
    await new Promise((r) => setTimeout(r, 600));
    window.__recording = false;
    return performance.now() - start;
  }, skill);
  const shots = await page.evaluate((n) => {
    // evenly spaced in time, not in images: the frame rate falls during an effect
    const all = window.__shots, first = all[0]?.at ?? 0, last = all.at(-1)?.at ?? 0;
    const nearest = (t) => all.reduce((best, shot) => (Math.abs(shot.at - t) < Math.abs(best.at - t) ? shot : best), all[0]);
    return { total: all.length, frames: Array.from({ length: n }, (_, i) => nearest(first + (last - first) * i / (n - 1))).map((s) => ({ ms: Math.round(s.at - first), data: s.data })) };
  }, Number(frameCount));
  rows.push({ skill, finished, ...shots });
  await page.close();
}
const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await sheet.setContent(`<!doctype html><style>
  body{margin:0;background:#111;color:#eee;font:13px system-ui}
  .row{display:grid;grid-template-columns:repeat(6,1fr);gap:2px;margin-bottom:6px}
  h2{font-size:13px;margin:4px 6px}.f{position:relative}.f img{width:100%;display:block}
  .f b{position:absolute;left:4px;top:2px;font-weight:600;text-shadow:0 0 3px #000}
</style>${rows.map((r) => `<h2>${r.skill} (${r.total} images, ${Math.round(r.finished)} ms)</h2><div class="row">${r.frames.map((f) => `<div class="f"><img src="${f.data}"><b>${f.ms} ms</b></div>`).join('')}</div>`).join('')}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await sheet.screenshot({ fullPage: true, type: 'jpeg', quality: 82 }));
console.log(logs.slice(0, 12).join('\n') || 'no page errors');
await browser.close();
