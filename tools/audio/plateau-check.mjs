// Main-thread frames while the plateaux's sketches play on the real engine (PLATEAU_MUSIC_DRAFT_2026-11-13): every
// part's six tracks and its scene tracks in turn, each part's instruments and room computed on its first track, both
// combat levels moved. Reports the longest task and every task over 50 ms. Needs a dev server (BASE_URL, default 5173).
// Usage: BASE_URL=http://localhost:5178/ node tools/audio/plateau-check.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const result = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const { createMusicDirector } = await import('/src/audio/music/MusicDirector.ts');
  const { PART_MUSIC } = await import('/src/audio/music/plateauTracks.ts');
  const long = [];
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) long.push({ ms: Math.round(entry.duration), at: Math.round(entry.startTime) }); });
  try { observer.observe({ entryTypes: ['longtask'] }); } catch { /* not available */ }
  const ctx = new AudioContext({ sampleRate: 48000 });
  await ctx.resume();
  const director = createMusicDirector(ctx, ctx.destination);
  director.setVolume(0.05);
  let last = -1;
  for (let i = 0; i < 300; i++) { await sleep(200); const n = director.state.samples; if (n === last && n > 0) break; last = n; }
  await sleep(1500);
  const before = long.length;
  const played = [];
  for (const [part, music] of Object.entries(PART_MUSIC)) {
    const asks = [...Object.keys(music.tracks).map((context) => ({ context, scene: null })),
      ...Object.entries(music.scenes ?? {}).flatMap(([scene, tracks]) => Object.keys(tracks).map((context) => ({ context, scene })))];
    for (const { context, scene } of asks) {
      director.setContext(context, { part, scene });
      await sleep(2500);
      if (context === 'combat' || context === 'boss') { director.setLevel('action'); await sleep(1500); director.setLevel('reflection'); }
      await sleep(1000);
      played.push(director.state.track);
    }
  }
  director.dispose();
  await ctx.close();
  return { played, samples: last, tasks: long.slice(before), loadTasks: long.slice(0, before) };
});
const over = result.tasks.filter((t) => t.ms > 50);
console.log(`tracks played: ${result.played.length} (${result.played.join(', ')})`);
console.log(`long tasks while the plateaux play: ${result.tasks.length}, longest ${Math.max(0, ...result.tasks.map((t) => t.ms))} ms, over 50 ms: ${over.length}`);
console.log(`long tasks while the Lion bank loads: ${result.loadTasks.length}, longest ${Math.max(0, ...result.loadTasks.map((t) => t.ms))} ms`);
console.log(errors[0] ?? 'no page errors');
await browser.close();
process.exit(over.length ? 1 : 0);
