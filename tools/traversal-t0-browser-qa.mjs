/** Canonical T0 regression: both real paths, shared world, and production Route mechanics. */
if (process.argv.includes('--reward-qa')) {
  // The specialized Reward driver accepts --production and the DEV isolation modes.
  await import('./traversal-t0-reward-qa.mjs');
  process.exit(0);
}
if (process.argv.includes('--pursuit-qa') || process.argv.includes('--pursuit-art-qa')) {
  await import('./traversal-t0-pursuit-qa.mjs');
  process.exit(0);
}
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const artQa = process.argv.includes('--risk-art-evidence');
const artOffQa = process.argv.includes('--risk-art-off-evidence');
const productionQa = process.argv.includes('--production');
const productionDisableUrl = process.argv.includes('--production-disable-url');
const riskOffQa = process.argv.includes('--risk-off') || process.argv.includes('--risk-off-evidence') || artOffQa;
if (productionQa && riskOffQa) throw new Error('Risk-off is a DEV-only QA mode.');
if (productionDisableUrl && !productionQa) throw new Error('Production disable URL check requires --production.');
const riskQa = !riskOffQa;
const compactQa = !artQa && !artOffQa && !process.argv.includes('--legacy-gallery');
const jsonOnly = process.argv.includes('--json-only');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice('--output='.length)
  ?? (artQa ? 'docs/reports/evidence/traversal-t0/integrated/risk-art'
  : artOffQa ? 'docs/reports/evidence/traversal-t0/integrated/risk-art-off'
  : `docs/reports/evidence/traversal-t0/integrated/${productionQa
    ? productionDisableUrl ? 'production-disable-url'
      : process.argv.includes('--production-risk-off-url') ? 'production-risk-off-url' : 'production'
    : riskOffQa ? 'dev-off' : 'dev'}`);
if (process.argv.includes('--print-output')) { console.log(output); process.exit(0); }
const port = productionQa ? 5218 : 5217;
const base = `http://127.0.0.1:${port}/?qa=1&traversal=t0${riskOffQa || process.argv.includes('--production-risk-off-url')
  || productionDisableUrl ? '&traversalRisk=0' : ''}${productionDisableUrl
  ? '&traversalReward=0&traversalPursuit=0' : ''}`;
const desktop = { width: 1440, height: 810 };
const mobile = [{ width: 620, height: 780 }, { width: 390, height: 844 }];
const referenceForest = '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png';
const evidence = new Set(compactQa ? riskOffQa ? ['01-route-1-early'] : [
  'risk-r1-before', 'risk-r1-impact', 'risk-r1-dodge-before',
  'risk-r5b-roadblock', 'risk-r5b-second-impact', 'risk-r6-telegraph',
  'risk-r6-visible', '10-destination-agency', 'integrated-route-3-reward',
  'integrated-route-5b', 'integrated-route-5b-reward', 'integrated-route-6-pouch',
] : artQa ? [
  'risk-r1-before', 'risk-r1-impact', 'risk-r1-recovered',
  'risk-r1-dodge-before', 'risk-r1-dodge-after', 'risk-r3-boulder',
  'risk-r5b-roadblock', 'risk-r6-telegraph', 'risk-r6-visible', 'risk-r6-dodged',
] : artOffQa ? ['01-route-1-early'] : [
  '01-route-1-early', 'cp1-b-black', 'cp1-c-after-reveal', '04-route-3-early',
  '04-refugees-aider', 'fork-a-black', 'fork-b-checkpoint', '06-route-5a', '06-cp5a-branch-checkpoint',
  '08-route-6-rush', '09-route-6-coast', '09-arrival', '10-destination-agency',
  '12-refugees-passer', 'passer-departure', 'refugees-b-return-black',
  '11-route-5b', '11-cp5b-branch-checkpoint', '11-route-6-rush-b', '11-arrival-b',
  'responsive-route-3-refugees-black-390',
  'risk-r1-before', 'risk-r1-impact', 'risk-r1-recovered',
  'risk-r1-dodge-before', 'risk-r1-dodge-after', 'risk-r5b-two-lanes',
  'risk-r5b-second-impact', 'risk-r6-telegraph', 'risk-r6-dodged',
]);
await mkdir(output, { recursive: true });
const server = productionQa
  ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  : await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
if (!productionQa) await server.listen();
const browser = await chromium.launch({ headless: true });
const gallery = { task: productionQa ? 'TRAVERSAL-T0-PRODUCTION-LOOP-FINAL-1'
  : 'TRAVERSAL-T0-ROUTE-RISK-PRODUCTION-1', url: base,
  method: `${productionQa ? 'built Vite preview with Playwright combat-result fixture' : 'Vite DEV'}; shared GameApp T0 QA entry; real scene mounting, requestAnimationFrame and lane controls`,
  captures: [], blackFrames: [], runs: [], errors: [], riskAssetResponses: {},
  routeAssetResponses: {} };

async function makePage(context) {
  const page = await context.newPage();
  page.on('pageerror', error => gallery.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') gallery.errors.push(`console: ${message.text()}`); });
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('/assets/'))
      gallery.errors.push(`asset ${response.status()}: ${response.url()}`);
    if (response.url().includes('/traversal/t0/risk/')) {
      const name = response.url().split('/').at(-1);
      const entry = gallery.riskAssetResponses[name] ??= { statuses: [], requests: 0 };
      entry.statuses.push(response.status());
      entry.requests++;
    }
    if (/\/traversal\/t0\/(reward|pursuit)\//.test(response.url())) {
      const name = response.url().split('/').at(-1);
      const entry = gallery.routeAssetResponses[name] ??= { statuses: [], requests: 0 };
      entry.statuses.push(response.status());
      entry.requests++;
    }
  });
  page.on('requestfailed', request => {
    if (request.url().includes('/assets/')) gallery.errors.push(`asset request failed: ${request.url()}`);
  });
  if (productionQa) {
    // Expose only the local Playwright page's app instance. The served bundle and its
    // production env policy remain the exact output of npm run build.
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      if (!pattern.test(source)) throw new Error('Built GameApp bootstrap hook could not be located.');
      await route.fulfill({ response, body: source.replace(pattern, (match, appName) =>
        match.replace(';window.addEventListener', `;window.__routeQaApp=${appName};window.addEventListener`)) });
    });
  } else {
    await page.route('**/src/main.ts', async route => {
      const response = await route.fetch();
      const source = await response.text();
      if (!source.includes('const app = new GameApp(root, canvas);'))
        throw new Error('DEV GameApp bootstrap hook could not be located.');
      await route.fulfill({ response, body: source.replace(
        'const app = new GameApp(root, canvas);',
        'const app = new GameApp(root, canvas); window.__routeQaApp = app;',
      ) });
    });
  }
  await page.goto(base);
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
    window.__routeQaArrivalCount = 0;
    window.__routeQaFrameIssues = [];
    window.__routeQaUnsampledSwaps = [];
    window.__routeQaCoastSamples = [];
    let lastView = null;
    let lastFrameAt = null;
    const inspectFrame = () => {
      const now = performance.now();
      const frameGap = lastFrameAt === null ? 0 : now - lastFrameAt;
      lastFrameAt = now;
      const root = document.querySelector('.traversal-t0');
      if (document.querySelector('.travel-view')) window.__routeQaFrameIssues.push('TravelView flash');
      if (root) {
        const route = root.querySelector('.traversal-world__route-sections');
        const checkpoint = root.querySelector('.traversal-world__sections');
        const routeVisible = getComputedStyle(route).visibility !== 'hidden';
        const checkpointVisible = getComputedStyle(checkpoint).visibility !== 'hidden';
        const cover = Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity);
        const global = document.querySelector('.scene-transition--traversal');
        const globalOpacity = global ? Number(getComputedStyle(global).opacity) : 0;
        if (routeVisible === checkpointVisible) window.__routeQaFrameIssues.push('simultaneous or missing world surfaces');
        if (lastView && lastView !== root.dataset.view && cover < .999 && globalOpacity < .999) {
          const detail = `${lastView} -> ${root.dataset.view} at ${root.dataset.routeSegment}; gap ${Math.round(frameGap)}ms; cover ${cover}/${globalOpacity}`;
          if (frameGap <= 100) window.__routeQaFrameIssues.push(`uncovered ${detail}`);
          else window.__routeQaUnsampledSwaps.push(detail);
        }
        if (root.querySelectorAll('.traversal-vehicle').length !== 1)
          window.__routeQaFrameIssues.push('caravan count changed');
        if (root.dataset.phase === 'ARRIVING' && root.dataset.routeSegment === 'route-6') {
          const vehicle = root.querySelector('.traversal-vehicle').getBoundingClientRect();
          window.__routeQaCoastSamples.push({ t: performance.now(), progress: Number(root.dataset.routeProgress),
            worldDistance: Number(root.dataset.visualWorldDistance), speed: Number(root.dataset.visualSpeed),
            vehicleRight: vehicle.right, viewport: innerWidth });
        }
        if (root.dataset.view === 'route' && cover < .999 && globalOpacity < .999) {
          if (root.dataset.routeWorld !== 'shared' || !routeVisible || checkpointVisible)
            window.__routeQaFrameIssues.push(`${root.dataset.routeSegment}: wrong route world`);
          const sections = [...route.querySelectorAll('[data-world-section]:not([hidden])')];
          if (!sections.length || sections.some(section => {
            const image = section.querySelector('.traversal-world-section__painting > img');
            return image?.getAttribute('src') !== '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png'
              || !image?.naturalWidth || section.querySelector('[data-location-prop]');
          })) window.__routeQaFrameIssues.push(`${root.dataset.routeSegment}: generic forest incomplete`);
          if (root.querySelector('.traversal-route-loop > :not(.traversal-route-loop__speed-lines)'))
            window.__routeQaFrameIssues.push(`${root.dataset.routeSegment}: legacy scenery mounted`);
          if (getComputedStyle(root.querySelector('.traversal-world__entities')).visibility !== 'hidden'
            || getComputedStyle(root.querySelector('.traversal-world__markers')).visibility !== 'hidden')
            window.__routeQaFrameIssues.push(`${root.dataset.routeSegment}: event actors visible`);
        }
        if (root.dataset.view === 'checkpoint' && (routeVisible || !checkpointVisible))
          window.__routeQaFrameIssues.push(`${root.dataset.routeSegment}: checkpoint world missing`);
        lastView = root.dataset.view;
      }
      requestAnimationFrame(inspectFrame);
    };
    requestAnimationFrame(inspectFrame);
    const original = app.completeTraversalArrival.bind(app);
    app.completeTraversalArrival = (...args) => {
      window.__routeQaArrivalCount++;
      return original(...args);
    };
  });
  return page;
}

async function snapshot(page) {
  return page.evaluate((riskQa) => {
    const root = document.querySelector('.traversal-t0');
    const app = window.__routeQaApp;
    const panel = root?.querySelector('[data-traversal-event-panel]');
    const controls = [...document.querySelectorAll('[data-traversal-lane]')].map(button => {
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, disabled: button.disabled,
        reachable: rect.width > 0 && rect.height > 0 && rect.x >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight };
    });
    const cover = root?.querySelector('.traversal-transition');
    const globalCover = document.querySelector('.scene-transition--traversal');
    const routeLayer = root?.querySelector('.traversal-world__route-sections');
    const checkpointLayer = root?.querySelector('.traversal-world__sections');
    const genericSections = [...(routeLayer?.querySelectorAll('[data-world-section]:not([hidden])') ?? [])];
    const legacyRouteSceneryVisible = Boolean(root?.querySelector('.traversal-route-loop > :not(.traversal-route-loop__speed-lines)'));
    const scene = app?.activeTraversal;
    const pursuitProxy = root?.querySelector('.traversal-route-pursuit__proxy');
    return { atMs: performance.now(), width: innerWidth, height: innerHeight,
      node: app?.state?.run?.currentNodeId ?? null,
      campaignSignature: app?.state ? JSON.stringify({ gold: app.state.gold,
        reputation: app.state.reputation, reputationHistory: app.state.reputationHistory,
        health: app.state.clan.members.map(member => [member.id, member.currentHealth]),
        inventory: app.state.inventory, flags: app.state.flags, run: app.state.run,
        currentNodeId: app.state.currentNodeId, resolvedNodeIds: app.state.resolvedNodeIds }) : null,
      visitedNodeIds: [...(app?.state?.run?.visitedNodeIds ?? [])],
      bypassedNodeIds: [...(app?.state?.run?.bypassedRouteNodeIds ?? [])],
      selectedBranch: app?.state?.run?.traversalBranches?.T0 ?? null,
      sceneCount: document.querySelectorAll('.traversal-t0').length,
      phase: root?.dataset.phase ?? null, view: root?.dataset.view ?? null,
      lane: root?.dataset.lane ?? null, presentation: root?.dataset.presentation ?? null,
      segment: root?.dataset.routeSegment ?? null, routeWorld: root?.dataset.routeWorld ?? null,
      routeProgress: Number(root?.dataset.routeProgress ?? 0),
      sessionProgress: Number(root?.dataset.progress ?? 0),
      speed: Number(root?.dataset.routeSpeed ?? 0),
      visualSpeed: Number(root?.dataset.visualSpeed ?? 0),
      visualWorldDistance: Number(root?.dataset.visualWorldDistance ?? 0),
      vehicleRight: root?.querySelector('.traversal-vehicle')?.getBoundingClientRect().right ?? null,
      departure: root?.dataset.departure ?? null,
      transition: root?.dataset.transition ?? null,
      coverOpacity: cover ? Number(getComputedStyle(cover).opacity) : 0,
      globalCoverPresent: Boolean(globalCover),
      globalCoverOpacity: globalCover ? Number(getComputedStyle(globalCover).opacity) : 0,
      routeVisible: Boolean(routeLayer && getComputedStyle(routeLayer).visibility !== 'hidden'),
      checkpointVisible: Boolean(checkpointLayer && getComputedStyle(checkpointLayer).visibility !== 'hidden'),
      caravanCount: root?.querySelectorAll('.traversal-vehicle').length ?? 0,
      riskMarkupCount: root?.querySelectorAll('[data-risk-hazard]').length ?? 0,
      legacyRouteSceneryVisible,
      genericImages: genericSections.map(section => ({ src: section.querySelector('.traversal-world-section__painting > img')?.getAttribute('src'),
        loaded: Boolean(section.querySelector('.traversal-world-section__painting > img')?.naturalWidth),
        props: section.querySelectorAll('[data-location-prop]').length })),
      checkpointImages: [...(checkpointLayer?.querySelectorAll('[data-world-section]:not([hidden])') ?? [])]
        .map(section => section.querySelector('.traversal-world-section__painting > img')?.getAttribute('src')),
      authoredPropsVisible: [...(root?.querySelectorAll('[data-location-prop]') ?? [])].filter(prop =>
        prop.getClientRects().length > 0 && getComputedStyle(prop).visibility !== 'hidden').length,
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
      mechanics: root ? {
        enabled: [scene?.riskEnabled, scene?.rewardEnabled, scene?.pursuitEnabled],
        routeMinSpeed: scene?.routeSegment?.vMin ?? null,
        coreSignature: JSON.stringify({ gold: app.state.gold, reputation: app.state.reputation,
          reputationHistory: app.state.reputationHistory,
          health: app.state.clan.members.map(member => [member.id, member.currentHealth]),
          inventory: app.state.inventory, flags: app.state.flags,
          resolvedNodeIds: app.state.resolvedNodeIds,
          visitedNodeIds: app.state.run.visitedNodeIds,
          bypassedRouteNodeIds: app.state.run.bypassedRouteNodeIds }),
        temporaryLoot: app.state.run.temporaryLoot?.gold ?? 0,
        domNodes: root.querySelectorAll('*').length,
        rendererCounts: ['risk', 'reward', 'pursuit'].map(kind =>
          root.querySelectorAll(`.traversal-route-${kind}`).length),
        rewardMarks: root.querySelectorAll('[data-reward-pickup]').length,
        rewardResolved: [...(scene?.routeReward?.resolvedPickupIds ?? [])],
        rewardCollected: [...(scene?.routeReward?.collectedPickupIds ?? [])],
        rewardGold: scene?.routeReward?.collectedGold ?? 0,
        rewardFeedback: root.querySelector('.traversal-route-reward__feedback.is-active:not([hidden])')?.textContent?.trim() ?? null,
        rewardVisible: [...root.querySelectorAll('[data-reward-pickup]:not([hidden])')].map(mark => {
          const rect = mark.getBoundingClientRect();
          return { id: mark.dataset.rewardPickup, lane: Number(mark.dataset.rewardLane),
            x: rect.x + rect.width / 2, groundY: rect.bottom,
            onScreen: rect.right > 0 && rect.left < innerWidth,
            imageLoaded: Boolean(mark.querySelector('img')?.naturalWidth) };
        }),
        riskCollisions: scene?.routeRisk?.collisionCount ?? 0,
        riskSpeedBefore: scene?.lastRiskSpeedBefore ?? null,
        riskSpeedAfter: scene?.lastRiskSpeedAfter ?? null,
        pursuitWindow: scene?.routePursuit?.activeWindowId ?? null,
        pursuitPressure: scene?.routePursuit?.pressure01 ?? 0,
        pursuitResolved: [...(scene?.routePursuit?.resolvedWindowIds ?? [])],
        pursuitCaught: [...(scene?.routePursuit?.caughtWindowIds ?? [])],
        pursuitEscaped: [...(scene?.routePursuit?.escapedWindowIds ?? [])],
        pursuitOutcomeArrayLength: scene?.pursuitQaEvents?.length ?? 0,
        pursuitSpeedBefore: scene?.lastPursuitSpeedBefore ?? null,
        pursuitSpeedAfter: scene?.lastPursuitSpeedAfter ?? null,
        pursuitVisible: Boolean(pursuitProxy && !pursuitProxy.hidden),
        pursuitLane: pursuitProxy?.dataset.pursuitLane == null ? null : Number(pursuitProxy.dataset.pursuitLane),
        pursuitGroundY: pursuitProxy && !pursuitProxy.hidden
          ? pursuitProxy.getBoundingClientRect().bottom : null,
        pursuitActive: Boolean(pursuitProxy?.dataset.pursuitActive),
        pursuitFeedback: root.querySelector('.traversal-route-pursuit__feedback:not([hidden])')?.textContent?.trim() ?? null,
        productionTelemetry: Object.keys(root.dataset).filter(key =>
          /^(risk|reward|pursuit)/.test(key)),
      } : null,
      risk: root ? {
        enabled: Boolean(root.querySelector('.traversal-route-risk [data-risk-hazard]')),
        diagnosticTelemetry: Object.keys(root.dataset).filter(key => key.startsWith('risk')),
        rendererCount: root.querySelectorAll('.traversal-route-risk').length,
        ariaHidden: root.querySelector('.traversal-route-risk')?.getAttribute('aria-hidden') ?? null,
        focusableCount: root.querySelectorAll('.traversal-route-risk a, .traversal-route-risk button, .traversal-route-risk input, .traversal-route-risk [tabindex]:not([tabindex="-1"])').length,
        all: [...root.querySelectorAll('[data-risk-hazard]')].map(mark => ({
          id: mark.dataset.riskHazard, lane: Number(mark.dataset.riskLane),
          progress01: Number(mark.dataset.riskProgress), imageSrc: mark.querySelector('img')?.getAttribute('src'),
          imageLoaded: Boolean(mark.querySelector('img')?.complete && mark.querySelector('img')?.naturalWidth),
        })),
        active: [...root.querySelectorAll('[data-risk-hazard]:not([hidden])')].map(mark => mark.dataset.riskHazard),
        impact: root.querySelector('.traversal-vehicle')?.classList.contains('traversal-vehicle--risk-impact') ?? false,
        hazards: [...root.querySelectorAll('[data-risk-hazard]:not([hidden])')].map(mark => {
          const rect = mark.getBoundingClientRect();
          const warningElement = mark.querySelector('.traversal-route-risk__warning');
          const warning = warningElement?.getBoundingClientRect();
          const obstacle = mark.querySelector('img');
          return { id: mark.dataset.riskHazard, lane: Number(mark.dataset.riskLane),
            progress01: Number(mark.dataset.riskProgress), x: rect.x + rect.width / 2,
            topY: rect.top, groundY: rect.bottom, width: rect.width,
            visual: mark.dataset.riskVisual, imageSrc: obstacle?.getAttribute('src'),
            imageLoaded: Boolean(obstacle?.complete && obstacle.naturalWidth),
            warningX: warning?.x + warning?.width / 2,
            warningVisible: Boolean(warning && getComputedStyle(warningElement).visibility === 'visible'
              && warning.right > 0 && warning.left < innerWidth),
            telegraph: mark.dataset.telegraph === 'true' };
        }),
        vehicleGroundY: root.querySelector('.traversal-vehicle')?.getBoundingClientRect().bottom ?? null,
        vehicleWidth: root.querySelector('.traversal-vehicle')?.getBoundingClientRect().width ?? null,
        vehicleCenterX: (() => { const rect = root.querySelector('.traversal-vehicle')?.getBoundingClientRect();
          return rect ? rect.x + rect.width / 2 : null; })(),
      } : null,
    };
  }, riskQa);
}

async function blackPixelRatio(page, png) {
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
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] === 0 && pixels[index + 1] === 0 && pixels[index + 2] === 0) black++;
    }
    return black / (pixels.length / 4);
  }, png.toString('base64'));
}

async function capture(page, name, run, viewports = []) {
  if (name === 'integrated-route-3-reward') await page.waitForTimeout(90);
  if (name.includes('combat')) {
    await page.waitForTimeout(2200);
    const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
    await frame?.evaluate(() => document.querySelector('#tutorial [data-action="skip"]')?.click()).catch(() => {});
    await page.waitForTimeout(600);
  }
  if (name.includes('cp2-cedric') || name.includes('cp5a')) {
    await page.waitForFunction(() => {
      const text = document.querySelector('.dialogue .dialogue__text');
      return !text?.dataset.finalText || text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
    }, null, { timeout: 8000 }).catch(() => {});
  }
  const shot = async suffix => {
    await page.evaluate(() => document.fonts.ready);
    const file = `${name}${suffix}.png`;
    const png = jsonOnly
      ? name.includes('black') ? await page.screenshot() : null
      : await page.screenshot({ path: `${output}/${file}` });
    gallery.captures.push({ file, run: run.id, viewport: `${page.viewportSize().width}x${page.viewportSize().height}`,
      state: await snapshot(page) });
    if (name.includes('black')) gallery.blackFrames.push({ file, blackPixelRatio: await blackPixelRatio(page, png) });
  };
  if (compactQa && name === 'risk-r1-dodge-before') {
    await page.setViewportSize(mobile[1]);
    await page.waitForTimeout(120);
    await shot('-390');
    await page.setViewportSize(desktop);
    return;
  }
  if (compactQa && name === 'risk-r6-telegraph') {
    for (const viewport of mobile) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(120);
      await shot(`-${viewport.width}`);
    }
    await page.setViewportSize(desktop);
    return;
  }
  if (artQa && name === 'risk-r6-telegraph') {
    for (const viewport of [mobile[1], mobile[0]]) {
      await page.setViewportSize(viewport);
      await shot(`-${viewport.width}`);
    }
    await page.setViewportSize(desktop);
    await shot('');
    return;
  }
  await shot('');
  if (viewports.length) {
    for (const viewport of viewports) {
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
  if (productionQa) {
    await frame.evaluate(async () => {
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
    startedAt: Date.now(), routes: {}, transitions: [], globalTransitions: [], checkpointEvents: [], progressionErrors: [],
    laneMoves: [], routeStates: {}, checkpointStates: {}, branchSelectionCount: 0, bypassCount: 0,
    maxSceneCount: 0, maxEntries: 0, maxExits: 0, arrivalCallbacks: 0, complete: false,
    riskSegments: {}, riskEvents: [], riskVisibility: {}, riskCheckpointImpactLeaks: [],
    riskCheckpointHazards: [], riskMarkupBySegment: {}, riskRendererMax: 0,
    riskFocusableMax: 0, riskAriaFailures: [], inputLockFailures: [],
    inputLockSamples: 0, productionTelemetryKeys: [], riskCampaignBefore: null,
    riskCampaignAfter: null, mechanicsSegments: {}, mechanicsEvents: [],
    mechanicsCheckpointLeaks: [], mechanicsContinuity: [], mechanicsProductionTelemetry: [] };
  gallery.runs.push(run);
  const seen = new Set();
  let previous = null;
  let lastSegment = null;
  let activeTransition = null;
  let activeGlobal = null;
  const lastHazardView = new Map();
  const startWall = Date.now();
  for (let tick = 0; tick < 7200; tick++) {
    await page.waitForTimeout(previous?.transition || previous?.globalCoverOpacity > 0
      || previous?.routeProgress > .93 ? 18 : 80);
    const s = await snapshot(page);
    const m = s.mechanics;
    const prior = previous?.segment === s.segment && previous?.width === s.width
      ? previous.mechanics : null;
    if (m && s.segment) {
      const segment = run.mechanicsSegments[s.segment] ??= {
        enabled: m.enabled, rendererCounts: m.rendererCounts, domNodesMin: m.domNodes,
        domNodesMax: m.domNodes, maxRewardMarks: 0, rewardCollected: [],
        rewardResolved: [], riskCollisions: 0, pursuitStarted: 0, pursuitCaught: 0,
        pursuitEscaped: 0, pursuitResolved: [], threeSystemSamples: 0,
        maxPursuitOutcomeArrayLength: 0 };
      segment.domNodesMin = Math.min(segment.domNodesMin, m.domNodes);
      segment.domNodesMax = Math.max(segment.domNodesMax, m.domNodes);
      segment.maxRewardMarks = Math.max(segment.maxRewardMarks, m.rewardMarks);
      segment.rewardCollected = m.rewardCollected;
      segment.rewardResolved = m.rewardResolved;
      segment.riskCollisions = Math.max(segment.riskCollisions, m.riskCollisions);
      segment.pursuitResolved = m.pursuitResolved;
      segment.maxPursuitOutcomeArrayLength = Math.max(segment.maxPursuitOutcomeArrayLength,
        m.pursuitOutcomeArrayLength);
      if (s.view === 'route' && m.pursuitActive && s.risk.all.length && m.rewardMarks)
        segment.threeSystemSamples++;
      if (productionQa) run.mechanicsProductionTelemetry.push(...m.productionTelemetry);
      if (s.view === 'checkpoint' && (s.risk.active.length || m.rewardVisible.length
        || m.pursuitVisible || m.pursuitActive))
        run.mechanicsCheckpointLeaks.push({ segment: s.segment, atMs: s.atMs });
      if (prior && previous.view === 'checkpoint' && s.view === 'checkpoint'
        && (prior.riskCollisions !== m.riskCollisions
          || prior.rewardResolved.length !== m.rewardResolved.length
          || prior.pursuitResolved.length !== m.pursuitResolved.length))
        run.mechanicsCheckpointLeaks.push({ segment: s.segment, atMs: s.atMs, resolving: true });
      if (prior && previous.view === 'route' && s.view === 'route') {
        if (m.pursuitWindow && !prior.pursuitWindow) {
          segment.pursuitStarted++;
          run.mechanicsEvents.push({ kind: 'STARTED', segment: s.segment,
            progress: s.routeProgress, pressure: m.pursuitPressure });
        }
        for (const id of m.pursuitResolved.filter(id => !prior.pursuitResolved.includes(id))) {
          const kind = m.pursuitCaught.includes(id) ? 'CAUGHT' : 'ESCAPED';
          segment[kind === 'CAUGHT' ? 'pursuitCaught' : 'pursuitEscaped']++;
          run.mechanicsEvents.push({ kind, segment: s.segment, id,
            progress: s.routeProgress, speedBefore: m.pursuitSpeedBefore,
            speedAfter: m.pursuitSpeedAfter, routeMinSpeed: m.routeMinSpeed,
            coreUnchanged: prior.coreSignature === m.coreSignature,
            lootUnchanged: prior.temporaryLoot === m.temporaryLoot });
        }
        if (m.riskCollisions > prior.riskCollisions) {
          run.mechanicsEvents.push({ kind: 'RISK_COLLISION', segment: s.segment,
            progress: s.routeProgress, countDelta: m.riskCollisions - prior.riskCollisions,
            pursuitActive: Boolean(prior.pursuitWindow && m.pursuitWindow),
            pressureBefore: prior.pursuitPressure, pressureAfter: m.pursuitPressure,
            speedBefore: m.riskSpeedBefore, speedAfter: m.riskSpeedAfter,
            routeMinSpeed: m.routeMinSpeed,
            coreUnchanged: prior.coreSignature === m.coreSignature,
            lootUnchanged: prior.temporaryLoot === m.temporaryLoot });
        }
        for (const id of m.rewardCollected.filter(id => !prior.rewardCollected.includes(id))) {
          run.mechanicsEvents.push({ kind: 'REWARD_COLLECTED', segment: s.segment, id,
            progress: s.routeProgress, lootDelta: m.temporaryLoot - prior.temporaryLoot,
            feedback: m.rewardFeedback, pursuitActive: Boolean(prior.pursuitWindow && m.pursuitWindow),
            pressureBefore: prior.pursuitPressure, pressureAfter: m.pursuitPressure,
            riskCollisionDelta: m.riskCollisions - prior.riskCollisions,
            coreUnchanged: prior.coreSignature === m.coreSignature });
        }
        if (m.riskCollisions > prior.riskCollisions || m.pursuitCaught.length > prior.pursuitCaught.length) {
          const before = [...previous.risk.hazards, ...prior.rewardVisible];
          const after = [...s.risk.hazards, ...m.rewardVisible];
          for (const object of before) {
            const current = after.find(item => item.id === object.id);
            if (current) run.mechanicsContinuity.push({ segment: s.segment, id: object.id,
              cause: m.riskCollisions > prior.riskCollisions ? 'Risk' : 'CAUGHT',
              beforeX: object.x, afterX: current.x, deltaPx: current.x - object.x,
              visualDistanceDelta: s.visualWorldDistance - previous.visualWorldDistance,
              elapsedMs: s.atMs - previous.atMs });
          }
        }
      }
    }
    if (s.risk && s.segment) {
      run.riskMarkupBySegment[s.segment] = Math.max(run.riskMarkupBySegment[s.segment] ?? 0,
        s.risk.all.length);
      run.riskRendererMax = Math.max(run.riskRendererMax, s.risk.rendererCount);
      run.riskFocusableMax = Math.max(run.riskFocusableMax, s.risk.focusableCount);
      if (productionQa) run.productionTelemetryKeys = [...new Set([
        ...run.productionTelemetryKeys, ...s.risk.diagnosticTelemetry])];
      if (s.risk.enabled && s.risk.ariaHidden !== 'true') run.riskAriaFailures.push(s.segment);
    }
    if (s.sceneCount && (s.transition || s.departure || s.view === 'checkpoint'
      || s.presentation === 'checkpoint-approach' || s.phase === 'ARRIVING')) {
      run.inputLockSamples++;
      if (s.controls.some(control => !control.disabled))
        run.inputLockFailures.push(`${s.segment}/${s.phase}/${s.transition ?? s.presentation ?? s.view}`);
    }
    if (riskQa && s.risk && s.segment) {
      if (s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .08
        && !run.riskCampaignBefore) run.riskCampaignBefore = s.campaignSignature;
      if (s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .55
        && !run.riskCampaignAfter) run.riskCampaignAfter = s.campaignSignature;
      const segmentRisk = run.riskSegments[s.segment] ??= { collisions: 0, resolved: [], recoverySamples: [] };
      if (s.risk.impact && !previous?.risk?.impact) {
        const contact = s.risk.all.map(hazard => ({ hazard,
          view: lastHazardView.get(hazard.id) })).filter(candidate => candidate.view)
          .sort((left, right) => Math.abs(left.view.x - left.view.vehicleCenterX)
            - Math.abs(right.view.x - right.view.vehicleCenterX))[0];
        const lastContactView = contact?.view;
        segmentRisk.collisions++;
        run.riskEvents.push({ segment: s.segment, progress: s.routeProgress,
          id: contact?.hazard.id ?? null, before: previous?.speed ?? null, after: s.speed,
          impact: s.risk.impact, collisionCount: segmentRisk.collisions, atMs: s.atMs,
          contactGapPx: lastContactView ? Math.abs(lastContactView.x - lastContactView.vehicleCenterX) : null });
      }
      segmentRisk.resolved = s.risk.all.filter(hazard => s.routeProgress >= hazard.progress01)
        .map(hazard => hazard.id);
      const latestHit = run.riskEvents.filter(event => event.segment === s.segment).at(-1);
      const recovery01 = latestHit ? Math.min(1, (s.atMs - latestHit.atMs) / 2400) : 1;
      if (recovery01 < 1 && (!segmentRisk.recoverySamples.length
        || s.atMs - segmentRisk.recoverySamples.at(-1).atMs > 400))
        segmentRisk.recoverySamples.push({ atMs: s.atMs, progress: s.routeProgress,
          speed: s.speed, recovery01 });
      for (const hazard of s.risk.hazards) {
        lastHazardView.set(hazard.id, { x: hazard.x, vehicleCenterX: s.risk.vehicleCenterX });
        if (!run.riskVisibility[hazard.id]) run.riskVisibility[hazard.id] = { segment: s.segment, progress: s.routeProgress,
          leadMs: Math.round((hazard.progress01 - s.routeProgress) *
            (s.segment === 'route-1' || s.segment === 'route-4' ? 12000
              : s.segment === 'route-6' ? 20000 : 15000)), ...hazard };
      }
      if (s.view === 'checkpoint' && s.risk.impact)
        run.riskCheckpointImpactLeaks.push(s.segment);
      if (s.view === 'checkpoint' && s.risk.active.length)
        run.riskCheckpointHazards.push(s.segment);
    }
    if (s.segment && s.segment !== lastSegment) { console.log(run.id, s.segment); lastSegment = s.segment; }
    run.maxSceneCount = Math.max(run.maxSceneCount, s.sceneCount);
    run.maxEntries = Math.max(run.maxEntries, s.entries);
    run.maxExits = Math.max(run.maxExits, s.exits);
    run.arrivalCallbacks = Math.max(run.arrivalCallbacks, s.arrivalCallbacks);
    if (s.selectedBranch && s.selectedBranch !== previous?.selectedBranch) run.branchSelectionCount++;
    if (s.bypassedNodeIds.length > (previous?.bypassedNodeIds.length ?? 0))
      run.bypassCount += s.bypassedNodeIds.length - (previous?.bypassedNodeIds.length ?? 0);
    if (s.view === 'route' && s.segment && !s.transition && !s.globalCoverOpacity
      && s.routeProgress > .05 && !run.routeStates[s.segment]) {
      run.routeStates[s.segment] = { routeWorld: s.routeWorld, routeVisible: s.routeVisible,
        checkpointVisible: s.checkpointVisible, legacyRouteSceneryVisible: s.legacyRouteSceneryVisible,
        genericImages: s.genericImages, authoredPropsVisible: s.authoredPropsVisible,
        caravanCount: s.caravanCount, progress: s.routeProgress };
    }
    if (s.view === 'checkpoint' && s.segment && !s.transition && !s.globalCoverOpacity
      && !run.checkpointStates[s.segment]) run.checkpointStates[s.segment] = s.checkpointImages;
    if (s.transition !== (activeTransition?.kind ?? null)) {
      if (activeTransition) run.transitions.push({ kind: activeTransition.kind,
        durationMs: Math.round(s.atMs - activeTransition.atMs) });
      activeTransition = s.transition ? { kind: s.transition, atMs: s.atMs } : null;
    }
    if (s.globalCoverPresent && !activeGlobal) activeGlobal = { atMs: s.atMs, segment: s.segment,
      entries: s.entries, exits: s.exits };
    if (!s.globalCoverPresent && activeGlobal) {
      run.globalTransitions.push({ ...activeGlobal, durationMs: Math.round(s.atMs - activeGlobal.atMs) });
      activeGlobal = null;
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
    const take = async (name, viewports = []) => {
      if (seen.has(name)) return;
      seen.add(name);
      if (!evidence.has(name)) return;
      const compactViewports = name === 'risk-r1-before' ? mobile
        : name === 'risk-r1-dodge-before' ? [mobile[1]] : [];
      await capture(page, name, run, compactQa ? name.startsWith('integrated-') ? mobile : compactViewports
        : artQa && name === 'risk-r1-dodge-before' ? [] : viewports);
      console.log(run.id, name);
    };
    if (run.id === 'branch-a') {
      if (s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .12 && s.routeProgress < .28)
        await take('01-route-1-early');
      if (!riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .3 && !seen.has('lane-low')) {
        await page.locator('[data-traversal-lane="1"]').click();
        seen.add('lane-low');
        run.laneMoves.push({ lane: 1, progress: s.routeProgress, atMs: s.atMs });
      }
      if (!riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .55 && !seen.has('lane-high')) {
        await page.locator('[data-traversal-lane="0"]').click();
        seen.add('lane-high');
        run.laneMoves.push({ lane: 0, progress: s.routeProgress, atMs: s.atMs });
      }
      if (s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .83 && s.routeProgress < .96)
        await take('02-route-1-rush', [mobile[1]]);
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .23 && s.routeProgress < .31)
        await take('risk-r1-before', mobile);
      if (riskQa && s.segment === 'route-1' && run.riskSegments['route-1']?.collisions === 1 && s.risk.impact)
        await take('risk-r1-impact');
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .62
        && run.riskSegments['route-1']?.recoverySamples.length) await take('risk-r1-recovered');
      if (s.segment === 'route-1' && s.transition === 'focus' && s.view === 'route' && s.coverOpacity < .5)
        await take('cp1-a-before-fade');
      if (s.segment === 'route-1' && s.transition === 'focus' && s.coverOpacity >= .999)
        await take('cp1-b-black');
      if (s.segment === 'route-1' && s.view === 'checkpoint' && !s.transition && s.entries === 1) {
        await take('cp1-c-after-reveal', [mobile[0], mobile[1]]);
      }
      if (s.segment === 'route-1' && s.view === 'checkpoint' && s.phase === 'NODE_HANDOFF' && s.transition === 'event' && s.coverOpacity < .4)
        await take('cp1-d-checkpoint-before-content');
      if (s.segment === 'route-1' && s.view === 'checkpoint' && s.globalCoverOpacity > 0 && s.globalCoverOpacity < .5)
        await take('cp1-d-canonical-content-before-return');
      if (s.entries === 1 && s.globalCoverOpacity >= .999) await take('cp1-e-return-black');
      if (s.segment === 'route-2' && s.view === 'route' && s.routeProgress > .01 && s.routeProgress < .25 && !s.transition && s.globalCoverOpacity === 0)
        await take('cp1-f-route-2-after-reveal');
      if (s.segment === 'route-2' && s.view === 'route' && s.routeProgress > .3 && s.routeProgress < .8)
        await take('03-route-2');
      if (s.segment === 'route-3' && s.view === 'route' && !s.transition && s.routeProgress > .12 && s.routeProgress < .3)
        await take('04-route-3-early', mobile);
      if (riskQa && s.segment === 'route-3' && s.view === 'route' && s.routeProgress < .68
        && s.risk?.hazards.some(hazard => hazard.id === 't0:r3:block-2'
          && hazard.x < desktop.width * .78 && hazard.imageLoaded))
        await take('risk-r3-boulder', [mobile[1]]);
      if (s.segment === 'route-3' && s.view === 'route' && !s.transition && s.routeProgress > .84 && s.routeProgress < .97)
        await take('04-route-3-rush');
      if (s.segment === 'route-3' && s.transition === 'focus' && s.coverOpacity >= .999)
        await take('04-route-3-refugees-black');
      if (s.segment === 'route-3' && s.view === 'checkpoint' && s.optionalDecision)
        await take('04-refugees-aider', [mobile[1]]);
      if (s.segment === 'route-4' && (s.coverOpacity >= .999 || s.globalCoverOpacity >= .999)
        && s.routeProgress < .05) await take('04-refugees-route-4-black');
      if (s.segment === 'route-4' && s.view === 'route' && !s.transition && s.routeProgress > .1 && s.routeProgress < .28)
        await take('05-route-4-early', mobile);
      if (s.segment === 'route-4' && s.view === 'route' && s.routeProgress > .3 && s.routeProgress < .8)
        await take('05-route-4');
      if (s.segment === 'route-4' && s.view === 'route' && !s.transition && s.routeProgress > .84 && s.routeProgress < .97)
        await take('05-route-4-rush');
      if (s.segment === 'route-4' && s.transition === 'focus' && s.coverOpacity >= .999)
        await take('fork-a-black');
      if (s.fork) await take('fork-b-checkpoint', mobile);
      if (s.segment === 'route-5a' && s.transition === 'fork' && s.coverOpacity >= .999)
        await take('fork-c-return-black');
      if (s.segment === 'route-5a' && s.view === 'route' && s.routeProgress > .3 && s.routeProgress < .75)
        await take('06-route-5a', mobile);
      if (s.segment === 'route-5a' && s.transition === 'focus' && s.coverOpacity >= .999)
        await take('06-route-5a-checkpoint-black');
      if (s.segment === 'route-5a' && s.view === 'checkpoint' && !s.transition && s.phase === 'RUNNING')
        await take('06-cp5a-branch-checkpoint');
      if (s.segment === 'route-5a' && s.dialogue) await take('06-cp5a-canonical-dialogue');
      if (s.segment === 'route-6' && (s.coverOpacity >= .999 || s.globalCoverOpacity >= .999)
        && s.routeProgress < .05) await take('06-branch-route-6-black');
      if (s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .18 && s.routeProgress < .35)
        await take('07-route-6-early', mobile);
      if (s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .85 && s.routeProgress < .97)
        await take('08-route-6-rush');
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .17
        && !seen.has('risk-r6-lane-1')) {
        await page.locator('[data-traversal-lane="1"]').click(); seen.add('risk-r6-lane-1');
        run.laneMoves.push({ lane: 1, progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .41
        && !seen.has('risk-r6-lane-0')) {
        await page.locator('[data-traversal-lane="0"]').click(); seen.add('risk-r6-lane-0');
        run.laneMoves.push({ lane: 0, progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .60
        && !seen.has('risk-r6-dodge')) {
        await page.locator('[data-traversal-lane="1"]').click(); seen.add('risk-r6-dodge');
        run.laneMoves.push({ lane: 1, progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .60
        && s.routeProgress < .66 && s.risk?.hazards.some(hazard =>
          hazard.id === 't0:r6:branch-3' && hazard.warningVisible))
        await take('risk-r6-telegraph', mobile);
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress < .75
        && s.risk?.hazards.some(hazard => hazard.id === 't0:r6:branch-3'
          && !hazard.warningVisible && hazard.x < desktop.width * .8 && hazard.imageLoaded))
        await take('risk-r6-visible');
      if (riskQa && s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .77)
        await take('risk-r6-dodged');
      if (s.phase === 'ARRIVING' && s.visualSpeed > .1 && s.vehicleRight < desktop.width)
        await take('09-route-6-coast');
      if (s.phase === 'ARRIVING') await take('09-arrival', mobile);
      if (!s.sceneCount && s.destinationAgency && s.arrivalCallbacks > 0) await take('10-destination-agency');
    } else {
      if (s.segment === 'route-3' && s.view === 'route' && s.routeProgress < .12
        && !seen.has('integrated-r3-lane-1')) {
        await page.locator('[data-traversal-lane="1"]').click();
        seen.add('integrated-r3-lane-1');
        run.laneMoves.push({ lane: 1, progress: s.routeProgress, atMs: s.atMs });
      }
      if (s.segment === 'route-3' && s.view === 'route' && s.routeProgress > .46
        && !seen.has('integrated-r3-lane-0')) {
        await page.locator('[data-traversal-lane="0"]').click();
        seen.add('integrated-r3-lane-0');
        run.laneMoves.push({ lane: 0, progress: s.routeProgress, atMs: s.atMs });
      }
      if (s.segment === 'route-3' && s.view === 'route' && m?.rewardFeedback === '+5 route'
        && m.pursuitActive && m.rewardCollected.includes('t0:r3:reward-2'))
        await take('integrated-route-3-reward', mobile);
      if (s.segment === 'route-5b' && s.view === 'route' && m?.pursuitActive
        && s.risk.hazards.some(item => item.x >= 0 && item.x <= s.width))
        await take('integrated-route-5b', mobile);
      if (s.segment === 'route-5b' && s.view === 'route' && m?.pursuitActive
        && m.rewardVisible.some(item => item.onScreen))
        await take('integrated-route-5b-reward', mobile);
      if (s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .84
        && s.routeProgress < .88 && m?.pursuitResolved.length && m.rewardVisible.some(item =>
          item.id === 't0:r6:reward-1'))
        await take('integrated-route-6-pouch', mobile);
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .20
        && !seen.has('risk-r1-dodge')) {
        await page.keyboard.press('ArrowDown'); seen.add('risk-r1-dodge');
        run.laneMoves.push({ lane: 1, input: 'keyboard', progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .23
        && s.routeProgress < .31) await take('risk-r1-dodge-before', mobile);
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .43)
        await take('risk-r1-dodge-after');
      if (riskQa && s.segment === 'route-1' && s.view === 'route' && s.routeProgress > .51
        && !seen.has('risk-r1-return')) {
        await page.locator('[data-traversal-lane="0"]').click(); seen.add('risk-r1-return');
        run.laneMoves.push({ lane: 0, progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-5b' && s.view === 'route' && s.routeProgress > .43
        && s.routeProgress < .5) await take('risk-r5b-two-lanes', mobile);
      if (riskQa && s.segment === 'route-5b' && s.view === 'route' && s.routeProgress < .68
        && s.risk?.hazards.some(hazard => hazard.id === 't0:r5b:block-3'
          && hazard.x < desktop.width * .78 && hazard.imageLoaded))
        await take('risk-r5b-roadblock', [mobile[1]]);
      if (riskQa && s.segment === 'route-5b' && s.view === 'route' && s.routeProgress > .58
        && !seen.has('risk-r5b-second-lane')) {
        await page.locator('[data-traversal-lane="1"]').click(); seen.add('risk-r5b-second-lane');
        run.laneMoves.push({ lane: 1, progress: s.routeProgress, atMs: s.atMs });
      }
      if (riskQa && s.segment === 'route-5b' && run.riskSegments['route-5b']?.collisions === 2 && s.risk.impact)
        await take('risk-r5b-second-impact');
      if (s.segment === 'route-3' && s.view === 'route' && s.routeProgress > .86
        && !seen.has('mobile-black-setup')) {
        seen.add('mobile-black-setup');
        await page.setViewportSize(mobile[1]);
      }
      if (s.segment === 'route-3' && s.transition === 'focus' && s.coverOpacity >= .999
        && page.viewportSize().width === 390) {
        await take('responsive-route-3-refugees-black-390');
        await page.setViewportSize(desktop);
      }
      if (s.segment === 'route-5b' && s.view === 'route' && s.routeProgress > .3 && s.routeProgress < .75)
        await take('11-route-5b', mobile);
      if (s.segment === 'route-5b' && s.transition === 'focus' && s.coverOpacity >= .999)
        await take('11-route-5b-checkpoint-black');
      if (s.segment === 'route-5b' && s.view === 'checkpoint' && !s.transition && s.phase === 'RUNNING')
        await take('11-cp5b-branch-checkpoint');
      if (s.segment === 'route-5b' && s.combat) await take('11-cp5b-canonical-combat');
      if (s.segment === 'route-6' && (s.coverOpacity >= .999 || s.globalCoverOpacity >= .999)
        && s.routeProgress < .05) await take('11-branch-route-6-black');
      if (s.segment === 'route-6' && s.view === 'route' && s.routeProgress > .82 && s.routeProgress < .96)
        await take('11-route-6-rush-b', [mobile[0], mobile[1]]);
      if (s.phase === 'ARRIVING') await take('11-arrival-b', mobile);
      if (s.optionalDecision) await take('12-refugees-passer', [mobile[1]]);
      if (s.segment === 'route-3' && s.departure === 'return' && s.coverOpacity < .5)
        await take('passer-departure', [mobile[1]]);
      if (s.entries === 3 && s.exits === 3 && s.transition === 'return' && s.coverOpacity >= .999)
        await take('refugees-b-return-black');
      if (s.segment === 'route-4' && s.view === 'route' && s.routeProgress < .2 && !s.transition)
        await take('refugees-c-route-4-after-reveal');
    }
    if (!s.sceneCount && s.destinationAgency && s.arrivalCallbacks > 0) {
      run.complete = true;
      previous = s;
      break;
    }
    if (s.fork && !s.transition && !s.departure) {
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
  run.visitedNodeIds = previous?.visitedNodeIds ?? [];
  run.bypassedNodeIds = previous?.bypassedNodeIds ?? [];
  run.selectedBranch = previous?.selectedBranch ?? null;
  run.frameIssues = await page.evaluate(() => [...new Set(window.__routeQaFrameIssues ?? [])]);
  run.unsampledSwaps = await page.evaluate(() => [...new Set(window.__routeQaUnsampledSwaps ?? [])]);
  run.coastSamples = await page.evaluate(() => window.__routeQaCoastSamples ?? []);
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

let qaResult;
try {
  await driveRun('lion-first-trial-event', true);
  await driveRun('lion-first-trial-combat', false);
} finally {
  await browser.close();
  if (productionQa) await new Promise((resolve, reject) =>
    server.httpServer.close(error => error ? reject(error) : resolve()));
  else await server.close();
  await writeFile(`${output}/gallery-index.json`, `${JSON.stringify(gallery, null, 2)}\n`);
  await writeFile(`${output}/motion-flow.json`, `${JSON.stringify({ runs: gallery.runs.map(run => ({
    id: run.id, branch: run.branch, helpRefugees: run.helpRefugees, routes: run.routes,
    transitions: run.transitions, globalTransitions: run.globalTransitions,
    checkpointEvents: run.checkpointEvents,
    laneMoves: run.laneMoves, routeStates: run.routeStates, checkpointStates: run.checkpointStates,
    frameIssues: run.frameIssues, unsampledSwaps: run.unsampledSwaps,
    maxSceneCount: run.maxSceneCount, checkpointEntries: run.maxEntries,
    checkpointExits: run.maxExits, arrivalCallbacks: run.arrivalCallbacks,
    progressionErrors: run.progressionErrors, complete: run.complete,
    visitedNodeIds: run.visitedNodeIds, bypassedNodeIds: run.bypassedNodeIds,
    selectedBranch: run.selectedBranch, branchSelectionCount: run.branchSelectionCount,
    bypassCount: run.bypassCount, coastSamples: run.coastSamples,
    riskSegments: run.riskSegments, riskEvents: run.riskEvents,
    riskVisibility: run.riskVisibility, riskCheckpointImpactLeaks: run.riskCheckpointImpactLeaks,
    riskCheckpointHazards: run.riskCheckpointHazards,
    mechanicsSegments: run.mechanicsSegments, mechanicsEvents: run.mechanicsEvents,
    mechanicsCheckpointLeaks: run.mechanicsCheckpointLeaks,
    mechanicsContinuity: run.mechanicsContinuity,
  })) }, null, 2)}\n`);
  const expected = compactQa ? riskOffQa ? ['01-route-1-early'] : [
    'risk-r1-before', 'risk-r1-before-620', 'risk-r1-before-390',
    'risk-r1-impact', 'risk-r1-dodge-before-390',
    'risk-r5b-roadblock', 'risk-r5b-second-impact', 'risk-r6-telegraph-620',
    'risk-r6-telegraph-390', 'risk-r6-visible',
    '10-destination-agency',
    ...(productionQa ? ['integrated-route-3-reward', 'integrated-route-3-reward-620',
      'integrated-route-3-reward-390', 'integrated-route-5b', 'integrated-route-5b-620',
      'integrated-route-5b-390', 'integrated-route-5b-reward',
      'integrated-route-5b-reward-620', 'integrated-route-5b-reward-390',
      'integrated-route-6-pouch',
      'integrated-route-6-pouch-620', 'integrated-route-6-pouch-390'] : []),
  ] : artQa ? [
    'risk-r1-before', 'risk-r1-before-620', 'risk-r1-before-390',
    'risk-r1-impact', 'risk-r1-recovered', 'risk-r1-dodge-before',
    'risk-r1-dodge-after', 'risk-r3-boulder', 'risk-r3-boulder-390',
    'risk-r5b-roadblock', 'risk-r5b-roadblock-390',
    'risk-r6-telegraph', 'risk-r6-telegraph-620',
    'risk-r6-telegraph-390', 'risk-r6-visible', 'risk-r6-dodged',
  ] : artOffQa ? ['01-route-1-early'] : [
    '01-route-1-early', 'cp1-b-black', 'cp1-c-after-reveal', '04-route-3-early',
    '04-refugees-aider', 'fork-a-black', 'fork-b-checkpoint', '06-route-5a', '06-cp5a-branch-checkpoint',
    '08-route-6-rush', '09-route-6-coast', '09-arrival', '10-destination-agency',
    '12-refugees-passer', 'passer-departure', 'refugees-b-return-black',
    '11-route-5b', '11-cp5b-branch-checkpoint', '11-route-6-rush-b', '11-arrival-b',
    'responsive-route-3-refugees-black-390',
    '04-route-3-early-620', '04-route-3-early-390', 'fork-b-checkpoint-620',
    'fork-b-checkpoint-390', '06-route-5a-620', '06-route-5a-390',
    '11-route-5b-620', '11-route-5b-390', '09-arrival-620', '09-arrival-390',
    'passer-departure-390',
    ...(riskQa ? ['risk-r1-before', 'risk-r1-before-620', 'risk-r1-before-390',
      'risk-r1-impact', 'risk-r1-recovered', 'risk-r1-dodge-before',
      'risk-r1-dodge-before-620', 'risk-r1-dodge-before-390', 'risk-r1-dodge-after',
      'risk-r5b-two-lanes', 'risk-r5b-second-impact', 'risk-r6-telegraph',
      'risk-r6-dodged'] : []),
  ];
  const files = new Set(gallery.captures.map(capture => capture.file));
  const routeWorldFailures = gallery.runs.flatMap(run => {
    const segments = ['route-1', 'route-2', 'route-3', 'route-4',
      run.id === 'branch-a' ? 'route-5a' : 'route-5b', 'route-6'];
    return segments.flatMap(segment => {
      const state = run.routeStates[segment];
      if (!state) return [`${run.id}/${segment}: no visible route sample`];
      return state.routeWorld === 'shared' && state.routeVisible && !state.checkpointVisible
        && !state.legacyRouteSceneryVisible && state.authoredPropsVisible === 0
        && state.caravanCount === 1 && state.genericImages.length > 0
        && state.genericImages.every(image => image.src === referenceForest && image.loaded && image.props === 0)
        ? [] : [`${run.id}/${segment}: ${JSON.stringify(state)}`];
    });
  });
  const canonicalFailures = gallery.runs.flatMap(run => {
    const failures = [];
    if (!run.complete || run.arrivalCallbacks !== 1 || run.maxSceneCount !== 1)
      failures.push(`${run.id}: arrival or scene lifecycle`);
    if (run.maxEntries !== 5 || run.maxExits !== 5)
      failures.push(`${run.id}: checkpoint entries/exits ${run.maxEntries}/${run.maxExits}`);
    if (run.branchSelectionCount !== 1 || run.selectedBranch !== run.branch)
      failures.push(`${run.id}: branch selection`);
    if (run.helpRefugees ? (!run.visitedNodeIds.includes('lion-refugees') || run.bypassCount !== 0)
      : (!run.bypassedNodeIds.includes('lion-refugees') || run.bypassCount !== 1))
      failures.push(`${run.id}: Refugees outcome`);
    if (!run.visitedNodeIds.includes(run.branch) || run.visitedNodeIds.includes('lion-first-refuge')
      || run.lastState?.travelView || !run.lastState?.destinationAgency)
      failures.push(`${run.id}: canonical branch or destination agency`);
    if (run.progressionErrors.length) failures.push(`${run.id}: progress ${run.progressionErrors}`);
    return failures;
  });
  const checkpointAsset = {
    'route-1': 'opening-ambush.png', 'route-2': 'nomad-waystation.png',
    'route-3': 'refugee-halt.png', 'route-4': 'forest-junction.png',
    'route-5a': 'damaged-caravan.png', 'route-5b': 'ruined-outpost.png',
  };
  const checkpointFailures = gallery.runs.flatMap(run => Object.entries(checkpointAsset)
    .filter(([segment]) => segment !== (run.id === 'branch-a' ? 'route-5b' : 'route-5a'))
    .flatMap(([segment, filename]) => (run.checkpointStates[segment] ?? [])
      .some(src => src?.endsWith(`/world-v1/${filename}`)) ? [] : [`${run.id}/${segment}: ${filename} absent`]));
  const coastFailures = gallery.runs.flatMap(run => {
    const samples = run.coastSamples ?? [];
    const start = samples[0];
    const later = start && samples.find(sample => sample.t >= start.t + 450);
    if (!start || !later || samples.length < 10) return [`${run.id}: missing Route 6 coast frames`];
    const failures = [];
    if (samples.some(sample => sample.progress !== 1)) failures.push(`${run.id}: coast changed canonical progress`);
    if (later.worldDistance <= start.worldDistance || later.speed <= 0 || later.speed >= start.speed)
      failures.push(`${run.id}: world or speed failed to coast`);
    if (!samples.some(sample => sample.vehicleRight > sample.viewport))
      failures.push(`${run.id}: caravan did not exit right edge`);
    return failures;
  });
   const riskFailures = riskQa ? (() => {
     const [a, b] = gallery.runs;
     const failures = [];
     if (a?.riskSegments['route-1']?.collisions !== 1) failures.push('A: Route 1 did not collide once');
     if (b?.riskSegments['route-1']?.collisions !== 0
       || !b?.riskSegments['route-1']?.resolved.includes('t0:r1:branch-1'))
       failures.push('B: Route 1 dodge did not resolve safely');
     if (!b?.laneMoves.some(move => move.input === 'keyboard' && move.lane === 1)
       || !gallery.captures.some(capture => capture.file === 'risk-r1-dodge-before-390.png'
         && capture.state.lane === '1')) failures.push('B: keyboard lane dodge failed');
     const firstHit = a?.riskEvents.find(event => event.segment === 'route-1');
     if (!firstHit || !firstHit.impact || firstHit.before <= firstHit.after || firstHit.after > 1.1)
       failures.push('A: impact or immediate momentum loss missing');
     if (!a?.riskSegments['route-1']?.recoverySamples.some(sample => sample.recovery01 > .6 && sample.speed > 1))
       failures.push('A: bounded speed recovery missing');
     if (a?.riskSegments['route-6']?.collisions !== 0
       || !a?.riskSegments['route-6']?.resolved.includes('t0:r6:branch-3'))
       failures.push('C: high-speed Route 6 dodge failed');
     if (b?.riskSegments['route-5b']?.collisions !== 2
       || b?.riskEvents.filter(event => event.segment === 'route-5b').length !== 2)
       failures.push('D/E: separate-lane hazards or second recovery collision failed');
     if (gallery.runs.some(run => run.riskCheckpointImpactLeaks.length))
       failures.push('F: impact leaked into checkpoint');
     if (gallery.runs.some(run => run.riskCheckpointHazards.length))
       failures.push('F: hazard survived into checkpoint');
     if (gallery.runs.some(run => run.riskEvents.some(event =>
       event.contactGapPx === null || event.contactGapPx > 110)))
       failures.push('Collision did not align with the caravan');
     if (a?.riskVisibility['t0:r6:branch-3']?.leadMs < 900)
       failures.push('C: high-speed telegraph appeared too late');
     for (const run of gallery.runs) {
       const expectedMarks = { 'route-1': 1, 'route-2': 1, 'route-3': 2,
         'route-4': 2, [run.id === 'branch-a' ? 'route-5a' : 'route-5b']:
           run.id === 'branch-a' ? 2 : 3, 'route-6': 3 };
       for (const [segment, count] of Object.entries(expectedMarks)) {
         if (run.riskMarkupBySegment[segment] !== count)
           failures.push(`${run.id}/${segment}: expected ${count} hazard marks`);
       }
       if (run.riskRendererMax !== 1 || run.riskFocusableMax !== 0)
         failures.push(`${run.id}: duplicate or focusable risk renderer`);
       if (run.riskAriaFailures.length || run.inputLockFailures.length || !run.inputLockSamples)
         failures.push(`${run.id}: risk aria or lane input lock failed`);
       if (!run.riskCampaignBefore || !run.riskCampaignAfter
         || run.riskCampaignBefore !== run.riskCampaignAfter)
         failures.push(`${run.id}: Route 1 risk mutated campaign state`);
       if (productionQa && run.productionTelemetryKeys.length)
         failures.push(`${run.id}: production risk telemetry ${run.productionTelemetryKeys.join(',')}`);
     }
     if (productionQa) {
       const names = ['fallen-branch-a.png', 'fallen-branch-b.png', 'boulder-a.png',
         'boulder-b.png', 'roadblock-a.png', 'roadblock-b.png'];
       for (const name of names) {
         const response = gallery.riskAssetResponses[name];
         if (!response || response.statuses.some(status => status !== 200) || response.requests > 4)
           failures.push(`${name}: missing, failed, or repeated asset requests`);
       }
     }
     for (const capture of gallery.captures.filter(capture =>
       artQa || ['risk-r1-before', 'risk-r1-dodge-before', 'risk-r6-telegraph', 'risk-r5b-two-lanes']
         .some(name => capture.file.startsWith(name)))) {
       const hazards = capture.state.risk?.hazards ?? [];
       if ((artQa || productionQa) && !hazards.every(hazard => hazard.imageLoaded
         && hazard.imageSrc === `/assets/generated/lion-phase/traversal/t0/risk/${hazard.visual}.png`))
         failures.push(`${capture.file}: obstacle image missing`);
       if (capture.file.startsWith('risk-r6-telegraph')
         && (!hazards.length || !hazards.some(hazard => hazard.warningVisible)))
         failures.push(`${capture.file}: no readable hazard warning`);
       const height = Number(capture.viewport.split('x')[1]);
       if (hazards.some(hazard => Math.abs(hazard.groundY - height * (hazard.lane === 0 ? .65 : .81)) > 24))
         failures.push(`${capture.file}: hazard ground is outside its lane`);
       if (artQa && hazards.some(hazard => hazard.width > capture.state.risk.vehicleWidth * .85
         || (hazard.lane === 1 ? hazard.topY - height * .65 : height * .81 - hazard.groundY) < 0))
         failures.push(`${capture.file}: obstacle reads across both lanes`);
     }
     return failures;
   })() : [];
   const integratedFailures = productionQa ? (() => {
     const failures = [];
     for (const run of gallery.runs) {
       const ids = ['route-1', 'route-2', 'route-3', 'route-4',
         run.id === 'branch-a' ? 'route-5a' : 'route-5b', 'route-6'];
       if (Object.keys(run.mechanicsSegments).length !== 6)
         failures.push(`${run.id}: expected six Route mechanic lifecycles`);
       for (const id of ids) {
         const segment = run.mechanicsSegments[id];
         if (!segment || segment.enabled.some(value => value !== true)
           || segment.rendererCounts.some(count => count !== 1)
           || segment.maxRewardMarks !== (['route-3', 'route-4', 'route-5a', 'route-5b'].includes(id) ? 2 : 1)
           || segment.maxPursuitOutcomeArrayLength)
           failures.push(`${run.id}/${id}: production mechanics, renderer, or event array`);
       }
       if (run.mechanicsCheckpointLeaks.length)
         failures.push(`${run.id}: Route mechanic visible or resolving at checkpoint`);
       if (run.mechanicsProductionTelemetry.length)
         failures.push(`${run.id}: production Route telemetry exposed`);
       if (run.mechanicsContinuity.some(item => item.elapsedMs < 160
         && item.beforeX >= 0 && item.beforeX <= desktop.width
         && item.afterX >= 0 && item.afterX <= desktop.width
         && Math.abs(item.deltaPx + item.visualDistanceDelta) > 40))
         failures.push(`${run.id}: Route object jumped after speed reset`);
       const rewardEvents = run.mechanicsEvents.filter(event => event.kind === 'REWARD_COLLECTED');
       if (!rewardEvents.length || rewardEvents.some(event => event.lootDelta !== 5
         || event.feedback !== '+5 route' || !event.coreUnchanged)
         || new Set(rewardEvents.map(event => event.id)).size !== rewardEvents.length)
         failures.push(`${run.id}: Reward was not collected exactly once through temporary loot`);
       if (rewardEvents.some(event => event.pursuitActive && (event.riskCollisionDelta !== 0
         || Math.abs(event.pressureAfter - event.pressureBefore) > .06)))
         failures.push(`${run.id}: Reward collection changed Pursuit pressure`);
       const started = run.mechanicsEvents.filter(event => event.kind === 'STARTED');
       const resolved = run.mechanicsEvents.filter(event =>
         event.kind === 'CAUGHT' || event.kind === 'ESCAPED');
       if (started.length !== 3 || resolved.length !== 3
         || new Set(resolved.map(event => event.id)).size !== 3)
         failures.push(`${run.id}: expected three distinct Pursuit windows`);
       if (resolved.some(event => !event.coreUnchanged || !event.lootUnchanged
         || event.kind === 'CAUGHT' && event.speedAfter !== event.routeMinSpeed))
         failures.push(`${run.id}: Pursuit changed campaign or caught without local speed reset`);
       const route6 = run.mechanicsEvents.filter(event => event.segment === 'route-6');
       const pursuitEnd = route6.findIndex(event => event.kind === 'ESCAPED' || event.kind === 'CAUGHT');
       const finalPouch = route6.findIndex(event => event.kind === 'REWARD_COLLECTED'
         && event.id === 't0:r6:reward-1');
       if (pursuitEnd < 0 || finalPouch <= pursuitEnd)
         failures.push(`${run.id}: Route 6 Pursuit did not resolve before final pouch`);
     }
     const b = gallery.runs.find(run => run.id === 'branch-b');
     const collision = b?.mechanicsEvents.find(event => event.kind === 'RISK_COLLISION'
       && event.segment === 'route-5b' && event.pursuitActive);
     if (!collision || collision.countDelta !== 1 || !collision.coreUnchanged
       || !collision.lootUnchanged || collision.speedAfter !== collision.routeMinSpeed
       || collision.pressureAfter - collision.pressureBefore < .18
       || collision.pressureAfter - collision.pressureBefore > .30)
       failures.push('B Route 5B: Risk collision did not deliver one pressure impulse and speed reset');
     if (!b?.mechanicsEvents.some(event => event.kind === 'REWARD_COLLECTED'
       && event.pursuitActive && event.segment === 'route-3')
       || !b.mechanicsSegments['route-5b']?.threeSystemSamples)
       failures.push('B: Reward during Pursuit or three-system Route 5B visibility missing');
     for (const name of ['coin-pouch.png', 'shadow-pursuer.png']) {
       const asset = gallery.routeAssetResponses[name];
       if (!asset || asset.statuses.some(status => status !== 200) || asset.requests > 4)
         failures.push(`${name}: missing, failed, or repeated production asset request`);
     }
     for (const capture of gallery.captures.filter(capture => capture.file.startsWith('integrated-'))) {
       const mechanics = capture.state.mechanics;
       if (mechanics?.rewardVisible.some(item => ![0, 1].includes(item.lane)
         || !item.imageLoaded || Math.abs(item.groundY - capture.state.height
           * (item.lane === 0 ? .65 : .81)) > 24)
         || mechanics?.pursuitVisible && ![0, 1].includes(mechanics.pursuitLane))
         failures.push(`${capture.file}: Reward or Pursuit lane/readability contract`);
     }
     return failures;
   })() : [];
   const qa = { expected, screenshotsPersisted: !jsonOnly,
     missing: expected.filter(name => !files.has(`${name}.png`)),
    responsive: gallery.captures.filter(capture => capture.viewport !== '1440x810'),
     errors: gallery.errors, runsComplete: gallery.runs.every(run => run.complete), riskFailures,
     integratedFailures, routeAssetResponses: gallery.routeAssetResponses,
    blackFrames: gallery.blackFrames,
    imperfectBlackFrames: gallery.blackFrames.filter(frame => frame.blackPixelRatio < .999),
    routeWorldFailures, canonicalFailures, checkpointFailures, coastFailures,
    simultaneousWorlds: gallery.captures.filter(capture => capture.state.sceneCount &&
      capture.state.routeVisible === capture.state.checkpointVisible).map(capture => capture.file),
    frameIssues: gallery.runs.flatMap(run => run.frameIssues.map(issue => `${run.id}: ${issue}`)),
    oldRouteArt: gallery.captures.filter(capture => capture.state.view === 'route' &&
      capture.state.legacyRouteSceneryVisible).map(capture => capture.file),
    duplicateCaravans: gallery.captures.filter(capture => capture.state.caravanCount > 1).map(capture => capture.file),
    overflow: gallery.captures.filter(capture => capture.state.overflowPx > 0).map(capture => capture.file),
    unreachableControls: gallery.captures.filter(capture => capture.state.controls.some(control => !control.reachable)).map(capture => capture.file),
    riskOffMarkup: riskOffQa ? gallery.runs.flatMap(run => Object.entries(run.riskMarkupBySegment)
      .filter(([, count]) => count > 0).map(([segment]) => `${run.id}/${segment}`)) : [] };
  qaResult = qa;
  await writeFile(`${output}/browser-qa.json`, `${JSON.stringify(qa, null, 2)}\n`);
  const cards = jsonOnly ? '<p>Machine-readable QA only; screenshots retained in the production default gallery.</p>'
    : gallery.captures.map(capture => `<figure><img src="${capture.file}" loading="lazy"><figcaption>${capture.file} · ${capture.viewport}</figcaption></figure>`).join('');
   await writeFile(`${output}/index.html`, `<!doctype html><meta charset="utf-8"><title>Canonical T0 browser QA</title><style>body{margin:0;background:#08131d;color:#e8dec5;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}figure{margin:0}img{width:100%;border:1px solid #866f4b}figcaption{padding:8px}</style><h1>Canonical T0 browser QA · ${productionQa ? 'production' : 'DEV'} ${riskOffQa ? 'risk off' : 'risk on'}</h1><p><a href="browser-qa.json">Browser QA</a> · <a href="motion-flow.json">Motion data</a></p><main>${cards}</main>`);
  console.log(JSON.stringify({ complete: qa.runsComplete, captures: gallery.captures.length,
    missing: qa.missing, imperfectBlackFrames: qa.imperfectBlackFrames,
    simultaneousWorlds: qa.simultaneousWorlds, duplicateCaravans: qa.duplicateCaravans,
    frameIssues: qa.frameIssues, oldRouteArt: qa.oldRouteArt,
     routeWorldFailures, canonicalFailures, checkpointFailures, coastFailures, riskFailures,
    integratedFailures,
    errors: gallery.errors }, null, 2));
}
if (!qaResult || qaResult.missing.length || qaResult.imperfectBlackFrames.length
  || qaResult.routeWorldFailures.length || qaResult.canonicalFailures.length
   || qaResult.checkpointFailures.length || qaResult.coastFailures.length || qaResult.riskFailures.length
  || qaResult.integratedFailures.length || qaResult.simultaneousWorlds.length || qaResult.frameIssues.length
  || qaResult.oldRouteArt.length || qaResult.duplicateCaravans.length
  || qaResult.overflow.length || qaResult.unreachableControls.length || qaResult.riskOffMarkup.length
  || qaResult.errors.length || !qaResult.runsComplete)
  throw new Error('Canonical T0 browser QA did not pass.');
