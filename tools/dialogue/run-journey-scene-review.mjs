import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const output = resolve(root, 'docs/reports/dialogue-journey-scene-review');
const screenshots = resolve(output, 'screenshots');
const port = 5201;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', `${port}`, '--strictPort'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });
const sizes = [[1440, 810], [1366, 768], [620, 780], [390, 844]];

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited: ${serverLog}`);
    try { if ((await fetch(`${base}/tools/dialogue/journey-scene-proof.html`)).ok) return; } catch { /* startup */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Vite did not become ready: ${serverLog}`);
}

let browser;
try {
  await mkdir(screenshots, { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/tools/dialogue/journey-scene-proof.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.journeyProof));
  const catalog = await page.evaluate(() => window.journeyProof.catalog);
  const entries = [];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const id of catalog) {
      const kinds = id === 'AUDIENCE_ROAD_DEPARTURE_TABLEAU' ? ['departure', 'next'] : id === 'VALMIR_FORK_TABLEAU' ? ['next', 'branch'] : ['next'];
      for (const kind of kinds) {
        await page.evaluate(({ id, kind }) => window.journeyProof.show(id, kind), { id, kind });
        await page.waitForTimeout(80);
        const info = await page.evaluate(({ id, kind }) => {
          const box = (element) => element ? (() => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; })() : null;
          const panel = document.querySelector('.journey-overlay__panel');
          const panelBox = box(panel);
          const style = getComputedStyle(panel);
          const content = [...panel.querySelectorAll('.journey-overlay__eyebrow,.journey-overlay__title,.journey-overlay__caption,.journey-overlay__context,.journey-overlay__choice')];
          const choiceBoxes = [...panel.querySelectorAll('.journey-overlay__choice')].map(box);
          const clipped = content.filter((element) => {
            const r = element.getBoundingClientRect();
            return r.left < panelBox.x - 1 || r.right > panelBox.right + 1 || r.top < panelBox.y - 1 || r.bottom > panelBox.bottom + 1;
          }).map((element) => element.className);
          const clippedChoiceContent = [...panel.querySelectorAll('.journey-overlay__choice b,.journey-overlay__choice span,.journey-overlay__choice small')]
            .filter((element) => getComputedStyle(element).display !== 'none').filter((element) => {
              const child = element.getBoundingClientRect();
              const parent = element.closest('.journey-overlay__choice').getBoundingClientRect();
              return child.left < parent.left - 1 || child.right > parent.right + 1
                || child.top < parent.top - 1 || child.bottom > parent.bottom + 1;
            }).map((element) => element.className || element.tagName);
          const clippedCorners = [...panel.querySelectorAll('.campaign-ui-frame__corner')]
            .filter((element) => {
              const r = element.getBoundingClientRect();
              return r.left < panelBox.x - 1 || r.right > panelBox.right + 1
                || r.top < panelBox.y - 1 || r.bottom > panelBox.bottom + 1;
            }).map((element) => element.className);
          const alphaCache = window.__journeyAlphaCache ??= new Map();
          const alphaBounds = (image) => {
            const src = image.currentSrc || image.src;
            if (alphaCache.has(src)) return alphaCache.get(src);
            if (!image.naturalWidth || !image.naturalHeight) return null;
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.drawImage(image, 0, 0);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let left = canvas.width; let top = canvas.height; let right = -1; let bottom = -1;
            for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
              if (!pixels[(y * canvas.width + x) * 4 + 3]) continue;
              left = Math.min(left, x); top = Math.min(top, y);
              right = Math.max(right, x); bottom = Math.max(bottom, y);
            }
            const bounds = right < left ? null : [left, top, right + 1, bottom + 1];
            alphaCache.set(src, bounds);
            return bounds;
          };
          const actors = [...document.querySelectorAll('.narrative-cast__actor')].map((element) => {
            const r = element.getBoundingClientRect();
            const image = element.querySelector('img');
            const alpha = image ? alphaBounds(image) : null;
            const fittedScale = alpha ? Math.min(r.width / image.naturalWidth, r.height / image.naturalHeight) : 0;
            const imageLeft = r.x + (r.width - image.naturalWidth * fittedScale) / 2;
            const imageTop = r.bottom - image.naturalHeight * fittedScale;
            const bodyTop = alpha ? imageTop + alpha[1] * fittedScale : null;
            const bodyBottom = alpha ? imageTop + alpha[3] * fittedScale : null;
            return { id: element.dataset.actorId, x: r.x + r.width / 2, bottom: bodyBottom,
              visibleHeadY: bodyTop, visibleHeight: bodyTop === null ? 0 : Math.max(0, Math.min(innerHeight, bodyBottom) - Math.max(0, bodyTop)),
              scale: Number(element.style.getPropertyValue('--narrative-actor-scale')), placement: element.dataset.castPlacementMode, imageReady: Boolean(alpha) };
          });
          return { id, kind, viewport: { width: innerWidth, height: innerHeight }, placementMode: document.querySelector('.narrative-scene-surface')?.dataset.castPlacementMode,
            card: panelBox, cardOverflow: { x: style.overflowX, y: style.overflowY, scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight },
            clipped, clippedChoiceContent, clippedCorners, choiceBoxes, actors, hud: box(document.querySelector('.campaign-status-hud')),
            pageOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1 };
        }, { id, kind });
        const filename = `${width}x${height}-${id.toLowerCase()}-${kind}.jpg`;
        await page.screenshot({ path: resolve(screenshots, filename), type: 'jpeg', quality: 80 });
        entries.push({ ...info, screenshot: filename });
      }
    }
  }
  const failures = entries.flatMap((entry) => {
    const list = [];
    const overflow = entry.cardOverflow;
    if (overflow.x === 'auto' || overflow.x === 'scroll' || overflow.y === 'auto' || overflow.y === 'scroll') list.push('native-card-scroll');
    if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.scrollHeight > overflow.clientHeight + 1) list.push('card-content-overflow');
    if (entry.clipped.length) list.push('clipped-content');
    if (entry.clippedChoiceContent.length || entry.clippedCorners.length) list.push('clipped-choice-or-ornament');
    if (entry.choiceBoxes.some((box) => box.x < -1 || box.right > entry.viewport.width + 1 || box.y < -1 || box.bottom > entry.viewport.height + 1)) list.push('offscreen-choice');
    if (entry.pageOverflow) list.push('page-overflow');
    if (entry.placementMode !== 'SCENE_INTEGRATED' || entry.actors.some((actor) => !actor.imageReady || actor.placement !== 'SCENE_INTEGRATED')) list.push('scene-cast');
    if (entry.actors.some((actor) => actor.visibleHeadY < 0 || actor.visibleHeadY >= entry.viewport.height || actor.visibleHeight < 50)) list.push('actor-visibility');
    return list.map((reason) => `${entry.id}:${entry.kind}:${entry.viewport.width}x${entry.viewport.height}:${reason}`);
  });
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Journey scene review</title><style>body{margin:0;padding:24px;background:#14212e;color:#f4e8cd;font:14px system-ui}h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}figure{margin:0;padding:8px;background:#07131f;border:1px solid #896f43}img{display:block;width:100%;height:auto}figcaption{padding:7px 0}</style></head><body><h1>Journey scene review</h1><p>${entries.length} captures · ${failures.length} overflow/asset failures · <a href="measurements.json">Measurements</a></p><div class="grid">${entries.map((entry) => `<figure><a href="screenshots/${entry.screenshot}"><img src="screenshots/${entry.screenshot}" loading="lazy"></a><figcaption>${entry.id} · ${entry.kind} · ${entry.viewport.width}×${entry.viewport.height}</figcaption></figure>`).join('')}</div></body></html>`;
  await writeFile(resolve(output, 'measurements.json'), `${JSON.stringify({ entries, failures, pageErrors: errors }, null, 2)}\n`);
  await writeFile(resolve(output, 'gallery.html'), html);
  console.log(JSON.stringify({ tableaux: catalog.length, captures: entries.length, failures, pageErrors: errors, maxCardWidthOverflow: Math.max(...entries.map((entry) => entry.cardOverflow.scrollWidth - entry.cardOverflow.clientWidth)), maxCardHeightOverflow: Math.max(...entries.map((entry) => entry.cardOverflow.scrollHeight - entry.cardOverflow.clientHeight)) }, null, 2));
  if (failures.length || errors.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
