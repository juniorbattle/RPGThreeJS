import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const output = resolve(root, 'docs/reports/dialogue-ui-staging-alignment-1-screenshots');
const port = 5198;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', `${port}`, '--strictPort'], {
  cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited: ${serverLog}`);
    try { if ((await fetch(`${base}/tools/dialogue/dialogue-proof.html`)).ok) return; } catch { /* startup */ }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Vite did not become ready: ${serverLog}`);
}

function inside(inner, outer) {
  return inner.x >= outer.x - 1 && inner.y >= outer.y - 1
    && inner.x + inner.width <= outer.x + outer.width + 1
    && inner.y + inner.height <= outer.y + outer.height + 1;
}

async function capture(browser, { name, width, height, scenario, activateChoices = false }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/tools/dialogue/dialogue-proof.html?scenario=${scenario}`, { waitUntil: 'networkidle' });
  try { await page.locator('.dialogue__box').waitFor({ timeout: 10000 }); }
  catch { throw new Error(`${name}: dialogue did not mount; title=${await page.title()}; errors=${errors.join(' | ')}; body=${(await page.locator('body').innerHTML()).slice(0, 400)}`); }
  await page.locator(`.dialogue__card-portrait[data-portrait-state="${scenario === 'portrait-fallback' ? 'fallback' : 'ready'}"]`).waitFor({ state: 'attached' });
  if (activateChoices) await page.locator('.dialogue__box').click();
  if (activateChoices) await page.waitForTimeout(350);
  const proof = await page.evaluate(() => {
    const box = document.querySelector('.dialogue__box');
    const panel = document.querySelector('.dialogue__choices');
    const viewport = { x: 0, y: 0, width: innerWidth, height: innerHeight };
    const rect = (node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    const choices = [...document.querySelectorAll('.dialogue-choice')];
    const actors = [...document.querySelectorAll('.narrative-cast__actor')];
    const cardStyle = getComputedStyle(box);
    const panelStyle = getComputedStyle(panel);
    const cardContent = [...box.querySelectorAll('.dialogue__card-portrait,.dialogue__speaker-block,.dialogue__speaker,.dialogue__tag,.dialogue__divider,.dialogue__text,.dialogue__outcomes,.dialogue__continue')]
      .filter((element) => !element.hidden && getComputedStyle(element).display !== 'none');
    const cardBounds = rect(box);
    return {
      speaker: document.querySelector('.dialogue__speaker')?.textContent,
      text: document.querySelector('.dialogue__text')?.textContent,
      portraitReady: document.querySelector('.dialogue__card-portrait')?.getAttribute('data-portrait-state') === 'ready',
      portraitState: document.querySelector('.dialogue__card-portrait')?.getAttribute('data-portrait-state'),
      portraitHidden: document.querySelector('.dialogue__card-portrait')?.hidden,
      portraitNaturalWidth: document.querySelector('.dialogue__card-portrait img')?.naturalWidth ?? 0,
      box: rect(box), textRect: rect(document.querySelector('.dialogue__text')),
      speakerRect: rect(document.querySelector('.dialogue__speaker')),
      cardOverflow: { x: cardStyle.overflowX, y: cardStyle.overflowY,
        scrollWidth: box.scrollWidth, clientWidth: box.clientWidth,
        scrollHeight: box.scrollHeight, clientHeight: box.clientHeight },
      clippedCardContent: cardContent.filter((element) => !(
        element.getBoundingClientRect().left >= cardBounds.x - 1
        && element.getBoundingClientRect().right <= cardBounds.x + cardBounds.width + 1
        && element.getBoundingClientRect().top >= cardBounds.y - 1
        && element.getBoundingClientRect().bottom <= cardBounds.y + cardBounds.height + 1
      )).map((element) => element.className),
      panel: rect(panel), viewport,
      panelScrollable: panel.scrollHeight > panel.clientHeight + 1,
      panelOverflow: { x: panelStyle.overflowX, y: panelStyle.overflowY,
        scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth },
      choices: choices.map((choice) => ({ text: choice.textContent, disabled: choice.disabled, rect: rect(choice) })),
      actors: actors.map((actor) => ({ id: actor.dataset.actorId, state: actor.dataset.castState,
        imageReady: actor.querySelector('img')?.naturalWidth > 0, rect: rect(actor) })),
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  if (errors.length) throw new Error(`${name}: page errors: ${errors.join(' | ')}`);
  if (!proof.speaker || !proof.text) throw new Error(`${name}: missing dialogue`);
  if (scenario === 'portrait-fallback') {
    if (proof.portraitState !== 'fallback' || !proof.portraitHidden || proof.portraitNaturalWidth !== 0)
      throw new Error(`${name}: portrait fallback failed`);
  } else if (!proof.portraitReady || proof.portraitNaturalWidth <= 0) throw new Error(`${name}: portrait failed`);
  if (!inside(proof.box, proof.viewport) || proof.scrollWidth > width + 1) throw new Error(`${name}: card outside viewport`);
  if (!inside(proof.textRect, proof.box) || !inside(proof.speakerRect, proof.box)) throw new Error(`${name}: speaker or text clipped by card`);
  if (proof.cardOverflow.x !== 'hidden' || proof.cardOverflow.y !== 'hidden'
    || proof.cardOverflow.scrollWidth > proof.cardOverflow.clientWidth + 1
    || proof.cardOverflow.scrollHeight > proof.cardOverflow.clientHeight + 1
    || proof.clippedCardContent.length) throw new Error(`${name}: card overflow ${JSON.stringify({ ...proof.cardOverflow, clipped: proof.clippedCardContent })}`);
  if (proof.actors.length < (scenario === 'standard' || scenario === 'portrait-fallback' ? 3 : 4)) throw new Error(`${name}: cast incomplete`);
  if (proof.actors.some((actor) => !actor.imageReady)) throw new Error(`${name}: cast image failed to load`);
  if (activateChoices) {
    if (proof.panelOverflow.x !== 'hidden' || proof.panelOverflow.scrollWidth > proof.panelOverflow.clientWidth + 1)
      throw new Error(`${name}: horizontal choice overflow ${JSON.stringify(proof.panelOverflow)}`);
    const expectedChoices = scenario === 'many-choices' ? 5 : 3;
    if (proof.choices.length !== expectedChoices || !inside(proof.panel, proof.viewport)) throw new Error(`${name}: choice stack missing or outside viewport`);
    if (proof.box.y + proof.box.height > proof.panel.y + 2) throw new Error(`${name}: card overlaps choices`);
    if (scenario === 'many-choices') {
      if (!proof.panelScrollable || !inside(proof.choices[0].rect, proof.viewport)) throw new Error(`${name}: long choice list is not scrollable`);
    } else if (proof.choices.some(({ rect }) => !inside(rect, proof.viewport))) throw new Error(`${name}: choice outside viewport`);
  }
  const screenshot = `${name}.jpg`;
  await page.screenshot({ path: resolve(output, screenshot), type: 'jpeg', quality: 88 });
  if (activateChoices) {
    const target = scenario === 'many-choices'
      ? page.locator('.dialogue-choice:not([disabled])').last()
      : page.locator('.dialogue-choice:not([disabled])').first();
    await target.click();
    if (await page.locator('.dialogue').count()) throw new Error(`${name}: choice click did not advance`);
  }
  await page.close();
  return { name, width, height, scenario, screenshot, speaker: proof.speaker, cast: proof.actors.length, choices: proof.choices.length,
    cardOverflow: proof.cardOverflow, panelOverflow: proof.panelOverflow, errors };
}

let browser;
try {
  await mkdir(output, { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const cases = [
    { name: 'desktop-standard', width: 1440, height: 810, scenario: 'standard' },
    { name: 'desktop-choices', width: 1440, height: 810, scenario: 'choices', activateChoices: true },
    { name: 'desktop-multi-cast', width: 1440, height: 810, scenario: 'multi' },
    { name: 'desktop-portrait-fallback', width: 1440, height: 810, scenario: 'portrait-fallback' },
    { name: 'narrow-standard', width: 620, height: 780, scenario: 'standard' },
    { name: 'narrow-choices', width: 620, height: 780, scenario: 'choices', activateChoices: true },
    { name: 'mobile-standard', width: 390, height: 844, scenario: 'standard' },
    { name: 'mobile-portrait-fallback', width: 390, height: 844, scenario: 'portrait-fallback' },
    { name: 'mobile-choices', width: 390, height: 844, scenario: 'choices', activateChoices: true },
    { name: 'mobile-many-choices', width: 390, height: 844, scenario: 'many-choices', activateChoices: true },
  ];
  const results = [];
  for (const testCase of cases) results.push(await capture(browser, testCase));
  await writeFile(resolve(output, 'qa-results.json'), `${JSON.stringify({ cases: results }, null, 2)}\n`);
  process.stdout.write(`PASS ${results.length}/${cases.length} dialogue browser cases; screenshots: ${output}\n`);
} finally {
  await browser?.close();
  server.kill();
}
