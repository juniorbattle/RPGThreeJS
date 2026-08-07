import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REVIEW_DIR = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack\\03_inventory_output\\r1_2_pilot_review';
const INDEX_PATH = join(REVIEW_DIR, 'index.html');
const FILE_URL = 'file:///' + INDEX_PATH.replace(/\\/g, '/');

const TEST_CANDIDATES = ['r1_2561', 'r1_1605', 'r1_0525'];
const ALL_CANDIDATES = ['r1_1605','r1_1712','r1_0971','r1_0545','r1_1700','r1_2561','r1_0450','r1_0677','r1_0503','r1_2509','r1_0480','r1_0525'];

async function main() {
  console.log('=== R1.2.4 Browser Playback Validation ===\n');
  console.log('URL:', FILE_URL);

  if (!existsSync(INDEX_PATH)) {
    console.error('FATAL: index.html not found at', INDEX_PATH);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to file:// URL...');
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  // Give players time to initialize
  await page.waitForTimeout(2000);

  let allPassed = true;
  const results = {};

  // ─── Detailed validation for 3 candidates ───
  for (const candId of TEST_CANDIDATES) {
    const safeId = candId.replace(/[^a-zA-Z0-9]/g, '_');
    console.log(`\n--- Testing ${candId} (safeId: ${safeId}) ---`);
    const r = { name: candId, tests: {} };

    // 1. Verify player container exists
    const containerExists = await page.locator(`.vfx-player[data-candidate-id="${safeId}"]`).count();
    r.tests.containerExists = containerExists > 0;
    console.log(`  Container exists: ${r.tests.containerExists}`);

    if (!r.tests.containerExists) {
      console.log(`  SKIP — no container found`);
      results[candId] = r;
      allPassed = false;
      continue;
    }

    const container = page.locator(`.vfx-player[data-candidate-id="${safeId}"]`);
    const img = container.locator('.player-img');
    const counter = container.locator('.frame-counter');
    const scrubber = container.locator('.scrubber');

    // 2. Get initial frame counter
    const initialCounter = await counter.textContent();
    console.log(`  Initial counter: "${initialCounter}"`);

    // 3. Click Play and wait
    await container.locator('.btn-play').click();
    await page.waitForTimeout(600);

    // 4. Assert frame counter changed
    const counterAfterPlay = await counter.textContent();
    r.tests.playAdvancesCounter = counterAfterPlay !== initialCounter;
    console.log(`  Play advances counter: ${r.tests.playAdvancesCounter} ("${counterAfterPlay}")`);

    // 5. Record img.src
    const srcAfterPlay = await img.getAttribute('src');
    console.log(`  src after play: ${srcAfterPlay}`);

    // 6. Wait again
    await page.waitForTimeout(600);

    // 7. Assert img.src changed
    const srcAfterWait = await img.getAttribute('src');
    r.tests.srcChanges = srcAfterPlay !== srcAfterWait;
    console.log(`  src changes during playback: ${r.tests.srcChanges} (${srcAfterWait})`);

    // 8. Click Pause
    await container.locator('.btn-pause').click();
    await page.waitForTimeout(400);

    // 9. Assert frame counter no longer changes
    const counterAfterPause = await counter.textContent();
    await page.waitForTimeout(400);
    const counterAfterPauseWait = await counter.textContent();
    r.tests.pauseFreezes = counterAfterPause === counterAfterPauseWait;
    console.log(`  Pause freezes counter: ${r.tests.pauseFreezes} ("${counterAfterPause}" == "${counterAfterPauseWait}")`);

    // 10. Move scrubber to frame 32 (or frame 8 for 16-frame candidates)
    const scrubTarget = candId === 'r1_2561' ? 8 : 32;
    await scrubber.fill(String(scrubTarget));
    await page.waitForTimeout(200);

    // 11. Assert counter shows correct frame
    const counterAtScrub = await counter.textContent();
    r.tests.scrubberSelects32 = counterAtScrub.includes(String(scrubTarget)) && counterAtScrub.includes('64') === (candId !== 'r1_2561');
    // More precise: check it contains the right frame number and total
    const expectedTotal = candId === 'r1_2561' ? '16' : '64';
    r.tests.scrubberSelects32 = counterAtScrub.includes(`Frame ${scrubTarget} / ${expectedTotal}`);
    console.log(`  Scrubber selects ${scrubTarget}: ${r.tests.scrubberSelects32} ("${counterAtScrub}")`);

    // 12. Assert src ends with correct frame file
    const srcAtScrub = await img.getAttribute('src');
    const expectedFrameFile = `frame_${String(scrubTarget).padStart(3, '0')}.png`;
    r.tests.srcIsFrame32 = srcAtScrub && srcAtScrub.includes(expectedFrameFile);
    console.log(`  src is ${expectedFrameFile}: ${r.tests.srcIsFrame32} (${srcAtScrub})`);

    // 13. Click Next
    await container.locator('.btn-next').click();
    await page.waitForTimeout(200);

    // 14. Assert next frame
    const nextFrameNum = scrubTarget + 1;
    const counterAfterNext = await counter.textContent();
    r.tests.nextAdvances = counterAfterNext.includes(`Frame ${nextFrameNum} / ${expectedTotal}`);
    console.log(`  Next advances to ${nextFrameNum}: ${r.tests.nextAdvances} ("${counterAfterNext}")`);

    // 15. Click Prev
    await container.locator('.btn-prev').click();
    await page.waitForTimeout(200);

    // 16. Assert back to scrub target
    const counterAfterPrev = await counter.textContent();
    r.tests.prevDecrements = counterAfterPrev.includes(`Frame ${scrubTarget} / ${expectedTotal}`);
    console.log(`  Prev decrements to ${scrubTarget}: ${r.tests.prevDecrements} ("${counterAfterPrev}")`);

    // 17. Pause first, then Restart — restart should show frame 1 and stay paused
    await container.locator('.btn-pause').click();
    await page.waitForTimeout(100);
    await container.locator('.btn-restart').click();
    await page.waitForTimeout(100);

    // 18. Assert frame 1 (should stay at 1 since was paused)
    const counterAfterRestart = await counter.textContent();
    r.tests.restartReturnsTo1 = counterAfterRestart.trim() === `Frame 1 / ${expectedTotal}`;
    console.log(`  Restart returns to 1: ${r.tests.restartReturnsTo1} ("${counterAfterRestart}")`);

    // 19. Test loop: move to frame (total-2), play at 0.5x, verify wrap from last to 1
    const loopStart = candId === 'r1_2561' ? 14 : 62;
    await container.locator('.btn-pause').click();
    await page.waitForTimeout(100);
    await container.locator('.sel-speed').selectOption('0.5');
    await scrubber.fill(String(loopStart));
    await page.waitForTimeout(100);
    await container.locator('.btn-play').click();
    // At 0.5x: 20fps*0.5=10fps → 100ms per frame
    const lastFrame = candId === 'r1_2561' ? 16 : 64;
    await page.waitForTimeout(210); // Should be at last frame
    const counterAtLast = await counter.textContent();
    await page.waitForTimeout(110); // Should wrap to frame 1
    const counterAfterWrap = await counter.textContent();
    r.tests.loopWraps = counterAfterWrap.includes(`Frame 1 / ${expectedTotal}`) && counterAtLast.includes(`Frame ${lastFrame} / ${expectedTotal}`);
    console.log(`  Loop ${lastFrame}→1: ${r.tests.loopWraps} (atLast="${counterAtLast}" afterWrap="${counterAfterWrap}")`);

    // 20. Pause
    await container.locator('.btn-pause').click();

    // 21. Test speed control
    // Use a short wait and start from frame 1 to avoid wrapping for 16-frame candidates
    await scrubber.fill('1');
    await page.waitForTimeout(100);
    // Play at 1x for 300ms — at 20fps that's ~6 frames
    await container.locator('.sel-speed').selectOption('1');
    await container.locator('.btn-play').click();
    await page.waitForTimeout(300);
    const counterAt1x = await counter.textContent();
    await container.locator('.btn-pause').click();

    // Play at 2x for 300ms — at 40fps that's ~12 frames
    await scrubber.fill('1');
    await page.waitForTimeout(100);
    await container.locator('.sel-speed').selectOption('2');
    await container.locator('.btn-play').click();
    await page.waitForTimeout(300);
    const counterAt2x = await counter.textContent();
    await container.locator('.btn-pause').click();

    // 2x should have advanced more frames than 1x (accounting for wraps)
    const frameAt1x = parseInt(counterAt1x.match(/Frame (\d+)/)?.[1] || '0', 10);
    const frameAt2x = parseInt(counterAt2x.match(/Frame (\d+)/)?.[1] || '0', 10);
    // For 16-frame: 1x→~7, 2x→~13 (no wrap at 300ms)
    // For 64-frame: 1x→~7, 2x→~13 (no wrap at 300ms)
    r.tests.speedAffectsRate = frameAt2x > frameAt1x;
    console.log(`  Speed affects rate: ${r.tests.speedAffectsRate} (1x: frame ${frameAt1x}, 2x: frame ${frameAt2x})`);

    // 22. Debug panel toggle
    await container.locator('.debug-toggle').click();
    const debugVisible = await container.locator('.debug-panel').isVisible();
    r.tests.debugToggleWorks = debugVisible;
    console.log(`  Debug toggle works: ${r.tests.debugToggleWorks}`);
    await container.locator('.debug-toggle').click(); // Hide again

    // Summary for this candidate
    const passed = Object.values(r.tests).every(v => v === true);
    if (!passed) allPassed = false;
    console.log(`  ${candId} — ${passed ? 'ALL PASS' : 'HAS FAILURES'}`);
    results[candId] = r;
  }

  // ─── Structural validation for all 12 candidates ───
  console.log('\n--- All 12 Candidate Structural Validation ---');
  for (const candId of ALL_CANDIDATES) {
    const safeId = candId.replace(/[^a-zA-Z0-9]/g, '_');
    const container = page.locator(`.vfx-player[data-candidate-id="${safeId}"]`);
    const count = await container.count();
    const img = container.locator('.player-img');
    const counter = container.locator('.frame-counter');
    const imgSrc = count > 0 ? await img.getAttribute('src') : 'N/A';
    const counterText = count > 0 ? await counter.textContent() : 'N/A';
    const hasAllControls = count > 0
      ? await container.locator('.btn-play').count()
        + await container.locator('.btn-pause').count()
        + await container.locator('.btn-restart').count()
        + await container.locator('.btn-prev').count()
        + await container.locator('.btn-next').count()
        + await container.locator('.btn-loop').count()
        + await container.locator('.scrubber').count()
        + await container.locator('.sel-speed').count()
      : 0;
    const ok = count === 1 && hasAllControls === 8;
    if (!ok) allPassed = false;
    console.log(`  ${candId}: container=${count} controls=${hasAllControls}/8 src=${imgSrc} counter="${counterText}" ${ok ? 'PASS' : 'FAIL'}`);
  }

  // ─── DOM isolation test ───
  console.log('\n--- DOM Isolation Test ---');
  // Play r1_1605, verify r1_1712 doesn't change
  const c1 = page.locator('.vfx-player[data-candidate-id="r1_1605"]');
  const c2 = page.locator('.vfx-player[data-candidate-id="r1_1712"]');
  const counter2Before = await c2.locator('.frame-counter').textContent();
  // Restart c1 and play
  await c1.locator('.btn-restart').click();
  await page.waitForTimeout(600);
  const counter2After = await c2.locator('.frame-counter').textContent();
  // c2 should not have changed due to c1 playing (it might be auto-playing itself, so check it didn't jump to frame 1)
  // Actually both auto-play on load. Let's pause c2 first, then play c1 and check c2 stays paused
  await c2.locator('.btn-pause').click();
  await page.waitForTimeout(100);
  const c2PausedCounter = await c2.locator('.frame-counter').textContent();
  await c1.locator('.btn-play').click();
  await page.waitForTimeout(600);
  const c2AfterC1Play = await c2.locator('.frame-counter').textContent();
  const isolationOk = c2PausedCounter === c2AfterC1Play;
  if (!isolationOk) allPassed = false;
  console.log(`  r1_1605 play doesn't affect r1_1712: ${isolationOk} (c2 was "${c2PausedCounter}" stayed "${c2AfterC1Play}")`);

  // ─── Console errors ───
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length > 0) {
    console.log(`  ${consoleErrors.length} console errors detected:`);
    for (const e of consoleErrors) console.log(`    ${e}`);
  } else {
    console.log('  No console errors');
  }

  await browser.close();

  // ─── Final Summary ───
  console.log('\n=== FINAL VALIDATION SUMMARY ===');

  // Aggregate results from 3 tested candidates
  const allTests = Object.values(results).flatMap(r => Object.entries(r.tests));
  const testNames = ['containerExists','playAdvancesCounter','srcChanges','pauseFreezes','scrubberSelects32','srcIsFrame32','nextAdvances','prevDecrements','restartReturnsTo1','loopWraps','speedAffectsRate','debugToggleWorks'];
  for (const tn of testNames) {
    const vals = Object.values(results).map(r => r.tests[tn]).filter(v => v !== undefined);
    const allTrue = vals.every(v => v === true);
    console.log(`  ${tn}: ${allTrue ? 'YES' : 'NO'} (${vals.filter(v=>v).length}/${vals.length})`);
    if (!allTrue) allPassed = false;
  }

  console.log(`\nOverall: ${allPassed ? 'ALL PASS' : 'HAS FAILURES'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
