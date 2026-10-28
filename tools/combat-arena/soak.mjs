// Soak test: auto-deploys, then ends player turns repeatedly so the enemy AI
// acts through the new camera/FX path; reports page errors and stuck states.
// usage: node tools/combat-arena/soak.mjs <url> <seconds> [outDir]
import { chromium } from 'playwright';
const [,, url, seconds = '60', out = ''] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
await page.evaluate(() => { document.querySelectorAll('#tutorial button, #boss-tutorial button').forEach((b) => b.click()); document.querySelector('[data-qa=prepare]')?.click(); });
const start = Date.now();
let turns = 0, shots = 0, lastBusySince = 0;
while (Date.now() - start < +seconds * 1000) {
  await page.waitForTimeout(1200);
  const state = await page.evaluate(() => ({ busy: G.busy, over: G.over, mode: G.mode, team: G.active?.team, spotlight: Boolean(G.spotlight), round: G.round, alive: G.units.filter((u) => u.alive).length }));
  if (state.over) break;
  if (state.busy) { lastBusySince ||= Date.now(); if (Date.now() - lastBusySince > 15000) { errors.push('stuck busy >15s ' + JSON.stringify(state)); break; } continue; }
  lastBusySince = 0;
  if (state.team === 'player' && !state.busy) {
    // player: try the first attack on a foe if possible, otherwise end the turn
    await page.keyboard.press('Enter');
    turns++;
    if (out && shots < 4 && turns % 3 === 0) await page.screenshot({ path: `${out}/soak-${shots++}.png` });
  }
}
const final = await page.evaluate(() => ({ round: G.round, over: G.over, alive: G.units.filter((u) => u.alive).length, spotlight: Boolean(G.spotlight), camKind: null, fx: window.__COMBAT_DIAGNOSTICS }));
console.log(JSON.stringify({ turns, final, errors: errors.slice(0, 10) }, null, 1));
await browser.close();
