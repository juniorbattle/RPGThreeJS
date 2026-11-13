// Offline measures of the combat ambiences (OD-2026-11-07-I, set 1.20.0; evidence rules of AUTHORING_AND_QA): each bed
// is rendered on a virtual clock through the game's chain (ambience bus, music volume, final limiter) to measure its
// loudness next to the demo's beds, its octave-band profile, the main-thread cost of building it and of each accent,
// the -1 dBFS peak of the loudest mix (the real boss track at default and maximum volume, the bed, four voices of the
// loudest signature cue at peak), and long tasks while each new bed plays live. It writes a 30 s WAV excerpt of each
// post-demo bed, at maximum music volume, to tmp/postdemo-ambiences/ (ignored). Measures never count as listening.
// Needs the dev server. Usage: node tools/audio/ambience-check.mjs [http://localhost:5173/] [--quick: loudness and profiles only]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const quick = process.argv.includes('--quick');
const url = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'http://localhost:5173/';
const outDir = 'tmp/postdemo-ambiences';
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

const result = await page.evaluate(async (quick) => {
  const { startAmbience } = await import('/src/audio/music/ambience.ts');
  const { POST_DEMO_AMBIENCES } = await import('/src/audio/music/ambiencePostDemo.ts');
  const { createMix, LIMITER_CEILING } = await import('/src/audio/mix.ts');
  const { createMusicDirector } = await import('/src/audio/music/MusicDirector.ts');
  const { renderCue } = await import('/src/audio/synthCues.ts');
  const DEMO = ['forest_route', 'bois_clair_burning', 'lion_sanctum', 'map', 'refuge'];
  const rate = 48000;
  // the director's chain (MusicDirector.ts): ambience bus at 2.2 into the music master, volumeCurve(v) = v^1.5 * 0.5
  const AMBIENCE_BUS = 2.2;
  const volumeCurve = (v) => Math.max(0, Math.min(1, v)) ** 1.5 * 0.5;
  const db = (v) => +(20 * Math.log10(Math.max(v, 1e-12))).toFixed(2);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Renders a bed on a virtual clock; `extra` adds other sources to the mix input. */
  const offline = async (id, seconds, volume, extra) => {
    const ctx = new OfflineAudioContext(2, Math.round(rate * seconds), rate);
    const mix = createMix(ctx);
    const master = ctx.createGain(); master.gain.value = volumeCurve(volume); master.connect(mix.input);
    const bus = ctx.createGain(); bus.gain.value = AMBIENCE_BUS; bus.connect(master);
    const queue = [];
    let now = 0, slowestAccentMs = 0, accents = 0;
    const clock = { now: () => now, after: (s, fn) => { const h = { at: now + s, fn, off: false }; queue.push(h); return h; }, cancel: (h) => { h.off = true; } };
    const t0 = performance.now();
    startAmbience(ctx, bus, id, clock);
    const startMs = performance.now() - t0;
    for (;;) {
      queue.sort((a, b) => a.at - b.at);
      const h = queue.shift();
      if (!h || h.at > seconds) break;
      if (h.off) continue;
      now = h.at;
      const a = performance.now(); h.fn(); slowestAccentMs = Math.max(slowestAccentMs, performance.now() - a); accents++;
    }
    extra?.(ctx, mix.input);
    return { rendered: await ctx.startRendering(), startMs, slowestAccentMs, accents };
  };
  /** Ungated BS.1770 K-weighted loudness over [from, end], in LUFS, and the sample peak. */
  const measure = async (buffer, from) => {
    const ctx = new OfflineAudioContext(2, buffer.length, rate);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const shelf = ctx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 1681; shelf.gain.value = 4;
    const high = ctx.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 38; high.Q.value = 0.5;
    src.connect(shelf).connect(high).connect(ctx.destination); src.start();
    const k = await ctx.startRendering();
    let sum = 0, peak = 0, rms = 0;
    const skip = Math.round(from * rate);
    for (let c = 0; c < 2; c++) {
      const w = k.getChannelData(c), d = buffer.getChannelData(c);
      let s = 0, r = 0;
      for (let i = skip; i < w.length; i++) { s += w[i] * w[i]; r += d[i] * d[i]; }
      sum += s / (w.length - skip); rms += r / (w.length - skip);
      for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    }
    return { lufs: +(-0.691 + 10 * Math.log10(sum)).toFixed(2), rmsDb: db(Math.sqrt(rms / 2)), peakDb: db(peak) };
  };
  /** Octave-band energy of the left+right sum, in dB relative to the loudest band (FFT of 4096-sample frames). */
  const bands = (buffer, from) => {
    const n = 4096, edges = [20, 80, 160, 315, 630, 1250, 2500, 5000, 10000, 20000];
    const energy = new Array(edges.length - 1).fill(0);
    const l = buffer.getChannelData(0), r = buffer.getChannelData(1);
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let start = Math.round(from * rate); start + n <= l.length; start += n * 4) {
      for (let i = 0; i < n; i++) { re[i] = (l[start + i] + r[start + i]) * 0.5 * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n)); im[i] = 0; }
      for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; } }
      for (let len = 2; len <= n; len <<= 1) {
        const ang = (-2 * Math.PI) / len;
        for (let i = 0; i < n; i += len) for (let j = 0; j < len / 2; j++) {
          const wr = Math.cos(ang * j), wi = Math.sin(ang * j);
          const xr = re[i + j + len / 2] * wr - im[i + j + len / 2] * wi, xi = re[i + j + len / 2] * wi + im[i + j + len / 2] * wr;
          re[i + j + len / 2] = re[i + j] - xr; im[i + j + len / 2] = im[i + j] - xi; re[i + j] += xr; im[i + j] += xi;
        }
      }
      for (let k = 1; k < n / 2; k++) {
        const hz = (k * rate) / n, band = edges.findIndex((e, b) => hz >= e && hz < edges[b + 1]);
        if (band >= 0) energy[band] += re[k] * re[k] + im[k] * im[k];
      }
    }
    const top = Math.max(...energy);
    return energy.map((e) => Math.round(10 * Math.log10(e / top)));
  };
  const wav = (buffer) => {
    const frames = buffer.length, out = new DataView(new ArrayBuffer(44 + frames * 4));
    const text = (at, s) => { for (let i = 0; i < s.length; i++) out.setUint8(at + i, s.charCodeAt(i)); };
    text(0, 'RIFF'); out.setUint32(4, 36 + frames * 4, true); text(8, 'WAVE'); text(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, rate, true);
    out.setUint32(28, rate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); text(36, 'data'); out.setUint32(40, frames * 4, true);
    const l = buffer.getChannelData(0), r = buffer.getChannelData(1);
    for (let i = 0; i < frames; i++) {
      out.setInt16(44 + i * 4, Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))), true);
      out.setInt16(46 + i * 4, Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))), true);
    }
    const bytes = new Uint8Array(out.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  };

  const out = { ceilingDb: db(LIMITER_CEILING), beds: {}, wavs: {}, loudest: {}, live: {} };
  // loudness at the default music volume, profile, and main-thread cost over two minutes of accents
  for (const id of [...DEMO, ...POST_DEMO_AMBIENCES]) {
    const { rendered, startMs } = await offline(id, 32, 0.6);
    const cost = await offline(id, 120, 0.6);
    out.beds[id] = { ...(await measure(rendered, 3)), bands: bands(rendered, 3), startMs: +startMs.toFixed(2), slowestAccentMs: +cost.slowestAccentMs.toFixed(2), accentsIn120s: cost.accents };
  }
  if (quick) return out;
  // 30 s excerpts of the post-demo beds at maximum music volume
  for (const id of POST_DEMO_AMBIENCES) {
    const { rendered } = await offline(id, 30, 1);
    out.wavs[id] = wav(rendered);
    out.beds[id].maxVolume = await measure(rendered, 3);
  }
  // the loudest mix: the real boss track (action level) recorded at default and maximum volume
  const ctx = new AudioContext({ sampleRate: rate });
  await ctx.resume();
  const code = "class C extends AudioWorkletProcessor{process(i){const c=i[0];if(c&&c[0]){this.port.postMessage([c[0].slice(0),(c[1]||c[0]).slice(0)]);}return true;}}registerProcessor('cap',C);";
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
  const cap = new AudioWorkletNode(ctx, 'cap', { channelCount: 2, channelCountMode: 'explicit', outputChannelCount: [2] });
  cap.connect(ctx.destination);
  const director = createMusicDirector(ctx, cap);
  let last = -1;
  for (let i = 0; i < 300; i++) { await sleep(200); const n = director.state.samples; if (n === last && n > 0) break; last = n; }
  const record = async (volume, seconds) => {
    director.setVolume(volume); director.setLevel('action'); director.setContext('boss');
    await sleep(3000);
    const blocks = [];
    cap.port.onmessage = (e) => blocks.push(e.data);
    await sleep(seconds * 1000);
    cap.port.onmessage = null;
    const frames = blocks.reduce((n, b) => n + b[0].length, 0);
    const pcm = ctx.createBuffer(2, frames, rate);
    let at = 0;
    for (const [l, r] of blocks) { pcm.copyToChannel(l, 0, at); pcm.copyToChannel(r, 1, at); at += l.length; }
    return pcm;
  };
  const music = { 0.6: await record(0.6, 16), 1: await record(1, 16) };
  director.dispose();
  const cue = await renderCue('sig.boss_apocalypse.blow', rate);
  for (const id of POST_DEMO_AMBIENCES) {
    out.loudest[id] = {};
    for (const volume of [0.6, 1]) {
      const pcm = music[volume];
      const { rendered } = await offline(id, pcm.length / rate, volume, (octx, input) => {
        const m = octx.createBufferSource(); m.buffer = pcm; m.connect(input); m.start();
        for (let t = 0.2; t < pcm.length / rate - 1.2; t += 0.75) for (let v = 0; v < 4; v++) {
          const s = octx.createBufferSource(); s.buffer = cue; const g = octx.createGain(); g.gain.value = 1.1; s.connect(g).connect(input); s.start(t);
        }
      });
      out.loudest[id][volume === 1 ? 'max' : 'default'] = (await measure(rendered, 0)).peakDb;
    }
  }
  // long tasks while each post-demo bed plays live for six seconds
  const long = [];
  const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) long.push(Math.round(entry.duration)); });
  try { observer.observe({ entryTypes: ['longtask'] }); } catch { /* not available */ }
  const bus = ctx.createGain(); bus.gain.value = AMBIENCE_BUS * volumeCurve(0.6); bus.connect(ctx.destination);
  for (const id of POST_DEMO_AMBIENCES) {
    long.length = 0;
    const t0 = performance.now();
    const stop = startAmbience(ctx, bus, id);
    const startMs = performance.now() - t0;
    await sleep(6000);
    stop();
    await sleep(1500);
    out.live[id] = { startMs: +startMs.toFixed(2), longTasks: [...long] };
  }
  observer.disconnect();
  await ctx.close();
  return out;
}, quick);

for (const [id, data] of Object.entries(result.wavs)) writeFileSync(`${outDir}/${id}-30s.wav`, Buffer.from(data, 'base64'));
delete result.wavs;
if (!quick) writeFileSync(`${outDir}/measures.json`, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1));
console.log(errors[0] ?? 'no page errors');
await browser.close();
if (quick) process.exit(errors.length ? 1 : 0);
const ids = Object.keys(result.loudest);
const ok = errors.length === 0 && ids.length === 6
  && ids.every((id) => result.loudest[id].default <= result.ceilingDb && result.loudest[id].max <= result.ceilingDb)
  && ids.every((id) => result.live[id].longTasks.length === 0 && result.beds[id].slowestAccentMs < 50 && result.beds[id].startMs < 50);
process.exit(ok ? 0 : 1);
