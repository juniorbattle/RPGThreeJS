/** T0 Pursuit proof through the real GameApp traversal and lane controls. */
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const artQa = process.argv.includes('--pursuit-art-qa');
const productionQa = process.argv.includes('--production');
const productionOffUrl = process.argv.includes('--production-pursuit-off-url');
const productionOnUrl = process.argv.includes('--production-pursuit-on-url');
if ((productionOffUrl || productionOnUrl) && !productionQa)
  throw new Error('Production URL checks require --production.');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice('--output='.length)
  ?? (artQa ? 'docs/reports/evidence/traversal-t0/pursuit/art'
    : `docs/reports/evidence/traversal-t0/pursuit/${productionQa
      ? productionOffUrl ? 'production-off-url' : productionOnUrl ? 'production-on-url' : 'production'
      : 'dev'}`);
if (process.argv.includes('--print-output')) { console.log(output); process.exit(0); }
const jsonOnly = process.argv.includes('--json-only');
const requested = process.argv.find(arg => arg.startsWith('--scenario='))?.slice('--scenario='.length);
const scenarios = requested ? [requested] : productionOffUrl ? ['pursuit-off-url']
  : productionOnUrl ? ['pursuit-on-url'] : artQa
    ? ['escape', 'caught', 'path-a', 'path-b'] : productionQa
    ? ['escape', 'caught', 'path-a', 'path-b']
    : ['default', 'pursuit-off', 'risk-off', 'reward-off', 'caught'];
const port = productionQa ? 5222 : 5221;
const base = `http://127.0.0.1:${port}/?qa=1&traversal=t0`;
const desktop = { width: 1440, height: 810 };
const sizes = [desktop, { width: 620, height: 780 }, { width: 390, height: 844 }];
const report = { task: artQa ? 'TRAVERSAL-T0-PURSUIT-ART-1' : 'TRAVERSAL-T0-PURSUIT-PRODUCTION-1',
  baseline: execFileSync('git', ['rev-parse', 'main'], { encoding: 'utf8' }).trim(),
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  environment: productionQa ? 'Vite production preview' : 'Vite DEV',
  pursuerRequests: [], pursuerResponses: [], scenarios: [], captures: [], errors: [] };
const captureNames = new Set();
await mkdir(output, { recursive: true });
const server = productionQa
  ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  : await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
if (!productionQa) await server.listen();
const browser = await chromium.launch({ headless: true });

async function makePage(mode) {
  const context = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('request', request => {
    if (request.url().includes('/pursuit/shadow-pursuer.png')) report.pursuerRequests.push(request.url());
  });
  page.on('pageerror', error => report.errors.push(`${mode}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`${mode}: ${message.text()}`); });
  page.on('response', response => {
    if (response.url().includes('/pursuit/shadow-pursuer.png'))
      report.pursuerResponses.push({ status: response.status(), url: response.url() });
    if (response.status() >= 400 && response.url().includes('/assets/'))
      report.errors.push(`${mode}: asset ${response.status()} ${response.url()}`);
  });
  if (productionQa) {
    // Match the canonical production Reward QA seam: expose GameApp only in Playwright's response.
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      if (!pattern.test(source)) throw new Error('Built GameApp bootstrap hook missing');
      await route.fulfill({ response, body: source.replace(pattern, (match, appName) =>
        match.replace(';window.addEventListener', `;window.__routeQaApp=${appName};window.addEventListener`)) });
    });
  } else await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const marker = 'const app = new GameApp(root, canvas);';
    if (!source.includes(marker)) throw new Error('GameApp bootstrap hook missing');
    await route.fulfill({ response, body: source.replace(marker, `${marker} window.__routeQaApp = app;`) });
  });
  const params = new URLSearchParams({ qa: '1', traversal: 't0' });
  if (mode === 'pursuit-off' || mode === 'pursuit-off-url') params.set('traversalPursuit', '0');
  if (mode === 'pursuit-on-url') params.set('traversalPursuit', '1');
  if (mode === 'risk-off' || mode === 'caught' || mode === 'escape') params.set('traversalRisk', '0');
  if (mode === 'reward-off') params.set('traversalReward', '0');
  await page.goto(`${base}&${params}`);
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
  return { context, page };
}

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.traversal-t0');
    const app = window.__routeQaApp;
    const scene = app?.activeTraversal;
    const pursuit = scene?.routePursuit;
    const risk = scene?.routeRisk;
    const reward = scene?.routeReward;
    const routeRun = scene?.routeRun;
    // Observe scene-local state in this Playwright page. Production DOM telemetry remains absent.
    const tracker = window.__pursuitQaTracker ??= { seen: new Set(), events: [] };
    const startedId = pursuit?.activeWindowId ?? pursuit?.resolvedWindowIds?.[0];
    if (startedId && !tracker.seen.has(`${startedId}:STARTED`)) {
      tracker.seen.add(`${startedId}:STARTED`);
      tracker.events.push({ windowId: startedId, result: 'STARTED', pressure01: pursuit.pressure01 });
    }
    for (const [result, ids] of [['CAUGHT', pursuit?.caughtWindowIds],
      ['ESCAPED', pursuit?.escapedWindowIds]]) {
      for (const id of ids ?? []) {
        if (tracker.seen.has(`${id}:${result}`)) continue;
        tracker.seen.add(`${id}:${result}`);
        tracker.events.push({ windowId: id, result, pressure01: pursuit.pressure01 });
      }
    }
    const proxy = root?.querySelector('.traversal-route-pursuit__proxy');
    const image = proxy?.querySelector('img');
    const vehicle = root?.querySelector('.traversal-vehicle');
    const proxyRect = proxy && !proxy.hidden ? proxy.getBoundingClientRect() : null;
    const vehicleRect = vehicle?.getBoundingClientRect();
    const laneButtons = [...document.querySelectorAll('[data-traversal-lane]')].map(button => {
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
    });
    const visibleRisk = [...(root?.querySelectorAll('[data-risk-hazard]:not([hidden])') ?? [])]
      .map(mark => ({ id: mark.dataset.riskHazard, x: mark.getBoundingClientRect().x }));
    const visibleReward = [...(root?.querySelectorAll('[data-reward-pickup]:not([hidden])') ?? [])]
      .map(mark => ({ id: mark.dataset.rewardPickup, x: mark.getBoundingClientRect().x }));
    return { segment: root?.dataset.routeSegment ?? null, phase: root?.dataset.phase ?? null,
      view: root?.dataset.view ?? null, progress: routeRun?.progress01 ?? 0,
      routeElapsedMs: routeRun?.elapsedMs ?? null, routeDurationMs: scene?.routeSegment?.durationMs ?? null,
      lane: routeRun?.lane ?? 0, speed: routeRun?.speed ?? 0,
      transition: root?.dataset.transition ?? null, presentation: root?.dataset.presentation ?? null,
      departure: root?.dataset.departure ?? null,
      pursuitEnabled: scene?.pursuitEnabled ?? null,
      productionTelemetryKeys: root ? Object.keys(root.dataset).filter(key => key.startsWith('pursuit')) : [],
      productionOutcomeArrayLength: scene?.pursuitQaEvents?.length ?? null,
      pursuitRendererCount: root?.querySelectorAll('.traversal-route-pursuit').length ?? 0,
      pursuitFocusable: root?.querySelectorAll('.traversal-route-pursuit button, .traversal-route-pursuit a, .traversal-route-pursuit [tabindex]').length ?? 0,
      pursuitAriaHidden: root?.querySelector('.traversal-route-pursuit')?.getAttribute('aria-hidden') ?? null,
      pursuitWindow: pursuit?.activeWindowId ?? '', pressure: pursuit?.pressure01 ?? 0,
      pursuerLane: proxy?.dataset.pursuitLane === undefined ? null : Number(proxy.dataset.pursuitLane),
      pursuitEvents: [...tracker.events], pursuitResolved: [...(pursuit?.resolvedWindowIds ?? [])],
      pursuitCaughtCount: pursuit?.caughtCount ?? 0,
      pursuitSpeedBefore: scene?.lastPursuitSpeedBefore ?? 0,
      pursuitSpeedAfter: scene?.lastPursuitSpeedAfter ?? 0,
      pursuitCatchElapsed: scene?.lastPursuitCatchElapsed ?? 0,
      pursuitCatchProgress: scene?.lastPursuitCatchProgress ?? 0,
      proxyVisible: Boolean(proxyRect), proxyActive: Boolean(proxy?.dataset.pursuitActive),
      proxyLeft: proxyRect?.left ?? null, proxyRight: proxyRect?.right ?? null,
      proxyTop: proxyRect?.top ?? null, proxyBottom: proxyRect?.bottom ?? null,
      imageCount: root?.querySelectorAll('.traversal-route-pursuit__image').length ?? 0,
      imageSrc: image?.getAttribute('src') ?? null,
      imageLoaded: Boolean(image?.complete && image.naturalWidth > 0),
      imageNaturalSize: image ? [image.naturalWidth, image.naturalHeight] : null,
      imageAlt: image?.getAttribute('alt') ?? null,
      devProxyParts: root?.querySelectorAll('.traversal-route-pursuit__head, .traversal-route-pursuit__body, .traversal-route-pursuit__wheel').length ?? 0,
      devProxyLabel: Boolean(proxy?.textContent?.includes('DEV · REAR PURSUER')),
      spriteToVehicleWidth: proxyRect && vehicleRect ? proxyRect.width / vehicleRect.width : null,
      spriteToVehicleHeight: proxyRect && vehicleRect ? proxyRect.height / vehicleRect.height : null,
      pursuitZ: Number.parseInt(getComputedStyle(root?.querySelector('.traversal-route-pursuit') ?? document.body).zIndex) || 0,
      vehicleZ: Number.parseInt(vehicle ? getComputedStyle(vehicle).zIndex : '') || 0,
      vehicleLeft: vehicleRect?.left ?? null, vehicleCount: root?.querySelectorAll('.traversal-vehicle').length ?? 0,
      hudBoxes: [...(root?.querySelectorAll('.traversal-hud') ?? [])].map(element => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
      }),
      catchFeedback: Boolean(root?.querySelector('.traversal-route-pursuit__feedback.is-caught:not([hidden])')),
      escapeFeedback: Boolean(root?.querySelector('.traversal-route-pursuit__feedback.is-escaped:not([hidden])')),
      riskEnabled: scene?.riskEnabled ?? null, rewardEnabled: scene?.rewardEnabled ?? null,
      riskCollisions: risk?.collisionCount ?? 0,
      riskSpeedAfter: scene?.lastRiskSpeedAfter ?? 0,
      rewardGold: reward?.collectedGold ?? 0,
      rewardCollected: [...(reward?.collectedPickupIds ?? [])],
      rewardFeedback: root?.querySelector('.traversal-route-reward__feedback.is-active:not([hidden])')?.textContent?.trim() ?? null,
      visibleRisk, visibleReward,
      temporaryLoot: app?.state?.run?.temporaryLoot?.gold ?? null,
      campaignSignature: app?.state ? JSON.stringify({ gold: app.state.gold,
        reputation: app.state.reputation, flags: app.state.flags, inventory: app.state.inventory,
        health: app.state.clan.members.map(member => [member.id, member.currentHealth]),
        visited: app.state.run.visitedNodeIds,
        resolved: app.state.resolvedNodeIds }) : null,
      fork: Boolean(document.querySelector('.traversal-fork-overlay')),
      combat: Boolean(document.querySelector('.combat-frame')),
      dialogue: Boolean(document.querySelector('.dialogue')),
      cinematic: Boolean(document.querySelector('.cinematic-overlay')),
      optionalDecision: root?.dataset.phase === 'DECISION',
      destinationAgency: !root && [...document.querySelectorAll('[data-journey-choice], [data-journey-continue]')]
        .some(button => button.getBoundingClientRect().width > 0 && !button.disabled),
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), laneButtons,
      width: innerWidth, height: innerHeight };
  });
}

async function capture(page, name, run, viewports = [desktop]) {
  if (jsonOnly || captureNames.has(name)) return;
  captureNames.add(name);
  for (const size of viewports) {
    await page.setViewportSize(size);
    await page.waitForTimeout(50);
    const state = await snapshot(page);
    const file = `${name}${size.width === desktop.width ? '' : `-${size.width}`}.png`;
    await page.screenshot({ path: `${output}/${file}` });
    report.captures.push({ file, scenario: run.id, viewport: `${size.width}x${size.height}`, state });
    if (state.overflow || state.laneButtons.some(button => button.x < 0 || button.right > size.width
      || button.y < 0 || button.bottom > size.height))
      report.errors.push(`${file}: overflow or clipped lane button`);
    if (state.proxyActive && (!state.proxyVisible
      || (size.width > 700 ? state.proxyRight > state.vehicleLeft + 12
        : state.proxyLeft >= state.vehicleLeft || state.pursuitZ >= state.vehicleZ)
      || state.pursuerLane === null))
      report.errors.push(`${file}: proxy is not readable behind the caravan`);
    if ((artQa || productionQa) && state.proxyVisible && (!state.imageLoaded || state.imageCount !== 1
      || state.imageSrc !== '/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png'
      || state.imageAlt !== '' || state.devProxyParts || state.devProxyLabel
      || state.spriteToVehicleHeight < .42 || state.spriteToVehicleHeight > .56
      || state.spriteToVehicleWidth < .52 || state.spriteToVehicleWidth > .76))
      report.errors.push(`${file}: Pursuit art/scale contract failed`);
    if ((artQa || productionQa) && name === 'route-3-caught' && (!state.catchFeedback
      || Math.abs(state.proxyRight - state.vehicleLeft) > 10))
      report.errors.push(`${file}: Pursuit art did not reach the caravan at CAUGHT`);
    if (artQa && name === 'route-5b-reward-pouch'
      && !state.visibleReward.some(pickup => pickup.id === 't0:r5b:reward-2'))
      report.errors.push(`${file}: Route 5B pouch was not visible before collection`);
    if ((artQa || productionQa) && name === 'route-5b-later-reward' && !state.rewardFeedback?.includes('+5'))
      report.errors.push(`${file}: Route 5B collection feedback was not visible`);
    // The alpha cutout has 14 transparent source pixels above its visible edge.
    const visibleTop = state.proxyTop + (state.proxyBottom - state.proxyTop) * 14 / 336;
    if (state.proxyVisible && [...state.laneButtons, ...state.hudBoxes].some(box =>
      state.proxyLeft < box.right && state.proxyRight > box.x
      && visibleTop < box.bottom && state.proxyBottom > box.y))
      report.errors.push(`${file}: proxy overlaps HUD or lane controls`);
  }
  await page.setViewportSize(desktop);
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

function desiredLane(mode, state) {
  const p = state.progress;
  switch (state.segment) {
    case 'route-3':
    case 'route-5a':
      if (mode === 'caught' || mode === 'caught-risk-on') return p >= .5 ? 1 : 0;
      if (mode === 'path-a-collect-all') return p < (state.segment === 'route-3' ? .48 : .46) ? 1 : 0;
      return p < .5 ? 1 : 0;
    case 'route-5b':
      if (mode === 'path-b' && p >= .245 && p < .285) return 1; // one intentional Risk contact
      return p < .4 ? 0 : p < .61 ? 1 : 0;
    case 'route-6': return p < .36 ? 1 : p < .62 ? 0 : 1;
    default: return state.segment === 'route-1' ? 1
      : state.segment === 'route-4' && mode === 'path-a-collect-all' && p >= .48 ? 1 : 0;
  }
}

async function drive(mode) {
  const branch = mode === 'path-b' ? 'lion-first-trial-combat' : 'lion-first-trial-event';
  const { context, page } = await makePage(mode);
  const run = { id: mode, branch, complete: false, samples: [], events: [], segments: {},
    collisions: [], laneMoves: [], transitionLeaks: [], pressureTrends: [],
    catch: null, catchRoadSpace: [], escape: null, rewardAfterCollision: null, agency: null };
  report.scenarios.push(run);
  let last = null;
  let startSignature = null;
  const started = Date.now();
  for (let tick = 0; tick < 6500; tick++) {
    await page.waitForTimeout(60);
    const s = await snapshot(page);
    if (mode === 'pursuit-off') {
      run.complete = s.pursuitRendererCount === 0 && s.pursuitEnabled === false
        && !Object.keys((await page.evaluate(() => document.querySelector('.traversal-t0')?.dataset ?? {})))
          .some(key => key.startsWith('pursuit'));
      run.samples.push(s);
      break;
    }
    if (s.segment && s.view === 'route') {
      const segment = run.segments[s.segment] ??= { started: 0, escaped: 0, caught: 0,
        collisions: 0, rewardCollected: [], pressureSamples: [] };
      segment.pressureSamples.push({ progress: s.progress, pressure: s.pressure, lane: s.lane,
        pursuerLane: s.pursuerLane });
      segment.collisions = Math.max(segment.collisions, s.riskCollisions);
      segment.rewardCollected = s.rewardCollected;
      if (s.segment === 'route-3' && s.progress > .19 && !startSignature)
        startSignature = s.campaignSignature;
      if (s.segment === 'route-5b' && s.riskCollisions >= 1 && !run.collisions.length)
        run.collisions.push({ beforePressure: last?.segment === s.segment ? last.pressure : null,
          beforeProgress: last?.segment === s.segment ? last.progress : null,
          beforeRiskCollisions: last?.riskCollisions ?? null,
          beforeRewardCollected: last?.rewardCollected ?? null,
          beforeTemporaryLoot: last?.temporaryLoot ?? null, at: s });
      if (run.collisions.length && s.segment === 'route-5b'
        && s.rewardCollected.includes('t0:r5b:reward-2') && !run.rewardAfterCollision)
        run.rewardAfterCollision = s;
      if (s.pursuitWindow && s.proxyVisible && s.progress > .23 && s.segment === 'route-3'
        && mode === 'escape' && !captureNames.has('route-3-start'))
        await capture(page, 'route-3-start', run, sizes);
      if (s.segment === 'route-3' && s.progress > .5 && s.progress < .57
        && mode === 'caught' && !captureNames.has('route-3-lane-switch'))
        await capture(page, 'route-3-lane-switch', run);
      if (s.segment === 'route-3' && s.pressure > .78 && mode === 'caught'
        && !captureNames.has('route-3-high-pressure'))
        await capture(page, 'route-3-high-pressure', run);
      if (s.catchFeedback && mode === 'caught' && !captureNames.has('route-3-caught'))
        await capture(page, 'route-3-caught', run);
      if (s.escapeFeedback && s.segment === 'route-3' && mode === 'escape'
        && !captureNames.has('route-3-escaped'))
        await capture(page, 'route-3-escaped', run);
      if (s.segment === 'route-5b' && s.riskCollisions >= 1 && s.proxyVisible
        && mode === 'path-b' && !captureNames.has('route-5b-risk-pursuit'))
        await capture(page, 'route-5b-risk-pursuit', run, [sizes[1]]);
      if (artQa && s.segment === 'route-5b' && s.progress >= .8 && s.progress < .81
        && s.visibleReward.some(pickup => pickup.id === 't0:r5b:reward-2')
        && mode === 'path-b' && !captureNames.has('route-5b-reward-pouch'))
        await capture(page, 'route-5b-reward-pouch', run, [sizes[2]]);
      if (run.rewardAfterCollision && mode === 'path-b' && !captureNames.has('route-5b-later-reward'))
        await capture(page, 'route-5b-later-reward', run, [sizes[2]]);
      if (s.segment === 'route-6' && s.pursuitWindow && s.progress > .25 && s.progress < .36
        && mode === 'path-a' && !artQa && !captureNames.has('route-6-pursuit'))
        await capture(page, 'route-6-pursuit', run);
    }
    if (s.pursuitEvents.length > run.events.length) {
      const fresh = s.pursuitEvents.slice(run.events.length);
      run.events.push(...fresh);
      if (fresh.some(event => event.result === 'CAUGHT')) {
        run.catch = { ...s, campaignBefore: startSignature,
          temporaryLootBefore: last?.temporaryLoot ?? null,
          routeElapsedBefore: last?.routeElapsedMs ?? null,
          routeProgressBefore: last?.progress ?? null,
          routeDurationBefore: last?.routeDurationMs ?? null };
        for (const object of [...(last?.visibleRisk ?? []), ...(last?.visibleReward ?? [])]) {
          const after = [...s.visibleRisk, ...s.visibleReward].find(item => item.id === object.id);
          if (after) run.catchRoadSpace.push({ id: object.id, beforeX: object.x,
            afterX: after.x, deltaPx: after.x - object.x });
        }
      }
      if (fresh.some(event => event.result === 'ESCAPED') && s.segment === 'route-3')
        run.escape = { ...s, campaignBefore: startSignature };
    }
    if (last?.segment === s.segment && last.pursuitWindow && s.pursuitWindow
      && s.progress > last.progress && s.lane !== s.pursuerLane && last.lane !== last.pursuerLane)
      run.pressureTrends.push({ segment: s.segment, from: last.pressure, to: s.pressure });
    if (s.segment && (s.view !== 'route' || s.transition || s.departure || s.presentation
      || s.phase === 'ARRIVING') && s.proxyActive)
      run.transitionLeaks.push({ segment: s.segment, view: s.view, phase: s.phase,
        transition: s.transition, departure: s.departure, presentation: s.presentation });
    if (s.segment && (s.pursuitRendererCount !== 1 || s.imageCount !== 1
      || s.pursuitAriaHidden !== 'true' || s.pursuitFocusable
      || s.vehicleCount !== 1 || s.overflow)
      ) report.errors.push(`${mode}: renderer/accessibility/layout invariant failed at ${s.segment}`);
    if (productionQa && s.segment && (s.productionTelemetryKeys.length || s.productionOutcomeArrayLength))
      report.errors.push(`${mode}: production Pursuit telemetry was exposed or accumulated`);
    if (s.segment && s.view === 'route' && !s.transition && !s.departure
      && s.phase === 'RUNNING' && s.progress < .9) {
      const lane = desiredLane(mode, s);
      if (s.lane !== lane) {
        await page.locator(`[data-traversal-lane="${lane}"]`).click().catch(() => {});
        run.laneMoves.push({ segment: s.segment, progress: s.progress, lane });
      }
    }
    if (['escape', 'default', 'risk-off', 'reward-off', 'pursuit-off-url', 'pursuit-on-url']
      .includes(mode) && s.segment === 'route-3' && s.progress > .83) {
      run.complete = true; break;
    }
    if ((mode === 'caught' || mode === 'caught-risk-on') && run.catch && s.segment === 'route-3'
      && s.progress > run.catch.progress + .04) {
      run.complete = true; break;
    }
    if (s.destinationAgency) { run.agency = s; run.complete = true; break; }
    if (s.fork && !s.transition && !s.departure)
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click().catch(() => {});
    else if (s.optionalDecision && !s.transition)
      await page.locator(mode === 'path-b' ? '[data-traversal-skip]' : '[data-traversal-confirm]').click().catch(() => {});
    else if (s.combat) await playCombat(page);
    else if (s.cinematic) await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    else if (s.dialogue) {
      const choice = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choice.count()) await choice.first().click().catch(() => {});
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    last = s;
    if (Date.now() - started > 240000) { report.errors.push(`${mode}: timeout ${JSON.stringify(s)}`); break; }
  }
  run.final = await snapshot(page);
  run.sampleCount = Object.values(run.segments).reduce((count, segment) => count + segment.pressureSamples.length, 0);
  for (const segment of Object.values(run.segments)) delete segment.pressureSamples;
  await context.close();
  console.log(`${mode}: ${run.complete ? 'complete' : 'incomplete'}; events ${run.events.map(event => event.result).join(',')}`);
}

try {
  for (const mode of scenarios) await drive(mode);
} finally {
  await browser.close();
  if (productionQa) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  else await server.close();
}

for (const run of report.scenarios) {
  if (!run.complete || run.transitionLeaks.length) report.errors.push(`${run.id}: incomplete or pursuit leaked into transition`);
  if (['escape', 'default', 'risk-off', 'reward-off', 'pursuit-off-url', 'pursuit-on-url'].includes(run.id)
    && (!run.escape || run.catch || run.escape.campaignBefore !== run.escape.campaignSignature
    || run.events.filter(event => event.result === 'STARTED').length !== 1
    || run.events.filter(event => event.result === 'ESCAPED').length !== 1
    || !run.pressureTrends.some(trend => trend.to < trend.from)))
    report.errors.push('Route 3 clean ESCAPED proof failed');
  if (['caught', 'caught-risk-on'].includes(run.id)
    && (!run.catch || run.catch.campaignBefore !== run.catch.campaignSignature
    || run.catch.pursuitSpeedAfter !== 1 || run.catch.pursuitSpeedBefore <= 1
    || run.catch.pursuitCatchElapsed <= 0 || run.catch.pursuitCatchProgress <= 0
    || run.catch.temporaryLootBefore !== run.catch.temporaryLoot
    || run.catch.routeDurationBefore !== run.catch.routeDurationMs
    || Math.abs(run.catch.progress - run.catch.routeElapsedMs / run.catch.routeDurationMs) > 1e-9
    || run.final.speed <= run.catch.pursuitSpeedAfter
    || run.events.filter(event => event.result === 'CAUGHT').length !== 1))
    report.errors.push('Route 3 CAUGHT speed/campaign proof failed');
  if (['path-a', 'path-b', 'path-a-collect-all'].includes(run.id)) {
    if (!run.agency || run.events.filter(event => event.result === 'STARTED').length !== 3
      || run.events.filter(event => event.result === 'ESCAPED').length !== 3
      || run.events.some(event => event.result === 'CAUGHT'))
      report.errors.push(`${run.id}: full clean path pursuit outcomes failed`);
  }
  if (run.id === 'path-a-collect-all') {
    const collected = Object.values(run.segments).flatMap(segment => segment.rewardCollected);
    if (collected.length !== 9 || new Set(collected).size !== 9)
      report.errors.push('Path A did not collect all nine Rewards while escaping three Pursuit windows');
  }
  if (run.id === 'caught-risk-on' && (!run.catchRoadSpace.length
    || run.catchRoadSpace.some(object => Math.abs(object.deltaPx) > 40)))
    report.errors.push('CAUGHT caused a visible later Risk or Reward object to jump');
  if (run.id === 'path-b' && (!run.collisions.length || !run.rewardAfterCollision
    || run.rewardAfterCollision.temporaryLoot <= run.collisions[0].at.temporaryLoot
    || run.collisions[0].beforePressure === null
    || run.collisions[0].at.riskCollisions - run.collisions[0].beforeRiskCollisions !== 1
    || JSON.stringify(run.collisions[0].at.rewardCollected) !== JSON.stringify(run.collisions[0].beforeRewardCollected)
    || run.collisions[0].at.temporaryLoot !== run.collisions[0].beforeTemporaryLoot
    || Math.abs(run.collisions[0].at.pressure - run.collisions[0].beforePressure
      - .22 - (run.collisions[0].at.progress - run.collisions[0].beforeProgress) * 15 * .11) > .035))
    report.errors.push('Route 5B Risk collision and later Reward coexistence failed');
}
if (report.captures.length > 10) report.errors.push('Evidence exceeds ten screenshots');
if (artQa && !jsonOnly && scenarios.includes('path-b') && !captureNames.has('route-5b-reward-pouch'))
  report.errors.push('Route 5B pre-collection pouch evidence missing');
if (productionQa && (!report.pursuerResponses.length
  || report.pursuerResponses.some(response => response.status !== 200)))
  report.errors.push('Production Pursuit art was not served with HTTP 200');
await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>T0 Pursuit QA</title><style>body{margin:0;background:#101514;color:#f2dbb9;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0}img{width:100%}</style><h1>T0 Pursuit QA</h1><p><a href="browser-qa.json">Machine readable results</a></p><main>${report.captures.map(capture => `<figure><img src="${capture.file}"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('')}</main>`);
console.log(JSON.stringify({ scenarios: report.scenarios.map(run => ({ id: run.id, complete: run.complete,
  events: run.events.map(event => event.result), collisions: run.collisions.length,
  rewardAfterCollision: Boolean(run.rewardAfterCollision), sampleCount: run.sampleCount })),
  captures: report.captures.length, errors: report.errors }, null, 2));
if (report.errors.length) throw new Error('T0 Pursuit browser QA failed');
