#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

// Isolated real player/registry/decoder checks. Campaign trigger/resume QA is separate.
const base = process.env.CIN8_BASE_URL ?? 'http://127.0.0.1:5173';
const output = resolve(process.env.CIN8_MEDIA_OUTPUT ?? 'tmp/cinematics/eight-slot-remaster/media-qa');
const rel = relative(resolve('tmp/cinematics/eight-slot-remaster'), output);
if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Output must remain in ignored eight-slot-remaster evidence.');
try { await access(output); throw new Error(`Refusing to overwrite ${output}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });
const brief = JSON.parse(await readFile('tools/cinematics/specs/production_eight_slot_remaster_brief.json', 'utf8'));
const modeFilter = process.env.CIN8_MEDIA_MODE;
const slotFilter = process.env.CIN8_MEDIA_SLOT;
if (slotFilter && !brief.slots.some((slot) => slot.id === slotFilter)) throw new Error('Unknown CIN8_MEDIA_SLOT');
if (modeFilter && !['natural', 'hold', 'skip', 'reduced', 'failure'].includes(modeFilter)) throw new Error('Unknown CIN8_MEDIA_MODE');
const viewports = [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 620, height: 780 }, { width: 390, height: 844 }];
const browser = await chromium.launch({ headless: true });
const report = { schemaVersion: 1, recordedAt: new Date().toISOString(), scope: 'ISOLATED_DEV_REAL_PLAYER_NOT_CAMPAIGN_ACCEPTANCE', cases: [], pass: false };
async function canvasMetrics(page) {
  return page.locator('.cinematic-overlay').evaluate((overlay) => {
    const canvas = overlay.querySelector('canvas');
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    let min = 255, max = 0, sum = 0, count = 0;
    if (context && canvas.width && canvas.height) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < pixels.length; i += 256) { const l = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3; min = Math.min(min, l); max = Math.max(max, l); sum += l; count++; }
    }
    const video = overlay.querySelector('video');
    return { width: canvas?.width, height: canvas?.height, hidden: canvas?.hidden, min, max, mean: count ? sum / count : 0,
      currentTime: video?.currentTime, duration: video?.duration, paused: video?.paused, framePump: overlay.dataset.cinematicFramePump,
      freezeSurface: overlay.dataset.cinematicFreezeSurface, inert: overlay.inert, role: overlay.getAttribute('role'),
      staticActors: document.querySelectorAll('.narrative-cast__actor').length };
  });
}
function assertCanvas(metrics, label) {
  if (metrics.width !== 1920 || metrics.height !== 1080 || metrics.hidden || metrics.mean < 5 || metrics.max - metrics.min < 40 || metrics.staticActors) {
    throw new Error(`${label}: no readable, unique real video canvas ${JSON.stringify(metrics)}`);
  }
}
async function run(slot, viewport, mode) {
  const context = await browser.newContext({ viewport, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const id = `${slot.id}-${viewport.width}x${viewport.height}-${mode}`;
  const errors = [], failures = [], requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', (request) => { if (request.url().includes('.mp4')) requests.push(request.url()); });
  let result;
  try {
    await page.goto(`${base}/?qa=1&cinematic=1&real=${slot.id}`, { waitUntil: 'networkidle' });
    const registry = await page.locator('[data-cinematic-registry]').innerText();
    for (const approved of brief.slots) if (!registry.includes(approved.id)) throw new Error(`Registry missing ${approved.id}`);
    if (registry.includes('serpent_general_reveal') || registry.includes('lion_champion_reveal')) throw new Error('Retired enemy video in registry');
    const before = await page.evaluate(() => JSON.stringify(localStorage));
    if (mode === 'failure') await page.route(`**/assets/cinematics/${slot.id}.mp4`, (route) => route.abort('failed'));
    const held = mode === 'hold' || mode === 'failure';
    await page.locator(`[data-cinematic-qa="${mode === 'reduced' ? 'reduced' : held ? 'real-selected-hold' : 'real-selected'}"]`).click();
    const measurements = {};
    if (mode !== 'failure' && mode !== 'reduced') {
      await page.waitForFunction(() => document.querySelector('.cinematic-overlay')?.getAttribute('data-cinematic-first-frame-painted') === 'true');
      measurements.moving = await canvasMetrics(page);
      assertCanvas(measurements.moving, id);
      await page.waitForTimeout(250);
      const movingAgain = await canvasMetrics(page);
      if (movingAgain.currentTime <= measurements.moving.currentTime) throw new Error('Decoder clock did not advance');
      measurements.clockDelta = movingAgain.currentTime - measurements.moving.currentTime;
      if (mode === 'skip') {
        const rect = await page.locator('.cinematic-overlay__skip').boundingBox();
        if (!rect || rect.x < 0 || rect.y < 0 || rect.x + rect.width > viewport.width || rect.y + rect.height > viewport.height) throw new Error('Skip control outside viewport');
        await page.screenshot({ path: resolve(output, `${id}.png`) });
        await page.keyboard.press('Escape');
      }
    }
    if (held) {
      const release = page.locator('[data-cinematic-release]');
      await release.waitFor({ state: 'visible', timeout: slot.currentDurationMs + 12000 });
      measurements.held = await canvasMetrics(page);
      if (mode === 'hold') {
        assertCanvas(measurements.held, id);
        if (!measurements.held.inert || measurements.held.freezeSurface !== 'canvas' || !measurements.held.paused) throw new Error('Hold is not passive frozen canvas');
      } else if (!['fallback', 'poster'].includes(measurements.held.freezeSurface)) throw new Error('Failed media retained an untrusted canvas');
      if (mode === 'failure') {
        measurements.fallbackText = await page.locator('.cinematic-overlay__fallback p').textContent();
        if (measurements.fallbackText !== slot.currentDescriptor.fallbackText) throw new Error('Fallback text does not match the current approved descriptor');
      }
      await page.screenshot({ path: resolve(output, `${id}.png`) });
      await release.focus();
      await page.keyboard.press('Enter');
    }
    await page.locator('.qa-lab__result').waitFor({ state: 'visible', timeout: slot.currentDurationMs + 12000 });
    const text = await page.locator('.qa-lab__result').innerText();
    const expected = mode === 'natural' || mode === 'hold' ? 'ended' : mode === 'skip' ? 'skipped' : mode === 'reduced' ? 'reduced-motion' : null;
    if (expected && !text.includes(expected)) throw new Error(`Expected ${expected}: ${text}`);
    // A failed <source> request may not dispatch HTMLVideoElement.error. The player's bounded
    // stall/hard timeout is an intentional recovery path, also covered by CinematicPlayer tests.
    if (mode === 'failure' && !/error|autoplay-rejected|unavailable|timeout/.test(text)) throw new Error(`Expected safe missing-media result: ${text}`);
    const residues = await page.locator('.cinematic-overlay,[data-cinematic-release]').count();
    if (residues) throw new Error(`Player residue: ${residues}`);
    if (before !== await page.evaluate(() => JSON.stringify(localStorage))) throw new Error('Isolated player modified saves');
    const unexpected = failures.filter((failure) => !(failure.url.endsWith(`${slot.id}.mp4`) && (mode === 'failure' || (mode === 'skip' && failure.error === 'net::ERR_ABORTED'))));
    if (errors.length || unexpected.length) throw new Error(`Browser diagnostics ${JSON.stringify({ errors, unexpected })}`);
    result = { id, slot: slot.id, viewport, mode, measurements, resultText: text, residues, saveBytesUnchanged: true,
      requests, expectedFailedRequests: failures.length, errors, pass: true };
  } catch (error) {
    result = { id, slot: slot.id, viewport, mode, pass: false, error: error.stack, errors, failures };
    await page.screenshot({ path: resolve(output, `${id}-failed.png`) }).catch(() => {});
  } finally { await context.close(); }
  report.cases.push(result);
  await writeFile(resolve(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${id}${result.pass ? '' : `: ${result.error}`}`);
}
try {
  for (const slot of brief.slots.filter((entry) => !slotFilter || entry.id === slotFilter)) {
    if (!modeFilter || modeFilter === 'natural') await run(slot, viewports[0], 'natural');
    if (!modeFilter || modeFilter === 'hold') await run(slot, viewports[3], 'hold');
    for (const viewport of viewports) {
      if (!modeFilter || modeFilter === 'skip') await run(slot, viewport, 'skip');
      if (!modeFilter || modeFilter === 'reduced') await run(slot, viewport, 'reduced');
    }
    if (!modeFilter || modeFilter === 'failure') await run(slot, viewports[3], 'failure');
  }
  report.pass = report.cases.every((entry) => entry.pass);
} finally { await browser.close(); }
await writeFile(resolve(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Eight-slot isolated media QA: ${report.cases.filter((entry) => entry.pass).length}/${report.cases.length}`);
if (!report.pass) process.exitCode = 1;
