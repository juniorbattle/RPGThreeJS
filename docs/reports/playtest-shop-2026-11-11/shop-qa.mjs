/** Browser QA for the 2026-11-11 shop playtest (quantity and filters): built production (run `npm run build` first), seeded V6 save at the first refuge, keyboard only, writes to ignored tmp/shop-qa/out. Run: node docs/reports/playtest-shop-2026-11-11/shop-qa.mjs */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer, preview } from 'vite';

const port = 5291;
const output = resolve(process.env.SHOP_QA_OUTPUT ?? 'tmp/shop-qa/out');
await mkdir(output, { recursive: true });
const modelsServer = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
const models = { ...await modelsServer.ssrLoadModule('/src/game/store.ts'), ...await modelsServer.ssrLoadModule('/src/game/runSystem.ts') };
await modelsServer.close();
const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
// Cloud sessions pass CHROMIUM_PATH=/opt/pw-browsers/chromium; a local machine uses its own Playwright browser.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const report = { recordedAt: new Date().toISOString(), cases: [] };

function fixture(nodeId, reduced) {
  const state = models.createInitialState();
  state.run = models.createRunState(6101);
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.flags.prologueSeen = true; state.flags.lionMissionAccepted = true;
  state.settings.reducedGraphics = reduced;
  state.gold = 100; // 125 after the refuge banks the 25 temporary gold.
  state.run.temporaryLoot.gold = 25;
  state.inventory.materials.iron_ore = 3;
  const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
  const previous = new Map([[state.currentNodeId, null]]), queue = [state.currentNodeId];
  while (queue.length && !previous.has(nodeId)) {
    const current = queue.shift();
    for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
  }
  const path = []; for (let id = nodeId; id; id = previous.get(id)) path.unshift(id);
  for (const id of path.slice(1)) {
    state.resolvedNodeIds.push(state.currentNodeId);
    if (!models.enterRunNode(state.run, id)) throw new Error(`Cannot enter ${id}`);
    state.currentNodeId = id; state.visitedNodeIds = [...state.run.visitedNodeIds]; state.stepCounter++;
  }
  return state;
}
async function tabTo(page, selector) {
  for (let i = 0; i < 120; i++) {
    if (await page.evaluate(s => document.activeElement?.matches(s), selector)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Keyboard could not reach ${selector}`);
}
async function activate(page, selector) { await tabTo(page, selector); await page.keyboard.press('Enter'); }
async function hubReady(page) {
  for (let i = 0; i < 500; i++) {
    if (await page.locator('.exploration-stop:visible:not([inert])').count()) return;
    if (await page.locator('.cinematic-overlay__skip:visible').count()) await page.keyboard.press('Escape');
    else if (await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
  }
  throw new Error('No hub');
}
async function settle(page) { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(350); }
const save = page => page.evaluate(() => JSON.parse(localStorage.getItem('rpg-threejs:autosave:v6')));
async function layout(page, selector) {
  return page.evaluate((selector) => {
    const vw = innerWidth;
    const els = [...document.querySelectorAll(selector)];
    return { overflowX: document.documentElement.scrollWidth > vw + 1,
      boxes: els.map(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return { text: el.textContent.trim().slice(0, 40), x: r.x, right: r.right, w: r.width, h: r.height, font: parseFloat(s.fontSize), clipped: r.x < -1 || r.right > vw + 1 }; }) };
  }, selector);
}
async function focusProof(page) {
  return page.evaluate(() => { const el = document.activeElement, s = getComputedStyle(el);
    return { tag: el.tagName, data: { ...el.dataset }, visible: el.matches(':focus-visible'), outline: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow }; });
}

async function run(viewport, reduced) {
  const name = `${viewport.width}x${viewport.height}${reduced ? '-game-reduced' : ''}`;
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('[VFX Preview]')) errors.push(m.text() + ' @ ' + m.location().url); });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(s => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(s)), fixture('lion-first-refuge', reduced));
  await page.reload({ waitUntil: 'networkidle' });
  await activate(page, '.title-screen [data-action="continue"]'); await hubReady(page);
  await activate(page, '.exploration-stop [data-action="shop"]');
  await page.locator('.management').waitFor({ state: 'visible' }); await settle(page);
  const c = { name, errors };
  c.reducedAttr = await page.locator('.management').getAttribute('data-reduced-motion');
  c.transition = await page.locator('.shop-filter').first().evaluate(el => getComputedStyle(el).transitionDuration);
  c.filters = await layout(page, '.shop-filter');
  await page.screenshot({ path: resolve(output, `${name}-1-shop-all.png`) });
  // Filter: consumables, by keyboard.
  await activate(page, '[data-shop-filter="consumables"]'); await settle(page);
  c.filterFocus = await focusProof(page);
  c.consumableRows = await page.locator('.shop-list [data-trade]').count();
  c.pressed = await page.locator('[data-shop-filter="consumables"]').getAttribute('aria-pressed');
  await page.screenshot({ path: resolve(output, `${name}-2-shop-consumables.png`) });
  // Quantity: open the potion fiche, + twice by keyboard, then max.
  const before = await save(page);
  await activate(page, '[data-trade="buy"][data-item="potion"]'); await settle(page);
  await activate(page, '[data-trade-qty="more"]'); await page.keyboard.press('Enter'); await settle(page);
  c.qtyFocus = await focusProof(page);
  c.qtyValue = await page.locator('.trade-quantity__value').textContent();
  c.quantityBoxes = await layout(page, '.trade-quantity button, .trade-quantity__value, .trade-footer button');
  await page.locator('.trade-quantity').scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, `${name}-3-fiche-quantity.png`) });
  await page.keyboard.press('+'); await settle(page);
  c.qtyAfterPlus = await page.locator('.trade-quantity__value').textContent();
  c.limitText = await page.locator('.trade-quantity__limit').textContent();
  c.buttonText = (await page.locator('.trade-footer [data-trade-step="confirm"]').textContent()).trim();
  assert.deepEqual(await save(page), before, 'Choosing a quantity changed the save');
  await activate(page, '.trade-footer [data-trade-step="confirm"]'); await settle(page);
  c.confirmText = (await page.locator('.trade-confirm p').textContent()).trim();
  await page.screenshot({ path: resolve(output, `${name}-4-confirm.png`) });
  await page.keyboard.press('Enter'); await settle(page); // focus starts on « Confirmer l'achat ».
  c.doneText = (await page.locator('.trade-done').textContent()).replace(/\s+/g, ' ').trim();
  await page.screenshot({ path: resolve(output, `${name}-5-done.png`) });
  const after = await save(page);
  c.goldDelta = after.gold - before.gold;
  c.potionDelta = (after.inventory.consumables.potion ?? 0) - (before.inventory.consumables.potion ?? 0);
  c.stockDelta = after.shops.valmir.stock.potion - before.shops.valmir.stock.potion;
  c.saveKeys = JSON.stringify(Object.keys(after).sort()) === JSON.stringify(Object.keys(before).sort());
  await page.keyboard.press('Escape'); await settle(page);
  // Sell with quantity.
  await activate(page, '[data-shop-mode="sell"]'); await settle(page);
  await activate(page, '[data-trade="sell"][data-item="iron_ore"]'); await settle(page);
  await activate(page, '[data-trade-qty="max"]'); await settle(page);
  c.sellButton = (await page.locator('.trade-footer [data-trade-step="confirm"]').textContent()).trim();
  await page.screenshot({ path: resolve(output, `${name}-6-sell-quantity.png`) });
  await page.keyboard.press('Escape'); await settle(page);
  // Forge: groups and filters.
  await activate(page, '[data-shop-mode="craft"]'); await settle(page);
  c.forgeGroups = await page.locator('.craft-group .shop-group__title').allTextContents();
  c.forgeChips = await layout(page, '.shop-filter');
  await page.screenshot({ path: resolve(output, `${name}-7-forge-all.png`) });
  await activate(page, '[data-forge-filter="accessories"]'); await settle(page);
  await activate(page, '[data-forge-ready]'); await settle(page);
  c.forgeReadyFocus = await focusProof(page);
  c.forgeAfterFilter = { groups: await page.locator('.craft-group .shop-group__title').allTextContents(), empty: await page.locator('.shop-view--forge .empty-copy').allTextContents() };
  await page.screenshot({ path: resolve(output, `${name}-8-forge-accessories-ready.png`) });
  report.cases.push(c);
  await context.close();
}
try {
  await run({ width: 1366, height: 768 }, false);
  if (!process.env.ONE) { await run({ width: 390, height: 844 }, false);
  await run({ width: 1366, height: 768 }, true); }
} finally {
  await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2));
  await browser.close(); await new Promise(r => server.httpServer.close(r));
}
console.log(JSON.stringify(report, null, 1).slice(0, 9000));
