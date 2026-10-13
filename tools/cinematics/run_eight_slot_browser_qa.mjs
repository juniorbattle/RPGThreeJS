import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.EIGHT_SLOT_QA_URL ?? 'http://127.0.0.1:5195';
const outputDir = resolve(process.env.EIGHT_SLOT_QA_OUTPUT ?? 'tmp/cinematics/eight-slot-qa');
const approved = [
  'camp_departure', 'alaric_audience_arrival', 'bois_clair_arrival', 'bois_clair_saved',
  'bois_clair_sacrificed', 'lion_judgement', 'serpent_route_ending', 'lion_trial_route_ending',
];
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.goto(`${baseUrl}/?qa=1&cinematic=1`, { waitUntil: 'networkidle' });
    await page.locator('[data-cinematic-registry]').waitFor();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.qa-lab')).opacity === '1');
    const listed = await page.locator('[data-cinematic-registry]').textContent();
    const manifest = await page.evaluate(async () => (await fetch('/assets/cinematics/manifest.json')).json());
    const actual = manifest.cinematics.filter((entry) => !entry.placeholderOnly).map((entry) => entry.id);
    assert.deepEqual([...actual].sort(), [...approved].sort());
    for (const id of approved) assert.ok(listed?.includes(id), `Registry omitted ${id}`);
    assert.ok(!listed?.includes('serpent_general_reveal'), 'Retired enemy reveal remained playable');
    const layout = await page.evaluate(() => ({
      viewportWidth: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      buttonCount: document.querySelectorAll('[data-cinematic-qa]').length,
      backButtonRight: document.querySelector('[data-cinematic-back]')?.getBoundingClientRect().right,
      qaVisible: Boolean(document.querySelector('.qa-lab')?.getClientRects().length),
      topAtCenter: document.elementFromPoint(innerWidth / 2, 100)?.className,
      qaOpacity: getComputedStyle(document.querySelector('.qa-lab')).opacity,
    }));
    assert.ok(layout.scrollWidth <= layout.viewportWidth + 1, 'QA controls overflow the viewport');
    assert.ok(layout.qaVisible && layout.backButtonRight <= layout.viewportWidth, 'QA header is clipped');
    await page.screenshot({ path: resolve(outputDir, `registry-${viewport.width}x${viewport.height}.png`) });

    await page.locator('[data-cinematic-qa="missing"]').click();
    await page.locator('.qa-lab__result').waitFor({ timeout: 15000 });
    const missingResult = await page.locator('.qa-lab__result').textContent();
    assert.ok(missingResult?.includes('overlay nettoyé'), 'Missing media left an overlay');
    assert.deepEqual(errors, []);
    results.push({ viewport, listed, actual, layout, missingResult, errors, pass: true });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(resolve(outputDir, 'results.json'), JSON.stringify({ results }, null, 2));
}

console.log(JSON.stringify({ pass: results.length === 2, viewports: results.map((entry) => entry.viewport) }));
