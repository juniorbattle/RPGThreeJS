// Traces AI turns: active unit, busy flag, spotlight, fps; flags real hangs.
import { chromium } from 'playwright';
const [,, url, seconds = '90'] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await page.evaluate(() => {
  document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click();
  window.__frames = 0; const tick = () => { window.__frames++; requestAnimationFrame(tick); }; tick();
  window.__log = []; const orig = console.log; console.log = (...a) => { if (String(a[0]).includes('[VFX-QA]')) return; orig(...a); };
});
const start = Date.now(); let lastFrames = 0, lastKey = '', sameFor = 0;
while (Date.now() - start < +seconds * 1000) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => ({ f: window.__frames, busy: G.busy, active: G.active?.name, team: G.active?.team, spot: G.spotlight?.kind ?? null, round: G.round, over: G.over, hp: G.units.map((u) => u.hp).join(',') }));
  const fps = ((s.f - lastFrames) / 2).toFixed(1); lastFrames = s.f;
  const key = JSON.stringify([s.busy, s.active, s.spot, s.round, s.hp]);
  sameFor = key === lastKey ? sameFor + 2 : 0; lastKey = key;
  console.log(`${((Date.now() - start) / 1000).toFixed(0)}s fps=${fps} busy=${s.busy} active=${s.active}(${s.team}) spot=${s.spot} round=${s.round}${sameFor >= 10 ? '  <-- unchanged ' + sameFor + 's' : ''}`);
  if (s.over) break;
  if (s.team === 'player' && !s.busy) await page.keyboard.press('Enter');
}
console.log('errors', JSON.stringify(errors.slice(0, 5)));
await browser.close();
