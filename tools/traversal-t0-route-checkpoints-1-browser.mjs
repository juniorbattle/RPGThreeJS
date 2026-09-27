/** Real-time DEV T0 traversal gallery and motion telemetry. No production bypasses. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-t0-route-checkpoints-1-browser';
const port = 5204;
const base = `http://127.0.0.1:${port}/?qa=1&traversal=t0`;
const desktop = { width: 1440, height: 810 };
const mobile = [{ width: 620, height: 780 }, { width: 390, height: 844 }];
const metricsOnly = process.argv.includes('--metrics-only');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const gallery = { task: 'TRAVERSAL-T0-ROUTE-CHECKPOINTS-1', url: base,
  method: 'DEV-only T0 QA entry, real-time requestAnimationFrame, real UI interaction and combat QA victory control',
  captures: [], runs: [], errors: [] };
if (metricsOnly) {
  gallery.captures = JSON.parse(await readFile(`${output}/gallery-index.json`, 'utf8')).captures;
}

async function makePage(context) {
  const page = await context.newPage();
  page.on('pageerror', error => gallery.errors.push(error.message));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__routeQaApp = app;',
    ) });
  });
  await page.goto(base);
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  await page.evaluate(() => {
    const app = window.__routeQaApp;
    window.__routeQaArrivalCount = 0;
    const original = app.completeTraversalT0.bind(app);
    app.completeTraversalT0 = (...args) => {
      window.__routeQaArrivalCount++;
      return original(...args);
    };
  });
  return page;
}

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    const app = window.__routeQaApp;
    const panel = root?.querySelector('[data-traversal-event-panel]');
    const controls = [...document.querySelectorAll('[data-traversal-lane]')].map(button => {
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        reachable: rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight };
    });
    return { atMs: performance.now(), node: app?.state?.run?.currentNodeId ?? null,
      sceneCount: document.querySelectorAll('.traversal-t0').length,
      phase: root?.dataset.phase ?? null, view: root?.dataset.view ?? null,
      segment: root?.dataset.routeSegment ?? null,
      routeProgress: Number(root?.dataset.routeProgress ?? 0),
      sessionProgress: Number(root?.dataset.progress ?? 0),
      speed: Number(root?.dataset.routeSpeed ?? 0),
      transition: root?.dataset.transition ?? null,
      entries: Number(root?.dataset.checkpointEntries ?? 0), exits: Number(root?.dataset.checkpointExits ?? 0),
      branch: root?.dataset.routeVariant ?? null,
      eventPanel: Boolean(panel && !panel.hidden),
      optionalDecision: root?.dataset.phase === 'DECISION' && panel?.dataset.category === 'OPTIONAL_EVENT',
      fork: Boolean(document.querySelector('.traversal-fork-overlay')),
      combat: Boolean(document.querySelector('.combat-frame')),
      dialogue: Boolean(document.querySelector('.dialogue')),
      cinematic: Boolean(document.querySelector('.cinematic-overlay')),
      mode: document.body.dataset.mode ?? null,
      travelView: Boolean(document.querySelector('.travel-view')),
      destinationAgency: [...document.querySelectorAll('[data-journey-choice], [data-journey-continue]')].some(button =>
        button.getBoundingClientRect().width > 0 && !button.disabled)
        && (!document.querySelector('.narrative-stage') || document.querySelector('.narrative-stage').dataset.narrativeSurfaceReadiness === 'VISIBLE'),
      arrivalCallbacks: window.__routeQaArrivalCount ?? 0,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      controls,
    };
  });
}

async function capture(page, name, run, responsive = false) {
  if (metricsOnly) return;
  if (name.includes('combat') || name === '15-cp5b') {
    await page.waitForTimeout(2200);
    const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
    await frame?.evaluate(() => document.querySelector('#tutorial [data-action="skip"]')?.click()).catch(() => {});
    await page.waitForTimeout(600);
  }
  if (name === '07-cp2-cedric' || name === '13-cp5a') {
    await page.waitForFunction(() => {
      const text = document.querySelector('.dialogue .dialogue__text');
      return !text?.dataset.finalText || text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
    }, null, { timeout: 8000 }).catch(() => {});
  }
  const shot = async suffix => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${name}${suffix}.png`;
    await page.screenshot({ path: `${output}/${file}` });
    gallery.captures.push({ file, run: run.id, viewport: `${page.viewportSize().width}x${page.viewportSize().height}`,
      state: await snapshot(page) });
  };
  await shot('');
  if (responsive) {
    for (const viewport of mobile) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(120);
      await shot(`-${viewport.width}`);
    }
    await page.setViewportSize(desktop);
  }
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

async function driveRun(branch, helpRefugees) {
  const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
  const page = await makePage(context);
  const run = { id: branch.endsWith('event') ? 'branch-a' : 'branch-b', branch, helpRefugees,
    startedAt: Date.now(), routes: {}, transitions: [], checkpointEvents: [], progressionErrors: [],
    maxSceneCount: 0, maxEntries: 0, maxExits: 0, arrivalCallbacks: 0, complete: false };
  gallery.runs.push(run);
  const seen = new Set();
  let previous = null;
  let lastSegment = null;
  let activeTransition = null;
  const startWall = Date.now();
  for (let tick = 0; tick < 3600; tick++) {
    await page.waitForTimeout(100);
    const s = await snapshot(page);
    if (s.segment && s.segment !== lastSegment) { console.log(run.id, s.segment); lastSegment = s.segment; }
    run.maxSceneCount = Math.max(run.maxSceneCount, s.sceneCount);
    run.maxEntries = Math.max(run.maxEntries, s.entries);
    run.maxExits = Math.max(run.maxExits, s.exits);
    run.arrivalCallbacks = Math.max(run.arrivalCallbacks, s.arrivalCallbacks);
    if (s.transition !== (activeTransition?.kind ?? null)) {
      if (activeTransition) run.transitions.push({ kind: activeTransition.kind,
        durationMs: Math.round(s.atMs - activeTransition.atMs) });
      activeTransition = s.transition ? { kind: s.transition, atMs: s.atMs } : null;
    }
    if (s.view === 'route' && s.segment) {
      const route = run.routes[s.segment] ??= { startMs: s.atMs, speed: {}, lastProgress: 0,
        completedAtMs: null };
      if (s.routeProgress > .002 && route.motionStartMs == null) route.motionStartMs = s.atMs;
      if (!s.transition && route.visibleAtMs == null) route.visibleAtMs = s.atMs;
      if (s.routeProgress + .00001 < route.lastProgress) run.progressionErrors.push(`${s.segment}: ${route.lastProgress} -> ${s.routeProgress}`);
      route.lastProgress = s.routeProgress;
      for (const target of [.1, .5, .9]) if (s.routeProgress >= target && route.speed[target] == null) route.speed[target] = s.speed;
      if (s.routeProgress >= 1 && route.completedAtMs == null) route.completedAtMs = s.atMs;
    }
    if (s.segment && s.entries > (previous?.entries ?? 0)) {
      run.checkpointEvents.push({ kind: 'entry', segment: s.segment, atMs: s.atMs });
    }
    if (s.segment && s.exits > (previous?.exits ?? 0)) {
      run.checkpointEvents.push({ kind: 'exit', segment: s.segment, atMs: s.atMs });
    }
    if (s.segment && ['DECISION', 'FORK_OVERLAY', 'NODE_HANDOFF'].includes(s.phase)
      && run.routes[s.segment] && run.routes[s.segment].readyAtMs == null) {
      run.routes[s.segment].readyAtMs = s.atMs;
    }
    const take = async (name, responsive = false) => {
      if (seen.has(name)) return;
      seen.add(name);
      await capture(page, name, run, responsive);
      console.log(run.id, name);
    };
    if (run.id === 'branch-a') {
      if (s.segment === 'route-1' && s.routeProgress < .1) await take('01-departure');
      if (s.segment === 'route-1' && s.routeProgress > .15 && s.routeProgress < .4) await take('02-route-1-early');
      if (s.segment === 'route-1' && s.routeProgress > .88 && s.routeProgress < 1) await take('03-route-1-rush', true);
      if (s.segment === 'route-1' && s.view === 'checkpoint') await take('04-cp1-approach', true);
      if (s.node === 'lion-opening-ambush' && s.combat) await take('05-cp1-combat');
      if (s.segment === 'route-2' && s.routeProgress > .2 && s.routeProgress < .8) await take('06-route-2');
      if (s.node === 'lion-nomad-crossroads' && s.dialogue) await take('07-cp2-cedric');
      if (s.segment === 'route-3' && s.routeProgress > .2 && s.routeProgress < .8) await take('08-route-3');
      if (s.optionalDecision) await take('09-cp3-refugees', true);
      if (s.segment === 'route-4' && s.routeProgress > .2 && s.routeProgress < .8) await take('10-route-4');
      if (s.fork) await take('11-fast-checkpoint-fork', true);
      if (s.segment === 'route-5a' && s.routeProgress > .3 && s.routeProgress < .8) await take('12-route-5a', true);
      if (s.node === 'lion-first-trial-event' && s.dialogue) await take('13-cp5a');
      if (s.segment === 'route-6' && s.routeProgress > .2 && s.routeProgress < .4) await take('16-route-6-early');
      if (s.segment === 'route-6' && s.routeProgress > .88 && s.routeProgress < 1) await take('17-route-6-rush');
      if (s.phase === 'ARRIVING') await take('18-arrival', true);
      if (!s.sceneCount && s.destinationAgency && s.arrivalCallbacks > 0) await take('19-destination-agency');
    } else {
      if (s.segment === 'route-5b' && s.routeProgress > .3 && s.routeProgress < .8) await take('14-route-5b', true);
      if (s.node === 'lion-first-trial-combat' && s.combat) await take('15-cp5b');
      if (s.optionalDecision) await take('branch-b-refugees-pass', true);
    }
    if (!s.sceneCount && s.destinationAgency && s.arrivalCallbacks > 0) {
      run.complete = true;
      break;
    }
    if (s.fork && !s.transition) {
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click().catch(() => {});
    } else if (s.optionalDecision && !s.transition) {
      await page.locator(helpRefugees ? '[data-traversal-confirm]' : '[data-traversal-skip]').click().catch(() => {});
    } else if (s.combat) {
      await playCombat(page);
    } else if (s.cinematic) {
      await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    } else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    previous = s;
    if (Date.now() - startWall > 240000) { gallery.errors.push(`${run.id}: timed out at ${JSON.stringify(s)}`); break; }
  }
  run.lastState = previous;
  run.elapsedWallMs = Date.now() - startWall;
  for (const route of Object.values(run.routes)) {
    route.durationMs = route.completedAtMs == null || route.motionStartMs == null
      ? null : Math.round(route.completedAtMs - route.motionStartMs);
    route.routeToCheckpointDeadMs = route.readyAtMs == null || route.completedAtMs == null
      ? null : Math.round(route.readyAtMs - route.completedAtMs);
  }
  for (const [index, route] of Object.values(run.routes).entries()) {
    const next = Object.values(run.routes)[index + 1];
    const exit = run.checkpointEvents.find(event => event.kind === 'exit' && event.atMs >= (route.completedAtMs ?? Infinity));
    route.checkpointToRouteDeadMs = exit && next?.visibleAtMs ? Math.round(next.visibleAtMs - exit.atMs) : null;
  }
  await context.close();
}

try {
  await driveRun('lion-first-trial-event', true);
  await driveRun('lion-first-trial-combat', false);
} finally {
  await browser.close();
  await server.close();
  await writeFile(`${output}/gallery-index.json`, `${JSON.stringify(gallery, null, 2)}\n`);
  await writeFile(`${output}/motion-flow.json`, `${JSON.stringify({ runs: gallery.runs.map(run => ({
    id: run.id, branch: run.branch, helpRefugees: run.helpRefugees, routes: run.routes,
    transitions: run.transitions, checkpointEvents: run.checkpointEvents,
    maxSceneCount: run.maxSceneCount, checkpointEntries: run.maxEntries,
    checkpointExits: run.maxExits, arrivalCallbacks: run.arrivalCallbacks,
    progressionErrors: run.progressionErrors, complete: run.complete,
  })) }, null, 2)}\n`);
  const expected = ['01-departure', '02-route-1-early', '03-route-1-rush', '04-cp1-approach',
    '05-cp1-combat', '06-route-2', '07-cp2-cedric', '08-route-3', '09-cp3-refugees',
    '10-route-4', '11-fast-checkpoint-fork', '12-route-5a', '13-cp5a', '14-route-5b',
    '15-cp5b', '16-route-6-early', '17-route-6-rush', '18-arrival', '19-destination-agency'];
  const files = new Set(gallery.captures.map(capture => capture.file));
  const qa = { expected, missing: expected.filter(name => !files.has(`${name}.png`)),
    responsive: gallery.captures.filter(capture => capture.viewport !== '1440x810'),
    errors: gallery.errors, runsComplete: gallery.runs.every(run => run.complete),
    overflow: gallery.captures.filter(capture => capture.state.overflowPx > 0).map(capture => capture.file),
    unreachableControls: gallery.captures.filter(capture => capture.state.controls.some(control => !control.reachable)).map(capture => capture.file) };
  await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(qa, null, 2)}\n`);
  const cards = gallery.captures.map(capture => `<figure><img src="${capture.file}" loading="lazy"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('');
  await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 Lot A browser gallery</title><style>body{margin:0;background:#08131d;color:#e8dec5;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}figure{margin:0}img{width:100%;border:1px solid #866f4b}figcaption{padding:8px}</style><h1>T0 route / checkpoint Lot A</h1><main>${cards}</main>`);
  console.log(JSON.stringify({ complete: qa.runsComplete, captures: gallery.captures.length,
    missing: qa.missing, errors: gallery.errors }, null, 2));
}
