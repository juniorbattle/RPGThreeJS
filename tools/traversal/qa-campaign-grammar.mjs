/** Built bundle; standard pre-audience save; progression exclusively through player UI. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const smoke = process.argv.includes('--presentation-smoke');
const out = 'docs/reports/t0-campaign-grammar-browser' + (smoke ? '/final-presentation' : '');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--remote-debugging-port=9222'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [], evidence = [];
page.on('pageerror', error => errors.push(String(error)));
const click = async selector => {
  const control = page.locator(selector).first();
  if (await control.isVisible() && await control.isEnabled()) {
    await control.click({ timeout: 1500 }); return true;
  }
  return false;
};
const shot = async name => { await page.waitForFunction(() => !document.querySelector('.scene-transition')); await page.waitForTimeout(400); await page.waitForFunction(() => !document.querySelector('.scene-transition')); await page.screenshot({ path: `${out}/${name}.png` }); };
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
const settle = () => page.waitForFunction(() => !document.querySelector('.scene-transition'), null, { timeout: 45000 });

try {
  const fixturePage = await browser.newPage();
  await fixturePage.goto('http://127.0.0.1:5190');
  const fixture = await fixturePage.evaluate(async () => {
    const { createInitialState } = await import('/src/game/store.ts');
    const state = createInitialState(); state.flags.prologueSeen = true;
    return state;
  });
  await fixturePage.close();
  await page.goto('http://127.0.0.1:5191');
  await page.evaluate(state => {
    localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(state));
    localStorage.setItem('rpg-tutorial-seen', '1');
  }, fixture);
  await page.reload();
  await page.evaluate(() => {
    window.grammarProof = { traversalMounts: 0, travelMounts: 0, maxHud: 0, removed: [], dialogues: [], writes: [] };
    const proof = window.grammarProof;
    new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) {
          if (node.matches('.traversal-t0')) { proof.traversalMounts++; window.grammarRoad = node; }
          if (node.matches('.travel-view')) proof.travelMounts++;
        }
        for (const node of record.removedNodes) if (node instanceof Element && node.matches('.traversal-t0')) {
          proof.removed.push({ phase: node.dataset.phase, cover: Number(getComputedStyle(document.querySelector('.scene-transition')).opacity) });
        }
      }
      proof.maxHud = Math.max(proof.maxHud, document.querySelectorAll('.campaign-status-hud').length);
      const id = document.querySelector('.narrative-stage')?.dataset.narrativeTableau;
      if (id && proof.dialogues.at(-1) !== id) proof.dialogues.push(id);
    }).observe(document.body, { childList: true, subtree: true });
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'rpg-threejs:autosave:v6') proof.writes.push(JSON.parse(value).run.currentNodeId);
      return set.call(this, key, value);
    };
  });
  await click('[data-action="continue"]');
  let departed = false, merchant = false, refugeesIgnored = false, wolvesIgnored = false;
  let arrival = false, refugeEntered = false, gathering = false, management = false, finished = false;
  let repBeforeIgnore = null, roadOrigin = null, last = '', lastCombatShot = 0;
  for (let tick = 0; tick < 15000; tick++) {
    await page.waitForTimeout(140);
    if (tick % 150 === 0) console.log('progress', tick, await page.locator('body').getAttribute('data-mode'));
    if (await page.locator('.scene-transition').count()) continue;
    const screen = await page.evaluate(() => {
      const road = document.querySelector('.traversal-t0');
      const stage = document.querySelector('.narrative-stage');
      return { phase: road?.dataset.phase, progress: Number(road?.dataset.progress), transition: road?.dataset.transition,
        title: road?.querySelector('[data-traversal-event-title]')?.textContent,
        category: road?.querySelector('[data-traversal-event-panel]')?.dataset.category,
        same: road ? road === window.grammarRoad : true, tableau: stage?.dataset.narrativeTableau,
        hud: document.querySelector('.campaign-status-hud')?.textContent,
        dialogue: Boolean(document.querySelector('.dialogue__box')) };
    });
    const tag = JSON.stringify([screen.phase, screen.tableau, screen.title]);
    if (tag !== last) { console.log(screen); last = tag; }
    const combat = page.frames().find(frame => frame.url().includes('legacy-combat'));
    if (combat) {
      // Combat is exercised by ordinary pointer/menu inputs through the CDP companion.
      // No window.G, runtime mutations, QA victories, or campaign hooks.
      if (Date.now() - lastCombatShot > 15000) {
        await shot('combat-current'); lastCombatShot = Date.now();
        console.log('COMBAT_UI', (await combat.locator('body').innerText()).slice(-3500));
      }
      const done = combat.locator('#combat-result-action');
      if (await done.isVisible()) await done.click();
      continue;
    }
    if (screen.tableau === 'AUDIENCE_ROAD_DEPARTURE_TABLEAU' && !departed) {
      await page.waitForSelector('[data-journey-continue]');
      assert.equal(await page.locator('.traversal-t0').count(), 0);
      assert.equal(await page.locator('.campaign-status-hud').count(), 1);
      assert.equal((await saved()).run.currentNodeId, 'lion-audience');
      await page.waitForSelector('.narrative-cast__actor');
      assert.equal(await page.locator('.narrative-cast__actor').count(), 3);
      await shot('departure-1366');
      await page.setViewportSize({ width: 540, height: 800 }); await shot('departure-540');
      await page.setViewportSize({ width: 1366, height: 768 });
      await click('[data-journey-continue]'); departed = true;
      evidence.push('reviewed presentation-only departure before T0'); continue;
    }
    if (screen.phase) {
      assert.equal(screen.same, true);
      if (smoke && merchant && screen.phase === 'RUNNING' && !screen.transition) {
        assert.equal(await page.locator('.campaign-status-hud').count(), 1);
        await shot('merchant-return');
        await writeFile(`${out}/result.json`, JSON.stringify({ passed: true, evidence, proof: await page.evaluate(() => window.grammarProof) }, null, 2));
        await browser.close(); process.exit(0);
      }
      if (!roadOrigin) { roadOrigin = JSON.stringify(await saved()); await shot('traversal-1366'); }
      if (screen.phase !== 'ARRIVING') assert.equal(JSON.stringify(await saved()), roadOrigin, 'no mid-route autosave');
      if (screen.transition && !['NODE_RESOLUTION', 'LOCAL_INTERACTION'].includes(screen.phase)) continue;
      if (screen.phase === 'RUNNING') {
        const lane = screen.progress > .22 && screen.progress < .53 ? '1' : '0';
        await click(`[data-traversal-lane="${lane}"]:not(.is-active)`);
        if (repBeforeIgnore && screen.hud !== repBeforeIgnore && refugeesIgnored) {
          await shot('ignore-feedback'); evidence.push({ reputationAfterIgnore: screen.hud }); repBeforeIgnore = null;
        }
      }
      if (screen.phase === 'DECISION') {
        if (screen.title?.includes('réfugi')) { repBeforeIgnore = screen.hud; refugeesIgnored = true; await click('[data-traversal-skip]'); }
        else if (screen.category === 'OPTIONAL_COMBAT') {
          const prior = screen.hud; await click('[data-traversal-skip]'); wolvesIgnored = true;
          assert.equal(await page.locator('.campaign-status-hud').textContent(), prior);
          evidence.push({ neutralWolfAvoidance: prior, unchanged: true });
        } else if (screen.progress > .85) await click('[data-traversal-skip]');
        else await click('[data-traversal-confirm]');
        continue;
      }
      if (screen.phase === 'FORK_OVERLAY') {
        await shot('fork-1366');
        await page.setViewportSize({ width: 540, height: 800 }); await shot('fork-540');
        await page.setViewportSize({ width: 1366, height: 768 });
        await click('[data-traversal-fork-choice="lion-first-trial-event"]'); continue;
      }
    }
    if (screen.tableau === 'ROADSIDE_PEDDLER_TABLEAU' && !merchant) {
      assert.equal(await page.locator('.campaign-status-hud').count(), 0);
      await shot('merchant-dialogue'); merchant = true; evidence.push('local merchant dialogue on same road');
    }
    if (screen.tableau === 'FIRST_REFUGE_GATHERING_TABLEAU' && !gathering) {
      assert.equal(await page.locator('.campaign-status-hud').count(), 0);
      await shot('clan-arrival'); gathering = true; evidence.push('distinct clan arrival before management');
    }
    const peaceful = page.locator('.dialogue__choices button:visible:not([disabled])').filter({ hasText: /Payer 20/i });
    if (await peaceful.count()) { await peaceful.first().click(); continue; }
    if (await click('.dialogue__choices button:visible:not([disabled])')) continue;
    if (await click('.dialogue__box:visible')) continue;
    if (await page.locator('.exploration-stop:visible').count()) {
      assert.ok(gathering); management = true;
      await shot('refuge-management');
      await click('[data-action="continue"], [data-explore="continue"]'); continue;
    }
    if (await page.locator('[data-journey-continue]:visible').count()) {
      if (departed && !screen.phase && !arrival) {
        arrival = true; const state = await saved();
        assert.notEqual(state.run.currentNodeId, 'lion-first-refuge');
        assert.ok(state.flags.ignoredRefugees);
        await writeFile(`${out}/arrival-checkpoint.json`, JSON.stringify(state, null, 2));
        await shot('arrival-explicit-agency');
        evidence.push({ physicalArrivalState: state.run.currentNodeId, reputation: state.reputation });
        await click('[data-journey-continue]'); refugeEntered = true; continue;
      }
      if (management) { finished = true; break; }
      if (!departed) await click('[data-journey-continue]');
    }
  }
  assert.ok(finished && departed && merchant && refugeesIgnored && wolvesIgnored && refugeEntered && gathering && management);
  const proof = await page.evaluate(() => window.grammarProof);
  assert.equal(proof.traversalMounts, 1); assert.equal(proof.travelMounts, 0); assert.equal(proof.maxHud, 1);
  assert.deepEqual(proof.removed, [{ phase: 'COMPLETE', cover: 1 }]);
  assert.equal(await page.locator('.traversal-t0').count(), 0);
  assert.equal(errors.length, 0);
  await writeFile(`${out}/result.json`, JSON.stringify({ passed: true, evidence, proof, errors }, null, 2));
} catch (error) {
  console.error(error); await shot('failure');
  await writeFile(`${out}/result.json`, JSON.stringify({ passed: false, error: String(error), errors, evidence }, null, 2));
  process.exitCode = 1;
} finally { await browser.close(); }
