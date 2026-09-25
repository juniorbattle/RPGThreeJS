import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const galleryUrl = new URL('../../docs/reports/dialogue-static-tableau-v2-review/gallery.html', import.meta.url).href;
const auditUrl = new URL('../../docs/reports/dialogue-static-tableau-v2-review/composition-audit.json', import.meta.url);
const audit = JSON.parse(await readFile(auditUrl, 'utf8'));
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1440, height: 810 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(galleryUrl + '#acte_ouverture', { waitUntil: 'domcontentloaded' });
    const bar = page.locator('.jump-bar');
    const image = page.locator('#acte_ouverture figure img').first();
    await image.waitFor();
    assert.equal(await page.locator('#dialogue-jump option').count(), 76);
    assert.equal(await page.locator('figure').count(), audit.summary.screenshots);
    const barRect = await bar.boundingBox();
    const imageRect = await image.boundingBox();
    assert.ok(barRect && imageRect);
    assert.ok(barRect.height <= 65, 'navigation must stay compact');
    assert.ok(imageRect.y >= barRect.y + barRect.height - 2, 'navigation must not cover the first image');
    assert.ok(imageRect.y < viewport.height - 100, 'first image must be visible without scrolling');
    await page.screenshot({ path: join(tmpdir(), 'static-tableau-gallery-' + viewport.width + '.png') });
    await page.selectOption('#dialogue-jump', 'lion_briefing');
    await page.waitForFunction(() => location.hash === '#lion_briefing');
    const headingRect = await page.locator('#lion_briefing h2').boundingBox();
    assert.ok(headingRect && headingRect.y >= barRect.height - 2, 'selected heading must clear the sticky bar');
    process.stdout.write(viewport.width + 'x' + viewport.height + ': bar ' + Math.round(barRect.height) + 'px, first image at ' + Math.round(imageRect.y) + 'px, hash navigation OK\n');
    await page.close();
  }
} finally {
  await browser.close();
}
