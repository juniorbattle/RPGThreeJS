// Measures how much the decor of a resting arena shimmers on the real GPU: every frame of the canvas is read back while
// the camera breathes, and a pixel counts as a flip when its brightness reverses by more than THRESHOLD within two frames.
// Writes a heat map of where the flips sit. Needs the dev server on 5173.
// Usage: node tools/combat-arena/decor-stability.mjs <label> [encounter label, as the QA lab shows it]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const label = process.argv[2] ?? 'run';
const encounter = process.argv[3] ?? 'Patrouille Serpent';
const FRAMES = 240, THRESHOLD = 10;
const OUT = 'tmp/decor-stability';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--mute-audio'] });
const [width, height] = (process.env.DECOR_VIEWPORT ?? '1366x768').split('x').map(Number);
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: Number(process.env.DECOR_DPR ?? 1) });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/?qa=1&stageqa=1', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.title-screen [data-action="qa"]', { timeout: 30000 });
await page.waitForTimeout(800);
await page.click('.title-screen [data-action="qa"]');
await page.waitForTimeout(500);
await page.locator('[class*="qa-lab__encounter"]', { hasText: encounter }).first().click();
let frame = null;
for (let i = 0; i < 900 && !frame; i++) {
  frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat')) ?? null;
  if (!frame && await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
}
await frame.waitForSelector('[data-qa="prepare"]', { timeout: 120000, state: 'attached' });
await page.waitForTimeout(1500);
for (const selector of ['#tutorial:not(.hidden) [data-action="skip"]', '#boss-tutorial:not(.hidden) [data-action="start"]']) if (await frame.locator(selector).count()) await frame.locator(selector).first().click({ force: true });
await frame.locator('[data-qa="prepare"]').click({ force: true });
await page.waitForTimeout(4000);
const result = await frame.evaluate(async ({ FRAMES, THRESHOLD }) => {
  const renderer = window.__COMBAT_RENDERER, gl = renderer.getContext(), canvas = renderer.domElement;
  const w = canvas.width, h = canvas.height, data = new Uint8Array(w * h * 4);
  const luma = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const out = new Float32Array(w * h);
    for (let i = 0; i < out.length; i++) out[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    return out;
  };
  // frame pace first, undisturbed by the read-back below
  const times = await new Promise((resolve) => {
    const out = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      out.push(now - last);
      last = now;
      if (out.length > 300) resolve(out); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  // one whole frame's draws: the composer's passes reset the counters otherwise
  renderer.info.autoReset = false;
  await new Promise(requestAnimationFrame);
  renderer.info.reset();
  await new Promise(requestAnimationFrame);
  const perFrame = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  renderer.info.autoReset = true;
  const flips = new Uint16Array(w * h), steps = new Uint16Array(w * h);
  let previous = null, older = null, frames = 0;
  await new Promise((resolve) => {
    const step = () => {
      const current = luma();
      if (older) for (let i = 0; i < current.length; i++) {
        const a = previous[i] - older[i], b = current[i] - previous[i];
        if (Math.abs(b) > THRESHOLD) steps[i]++;
        if (Math.abs(a) > THRESHOLD && Math.abs(b) > THRESHOLD && a * b < 0) flips[i]++;
      }
      older = previous; previous = current;
      if (++frames >= FRAMES) resolve(); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  times.shift();
  // the arch window, and the whole picture without the bottom row of the UI
  const box = (map, x0, y0, x1, y1) => {
    const s = canvas.width / innerWidth;
    let total = 0, count = 0;
    for (let y = Math.round(y0 * s); y < Math.round(y1 * s); y++) for (let x = Math.round(x0 * s); x < Math.round(x1 * s); x++) { total += map[(h - 1 - y) * w + x]; count++; }
    return +(1000 * total / count / (FRAMES - 2)).toFixed(3);
  };
  const paint = (map, gain) => {
    const heat = document.createElement('canvas');
    heat.width = w; heat.height = h;
    const c = heat.getContext('2d'), image = c.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = Math.min(255, map[(h - 1 - y) * w + x] * gain), o = (y * w + x) * 4;
      image.data[o] = v; image.data[o + 1] = v * 0.45; image.data[o + 2] = 0; image.data[o + 3] = 255;
    }
    c.putImageData(image, 0, 0);
    return heat.toDataURL('image/png');
  };
  const sorted = [...times].sort((a, b) => a - b);
  return {
    size: [w, h],
    gpu: (() => { const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'masked'; })(),
    arena: window.G?.arena?.describe?.() ?? null,
    flipsPerKiloPixelFrame: { arch: box(flips, 350, 90, 840, 300), scene: box(flips, 0, 0, 1366, 660) },
    stepsPerKiloPixelFrame: { arch: box(steps, 350, 90, 840, 300), scene: box(steps, 0, 0, 1366, 660) },
    frameMs: { median: +sorted[Math.floor(sorted.length / 2)].toFixed(1), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1) },
    perFrame,
    heat: paint(flips, 24),
    stepHeat: paint(steps, 24),
  };
}, { FRAMES, THRESHOLD });
writeFileSync(`${OUT}/${label}-heat.png`, Buffer.from(result.heat.split(',')[1], 'base64'));
writeFileSync(`${OUT}/${label}-steps.png`, Buffer.from(result.stepHeat.split(',')[1], 'base64'));
delete result.heat;
delete result.stepHeat;
await page.screenshot({ path: `${OUT}/${label}.png` });
console.log(JSON.stringify({ label, ...result, errors }));
await browser.close();
