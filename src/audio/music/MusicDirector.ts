/**
 * Music director (Web Audio, OD-2026-10-29-B, OD-2026-11-01-B): plans each section of the current track ahead on the
 * audio clock, crossfades between contexts within 2 seconds, moves the combat levels by gain, and plays the ambience.
 * The rooms and the sample bank are computed in a worker and loaded one per task (no main-thread frame over 50 ms);
 * until a sample or a room is ready, its notes are skipped or play dry. Owned by the parent audio owner
 * (`UiSoundPlayer`), which decides when audio may start; this module never starts audio by itself.
 */
import { ambienceForScene, startAmbience, type AmbienceId } from './ambience';
import { choose, plan, sampleRateOf, SAMPLED_INSTRUMENTS, compute, type PlanItem, type SampledInstrument } from './bank';
import { composePass, type MusicEvent } from './compose';
import { impulseResponse, type HallId } from './hall';
import { beatTime, sectionAt, sectionSeconds, THEMES, type Layer, type MusicContextId, type ThemeDef } from './themes';
import { body, playPhrase, type TimedNote, type VoiceInstrument } from './voices';

export type MusicLevel = Layer;

export interface MusicHost {
  setContext(id: MusicContextId | null): void;
  setAmbience(sceneId: string | null): void;
  setVolume(volume: number): void;
  setLevel(level: MusicLevel): void;
  attenuate(holdUntil: number): void;
  dispose(): void;
  /** Dev listening lab: the current track resumes from a named section at the next pass. */
  seek(section: string): boolean;
  readonly state: { context: MusicContextId | null; ambience: AmbienceId | null; pass: number; samples: number; section: string | null; level: MusicLevel };
}

const LOOKAHEAD = 1.2;
const FADE_OUT = 1.6;
const FADE_IN = 1.2;
/** A fanfare takes the stream quickly, and always ends inside its limit. */
const FANFARE_LEAD_OUT = 0.7;
const FANFARE_MAX = 8;
/** Lowered under a signature cue, and back within a second of its end. */
const ATTENUATION = 10 ** (-5 / 20);
const ATTENUATION_ATTACK = 0.05;
const ATTENUATION_RELEASE = 0.9;
const SAMPLE_LEVEL: Readonly<Record<SampledInstrument, number>> = { harp: 0.5, lute: 0.5, pizz: 0.5, timpani: 0.5, drum: 0.5, kit: 0.42, frame: 0.42, cymbal: 0.3 };
/** A level change rides on the gains, so it costs nothing on the audio clock. */
const LEVEL_TAU = 0.14;
const SAMPLED = new Set<string>(SAMPLED_INSTRUMENTS);
/** Leaves room for the cues: at the default volume, combat sits near -22 LUFS. */
const volumeCurve = (v: number): number => Math.max(0, Math.min(1, v)) ** 1.5 * 0.5;

interface Playing {
  theme: ThemeDef;
  fader: GainNode;
  tone: AudioNode | null;
  send: GainNode;
  layers: Record<Layer, GainNode>;
  bodies: Map<string, { input: AudioNode; output: AudioNode; stop: () => void }>;
  pass: number;
  nextPassAt: number;
  endsAt: number | null;
  /** When a one-shot piece is over; null on a looping track. */
  onceEndsAt: number | null;
}

export function createMusicDirector(ctx: AudioContext, output: AudioNode = ctx.destination): MusicHost {
  return new MusicDirector(ctx, output);
}

class MusicDirector implements MusicHost {
  private readonly master: GainNode;
  private readonly bus: DynamicsCompressorNode;
  private readonly duck: GainNode;
  private readonly ambienceBus: GainNode;
  private readonly bank = new Map<SampledInstrument, { zones: Array<{ root: number; layer: number }>; buffers: AudioBuffer[] }>();
  /** One convolver per room, shared by every theme that uses it; sends wait dry until their room is loaded. */
  private readonly reverbs = new Map<HallId, ConvolverNode>();
  private readonly sends = new Map<HallId, Set<GainNode>>();
  private readonly pendingTasks = new Set<number>();
  private current: Playing | null = null;
  private fading: Playing[] = [];
  /** The surface that asked for its track while a fanfare plays. */
  private held: MusicContextId | null = null;
  private level: MusicLevel = 'reflection';
  private timer: number | null = null;
  private worker: Worker | null = null;
  private fallbackTimer: number | null = null;
  private ambience: { id: AmbienceId; stop: () => void } | null = null;
  private disposed = false;

  constructor(private readonly ctx: AudioContext, output: AudioNode) {
    this.master = ctx.createGain();
    this.master.gain.value = volumeCurve(0.6);
    this.bus = ctx.createDynamicsCompressor();
    this.bus.threshold.value = -14; this.bus.ratio.value = 3; this.bus.attack.value = 0.02; this.bus.release.value = 0.3;
    this.duck = ctx.createGain();
    this.bus.connect(this.duck).connect(this.master);
    this.master.connect(output);
    this.ambienceBus = ctx.createGain();
    this.ambienceBus.gain.value = 2.2;
    this.ambienceBus.connect(this.master);
    this.loadBank();
    this.timer = window.setInterval(() => this.tick(), 50);
  }

  get state(): MusicHost['state'] {
    let samples = 0;
    for (const entry of this.bank.values()) samples += entry.buffers.length;
    const playing = this.current;
    return { context: playing?.theme.id ?? null, ambience: this.ambience?.id ?? null, pass: playing?.pass ?? 0, samples, section: playing ? sectionAt(playing.theme, Math.max(0, playing.pass - 1)).name : null, level: this.level };
  }

  setContext(id: MusicContextId | null): void {
    if (this.disposed) return;
    // A fanfare keeps the stream against any surface; only mute or a new fight takes it.
    if (id && this.current?.theme.once && id !== 'combat' && id !== 'boss') { this.held = id; return; }
    this.held = null;
    if ((this.current?.theme.id ?? null) === id) return;
    const now = this.ctx.currentTime;
    const theme = id ? THEMES[id] : null;
    if (this.current) this.fadeOut(this.current, now, theme?.once ? FANFARE_LEAD_OUT : FADE_OUT);
    this.current = null;
    if (!theme) return;
    const playing = this.mount(theme);
    playing.fader.gain.setValueAtTime(0.0001, now);
    playing.fader.gain.exponentialRampToValueAtTime(theme.gain, now + (theme.once ? 0.08 : FADE_IN));
    playing.nextPassAt = now + 0.15;
    if (theme.once) {
      playing.onceEndsAt = now + Math.min(FANFARE_MAX, sectionSeconds(sectionAt(theme, 0)) + 0.75);
      playing.fader.gain.setValueAtTime(theme.gain, playing.onceEndsAt - 0.5);
      playing.fader.gain.exponentialRampToValueAtTime(0.0001, playing.onceEndsAt);
    }
    this.current = playing;
    // the first pass is planned in its own task, never inside the gesture's task
    this.task(() => this.tick());
  }

  setAmbience(sceneId: string | null): void {
    if (this.disposed) return;
    const id = sceneId ? ambienceForScene(sceneId) : null;
    if ((this.ambience?.id ?? null) === id) return;
    this.ambience?.stop();
    this.ambience = id ? { id, stop: startAmbience(this.ctx, this.ambienceBus, id) } : null;
  }

  setVolume(volume: number): void {
    if (this.disposed) return;
    this.master.gain.setTargetAtTime(volumeCurve(volume), this.ctx.currentTime, 0.05);
  }

  setLevel(level: MusicLevel): void {
    if (this.disposed || level === this.level) return;
    this.level = level;
    const now = this.ctx.currentTime;
    for (const playing of [this.current, ...this.fading]) if (playing) this.applyLevel(playing, now);
  }

  private applyLevel(playing: Playing, now: number): void {
    playing.layers.reflection.gain.setTargetAtTime(this.level === 'reflection' ? 1 : 0, now, LEVEL_TAU);
    playing.layers.action.gain.setTargetAtTime(this.level === 'action' ? 1 : 0, now, LEVEL_TAU);
  }

  seek(name: string): boolean {
    const playing = this.current;
    const at = playing ? playing.theme.form.findIndex((index) => playing.theme.sections[index]!.name === name) : -1;
    if (!playing || at < 0) return false;
    playing.pass = at;
    return true;
  }

  attenuate(holdUntil: number): void {
    if (this.disposed) return;
    const now = this.ctx.currentTime, down = now + ATTENUATION_ATTACK, up = Math.max(down, holdUntil), g = this.duck.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(ATTENUATION, down);
    g.setValueAtTime(ATTENUATION, up);
    g.linearRampToValueAtTime(1, up + ATTENUATION_RELEASE);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.timer !== null) window.clearInterval(this.timer);
    if (this.fallbackTimer !== null) window.clearTimeout(this.fallbackTimer);
    for (const id of this.pendingTasks) window.clearTimeout(id);
    this.pendingTasks.clear();
    this.worker?.terminate();
    this.ambience?.stop();
    this.ambience = null;
    for (const playing of [this.current, ...this.fading]) if (playing) this.unmount(playing);
    this.current = null; this.fading = [];
    for (const reverb of this.reverbs.values()) { try { reverb.disconnect(); } catch { /* gone */ } }
    this.reverbs.clear(); this.sends.clear();
    try { this.master.disconnect(); } catch { /* already gone */ }
  }

  private mount(theme: ThemeDef): Playing {
    const fader = this.ctx.createGain();
    let tone: BiquadFilterNode | null = null;
    if (theme.lowCut) {
      tone = this.ctx.createBiquadFilter();
      tone.type = 'highpass'; tone.frequency.value = theme.lowCut; tone.Q.value = 0.7;
      fader.connect(tone);
    }
    const out = tone ?? fader;
    out.connect(this.bus);
    const send = this.ctx.createGain();
    send.gain.value = theme.send;
    out.connect(send);
    const reverb = this.reverbs.get(theme.hall);
    if (reverb) send.connect(reverb);
    const waiting = this.sends.get(theme.hall) ?? new Set<GainNode>();
    waiting.add(send);
    this.sends.set(theme.hall, waiting);
    const layer = (on: boolean): GainNode => { const g = this.ctx.createGain(); g.gain.value = on ? 1 : 0; g.connect(fader); return g; };
    const layers = { reflection: layer(this.level === 'reflection'), action: layer(this.level === 'action') };
    return { theme, fader, tone, send, layers, bodies: new Map(), pass: 0, nextPassAt: 0, endsAt: null, onceEndsAt: null };
  }

  private unmount(playing: Playing): void {
    this.sends.get(playing.theme.hall)?.delete(playing.send);
    for (const b of playing.bodies.values()) { b.stop(); try { b.output.disconnect(); } catch { /* gone */ } }
    for (const node of [playing.layers.reflection, playing.layers.action, playing.fader, playing.tone, playing.send]) { try { node?.disconnect(); } catch { /* gone */ } }
  }

  private task(fn: () => void): void {
    const id = window.setTimeout(() => { this.pendingTasks.delete(id); if (!this.disposed) fn(); }, 0);
    this.pendingTasks.add(id);
  }

  /** Loading an impulse response into a convolver costs tens of milliseconds: one room per task. */
  private addReverb(hall: HallId, left: Float32Array<ArrayBuffer>, right: Float32Array<ArrayBuffer>): void {
    this.task(() => {
      if (this.reverbs.has(hall)) return;
      const buffer = this.ctx.createBuffer(2, left.length, this.ctx.sampleRate);
      buffer.copyToChannel(left, 0);
      buffer.copyToChannel(right, 1);
      const reverb = this.ctx.createConvolver();
      reverb.buffer = buffer;
      reverb.connect(this.bus);
      this.reverbs.set(hall, reverb);
      for (const send of this.sends.get(hall) ?? []) send.connect(reverb);
    });
  }

  private fadeOut(playing: Playing, now: number, seconds: number): void {
    const g = playing.fader.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.0001, now + seconds);
    playing.endsAt = now + seconds;
    this.fading.push(playing);
  }

  private tick(): void {
    if (this.disposed) return;
    const now = this.ctx.currentTime;
    this.fading = this.fading.filter((p) => {
      if (p.endsAt !== null && now > p.endsAt + 0.3) { this.unmount(p); return false; }
      return true;
    });
    const playing = this.current;
    if (!playing) return;
    if (playing.onceEndsAt !== null) {
      if (playing.pass === 0 && playing.nextPassAt - now < LOOKAHEAD) this.schedulePass(playing);
      if (now < playing.onceEndsAt) return;
      playing.endsAt = now;
      this.fading.push(playing);
      this.current = null;
      const held = this.held;
      this.held = null;
      if (held) this.setContext(held);
      return;
    }
    // a long suspension (hidden page) must not replay the missed passes in a burst
    if (playing.nextPassAt < now - 0.5) playing.nextPassAt = now + 0.15;
    while (playing.nextPassAt - now < LOOKAHEAD) this.schedulePass(playing);
  }

  private schedulePass(playing: Playing): void {
    const { theme } = playing;
    const section = sectionAt(theme, playing.pass);
    const t0 = playing.nextPassAt;
    const events = composePass(theme, playing.pass);
    const at = (beat: number): number => t0 + beatTime(section, Math.max(0, beat));
    const lines = new Map<string, { instrument: VoiceInstrument; layer: Layer | undefined; notes: TimedNote[] }>();
    for (const e of events) {
      if (SAMPLED.has(e.instrument)) this.playSample(playing, e, at(e.beat));
      else {
        const key = `${e.layer ?? ''}/${e.line}`;
        const line = lines.get(key) ?? { instrument: e.instrument as VoiceInstrument, layer: e.layer, notes: [] };
        line.notes.push({ t: at(e.beat), d: at(e.beat + e.beats) - at(e.beat), m: e.m, v: e.v });
        lines.set(key, line);
      }
    }
    for (const { instrument, layer, notes } of lines.values()) {
      const key = `${layer ?? ''}/${instrument}`;
      let b = playing.bodies.get(key);
      if (!b) {
        b = body(this.ctx, instrument);
        b.output.connect(layer ? playing.layers[layer] : playing.fader);
        playing.bodies.set(key, b);
      }
      try { playPhrase(this.ctx, b.input, instrument, notes); } catch { /* one voice never stops the music */ }
    }
    playing.pass++;
    playing.nextPassAt = t0 + sectionSeconds(section);
  }

  private playSample(playing: Playing, e: MusicEvent, t: number): void {
    const instrument = e.instrument as SampledInstrument;
    const entry = this.bank.get(instrument);
    if (!entry) return;
    const choice = choose(entry.zones, instrument, e.m, e.v);
    if (!choice) return;
    const buffer = entry.buffers[choice.zone]!;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = choice.rate;
      const g = this.ctx.createGain();
      g.gain.value = choice.gain * SAMPLE_LEVEL[instrument];
      source.connect(g).connect(e.layer ? playing.layers[e.layer] : playing.fader);
      const start = Math.max(this.ctx.currentTime, t);
      source.start(start);
      source.stop(start + buffer.duration / choice.rate + 0.05);
      source.onended = () => { source.disconnect(); g.disconnect(); };
    } catch { /* a skipped note is silent */ }
  }

  private addSample(item: PlanItem, data: Float32Array<ArrayBuffer>): void {
    if (this.disposed) return;
    const buffer = this.ctx.createBuffer(1, data.length, sampleRateOf(item.instrument, this.ctx.sampleRate));
    buffer.copyToChannel(data, 0);
    const entry = this.bank.get(item.instrument) ?? { zones: [], buffers: [] };
    entry.zones.push({ root: item.root, layer: item.layer });
    entry.buffers.push(buffer);
    this.bank.set(item.instrument, entry);
  }

  /** Rooms and bank are computed off the main thread; without workers, one result per task keeps frames short. */
  private loadBank(): void {
    const items = plan(SAMPLED_INSTRUMENTS);
    const halls: HallId[] = ['hall', 'chapel', 'field'];
    try {
      if (typeof Worker === 'undefined') throw new Error('no worker');
      const worker = new Worker(new URL('./bank.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<{ item?: PlanItem; data?: Float32Array<ArrayBuffer>; hall?: HallId; left?: Float32Array<ArrayBuffer>; right?: Float32Array<ArrayBuffer>; done?: boolean }>) => {
        const m = event.data;
        if (m.done) { worker.terminate(); this.worker = null; return; }
        if (m.hall && m.left && m.right) this.addReverb(m.hall, m.left, m.right);
        else if (m.item && m.data) this.addSample(m.item, m.data);
      };
      worker.onerror = () => { worker.terminate(); this.worker = null; };
      worker.postMessage({ contextRate: this.ctx.sampleRate, halls, items });
      this.worker = worker;
    } catch {
      const jobs: Array<() => void> = [
        ...halls.map((hall) => () => { const [l, r] = impulseResponse(this.ctx.sampleRate, hall); this.addReverb(hall, l, r); }),
        ...items.map((item) => () => this.addSample(item, compute(this.ctx.sampleRate, item))),
      ];
      const next = (i: number) => {
        if (this.disposed || i >= jobs.length) return;
        jobs[i]!();
        this.fallbackTimer = window.setTimeout(() => next(i + 1), 0);
      };
      this.fallbackTimer = window.setTimeout(() => next(0), 0);
    }
  }
}
