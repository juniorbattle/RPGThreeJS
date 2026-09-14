import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(here, '..', 'composites');
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const surfaces = ['travel', 'tableau', 'strategic', 'stage'];
const sizes = [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }];
const results = [];

for (const size of sizes) {
  for (const surface of surfaces) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    const url = `${pathToFileURL(path.join(here, 'surface-preview.html')).href}?surface=${surface}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
    const metrics = await page.evaluate(() => {
      const viewport = { width: innerWidth, height: innerHeight };
      const boxes = [...document.querySelectorAll('[data-ui]')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: element.className, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
      const outside = boxes.filter((box) => box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height);
      const overlaps = [];
      for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], b = boxes[j];
        const hit = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        if (hit) overlaps.push([a.className, b.className]);
      }
      return {
        viewport,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        loadedImages: [...document.images].map((image) => ({ src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight })),
        uiBoxes: boxes,
        outside,
        overlaps,
      };
    });
    const filename = `${size.width}x${size.height}-${surface}.png`;
    await page.screenshot({ path: path.join(output, filename), type: 'png' });
    results.push({ surface, size, filename, ...metrics, pass: metrics.outside.length === 0 && metrics.overlaps.length === 0 && metrics.scrollWidth === size.width && metrics.scrollHeight === size.height });
    await page.close();
  }
}

await browser.close();
await writeFile(path.join(here, 'composite-results.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(results.map(({ surface, size, filename, pass, outside, overlaps }) => ({ surface, size, filename, pass, outside, overlaps })), null, 2));
