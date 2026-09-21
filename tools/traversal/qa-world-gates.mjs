import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const out = 'tools/traversal/qa/world-v1';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1463, height: 823 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://127.0.0.1:5176/?qa=1&traversal=t0');
await page.waitForSelector('[data-phase="DECISION"]');
await page.locator('[data-traversal-skip]').click();
await page.waitForFunction(() => document.querySelector('.traversal-t0')?.dataset.progress === '0.2');
await page.screenshot({ path: `${out}/ambush-gate.png` });
const hidden = await page.addStyleTag({ content: '.traversal-world__entities, .traversal-event-panel { visibility:hidden !important }' });
await page.screenshot({ path: `${out}/ambush-without-actors.png` });
await hidden.evaluate(e => e.remove());
await page.locator('[data-traversal-confirm]').click();
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/ambush-event.png` });
for (let i = 0; i < 12; i++) {
  const dialogue = page.locator('.dialogue__box:visible');
  if (await dialogue.count()) await dialogue.click();
  else break;
  await page.waitForTimeout(400);
}
console.log(await page.locator('button:visible').allTextContents());
await writeFile(`${out}/gates-errors.json`, JSON.stringify(errors));
await browser.close();
