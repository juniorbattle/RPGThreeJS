import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'operator-review.html')).href, { waitUntil: 'load' });
await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
await page.screenshot({ path: path.resolve(here, '..', 'composites', 'operator-review-board.png'), fullPage: true, type: 'png' });
const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, images: document.images.length }));
console.log(JSON.stringify(metrics));
await browser.close();
