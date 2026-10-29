/**
 * Synthesized biome ambience (OD-2026-10-29-B): one low loop per combat arena, under the music volume and mute.
 * Filtered noise beds with slow movement and sparse seeded accents. Adapted from the HD-2D combat sound module
 * (`src/combat/audio/CombatSfx.ts`, OD-2026-10-29-A), which is not wired.
 */
import { seededRandom } from './theory';

export type AmbienceId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';

export function startAmbience(ctx: AudioContext, dest: AudioNode, id: AmbienceId): () => void {
  const rng = seededRandom(0xa3b1 + id.length * 977);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = rng() * 2 - 1;
  const out = ctx.createGain();
  out.gain.value = 0.0001;
  out.connect(dest);
  out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
  const loops: AudioScheduledSourceNode[] = [];
  const bed = (type: BiquadFilterType, f: number, q: number, gain: number, lfo: number) => {
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = type; filter.frequency.value = f; filter.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    const mod = ctx.createOscillator(); mod.frequency.value = lfo;
    const depth = ctx.createGain(); depth.gain.value = f * 0.35;
    mod.connect(depth).connect(filter.frequency);
    src.connect(filter).connect(g).connect(out);
    src.start(); mod.start();
    loops.push(src, mod);
  };
  const tone = (t: number, f: number, type: OscillatorType, dur: number, gain: number, to?: number, attack = 0.005) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  };
  const crackle = (t: number) => {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500 + rng() * 2500; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(f).connect(g).connect(out); src.start(t, rng() * 1.5, 0.05);
  };
  const timers: number[] = [];
  const every = (fn: (t: number) => void, range: [number, number]) => {
    const next = () => { timers.push(window.setTimeout(() => { fn(ctx.currentTime + 0.05); next(); }, (range[0] + rng() * (range[1] - range[0])) * 1000)); };
    next();
  };
  if (id === 'forest_route') {
    bed('bandpass', 420, 0.6, 0.35, 0.05); // wind in the canopy
    bed('highpass', 5200, 0.4, 0.04, 0.11); // leaves
    every((t) => { const f = 2400 + rng() * 1600; for (let i = 0; i < 3; i++) tone(t + i * 0.09, f * (1 + i * 0.06), 'sine', 0.07, 0.03, f * 1.3); }, [2.5, 6]);
  } else if (id === 'bois_clair_burning') {
    bed('lowpass', 320, 0.7, 0.55, 0.09); // the fires' roar
    bed('bandpass', 1800, 1.2, 0.08, 0.3);
    every((t) => { for (let i = 0; i < 4; i++) crackle(t + i * 0.04 * rng()); }, [0.3, 1.1]);
    every((t) => tone(t, 50, 'sine', 1.4, 0.18, 32, 0.3), [6, 12]); // a distant collapse
  } else {
    bed('bandpass', 300, 0.5, 0.3, 0.04); // night wind
    every((t) => { for (let i = 0; i < 6; i++) tone(t + i * 0.05, 4200, 'square', 0.02, 0.008); }, [1.2, 3]); // crickets
    every((t) => tone(t, 196, 'sine', 2.4, 0.03, undefined, 0.8), [9, 16]); // a far bell
  }
  return () => {
    for (const timer of timers) window.clearTimeout(timer);
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    for (const node of loops) { try { node.stop(now + 1.1); } catch { /* already stopped */ } }
    window.setTimeout(() => { try { out.disconnect(); } catch { /* gone */ } }, 1300);
  };
}

const AMBIENCES: readonly AmbienceId[] = ['forest_route', 'bois_clair_burning', 'lion_sanctum'];

/** The ambience of a combat scene, with the arena's own fallback (`arenaThemeFor`): an unknown scene is the forest route. */
export function ambienceForScene(sceneId: string | null | undefined): AmbienceId {
  return AMBIENCES.find((id) => id === sceneId) ?? 'forest_route';
}
