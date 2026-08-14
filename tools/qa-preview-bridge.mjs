import { chromium } from 'playwright';

const PORT = process.argv[2] || '5174';
const BASE = `http://localhost:${PORT}`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // QA 2 — Composer with GIF previews
  console.log('--- QA 2: Composer ---');
  await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const composerExists = await page.$('#r2c-vfx-composer') !== null;
  console.log('composer exists:', composerExists);

  // Open catalogue to load preview images
  const addBtn = await page.$('.cmp-add-slot');
  if (addBtn) await addBtn.click();
  await page.waitForTimeout(2000);

  const previewImgs = await page.$$('.cmp-cat-preview');
  console.log('preview images found:', previewImgs.length);

  let loaded = 0, errors = 0;
  for (const img of previewImgs.slice(0, 10)) {
    const ok = await img.evaluate((e) => e.complete && e.naturalWidth > 0);
    if (ok) loaded++;
    else errors++;
  }
  console.log('loaded:', loaded, 'errors:', errors);

  const errorEls = await page.$$('.cmp-preview-error');
  console.log('bridge error elements:', errorEls.length);

  // Check multiple catalogue pages
  console.log('--- Multiple catalogue pages ---');
  const nextBtn = await page.$('.cmp-cat-next');
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(1500);
    const page2Imgs = await page.$$('.cmp-cat-preview');
    let page2Loaded = 0;
    for (const img of page2Imgs.slice(0, 5)) {
      const ok = await img.evaluate((e) => e.complete && e.naturalWidth > 0);
      if (ok) page2Loaded++;
    }
    console.log('page 2 images:', page2Imgs.length, 'loaded:', page2Loaded);
  }

  await browser.close();
  console.log('--- QA 2 DONE ---');
}

main().catch((err) => {
  console.error('QA FAILED:', err);
  process.exit(1);
});
