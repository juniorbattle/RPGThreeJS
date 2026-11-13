/**
 * The post-demo plateaux's combat ambiences (OD-2026-11-07-I, set 1.20.0 « Sound and FX »): one synthesized bed per
 * new combat biome of the closed list, the Bear's mountains, the Dragon's peaks, the Scorpion's desert, the Tournament
 * arena, the corrupted capital and the breach, on the same fader, clock and stop as the demo's beds (`ambience.ts`).
 * Web Audio synthesis only, deterministic from these definitions and each bed's seed: noise beds whose colour and level
 * sway on slow sines at incommensurate rates, so that nothing repeats and nothing has a seam, and seeded accents. No
 * voice: the Tournament crowd is band-filtered noise with slow swells and claps, wordless.
 */

export const POST_DEMO_AMBIENCES = ['bear_mountains', 'dragon_peaks', 'scorpion_desert', 'tournament_arena', 'corrupted_capital', 'breach'] as const;
export type PostDemoAmbienceId = (typeof POST_DEMO_AMBIENCES)[number];
export const isPostDemoAmbience = (id: string): id is PostDemoAmbienceId => (POST_DEMO_AMBIENCES as readonly string[]).includes(id);

/** Seconds of seeded white noise a post-demo bed reads, each layer at its own offset (the demo's beds read two). */
export const POST_DEMO_NOISE_SECONDS = 6;

/** A bed's seed: a hash of its name, so that no two beds share a noise or a sequence of accents. */
export function postDemoSeed(id: PostDemoAmbienceId): number {
  let h = 0x811c9dc5;
  for (const c of `ambience:${id}`) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return h | 0;
}

/**
 * Each bed's trim, set so that its loudness meets the mean of the Lion's three combat beds, -29.8 LUFS (ungated,
 * K-weighted, at the default music volume, through the ambience bus and the final limiter; the demo's five beds measure
 * from -28.7 to -31.7): `tools/audio/ambience-check.mjs`, 2026-11-13.
 */
const LEVEL: Readonly<Record<PostDemoAmbienceId, number>> = {
  bear_mountains: 1.16,
  dragon_peaks: 1.35,
  scorpion_desert: 1.07,
  tournament_arena: 2.38,
  corrupted_capital: 1.07,
  breach: 1.03,
};

export interface AmbienceKit {
  ctx: BaseAudioContext;
  /** The bed's fader: its fade in, its fade out and its stop belong to `startAmbience`. */
  out: AudioNode;
  rng: () => number;
  noise: AudioBuffer;
  /** Sources that run until the bed stops. */
  loops: AudioScheduledSourceNode[];
  /** Calls `fn` with an audio time, again and again, a seeded number of seconds apart within `range`. */
  every(fn: (t: number) => void, range: readonly [number, number]): void;
}

type Partials = ReadonlyArray<readonly [ratio: number, amplitude: number, life: number]>;
/** A bronze bell: hum, prime, minor third, fifth, nominal and the upper partials, the lower ones ringing longer. */
const BELL: Partials = [[0.5, 0.55, 1.6], [1, 1, 1.2], [1.19, 0.55, 1], [1.5, 0.3, 0.8], [2, 0.7, 0.7], [2.51, 0.28, 0.5], [2.66, 0.22, 0.45], [3.01, 0.16, 0.4], [4.17, 0.1, 0.3]];
/** Small bronze chimes, bright and short. */
const CHIME: Partials = [[1, 1, 1], [2.76, 0.4, 0.55], [5.4, 0.18, 0.3]];
/** Iron: a chain link, a winch. */
const IRON: Partials = [[1, 1, 1], [2.32, 0.5, 0.6], [4.25, 0.25, 0.35]];
/** A halyard's shackle against a wooden mast. */
const HALYARD: Partials = [[1, 1, 1], [2.92, 0.45, 0.5], [6.1, 0.15, 0.25]];

interface BedOptions {
  type: BiquadFilterType;
  f: number;
  q: number;
  gain: number;
  /** Rate (Hz) and depth (fraction of `f`) of the filter's sway. */
  sweep: readonly [number, number];
  /** Rate (Hz) and depth (fraction of `gain`) of the level's sway. */
  gust: readonly [number, number];
  pan?: number;
  to?: AudioNode;
}

function voices(k: AmbienceKit, dest: AudioNode) {
  const { ctx, rng, noise, loops } = k;
  const side = (width: number) => (rng() * 2 - 1) * width;
  const panned = (p: number, to: AudioNode = dest): AudioNode => {
    const node = ctx.createStereoPanner(); node.pan.value = p; node.connect(to); return node;
  };
  const filter = (type: BiquadFilterType, f: number, q: number): BiquadFilterNode => {
    const node = ctx.createBiquadFilter(); node.type = type; node.frequency.value = f; node.Q.value = q; return node;
  };
  const envelope = (g: GainNode, t: number, peak: number, attack: number, end: number) => {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, end);
  };
  /** Two sines at incommensurate rates move a parameter around its value: a sway that never repeats exactly. */
  const sway = (param: AudioParam, rate: number, depth: number) => {
    for (const [r, d] of [[rate, depth * 0.62], [rate * 0.437, depth * 0.38]] as const) {
      const o = ctx.createOscillator(); o.frequency.value = r;
      const g = ctx.createGain(); g.gain.value = d;
      o.connect(g).connect(param); o.start(); loops.push(o);
    }
  };
  /** A looping noise bed, filtered, its colour and its level swaying. */
  const bed = (o: BedOptions): GainNode => {
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
    const f = filter(o.type, o.f, o.q);
    const g = ctx.createGain(); g.gain.value = o.gain;
    sway(f.frequency, o.sweep[0], o.f * o.sweep[1]);
    sway(g.gain, o.gust[0], o.gain * o.gust[1]);
    src.connect(f).connect(g).connect(panned(o.pan ?? 0, o.to ?? dest));
    src.start(0, rng() * noise.duration); loops.push(src);
    return g;
  };
  /** A held chord of oscillators under a low-pass, its level swaying. */
  const drone = (freqs: readonly number[], type: OscillatorType, gain: number, lowpass: number, swayRate: number, swayDepth: number) => {
    const f = filter('lowpass', lowpass, 0.7);
    const g = ctx.createGain(); g.gain.value = gain;
    sway(g.gain, swayRate, gain * swayDepth);
    f.connect(g).connect(dest);
    for (const hz of freqs) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz; o.connect(f); o.start(); loops.push(o); }
  };
  /** Glassy held sines, each trembling at its own slow rate. */
  const shimmer = (freqs: readonly number[], gain: number) => {
    const high = filter('highpass', 1500, 0.7);
    high.connect(dest);
    freqs.forEach((hz, i) => {
      const o = ctx.createOscillator(); o.frequency.value = hz;
      const g = ctx.createGain(); g.gain.value = gain * 0.5;
      sway(g.gain, 0.13 + rng() * 0.16, gain * 0.5);
      o.connect(g).connect(panned(i % 2 ? 0.6 : -0.6, high)); o.start(); loops.push(o);
    });
  };
  /**
   * An echo across the valleys or down the streets: three filtered taps, each `feedback` times the one before. No
   * feedback loop, so nothing outlives the bed once its sources stop. Returns its input.
   */
  const echo = (delay: number, feedback: number, lowpass: number, wet: number): AudioNode => {
    const input = filter('lowpass', lowpass, 0.7);
    for (let tap = 1; tap <= 3; tap++) {
      const line = ctx.createDelay(4); line.delayTime.value = delay * tap;
      const g = ctx.createGain(); g.gain.value = wet * feedback ** (tap - 1);
      input.connect(line).connect(g).connect(dest);
    }
    return input;
  };
  /** Struck partials on exponential decays: bells, chimes, iron. */
  const strike = (t: number, hz: number, partials: Partials, gain: number, decay: number, to: AudioNode) => {
    for (const [ratio, amplitude, life] of partials) {
      const o = ctx.createOscillator(); o.frequency.value = hz * ratio;
      const g = ctx.createGain(); const end = t + decay * life;
      envelope(g, t, gain * amplitude, 0.004, end);
      o.connect(g).connect(to); o.start(t); o.stop(end + 0.05);
    }
  };
  /** A short slice of the noise through a filter: crackle, tick, clapper. */
  const burst = (t: number, dur: number, type: BiquadFilterType, hz: number, q: number, gain: number, to: AudioNode = dest, attack = 0.002) => {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = filter(type, hz, q);
    const g = ctx.createGain(); envelope(g, t, gain, Math.min(attack, dur * 0.5), t + dur);
    src.connect(f).connect(g).connect(to); src.start(t, rng() * (noise.duration - dur - 0.1), dur + 0.02);
  };
  /** One grain of the noise, unfiltered, into a shared filter: sand, claps. */
  const grain = (t: number, dur: number, gain: number, to: AudioNode) => {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g).connect(to); src.start(t, rng() * (noise.duration - 1), dur + 0.01);
  };
  /** An oscillator gliding between two pitches under an envelope: a collapse, a drop, a hum. */
  const glide = (t: number, from: number, to: number, dur: number, type: OscillatorType, gain: number, attack: number, out: AudioNode = dest) => {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); envelope(g, t, gain, attack, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
  };
  /** A noise band opening and closing: a gust, the breach's breath. */
  const swell = (t: number, dur: number, type: BiquadFilterType, from: number, peak: number, q: number, gain: number, p = 0, out: AudioNode = dest) => {
    const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
    const f = filter(type, from, q);
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(peak, t + dur * 0.45); f.frequency.exponentialRampToValueAtTime(from, t + dur);
    const g = ctx.createGain(); envelope(g, t, gain, dur * 0.45, t + dur);
    src.connect(f).connect(g).connect(panned(p, out)); src.start(t, rng() * noise.duration); src.stop(t + dur + 0.05);
  };
  return {
    side, panned, bed, drone, shimmer, echo, strike, burst, grain, glide, swell,
    /** A brazier's crackles. */
    crackles(t: number, count: number, gain: number, p: number, to: AudioNode = dest) {
      for (let i = 0; i < count; i++) burst(t + rng() * 0.3, 0.03, 'bandpass', 1800 + rng() * 2600, 2, gain * (0.5 + rng() * 0.5), panned(p, to));
    },
    /** A distant bronze bell, its clapper, and its echo. */
    bell(t: number, hz: number, gain: number, decay: number, p: number, send: AudioNode) {
      const bus = ctx.createGain();
      const tone = filter('lowpass', 2600, 0.7);
      bus.connect(tone); tone.connect(panned(p)); tone.connect(send);
      strike(t, hz, BELL, gain, decay, bus);
      burst(t, 0.012, 'bandpass', 3200, 1.5, gain * 0.6, bus);
    },
    chimes(t: number, count: number, gain: number) {
      let at = t;
      for (let i = 0; i < count; i++) { strike(at, 1400 + rng() * 1200, CHIME, gain * (0.6 + rng() * 0.4), 1.4, panned(side(0.8))); at += 0.12 + rng() * 0.2; }
    },
    /** A heavy timber creaking in the wind: a slow pulse train through a wooden resonance. */
    creak(t: number, gain: number, p: number) {
      const dur = 0.35 + rng() * 0.5;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const from = 28 + rng() * 22;
      o.frequency.setValueAtTime(from, t); o.frequency.linearRampToValueAtTime(from * (0.6 + rng() * 0.8), t + dur);
      const f = filter('bandpass', 700 + rng() * 600, 5);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(panned(p)); o.start(t); o.stop(t + dur + 0.05);
    },
    /** A chain or a winch knocking: a few iron pings. */
    clinks(t: number, count: number, gain: number, p: number) {
      let at = t;
      const out = panned(p);
      for (let i = 0; i < count; i++) { strike(at, 1900 + rng() * 1300, IRON, gain * (0.5 + rng() * 0.5), 0.12 + rng() * 0.08, out); at += 0.05 + rng() * 0.09; }
    },
    halyards(t: number, count: number, gain: number) {
      let at = t;
      for (let i = 0; i < count; i++) { strike(at, 900 + rng() * 500, HALYARD, gain * (0.6 + rng() * 0.4), 0.9, panned(side(0.8))); at += 0.3 + rng() * 0.5; }
    },
    /** Stones letting go: a low thud, then a scatter of ticks. */
    fall(t: number, low: number, gain: number, ticks: number, out: AudioNode = dest) {
      glide(t, low, low * 0.62, 1.4, 'sine', gain, 0.1, out);
      burst(t, 0.8, 'lowpass', 550, 0.7, gain * 0.9, out, 0.06);
      let at = t + 0.1;
      for (let i = 0; i < ticks; i++) { burst(at, 0.03 + rng() * 0.05, 'bandpass', 800 + rng() * 1600, 2.5, gain * 0.45 * (1 - i / ticks) + 0.004, out); at += 0.05 + rng() * 0.17; }
    },
    /** Grains of sand slipping down a dune face. */
    trickle(t: number, dur: number, gain: number, p: number) {
      const band = filter('bandpass', 5200 + rng() * 2000, 1.2);
      band.connect(panned(p));
      const count = Math.round(dur * (45 + rng() * 30));
      for (let i = 0; i < count; i++) {
        const at = t + rng() * dur;
        grain(at, 0.004 + rng() * 0.006, gain * (0.3 + 0.7 * Math.sin((Math.PI * (at - t)) / dur)) * (0.5 + rng() * 0.5), band);
      }
    },
    /** A dune booming far off: a low rough hum rising and falling over several seconds. */
    hum(t: number, dur: number, hz: number, gain: number) {
      const f = filter('lowpass', 260, 0.7);
      const g = ctx.createGain(); envelope(g, t, gain, dur * 0.4, t + dur);
      f.connect(g).connect(panned(side(0.4)));
      for (const [ratio, amplitude, type] of [[1, 1, 'sine'], [2, 0.35, 'triangle'], [3, 0.12, 'triangle']] as const) {
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(hz * ratio, t); o.frequency.linearRampToValueAtTime(hz * ratio * (1 + (rng() - 0.5) * 0.06), t + dur);
        const a = ctx.createGain(); a.gain.value = amplitude;
        o.connect(a).connect(f); o.start(t); o.stop(t + dur + 0.05);
      }
    },
    /** An insect buzzing in the heat: a high noise band chopped at a few tens of hertz, swelling and fading. */
    cicada(t: number, dur: number, gain: number, p: number) {
      const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
      const band = filter('bandpass', 4800 + rng() * 1200, 5);
      const chop = ctx.createGain(); chop.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 38 + rng() * 10;
      const depth = ctx.createGain(); depth.gain.value = 0.5;
      lfo.connect(depth).connect(chop.gain);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
      g.gain.setValueAtTime(gain, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(band).connect(chop).connect(g).connect(panned(p));
      src.start(t, rng() * noise.duration); src.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    },
    /** A cloth banner snapping in the wind. */
    flap(t: number, count: number, rate: number, gain: number, p: number) {
      const src = ctx.createBufferSource(); src.buffer = noise;
      const band = filter('bandpass', 900 + rng() * 500, 0.9);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
      const times: number[] = [];
      for (let i = 0, at = t; i < count; i++, at += (0.85 + rng() * 0.3) / rate) times.push(at);
      times.forEach((at, i) => {
        const next = times[i + 1] ?? at + 0.12;
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain * (0.4 + rng() * 0.6), at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, Math.min(at + 0.07, next - 0.005));
      });
      const end = times[times.length - 1]! + 0.15;
      src.connect(band).connect(g).connect(panned(p)); src.start(t, rng() * (noise.duration - (end - t) - 0.1), end - t);
    },
    /** A distant crowd clapping: a dense train of short grains, quick to rise, slower to die. */
    applause(t: number, dur: number, gain: number) {
      const left = filter('bandpass', 1400, 0.7), right = filter('bandpass', 1700, 0.7);
      left.connect(panned(-0.5)); right.connect(panned(0.5));
      const count = Math.round(dur * 38);
      for (let i = 0; i < count; i++) {
        const at = t + rng() * dur, x = at - t;
        grain(at, 0.012 + rng() * 0.012, gain * Math.min(1, x / 0.4) * Math.exp((-1.5 * x) / dur) * (0.4 + rng() * 0.6) + 0.0002, i % 2 ? left : right);
      }
    },
    /** A drop of ink falling on stone: a low pitch falling fast, with a small wet tick. */
    drip(t: number, gain: number, p: number) {
      const out = panned(p);
      glide(t, 300 + rng() * 120, 95, 0.16, 'sine', gain, 0.004, out);
      burst(t, 0.015, 'bandpass', 1200, 4, gain * 0.5, out);
    },
  };
}

type Voices = ReturnType<typeof voices>;

const DEFINITIONS: Readonly<Record<PostDemoAmbienceId, (k: AmbienceKit, v: Voices) => void>> = {
  // dark granite, wind-driven snow, firelight only from the braziers
  bear_mountains: ({ every, rng }, v) => {
    v.bed({ type: 'lowpass', f: 380, q: 0.7, gain: 0.42, sweep: [0.045, 0.45], gust: [0.07, 0.8], pan: -0.2 }); // the wind's body on the granite
    v.bed({ type: 'bandpass', f: 520, q: 7, gain: 0.12, sweep: [0.031, 0.35], gust: [0.053, 0.9], pan: 0.3 }); // its howl along the ridges
    v.bed({ type: 'highpass', f: 4800, q: 0.5, gain: 0.035, sweep: [0.08, 0.2], gust: [0.07, 0.95], pan: 0.15 }); // snow driven in the gusts
    v.bed({ type: 'lowpass', f: 240, q: 0.6, gain: 0.12, sweep: [0.09, 0.3], gust: [0.13, 0.4], pan: 0.45 }); // a brazier's low breath
    every((t) => v.crackles(t, 1 + Math.floor(rng() * 3), 0.05, 0.45), [1.2, 3.5]); // and its crackles
    every((t) => v.creak(t, 0.05, v.side(0.7)), [7, 15]); // a timber prop in the wind
    every((t) => v.clinks(t, 3 + Math.floor(rng() * 3), 0.016, v.side(0.7)), [11, 22]); // a winch chain knocking
    every((t) => v.fall(t, 70, 0.07, 5 + Math.floor(rng() * 5), v.panned(v.side(0.6))), [25, 45]); // far scree letting go
  },
  // pale needles above a sea of clouds, thin air, verdigris bronze bells
  dragon_peaks: ({ every, rng }, v) => {
    v.bed({ type: 'lowpass', f: 900, q: 0.5, gain: 0.1, sweep: [0.02, 0.3], gust: [0.03, 0.4], pan: -0.6 }); // the cloud sea's hush, wide
    v.bed({ type: 'lowpass', f: 1100, q: 0.5, gain: 0.1, sweep: [0.017, 0.3], gust: [0.027, 0.4], pan: 0.6 });
    v.bed({ type: 'bandpass', f: 1500, q: 1.6, gain: 0.09, sweep: [0.05, 0.45], gust: [0.083, 0.85] }); // thin high wind
    v.bed({ type: 'highpass', f: 3500, q: 0.5, gain: 0.03, sweep: [0.07, 0.25], gust: [0.083, 0.9], pan: 0.2 }); // the thin air itself
    v.bed({ type: 'bandpass', f: 1150, q: 30, gain: 0.05, sweep: [0.021, 0.12], gust: [0.047, 1], pan: 0.4 }); // a ridge whistling
    v.bed({ type: 'bandpass', f: 1730, q: 35, gain: 0.03, sweep: [0.016, 0.1], gust: [0.039, 1], pan: -0.4 });
    const valley = v.echo(0.42, 0.38, 1800, 0.6);
    const pitches = [233.08, 311.13, 349.23, 415.3];
    every((t) => {
      const hz = pitches[Math.floor(rng() * pitches.length)]!, p = v.side(0.7);
      v.bell(t, hz, 0.07, 5, p, valley);
      if (rng() < 0.4) v.bell(t + 1.4 + rng() * 0.8, hz, 0.045, 4.5, p, valley); // rung twice
    }, [7, 15]); // a bronze bell across the valley
    every((t) => v.chimes(t, 2 + Math.floor(rng() * 3), 0.012), [9, 18]); // small chimes on a hermitage
  },
  // flat scorched land, wind-rippled dunes, heat
  scorpion_desert: ({ every, rng }, v) => {
    v.bed({ type: 'bandpass', f: 700, q: 0.8, gain: 0.22, sweep: [0.06, 0.55], gust: [0.09, 0.85], pan: -0.15 }); // dry wind across the dunes
    v.bed({ type: 'lowpass', f: 300, q: 0.6, gain: 0.16, sweep: [0.04, 0.3], gust: [0.09, 0.7], pan: 0.1 }); // its low push
    v.bed({ type: 'highpass', f: 6500, q: 0.6, gain: 0.05, sweep: [0.1, 0.15], gust: [0.09, 0.95], pan: 0.25 }); // sand blown with the gusts
    every((t) => v.trickle(t, 0.8 + rng() * 0.8, 0.03, v.side(0.7)), [3, 7]); // grains slipping down a dune face
    every((t) => v.hum(t, 6 + rng() * 3, 70 + rng() * 35, 0.05), [14, 26]); // a dune booming far off
    every((t) => v.cicada(t, 4 + rng() * 3, 0.02, v.side(0.6)), [10, 20]); // an insect in the heat
  },
  // the Arena of Destinies on the Tournament's day: open air, the stands' wordless murmur, the clans' banners and masts
  tournament_arena: ({ ctx, every, rng }, v) => {
    v.bed({ type: 'bandpass', f: 500, q: 0.5, gain: 0.12, sweep: [0.04, 0.3], gust: [0.06, 0.6] }); // open air over the stands
    const crowd = ctx.createGain();
    const far = ctx.createBiquadFilter(); far.type = 'lowpass'; far.frequency.value = 3200;
    crowd.connect(far).connect(v.panned(0));
    // the stands' murmur: three noise bands moving slowly, too slow and too smooth to carry a syllable
    v.bed({ type: 'bandpass', f: 300, q: 1, gain: 0.09, sweep: [0.11, 0.15], gust: [0.47, 0.45], pan: -0.5, to: crowd });
    v.bed({ type: 'bandpass', f: 820, q: 1.4, gain: 0.07, sweep: [0.13, 0.12], gust: [0.61, 0.5], pan: 0.1, to: crowd });
    v.bed({ type: 'bandpass', f: 1900, q: 1.6, gain: 0.035, sweep: [0.17, 0.12], gust: [0.83, 0.5], pan: 0.5, to: crowd });
    every((t) => {
      crowd.gain.setValueAtTime(1, t); crowd.gain.linearRampToValueAtTime(2.3, t + 1.2); crowd.gain.exponentialRampToValueAtTime(1, t + 4.8);
      if (rng() < 0.55) v.applause(t + 0.9, 2 + rng() * 1.5, 0.03);
    }, [14, 28]); // the crowd rising, sometimes clapping
    every((t) => v.flap(t, 6 + Math.floor(rng() * 9), 7 + rng() * 4, 0.05, v.side(0.8)), [2.5, 6]); // a clan banner in the wind
    every((t) => v.halyards(t, 1 + Math.floor(rng() * 3), 0.018), [5, 11]); // halyards ringing against the masts
  },
  // the capital burning and corrupted: brick streets, fires beyond the roofs, masonry giving way, the ink's presence
  corrupted_capital: ({ every, rng }, v) => {
    v.bed({ type: 'bandpass', f: 380, q: 0.7, gain: 0.2, sweep: [0.05, 0.45], gust: [0.08, 0.75], pan: 0.2 }); // wind down the brick streets
    v.bed({ type: 'bandpass', f: 640, q: 18, gain: 0.05, sweep: [0.027, 0.18], gust: [0.061, 1], pan: -0.35 }); // its hollow note through broken walls
    v.bed({ type: 'lowpass', f: 260, q: 0.7, gain: 0.24, sweep: [0.11, 0.35], gust: [0.07, 0.4], pan: 0.3 }); // the city burning beyond the roofs
    v.bed({ type: 'bandpass', f: 1300, q: 1, gain: 0.04, sweep: [0.23, 0.3], gust: [0.17, 0.6], pan: 0.3 });
    v.drone([55, 56.2, 82.4], 'sawtooth', 0.03, 170, 0.03, 0.85); // the ink's low presence
    const street = v.echo(0.19, 0.3, 1400, 0.45);
    every((t) => v.crackles(t, 2 + Math.floor(rng() * 2), 0.07, 0.3 + rng() * 0.4), [0.6, 1.8]); // embers
    every((t) => {
      const near = v.panned(v.side(0.5));
      near.connect(street);
      v.fall(t, 48, 0.15, 8 + Math.floor(rng() * 7), near);
    }, [9, 18]); // masonry giving way, echoing down the street
  },
  // the tear itself: its depth, its cold white rim, its breath, its ink
  breach: ({ every, rng }, v) => {
    v.bed({ type: 'bandpass', f: 300, q: 0.6, gain: 0.16, sweep: [0.035, 0.35], gust: [0.05, 0.6], pan: -0.2 }); // cold air in the crater
    v.bed({ type: 'lowpass', f: 220, q: 0.6, gain: 0.08, sweep: [0.1, 0.3], gust: [0.07, 0.4], pan: 0.5 }); // fires far behind
    v.drone([36.7, 37.8, 73.4, 110.2], 'sawtooth', 0.03, 140, 0.021, 0.7); // the tear's depth
    v.shimmer([2349.3, 2489, 3520, 3729.3], 0.006); // its cold white rim
    every((t) => { const dur = 4 + rng() * 2.5; v.swell(t, dur, 'lowpass', 150, 900, 0.8, 0.22); v.glide(t, 45, 40, dur, 'sine', 0.11, dur * 0.45); }, [7, 13]); // the breach drawing breath
    every((t) => { let at = t; for (let i = 0, n = 1 + Math.floor(rng() * 3); i < n; i++) { v.drip(at, 0.05, v.side(0.6)); at += 0.18 + rng() * 0.3; } }, [1.5, 4]); // ink falling on the paving
    every((t) => { v.swell(t, 0.7, 'lowpass', 200, 1400, 0.7, 0.08); v.glide(t + 0.6, 62, 27, 2.4, 'sine', 0.16, 0.02); v.burst(t + 0.6, 0.5, 'lowpass', 400, 0.7, 0.12); }, [18, 34]); // the ground giving under the ink
  },
};

/** Builds a post-demo bed on the kit `startAmbience` prepared. */
export function playPostDemoAmbience(k: AmbienceKit, id: PostDemoAmbienceId): void {
  const trim = k.ctx.createGain();
  trim.gain.value = LEVEL[id];
  trim.connect(k.out);
  DEFINITIONS[id](k, voices(k, trim));
}
