// scratch audit: loudness (ITU-R BS.1770 gating), level, spectrum balance and stereo width of every WAV.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function readWav(path) {
  const b = readFileSync(path);
  let at = 12, channels = 1, rate = 44100, bits = 16, data = null;
  while (at + 8 <= b.length) {
    const id = b.toString('ascii', at, at + 4), size = b.readUInt32LE(at + 4);
    if (id === 'fmt ') { channels = b.readUInt16LE(at + 10); rate = b.readUInt32LE(at + 12); bits = b.readUInt16LE(at + 22); }
    if (id === 'data') data = b.subarray(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  const frames = Math.floor(data.length / (bits / 8) / channels);
  const out = Array.from({ length: channels }, () => new Float64Array(frames));
  for (let i = 0; i < frames; i++) for (let c = 0; c < channels; c++) {
    const p = (i * channels + c) * (bits / 8);
    out[c][i] = bits === 16 ? data.readInt16LE(p) / 32768 : bits === 24 ? data.readIntLE(p, 3) / 8388608 : data.readFloatLE(p);
  }
  return { channels: out, rate, frames };
}

function biquad(x, [b0, b1, b2], [a1, a2]) {
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
function kWeight(x, fs) {
  let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / fs);
  const Vh = 10 ** (G / 20), Vb = Vh ** 0.4996667741545416, a0 = 1 + K / Q + K * K;
  const shelf = biquad(x, [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], [2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]);
  f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan(Math.PI * f0 / fs);
  const d = 1 + K / Q + K * K;
  return biquad(shelf, [1, -2, 1], [2 * (K * K - 1) / d, (1 - K / Q + K * K) / d]);
}
const db = (v) => (v > 0 ? 10 * Math.log10(v) : -Infinity);
function blocks(channels, fs, seconds, hop) {
  const z = channels.map((c) => kWeight(c, fs)), size = Math.round(seconds * fs), step = Math.round(hop * fs), out = [];
  for (let s = 0; s + size <= z[0].length; s += step) {
    let sum = 0;
    for (const c of z) { let e = 0; for (let i = s; i < s + size; i++) e += c[i] * c[i]; sum += e / size; }
    out.push({ s: s / fs, l: -0.691 + db(sum) });
  }
  return out;
}
function integrated(channels, fs) {
  const b = blocks(channels, fs, 0.4, 0.1).filter((x) => x.l > -70);
  if (!b.length) return -Infinity;
  const mean = (a) => -0.691 + db(a.reduce((n, x) => n + 10 ** ((x.l + 0.691) / 10), 0) / a.length);
  const gate = mean(b) - 10;
  return mean(b.filter((x) => x.l > gate));
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
const BANDS = [['sub<60', 0, 60], ['bas60-250', 60, 250], ['bm250-500', 250, 500], ['med500-2k', 500, 2000], ['hm2-6k', 2000, 6000], ['air>6k', 6000, 24000]];
function spectrum(mono, fs) {
  const N = 8192, hann = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  const energy = BANDS.map(() => 0);
  let total = 0, weighted = 0;
  const step = mono.length > N * 4 ? N : N >> 1;
  for (let s = 0; s + N <= mono.length || s === 0; s += step) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N && s + i < mono.length; i++) re[i] = mono[s + i] * hann[i];
    fft(re, im);
    for (let k = 1; k < N / 2; k++) {
      const f = k * fs / N, p = re[k] * re[k] + im[k] * im[k];
      total += p; weighted += p * f;
      for (let b = 0; b < BANDS.length; b++) if (f >= BANDS[b][1] && f < BANDS[b][2]) energy[b] += p;
    }
  }
  return { shares: energy.map((e) => Math.round(100 * e / total)), centroid: Math.round(weighted / total) };
}

function analyse(path) {
  const { channels, rate, frames } = readWav(path);
  let peak = 0, sum = 0;
  for (const c of channels) for (let i = 0; i < frames; i++) { const a = Math.abs(c[i]); if (a > peak) peak = a; sum += c[i] * c[i]; }
  const rms = Math.sqrt(sum / (frames * channels.length));
  const mono = new Float64Array(frames);
  for (let i = 0; i < frames; i++) mono[i] = channels.reduce((n, c) => n + c[i], 0) / channels.length;
  let side = 0, mid = 0;
  if (channels.length === 2) for (let i = 0; i < frames; i++) { const m = (channels[0][i] + channels[1][i]) / 2, s = (channels[0][i] - channels[1][i]) / 2; mid += m * m; side += s * s; }
  const short = frames > rate * 4 ? blocks(channels, rate, 3, 1).map((b) => b.l).filter((l) => l > -70).sort((a, b) => a - b) : [];
  const q = (p) => short[Math.floor((short.length - 1) * p)];
  const win = Math.max(1, Math.round(0.05 * rate));
  let top = 0, topAt = 0, onset = -1;
  for (let i = 0; i + win <= frames; i += Math.round(win / 4)) { let e = 0; for (let k = i; k < i + win; k++) e += mono[k] * mono[k]; if (e > top) { top = e; topAt = i; } }
  for (let i = 0; i < frames && onset < 0; i++) if (Math.abs(mono[i]) > peak * 0.5) onset = i;
  return {
    seconds: +(frames / rate).toFixed(2), rate, peakDb: +(20 * Math.log10(peak)).toFixed(1), rmsDb: +(20 * Math.log10(rms)).toFixed(1), crest: +(20 * Math.log10(peak / rms)).toFixed(1),
    lufs: +integrated(channels, rate).toFixed(1), lra: short.length ? +(q(0.95) - q(0.1)).toFixed(1) : null, sideDb: channels.length === 2 ? +(10 * Math.log10(side / mid)).toFixed(1) : null,
    momentaryMaxDb: +(db(top / win)).toFixed(1), attackMs: Math.round(1000 * onset / rate), ...spectrum(mono, rate),
  };
}

const dirs = process.argv.slice(2);
const rows = [];
for (const dir of dirs) for (const f of readdirSync(dir).filter((n) => n.endsWith('.wav') && n !== 'preview-all.wav').sort()) rows.push({ file: f.replace('.wav', ''), ...analyse(join(dir, f)) });
const print = (filter, keys) => {
  const list = rows.filter(filter);
  console.log(['file'.padEnd(30), ...keys.map((k) => k.padStart(9)), ...BANDS.map((b) => b[0].padStart(10))].join(''));
  for (const r of list) console.log([r.file.padEnd(30), ...keys.map((k) => String(r[k] ?? '').padStart(9)), ...r.shares.map((s) => `${s}%`.padStart(10))].join(''));
};
print((r) => /^(music|ambience)/.test(r.file), ['seconds', 'lufs', 'lra', 'peakDb', 'crest', 'sideDb', 'centroid']);
console.log('');
print((r) => !/^(music|ambience)/.test(r.file), ['seconds', 'peakDb', 'momentaryMaxDb', 'attackMs', 'centroid']);
