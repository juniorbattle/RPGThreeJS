/** One-off actual-scene typography comparison for UI-VISUAL-DIRECTION-SYSTEM-2. */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'docs/reports/ui-visual-direction-system-2-browser/font-comparison';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5195, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const candidates = [
  { name: 'Marcellus', weight: 400, slug: 'marcellus', file: 'marcellus-latin-400-normal.woff2' },
  { name: 'Cormorant Garamond', weight: 600, slug: 'cormorant-garamond', file: 'cormorant-garamond-latin-600-normal.woff2' },
  { name: 'Alegreya', weight: 600, slug: 'alegreya', file: 'alegreya-latin-600-normal.woff2' },
];
const records = [];
const compare = async surface => {
  for (const candidate of candidates) {
    const style = await page.addStyleTag({ content: `
      .campaign-status-hud small, .traversal-hud--progress p, .traversal-event-panel small,
      .journey-overlay--departure .journey-overlay__eyebrow,
      .traversal-hud--progress strong, .traversal-event-panel strong,
      .journey-overlay--departure .journey-overlay__title, .campaign-ui-button {
        font-family: '${candidate.name}', serif !important; font-weight: ${candidate.weight} !important;
      }
      .campaign-status-hud strong, .campaign-status-hud em,
      .traversal-hud--progress [data-traversal-distance], .traversal-event-panel p {
        font-family: 'Source Sans 3', sans-serif !important;
      }
    ` });
    await page.evaluate(async ({ name, weight }) => {
      await document.fonts.load(`${weight} 24px "${name}"`);
      await document.fonts.load('400 14px "Source Sans 3"');
      await document.fonts.ready;
    }, candidate);
    const panel = page.locator(surface === 'departure'
      ? '.journey-overlay--departure .journey-overlay__panel' : '.traversal-event-panel');
    const rect = await panel.boundingBox();
    const margin = 16;
    await page.screenshot({ path: `${output}/${surface}-${candidate.slug}.png`, clip: {
      x: Math.max(0, rect.x - margin), y: Math.max(0, rect.y - margin),
      width: Math.min(1440, rect.x + rect.width + margin) - Math.max(0, rect.x - margin),
      height: Math.min(810, rect.y + rect.height + margin) - Math.max(0, rect.y - margin),
    } });
    records.push(await page.evaluate(({ name, surface }) => {
      const selector = surface === 'departure' ? '.journey-overlay--departure .journey-overlay__title' : '.traversal-event-panel strong';
      const element = document.querySelector(selector);
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const textRange = document.createRange();
      textRange.selectNodeContents(element);
      return { name, surface, fontFamily: style.fontFamily, fontWeight: style.fontWeight,
        faceLoaded: [...document.fonts].some(face => face.family === name && face.status === 'loaded'),
        textWidth: textRange.getBoundingClientRect().width, boxWidth: rect.width,
        titleHeight: rect.height, titleText: element.textContent };
    }, { name: candidate.name, surface }));
    assert.equal(records.at(-1).faceLoaded, true, `${candidate.name} did not load on ${surface}`);
    await style.evaluate(element => element.remove());
  }
};

try {
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__fontQaApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5195/');
  await page.waitForFunction(() => window.__fontQaApp);
  // Dev-only font faces: product CSS imports only the selected family.
  const faces = candidates.map(candidate => {
    const path = resolve('node_modules', '@fontsource', candidate.slug, 'files', candidate.file).replaceAll('\\', '/');
    return `@font-face { font-family: '${candidate.name}'; font-weight: ${candidate.weight}; src: url('/@fs/${path}') format('woff2'); }`;
  });
  await page.addStyleTag({ content: faces.join('\n') });
  await page.evaluate(async () => {
    const { createInitialState } = await import('/src/game/store.ts');
    const { LION_TRAVERSAL_LEGS } = await import('/src/campaign/LionCampaignTravelRelations.ts');
    const app = window.__fontQaApp;
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T0');
    const state = createInitialState();
    state.flags.prologueSeen = true;
    state.run.currentNodeId = state.currentNodeId = leg.originNodeId;
    app.state = state;
    void app.enterTraversalT0(leg, true);
  });
  await page.waitForSelector('.journey-overlay--departure [data-journey-continue]', { timeout: 45000 });
  await page.waitForFunction(() => !document.querySelector('.scene-transition'));
  await compare('departure');
  await page.locator('.journey-overlay--departure [data-journey-continue]').click();
  await page.waitForSelector('.traversal-t0[data-phase="DECISION"] .traversal-event-panel:not([hidden])', { timeout: 45000 });
  await compare('merchant');
  await writeFile(`${output}/comparison.json`, JSON.stringify(records, null, 2));
} finally {
  await browser.close();
  await server.close();
}
