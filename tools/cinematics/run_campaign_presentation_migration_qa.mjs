/** Focused local runtime proof; no production hooks, asset writes or large evidence corpus. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const dev = process.env.CAMPAIGN_QA_DEV_URL ?? 'http://127.0.0.1:5190';
const production = process.env.CAMPAIGN_QA_PROD_URL ?? 'http://127.0.0.1:5191';
const output = 'tmp/campaign-presentation-migration-1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function pageForDev(query = '') {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => localStorage.setItem('rpg-tutorial-seen', '1'));
  // Expose the existing app only in this test browser's module response, without changing source.
  await page.route('**/src/main.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(
      'const app = new GameApp(root, canvas);',
      'const app = new GameApp(root, canvas); window.__campaignApp = app;',
    ) });
  });
  await page.goto(`${dev}/${query}`);
  await page.waitForFunction(() => window.__campaignApp);
  return page;
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.narrative-stage')
    && document.querySelector('[data-journey-continue], [data-journey-choice]')
    && !document.querySelector('.scene-transition'), null, { timeout: 45000 });
}

async function monitor(page) {
  await page.evaluate(() => {
    window.campaignEvidence = { travelMounts: 0, commits: [], completions: [], disposals: [], resumes: [] };
    const evidence = window.campaignEvidence;
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches('.travel-view') || node.querySelector('.travel-view'))) evidence.travelMounts++;
      }
    }).observe(document.body, { childList: true, subtree: true });
    const app = window.__campaignApp;
    if (app) {
      const commit = app.commitRunNodeChoice.bind(app);
      app.commitRunNodeChoice = id => { evidence.commits.push(id); return commit(id); };
    }
  });
}

try {
  let fixture;
  for (const selector of ['', '?journey=cinematic', '?presentation=narrative']) {
    const page = await pageForDev(selector);
    await monitor(page);
    fixture = await page.evaluate(async () => {
      const { createInitialState } = await import('/src/game/store.ts');
      const state = createInitialState();
      state.flags.prologueSeen = true;
      const app = window.__campaignApp;
      app.saves.saveAuto(state);
      app.renderTitle();
      return state;
    });
    await page.locator('[data-action="continue"]').click();
    await ready(page);
    assert.equal(await page.locator('.travel-view').count(), 0);
    assert.equal(await page.locator('.narrative-stage').count(), 1);
    const initial = await page.evaluate(() => ({ ...window.campaignEvidence,
      mode: window.__campaignApp.mode, policy: window.__campaignApp.campaignPresentation,
      steps: window.__campaignApp.state.stepCounter,
    }));
    assert.equal(initial.policy, 'journey');
    assert.equal(initial.travelMounts, 0);
    if (!selector) {
      await page.screenshot({ path: `${output}/dev-default.png` });
      await page.locator('[data-journey-continue]').click();
      await page.waitForFunction(() => window.__campaignApp.state.run.currentNodeId === 'lion-audience');
      const committed = await page.evaluate(() => ({ ...window.campaignEvidence, steps: window.__campaignApp.state.stepCounter }));
      assert.deepEqual(committed.commits, ['lion-audience']);
      assert.equal(committed.steps, initial.steps + 1);
    }
    results.push({ name: `DEV ${selector || 'no selector'}`, ...initial });
    console.log('PASS', results.at(-1).name);
    await page.close();
  }

  // Real built production bundle, no module interception and no selector of any kind.
  const prodPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await prodPage.goto(production);
  await prodPage.evaluate(state => localStorage.setItem('rpg-threejs:autosave:v6', JSON.stringify(state)), fixture);
  await prodPage.reload();
  await monitor(prodPage);
  await prodPage.locator('[data-action="continue"]').click();
  await ready(prodPage);
  assert.equal(await prodPage.locator('.travel-view').count(), 0);
  assert.equal(await prodPage.locator('.narrative-stage').count(), 1);
  assert.equal(await prodPage.evaluate(() => window.campaignEvidence.travelMounts), 0);
  await prodPage.screenshot({ path: `${output}/production-default.png` });
  results.push({ name: 'production no selector', narrativeStages: 1, travelMounts: 0 });
  console.log('PASS production no selector');
  await prodPage.close();

  const page = await pageForDev('?qa=1&traversal=t0&media=stills');
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.waitForSelector('.traversal-t0');
  await page.waitForFunction(() => !document.querySelector('.scene-transition'));
  await monitor(page);
  await page.evaluate(() => {
    const app = window.__campaignApp, scene = app.activeTraversal, evidence = window.campaignEvidence;
    window.originalTraversal = scene;
    evidence.arrivalFrames = { count: 0, uncoveredEmpty: 0, travel: 0, duplicateStage: 0 };
    let watchingArrival = false;
    const sample = () => {
      watchingArrival ||= scene.session.phase === 'ARRIVING';
      if (watchingArrival) {
        const frames = evidence.arrivalFrames;
        frames.count++;
        const cover = document.querySelector('.scene-transition');
        const covered = cover && +getComputedStyle(cover).opacity >= .99;
        const stages = document.querySelectorAll('.narrative-stage').length;
        if (!covered && !scene.element.isConnected && stages === 0) frames.uncoveredEmpty++;
        if (document.querySelector('.travel-view')) frames.travel++;
        if (stages > 1) frames.duplicateStage++;
      }
      window.arrivalSampleFrame = requestAnimationFrame(sample);
    };
    window.arrivalSampleFrame = requestAnimationFrame(sample);
    for (const [method, key] of [['completeArrival', 'completions'], ['dispose', 'disposals'], ['resumeNode', 'resumes']]) {
      const original = scene[method].bind(scene);
      scene[method] = (...args) => {
        evidence[key].push({ args, phase: scene.session.phase, connected: scene.element.isConnected,
          coverOpacity: document.querySelector('.scene-transition')
            ? +getComputedStyle(document.querySelector('.scene-transition')).opacity : 0,
          node: app.state.run.currentNodeId, steps: app.state.stepCounter });
        return original(...args);
      };
    }
  });
  let arrived = false, beforeArrival, lastPhase;
  for (let iteration = 0; iteration < 2200; iteration++) {
    const state = await page.evaluate(() => {
      const app = window.__campaignApp, scene = app.activeTraversal;
      if (!scene) return null;
      // Advance physical distance faster; retain real transitions, interactions and arrival fade.
      if (scene.session.phase === 'RUNNING' && !scene.transition) scene.advance(.4);
      return { phase: scene.session.phase, transition: Boolean(scene.transition),
        progress: scene.session.routeProgress01, node: app.state.run.currentNodeId, steps: app.state.stepCounter,
        same: scene === window.originalTraversal };
    });
    if (!state) { arrived = true; break; }
    if (state.phase !== lastPhase) { console.log('T0', state.phase, state.progress); lastPhase = state.phase; }
    assert.equal(state.same, true);
    if (state.phase === 'ARRIVING') beforeArrival ??= state;
    if (!state.transition && state.phase === 'DECISION') {
      const skip = page.locator('[data-traversal-skip]:visible:not([disabled])');
      if (await skip.count()) await skip.click();
      else await page.locator('[data-traversal-confirm]:visible:not([disabled])').click();
    }
    if (!state.transition && state.phase === 'FORK_OVERLAY') {
      await page.locator('[data-traversal-fork-choice="lion-first-trial-event"]').click();
    }
    const dialogue = page.locator('.dialogue:visible');
    if (await dialogue.count()) {
      const choice = dialogue.locator('.dialogue-choice:not([disabled])');
      if (await choice.count()) await choice.first().click();
      else await dialogue.locator('.dialogue__box').click();
    }
    const combat = page.frameLocator('.combat-frame');
    const tutorial = combat.locator('#tutorial').getByRole('button', { name: 'Passer', exact: true });
    if (await tutorial.isVisible()) await tutorial.click();
    const victory = combat.locator('[data-qa="victory"]:visible');
    if (await victory.count()) await victory.click();
    const done = combat.getByRole('button', { name: 'Continuer la chronique', exact: true });
    if (await done.isVisible()) await done.click();
    await page.waitForTimeout(50);
  }
  assert.equal(arrived, true, 'T0 must arrive');
  await ready(page);
  const arrival = await page.evaluate(() => ({ ...window.campaignEvidence,
    node: window.__campaignApp.state.run.currentNodeId, steps: window.__campaignApp.state.stepCounter,
    traversalMounted: document.querySelectorAll('.traversal-t0').length,
    travelMounted: document.querySelectorAll('.travel-view').length,
    narrativeStages: document.querySelectorAll('.narrative-stage').length,
  }));
  assert.equal(arrival.completions.length, 1);
  assert.equal(arrival.disposals.length, 1);
  assert.equal(arrival.completions[0].coverOpacity, 1);
  assert.equal(arrival.disposals[0].coverOpacity, 1);
  assert.equal(arrival.node, beforeArrival.node);
  assert.equal(arrival.steps, beforeArrival.steps);
  assert.equal(arrival.commits.includes('lion-first-refuge'), false);
  assert.ok(arrival.resumes.length >= 3);
  assert.equal(arrival.travelMounts, 0);
  assert.equal(arrival.traversalMounted, 0);
  assert.equal(arrival.travelMounted, 0);
  assert.equal(arrival.narrativeStages, 1);
  assert.ok(arrival.arrivalFrames.count > 0);
  assert.equal(arrival.arrivalFrames.uncoveredEmpty, 0);
  assert.equal(arrival.arrivalFrames.travel, 0);
  assert.equal(arrival.arrivalFrames.duplicateStage, 0);
  assert.deepEqual(errors, []);
  await page.evaluate(() => cancelAnimationFrame(window.arrivalSampleFrame));
  await page.screenshot({ path: `${output}/t0-arrival.png` });
  results.push({ name: 'T0 physical arrival and same-session node resumes', ...arrival });
  console.log('PASS T0 arrival and mid-route resume');
  await page.locator('[data-journey-continue]').click();
  await page.waitForFunction(() => window.__campaignApp.state.run.currentNodeId === 'lion-first-refuge');
  assert.equal(await page.evaluate(() => window.campaignEvidence.commits.filter(id => id === 'lion-first-refuge').length), 1);
  await page.close();

  const failurePage = await pageForDev();
  await failurePage.evaluate(() => {
    const app = window.__campaignApp;
    app.ensureJourneyBoundary().createSession = () => { throw new Error('QA injected catastrophic failure'); };
    void app.enterCampaignPresentation();
  });
  await failurePage.waitForSelector('.travel-view');
  await failurePage.waitForFunction(() => !document.querySelector('.scene-transition'));
  const failure = await failurePage.evaluate(() => ({ latched: window.__campaignApp.journeyUnavailable,
    mode: window.__campaignApp.mode, narrativeStages: document.querySelectorAll('.narrative-stage').length }));
  assert.equal(failure.latched, true);
  assert.equal(failure.mode, 'TRAVEL');
  assert.equal(failure.narrativeStages, 0);
  await failurePage.evaluate(() => { void window.__campaignApp.enterCampaignPresentation(); });
  await failurePage.waitForFunction(() => !document.querySelector('.scene-transition'));
  assert.equal(await failurePage.locator('.travel-view').count(), 1);
  results.push({ name: 'catastrophic pre-ready failure and latched recovery', ...failure });
  console.log('PASS catastrophic fallback');
  await failurePage.close();
} finally {
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
