// FX gallery: plays recipes at chosen AP weights through __qaHelpers.fxPreview
// and captures each one at an exact FX time (the FX clock is frozen and stepped).
// usage: node tools/combat-arena/fx-gallery.mjs <scene> <outDir> "preset@ap[@offsetMs[@areaSteps]],preset@ult,…" [offsetMs]
import { chromium } from 'playwright';
const [,, scene = 'forest_route', outDir = '/tmp/fx-gallery', list = 'sword_slash@1,sword_slash@3,sword_slash@5', offset = '150'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:5173/legacy-combat.html?qa=1&scene=${scene}&dtcap=0.5&son=0`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
await page.waitForTimeout(2500);
await page.evaluate(() => window.__qaHelpers?.fxFreeze?.(true));
for (const item of list.split(',')) {
  const [preset, weight, itemOffset, area] = item.split('@');
  const power = weight === 'ult' ? { ap: 5, ultimate: true } : { ap: Number(weight) };
  const info = await page.evaluate(([id, p, a]) => window.__qaHelpers?.fxPreview?.(id, p, a), [preset, power, Number(area ?? 0)]);
  if (!info) { logs.push(`no preview for ${item}`); continue; }
  // the FX clock is frozen: step it to the exact moment, then capture
  const at = Math.max(0, info.impactTime + Number(itemOffset ?? offset) / 1000);
  await page.evaluate((t) => window.__qaHelpers.fxAdvance(t), at);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/${preset}@${weight}${itemOffset ? '@' + itemOffset : ''}${area ? '@' + area : ''}.png` });
  await page.evaluate((t) => window.__qaHelpers.fxAdvance(t), Math.max(0.2, info.duration - at + 0.3));
  await page.waitForTimeout(300);
}
console.log(logs.join('\n'));
await browser.close();
