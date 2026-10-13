/** T0 Reward browser QA for DEV and the built production preview. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const productionQa = process.argv.includes('--production');
const jsonOnly = process.argv.includes('--json-only');
const port = productionQa ? 5220 : 5219;
const viewport = { width: 1440, height: 810 };
const mobile = [{ width: 620, height: 780 }, { width: 390, height: 844 }];
const refugeQa = process.argv.includes('--reward-refuge-qa');
const artQa = process.argv.includes('--reward-art-qa');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice('--output='.length)
  ?? `docs/reports/evidence/traversal-t0/reward/${artQa ? 'art' : refugeQa ? 'refuge'
    : productionQa ? 'production' : 'dev'}`;
if (process.argv.includes('--print-output')) { console.log(output); process.exit(0); }
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
const report = { task: 'TRAVERSAL-T0-ROUTE-REWARD-PRODUCTION-1',
  baseline: 'f4bb94226f1f67120a44692e66cc7e46c38c5548',
  environment: productionQa ? 'built Vite production preview' : 'Vite DEV',
  runs: [], captures: [], errors: [], assetResponses: [] };
await mkdir(output, { recursive: true });
const server = productionQa
  ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  : await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
if (!productionQa) await server.listen();
const browser = await chromium.launch({ headless: true });

async function makePage(mode) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${mode}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`${mode}: ${message.text()}`); });
  page.on('response', response => {
    if (response.url().endsWith(pouchPath)) report.assetResponses.push({ mode, status: response.status() });
  });
  page.on('requestfailed', request => {
    if (request.url().includes('/assets/')) report.errors.push(`${mode}: asset request failed ${request.url()}`);
  });
  if (productionQa) {
    // Expose the app only inside the Playwright response; the Vite build retains its production policy.
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      if (!pattern.test(source)) throw new Error('Built GameApp bootstrap hook missing');
      await route.fulfill({ response, body: source.replace(pattern, (match, appName) =>
        match.replace(';window.addEventListener', `;window.__routeQaApp=${appName};window.addEventListener`)) });
    });
  } else {
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const marker = 'const app = new GameApp(root, canvas);';
      if (!source.includes(marker)) throw new Error('GameApp bootstrap hook missing');
      await route.fulfill({ response, body: source.replace(marker, `${marker} window.__routeQaApp = app;`) });
    });
  }
  const params = new URLSearchParams({ qa: '1', traversal: 't0' });
  if (mode === 'off' || mode === 'production-reward-off-url') params.set('traversalReward', '0');
  if (mode === 'isolated') params.set('traversalRisk', '0');
  await page.goto(`http://127.0.0.1:${port}/?${params}`);
  if (productionQa) {
    await page.waitForFunction(() => Boolean(window.__routeQaApp), null, { timeout: 30000 });
    await page.waitForSelector('.title-screen', { timeout: 30000 });
    await page.evaluate(async () => {
      const app = window.__routeQaApp;
      app.qaEnabled = true;
      app.traversalT0QaEnabled = true;
      await app.startTraversalT0Qa();
    });
  }
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
        hud: document.querySelector('.campaign-status-hud')?.textContent ?? '',
        segment: document.querySelector('.traversal-t0')?.dataset.routeSegment,
        progress: Number(document.querySelector('.traversal-t0')?.dataset.routeProgress ?? 0) });
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
      rewardRendererCount: root?.querySelectorAll('.traversal-route-reward').length ?? 0,
      riskRendererCount: root?.querySelectorAll('.traversal-route-risk').length ?? 0,
      riskImpact: root?.querySelector('.traversal-route-risk__impact')?.classList.contains('is-active') ?? false,
      rewardAriaHidden: root?.querySelector('.traversal-route-reward')?.getAttribute('aria-hidden') ?? null,
      rewardFocusableCount: root?.querySelectorAll('.traversal-route-reward a, .traversal-route-reward button, .traversal-route-reward [tabindex]').length ?? 0,
      productionTelemetry: ['rewardEnabled', 'rewardResolved', 'rewardCollected', 'rewardGold']
        .filter(key => root?.dataset[key] !== undefined),
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
      acceptedCount: window.__rewardQaEvents?.filter(event => event.accepted).length ?? 0,
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
  if (jsonOnly || refugeQa && name !== 'reward-refuge-secured') return;
  const sizes = name === 'reward-r1-collected' ? [mobile[1]] : [viewport, ...widths];
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
  if (productionQa) {
    await frame?.evaluate(async () => {
      if (window.__routeQaVictorySent || !window.__BOOTED) return;
      window.__routeQaBootSeenAt ??= performance.now();
      if (performance.now() - window.__routeQaBootSeenAt < 1000) return;
      await document.fonts.ready;
      const session = window.parent.__routeQaApp?.combat?.session;
      if (!session) return;
      window.__routeQaVictorySent = true;
      window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: true,
        combatId: session.config.id, inventory: session.inventory,
        participants: session.preferredUnitIds,
        unitHealth: Object.fromEntries(session.clan.map(unit => [unit.id, unit.currentHealth])),
      }, window.location.origin);
    }).catch(() => {});
    return;
  }
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
    arrivalTemporary: null, agencyTemporary: null, riskContacts: [], visualJumps: [],
    rendererMax: 0, riskRendererMax: 0, telemetryKeys: [], rewardFocusableMax: 0,
    ariaFailures: [], rendererFailures: [], feedbackSeen: false, pouchVisible: false,
    keyboardMoves: [], initialGold: null };
  report.runs.push(run);
  const applied = new Set();
  const captured = new Set();
  let last = null;
  let lastVisible = new Map();
  const started = Date.now();
  for (let tick = 0; tick < 7000; tick++) {
    await page.waitForTimeout(last?.transition || last?.progress > .93 ? 18 : 70);
    const s = await snapshot(page);
    run.initialGold ??= s.gold;
    if (s.segment) {
      const segment = run.segments[s.segment] ??= { firstGold: s.temporary, lastGold: s.temporary,
        resolved: [], collected: [], collisions: 0, seen: [] };
      segment.lastGold = s.temporary;
      segment.resolved = s.resolved;
      segment.collected = s.collected;
      if (s.riskImpact && !last?.riskImpact) {
        segment.collisions++;
        run.riskContacts.push({ segment: s.segment, progress: s.progress, temporary: s.temporary,
          gold: s.gold, speed: s.speed, temporaryDelta: s.temporary - (last?.temporary ?? s.temporary),
          goldDelta: s.gold - (last?.gold ?? s.gold),
          acceptedDelta: s.acceptedCount - (last?.acceptedCount ?? s.acceptedCount) });
      }
      if (!productionQa) segment.collisions = Math.max(segment.collisions, s.riskCollisionCount);
      if (segment.collisions) segment.speedAfterCollisionMax = Math.max(
        segment.speedAfterCollisionMax ?? 0, s.speed);
      segment.markCount = Math.max(segment.markCount ?? 0, s.marks.length);
      run.rendererMax = Math.max(run.rendererMax, s.rewardRendererCount);
      run.riskRendererMax = Math.max(run.riskRendererMax, s.riskRendererCount);
      run.rewardFocusableMax = Math.max(run.rewardFocusableMax, s.rewardFocusableCount);
      run.telemetryKeys.push(...s.productionTelemetry.filter(key => !run.telemetryKeys.includes(key)));
      if (s.rewardRendererCount && s.rewardAriaHidden !== 'true') run.ariaFailures.push(s.segment);
      if (s.rewardRendererCount !== (mode === 'off' ? 0 : 1)
        || s.riskRendererCount !== (mode === 'isolated' ? 0 : 1))
        run.rendererFailures.push(`${s.segment}:${s.rewardRendererCount}/${s.riskRendererCount}`);
      if (s.feedback && s.pulse) run.feedbackSeen = true;
      if (s.marks.some(mark => !mark.hidden && mark.imageLoaded)) run.pouchVisible = true;
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
            const keyboard = productionQa && mode === 'production-default'
              && branch.endsWith('event') && s.segment === 'route-1';
            if (keyboard) {
              await page.keyboard.press(lane === 0 ? 'ArrowUp' : 'ArrowDown');
              run.keyboardMoves.push({ segment: s.segment, progress: s.progress, lane });
            } else await page.locator(`[data-traversal-lane="${lane}"]`).click();
            run.laneMoves.push({ segment: s.segment, progress: s.progress, lane, input: keyboard ? 'keyboard' : 'button' });
          }
        }
      }
    }
    if ((mode === 'isolated' && !productionQa || mode === 'production-default')
      && branch.endsWith('event') && s.segment === 'route-1'
      && s.progress > .48 && s.progress < .6 && !captured.has('approach')) {
      captured.add('approach'); await capture(page, 'reward-r1-approach', run, mobile);
    }
    if ((mode === 'isolated' && !productionQa || mode === 'production-default')
      && branch.endsWith('event') && s.segment === 'route-1'
      && s.feedback && !captured.has('collect')) {
      captured.add('collect'); await capture(page, 'reward-r1-collected', run);
    }
    if (mode === 'miss' && s.segment === 'route-1' && s.progress > .68 && !captured.has('miss')) {
      captured.add('miss'); await capture(page, 'reward-r1-missed', run);
    }
    if ((mode === 'combined' && !productionQa || mode === 'production-default')
      && branch.endsWith('event') && s.segment === 'route-3'
      && s.progress > .42 && s.progress < .50 && !captured.has('route3')) {
      captured.add('route3'); await capture(page, 'reward-r3-risk', run);
    }
    if ((mode === 'combined' && !productionQa || mode === 'production-default')
      && !branch.endsWith('event') && s.segment === 'route-5b'
      && s.progress > .72 && s.progress < .81 && !captured.has('route5b')) {
      captured.add('route5b'); await capture(page, 'reward-r5b-after-collision', run);
    }
    if ((mode === 'combined' && !productionQa || mode === 'production-default')
      && branch.endsWith('event') && s.segment === 'route-6'
      && s.progress > .80 && s.progress < .87 && !captured.has('route6')) {
      captured.add('route6'); await capture(page, 'reward-r6-approach', run);
    }
    if (s.phase === 'ARRIVING' && run.arrivalTemporary == null) run.arrivalTemporary = s.temporary;
    if (!s.sceneCount && s.destinationAgency) {
      run.agencyTemporary = s.temporary;
      run.complete = true;
      if ((mode === 'combined' && !productionQa || mode === 'production-default')
        && branch.endsWith('event')) await capture(page, 'reward-arrival-agency', run);
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
  if (refugeQa && run.complete && (mode === 'combined' || mode === 'production-default')) {
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
  if (refugeQa) await drive(productionQa ? 'production-default' : 'combined', 'lion-first-trial-event');
  else if (productionQa) {
    await drive('miss');
    await drive('production-default', 'lion-first-trial-event');
    await drive('production-default', 'lion-first-trial-combat');
    await drive('production-reward-off-url', 'lion-first-trial-event');
  } else {
    await drive('off');
    await drive('miss');
    for (const mode of ['isolated', 'combined']) {
      await drive(mode, 'lion-first-trial-event');
      await drive(mode, 'lion-first-trial-combat');
    }
  }
} finally {
  await browser.close();
  if (productionQa) await new Promise((resolve, reject) =>
    server.httpServer.close(error => error ? reject(error) : resolve()));
  else await server.close();
}

for (const run of report.runs) {
  if (!run.complete || run.checkpointLeaks.length || run.visualJumps.length)
    report.errors.push(`${run.id}: incomplete, leaked mark, or visual jump`);
  if (run.rendererFailures.length || run.ariaFailures.length || run.rewardFocusableMax
    || run.rendererMax !== (run.mode === 'off' ? 0 : 1)
    || run.riskRendererMax !== (run.mode === 'isolated' ? 0 : 1))
    report.errors.push(`${run.id}: renderer lifecycle or accessibility failed`);
  if (productionQa && run.telemetryKeys.length)
    report.errors.push(`${run.id}: production Reward diagnostic datasets exposed`);
  if (run.mode === 'miss' && (run.events.length || run.final.temporary
    || run.final.gold !== run.initialGold || run.feedbackSeen
    || run.final.marks.some(mark => !mark.hidden)
    || !run.segments['route-1']?.seen.includes('t0:r1:reward-1')
    || !productionQa && !run.final.resolved.includes('t0:r1:reward-1')))
    report.errors.push(`${run.id}: miss failed`);
  if (run.mode === 'off' && (run.events.length || run.pouchVisible || run.rendererMax))
    report.errors.push(`${run.id}: DEV reward-off override failed`);
  if (run.mode === 'isolated' || run.mode === 'combined'
    || run.mode === 'production-default' || run.mode === 'production-reward-off-url') {
    if (run.events.length !== 9 || run.events.reduce((sum, event) => sum + event.amount, 0) !== 45
      || run.events.some(event => !event.accepted || event.amount !== 5
      || event.after.gold !== event.before.gold || event.after.temporary !== event.before.temporary + 5
      || JSON.stringify(event.before.visited) !== JSON.stringify(event.after.visited)
      || JSON.stringify(event.before.resolved) !== JSON.stringify(event.after.resolved)
      || !event.hud.includes(`+${event.after.temporary} route`))
      || run.arrivalTemporary < 5 || run.agencyTemporary !== run.arrivalTemporary
      || run.final.gold !== run.events[0]?.before.gold
      || !run.pouchVisible || !run.feedbackSeen)
      report.errors.push(`${run.id}: economy, authority, HUD, or 45 gold gross path failed`);
    for (const segment of Object.keys(pickups).filter(id => id !== (run.branch.endsWith('event') ? 'route-5b' : 'route-5a'))) {
      const expected = pickups[segment].length;
      if (run.segments[segment]?.markCount !== expected
        || !productionQa && (run.segments[segment]?.resolved.length !== expected
          || run.segments[segment]?.collected.length !== expected))
        report.errors.push(`${run.id}/${segment}: missing pickup outcome`);
    }
  }
  if (run.riskContacts.some(contact => contact.goldDelta || contact.temporaryDelta || contact.acceptedDelta))
    report.errors.push(`${run.id}: collision changed gold or accepted Reward`);
}
const combinedMode = productionQa ? 'production-default' : 'combined';
if (!refugeQa && (report.runs.find(run => run.id === `${combinedMode}-a`)?.segments['route-3']?.collisions !== 0
  || report.runs.find(run => run.id === `${combinedMode}-b`)?.segments['route-5b']?.collisions !== 1))
  report.errors.push('Combined Risk dodge or collision proof failed');
if (!refugeQa) {
  const dodge = report.runs.find(run => run.id === `${combinedMode}-a`);
  const collision = report.runs.find(run => run.id === `${combinedMode}-b`);
  const contact = collision?.riskContacts.find(event => event.segment === 'route-5b');
  if (!dodge?.events.some(event => event.segment === 'route-3' && event.accepted)
    || !contact || !collision.events.some(event => event.segment === 'route-5b'
      && event.accepted && event.progress > contact.progress)
    || collision.segments['route-5b']?.speedAfterCollisionMax <= contact.speed)
    report.errors.push('Risk dodge, collision recovery, or later Reward collection failed');
}
if (productionQa && !refugeQa && !report.runs.find(run => run.id === 'production-default-a')?.keyboardMoves.length)
  report.errors.push('Production keyboard lane control was not exercised');
if (report.assetResponses.some(response => response.status !== 200)
  || report.assetResponses.some(response => response.mode === 'off')
  || new Set(report.assetResponses.map(response => response.mode)).size < (refugeQa ? 1 : productionQa ? 3 : 2))
  report.errors.push('Approved pouch requests failed or appeared with Reward off');
if (!jsonOnly && !refugeQa && !report.captures.some(capture => capture.file === 'reward-r1-collected-390.png'
  && capture.state.feedback && capture.state.pulse && capture.state.hud.includes('+5 route')))
  report.errors.push('Mobile collection feedback or HUD proof missing');
if (report.captures.length > 10) report.errors.push('Evidence exceeds 10 screenshots');
if (productionQa) {
  const path = `dist${pouchPath}`;
  const png = await readFile(path);
  const manifest = JSON.parse(await readFile('dist/assets/generated/lion-phase/traversal/t0/asset-manifest.json', 'utf8'));
  const entry = manifest.assets.find(asset => asset.id === 'reward-coin-pouch');
  report.assetContract = { path: pouchPath, built: path, width: png.readUInt32BE(16),
    height: png.readUInt32BE(20), colorType: png[25], sha256: createHash('sha256').update(png).digest('hex'),
    manifest: entry, responses: report.assetResponses };
  if (!entry || entry.path !== pouchPath || entry.width !== report.assetContract.width
    || entry.height !== report.assetContract.height || entry.sha256 !== report.assetContract.sha256
    || report.assetContract.colorType !== 6)
    report.errors.push('Built pouch does not match production manifest');
}
await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 Route Reward QA</title><style>body{margin:0;background:#101514;color:#f6e2b5;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0}img{width:100%}</style><h1>T0 Route Reward QA</h1><p><a href="browser-qa.json">Machine readable results</a></p><main>${report.captures.map(capture => `<figure><img src="${capture.file}"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('')}</main>`);
console.log(JSON.stringify({ runs: report.runs.map(run => ({ id: run.id, complete: run.complete,
  events: run.events.length, arrivalTemporary: run.arrivalTemporary, agencyTemporary: run.agencyTemporary,
  collisions: Object.fromEntries(Object.entries(run.segments).map(([id, segment]) => [id, segment.collisions])) })),
  captures: report.captures.length, errors: report.errors }, null, 2));
if (report.errors.length) throw new Error('T0 Route Reward browser QA failed');
