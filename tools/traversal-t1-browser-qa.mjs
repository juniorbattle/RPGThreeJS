/** Isolated candidate QA: T1 source scene and canonical GameApp node/arrival owners, without rollout. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9) ?? 'tmp/traversal/t1-candidate-qa';
const port = 5235;
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const report = { method: 'DEV isolated unregistered T1 candidate; real GameApp node/arrival and RunSystem temporary loot callbacks; DEV combat victory fixture',
  runs: [], captures: [], errors: [], frameIssues: [], failures: [] };

async function run(branch, reduced = false) {
  const context = await browser.newContext({ viewport: reduced ? { width: 390, height: 844 } : { width: 1440, height: 810 },
    reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/assets/')) report.errors.push(`asset ${response.status()}: ${response.url()}`); });
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    const source = await response.text();
    if (!source.includes('const app = new GameApp(root, canvas);')) throw new Error('DEV GameApp hook missing');
    await route.fulfill({ response, body: source.replace('const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__t1QaApp = app;') });
  });
  await page.goto(`http://127.0.0.1:${port}/?qa=1`);
  await page.waitForSelector('.title-screen');
  await page.evaluate(async reduced => {
    const [{ TraversalT1Scene }, { LION_TRAVERSAL_LEGS }, { createInitialState }, authority, { TraversalPreviewSaves }] = await Promise.all([
      import('/src/traversal/TraversalT1Scene.ts'), import('/src/campaign/LionCampaignTravelRelations.ts'),
      import('/src/game/store.ts'), import('/src/game/runSystem.ts'), import('/src/traversal/TraversalPreviewSaves.ts'),
    ]);
    const app = window.__t1QaApp;
    app.traversalT0QaEnabled = true; app.saves = new TraversalPreviewSaves();
    app.disposeTraversal(); app.disposeJourney(); app.disposeNarrativeStage(); app.travel.close();
    app.exploration.close(); app.prologue.close(); app.combat.close();
    app.state = createInitialState();
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T1');
    app.state.run.currentNodeId = app.state.currentNodeId = leg.originNodeId;
    app.state.run.visitedNodeIds.push(leg.originNodeId); app.state.resolvedNodeIds.push(leg.originNodeId);
    app.state.settings.reducedGraphics = reduced;
    app.setMode('NARRATIVE'); document.body.dataset.campaignSurface = 'traversal';
    app.canvas.hidden = true; app.chrome.replaceChildren();
    window.__t1Qa = { handoffs: [], pickups: [], arrivals: 0, frames: [], swaps: [], lastView: null };
    const scene = new TraversalT1Scene({ root: app.root, leg, getState: () => app.state,
      getAvailableNodes: () => authority.getAvailableRunNodes(app.state), statusHud: app.statusHud,
      onNodeHandoff: async node => { window.__t1Qa.handoffs.push({ id: node.id, contentId: node.contentId }); await app.commitRunNodeChoice(node.id); },
      // The production acceptance callback correctly rejects an unregistered leg.
      // This fixture exercises the same temporary-loot owner, without changing its gate.
      onRouteRewardPickup: reward => { window.__t1Qa.pickups.push(reward); authority.addTemporaryLoot(app.state.run, { gold: reward.gold }); app.statusHud.refresh(); return true; },
      onArrival: async destination => { window.__t1Qa.arrivals++; await app.completeTraversalArrival(destination); },
      onMenu: () => app.renderTitle(),
    });
    app.activeTraversal = scene; scene.open();
    const frame = () => {
      const root = scene.element;
      if (root.isConnected) {
        const route = root.querySelector('.traversal-world__route-sections');
        const cp = root.querySelector('.traversal-world__sections');
        const visible = element => getComputedStyle(element).visibility !== 'hidden';
        const cover = Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity);
        const global = document.querySelector('.scene-transition--traversal');
        const globalCover = global ? Number(getComputedStyle(global).opacity) : 0;
        if (visible(route) && visible(cp)) window.__t1Qa.frames.push('simultaneous-worlds');
        if (window.__t1Qa.lastView && window.__t1Qa.lastView !== root.dataset.view) {
          window.__t1Qa.swaps.push({ view: root.dataset.view, cover, globalCover });
          if (cover < .999 && globalCover < .999) window.__t1Qa.frames.push('uncovered-world-swap');
        }
        window.__t1Qa.lastView = root.dataset.view;
        if (document.querySelector('.travel-view')) window.__t1Qa.frames.push('TravelView-flash');
      }
      requestAnimationFrame(frame);
    }; requestAnimationFrame(frame);
  }, reduced);
  const entry = { branch, reduced, handoffs: [], pickups: [], routes: [], checkpoints: [], swaps: [], complete: false };
  report.runs.push(entry);
  const captured = new Set();
  const capture = async (name, responsive = false) => {
    if (captured.has(name)) return; captured.add(name);
    const original = page.viewportSize();
    // Freeze only the ephemeral road clock while comparing the same art composition.
    await page.evaluate(() => {
      const scene = window.__t1QaApp.activeTraversal;
      if (scene) { cancelAnimationFrame(scene.frameId); window.__t1CaptureScene = scene; }
    });
    for (const viewport of responsive && !reduced ? [original, { width: 620, height: 780 }, { width: 390, height: 844 }] : [original]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(80);
      await page.evaluate(() => window.__t1CaptureScene?.updateWorldTransforms());
      const state = await page.evaluate(() => {
        const root = document.querySelector('.traversal-road');
        const activeControls = [...document.querySelectorAll('[data-traversal-lane], [data-traversal-fork-choice]')]
          .filter(button => !button.disabled && button.getClientRects().length).map(button => {
            const r = button.getBoundingClientRect(); return { label: button.getAttribute('aria-label') ?? button.textContent.trim(),
              x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
          });
        return { phase: root?.dataset.phase, view: root?.dataset.view, segment: root?.dataset.routeSegment,
          controls: activeControls, overflow: document.documentElement.scrollWidth - innerWidth,
          width: innerWidth, height: innerHeight, imagesLoaded: [...(root?.querySelectorAll('img') ?? [])]
            .filter(img => img.getClientRects().length).every(img => img.complete && img.naturalWidth) };
      });
      const file = `${branch}-${reduced ? 'reduced-' : ''}${name}-${viewport.width}.png`;
      await page.screenshot({ path: `${output}/${file}` }); report.captures.push({ file, state });
      if (state.overflow > 1 || !state.imagesLoaded || state.controls.some(r => r.x < -1 || r.y < -1
        || r.right > state.width + 1 || r.bottom > state.height + 1)) report.failures.push(`${file}: asset/control/overflow`);
    }
    await page.setViewportSize(original);
    await page.evaluate(() => {
      const scene = window.__t1CaptureScene;
      if (scene) { scene.previousFrameMs = performance.now(); scene.frameId = requestAnimationFrame(scene.tick); }
      window.__t1CaptureScene = null;
    });
  };
  let deadline = Date.now() + 240000;
  let branchChosen = false;
  let priorSegment;
  let priorState;
  while (Date.now() < deadline) {
    await page.waitForTimeout(70);
    const s = await page.evaluate(() => {
      const app = window.__t1QaApp, scene = app.activeTraversal;
      return { phase: scene?.session.phase, view: scene?.element.dataset.view, segment: scene?.element.dataset.routeSegment,
        progress: scene?.element.dataset.routeProgress, transition: scene?.element.dataset.transition,
        checkpointElapsed: scene?.checkpointElapsed,
        stage: scene?.session.stageIndex, fork: Boolean(document.querySelector('.traversal-fork-overlay')),
        dialogue: Boolean(document.querySelector('.dialogue')), cinematic: Boolean(document.querySelector('.cinematic-overlay')),
        destination: !scene && [...document.querySelectorAll('[data-journey-choice], [data-journey-continue]')]
          .some(button => !button.disabled && button.getBoundingClientRect().width > 0), arrivals: window.__t1Qa.arrivals };
    });
    if (`${s.segment}/${s.phase}` !== priorState) { priorState = `${s.segment}/${s.phase}`; console.log(`${branch}: ${priorState}`); }
    entry.lastState = s;
    if (s.view === 'route' && !s.transition && Number(s.progress) > .10 && s.segment !== priorSegment) {
      priorSegment = s.segment; entry.routes.push(s.segment); console.log(`${branch}: ${s.segment}`);
      if (s.segment === 't1-route-1') await capture('route', true);
    }
    if (s.view === 'checkpoint' && !s.transition && s.checkpointElapsed >= .8 && s.phase === 'RUNNING') {
      if (!entry.checkpoints.includes(s.segment)) entry.checkpoints.push(s.segment);
      if (s.segment === 't1-route-1' || s.segment === 't1-route-2' || s.segment?.startsWith('t1-route-4')) await capture(s.segment, true);
    }
    if (s.fork && !branchChosen) {
      await capture('fork', true); branchChosen = true;
      await page.locator(`[data-traversal-fork-choice="${branch}"]`).click();
    }
    if (s.dialogue) {
      const choices = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if (await choices.count()) await choices.first().click();
      else await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {});
    }
    if (s.cinematic) await page.locator('.cinematic-overlay__skip:visible:not([disabled])').first().click().catch(() => {});
    const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
    if (frame) await frame.evaluate(() => {
      for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
        const button = document.querySelector(selector);
        if (button && button.getBoundingClientRect().width && !button.disabled) { button.click(); return; }
      }
    }).catch(() => {});
    if (s.destination && s.arrivals === 1) { entry.complete = true; await capture('destination'); break; }
  }
  Object.assign(entry, await page.evaluate(() => ({ handoffs: window.__t1Qa.handoffs, pickups: window.__t1Qa.pickups,
    swaps: window.__t1Qa.swaps, arrivals: window.__t1Qa.arrivals, currentNode: window.__t1QaApp.state.run.currentNodeId,
    visited: window.__t1QaApp.state.run.visitedNodeIds, frames: window.__t1Qa.frames })));
  report.frameIssues.push(...entry.frames);
  if (!entry.complete || entry.arrivals !== 1 || entry.visited.includes('lion-village-choice')
    || JSON.stringify(entry.handoffs.map(node => node.id)) !== JSON.stringify(['lion-reserve-trail', 'lion-valmir-road', branch]))
    report.failures.push(`${branch}/${reduced}: canonical handoff/arrival`);
  await context.close();
}
try {
  await run('lion-second-trial-event');
  await run('lion-second-trial-combat');
  await run('lion-second-trial-event', true);
} finally {
  await browser.close(); await server.close();
  await writeFile(`${output}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ complete: report.runs.every(run => run.complete), captures: report.captures.length,
  failures: report.failures, errors: report.errors, frameIssues: report.frameIssues }, null, 2));
if (report.failures.length || report.errors.length || report.frameIssues.length) process.exitCode = 1;
