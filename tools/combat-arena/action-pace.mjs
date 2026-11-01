// Times a real action at 60 images per second on a simulated clock: a software
// renderer draws a few images per second and every short tween lasts at least
// one of them, so a stopwatch on it reads several times too long.
// usage: node tools/combat-arena/action-pace.mjs "skill|foe:skill" [scene] [opponent] [out.jpg] [times in ms]
// [opponent] is the query that picks the foe, as in skill-play.mjs. With [out.jpg],
// a page screenshot is kept at each of the comma-separated [times].
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright';

const [,, action = 'w_lion_surge', scene = 'forest_route', opponent = '', out = '', times = ''] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: out ? { width: 1280, height: 720 } : { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.clock.install();
await page.goto(`http://localhost:5173/legacy-combat.html?qa=1&stageqa=1&scene=${scene}&son=0&${opponent}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('[data-qa=prepare]'), null, { timeout: 90000, polling: 200 });
await page.waitForTimeout(3000);
await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
await page.waitForTimeout(1500);
await page.clock.pauseAt(Date.now() + 60000);
await page.evaluate((key) => {
  const p = window.__pace = { rows: [], floats: [], end: null, start: performance.now() };
  const since = () => Math.round(performance.now() - p.start);
  setInterval(() => { const s = window.__qaHelpers.spotlightState(); p.rows.push({ t: since(), shot: `${s.kind}/${s.camera}`, fx: window.__qaHelpers.fxInspect().length > 0 }); }, 50);
  new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) if (n.classList?.contains('float')) p.floats.push(`${since()}:${n.textContent}`); }).observe(document.body, { childList: true, subtree: true });
  (key.startsWith('foe:') ? window.__qaHelpers.playFromFoe(key.slice(4)) : window.__qaHelpers.stagePlay(key)).then(() => { p.end = since(); });
}, action);
const shots = [];
let now = 0;
for (const ms of times ? times.split(',').map(Number) : []) {
  await page.clock.runFor(ms - now);
  now = ms;
  shots.push({ ms, data: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
}
for (let i = 0; i < 24 && !(await page.evaluate(() => window.__pace.end)); i++) await page.clock.runFor(500);
await page.clock.runFor(500);
const pace = await page.evaluate(() => window.__pace);
let last = '';
for (const row of pace.rows) { const line = `${row.shot} fx=${row.fx ? 'on' : 'off'}`; if (line !== last) console.log(String(row.t).padStart(6), line); last = line; }
console.log(pace.floats.join('  '));
console.log(`action end ${pace.end} ms;`, errors[0] ?? 'no page errors');
if (out) {
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await sheet.setContent(`<!doctype html><style>
    body{margin:0;background:#111;color:#eee;font:13px system-ui;display:grid;grid-template-columns:repeat(${Math.min(3, shots.length)},1fr);gap:2px}
    .f{position:relative}.f img{width:100%;display:block}.f b{position:absolute;left:4px;top:2px;text-shadow:0 0 3px #000}
  </style>${shots.map((s) => `<div class="f"><img src="data:image/jpeg;base64,${s.data}"><b>${s.ms} ms</b></div>`).join('')}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await sheet.screenshot({ fullPage: true, type: 'jpeg', quality: 82 }));
}
await browser.close();
