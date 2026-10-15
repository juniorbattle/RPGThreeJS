/** Repeatable shared UI kit gallery QA; retired physical scenes are preserved in the retirement archive. */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = process.env.UI_KIT_OUTPUT ?? 'tmp/ui-kit-system-1-gallery';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5197, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const proof = { errors, captures: {}, checks: {} };
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
