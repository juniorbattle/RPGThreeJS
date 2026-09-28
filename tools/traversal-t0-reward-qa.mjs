/** DEV Reward extension of the canonical T0 browser QA entry. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = process.argv.find(arg => arg.startsWith('--output='))?.slice('--output='.length)
  ?? 'docs/reports/traversal-t0-route-reward-1-browser';
const port = 5219;
const viewport = { width: 1440, height: 810 };
const mobile = [{ width: 620, height: 780 }, { width: 390, height: 844 }];
const refugeQa = process.argv.includes('--reward-refuge-qa');
const artQa = process.argv.includes('--reward-art-qa');
const pouchPath = '/assets/generated/lion-phase/traversal/t0/reward/coin-pouch.png';
const pickups = {
  'route-1': [[.65, 1]], 'route-2': [[.22, 0]], 'route-3': [[.18, 1], [.50, 0]],
  'route-4': [[.18, 0], [.50, 1]], 'route-5a': [[.18, 1], [.48, 0]],
  'route-5b': [[.15, 0], [.82, 0]], 'route-6': [[.88, 1]],
};
const plans = {
  'route-1': [[.12, 1]],
  'route-2': [[.08, 0]],
  'route-3': [[.08, 1], [.38, 0]],
  'route-4': [[.08, 0], [.38, 1]],
  'route-5a': [[.08, 1], [.37, 0]],
  'route-5b': [[.08, 0]],
  'route-6': [[.14, 1], [.39, 0], [.60, 1]],
};
const report = { task: artQa ? 'TRAVERSAL-T0-ROUTE-REWARD-ART-1' : 'TRAVERSAL-T0-ROUTE-REWARD-1',
  baseline: artQa ? 'f96290f0d848a83f4fa8cb3f15987123e332b84a' : '300d126d2d608a4f4d3b6f30b4825cd6f9dc9fc6',
  runs: [], captures: [], errors: [], assetResponses: [] };
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });

async function makePage(mode) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${mode}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`${mode}: ${message.text()}`); });
  if (artQa) page.on('response', response => {
    if (response.url().endsWith(pouchPath)) report.assetResponses.push({ mode, status: response.status() });
  });
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = 'const app = new GameApp(root, canvas);';
    if (!source.includes(marker)) throw new Error('GameApp bootstrap hook missing');
    await route.fulfill({ response, body: source.replace(marker, `${marker} window.__routeQaApp = app;`) });
  });
  const params = new URLSearchParams({ qa: '1', traversal: 't0' });
  if (mode !== 'off') params.set('traversalReward', '1');
  if (mode === 'isolated' || mode === 'miss') params.set('traversalRisk', '0');
  await page.goto(`http://127.0.0.1:${port}/?${params}`);
  await page.waitForSelector('.traversal-t0', { timeout: 30000 });
  await page.evaluate(() => {
    const app = window.__routeQaApp;
    window.__rewardQaEvents = [];
    const original = app.acceptTraversalRouteReward.bind(app);
    app.acceptTraversalRouteReward = reward => {
      const before = { gold: app.state.gold, temporary: app.state.run.temporaryLoot.gold,
        visited: [...app.state.run.visitedNodeIds], resolved: [...app.state.resolvedNodeIds] };
      const accepted = original(reward);
      window.__rewardQaEvents.push({ id: reward.id, amount: reward.gold, accepted, before,
        after: { gold: app.state.gold, temporary: app.state.run.temporaryLoot.gold,
          visited: [...app.state.run.visitedNodeIds], resolved: [...app.state.resolvedNodeIds] },
        hud: document.querySelector('.campaign-status-hud')?.textContent ?? '' });
      return accepted;
    };
  });
  return { context, page };
}

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    const app = window.__routeQaApp;
    const marks = [...(root?.querySelectorAll('[data-reward-pickup]') ?? [])];
    const vehicle = root?.querySelector('.traversal-vehicle')?.getBoundingClientRect();
    return { segment: root?.dataset.routeSegment ?? null, phase: root?.dataset.phase ?? null,
      view: root?.dataset.view ?? null, progress: Number(root?.dataset.routeProgress ?? 0),
      lane: Number(root?.dataset.lane ?? 0), speed: Number(root?.dataset.routeSpeed ?? 0),
      transition: root?.dataset.transition ?? null, departure: root?.dataset.departure ?? null,
      risk: root?.dataset.riskEnabled ?? null, riskCollisionCount: Number(root?.dataset.riskCollisionCount ?? 0),
      riskRecovery: Number(root?.dataset.riskRecoveryProgress ?? 1),
      reward: root?.dataset.rewardEnabled ?? null,
      resolved: JSON.parse(root?.dataset.rewardResolved ?? '[]'),
      collected: JSON.parse(root?.dataset.rewardCollected ?? '[]'),
      feedback: root?.querySelector('.traversal-route-reward__feedback')?.classList.contains('is-active') ?? false,
      pulse: root?.querySelector('.traversal-route-reward__pulse')?.classList.contains('is-active') ?? false,
      marks: marks.map(mark => { const rect = mark.getBoundingClientRect(); return {
        id: mark.dataset.rewardPickup, lane: Number(mark.dataset.rewardLane), hidden: mark.hidden,
        x: rect.x + rect.width / 2, y: rect.bottom, width: rect.width, height: rect.height,
        imageSrc: mark.querySelector('img')?.getAttribute('src') ?? null,
        imageLoaded: Boolean(mark.querySelector('img')?.naturalWidth),
        imageWidth: mark.querySelector('img')?.naturalWidth ?? 0 } }),
      vehicleX: vehicle ? vehicle.x + vehicle.width / 2 : null,
      hud: document.querySelector('.campaign-status-hud')?.textContent ?? '',
      gold: app.state.gold, temporary: app.state.run.temporaryLoot.gold,
      visited: [...app.state.run.visitedNodeIds],
      sceneCount: document.querySelectorAll('.traversal-t0').length,
      destinationAgency: [...document.querySelectorAll('[data-journey-choice], [data-journey-continue]')]
        .some(button => button.getBoundingClientRect().width > 0 && !button.disabled),
      combat: Boolean(document.querySelector('.combat-frame')),
      dialogue: Boolean(document.querySelector('.dialogue')),
      cinematic: Boolean(document.querySelector('.cinematic-overlay')),
      fork: Boolean(document.querySelector('.traversal-fork-overlay')),
      optionalDecision: root?.dataset.phase === 'DECISION',
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      laneButtons: [...document.querySelectorAll('[data-traversal-lane]')].map(button => {
        const rect = button.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
      }),
    };
  });
}

async function capture(page, name, run, widths = []) {
  if (refugeQa && name !== 'reward-refuge-secured') return;
  const sizes = artQa && name === 'reward-r1-collected' ? [mobile[1], viewport] : [viewport, ...widths];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.waitForTimeout(80);
    const file = `${name}${size.width === viewport.width ? '' : `-${size.width}`}.png`;
    await page.screenshot({ path: `${output}/${file}` });
    const state = await snapshot(page);
    report.captures.push({ file, run: run.id, viewport: `${size.width}x${size.height}`, state });
    if (state.overflow || state.laneButtons.some(button => button.x < 0 || button.right > size.width
      || button.y < 0 || button.bottom > size.height)) report.errors.push(`${file}: overflow or lane control clipping`);
    if (artQa && state.marks.some(mark => !mark.hidden && (mark.imageSrc !== pouchPath
      || !mark.imageLoaded || mark.imageWidth !== 512 || mark.width < 40 || mark.width > 80
      || mark.height > 80 || Math.abs(mark.y - size.height * (mark.lane === 0 ? .65 : .81)) > 20)))
      report.errors.push(`${file}: pouch image, size, or lane grounding failed`);
  }
  await page.setViewportSize(viewport);
}

async function playCombat(page) {
  const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
  await frame?.evaluate(() => {
    for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
      const button = document.querySelector(selector);
      if (button && button.getBoundingClientRect().width > 0 && !button.disabled) { button.click(); return; }
    }
  }).catch(() => {});
}

async function drive(mode, branch = 'lion-first-trial-event') {
  const { context, page } = await makePage(mode);
  const run = { id: `${mode}-${branch.endsWith('event') ? 'a' : 'b'}`, mode, branch,
    events: [], segments: {}, laneMoves: [], checkpointLeaks: [], complete: false,
    arrivalTemporary: null, agencyTemporary: null, riskContacts: [], visualJumps: [] };
  report.runs.push(run);
  const applied = new Set();
  const captured = new Set();
  let last = null;
  let lastVisible = new Map();
  const started = Date.now();
  for (let tick = 0; tick < 7000; tick++) {
    await page.waitForTimeout(last?.transition || last?.progress > .93 ? 18 : 70);
    const s = await snapshot(page);
    if (s.segment) {
      const segment = run.segments[s.segment] ??= { firstGold: s.temporary, lastGold: s.temporary,
        resolved: [], collected: [], collisions: 0, seen: [] };
      segment.lastGold = s.temporary;
      segment.resolved = s.resolved;
      segment.collected = s.collected;
      segment.collisions = Math.max(segment.collisions, s.riskCollisionCount);
      for (const mark of s.marks.filter(mark => !mark.hidden)) {
        if (!segment.seen.includes(mark.id)) segment.seen.push(mark.id);
        const before = lastVisible.get(mark.id);
        if (before && before.segment === s.segment && s.progress > before.progress
          && s.riskCollisionCount > before.collisions && Math.abs(mark.x - before.x) > 115)
          run.visualJumps.push({ id: mark.id, from: before.x, to: mark.x });
        lastVisible.set(mark.id, { x: mark.x, progress: s.progress,
          collisions: s.riskCollisionCount, segment: s.segment });
      }
      if ((s.view !== 'route' || s.transition || s.departure || s.phase === 'ARRIVING')
        && s.marks.some(mark => !mark.hidden)) run.checkpointLeaks.push(`${s.segment}:${s.view}:${s.phase}`);
    }
    if (mode === 'off' && s.segment === 'route-1' && s.progress > .7) {
      if (s.marks.length || s.temporary !== 0) report.errors.push('Reward OFF exposed marks or gold');
      run.complete = true; break;
    }
    if (mode === 'miss' && s.segment === 'route-1' && s.progress > .75) {
      run.complete = true; break;
    }
    if (mode !== 'off' && mode !== 'miss' && s.segment && s.view === 'route'
      && !s.transition && !s.departure && s.phase === 'RUNNING') {
      const plan = plans[s.segment] ?? [];
      for (let index = 0; index < plan.length; index++) {
        const [at, lane] = plan[index];
        const key = `${s.segment}:${index}`;
        if (!applied.has(key) && s.progress >= at && s.progress < at + .08) {
          applied.add(key);
          if (s.lane !== lane) {
            await page.locator(`[data-traversal-lane="${lane}"]`).click();
            run.laneMoves.push({ segment: s.segment, progress: s.progress, lane });
          }
        }
      }
    }
    if (mode === 'isolated' && branch.endsWith('event') && s.segment === 'route-1'
      && s.progress > .48 && s.progress < .6 && !captured.has('approach')) {
      captured.add('approach'); await capture(page, 'reward-r1-approach', run, mobile);
    }
    if (mode === 'isolated' && branch.endsWith('event') && s.segment === 'route-1'
      && s.feedback && !captured.has('collect')) {
      captured.add('collect'); await capture(page, 'reward-r1-collected', run);
    }
    if (mode === 'miss' && s.segment === 'route-1' && s.progress > .68 && !captured.has('miss')) {
      captured.add('miss'); await capture(page, 'reward-r1-missed', run);
    }
    if (mode === 'combined' && branch.endsWith('event') && s.segment === 'route-3'
      && s.progress > .42 && s.progress < .50 && !captured.has('route3')) {
      captured.add('route3'); await capture(page, 'reward-r3-risk', run);
    }
    if (mode === 'combined' && !branch.endsWith('event') && s.segment === 'route-5b'
      && s.progress > .72 && s.progress < .81 && !captured.has('route5b')) {
      captured.add('route5b'); await capture(page, 'reward-r5b-after-collision', run);
    }
    if (mode === 'combined' && branch.endsWith('event') && s.segment === 'route-6'
      && s.progress > .80 && s.progress < .87 && !captured.has('route6')) {
      captured.add('route6'); await capture(page, 'reward-r6-approach', run);
    }
    if (s.phase === 'ARRIVING' && run.arrivalTemporary == null) run.arrivalTemporary = s.temporary;
    if (!s.sceneCount && s.destinationAgency) {
      run.agencyTemporary = s.temporary;
      run.complete = true;
      if (mode === 'combined' && branch.endsWith('event')) await capture(page, 'reward-arrival-agency', run);
      break;
    }
    if (s.fork && !s.transition && !s.departure)
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click().catch(() => {});
    else if (s.optionalDecision && !s.transition)
      await page.locator(branch.endsWith('event') ? '[data-traversal-confirm]' : '[data-traversal-skip]').click().catch(() => {});
    else if (s.combat) await playCombat(page);
    else if (s.cinematic) await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    last = s;
    if (Date.now() - started > 240000) { report.errors.push(`${run.id}: timeout ${JSON.stringify(s)}`); break; }
  }
  run.events = await page.evaluate(() => window.__rewardQaEvents);
  run.final = await snapshot(page);
  if (refugeQa && run.complete && mode === 'combined') {
    const before = await page.evaluate(() => ({ gold: window.__routeQaApp.state.gold,
      temporary: window.__routeQaApp.state.run.temporaryLoot.gold }));
    await page.locator('[data-journey-continue]:visible:not([disabled]), [data-journey-choice]:visible:not([disabled])')
      .first().click();
    const began = Date.now();
    while (Date.now() - began < 90000) {
      const state = await page.evaluate(() => ({
        secured: Boolean(window.__routeQaApp.state.flags['refugeSecured:lion-first-refuge']),
        gold: window.__routeQaApp.state.gold,
        temporary: window.__routeQaApp.state.run.temporaryLoot.gold,
        node: window.__routeQaApp.state.run.currentNodeId,
      }));
      if (state.secured && !run.refuge) run.refuge = { before, after: state };
      if (run.refuge && await page.locator('.exploration-stop:visible').count()) {
        run.refugeVisible = true;
        await capture(page, 'reward-refuge-secured', run);
        break;
      }
      if (await page.locator('.cinematic-overlay__skip:visible:not([disabled])').count())
        await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
      else if (await page.locator('.dialogue .dialogue__choices button:visible:not([disabled])').count())
        await page.locator('.dialogue .dialogue__choices button:visible:not([disabled])').first().click().catch(() => {});
      else if (await page.locator('.dialogue .dialogue__box:visible').count())
        await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
      await page.waitForTimeout(100);
    }
    if (!run.refuge || !run.refugeVisible || run.refuge.after.gold !== before.gold + before.temporary
      || run.refuge.after.temporary !== 0)
      report.errors.push(`${run.id}: refuge did not secure temporary loot through existing entry`);
  }
  await context.close();
}

try {
  if (refugeQa) await drive('combined', 'lion-first-trial-event');
  else {
    await drive('off');
    await drive('miss');
    for (const mode of ['isolated', 'combined']) {
      await drive(mode, 'lion-first-trial-event');
      await drive(mode, 'lion-first-trial-combat');
    }
  }
} finally {
  await browser.close();
  await server.close();
}

for (const run of report.runs) {
  if (!run.complete || run.checkpointLeaks.length || run.visualJumps.length)
    report.errors.push(`${run.id}: incomplete, leaked mark, or visual jump`);
  if (run.mode === 'miss' && (run.events.length || run.final.temporary ||
    !run.final.resolved.includes('t0:r1:reward-1') || run.final.feedback))
    report.errors.push(`${run.id}: miss failed`);
  if (run.mode === 'isolated' || run.mode === 'combined') {
    if (run.events.length !== 9 || run.events.reduce((sum, event) => sum + event.amount, 0) !== 45
      || run.events.some(event => !event.accepted || event.amount !== 5
      || event.after.gold !== event.before.gold || event.after.temporary !== event.before.temporary + 5
      || JSON.stringify(event.before.visited) !== JSON.stringify(event.after.visited)
      || JSON.stringify(event.before.resolved) !== JSON.stringify(event.after.resolved)
      || !event.hud.includes(`+${event.after.temporary} route`))
      || run.arrivalTemporary < 5 || run.agencyTemporary !== run.arrivalTemporary
      || run.final.gold !== run.events[0]?.before.gold)
      report.errors.push(`${run.id}: economy, authority, HUD, or 45 gold gross path failed`);
    for (const segment of Object.keys(pickups).filter(id => id !== (run.branch.endsWith('event') ? 'route-5b' : 'route-5a'))) {
      const expected = pickups[segment].length;
      if (run.segments[segment]?.resolved.length !== expected || run.segments[segment]?.collected.length !== expected)
        report.errors.push(`${run.id}/${segment}: missing pickup outcome`);
    }
  }
}
if (!refugeQa && (report.runs.find(run => run.id === 'combined-a')?.segments['route-3']?.collisions !== 0
  || report.runs.find(run => run.id === 'combined-b')?.segments['route-5b']?.collisions !== 1))
  report.errors.push('Combined Risk dodge or collision proof failed');
if (artQa && (report.assetResponses.some(response => response.status !== 200)
  || report.assetResponses.some(response => response.mode === 'off')
  || new Set(report.assetResponses.map(response => response.mode)).size < 2))
  report.errors.push('Approved pouch requests failed or appeared with Reward off');
if (artQa && !report.captures.some(capture => capture.file === 'reward-r1-collected-390.png'
  && capture.state.feedback && capture.state.pulse && capture.state.hud.includes('+5 route')))
  report.errors.push('Mobile collection feedback or HUD proof missing');
if (report.captures.length > 12) report.errors.push('Evidence exceeds 12 screenshots');
await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 Route Reward QA</title><style>body{margin:0;background:#101514;color:#f6e2b5;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0}img{width:100%}</style><h1>T0 Route Reward QA</h1><p><a href="browser-qa.json">Machine readable results</a></p><main>${report.captures.map(capture => `<figure><img src="${capture.file}"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('')}</main>`);
console.log(JSON.stringify({ runs: report.runs.map(run => ({ id: run.id, complete: run.complete,
  events: run.events.length, arrivalTemporary: run.arrivalTemporary, agencyTemporary: run.agencyTemporary,
  collisions: Object.fromEntries(Object.entries(run.segments).map(([id, segment]) => [id, segment.collisions])) })),
  captures: report.captures.length, errors: report.errors }, null, 2));
if (report.errors.length) throw new Error('T0 Route Reward browser QA failed');
