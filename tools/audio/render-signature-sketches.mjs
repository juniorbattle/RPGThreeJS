// Renders the post-demo bosses' signature sketches (PLATEAU_MUSIC_DRAFT_2026-11-13) offline to WAV in an ignored path:
// charge, blow at the end of the charge, wave after the blow, each part within 2.5 s, at the cue table's 0.2 peak.
// They are proposals outside the closed cue table. Usage: BASE_URL=http://localhost:5173/ node tools/audio/render-signature-sketches.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.env.OUT ?? 'tmp/plateau-music/signatures';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

const rendered = await page.evaluate(async () => {
  const { POST_DEMO_SIGNATURE_SKETCHES } = await import('/src/audio/postDemoSignatureSketches.ts');
  const { scheduleDesign, cueNoise } = await import('/src/audio/synthCues.ts');
  const rate = 48000, PART = 2.5, PEAK = 0.2;
  const renderPart = async (design) => {
    const ctx = new OfflineAudioContext(1, Math.round(rate * PART), rate);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -9; limiter.knee.value = 6; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.18;
    limiter.connect(ctx.destination);
    scheduleDesign(ctx, limiter, cueNoise(ctx), design);
    const data = (await ctx.startRendering()).getChannelData(0);
    let peak = 0, last = 0;
    for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > peak) peak = a; if (a > 1e-4) last = i; }
    const out = data.slice(0, Math.min(data.length, last + Math.round(rate * 0.02)));
    for (let i = 0; i < out.length; i++) out[i] *= PEAK / (peak || 1);
    return out;
  };
  const results = [];
  for (const [id, { label, sketch }] of Object.entries(POST_DEMO_SIGNATURE_SKETCHES)) {
    const charge = await renderPart(sketch.charge), blow = await renderPart(sketch.blow), wave = await renderPart(sketch.wave);
    // the game plays the blow when the charge ends and the wave after the blow's first beat; here, end to end with a short overlap
    const at = [0, charge.length, charge.length + Math.round(rate * 0.35)];
    const total = new Float32Array(Math.max(at[1] + blow.length, at[2] + wave.length) + Math.round(rate * 0.5));
    [charge, blow, wave].forEach((part, k) => { for (let i = 0; i < part.length; i++) total[at[k] + i] += part[i]; });
    const pcm = new Int16Array(total.length);
    for (let i = 0; i < total.length; i++) pcm[i] = Math.max(-1, Math.min(1, total[i] * 2.5)) * 32767; // +8 dB for listening only
    const bytes = new Uint8Array(pcm.buffer);
    let text = '';
    for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    results.push({ id, label, seconds: [charge.length / rate, blow.length / rate, wave.length / rate], b64: btoa(text) });
  }
  return results;
});

for (const { id, label, seconds, b64 } of rendered) {
  const data = Buffer.from(b64, 'base64');
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22); head.writeUInt32LE(48000, 24); head.writeUInt32LE(96000, 28);
  head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(data.length, 40);
  writeFileSync(`${OUT}/signature-${id}.wav`, Buffer.concat([head, data]));
  console.log(`${label}: charge ${seconds[0].toFixed(2)} s, blow ${seconds[1].toFixed(2)} s, wave ${seconds[2].toFixed(2)} s`);
}
console.log(errors[0] ?? 'no page errors');
await browser.close();
