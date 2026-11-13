// Browser check of the post-demo combat ambiences (set 1.20.0), with real gestures (Playwright input, no autoplay
// flag): the listening lab plays each of the six beds after a click, and one fight per biome starts its arena's bed.
// A bed is recognised by its noise buffer, whose first samples come from its seed. Nothing here judges the sound.
// Needs the dev server. Usage: node tools/audio/ambience-lab-check.mjs [http://localhost:5173/]
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://localhost:5173/').replace(/\/?$/, '/');
const FIGHTS = [
  ['bear_pass_beasts', 'bear_mountains'], ['dragon_lair_assault', 'dragon_peaks'], ['scorpion_temple_assault', 'scorpion_desert'],
  ['finale_raven_bout', 'tournament_arena'], ['finale_demon_square', 'corrupted_capital'], ['finale_arena_assault', 'breach'],
];
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [], missingMedia = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') (/Failed to load resource/.test(m.text()) ? missingMedia : errors).push(m.text()); });
await page.addInitScript(() => {
  window.__beds = []; window.__rms = 0;
  const createBuffer = BaseAudioContext.prototype.createBuffer;
  BaseAudioContext.prototype.createBuffer = function (channels, length, rate) {
    const buffer = createBuffer.call(this, channels, length, rate);
    if (channels === 1 && !(this instanceof OfflineAudioContext) && (length === rate * 6 || length === rate * 2)) window.__beds.push(buffer);
    return buffer;
  };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode && !(this.context instanceof OfflineAudioContext) && !window.__tap) {
      const tap = this.context.createAnalyser(); tap.fftSize = 2048;
      connect.call(this, tap); window.__tap = tap;
      const data = new Float32Array(tap.fftSize);
      setInterval(() => { tap.getFloatTimeDomainData(data); let s = 0; for (const x of data) s += x * x; window.__rms = Math.sqrt(s / data.length); }, 50);
    }
    return connect.call(this, target, ...rest);
  };
});
/** The beds started since the last call, by seed, and the output level now. */
const beds = () => page.evaluate(async () => {
  const { POST_DEMO_AMBIENCES, postDemoSeed } = await import('/src/audio/music/ambiencePostDemo.ts');
  const { seededRandom } = await import('/src/audio/music/theory.ts');
  const found = window.__beds.splice(0).map((buffer) => {
    const d = buffer.getChannelData(0);
    for (const id of POST_DEMO_AMBIENCES) { const r = seededRandom(postDemoSeed(id)); if (Math.abs(d[0] - (r() * 2 - 1)) < 1e-6 && Math.abs(d[1] - (r() * 2 - 1)) < 1e-6) return id; }
    // the demo's beds: seed 0xa3b1 + 977 times the length of their name (forest route and sanctum share one)
    for (const length of [12, 18, 3, 6]) { const r = seededRandom(0xa3b1 + length * 977); if (Math.abs(d[0] - (r() * 2 - 1)) < 1e-6 && Math.abs(d[1] - (r() * 2 - 1)) < 1e-6) return 'a demo bed'; }
    return null; // another mono buffer of the same length (the music's voices and samples)
  }).filter(Boolean);
  return { found, rms: +(20 * Math.log10(Math.max(window.__rms, 1e-9))).toFixed(1) };
});
const openQa = async () => {
  await page.goto(`${base}?qa=1`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'QA rencontres' }).click();
  await page.waitForSelector('[data-qa-sounds]');
};

const out = { lab: {}, fights: {} };
await openQa();
await page.click('[data-qa-sounds]');
await page.waitForFunction(() => /Tout est prêt|pas disponible/.test(document.querySelector('[data-lab-status]')?.textContent ?? ''), null, { timeout: 60000 });
out.labStatus = await page.textContent('[data-lab-status]');
await page.click('[data-act="stop"]');
await page.waitForTimeout(2500);
await beds();
for (const [, id] of FIGHTS) {
  await page.click(`[data-act="ambience:${id}"]`);
  await page.waitForTimeout(3500);
  out.lab[id] = { ...(await beds()), status: await page.textContent('[data-lab-status]') };
}
await page.click('[data-act="stop"]');
for (const [fight, id] of FIGHTS) {
  await openQa();
  await beds();
  await page.click(`[data-qa-combat="${fight}"]`);
  await page.waitForTimeout(7000);
  out.fights[fight] = { expected: id, ...(await beds()) };
}
console.log(JSON.stringify(out, null, 1));
console.log(errors.length ? `page errors:\n${errors.join('\n')}` : 'no page errors');
console.log(`missing media requests (Git-ignored media absent from this checkout): ${missingMedia.length}`);
await browser.close();
const ok = errors.length === 0
  && FIGHTS.every(([, id]) => out.lab[id].found.includes(id) && out.lab[id].rms > -90)
  && FIGHTS.every(([fight, id]) => out.fights[fight].found.includes(id) && !out.fights[fight].found.includes('a demo bed'));
process.exit(ok ? 0 : 1);
