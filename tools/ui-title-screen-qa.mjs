/**
 * Title screen pass 2026-11-15 — audit driver for the title, its menu, the settings dialog and the hand-off to the
 * 55 second opening (OD-2026-11-02-A). Runs against a DEV server the caller started (Claude: `preview_start`, port
 * 5183); it starts no server of its own and writes only under ignored `tmp/`.
 *
 * For each viewport and each OS motion setting (default, emulated `prefers-reduced-motion: reduce`), and for the game's
 * own reduced-motion setting off then on, it records:
 * - captures of the title without a save, with a save, the new-chronicle confirmation, each settings tab, keyboard focus;
 * - real bounds of every title control (44 px targets, overflow past the viewport), the Tab order, focus restoration
 *   after the settings dialog and the confirmation, the same paths driven by a simulated standard gamepad;
 * - the curtain at the instant the title leaves (opacity of `.scene-transition`), so a hard cut shows as opacity < 1;
 * - time to the title, fonts and images loaded, console errors and failed requests.
 *
 * Env: TITLE_QA_BASE_URL (default http://localhost:5183), TITLE_QA_OUTPUT (under tmp/, never overwritten),
 * TITLE_QA_VIEWPORTS (comma list, default 1920x1080,1366x768,620x780,390x844), TITLE_QA_LABEL (before | after).
 */
import { mkdir, access, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { isAbsolute, relative, resolve, join } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.TITLE_QA_BASE_URL ?? 'http://localhost:5183';
const label = process.env.TITLE_QA_LABEL ?? 'before';
const viewports = (process.env.TITLE_QA_VIEWPORTS ?? '1920x1080,1366x768,620x780,390x844')
  .split(',').map((entry) => entry.trim().split('x').map(Number));
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(process.env.TITLE_QA_OUTPUT ?? `tmp/title-screen-pass/${label}-${stamp}`);
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });

const report = {
  schemaVersion: 1, recordedAt: new Date().toISOString(), commit: execSync('git rev-parse HEAD').toString().trim(),
  base, label, runs: [],
};

/** A standard-mapping pad the page reads through navigator.getGamepads; the driver presses its buttons. */
const INIT = () => {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'QA pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons };
  window.__qaPad = pad;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
  window.__qaTitle = { titleAt: null, leaves: [] };
  // Headless Chromium may draw no frame for a second or two after load: captures wait for real frames.
  window.__qaFrames = 0;
  const frame = () => { window.__qaFrames += 1; requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  const observer = new MutationObserver(() => {
    const title = document.querySelector('.title-screen:not(.title-screen--credits):not(.title-screen--recovery)');
    if (title && window.__qaTitle.titleAt === null) window.__qaTitle.titleAt = performance.now();
    if (!title && window.__qaTitle.present) {
      const curtain = document.querySelector('.scene-transition');
      window.__qaTitle.leaves.push({ at: performance.now(), curtainOpacity: curtain ? Number(getComputedStyle(curtain).opacity) : null, curtainClass: curtain?.className ?? null });
    }
    window.__qaTitle.present = Boolean(title);
  });
  document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
};

const BUTTON = { confirm: 0, back: 1, previous: 4, next: 5, up: 12, down: 13, left: 14, right: 15 };
async function padPress(page, action) {
  await page.evaluate((index) => { window.__qaPad.buttons[index].pressed = true; window.__qaPad.buttons[index].value = 1; }, BUTTON[action]);
  await page.waitForTimeout(90);
  await page.evaluate((index) => { window.__qaPad.buttons[index].pressed = false; window.__qaPad.buttons[index].value = 0; }, BUTTON[action]);
  await page.waitForTimeout(90);
}

const focusInfo = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'body' };
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(), action: el.getAttribute('data-action') ?? el.getAttribute('data-settings-tab') ?? null,
    text: (el.textContent ?? '').trim().slice(0, 60), outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
    boxShadow: style.boxShadow.slice(0, 80), rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
  };
});

const titleMetrics = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const section = document.querySelector('.title-screen');
  const controls = [...document.querySelectorAll('.title-screen button, .title-screen [tabindex]')].map((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return { action: el.getAttribute('data-action'), text: el.textContent.trim(), disabled: el.disabled === true,
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      under44: r.height < 44 || r.width < 44, outside: r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh,
      color: s.color, background: s.backgroundImage !== 'none' ? s.backgroundImage.slice(0, 90) : s.backgroundColor, fontSize: s.fontSize, opacity: s.opacity };
  });
  const texts = [...document.querySelectorAll('.title-screen h1, .title-screen .eyebrow, .title-screen__lead, .title-screen__sigil, .title-screen__confirm p, .title-screen__version')].map((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return { cls: el.className || el.tagName, text: el.textContent.trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      outside: r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh, display: s.display, color: s.color, fontSize: s.fontSize, fontFamily: s.fontFamily.slice(0, 40) };
  });
  return {
    viewport: { vw, vh }, docScroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    sectionScroll: section ? { w: section.scrollWidth, h: section.scrollHeight, cw: section.clientWidth, ch: section.clientHeight } : null,
    controls, texts, fontsCinzel: document.fonts.check('700 40px Cinzel'),
  };
});

async function tabOrder(page, count) {
  const order = [];
  for (let i = 0; i < count; i += 1) {
    await page.keyboard.press('Tab');
    const info = await focusInfo(page);
    order.push(info.action ?? info.text ?? info.tag);
  }
  return order;
}

async function settingsMetrics(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('.ui-settings');
    if (!dialog) return null;
    const r = dialog.getBoundingClientRect();
    const controls = [...dialog.querySelectorAll('button, input')].filter((el) => !el.closest('[hidden]')).map((el) => {
      const b = el.getBoundingClientRect();
      return { text: (el.textContent || el.id || el.type).trim().slice(0, 40), h: Math.round(b.height), w: Math.round(b.width), under44: b.height < 44 };
    });
    return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, scroll: { h: dialog.scrollHeight, ch: dialog.clientHeight },
      tabs: [...dialog.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim()), controls,
      animation: getComputedStyle(dialog).animationName, backdropAnimation: getComputedStyle(dialog.parentElement).animationName };
  });
}

async function shot(page, dir, name) {
  const file = join(dir, `${name}.png`);
  await page.screenshot({ path: file });
  return relative(output, file);
}

async function waitTitle(page) {
  await page.waitForSelector('.title-screen [data-action="new"]', { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__qaFrames > 40, null, { timeout: 15000 });
  await page.waitForTimeout(500);
}

for (const [width, height] of viewports) {
  for (const osMotion of ['no-preference', 'reduce']) {
    for (const gameReduced of [false, true]) {
      // The game setting is exercised at desktop and phone only, to keep the run short.
      if (gameReduced && !(width === 1920 || width === 390)) continue;
      const tag = `${width}x${height}-os-${osMotion}-game-${gameReduced ? 'reduced' : 'normal'}`;
      const dir = join(output, tag);
      await mkdir(dir, { recursive: true });
      const run = { tag, width, height, osMotion, gameReduced, captures: [], consoleErrors: [], pageErrors: [], failedRequests: [], images: [], checks: {} };
      report.runs.push(run);
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: osMotion, deviceScaleFactor: 1 });
      await context.addInitScript(INIT);
      if (gameReduced) await context.addInitScript(() => { try { localStorage.setItem('rpg-threejs:motion-preference:v1', JSON.stringify({ reduced: true })); } catch {} });
      const page = await context.newPage();
      page.on('console', (m) => { if (m.type() === 'error') run.consoleErrors.push(m.text().slice(0, 300)); });
      page.on('pageerror', (e) => run.pageErrors.push(String(e).slice(0, 300)));
      page.on('requestfailed', (r) => run.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`));
      page.on('response', (r) => { if (r.status() >= 400) run.failedRequests.push(`${r.status()} ${r.url()}`); });
      try {
        // 1. Title without a save, mouse at rest.
        await page.goto(base, { waitUntil: 'load' });
        await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('rpg')) localStorage.removeItem(key); });
        if (gameReduced) await page.evaluate(() => localStorage.setItem('rpg-threejs:motion-preference:v1', JSON.stringify({ reduced: true })));
        await page.reload({ waitUntil: 'load' });
        await waitTitle(page);
        run.checks.motionClass = await page.evaluate(() => document.body.classList.contains('motion-reduced'));
        run.checks.timing = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          return { titleAt: Math.round(window.__qaTitle.titleAt ?? -1), domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? -1), load: Math.round(nav?.loadEventEnd ?? -1) };
        });
        run.images = await page.evaluate(() => performance.getEntriesByType('resource')
          .filter((e) => /\.(png|webp|jpe?g|svg|gif|avif)(\?|$)/i.test(e.name))
          .map((e) => ({ url: e.name.replace(location.origin, ''), ms: Math.round(e.responseEnd), kb: Math.round((e.transferSize || e.encodedBodySize) / 1024) })));
        run.checks.fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`));
        run.checks.titleNoSave = await titleMetrics(page);
        run.checks.initialFocusNoSave = await focusInfo(page);
        run.captures.push(await shot(page, dir, '01-title-nosave'));
        // Mouse hover on the primary entry.
        const newBox = await page.locator('[data-action="new"]').boundingBox();
        if (newBox) { await page.mouse.move(newBox.x + newBox.width / 2, newBox.y + newBox.height / 2); await page.waitForTimeout(250); run.captures.push(await shot(page, dir, '02-title-hover-new')); await page.mouse.move(2, 2); }

        // 2. Keyboard: Tab order and visible focus.
        await page.evaluate(() => document.activeElement?.blur?.());
        run.checks.tabOrderNoSave = await tabOrder(page, 5);
        await page.locator('[data-action="settings"]').focus();
        await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
        run.checks.focusSettings = await focusInfo(page);
        run.captures.push(await shot(page, dir, '03-title-keyboard-focus-settings'));

        // 3. Settings dialog by keyboard: every tab, then Escape restores focus.
        await page.keyboard.press('Enter');
        await page.waitForSelector('.ui-settings', { timeout: 5000 });
        await page.waitForTimeout(350);
        run.checks.settingsFocusOnOpen = await focusInfo(page);
        run.checks.settings = await settingsMetrics(page);
        run.captures.push(await shot(page, dir, '04-settings-sound'));
        await page.locator('[data-settings-tab="sound"]').focus();
        await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
        run.checks.settingsDisplay = await settingsMetrics(page);
        run.captures.push(await shot(page, dir, '05-settings-display'));
        await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200);
        run.checks.settingsControls = await settingsMetrics(page);
        run.captures.push(await shot(page, dir, '06-settings-controls'));
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        run.checks.focusAfterSettingsEscape = await focusInfo(page);

        // 4. Gamepad: move to Réglages, open with A, close with B.
        await page.evaluate(() => document.activeElement?.blur?.());
        await page.locator('[data-action="new"]').focus();
        const padTrail = [];
        for (const action of ['right', 'right', 'down', 'right']) { await padPress(page, action); padTrail.push(`${action}:${(await focusInfo(page)).action}`); }
        run.checks.padTrail = padTrail;
        await page.locator('[data-action="settings"]').focus();
        await padPress(page, 'confirm'); await page.waitForTimeout(350);
        run.checks.padSettingsOpen = Boolean(await page.$('.ui-settings'));
        run.captures.push(await shot(page, dir, '07-settings-gamepad'));
        await padPress(page, 'back'); await page.waitForTimeout(350);
        run.checks.padFocusAfterBack = await focusInfo(page);
        run.checks.padSettingsClosed = !(await page.$('.ui-settings'));
        run.captures.push(await shot(page, dir, '08-title-gamepad-focus'));

        // 5. Nouvelle chronique without a save: the title must leave under a fully black curtain.
        await page.evaluate(() => { window.__qaTitle.leaves = []; });
        await page.locator('[data-action="new"]').click();
        const curtainSamples = [];
        for (let i = 0; i < 12; i += 1) {
          await page.waitForTimeout(120);
          curtainSamples.push(await page.evaluate(() => { const c = document.querySelector('.scene-transition'); return c ? Number(getComputedStyle(c).opacity).toFixed(2) : '-'; }));
          if (i === 3) run.captures.push(await shot(page, dir, '09-curtain-new'));
        }
        run.checks.curtainSamplesNew = curtainSamples;
        await page.waitForSelector('.opening-sequence', { timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1500);
        run.checks.titleLeavesNew = await page.evaluate(() => window.__qaTitle.leaves);
        run.captures.push(await shot(page, dir, '10-opening-first-seconds'));

        // 6. Title with a save (the new chronicle wrote its first autosave).
        await page.reload({ waitUntil: 'load' });
        await waitTitle(page);
        run.checks.titleSave = await titleMetrics(page);
        run.checks.initialFocusSave = await focusInfo(page);
        run.captures.push(await shot(page, dir, '11-title-save'));
        await page.evaluate(() => document.activeElement?.blur?.());
        run.checks.tabOrderSave = await tabOrder(page, 5);

        // 7. Confirmation before erasing, by keyboard; Escape keeps the chronicle and restores focus.
        await page.locator('[data-action="new"]').focus();
        await page.keyboard.press('Enter'); await page.waitForTimeout(300);
        run.checks.confirmFocus = await focusInfo(page);
        run.checks.confirm = await titleMetrics(page);
        run.captures.push(await shot(page, dir, '12-confirm-new'));
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
        run.checks.focusAfterConfirmEscape = await focusInfo(page);

        // 8. Continuer: the title leaves under the curtain.
        await page.evaluate(() => { window.__qaTitle.leaves = []; });
        await page.locator('[data-action="continue"]').click();
        await page.waitForTimeout(500);
        run.captures.push(await shot(page, dir, '13-curtain-continue'));
        await page.waitForTimeout(2500);
        run.checks.titleLeavesContinue = await page.evaluate(() => window.__qaTitle.leaves);
      } catch (error) {
        run.error = String(error?.stack ?? error).slice(0, 800);
        await shot(page, dir, '99-error').catch(() => null);
      }
      await browser.close();
      console.log(`${tag}: ${run.error ? 'ERROR' : 'ok'} · console ${run.consoleErrors.length} · failed ${run.failedRequests.length}`);
    }
  }
}

await writeFile(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`report: ${relative(process.cwd(), join(output, 'report.json'))}`);
