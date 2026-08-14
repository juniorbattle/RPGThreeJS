import { chromium } from 'playwright';

const PORT = process.argv[2] || '5179';
const BASE = `http://localhost:${PORT}`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('--- Browser QA: GIGA Size Profile ---');
  await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const composerExists = await page.$('#r2c-vfx-composer') !== null;
  console.log('composer exists:', composerExists);

  // Add a slot from catalogue
  await page.click('.cmp-add-slot');
  await page.waitForTimeout(1000);
  await page.click('.cmp-cat-add');
  await page.waitForTimeout(1000);

  // Verify 4 SIZE buttons (first slot only)
  const sizeButtons = await page.$$('[data-profile="size"] .cmp-profile-btn');
  const sizeLabels = await Promise.all(sizeButtons.map((b) => b.textContent()));
  const firstSet = sizeLabels.slice(0, 4);
  console.log('SIZE buttons (first slot):', firstSet);
  console.log('GIGA button visible:', firstSet.includes('GIGA'));

  // Test each size button: click, wait for re-render, check active
  for (const label of ['LOW', 'MID', 'BIG', 'GIGA']) {
    const btn = await page.$(`[data-profile="size"] button[data-value="${label}"]`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(500);
      const activeBtn = await page.$(`[data-profile="size"] button[data-value="${label}"]`);
      const isActive = await activeBtn?.evaluate((el) => el.classList.contains('cmp-active'));
      console.log(`  ${label} clickable+active:`, isActive);
    }
  }

  // Verify minimize/expand still works
  const minimizeBtn = await page.$('.cmp-minimize');
  if (minimizeBtn) {
    await minimizeBtn.click();
    await page.waitForTimeout(500);
    const minimized = await page.$('.cmp-minimized-dock');
    console.log('minimize works:', minimized !== null);
    if (minimized) {
      const expandBtn = await page.$('.cmp-expand');
      if (expandBtn) {
        await expandBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // Verify GIF previews still work
  const previewImgs = await page.$$('.cmp-slot-preview');
  let loaded = 0;
  for (const img of previewImgs) {
    const ok = await img.evaluate((e) => e.complete && e.naturalWidth > 0);
    if (ok) loaded++;
  }
  console.log('GIF previews loaded:', loaded, '/', previewImgs.length);

  // Verify no bridge errors
  const errorEls = await page.$$('.cmp-preview-error');
  console.log('bridge error elements:', errorEls.length);

  await browser.close();
  console.log('--- Browser QA DONE ---');
}

main().catch((err) => {
  console.error('QA FAILED:', err);
  process.exit(1);
});
