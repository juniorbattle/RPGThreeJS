/**
 * OD-2026-11-13-F (Q1) — a whole chronicle played in the browser, from the title to an ending, by real UI inputs.
 *
 * Runs against a DEV server the caller started (Claude: `preview_start`, port 5183); it starts no server of its own.
 * Every step is a click on the game's own controls: the title, the opening's "Passer", each dialogue box and answer,
 * the map's POI and "Se rendre", refuges' "Reprendre la route", the Journey panels, the Tournament's board. The answer
 * and the route POI are chosen by the QA policy of the unit tests (`chooseAnswer`, `nextRoutePoi`), computed in the page
 * from the live state; the DEV bootstrap is rewritten in flight only to expose the GameApp instance for reading.
 * Fights are not played move by move: each one is won with the tactical runtime's DEV QA control "Victoire"
 * (`?qa=1&cin6a=golden`), which ends the wave by the runtime's own path and posts a real result, then the result card's
 * "Continuer la chronique" is clicked. Living tableaux are left with "Passer" once on screen.
 *
 * Env: FULL_QA_BASE_URL (default http://127.0.0.1:5183), FULL_QA_PLAN (respect | balance | fearLastStand | fearFate),
 * FULL_QA_OUTPUT (under tmp/, never overwritten), FULL_QA_VIEWPORT (1440x810), FULL_QA_OS_MOTION=1 (emulate
 * prefers-reduced-motion: reduce), FULL_QA_START (new | lion-end: a short pass from the save the current Lion writes),
 * FULL_QA_STOP_AFTER (a chapter id: stop once that chapter's first fight is won; default: the ending).
 */
import { mkdir, access, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const base = process.env.FULL_QA_BASE_URL ?? 'http://127.0.0.1:5183';
const planKey = process.env.FULL_QA_PLAN ?? 'respect';
const start = process.env.FULL_QA_START ?? 'new';
const stopAfter = process.env.FULL_QA_STOP_AFTER ?? null;
const osMotion = process.env.FULL_QA_OS_MOTION === '1' ? 'reduce' : 'no-preference';
const [width, height] = (process.env.FULL_QA_VIEWPORT ?? '1440x810').split('x').map(Number);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(process.env.FULL_QA_OUTPUT ?? `tmp/full-chronicle/${planKey}-${start}-${osMotion}-${stamp}`);
const rel = relative(resolve('tmp'), output);
if (isAbsolute(rel) || rel.startsWith('..')) throw new Error('Output must stay in ignored tmp/');
try { await access(output); throw new Error('Refusing to overwrite evidence'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(output, { recursive: true });

const report = {
  schemaVersion: 1, recordedAt: new Date().toISOString(), commit: execSync('git rev-parse HEAD').toString().trim(),
  base, plan: planKey, start, stopAfter, osMotion, viewport: { width, height },
  method: 'REAL_UI_INPUTS_QA_POLICY_COMBATS_WON_BY_RUNTIME_QA_VICTORY',
  chapters: [], choices: [], moves: [], fights: [], dialogues: [], livingSkipped: [], panels: [], refuges: [], board: [],
  captures: [], consoleErrors: [], pageErrors: [], failedRequests: [], warnings: 0, end: null, pass: false,
};
const started = Date.now();
const log = (line) => console.log(`[${((Date.now() - started) / 1000).toFixed(0).padStart(4)}s] ${line}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width, height }, reducedMotion: osMotion });
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') report.consoleErrors.push(message.text().slice(0, 400));
  if (message.type() === 'warning') report.warnings += 1;
});
page.on('pageerror', (error) => report.pageErrors.push(String(error?.stack ?? error).slice(0, 600)));
page.on('requestfailed', (request) => report.failedRequests.push(`${request.failure()?.errorText ?? 'failed'} ${request.url()}`));
page.on('response', (response) => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
// Read access only: the bootstrap keeps its GameApp in a module constant; this exposes the same instance to the page.
await page.route('**/src/main.ts*', async (route) => {
  const response = await route.fetch();
  const source = await response.text();
  const pattern = /const app = new GameApp\(root, canvas\);/;
  if (!pattern.test(source)) throw new Error('DEV bootstrap observation hook missing');
  await route.fulfill({ response, body: source.replace(pattern, (match) => `${match}window.__fullQaApp = app;`) });
});

async function capture(name) {
  const file = `${String(report.captures.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: resolve(output, file) });
  report.captures.push(file);
  log(`capture ${file}`);
}
const live = () => page.evaluate(() => {
  const app = window.__fullQaApp;
  if (!app) return null;
  const s = app.state;
  return { mode: app.mode, surface: document.body.dataset.campaignSurface ?? null, runId: s.run.id, node: s.run.currentNodeId,
    status: s.run.status, reputation: s.reputation, gold: s.gold, endingId: s.endingId, ending: s.campaign?.ending ?? null,
    stage: s.campaign?.finalAct?.stage ?? null, combatId: app.combat?.session?.config?.id ?? null };
});

await page.goto(`${base}/?qa=1&cin6a=golden`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__fullQaApp), null, { timeout: 30000 });
// The QA policy, from the same modules the unit tests use, evaluated on the live state.
await page.evaluate(async (key) => {
  const chain = await import('/src/qa/fullCampaignChain.ts');
  const driver = await import('/src/qa/plateauDriver.ts');
  const content = await import('/src/game/contextualDialogueContent.ts');
  const progression = await import('/src/game/plateauProgression.ts');
  const plan = chain.CHRONICLE_PLANS[key];
  const scenario = () => chain.chapterScenario(plan, progression.runPlateauId(window.__fullQaApp.state));
  window.__fullQaPolicy = {
    chapter: () => progression.runPlateauId(window.__fullQaApp.state),
    nextPoi: () => driver.nextRoutePoi(window.__fullQaApp.state, scenario()),
    answer: (sequenceId, stepId) => {
      const state = window.__fullQaApp.state;
      const sequence = content.resolveGameDialogue(sequenceId, state)?.sequence;
      const step = sequence?.steps.find((candidate) => candidate.id === stepId);
      if (!step?.choices?.length) return null;
      return driver.chooseAnswer(state, scenario(), sequence, stepId, step.choices).text;
    },
  };
  if (!plan) throw new Error(`Unknown plan ${key}`);
}, planKey);

if (start === 'lion-end') {
  // A short pass: the save the current Lion writes when the QA driver plays it, then the title's "Continuer".
  await page.evaluate(async (key) => {
    const chain = await import('/src/qa/fullCampaignChain.ts');
    const store = await import('/src/game/store.ts');
    const lionEnd = chain.playChronicle(chain.CHRONICLE_PLANS[key]).saved.lion;
    new store.SaveRepository().saveAuto(lionEnd);
  }, planKey);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__fullQaApp), null, { timeout: 30000 });
  await page.evaluate(async (key) => {
    const chain = await import('/src/qa/fullCampaignChain.ts');
    const driver = await import('/src/qa/plateauDriver.ts');
    const content = await import('/src/game/contextualDialogueContent.ts');
    const progression = await import('/src/game/plateauProgression.ts');
    const plan = chain.CHRONICLE_PLANS[key];
    const scenario = () => chain.chapterScenario(plan, progression.runPlateauId(window.__fullQaApp.state));
    window.__fullQaPolicy = {
      chapter: () => progression.runPlateauId(window.__fullQaApp.state),
      nextPoi: () => driver.nextRoutePoi(window.__fullQaApp.state, scenario()),
      answer: (sequenceId, stepId) => {
        const state = window.__fullQaApp.state;
        const sequence = content.resolveGameDialogue(sequenceId, state)?.sequence;
        const step = sequence?.steps.find((candidate) => candidate.id === stepId);
        return step?.choices?.length ? driver.chooseAnswer(state, scenario(), sequence, stepId, step.choices).text : null;
      },
    };
  }, planKey);
}

const seenChapters = new Set();
let lastProgress = Date.now();
let lastSignature = '';
let titleSeenAfterStart = false;
let stopReached = false;
let openingSkipped = false;
let branch = 'none';
let leftTitle = false;

async function chapterBookkeeping(state) {
  const chapter = await page.evaluate(() => window.__fullQaPolicy.chapter());
  if (!seenChapters.has(chapter) && state.surface === 'poi-map') {
    seenChapters.add(chapter);
    // The map comes in by a crossfade from the last scene: the capture waits for the leaving stage to be gone.
    await page.waitForFunction(() => !document.querySelector('.narrative-stage--leaving'), null, { timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(600);
    report.chapters.push({ chapter, runId: state.runId, reputation: state.reputation, at: Math.round((Date.now() - started) / 1000) });
    await capture(`${chapter}-map`);
  }
  return chapter;
}

/**
 * A real mouse click on a control of the tactical frame, once a hit test shows the control on top. The frame redraws
 * every animation frame, so Playwright never deems its buttons "stable"; the hit test replaces that wait, and a control
 * covered by something else is reported instead of clicked.
 */
async function clickOnTop(frame, selector) {
  const locator = frame.locator(selector).first();
  if (!(await locator.isVisible().catch(() => false))) return false;
  const probe = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, top: hit === element || element.contains(hit) ? null : (hit ? `${hit.tagName}.${hit.className}` : 'nothing') };
  });
  if (probe.top) { (report.coveredControls ??= []).push({ selector, coveredBy: probe.top }); return false; }
  const offset = await page.locator('iframe.combat-frame').first().boundingBox();
  await page.mouse.click((offset?.x ?? 0) + probe.x, (offset?.y ?? 0) + probe.y);
  return true;
}

async function playCombat(state) {
  const frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat.html'));
  if (!frame) { branch = 'combat:no-frame'; return false; }
  branch = 'combat:frame';
  // The combat school and the boss card open on a new chronicle's first fights: closed as a player closes them.
  for (const close of ['#tutorial:not(.hidden) [data-action="skip"]', '#boss-tutorial:not(.hidden) [data-action="start"]']) {
    if (await clickOnTop(frame, close)) {
      report.tutorialsClosed = (report.tutorialsClosed ?? 0) + 1;
      return true;
    }
  }
  if (await frame.locator('#combat-result-action').isVisible().catch(() => false)) {
    if (!(await clickOnTop(frame, '#combat-result-action'))) return false;
    const fight = report.fights.at(-1);
    if (fight) fight.resultClicked = true;
    if (fight && !fight.logged) { fight.logged = true; log(`fight won: ${fight.chapter} ${fight.combatId}`); }
    if (stopAfter && fight?.chapter === stopAfter) stopReached = true;
    return true;
  }
  const victory = frame.locator('[data-qa="victory"]');
  if (await victory.count() && !(report.fights.at(-1)?.combatId === state.combatId && report.fights.at(-1)?.qaVictory && !report.fights.at(-1)?.resultClicked)) {
    const chapter = await page.evaluate(() => window.__fullQaPolicy.chapter());
    if (!report.fights.some((fight) => fight.chapter === chapter)) await capture(`${chapter}-first-fight`);
    // The tutorial cards may cover the QA aside: the control is pressed as a DOM click, through the runtime's handler.
    await victory.evaluate((button) => button.click());
    report.fights.push({ chapter, combatId: state.combatId, node: state.node, qaVictory: true, resultClicked: false });
    return true;
  }
  return false;
}

/** Every surface the loop can act on, read in one round trip. */
const probe = () => page.evaluate(() => {
  const shown = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.01;
  };
  const dialogue = document.querySelector('.dialogue[data-dialogue-sequence]');
  const choices = dialogue ? [...dialogue.querySelectorAll('.dialogue-choice')].filter(shown) : [];
  const journey = [...document.querySelectorAll('[data-journey-continue]')].find((button) => shown(button) && !button.disabled);
  const acknowledge = [...document.querySelectorAll('.poi-encounter button, [data-poi-encounter-action]')].find(shown);
  return {
    curtain: [...document.querySelectorAll('.scene-transition')].some(shown),
    opening: shown(document.querySelector('.opening-sequence [data-skip]')),
    living: shown(document.querySelector('.living-tableau__skip')),
    defeat: Boolean(document.querySelector('#defeat-title')),
    dialogue: dialogue && shown(dialogue) ? { sequence: dialogue.dataset.dialogueSequence, step: dialogue.dataset.dialogueStep ?? null,
      choices: choices.map((button) => ({ text: (button.textContent ?? '').replace(/\s+/g, ' ').trim(), disabled: button.disabled })) } : null,
    journey: journey ? (journey.textContent ?? '').replace(/\s+/g, ' ').trim() : null,
    refuge: shown(document.querySelector('.exploration-stop [data-action="continue"]')),
    board: shown(document.querySelector('[data-board-action="next"]')),
    acknowledge: Boolean(acknowledge),
  };
});

report.transientRetries = 0;
try {
for (let turn = 0; turn < 40000; turn += 1) {
  if (report.pageErrors.length) { log(`page error: ${report.pageErrors[0]}`); break; }
  try {
  const state = await live();
  if (!state) { await page.waitForTimeout(250); continue; }
  const signature = JSON.stringify(state) + report.dialogues.length + report.choices.length + report.fights.length + (report.steps ?? 0);
  if (signature !== lastSignature) { lastSignature = signature; lastProgress = Date.now(); }
  if (Date.now() - lastProgress > 90000) {
    await capture('stuck');
    report.stuck = { state, branch, html: (await page.evaluate(() => document.body.innerHTML)).slice(0, 4000) };
    log(`stuck in branch ${branch}: ${JSON.stringify(state)}`);
    break;
  }
  if (stopReached && state.mode !== 'COMBAT') {
    await page.waitForTimeout(1500);
    await capture(`${stopAfter}-after-first-fight`);
    report.end = { stoppedAfter: stopAfter, ...(await live()) };
    report.pass = true;
    break;
  }
  if (state.mode !== 'TITLE') leftTitle = true;
  const seen = await probe();
  // The scene transition curtain: nothing to press while it is up.
  if (seen.curtain) { branch = 'curtain'; await page.waitForTimeout(120); continue; }

  if (state.mode === 'TITLE') {
    branch = 'title';
    if (titleSeenAfterStart && leftTitle) {
      report.end = state;
      report.pass = state.stage === 'completed' && Boolean(state.ending);
      await capture('title-after-ending');
      break;
    }
    if (titleSeenAfterStart) { await page.waitForTimeout(250); continue; }
    titleSeenAfterStart = true;
    await capture('title');
    if (start === 'lion-end') { await page.locator('[data-action="continue"]').click(); continue; }
    await page.locator('[data-action="new"]').click();
    if (await page.locator('[data-action="confirm-new"]').isVisible().catch(() => false)) await page.locator('[data-action="confirm-new"]').click();
    continue;
  }
  if (!openingSkipped && seen.opening) {
    branch = 'opening';
    await page.waitForTimeout(1500);
    await capture('opening');
    await page.locator('.opening-sequence [data-skip]').click({ timeout: 3000 }).catch(() => undefined);
    openingSkipped = true;
    log('opening skipped with Passer');
    continue;
  }
  if (seen.living) {
    branch = 'living';
    await page.waitForTimeout(1000);
    const chapter = await page.evaluate(() => window.__fullQaPolicy.chapter());
    report.livingSkipped.push({ chapter, node: state.node, at: Math.round((Date.now() - started) / 1000) });
    await page.locator('.living-tableau__skip').click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    continue;
  }
  if (state.mode === 'COMBAT') {
    branch = 'combat';
    if (!(await playCombat(state))) await page.waitForTimeout(250);
    continue;
  }
  if (seen.defeat) { await capture('defeat'); report.defeat = state; log('unexpected defeat screen'); break; }

  if (seen.dialogue) {
    branch = 'dialogue';
    const { sequence: sequenceId, step: stepId, choices } = seen.dialogue;
    if (report.dialogues.at(-1)?.id !== sequenceId) {
      report.dialogues.push({ id: sequenceId, chapter: await page.evaluate(() => window.__fullQaPolicy.chapter()) });
    }
    // Right after an answer, the dialogue view disables every choice while the scene moves on: nothing to press yet.
    if (choices.length && choices.every((choice) => choice.disabled)) { await page.waitForTimeout(120); continue; }
    if (choices.length) {
      const wanted = await page.evaluate(([sequence, step]) => window.__fullQaPolicy.answer(sequence, step), [sequenceId, stepId]);
      const key = (wanted ?? '').replace(/\s+/g, ' ').trim().slice(0, 40).toLocaleLowerCase('fr');
      const index = wanted ? choices.findIndex((choice) => choice.text.toLocaleLowerCase('fr').includes(key)) : 0;
      if (index < 0) throw new Error(`Answer not on screen in ${sequenceId}:${stepId}: ${wanted} | on screen: ${JSON.stringify(choices.map((choice) => choice.text))}`);
      if (choices[index].disabled) throw new Error(`Chosen answer disabled in ${sequenceId}:${stepId}`);
      report.choices.push({ sequence: sequenceId, step: stepId, text: (wanted ?? choices[index].text).slice(0, 120) });
      await page.locator('.dialogue .dialogue-choice:visible').nth(index).click({ timeout: 4000 });
      await page.waitForTimeout(150);
      continue;
    }
    await page.locator('.dialogue .dialogue__box').first().click({ timeout: 4000 });
    report.steps = (report.steps ?? 0) + 1;
    await page.waitForTimeout(60);
    continue;
  }
  if (seen.journey) {
    branch = 'journey';
    const chapter = await page.evaluate(() => window.__fullQaPolicy.chapter());
    const panelText = (await page.locator('body').innerText()).slice(0, 2000);
    report.panels.push({ chapter, label: seen.journey, ending: state.ending, stage: state.stage });
    await capture(`${chapter}-panel-${report.panels.length}`);
    if (/Fin de la chronique/i.test(panelText)) report.endPanel = { chapter, label: seen.journey, text: panelText.split(String.fromCharCode(10)).filter(Boolean).slice(0, 12) };
    await page.locator('[data-journey-continue]:visible:not(:disabled)').first().click({ timeout: 4000 });
    continue;
  }
  if (seen.refuge) {
    branch = 'refuge';
    report.refuges.push({ node: state.node });
    await page.locator('.exploration-stop [data-action="continue"]').click({ timeout: 4000 });
    continue;
  }
  if (state.surface === 'tournament-board' && seen.board) {
    branch = 'board';
    if (!report.board.length) await capture('finale-tournament-board');
    report.board.push(state.node);
    await page.locator('[data-board-action="next"]').first().click({ timeout: 4000 });
    continue;
  }
  if (state.surface === 'poi-map' && state.mode === 'TRAVEL') {
    branch = 'map';
    await chapterBookkeeping(state);
    const next = await page.evaluate(() => window.__fullQaPolicy.nextPoi());
    if (!next) { await page.waitForTimeout(300); continue; }
    await page.locator(`[data-poi-id="${next}"]`).click({ timeout: 4000 });
    const move = page.locator('[data-poi-action="move"]:not(:disabled)');
    if (!(await move.count())) { await page.waitForTimeout(300); continue; }
    report.moves.push(next);
    await move.click({ timeout: 4000 });
    await page.waitForTimeout(200);
    continue;
  }
  // Reward cards and anything else that waits for an acknowledgement.
  if (seen.acknowledge) { branch = 'acknowledge'; await page.locator('.poi-encounter button:visible, [data-poi-encounter-action]:visible').first().click(); continue; }
  branch = `idle:${state.mode}:${state.surface}`;
  await page.waitForTimeout(150);
  } catch (error) {
    // A control that moved or left the DOM mid-click (a crossfade, a re-render): retried on the next turn; a real
    // blockage shows up as no progress for 90 s.
    if (/Answer not on screen|Chosen answer disabled|Unknown plan/.test(String(error))) throw error;
    report.transientRetries += 1;
    if (report.transientRetries % 10 === 1) log(`retry after: ${String(error.message ?? error).split(String.fromCharCode(10))[0]}`);
    await page.waitForTimeout(400);
  }
}

} catch (error) {
  report.failure = String(error?.message ?? error).slice(0, 800);
  log(`failure: ${report.failure}`);
  await capture('failure').catch(() => undefined);
}

report.durationSeconds = Math.round((Date.now() - started) / 1000);
report.final = await live().catch(() => null);
report.consoleClean = report.consoleErrors.length === 0 && report.pageErrors.length === 0;
if (!report.consoleClean) report.pass = false;
await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
log(`done pass=${report.pass} chapters=${report.chapters.map((entry) => entry.chapter).join(',')} fights=${report.fights.length} choices=${report.choices.length} errors=${report.consoleErrors.length + report.pageErrors.length}`);
await browser.close();
process.exit(report.pass ? 0 : 1);
