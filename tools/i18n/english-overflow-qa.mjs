/**
 * OD-2026-11-15-C — does the English text still fit? The title, the settings (every tab), the opening's end, the first
 * dialogue boxes with their choices and the Lion's map, at 1366×768, 620×780 and 390×844, with the browser's default
 * motion and with `reducedMotion: 'reduce'` emulated. A screen fails when the page scrolls sideways, when a visible
 * control or text runs past the viewport, or when a box clips its own text.
 *
 * Runs against a DEV server the caller started (Claude: `preview_start`, port 5182); it starts no server of its own.
 * Env: ENGLISH_QA_BASE_URL (default http://localhost:5182), ENGLISH_QA_LANGUAGE (en | fr, default en),
 * ENGLISH_QA_OUTPUT (under tmp/, never overwritten), ENGLISH_QA_STEPS (dialogue steps visited, default 14).
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.ENGLISH_QA_BASE_URL ?? 'http://localhost:5182';
const language = process.env.ENGLISH_QA_LANGUAGE === 'fr' ? 'fr' : 'en';
const steps = Number(process.env.ENGLISH_QA_STEPS ?? 14);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(process.env.ENGLISH_QA_OUTPUT ?? `tmp/english-overflow/${language}-${stamp}`);
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });

const VIEWPORTS = [[1366, 768], [620, 780], [390, 844]];
const MOTIONS = ['no-preference', 'reduce'];
const report = { language, base, runs: [], failures: [], pass: false };

/** Everything that does not fit on the screen as it stands, read in the page. */
const measure = () => {
  const width = window.innerWidth, height = window.innerHeight;
  const shown = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05;
  };
  const label = (element) => `${element.tagName.toLowerCase()}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const problems = [];
  if (document.documentElement.scrollWidth > width + 1) problems.push({ kind: 'page-scrolls-sideways', by: document.documentElement.scrollWidth - width });
  for (const element of document.querySelectorAll('button, [role="tab"], h1, h2, h3, p, label, .dialogue__text, .dialogue__speaker, .dialogue-choice, .poi-marker__name')) {
    if (!shown(element) || element.closest('[aria-hidden="true"]') || element.closest('[hidden]')) continue;
    const rect = element.getBoundingClientRect();
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (rect.right > width + 1 || rect.left < -1) problems.push({ kind: 'past-viewport', element: label(element), text: text.slice(0, 80), by: Math.round(Math.max(rect.right - width, -rect.left)) });
    const overflow = getComputedStyle(element).overflow + getComputedStyle(element).overflowX + getComputedStyle(element).overflowY;
    if (/hidden|clip/.test(overflow) && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) && !/ellipsis/.test(getComputedStyle(element).textOverflow)) {
      problems.push({ kind: 'clipped', element: label(element), text: text.slice(0, 80), by: Math.max(element.scrollWidth - element.clientWidth, element.scrollHeight - element.clientHeight) });
    }
  }
  return { width, height, problems };
};

const browser = await chromium.launch({ headless: true });
for (const [width, height] of VIEWPORTS) {
  for (const motion of MOTIONS) {
    const name = `${width}x${height}-${motion}`;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: motion });
    await context.addInitScript((chosen) => localStorage.setItem('rpg-threejs:language-preference:v1', JSON.stringify({ language: chosen })), language);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error?.message ?? error).slice(0, 300)));
    const screens = [];
    const check = async (screen, capture = false) => {
      await page.waitForTimeout(450);
      const result = await page.evaluate(measure);
      screens.push({ screen, ...result });
      for (const problem of result.problems) report.failures.push({ run: name, screen, ...problem });
      if (capture) await page.screenshot({ path: resolve(output, `${name}-${screen}.png`) });
    };
    await page.goto(`${base}/?qa=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-action="new"]', { timeout: 30000 });
    await check('title', true);

    // The settings, every tab.
    await page.locator('[data-action="settings"], button:has-text("Réglages"), button:has-text("Settings")').first().click();
    await page.waitForSelector('[role="tablist"]');
    for (const tab of await page.locator('[role="tab"]').all()) {
      await tab.click();
      await check(`settings-${(await tab.getAttribute('data-settings-tab')) ?? 'tab'}`, true);
    }
    await page.locator('[data-sound-close]').click();
    await page.waitForTimeout(400);

    // A new chronicle: the opening, then the first dialogue boxes and their choices, then the map.
    await page.locator('[data-action="new"]').click();
    if (await page.locator('[data-action="confirm-new"]').isVisible().catch(() => false)) await page.locator('[data-action="confirm-new"]').click();
    const skip = page.locator('.opening-sequence [data-skip]');
    if (await skip.waitFor({ timeout: 8000 }).then(() => true).catch(() => false)) {
      await page.waitForTimeout(1200);
      await check('opening', true);
      await skip.click({ timeout: 3000 }).catch(() => undefined);
    }
    let visited = 0;
    for (let turn = 0; turn < 160 && visited < steps; turn += 1) {
      const living = page.locator('.living-tableau__skip');
      if (await living.isVisible().catch(() => false)) { await living.click({ timeout: 2000 }).catch(() => undefined); await page.waitForTimeout(500); continue; }
      const choices = page.locator('.dialogue .dialogue-choice:visible');
      if (await choices.count()) {
        await check(`dialogue-choice-${visited}`, visited < 6);
        const enabled = page.locator('.dialogue .dialogue-choice:visible:not(:disabled)');
        if (await enabled.count()) await enabled.first().click({ timeout: 3000 }).catch(() => undefined);
        visited += 1;
        await page.waitForTimeout(250);
        continue;
      }
      const box = page.locator('.dialogue .dialogue__box');
      if (await box.first().isVisible().catch(() => false)) {
        await page.waitForTimeout(350);
        await check(`dialogue-${visited}`, visited < 6);
        await box.first().click({ timeout: 3000 }).catch(() => undefined);
        visited += 1;
        await page.waitForTimeout(120);
        continue;
      }
      if (await page.locator('[data-poi-id]').first().isVisible().catch(() => false)) break;
      await page.waitForTimeout(250);
    }
    if (await page.locator('[data-poi-id]').first().isVisible().catch(() => false)) await check('lion-map', true);
    report.runs.push({ run: name, screens: screens.length, errors });
    await context.close();
    console.log(`${name}: ${screens.length} screens, ${report.failures.filter((failure) => failure.run === name).length} problems, ${errors.length} page errors`);
  }
}
await browser.close();
report.pass = report.failures.length === 0 && report.runs.every((run) => !run.errors.length);
await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
console.log(`done pass=${report.pass} problems=${report.failures.length}`);
process.exit(report.pass ? 0 : 1);
