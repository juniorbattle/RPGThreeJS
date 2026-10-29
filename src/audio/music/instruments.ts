/**
 * Instruments built by code (pure, numeric): each function computes one note or hit as mono samples, without
 * Web Audio, so a worker can compute it once and keep it in memory. Damped oscillators by complex rotation,
 * additive synthesis with per-partial decay, shaped noise and pitch sweeps; seeded randomness only.
 * Adapted from the RPGCards M13 engine (`src/son/musique/instruments.ts`) under OD-2026-10-29-B:
 * the primitives are kept; harp, lute, timpani and the drums are new voicings for this project.
 */
import { freq, seededRandom } from './theory';

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));
const samples = (sr: number, s: number): number => Math.max(1, Math.round(sr * s));

/** Adds a damped partial (frequency `f`, amplitude `a`, time constant `tau` in s) from sample `from`. */
export function damped(out: Float32Array, sr: number, f: number, a: number, tau: number, phase = 0, from = 0): void {
  if (f <= 0 || f >= sr * 0.46 || a === 0) return;
  const w = (TAU * f) / sr;
  const r = Math.exp(-1 / (tau * sr));
  const c = Math.cos(w) * r;
  const s = Math.sin(w) * r;
  let x = Math.cos(phase) * a;
  let y = Math.sin(phase) * a;
  const floor = Math.abs(a) * 1e-4;
  for (let i = from; i < out.length; i++) {
    out[i]! += y;
    const nx = x * c - y * s;
    y = x * s + y * c;
    x = nx;
    if ((i & 511) === 0 && Math.abs(x) + Math.abs(y) < floor) break;
  }
}

/** RBJ biquad applied in place: low-pass, high-pass, band-pass, peaking. */
export function biquad(buf: Float32Array, sr: number, type: 'lp' | 'hp' | 'bp' | 'pk', f: number, q: number, gainDb = 0): void {
  const w = (TAU * clamp(f, 10, sr * 0.45)) / sr;
  const cw = Math.cos(w);
  const al = Math.sin(w) / (2 * q);
  const A = 10 ** (gainDb / 40);
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x0 = buf[i]!;
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    buf[i] = y0;
  }
}

/** Seeded white noise with an exponential envelope (attack `att` s, decay `tau` s). */
function noise(n: number, sr: number, rng: () => number, tau: number, att = 0.0005): Float32Array<ArrayBuffer> {
  const b = new Float32Array(n);
  const k = Math.exp(-1 / (tau * sr));
  const na = Math.max(1, Math.round(att * sr));
  let e = 1;
  for (let i = 0; i < n; i++) {
    b[i] = (rng() * 2 - 1) * e * (i < na ? i / na : 1);
    e *= k;
  }
  return b;
}

const mix = (out: Float32Array, b: Float32Array, g: number): void => { for (let i = 0; i < Math.min(out.length, b.length); i++) out[i]! += b[i]! * g; };

function attack(out: Float32Array, sr: number, s: number): void {
  const n = Math.min(out.length, Math.round(s * sr));
  for (let i = 0; i < n; i++) out[i]! *= i / n;
}

/** Soft ending: a note sampled to its end fades out on a cosine over `s` seconds. */
function tail(out: Float32Array, sr: number, s = 0.05): void {
  const n = Math.min(out.length, Math.round(s * sr));
  for (let i = 0; i < n; i++) out[out.length - 1 - i]! *= 0.5 - 0.5 * Math.cos((Math.PI * i) / n);
}

function normalise(out: Float32Array<ArrayBuffer>, peak: number): Float32Array<ArrayBuffer> {
  let m = 0;
  for (let i = 0; i < out.length; i++) m = Math.max(m, Math.abs(out[i]!));
  if (m > 0) { const g = peak / m; for (let i = 0; i < out.length; i++) out[i]! *= g; }
  return out;
}

// ------------------------------------------------------------------ pitched

/** Concert harp: bright plucked gut string, long ringing fundamental, quick upper partials, soundboard warmth. */
export function harp(sr: number, m: number, vel: number): Float32Array<ArrayBuffer> {
  const f0 = freq(m);
  const dur = clamp(4.2 - (m - 40) * 0.035, 1.8, 4.2);
  const out = new Float32Array(samples(sr, dur));
  const rng = seededRandom(0x4a59 + m * 5 + Math.round(vel * 10));
  const tau0 = clamp(3.2 * 2 ** (-(m - 40) / 26), 0.9, 3.2);
  const fc = 2400 + 3200 * vel;
  for (let k = 1; k <= 28; k++) {
    const fk = k * f0 * Math.sqrt(1 + 0.00003 * k * k);
    if (fk > sr * 0.44) break;
    const a = (Math.abs(Math.sin(Math.PI * k * 0.5)) * 0.6 + 0.4) / k ** 1.35 / (1 + (fk / fc) ** 2);
    const tk = tau0 / (1 + 0.42 * (k - 1));
    const det = (0.1 + rng() * 0.2) * 1e-3;
    damped(out, sr, fk, a * 0.6, tk, rng() * TAU);
    damped(out, sr, fk * (1 + det), a * 0.4, tk * 0.85, rng() * TAU);
  }
  const finger = noise(samples(sr, 0.015), sr, rng, 0.003);
  biquad(finger, sr, 'lp', 1800, 0.7);
  mix(out, finger, 0.03 * vel);
  biquad(out, sr, 'pk', 240, 1.2, 2);
  attack(out, sr, 0.0012);
  tail(out, sr, dur * 0.3);
  return normalise(out, 0.4 + 0.45 * vel);
}

/** Lute: plucked double courses near the rose, nasal body resonances, faster decay than the harp. */
export function lute(sr: number, m: number, vel: number): Float32Array<ArrayBuffer> {
  const f0 = freq(m);
  const dur = clamp(2.6 - (m - 40) * 0.025, 1.3, 2.6);
  const out = new Float32Array(samples(sr, dur));
  const rng = seededRandom(0x1e7e + m * 3 + Math.round(vel * 10));
  const tau0 = clamp(1.9 * 2 ** (-(m - 40) / 28), 0.7, 1.9);
  const fc = 1900 + 2600 * vel;
  for (let k = 1; k <= 32; k++) {
    const fk = k * f0 * Math.sqrt(1 + 0.00003 * k * k);
    if (fk > sr * 0.44) break;
    const a = (Math.abs(Math.sin(Math.PI * k * 0.2)) + 0.05) / k ** 1.15 / (1 + (fk / fc) ** 2);
    const tk = tau0 / (1 + 0.38 * (k - 1));
    const det = (0.8 + rng() * 0.8) * 1e-3; // the course's second string, slightly apart
    damped(out, sr, fk, a * 0.55, tk, rng() * TAU);
    damped(out, sr, fk * (1 + det), a * 0.45, tk * 0.9, rng() * TAU);
  }
  const pluck = noise(samples(sr, 0.012), sr, rng, 0.0025);
  biquad(pluck, sr, 'bp', 2200, 0.8);
  mix(out, pluck, 0.04 * vel);
  biquad(out, sr, 'pk', 320, 1.4, 3);
  biquad(out, sr, 'pk', 1250, 1.2, 2);
  biquad(out, sr, 'pk', 3500, 1, -3);
  attack(out, sr, 0.001);
  tail(out, sr, dur * 0.3);
  return normalise(out, 0.42 + 0.45 * vel);
}

/** Timpani: tuned kettle membrane (modes near 1 : 1.5 : 1.98 : 2.44), felt mallet thump, long bloom. */
export function timpani(sr: number, m: number, vel: number): Float32Array<ArrayBuffer> {
  const f0 = freq(m);
  const dur = 3.2;
  const out = new Float32Array(samples(sr, dur));
  const rng = seededRandom(0x7177 + m);
  for (const [ratio, amp, tau] of [[1, 1, 1.9], [1.504, 0.55, 1.2], [1.98, 0.32, 0.8], [2.44, 0.2, 0.55], [2.9, 0.12, 0.35]] as const) {
    damped(out, sr, f0 * ratio, amp, tau * (0.8 + 0.3 * vel), rng() * TAU);
  }
  // the membrane settles: a short low-pitched thud below the note
  damped(out, sr, f0 * 0.62, 0.5 * vel, 0.08, 0);
  const felt = noise(samples(sr, 0.04), sr, rng, 0.01);
  biquad(felt, sr, 'lp', 700 + 900 * vel, 0.7);
  mix(out, felt, 0.25 * vel);
  attack(out, sr, 0.002);
  tail(out, sr, 0.6);
  return normalise(out, 0.5 + 0.4 * vel);
}

// ------------------------------------------------------------------ unpitched (variants)

/** War drum: large low skin with a falling pitch and a long boom; variant 1 is a softer, higher drum. */
export function warDrum(sr: number, variant: number): Float32Array<ArrayBuffer> {
  const soft = variant === 1;
  const n = samples(sr, soft ? 0.6 : 1.1);
  const out = new Float32Array(n);
  const rng = seededRandom(0xd2a0 + variant);
  let ph = 0;
  const kA = Math.exp(-1 / ((soft ? 0.22 : 0.45) * sr));
  let A = 1;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const f = (soft ? 82 : 52) + (soft ? 60 : 70) * Math.exp(-t / 0.05);
    ph += f / sr;
    out[i] = Math.sin(TAU * ph) * A;
    A *= kA;
  }
  const skin = noise(samples(sr, 0.05), sr, rng, 0.012);
  biquad(skin, sr, 'lp', soft ? 1600 : 900, 0.7);
  mix(out, skin, soft ? 0.25 : 0.35);
  for (let i = 0; i < n; i++) out[i] = Math.tanh(out[i]! * 1.4) / Math.tanh(1.4);
  attack(out, sr, 0.001);
  tail(out, sr, 0.08);
  return normalise(out, soft ? 0.6 : 0.85);
}

/** Frame drum: hand-struck skin; variant 0 is the low "dum", variant 1 the bright rim "tek". */
export function frameDrum(sr: number, variant: number): Float32Array<ArrayBuffer> {
  const rng = seededRandom(0xf4a0 + variant);
  const out = new Float32Array(samples(sr, variant === 0 ? 0.5 : 0.18));
  if (variant === 0) {
    damped(out, sr, 120, 1, 0.16, 0);
    damped(out, sr, 196, 0.35, 0.08, 1);
    const slap = noise(out.length, sr, rng, 0.02);
    biquad(slap, sr, 'lp', 900, 0.7);
    mix(out, slap, 0.3);
  } else {
    damped(out, sr, 640, 0.5, 0.03, 0);
    const tek = noise(out.length, sr, rng, 0.03);
    biquad(tek, sr, 'bp', 3200, 0.9);
    mix(out, tek, 0.9);
  }
  attack(out, sr, 0.0006);
  tail(out, sr, 0.03);
  return normalise(out, variant === 0 ? 0.7 : 0.45);
}

/** Suspended cymbal: inharmonic partials and banded noise; variant 1 is a soft swell for phrase ends. */
export function cymbal(sr: number, variant: number): Float32Array<ArrayBuffer> {
  const swell = variant === 1;
  const out = new Float32Array(samples(sr, 3.4));
  const rng = seededRandom(0xc7b0 + variant);
  for (let i = 0; i < 60; i++) {
    const f = 360 * Math.exp(rng() * Math.log(28));
    const a = (0.25 + rng()) * (500 / f) ** 0.3 / 10;
    damped(out, sr, f, a, clamp(1.8 * (600 / f) ** 0.55, 0.12, 2.4), rng() * TAU);
  }
  for (const [f, q, part] of [[3500, 0.9, 0.45], [6000, 1, 0.35], [9500, 1.3, 0.25]] as const) {
    const b = noise(out.length, sr, rng, 1.8 * part * 1.5, 0.002);
    biquad(b, sr, 'bp', f, q);
    mix(out, b, 0.8);
  }
  if (swell) {
    // a mallet roll: the level grows for a second before the crest
    const n = Math.round(sr * 1.1);
    for (let i = 0; i < out.length; i++) out[i]! *= i < n ? (i / n) ** 2 : Math.exp(-(i - n) / (0.9 * sr));
  } else attack(out, sr, 0.0006);
  tail(out, sr, 0.25);
  return normalise(out, swell ? 0.55 : 0.7);
}
