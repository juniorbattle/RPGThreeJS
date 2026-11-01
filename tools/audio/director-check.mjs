// Measures the limits of the music stream on the real engine (OD-2026-11-01-B, AUTHORING_AND_QA): fanfare length and
// hold, boss entry, attenuation depth and release, the -1 dBFS peak of the loudest mix rendered offline, and main-thread
// frames while the music schedules. Needs the dev server on 5173. Usage: node tools/audio/director-check.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const result = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const { createMusicDirector } = await import('/src/audio/music/MusicDirector.ts');
  const { createMix, LIMITER_CEILING } = await import('/src/audio/mix.ts');
  const { renderCue } = await import('/src/audio/synthCues.ts');
  const { sectionSeconds, THEMES } = await import('/src/audio/music/themes.ts');
  const out = {};
  const long = [];
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) long.push(Math.round(entry.duration)); });
  try { observer.observe({ entryTypes: ['longtask'] }); } catch { /* not available */ }
  const ctx = new AudioContext({ sampleRate: 48000 });
  await ctx.resume();
  const code = "class C extends AudioWorkletProcessor{process(i){const c=i[0];if(c&&c[0]&&this.on!==false){this.port.postMessage([c[0].slice(0),(c[1]||c[0]).slice(0)]);}return true;}}registerProcessor('cap',C);";
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
  const cap = new AudioWorkletNode(ctx, 'cap', { channelCount: 2, channelCountMode: 'explicit', outputChannelCount: [2] });
  cap.connect(ctx.destination);
  const director = createMusicDirector(ctx, cap);
  director.setVolume(0.6);
  let last = -1;
  for (let i = 0; i < 300; i++) { await sleep(200); const n = director.state.samples; if (n === last && n > 0) break; last = n; }
  await sleep(1500);
  // a fanfare keeps the stream against a surface that asks for its track, then hands over
  const fanfare = async (id) => {
    director.setContext('combat');
    await sleep(2500);
    const t0 = ctx.currentTime;
    director.setContext(id);
    await sleep(1000);
    director.setContext('map');
    const heldAfterRequest = director.state.context;
    while (director.state.context === id && ctx.currentTime - t0 < 12) await sleep(20);
    return { heldAfterRequest, handedOverAt: +(ctx.currentTime - t0).toFixed(2), then: director.state.context };
  };
  out.victory = await fanfare('victory');
  out.defeat = await fanfare('defeat');
  // a combat context replaces it at once
  director.setContext('victory');
  await sleep(1000);
  director.setContext('combat');
  out.fightReplacesFanfare = director.state.context;
  // muting cuts it at once and nothing returns
  director.setContext('defeat');
  await sleep(600);
  director.setContext('map');
  director.setContext(null);
  await sleep(100);
  out.muteTakesFanfare = director.state.context;
  // the boss entry
  const started = ctx.currentTime;
  director.setContext('boss');
  await sleep(300);
  out.bossEntry = { firstSection: director.state.section, writtenSeconds: +sectionSeconds(THEMES.boss.sections[0]).toFixed(2), mainSectionAt: +(director.current.nextPassAt - started).toFixed(2) };
  // attenuation: depth, and the time back to unity after the last signature cue
  await sleep(500);
  const gain = director.duck.gain, hold = ctx.currentTime + 1;
  director.attenuate(hold);
  let lowest = 1, backAt = null;
  while (ctx.currentTime < hold + 2) {
    await sleep(10);
    lowest = Math.min(lowest, gain.value);
    if (ctx.currentTime > hold && gain.value >= 0.999 && backAt === null) backAt = ctx.currentTime;
  }
  out.attenuation = { lowestDb: +(20 * Math.log10(lowest)).toFixed(2), releasedAfter: backAt === null ? null : +(backAt - hold).toFixed(2) };
  // main-thread frames while the music schedules, levels moving
  director.setContext('combat');
  const schedule = director.schedulePass.bind(director);
  let slowest = 0;
  director.schedulePass = (playing) => { const a = performance.now(); schedule(playing); slowest = Math.max(slowest, performance.now() - a); };
  long.length = 0;
  for (let i = 0; i < 6; i++) { director.setLevel(i % 2 ? 'reflection' : 'action'); await sleep(2000); }
  out.frames = { slowestSectionPlanMs: +slowest.toFixed(1), longTasks: [...long] };
  // the loudest mix, offline: the real boss track at default and maximum volume, ambience on, four voices at peak
  const record = async (volume, seconds) => {
    director.setVolume(volume);
    director.setLevel('action');
    director.setContext('boss');
    director.setAmbience('bois_clair_burning');
    await sleep(3000);
    const blocks = [];
    cap.port.onmessage = (e) => blocks.push(e.data);
    await sleep(seconds * 1000);
    cap.port.onmessage = null;
    const frames = blocks.reduce((n, b) => n + b[0].length, 0);
    const pcm = [new Float32Array(frames), new Float32Array(frames)];
    let at = 0;
    for (const [l, r] of blocks) { pcm[0].set(l, at); pcm[1].set(r, at); at += l.length; }
    return pcm;
  };
  const cue = await renderCue('sig.boss_apocalypse.blow', 48000);
  const loudest = async (pcm, voice = 1.1) => {
    const offline = new OfflineAudioContext(2, pcm[0].length, 48000);
    const mix = createMix(offline);
    const music = offline.createBuffer(2, pcm[0].length, 48000);
    music.copyToChannel(pcm[0], 0); music.copyToChannel(pcm[1], 1);
    const src = offline.createBufferSource(); src.buffer = music; src.connect(mix.input); src.start();
    for (let t = 0.2; t < pcm[0].length / 48000 - 1.2; t += 0.75) {
      for (let v = 0; v < 4; v++) { const s = offline.createBufferSource(); s.buffer = cue; const g = offline.createGain(); g.gain.value = voice; s.connect(g).connect(mix.input); s.start(t); }
    }
    const rendered = await offline.startRendering();
    let peak = 0;
    for (const c of [0, 1]) for (const x of rendered.getChannelData(c)) peak = Math.max(peak, Math.abs(x));
    let input = 0;
    for (const c of pcm) for (const x of c) input = Math.max(input, Math.abs(x));
    return { musicPeakDb: +(20 * Math.log10(input)).toFixed(2), mixPeakDb: +(20 * Math.log10(peak)).toFixed(2) };
  };
  const factory = await record(0.6, 18);
  out.loudestDefault = await loudest(factory);
  // at the factory volumes (effects 0.5) the sum stays under the compressor's -3 dBFS threshold: the limiter never touches the music
  out.factoryVolumes = await loudest(factory, 0.55);
  out.loudestMax = await loudest(await record(1, 18));
  out.ceilingDb = +(20 * Math.log10(LIMITER_CEILING)).toFixed(2);
  observer.disconnect();
  director.dispose();
  await ctx.close();
  return out;
});
console.log(JSON.stringify(result, null, 1));
console.log(errors[0] ?? 'no page errors');
await browser.close();
const ok = result.victory.handedOverAt <= 8.1 && result.defeat.handedOverAt <= 8.1 && result.victory.heldAfterRequest === 'victory' && result.bossEntry.mainSectionAt <= 6.2
  && result.attenuation.lowestDb >= -6 && result.attenuation.releasedAfter !== null && result.attenuation.releasedAfter <= 1 && result.loudestDefault.mixPeakDb <= -1 && result.loudestMax.mixPeakDb <= -1
  && result.factoryVolumes.mixPeakDb <= -3 && result.frames.longTasks.length === 0 && result.frames.slowestSectionPlanMs < 50;
process.exit(ok ? 0 : 1);
