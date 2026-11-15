// Measures the dead time at the start of every living tableau and the gaps inside its shots (OD-2026-11-14-A).
// Usage, from the repository root with the dev server running: node tools/living-openings/measure.mjs [out.json]
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const base = process.env.BASE ?? 'http://localhost:5186';
const out = process.argv[2] ?? 'tmp/living-openings/measure.json';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`${base}/tools/living-openings/probe.html`);
await page.waitForFunction(() => window.probeReady === true, null, { timeout: 60000 });
const ids = await page.evaluate(() => window.probe.ALL_IDS());
const result = { opening: await page.evaluate(() => window.probe.measureOpening()), scripts: {}, reduced: {}, labels: {} };
for (const id of ids) {
  result.labels[id] = await page.evaluate((id) => window.probe.labelOf(id), id);
  if (id === 'opening') continue;
  result.scripts[id] = await page.evaluate((id) => window.probe.measureScript(id, false), id);
  result.reduced[id] = await page.evaluate((id) => window.probe.measureScript(id, true), id);
  process.stdout.write('.');
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result, null, 1));
console.log('\nwrote', out);
await browser.close();
