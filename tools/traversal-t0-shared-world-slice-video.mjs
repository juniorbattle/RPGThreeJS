/** Uncut real-time Route 1 -> CP1 -> Route 2 clip for visual review. */
import { copyFile, mkdir, unlink, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-t0-route-checkpoints-1-shared-world-browser';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5213, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 960, height: 540 } } });
const page = await context.newPage();
const qa = { reachedRoute2: false, sawCheckpoint: false, sawFocusBlack: false,
  sawReturnBlack: false, sawCanonicalCombat: false, laneMoves: [], errors: [] };
page.on('pageerror', error => qa.errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:5213/?qa=1&traversal=t0');
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  const started = Date.now();
  while (Date.now() - started < 65000) {
    await page.waitForTimeout(55);
    const state = await page.evaluate(() => {
      const root = document.querySelector('.traversal-t0');
      const global = document.querySelector('.scene-transition--traversal');
      return { segment: root?.dataset.routeSegment ?? null,
        progress: Number(root?.dataset.routeProgress ?? 0), view: root?.dataset.view ?? null,
        routeWorld: root?.dataset.routeWorld ?? null, lane: Number(root?.dataset.lane ?? 0),
        transition: root?.dataset.transition ?? null,
        cover: Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity),
        globalCover: global ? Number(getComputedStyle(global).opacity) : 0,
        exits: Number(root?.dataset.checkpointExits ?? 0),
        dialogue: Boolean(document.querySelector('.dialogue')),
        combat: Boolean(document.querySelector('.combat-frame')) };
    });
    if (state.segment === 'route-1' && state.view === 'route' && state.progress > .25 && !qa.laneMoves.length) {
      await page.locator('[data-traversal-lane="1"]').click();
      qa.laneMoves.push({ lane: 1, progress: state.progress });
    }
    if (state.segment === 'route-1' && state.view === 'route' && state.progress > .53 && qa.laneMoves.length === 1) {
      await page.locator('[data-traversal-lane="0"]').click();
      qa.laneMoves.push({ lane: 0, progress: state.progress });
    }
    if (state.view === 'checkpoint') qa.sawCheckpoint = true;
    if (state.transition === 'focus' && state.cover >= .999) qa.sawFocusBlack = true;
    if (state.segment === 'route-2' && state.exits === 1 && state.globalCover >= .999) qa.sawReturnBlack = true;
    if (state.combat) qa.sawCanonicalCombat = true;
    if (state.segment === 'route-2' && state.view === 'route' && state.routeWorld === 'shared'
      && state.progress > .24) { qa.reachedRoute2 = true; break; }
    if (state.combat) {
      const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
      await frame?.evaluate(() => {
        for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
          const button = document.querySelector(selector);
          if (button && button.getBoundingClientRect().width > 0 && !button.disabled) { button.click(); return; }
        }
      }).catch(() => {});
    } else if (state.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
  }
} finally {
  await context.close();
  const path = await page.video().path();
  await copyFile(path, `${output}/shared-world-route-1-cp1-route-2.webm`);
  await unlink(path);
  await browser.close();
  await server.close();
  await writeFile(`${output}/clip-qa.json`, `${JSON.stringify(qa, null, 2)}\n`);
}
console.log(JSON.stringify(qa));
if (!qa.reachedRoute2 || !qa.sawCheckpoint || !qa.sawFocusBlack || !qa.sawReturnBlack
  || !qa.sawCanonicalCombat || qa.laneMoves.length !== 2 || qa.errors.length)
  throw new Error('Shared-world motion clip missed a required transition or lane move.');
