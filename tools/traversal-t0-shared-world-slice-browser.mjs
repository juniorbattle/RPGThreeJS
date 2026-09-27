/** Real-time Route 1 -> CP1 -> Route 2 visual review. DEV entry and existing combat QA only. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-t0-route-checkpoints-1-shared-world-browser';
const viewport = { width: 1440, height: 810 };
const referenceForest = '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png';
const expected = [
  '01-route-1-early', '02-route-1-mid', '03-route-1-rush',
  '04-route-1-upper-lane', '05-route-1-lower-lane', '06-route-1-before-transition',
  '07-black-midpoint', '08-cp1-immediately-after-reveal', '09-cp1-stable',
  '10-cp1-last-checkpoint-frame', '10-cp1-canonical-before-return',
  '11-return-black-midpoint', '12-route-2-immediately-after-reveal',
  '13-route-2-resumed-movement', '14-route-1-620', '15-route-1-390',
  '16-cp1-390', '17-route-2-390',
];
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5212, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
const qa = { task: 'TRAVERSAL-T0-ROUTE-CHECKPOINTS-1-SHARED-WORLD-SLICE',
  referenceForest, expected, captures: [], blackFrames: [], laneMoves: [],
  errors: [], frameIssues: [], route1: {}, route2: {}, checkpoint: {},
  missing: [], overflow: [], unreachableControls: [] };
const captured = new Set();
page.on('pageerror', error => qa.errors.push(error.message));
page.on('requestfailed', request => qa.errors.push(`${request.url()}: ${request.failure()?.errorText}`));

async function snapshot() {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    const global = document.querySelector('.scene-transition--traversal');
    const get = selector => root?.querySelector(selector);
    const visible = selector => {
      const element = get(selector);
      return Boolean(element && getComputedStyle(element).visibility !== 'hidden'
        && getComputedStyle(element).display !== 'none');
    };
    const genericSections = [...(get('.traversal-world__route-sections')?.querySelectorAll('[data-world-section]') ?? [])];
    const visibleGeneric = genericSections.filter(section => !section.hidden);
    const controls = [...document.querySelectorAll('[data-traversal-lane]')].map(button => {
      const r = button.getBoundingClientRect();
      return { width: r.width, height: r.height, reachable: r.width > 0 && r.height > 0
        && r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight };
    });
    return { atMs: performance.now(), node: window.__sliceApp?.state?.run?.currentNodeId ?? null,
      segment: root?.dataset.routeSegment ?? null, view: root?.dataset.view ?? null,
      routeWorld: root?.dataset.routeWorld ?? null, phase: root?.dataset.phase ?? null,
      progress: Number(root?.dataset.routeProgress ?? 0), speed: Number(root?.dataset.routeSpeed ?? 0),
      lane: Number(root?.dataset.lane ?? 0), transition: root?.dataset.transition ?? null,
      cover: Number(getComputedStyle(get('.traversal-transition')).opacity),
      globalCover: global ? Number(getComputedStyle(global).opacity) : 0,
      sceneCount: document.querySelectorAll('.traversal-t0').length,
      sharedWorldVisible: visible('.traversal-world__route-sections'),
      checkpointWorldVisible: visible('.traversal-world__sections'),
      legacyRouteSceneryVisible: visible('.traversal-route-loop__road'),
      genericSectionCount: genericSections.length,
      visibleGenericImages: visibleGeneric.map(section => {
        const img = section.querySelector('.traversal-world-section__painting > img');
        return { src: img?.getAttribute('src'), loaded: Boolean(img?.naturalWidth),
          props: section.querySelectorAll('[data-location-prop]').length };
      }),
      caravanCount: root?.querySelectorAll('.traversal-vehicle').length ?? 0,
      entries: Number(root?.dataset.checkpointEntries ?? 0),
      exits: Number(root?.dataset.checkpointExits ?? 0),
      combat: Boolean(document.querySelector('.combat-frame')),
      dialogue: Boolean(document.querySelector('.dialogue')),
      overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), controls,
    };
  });
}

async function blackPixelRatio(bytes) {
  return page.evaluate(async encoded => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let black = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0) black++;
    return black / (pixels.length / 4);
  }, bytes.toString('base64'));
}

async function capture(name, size = viewport) {
  if (captured.has(name)) return;
  captured.add(name);
  if (size.width !== page.viewportSize().width) {
    await page.setViewportSize(size);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => document.fonts.ready);
  const state = await snapshot();
  const file = `${name}.png`;
  const bytes = await page.screenshot({ path: `${output}/${file}` });
  qa.captures.push({ file, viewport: `${size.width}x${size.height}`, state });
  if (name.includes('black-midpoint')) qa.blackFrames.push({ file, blackPixelRatio: await blackPixelRatio(bytes) });
  console.log(name, `${state.segment}/${state.view}`, state.progress.toFixed(3));
  if (size.width !== viewport.width) await page.setViewportSize(viewport);
}

async function playCombat() {
  const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
  await frame?.evaluate(() => {
    for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
      const button = document.querySelector(selector);
      if (button && button.getBoundingClientRect().width > 0 && !button.disabled) { button.click(); return; }
    }
  }).catch(() => {});
}

try {
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__sliceApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5212/?qa=1&traversal=t0');
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  await page.evaluate(() => {
    window.__sliceFrameIssues = [];
    let lastView = null;
    const inspect = () => {
      const root = document.querySelector('.traversal-t0');
      if (root) {
        const view = root.dataset.view;
        const segment = root.dataset.routeSegment;
        const shared = root.querySelector('.traversal-world__route-sections');
        const checkpoint = root.querySelector('.traversal-world__sections');
        const sharedVisible = getComputedStyle(shared).visibility !== 'hidden';
        const checkpointVisible = getComputedStyle(checkpoint).visibility !== 'hidden';
        const cover = Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity);
        const global = document.querySelector('.scene-transition--traversal');
        const globalCover = global ? Number(getComputedStyle(global).opacity) : 0;
        if (['route-1', 'route-2'].includes(segment)) {
          if (view === 'route' && (!sharedVisible || checkpointVisible))
            window.__sliceFrameIssues.push('route surface exclusivity');
          if (view === 'checkpoint' && (sharedVisible || !checkpointVisible))
            window.__sliceFrameIssues.push('checkpoint surface exclusivity');
          if (lastView && view !== lastView && cover < .999 && globalCover < .999)
            window.__sliceFrameIssues.push(`uncovered ${lastView} -> ${view} swap`);
          if (root.querySelectorAll('.traversal-vehicle').length !== 1)
            window.__sliceFrameIssues.push('caravan count');
          if (view === 'route' && cover < .999 && globalCover < .999) {
            const sections = [...shared.querySelectorAll('[data-world-section]:not([hidden])')];
            if (!sections.length || sections.some(section => {
              const image = section.querySelector('.traversal-world-section__painting > img');
              return image?.getAttribute('src') !== '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png'
                || !image?.naturalWidth || section.querySelector('[data-location-prop]');
            })) window.__sliceFrameIssues.push('generic forest art incomplete');
          }
        }
        lastView = view;
      }
      requestAnimationFrame(inspect);
    };
    requestAnimationFrame(inspect);
  });

  let previous = null;
  let checkpointRevealAt = null;
  const started = Date.now();
  while (Date.now() - started < 65000) {
    await page.waitForTimeout(previous?.transition || previous?.globalCover > 0 || previous?.progress > .9 ? 18 : 45);
    const s = await snapshot();
    if (s.segment === 'route-1' && s.view === 'route') {
      qa.route1.firstMotionAt ??= s.progress > .002 ? s.atMs : undefined;
      if (s.progress >= 1) qa.route1.completedAt ??= s.atMs;
      if (s.progress > .1) await capture('01-route-1-early');
      if (s.progress > .18 && s.lane === 0) await capture('04-route-1-upper-lane');
      if (s.progress > .26 && qa.laneMoves.length === 0 && !s.transition) {
        await page.locator('[data-traversal-lane="1"]').click();
        qa.laneMoves.push({ lane: 1, progress: s.progress });
      }
      if (s.progress > .39 && s.lane === 1) await capture('05-route-1-lower-lane');
      if (s.progress > .49) await capture('02-route-1-mid');
      if (s.progress > .54 && qa.laneMoves.length === 1 && !s.transition) {
        await page.locator('[data-traversal-lane="0"]').click();
        qa.laneMoves.push({ lane: 0, progress: s.progress });
      }
      if (s.progress > .63 && !captured.has('14-route-1-620')) {
        await capture('14-route-1-620', { width: 620, height: 780 });
        await capture('15-route-1-390', { width: 390, height: 844 });
      }
      if (s.progress > .85 && !s.transition) await capture('03-route-1-rush');
      if (s.progress > .94 && !s.transition) await capture('06-route-1-before-transition');
    }
    if (s.segment === 'route-1' && s.transition === 'focus' && s.cover >= .999)
      await capture('07-black-midpoint');
    if (s.segment === 'route-1' && s.view === 'checkpoint') {
      qa.checkpoint.firstVisibleAt ??= !s.transition ? s.atMs : undefined;
      if (!s.transition && s.phase === 'RUNNING') {
        checkpointRevealAt ??= s.atMs;
        await capture('08-cp1-immediately-after-reveal');
        if (s.atMs - checkpointRevealAt > 450) {
          await capture('09-cp1-stable');
          await capture('16-cp1-390', { width: 390, height: 844 });
        }
      }
      if (s.phase === 'NODE_HANDOFF' && s.transition === 'event' && s.cover < .4)
        await capture('10-cp1-last-checkpoint-frame');
    }
    if (s.combat && !captured.has('10-cp1-canonical-before-return')) {
      await page.waitForTimeout(1200);
      await capture('10-cp1-canonical-before-return');
    }
    if (s.entries === 1 && s.exits === 1 && s.segment === 'route-2' && s.globalCover >= .999)
      await capture('11-return-black-midpoint');
    if (s.segment === 'route-2' && s.view === 'route') {
      qa.route2.firstMotionAt ??= s.progress > .002 ? s.atMs : undefined;
      if (!s.transition && s.globalCover === 0 && s.progress < .15) {
        await capture('12-route-2-immediately-after-reveal');
        await capture('17-route-2-390', { width: 390, height: 844 });
      }
      if (!s.transition && s.progress > .27) {
        await capture('13-route-2-resumed-movement');
        break;
      }
    }
    if (s.combat) await playCombat();
    else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    previous = s;
  }
  qa.frameIssues = await page.evaluate(() => [...new Set(window.__sliceFrameIssues ?? [])]);
  qa.missing = expected.filter(name => !captured.has(name));
  qa.overflow = qa.captures.filter(capture => capture.state.overflowPx > 0).map(capture => capture.file);
  qa.unreachableControls = qa.captures.filter(capture =>
    capture.state.controls.some(control => !control.reachable)).map(capture => capture.file);
  qa.route1.durationMs = qa.route1.completedAt && qa.route1.firstMotionAt
    ? Math.round(qa.route1.completedAt - qa.route1.firstMotionAt) : null;
  qa.route2.resumed = captured.has('13-route-2-resumed-movement');
} finally {
  await browser.close();
  await server.close();
  await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(qa, null, 2)}\n`);
  const cards = qa.captures.map(capture => `<figure><img src="${capture.file}" loading="lazy"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('');
  await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 shared-world Route 1 / CP1 / Route 2</title><style>body{margin:0;padding:24px;background:#09191b;color:#eee0bf;font:14px sans-serif}a{color:#ead397}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px}figure{margin:0}img{width:100%;border:1px solid #9d8254}figcaption{padding:8px}</style><h1>Shared-world vertical slice</h1><p><a href="comparison.html">Compare Route 1, CP1, and Route 2 side by side</a></p><main>${cards}</main>`);
  await writeFile(`${output}/comparison.html`, `<!doctype html><meta charset="utf-8"><title>T0 shared-world comparison</title><style>body{margin:0;padding:20px;background:#09191b;color:#eee0bf;font:14px sans-serif}a{color:#ead397}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}figure{margin:0}img{width:100%;border:1px solid #9d8254}figcaption{padding:8px}@media(max-width:900px){main{grid-template-columns:1fr}}</style><h1>Same forest, three presentation states</h1><p><a href="index.html">All captures</a></p><main><figure><a href="03-route-1-rush.png"><img src="03-route-1-rush.png"></a><figcaption>Route 1 rush · generic forest</figcaption></figure><figure><a href="09-cp1-stable.png"><img src="09-cp1-stable.png"></a><figcaption>CP1 · authored ambush</figcaption></figure><figure><a href="13-route-2-resumed-movement.png"><img src="13-route-2-resumed-movement.png"></a><figcaption>Route 2 · generic forest</figcaption></figure></main>`);
  console.log(JSON.stringify({ captures: qa.captures.length, missing: qa.missing,
    blackFrames: qa.blackFrames, laneMoves: qa.laneMoves, route1: qa.route1,
    route2: qa.route2, frameIssues: qa.frameIssues, overflow: qa.overflow,
    unreachableControls: qa.unreachableControls, errors: qa.errors }, null, 2));
}
if (qa.missing.length || qa.blackFrames.some(frame => frame.blackPixelRatio < 1)
  || qa.frameIssues.length || qa.overflow.length || qa.unreachableControls.length || qa.errors.length
  || !qa.route2.resumed || qa.laneMoves.length !== 2)
  throw new Error('Shared-world vertical slice browser QA did not pass.');
