/** Scoped production presentation regression. Authored V6 origin/combat-result fixtures;
 * native route clocks, checkpoint UI, dialogue, fork and Journey handoffs. Not earned campaign QA. */
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import { beginJob } from './qa/qa-job.mjs';

const arg = (name, fallback) => process.argv.find(x => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const motion = arg('motion', 'normal'), reduced = motion === 'os';
assert.ok(['normal', 'os'].includes(motion));
const port = Number(arg('port', reduced ? '5277' : '5276'));
const output = arg('output', `tmp/traversal/visual-convergence-${motion}`);
const parameters = { motion, viewports: ['1440x810', '620x780', '390x844'], gameReducedMotion: false,
  scope: 'production presentation with V6 origin and combat-result fixtures' };
const requiredAssertions = ['shared-native-ground', 'clan-empty-stops', 'single-shadow', 'native-handoffs', 'responsive-controls', 'os-only-reduction'];
const job = beginJob({ output, driver: 'tools/traversal-visual-convergence-qa.mjs', port, parameters, requiredAssertions });
const report = { parameters, method: parameters.scope, startedAt: new Date().toISOString(), runs: [], captures: [], failures: [], errors: [], assertions: {} };
report.sourceHashes = Object.fromEntries(['src/traversal/TraversalWorldSubject.ts', 'src/traversal/TraversalRoadScene.ts', 'src/traversal/TraversalWorldRenderer.ts', 'src/styles/traversal.css']
  .map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]));
let server, browser, models;
try {
  models = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
  const { createInitialState } = await models.ssrLoadModule('/src/game/store.ts');
  const { createRunState, enterRunNode } = await models.ssrLoadModule('/src/game/runSystem.ts');
  const origins = {};
  for (const [leg, target] of [['T1', 'lion-first-refuge'], ['T3', 'lion-second-refuge']]) {
    const seed = createInitialState(); seed.run = createRunState(6101);
    seed.flags = { ...seed.flags, prologueSeen: true, lionMissionAccepted: true, helpedRefugees: true };
    const previous = new Map([[seed.run.currentNodeId, null]]), queue = [seed.run.currentNodeId];
    while (queue.length && !previous.has(target)) {
      const id = queue.shift();
      for (const next of seed.run.graph.nodes.find(node => node.id === id)?.links ?? []) {
        if (!previous.has(next)) { previous.set(next, id); queue.push(next); }
      }
    }
    const path = []; for (let id = target; id; id = previous.get(id)) path.unshift(id);
    for (const id of path.slice(1)) {
      seed.resolvedNodeIds.push(seed.run.currentNodeId);
      assert.ok(enterRunNode(seed.run, id)); seed.currentNodeId = id;
      seed.visitedNodeIds = [...seed.run.visitedNodeIds]; seed.stepCounter++;
    }
    seed.settings.reducedGraphics = false;
    origins[leg] = seed;
  }
  await models.close(); models = null;
  server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
  browser = await chromium.launch({ headless: true });
  const forest = '/assets/generated/lion-phase/traversal/t0/world-v1/forest-road.png';
  for (const leg of ['T0', 'T1', 'T3']) for (const branchKind of ['event', 'combat']) {
    const branch = `lion-${leg === 'T0' ? 'first' : leg === 'T1' ? 'second' : 'final'}-trial-${branchKind}`;
    const context = await browser.newContext({ viewport: { width: 1440, height: 810 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const entry = { leg, branch, complete: false, scenes: [], handoffs: [], captures: [], combats: [] };
    report.runs.push(entry);
    page.on('pageerror', error => report.errors.push(`${leg}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(`${leg}: ${message.text()}`); });
    page.on('response', response => { if (response.status() >= 400 && response.url().includes('/assets/')) report.errors.push(`asset ${response.status()}: ${response.url()}`); });
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      assert.ok(pattern.test(source), 'Production bootstrap hook missing');
      await route.fulfill({ response, body: source.replace(pattern, (match, name) => match.replace(';window.addEventListener', `;window.__visualApp=${name};window.addEventListener`)) });
    });
    if (leg !== 'T0') {
      const seed = structuredClone(origins[leg]); seed.reputation = 65;
      if (leg === 'T3') seed.mysteryAssignments[branch] = branchKind === 'event' ? 'mystery_dragon_roost' : 'ruins_guardians';
      await page.addInitScript(seed => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(seed)), seed);
    }
    await page.goto(`http://127.0.0.1:${port}/?qa=1`);
    await page.waitForFunction(() => !!window.__visualApp);
    if (leg === 'T0') await page.evaluate(async () => {
      const app = window.__visualApp; app.qaEnabled = true; app.traversalT0QaEnabled = true;
      await app.startTraversalT0Qa(); app.state.settings.reducedGraphics = false;
    });
    else await page.locator('[data-action="continue"]').click();
    await page.evaluate(() => {
      const app = window.__visualApp; window.__visualProof = { handoffs: [], arrivals: 0, combats: [] };
      const original = app.commitRunNodeChoice.bind(app);
      app.commitRunNodeChoice = (...args) => { window.__visualProof.handoffs.push(args[0]); return original(...args); };
      const arrival = app.completeTraversalArrival.bind(app);
      app.completeTraversalArrival = (...args) => { window.__visualProof.arrivals++; return arrival(...args); };
    });
    const captured = new Set();
    async function capture(name) {
      if (captured.has(name)) return; captured.add(name);
      const original = page.viewportSize();
      await page.evaluate(() => { const scene = window.__visualApp.activeTraversal; if (scene) cancelAnimationFrame(scene.frameId); });
      for (const viewport of [original, { width: 620, height: 780 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport); await page.waitForTimeout(70);
        await page.evaluate(() => window.__visualApp.activeTraversal?.updateWorldTransforms());
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('.traversal-world-section:not([hidden]) img')].map(img => img.decode())); });
        const proof = await page.evaluate(() => {
          const app = window.__visualApp, scene = app.activeTraversal, root = scene?.element;
          const visible = element => { const r = element.getBoundingClientRect(); return !element.hidden && getComputedStyle(element).visibility !== 'hidden' && r.right > 0 && r.x < innerWidth && r.bottom > 0 && r.y < innerHeight; };
          const sections = [...root.querySelectorAll(`${root.dataset.view === 'route' ? '.traversal-world__route-sections' : '.traversal-world__sections'} [data-world-section]`)].filter(visible);
          const subjects = [...root.querySelectorAll('[data-traversal-beat]')].filter(visible).map(e => ({ id: e.dataset.traversalBeat, kind: e.dataset.worldSubject,
            marker: e.dataset.marker, images: [...e.querySelectorAll('img')].map(img => img.getAttribute('src')), formation: e.querySelectorAll('.traversal-formation-member').length }));
          const controls = [...root.querySelectorAll('button:not([disabled])')].filter(visible).map(e => {const r=e.getBoundingClientRect();return { label:e.textContent, x:r.x,y:r.y,right:r.right,bottom:r.bottom };});
          return { view: root.dataset.view, segment: root.dataset.routeSegment, phase: scene.session.phase,
            gameReduced: app.state.settings.reducedGraphics, osReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
            ground: sections.map(e => { const g=e.querySelector('.traversal-world-section__ground'),p=g.parentElement.getBoundingClientRect();return { src:g.getAttribute('src'), decoded:g.complete&&g.naturalWidth>0, width:p.width,height:p.height,mask:getComputedStyle(g).maskImage }; }),
            subjects, controls, facts: { node:app.state.run.currentNodeId, flags:app.state.flags, branch:app.state.run.traversalBranches },
            caravan:root.querySelector('.traversal-vehicle').getBoundingClientRect().toJSON() };
        });
        assert.equal(proof.gameReduced, false, 'Game false for OS-only coverage'); assert.equal(proof.osReduced, reduced);
        assert.ok(proof.ground.length && proof.ground.every(g => g.src === forest && g.decoded && Math.abs(g.width / g.height - 1.5) < .01 && g.mask !== 'none'), 'Native ground and scale');
        assert.ok(proof.subjects.every(s => s.formation === 0 && (s.marker !== 'danger' || (s.kind === 'shadow' && s.images.length === 1 && s.images[0].endsWith('/shadow-pursuer.png')))), 'One Shadow marker, no formations');
        if (leg === 'T1' && ['t1-route-1', 't1-route-4a'].includes(proof.segment) && proof.view === 'checkpoint') assert.ok(proof.subjects.every(s => !s.images.length), 'Empty clan stops');
        assert.ok(proof.controls.every(c => c.x >= -1 && c.y >= -1 && c.right <= viewport.width + 1 && c.bottom <= viewport.height + 1), 'Controls stay in viewport');
        const file = `${leg}-${branchKind}-${name}-${viewport.width}.png`;
        await page.screenshot({ path: `${output}/${file}` });
        const item = { file, viewport, ...proof }; report.captures.push(item); entry.captures.push(file);
      }
      await page.setViewportSize(original);
      await page.evaluate(() => { const scene = window.__visualApp.activeTraversal; if(scene) { scene.updateWorldTransforms(); scene.previousFrameMs=performance.now(); scene.frameId=requestAnimationFrame(scene.tick); } });
    }
    const deadline = Date.now() + 240000;
    let last='';
    while (Date.now() < deadline) {
      const s = await page.evaluate(() => { const app=window.__visualApp, scene=app.activeTraversal;return { current:app.state.run.currentNodeId,view:scene?.element.dataset.view,segment:scene?.element.dataset.routeSegment,phase:scene?.session.phase,transition:scene?.element.dataset.transition,progress:scene?.routeRun.progress01,cp:scene?.checkpointElapsed,arrivals:window.__visualProof.arrivals }; });
      const key=`${s.segment}/${s.view}/${s.phase}`;if(key!==last){last=key;entry.scenes.push(key);console.log(`${motion}/${leg}/${branchKind}: ${key}`);}
      if(s.arrivals===1) { entry.complete=true; break; }
      if(s.view==='route'&&!s.transition&&s.progress>.12&&s.progress<.8) await capture(`route-${s.segment}`);
      if(s.view==='checkpoint'&&!s.transition&&s.cp>=.8) await capture(`checkpoint-${s.segment}`);
      const fork=page.locator(`[data-traversal-fork-choice="${branch}"]:visible:not([disabled])`);
      if(await fork.count()){await fork.focus();await page.keyboard.press('Enter');}
      const event=page.locator('[data-traversal-confirm]:visible:not([disabled])');
      if(await event.count()){await event.focus();await page.keyboard.press('Enter');}
      const refuge=page.locator('.exploration-stop [data-action="continue"]:visible');if(await refuge.count())await refuge.click();
      const journey=page.locator('[data-journey-continue]:visible:not([disabled])');if(await journey.count()&&!s.segment)await journey.first().click();
      const choices=page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      if(await choices.count())await choices.first().click();
      else {const box=page.locator('.dialogue .dialogue__box:visible');if(await box.count())await box.first().click();}
      const skip=page.locator('.cinematic-overlay__skip:visible:not([disabled])');if(await skip.count())await skip.first().click();
      const frame=page.frames().find(f=>f.url().includes('legacy-combat'));
      if(frame)await frame.evaluate(() => {
        if(window.__visualSent||!window.__BOOTED)return;const app=window.parent.__visualApp,session=app.combat.session;if(!session)return;
        window.__visualSent=true;window.parent.__visualProof.combats.push(session.config.id);
        window.parent.postMessage({type:'rpg-threejs:combat-result',victory:true,combatId:session.config.id,inventory:session.inventory,participants:session.preferredUnitIds,unitHealth:Object.fromEntries(session.clan.map(unit=>[unit.id,unit.currentHealth]))},location.origin);
      }).catch(()=>{});
      await page.waitForTimeout(80);
    }
    const final=await page.evaluate(()=>({ ...window.__visualProof,branch:window.__visualApp.state.run.traversalBranches,node:window.__visualApp.state.run.currentNodeId }));
    Object.assign(entry,{...final,branchState:final.branch,branch});
    assert.ok(entry.complete,'Native arrival reached');assert.equal(final.arrivals,1);assert.equal(final.branch?.[leg],branch);
    assert.ok(final.handoffs.includes(branch),'Canonical selected branch handoff preserved');
    assert.ok(entry.captures.some(x=>x.includes('checkpoint'))&&entry.captures.some(x=>x.includes('route')),'Representative route/checkpoint sequence');
    await context.close();
  }
  for(const name of requiredAssertions)report.assertions[name]=true;
} catch(error) { report.failures.push(error.stack??String(error)); }
finally {
  await browser?.close();await models?.close();
  if(server)await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));
  report.endedAt=new Date().toISOString();report.pass=!report.failures.length&&!report.errors.length;
  await mkdir(output,{recursive:true});await writeFile(`${output}/results.json`,JSON.stringify(report,null,2)+'\n');
  const receipt=job.finish(report);console.log(JSON.stringify({pass:report.pass,captures:report.captures.length,failures:report.failures,errors:report.errors,receipt:receipt.status}));
  if(!report.pass)process.exitCode=1;
}
