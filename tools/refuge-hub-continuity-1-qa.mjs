/** Scoped refuge hub visual and production-flow QA. Run with Node from the repository root. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/refuge-hub-continuity-1-browser';
const base = 'http://127.0.0.1:5198/';
const firstAsset = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/first-refuge-tableau.png';
const secondAsset = '/assets/generated/lion-phase/environments/demo-environment-pack-v1/tableau/second-refuge-night-tableau.png';
const proof = { passed: false, captures: [], visual: {}, production: null, errors: [] };
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });

async function pageAt(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', error => proof.errors.push(error.message));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__refugeQaApp = app;',
    ) });
  });
  await page.goto(base);
  await page.waitForFunction(() => window.__refugeQaApp && document.querySelector('.title-screen'));
  await installCounters(page);
  return page;
}

async function installCounters(page) {
  await page.evaluate(() => {
    const counters = window.__refugeQaCounters = { hudMounts: 0, hubMounts: 0, travelMounts: 0, maxHud: 0, maxHub: 0 };
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.campaign-status-hud')) counters.hudMounts += 1;
        if (node.matches('.exploration-stop')) counters.hubMounts += 1;
        if (node.matches('.travel-view')) counters.travelMounts += 1;
      }
      counters.maxHud = Math.max(counters.maxHud, document.querySelectorAll('.campaign-status-hud').length);
      counters.maxHub = Math.max(counters.maxHub, document.querySelectorAll('.exploration-stop').length);
    }).observe(document.body, { childList: true, subtree: true });
  });
}

async function state(page) {
  return page.evaluate(async () => {
    const app = window.__refugeQaApp;
    const { getWoundedUnitCount } = await import('/src/game/management.ts');
    return {
      currentNodeId: app.state.currentNodeId,
      runNodeId: app.state.run.currentNodeId,
      stepCounter: app.state.stepCounter,
      resolvedNodeIds: [...app.state.resolvedNodeIds],
      temporaryLootGold: app.state.run.temporaryLoot.gold,
      gold: app.state.gold,
      woundedCount: getWoundedUnitCount(app.state),
      counters: { ...window.__refugeQaCounters },
    };
  });
}

async function startDirectHub(page, nodeId, { wounded = 0, loot = 25 } = {}) {
  await page.evaluate(async ({ nodeId, wounded, loot }) => {
    const { createInitialState } = await import('/src/game/store.ts');
    const { getFinalStats } = await import('/src/game/catalog.ts');
    const app = window.__refugeQaApp;
    const state = createInitialState();
    state.flags.prologueSeen = true;
    state.run.currentNodeId = state.currentNodeId = nodeId;
    state.gold = 120;
    state.run.temporaryLoot.gold = loot;
    for (const unit of state.clan.members.slice(0, wounded)) unit.currentHealth = getFinalStats(unit).maxHealth - 10;
    app.state = state;
    app.mode = 'RESULT';
    app.chrome.replaceChildren();
    app.playJourneyCinematic = async () => {};
    app.playDialogue = async () => {};
    const node = state.run.graph.nodes.find(candidate => candidate.id === nodeId);
    void app.resolveRunNode(node, false);
  }, { nodeId, wounded, loot });
  await page.waitForFunction(() => {
    const hub = document.querySelector('.exploration-stop');
    return hub && hub.dataset.backgroundReady !== 'pending';
  });
  await page.locator('.exploration-stop').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
}

async function assertHub(page, nodeId, asset, restDisabled) {
  const sample = await page.evaluate(async () => {
    const hub = document.querySelector('.exploration-stop');
    const hud = document.querySelector('.campaign-status-hud');
    const backgroundUrl = hub?.dataset.backgroundUrl ?? '';
    const probe = new Image();
    let probeError = null;
    try {
      probe.src = backgroundUrl;
      await probe.decode();
    } catch (error) {
      probeError = String(error);
    }
    const rect = element => { const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
      return { left, top, right, bottom, width, height }; };
    return {
      hubCount: document.querySelectorAll('.exploration-stop').length,
      hudCount: document.querySelectorAll('.campaign-status-hud').length,
      resourceDuplicates: document.querySelectorAll('.management__resources,.travel-view__resources').length,
      topNavDuplicates: document.querySelectorAll('.management__tabs,.travel-view__hud-actions,.title-screen__nav').length,
      travelCount: document.querySelectorAll('.travel-view').length,
      nodeId: hub?.dataset.refugeNode,
      family: hub?.dataset.visualFamily,
      context: hub?.dataset.environmentContext,
      background: hub?.style.getPropertyValue('--refuge-background'),
      backgroundUrl,
      backgroundReady: hub?.dataset.backgroundReady === 'true',
      naturalWidth: Number(hub?.dataset.backgroundNaturalWidth ?? 0),
      naturalHeight: Number(hub?.dataset.backgroundNaturalHeight ?? 0),
      backgroundError: hub?.dataset.backgroundError ?? null,
      computedBackground: hub ? getComputedStyle(hub).backgroundImage : null,
      surfaceVisible: hub ? getComputedStyle(hub).visibility === 'visible' && !hub.inert : false,
      probeReady: !probeError && probe.complete && probe.naturalWidth > 0 && probe.naturalHeight > 0,
      probeWidth: probe.naturalWidth,
      probeHeight: probe.naturalHeight,
      probeError,
      securedFeedback: hub?.querySelector('.exploration-stop__secured')?.textContent ?? null,
      actions: [...hub.querySelectorAll('[data-action]')].map(button => {
        const bounds = rect(button);
        const labelClipped = [...button.querySelectorAll('b,small')].some(part => {
          const text = rect(part);
          return text.left < bounds.left - 1 || text.right > bounds.right + 1
            || text.top < bounds.top - 1 || text.bottom > bounds.bottom + 1;
        });
        return { id: button.dataset.action, disabled: button.disabled, rect: bounds, labelClipped };
      }),
      hudRect: rect(hud),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
  const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const inside = ({ left, top, right, bottom }) => left >= -1 && top >= -1
    && right <= sample.viewport.width + 1 && bottom <= sample.viewport.height + 1;
  assert.equal(sample.hubCount, 1);
  assert.equal(sample.hudCount, 1);
  assert.equal(sample.resourceDuplicates, 0);
  assert.equal(sample.topNavDuplicates, 0);
  assert.equal(sample.travelCount, 0);
  assert.equal(sample.nodeId, nodeId);
  if (!sample.backgroundReady || !sample.probeReady) {
    proof.errors.push(`Background readiness failed for ${nodeId}: ${JSON.stringify({
      backgroundUrl: sample.backgroundUrl, backgroundError: sample.backgroundError,
      probeError: sample.probeError,
    })}`);
  }
  assert.equal(sample.backgroundUrl, asset);
  assert.equal(sample.backgroundReady, true);
  assert.ok(sample.naturalWidth > 0 && sample.naturalHeight > 0);
  assert.equal(sample.surfaceVisible, true);
  assert.equal(sample.probeReady, true);
  assert.equal(sample.probeWidth, sample.naturalWidth);
  assert.equal(sample.probeHeight, sample.naturalHeight);
  assert.ok(sample.computedBackground.includes(asset));
  assert.ok(sample.background.includes(asset));
  assert.deepEqual(sample.actions.map(button => button.id), ['clan', 'shop', 'skills', 'rest', 'continue']);
  assert.equal(sample.actions.find(button => button.id === 'rest').disabled, restDisabled);
  assert.equal(sample.actions.find(button => button.id === 'continue').disabled, false);
  assert.equal(sample.horizontalOverflow, false);
  assert.ok(inside(sample.hudRect), 'HUD must fit the viewport');
  for (let index = 0; index < sample.actions.length; index++) {
    const action = sample.actions[index];
    assert.ok(inside(action.rect), `${action.id} must fit the viewport`);
    assert.equal(action.labelClipped, false, `${action.id} label is clipped`);
    assert.equal(intersects(action.rect, sample.hudRect), false, `${action.id} intersects the HUD`);
    for (const other of sample.actions.slice(index + 1)) {
      assert.equal(intersects(action.rect, other.rect), false, `${action.id} intersects ${other.id}`);
    }
  }
  return sample;
}

async function shot(page, name) {
  await page.screenshot({ path: `${output}/${name}.png` });
  proof.captures.push(`${name}.png`);
}

async function managementReturn(page, action, nodeId, asset) {
  const before = await state(page);
  await page.locator(`.exploration-stop [data-action="${action}"]`).click();
  await page.locator('.management').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.exploration-stop,.campaign-status-hud,.travel-view').count(), 0);
  await page.locator('.management [data-action="close"]').click();
  await page.locator('.exploration-stop').waitFor({ state: 'visible' });
  const after = await state(page);
  assert.equal(after.currentNodeId, before.currentNodeId);
  assert.equal(after.runNodeId, before.runNodeId);
  assert.equal(after.stepCounter, before.stepCounter);
  assert.deepEqual(after.resolvedNodeIds, before.resolvedNodeIds);
  assert.ok(after.counters.maxHub <= 1 && after.counters.maxHud <= 1,
    `duplicate hub/HUD during ${action}: ${JSON.stringify({ before: before.counters, after: after.counters })}`);
  assert.equal(after.counters.travelMounts, 0);
  const layout = await assertHub(page, nodeId, asset, await page.locator('[data-action="rest"]').isDisabled());
  assert.equal(layout.securedFeedback, '+0 or placé dans le coffre');
  return { before, after, layout };
}

async function installCommittedRefugeSave(page) {
  await page.evaluate(async () => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { createRunState, enterRunNode } = await import('/src/game/runSystem.ts');
    const { getFinalStats } = await import('/src/game/catalog.ts');
    const state = createInitialState();
    state.run = createRunState(6101);
    state.currentNodeId = state.run.currentNodeId;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.flags.prologueSeen = true;
    state.gold = 120;
    state.run.temporaryLoot.gold = 25;
    state.clan.members[0].currentHealth = getFinalStats(state.clan.members[0]).maxHealth - 10;
    const targetId = 'lion-first-refuge';
    const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
    const queue = [state.run.currentNodeId], previous = new Map([[state.run.currentNodeId, null]]);
    while (queue.length && !previous.has(targetId)) {
      const id = queue.shift();
      for (const next of nodes.get(id)?.links ?? []) if (!previous.has(next)) {
        previous.set(next, id); queue.push(next);
      }
    }
    if (!previous.has(targetId)) throw new Error('No path to first refuge');
    const path = [];
    for (let id = targetId; id; id = previous.get(id)) path.unshift(id);
    for (const id of path.slice(1)) {
      if (!state.resolvedNodeIds.includes(state.currentNodeId)) state.resolvedNodeIds.push(state.currentNodeId);
      const entered = enterRunNode(state.run, id);
      if (!entered) throw new Error(`Could not enter ${id}`);
      state.currentNodeId = entered.id;
      state.visitedNodeIds = [...state.run.visitedNodeIds];
      state.stepCounter += 1;
    }
    state.resolvedNodeIds = state.resolvedNodeIds.filter(id => id !== targetId);
    new SaveRepository().saveAuto(state);
    localStorage.setItem('rpg-tutorial-seen', '1');
  });
  await page.reload();
  await page.waitForFunction(() => window.__refugeQaApp && document.querySelector('.title-screen'));
  await installCounters(page);
  await page.locator('.title-screen [data-action="continue"]').click();
}

async function advanceUntil(page, predicate, stages) {
  for (let tick = 0; tick < 600; tick++) {
    if (await predicate()) return;
    const stageId = await page.locator('.narrative-stage').first().getAttribute('data-narrative-tableau').catch(() => null);
    if (stageId && stages.at(-1) !== stageId) stages.push(stageId);
    const skip = page.locator('.narrative-stage .cinematic-overlay__skip:visible').first();
    if (await skip.count()) { await skip.evaluate(button => button.click()); continue; }
    const choice = page.locator('.dialogue__choices button:visible:not([disabled])').first();
    if (await choice.count()) { await choice.click(); continue; }
    const box = page.locator('.dialogue__box:visible').first();
    if (await box.count()) { await box.click(); continue; }
    await page.waitForTimeout(100);
  }
  throw new Error('Production flow did not reach the expected surface');
}

try {
  const first = await pageAt(1440, 810);
  await startDirectHub(first, 'lion-first-refuge');
  proof.visual.firstInitial = { layout: await assertHub(first, 'lion-first-refuge', firstAsset, true), state: await state(first) };
  await shot(first, 'first-refuge-1440');
  await first.setViewportSize({ width: 1366, height: 768 });
  proof.visual.first1366 = await assertHub(first, 'lion-first-refuge', firstAsset, true);
  await shot(first, 'first-refuge-1366');
  await first.setViewportSize({ width: 620, height: 780 });
  proof.visual.first620 = await assertHub(first, 'lion-first-refuge', firstAsset, true);
  await shot(first, 'first-refuge-620');
  await first.setViewportSize({ width: 390, height: 844 });
  proof.visual.first390 = await assertHub(first, 'lion-first-refuge', firstAsset, true);
  await shot(first, 'first-refuge-390');
  await first.setViewportSize({ width: 1440, height: 810 });
  proof.visual.postClan = await managementReturn(first, 'clan', 'lion-first-refuge', firstAsset);
  await shot(first, 'first-refuge-post-management-1440');
  proof.visual.postShop = await managementReturn(first, 'shop', 'lion-first-refuge', firstAsset);
  await shot(first, 'first-refuge-post-shop-1440');
  proof.visual.postSkills = await managementReturn(first, 'skills', 'lion-first-refuge', firstAsset);
  await shot(first, 'first-refuge-post-skills-1440');
  await first.close();

  const wounded = await pageAt(1440, 810);
  await startDirectHub(wounded, 'lion-first-refuge', { wounded: 2 });
  proof.visual.wounded = { layout: await assertHub(wounded, 'lion-first-refuge', firstAsset, false), state: await state(wounded) };
  await shot(wounded, 'first-refuge-wounded-1440');
  const beforeRest = await state(wounded);
  await wounded.locator('.exploration-stop [data-action="rest"]').click();
  await wounded.locator('.exploration-stop').waitFor({ state: 'visible' });
  const afterRest = await state(wounded);
  assert.equal(afterRest.gold, beforeRest.gold - 30);
  assert.equal(afterRest.woundedCount, 0);
  assert.equal(afterRest.runNodeId, beforeRest.runNodeId);
  assert.equal(afterRest.stepCounter, beforeRest.stepCounter);
  assert.deepEqual(afterRest.resolvedNodeIds, beforeRest.resolvedNodeIds);
  assert.equal(afterRest.counters.travelMounts, 0);
  proof.visual.postRest = { layout: await assertHub(wounded, 'lion-first-refuge', firstAsset, true), beforeRest, afterRest };
  assert.equal(proof.visual.postRest.layout.securedFeedback, '+0 or placé dans le coffre');
  await shot(wounded, 'first-refuge-post-rest-1440');
  await wounded.close();

  const second = await pageAt(1440, 810);
  await startDirectHub(second, 'lion-second-refuge');
  proof.visual.secondInitial = { layout: await assertHub(second, 'lion-second-refuge', secondAsset, true), state: await state(second) };
  assert.notEqual(proof.visual.secondInitial.layout.background, proof.visual.firstInitial.layout.background);
  await shot(second, 'second-refuge-1440');
  proof.visual.secondReturn = await managementReturn(second, 'clan', 'lion-second-refuge', secondAsset);
  await shot(second, 'second-refuge-post-management-1440');
  await second.setViewportSize({ width: 390, height: 844 });
  proof.visual.second390 = await assertHub(second, 'lion-second-refuge', secondAsset, true);
  await shot(second, 'second-refuge-390');
  await second.close();

  const production = await pageAt(1366, 768);
  await installCommittedRefugeSave(production);
  const stages = [];
  await advanceUntil(production, async () => await production.locator('.narrative-stage[data-narrative-tableau="FIRST_REFUGE_GATHERING_TABLEAU"] .dialogue:visible').count() > 0, stages);
  stages.push('FIRST_REFUGE_GATHERING_TABLEAU');
  const gathering = await production.evaluate(async () => {
    const { dialogues } = await import('/src/game/content.ts');
    const { createGenericNarrativeTableau } = await import('/src/cinematics/NarrativeTableau.ts');
    return { tableau: createGenericNarrativeTableau(dialogues.get('first_refuge_gathering')).stillImage,
      renderedBackground: document.querySelector('.narrative-scene-surface__environment')?.style.backgroundImage,
      hudCount: document.querySelectorAll('.campaign-status-hud').length };
  });
  assert.equal(gathering.tableau, firstAsset);
  assert.ok(gathering.renderedBackground?.includes(firstAsset));
  assert.equal(gathering.hudCount, 0);
  await production.waitForFunction(() => {
    const text = document.querySelector('.dialogue__text');
    return text?.dataset.finalText && text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
  });
  await shot(production, 'production-first-gathering-1366');
  await advanceUntil(production, async () => await production.locator('.exploration-stop:visible').count() > 0, stages);
  const initial = await state(production);
  const hub = await assertHub(production, 'lion-first-refuge', firstAsset, false);
  assert.equal(hub.securedFeedback, '+25 or placé dans le coffre');
  assert.equal(initial.temporaryLootGold, 0);
  assert.equal(initial.gold, 145);
  assert.equal(initial.woundedCount, 1);
  assert.ok(!initial.resolvedNodeIds.includes('lion-first-refuge'));
  await shot(production, 'production-first-hub-1366');
  const afterClan = await managementReturn(production, 'clan', 'lion-first-refuge', firstAsset);
  const afterShop = await managementReturn(production, 'shop', 'lion-first-refuge', firstAsset);
  const beforeRestProd = await state(production);
  await production.locator('.exploration-stop [data-action="rest"]').click();
  await production.locator('.exploration-stop').waitFor({ state: 'visible' });
  const afterRestProd = await state(production);
  assert.equal(afterRestProd.gold, beforeRestProd.gold - 15);
  assert.equal(afterRestProd.woundedCount, 0);
  await assertHub(production, 'lion-first-refuge', firstAsset, true);
  await production.locator('.exploration-stop [data-action="continue"]').click();
  await advanceUntil(production, async () => await production.locator('.journey-overlay:visible').count() > 0, stages);
  const final = await state(production);
  assert.equal(final.runNodeId, 'lion-first-refuge');
  assert.ok(final.resolvedNodeIds.includes('lion-first-refuge'));
  assert.ok(stages.includes('ATE_FIRST_REFUGE_WATCH_TABLEAU'));
  assert.equal(final.counters.maxHud, 1);
  assert.equal(final.counters.maxHub, 1);
  assert.equal(final.counters.travelMounts, 0);
  await shot(production, 'production-post-node-1366');
  proof.production = { gathering, hub, initial, afterClan, afterShop, beforeRest: beforeRestProd,
    afterRest: afterRestProd, final, stages };
  await production.close();

  assert.deepEqual(proof.errors, []);
  proof.passed = true;
} catch (error) {
  proof.error = String(error.stack ?? error);
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/browser-qa.json`, JSON.stringify(proof, null, 2));
  await browser.close();
  await server.close();
}
