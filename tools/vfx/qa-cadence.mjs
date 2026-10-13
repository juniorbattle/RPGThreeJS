import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOT_DIR = './tools/qa-shots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('=== Load Composer ===');
  await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Test candidates: 3 × 16f + 5 × 64f
  const tests = [
    { id: 'r1_2561', frames: 16, family: 'wind/charge', action: 'w_charge' },
    { id: 'r1_0489', frames: 64, family: 'heal', action: 'basic_crosier_hit' },
    { id: 'r1_0545', frames: 64, family: 'impact/dark', action: 'd_devouring_eclipse' },
    { id: 'r1_1605', frames: 64, family: 'slash', action: 'w_lion_surge' },
    { id: 'r1_0503', frames: 64, family: 'buff', action: 'w_purify' },
    { id: 'r1_1700', frames: 64, family: 'slash/fire', action: 'w_whirl' },
    { id: 'r1_0480', frames: 64, family: 'heal', action: 'w_salvation' },
    { id: 'r1_2561', frames: 16, family: 'wind/charge (2nd)', action: 'w_charge' },
  ];

  for (const test of tests) {
    console.log(`\n=== ${test.id} (${test.frames}f, ${test.family}) ===`);

    // Select action
    await page.selectOption('.cmp-action-select', test.action);
    await page.waitForTimeout(500);

    // Remove default slots (re-query each time since DOM re-renders)
    let removeBtn = await page.$('.cmp-slot-remove');
    while (removeBtn) {
      await removeBtn.click();
      await page.waitForTimeout(300);
      removeBtn = await page.$('.cmp-slot-remove');
    }

    // Add candidate from catalogue
    await page.click('.cmp-add-slot');
    await page.waitForTimeout(500);
    await page.fill('.cmp-search', test.id);
    await page.press('.cmp-search', 'Enter');
    await page.waitForTimeout(500);

    const catCards = await page.$$('.cmp-cat-card');
    for (const card of catCards) {
      const cid = await card.$eval('.cmp-cat-cid', el => el.textContent);
      if (cid && cid.includes(test.id)) {
        await card.$('.cmp-cat-add').then(btn => btn?.click());
        break;
      }
    }
    await page.waitForTimeout(500);

    // Verify slot
    const slotCid = await page.textContent('.cmp-slot-cid');
    console.log(`  slot: ${slotCid}`);

    // Test each timing profile
    for (const timing of ['QUICK', 'NORMAL', 'LONG']) {
      // Set timing
      const timingBtn = await page.$(`[data-profile="timing"] button[data-value="${timing}"]`);
      if (timingBtn) { await timingBtn.click(); await page.waitForTimeout(200); }

      // Read timeline duration
      const timeline = await page.$$eval('.cmp-timeline-row', rows => rows.map(r => r.textContent));
      console.log(`  ${timing}: timeline=${timeline[0]}`);

      // Play visuals only
      await page.click('.cmp-play-visuals');
      await page.waitForTimeout(300);
      const statusDuring = await page.textContent('.cmp-status');
      console.log(`  ${timing}: status="${statusDuring}"`);

      // Screenshot during playback
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOT_DIR}/${test.id}_${timing}.png` });

      // Wait for completion
      await page.waitForTimeout(3000);
      const statusAfter = await page.textContent('.cmp-status');
      console.log(`  ${timing}: result="${statusAfter}"`);
    }
  }

  // Check console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log(`\n=== Console errors: ${errors.length} ===`);
  errors.forEach(e => console.log(`  ${e}`));

  await browser.close();
  console.log('\n=== QA DONE ===');
}

main().catch((err) => { console.error('QA FAILED:', err); process.exit(1); });
