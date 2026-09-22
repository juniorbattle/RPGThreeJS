/** Unmodified built bundle, standard save, real UI controls; no QA victories or route hooks. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const dev = process.env.TRAVERSAL_DEV_URL ?? 'http://127.0.0.1:5190';
const prod = process.env.TRAVERSAL_PROD_URL ?? 'http://127.0.0.1:5191';
const out = 'tmp/traversal-t0-production-rollout-1';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [], results = [];
page.on('pageerror', e => errors.push(String(e)));
const click = async selector => {
  const button = page.locator(selector).first();
  if (await button.isVisible() && await button.isEnabled()) { await button.click({ timeout: 2000 }); return true; }
  return false;
};
async function settle() {
  await page.waitForFunction(() => !document.querySelector('.scene-transition'), null, { timeout: 45000 });
}
async function monitor() {
  await page.evaluate(() => {
    window.proof = { travelMounts: 0, traversalMounts: 0, traversalDisposals: [], maxTraversal: 0, phases: [], combats: [], writes: [] };
    const proof = window.proof;
    const observeScene = scene => {
      if (scene.__observed) return;
      scene.__observed = true;
      proof.traversalMounts++;
      window.originalScene = scene;
      new MutationObserver(() => {
        const phase = scene.dataset.phase;
        if (proof.phases.at(-1)?.phase !== phase) proof.phases.push({ phase, progress: scene.dataset.progress,
          interruption: scene.dataset.interruption, cover: +(document.querySelector('.scene-transition') ? getComputedStyle(document.querySelector('.scene-transition')).opacity : 0) });
      }).observe(scene, { attributes: true });
    };
    new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) {
          if (node.matches('.travel-view') || node.querySelector('.travel-view')) proof.travelMounts++;
          if (node.matches('.traversal-t0')) observeScene(node);
          if (node.matches('.combat-frame')) proof.combats.push({ src: node.getAttribute('src'), title: node.title });
        }
        for (const node of record.removedNodes) if (node instanceof Element && node.matches('.traversal-t0')) {
          proof.traversalDisposals.push({ phase: node.dataset.phase,
            cover: +(document.querySelector('.scene-transition') ? getComputedStyle(document.querySelector('.scene-transition')).opacity : 0) });
        }
      }
      proof.maxTraversal = Math.max(proof.maxTraversal, document.querySelectorAll('.traversal-t0').length);
    }).observe(document.body, { childList: true, subtree: true });
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'rpg-threejs:autosave:v6') proof.writes.push(JSON.parse(value).run.currentNodeId);
      return set.call(this, key, value);
    };
  });
}

// Tactical bot reads the existing diagnostics and projects cells with the rendered camera.
// All gameplay actions go through ordinary deployment/menu/pointer UI handlers.
async function combatStep(frame) {
  return frame.evaluate(() => {
    const shown = el => el && el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== 'hidden';
    const click = selector => { const el = document.querySelector(selector); if (shown(el) && !el.disabled) { el.click(); return true; } return false; };
    if (click('#tutorial [data-action="skip"]')) return;
    const done = document.querySelector('#combat-result-action');
    if (shown(done)) { done.click(); return; }
    const g = window.G, renderer = window.__COMBAT_RENDERER;
    if (document.querySelector('[data-qa]')) throw new Error('Production QA controls exposed');
    if (renderer && !renderer.__observed) {
      renderer.__observed = true;
      const render = renderer.render;
      renderer.render = function(scene, camera) {
        if (camera.isPerspectiveCamera && !window.G?.stage) window.proofCamera = camera;
        return render.call(this, scene, camera);
      };
    }
    if (!g) return;
    if (g.mode === 'deploy') {
      if (!g.deployedUnits.length) click('[data-d="auto"]');
      else click('[data-d="start"]');
      return;
    }
    if (g.busy || g.stage || !g.active || g.active.team !== 'player' || g.over) return;
    if (g.mode === 'menu') {
      if (click('[data-ch="2"]:not(.dis)') || click('[data-ch="1"]:not(.dis)') || click('[data-ch="0"]:not(.dis)')) return;
      if (click('[data-a="attack"]:not(.dis)')) return;
      if (!g.movedThisTurn && click('[data-a="move"]:not(.dis)')) return;
      click('[data-a="wait"]'); return;
    }
    if (g.mode !== 'move' && g.mode !== 'target') return;
    const camera = window.proofCamera;
    if (!camera) return;
    const foes = g.units.filter(u => u.alive && u.team === 'foe');
    let cell;
    if (g.mode === 'target') {
      const target = foes.filter(u => g.pending.keys.has(u.gx+','+u.gz)).sort((a,b) => a.hp-b.hp)[0];
      if (target) cell = g.grid[target.gx][target.gz];
    } else {
      const range = g.active.weapons[0]?.max ?? 1;
      const score = p => Math.min(...foes.map(u => Math.abs(Math.abs(p.gx-u.gx)+Math.abs(p.gz-u.gz)-range)));
      const candidates = g.reach.list.filter(p => p.gx !== g.active.gx || p.gz !== g.active.gz).sort((a,b) => score(a)-score(b) || a.d-b.d);
      if (candidates[0]) cell = g.grid[candidates[0].gx][candidates[0].gz];
    }
    if (cell) {
      const v = cell.mesh.position.clone(); v.y = cell.topY; v.project(camera);
      renderer.domElement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0,
        clientX: (v.x*.5+.5)*innerWidth, clientY: (-v.y*.5+.5)*innerHeight }));
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      if (!g.movedThisTurn && click('[data-a="move"]:not(.dis)')) return;
      click('[data-a="wait"]');
    }
  });
}

try {
  // Generate a schema-valid standard pre-T0 save using the real repository, in a separate DEV page.
  const fixturePage = await browser.newPage();
  await fixturePage.goto(dev);
  const fixture = await fixturePage.evaluate(async () => {
    const { createInitialState } = await import('/src/game/store.ts');
    const state = createInitialState(); state.flags.prologueSeen = true;
    return state;
  });
  await fixturePage.close();
  await page.goto(prod);
  await page.evaluate(state => {
    localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(state));
    localStorage.setItem('rpg-tutorial-seen', '1');
  }, fixture);
  await page.reload(); await monitor();
  await click('[data-action="continue"]');
  for (let i = 0; i < 300 && !(await page.locator('[data-journey-continue]:visible').count()); i++) {
    if (!(await click('.dialogue__choices button:visible:not([disabled])'))) await click('.dialogue__box:visible');
    await page.waitForTimeout(150);
  }
  await page.waitForSelector('[data-journey-continue]'); await settle();
  assert.equal(await page.locator('.traversal-t0').count(), 0);
  await click('[data-journey-continue]');
  let entered = false, restarts = false, last = '', roadStarted = false, arrival = false;
  for (let tick = 0; tick < 9000; tick++) {
    await page.waitForTimeout(120);
    if (tick % 100 === 0) { console.log('tick', tick, await page.locator('body').getAttribute('data-mode')); await page.screenshot({ path: `${out}/progress.png` }); }
    if (await page.locator('.scene-transition').count()) continue;
    const state = await page.evaluate(() => {
      const el = document.querySelector('.traversal-t0');
      return el ? { phase: el.dataset.phase, progress: +el.dataset.progress, transition: el.dataset.transition,
        category: el.querySelector('[data-traversal-event-panel]')?.dataset.category,
        lane: el.dataset.lane, same: el === window.originalScene,
        interruption: el.dataset.interruption } : null;
    });
    const tag = JSON.stringify([state?.phase, state?.interruption]);
    if (tag !== last) { console.log(tick, state); last = tag; }
    if (state) {
      assert.equal(state.same, true);
      if (!entered) {
        entered = true;
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
        assert.equal(saved.run.currentNodeId, 'lion-audience');
        assert.ok(saved.resolvedNodeIds.includes('lion-audience'));
        assert.equal(await page.locator('.narrative-stage').count(), 0);
        const entryProof = await page.evaluate(() => ({ travelMounts: window.proof.travelMounts, traversalMounts: window.proof.traversalMounts, maxTraversal: window.proof.maxTraversal }));
        assert.deepEqual(entryProof, { travelMounts: 0, traversalMounts: 1, maxTraversal: 1 });
        results.push({ name: 'automatic production entry from normally resolved audience', ...entryProof });
        await page.screenshot({ path: `${out}/production-t0-entry.png` });
      }
      if (!restarts && state.progress > .02 && state.phase === 'RUNNING' && !state.transition) {
        await page.keyboard.press('Escape');
        await page.waitForSelector('.title-screen');
        assert.equal(await page.locator('.traversal-t0').count(), 0);
        await click('[data-action="continue"]');
        await page.waitForSelector('.traversal-t0'); await settle();
        assert.ok(+(await page.locator('.traversal-t0').getAttribute('data-progress')) < .02);
        await page.reload();
        await page.waitForSelector('.title-screen'); await monitor();
        await click('[data-action="continue"]');
        await page.waitForSelector('.traversal-t0'); await settle();
        results.push({ name: 'Escape/Continue and reload/Continue restart from durable origin', passed: true });
        restarts = true; continue;
      }
      if (state.transition && !['NODE_RESOLUTION', 'LOCAL_INTERACTION'].includes(state.phase)) continue;
      if (state.phase === 'RUNNING') {
        // Generic road encounter is lower lane near .30; refugees use the upper lane at .60.
        const lane = state.progress > .22 && state.progress < .54 ? '1' : '0';
        if (state.lane !== lane) await click(`[data-traversal-lane="${lane}"]`);
      }
      if (state.phase === 'DECISION') {
        if (state.category === 'OPTIONAL_COMBAT') roadStarted = true;
        await click('[data-traversal-confirm]'); continue;
      }
      if (state.phase === 'LOCAL_INTERACTION' && !(await page.locator('.combat-frame').count())) {
        await click('[data-traversal-confirm]');
      }
      if (state.phase === 'FORK_OVERLAY') {
        await page.screenshot({ path: `${out}/production-fork.png` });
        await click('[data-traversal-fork-choice="lion-first-trial-event"]'); continue;
      }
    }
    const combat = page.frames().find(f => f.url().includes('legacy-combat'));
    if (combat) { if (tick % 100 === 0) { console.log('combat', await combat.evaluate(() => ({ mode: window.G?.mode, busy: window.G?.busy, round: window.G?.round, player: window.G?.active?.name, over: window.G?.over }))); await page.screenshot({ path: `${out}/combat-progress.png` }); } await combatStep(combat); continue; }
    if (await click('.dialogue__choices button:visible:not([disabled])')) continue;
    if (await click('.dialogue__box:visible')) continue;
    if (entered && !state && await page.locator('[data-journey-continue]:visible').count()) { arrival = true; break; }
  }
  assert.ok(arrival, 'full production T0 must arrive');
  assert.ok(roadStarted, 'one generic road combat must be played');
  await settle();
  const proof = await page.evaluate(() => ({ ...window.proof,
    saved: JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')) }));
  assert.equal(proof.travelMounts, 0);
  assert.equal(proof.traversalMounts, 1);
  assert.equal(proof.maxTraversal, 1);
  assert.deepEqual(proof.traversalDisposals, [{ phase: 'COMPLETE', cover: 1 }]);
  assert.ok(!proof.saved.run.visitedNodeIds.includes('lion-first-refuge'));
  assert.ok(proof.saved.resolvedNodeIds.includes('lion-first-trial-event'));
  assert.ok(proof.saved.resolvedNodeIds.includes('lion-nomad-crossroads'));
  assert.ok(proof.saved.resolvedNodeIds.includes('lion-opening-ambush'));
  assert.deepEqual(proof.writes, ['lion-audience', 'lion-first-trial-event']);
  await page.screenshot({ path: `${out}/production-arrival-agency.png` });
  results.push({ name: 'full built production T0 no selector', ...proof, saved: undefined,
    current: proof.saved.run.currentNodeId, resolved: proof.saved.resolvedNodeIds });
  await click('[data-journey-continue]');
  await page.waitForSelector('[data-action="continue"]');
  await click('[data-action="continue"]');
  await page.waitForSelector('[data-journey-continue]'); await settle();
  assert.equal(await page.locator('.traversal-t0').count(), 0);
  assert.equal(await page.locator('.narrative-stage').count(), 1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
  assert.equal(saved.run.currentNodeId, 'lion-first-refuge');
  assert.ok(saved.resolvedNodeIds.includes('lion-first-refuge'));
  results.push({ name: 'explicit refuge then Journey at T1 origin', passed: true });
  assert.deepEqual(errors, []);
  await writeFile(`${out}/browser-results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log('PASS', results.map(r => r.name));
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png` }).catch(() => {});
  await writeFile(`${out}/browser-failure.json`, JSON.stringify({ error: String(error), results, errors,
    proof: await page.evaluate(() => window.proof).catch(() => null) }, null, 2));
  throw error;
} finally { await browser.close(); }
