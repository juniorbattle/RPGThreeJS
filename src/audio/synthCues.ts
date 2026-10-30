/**
 * Synthesized sources for the sixteen approved combat families (OD-2026-10-29-B): each family is rendered once,
 * offline, into a buffer of at most one second, then played by the parent owner exactly like a decoded file (same
 * voices, priorities, cadence and effects setting). The designs come from the HD-2D combat sound module
 * (`src/combat/audio/CombatSfx.ts`, OD-2026-10-29-A, not wired), trimmed to one second and mapped onto the families.
 */
import type { CombatSoundId } from '../ui/GameSoundCatalog';

export const SYNTH_CUE_MAX_SECONDS = 1;
/** Same headroom as the file candidates (their PCM peaks stay at or below 0.2). */
const PEAK = 0.2;

interface Primitives {
  tone(t: number, f: number, type: OscillatorType, dur: number, gain: number, o?: { to?: number; attack?: number }): void;
  hiss(t: number, dur: number, type: BiquadFilterType, f: number, q: number, gain: number, o?: { to?: number; attack?: number }): void;
  chime(t: number, notes: readonly number[], step: number, dur: number, gain: number, type?: OscillatorType): void;
}

const FAMILIES: Readonly<Record<CombatSoundId, (p: Primitives) => void>> = {
  step: (p) => { p.hiss(0, 0.06, 'lowpass', 520, 1, 0.3); p.tone(0, 90, 'sine', 0.06, 0.12, { to: 60 }); },
  'light-blade': (p) => { p.hiss(0, 0.16, 'bandpass', 2600, 1.4, 0.55, { to: 6200 }); p.tone(0.01, 1900, 'triangle', 0.08, 0.05, { to: 900 }); },
  'heavy-weapon': (p) => { p.hiss(0, 0.26, 'bandpass', 1400, 1.1, 0.7, { to: 4800 }); p.tone(0.02, 160, 'sawtooth', 0.22, 0.12, { to: 70 }); p.tone(0.12, 110, 'sine', 0.3, 0.7, { to: 40 }); },
  thrust: (p) => { p.hiss(0, 0.12, 'highpass', 3000, 0.8, 0.4, { to: 7000 }); p.tone(0.05, 180, 'sine', 0.14, 0.6, { to: 70 }); },
  'bow-release': (p) => { p.tone(0, 220, 'triangle', 0.12, 0.25, { to: 110 }); p.hiss(0.02, 0.18, 'bandpass', 3800, 2, 0.25, { to: 1600 }); },
  'magic-cast': (p) => { p.tone(0, 330, 'triangle', 0.38, 0.16, { to: 990, attack: 0.04 }); p.hiss(0, 0.4, 'bandpass', 1800, 1.4, 0.12, { to: 5200 }); p.chime(0.22, [1319, 1760], 0.06, 0.32, 0.06); },
  'magic-impact': (p) => { p.tone(0, 520, 'sine', 0.3, 0.3, { to: 180 }); p.tone(0, 780, 'triangle', 0.22, 0.12, { to: 260 }); p.hiss(0, 0.24, 'bandpass', 2200, 0.9, 0.35, { to: 600 }); },
  'physical-impact': (p) => { p.tone(0, 150, 'sine', 0.18, 0.75, { to: 55 }); p.hiss(0, 0.08, 'lowpass', 2400, 0.7, 0.5); p.tone(0, 2400, 'square', 0.03, 0.05); },
  miss: (p) => { p.hiss(0, 0.3, 'bandpass', 700, 1.1, 0.35, { to: 2600, attack: 0.08 }); },
  critical: (p) => { p.tone(0, 1800, 'square', 0.05, 0.1, { to: 600 }); p.tone(0, 120, 'sine', 0.3, 0.9, { to: 40 }); p.hiss(0, 0.12, 'highpass', 4000, 0.7, 0.5); p.chime(0.05, [1568, 2093], 0.05, 0.25, 0.06); },
  'status-negative': (p) => { for (const f of [196, 198.5, 147]) p.tone(0, f, 'sawtooth', 0.6, 0.06, { attack: 0.05, to: f * 0.8 }); p.hiss(0, 0.5, 'bandpass', 400, 1.5, 0.15, { to: 150 }); },
  support: (p) => { p.chime(0, [784, 988, 1175, 1568], 0.07, 0.5, 0.09); },
  knockout: (p) => { p.tone(0, 330, 'triangle', 0.5, 0.18, { to: 90 }); p.hiss(0, 0.3, 'lowpass', 900, 0.8, 0.3); p.tone(0.05, 70, 'sine', 0.4, 0.5, { to: 35 }); },
  'player-turn': (p) => { p.chime(0, [659, 988], 0.06, 0.18, 0.06, 'triangle'); },
  victory: (p) => { [523, 659, 784, 1047].forEach((f, i) => p.tone(i * 0.1, f, 'triangle', i === 3 ? 0.55 : 0.18, 0.2)); },
  defeat: (p) => { [440, 349, 294].forEach((f, i) => p.tone(i * 0.15, f, 'triangle', i === 2 ? 0.6 : 0.2, 0.18)); },
};

/** Families with a synthesized design (all sixteen). */
export const SYNTH_CUE_IDS = Object.keys(FAMILIES) as CombatSoundId[];

/** Schedules one family on any context (offline render, or a recording stub in tests). */
export function scheduleSynthCue(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer, id: CombatSoundId, t0 = 0.002): void {
  FAMILIES[id](primitives(ctx, out, noise, t0));
}

function seededNoise(length: number): Float32Array<ArrayBuffer> {
  const data = new Float32Array(length);
  let s = 0x50a11ce;
  for (let i = 0; i < length; i++) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    data[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return data;
}

function primitives(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer, t0: number): Primitives {
  const tone: Primitives['tone'] = (t, f, type, dur, gain, o = {}) => {
    const at = t0 + t;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f, at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + (o.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  };
  const hiss: Primitives['hiss'] = (t, dur, type, f, q, gain, o = {}) => {
    const at = t0 + t;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.frequency.setValueAtTime(f, at); filter.Q.value = q;
    if (o.to) filter.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + (o.attack ?? Math.min(0.01, dur / 4)));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(g).connect(out);
    src.start(at, (at * 0.37) % 0.5);
    src.stop(at + dur + 0.02);
  };
  const chime: Primitives['chime'] = (t, notes, step, dur, gain, type = 'sine') => {
    notes.forEach((f, i) => tone(t + i * step, f, type, dur, gain, { attack: 0.01 }));
  };
  return { tone, hiss, chime };
}

/** Renders one family offline; trims trailing silence and brings the peak to the file candidates' level. */
export async function renderSynthCue(id: CombatSoundId, sampleRate: number): Promise<AudioBuffer | null> {
  if (typeof OfflineAudioContext === 'undefined') return null;
  const length = Math.round(sampleRate * SYNTH_CUE_MAX_SECONDS);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const noise = ctx.createBuffer(1, Math.round(sampleRate), sampleRate);
  noise.copyToChannel(seededNoise(noise.length), 0);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -9; limiter.knee.value = 6; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.18;
  limiter.connect(ctx.destination);
  scheduleSynthCue(ctx, limiter, noise, id);
  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  let peak = 0;
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const a = Math.abs(data[i]!);
    if (a > peak) peak = a;
    if (a > 1e-4) last = i;
  }
  if (peak <= 0) return null;
  const trimmed = Math.min(data.length, last + Math.round(sampleRate * 0.02));
  const fade = Math.min(trimmed, Math.round(sampleRate * 0.01));
  const out = new Float32Array(trimmed);
  const g = PEAK / peak;
  for (let i = 0; i < trimmed; i++) out[i] = data[i]! * g * (i >= trimmed - fade ? (trimmed - i) / fade : 1);
  const buffer = new AudioBuffer({ length: trimmed, numberOfChannels: 1, sampleRate });
  buffer.copyToChannel(out, 0);
  return buffer;
}
