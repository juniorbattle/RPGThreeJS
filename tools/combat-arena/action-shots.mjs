// Plays a combat QA action and captures frames at given offsets (ms).
// usage: node tools/combat-arena/action-shots.mjs <url> <outPrefix> <qaActionKey> <ms,ms,...>
import { chromium } from 'playwright';
const [,, url, out, action, times='300,900,1600'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport:{ width:1440, height:810 } });
const logs=[];
page.on('pageerror', e => logs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
page.on('console', m => { if(m.type()==='error') logs.push('console: '+m.text()); });
await page.goto(url, { waitUntil:'domcontentloaded' });
await page.waitForTimeout(8000);
await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach(b=>b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
await page.waitForTimeout(1500);
const start = Date.now();
await page.evaluate((key) => { document.querySelector(`[data-stage-qa="${key}"]`)?.click(); }, action);
for (const [i, t] of times.split(',').map(Number).entries()) {
  const wait = t - (Date.now() - start); if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}-${i}-${t}.png` });
}
console.log(logs.slice(0, 12).join('\n'));
await browser.close();
