/** Deterministic production-component Journey/Stage QA; exposes GameApp only in this browser. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = 'docs/reports/narrative-stage-utility-consistency-1-browser';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true, watch: null, hmr: false } });
await server.listen();
const browser = await chromium.launch({ headless: true });
const proof = { viewportChecks: {}, lifecycle: {}, flow: {}, errors: [], pass: false };

async function newPage(width = 1440, height = 810) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', error => proof.errors.push(String(error)));
  await page.addInitScript(() => localStorage.setItem('rpg-tutorial-seen', '1'));
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__utilityQaApp = app;',
    ) });
  });
  await page.goto('http://127.0.0.1:5198/');
  await page.waitForFunction(() => window.__utilityQaApp?.mode === 'TITLE');
  await page.evaluate(() => {
    const app = window.__utilityQaApp;
    const counts = { stageMounts: 0, dockMounts: 0, traversalMounts: 0, travelMounts: 0,
      maxStages: 0, maxDocks: 0, maxAgency: 0, autoSaves: 0, manualSaves: 0,
      routeCommits: [], nodeResolutions: [] };
    window.__utilityQaCounts = counts;
    const countAdded = (node, selector) => Number(node.matches(selector)) + node.querySelectorAll(selector).length;
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        counts.stageMounts += countAdded(node, '.narrative-stage');
        counts.dockMounts += countAdded(node, '.narrative-utility-dock');
        counts.traversalMounts += countAdded(node, '.traversal-t0');
        counts.travelMounts += countAdded(node, '.travel-view');
      }
      counts.maxStages = Math.max(counts.maxStages, document.querySelectorAll('.narrative-stage').length);
      counts.maxDocks = Math.max(counts.maxDocks, document.querySelectorAll('.narrative-utility-dock').length);
      counts.maxAgency = Math.max(counts.maxAgency, document.querySelectorAll('.journey-overlay').length);
    }).observe(document.body, { childList: true, subtree: true });
    const auto = app.saves.saveAuto.bind(app.saves);
    const manual = app.saves.saveManual.bind(app.saves);
    app.saves.saveAuto = (...args) => { counts.autoSaves++; return auto(...args); };
    app.saves.saveManual = (...args) => { counts.manualSaves++; return manual(...args); };
    const commit = app.commitRunNodeChoice.bind(app);
    app.commitRunNodeChoice = id => { counts.routeCommits.push(id); return commit(id); };
    const resolve = app.resolveRunNode.bind(app);
    app.resolveRunNode = (...args) => { counts.nodeResolutions.push(args[0]?.id); return resolve(...args); };
  });
  return page;
}

async function startJourney(page, nodeId, { departure = false, still = false } = {}) {
  await page.evaluate(async ({ nodeId, departure, still }) => {
    const { createInitialState } = await import('/src/game/store.ts');
    const { enterRunNode } = await import('/src/game/runSystem.ts');
    const app = window.__utilityQaApp;
    const state = createInitialState();
    state.flags.prologueSeen = true;
    if (departure) {
      enterRunNode(state.run, nodeId);
      state.resolvedNodeIds.push(nodeId);
    } else {
      state.run.currentNodeId = nodeId;
    }
    state.currentNodeId = nodeId;
    app.state = state;
    if (still) app.narrativeMediaMode = 'STILL';
    void (departure ? app.enterCampaignPresentation() : app.enterJourney());
  }, { nodeId, departure, still });
  await page.waitForFunction(() => document.querySelector('.journey-overlay')
    && document.querySelector('.narrative-utility-dock')
    && !document.querySelector('.scene-transition'), null, { timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
}

async function state(page) {
  return page.evaluate(async () => {
    const { getAvailableRunNodes } = await import('/src/game/runSystem.ts');
    const app = window.__utilityQaApp;
    return { mode: app.mode, routeNode: app.state.run.currentNodeId, stepCounter: app.state.stepCounter,
      resolvedNodeIds: [...app.state.resolvedNodeIds], available: getAvailableRunNodes(app.state).map(node => node.id) };
  });
}

async function checkAgency(page, name, screenshot) {
  const check = await page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const { x, y, right, bottom, width, height } = element.getBoundingClientRect();
      return { x, y, right, bottom, width, height };
    };
    const dock = document.querySelector('.narrative-utility-dock');
    const buttons = [...document.querySelectorAll('.narrative-utility-dock [data-journey-secondary]')];
    return { size: [innerWidth, innerHeight], stageCount: document.querySelectorAll('.narrative-stage').length,
      agencyCount: document.querySelectorAll('.journey-overlay').length,
      dockCount: document.querySelectorAll('.narrative-utility-dock').length,
      actions: buttons.map(button => ({ id: button.dataset.journeySecondary, disabled: button.disabled,
        rect: (() => { const { x, y, right, bottom } = button.getBoundingClientRect(); return { x, y, right, bottom }; })() })),
      dock: rect('.narrative-utility-dock'), hud: rect('.campaign-status-hud'),
      agency: rect('.journey-overlay__panel'),
      documentOverflow: document.documentElement.scrollWidth > innerWidth + 1
        || document.documentElement.scrollHeight > innerHeight + 1,
      dockOverflow: dock.scrollWidth > dock.clientWidth + 1 || dock.scrollHeight > dock.clientHeight + 1,
      travelCount: document.querySelectorAll('.travel-view').length };
  });
  const overlaps = (a, b) => a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
  const inside = rect => rect && rect.x >= -1 && rect.y >= -1
    && rect.right <= check.size[0] + 1 && rect.bottom <= check.size[1] + 1;
  assert.equal(check.stageCount, 1, name);
  assert.equal(check.agencyCount, 1, name);
  assert.equal(check.dockCount, 1, name);
  assert.deepEqual(check.actions.map(action => action.id), ['COMPANY', 'SAVE', 'MENU'], name);
  assert.ok(check.actions.every(action => !action.disabled && inside(action.rect)), name);
  assert.ok(inside(check.dock), name);
  assert.equal(overlaps(check.dock, check.hud), false, `${name}: utility/HUD collision`);
  assert.equal(overlaps(check.dock, check.agency), false, `${name}: utility/agency collision`);
  assert.equal(check.documentOverflow, false, `${name}: document overflow`);
  assert.equal(check.dockOverflow, false, `${name}: utility scrollbar`);
  assert.equal(check.travelCount, 0, name);
  proof.viewportChecks[name] = check;
  if (screenshot) await page.screenshot({ path: `${output}/${screenshot}` });
}

try {
  const ordinary = await newPage();
  await startJourney(ordinary, 'lion-nomad-crossroads');
  await checkAgency(ordinary, 'ordinary-1440', 'ordinary-1440.png');
  await ordinary.close();

  const audience = await newPage();
  await startJourney(audience, 'lion-camp');
  await audience.evaluate(() => { window.__utilityQaApp.state.settings.reducedGraphics = true; });
  await audience.locator('[data-journey-continue]').click();
  await audience.waitForSelector('.dialogue--narrative', { timeout: 45_000 });
  assert.equal(await audience.locator('.narrative-utility-dock').count(), 0);
  let audienceAdvanced = false;
  for (let index = 0; index < 80; index += 1) {
    if (await audience.locator('.journey-overlay--departure [data-journey-continue]').count()) {
      audienceAdvanced = true;
      break;
    }
    if (await audience.locator('.dialogue-choice:not([disabled])').first().isVisible().catch(() => false)) {
      await audience.locator('.dialogue-choice:not([disabled])').first().click();
    } else if (await audience.locator('.dialogue__box').isVisible().catch(() => false)) {
      await audience.locator('.dialogue__box').click();
    }
    await audience.waitForTimeout(80);
  }
  assert.equal(audienceAdvanced, true, 'Alaric dialogue did not reach departure');
  await checkAgency(audience, 'after-audience-1440');
  proof.lifecycle.audience = { state: await state(audience), dialogueUtilityCount: 0,
    departureActions: await audience.locator('.narrative-utility-dock [data-journey-secondary]').count() };
  assert.equal(proof.lifecycle.audience.state.routeNode, 'lion-audience');
  assert.equal(proof.lifecycle.audience.state.resolvedNodeIds.includes('lion-audience'), true);
  await audience.close();

  const branch = await newPage();
  await startJourney(branch, 'lion-refugees');
  assert.equal(await branch.locator('[data-journey-choice]').count(), 2);
  await checkAgency(branch, 'branch-1440', 'branch-1440.png');
  await branch.close();

  const staticJourney = await newPage(1366, 768);
  await startJourney(staticJourney, 'lion-nomad-crossroads', { still: true });
  await checkAgency(staticJourney, 'static-1366', 'static-1366.png');
  proof.lifecycle.dialogue = await staticJourney.evaluate(async () => {
    const { dialogues } = await import('/src/game/content.ts');
    const stage = window.__utilityQaApp.journeyBoundary.session;
    stage.bindDialogue(dialogues.get('lion_briefing'));
    await stage.activateDialogueStep('0', 'SPEAKER_CARD');
    return { stageCount: document.querySelectorAll('.narrative-stage').length,
      dockCount: document.querySelectorAll('.narrative-utility-dock').length };
  });
  assert.deepEqual(proof.lifecycle.dialogue, { stageCount: 1, dockCount: 0 });
  await staticJourney.close();

  const cinematic = await newPage();
  proof.lifecycle.cinematic = await cinematic.evaluate(async () => {
    const { NarrativeStage } = await import('/src/cinematics/NarrativeStage.ts');
    const { CinematicPlayer } = await import('/src/cinematics/CinematicPlayer.ts');
    const { CinematicRegistry } = await import('/src/cinematics/CinematicRegistry.ts');
    const registry = new CinematicRegistry();
    const stage = new NarrativeStage({ player: new CinematicPlayer(registry), registry, transitionRevealMs: 0 });
    const pending = stage.presentCinematic('utility-qa-unavailable-media', { reducedMotion: true });
    const during = document.querySelectorAll('.narrative-utility-dock').length;
    await pending;
    const after = document.querySelectorAll('.narrative-utility-dock').length;
    const stageCount = document.querySelectorAll('.narrative-stage').length;
    stage.dispose();
    return { during, after, stageCount };
  });
  assert.deepEqual(proof.lifecycle.cinematic, { during: 0, after: 0, stageCount: 1 });
  await cinematic.close();

  const departure = await newPage();
  await startJourney(departure, 'lion-audience', { departure: true });
  assert.equal(await departure.locator('[data-journey-continue]').textContent(), 'Prendre la route');
  const before = await state(departure);
  await checkAgency(departure, 'departure-1440', 'departure-1440.png');
  await departure.setViewportSize({ width: 1366, height: 768 });
  await checkAgency(departure, 'departure-1366', 'departure-1366.png');
  await departure.setViewportSize({ width: 620, height: 780 });
  await checkAgency(departure, 'departure-620', 'departure-620.png');
  await departure.setViewportSize({ width: 390, height: 844 });
  await checkAgency(departure, 'departure-390', 'departure-390.png');
  await departure.evaluate(() => {
    const app = window.__utilityQaApp;
    app.state.run.temporaryLoot.gold = 40;
    app.statusHud.refresh();
  });
  await checkAgency(departure, 'departure-390-route-gold', 'departure-390-route-gold.png');
  await departure.evaluate(() => {
    const app = window.__utilityQaApp;
    app.state.run.temporaryLoot.gold = 0;
    app.statusHud.refresh();
  });
  await departure.setViewportSize({ width: 1440, height: 810 });

  await departure.locator('[data-journey-secondary="COMPANY"]').click();
  await departure.waitForSelector('.management');
  assert.deepEqual(await state(departure), { ...before, mode: 'MANAGEMENT' });
  assert.equal(await departure.locator('.traversal-t0').count(), 0);
  await departure.locator('.management [data-action="close"]').click();
  await departure.waitForFunction(() => document.querySelector('.journey-overlay--departure [data-journey-continue]')
    && document.querySelector('.narrative-utility-dock') && !document.querySelector('.management'));
  assert.deepEqual(await state(departure), before);
  await checkAgency(departure, 'post-management-1440', 'post-management-1440.png');
  await departure.locator('[data-journey-secondary="SAVE"]').click();
  await departure.waitForFunction(() => window.__utilityQaCounts.manualSaves === 1
    && document.querySelector('.narrative-utility-dock')
    && document.querySelector('.journey-overlay--departure [data-journey-continue]'));
  assert.deepEqual(await state(departure), before);
  await checkAgency(departure, 'post-save-1440', 'post-save-1440.png');
  await departure.locator('[data-journey-continue]').click();
  await departure.waitForSelector('.traversal-t0[data-phase="RUNNING"]', { timeout: 45_000 });
  const afterContinue = await state(departure);
  assert.equal(afterContinue.routeNode, before.routeNode);
  assert.equal(afterContinue.stepCounter, before.stepCounter);
  assert.deepEqual(afterContinue.resolvedNodeIds, before.resolvedNodeIds);
  proof.flow = { before, afterContinue, counts: await departure.evaluate(() => window.__utilityQaCounts) };
  assert.equal(proof.flow.counts.manualSaves, 1);
  assert.equal(proof.flow.counts.autoSaves, 2);
  assert.equal(proof.flow.counts.stageMounts, 3);
  assert.equal(proof.flow.counts.dockMounts, 3);
  assert.equal(proof.flow.counts.traversalMounts, 1);
  assert.equal(proof.flow.counts.travelMounts, 0);
  assert.equal(proof.flow.counts.maxStages, 1);
  assert.equal(proof.flow.counts.maxDocks, 1);
  assert.equal(proof.flow.counts.maxAgency, 1);
  assert.deepEqual(proof.flow.counts.routeCommits, []);
  assert.deepEqual(proof.flow.counts.nodeResolutions, []);
  await departure.close();

  const menu = await newPage();
  await startJourney(menu, 'lion-audience', { departure: true });
  const beforeMenu = await state(menu);
  await menu.locator('[data-journey-secondary="MENU"]').click();
  await menu.waitForFunction(() => window.__utilityQaApp.mode === 'TITLE');
  assert.deepEqual(await state(menu), { ...beforeMenu, mode: 'TITLE' });
  assert.equal(await menu.locator('.narrative-stage, .narrative-utility-dock, .journey-overlay, .travel-view').count(), 0);
  assert.deepEqual(await menu.evaluate(() => window.__utilityQaCounts.routeCommits), []);
  await menu.close();

  assert.deepEqual(proof.errors, []);
  proof.pass = true;
  console.log('PASS narrative-stage-utility-consistency-1 browser QA');
} catch (error) {
  proof.failure = String(error);
  throw error;
} finally {
  await writeFile(`${output}/browser-qa.json`, JSON.stringify(proof, null, 2));
  await browser.close();
  await server.close();
}
