/**
 * Sketches of the post-demo bosses' signature cues (PLATEAU_MUSIC_DRAFT_2026-11-13), proposed to the operator under set
 * 1.20.0 ("Signature cues for post-demo bosses are proposed to the operator"). They are NOT in the closed cue table:
 * that table holds 158 of its 160 identities, so these 18 (six bosses, charge, blow and wave) need the operator's
 * decision first. Only the offline render tool reads this file, for listening; no game code imports it.
 * Each part keeps the 2.5-second limit of the signature cues, and each echoes its part's music.
 */
import type { Primitives } from './cueDesigns';
import type { SignaturePart } from './cueTable';

type Design = (p: Primitives) => void;
export type SignatureSketch = Readonly<Record<SignaturePart, Design>>;

const boom = (p: Primitives, t: number, f: number, dur: number, gain = 1) => p.tone(t, f, 'sine', dur, gain, { to: Math.max(24, f * 0.42) });
const rumble = (p: Primitives, t: number, dur: number, gain: number) => { p.tone(t, 52, 'sine', dur, gain, { to: 30, attack: dur * 0.3 }); p.hiss(t, dur, 'lowpass', 340, 0.7, gain * 0.7, { to: 110, attack: dur * 0.3 }); };
/** An inharmonic strike: anvil, bronze or copper, by its base and ratios. */
const strike = (p: Primitives, t: number, base: number, ratios: readonly number[], dur: number, gain: number) => ratios.forEach((r, i) => p.tone(t, base * r, 'sine', dur / (1 + i * 0.5), gain / (1 + i * 0.6)));

export const POST_DEMO_SIGNATURE_SKETCHES: Readonly<Record<string, { label: string; sketch: SignatureSketch }>> = {
  // the Bear's chief: a growl in low fifths rising out of the rock, a hammer on the anvil, scree rolling away
  borin: { label: 'Borin (Ours)', sketch: {
    charge: (p) => { p.tone(0, 55, 'sawtooth', 1.4, 0.12, { to: 82, attack: 1 }); p.tone(0, 82.5, 'sawtooth', 1.4, 0.09, { to: 123, attack: 1 }); rumble(p, 0, 1.4, 0.6); },
    blow: (p) => { p.hiss(0, 0.05, 'highpass', 5000, 0.7, 0.7); strike(p, 0, 1150, [1, 2.68, 5.1, 7.6], 1.1, 0.16); boom(p, 0, 62, 0.9); },
    wave: (p) => { rumble(p, 0, 1.6, 0.6); for (const t of [0.12, 0.3, 0.52, 0.8, 1.1]) p.hiss(t, 0.07, 'bandpass', 900 + t * 400, 1.4, 0.3); p.tone(0, 58.3, 'sawtooth', 1.4, 0.06, { attack: 0.2 }); },
  } },
  // the Dragon's chief: wing beats quickening under a rising lydian call, a bronze bell struck, wind and a bell's shimmer
  kaelen: { label: 'Kaelen (Dragon)', sketch: {
    charge: (p) => { for (const [i, t] of [0, 0.42, 0.78, 1.08, 1.32, 1.52].entries()) p.hiss(t, 0.18, 'lowpass', 600 + i * 80, 0.8, 0.5); [587, 880, 831, 659].forEach((f, i) => p.tone(0.2 + i * 0.3, f, 'sine', 0.5, 0.08, { attack: 0.05 })); },
    blow: (p) => { strike(p, 0, 293.7, [0.5, 1, 1.2, 1.5, 2, 2.5, 3], 2, 0.14); boom(p, 0, 98, 0.7, 0.7); p.hiss(0, 0.04, 'highpass', 6000, 0.7, 0.4); },
    wave: (p) => { p.hiss(0, 1.8, 'bandpass', 500, 1, 0.4, { to: 2400, attack: 0.5 }); p.chime(0.1, [1175, 1109, 988, 880, 831], 0.18, 0.9, 0.04); },
  } },
  // the Grand Inquisitor: a quill scratching faster, a heavy seal stamped on copper, ink spreading on the augmented second
  inquisitor: { label: 'Grand Inquisiteur (Scorpion)', sketch: {
    charge: (p) => { for (let i = 0; i < 12; i++) p.hiss(i * (0.14 - i * 0.006), 0.04, 'bandpass', 3200 + i * 120, 3, 0.22); p.tone(0, 2650, 'sine', 1.3, 0.03, { attack: 1.1 }); },
    blow: (p) => { boom(p, 0, 80, 0.6); p.hiss(0, 0.08, 'lowpass', 1400, 0.7, 0.7); strike(p, 0.01, 2650, [1, 1.5, 2.13], 0.9, 0.1); },
    wave: (p) => { for (const f of [110, 116.5, 138.6]) p.tone(0, f, 'sawtooth', 1.6, 0.06, { attack: 0.3 }); p.hiss(0, 1.5, 'bandpass', 700, 2, 0.2, { to: 200, attack: 0.3 }); },
  } },
  // the Shadow prophet: a whisper drawn in, a dark implosion, a wavering drone of the augmented second over sand
  prophet: { label: 'Prophète des Ombres (Scorpion)', sketch: {
    charge: (p) => { p.hiss(0, 1.4, 'bandpass', 1800, 4, 0.3, { to: 700, attack: 1 }); p.hiss(0.2, 1.2, 'bandpass', 2600, 5, 0.16, { to: 1200, attack: 0.8 }); p.tone(0, 220, 'triangle', 1.4, 0.05, { to: 110, attack: 1 }); },
    blow: (p) => { p.tone(0, 90, 'sine', 0.8, 0.6, { to: 40 }); p.hiss(0, 0.7, 'bandpass', 320, 2, 0.5, { to: 90 }); for (const f of [110, 111.6]) p.tone(0, f, 'sawtooth', 0.7, 0.06); },
    wave: (p) => { for (const f of [220, 233, 277]) p.tone(0, f, 'triangle', 1.8, 0.06, { attack: 0.4 }); p.hiss(0, 1.8, 'highpass', 4000, 0.7, 0.08, { to: 7000 }); },
  } },
  // Maelor: the Seals motif corrupted, falling (C, F-sharp, E, D-flat), a boom on the tritone, a glass cluster beating
  maelor: { label: 'Maelor (brèche)', sketch: {
    charge: (p) => { [523, 740, 659, 554].forEach((f, i) => p.tone(i * 0.32, f, 'sawtooth', 0.4, 0.06, { to: f * 0.94, attack: 0.03 })); rumble(p, 0.3, 1.2, 0.5); },
    blow: (p) => { boom(p, 0, 65.4, 0.9); boom(p, 0.02, 92.5, 0.8, 0.7); p.hiss(0, 0.05, 'highpass', 6000, 0.7, 0.6); p.tone(0.02, 2093, 'sine', 0.6, 0.05); p.tone(0.02, 2217, 'sine', 0.6, 0.05); },
    wave: (p) => { for (const f of [1047, 1109, 1175]) p.tone(0, f, 'sine', 2, 0.04, { attack: 0.5 }); p.hiss(0, 2, 'lowpass', 300, 0.7, 0.3, { to: 80, attack: 0.4 }); },
  } },
  // the breach's entity: air drawn into the tear, a cold thump and a glass ping, the motif sung backwards on glass
  entity: { label: 'Entité de la brèche', sketch: {
    charge: (p) => { p.hiss(0, 1.6, 'bandpass', 3600, 2, 0.34, { to: 180, attack: 0.9 }); p.tone(0, 35, 'sine', 1.6, 0.6, { to: 30, attack: 1.2 }); },
    blow: (p) => { p.tone(0, 32, 'sine', 0.6, 0.9, { to: 24 }); p.tone(0.04, 2093, 'sine', 0.9, 0.05); p.tone(0.04, 2217, 'sine', 0.9, 0.04); },
    wave: (p) => { [1109, 1319, 1480, 1047].forEach((f, i) => p.tone(i * 0.45, f, 'sine', 0.9, 0.05, { attack: 0.15 })); p.hiss(0, 2, 'lowpass', 240, 0.7, 0.2, { attack: 0.5 }); },
  } },
};
