// Records the real output of the music engine and its ambience to WAV in an ignored path (dev server on 5173).
// Usage: node tools/audio/capture.mjs [job,job] ; OUT overrides the folder. Then: node tools/audio/analyze.mjs <folder>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.env.OUT ?? 'tmp/audio-direction/wav';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

function wavFile(interleaved, channels, rate) {
  const data = Buffer.from(interleaved, 'base64');
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); head.writeUInt16LE(channels, 22); head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * channels * 2, 28);
  head.writeUInt16LE(channels * 2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

const record = (args) => page.evaluate(async ({ context, scene, seconds, level, section, volume, settle }) => {
  const { createMusicDirector } = await import('/src/audio/music/MusicDirector.ts');
  const ctx = new AudioContext({ sampleRate: 48000 });
  await ctx.resume();
  const code = "class C extends AudioWorkletProcessor{process(i){const c=i[0];if(c&&c[0]){this.port.postMessage([c[0].slice(0),(c[1]||c[0]).slice(0)]);}return true;}}registerProcessor('cap',C);";
  await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
  const cap = new AudioWorkletNode(ctx, 'cap', { channelCount: 2, channelCountMode: 'explicit', outputChannelCount: [2] });
  cap.connect(ctx.destination);
  const director = createMusicDirector(ctx, cap);
  director.setVolume(volume);
  let last = -1;
  for (let i = 0; i < 300; i++) { await new Promise((r) => setTimeout(r, 200)); const n = director.state.samples; if (n === last && n > 0) break; last = n; }
  await new Promise((r) => setTimeout(r, 1500)); // rooms load one per task
  if (level) director.setLevel(level);
  if (context) director.setContext(context);
  if (section) director.seek(section);
  if (scene) director.setAmbience(scene);
  await new Promise((r) => setTimeout(r, settle)); // skip the fade in
  const blocks = [];
  cap.port.onmessage = (e) => blocks.push(e.data);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  cap.port.onmessage = null;
  director.dispose();
  await ctx.close();
  const frames = blocks.reduce((n, b) => n + b[0].length, 0);
  const pcm = new Int16Array(frames * 2);
  let at = 0;
  for (const [l, r] of blocks) for (let i = 0; i < l.length; i++) { pcm[at++] = Math.max(-1, Math.min(1, l[i])) * 32767; pcm[at++] = Math.max(-1, Math.min(1, r[i])) * 32767; }
  const bytes = new Uint8Array(pcm.buffer);
  let text = '';
  for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(text);
}, { settle: 1500, volume: 0.6, ...args });

const only = (process.argv[2] ?? '').split(',').filter(Boolean);
const allJobs = [
  { name: 'music-title', context: 'title', seconds: 40 },
  { name: 'music-map', context: 'map', seconds: 40 },
  { name: 'music-refuge', context: 'refuge', seconds: 40 },
  { name: 'music-tension', context: 'tension', seconds: 40 },
  { name: 'music-drama', context: 'drama', seconds: 40 },
  { name: 'music-combat-action', context: 'combat', level: 'action', seconds: 40 },
  { name: 'music-combat-reflection', context: 'combat', level: 'reflection', seconds: 40 },
  { name: 'music-combat-bridge', context: 'combat', level: 'action', section: 'bridge', seconds: 30 },
  { name: 'music-boss-action', context: 'boss', level: 'action', seconds: 40 },
  { name: 'music-boss-reflection', context: 'boss', level: 'reflection', seconds: 30 },
  { name: 'music-victory', context: 'victory', seconds: 9, settle: 0 },
  { name: 'music-defeat', context: 'defeat', seconds: 9, settle: 0 },
  { name: 'ambience-forest_route', scene: 'forest_route', seconds: 16 },
  { name: 'ambience-bois_clair_burning', scene: 'bois_clair_burning', seconds: 16 },
  { name: 'ambience-lion_sanctum', scene: 'lion_sanctum', seconds: 16 },
  { name: 'ambience-map', scene: 'map', seconds: 16 },
  { name: 'ambience-refuge', scene: 'refuge', seconds: 16 },
];
for (const job of allJobs.filter((j) => !only.length || only.includes(j.name))) {
  const b64 = await record({ context: job.context ?? null, scene: job.scene ?? null, seconds: job.seconds, level: job.level ?? null, section: job.section ?? null, ...(job.settle === undefined ? {} : { settle: job.settle }) });
  writeFileSync(`${OUT}/${job.name}.wav`, wavFile(b64, 2, 48000));
  console.log(job.name, 'done');
}
console.log(errors[0] ?? 'no page errors');
await browser.close();
