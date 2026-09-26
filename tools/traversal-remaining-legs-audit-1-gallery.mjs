/**
 * TRAVERSAL-REMAINING-LEGS-AUDIT-1 current-production gallery.
 *
 * Observation only. Runs the unmodified application through an in-process Vite DEV server with
 * `?qa=1&cin6a=golden` (Journey presentation, production VIDEO media policy, combat QA victory button
 * only). Durable saves are built through the real RunSystem (`createRunState` + `enterRunNode`),
 * then resumed with the ordinary title-screen Continue button. The app instance is exposed to the
 * QA page only by rewriting the served `main.ts` response inside Playwright; no source hook exists.
 *
 * Run from the repository root: node tools/traversal-remaining-legs-audit-1-gallery.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/traversal-remaining-legs-audit-1-browser';
const port = 5203;
const base = `http://127.0.0.1:${port}/`;
const query = '?qa=1&cin6a=golden';
const DESKTOP = { width: 1440, height: 810 };
const MOBILE = { width: 390, height: 844 };
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');

const index = {
  task: 'TRAVERSAL-REMAINING-LEGS-AUDIT-1',
  baseline: 'd300ca95487732a459b50cfc82bf2407bb4a264e',
  url: base + query,
  method: 'Unmodified app, RunSystem-built durable save, title Continue, real UI clicks. Only combat uses the DEV QA victory control.',
  runs: [],
  captures: [],
  errors: [],
};

// Partial runs (--only=...) merge into the existing index instead of discarding earlier evidence.
try {
  const previous = JSON.parse(await readFile(`${output}/gallery-index.json`, 'utf8'));
  if (Array.isArray(previous?.runs)) index.runs.push(...previous.runs);
  if (Array.isArray(previous?.captures)) index.captures.push(...previous.captures);
  if (Array.isArray(previous?.errors)) index.errors.push(...previous.errors);
} catch { /* first run */ }

await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });

async function pageAt(viewport = DESKTOP) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', error => index.errors.push(`pageerror: ${error.message}`));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__galleryApp = app;',
    ) });
  });
  await page.goto(base + query);
  await page.waitForFunction(() => window.__galleryApp && document.querySelector('.title-screen'));
  return page;
}

/** Durable save: the real RunSystem path to `targetId`, preferring `prefer` at braids. */
async function installSave(page, { targetId, resolveTarget, seed = 6101, prefer = [], flags = {}, gold = 160 }) {
  await page.evaluate(async ({ targetId, resolveTarget, seed, prefer, flags, gold }) => {
    const { createInitialState, SaveRepository } = await import('/src/game/store.ts');
    const { createRunState, enterRunNode } = await import('/src/game/runSystem.ts');
    const state = createInitialState();
    state.run = createRunState(seed);
    state.currentNodeId = state.run.currentNodeId;
    state.visitedNodeIds = [...state.run.visitedNodeIds];
    state.flags.prologueSeen = true;
    Object.assign(state.flags, flags);
    state.gold = gold;
    const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
    const path = [state.run.currentNodeId];
    while (path.at(-1) !== targetId) {
      const links = nodes.get(path.at(-1))?.links ?? [];
      const next = links.find(id => prefer.includes(id)) ?? links[0];
      if (!next) throw new Error(`No path to ${targetId}`);
      path.push(next);
    }
    for (const id of path.slice(1)) {
      if (!state.resolvedNodeIds.includes(state.currentNodeId)) state.resolvedNodeIds.push(state.currentNodeId);
      const node = nodes.get(state.currentNodeId);
      if (node?.type === 'refuge') {
        state.flags[`refugeSecured:${node.id}`] = true;
        state.flags[`clanArrival:${node.id}`] = true;
      }
      const entered = enterRunNode(state.run, id);
      if (!entered) throw new Error(`Could not enter ${id}`);
      state.currentNodeId = entered.id;
      state.visitedNodeIds = [...state.run.visitedNodeIds];
      state.stepCounter += 1;
    }
    if (resolveTarget && !state.resolvedNodeIds.includes(targetId)) state.resolvedNodeIds.push(targetId);
    new SaveRepository().saveAuto(state);
    localStorage.setItem('rpg-tutorial-seen', '1');
    localStorage.setItem('rpg-boss-tutorial-seen', '1');
  }, { targetId, resolveTarget, seed, prefer, flags, gold });
  await page.reload();
  await page.waitForFunction(() => window.__galleryApp && document.querySelector('.title-screen'));
  await page.locator('.title-screen [data-action="continue"]').click();
}

async function snapshot(page) {
  return page.evaluate(() => {
    const visible = element => element && element.getBoundingClientRect().width > 0
      && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none';
    const app = window.__galleryApp;
    const stage = [...document.querySelectorAll('.narrative-stage')].find(visible);
    const dialogue = [...document.querySelectorAll('.dialogue')].find(visible);
    const text = dialogue?.querySelector('.dialogue__text');
    const cinematic = [...document.querySelectorAll('.cinematic-overlay')].find(visible);
    const video = cinematic?.querySelector('video');
    const journey = [...document.querySelectorAll('.journey-overlay')].find(visible);
    const hub = [...document.querySelectorAll('.exploration-stop')].find(visible);
    const traversal = document.querySelector('.traversal-t0');
    const panel = traversal?.querySelector('[data-traversal-event-panel]');
    const environment = stage?.querySelector('.narrative-scene-surface__environment');
    const backgrounds = [...document.querySelectorAll('.narrative-stage img, .narrative-stage video, .journey-surface img, .journey-surface video')]
      .filter(visible).map(element => element.currentSrc || element.getAttribute('src')).filter(Boolean);
    return {
      node: app?.state?.run?.currentNodeId ?? null,
      resolved: app?.state?.resolvedNodeIds?.includes(app?.state?.run?.currentNodeId) ?? false,
      mode: document.body.dataset.mode ?? null,
      transition: Boolean(document.querySelector('.scene-transition')),
      combat: Boolean(document.querySelector('.combat-frame')),
      cinematic: cinematic ? { src: video?.currentSrc || video?.getAttribute('src') || null, time: video?.currentTime ?? 0,
        skip: Boolean(cinematic.querySelector('.cinematic-overlay__skip:not([hidden]):not([disabled])')) } : null,
      stage: stage ? {
        tableau: stage.dataset.narrativeTableau ?? null,
        family: stage.dataset.visualFamily ?? null,
        beat: stage.dataset.presentationBeat ?? null,
        mode: stage.dataset.presentationMode ?? null,
        readiness: stage.dataset.narrativeSurfaceReadiness ?? null,
        castOwnership: stage.dataset.narrativeCastOwnership ?? null,
        environment: environment?.style.backgroundImage || null,
      } : null,
      dialogue: dialogue ? {
        sequence: dialogue.dataset.dialogueSequence ?? null,
        step: dialogue.dataset.dialogueStep ?? null,
        actor: dialogue.dataset.dialogueActor ?? null,
        choices: [...dialogue.querySelectorAll('.dialogue__choices button')].filter(visible).map(button => button.textContent.trim()),
        revealed: !text?.dataset.finalText || text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText,
      } : null,
      journey: journey ? {
        title: journey.querySelector('h1,h2,.journey-overlay__title')?.textContent?.trim() ?? null,
        choices: [...journey.querySelectorAll('[data-journey-choice]')].map(button => button.dataset.journeyChoice),
        continueLabel: journey.querySelector('[data-journey-continue]')?.textContent?.trim() ?? null,
      } : null,
      hub: hub ? { node: hub.dataset.refugeNode, family: hub.dataset.visualFamily, background: hub.dataset.backgroundUrl,
        ready: hub.dataset.backgroundReady } : null,
      traversal: traversal ? { phase: traversal.dataset.phase, progress: Number(traversal.dataset.progress),
        transition: traversal.dataset.transition ?? null, interruption: traversal.dataset.interruption ?? null,
        category: panel && !panel.hidden ? panel.dataset.category : null, grammar: panel && !panel.hidden ? panel.dataset.grammar : null,
        fork: Boolean(document.querySelector('.traversal-fork-overlay')) } : null,
      backgrounds: [...new Set(backgrounds)].slice(0, 6),
    };
  });
}

async function settle(page, snap) {
  await page.waitForFunction(() => !document.querySelector('.scene-transition'), null, { timeout: 30000 }).catch(() => {});
  if (snap?.stage) await page.waitForFunction(() => [...document.querySelectorAll('.narrative-stage')]
    .every(stage => !stage.dataset.narrativeSurfaceReadiness || stage.dataset.narrativeSurfaceReadiness === 'VISIBLE'), null, { timeout: 8000 }).catch(() => {});
  if (snap?.dialogue) await page.waitForFunction(() => {
    const text = document.querySelector('.dialogue .dialogue__text');
    return !text?.dataset.finalText || text.querySelector('.dialogue__text-reveal')?.textContent === text.dataset.finalText;
  }, null, { timeout: 8000 }).catch(() => {});
  if (snap?.cinematic) await page.waitForFunction(() => (document.querySelector('.cinematic-overlay video')?.currentTime ?? 1) > 0.9,
    null, { timeout: 4000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(snap?.combat ? 2500 : 450);
}

async function capture(page, run, name, note, { mobile = false } = {}) {
  const snap = await snapshot(page);
  await settle(page, snap);
  const detail = await snapshot(page);
  await page.screenshot({ path: `${output}/${name}.png` });
  const entry = { file: `${name}.png`, run: run.id, viewport: `${page.viewportSize().width}x${page.viewportSize().height}`, note, state: detail };
  index.captures.push(entry);
  run.captures.push(name);
  if (mobile) {
    const desktop = page.viewportSize();
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/${name}-390.png` });
    index.captures.push({ ...entry, file: `${name}-390.png`, viewport: '390x844' });
    run.captures.push(`${name}-390`);
    await page.setViewportSize(desktop);
    await page.waitForTimeout(500);
  }
  console.log('capture', name);
}

async function playCombat(page, run) {
  const frame = page.frames().find(candidate => candidate.url().includes('legacy-combat'));
  if (!frame) return;
  await frame.evaluate(() => {
    const shown = element => element && element.getBoundingClientRect().width > 0 && getComputedStyle(element).visibility !== 'hidden';
    for (const selector of ['#tutorial [data-action="skip"]', '#combat-result-action', '[data-qa="victory"]']) {
      const element = document.querySelector(selector);
      if (shown(element) && !element.disabled) { element.click(); return; }
    }
  }).catch(() => {});
  run.combatTicks = (run.combatTicks ?? 0) + 1;
}

/**
 * Generic driver. `plan(snap, key)` returns a capture name (or null) for a newly seen surface key.
 * `pickJourney` / `pickChoice` override the default first option.
 */
async function drive(page, run, { plan, stop, pickJourney = () => null, pickChoice = () => 0, maxTicks = 2400, mobileFor = () => false }) {
  const seen = new Set();
  for (let tick = 0; tick < maxTicks; tick++) {
    await page.waitForTimeout(150);
    const snap = await snapshot(page);
    if (snap.transition) continue;
    const keys = [];
    if (snap.cinematic) keys.push(`cinematic:${snap.node}:${snap.cinematic.src}`);
    if (snap.combat) keys.push(`combat:${snap.node}`);
    if (snap.dialogue && snap.dialogue.sequence) keys.push(`dialogue:${snap.dialogue.sequence}`);
    if (snap.dialogue?.choices.length) keys.push(`choice:${snap.dialogue.sequence}`);
    if (snap.journey) keys.push(`journey:${snap.node}:${snap.resolved}`);
    if (snap.hub) keys.push(`hub:${snap.hub.node}`);
    if (snap.traversal && !snap.traversal.transition) keys.push(`traversal:${snap.traversal.phase}:${snap.traversal.category}:${snap.traversal.fork}`);
    for (const key of keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      const name = plan(snap, key, run);
      run.surfaces.push({ key, node: snap.node, name: name ?? null });
      if (name) await capture(page, run, name, key, { mobile: mobileFor(name) });
    }
    if (stop(snap, run)) return true;
    // A held end-frame stays mounted while the fork Journey beneath it is live; it is not
    // skippable and must not prevent committing the route underneath.
    if (snap.cinematic) {
      if (snap.cinematic.skip) {
        await page.locator('.cinematic-overlay__skip:visible').first().click().catch(() => {});
        continue;
      }
      if (!snap.journey) continue;
    }
    if (snap.combat) { await playCombat(page, run); continue; }
    if (snap.dialogue?.choices.length) {
      const pick = pickChoice(snap, run) ?? 0;
      const buttons = page.locator('.dialogue .dialogue__choices button:visible:not([disabled])');
      const count = await buttons.count();
      if (count) {
        const choice = Math.min(pick, count - 1);
        run.choices.push({ sequence: snap.dialogue.sequence, step: snap.dialogue.step, picked: snap.dialogue.choices[choice] ?? null, options: snap.dialogue.choices });
        await buttons.nth(choice).click().catch(() => {});
        continue;
      }
    }
    if (snap.dialogue) { await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {}); continue; }
    if (snap.hub) { await page.locator('.exploration-stop [data-action="continue"]').click().catch(() => {}); continue; }
    if (snap.traversal) {
      const t = snap.traversal;
      if (t.fork) {
        const id = pickJourney(snap, run, ['lion-first-trial-event']) ?? 'lion-first-trial-event';
        await page.locator(`[data-traversal-fork-choice="${id}"]`).click().catch(() => {});
        continue;
      }
      if (['DECISION', 'LOCAL_INTERACTION'].includes(t.phase) && !t.transition) {
        await page.locator('[data-traversal-confirm]:visible:not([disabled])').click().catch(() => {});
        continue;
      }
      continue;
    }
    if (snap.journey) {
      const id = snap.journey.choices.length ? pickJourney(snap, run, snap.journey.choices) ?? snap.journey.choices[0] : null;
      if (id) {
        run.journeyPicks.push({ node: snap.node, picked: id, options: snap.journey.choices });
        await page.evaluate(choiceId =>
          document.querySelector(`[data-journey-choice="${choiceId}"]`)?.click(), id).catch(() => {});
      } else await page.evaluate(() =>
        [...document.querySelectorAll('[data-journey-continue]')]
          .find(b => b.getBoundingClientRect().width > 0)?.click()).catch(() => {});
    }
  }
  return false;
}

function newRun(id, description) {
  // A re-executed run replaces its previous record; its captures are replaced by file name.
  const stale = index.runs.find(run => run.id === id);
  if (stale) {
    index.runs.splice(index.runs.indexOf(stale), 1);
    const files = new Set(stale.captures.map(name => `${name}.png`));
    index.captures = index.captures.filter(entry => !(entry.run === id && files.has(entry.file)));
  }
  const run = { id, description, captures: [], surfaces: [], choices: [], journeyPicks: [], completed: false };
  index.runs.push(run);
  return run;
}

/* ---------- Run T0: production T0 from a normally resolved audience ---------- */
async function runT0WithReturns() {
  const run = newRun('t0-reference', 'Production T0 (gate-enabled) from normally resolved lion-audience; lane 0; first-trial event branch.');
  const page = await pageAt();
  await installSave(page, { targetId: 'lion-audience', resolveTarget: true });
  const once = new Set();
  let afterLocal = false, afterCombat = false, afterCanonical = false;
  const oneShot = async (name, snap) => {
    if (once.has(name)) return;
    once.add(name);
    await capture(page, run, name, 'one-shot return', { mobile: name === 't0-reference-normal-travel' });
  };
  const seenKeys = new Set();
  for (let tick = 0; tick < 3200; tick++) {
    await page.waitForTimeout(140);
    const snap = await snapshot(page);
    if (snap.transition) continue;
    const t = snap.traversal;
    if (t && t.phase === 'RUNNING' && !t.transition && !snap.dialogue && !snap.combat) {
      if (t.progress > .04 && !once.has('t0-reference-normal-travel')) await oneShot('t0-reference-normal-travel', snap);
      if (afterLocal) { afterLocal = false; await oneShot('t0-reference-dialogue-return', snap); }
      if (afterCombat) { afterCombat = false; await oneShot('t0-reference-combat-return', snap); }
      if (afterCanonical) { afterCanonical = false; await oneShot('t0-reference-canonical-dialogue-return', snap); }
    }
    let key = null, name = null;
    if (snap.combat) { key = `combat:${snap.node}`; name = 't0-reference-combat'; afterCombat = true; }
    else if (snap.dialogue?.sequence === 'roadside_peddler') { key = 'dlg:peddler'; name = 't0-reference-local-dialogue'; afterLocal = true; }
    else if (snap.dialogue?.sequence === 'mystery_recruit') { key = 'dlg:recruit'; name = 't0-reference-canonical-dialogue'; afterCanonical = true; }
    else if (snap.journey && snap.node === 'lion-audience') { key = 'journey:departure'; name = 't0-reference-departure-journey'; }
    else if (snap.journey) { key = 'journey:arrival'; name = 't0-reference-arrival-agency'; }
    else if (t?.fork) { key = 'fork'; name = 't0-reference-fork'; }
    else if (t?.phase === 'ARRIVING') { key = 'arriving'; name = 't0-reference-arrival'; }
    else if (t?.phase === 'DECISION' && !t.transition && t.category) {
      key = `decision:${t.category}:${Math.round(t.progress * 10)}`;
      name = t.category === 'MANDATORY_EVENT' && t.progress < .3 ? 't0-reference-mandatory-interrupt'
        : t.category === 'OPTIONAL_EVENT' && t.progress < .15 ? 't0-reference-optional-interrupt'
          : t.category === 'OPTIONAL_EVENT' && t.progress < .7 ? 't0-reference-optional-canonical-interrupt' : null;
    }
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      run.surfaces.push({ key, node: snap.node, name });
      if (name) await capture(page, run, name, key, { mobile: ['t0-reference-fork', 't0-reference-mandatory-interrupt'].includes(name) });
    }
    if (name === 't0-reference-arrival-agency') { run.completed = true; break; }
    if (snap.cinematic) { if (snap.cinematic.skip) await page.locator('.cinematic-overlay__skip:visible').first().click().catch(() => {}); continue; }
    if (snap.combat) { await playCombat(page, run); continue; }
    if (snap.dialogue?.choices.length) {
      run.choices.push({ sequence: snap.dialogue.sequence, picked: snap.dialogue.choices[0], options: snap.dialogue.choices });
      await page.locator('.dialogue .dialogue__choices button:visible:not([disabled])').first().click().catch(() => {});
      continue;
    }
    if (snap.dialogue) { await page.locator('.dialogue .dialogue__box:visible').first().click().catch(() => {}); continue; }
    if (t?.fork) { await page.locator('[data-traversal-fork-choice="lion-first-trial-event"]').click().catch(() => {}); continue; }
    if (t && ['DECISION', 'LOCAL_INTERACTION'].includes(t.phase) && !t.transition) {
      await page.locator('[data-traversal-confirm]:visible:not([disabled])').click().catch(() => {});
      continue;
    }
    if (!t && snap.journey) await page.locator('[data-journey-continue]:visible').first().click().catch(() => {});
  }
  await page.close();
}

/* ---------- Final-act runs ---------- */
const NAMES = {
  // T1
  'journey:lion-first-refuge:true': 't1-current-01-first-refuge-departure',
  'dialogue:reserve_trail': 't1-current-02-reserve-trail',
  'choice:reserve_trail': 't1-current-03-reserve-trail-choice',
  'journey:lion-reserve-trail:true': 't1-current-04-valmir-road-departure',
  'combat:lion-valmir-road': 't1-current-05-valmir-road-combat',
  'journey:lion-valmir-road:true': 't1-current-06-second-trial-fork',
  'dialogue:old_shrine_event': 't1-current-07-second-trial-event',
  'combat:lion-second-trial-combat': 't1-current-07b-second-trial-combat',
  'journey:lion-second-trial-event:true': 'bois-clair-current-01-approach',
  'journey:lion-second-trial-combat:true': 'bois-clair-current-01b-approach-after-combat',
  'dialogue:village_choice': 'bois-clair-current-03-dialogue',
  'choice:village_choice': 'bois-clair-current-04-choice',
  'combat:lion-village-choice': 'bois-clair-current-05-combat',
  'journey:lion-village-choice:true': 'bois-clair-current-07-handoff-to-second-refuge',
  // Second refuge / T3
  'hub:lion-second-refuge': 'second-refuge-current-02-hub',
  'journey:lion-second-refuge:true': 'second-refuge-current-04-departure',
  'dialogue:mystery_lancer_recruit': 't3-garen-current',
  'choice:mystery_lancer_recruit': 't3-garen-choice-current',
  'journey:lion-lancer-recruit:true': 't3-witness-road-departure-current',
  'dialogue:witnesses_on_road': 't3-witnesses-current',
  'choice:witnesses_on_road': 't3-witnesses-decision-current',
  'journey:lion-witnesses:true': 't3-final-fork-current',
  'combat:lion-final-trial-combat': 't3-final-combat-current',
  'combat:lion-final-trial-event': 't3-final-event-combat-current',
  'journey:lion-final-trial-event:true': 't3-shadow-approach-current',
  'journey:lion-final-trial-combat:true': 't3-shadow-approach-after-combat-current',
  'dialogue:shadow_signs': 'shadow-signs-dialogue-current',
  'choice:shadow_signs': 'shadow-signs-evidence-choice-current',
  'journey:lion-shadow-signs:true': 't4-current-handoff',
  'dialogue:final_refuge': 'final-refuge-dialogue-current',
  'choice:final_refuge': 'final-refuge-choice-current',
  'journey:lion-final-refuge:true': 'final-refuge-departure-current',
  'dialogue:lion_finale_judgement': 'judgement-current',
  'choice:lion_finale_judgement': 'judgement-choice-current',
  'combat:lion-final-judgement': 'final-boss-current',
};

const MOBILE_NAMES = new Set([
  't1-current-01-first-refuge-departure', 't1-current-06-second-trial-fork', 'bois-clair-current-03-dialogue',
  'second-refuge-current-02-hub', 't3-witnesses-current', 't3-final-fork-current', 'final-refuge-dialogue-current',
  'judgement-current',
]);

let autoCounter = 0;
function finalPlan(prefix) {
  return (snap, key) => {
    if (NAMES[key]) return NAMES[key];
    // Unnamed dialogues (pre/post combat, ATEs, aftermath) and every cinematic are also evidence.
    const node = snap.node ?? 'none';
    if (key.startsWith('cinematic:')) {
      const clip = (snap.cinematic?.src ?? 'clip').split('/').pop().replace(/\.[a-z0-9]+$/i, '');
      return `${prefix}-cinematic-${node.replace(/^lion-/, '')}-${clip}`.slice(0, 90);
    }
    if (key.startsWith('dialogue:')) return `${prefix}-dialogue-${node.replace(/^lion-/, '')}-${key.slice(9)}`.slice(0, 90);
    if (key.startsWith('journey:') || key.startsWith('hub:') || key.startsWith('combat:')) return `${prefix}-${key.replace(/[:]/g, '-').replace(/lion-/g, '')}-${++autoCounter}`;
    return null;
  };
}

async function runFinalAct() {
  const run = newRun('final-act-main', 'From resolved lion-first-refuge through T1 (event), Bois-Clair, Second Refuge, T3 (event), Shadow Signs, Final Refuge, to the Judgement / final boss entry. First dialogue option everywhere.');
  const page = await pageAt();
  await installSave(page, { targetId: 'lion-first-refuge', resolveTarget: true });
  run.completed = await drive(page, run, {
    plan: finalPlan('flow'),
    mobileFor: name => MOBILE_NAMES.has(name),
    pickJourney: (snap, current, choices) => choices.find(id => id.endsWith('-event')) ?? null,
    stop: snap => snap.combat && snap.node === 'lion-final-judgement'
      && index.captures.some(capture => capture.file === 'final-boss-current.png'),
    maxTicks: 6000,
  });
  await page.close();
}

async function runT3Combat() {
  const run = newRun('t3-combat-branch', 'From resolved lion-witnesses: T3 fork, combat branch, until Shadow Signs dialogue.');
  const page = await pageAt();
  await installSave(page, { targetId: 'lion-witnesses', resolveTarget: true });
  run.completed = await drive(page, run, {
    plan: (snap, key) => (key === 'journey:lion-witnesses:true' ? 't3-final-fork-combat-run'
      : NAMES[key] && !NAMES[key].startsWith('shadow') ? NAMES[key] : key === 'dialogue:shadow_signs' ? 'shadow-signs-after-combat-branch' : finalPlan('t3c')(snap, key)),
    pickJourney: (snap, current, choices) => choices.find(id => id.endsWith('-combat')) ?? null,
    stop: snap => snap.dialogue?.sequence === 'shadow_signs',
    maxTicks: 2500,
  });
  await page.close();
}

async function runT1Combat() {
  const run = newRun('t1-combat-branch', 'From resolved lion-valmir-road: T1 fork, combat branch, until the Bois-Clair approach Journey.');
  const page = await pageAt();
  await installSave(page, { targetId: 'lion-valmir-road', resolveTarget: true });
  run.completed = await drive(page, run, {
    plan: (snap, key) => (key === 'journey:lion-valmir-road:true' ? 't1-current-06b-second-trial-fork-combat-run'
      : NAMES[key] ?? finalPlan('t1c')(snap, key)),
    pickJourney: (snap, current, choices) => choices.find(id => id.endsWith('-combat')) ?? null,
    stop: snap => Boolean(snap.journey && snap.node === 'lion-second-trial-combat'),
    maxTicks: 2500,
  });
  await page.close();
}

const runners = { t0: runT0WithReturns, final: runFinalAct, t3c: runT3Combat, t1c: runT1Combat };
try {
  for (const [id, runner] of Object.entries(runners)) {
    if (only && !only.includes(id)) continue;
    try { await runner(); } catch (error) { index.errors.push(`${id}: ${error.stack ?? error}`); console.error(error); }
  }
} finally {
  await writeFile(`${output}/gallery-index.json`, JSON.stringify(index, null, 2));
  await browser.close();
  await server.close();
}
console.log(index.errors.length ? `DONE WITH ${index.errors.length} ERROR(S)` : 'DONE');
