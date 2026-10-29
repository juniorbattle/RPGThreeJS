/**
 * Real-time voices (Web Audio): strings, flute, horns, low brass and choir. A wind voice plays one-voice phrases:
 * tied notes glide without a new attack, detached notes are tongued; the timbre brightens with dynamics through a
 * non-linear shaper; vibrato comes late on held notes. Sections (strings, horns, brass, choir) stack slightly
 * detuned voices and widen through a stereo chorus. Adapted from the RPGCards M13 engine
 * (`src/son/musique/vents.ts`) under OD-2026-10-29-B; the horn, brass and choir profiles are new.
 */
import { freq, seededRandom } from './theory';

export type VoiceInstrument = 'strings' | 'flute' | 'horn' | 'brass' | 'choir';

/** A scheduled note: absolute start `t` and duration `d` in seconds, MIDI pitch `m`, velocity `v` (0..1). */
export interface TimedNote { t: number; d: number; m: number; v: number }

interface Filter { type: BiquadFilterType; f: number; q: number; g?: number }
export interface Profile {
  harmonics: readonly number[];
  /** Shaper stiffness (0: no shaper) and asymmetry (even harmonics). */
  k: number;
  b: number;
  oversample: OverSampleType;
  /** Shaper input at the softest and loudest dynamic. */
  pressure: readonly [number, number];
  attack: number;
  /** Overpressure at the attack (brighter onset). */
  burst: number;
  release: number;
  glide: number;
  /** Evolution of a held note (negative decays, positive swells). */
  hold: number;
  vibrato: { cents: number; hz: number; delay: number };
  breath: { level: number; rel: number; q: number };
  level: number;
  filters: readonly Filter[];
  /** Section voices, in cents around the note. */
  voices?: readonly number[];
  ensemble?: boolean;
}

export const PROFILES: Readonly<Record<VoiceInstrument, Profile>> = {
  strings: {
    harmonics: Array.from({ length: 24 }, (_, i) => 1 / (i + 1)),
    k: 0, b: 0, oversample: 'none', pressure: [1, 1], attack: 0.28, burst: 1, release: 0.3, glide: 0.05, hold: 0.06,
    vibrato: { cents: 7, hz: 5.4, delay: 0.18 }, breath: { level: 0, rel: 2, q: 0.8 }, level: 0.2,
    filters: [{ type: 'highpass', f: 55, q: 0.7 }, { type: 'peaking', f: 280, q: 1, g: 3 }, { type: 'peaking', f: 1100, q: 1, g: 1.5 }, { type: 'peaking', f: 3200, q: 1.5, g: -4 }, { type: 'lowpass', f: 5000, q: 0.7 }],
    voices: [-6, 6], ensemble: true,
  },
  flute: {
    harmonics: [1, 0.22, 0.1, 0.045, 0.02],
    k: 1.2, b: 0.05, oversample: 'none', pressure: [0.22, 0.6], attack: 0.05, burst: 1.1, release: 0.08, glide: 0.012, hold: 0,
    vibrato: { cents: 14, hz: 5.1, delay: 0.14 }, breath: { level: 0.1, rel: 2, q: 1.2 }, level: 0.5,
    filters: [{ type: 'highpass', f: 220, q: 0.7 }, { type: 'peaking', f: 900, q: 1, g: 2 }, { type: 'lowpass', f: 7000, q: 0.7 }],
  },
  horn: {
    harmonics: [1, 0.62, 0.42, 0.26, 0.16, 0.1, 0.06, 0.04],
    k: 1.6, b: 0.1, oversample: 'none', pressure: [0.3, 0.88], attack: 0.07, burst: 1.25, release: 0.14, glide: 0.03, hold: -0.03,
    vibrato: { cents: 4, hz: 5, delay: 0.6 }, breath: { level: 0, rel: 2, q: 0.8 }, level: 0.36,
    filters: [{ type: 'highpass', f: 60, q: 0.7 }, { type: 'peaking', f: 420, q: 1, g: 3 }, { type: 'peaking', f: 1000, q: 1.2, g: 2 }, { type: 'lowpass', f: 3000, q: 0.7 }],
    voices: [-5, 5], ensemble: true,
  },
  brass: {
    harmonics: [1, 0.75, 0.6, 0.5, 0.4, 0.32, 0.25, 0.2, 0.15, 0.12],
    k: 2.4, b: 0.15, oversample: 'none', pressure: [0.3, 0.95], attack: 0.06, burst: 1.4, release: 0.12, glide: 0.02, hold: -0.04,
    vibrato: { cents: 3, hz: 5, delay: 0.7 }, breath: { level: 0, rel: 2, q: 0.8 }, level: 0.32,
    filters: [{ type: 'highpass', f: 40, q: 0.7 }, { type: 'peaking', f: 700, q: 1, g: 3 }, { type: 'peaking', f: 2000, q: 1.5, g: 1 }, { type: 'lowpass', f: 4200, q: 0.7 }],
    voices: [-6, 0, 6], ensemble: true,
  },
  choir: {
    harmonics: Array.from({ length: 16 }, (_, i) => 1 / (i + 1) ** 1.2),
    k: 0, b: 0, oversample: 'none', pressure: [1, 1], attack: 0.55, burst: 1, release: 0.7, glide: 0.08, hold: 0.04,
    vibrato: { cents: 10, hz: 5, delay: 0.35 }, breath: { level: 0, rel: 2, q: 0.8 }, level: 0.16,
    // an open "ah": formants near 700, 1150 and 2600 Hz
    filters: [{ type: 'highpass', f: 120, q: 0.7 }, { type: 'peaking', f: 700, q: 4, g: 9 }, { type: 'peaking', f: 1150, q: 5, g: 7 }, { type: 'peaking', f: 2600, q: 5, g: 4 }, { type: 'lowpass', f: 4000, q: 0.7 }],
    voices: [-8, 0, 8], ensemble: true,
  },
};

// ------------------------------------------------------------------ pure: shaper, output, phrases

const S = 1.3;
export const DOMAIN = 2;
const fa = (p: Pick<Profile, 'k' | 'b'>, x: number): number => Math.tanh(p.k * (x * S + p.b)) - Math.tanh(p.k * p.b);
export function shaperCurve(p: Pick<Profile, 'k' | 'b'>, n = 2048): Float32Array<ArrayBuffer> {
  const c = new Float32Array(n);
  const norm = Math.abs(fa(p, 1));
  for (let i = 0; i < n; i++) c[i] = fa(p, ((i / (n - 1)) * 2 - 1) * DOMAIN) / norm;
  return c;
}
export function shaperGain(p: Pick<Profile, 'k' | 'b'>, a: number): number {
  if (p.k <= 0) return Math.max(0.05, a);
  return Math.max(0.05, fa(p, Math.min(DOMAIN, a)) / Math.abs(fa(p, 1)));
}

export type Articulation = 'first' | 'tied' | 'detached';
/** A note starting less than 30 ms after the previous one ends is tied to it. */
export function articulate(notes: readonly TimedNote[]): { articulations: Articulation[]; end: number } {
  const articulations = notes.map((n, i) => (i === 0 ? 'first' : n.t - (notes[i - 1]!.t + notes[i - 1]!.d) < 0.03 ? 'tied' : 'detached') as Articulation);
  const last = notes[notes.length - 1]!;
  return { articulations, end: last.t + last.d };
}

// ------------------------------------------------------------------ Web Audio

interface Resources { waves: Map<VoiceInstrument, PeriodicWave>; noise: AudioBuffer; curves: Map<VoiceInstrument, Float32Array<ArrayBuffer>> }
const RESOURCES = new WeakMap<BaseAudioContext, Resources>();
function resources(ctx: BaseAudioContext): Resources {
  let r = RESOURCES.get(ctx);
  if (r) return r;
  const rng = seededRandom(0x50ff1e);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = rng() * 2 - 1;
  r = { waves: new Map(), noise, curves: new Map() };
  RESOURCES.set(ctx, r);
  return r;
}
function wave(ctx: BaseAudioContext, instrument: VoiceInstrument): PeriodicWave {
  const r = resources(ctx);
  let w = r.waves.get(instrument);
  if (w) return w;
  const h = PROFILES[instrument].harmonics;
  const real = new Float32Array(h.length + 1);
  const imag = new Float32Array(h.length + 1);
  h.forEach((a, i) => { imag[i + 1] = a; });
  w = ctx.createPeriodicWave(real, imag);
  r.waves.set(instrument, w);
  return w;
}
function curveOf(ctx: BaseAudioContext, instrument: VoiceInstrument): Float32Array<ArrayBuffer> {
  const r = resources(ctx);
  let c = r.curves.get(instrument);
  if (!c) { c = shaperCurve(PROFILES[instrument]); r.curves.set(instrument, c); }
  return c;
}

/** The instrument body: the channel filters and, for a section, a stereo chorus; `stop` ends its oscillators. */
export function body(ctx: BaseAudioContext, instrument: VoiceInstrument): { input: AudioNode; output: AudioNode; stop: () => void } {
  const P = PROFILES[instrument];
  const fs = P.filters.map((f) => {
    const b = ctx.createBiquadFilter();
    b.type = f.type; b.frequency.value = f.f; b.Q.value = f.q;
    if (f.g !== undefined) b.gain.value = f.g;
    return b;
  });
  for (let i = 1; i < fs.length; i++) fs[i - 1]!.connect(fs[i]!);
  if (!P.ensemble) return { input: fs[0]!, output: fs[fs.length - 1]!, stop: () => {} };
  const e = chorus(ctx, fs[fs.length - 1]!);
  return { input: fs[0]!, output: e.output, stop: e.stop };
}

function chorus(ctx: BaseAudioContext, end: AudioNode): { output: AudioNode; stop: () => void } {
  const merge = ctx.createChannelMerger(2);
  const lfos: OscillatorNode[] = [];
  const direct = ctx.createGain();
  direct.gain.value = 0.6;
  end.connect(direct);
  direct.connect(merge, 0, 0);
  direct.connect(merge, 0, 1);
  ([[0.013, 0.0032, 0.53, 0], [0.017, 0.0027, 0.79, 1]] as const).forEach(([base, depth, hz, side]) => {
    const d = ctx.createDelay(0.05);
    d.delayTime.value = base;
    const l = ctx.createOscillator();
    l.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.value = depth;
    l.connect(g).connect(d.delayTime);
    const n = ctx.createGain();
    n.gain.value = 0.55;
    end.connect(d).connect(n);
    n.connect(merge, 0, side);
    l.start();
    lfos.push(l);
  });
  return { output: merge, stop: () => lfos.forEach((l) => { try { l.stop(); } catch { /* already stopped */ } }) };
}

const target = (ps: readonly AudioParam[], v: number, t: number, tau: number): void => { for (const p of ps) p.setTargetAtTime(v, t, Math.max(0.001, tau)); };

/**
 * Plays a one-voice phrase (or one section line): `notes` in absolute context seconds, in order. All expression is
 * scheduled at once; nothing is cancelled later. Returns the time the phrase is silent.
 */
export function playPhrase(ctx: BaseAudioContext, dest: AudioNode, instrument: VoiceInstrument, notes: readonly TimedNote[]): number {
  if (!notes.length) return ctx.currentTime;
  const P = PROFILES[instrument];
  const R = resources(ctx);
  const { articulations, end } = articulate(notes);
  const t0 = Math.max(ctx.currentTime, notes[0]!.t);
  const rng = seededRandom((Math.round(t0 * 1000) * 31 + notes[0]!.m * 7 + instrument.length) >>> 0);
  const detunes = P.voices ?? [0];
  const norm = 1 / Math.sqrt(detunes.length);
  const amp = ctx.createGain();
  amp.gain.value = 0;
  amp.connect(dest);
  const vibrates = notes.some((n) => n.d > 0.45);
  const lfo = vibrates ? ctx.createOscillator() : null;
  const depth = vibrates ? ctx.createGain() : null;
  if (lfo && depth) {
    lfo.frequency.value = P.vibrato.hz * (0.94 + rng() * 0.12);
    depth.gain.value = 0;
    lfo.connect(depth);
  }
  const oscs: OscillatorNode[] = [];
  const pres: GainNode[] = [];
  for (const c of detunes) {
    const o = ctx.createOscillator();
    o.setPeriodicWave(wave(ctx, instrument));
    o.detune.value = c + (detunes.length > 1 ? (rng() - 0.5) * 2 : 0);
    depth?.connect(o.detune);
    if (P.k > 0) {
      const pre = ctx.createGain();
      pre.gain.value = 0;
      const sh = ctx.createWaveShaper();
      sh.curve = curveOf(ctx, instrument);
      sh.oversample = P.oversample;
      o.connect(pre).connect(sh).connect(amp);
      pres.push(pre);
    } else o.connect(amp);
    oscs.push(o);
  }
  const breather = P.breath.level > 0 ? (() => {
    const src = ctx.createBufferSource();
    src.buffer = R.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = P.breath.q; bp.frequency.value = freq(notes[0]!.m) * P.breath.rel;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(bp).connect(g).connect(dest);
    return { src, bp, g };
  })() : null;
  const ng = breather ? [breather.g.gain] : [];
  const freqs = oscs.map((o) => o.frequency);
  const gp = pres.map((p) => p.gain);
  for (const p of [amp.gain, ...ng, ...gp]) p.setValueAtTime(0, t0);
  notes.forEach((n, i) => {
    const t = Math.max(t0, n.t);
    const f = freq(n.m);
    const v = Math.max(0.05, Math.min(1, n.v));
    const a = P.pressure[0] + (P.pressure[1] - P.pressure[0]) * v;
    const level = (P.level * v ** 1.25 * norm) / shaperGain(P, a);
    const art = articulations[i]!;
    const attacks = art !== 'tied';
    if (art === 'first') for (const p of freqs) p.setValueAtTime(f, t);
    else target(freqs, f, t - 0.004, art === 'tied' ? P.glide : 0.002);
    if (attacks) {
      target(gp, Math.min(DOMAIN, a * P.burst) / DOMAIN, t, P.attack / 3);
      target(gp, a / DOMAIN, t + P.attack, 0.06);
      target([amp.gain], level, t, P.attack / 3);
    } else {
      target(gp, a / DOMAIN, t, 0.03);
      target([amp.gain], level, t, 0.02);
    }
    if (n.d > 0.4 && P.hold) target([amp.gain], level * (1 + P.hold), t + P.attack + 0.05, n.d * 0.5);
    if (depth) target([depth.gain], 0, t, 0.03);
    if (depth && n.d > 0.45) target([depth.gain], P.vibrato.cents * (0.75 + 0.4 * rng()) * (0.8 + 0.3 * v), t + P.vibrato.delay, 0.15);
    const breath = level * P.breath.level * (1.4 - v);
    target(ng, breath, t, 0.03);
    if (breather) target([breather.bp.frequency], f * P.breath.rel, t, 0.01);
    const next = notes[i + 1];
    if (next && articulations[i + 1] === 'detached') {
      target([amp.gain], 0, n.t + n.d, P.release * 0.5);
      target(ng, 0, n.t + n.d, 0.01);
    }
  });
  target([amp.gain], 0, end, P.release);
  target(ng, 0, end, 0.02);
  const stop = end + P.release * 8 + 0.05;
  for (const o of lfo ? [...oscs, lfo] : oscs) { o.start(t0); o.stop(stop); }
  if (breather) { breather.src.start(t0, (t0 * 0.61) % 1.5); breather.src.stop(stop); }
  return stop;
}
