// Combat outcome and random sequence with audio on and off (OD-2026-11-01-B, AUTHORING_AND_QA): the same QA fight and the
// same actions twice on the real CombatBridge, effects and music on, then off, comparing every number shown and the log.
// Needs the dev server on 5173. Usage: node tools/audio/truth-check.mjs
import { chromium } from 'playwright';

const ACTIONS = ['w_whirl', 'foe:enemy_heavy_strike', 'n_flame_wave', 'attack', 'a_arrow_rain', 'foe:boss_slam', 'l_long_thrust', 'w_lion_surge'];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });

async function run(audio) {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((on) => {
    localStorage.setItem('rpg-threejs:ui-audio:v2', JSON.stringify({ enabled: on, volume: 0.5 }));
    localStorage.setItem('rpg-threejs:music:v1', JSON.stringify({ enabled: on, volume: 0.6 }));
  }, audio);
  await page.goto('http://localhost:5173/?qa=1&stageqa=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.title-screen [data-action="qa"]', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.click('.title-screen [data-action="qa"]');
  await page.waitForTimeout(500);
  await page.locator('.qa-lab__encounter--normal').first().click();
  let frame = null;
  for (let i = 0; i < 900 && !frame; i++) {
    frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat')) ?? null;
    if (!frame && await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  }
  await frame.waitForSelector('[data-qa="prepare"]', { timeout: 120000, state: 'attached' });
  await page.waitForTimeout(1500);
  for (const selector of ['#tutorial:not(.hidden) [data-action="skip"]', '#boss-tutorial:not(.hidden) [data-action="start"]']) if (await frame.locator(selector).count()) await frame.locator(selector).first().click({ force: true });
  await frame.locator('[data-qa="prepare"]').click({ force: true });
  await page.waitForTimeout(2500);
  await frame.evaluate(() => {
    window.__seen = [];
    new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) if (n.classList?.contains('float')) window.__seen.push(n.textContent); }).observe(document.body, { childList: true, subtree: true });
  });
  const log = [];
  for (const key of ACTIONS) {
    const result = await frame.evaluate(async (action) => {
      try {
        await Promise.race([action.startsWith('foe:') ? window.__qaHelpers.playFromFoe(action.slice(4)) : window.__qaHelpers.stagePlay(action), new Promise((resolve) => setTimeout(() => resolve('timeout'), 70000))]);
        return 'played';
      } catch (error) { return String(error); }
    }, key);
    log.push(`${key}:${result}`);
  }
  const outcome = await frame.evaluate(() => ({ floats: window.__seen, log: document.querySelector('#log')?.innerText ?? '' }));
  const snapshot = await page.evaluate(() => window.__rpgMusic());
  await context.close();
  return { audio, actions: log, floats: outcome.floats, log: outcome.log, unlocked: snapshot.unlocked, errors };
}

const on = await run(true);
const off = await run(false);
await browser.close();
const same = JSON.stringify(on.floats) === JSON.stringify(off.floats) && on.log === off.log;
console.log(JSON.stringify({ same, actionsOn: on.actions, floatsOn: on.floats.length, floatsOff: off.floats.length, logLines: on.log.split('\n').length, unlockedOn: on.unlocked, unlockedOff: off.unlocked, sample: on.floats.slice(0, 16), errors: [...on.errors, ...off.errors].slice(0, 3) }, null, 1));
if (!same) console.log('DIFF', JSON.stringify(on.floats), JSON.stringify(off.floats));
process.exit(same && on.floats.length > 0 ? 0 : 1);
