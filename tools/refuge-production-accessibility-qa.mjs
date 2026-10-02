/** Built-production V6 refuge boundary QA; isolated saves, real keyboard services, ignored output. */
import assert from 'node:assert/strict';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const port = Number(process.env.REFUGE_QA_PORT ?? 5246);
const caseFilter = process.env.REFUGE_QA_CASE;
const blockBackground = process.env.REFUGE_QA_BLOCK_BACKGROUND === '1';
const output = resolve(process.env.REFUGE_QA_OUTPUT ?? 'tmp/refuge/production-accessibility');
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite existing evidence'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });
const modelsServer = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
const models = { ...await modelsServer.ssrLoadModule('/src/game/store.ts'),
  ...await modelsServer.ssrLoadModule('/src/game/runSystem.ts'),
  ...await modelsServer.ssrLoadModule('/src/game/catalog.ts'),
  ...await modelsServer.ssrLoadModule('/src/game/management.ts') };
await modelsServer.close();
const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
const browser = await chromium.launch({ headless: true });
const report = { schemaVersion: 1, recordedAt: new Date().toISOString(),
  method: 'BUILT_PRODUCTION_REAL_GAMEAPP_SEEDED_V6_KEYBOARD_REFUGE_SERVICES', cases: [], pass: false };

function fixture(nodeId) {
  const state = models.createInitialState();
  state.run = models.createRunState(6101);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.flags.prologueSeen = true;
  state.flags.lionMissionAccepted = true;
  state.settings.reducedGraphics = false;
  state.gold = 120;
  state.run.temporaryLoot.gold = 25;
  state.shops.valmir.stock.potion = 2;
  state.clan.members[0].currentHealth = models.getFinalStats(state.clan.members[0]).maxHealth - 10;
  const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
  const previous = new Map([[state.currentNodeId, null]]), queue = [state.currentNodeId];
  while (queue.length && !previous.has(nodeId)) {
    const current = queue.shift();
    for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) {
      previous.set(next, current); queue.push(next);
    }
  }
  if (!previous.has(nodeId)) throw new Error(`No canonical graph path to ${nodeId}`);
  const path = []; for (let id = nodeId; id; id = previous.get(id)) path.unshift(id);
  for (const id of path.slice(1)) {
    state.resolvedNodeIds.push(state.currentNodeId);
    if (!models.enterRunNode(state.run, id)) throw new Error(`Cannot enter ${id}`);
    state.currentNodeId = id; state.visitedNodeIds = [...state.run.visitedNodeIds]; state.stepCounter++;
  }
  return state;
}

async function tabTo(page, selector) {
  for (let index = 0; index < 80; index++) {
    if (await page.evaluate(selector => document.activeElement?.matches(selector), selector)) return index;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${selector}`);
}
async function activate(page, selector) { await tabTo(page, selector); await page.keyboard.press('Enter'); }
async function hubReady(page) {
  for (let index = 0; index < 500; index++) {
    if (await page.locator('.exploration-stop:visible:not([inert])').count()) return;
    const skip = page.locator('.cinematic-overlay__skip:visible').first();
    if (await skip.count()) await page.keyboard.press('Escape');
    else if (await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
  }
  throw new Error('Real refuge flow did not reach the hub');
}
async function truth(page) {
  return page.evaluate(() => {
    const state = window.__refugeQaApp.state;
    return { currentNodeId: state.currentNodeId, runNodeId: state.run.currentNodeId, stepCounter: state.stepCounter,
      resolved: [...state.resolvedNodeIds], flags: { ...state.flags }, gold: state.gold,
      temporaryLoot: JSON.parse(JSON.stringify(state.run.temporaryLoot)),
      inventory: JSON.parse(JSON.stringify(state.inventory)), health: state.clan.members.map(unit => unit.currentHealth) };
  });
}
async function geometry(page) {
  return page.evaluate(() => {
    const rect = element => { const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const hub = document.querySelector('.exploration-stop'), hud = document.querySelector('.campaign-status-hud');
    return { hubCount: document.querySelectorAll('.exploration-stop').length,
      hudCount: document.querySelectorAll('.campaign-status-hud').length,
      staleSurfaces: document.querySelectorAll('.management,.travel-view,.cinematic-overlay,.narrative-stage').length,
      nodeId: hub.dataset.refugeNode, backgroundReady: hub.dataset.backgroundReady,
      backgroundNaturalWidth: Number(hub.dataset.backgroundNaturalWidth), hud: rect(hud),
      viewport: { width: innerWidth, height: innerHeight }, overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      actions: [...hub.querySelectorAll('[data-action]')].map(button => ({ id: button.dataset.action, rect: rect(button), disabled: button.disabled,
        label: button.textContent.trim(), clipped: [...button.querySelectorAll('b,small')].some(part => {
          const a = rect(part), b = rect(button); return a.x < b.x - 1 || a.right > b.right + 1 || a.y < b.y - 1 || a.bottom > b.bottom + 1;
        }) })), focusOwned: hub.contains(document.activeElement), activeTag: document.activeElement?.tagName };
  });
}
function assertGeometry(value) {
  const inside = rect => rect.x >= -1 && rect.y >= -1 && rect.right <= value.viewport.width + 1 && rect.bottom <= value.viewport.height + 1;
  const overlaps = (a, b) => a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
  assert.equal(value.hubCount, 1); assert.equal(value.hudCount, 1); assert.equal(value.staleSurfaces, 0);
  assert.equal(value.backgroundReady, blockBackground ? 'false' : 'true');
  if (blockBackground) assert.equal(value.backgroundNaturalWidth, 0); else assert.ok(value.backgroundNaturalWidth > 0);
  assert.equal(value.overflowX, false); assert.ok(inside(value.hud));
  assert.deepEqual(value.actions.map(action => action.id), ['clan', 'shop', 'skills', 'rest', 'continue']);
  for (const [index, action] of value.actions.entries()) {
    assert.ok(inside(action.rect), `${action.id} outside viewport`); assert.equal(action.clipped, false);
    assert.ok(action.rect.width >= 44 && action.rect.height >= 44, `${action.id} target below 44px`);
    assert.equal(overlaps(action.rect, value.hud), false);
    for (const other of value.actions.slice(index + 1)) assert.equal(overlaps(action.rect, other.rect), false);
  }
}

async function run(nodeId, viewport, osReduced) {
  const name = `${nodeId}-${viewport.width}x${viewport.height}-${osReduced ? 'os-reduced' : 'normal'}`;
  const context = await browser.newContext({ viewport, reducedMotion: osReduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage(); const errors = [];
  const expectedAssetFailures = [];
  const refugeAsset = /\/(?:first-refuge|second-refuge-night)-tableau\.png$/;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('[VFX Preview]')
    && !(blockBackground && message.text().includes('net::ERR_FAILED') && refugeAsset.test(message.location().url))) errors.push(message.text()); });
  page.on('requestfailed', request => {
    if (blockBackground && refugeAsset.test(request.url()) && request.failure()?.errorText === 'net::ERR_FAILED') expectedAssetFailures.push(request.url());
    else if (!request.url().endsWith('.mp4') || request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  try {
    if (blockBackground) await page.route('**/*refuge*tableau.png', route => route.abort('failed'));
    await page.route('**/assets/game-*.js', async route => {
      const response = await route.fetch(), source = await response.text();
      const pattern = /const ([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*\([^;]+?\);window\.addEventListener\("pagehide",\(\)=>\1\.dispose/;
      if (!pattern.test(source)) throw new Error('Built bootstrap read-only hook missing');
      await route.fulfill({ response, body: source.replace(pattern, (match, name) =>
        match.replace(';window.addEventListener', `;window.__refugeQaApp=${name};window.addEventListener`)) });
    });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(state => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(state)), fixture(nodeId));
    await page.reload({ waitUntil: 'networkidle' });
    await activate(page, '.title-screen [data-action="continue"]'); await hubReady(page);
    const arrival = await truth(page), layout = await geometry(page); assertGeometry(layout);
    await page.screenshot({ path: resolve(output, `${name}-initial-focus.png`) });
    assert.equal(layout.focusOwned, true, `Refuge entry loses focus to ${layout.activeTag}`);
    assert.equal(arrival.gold, 145); assert.equal(arrival.temporaryLoot.gold, 0);
    assert.equal(arrival.flags[`refugeSecured:${nodeId}`], true);
    await tabTo(page, '.exploration-stop [data-action="clan"]');
    const focus = await page.evaluate(() => { const style = getComputedStyle(document.activeElement);
      return { visible: document.activeElement.matches(':focus-visible'), outline: style.outlineStyle,
        outlineWidth: style.outlineWidth, boxShadow: style.boxShadow }; });
    assert.equal(focus.visible, true);
    assert.ok(focus.outline !== 'none' && parseFloat(focus.outlineWidth) > 0 || focus.boxShadow !== 'none', 'Visible focus indicator missing');
    await page.screenshot({ path: resolve(output, `${name}-hub.png`) });
    const services = [];
    for (const action of ['clan', 'shop', 'skills']) {
      const before = await truth(page);
      let expected = before;
      await activate(page, `.exploration-stop [data-action="${action}"]`);
      await page.locator('.management').waitFor({ state: 'visible' });
      const modal = await page.locator('.management').evaluate(element => ({
        focusOwned: element.contains(document.activeElement), name: element.getAttribute('aria-label')
          || (element.getAttribute('aria-labelledby') && document.getElementById(element.getAttribute('aria-labelledby'))?.textContent),
      }));
      assert.equal(modal.focusOwned, true, 'Management entry lost keyboard focus');
      assert.ok(modal.name?.trim(), 'Management dialog has no accessible name');
      assert.equal(await page.locator('.exploration-stop,.campaign-status-hud').count(), 0);
      if (action === 'clan') {
        await activate(page, '.management [data-tab="inventory"]');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-tab')), 'inventory');
        await activate(page, '.management [data-tab="clan"]');
        await activate(page, '.management [data-equip-slot="weapon"]');
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('.item-modal'))), true);
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('.item-modal'))), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-equip-slot')), 'weapon');
      }
      if (action === 'shop') {
        const ownerState = await page.evaluate(() => JSON.parse(JSON.stringify(window.__refugeQaApp.state)));
        assert.equal(models.buyItem(ownerState, 'valmir', 'potion', false), true, 'Owner expected purchase refused');
        expected = { ...before, gold: ownerState.gold, inventory: ownerState.inventory };
        await activate(page, '.management [data-trade="buy"][data-item="potion"]');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-trade')), 'buy');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-item')), 'potion');
      }
      await tabTo(page, '.management [data-action="close"]');
      await page.screenshot({ path: resolve(output, `${name}-${action}.png`) });
      await page.keyboard.press('Enter'); await hubReady(page);
      assert.deepEqual(await truth(page), expected, `${action} return differs from authoritative service result`);
      assertGeometry(await geometry(page)); services.push({ action, keyboardReachable: true,
        truthUnchanged: action !== 'shop', ownerResolvedPurchase: action === 'shop', rerenderFocusPreserved: action !== 'skills' });
      assert.equal((await geometry(page)).focusOwned, true, 'Management return lost refuge focus');
    }
    const live = await page.evaluate(() => window.__refugeQaApp.state);
    const restCost = models.getRestCost(live);
    assert.equal(await page.locator('.exploration-stop [data-action="rest"]').isDisabled(), false);
    await activate(page, '.exploration-stop [data-action="rest"]'); await hubReady(page);
    const rested = await truth(page); assert.equal(rested.gold, live.gold - restCost);
    assert.equal(models.getWoundedUnitCount(await page.evaluate(() => window.__refugeQaApp.state)), 0);
    assert.equal(await page.locator('.exploration-stop [data-action="rest"]').isDisabled(), true);
    // Management's existing close boundary autosaves; no test writes game state after boot.
    await activate(page, '.exploration-stop [data-action="clan"]'); await page.locator('.management').waitFor({ state: 'visible' });
    await activate(page, '.management [data-action="close"]'); await hubReady(page);
    const beforeReload = await truth(page);
    await page.reload({ waitUntil: 'networkidle' });
    await activate(page, '.title-screen [data-action="continue"]'); await hubReady(page);
    assert.deepEqual(await truth(page), beforeReload, 'Refuge resume changed secured loot/rest truth');
    assertGeometry(await geometry(page));
    await activate(page, '.exploration-stop [data-action="continue"]');
    await page.waitForFunction(() => !document.querySelector('.exploration-stop') &&
      document.querySelector('.journey-overlay,.traversal-t0,.dialogue'));
    assert.ok((await truth(page)).resolved.includes(nodeId));
    assert.deepEqual(errors, []);
    return { name, nodeId, viewport, osReduced, blockBackground, expectedAssetFailures, layout, focus, services, restCost,
      securedGold: 25, restGold: rested.gold, resumeTruthUnchanged: true, departureResolved: true, errors, pass: true };
  } finally { await context.close(); }
}
try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 620, height: 780 }, { width: 390, height: 844 }]) {
    for (const node of ['lion-first-refuge', 'lion-second-refuge']) {
      for (const osReduced of [false, true]) {
        const name = `${node}-${viewport.width}x${viewport.height}-${osReduced ? 'os-reduced' : 'normal'}`;
        if (caseFilter && name !== caseFilter) continue;
        try { report.cases.push(await run(node, viewport, osReduced)); }
        catch (error) { report.cases.push({ node, viewport, osReduced, pass: false, error: error.stack }); }
      }
    }
  }
  if (!report.cases.length) throw new Error(`Unknown REFUGE_QA_CASE ${caseFilter}`);
  report.pass = report.cases.every(entry => entry.pass);
} finally {
  await browser.close(); await new Promise((accept, reject) => server.httpServer.close(error => error ? reject(error) : accept()));
  await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2)+'\n');
}
console.log(JSON.stringify({ pass: report.pass, cases: report.cases.length, failures: report.cases.filter(entry => !entry.pass) }, null, 2));
if (!report.pass) process.exitCode = 1;
