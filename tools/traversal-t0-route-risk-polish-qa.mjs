/** Focused live browser evidence for the four Route Risk art-polish variants. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-t0-route-risk-art-1-browser/polish';
const base = 'http://127.0.0.1:5217/?qa=1&traversal=t0&traversalRisk=1';
const desktop = { width: 1440, height: 810 };
const mobile = { width: 390, height: 844 };
const targets = new Map([
  ['t0:r3:block-2', { name: 'route-3-boulder-b', visual: 'boulder-b' }],
  ['t0:r4:block-1', { name: 'route-4-boulder-a', visual: 'boulder-a' }],
  ['t0:r5b:block-1', { name: 'route-5b-roadblock-a', visual: 'roadblock-a' }],
  ['t0:r5b:block-3', { name: 'route-5b-roadblock-b', visual: 'roadblock-b' }],
]);

await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5217, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const captures = [];
const errors = [];
const seen = new Set();
const visitedSegments = new Set();
let finalState = null;

async function state(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    if (!root) return null;
    const vehicle = root.querySelector('.traversal-vehicle')?.getBoundingClientRect();
    const marks = [...root.querySelectorAll('[data-risk-hazard]:not([hidden])')].map(mark => {
      const rect = mark.getBoundingClientRect();
      const img = mark.querySelector('img');
      return {
        id: mark.dataset.riskHazard, visual: mark.dataset.riskVisual,
        lane: Number(mark.dataset.riskLane), progress01: Number(mark.dataset.riskProgress),
        src: img?.getAttribute('src'), imageLoaded: Boolean(img?.complete && img.naturalWidth),
        naturalWidth: img?.naturalWidth ?? 0, naturalHeight: img?.naturalHeight ?? 0,
        x: rect.x + rect.width / 2, width: rect.width, topY: rect.top, groundY: rect.bottom,
      };
    });
    const panel = root.querySelector('[data-traversal-event-panel]');
    return {
      atMs: performance.now(), segment: root.dataset.routeSegment, phase: root.dataset.phase,
      view: root.dataset.view, progress: Number(root.dataset.routeProgress),
      riskEnabled: root.dataset.riskEnabled, routeWorld: root.dataset.routeWorld,
      transition: root.dataset.transition ?? null,
      globalCover: document.body.classList.contains('scene-transition--locked'),
      caravanCount: root.querySelectorAll('.traversal-vehicle').length,
      vehicleWidth: vehicle?.width ?? 0, vehicleGroundY: vehicle?.bottom ?? 0,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      forestLoaded: [...root.querySelectorAll('.traversal-world__route-sections [data-world-section]:not([hidden]) .traversal-world-section__painting > img')]
        .some(img => img.getAttribute('src') === '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png' && img.naturalWidth > 0),
      marks, fork: (() => { const el = document.querySelector('.traversal-fork-overlay');
        return Boolean(el && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden'); })(),
      optionalDecision: root.dataset.phase === 'DECISION' && !panel?.hidden
        && panel?.dataset.category === 'OPTIONAL_EVENT',
      combat: Boolean(document.querySelector('.combat-frame')?.getBoundingClientRect().width),
      dialogue: Boolean(document.querySelector('.dialogue')?.getBoundingClientRect().width),
      cinematic: Boolean(document.querySelector('.cinematic-overlay')?.getBoundingClientRect().width),
    };
  });
}

async function capture(page, target, viewport, id) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(120);
  await page.evaluate(() => document.fonts.ready);
  const s = await state(page);
  const mark = s?.marks.find(item => item.id === id);
  if (!mark || !mark.imageLoaded || mark.visual !== target.visual)
    throw new Error(`${target.name} missing at ${viewport.width}: ${JSON.stringify(s)}`);
  const file = `${target.name}-${viewport.width}.png`;
  await page.screenshot({ path: `${output}/${file}` });
  const oppositeCenterY = viewport.height * (mark.lane === 0 ? .81 : .65);
  const clearance = mark.lane === 0 ? oppositeCenterY - mark.groundY : mark.topY - oppositeCenterY;
  const groundTargetY = viewport.height * (mark.lane === 0 ? .65 : .81);
  captures.push({ file, hazardId: id, viewport: `${viewport.width}x${viewport.height}`,
    ...s, mark, geometry: {
      obstacleToCaravanWidthRatio: mark.width / s.vehicleWidth,
      oppositeLaneClearancePx: clearance,
      groundAlignmentErrorPx: Math.abs(mark.groundY - groundTargetY),
    } });
  console.log(file, target.visual, `ratio=${(mark.width / s.vehicleWidth).toFixed(3)}`,
    `clearance=${clearance.toFixed(2)}`, `ground=${Math.abs(mark.groundY - groundTargetY).toFixed(2)}`);
}

async function playCombat(page) {
  const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
  if (!frame) return;
  await frame.evaluate(() => {
    for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
      const button = document.querySelector(selector);
      if (button && button.getBoundingClientRect().width > 0 && !button.disabled) { button.click(); return; }
    }
  }).catch(() => {});
}

try {
  const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('/assets/'))
      errors.push(`asset ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (request.url().includes('/assets/')) errors.push(`asset request failed: ${request.url()}`);
  });
  await page.goto(base);
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  page.setDefaultTimeout(1000);
  const startedAt = Date.now();
  for (let tick = 0; tick < 4400; tick++) {
    await page.waitForTimeout(80);
    const s = await state(page);
    if (!s) throw new Error('Traversal scene disappeared before focused evidence completed.');
    finalState = s;
    if (!visitedSegments.has(s.segment)) { visitedSegments.add(s.segment); console.log(s.segment); }
    for (const mark of s.marks) {
      const target = targets.get(mark.id);
      if (!target || seen.has(mark.id) || s.view !== 'route' || s.transition || s.globalCover
        || !mark.imageLoaded || mark.x < desktop.width * .2 || mark.x > desktop.width * .78) continue;
      await capture(page, target, desktop, mark.id);
      await capture(page, target, mobile, mark.id);
      await page.setViewportSize(desktop);
      seen.add(mark.id);
    }
    if (seen.size === targets.size) break;
    if (s.segment === 'route-6') break;
    if (s.fork && !s.transition) {
      await page.locator('[data-traversal-fork-choice="lion-first-trial-combat"]').click().catch(() => {});
    } else if (s.optionalDecision && !s.transition) {
      await page.locator('[data-traversal-skip]').click().catch(() => {});
    } else if (s.combat) {
      await playCombat(page);
    } else if (s.cinematic) {
      await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    } else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    if (Date.now() - startedAt > 240000) break;
  }
  await context.close();
} finally {
  await browser.close();
  await server.close();
  const missing = [...targets.keys()].filter(id => !seen.has(id));
  const geometry = captures.map(capture => capture.geometry);
  const qa = {
    task: 'TRAVERSAL-T0-ROUTE-RISK-ART-1 OPERATOR VISUAL POLISH', url: base,
    method: 'DEV-only T0 QA entry, real-time route motion, real UI interactions, focused screenshots',
    targetHazards: [...targets.keys()], visitedSegments: [...visitedSegments],
    captures, missing, errors, finalState,
    maxObstacleToCaravanWidthRatio: Math.max(0, ...geometry.map(item => item.obstacleToCaravanWidthRatio)),
    minOppositeLaneClearancePx: Math.min(Infinity, ...geometry.map(item => item.oppositeLaneClearancePx)),
    maxGroundAlignmentErrorPx: Math.max(0, ...geometry.map(item => item.groundAlignmentErrorPx)),
    failures: [
      ...missing.map(id => `Missing ${id}`),
      ...captures.flatMap(capture => [
        ...(!capture.riskEnabled || capture.routeWorld !== 'shared' || !capture.forestLoaded || capture.caravanCount !== 1
          ? [`${capture.file}: route world or risk scene invalid`] : []),
        ...(capture.overflowPx > 0 ? [`${capture.file}: horizontal overflow`] : []),
        ...(capture.geometry.obstacleToCaravanWidthRatio > .9 ? [`${capture.file}: obstacle too wide`] : []),
        ...(capture.viewport.startsWith('390x') && capture.geometry.oppositeLaneClearancePx < 24
          ? [`${capture.file}: opposite lane clearance under 24px`] : []),
        ...(capture.geometry.groundAlignmentErrorPx > 8 ? [`${capture.file}: ground alignment over 8px`] : []),
      ]),
      ...errors,
    ],
  };
  await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(qa, null, 2)}\n`);
  const cards = captures.map(capture => `<figure><img src="${capture.file}" loading="lazy"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('');
  await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>Route Risk polish evidence</title><style>body{margin:0;background:#08131d;color:#e8dec5;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}figure{margin:0}img{width:100%;border:1px solid #866f4b}figcaption{padding:8px}</style><h1>Route Risk art polish</h1><p><a href="browser-qa.json">Measured QA</a> · <a href="../index.html">Prior full gallery</a></p><main>${cards}</main>`);
  console.log(JSON.stringify({ captures: captures.length, missing, errors,
    maxRatio: qa.maxObstacleToCaravanWidthRatio,
    minClearance390: Math.min(Infinity, ...captures.filter(c => c.viewport.startsWith('390x')).map(c => c.geometry.oppositeLaneClearancePx)),
    maxGroundError: qa.maxGroundAlignmentErrorPx, failures: qa.failures }, null, 2));
  if (qa.failures.length) throw new Error('Focused Route Risk polish QA failed.');
}
