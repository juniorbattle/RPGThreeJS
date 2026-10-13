/** Real GameApp/save integration; optional isolated candidate gate before source activation. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const production = process.argv.includes('--production');
const candidate = process.argv.includes('--candidate');
if (production && candidate) throw new Error('Candidate overrides are DEV-only.');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9)
  ?? `tmp/traversal/t3-integration-${production ? 'production' : 'dev'}`;
await mkdir(output, { recursive: true });
const models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
const { createInitialState } = await models.ssrLoadModule('/src/game/store.ts');
const { createRunState, enterRunNode } = await models.ssrLoadModule('/src/game/runSystem.ts');
const origin = createInitialState(); origin.run = createRunState(6101);
origin.flags = { ...origin.flags, prologueSeen: true, lionMissionAccepted: true, helpedRefugees: true };
// A durable V6 fixture reaches the real refuge; its gathering, securing and departure are real UI.
const target = 'lion-second-refuge', previous = new Map([[origin.run.currentNodeId, null]]), queue = [origin.run.currentNodeId];
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
const port = Number(process.argv.find(arg => arg.startsWith('--port='))?.slice(7) ?? (production ? 5241 : 5240));
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
      match.replace(';window.addEventListener', `;window.__t3App=${name};window.addEventListener`)) });
  });
  else await page.route('**/src/main.ts', async route => {
    const response = await route.fetch(), source = await response.text();
    if (!source.includes('const app = new GameApp(root, canvas);')) throw new Error('DEV bootstrap hook missing');
    await route.fulfill({ response, body: source.replace('const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__t3App = app;') });
  });
  if (candidate) {
    await page.route('**/src/traversal/TraversalPresentation.ts', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /T1: \(options\) => new TraversalT1Scene\(options\)/;
      if (!pattern.test(source)) throw new Error('Candidate registry hook missing');
      await route.fulfill({ response, body: `import { TraversalT3Scene } from '/src/traversal/TraversalT3Scene.ts';\n`
        + source.replace(pattern, '$&, T3: (options) => new TraversalT3Scene(options)') });
    });
    await page.route('**/src/traversal/TraversalFeaturePolicy.ts', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /Object\.freeze\(\[["']T0["'],\s*["']T1["']\]/;
      if (!pattern.test(source)) throw new Error('Candidate gate hook missing');
      await route.fulfill({ response, body: source.replace(pattern, "Object.freeze(['T0', 'T1', 'T3']") });
    });
  }
}

async function observe(page) {
  await page.evaluate(() => {
    const app = window.__t3App;
    window.__t3Evidence = { handoffs: [], pickups: [], arrivals: 0, frames: [], swaps: [], saves: [], mechanics: {} };
    for (const [name, key] of [['commitRunNodeChoice', 'handoffs'], ['acceptTraversalRouteReward', 'pickups']]) {
      const original = app[name].bind(app);
      app[name] = (...args) => {
        if (key === 'handoffs') window.__t3Evidence[key].push(args[0]);
        else {
          const before = app.state.run.temporaryLoot.gold, secured = app.state.gold;
          const accepted = original(...args);
          window.__t3Evidence[key].push({ ...args[0], accepted, before, after: app.state.run.temporaryLoot.gold,
            securedBefore: secured, securedAfter: app.state.gold }); return accepted;
        }
        return original(...args);
      };
    }
    const arrival = app.completeTraversalArrival.bind(app);
    app.completeTraversalArrival = (...args) => { window.__t3Evidence.arrivals++; return arrival(...args); };
    let lastView = null, lastFrame = performance.now();
    const sample = () => {
      const now = performance.now(), gap = now - lastFrame; lastFrame = now;
      const root = app.activeTraversal?.element;
      if (document.querySelector('.travel-view')) window.__t3Evidence.frames.push('TravelView flash');
      if (root?.isConnected) {
        window.__t3MountedScene ??= app.activeTraversal;
        if (window.__t3MountedScene !== app.activeTraversal) window.__t3Evidence.frames.push('scene replaced during physical leg');
        const scene = app.activeTraversal, segment = scene.routeSegment.id;
        window.__t3Evidence.mechanics[segment] = {
          hazards: scene.authoring.hazards(segment).map(hazard => hazard.id), risk: scene.routeRisk,
          pouches: scene.authoring.pickups(segment).map(pickup => pickup.id), reward: scene.routeReward,
          pursuitWindow: scene.authoring.pursuitWindow(segment)?.id ?? null, pursuit: scene.routePursuit,
        };
        const route = root.querySelector('.traversal-world__route-sections'), cp = root.querySelector('.traversal-world__sections');
        const visible = element => getComputedStyle(element).visibility !== 'hidden';
        const cover = Number(getComputedStyle(root.querySelector('.traversal-transition')).opacity);
        const global = document.querySelector('.scene-transition--traversal');
        const globalCover = global ? Number(getComputedStyle(global).opacity) : 0;
        if (visible(route) === visible(cp)) window.__t3Evidence.frames.push('simultaneous/missing worlds');
        if (root.querySelectorAll('.traversal-vehicle').length !== 1) window.__t3Evidence.frames.push('caravan count');
        if (lastView && lastView !== root.dataset.view) {
          window.__t3Evidence.swaps.push({ view: root.dataset.view, cover, globalCover, gap });
          if (gap <= 100 && cover < .999 && globalCover < .999) window.__t3Evidence.frames.push('uncovered world swap');
        }
        lastView = root.dataset.view;
      } else lastView = null;
      requestAnimationFrame(sample);
    }; requestAnimationFrame(sample);
  });
}

async function driveContent(page, scenario, entry) {
  const choices = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
  if (await choices.count()) {
    const sequence = await page.locator('.dialogue').getAttribute('data-dialogue-sequence');
    const step = await page.locator('.dialogue').getAttribute('data-dialogue-step');
    const index = scenario.choices?.[sequence] ?? 0;
    entry.choices ??= []; entry.choices.push({ sequence, step, index });
    await choices.nth(index).click();
  }
  else if (await page.locator('.dialogue .dialogue__box:visible').count())
    await page.locator('.dialogue .dialogue__box:visible').first().click();
  const skip = page.locator('.cinematic-overlay__skip:visible:not([disabled])');
  if (await skip.count()) await skip.first().click();
  const frame = page.frames().find(item => item.url().includes('legacy-combat'));
  if (frame) await frame.evaluate(({ scenario }) => {
    if (window.__t3VictorySent || !window.__BOOTED) return;
    window.__t3BootAt ??= performance.now(); if (performance.now() - window.__t3BootAt < 1000) return;
    const session = window.parent.__t3App.combat.session; if (!session) return;
    window.__t3VictorySent = true;
    const evidence = window.parent.__t3Evidence;
    evidence.combats ??= []; evidence.combats.push({ id: session.config.id, leg: window.parent.__t3App.activeTraversal?.session.legId,
      phase: window.parent.__t3App.activeTraversal?.session.phase,
      sameScene: window.parent.__t3App.activeTraversal === window.parent.__t3MountedScene, victory: !scenario.defeat });
    window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: !scenario.defeat, combatId: session.config.id,
      inventory: session.inventory, participants: session.preferredUnitIds,
      unitHealth: Object.fromEntries(session.clan.map(unit => [unit.id, unit.currentHealth])) }, location.origin);
  }, { scenario }).catch(() => {});
}

async function run(scenario) {
  const { branch, contentId, reduced = false } = scenario;
  const runId = scenario.id;
  const seed = structuredClone(origin);
  seed.reputation = scenario.reputation ?? 65;
  seed.mysteryAssignments[branch] = contentId;
  const context = await browser.newContext({ viewport: reduced ? { width: 390, height: 844 } : { width: 1440, height: 810 },
    reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage(); await installHooks(page);
  const entry = { id: runId, branch, contentId, reduced, captures: [], interrupts: [], complete: false }; report.runs.push(entry);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/assets/')) report.errors.push(`asset ${response.status()}: ${response.url()}`); });
  page.on('requestfailed', request => {
    if (request.url().includes('/assets/') && request.failure()?.errorText !== 'net::ERR_ABORTED')
      report.errors.push(`asset request failed: ${request.url()}`);
  });
  await page.addInitScript(seed => { if (!localStorage.getItem('rpg-threejs:autosave:v6')) {
    seed.settings.reducedGraphics = matchMedia('(prefers-reduced-motion: reduce)').matches;
    localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(seed));
  } }, seed);
  await page.goto(`http://127.0.0.1:${port}/?qa=1`); await page.locator('[data-action="continue"]').click();
  await page.waitForFunction(() => !!window.__t3App); await observe(page);
  const captured = new Set();
  const capture = async (name, responsive = false) => {
    if (captured.has(name)) return; captured.add(name);
    const original = page.viewportSize();
    await page.evaluate(() => { const scene = window.__t3App.activeTraversal;
      if (scene) { cancelAnimationFrame(scene.frameId); window.__t3CaptureScene = scene; } });
    for (const viewport of responsive && !reduced ? [original, { width: 620, height: 780 }, { width: 390, height: 844 }] : [original]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(90);
      await page.evaluate(() => window.__t3CaptureScene?.updateWorldTransforms());
      const state = await page.evaluate(() => {
        const root = document.querySelector('.traversal-road');
        const controls = [...document.querySelectorAll('[data-traversal-lane], [data-traversal-fork-choice], [data-journey-choice], [data-journey-continue], .dialogue__choices button')]
          .filter(button => !button.disabled && button.getClientRects().length).map(button => {
            const r = button.getBoundingClientRect(); return { label: button.textContent.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom }; });
        return { phase: root?.dataset.phase, view: root?.dataset.view, segment: root?.dataset.routeSegment, controls,
          width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth,
          imagesLoaded: [...(root?.querySelectorAll('img') ?? [])].filter(img => img.getClientRects().length).every(img => img.complete && img.naturalWidth),
          actors: [...document.querySelectorAll('.narrative-stage__actor')].filter(actor => actor.getClientRects().length
            && getComputedStyle(actor).visibility !== 'hidden').length };
      });
      const file = `${runId}-${reduced ? 'reduced-' : ''}${name}-${viewport.width}.png`;
      await page.screenshot({ path: `${output}/${file}` }); report.captures.push({ file, state }); entry.captures.push(file);
      if (state.actors > 4 || state.overflow > 1 || !state.imagesLoaded || state.controls.some(r => r.x < -1 || r.y < -1 || r.right > state.width + 1 || r.bottom > state.height + 1)) report.failures.push(`${file}: asset/control/overflow/cast`);
    }
    await page.setViewportSize(original);
    await page.evaluate(() => { const scene = window.__t3CaptureScene;
      if (scene) { scene.previousFrameMs = performance.now(); scene.frameId = requestAnimationFrame(scene.tick); }
      window.__t3CaptureScene = null; });
  };
  let refugeSeen = false, departureSeen = false, chosen = false, originSave, priorPhase;
  const deadline = Date.now() + (scenario.interrupts ? 720000 : 360000);
  while (Date.now() < deadline) {
    await page.waitForTimeout(80);
    const s = await page.evaluate(() => {
      const app = window.__t3App, scene = app.activeTraversal;
      return { current: app.state.run.currentNodeId, resolved: app.state.resolvedNodeIds,
        phase: scene?.session.phase, view: scene?.element.dataset.view, segment: scene?.element.dataset.routeSegment,
        progress: Number(scene?.element.dataset.routeProgress), transition: scene?.element.dataset.transition,
        cpElapsed: scene?.checkpointElapsed, fork: !!document.querySelector('.traversal-fork-overlay'),
        refuge: !!document.querySelector('.exploration-stop'), journey: !scene && !!document.querySelector('[data-journey-continue], [data-journey-choice]'),
        arrivals: window.__t3Evidence.arrivals, save: localStorage.getItem('rpg-threejs:autosave:v6') };
    }); entry.lastState = { ...s, save: undefined };
    const phase = `${s.current}/${s.segment ?? 'campaign'}/${s.phase ?? 'boundary'}`;
    if (phase !== priorPhase) { priorPhase = phase; console.log(`${branch}${reduced ? '/reduced' : ''}: ${phase}`); }
    if (s.refuge && !refugeSeen) { refugeSeen = true; await capture('refuge'); await page.locator('.exploration-stop [data-action="continue"]').click(); }
    if (s.journey && s.current === 'lion-second-refuge') {
      departureSeen = true; originSave = s.save; await capture('departure', true);
      const boundary = JSON.parse(originSave);
      entry.originBoundary = { current: boundary.run.currentNodeId, resolved: boundary.resolvedNodeIds,
        secured: boundary.flags['refugeSecured:lion-second-refuge'], loot: boundary.run.temporaryLoot, gold: boundary.gold };
      if (!entry.originBoundary.secured || entry.originBoundary.loot.gold !== 0)
        report.failures.push(`${branch}: refuge securing boundary`);
      await page.locator('[data-journey-continue]:visible:not([disabled])').click();
    }
    if (s.view === 'route' && !s.transition && s.progress > .10 && s.segment === 't3-route-1') {
      if (reduced && !entry.keyboardLanes) {
        await page.keyboard.press('ArrowDown');
        const down = await page.evaluate(() => window.__t3App.activeTraversal.session.currentLane);
        await page.keyboard.press('ArrowUp');
        const up = await page.evaluate(() => window.__t3App.activeTraversal.session.currentLane);
        entry.keyboardLanes = { down, up };
        if (down !== 1 || up !== 0) report.failures.push(`${branch}: keyboard lane control`);
      }
      await capture('route', true);
    }
    if (s.view === 'checkpoint' && !s.transition && s.cpElapsed >= .8 && s.phase === 'RUNNING'
      && ['t3-route-1', 't3-route-2', 't3-route-4a', 't3-route-4b'].includes(s.segment)) await capture(s.segment, true);
    if (scenario.interrupts && originSave &&
      ((s.view === 'route' && s.segment === 't3-route-2' && !s.transition && s.progress > .1 && !entry.interrupts.includes('resolved-recruit'))
      || (s.view === 'route' && s.segment === 't3-route-3' && !s.transition && s.progress > .1 && !entry.interrupts.includes('resolved-witness'))
      || (s.fork && !entry.interrupts.includes('selected-fork')))) {
      const kind = s.fork ? 'selected-fork' : s.segment === 't3-route-2' ? 'resolved-recruit' : 'resolved-witness';
      if (s.fork) { await page.locator(`[data-traversal-fork-choice="${branch}"]`).click(); chosen = false; }
      const saved = await page.evaluate(() => localStorage.getItem('rpg-threejs:autosave:v6'));
      if (saved !== originSave) report.failures.push(`${kind}: autosave mutated during physical leg`);
      entry.interrupts.push(kind); report.frameIssues.push(...await page.evaluate(() => window.__t3Evidence.frames));
      await page.reload(); await page.locator('[data-action="continue"]').click(); await observe(page);
      await page.waitForSelector('[data-journey-continue]:visible');
      const resume = await page.evaluate(() => ({ current: window.__t3App.state.run.currentNodeId,
        branches: window.__t3App.state.run.traversalBranches, loot: window.__t3App.state.run.temporaryLoot,
        expected: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')).run.temporaryLoot }));
      const restored = await page.evaluate(() => {
        const state = window.__t3App.state, saved = JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6'));
        return { flags: JSON.stringify(state.flags) === JSON.stringify(saved.flags),
          clan: JSON.stringify(state.clan) === JSON.stringify(saved.clan), reputation: state.reputation === saved.reputation,
          resolved: JSON.stringify(state.resolvedNodeIds) === JSON.stringify(saved.resolvedNodeIds),
          traversal: !!window.__t3App.activeTraversal };
      });
      if (resume.current !== 'lion-second-refuge' || resume.branches?.T3 || JSON.stringify(resume.loot) !== JSON.stringify(resume.expected)
        || !restored.flags || !restored.clan || !restored.reputation || !restored.resolved || restored.traversal)
        report.failures.push(`${kind}: origin resume/loot/branch/truth`);
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
      Object.assign(entry, await page.evaluate(() => ({ ...window.__t3Evidence,
        current: window.__t3App.state.run.currentNodeId, visited: window.__t3App.state.run.visitedNodeIds,
        assignment: window.__t3App.state.mysteryAssignments, branchState: window.__t3App.state.run.traversalBranches,
        flags: window.__t3App.state.flags, gold: window.__t3App.state.gold,
        save: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')) })));
      if (!refugeSeen || !departureSeen || entry.current !== branch || entry.visited.includes('lion-shadow-signs')
        || entry.branchState?.T3 !== branch || entry.save.run.currentNodeId !== branch
        || JSON.stringify(entry.handoffs) !== JSON.stringify(['lion-lancer-recruit', 'lion-witnesses', branch])) report.failures.push(`${branch}: canonical origin/handoffs/destination`);
      if (scenario.interrupts && JSON.stringify(entry.interrupts) !== JSON.stringify(['resolved-recruit', 'resolved-witness', 'selected-fork']))
        report.failures.push(`${branch}: both interrupted save boundaries required`);
      if (!entry.pickups.length || entry.pickups.some(p => !p.accepted || p.after - p.before !== 5 || p.securedAfter !== p.securedBefore)
        || new Set(entry.pickups.map(p => p.id)).size !== entry.pickups.length) report.failures.push(`${branch}: temporary loot acceptance`);
      if (entry.assignment[branch] !== contentId || entry.gold !== entry.originBoundary.gold
        || (scenario.expectedFlags ?? []).some(flag => !entry.flags[flag])
        || (scenario.absentFlags ?? []).some(flag => entry.flags[flag])
        || JSON.stringify((entry.combats ?? []).map(combat => combat.id)) !== JSON.stringify(scenario.combats ?? [])
        || (entry.combats ?? []).some(combat => combat.leg !== 'T3' || combat.phase !== 'NODE_RESOLUTION' || !combat.sameScene))
        report.failures.push(runId + ': canonical assignment/outcome/nested combat/secured gold');
      if (Object.keys(entry.mechanics).length !== 5 || Object.values(entry.mechanics).some(m =>
        m.hazards.some(id => !m.risk.resolvedHazardIds.includes(id))
        || m.pouches.some(id => !m.reward.resolvedPickupIds.includes(id))
        || (m.pursuitWindow && !m.pursuit.resolvedWindowIds.includes(m.pursuitWindow))))
        report.failures.push(`${branch}: complete Risk/Reward/Pursuit lifecycle`);
      report.frameIssues.push(...entry.frames);
      const saved = s.save;
      await page.reload(); await page.locator('[data-action="continue"]').click();
      await page.waitForSelector('[data-journey-choice]:visible, [data-journey-continue]:visible');
      const resumed = await page.evaluate(() => ({ current: window.__t3App.state.run.currentNodeId,
        traversal: !!window.__t3App.activeTraversal, branches: window.__t3App.state.run.traversalBranches,
        saved: localStorage.getItem('rpg-threejs:autosave:v6') }));
      if (resumed.current !== branch || resumed.traversal || resumed.branches?.T3 !== branch || resumed.saved !== saved) report.failures.push(`${branch}: destination V6 resume`);
      entry.destinationResume = resumed;
      await page.locator('[data-journey-choice]:visible:not([disabled]), [data-journey-continue]:visible:not([disabled])').first().click();
      await page.waitForSelector('.dialogue'); await capture('shadow-agency', true);
      entry.shadowBoundary = await page.evaluate(() => ({ current: window.__t3App.state.run.currentNodeId,
        resolved: window.__t3App.state.resolvedNodeIds.includes('lion-shadow-signs'),
        dialogue: document.querySelector('.dialogue')?.dataset.dialogueSequence,
        video: !!document.querySelector('.cinematic-overlay') }));
      if (entry.shadowBoundary.current !== 'lion-shadow-signs' || entry.shadowBoundary.resolved || entry.shadowBoundary.video)
        report.failures.push(runId + ': shadow agency boundary');
      entry.complete = true; break;
    }
    if (scenario.defeat && s.current === 'lion-second-refuge' && (await page.evaluate(() => !!window.__t3Evidence.combats?.some(c => !c.victory)))) {
      entry.defeatBoundary = await page.evaluate(() => ({ current: window.__t3App.state.run.currentNodeId,
        traversal: !!window.__t3App.activeTraversal, loot: window.__t3App.state.run.temporaryLoot,
        branches: window.__t3App.state.run.traversalBranches, save: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')),
        combats: window.__t3Evidence.combats, flags: window.__t3App.state.flags, clan: window.__t3App.state.clan,
        reputation: window.__t3App.state.reputation, roadCount: document.querySelectorAll('[data-traversal-leg="T3"]').length }));
      const checkpoint = JSON.parse(originSave);
      if (entry.defeatBoundary.traversal || entry.defeatBoundary.roadCount || entry.defeatBoundary.loot.gold !== 0 || entry.defeatBoundary.branches?.T3
        || JSON.stringify(entry.defeatBoundary.flags) !== JSON.stringify(checkpoint.flags)
        || JSON.stringify(entry.defeatBoundary.clan) !== JSON.stringify(checkpoint.clan)
        || entry.defeatBoundary.reputation !== checkpoint.reputation
        || entry.defeatBoundary.combats.length !== 1 || entry.defeatBoundary.combats[0].id !== 'witness_road_clash'
        || !entry.defeatBoundary.combats[0].sameScene)
        report.failures.push(runId + ': defeat checkpoint cleanup');
      await page.waitForSelector('[data-journey-continue]:visible');
      await page.waitForFunction(() => !document.querySelector('.scene-transition'));
      entry.defeatBoundary.departureAgency = await page.evaluate(() => !window.__t3App.activeTraversal
        && window.__t3App.state.run.currentNodeId === 'lion-second-refuge'
        && !document.querySelector('[data-traversal-leg="T3"]'));
      if (!entry.defeatBoundary.departureAgency) report.failures.push(runId + ': defeat departure agency');
      await capture('defeat'); entry.complete = true; break;
    }
    if (await page.locator('.dialogue .dialogue__choices button:visible:not([disabled])').count()) {
      const sequence = await page.locator('.dialogue').getAttribute('data-dialogue-sequence');
      await page.waitForFunction(() => {
        const text = document.querySelector('.dialogue__text');
        return text?.querySelector('.dialogue__text-reveal')?.textContent === text?.dataset.finalText;
      });
      await capture(`choices-${sequence}`, true);
    }
    const combat = await page.evaluate(() => window.__t3App.combat.session?.config.id);
    if (combat) {
      const frame = page.frames().find(item => item.url().includes('legacy-combat'));
      if (frame) await frame.waitForFunction(() => window.__BOOTED);
      await page.waitForFunction(() => [...document.querySelectorAll('.scene-transition')]
        .every(cover => Number(getComputedStyle(cover).opacity) < .01));
      await capture(`combat-${combat}`, true);
    }
    await driveContent(page, scenario, entry);
  }
  if (!entry.complete) report.failures.push(`${branch}/${reduced}: incomplete ${JSON.stringify(entry.lastState)}`);
  await context.close();
  await writeFile(`${output}/progress.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ scenario: runId, complete: entry.complete, failures: report.failures.length,
    errors: report.errors.length, frameIssues: report.frameIssues.length }));
}
const scenarios = [
  { id: 'dragon-fight', branch: 'lion-final-trial-event', contentId: 'mystery_dragon_roost', interrupts: true,
    expectedFlags: ['recruitedLancer', 'protectedWitnesses', 'challengedYoungDragon'], combats: ['young_dragon_roost'] },
  { id: 'dragon-spare', branch: 'lion-final-trial-event', contentId: 'mystery_dragon_roost', choices: { mystery_lancer_recruit: 1, witnesses_on_road: 1, mystery_dragon_roost: 1 },
    expectedFlags: ['silencedWitnesses', 'sparedYoungDragon'], absentFlags: ['recruitedLancer'], combats: ['witness_road_clash'] },
  { id: 'shrine-preserve', branch: 'lion-final-trial-event', contentId: 'mystery_shrine', reduced: true, reputation: 0,
    expectedFlags: ['preservedShrine'], absentFlags: ['recruitedLancer', 'protectedWitnesses'] },
  { id: 'shrine-break', branch: 'lion-final-trial-event', contentId: 'mystery_shrine', choices: { mystery_shrine: 1 }, expectedFlags: ['desecratedShrine'] },
  { id: 'informant-protect', branch: 'lion-final-trial-event', contentId: 'serpent_informant', expectedFlags: ['protectedInformant'], combats: ['serpent_hunters'] },
  { id: 'informant-sell', branch: 'lion-final-trial-event', contentId: 'serpent_informant', choices: { serpent_informant: 1 }, expectedFlags: ['betrayedInformant'] },
  { id: 'ruins-combat', branch: 'lion-final-trial-combat', contentId: 'ruins_guardians', combats: ['ruins_guardians'] },
  { id: 'serpent-combat', branch: 'lion-final-trial-combat', contentId: 'serpent_hunters', reduced: true, combats: ['serpent_hunters'] },
  { id: 'legacy-lancer', branch: 'lion-final-trial-event', contentId: 'mystery_lancer_recruit', expectedFlags: ['recruitedLancer'] },
  { id: 'witness-defeat', branch: 'lion-final-trial-event', contentId: 'mystery_dragon_roost', choices: { witnesses_on_road: 1 }, defeat: true },
];
const selected = process.argv.find(arg => arg.startsWith('--scenario='))?.slice(11);
const runs = selected ? scenarios.filter(s => s.id === selected) : scenarios;
if (!runs.length) throw new Error(`Unknown QA scenario: ${selected}`);
try { for (const scenario of runs) await run(scenario); }
catch (error) { report.failures.push(error.stack ?? String(error)); }
finally {
  report.endedAt = new Date().toISOString(); await browser.close();
  if (production) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  else await server.close();
  await writeFile(`${output}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ complete: report.runs.length === runs.length && report.runs.every(run => run.complete), captures: report.captures.length,
  failures: report.failures, errors: report.errors, frameIssues: report.frameIssues }, null, 2));
if (report.failures.length || report.errors.length || report.frameIssues.length) process.exitCode = 1;
