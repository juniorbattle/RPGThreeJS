import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.CIN6D_BASE_URL ?? 'http://127.0.0.1:5173';
const OUTPUT_DIR = resolve(process.env.CIN6D_OUTPUT_DIR ?? resolve(process.cwd(), 'tmp/cinematics/cin6d/browser-qa'));
const VIEWPORT = { width: 1920, height: 1080 };

function diagnosticsFor(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [] };
  page.on('console', (message) => { if (message.type() === 'error') diagnostics.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
  return diagnostics;
}

async function readStage(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.narrative-stage');
    if (!stage) return null;
    return {
      tableau: stage.getAttribute('data-narrative-tableau'),
      grammar: stage.getAttribute('data-narrative-grammar'),
      surface: stage.getAttribute('data-narrative-media-surface'),
      castOwnership: stage.getAttribute('data-narrative-cast-ownership'),
      actors: [...stage.querySelectorAll('[data-actor-id]')].map((actor) => actor.getAttribute('data-actor-id')),
      dialogueId: stage.querySelector('.dialogue')?.getAttribute('data-dialogue-sequence') ?? null,
      dialogueStep: stage.querySelector('.dialogue')?.getAttribute('data-dialogue-step') ?? null,
      background: stage.querySelector('.narrative-scene-surface__environment')?.getAttribute('style') ?? '',
      choices: [...stage.querySelectorAll('.dialogue-choice:not([disabled])')].map((choice) => choice.textContent?.replace(/\s+/g, ' ').trim()),
    };
  });
}

async function advanceDialogue(page, sequenceId, choiceIndex = 0) {
  const dialogue = page.locator(`.dialogue[data-dialogue-sequence="${sequenceId}"]`);
  for (let index = 0; index < 80; index += 1) {
    if (!await dialogue.count()) return;
    const choices = dialogue.locator('.dialogue-choice:not([disabled]):visible');
    const count = await choices.count();
    if (count) await choices.nth(Math.min(choiceIndex, count - 1)).click();
    else await dialogue.locator('.dialogue__box').click({ force: true });
    await page.waitForTimeout(65);
  }
  throw new Error(`${sequenceId}: dialogue did not complete.`);
}

async function waitForTableau(page, tableauId) {
  await page.waitForFunction((id) => document.querySelector('.narrative-stage')?.getAttribute('data-narrative-tableau') === id, tableauId, { timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector('.narrative-stage')?.getAttribute('data-narrative-media-surface') !== null, undefined, { timeout: 30_000 });
  return readStage(page);
}

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT });
const page = await context.newPage();
const diagnostics = diagnosticsFor(page);
const result = { schemaVersion: 1, viewport: VIEWPORT, pass: false };
try {
  await page.goto(`${BASE_URL}/?journey=cinematic&presentation=narrative&media=stills&qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-action="new"]').click();
  await page.locator('[data-prologue-skip]').click();
  await page.locator('.dialogue[data-dialogue-sequence="acte_ouverture"]').waitFor({ state: 'visible', timeout: 30_000 });
  await advanceDialogue(page, 'acte_ouverture');
  await waitForTableau(page, 'CAMP_DEPARTURE_TABLEAU');
  await page.locator('[data-journey-continue]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('[data-journey-continue]').click();

  await page.locator('.dialogue[data-dialogue-sequence="lion_briefing"]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(450);
  const audience = await readStage(page);
  const audienceShot = resolve(OUTPUT_DIR, '01-camp-to-audience.png');
  await page.screenshot({ path: audienceShot, fullPage: false });
  await advanceDialogue(page, 'lion_briefing', 0);

  const road = await waitForTableau(page, 'AUDIENCE_ROAD_DEPARTURE_TABLEAU');
  await page.locator('[data-journey-continue]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(650);
  const roadShot = resolve(OUTPUT_DIR, '02-audience-to-road.png');
  await page.screenshot({ path: roadShot, fullPage: false });
  if (road?.grammar !== 'DEPARTURE' || road.surface !== 'STILL' || road.castOwnership !== 'STAGE_OWNS_CAST') {
    throw new Error(`Audience-road presentation mismatch: ${JSON.stringify(road)}`);
  }
  if (road.actors.join('|') !== 'sage_seraphine|alistair|maelor' || road.actors.includes('alaric')) {
    throw new Error(`Audience-road cast mismatch: ${JSON.stringify(road.actors)}`);
  }
  if (/lion_briefing|audience/i.test(road.background)) throw new Error(`Audience backdrop leaked into road: ${road.background}`);
  await page.locator('[data-journey-continue]').click();

  await page.locator('.dialogue[data-dialogue-sequence="pre_opening_trail"]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(450);
  const threat = await readStage(page);
  const threatShot = resolve(OUTPUT_DIR, '03-road-to-opening-threat.png');
  await page.screenshot({ path: threatShot, fullPage: false });
  await advanceDialogue(page, 'pre_opening_trail');
  await page.locator('iframe.combat-frame').waitFor({ state: 'attached', timeout: 30_000 });
  const combatHandoff = await page.evaluate(() => ({
    combatFrames: document.querySelectorAll('iframe.combat-frame').length,
    narrativeStages: document.querySelectorAll('.narrative-stage').length,
    cinematicOverlays: document.querySelectorAll('.cinematic-overlay').length,
    travelViews: document.querySelectorAll('.travel-view').length,
  }));
  if (combatHandoff.combatFrames !== 1 || combatHandoff.narrativeStages || combatHandoff.cinematicOverlays || combatHandoff.travelViews) {
    throw new Error(`Opening combat handoff retained stale presentation: ${JSON.stringify(combatHandoff)}`);
  }
  const actionableErrors = diagnostics.consoleErrors.filter((message) => !message.includes('[VFX Preview]'));
  if (actionableErrors.length || diagnostics.pageErrors.length || diagnostics.requestFailures.length) {
    throw new Error(`Browser diagnostics: ${JSON.stringify({ ...diagnostics, consoleErrors: actionableErrors })}`);
  }
  Object.assign(result, {
    pass: true,
    audience,
    audienceRoad: road,
    openingThreat: threat,
    combatHandoff,
    choiceTruth: { selectedIndex: 0, intent: 'accept Alaric mission', canonicalOrderChanged: false },
    screenshots: [audienceShot, roadShot, threatShot],
    diagnostics,
  });
} catch (error) {
  Object.assign(result, { error: error instanceof Error ? error.stack : String(error), diagnostics });
} finally {
  await context.close();
  await browser.close();
}
await writeFile(resolve(OUTPUT_DIR, 'results.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
