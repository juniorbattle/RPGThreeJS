/** Native built GameApp road sequences; fixture V6 origins/bootstrap and prior combat outcomes. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import { beginJob, registerJob } from './qa/qa-job.mjs';

const arg = (name, fallback) => process.argv.find(x => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const motion = arg('motion', 'normal'); assert.ok(['normal', 'os', 'game'].includes(motion));
const port = Number(arg('port', '5286')), output = arg('output', 'tmp/traversal/road-1600-normal');
const parameters = { motion, legs: arg('legs', 'T0,T1,T3').split(','), viewports: arg('viewports', '1440x810,620x780,390x844').split(','),
  roads: arg('roads', 'first').split(','), paths: arg('paths', 'contact-collect,miss-miss').split(','),
  earlyPaths: arg('early-paths', 'contact-collect').split(','), scope: 'native real built selected roads; V6 fixture origins/bootstrap/prior combat outcomes; no earned campaign/full road acceptance' };
const requiredAssertions = ['edge-entry-frozen-anchor', 'contact-collected-retention-full-exit', 'rendered-ground-depth',
  'native-keyboard-responsive-motion', 'single-temporary-pickup-no-secured-write', 'physical-contact-after-reset'];
const options = { runId: process.env.AUTONOMY_RUN_ID, jobId: process.env.DEMO_QA_JOB_ID, output,
  driver: 'tools/traversal-road-elements-production-qa.mjs', port, parameters, requiredAssertions };
if (process.argv.includes('--register')) { console.log(JSON.stringify({ registered: registerJob(options).jobId })); process.exit(0); }
const job = beginJob(options), report = { parameters, startedAt: new Date().toISOString(), runs: [], errors: [], assertions: [], captures: [] };
let models, server, browser;
try {
  models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  const { createInitialState } = await models.ssrLoadModule('/src/game/store.ts');
  const { createRunState, enterRunNode } = await models.ssrLoadModule('/src/game/runSystem.ts');
  const origins = {};
  for (const [leg, target] of [['T1', 'lion-first-refuge'], ['T3', 'lion-second-refuge']]) {
    const seed = createInitialState(); seed.run = createRunState(6101);
    seed.flags = { ...seed.flags, prologueSeen: true, lionMissionAccepted: true, helpedRefugees: true };
    const previous = new Map([[seed.run.currentNodeId, null]]), queue = [seed.run.currentNodeId];
    while (queue.length && !previous.has(target)) { const id = queue.shift();
      for (const next of seed.run.graph.nodes.find(n => n.id === id)?.links ?? []) if (!previous.has(next)) { previous.set(next, id); queue.push(next); } }
    const path = []; for (let id = target; id; id = previous.get(id)) path.unshift(id);
    for (const id of path.slice(1)) { seed.resolvedNodeIds.push(seed.run.currentNodeId); assert.ok(enterRunNode(seed.run, id));
      seed.currentNodeId = id; seed.visitedNodeIds = [...seed.run.visitedNodeIds]; seed.stepCounter++; }
    seed.settings.reducedGraphics = motion === 'game'; origins[leg] = seed;
  }
  await models.close(); models = null;
  server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
  browser = await chromium.launch({ headless: true });
  for (const leg of parameters.legs) for (const dimensions of parameters.viewports) for (const road of parameters.roads)
    for (const path of road === 'early-reset' ? parameters.earlyPaths : parameters.paths) {
    const [width, height] = dimensions.split('x').map(Number), number = road === 'early-reset' ? (leg === 'T0' ? 4 : 3) : 1;
    const target = leg === 'T0' ? `route-${number}` : `${leg.toLowerCase()}-route-${number}`;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: motion === 'os' ? 'reduce' : 'no-preference' });
    const entry = { leg, dimensions, motion, path, road, target, samples: [], captures: [], keyboard: [], priorCombatFixtures: [] }; report.runs.push(entry);
    page.on('pageerror', e => report.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      assert.ok(pattern.test(source), 'Known built bootstrap');
      await route.fulfill({ response, body: source.replace(pattern, (match, name) => match.replace(';window.addEventListener', `;window.__roadApp=${name};window.addEventListener`)) });
    });
    if (leg !== 'T0') await page.addInitScript(seed => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(seed)), origins[leg]);
    await page.goto(`http://127.0.0.1:${port}/?qa=1`); await page.waitForFunction(() => !!window.__roadApp);
    await page.evaluate(({ target, game }) => {
      const app = window.__roadApp; app.state.settings.reducedGraphics = game;
      window.__roadSamples = [];
      const sample = () => {
        const s = app.activeTraversal, root = s?.element;
        if (root?.dataset.routeSegment === target) {
          const vehicle = root.querySelector('.traversal-vehicle'), v = vehicle.getBoundingClientRect();
          const cover = Number(root.style.getPropertyValue('--transition-opacity') || 0);
          const marks = [...root.querySelectorAll('[data-risk-hazard],[data-reward-pickup]')].map(e => {
            const b = e.getBoundingClientRect(), style = getComputedStyle(e), i = e.querySelector('img');
            return { id: e.dataset.riskHazard ?? e.dataset.rewardPickup, family: e.dataset.riskHazard ? 'rock' : 'gold',
              lane: Number(e.dataset.riskLane ?? e.dataset.rewardLane), progress: Number(e.dataset.riskProgress ?? e.dataset.rewardProgress),
              hidden: e.hidden || e.parentElement.hidden, visibility: style.visibility, left: b.left, right: b.right, top: b.top, bottom: b.bottom,
              x: parseFloat(e.style.left), predictedLeft: Number(e.dataset.roadLeft), predictedRight: Number(e.dataset.roadRight),
              ground: Number(e.dataset.screenGroundY), renderedGround: parseFloat(style.top), z: Number(style.zIndex), parentZ: getComputedStyle(e.parentElement).zIndex,
              collected: e.dataset.collected === 'true', contact: e.dataset.contact === 'true', decoded: i.complete && i.naturalWidth > 0 };
          });
          window.__roadSamples.push({ time: performance.now(), width: innerWidth, height: innerHeight, distance: s.routeRenderer.distance,
            progress: s.routeRun.progress01, elapsed: s.routeRun.elapsedMs, duration: s.routeSegment.durationMs,
            reset: s.routeRun.speedResetAtMs, lane: s.routeRun.lane, visualSpeed: s.speed, distanceScale: s.roadDistanceScale,
            collisions: s.routeRisk.collisionCount, lastCollision: s.routeRisk.lastCollisionId,
            view: root.dataset.view, phase: s.session.phase, cover, vehicle: { left: v.left, right: v.right, top: v.top, bottom: v.bottom,
              z: Number(getComputedStyle(vehicle).zIndex), ground: Number(vehicle.dataset.screenGroundY), renderedGround: parseFloat(getComputedStyle(vehicle).top) }, marks,
            resolved: [...s.routeRisk.resolvedHazardIds], collectedIds: [...s.routeReward.collectedPickupIds],
            gold: app.state.gold, temporary: app.state.run.temporaryLoot.gold, game: app.state.settings.reducedGraphics,
            os: matchMedia('(prefers-reduced-motion: reduce)').matches });
        }
        window.__roadSampler = requestAnimationFrame(sample);
      }; sample();
    }, { target, game: motion === 'game' });
    if (leg === 'T0') await page.evaluate(async game => { const app = window.__roadApp; app.qaEnabled = true; app.traversalT0QaEnabled = true;
      await app.startTraversalT0Qa(); app.state.settings.reducedGraphics = game; app.activeTraversal.renderRuntimeState(); }, motion === 'game');
    else await page.locator('[data-action="continue"]').click();
    let lanesReady = false, switched = false, captured = new Set(), resized = false, requestedEvent = null;
    const capture = async label => { if (captured.has(label)) return; captured.add(label);
      const file = `${leg}-${width}-${motion}-${road}-${path}-${label}.png`; await page.screenshot({ path: `${output}/${file}` });
      entry.captures.push(file); report.captures.push({ file, leg, width, motion, path, label }); };
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      const s = await page.evaluate(target => { const scene = window.__roadApp.activeTraversal, r = scene?.element;
        return { target: r?.dataset.routeSegment === target, view: r?.dataset.view, transition: r?.dataset.transition,
          progress: scene?.routeRun.progress01, hazards: scene?.authoring.hazards(scene.routeSegment.id),
          pickups: scene?.authoring.pickups(scene.routeSegment.id), resolved: scene?.routeRisk.resolvedHazardIds,
          collected: scene?.routeReward.collectedPickupIds, sample: window.__roadSamples.at(-1) }; }, target);
      if (s.target && s.view === 'checkpoint') { await page.waitForTimeout(40); break; }
      if (!s.target) {
        for (const selector of ['[data-traversal-confirm]:visible:not([disabled])', '.exploration-stop [data-action="continue"]:visible', '[data-journey-continue]:visible:not([disabled])',
          '.dialogue .dialogue__choices button:visible:not([disabled])', '.dialogue .dialogue__box:visible', '.cinematic-overlay__skip:visible:not([disabled])']) {
          const c = page.locator(selector); if (await c.count()) await c.first().click(); }
        const frame = page.frames().find(f => f.url().includes('legacy-combat'));
        if (frame) { const combat = await frame.evaluate(() => {
          if (window.__roadSent || !window.__BOOTED) return null;
          const session = window.parent.__roadApp.combat.session; if (!session) return null;
          window.__roadSent = true;
          window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: true, combatId: session.config.id,
            inventory: session.inventory, participants: session.preferredUnitIds,
            unitHealth: Object.fromEntries(session.clan.map(u => [u.id, u.currentHealth])) }, location.origin);
          return session.config.id;
        }); if (combat) entry.priorCombatFixtures.push(combat); }
      } else if (s.view === 'route' && !s.transition) {
        assert.ok(s.hazards.length && s.pickups.length, 'Selected authored road has risk and reward');
        const hazard = s.hazards[0], pickup = s.pickups.find(p => p.progress01 > hazard.progress01) ?? s.pickups[0];
        if (!lanesReady && s.progress < hazard.progress01 - .1) {
          const button = page.locator('[data-traversal-lane="1"]:visible');
          for (let n = 0; n < 35 && !await button.evaluate(e => e === document.activeElement); n++) await page.keyboard.press('Tab');
          const f = await button.evaluate(e => { const b = e.getBoundingClientRect(), css = getComputedStyle(e); return { focused: e === document.activeElement,
            outline: css.outlineStyle, width: b.width, height: b.height, left: b.left, right: b.right, bottom: b.bottom }; });
          assert.ok(f.focused); assert.notEqual(f.outline, 'none'); assert.ok(f.left >= 0 && f.right <= width && f.bottom <= height);
          if (width <= 620) assert.ok(f.width >= 44 && f.height >= 44); entry.keyboard.push(f);
          lanesReady = true;
        }
        // Let the read-only RAF sampler observe a crossing before changing the native lane again.
        const observedProgress = s.sample?.progress ?? s.progress;
        const nextEvent = [...s.hazards, ...s.pickups].filter(e => e.progress01 > observedProgress).sort((a,b) => a.progress01 - b.progress01)[0];
        if (lanesReady && nextEvent && requestedEvent !== nextEvent.id) {
          const lane = path === 'contact-collect' ? nextEvent.lane : 1 - nextEvent.lane;
          await page.keyboard.press(lane === 0 ? 'ArrowUp' : 'ArrowDown'); requestedEvent = nextEvent.id;
        }
        if (s.resolved.length) switched = true;
        if (s.sample?.marks.some(m => !m.hidden && m.left < width && m.right > width - 80)) await capture('entry');
        if (road === 'early-reset' && s.progress > hazard.progress01 - .05 && s.progress < hazard.progress01
          && s.sample?.marks.some(m => m.id === pickup.id && !m.hidden)) await capture('visible-gold-before-reset');
        if (s.resolved.length && s.progress < hazard.progress01 + .12) await capture('passed-rock');
        if (s.collected.length || s.progress > pickup.progress01 && s.progress < pickup.progress01 + .1) await capture('passed-gold');
        if (s.collected.includes(pickup.id)) await capture('gold-after-reset');
        if (width === 1440 && path === 'miss-miss' && !resized && s.sample?.marks.some(m => !m.hidden && m.left > width * .7)) {
          await page.setViewportSize({ width: 1280, height }); await page.waitForTimeout(100);
          await page.setViewportSize({ width, height }); resized = true;
        }
      }
      await page.waitForTimeout(35);
    }
    entry.samples = await page.evaluate(() => { cancelAnimationFrame(window.__roadSampler); return window.__roadSamples; });
    assert.ok(lanesReady && switched && entry.samples.some(s => s.view === 'checkpoint'), 'Native first-road completion');
    const driving = entry.samples.filter(s => s.view === 'route' && s.cover < .01 && s.progress > .01);
    assert.ok(driving.length > 100);
    assert.ok(driving.every(s => s.game === (motion === 'game') && s.os === (motion === 'os')));
    assert.ok(driving.every(s => Number.isFinite(s.visualSpeed) && s.visualSpeed > 0));
    assert.ok(driving.every((s,i) => i === 0 || s.distance >= driving[i-1].distance), 'Shared world never reverses');
    for (const id of driving[0].marks.map(m => m.id)) {
      const frames = entry.samples.filter(s => s.view === 'route').map(s => ({ s, m: s.marks.find(m => m.id === id) }));
      const first = frames.find(f => !f.m.hidden), last = frames.findLast(f => !f.m.hidden);
      assert.ok(first && last, `Visible ${id}`); assert.ok(frames[0].m.predictedLeft >= frames[0].s.width - 30, 'Born outside or at natural right edge');
      assert.ok(first.m.left > first.s.width - 50, 'Partial edge entry without center pop');
      const anchor = (first.m.x / first.s.width - .25) * 1463 + first.s.distance;
      const entered = frames.slice(frames.indexOf(first));
      assert.ok(entered.every(f => Math.abs((f.m.x / f.s.width - .25) * 1463 + f.s.distance - anchor) < .02), 'Seen anchor frozen through reset/resize');
      assert.ok(entered.every(f => f.m.hidden === (f.m.predictedRight < 0)), 'Only full trailing-edge exit hides');
      assert.ok(entered.some(f => f.m.predictedRight < 0), 'Complete exit before checkpoint cover');
      assert.ok(last.m.right < 45, 'Last visible part reaches left edge');
      assert.ok(entered.filter(f => !f.m.hidden).every(f => f.m.decoded && f.m.visibility === 'visible' && f.m.parentZ === 'auto'));
      const crossing = frames.find(f => f.s.progress >= f.m.progress);
      assert.ok(crossing && !crossing.m.hidden, 'Resolution retains the mark');
      const beforeCrossing = frames[frames.indexOf(crossing) - 1], contactMs = crossing.m.progress * crossing.s.duration;
      assert.ok(beforeCrossing && beforeCrossing.s.elapsed < contactMs && crossing.s.elapsed >= contactMs
        && crossing.s.elapsed - beforeCrossing.s.elapsed < 40, 'Authored crossing bracketed by native frames');
      const fraction = (contactMs - beforeCrossing.s.elapsed) / (crossing.s.elapsed - beforeCrossing.s.elapsed);
      const contactX = beforeCrossing.m.x + (crossing.m.x - beforeCrossing.m.x) * fraction;
      assert.ok(beforeCrossing.s.width === crossing.s.width && Math.abs(contactX - crossing.s.width * .25) < 3,
        'Interpolated physical center matches authored clock');
      assert.equal(crossing.s.lane, path === 'contact-collect' ? crossing.m.lane : 1 - crossing.m.lane);
      if (crossing.m.family === 'rock') {
        const hazardCount = frames[0].s.marks.filter(m => m.family === 'rock' && m.progress <= crossing.m.progress).length;
        assert.equal(crossing.s.collisions, path === 'contact-collect' ? hazardCount : 0);
        assert.equal(crossing.s.lastCollision, path === 'contact-collect' ? id : null);
        if (path === 'contact-collect') assert.equal(crossing.s.reset, crossing.s.elapsed, 'Owner reset occurs on native resolving frame');
        if (path === 'contact-collect') {
          const before = frames.filter(f => f.s.progress < crossing.m.progress).at(-1);
          const after = frames.filter(f => f.s.elapsed > crossing.s.elapsed && f.s.elapsed < crossing.s.elapsed + 150);
          assert.ok(before && after.length && Math.min(...after.map(f => f.s.visualSpeed)) < before.s.visualSpeed, 'Collision visibly slows the shared world');
        }
      }
      assert.ok(entered.filter(f => !f.m.hidden).every(f => Math.abs(f.m.ground - f.m.renderedGround) < 1 && Math.abs(f.s.vehicle.ground - f.s.vehicle.renderedGround) < 10), 'Depth uses rendered ground');
      assert.ok(entered.filter(f => !f.m.hidden && Math.abs(f.m.renderedGround - f.s.vehicle.renderedGround) > 10)
        .every(f => Math.sign(f.m.z - f.s.vehicle.z) === Math.sign(f.m.renderedGround - f.s.vehicle.renderedGround)), 'Actual near/far ground ordering');
    }
    const first = driving[0], last = driving.at(-1), gold = driving.flatMap(s => s.marks).find(m => m.family === 'gold');
    assert.ok(driving.every(s => s.gold === first.gold), 'No secured currency change');
    const pickupCount = first.marks.filter(m => m.family === 'gold').length, expectedGold = path === 'contact-collect' ? pickupCount * 5 : 0;
    assert.equal(last.temporary - first.temporary, expectedGold);
    assert.equal(last.collectedIds.length, path === 'contact-collect' ? pickupCount : 0);
    assert.ok(driving.every(s => new Set(s.resolved).size === s.resolved.length && new Set(s.collectedIds).size === s.collectedIds.length));
    assert.ok(driving.every(s => s.temporary - first.temporary === s.collectedIds.length * 5), 'One temporary award per unique pickup');
    assert.ok(driving.some(s => s.marks.some(m => m.id === gold.id && !m.hidden && m.collected === (path === 'contact-collect') && s.progress > m.progress + .05)));
    entry.summary = { frames: driving.length, resized, goldDelta: last.temporary - first.temporary, riskReset: last.reset, secureGold: last.gold };
    console.log(`${leg}/${dimensions}/${motion}/${path}: PASS ${driving.length} frames`); await page.close();
  }
  assert.equal(report.errors.length, 0); report.pass = true; report.assertions = requiredAssertions.map(id => ({ id, pass: true }));
} catch (e) { report.pass = false; report.errors.push(e.stack ?? String(e)); }
finally {
  await models?.close(); await browser?.close(); await server?.httpServer?.close(); report.endedAt = new Date().toISOString();
  await writeFile(`${output}/results.json`, JSON.stringify(report) + '\n'); const receipt = job.finish(report);
  console.log(JSON.stringify({ status: receipt.status, output, runs: report.runs.length, errors: report.errors })); if (!report.pass) process.exitCode = 1;
}
