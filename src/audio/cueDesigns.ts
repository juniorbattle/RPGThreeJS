/**
 * Sound designs of the cue table (OD-2026-11-01-B), ported onto the parent owner from the HD-2D combat sound module
 * (`src/combat/audio/CombatSfx.ts`, OD-2026-10-29-A), which keeps its own context and stays unwired. Three layers make a
 * composed cue: gesture, element, weight. The twelve Ultimates and eight boss signatures are written by hand: charge,
 * blow and wave. Nothing here sounds like a hit landing: that belongs to the result families.
 */
import type { FxElement } from '../combat/fx/fxPalettes';
import type { Gesture, SignaturePart, Weight } from './cueTable';

export interface Primitives {
  tone(t: number, f: number, type: OscillatorType, dur: number, gain: number, o?: { to?: number; attack?: number }): void;
  hiss(t: number, dur: number, type: BiquadFilterType, f: number, q: number, gain: number, o?: { to?: number; attack?: number }): void;
  chime(t: number, notes: readonly number[], step: number, dur: number, gain: number, type?: OscillatorType): void;
}
type Design = (p: Primitives) => void;

export const GESTURE_LAYERS: Readonly<Record<Gesture, Design>> = {
  blade: (p) => { p.hiss(0, 0.16, 'bandpass', 2600, 1.4, 0.55, { to: 6200 }); p.tone(0.01, 1900, 'triangle', 0.08, 0.05, { to: 900 }); },
  heavy: (p) => { p.hiss(0, 0.26, 'bandpass', 1400, 1.1, 0.7, { to: 4800 }); p.tone(0.02, 160, 'sawtooth', 0.22, 0.12, { to: 70 }); },
  thrust: (p) => { p.hiss(0, 0.12, 'highpass', 3000, 0.8, 0.4, { to: 7000 }); p.tone(0.05, 180, 'sine', 0.14, 0.3, { to: 70 }); },
  shot: (p) => { p.tone(0, 220, 'triangle', 0.12, 0.25, { to: 110 }); p.hiss(0.02, 0.18, 'bandpass', 3800, 2, 0.25, { to: 1600 }); },
  gun: (p) => { p.hiss(0, 0.22, 'lowpass', 1600, 0.6, 0.7, { to: 300 }); p.tone(0, 140, 'square', 0.06, 0.1, { to: 60 }); },
  throw: (p) => { p.hiss(0, 0.14, 'bandpass', 4200, 3, 0.3, { to: 2000 }); },
  cast: (p) => { p.tone(0, 520, 'triangle', 0.22, 0.12, { to: 990, attack: 0.02 }); p.hiss(0, 0.24, 'bandpass', 1800, 1.4, 0.12, { to: 5200 }); },
  breath: (p) => { p.hiss(0, 0.55, 'bandpass', 500, 0.6, 0.65, { to: 1600, attack: 0.06 }); p.tone(0, 70, 'sawtooth', 0.5, 0.1, { to: 50, attack: 0.06 }); },
  bite: (p) => { p.hiss(0, 0.08, 'bandpass', 1800, 1, 0.5); p.tone(0, 260, 'square', 0.06, 0.08, { to: 120 }); p.hiss(0.07, 0.07, 'bandpass', 1500, 1, 0.4); },
  dash: (p) => { p.hiss(0, 0.28, 'bandpass', 900, 0.9, 0.5, { to: 5000, attack: 0.06 }); },
  land: (p) => { p.tone(0, 120, 'sine', 0.22, 0.5, { to: 50 }); p.hiss(0, 0.18, 'lowpass', 800, 0.7, 0.45); },
  ward: (p) => { p.tone(0, 1240, 'sine', 0.5, 0.1); p.tone(0, 1710, 'sine', 0.4, 0.07); p.tone(0, 220, 'triangle', 0.3, 0.16, { to: 330 }); },
  mend: (p) => { p.chime(0, [784, 988, 1175, 1568], 0.07, 0.5, 0.08); },
};

export const ELEMENT_LAYERS: Readonly<Record<FxElement, Design>> = {
  steel: (p) => { p.tone(0.02, 2400, 'square', 0.03, 0.05); p.chime(0.03, [3136, 4186], 0.02, 0.16, 0.04, 'triangle'); },
  blunt: (p) => { p.hiss(0.02, 0.16, 'lowpass', 900, 0.8, 0.5); p.tone(0.03, 320, 'square', 0.06, 0.06, { to: 140 }); },
  fire: (p) => { p.hiss(0.02, 0.6, 'bandpass', 900, 0.7, 0.55, { to: 2400, attack: 0.05 }); p.tone(0.02, 120, 'sawtooth', 0.4, 0.08, { to: 60 }); },
  ice: (p) => { p.chime(0.02, [2093, 2637, 3136], 0.03, 0.25, 0.08, 'triangle'); p.hiss(0.02, 0.3, 'highpass', 4500, 1, 0.3, { to: 8000 }); },
  holy: (p) => { for (const f of [392, 587, 784, 1175]) p.tone(0.02, f, 'sine', 0.7, 0.1, { attack: 0.02 }); },
  shadow: (p) => { p.tone(0.02, 90, 'sine', 0.6, 0.4, { to: 40, attack: 0.04 }); p.hiss(0.02, 0.6, 'bandpass', 300, 2, 0.3, { to: 90, attack: 0.1 }); for (const f of [110, 111.5]) p.tone(0.02, f, 'sawtooth', 0.5, 0.05, { attack: 0.08 }); },
  poison: (p) => { for (let i = 0; i < 4; i++) p.tone(0.02 + i * 0.06, 500 + i * 140, 'sine', 0.08, 0.08, { to: 700 + i * 160 }); p.hiss(0.02, 0.3, 'bandpass', 1400, 3, 0.1); },
  lightning: (p) => { p.hiss(0.02, 0.06, 'highpass', 5000, 0.7, 0.8); p.tone(0.02, 2200, 'square', 0.05, 0.12, { to: 400 }); p.hiss(0.07, 0.6, 'lowpass', 900, 0.6, 0.6, { to: 120 }); },
  nature: (p) => { p.hiss(0.02, 0.5, 'bandpass', 700, 1.2, 0.3, { to: 2200, attack: 0.08 }); p.chime(0.06, [659, 880], 0.08, 0.3, 0.05); },
  arcane: (p) => { p.tone(0.02, 520, 'sine', 0.3, 0.3, { to: 180 }); p.tone(0.02, 780, 'triangle', 0.22, 0.12, { to: 260 }); p.hiss(0.02, 0.24, 'bandpass', 2200, 0.9, 0.35, { to: 600 }); },
  wind: (p) => { p.hiss(0.02, 0.5, 'bandpass', 600, 1.2, 0.45, { to: 3000, attack: 0.08 }); p.hiss(0.14, 0.4, 'bandpass', 900, 1.4, 0.3, { to: 3600 }); },
  heal: (p) => { p.chime(0.02, [659, 988, 1319], 0.06, 0.5, 0.08); },
  blood: (p) => { for (const f of [196, 198.5, 147]) p.tone(0.02, f, 'sawtooth', 0.5, 0.06, { attack: 0.04, to: f * 0.8 }); p.hiss(0.02, 0.3, 'bandpass', 500, 2, 0.2, { to: 200 }); },
  gold: (p) => { p.chime(0.02, [1319, 1760, 2637], 0.03, 0.35, 0.07, 'triangle'); p.tone(0.02, 196, 'sawtooth', 0.3, 0.08, { to: 98 }); },
  earth: (p) => { p.tone(0.02, 95, 'sine', 0.4, 0.6, { to: 45 }); p.hiss(0.02, 0.35, 'lowpass', 700, 0.7, 0.6); },
  smoke: (p) => { p.hiss(0.02, 0.6, 'lowpass', 1200, 0.5, 0.5, { to: 300, attack: 0.05 }); },
  sky: (p) => { p.tone(0.02, 1400, 'sine', 0.25, 0.12, { to: 2600 }); p.hiss(0.02, 0.3, 'bandpass', 3000, 2, 0.18, { to: 5200 }); },
};

export const WEIGHT_LAYERS: Readonly<Record<Weight, Design>> = {
  l: () => {},
  m: (p) => { p.tone(0.02, 130, 'sine', 0.26, 0.5, { to: 60 }); },
  h: (p) => { p.tone(0.02, 110, 'sine', 0.4, 0.8, { to: 40 }); p.hiss(0.02, 0.3, 'lowpass', 500, 0.7, 0.4, { to: 120 }); },
};

// ------------------------------------------------------------ shared strokes of the signatures

/** A swell up to the blow. */
const rise = (p: Primitives, dur: number, from: number, to: number, type: OscillatorType, gain: number) => p.tone(0, from, type, dur, gain, { to, attack: dur * 0.7 });
const rush = (p: Primitives, dur: number, from: number, to: number, gain: number, q = 1.6) => p.hiss(0, dur, 'bandpass', from, q, gain, { to, attack: dur * 0.7 });
/** A deep drop, the weight of the blow. */
const boom = (p: Primitives, t: number, f: number, dur: number, gain = 1) => p.tone(t, f, 'sine', dur, gain, { to: Math.max(24, f * 0.42) });
const crack = (p: Primitives, t: number, gain = 0.7) => p.hiss(t, 0.05, 'highpass', 5200, 0.7, gain);
const tail = (p: Primitives, t: number, dur: number, f: number, gain: number) => p.hiss(t, dur, 'lowpass', f, 0.6, gain, { to: 160 });
/** A held chord of sines that blooms and fades. */
const bloom = (p: Primitives, t: number, notes: readonly number[], dur: number, gain: number) => { for (const f of notes) p.tone(t, f, 'sine', dur, gain, { attack: dur * 0.2 }); };
const rumble = (p: Primitives, t: number, dur: number, gain: number) => { p.tone(t, 52, 'sine', dur, gain, { to: 30, attack: dur * 0.3 }); p.hiss(t, dur, 'lowpass', 340, 0.7, gain * 0.7, { to: 110, attack: dur * 0.3 }); };

type Signature = Readonly<Record<SignaturePart, Design>>;

export const SIGNATURE_DESIGNS: Readonly<Record<string, Signature>> = {
  // the Lion's roar: brass rising in a fifth, a torn charge, a gold wake
  w_lion_surge: {
    charge: (p) => { rise(p, 0.9, 110, 330, 'sawtooth', 0.14); rise(p, 0.9, 165, 495, 'sawtooth', 0.1); rush(p, 0.9, 500, 3200, 0.3); },
    blow: (p) => { crack(p, 0); p.hiss(0, 0.3, 'bandpass', 1400, 1, 0.7, { to: 5200 }); boom(p, 0, 84, 0.7); p.chime(0.03, [1319, 1760, 2637], 0.04, 0.5, 0.07, 'triangle'); },
    wave: (p) => { for (const f of [196, 294, 392]) p.tone(0, f, 'sawtooth', 1.1, 0.06, { attack: 0.08 }); tail(p, 0, 1.1, 2400, 0.4); },
  },
  // the sky opens: stacked sines climb, one column of light falls, a slow shimmer stays
  p_radiant_judgement: {
    charge: (p) => { for (const [i, f] of [392, 494, 587, 784].entries()) p.tone(i * 0.22, f, 'sine', 1.05 - i * 0.22, 0.1, { attack: 0.3 }); p.hiss(0, 1, 'highpass', 6000, 0.6, 0.08, { to: 9000, attack: 0.5 }); },
    blow: (p) => { crack(p, 0, 0.5); bloom(p, 0, [196, 392, 587, 784, 1175], 1, 0.11); boom(p, 0, 98, 0.6, 0.6); },
    wave: (p) => { p.chime(0, [2093, 1760, 1319, 1175, 880], 0.11, 0.8, 0.05); p.hiss(0, 1, 'highpass', 5000, 0.7, 0.08, { to: 2600 }); },
  },
  // everything is pulled in: air drawn down to nothing, a dark implosion, a drone that will not resolve
  d_devouring_eclipse: {
    charge: (p) => { p.hiss(0, 1.2, 'bandpass', 3600, 2, 0.34, { to: 180, attack: 0.5 }); p.tone(0, 440, 'sawtooth', 1.2, 0.06, { to: 55, attack: 0.3 }); rumble(p, 0.4, 0.8, 0.5); },
    blow: (p) => { boom(p, 0, 60, 0.9); p.hiss(0, 0.5, 'bandpass', 300, 2, 0.6, { to: 90 }); for (const f of [110, 116.5]) p.tone(0, f, 'sawtooth', 0.8, 0.07); },
    wave: (p) => { for (const f of [73.4, 77.8]) p.tone(0, f, 'sawtooth', 1.2, 0.08, { attack: 0.3 }); p.hiss(0, 1.2, 'bandpass', 240, 3, 0.26, { attack: 0.3 }); },
  },
  // a thin line up and a thin line down: the lance falls from the top of the sky
  l_firmament_lance: {
    charge: (p) => { rise(p, 0.95, 700, 3400, 'sine', 0.1); rush(p, 0.95, 1400, 6200, 0.22, 3); },
    blow: (p) => { p.tone(0, 3400, 'sine', 0.2, 0.12, { to: 500 }); crack(p, 0.04); boom(p, 0.04, 96, 0.6); },
    wave: (p) => { p.hiss(0, 1, 'bandpass', 3200, 1.6, 0.3, { to: 900 }); p.tone(0, 1760, 'sine', 0.8, 0.05, { to: 880 }); },
  },
  // a rumble, a whistle coming down, the ground gone
  n_dark_meteor: {
    charge: (p) => { rumble(p, 0, 1.1, 0.5); p.tone(0.3, 2400, 'sine', 0.85, 0.07, { to: 420 }); p.hiss(0.2, 0.95, 'bandpass', 300, 0.8, 0.5, { to: 2200, attack: 0.6 }); },
    blow: (p) => { crack(p, 0); boom(p, 0, 80, 0.9); p.hiss(0, 0.8, 'lowpass', 2600, 0.5, 0.9, { to: 180 }); p.hiss(0.05, 0.5, 'bandpass', 620, 0.7, 0.4); },
    wave: (p) => { tail(p, 0, 1.2, 1800, 0.5); for (const t of [0.1, 0.24, 0.42, 0.66, 0.9]) p.hiss(t, 0.05, 'bandpass', 2800, 2, 0.24); },
  },
  // no violence: a rising peal and a long major bloom
  w_miracle: {
    charge: (p) => { p.chime(0, [523, 659, 784, 1047, 1319], 0.16, 0.5, 0.07); p.hiss(0, 0.95, 'highpass', 6000, 0.6, 0.06, { to: 9000, attack: 0.5 }); },
    blow: (p) => { bloom(p, 0, [262, 392, 523, 659, 784], 1.3, 0.1); p.chime(0.1, [1319, 1760], 0.1, 0.7, 0.05); },
    wave: (p) => { p.chime(0, [2093, 1568, 1319, 1047, 784, 659], 0.13, 0.7, 0.05); },
  },
  // two lines crossing: one up, one down, then both beating against each other
  r_perfect_duality: {
    charge: (p) => { rise(p, 0.9, 196, 880, 'sawtooth', 0.09); p.tone(0, 880, 'sawtooth', 0.9, 0.09, { to: 196, attack: 0.6 }); rush(p, 0.9, 700, 2600, 0.2); },
    blow: (p) => { p.hiss(0, 0.2, 'bandpass', 2600, 1.2, 0.6, { to: 6000 }); p.hiss(0.09, 0.2, 'bandpass', 2000, 1.2, 0.6, { to: 500 }); boom(p, 0.05, 92, 0.6); },
    wave: (p) => { for (const f of [294, 296.5, 441, 444]) p.tone(0, f, 'triangle', 1.1, 0.07, { attack: 0.06 }); },
  },
  // runes in orbit: an arpeggio turning, an open fifth locking, a settling shimmer
  e_absolute_harmony: {
    charge: (p) => { for (let i = 0; i < 8; i++) p.tone(i * 0.1, [523, 784, 1047, 1568][i % 4]!, 'triangle', 0.2, 0.06, { attack: 0.02 }); },
    blow: (p) => { bloom(p, 0, [261.6, 392, 523, 784, 1175], 1.1, 0.1); p.tone(0, 130.8, 'sine', 0.7, 0.3); },
    wave: (p) => { p.chime(0, [1175, 1568, 2093], 0.2, 0.8, 0.05, 'triangle'); p.hiss(0, 1, 'highpass', 4400, 0.8, 0.06, { to: 8000 }); },
  },
  // a long bow drawn, an arrow gone out of hearing, the rain coming down
  a_zenith_arrow: {
    charge: (p) => { p.tone(0, 110, 'triangle', 0.7, 0.16, { to: 170, attack: 0.5 }); rush(p, 0.95, 600, 3000, 0.3); p.tone(0.82, 330, 'triangle', 0.12, 0.2, { to: 140 }); },
    blow: (p) => { p.tone(0, 3000, 'sine', 0.28, 0.1, { to: 900 }); p.hiss(0, 0.36, 'bandpass', 3800, 2, 0.5, { to: 1400 }); boom(p, 0.12, 110, 0.4, 0.6); },
    wave: (p) => { for (let i = 0; i < 9; i++) p.hiss(i * 0.09, 0.08, 'bandpass', 3400 - i * 180, 3, 0.28); tail(p, 0.2, 0.8, 1400, 0.2); },
  },
  // almost nothing: a held breath, one razor line, the body falling after
  ni_silent_assassin: {
    charge: (p) => { p.hiss(0, 1, 'bandpass', 420, 3, 0.16, { attack: 0.5 }); p.tone(0, 55, 'sine', 1, 0.2, { attack: 0.6 }); },
    blow: (p) => { p.hiss(0, 0.1, 'highpass', 5000, 0.8, 0.8, { to: 9000 }); p.tone(0, 3200, 'triangle', 0.1, 0.05, { to: 1200 }); },
    wave: (p) => { p.hiss(0.2, 0.7, 'bandpass', 500, 2, 0.14, { to: 200 }); boom(p, 0.34, 70, 0.5, 0.5); },
  },
  // the ground gathers, splits, and rolls away
  ro_fault_breaker: {
    charge: (p) => { rumble(p, 0, 0.92, 0.7); p.tone(0.5, 180, 'square', 0.42, 0.05, { to: 100, attack: 0.2 }); },
    blow: (p) => { crack(p, 0, 0.8); boom(p, 0, 72, 0.9); p.hiss(0, 0.5, 'lowpass', 1300, 0.6, 0.8, { to: 200 }); },
    wave: (p) => { rumble(p, 0, 1.1, 0.6); for (const t of [0.14, 0.33, 0.58, 0.8]) p.hiss(t, 0.06, 'bandpass', 900, 1.4, 0.3); },
  },
  // mortars ticking into place, one report, the shells walking across the field
  ar_artillery_barrage: {
    charge: (p) => { for (const t of [0, 0.3, 0.6, 0.86]) { p.tone(t, 900, 'square', 0.03, 0.08); p.hiss(t, 0.05, 'bandpass', 2600, 2, 0.2); } rumble(p, 0.3, 0.68, 0.3); },
    blow: (p) => { crack(p, 0); boom(p, 0, 90, 0.7); p.hiss(0, 0.5, 'lowpass', 1600, 0.6, 0.8, { to: 300 }); },
    wave: (p) => { for (const [i, t] of [0, 0.26, 0.5, 0.74].entries()) { boom(p, t, 110 - i * 8, 0.4, 0.6); p.hiss(t, 0.3, 'lowpass', 1300, 0.6, 0.5, { to: 240 }); } },
  },
  // the brute lifts, the slab falls
  boss_slam: {
    charge: (p) => { p.tone(0, 70, 'sawtooth', 0.58, 0.16, { to: 140, attack: 0.4 }); rush(p, 0.58, 300, 1300, 0.3, 1); },
    blow: (p) => { crack(p, 0, 0.6); boom(p, 0, 78, 0.8); p.hiss(0, 0.4, 'lowpass', 900, 0.7, 0.7, { to: 180 }); },
    wave: (p) => { rumble(p, 0, 1, 0.6); },
  },
  // the floor answers from below, shadow under the stone
  boss_quake: {
    charge: (p) => { rumble(p, 0, 0.72, 0.6); p.tone(0, 110, 'sawtooth', 0.72, 0.06, { to: 73, attack: 0.3 }); },
    blow: (p) => { boom(p, 0, 58, 0.9); p.hiss(0, 0.8, 'lowpass', 500, 0.6, 0.9, { to: 90 }); p.tone(0.02, 140, 'square', 0.12, 0.08, { to: 60 }); },
    wave: (p) => { for (const f of [65.4, 69.3]) p.tone(0, f, 'sawtooth', 1, 0.09, { attack: 0.1 }); p.hiss(0, 1, 'bandpass', 280, 2, 0.3, { to: 120 }); },
  },
  // the Titan: the longest wind-up, the heaviest fall
  boss_titan_slam: {
    charge: (p) => { p.tone(0, 55, 'sawtooth', 0.83, 0.18, { to: 165, attack: 0.6 }); rush(p, 0.83, 200, 2000, 0.4, 0.9); p.tone(0.4, 330, 'triangle', 0.43, 0.06, { attack: 0.3 }); },
    blow: (p) => { crack(p, 0, 0.8); boom(p, 0, 66, 1.1); p.hiss(0, 0.7, 'lowpass', 2000, 0.5, 0.9, { to: 150 }); },
    wave: (p) => { rumble(p, 0, 1.3, 0.7); p.hiss(0.1, 1.1, 'bandpass', 1400, 1, 0.16, { to: 500 }); },
  },
  // a throat opening, a blood-dark howl
  boss_roar: {
    charge: (p) => { p.hiss(0, 0.6, 'bandpass', 420, 1.4, 0.5, { to: 1300, attack: 0.4 }); p.tone(0, 98, 'sawtooth', 0.6, 0.16, { to: 196, attack: 0.4 }); },
    blow: (p) => { for (const f of [147, 196, 208]) p.tone(0, f, 'sawtooth', 0.8, 0.1, { to: f * 0.72, attack: 0.03 }); p.hiss(0, 0.8, 'bandpass', 900, 0.9, 0.7, { to: 320 }); },
    wave: (p) => { for (const f of [98, 104]) p.tone(0, f, 'sawtooth', 0.9, 0.08, { attack: 0.06 }); p.hiss(0, 0.9, 'bandpass', 500, 2, 0.26, { to: 200 }); },
  },
  // the blade raised, a held silence, the sentence
  boss_execution: {
    charge: (p) => { p.hiss(0, 0.7, 'bandpass', 800, 3, 0.2, { to: 3400, attack: 0.5 }); p.tone(0, 2400, 'triangle', 0.7, 0.03, { to: 3600, attack: 0.5 }); },
    blow: (p) => { p.hiss(0, 0.16, 'bandpass', 2400, 1.1, 0.8, { to: 7000 }); crack(p, 0.06); boom(p, 0.06, 70, 0.7); },
    wave: (p) => { for (const f of [147, 151]) p.tone(0, f, 'sawtooth', 0.7, 0.07, { to: f * 0.8 }); tail(p, 0, 0.7, 1000, 0.3); },
  },
  // cuts faster than they can be counted
  boss_flurry: {
    charge: (p) => { for (let i = 0; i < 6; i++) p.hiss(0.34 + i * 0.1, 0.1, 'bandpass', 1400 + i * 400, 1.6, 0.2 + i * 0.05, { to: 3800 }); p.tone(0, 150, 'sawtooth', 0.9, 0.05, { to: 300, attack: 0.6 }); },
    blow: (p) => { for (let i = 0; i < 5; i++) p.hiss(i * 0.07, 0.1, 'bandpass', 2600 + i * 500, 1.4, 0.6, { to: 6200 }); boom(p, 0.28, 110, 0.4, 0.7); },
    wave: (p) => { p.chime(0, [3136, 2637, 2093], 0.05, 0.3, 0.04, 'triangle'); tail(p, 0, 0.7, 2000, 0.3); },
  },
  // the furnace drawn in, then let out
  boss_inferno: {
    charge: (p) => { p.hiss(0, 0.83, 'bandpass', 300, 0.8, 0.6, { to: 1800, attack: 0.5 }); p.tone(0, 80, 'sawtooth', 0.83, 0.14, { to: 150, attack: 0.5 }); },
    blow: (p) => { crack(p, 0, 0.5); boom(p, 0, 82, 0.8); p.hiss(0, 0.9, 'bandpass', 800, 0.6, 0.9, { to: 2600, attack: 0.04 }); },
    wave: (p) => { p.hiss(0, 1.1, 'bandpass', 1200, 0.7, 0.5, { to: 500 }); for (const t of [0.1, 0.2, 0.34, 0.5, 0.7, 0.9]) p.hiss(t, 0.03, 'bandpass', 3400, 2, 0.28); },
  },
  // the end of the road: every voice down at once, the sky falling in a chord without a home
  boss_apocalypse: {
    charge: (p) => { rumble(p, 0, 1.08, 0.6); for (const f of [147, 156, 220]) p.tone(0.1, f, 'sawtooth', 0.98, 0.07, { attack: 0.7 }); rush(p, 1.08, 240, 2800, 0.34, 1); },
    blow: (p) => { crack(p, 0, 0.9); boom(p, 0, 62, 1.1); p.hiss(0, 1, 'lowpass', 2800, 0.5, 0.9, { to: 150 }); for (const f of [147, 156, 208, 311]) p.tone(0, f, 'sawtooth', 0.9, 0.07, { to: f * 0.7 }); },
    wave: (p) => { rumble(p, 0, 1.3, 0.6); for (const f of [98, 104, 147]) p.tone(0, f, 'sawtooth', 1.2, 0.06, { to: f * 0.8, attack: 0.1 }); },
  },
};
