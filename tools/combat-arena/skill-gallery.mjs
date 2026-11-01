// Skill gallery: plays hero skills through the real combat FX path with the FX
// clock frozen and stepped, then lays the frames of each skill out in one strip.
// usage: node tools/combat-arena/skill-gallery.mjs <out.png> "skill,skill,…" [offsetsMs from the impact] [scene]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright';

const [,, out = 'tmp/fx-gallery/skills.png', list = 'w_lion_surge', offsets = '-600,-200,50,300,700,1300', scene = 'forest_route'] = process.argv;
const times = offsets.split(',').map(Number);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
await page.goto(`http://localhost:5173/legacy-combat.html?qa=1&scene=${scene}&dtcap=0.5&son=0`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
await page.waitForTimeout(2500);
await page.addStyleTag({ content: '#ui, #qa-combat-controls { visibility: hidden !important; }' });
await page.evaluate(() => window.__qaHelpers.fxFreeze(true));

const rows = [];
for (const skill of list.split(',')) {
  const info = await page.evaluate((key) => window.__qaHelpers.fxSkill(key), skill);
  if (!info) { logs.push(`no preview for ${skill}`); continue; }
  const frames = [];
  let at = 0;
  for (const offset of times) {
    const next = Math.max(0.02, info.impactTime + offset / 1000);
    if (next > at) await page.evaluate((t) => window.__qaHelpers.fxAdvance(t), next - at);
    at = Math.max(at, next);
    await page.waitForTimeout(350);
    frames.push({ offset, data: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
  }
  rows.push({ skill, info, frames });
  await page.evaluate(() => window.__qaHelpers.fxAdvance(4));
  await page.waitForTimeout(300);
}

const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await sheet.setContent(`<!doctype html><style>
  body{margin:0;background:#111;color:#eee;font:13px system-ui}
  .row{display:grid;grid-template-columns:repeat(${times.length},1fr);gap:2px;margin-bottom:6px}
  h2{font-size:13px;margin:4px 6px}.f{position:relative}.f img{width:100%;display:block}
  .f b{position:absolute;left:4px;top:2px;font-weight:600;text-shadow:0 0 3px #000}
</style>${rows.map((r) => `<h2>${r.skill} (impact ${r.info.impactTime.toFixed(2)} s, ${r.info.targets} cibles)</h2><div class="row">${r.frames.map((f) => `<div class="f"><img src="data:image/jpeg;base64,${f.data}"><b>${f.offset >= 0 ? '+' : ''}${f.offset} ms</b></div>`).join('')}</div>`).join('')}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await sheet.screenshot({ fullPage: true, type: 'jpeg', quality: 82 }));
console.log(logs.slice(0, 12).join('\n') || 'no page errors');
await browser.close();
