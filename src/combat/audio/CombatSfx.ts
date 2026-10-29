/**
 * Combat sound effects, synthesized with the Web Audio API (no files), on the
 * RPGCards model: oscillator tones with exponential envelopes and pitch
 * glides, filtered noise bursts, a limiter, effect and ambience buses and a
 * voice cap. The context is created on the first user gesture only.
 *
 * Every FX recipe cue (`slash`, `explosion`, `holy`…) has a recipe here, so a
 * sound fires on the same FX-time tick as the visual it belongs to.
 */
export type CombatSfxId =
  | 'slash' | 'heavy_slash' | 'hit' | 'blunt' | 'thrust' | 'bow' | 'arrow_hit' | 'throw' | 'cannon'
  | 'cast' | 'whoosh' | 'magic_hit' | 'explosion' | 'fire_burst' | 'breath' | 'thunder' | 'ice' | 'earth'
  | 'quake' | 'land' | 'teleport' | 'wind' | 'holy_charge' | 'holy' | 'heal' | 'shield' | 'curse' | 'void'
  | 'bite' | 'poison' | 'dash' | 'ultimate_charge' | 'ultimate_hit' | 'meteor' | 'miracle' | 'crit' | 'ko'
  | 'step' | 'ui' | 'turn' | 'victory' | 'defeat' | 'impact_heavy' | 'field_wave';

export type CombatAmbienceId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';

export interface CombatSfxSettings {
  volume: number;
  muted: boolean;
}

export interface CombatSfx {
  play(id: string, options?: { volume?: number; pitch?: number; pan?: number }): void;
  ambience(id: CombatAmbienceId | null): void;
  settings(): CombatSfxSettings;
  configure(next: Partial<CombatSfxSettings>): void;
  /** True once the AudioContext exists (after a gesture). */
  active(): boolean;
  /** Cues requested since load (QA: check triggers without listening). */
  journal(): readonly string[];
  dispose(): void;
}

const MAX_VOICES = 14;
const STORAGE_KEY = 'rpg-threejs:combat-sfx';

type Recipe = (out: AudioNode, t: number, pitch: number) => number;

function readSettings(): CombatSfxSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CombatSfxSettings>;
      return { volume: Math.max(0, Math.min(1, Number(parsed.volume ?? 0.8))), muted: Boolean(parsed.muted) };
    }
  } catch { /* storage unavailable: defaults */ }
  return { volume: 0.8, muted: false };
}

function writeSettings(settings: CombatSfxSettings): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

/** Deterministic noise (no Math.random): a fixed seed per session start. */
function seededNoise(length: number): Float32Array {
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

export function createCombatSfx(options: { enabled?: boolean } = {}): CombatSfx {
  const allowed = options.enabled !== false && typeof window !== 'undefined';
  let settings = readSettings();
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let fxBus: GainNode | null = null;
  let ambBus: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let voices = 0;
  let ambienceWanted: CombatAmbienceId | null = null;
  let ambienceStop: (() => void) | null = null;
  const log: string[] = [];

  const create = (): void => {
    if (ctx || !allowed || settings.muted) return;
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch { ctx = null; return; }
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -9; limiter.knee.value = 6; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.18;
    master = ctx.createGain();
    master.gain.value = settings.muted ? 0 : settings.volume;
    master.connect(limiter).connect(ctx.destination);
    fxBus = ctx.createGain(); fxBus.gain.value = 1; fxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.32; ambBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    noise.getChannelData(0).set(seededNoise(ctx.sampleRate * 2));
    if (ambienceWanted) startAmbience(ambienceWanted);
  };
  const gesture = (): void => { create(); if (ctx?.state === 'suspended') void ctx.resume(); };
  if (allowed) {
    window.addEventListener('pointerdown', gesture, { capture: true, passive: true });
    window.addEventListener('keydown', gesture, { capture: true, passive: true });
  }

  // ---------------------------------------------------------------- primitives

  const tone = (out: AudioNode, t: number, f: number, type: OscillatorType, dur: number, gain: number, o: { to?: number; attack?: number; detune?: number } = {}): void => {
    const c = ctx!;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (o.detune) osc.detune.value = o.detune;
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    const g = c.createGain();
    const a = o.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };

  const hiss = (out: AudioNode, t: number, dur: number, type: BiquadFilterType, f: number, q: number, gain: number, o: { to?: number; attack?: number } = {}): void => {
    const c = ctx!;
    const src = c.createBufferSource();
    src.buffer = noise;
    const filter = c.createBiquadFilter();
    filter.type = type; filter.frequency.setValueAtTime(f, t); filter.Q.value = q;
    if (o.to) filter.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (o.attack ?? Math.min(0.01, dur / 4)));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(out);
    src.start(t, (t * 0.37) % 1.5);
    src.stop(t + dur + 0.05);
  };

  const chime = (out: AudioNode, t: number, notes: number[], step: number, dur: number, gain: number, type: OscillatorType = 'sine'): void => {
    notes.forEach((f, i) => tone(out, t + i * step, f, type, dur, gain, { attack: 0.01 }));
  };

  // ---------------------------------------------------------------- recipes

  const RECIPES: Record<CombatSfxId, Recipe> = {
    slash: (o, t, p) => { hiss(o, t, 0.16, 'bandpass', 2600 * p, 1.4, 0.55, { to: 6200 * p }); tone(o, t + 0.01, 1900 * p, 'triangle', 0.08, 0.05, { to: 900 }); return 0.18; },
    heavy_slash: (o, t, p) => { hiss(o, t, 0.26, 'bandpass', 1400 * p, 1.1, 0.7, { to: 4800 * p }); tone(o, t + 0.02, 160 * p, 'sawtooth', 0.22, 0.12, { to: 70 }); return 0.28; },
    hit: (o, t, p) => { tone(o, t, 150 * p, 'sine', 0.18, 0.75, { to: 55 }); hiss(o, t, 0.08, 'lowpass', 2400, 0.7, 0.5); tone(o, t, 2400 * p, 'square', 0.03, 0.05); return 0.2; },
    blunt: (o, t, p) => { tone(o, t, 110 * p, 'sine', 0.3, 0.95, { to: 40 }); hiss(o, t, 0.16, 'lowpass', 900, 0.8, 0.6); tone(o, t + 0.01, 320 * p, 'square', 0.06, 0.06, { to: 140 }); return 0.32; },
    thrust: (o, t, p) => { hiss(o, t, 0.12, 'highpass', 3000 * p, 0.8, 0.4, { to: 7000 }); tone(o, t + 0.05, 180 * p, 'sine', 0.14, 0.6, { to: 70 }); return 0.2; },
    bow: (o, t, p) => { tone(o, t, 220 * p, 'triangle', 0.12, 0.25, { to: 110 }); hiss(o, t + 0.02, 0.18, 'bandpass', 3800 * p, 2, 0.25, { to: 1600 }); return 0.22; },
    arrow_hit: (o, t, p) => { tone(o, t, 900 * p, 'square', 0.03, 0.08, { to: 300 }); tone(o, t, 140 * p, 'sine', 0.12, 0.5, { to: 60 }); hiss(o, t, 0.06, 'bandpass', 3200, 1, 0.3); return 0.14; },
    throw: (o, t, p) => { hiss(o, t, 0.14, 'bandpass', 4200 * p, 3, 0.3, { to: 2000 }); return 0.15; },
    cannon: (o, t, p) => { tone(o, t, 90 * p, 'sine', 0.45, 1, { to: 32 }); hiss(o, t, 0.35, 'lowpass', 1600, 0.6, 0.8, { to: 300 }); return 0.45; },
    cast: (o, t, p) => { tone(o, t, 330 * p, 'triangle', 0.38, 0.16, { to: 990 * p, attack: 0.04 }); hiss(o, t, 0.4, 'bandpass', 1800, 1.4, 0.12, { to: 5200 }); chime(o, t + 0.22, [1319 * p, 1760 * p], 0.06, 0.32, 0.06); return 0.6; },
    whoosh: (o, t, p) => { hiss(o, t, 0.32, 'bandpass', 700 * p, 1.1, 0.35, { to: 2600 * p, attack: 0.08 }); return 0.33; },
    magic_hit: (o, t, p) => { tone(o, t, 520 * p, 'sine', 0.3, 0.3, { to: 180 }); tone(o, t, 780 * p, 'triangle', 0.22, 0.12, { to: 260 }); hiss(o, t, 0.24, 'bandpass', 2200, 0.9, 0.35, { to: 600 }); return 0.32; },
    explosion: (o, t, p) => { tone(o, t, 80 * p, 'sine', 0.7, 1, { to: 28 }); hiss(o, t, 0.75, 'lowpass', 2400, 0.5, 0.9, { to: 180 }); hiss(o, t + 0.05, 0.5, 'bandpass', 600, 0.7, 0.35); return 0.8; },
    fire_burst: (o, t, p) => { hiss(o, t, 0.6, 'bandpass', 900 * p, 0.7, 0.55, { to: 2400, attack: 0.05 }); tone(o, t, 120 * p, 'sawtooth', 0.4, 0.08, { to: 60 }); return 0.65; },
    breath: (o, t, p) => { hiss(o, t, 0.9, 'bandpass', 500 * p, 0.6, 0.65, { to: 1600, attack: 0.1 }); tone(o, t, 70 * p, 'sawtooth', 0.8, 0.1, { to: 50, attack: 0.1 }); return 0.95; },
    thunder: (o, t, p) => { hiss(o, t, 0.06, 'highpass', 5000, 0.7, 0.8); tone(o, t, 2200 * p, 'square', 0.05, 0.12, { to: 400 }); hiss(o, t + 0.05, 1.1, 'lowpass', 900, 0.6, 0.85, { to: 120 }); tone(o, t + 0.04, 60, 'sine', 0.9, 0.6, { to: 30 }); return 1.2; },
    ice: (o, t, p) => { chime(o, t, [2093 * p, 2637 * p, 3136 * p], 0.03, 0.25, 0.08, 'triangle'); hiss(o, t, 0.3, 'highpass', 4500, 1, 0.3, { to: 8000 }); tone(o, t, 300 * p, 'sine', 0.25, 0.3, { to: 120 }); return 0.4; },
    earth: (o, t, p) => { tone(o, t, 95 * p, 'sine', 0.4, 0.8, { to: 45 }); hiss(o, t, 0.35, 'lowpass', 700, 0.7, 0.6); return 0.42; },
    quake: (o, t, p) => { tone(o, t, 55 * p, 'sine', 1.1, 1, { to: 26 }); hiss(o, t, 1.0, 'lowpass', 500, 0.6, 0.9, { to: 90 }); tone(o, t + 0.02, 140 * p, 'square', 0.12, 0.08, { to: 60 }); return 1.1; },
    land: (o, t, p) => { tone(o, t, 120 * p, 'sine', 0.22, 0.7, { to: 50 }); hiss(o, t, 0.18, 'lowpass', 800, 0.7, 0.45); return 0.24; },
    teleport: (o, t, p) => { tone(o, t, 1400 * p, 'sine', 0.25, 0.12, { to: 300 }); hiss(o, t, 0.3, 'bandpass', 3000, 2, 0.18, { to: 900 }); return 0.32; },
    wind: (o, t, p) => { hiss(o, t, 0.5, 'bandpass', 600 * p, 1.2, 0.45, { to: 3000 * p, attack: 0.08 }); hiss(o, t + 0.12, 0.4, 'bandpass', 900 * p, 1.4, 0.3, { to: 3600 }); return 0.55; },
    holy_charge: (o, t, p) => { chime(o, t, [523 * p, 659 * p, 784 * p], 0.08, 0.6, 0.07); hiss(o, t, 0.5, 'highpass', 6000, 0.6, 0.06, { to: 9000, attack: 0.2 }); return 0.7; },
    holy: (o, t, p) => { for (const f of [392, 587, 784, 1175]) tone(o, t, f * p, 'sine', 1.1, 0.1, { attack: 0.02 }); tone(o, t, 98 * p, 'sine', 0.5, 0.4, { to: 70 }); return 1.1; },
    heal: (o, t, p) => { chime(o, t, [784 * p, 988 * p, 1175 * p, 1568 * p], 0.07, 0.5, 0.09); return 0.8; },
    shield: (o, t, p) => { tone(o, t, 1240 * p, 'sine', 0.6, 0.12); tone(o, t, 1710 * p, 'sine', 0.5, 0.08); tone(o, t, 220 * p, 'triangle', 0.3, 0.2, { to: 330 }); return 0.6; },
    curse: (o, t, p) => { for (const f of [196, 198.5, 147]) tone(o, t, f * p, 'sawtooth', 0.6, 0.06, { attack: 0.05, to: f * p * 0.8 }); hiss(o, t, 0.5, 'bandpass', 400, 1.5, 0.15, { to: 150 }); return 0.65; },
    void: (o, t, p) => { tone(o, t, 60 * p, 'sine', 1.4, 0.8, { to: 30, attack: 0.3 }); hiss(o, t, 1.3, 'bandpass', 300, 2, 0.3, { to: 90, attack: 0.4 }); for (const f of [110, 111.5]) tone(o, t, f * p, 'sawtooth', 1.3, 0.05, { attack: 0.4 }); return 1.4; },
    bite: (o, t, p) => { hiss(o, t, 0.08, 'bandpass', 1800 * p, 1, 0.5); tone(o, t, 260 * p, 'square', 0.06, 0.08, { to: 120 }); hiss(o, t + 0.07, 0.07, 'bandpass', 1500 * p, 1, 0.4); return 0.16; },
    poison: (o, t, p) => { for (let i = 0; i < 4; i++) tone(o, t + i * 0.06, (500 + i * 140) * p, 'sine', 0.08, 0.08, { to: (700 + i * 160) * p }); return 0.35; },
    dash: (o, t, p) => { hiss(o, t, 0.28, 'bandpass', 900 * p, 0.9, 0.5, { to: 5000, attack: 0.06 }); return 0.3; },
    ultimate_charge: (o, t, p) => { tone(o, t, 110 * p, 'sawtooth', 0.9, 0.12, { to: 440 * p, attack: 0.2 }); hiss(o, t, 0.9, 'bandpass', 400, 1.6, 0.35, { to: 4000, attack: 0.4 }); chime(o, t + 0.5, [880 * p, 1320 * p], 0.08, 0.5, 0.06); return 1.0; },
    ultimate_hit: (o, t, p) => { tone(o, t, 70 * p, 'sine', 1.0, 1, { to: 26 }); hiss(o, t, 0.9, 'lowpass', 3000, 0.5, 0.9, { to: 160 }); for (const f of [196, 294, 392]) tone(o, t, f * p, 'sawtooth', 0.7, 0.05, { attack: 0.01 }); hiss(o, t, 0.05, 'highpass', 6000, 0.7, 0.7); return 1.1; },
    meteor: (o, t, p) => { hiss(o, t, 0.9, 'bandpass', 300 * p, 0.8, 0.6, { to: 2200, attack: 0.4 }); tone(o, t, 200 * p, 'sawtooth', 0.9, 0.08, { to: 60, attack: 0.3 }); return 0.95; },
    miracle: (o, t, p) => { chime(o, t, [523 * p, 659 * p, 784 * p, 1047 * p, 1319 * p], 0.09, 1.2, 0.08); for (const f of [262, 392]) tone(o, t, f * p, 'sine', 1.6, 0.12, { attack: 0.3 }); return 1.7; },
    crit: (o, t, p) => { tone(o, t, 1800 * p, 'square', 0.05, 0.1, { to: 600 }); tone(o, t, 120 * p, 'sine', 0.3, 0.9, { to: 40 }); hiss(o, t, 0.12, 'highpass', 4000, 0.7, 0.5); chime(o, t + 0.05, [1568 * p, 2093 * p], 0.05, 0.25, 0.06); return 0.35; },
    ko: (o, t, p) => { tone(o, t, 330 * p, 'triangle', 0.5, 0.18, { to: 90 }); hiss(o, t, 0.3, 'lowpass', 900, 0.8, 0.3); return 0.5; },
    impact_heavy: (o, t, p) => { tone(o, t, 95 * p, 'sine', 0.5, 0.9, { to: 34 }); hiss(o, t, 0.04, 'highpass', 4200, 0.7, 0.45); hiss(o, t + 0.02, 0.4, 'lowpass', 1100, 0.6, 0.55, { to: 160 }); return 0.52; },
    // ultimate field wave: a sub boom that rolls out, a rising rush of air and a bright shimmer on top
    field_wave: (o, t, p) => { tone(o, t, 48 * p, 'sine', 1.8, 1, { to: 24 }); hiss(o, t, 1.6, 'lowpass', 220, 0.7, 0.8, { to: 1400, attack: 0.25 }); hiss(o, t + 0.1, 1.2, 'bandpass', 2600, 1.2, 0.18, { to: 700 }); chime(o, t + 0.05, [1047 * p, 1568 * p, 2093 * p], 0.07, 0.9, 0.04); return 1.9; },
    step: (o, t, p) => { hiss(o, t, 0.05, 'lowpass', 520 * p, 1, 0.14); return 0.06; },
    ui: (o, t) => { tone(o, t, 880, 'sine', 0.05, 0.12); return 0.06; },
    turn: (o, t) => { chime(o, t, [659, 988], 0.06, 0.18, 0.06, 'triangle'); return 0.25; },
    victory: (o, t) => { [523, 659, 784, 1047].forEach((f, i) => tone(o, t + i * 0.12, f, 'triangle', i === 3 ? 0.8 : 0.2, 0.2)); return 1.2; },
    defeat: (o, t) => { [440, 349, 294].forEach((f, i) => tone(o, t + i * 0.2, f, 'triangle', i === 2 ? 0.9 : 0.25, 0.18)); return 1.3; },
  };

  // ---------------------------------------------------------------- ambience

  const startAmbience = (id: CombatAmbienceId): void => {
    if (!ctx || !ambBus || !noise) return;
    ambienceStop?.();
    const c = ctx;
    const out = c.createGain();
    out.gain.value = 0.0001;
    out.connect(ambBus);
    out.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.2);
    const loops: AudioScheduledSourceNode[] = [];
    const bed = (type: BiquadFilterType, f: number, q: number, gain: number, lfo = 0.07) => {
      const src = c.createBufferSource(); src.buffer = noise; src.loop = true;
      const filter = c.createBiquadFilter(); filter.type = type; filter.frequency.value = f; filter.Q.value = q;
      const g = c.createGain(); g.gain.value = gain;
      const mod = c.createOscillator(); mod.frequency.value = lfo;
      const modGain = c.createGain(); modGain.gain.value = f * 0.35;
      mod.connect(modGain).connect(filter.frequency);
      src.connect(filter).connect(g).connect(out);
      src.start(); mod.start();
      loops.push(src, mod);
    };
    let timer: number | null = null;
    const accents = (fn: (t: number) => void, every: [number, number]) => {
      const next = () => {
        timer = window.setTimeout(() => { if (ctx) fn(ctx.currentTime + 0.05); next(); }, (every[0] + Math.random() * (every[1] - every[0])) * 1000);
      };
      next();
    };
    if (id === 'forest_route') {
      bed('bandpass', 420, 0.6, 0.35, 0.05); // wind in the canopy
      bed('highpass', 5200, 0.4, 0.04, 0.11); // leaves
      accents((t) => { const f = 2400 + Math.random() * 1600; for (let i = 0; i < 3; i++) tone(out, t + i * 0.09, f * (1 + i * 0.06), 'sine', 0.07, 0.03, { to: f * 1.3 }); }, [2.5, 6]);
    } else if (id === 'bois_clair_burning') {
      bed('lowpass', 320, 0.7, 0.55, 0.09); // roar of the fires
      bed('bandpass', 1800, 1.2, 0.08, 0.3);
      accents((t) => { for (let i = 0; i < 4; i++) hiss(out, t + i * 0.04 * Math.random(), 0.03, 'bandpass', 2500 + Math.random() * 2500, 2, 0.12); }, [0.3, 1.1]); // crackles
      accents((t) => tone(out, t, 50, 'sine', 1.4, 0.18, { to: 32, attack: 0.3 }), [6, 12]); // distant collapse
    } else {
      bed('bandpass', 300, 0.5, 0.3, 0.04); // night wind
      accents((t) => { for (let i = 0; i < 6; i++) tone(out, t + i * 0.05, 4200, 'square', 0.02, 0.008); }, [1.2, 3]); // crickets
      accents((t) => tone(out, t, 196, 'sine', 2.4, 0.03, { attack: 0.8 }), [9, 16]); // far bell
    }
    ambienceStop = () => {
      if (timer !== null) window.clearTimeout(timer);
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      for (const node of loops) { try { node.stop(now + 0.9); } catch { /* already stopped */ } }
      ambienceStop = null;
    };
  };

  return {
    play(id, o = {}) {
      log.push(id);
      if (log.length > 400) log.splice(0, 200);
      if (!ctx || !fxBus || settings.muted) return;
      const recipe = RECIPES[id as CombatSfxId];
      if (!recipe || voices >= MAX_VOICES) return;
      const out = ctx.createGain();
      out.gain.value = Math.max(0, Math.min(2, o.volume ?? 1));
      let tail: AudioNode = out;
      if (o.pan && typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, o.pan));
        out.connect(panner);
        tail = panner;
      }
      tail.connect(fxBus);
      voices++;
      const length = recipe(out, ctx.currentTime + 0.005, o.pitch ?? 1);
      window.setTimeout(() => { voices = Math.max(0, voices - 1); try { tail.disconnect(); out.disconnect(); } catch { /* ignore */ } }, (length + 0.25) * 1000);
    },
    ambience(id) {
      ambienceWanted = id;
      if (!ctx) return;
      if (id) startAmbience(id); else ambienceStop?.();
    },
    settings: () => ({ ...settings }),
    configure(next) {
      settings = { volume: Math.max(0, Math.min(1, next.volume ?? settings.volume)), muted: next.muted ?? settings.muted };
      writeSettings(settings);
      if (master && ctx) master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume, ctx.currentTime, 0.05);
      if (!settings.muted) create();
    },
    active: () => Boolean(ctx),
    journal: () => log.slice(),
    dispose() {
      ambienceStop?.();
      if (allowed) {
        window.removeEventListener('pointerdown', gesture, { capture: true });
        window.removeEventListener('keydown', gesture, { capture: true });
      }
      void ctx?.close();
      ctx = null;
    },
  };
}

export const COMBAT_SFX_IDS: readonly CombatSfxId[] = [
  'slash', 'heavy_slash', 'hit', 'blunt', 'thrust', 'bow', 'arrow_hit', 'throw', 'cannon',
  'cast', 'whoosh', 'magic_hit', 'explosion', 'fire_burst', 'breath', 'thunder', 'ice', 'earth',
  'quake', 'land', 'teleport', 'wind', 'holy_charge', 'holy', 'heal', 'shield', 'curse', 'void',
  'bite', 'poison', 'dash', 'ultimate_charge', 'ultimate_hit', 'meteor', 'miracle', 'crit', 'ko',
  'step', 'ui', 'turn', 'victory', 'defeat', 'impact_heavy', 'field_wave',
];
