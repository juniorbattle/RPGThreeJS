/** Real-time T0 motion review. Two complete canonical runs yield five focused WebMs. */
import { copyFile, mkdir, unlink, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { findMediaTool } from './cinematics/ffmpeg_tools.mjs';

const output = 'docs/reports/traversal-t0-motion-handoff-polish-1-browser';
const base = 'http://127.0.0.1:5224/?qa=1&traversal=t0';
const desktop = { width: 1440, height: 810 };
const mobile = { width: 390, height: 844 };
const tablet = { width: 620, height: 780 };
const execFileAsync = promisify(execFile);
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5224, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const qa = { runs: [], clips: [], errors: [], responsive: [], black: [] };

async function instrument(page) {
  page.on('pageerror', error => qa.errors.push(error.message));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__motionQaApp = app;',
    ) });
  });
  await page.goto(base);
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  await page.evaluate(() => {
    window.__motionQaFrames = [];
    window.__motionQaArrivalCount = 0;
    const app = window.__motionQaApp;
    const original = app.completeTraversalT0.bind(app);
    app.completeTraversalT0 = (...args) => {
      window.__motionQaArrivalCount++;
      return original(...args);
    };
    const sample = () => {
      const root = document.querySelector('.traversal-t0');
      if (root) {
        const vehicle = root.querySelector('.traversal-vehicle');
        const wheel = root.querySelector('.traversal-vehicle__wheel-rotor');
        const dust = root.querySelector('.traversal-vehicle__dust');
        const cover = root.querySelector('.traversal-transition');
        const global = document.querySelector('.scene-transition--traversal');
        const rect = vehicle.getBoundingClientRect();
        window.__motionQaFrames.push({ t: Date.now(), segment: root.dataset.routeSegment,
          phase: root.dataset.phase, view: root.dataset.view, presentation: root.dataset.presentation ?? null,
          departure: root.dataset.departure ?? null, transition: root.dataset.transition ?? null,
          progress: Number(root.dataset.routeProgress), sessionProgress: Number(root.dataset.progress),
          visualSpeed: Number(root.dataset.visualSpeed), worldDistance: Number(root.dataset.visualWorldDistance),
          vehicleOffset: Number(root.dataset.vehicleOffset), vehicleX: rect.x, vehicleRight: rect.right,
          wheelAngle: wheel?.style.getPropertyValue('--wheel-angle') || vehicle.style.getPropertyValue('--wheel-angle'),
          dustOpacity: Number(getComputedStyle(dust).opacity),
          cover: cover ? Number(getComputedStyle(cover).opacity) : 0,
          globalCover: global ? Number(getComputedStyle(global).opacity) : 0,
          viewport: innerWidth, arrivalCount: window.__motionQaArrivalCount });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function state(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    const app = window.__motionQaApp;
    const session = app?.activeTraversal?.session;
    const panel = root?.querySelector('[data-traversal-event-panel]');
    return { segment: root?.dataset.routeSegment, phase: root?.dataset.phase,
      view: root?.dataset.view, progress: Number(root?.dataset.routeProgress || 0),
      presentation: root?.dataset.presentation, departure: root?.dataset.departure,
      transition: root?.dataset.transition, pendingBeatId: session?.pendingBeatId,
      decision: Boolean(panel && !panel.hidden && session?.phase === 'DECISION'),
      fork: Boolean(root?.querySelector('.traversal-fork-overlay')),
      combat: Boolean(document.querySelector('.combat-frame')),
      dialogue: Boolean(document.querySelector('.dialogue')),
      cinematic: Boolean(document.querySelector('.cinematic-overlay')),
      agency: !root && [...document.querySelectorAll('[data-journey-choice], [data-journey-continue]')]
        .some(button => button.getBoundingClientRect().width > 0 && !button.disabled),
      arrived: window.__motionQaArrivalCount,
      visited: [...(app?.state?.run?.visitedNodeIds ?? [])],
      bypassed: [...(app?.state?.run?.bypassedRouteNodeIds ?? [])],
      branch: app?.state?.run?.traversalBranches?.T0 ?? null,
      travelView: Boolean(document.querySelector('.travel-view')) };
  });
}

async function blackRatio(page, png) {
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
    for (let index = 0; index < pixels.length; index += 4)
      if (pixels[index] === 0 && pixels[index + 1] === 0 && pixels[index + 2] === 0) black++;
    return black / (pixels.length / 4);
  }, png.toString('base64'));
}

async function capture(page, run, label, black = false) {
  const viewport = page.viewportSize();
  const file = `${run.id}-${label}-${viewport.width}.png`;
  const png = await page.screenshot({ path: `${output}/${file}` });
  const root = await state(page);
  const item = { file, atMs: Date.now(), viewport: `${viewport.width}x${viewport.height}`,
    segment: root.segment, phase: root.phase, view: root.view, departure: root.departure };
  if (black) {
    item.blackPixelRatio = await blackRatio(page, png);
    qa.black.push(item);
  } else qa.responsive.push(item);
  return item;
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

async function runJourney(id, help, branch) {
  const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1,
    recordVideo: { dir: output, size: { width: 960, height: 540 } } });
  const videoStartWall = Date.now();
  const page = await context.newPage();
  await instrument(page);
  const run = { id, help, branch, videoStartWall, actions: {}, complete: false, last: null, frames: [] };
  qa.runs.push(run);
  const acted = new Set();
  const start = Date.now();
  let lastSegment;
  for (let tick = 0; tick < 7200; tick++) {
    await page.waitForTimeout(70);
    const s = await state(page);
    if (s.segment && s.segment !== lastSegment) { console.log(id, s.segment); lastSegment = s.segment; }
    if (s.agency && s.arrived === 1) { run.complete = true; run.last = s; break; }
    if (help && s.segment === 'route-3' && s.presentation === 'checkpoint-approach'
      && !acted.has('route3-black')) {
      acted.add('route3-black');
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.traversal-transition')).opacity) >= .999,
        null, { timeout: 5000 });
      await capture(page, run, 'route3-black', true);
    }
    if (s.decision && !acted.has(s.pendingBeatId)) {
      acted.add(s.pendingBeatId);
      const refugees = s.pendingBeatId?.includes('refugees');
      if (refugees && !help) {
        await page.setViewportSize(mobile);
        await capture(page, run, 'passer-before');
      }
      run.actions[refugees ? help ? 'aider' : 'passer' : s.pendingBeatId] = Date.now();
      await page.locator(refugees && !help ? '[data-traversal-skip]' : '[data-traversal-confirm]').click();
      if (refugees && !help) {
        await page.waitForTimeout(110);
        await capture(page, run, 'passer-departure');
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.traversal-transition')).opacity) >= .999,
          null, { timeout: 5000 });
        await capture(page, run, 'passer-black', true);
      }
    } else if (s.fork && !s.departure && !acted.has('fork')) {
      acted.add('fork');
      if (help) { await page.setViewportSize(tablet); await capture(page, run, 'fork-before'); }
      run.actions.fork = Date.now();
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click();
      if (help) {
        await page.waitForTimeout(110);
        await capture(page, run, 'fork-departure');
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.traversal-transition')).opacity) >= .999,
          null, { timeout: 5000 });
        await capture(page, run, 'fork-black', true);
      }
    } else if (s.combat) await playCombat(page);
    else if (s.cinematic) await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    if (s.segment?.startsWith('route-4') && page.viewportSize().width !== desktop.width)
      await page.setViewportSize(desktop);
    if (s.segment?.startsWith('route-5') && s.progress > .08 && page.viewportSize().width !== desktop.width)
      await page.setViewportSize(desktop);
    if (s.segment === 'route-5a' && s.view === 'checkpoint' && !s.transition
      && s.phase === 'RUNNING' && !run.actions.branchCheckpoint) {
      run.actions.branchCheckpoint = Date.now();
      await capture(page, run, 'branch-checkpoint');
    }
    if (s.segment === 'route-6' && s.progress > .82 && !run.actions.route6Rush) {
      run.actions.route6Rush = Date.now();
      if (help) {
        await capture(page, run, 'route6-rush');
        await page.setViewportSize(tablet); await capture(page, run, 'route6-rush-tablet');
        await page.setViewportSize(mobile); await capture(page, run, 'route6-rush-mobile');
        await page.setViewportSize(desktop);
      }
    }
    if (s.phase === 'ARRIVING' && !run.actions.arrival) {
      run.actions.arrival = Date.now();
      if (help) {
        await capture(page, run, 'arrival-desktop');
        await page.setViewportSize(tablet); await capture(page, run, 'arrival-tablet');
        await page.setViewportSize(mobile); await capture(page, run, 'arrival-mobile');
        await page.setViewportSize(desktop);
      }
    }
    if (Date.now() - start > 240000) { qa.errors.push(`${id} timed out: ${JSON.stringify(s)}`); run.last = s; break; }
    run.last = s;
  }
  if (run.complete) await page.waitForTimeout(1200);
  run.frames = await page.evaluate(() => window.__motionQaFrames);
  await writeFile(`${output}/${id}-motion-frames.json`, `${JSON.stringify(run.frames.filter(frame =>
    frame.presentation || frame.departure || frame.transition || frame.phase === 'ARRIVING'
    || frame.segment === 'route-6' && frame.progress > .84))}\n`);
  await context.close();
  const recorded = await page.video().path();
  run.rawVideo = `${output}/raw-${id}.webm`;
  await copyFile(recorded, run.rawVideo);
  await unlink(recorded);
  console.log(id, 'complete', run.complete, 'frames', run.frames.length);
  return run;
}

function first(frames, predicate) { return frames.find(predicate); }
function summary(run) {
  const frames = run.frames;
  const departure = (segment, kind) => {
    const start = first(frames, frame => frame.segment === segment && frame.departure === kind);
    if (!start) return null;
    const moving = first(frames, frame => frame.t >= start.t && frame.segment === segment
      && frame.vehicleOffset > start.vehicleOffset + 1);
    const fade = first(frames, frame => frame.t >= start.t && frame.segment === segment && frame.cover > .01);
    const black = first(frames, frame => frame.t >= start.t && frame.cover >= .999);
    const next = first(frames, frame => frame.t > (black?.t ?? start.t)
      && frame.view === 'route' && frame.segment !== segment && frame.cover < .01);
    return { startMs: start.t, movingMs: moving?.t, fadeMs: fade?.t, blackMs: black?.t,
      revealMs: next?.t, beforeFadeMs: fade && moving ? fade.t - moving.t : null,
      beforeBlackMs: black && moving ? black.t - moving.t : null,
      movingOffset: moving?.vehicleOffset, movingWheelAngle: moving?.wheelAngle,
      movingDustOpacity: moving?.dustOpacity };
  };
  const canonicalReturn = (segment) => {
    const mounted = first(frames, frame => frame.segment === segment && frame.view === 'route');
    if (!mounted) return null;
    const revealed = first(frames, frame => frame.t >= mounted.t && frame.segment === segment
      && frame.globalCover < .01);
    const earlyRoute = first(frames, frame => frame.t >= mounted.t && frame.segment === segment
      && frame.progress > .05);
    const handoffFrames = frames.filter(frame => frame.t >= mounted.t
      && frame.t <= (earlyRoute?.t ?? revealed?.t ?? mounted.t));
    return { mountedMs: mounted.t, mountedUnderGlobalCover: mounted.globalCover >= .99,
      revealMs: revealed?.t, additionalLocalTransition: handoffFrames.some(frame => Boolean(frame.transition)),
      checkpointRevisit: handoffFrames.some(frame => frame.view === 'checkpoint'),
      departureRevisit: handoffFrames.some(frame => Boolean(frame.departure)) };
  };
  const arrival = first(frames, frame => frame.segment === 'route-6' && frame.phase === 'ARRIVING');
  const coast = arrival ? [0, 350, 1200, 2000].map(offset => {
    const frame = first(frames, candidate => candidate.t >= arrival.t + offset
      && candidate.segment === 'route-6');
    return frame && { elapsedMs: frame.t - arrival.t, canonicalProgress: frame.progress,
      sessionProgress: frame.sessionProgress, worldDistance: frame.worldDistance,
      visualSpeed: frame.visualSpeed, vehicleOffset: frame.vehicleOffset,
      vehicleRight: frame.vehicleRight, viewport: frame.viewport, dustOpacity: frame.dustOpacity };
  }) : [];
  const approach = first(frames, frame => frame.segment === 'route-3' && frame.presentation === 'checkpoint-approach');
  const approachFade = approach && first(frames, frame => frame.t >= approach.t && frame.segment === 'route-3' && frame.cover > .01);
  return { id: run.id, complete: run.complete, frameCount: frames.length,
    route3Approach: approach && { startMs: approach.t, fadeMs: approachFade?.t,
      preFadeWorldMovement: approachFade?.worldDistance - approach.worldDistance },
    refugeeDeparture: departure('route-3', 'return'),
    aiderReturn: run.help ? canonicalReturn('route-4') : null,
    forkDeparture: departure('route-4', 'fork'),
    branchReturn: canonicalReturn('route-6'),
    arrival: arrival && { atMs: arrival.t, samples: coast,
      callbackCount: run.last?.arrived, destinationAgency: run.last?.agency,
      canonicalDestinationUnvisited: !run.last?.visited.includes('lion-first-refuge'),
      travelView: run.last?.travelView },
    branch: run.last?.branch, bypassedRefugees: run.last?.bypassed.includes('lion-refugees'),
    visitedRefugees: run.last?.visited.includes('lion-refugees') };
}

async function clip(run, name, start, end) {
  if (!start || !end || end <= start) { qa.errors.push(`Missing clip bounds: ${name}`); return; }
  const ffmpeg = await findMediaTool('ffmpeg', process.cwd());
  const ss = Math.max(0, (start - run.videoStartWall) / 1000 - 1.2);
  const duration = (end - start) / 1000 + 2.4;
  const file = `${output}/${name}.webm`;
  await execFileAsync(ffmpeg, ['-y', '-ss', String(ss), '-i', run.rawVideo, '-t', String(duration),
    '-an', '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '5', '-b:v', '900k', file],
  { maxBuffer: 2_000_000 });
  qa.clips.push({ file, startMs: start, endMs: end, durationSeconds: duration });
}

let aide, passer;
try {
  aide = await runJourney('aider-branch-a', true, 'lion-first-trial-event');
  passer = await runJourney('passer-branch-b', false, 'lion-first-trial-combat');
} finally {
  await browser.close();
  await server.close();
}
const summaries = [summary(aide), summary(passer)];
const fa = aide.frames;
const fb = passer.frames;
await clip(aide, 'A-route3-refugees-aider-route4',
  first(fa, frame => frame.segment === 'route-3' && frame.progress > .83)?.t,
  first(fa, frame => frame.segment === 'route-4' && frame.progress > .16)?.t);
await clip(passer, 'B-refugees-passer-route4', passer.actions.passer,
  first(fb, frame => frame.segment === 'route-4' && frame.progress > .15)?.t);
await clip(aide, 'C-fork-route5a', aide.actions.fork,
  first(fa, frame => frame.segment === 'route-5a' && frame.progress > .16)?.t);
await clip(aide, 'D-branch-checkpoint-route6', aide.actions.branchCheckpoint,
  first(fa, frame => frame.segment === 'route-6' && frame.progress > .16)?.t);
await clip(passer, 'E-route6-arrival-journey',
  first(fb, frame => frame.segment === 'route-6' && frame.progress > .84)?.t,
  fb.at(-1)?.t);
const checks = {
  runsComplete: aide.complete && passer.complete,
  clips: qa.clips.length === 5,
  passerBeforeFade: summaries[1].refugeeDeparture?.beforeFadeMs > 0,
  passerBeforeBlack: summaries[1].refugeeDeparture?.beforeBlackMs > 0,
  forkBeforeBlack: summaries[0].forkDeparture?.beforeBlackMs > 0,
  aiderSingleReturn: summaries[0].aiderReturn?.mountedUnderGlobalCover
    && !summaries[0].aiderReturn?.additionalLocalTransition
    && !summaries[0].aiderReturn?.checkpointRevisit
    && !summaries[0].aiderReturn?.departureRevisit
    && !summaries[0].refugeeDeparture,
  branchSingleReturn: summaries.every(result => result.branchReturn?.mountedUnderGlobalCover
    && !result.branchReturn?.additionalLocalTransition
    && !result.branchReturn?.checkpointRevisit
    && !result.branchReturn?.departureRevisit),
  approachBeforeFade: summaries[0].route3Approach?.preFadeWorldMovement > 0,
  arrivalCoast: summaries.every(result => result.arrival?.samples?.[1]?.worldDistance
    > result.arrival?.samples?.[0]?.worldDistance && result.arrival?.samples?.[1]?.visualSpeed > 0
    && result.arrival?.samples?.every(sample => sample?.canonicalProgress === 1)),
  arrivalScreenExit: summaries.every(result => result.arrival?.samples?.[3]?.vehicleRight
    > result.arrival?.samples?.[3]?.viewport),
  callbackOnce: summaries.every(result => result.arrival?.callbackCount === 1),
  agency: summaries.every(result => result.arrival?.destinationAgency && result.arrival?.canonicalDestinationUnvisited
    && !result.arrival?.travelView),
  blackViewport: [390, 620, 1440].every(width => qa.black.some(item => item.viewport.startsWith(`${width}x`)
    && item.blackPixelRatio >= .999)),
  noPageErrors: qa.errors.length === 0,
};
await writeFile(`${output}/telemetry.json`, `${JSON.stringify({ summaries, checks, clips: qa.clips,
  responsive: qa.responsive, black: qa.black, errors: qa.errors }, null, 2)}\n`);
await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 motion handoffs</title><style>body{background:#07151b;color:#f4e9cd;font:16px sans-serif;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px}video,img{width:100%}figure{margin:0}figcaption{padding:8px}</style><h1>T0 motion handoffs</h1><p><a href="telemetry.json">Frame telemetry</a></p><main>${qa.clips.map(item => `<figure><video controls preload="metadata" src="${item.file.split('/').at(-1)}"></video><figcaption>${item.file.split('/').at(-1)}</figcaption></figure>`).join('')}${qa.responsive.map(item => `<figure><img src="${item.file}"><figcaption>${item.file}</figcaption></figure>`).join('')}</main>`);
await unlink(aide.rawVideo);
await unlink(passer.rawVideo);
console.log(JSON.stringify({ checks, summaries, clips: qa.clips, errors: qa.errors }, null, 2));
if (Object.values(checks).some(value => !value)) throw new Error('T0 motion handoff browser QA failed.');
