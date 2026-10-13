/** Repeatable UI kit gallery and production-scene browser QA. */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'docs/reports/ui-kit-system-1-browser';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5197, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const proof = { errors, captures: {}, checks: {} };
const rects = () => page.evaluate(() => {
  const rect = selector => {
    const el = document.querySelector(selector);
    if (!el || el.hidden || getComputedStyle(el).display === 'none') return null;
    const { x, y, width, height, right, bottom } = el.getBoundingClientRect();
    return { x, y, width, height, right, bottom };
  };
  return { hud: rect('.campaign-status-hud'), destination: rect('.traversal-hud--progress'),
    encounter: rect('.traversal-event-panel'), departure: rect('.journey-overlay--departure .journey-overlay__panel') };
});
const overlap = (a, b) => a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
const fits = (r, width) => !r || (r.x >= -1 && r.right <= width + 1);
try {
  for (const [name, width, height] of [['desktop', 1440, 810], ['narrow', 620, 780], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:5197/tools/ui-kit-system-1-gallery.html');
    await page.waitForFunction(() => document.documentElement.dataset.kitReady === 'true');
    await page.evaluate(() => document.fonts.ready);
    proof.checks[`gallery-${name}`] = await page.evaluate(() => ({
      icons: document.querySelectorAll('#kit-icons .campaign-ui-icon svg').length,
      frames: document.querySelectorAll('#kit-frames .campaign-ui-frame').length,
      badges: document.querySelectorAll('#kit-badges .campaign-ui-badge').length,
      buttons: document.querySelectorAll('#kit-buttons button').length,
      fontReady: document.fonts.check('700 22px Alegreya') && document.fonts.check('600 18px "Source Sans 3"'),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      examplesVisible: document.querySelector('#kit-examples').getBoundingClientRect().height > 80,
    }));
    const check = proof.checks[`gallery-${name}`];
    assert.equal(check.icons, 12);
    assert.equal(check.frames, 3);
    assert.equal(check.badges, 5);
    assert.equal(check.buttons, 6);
    assert.equal(check.fontReady, true);
    assert.equal(check.horizontalOverflow, false);
    assert.equal(check.examplesVisible, true);
    await page.screenshot({ path: `${output}/gallery-${name}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__uiQaApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5197/');
  await page.waitForFunction(() => window.__uiQaApp);
  await page.evaluate(async () => {
    const { createInitialState } = await import('/src/game/store.ts');
    const { LION_TRAVERSAL_LEGS } = await import('/src/campaign/LionCampaignTravelRelations.ts');
    const app = window.__uiQaApp;
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T0');
    const state = createInitialState();
    state.flags.prologueSeen = true;
    state.run.currentNodeId = state.currentNodeId = leg.originNodeId;
    app.state = state;
    void app.enterTraversalT0(leg, true);
  });
  await page.waitForSelector('.journey-overlay--departure [data-journey-continue]', { timeout: 45000 });
  await page.waitForFunction(() => !document.querySelector('.scene-transition'));
  await page.evaluate(() => document.fonts.ready);
  proof.captures.departure = await rects();
  assert.ok(fits(proof.captures.departure.hud, 1440));
  assert.ok(fits(proof.captures.departure.departure, 1440));
  assert.equal(overlap(proof.captures.departure.hud, proof.captures.departure.departure), false);
  assert.ok(proof.captures.departure.departure.width <= 432);
  assert.ok(proof.captures.departure.hud.width <= 440);
  assert.equal(await page.locator('.journey-overlay--departure .campaign-ui-frame--hero').count(), 1);
  assert.equal(await page.locator('.journey-overlay--departure .campaign-ui-button--primary').count(), 1);
  await page.screenshot({ path: `${output}/departure-1440.png` });
  await page.evaluate(() => { window.__uiQaApp.state.run.temporaryLoot.gold = 40; window.__uiQaApp.statusHud.refresh(); });
  proof.checks.routeGoldText = await page.locator('.campaign-status-hud').innerText();
  assert.match(proof.checks.routeGoldText, /\+40 route/);
  assert.doesNotMatch(proof.checks.routeGoldText, /gemme/i);
  await page.locator('.campaign-status-hud').screenshot({ path: `${output}/hud-route-gold.png` });
  await page.locator('.journey-overlay--departure [data-journey-continue]').click();
  await page.waitForSelector('.traversal-t0[data-phase="RUNNING"]:not([data-transition])', { timeout: 45000 });
  proof.checks.continuationWorks = true;
  proof.captures.normal = await rects();
  assert.equal(overlap(proof.captures.normal.hud, proof.captures.normal.destination), false);
  assert.ok(proof.captures.normal.destination.width <= 226);
  assert.equal(await page.locator('.traversal-hud--progress.campaign-ui-frame--compact .campaign-ui-icon--destination').count(), 1);
  await page.screenshot({ path: `${output}/traversal-normal-1440.png` });
  await page.waitForSelector('.traversal-t0[data-phase="DECISION"] .traversal-event-panel:not([hidden])', { timeout: 45000 });
  await page.waitForTimeout(350);
  proof.captures.merchant = await rects();
  assert.equal(await page.locator('.traversal-event-panel.campaign-ui-frame--standard .campaign-ui-icon--merchant').count(), 1);
  assert.equal(overlap(proof.captures.merchant.hud, proof.captures.merchant.encounter), false);
  assert.equal(overlap(proof.captures.merchant.destination, proof.captures.merchant.encounter), false);
  assert.ok(proof.captures.merchant.encounter.width <= 422);
  await page.screenshot({ path: `${output}/merchant-1440.png` });
  for (const [name, width, height] of [['narrow', 620, 780], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    proof.captures[`merchant-${name}`] = await rects();
    const sample = proof.captures[`merchant-${name}`];
    assert.ok([sample.hud, sample.destination, sample.encounter].every(r => fits(r, width)));
    assert.equal(overlap(sample.hud, sample.destination), false);
    assert.equal(overlap(sample.hud, sample.encounter), false);
    assert.equal(overlap(sample.destination, sample.encounter), false);
    proof.checks[`merchant-${name}-overflow`] = await page.evaluate(() => {
      const panel = document.querySelector('.traversal-event-panel');
      const content = panel.querySelector(':scope > div');
      return document.documentElement.scrollWidth > innerWidth + 1 || content.scrollWidth > content.clientWidth;
    });
    assert.equal(proof.checks[`merchant-${name}-overflow`], false);
    await page.screenshot({ path: `${output}/merchant-${name}.png` });
  }
  await page.locator('[data-traversal-skip]').click();
  await page.waitForSelector('.traversal-t0[data-phase="RUNNING"]:not([data-transition])', { timeout: 45000 });
  proof.checks.ignoreReturnedToRoad = true;
  assert.deepEqual(errors, []);
  proof.checks.pass = true;
} catch (error) {
  proof.checks.pass = false;
  proof.checks.failure = String(error);
  throw error;
} finally {
  await writeFile(`${output}/browser-qa.json`, JSON.stringify(proof, null, 2));
  await browser.close();
  await server.close();
}
