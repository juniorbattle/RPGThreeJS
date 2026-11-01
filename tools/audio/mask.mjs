// How much each combat cue stands out of the combat music at the default volumes: a band indicator on the mean of the
// music, not a psychoacoustic model. Renders the cues in Chromium (dev server on 5173), reads the captures of capture.mjs.
// Cue chain: PCM x 1.1 (combat voice) x 0.5 (default effects volume); the music capture already holds its default chain.
// Usage: node tools/audio/mask.mjs [music.wav,music.wav] ; prints per cue, then per class.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const DIR = process.env.OUT ?? 'tmp/audio-direction/wav';
const tracks = (process.argv[2] ?? `${DIR}/music-combat-action.wav,${DIR}/music-combat-reflection.wav,${DIR}/music-boss-action.wav`).split(',');

function readWav(path) {
  const b = readFileSync(path);
  let at = 12, channels = 1, rate = 44100, data = null;
  while (at + 8 <= b.length) {
    const id = b.toString('ascii', at, at + 4), size = b.readUInt32LE(at + 4);
    if (id === 'fmt ') { channels = b.readUInt16LE(at + 10); rate = b.readUInt32LE(at + 12); }
    if (id === 'data') data = b.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  const frames = Math.floor(data.length / 2 / channels), mono = new Float64Array(frames);
  for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < channels; c++) s += data.readInt16LE((i * channels + c) * 2) / 32768; mono[i] = s / channels; }
  return { mono, rate };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const N = 2048, hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
const EDGES = [40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20000];
function bands(x, start, rate) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < N; i++) re[i] = (x[start + i] ?? 0) * hann[i];
  fft(re, im);
  const out = new Float64Array(EDGES.length - 1);
  for (let k = 1; k < N / 2; k++) { const f = k * rate / N, p = re[k] * re[k] + im[k] * im[k]; for (let b = 0; b < out.length; b++) if (f >= EDGES[b] && f < EDGES[b + 1]) out[b] += p; }
  return out;
}
const dB = (v) => 10 * Math.log10(v || 1e-20);
function profile(mono, rate, musicMean) {
  let best = 0, bestStart = 0;
  for (let s = 0; s + N / 2 < mono.length; s += N / 8) { let e = 0; for (let i = 0; i < N && s + i < mono.length; i++) e += (mono[s + i] * hann[i]) ** 2; if (e > best) { best = e; bestStart = s; } }
  const cue = bands(mono, bestStart, rate);
  let top = 0;
  cue.forEach((v, b) => { if (v > cue[top]) top = b; });
  return dB(cue[top]) - dB(musicMean[top]);
}
function meanOf(path) {
  const { mono, rate } = readWav(path);
  const mean = new Float64Array(EDGES.length - 1);
  let count = 0;
  for (let s = 0; s + N <= mono.length; s += N) { const b = bands(mono, s, rate); b.forEach((v, i) => { mean[i] += v; }); count++; }
  return { rate, mean: mean.map((v) => v / count) };
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
const cues = await page.evaluate(async () => {
  const { renderCue, TABLE_CUE_IDS } = await import('/src/audio/synthCues.ts');
  const out = {};
  for (const id of TABLE_CUE_IDS) { const buffer = await renderCue(id, 48000); out[id] = Array.from(buffer.getChannelData(0), (v) => v * 1.1 * 0.5); }
  return out;
});
await browser.close();

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const CLASSES = [['families', (id) => !id.includes('.')], ['composed', (id) => id.startsWith('fx.')], ['signature', (id) => id.startsWith('sig.')]];
for (const track of tracks) {
  const { rate, mean } = meanOf(track);
  const rows = Object.entries(cues).map(([id, pcm]) => [id, profile(Float64Array.from(pcm), rate, mean)]);
  console.log(track.split('/').pop());
  for (const [name, test] of CLASSES) {
    const values = rows.filter(([id]) => test(id)).map(([, snr]) => snr);
    console.log(`  ${name.padEnd(10)} median ${median(values).toFixed(1).padStart(6)} dB, under the music ${values.filter((v) => v < 0).length}/${values.length}`);
  }
  console.log(`  impacts    ${['physical-impact', 'magic-impact', 'critical', 'knockout'].map((id) => `${id} ${rows.find(([key]) => key === id)[1].toFixed(1)}`).join(', ')}`);
  console.log(`  lowest     ${rows.sort((a, b) => a[1] - b[1]).slice(0, 5).map(([id, v]) => `${id} ${v.toFixed(1)}`).join(', ')}`);
}
