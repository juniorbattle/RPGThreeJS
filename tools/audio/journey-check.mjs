// One browser check with real gestures (OD-2026-11-01-B, AUTHORING_AND_QA): the real campaign from the title, then the
// QA encounters on the real CombatBridge for an Ultimate, boss, victory and defeat. A probe on the context's output reads
// the live peak. It proves wiring and limits, never that it sounds right. Needs the dev server on 5173.
// Usage: node tools/audio/journey-check.mjs [campaign|combat] ; writes tmp/audio-direction/journey.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const only = process.argv[2] ?? '';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'] });
const report = { campaign: null, combat: null, errors: [] };

// counts live contexts and taps the mix on its way to the speakers
const probe = () => {
  window.__contexts = 0;
  window.__peak = 0; window.__rms = 0; window.__rmsMax = 0;
  addEventListener('message', (event) => { if (event.data?.type === 'rpg-threejs:combat-initialize') window.__combat = event.data; });
  const Native = window.AudioContext;
  window.AudioContext = class extends Native { constructor(...args) { super(...args); window.__contexts++; } };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode && !(this.context instanceof OfflineAudioContext) && !window.__tap) {
      const tap = this.context.createAnalyser();
      tap.fftSize = 2048;
      connect.call(this, tap);
      window.__tap = tap;
      const data = new Float32Array(tap.fftSize);
      setInterval(() => {
        tap.getFloatTimeDomainData(data);
        let peak = 0, sum = 0;
        for (const x of data) { peak = Math.max(peak, Math.abs(x)); sum += x * x; }
        window.__peak = Math.max(window.__peak, peak);
        window.__rms = Math.sqrt(sum / data.length);
        window.__rmsMax = Math.max(window.__rmsMax, window.__rms);
      }, 50);
    }
    return connect.call(this, target, ...rest);
  };
  window.__timeline = [];
  setInterval(() => {
    const snap = window.__rpgMusic?.();
    if (!snap) return;
    const host = snap.host ?? {};
    const row = { t: Math.round(performance.now()), context: snap.context, hosted: host.context ?? null, section: host.section ?? null, ambience: host.ambience ?? null, scene: snap.scene, level: snap.level, voices: snap.cues.voices, rendered: snap.cues.rendered, rms: +window.__rms.toFixed(4) };
    const last = window.__timeline.at(-1);
    if (!last || ['context', 'hosted', 'section', 'ambience', 'level'].some((key) => last[key] !== row[key]) || row.voices.join() !== last.voices.join()) window.__timeline.push(row);
  }, 60);
};

async function newPage(url) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.addInitScript(probe);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page;
}
const snapshot = (page) => page.evaluate(() => { const s = window.__rpgMusic(); return { ...s, contexts: window.__contexts, peak: window.__peak, rmsMax: window.__rmsMax }; });

async function campaign() {
  const page = await newPage('http://localhost:5173/');
  await page.waitForSelector('.title-screen [data-action="new"]', { timeout: 30000 });
  await page.waitForTimeout(1000);
  const seen = { beforeGesture: await snapshot(page), surfaces: [] };
  await page.dispatchEvent('body', 'pointerdown'); // synthetic: must not unlock
  await page.waitForTimeout(300);
  seen.afterSynthetic = await snapshot(page);
  const box = await page.locator('.title-screen').boundingBox();
  await page.mouse.click(box.x + 12, box.y + 12); // real gesture on the title
  await page.waitForFunction(() => window.__rpgMusic().host?.context === 'title', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  seen.title = await snapshot(page);
  await page.click('.title-screen [data-action="new"]');
  const until = Date.now() + 480000;
  let moved = 0, fights = 0;
  const walked = new Set();
  while (Date.now() < until) {
    const snap = await snapshot(page);
    const key = `${snap.context}/${snap.scene ?? '-'}`;
    if (seen.surfaces.at(-1) !== key) seen.surfaces.push(key);
    if (await page.locator('.combat-frame').count()) {
      seen.reachedCombat = true;
      // the campaign has no QA buttons: the driver answers with the combat's own result message, on the same path as a win
      const frame = page.frames().find((candidate) => candidate.url().includes('legacy-combat'));
      if (frame) {
        const sent = await frame.evaluate(() => {
          const start = window.__combat;
          if (!start) return false;
          window.parent.postMessage({ type: 'rpg-threejs:combat-result', victory: true, combatId: start.config.id, inventory: start.inventory, participants: start.clan.map((unit) => unit.id), unitHealth: Object.fromEntries(start.clan.map((unit) => [unit.id, unit.currentHealth])) }, location.origin);
          return true;
        }).catch(() => false);
        if (sent) fights++;
      }
      if (fights > 6) break;
      await page.waitForTimeout(600);
      continue;
    }
    if (await page.locator('.exploration-stop:visible:not([inert])').count()) {
      await page.waitForTimeout(2200);
      seen.refugeHub = await snapshot(page);
      break;
    }
    if (await page.locator('.dialogue-choice:visible:not(:disabled)').count()) await page.locator('.dialogue-choice:visible:not(:disabled)').first().click();
    else if (await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
    else if (await page.locator('.cinematic-overlay__skip:visible').count()) await page.locator('.cinematic-overlay__skip:visible').first().click();
    else if (await page.locator('.poi-map:visible').count()) {
      if (!seen.map) { await page.waitForTimeout(2000); seen.map = await snapshot(page); }
      // head for the first refuge; until it is in reach, take the nearest stop not walked yet
      const go = page.locator('.poi-map [data-poi-action="move"]:not(:disabled)');
      await page.locator('.poi-map [data-poi-id="lion-first-refuge"]').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
      if (await go.count()) await go.first().click();
      else {
        const targets = page.locator('.poi-map [data-poi-reachable="true"], .poi-map .poi-marker--reachable, .poi-map .poi-marker--adjacent');
        const ids = await targets.evaluateAll((list) => list.map((node) => node.dataset.poiId));
        const next = ids.find((id) => !walked.has(id)) ?? ids[moved++ % Math.max(1, ids.length)];
        if (next) {
          walked.add(next);
          await page.locator(`.poi-map [data-poi-id="${next}"]`).first().click({ force: true });
          await page.waitForTimeout(250);
          if (await go.count()) await go.first().click();
        }
      }
    } else if (await page.locator('button:visible:not(:disabled)').count() && seen.surfaces.length < 3) await page.locator('button:visible:not(:disabled)').first().click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(140);
  }
  seen.timeline = await page.evaluate(() => window.__timeline);
  seen.final = await snapshot(page);
  await page.close();
  seen.fights = fights;
  return seen;
}

async function fight(page, rank) {
  await page.locator(`.qa-lab__encounter--${rank}`).first().click();
  const frame = await (async () => {
    for (let i = 0; i < 900; i++) {
      const f = page.frames().find((candidate) => candidate.url().includes('legacy-combat'));
      if (f) return f;
      if (await page.locator('.dialogue-choice:visible:not(:disabled)').count()) await page.locator('.dialogue-choice:visible:not(:disabled)').first().click();
      else if (await page.locator('.dialogue:visible').count()) await page.keyboard.press('Enter');
      else if (await page.locator('.cinematic-overlay__skip:visible').count()) await page.locator('.cinematic-overlay__skip:visible').first().click();
      await page.waitForTimeout(100);
    }
    throw new Error(`no combat frame: ${await page.evaluate(() => document.body.dataset.mode)}`);
  })();
  await frame.waitForSelector('[data-qa="prepare"]', { timeout: 120000, state: 'attached' });
  await page.waitForTimeout(1500);
  for (const selector of ['#tutorial:not(.hidden) [data-action="skip"]', '#boss-tutorial:not(.hidden) [data-action="start"]']) if (await frame.locator(selector).count()) await frame.locator(selector).first().click({ force: true });
  await frame.locator('[data-qa="prepare"]').click({ force: true });
  await page.waitForTimeout(2500);
  return frame;
}

async function combat() {
  const page = await newPage('http://localhost:5173/?qa=1&stageqa=1');
  await page.waitForSelector('.title-screen [data-action="qa"]', { timeout: 30000 });
  await page.waitForTimeout(800);
  const seen = {};
  await page.click('.title-screen [data-action="qa"]');
  await page.waitForFunction(() => window.__rpgMusic().host?.context === 'title', null, { timeout: 15000 });
  // an ordinary fight: an Ultimate on the real runtime, then the victory card
  const frame = await fight(page, 'normal');
  seen.combatStart = await snapshot(page);
  await frame.locator('[data-stage-qa="w_lion_surge"]').click({ force: true });
  await page.waitForFunction(() => window.__timeline.some((row) => row.voices.some((id) => id.startsWith('sig.'))), null, { timeout: 120000 }).catch(() => { seen.noSignature = true; });
  await page.waitForFunction(() => window.__timeline.some((row) => row.level === 'action'), null, { timeout: 30000 }).catch(() => { seen.noAction = true; });
  await page.waitForTimeout(6000);
  seen.afterUltimate = await snapshot(page);
  await frame.locator('[data-qa="victory"]').click({ force: true });
  await page.waitForTimeout(1200);
  seen.victoryCard = await snapshot(page);
  const continueButton = frame.locator('#combat-result-action');
  await continueButton.click({ force: true });
  await page.waitForTimeout(800);
  seen.afterResult = await snapshot(page);
  await page.waitForFunction(() => window.__rpgMusic().host?.context === 'title', null, { timeout: 15000 }).catch(() => { seen.heldNotReleased = true; });
  seen.released = await snapshot(page);
  // a boss: its entry, then defeat
  await page.waitForSelector('.qa-lab__encounter--boss', { timeout: 15000 });
  const bossFrame = await fight(page, 'boss');
  seen.bossStart = await snapshot(page);
  await bossFrame.locator('[data-qa="defeat"]').click({ force: true });
  await page.waitForTimeout(1200);
  seen.defeatCard = await snapshot(page);
  seen.timeline = await page.evaluate(() => window.__timeline);
  seen.final = await snapshot(page);
  await page.close();
  return seen;
}

mkdirSync('tmp/audio-direction', { recursive: true });
try {
  if (only !== 'combat') report.campaign = await campaign();
  if (only !== 'campaign') report.combat = await combat();
} catch (error) { report.failed = String(error); }
await browser.close();
writeFileSync('tmp/audio-direction/journey.json', JSON.stringify(report, null, 1));
const brief = (seen) => seen && { ...seen, timeline: undefined, timelineLength: seen.timeline?.length };
console.log(JSON.stringify({ failed: report.failed, errors: report.errors.slice(0, 5), campaign: brief(report.campaign), combat: brief(report.combat) }, null, 1).slice(0, 7000));
const contexts = (seen) => new Set(seen?.timeline?.map((row) => row.hosted) ?? []);
const { campaign: c, combat: f } = report;
const checks = {
  noAudioBeforeGesture: !c || (c.beforeGesture.contexts === 0 && c.afterSynthetic.contexts === 0),
  oneContext: (!c || c.final.contexts === 1) && (!f || f.final.contexts === 1),
  campaignSurfaces: !c || ['title', 'drama', 'refuge', 'map', 'tension', 'combat'].every((id) => contexts(c).has(id)),
  mapAmbience: !c || c.map?.host?.ambience === 'map',
  refugeAmbience: !c || c.refugeHub?.host?.ambience === 'refuge',
  fightSurfaces: !f || ['combat', 'victory', 'boss', 'defeat'].every((id) => contexts(f).has(id)),
  ultimateVoice: !f || f.timeline.some((row) => row.voices.some((id) => id.startsWith('sig.'))),
  actionLevel: !f || f.timeline.some((row) => row.level === 'action'),
  fanfareHeld: !f || !f.heldNotReleased,
  peak: [c, f].every((seen) => !seen || seen.final.peak <= 10 ** (-1 / 20) + 1e-3),
  noPageError: report.errors.length === 0 && !report.failed,
};
console.log(JSON.stringify(checks));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
