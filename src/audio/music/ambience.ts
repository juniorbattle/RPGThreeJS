/**
 * Synthesized ambience (OD-2026-10-29-B, OD-2026-11-01-B): one low loop per combat biome, plus the POI map and the
 * refuge, under the music volume and mute. Filtered noise beds with slow movement and sparse seeded accents. Adapted
 * from the HD-2D combat sound module (`src/combat/audio/CombatSfx.ts`, OD-2026-10-29-A), which is not wired. The
 * post-demo plateaux's six biomes (OD-2026-11-07-I, set 1.20.0) are written in `ambiencePostDemo.ts` on the same
 * fader, clock and stop; the demo's five beds keep their seed, their noise and their code.
 */
import { arenaThemeFor } from '../../combat/arena/arenaThemes';
import { isPostDemoAmbience, playPostDemoAmbience, POST_DEMO_AMBIENCES, POST_DEMO_NOISE_SECONDS, postDemoSeed, type PostDemoAmbienceId } from './ambiencePostDemo';
import { seededRandom } from './theory';

export type AmbienceId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum' | 'map' | 'refuge' | PostDemoAmbienceId;

/** The clock the accents follow: the audio clock and the page's timers, or a virtual clock for an offline render. */
export interface AmbienceClock {
  now(): number;
  after(seconds: number, fn: () => void): unknown;
  cancel(handle: unknown): void;
}

const liveClock = (ctx: BaseAudioContext): AmbienceClock => ({
  now: () => ctx.currentTime,
  after: (seconds, fn) => window.setTimeout(fn, seconds * 1000),
  cancel: (handle) => window.clearTimeout(handle as number),
});

export function startAmbience(ctx: BaseAudioContext, dest: AudioNode, id: AmbienceId, clock: AmbienceClock = liveClock(ctx)): () => void {
  const postDemo = isPostDemoAmbience(id);
  const rng = seededRandom(postDemo ? postDemoSeed(id) : 0xa3b1 + id.length * 977);
  const noise = ctx.createBuffer(1, ctx.sampleRate * (postDemo ? POST_DEMO_NOISE_SECONDS : 2), ctx.sampleRate);
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
  const timers: unknown[] = [];
  const every = (fn: (t: number) => void, range: readonly [number, number]) => {
    const next = () => { timers.push(clock.after(range[0] + rng() * (range[1] - range[0]), () => { fn(clock.now() + 0.05); next(); })); };
    next();
  };
  if (postDemo) {
    playPostDemoAmbience({ ctx, out, rng, noise, loops, every }, id);
  } else if (id === 'forest_route') {
    bed('bandpass', 420, 0.6, 0.35, 0.05); // wind in the canopy
    bed('highpass', 5200, 0.4, 0.04, 0.11); // leaves
    every((t) => { const f = 2400 + rng() * 1600; for (let i = 0; i < 3; i++) tone(t + i * 0.09, f * (1 + i * 0.06), 'sine', 0.07, 0.03, f * 1.3); }, [2.5, 6]);
  } else if (id === 'bois_clair_burning') {
    bed('lowpass', 320, 0.7, 0.55, 0.09); // the fires' roar
    bed('bandpass', 1800, 1.2, 0.08, 0.3);
    every((t) => { for (let i = 0; i < 4; i++) crackle(t + i * 0.04 * rng()); }, [0.3, 1.1]);
    every((t) => tone(t, 50, 'sine', 1.4, 0.18, 32, 0.3), [6, 12]); // a distant collapse
  } else if (id === 'map') {
    bed('bandpass', 560, 0.5, 0.24, 0.06); // open wind over the country
    bed('highpass', 6200, 0.4, 0.03, 0.09); // dry grass
    every((t) => { const f = 1800 + rng() * 1400; for (let i = 0; i < 2; i++) tone(t + i * 0.16, f * (1 - i * 0.08), 'sine', 0.12, 0.022, f * 0.9); }, [4, 9]); // a far bird
  } else if (id === 'refuge') {
    bed('lowpass', 300, 0.7, 0.5, 0.07); // the hearth's low breath
    bed('bandpass', 1400, 1, 0.09, 0.2);
    every((t) => { for (let i = 0; i < 3; i++) crackle(t + i * 0.05 * rng()); }, [0.7, 2.2]); // the fire
    every((t) => tone(t, 165, 'sine', 0.3, 0.05, 110, 0.02), [7, 14]); // timber settling
  } else {
    bed('bandpass', 300, 0.5, 0.3, 0.04); // night wind
    every((t) => { for (let i = 0; i < 6; i++) tone(t + i * 0.05, 4200, 'square', 0.02, 0.008); }, [1.2, 3]); // crickets
    every((t) => tone(t, 196, 'sine', 2.4, 0.03, undefined, 0.8), [9, 16]); // a far bell
  }
  return () => {
    for (const timer of timers) clock.cancel(timer);
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    for (const node of loops) { try { node.stop(now + 1.1); } catch { /* already stopped */ } }
    window.setTimeout(() => { try { out.disconnect(); } catch { /* gone */ } }, 1300);
  };
}

const AMBIENCES: readonly AmbienceId[] = ['forest_route', 'bois_clair_burning', 'lion_sanctum', 'map', 'refuge', ...POST_DEMO_AMBIENCES];

/**
 * The ambience of a scene, with the arena's own fallback (`arenaThemeFor`): an unknown scene is the forest route. A
 * Lion arena plays its own bed; every post-demo arena plays its plateau's biome (`ArenaTheme.sound`): the Bear's three
 * arenas the Bear's mountains, the Dragon's four the Dragon's peaks, the Scorpion's six the Scorpion's desert; in the
 * final act, the Arena of Destinies on the Tournament's day the Tournament arena, the breach wherever the tear stands
 * open on the field (the arena on the night of the betrayal, the heart of the breach), and the corrupted capital in
 * its streets, its great square, at its ramparts and in the crater once the tear has closed.
 */
export function ambienceForScene(sceneId: string | null | undefined): AmbienceId {
  return AMBIENCES.find((id) => id === sceneId) ?? arenaThemeFor(sceneId).sound;
}
