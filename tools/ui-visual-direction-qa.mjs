/** Browser capture of the four P0 surfaces through the real dev runtime. */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'docs/reports/ui-visual-direction-system-1-browser';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5194, strictPort: true, watch: null, hmr: false } });
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

try {
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__uiQaApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5194/');
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
  await page.screenshot({ path: `${output}/01-narrative-departure.png` });
  proof.captures.departure = await bounds();
  proof.checks.departureText = await page.locator('.journey-overlay--departure').innerText();
  assert.match(proof.checks.departureText, /Départ[\s\S]*Vers /i);
  assert.match(proof.checks.departureText, /Prendre la route/i);
  assert.equal(overlap(proof.captures.departure.hud, proof.captures.departure.departure), false);
  await page.locator('.journey-overlay--departure [data-journey-continue]').click();
  await page.waitForSelector('.traversal-t0[data-phase="RUNNING"]:not([data-transition])', { timeout: 45000 });
  await page.screenshot({ path: `${output}/02-traversal-normal.png` });
  proof.captures.normal = await bounds();
  assert.equal(overlap(proof.captures.normal.hud, proof.captures.normal.destination), false);
  assert.ok(proof.captures.normal.world);
  await page.waitForSelector('.traversal-t0[data-phase="DECISION"] .traversal-event-panel:not([hidden])', { timeout: 45000 });
  await page.screenshot({ path: `${output}/03-traversal-merchant.png` });
  proof.captures.merchant = await bounds();
  proof.checks.encounterText = await page.locator('.traversal-event-panel').innerText();
  assert.match(proof.checks.encounterText, /Rencontre facultative[\s\S]*Marchande/i);
  assert.equal(overlap(proof.captures.merchant.hud, proof.captures.merchant.encounter), false);
  assert.equal(overlap(proof.captures.merchant.destination, proof.captures.merchant.encounter), false);
  await page.setViewportSize({ width: 620, height: 780 });
  await page.screenshot({ path: `${output}/04-traversal-merchant-narrow.png` });
  proof.captures.narrow = await bounds();
  assert.equal(overlap(proof.captures.narrow.hud, proof.captures.narrow.destination), false);
  assert.equal(overlap(proof.captures.narrow.destination, proof.captures.narrow.encounter), false);
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
