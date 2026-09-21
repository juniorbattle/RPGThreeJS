import { chromium } from 'playwright';
import { mkdir, rename, writeFile } from 'node:fs/promises';
const width = Number(process.argv[2] ?? 1463);
const height = width === 960 ? 640 : 823;
const out = `tools/traversal/qa/world-v1/final-merchant-${width}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: out, size: { width, height } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
await page.goto('http://127.0.0.1:5176/?qa=1&traversal=t0');
await page.waitForSelector('[data-phase="RUNNING"]:not([data-transition])');
await page.screenshot({ path: `${out}/merchant-approach.png` });
const sample = () => page.evaluate(() => {
  const scene = document.querySelector('.traversal-t0');
  const section = document.querySelector('[data-world-section="merchant-halt"]');
  const npc = document.querySelector('[data-traversal-beat="t0:npc:roadside-merchant"]');
  return { progress: Number(scene.dataset.progress), sectionX: section.getBoundingClientRect().x,
    npcX: npc.getBoundingClientRect().x, roadTransform: document.querySelector('.traversal-world__sections').style.transform };
});
const first = await sample();
await page.waitForTimeout(2200);
const second = await sample();
await page.screenshot({ path: `${out}/merchant-lead-in.png` });
await page.waitForSelector('[data-phase="DECISION"]');
await page.screenshot({ path: `${out}/merchant-gate.png` });
const hide = await page.addStyleTag({ content: '.traversal-world__entities, .traversal-event-panel { visibility: hidden !important; }' });
await page.screenshot({ path: `${out}/merchant-without-actors.png` });
await hide.evaluate(element => element.remove());
await page.locator('[data-traversal-confirm]').click();
await page.waitForSelector('[data-phase="LOCAL_INTERACTION"]:not([data-transition])');
await page.locator('[data-traversal-confirm]').click();
await page.waitForSelector('[data-phase="RUNNING"]:not([data-transition])');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/merchant-after-interaction.png` });
const retained = await page.locator('[data-world-section="merchant-halt"]').isVisible();
await writeFile(`${out}/merchant-browser.json`, JSON.stringify({ first, second,
  sameCameraDeltaError: (second.sectionX - first.sectionX) - (second.npcX - first.npcX),
  locationRetainedAfterConsumption: retained, errors }, null, 2));
await context.close();
await rename(await page.video().path(), `${out}/merchant-motion.webm`);
await browser.close();
