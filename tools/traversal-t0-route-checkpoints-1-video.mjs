/** Optional review clip: real Route 1 -> CP1 -> Route 2 via DEV QA combat victory. */
import { copyFile, mkdir, unlink } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-t0-route-checkpoints-1-browser';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5205, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 960, height: 540 } } });
const page = await context.newPage();
let reachedRoute2 = false;
try {
  await page.goto('http://127.0.0.1:5205/?qa=1&traversal=t0');
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  const started = Date.now();
  while (Date.now() - started < 50000) {
    await page.waitForTimeout(220);
    const scene = await page.evaluate(() => {
      const root = document.querySelector('.traversal-t0');
      return { segment: root?.dataset.routeSegment ?? null,
        progress: Number(root?.dataset.routeProgress ?? 0),
        dialogue: Boolean(document.querySelector('.dialogue')),
        combat: Boolean(document.querySelector('.combat-frame')) };
    });
    if (scene.segment === 'route-2' && scene.progress > .15) {
      reachedRoute2 = true;
      break;
    }
    if (scene.combat) {
      const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
      await frame?.evaluate(() => {
        for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
          const button = document.querySelector(selector);
          if (button && button.getBoundingClientRect().width > 0 && !button.disabled) { button.click(); return; }
        }
      }).catch(() => {});
    } else if (scene.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
  }
} finally {
  await context.close();
  const path = await page.video().path();
  await copyFile(path, `${output}/route-checkpoint-route.webm`);
  await unlink(path);
  await browser.close();
  await server.close();
}
if (!reachedRoute2) throw new Error('Review clip did not reach Route 2 after CP1.');
console.log(`${output}/route-checkpoint-route.webm`);
