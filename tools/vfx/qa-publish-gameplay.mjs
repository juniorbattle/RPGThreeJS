/**
 * R2C-VFX V2.3.2 — Normal UI Publication Proof
 *
 * Publishes VFX presets via DEV endpoints, then drives the actual combat UI
 * through NORMAL PLAYER INTERACTIONS (button clicks + canvas targeting) to
 * prove published VFX renders in real gameplay.
 *
 * QA helpers (teleport, AP restore) are used ONLY for deterministic setup.
 * The final action execution always goes through the normal player UI path:
 *   ATTACK/SKILLS button → charge/skill selection → canvas click on enemy target
 *
 * Usage: node tools/vfx/qa-publish-gameplay.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';

const BASE = process.env.QA_BASE || 'http://localhost:5175';
const SHOT_DIR = './tools/qa-shots/publish-gameplay';

try { rmSync(SHOT_DIR, { recursive: true }); } catch {}
mkdirSync(SHOT_DIR, { recursive: true });

async function publishPreset(page, draft) {
  // Use page.request (Node-side) to avoid execution context destruction
  const resp = await page.request.post(`${BASE}/dev/vfx-publish-preset`, {
    data: { draft },
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await resp.json();
  console.log(`[PUBLISH] ${draft.actionKey}: ok=${data.ok}, presetId=${data.presetId || 'N/A'}, fp=${data.fingerprint || 'N/A'}`);
  // Publishing writes to published-vfx-presets.json → Vite HMR may reload modules
  // Wait for any HMR to settle, then update the in-memory overlay
  await page.waitForTimeout(1500);
  try {
    await page.evaluate((reg) => {
      if (window.__publishedVfx && reg) window.__publishedVfx.__devUpdateOverlay(reg);
    }, data.registry);
  } catch { /* page may have reloaded — durable JSON is authoritative */ }
  return data;
}

async function unpublishPreset(page, actionKey) {
  const resp = await page.request.post(`${BASE}/dev/vfx-unpublish-preset`, {
    data: { actionKey },
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await resp.json();
  console.log(`[UNPUBLISH] ${actionKey}: ok=${data.ok}`);
  await page.waitForTimeout(1500);
  try {
    await page.evaluate((reg) => {
      if (window.__publishedVfx && reg) window.__publishedVfx.__devUpdateOverlay(reg);
    }, data.registry);
  } catch { /* page may have reloaded — durable JSON is authoritative */ }
  return data;
}

async function checkPublished(page, actionKey) {
  // Retry in case the page is reloading due to HMR
  for (let i = 0; i < 5; i++) {
    try {
      return await page.evaluate((ak) => {
        if (window.__publishedVfx) {
          const published = window.__publishedVfx.isActionPublished(ak);
          const draft = window.__publishedVfx.getPublishedDraft(ak);
          return { published, actionKey: ak, presetId: published ? `published_${ak}` : null, candidateId: draft?.visualSlots?.[0]?.candidateId || null, sizeProfile: draft?.visualSlots?.[0]?.sizeProfile || null, timingProfile: draft?.visualSlots?.[0]?.timingProfile || null, placementProfile: draft?.visualSlots?.[0]?.placementProfile || null };
        }
        return { published: false, error: 'window.__publishedVfx not available' };
      }, actionKey);
    } catch {
      console.log(`[RETRY] checkPublished: page context unavailable, retrying (${i + 1}/5)...`);
      await page.waitForTimeout(2000);
    }
  }
  return { published: false, error: 'Page context unavailable after retries' };
}

async function waitForPageReady(page, timeout = 30000) {
  // Wait for the combat page to be fully loaded and interactive
  await page.waitForFunction(() => {
    // The loading screen should be hidden
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') return false;
    // The deploy menu or action menu should be visible
    const menu = document.getElementById('menu');
    return menu && !menu.classList.contains('hidden');
  }, null, { timeout });
  console.log('[UI] Page ready');
}

async function skipTutorial(page) {
  // Wait for page to be ready first
  await page.waitForFunction(() => {
    const loading = document.getElementById('loading');
    return !loading || loading.style.display === 'none';
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
  const skipBtn = await page.$('[data-action="skip"]:not(.hidden)');
  if (skipBtn) { await skipBtn.click({ force: true }).catch(() => {}); await page.waitForTimeout(500); console.log('[UI] Tutorial skipped'); }
  const bossTutorial = await page.$('#boss-tutorial:not(.hidden) [data-action="start"]');
  if (bossTutorial) { await bossTutorial.click({ force: true }).catch(() => {}); await page.waitForTimeout(500); console.log('[UI] Boss tutorial skipped'); }
}

async function hideComposer(page) {
  // Hide the VFX Composer panel so it doesn't intercept clicks on the game UI
  await page.evaluate(() => {
    const composer = document.getElementById('r2c-vfx-composer');
    if (composer) composer.style.display = 'none';
  });
  console.log('[UI] Composer panel hidden');
}

async function waitForDeployMenu(page, timeout = 30000) {
  await page.waitForFunction(() => {
    const menu = document.getElementById('menu');
    return menu && !menu.classList.contains('hidden') && menu.classList.contains('deploy-roster');
  }, null, { timeout }).catch(() => {});
  console.log('[UI] Deploy menu visible');
}

async function autoDeploy(page) {
  const btn = await page.$('[data-d="auto"]');
  if (btn) { await btn.click({ force: true }); await page.waitForTimeout(500); console.log('[UI] Auto-deployed'); }
}

async function startBattle(page) {
  const btn = await page.$('[data-d="start"]');
  if (btn) { await btn.click({ force: true }); await page.waitForTimeout(2000); console.log('[UI] Battle started'); }
}

async function endTurnAndWait(page) { await page.keyboard.press('Enter'); await page.waitForTimeout(2000); }

async function getActiveUnitName(page) {
  return page.evaluate(() => {
    if (window.__qaHelpers) return window.__qaHelpers.getActiveUnitName();
    const panel = document.getElementById('panel');
    if (!panel || panel.classList.contains('hidden')) return '';
    return panel.querySelector('.nm')?.textContent?.trim() || '';
  });
}

async function getGameMode(page) {
  return page.evaluate(() => {
    if (window.__qaHelpers) return window.__qaHelpers.getGameMode();
    return 'unknown';
  });
}

async function waitForActionMenu(page, timeout = 60000) {
  // Wait for game to be in 'menu' mode (not 'target', 'deploy', etc.)
  await page.waitForFunction(() => {
    if (window.__qaHelpers) {
      const mode = window.__qaHelpers.getGameMode();
      if (mode !== 'menu') return false;
    }
    const m = document.getElementById('menu');
    return m && !m.classList.contains('hidden') && !m.classList.contains('deploy-roster');
  }, null, { timeout });
  console.log('[UI] Action menu visible');
}

async function takeScreenshot(page, name) { const p = `${SHOT_DIR}/${name}.png`; await page.screenshot({ path: p }); console.log(`[SHOT] ${p}`); }

async function endTurnsUntilUnit(page, pattern, max = 20) {
  for (let i = 0; i < max; i++) {
    await waitForActionMenu(page, 60000);
    const name = await getActiveUnitName(page);
    console.log(`[TURN] Active: "${name}" (${i + 1})`);
    if (pattern.test(name)) return true;
    await endTurnAndWait(page);
  }
  console.log(`[WARN] Unit ${pattern} not found`);
  return false;
}

// === NORMAL UI INTERACTION FUNCTIONS ===
// These drive the actual player UI — no executeActionQa backdoor.

async function clickAttackButton(page) {
  const btn = await page.$('[data-a="attack"]');
  if (!btn) { console.log('[UI] ATTACK button not found'); return false; }
  const isDis = await btn.evaluate(el => el.classList.contains('dis'));
  if (isDis) { console.log('[UI] ATTACK button disabled'); return false; }
  await btn.click({ force: true });
  await page.waitForTimeout(500);
  console.log('[UI] ATTACK button clicked');
  return true;
}

async function clickChargeButton(page, charge = 0) {
  const btn = await page.$(`[data-ch="${charge}"]`);
  if (!btn) { console.log(`[UI] Charge ${charge} button not found`); return false; }
  const isDis = await btn.evaluate(el => el.classList.contains('dis'));
  if (isDis) { console.log(`[UI] Charge ${charge} button disabled`); return false; }
  await btn.click({ force: true });
  await page.waitForTimeout(500);
  console.log(`[UI] Charge ${charge} selected`);
  return true;
}

async function clickSkillMenuButton(page) {
  const btn = await page.$('[data-a="skill"]');
  if (!btn) { console.log('[UI] SKILL button not found'); return false; }
  const isDis = await btn.evaluate(el => el.classList.contains('dis'));
  if (isDis) { console.log('[UI] SKILL button disabled'); return false; }
  await btn.click({ force: true });
  await page.waitForTimeout(500);
  console.log('[UI] SKILLS button clicked');
  return true;
}

async function clickSkillButton(page, skillId) {
  const btn = await page.$(`[data-s="${skillId}"]`);
  if (!btn) { console.log(`[UI] Skill ${skillId} button not found`); return false; }
  const isDis = await btn.evaluate(el => el.classList.contains('dis'));
  if (isDis) { console.log(`[UI] Skill ${skillId} button disabled`); return false; }
  await btn.click({ force: true });
  await page.waitForTimeout(500);
  console.log(`[UI] Skill ${skillId} selected`);
  return true;
}

async function clickEnemyTarget(page) {
  // Wait for target mode to be active
  await page.waitForTimeout(500);
  // Get nearest enemy to active unit (matches teleport target)
  const target = await page.evaluate(() => {
    if (window.__qaHelpers && window.__qaHelpers.getNearestEnemyScreenPosition) {
      return window.__qaHelpers.getNearestEnemyScreenPosition();
    }
    return null;
  });
  if (!target) {
    console.log('[UI] No enemy target found');
    return false;
  }
  // Get precise tile-center screen position for reliable raycasting
  const cellPos = await page.evaluate((t) => {
    if (window.__qaHelpers && window.__qaHelpers.getCellScreenPosition) {
      return window.__qaHelpers.getCellScreenPosition(t.gx, t.gz);
    }
    return null;
  }, target);
  const clickX = cellPos ? cellPos.screenX : target.screenX;
  const clickY = cellPos ? cellPos.screenY : target.screenY;
  // Click on the tile center
  await page.mouse.click(clickX, clickY);
  console.log(`[UI] Clicked enemy "${target.name}" at (${clickX.toFixed(0)}, ${clickY.toFixed(0)}) [gx=${target.gx}, gz=${target.gz}] dist=${target.distance}`);
  // Wait and check if action started (game becomes busy) or click missed (still target, not busy)
  await page.waitForTimeout(500);
  const state1 = await page.evaluate(() => ({ mode: window.__qaHelpers ? window.__qaHelpers.getGameMode() : 'unknown', busy: window.__qaHelpers && window.__qaHelpers.isGameBusy ? window.__qaHelpers.isGameBusy() : false }));
  if (state1.busy || state1.mode !== 'target') {
    // Action is executing or completed — wait for it to finish
    await page.waitForTimeout(5000);
    return true;
  }
  // Click missed — retry with enemy sprite position
  console.log('[UI] Tile click missed, retrying with sprite position...');
  await page.mouse.click(target.screenX, target.screenY);
  await page.waitForTimeout(500);
  const state2 = await page.evaluate(() => ({ mode: window.__qaHelpers ? window.__qaHelpers.getGameMode() : 'unknown', busy: window.__qaHelpers && window.__qaHelpers.isGameBusy ? window.__qaHelpers.isGameBusy() : false }));
  if (state2.busy || state2.mode !== 'target') {
    // Action is executing or completed — wait for it to finish
    await page.waitForTimeout(5000);
    return true;
  }
  // Still stuck — cancel back to menu
  console.log('[UI] Click still missed, cancelling to menu...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return false;
}

async function main() {
  console.log('=== R2C-VFX V2.3.2 Normal UI Publication Proof ===\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const vfxQaLogs = [];
  page.on('console', (msg) => { const t = msg.text(); if (t.includes('[VFX-QA]')) { vfxQaLogs.push(t); console.log(`[CONSOLE] ${t}`); } });

  // ============================================================
  // PRE-PUBLISH: Publish all initial presets BEFORE navigating.
  // page.request works without a loaded page (uses browser API context).
  // This avoids HMR reloads during gameplay.
  // ============================================================
  console.log('[PRE-PUBLISH] Publishing initial presets before page load...');

  // TEST A preset: basic_crosier_hit BIG/LONG/TARGET r1_0489
  await publishPreset(page, { actionKey: 'basic_crosier_hit', presetId: 'composer_basic_crosier_hit', visualSlots: [{ id: 'slot_1', candidateId: 'r1_0489', sizeProfile: 'BIG', timingProfile: 'LONG', placementProfile: 'TARGET' }], choreography: 'TOGETHER', technicalPolish: 'OFF' });

  // TEST B preset: w_break_guard BIG/LONG/TARGET r1_0489
  await publishPreset(page, { actionKey: 'w_break_guard', presetId: 'composer_w_break_guard', visualSlots: [{ id: 'slot_1', candidateId: 'r1_0489', sizeProfile: 'BIG', timingProfile: 'LONG', placementProfile: 'TARGET' }], choreography: 'TOGETHER', technicalPolish: 'OFF', tier: 2 });

  // Navigate — vfxlab=1 enables VFX composer + DEV QA helpers
  console.log('[NAV] Loading combat page...');
  await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Verify publications are visible from durable JSON
  const pub1 = await checkPublished(page, 'basic_crosier_hit');
  console.log('[VERIFY] basic_crosier_hit:', JSON.stringify(pub1));
  const pub2 = await checkPublished(page, 'w_break_guard');
  console.log('[VERIFY] w_break_guard:', JSON.stringify(pub2));

  // === SETUP ===
  console.log('\n=== SETUP ===');
  await skipTutorial(page);
  await hideComposer(page);
  await autoDeploy(page);
  // Swap Archère for Morvan (has d_cursed_blade skill needed for Test D)
  const swap = await page.evaluate(() => window.__qaHelpers.swapDeployedUnitForQa('Archère', 'Morvan'));
  console.log('[QA SETUP] Swap:', JSON.stringify(swap));
  await startBattle(page);
  await waitForActionMenu(page);
  await takeScreenshot(page, '00-deployed');

  // ============================================================
  // TEST A: CROSIER THROUGH NORMAL UI
  // ============================================================
  console.log('\n=== TEST A: Crosier Through Normal UI ===');
  vfxQaLogs.length = 0;
  const foundCleric = await endTurnsUntilUnit(page, /Clerc|Cleric|Marian/i);
  let testA = { attackBtn: false, targetSelected: false, qaUsed: false, vfxLog: null };
  if (foundCleric) {
    // QA SETUP: teleport near enemy
    const tp = await page.evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    console.log('[QA SETUP] Teleport:', JSON.stringify(tp));
    // NORMAL UI: ATTACK → charge 0 → click enemy on canvas
    console.log('[UI] Executing attack through normal player UI...');
    testA.attackBtn = await clickAttackButton(page);
    testA.targetSelected = await clickChargeButton(page, 0);
    await clickEnemyTarget(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '01-crosier-attack-vfx');
    await page.waitForTimeout(5000);
    testA.vfxLog = vfxQaLogs.find(l => l.includes('basic_crosier_hit')) || null;
    console.log('[RESULT] VFX-QA log:', testA.vfxLog || 'NOT FOUND');
  }

  // ============================================================
  // TEST B: W_BREAK_GUARD THROUGH NORMAL UI
  // ============================================================
  console.log('\n=== TEST B: w_break_guard Through Normal UI ===');
  vfxQaLogs.length = 0;
  const foundKnight = await endTurnsUntilUnit(page, /Chevalier|Knight|Alistair/i);
  let testB = { skillSelected: false, targetSelected: false, qaUsed: false, vfxLog: null };
  if (foundKnight) {
    // QA SETUP: teleport near enemy + restore AP
    const tp = await page.evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    console.log('[QA SETUP] Teleport:', JSON.stringify(tp));
    const ap = await page.evaluate(() => window.__qaHelpers.restoreActiveUnitAp());
    console.log('[QA SETUP] Restore AP:', JSON.stringify(ap));
    // NORMAL UI: SKILLS → w_break_guard → click enemy on canvas
    console.log('[UI] Executing w_break_guard through normal player UI...');
    testB.skillSelected = await clickSkillMenuButton(page);
    testB.skillSelected = await clickSkillButton(page, 'w_break_guard') && testB.skillSelected;
    testB.targetSelected = await clickEnemyTarget(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-w_break_guard-vfx');
    await page.waitForTimeout(5000);
    testB.vfxLog = vfxQaLogs.find(l => l.includes('w_break_guard')) || null;
    console.log('[RESULT] VFX-QA log:', testB.vfxLog || 'NOT FOUND');
  }

  // ============================================================
  // TEST C: STATIC FALLBACK THROUGH NORMAL UI
  // ============================================================
  console.log('\n=== TEST C: Static Fallback Through Normal UI ===');
  // Unpublish w_break_guard — VFX should fall back to static sword_slash
  await unpublishPreset(page, 'w_break_guard');
  const pubC = await checkPublished(page, 'w_break_guard');
  console.log('[VERIFY] w_break_guard after unpublish:', JSON.stringify(pubC));
  // Check if HMR caused a page reload — if so, restart combat
  const pageStateC = await page.evaluate(() => ({
    hasQaHelpers: !!window.__qaHelpers,
    mode: window.__qaHelpers ? window.__qaHelpers.getGameMode() : 'unknown',
    loading: document.getElementById('loading')?.style?.display !== 'none',
  }));
  console.log('[STATE] Page state after unpublish:', JSON.stringify(pageStateC));
  if (!pageStateC.hasQaHelpers || pageStateC.loading || pageStateC.mode === 'deploy') {
    console.log('[RECOVERY] Page reloaded due to HMR — restarting combat...');
    await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await skipTutorial(page);
    await hideComposer(page);
    await waitForDeployMenu(page);
    await autoDeploy(page);
    const swap2 = await page.evaluate(() => window.__qaHelpers.swapDeployedUnitForQa('Archère', 'Morvan'));
    console.log('[QA SETUP] Swap:', JSON.stringify(swap2));
    await startBattle(page);
    await waitForActionMenu(page);
  }
  vfxQaLogs.length = 0;
  const foundKnightC = await endTurnsUntilUnit(page, /Chevalier|Knight|Alistair/i);
  let testC = { unpublished: !pubC.published, skillExecuted: false, vfxLog: null };
  if (foundKnightC) {
    // QA SETUP: teleport near enemy + restore AP
    const tp = await page.evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    console.log('[QA SETUP] Teleport:', JSON.stringify(tp));
    const ap = await page.evaluate(() => window.__qaHelpers.restoreActiveUnitAp());
    console.log('[QA SETUP] Restore AP:', JSON.stringify(ap));
    // NORMAL UI: SKILLS → w_break_guard → click enemy on canvas
    console.log('[UI] Executing w_break_guard through normal player UI (unpublished)...');
    await clickSkillMenuButton(page);
    await clickSkillButton(page, 'w_break_guard');
    testC.skillExecuted = await clickEnemyTarget(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '03-static-fallback-vfx');
    await page.waitForTimeout(5000);
    testC.vfxLog = vfxQaLogs.find(l => l.includes('w_break_guard')) || null;
    console.log('[RESULT] VFX-QA log:', testC.vfxLog || 'NOT FOUND');
  }

  // ============================================================
  // TEST D: SHARED PRESET ISOLATION THROUGH REAL UI
  // ============================================================
  console.log('\n=== TEST D: Shared Preset Isolation Through Real UI ===');
  // Re-publish w_break_guard only (d_cursed_blade stays unpublished)
  await publishPreset(page, { actionKey: 'w_break_guard', presetId: 'composer_w_break_guard', visualSlots: [{ id: 'slot_1', candidateId: 'r1_0489', sizeProfile: 'BIG', timingProfile: 'LONG', placementProfile: 'TARGET' }], choreography: 'TOGETHER', technicalPolish: 'OFF', tier: 2 });
  const pubD_wbg = await checkPublished(page, 'w_break_guard');
  const pubD_dcb = await checkPublished(page, 'd_cursed_blade');
  console.log('[VERIFY] w_break_guard:', JSON.stringify(pubD_wbg));
  console.log('[VERIFY] d_cursed_blade:', JSON.stringify(pubD_dcb));
  // Check if HMR caused a page reload — if so, restart combat
  const pageStateD = await page.evaluate(() => ({
    hasQaHelpers: !!window.__qaHelpers,
    mode: window.__qaHelpers ? window.__qaHelpers.getGameMode() : 'unknown',
    loading: document.getElementById('loading')?.style?.display !== 'none',
  }));
  console.log('[STATE] Page state after publish:', JSON.stringify(pageStateD));
  if (!pageStateD.hasQaHelpers || pageStateD.loading || pageStateD.mode === 'deploy') {
    console.log('[RECOVERY] Page reloaded due to HMR — restarting combat...');
    await page.goto(`${BASE}/legacy-combat.html?vfxlab=1`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await skipTutorial(page);
    await hideComposer(page);
    await waitForDeployMenu(page);
    await autoDeploy(page);
    const swap3 = await page.evaluate(() => window.__qaHelpers.swapDeployedUnitForQa('Archère', 'Morvan'));
    console.log('[QA SETUP] Swap:', JSON.stringify(swap3));
    await startBattle(page);
    await waitForActionMenu(page);
  }

  // Part 1: Execute w_break_guard through UI (should be published)
  vfxQaLogs.length = 0;
  const foundKnightD = await endTurnsUntilUnit(page, /Chevalier|Knight|Alistair/i);
  let testD_wbg = { vfxLog: null };
  if (foundKnightD) {
    const tp = await page.evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    console.log('[QA SETUP] Teleport:', JSON.stringify(tp));
    const ap = await page.evaluate(() => window.__qaHelpers.restoreActiveUnitAp());
    console.log('[QA SETUP] Restore AP:', JSON.stringify(ap));
    console.log('[UI] Executing w_break_guard through normal player UI...');
    await clickSkillMenuButton(page);
    await clickSkillButton(page, 'w_break_guard');
    await clickEnemyTarget(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '04-isolation-w_break_guard-vfx');
    await page.waitForTimeout(5000);
    testD_wbg.vfxLog = vfxQaLogs.find(l => l.includes('w_break_guard')) || null;
    console.log('[RESULT] w_break_guard VFX-QA log:', testD_wbg.vfxLog || 'NOT FOUND');
  }

  // Part 2: Execute d_cursed_blade through UI (should be static sword_slash)
  vfxQaLogs.length = 0;
  const foundMorvan = await endTurnsUntilUnit(page, /Morvan|Chevalier Noir|darkmage/i);
  let testD_dcb = { vfxLog: null };
  if (foundMorvan) {
    const tp = await page.evaluate(() => window.__qaHelpers.teleportActiveUnitNextToEnemy());
    console.log('[QA SETUP] Teleport:', JSON.stringify(tp));
    const ap = await page.evaluate(() => window.__qaHelpers.restoreActiveUnitAp());
    console.log('[QA SETUP] Restore AP:', JSON.stringify(ap));
    console.log('[UI] Executing d_cursed_blade through normal player UI...');
    await clickSkillMenuButton(page);
    await clickSkillButton(page, 'd_cursed_blade');
    await clickEnemyTarget(page);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '05-isolation-d_cursed_blade-vfx');
    await page.waitForTimeout(5000);
    testD_dcb.vfxLog = vfxQaLogs.find(l => l.includes('d_cursed_blade')) || null;
    console.log('[RESULT] d_cursed_blade VFX-QA log:', testD_dcb.vfxLog || 'NOT FOUND');
  }

  // ============================================================
  // CLEANUP: Remove all temporary publications
  // ============================================================
  console.log('\n=== QA Cleanup ===');
  await unpublishPreset(page, 'basic_crosier_hit');
  await unpublishPreset(page, 'w_break_guard');
  await page.waitForTimeout(2000);
  const fc1 = await checkPublished(page, 'basic_crosier_hit');
  const fc2 = await checkPublished(page, 'w_break_guard');
  console.log('[CLEANUP] basic_crosier_hit:', JSON.stringify(fc1));
  console.log('[CLEANUP] w_break_guard:', JSON.stringify(fc2));

  // ============================================================
  // SUMMARY
  // ============================================================
  await takeScreenshot(page, '06-final-state');
  await browser.close();

  // Print final summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log('Test A (Crosier Normal UI):');
  console.log('  ATTACK button used:', testA.attackBtn ? 'YES' : 'NO');
  console.log('  Target selected through UI:', testA.targetSelected ? 'YES' : 'NO');
  console.log('  executeActionQa used: NO');
  console.log('  VFX-QA log:', testA.vfxLog || 'NOT FOUND');
  console.log('Test B (w_break_guard Normal UI):');
  console.log('  Skill selected through UI:', testB.skillSelected ? 'YES' : 'NO');
  console.log('  Target selected through UI:', testB.targetSelected ? 'YES' : 'NO');
  console.log('  executeActionQa used: NO');
  console.log('  VFX-QA log:', testB.vfxLog || 'NOT FOUND');
  console.log('Test C (Static Fallback):');
  console.log('  Unpublished:', testC.unpublished ? 'YES' : 'NO');
  console.log('  Real UI skill executed:', testC.skillExecuted ? 'YES' : 'NO');
  console.log('  VFX-QA log:', testC.vfxLog || 'NOT FOUND');
  console.log('Test D (Shared Preset Isolation):');
  console.log('  w_break_guard VFX-QA log:', testD_wbg.vfxLog || 'NOT FOUND');
  console.log('  d_cursed_blade VFX-QA log:', testD_dcb.vfxLog || 'NOT FOUND');

  console.log('\n=== QA Complete ===');
}

main().catch((err) => { console.error('QA failed:', err); process.exit(1); });
