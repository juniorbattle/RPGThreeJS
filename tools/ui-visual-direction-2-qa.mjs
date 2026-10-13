/** Compactness regression and browser capture of the four P0 campaign surfaces. */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'docs/reports/ui-visual-direction-system-2-browser';
await mkdir(output, { recursive: true });
const baseline = JSON.parse(await readFile('docs/reports/ui-visual-direction-system-1-browser/browser-qa.json', 'utf8'));
const server = await createServer({ server: { host: '127.0.0.1', port: 5196, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));

const bounds = () => page.evaluate(() => {
  const rect = selector => {
    const element = document.querySelector(selector);
    if (!element || element.hidden || getComputedStyle(element).display === 'none') return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  return {
    hud: rect('.campaign-status-hud'), destination: rect('.traversal-hud--progress'),
    encounter: rect('.traversal-event-panel'), departure: rect('.journey-overlay--departure .journey-overlay__panel'),
    world: rect('.traversal-t0'),
  };
});
const overlap = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const proof = { errors, captures: {}, checks: {} };
const smaller = (before, after, label) => {
  assert.ok(after.width < before.width && after.height < before.height,
    `${label} did not become more compact: ${JSON.stringify({ before, after })}`);
  return { before: { width: before.width, height: before.height },
    after: { width: after.width, height: after.height } };
};

try {
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__uiQaApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5196/');
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
  await page.screenshot({ path: `${output}/01-narrative-departure.png` });
  proof.captures.departure = await bounds();
  proof.checks.typography = await page.evaluate(() => ({
    title: getComputedStyle(document.querySelector('.journey-overlay--departure .journey-overlay__title')).fontFamily,
    label: getComputedStyle(document.querySelector('.campaign-status-hud small')).fontFamily,
    value: getComputedStyle(document.querySelector('.campaign-status-hud strong')).fontFamily,
    fontReady: document.fonts.check('700 25px Alegreya') && document.fonts.check('600 17px "Source Sans 3"'),
  }));
  assert.match(proof.checks.typography.title, /Alegreya/);
  assert.match(proof.checks.typography.label, /Alegreya/);
  assert.match(proof.checks.typography.value, /Source Sans 3/);
  assert.equal(proof.checks.typography.fontReady, true);
  proof.checks.hudCompactness = smaller(baseline.captures.departure.hud, proof.captures.departure.hud, 'HUD');
  proof.checks.departureCompactness = smaller(baseline.captures.departure.departure, proof.captures.departure.departure, 'departure');
  proof.checks.departureText = await page.locator('.journey-overlay--departure').innerText();
  assert.match(proof.checks.departureText, /Départ[\s\S]*Vers /i);
  assert.match(proof.checks.departureText, /Prendre la route/i);
  assert.equal(overlap(proof.captures.departure.hud, proof.captures.departure.departure), false);
  await page.evaluate(() => {
    window.__uiQaApp.state.run.temporaryLoot.gold = 40;
    window.__uiQaApp.statusHud.refresh();
  });
  proof.checks.routeGoldText = await page.locator('.campaign-status-hud').innerText();
  assert.match(proof.checks.routeGoldText, /\+40 route/);
  await page.locator('.campaign-status-hud').screenshot({ path: `${output}/05-hud-route-gold.png` });
  await page.evaluate(() => {
    window.__uiQaApp.state.run.temporaryLoot.gold = 0;
    window.__uiQaApp.statusHud.refresh();
  });
  await page.locator('.journey-overlay--departure [data-journey-continue]').click();
  await page.waitForSelector('.traversal-t0[data-phase="RUNNING"]:not([data-transition])', { timeout: 45000 });
  await page.screenshot({ path: `${output}/02-traversal-normal.png` });
  proof.captures.normal = await bounds();
  proof.checks.destinationCompactness = smaller(baseline.captures.normal.destination, proof.captures.normal.destination, 'destination');
  assert.equal(overlap(proof.captures.normal.hud, proof.captures.normal.destination), false);
  assert.ok(proof.captures.normal.world);
  await page.waitForSelector('.traversal-t0[data-phase="DECISION"] .traversal-event-panel:not([hidden])', { timeout: 45000 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/03-traversal-merchant.png` });
  proof.captures.merchant = await bounds();
  proof.checks.encounterCompactness = smaller(baseline.captures.merchant.encounter, proof.captures.merchant.encounter, 'encounter');
  proof.checks.encounterText = await page.locator('.traversal-event-panel').innerText();
  assert.match(proof.checks.encounterText, /Rencontre facultative[\s\S]*Marchande/i);
  assert.equal(overlap(proof.captures.merchant.hud, proof.captures.merchant.encounter), false);
  assert.equal(overlap(proof.captures.merchant.destination, proof.captures.merchant.encounter), false);
  await page.setViewportSize({ width: 620, height: 780 });
  await page.screenshot({ path: `${output}/04-traversal-merchant-narrow.png` });
  proof.captures.narrow = await bounds();
  proof.checks.narrowHudCompactness = smaller(baseline.captures.narrow.hud, proof.captures.narrow.hud, 'narrow HUD');
  proof.checks.narrowEncounterCompactness = smaller(baseline.captures.narrow.encounter, proof.captures.narrow.encounter, 'narrow encounter');
  assert.equal(overlap(proof.captures.narrow.hud, proof.captures.narrow.destination), false);
  assert.equal(overlap(proof.captures.narrow.destination, proof.captures.narrow.encounter), false);
  assert.equal(overlap(proof.captures.narrow.hud, proof.captures.narrow.encounter), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/06-traversal-merchant-mobile.png` });
  proof.captures.mobile = await bounds();
  assert.equal(overlap(proof.captures.mobile.hud, proof.captures.mobile.destination), false);
  assert.equal(overlap(proof.captures.mobile.destination, proof.captures.mobile.encounter), false);
  assert.equal(overlap(proof.captures.mobile.hud, proof.captures.mobile.encounter), false);
  proof.checks.mobilePanelFit = await page.evaluate(() => {
    const panel = document.querySelector('.traversal-event-panel');
    const content = panel.querySelector(':scope > div');
    const actions = panel.querySelector('.traversal-event-panel__actions');
    return { panelRight: panel.getBoundingClientRect().right,
      contentScrollWidth: content.scrollWidth, contentClientWidth: content.clientWidth,
      actionsRight: actions.getBoundingClientRect().right,
      fits: panel.getBoundingClientRect().right <= innerWidth
        && content.scrollWidth <= content.clientWidth
        && actions.getBoundingClientRect().right <= panel.getBoundingClientRect().right - 6 };
  });
  assert.equal(proof.checks.mobilePanelFit.fits, true);
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
