/** Real GameApp/save integration; optional isolated candidate gate before source activation. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const production = process.argv.includes('--production');
const candidate = process.argv.includes('--candidate');
if (production && candidate) throw new Error('Candidate overrides are DEV-only.');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9)
  ?? `tmp/traversal/t1-integration-${production ? 'production' : 'dev'}`;
await mkdir(output, { recursive: true });
const models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
const { createInitialState } = await models.ssrLoadModule('/src/game/store.ts');
const { createRunState, enterRunNode } = await models.ssrLoadModule('/src/game/runSystem.ts');
const origin = createInitialState(); origin.run = createRunState(6101);
origin.flags = { ...origin.flags, prologueSeen: true, lionMissionAccepted: true, helpedRefugees: true };
// A durable V6 fixture reaches the real refuge; its gathering, securing and departure are real UI.
const target = 'lion-first-refuge', previous = new Map([[origin.run.currentNodeId, null]]), queue = [origin.run.currentNodeId];
while (queue.length && !previous.has(target)) {
  const id = queue.shift();
  for (const next of origin.run.graph.nodes.find(node => node.id === id)?.links ?? []) {
    if (!previous.has(next)) { previous.set(next, id); queue.push(next); }
  }
}
const path = []; for (let id = target; id; id = previous.get(id)) path.unshift(id);
for (const id of path.slice(1)) {
  origin.resolvedNodeIds.push(origin.run.currentNodeId);
  if (!enterRunNode(origin.run, id)) throw new Error(`Fixture cannot enter ${id}`);
  origin.currentNodeId = id; origin.visitedNodeIds = [...origin.run.visitedNodeIds]; origin.stepCounter++;
}
await models.close();
const port = production ? 5237 : 5236;
const server = production ? await preview({ preview: { host: '127.0.0.1', port, strictPort: true } })
  : await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
if (!production) await server.listen();
const browser = await chromium.launch({ headless: true });
const report = { method: `${production ? 'built production' : candidate ? 'DEV candidate gate injected only in isolated browser' : 'DEV source'}; real GameApp, V6 localStorage, RunSystem and responsive UI; combat-result fixture only`,
  startedAt: new Date().toISOString(), runs: [], captures: [], failures: [], errors: [], frameIssues: [] };

async function installHooks(page) {
  if (production) await page.route('**/assets/game-*.js', async route => {
    const response = await route.fetch(), source = await response.text();
    const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
    if (!pattern.test(source)) throw new Error('Built bootstrap hook missing');
    await route.fulfill({ response, body: source.replace(pattern, (match, name) =>
      match.replace(';window.addEventListener', `;window.__t1App=${name};window.addEventListener`)) });
  });
  else await page.route('**/src/main.ts', async route => {
    const response = await route.fetch(), source = await response.text();
    if (!source.includes('const app = new GameApp(root, canvas);')) throw new Error('DEV bootstrap hook missing');
    await route.fulfill({ response, body: source.replace('const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__t1App = app;') });
  });
  if (candidate) {
    await page.route('**/src/traversal/TraversalPresentation.ts', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /T0: \(options\) => new TraversalT0Scene\(options\)/;
      if (!pattern.test(source)) throw new Error('Candidate registry hook missing');
      await route.fulfill({ response, body: `import { TraversalT1Scene } from '/src/traversal/TraversalT1Scene.ts';\n`
        + source.replace(pattern, '$&, T1: (options) => new TraversalT1Scene(options)') });
    });
    await page.route('**/src/traversal/TraversalFeaturePolicy.ts', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /Object\.freeze\(\["T0"\]\)/;
      if (!pattern.test(source)) throw new Error('Candidate gate hook missing');
      await route.fulfill({ response, body: source.replace(pattern, 'Object.freeze(["T0", "T1"])') });
    });
  }
}

async function observe(page) {
  await page.evaluate(() => {
    const app = window.__t1App;
    window.__t1Evidence = { handoffs: [], pickups: [], arrivals: 0, frames: [], swaps: [], saves: [], mechanics: {} };
    for (const [name, key] of [['commitRunNodeChoice', 'handoffs'], ['acceptTraversalRouteReward', 'pickups']]) {
      const original = app[name].bind(app);
      app[name] = (...args) => {
        if (key === 'handoffs') window.__t1Evidence[key].push(args[0]);
        else {
          const before = app.state.run.temporaryLoot.gold, secured = app.state.gold;
          const accepted = original(...args);
          window.__t1Evidence[key].push({ ...args[0], accepted, before, after: app.state.run.temporaryLoot.gold,
            securedBefore: secured, securedAfter: app.state.gold }); return accepted;
        }
        return original(...args);
      };
    }
    const arrival = app.completeTraversalArrival.bind(app);
    app.completeTraversalArrival = (...args) => { window.__t1Evidence.arrivals++; return arrival(...args); };
    let lastView = null, lastFrame = performance.now();
    const sample = () => {
      const now = performance.now(), gap = now - lastFrame; lastFrame = now;
      const root = app.activeTraversal?.element;
      if (document.querySelector('.travel-view')) window.__t1Evidence.frames.push('TravelView flash');
      if (root?.isConnected) {
        const scene = app.activeTraversal, segment = scene.routeSegment.id;
        window.__t1Evidence.mechanics[segment] = {
          hazards: scene.authoring.hazards(segment).map(hazard => hazard.id), risk: scene.routeRisk,
          pouches: scene.authoring.pickups(segment).map(pickup => pickup.id), reward: scene.routeReward,
          pursuitWindow: scene.authoring.pursuitWindow(segment)?.id ?? null, pursuit: scene.routePursuit,
        };
        const route = root.querySelector('.traversal-world__route-sections'), cp = root.querySelector('.traversal-world__sections');
        const visible = element => getComputedStyle(element).visibility !== 'hidden';
        const cover = Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity);
        const global = document.querySelector('.scene-transition--traversal');
        const globalCover = global ? Number(getComputedStyle(global).opacity) : 0;
        if (visible(route) === visible(cp)) window.__t1Evidence.frames.push('simultaneous/missing worlds');
        if (root.querySelectorAll('.traversal-vehicle').length !== 1) window.__t1Evidence.frames.push('caravan count');
        if (lastView && lastView !== root.dataset.view) {
          window.__t1Evidence.swaps.push({ view: root.dataset.view, cover, globalCover, gap });
          if (gap <= 100 && cover < .999 && globalCover < .999) window.__t1Evidence.frames.push('uncovered world swap');
        }
        lastView = root.dataset.view;
      } else lastView = null;
      requestAnimationFrame(sample);
    }; requestAnimationFrame(sample);
  });
}

async function driveContent(page) {
  const choices = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
  if (await choices.count()) await choices.first().click();
  else if (await page.locator('.dialogue .dialogue__box:visible').count())
    await page.locator('.dialogue .dialogue__box:visible').first().click();
  const skip = page.locator('.cinematic-overlay__skip:visible:not([disabled])');
  if (await skip.count()) await skip.first().click();
  const frame = page.frames().find(item => item.url().includes('legacy-combat'));
  if (frame) await frame.evaluate(() => {
    if (window.__t1VictorySent || !window.__BOOTED) return;
    window.__t1BootAt ??= performance.now(); if (performance.now() - window.__t1BootAt < 1000) return;
    const session = window.parent.__t1App.combat.session; if (!session) return;
    window.__t1VictorySent = true;
    window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: true, combatId: session.config.id,
      inventory: session.inventory, participants: session.preferredUnitIds,
      unitHealth: Object.fromEntries(session.clan.map(unit => [unit.id, unit.currentHealth])) }, location.origin);
  }).catch(() => {});
}

async function run(branch, reduced = false) {
  const context = await browser.newContext({ viewport: reduced ? { width: 390, height: 844 } : { width: 1440, height: 810 },
    reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage(); await installHooks(page);
  const entry = { branch, reduced, captures: [], interrupts: [], complete: false }; report.runs.push(entry);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/assets/')) report.errors.push(`asset ${response.status()}: ${response.url()}`); });
  await page.addInitScript(seed => { if (!localStorage.getItem('rpg-threejs:autosave:v6')) {
    seed.settings.reducedGraphics = matchMedia('(prefers-reduced-motion: reduce)').matches;
    localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(seed));
  } }, origin);
  await page.goto(`http://127.0.0.1:${port}/?qa=1`); await page.locator('[data-action="continue"]').click();
  await page.waitForFunction(() => !!window.__t1App); await observe(page);
  const captured = new Set();
  const capture = async (name, responsive = false) => {
    if (captured.has(name)) return; captured.add(name);
    const original = page.viewportSize();
    await page.evaluate(() => { const scene = window.__t1App.activeTraversal;
      if (scene) { cancelAnimationFrame(scene.frameId); window.__t1CaptureScene = scene; } });
    for (const viewport of responsive && !reduced ? [original, { width: 620, height: 780 }, { width: 390, height: 844 }] : [original]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(90);
      await page.evaluate(() => window.__t1CaptureScene?.updateWorldTransforms());
      const state = await page.evaluate(() => {
        const root = document.querySelector('.traversal-road');
        const controls = [...document.querySelectorAll('[data-traversal-lane], [data-traversal-fork-choice], [data-journey-choice], [data-journey-continue], .dialogue__choices button')]
          .filter(button => !button.disabled && button.getClientRects().length).map(button => {
            const r = button.getBoundingClientRect(); return { label: button.textContent.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom }; });
        return { phase: root?.dataset.phase, view: root?.dataset.view, segment: root?.dataset.routeSegment, controls,
          width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth,
          imagesLoaded: [...(root?.querySelectorAll('img') ?? [])].filter(img => img.getClientRects().length).every(img => img.complete && img.naturalWidth),
          actors: document.querySelectorAll('.narrative-stage__actor').length };
      });
      const file = `${branch}-${reduced ? 'reduced-' : ''}${name}-${viewport.width}.png`;
      await page.screenshot({ path: `${output}/${file}` }); report.captures.push({ file, state }); entry.captures.push(file);
      if (state.overflow > 1 || !state.imagesLoaded || state.controls.some(r => r.x < -1 || r.y < -1 || r.right > state.width + 1 || r.bottom > state.height + 1)) report.failures.push(`${file}: asset/control/overflow`);
    }
    await page.setViewportSize(original);
    await page.evaluate(() => { const scene = window.__t1CaptureScene;
      if (scene) { scene.previousFrameMs = performance.now(); scene.frameId = requestAnimationFrame(scene.tick); }
      window.__t1CaptureScene = null; });
  };
  let refugeSeen = false, departureSeen = false, chosen = false, originSave, priorPhase;
  const deadline = Date.now() + 360000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(80);
    const s = await page.evaluate(() => {
      const app = window.__t1App, scene = app.activeTraversal;
      return { current: app.state.run.currentNodeId, resolved: app.state.resolvedNodeIds,
        phase: scene?.session.phase, view: scene?.element.dataset.view, segment: scene?.element.dataset.routeSegment,
        progress: Number(scene?.element.dataset.routeProgress), transition: scene?.element.dataset.transition,
        cpElapsed: scene?.checkpointElapsed, fork: !!document.querySelector('.traversal-fork-overlay'),
        refuge: !!document.querySelector('.exploration-stop'), journey: !scene && !!document.querySelector('[data-journey-continue], [data-journey-choice]'),
        arrivals: window.__t1Evidence.arrivals, save: localStorage.getItem('rpg-threejs:autosave:v6') };
    }); entry.lastState = { ...s, save: undefined };
    const phase = `${s.current}/${s.segment ?? 'campaign'}/${s.phase ?? 'boundary'}`;
    if (phase !== priorPhase) { priorPhase = phase; console.log(`${branch}${reduced ? '/reduced' : ''}: ${phase}`); }
    if (s.refuge && !refugeSeen) { refugeSeen = true; await capture('refuge'); await page.locator('.exploration-stop [data-action="continue"]').click(); }
    if (s.journey && s.current === 'lion-first-refuge') {
      departureSeen = true; originSave = s.save; await capture('departure', true);
      const boundary = JSON.parse(originSave);
      entry.originBoundary = { current: boundary.run.currentNodeId, resolved: boundary.resolvedNodeIds,
        secured: boundary.flags['refugeSecured:lion-first-refuge'], loot: boundary.run.temporaryLoot };
      if (!entry.originBoundary.secured || entry.originBoundary.loot.gold !== 0)
        report.failures.push(`${branch}: refuge securing boundary`);
      await page.locator('[data-journey-continue]:visible:not([disabled])').click();
    }
    if (s.view === 'route' && !s.transition && s.progress > .10 && s.segment === 't1-route-1') {
      if (reduced && !entry.keyboardLanes) {
        await page.keyboard.press('ArrowDown');
        const down = await page.evaluate(() => window.__t1App.activeTraversal.session.currentLane);
        await page.keyboard.press('ArrowUp');
        const up = await page.evaluate(() => window.__t1App.activeTraversal.session.currentLane);
        entry.keyboardLanes = { down, up };
        if (down !== 1 || up !== 0) report.failures.push(`${branch}: keyboard lane control`);
      }
      await capture('route', true);
    }
    if (s.view === 'checkpoint' && !s.transition && s.cpElapsed >= .8 && s.phase === 'RUNNING'
      && ['t1-route-1', 't1-route-2', 't1-route-4a', 't1-route-4b'].includes(s.segment)) await capture(s.segment, true);
    if (!reduced && branch.endsWith('event') && originSave &&
      ((s.view === 'route' && s.segment === 't1-route-2' && !s.transition && s.progress > .1 && !entry.interrupts.includes('resolved-reserve'))
      || (s.fork && !entry.interrupts.includes('selected-fork')))) {
      const kind = s.fork ? 'selected-fork' : 'resolved-reserve';
      if (s.fork) { await page.locator(`[data-traversal-fork-choice="${branch}"]`).click(); chosen = false; }
      const saved = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
      if (saved !== originSave) report.failures.push(`${kind}: autosave mutated during physical leg`);
      entry.interrupts.push(kind); report.frameIssues.push(...await page.evaluate(() => window.__t1Evidence.frames));
      await page.reload(); await page.locator('[data-action="continue"]').click(); await observe(page);
      await page.waitForSelector('[data-journey-continue]:visible');
      const resume = await page.evaluate(() => ({ current: window.__t1App.state.run.currentNodeId,
        branches: window.__t1App.state.run.traversalBranches, loot: window.__t1App.state.run.temporaryLoot,
        expected: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')).run.temporaryLoot }));
      if (resume.current !== 'lion-first-refuge' || resume.branches?.T1 || JSON.stringify(resume.loot) !== JSON.stringify(resume.expected)) report.failures.push(`${kind}: origin resume/loot/branch`);
      (entry.resumeBoundaries ??= []).push({ kind, ...resume });
      continue;
    }
    if (s.fork && !chosen) {
      await capture('fork', true); chosen = true;
      const option = page.locator(`[data-traversal-fork-choice="${branch}"]`);
      if (reduced) { await option.focus(); await option.press('Enter'); entry.keyboardFork = true; }
      else await option.click();
    }
    if (s.journey && s.arrivals === 1) {
      await capture('destination', true);
      Object.assign(entry, await page.evaluate(() => ({ ...window.__t1Evidence,
        current: window.__t1App.state.run.currentNodeId, visited: window.__t1App.state.run.visitedNodeIds,
        assignment: window.__t1App.state.mysteryAssignments, branchState: window.__t1App.state.run.traversalBranches,
        save: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')) })));
      if (!refugeSeen || !departureSeen || entry.current !== branch || entry.visited.includes('lion-village-choice')
        || entry.branchState?.T1 !== branch || entry.save.run.currentNodeId !== branch
        || JSON.stringify(entry.handoffs) !== JSON.stringify(['lion-reserve-trail', 'lion-valmir-road', branch])) report.failures.push(`${branch}: canonical origin/handoffs/destination`);
      if (!reduced && branch.endsWith('event') && JSON.stringify(entry.interrupts) !== JSON.stringify(['resolved-reserve', 'selected-fork']))
        report.failures.push(`${branch}: both interrupted save boundaries required`);
      if (!entry.pickups.length || entry.pickups.some(p => !p.accepted || p.after - p.before !== 5 || p.securedAfter !== p.securedBefore)
        || new Set(entry.pickups.map(p => p.id)).size !== entry.pickups.length) report.failures.push(`${branch}: temporary loot acceptance`);
      if (Object.keys(entry.mechanics).length !== 5 || Object.values(entry.mechanics).some(m =>
        m.hazards.some(id => !m.risk.resolvedHazardIds.includes(id))
        || m.pouches.some(id => !m.reward.resolvedPickupIds.includes(id))
        || (m.pursuitWindow && !m.pursuit.resolvedWindowIds.includes(m.pursuitWindow))))
        report.failures.push(`${branch}: complete Risk/Reward/Pursuit lifecycle`);
      report.frameIssues.push(...entry.frames);
      const saved = s.save;
      await page.reload(); await page.locator('[data-action="continue"]').click();
      await page.waitForSelector('[data-journey-choice]:visible, [data-journey-continue]:visible');
      const resumed = await page.evaluate(() => ({ current: window.__t1App.state.run.currentNodeId,
        traversal: !!window.__t1App.activeTraversal, branches: window.__t1App.state.run.traversalBranches,
        saved: localStorage.getItem('rpg-threejs:autosave:v6') }));
      if (resumed.current !== branch || resumed.traversal || resumed.branches?.T1 !== branch || resumed.saved !== saved) report.failures.push(`${branch}: destination V6 resume`);
      entry.destinationResume = resumed;
      await page.locator('[data-journey-choice]:visible:not([disabled]), [data-journey-continue]:visible:not([disabled])').first().click();
      if (!reduced) {
        await page.waitForSelector('.cinematic-overlay video', { timeout: 20000 });
        entry.destinationVideo = await page.locator('.cinematic-overlay video').evaluate(video =>
          video.currentSrc || video.querySelector('source')?.getAttribute('src'));
        if (!entry.destinationVideo?.includes('bois_clair_arrival')) report.failures.push(`${branch}: approved arrival video`);
        await page.locator('.cinematic-overlay__skip:visible').click();
      } else {
        entry.destinationVideo = 'reduced-motion dialogue fallback';
        if (await page.locator('.cinematic-overlay').count()) report.failures.push(`${branch}: reduced-motion video surface`);
      }
      await page.waitForSelector('.dialogue'); await capture('bois-clair-agency', true);
      entry.villageBoundary = await page.evaluate(() => ({ current: window.__t1App.state.run.currentNodeId,
        resolved: window.__t1App.state.resolvedNodeIds.includes('lion-village-choice'),
        dialogue: document.querySelector('.dialogue')?.dataset.dialogueSequence }));
      if (entry.villageBoundary.current !== 'lion-village-choice' || entry.villageBoundary.resolved) report.failures.push(`${branch}: village agency boundary`);
      entry.complete = true; break;
    }
    await driveContent(page);
  }
  if (!entry.complete) report.failures.push(`${branch}/${reduced}: incomplete ${JSON.stringify(entry.lastState)}`);
  await context.close();
}
try { await run('lion-second-trial-event'); await run('lion-second-trial-combat'); await run('lion-second-trial-event', true); }
catch (error) { report.failures.push(error.stack ?? String(error)); }
finally {
  report.endedAt = new Date().toISOString(); await browser.close();
  if (production) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  else await server.close();
  await writeFile(`${output}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ complete: report.runs.length === 3 && report.runs.every(run => run.complete), captures: report.captures.length,
  failures: report.failures, errors: report.errors, frameIssues: report.frameIssues }, null, 2));
if (report.failures.length || report.errors.length || report.frameIssues.length) process.exitCode = 1;
