import { createMix, type MixChain } from '../audio/mix';
import { COMBAT_SOUND_IDS, UI_SOUND_IDS, isCombatSound, soundPriority, type CombatSoundId, type GameSoundId, type TacticalSoundId, type UiSoundId } from './GameSoundCatalog';
export { UI_SOUND_IDS } from './GameSoundCatalog';
export type { UiSoundId } from './GameSoundCatalog';
export type UiSoundFeedback = (id: UiSoundId) => void;
/** `enabled` is written only by the effects control: its absence means the default. */
const PREFERENCE_KEY = 'rpg-threejs:ui-audio:v2';
/** Written under the former default-off, where a volume change stored `enabled: false`: only its volume is a choice. */
const FORMER_PREFERENCE_KEY = 'rpg-threejs:ui-audio:v1';
const MUSIC_PREFERENCE_KEY = 'rpg-threejs:music:v1';
const LEVEL_WINDOW_MS = 500;
const LEVEL_RETURN_MS = 15_000;

/** Music contexts (OD-2026-11-01-B); the engine itself loads lazily on the first real gesture. */
export type MusicContextId = 'title' | 'map' | 'refuge' | 'tension' | 'drama' | 'combat' | 'boss' | 'victory' | 'defeat';
export type MusicLevel = 'reflection' | 'action';
export type CombatOutcome = 'victory' | 'defeat';
export interface MusicHost {
  setContext(id: MusicContextId | null): void;
  setAmbience(sceneId: string | null): void;
  setVolume(volume: number): void;
  setLevel(level: MusicLevel): void;
  /** Lowers the music until `holdUntil` on the audio clock, then lets it back within a second. */
  attenuate(holdUntil: number): void;
  dispose(): void;
}
export type MusicFactory = (context: AudioContext, output: AudioNode) => MusicHost | Promise<MusicHost>;
const loadMusic: MusicFactory = async (context, output) => (await import('../audio/music/MusicDirector')).createMusicDirector(context, output);
const isFanfare = (id: MusicContextId | null): boolean => id === 'victory' || id === 'defeat';

/** Source of a combat family (OD-2026-10-29-B): the accepted file candidate, or its synthesized alternative. */
export type CombatSoundSource = 'file' | 'synth';
const SOURCE_PREFERENCE_KEY = 'rpg-threejs:combat-fx-source:v1';
export type SynthRenderer = (id: CombatSoundId, sampleRate: number) => Promise<AudioBuffer | null>;
const loadSynth: SynthRenderer = async (id, sampleRate) => (await import('../audio/synthCues')).renderSynthCue(id, sampleRate);

/**
 * Optional parent-owned presentation: the single audio owner for cues, music and ambience. No gameplay state,
 * resolution or delayed cue queue. Effects and music default on but are only armed until a real gesture.
 */
export class UiSoundPlayer {
  enabled = true;
  volume = 0.5;
  musicEnabled = true;
  musicVolume = 0.6;
  private music: MusicHost | null = null;
  private musicLoading: Promise<void> | null = null;
  private musicContext: MusicContextId | null = null;
  private musicScene: string | null = null;
  private level: MusicLevel = 'reflection';
  private levelPending: MusicLevel | null = null;
  private levelOpensAt = 0;
  private levelTimer: number | null = null;
  private levelReturn: number | null = null;
  private outcomeScope: string | null = null;
  /** Only the effects control sets this; a volume change persists the choice as it stands, or none. */
  private effectsChoice: boolean | null = null;
  private readonly musicFactory: MusicFactory | null;
  private readonly synthRenderer: SynthRenderer | null;
  private readonly synthSources = new Set<CombatSoundId>();
  private readonly synthBuffers = new Map<CombatSoundId, AudioBuffer>();
  private readonly synthPending = new Set<CombatSoundId>();
  private synthChain: Promise<void> = Promise.resolve();
  private comparisonWarming: Promise<void> | null = null;
  private context: AudioContext | null = null;
  private mix: MixChain | null = null;
  private gain: GainNode | null = null;
  private readonly buffers = new Map<GameSoundId, AudioBuffer>();
  private readonly voices = new Map<AudioBufferSourceNode, { id: GameSoundId; scope?: string }>();
  private combatScope: string | null = null;
  private readonly combatEvents = new Set<string>();
  private readonly combatCadence = new Map<GameSoundId, number>();
  private combatWarming: Promise<void> | null = null;
  private readonly abort = new AbortController();
  private warming: Promise<void> | null = null;
  private disposed = false;
  private lastPlayedAt = -Infinity;
  private readonly gesture = (event: Event) => {
    if (event.isTrusted && (this.enabled || this.musicActive)) void this.unlock();
  };
  private readonly visibility = () => {
    if (!document.hidden) {
      // Returning resumes an already unlocked context for music only; no cue is replayed.
      if (this.music && this.musicActive && this.context?.state === 'suspended') void this.context.resume().catch(() => {});
      return;
    }
    this.stop();
    this.requestLevel('reflection');
    void this.context?.suspend().catch(() => {});
  };

  constructor(options: { music?: MusicFactory | null; synth?: SynthRenderer | null } = {}) {
    this.musicFactory = options.music === undefined ? loadMusic : options.music;
    this.synthRenderer = options.synth === undefined ? loadSynth : options.synth;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(SOURCE_PREFERENCE_KEY) ?? 'null');
      if (Array.isArray(saved)) for (const id of saved) if ((COMBAT_SOUND_IDS as readonly unknown[]).includes(id)) this.synthSources.add(id as CombatSoundId);
    } catch { /* Without a stored choice every family plays its file candidate. */ }
    try {
      const current = localStorage.getItem(PREFERENCE_KEY);
      const saved = JSON.parse(current ?? localStorage.getItem(FORMER_PREFERENCE_KEY) ?? 'null');
      if (current && typeof saved?.enabled === 'boolean') { this.effectsChoice = saved.enabled; this.enabled = saved.enabled; }
      if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume)) this.volume = Math.max(0, Math.min(1, saved.volume));
    } catch { /* Preferences are optional; the default stays armed and silent. */ }
    try {
      const saved = JSON.parse(localStorage.getItem(MUSIC_PREFERENCE_KEY) ?? 'null');
      if (typeof saved?.enabled === 'boolean') this.musicEnabled = saved.enabled;
      if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume)) this.musicVolume = Math.max(0, Math.min(1, saved.volume));
    } catch { /* A restored preference only arms music; it never starts audio. */ }
    window.addEventListener('pointerdown', this.gesture, true);
    window.addEventListener('keydown', this.gesture, true);
    document.addEventListener('visibilitychange', this.visibility);
  }

  /** The caller owns this same-origin document's lifecycle; synthetic events never unlock. */
  observeGestures(owner: Document): () => void {
    owner.addEventListener('pointerdown', this.gesture, true);
    owner.addEventListener('keydown', this.gesture, true);
    return () => {
      owner.removeEventListener('pointerdown', this.gesture, true);
      owner.removeEventListener('keydown', this.gesture, true);
    };
  }

  beginCombat(scope: string): void {
    if (this.combatScope) this.endCombat(this.combatScope);
    this.stop(); this.combatScope = scope;
    // Decoding may begin for an already unlocked context, but never creates/resumes one.
    if (this.context && !this.combatWarming) this.combatWarming = this.warm(COMBAT_SOUND_IDS);
    if (this.context && this.enabled) this.renderSynth([...this.synthSources]);
  }

  combatSource(id: CombatSoundId): CombatSoundSource {
    return this.synthSources.has(id) ? 'synth' : 'file';
  }

  /** The operator's listening choice; changing it never plays a cue by itself. */
  setCombatSource(id: CombatSoundId, source: CombatSoundSource): void {
    if (this.disposed || !(COMBAT_SOUND_IDS as readonly string[]).includes(id)) return;
    if (source === 'synth') this.synthSources.add(id); else this.synthSources.delete(id);
    try { localStorage.setItem(SOURCE_PREFERENCE_KEY, JSON.stringify([...this.synthSources])); }
    catch { /* A denied preference write never blocks the action. */ }
    if (source === 'synth' && this.context && this.enabled) this.renderSynth([id]);
  }

  /** Comparison workshop: decodes every file and renders every synthesized family; needs effects on and unlocked audio. */
  prepareCombatComparison(): Promise<boolean> {
    if (this.disposed || !this.enabled || this.context?.state !== 'running') return Promise.resolve(false);
    this.comparisonWarming ??= this.combatWarming ?? (this.combatWarming = this.warm(COMBAT_SOUND_IDS));
    this.renderSynth(COMBAT_SOUND_IDS);
    return Promise.all([this.comparisonWarming, this.synthChain]).then(() => true, () => false);
  }

  comparisonReady(id: CombatSoundId, source: CombatSoundSource): boolean {
    return source === 'synth' ? this.synthBuffers.has(id) : this.buffers.has(id);
  }

  /** Plays one family from one source, on an explicit click in the comparison workshop. */
  preview(id: CombatSoundId, source: CombatSoundSource): void {
    this.playSound(id, undefined, source);
  }

  private renderSynth(ids: readonly CombatSoundId[]): void {
    const renderer = this.synthRenderer, context = this.context;
    if (!renderer || !context) return;
    for (const id of ids) {
      if (this.synthBuffers.has(id) || this.synthPending.has(id)) continue;
      this.synthPending.add(id);
      // one offline render at a time; a failed render leaves the file candidate in place
      this.synthChain = this.synthChain.then(async () => {
        try {
          const buffer = await renderer(id, context.sampleRate);
          if (!this.disposed && buffer && buffer.duration > 0 && buffer.duration <= 1.001) this.synthBuffers.set(id, buffer);
        } catch { /* silent */ }
        this.synthPending.delete(id);
      });
    }
  }

  /** Closing a session stops its cues and returns the level; a fanfare on the music stream plays on. */
  endCombat(scope: string): void {
    if (scope !== this.combatScope) return;
    this.stop(); this.combatScope = null; this.combatEvents.clear(); this.combatCadence.clear();
    this.requestLevel('reflection');
  }

  /** One-way level of the combat track. It answers nothing, delays nothing and cannot start audio. */
  setMusicLevel(scope: string, level: MusicLevel): void {
    if (scope === this.combatScope) this.requestLevel(level);
  }

  private requestLevel(level: MusicLevel): void {
    if (this.disposed || level === (this.levelPending ?? this.level)) return;
    if (this.levelReturn !== null) { window.clearTimeout(this.levelReturn); this.levelReturn = null; }
    if (level === 'action') this.levelReturn = window.setTimeout(() => { this.levelReturn = null; this.requestLevel('reflection'); }, LEVEL_RETURN_MS);
    const now = performance.now();
    if (now >= this.levelOpensAt) { this.applyLevel(level); return; }
    // Inside the window the latest one wins, and it applies when the window ends.
    this.levelPending = level;
    this.levelTimer ??= window.setTimeout(() => {
      this.levelTimer = null;
      const pending = this.levelPending;
      this.levelPending = null;
      if (pending && pending !== this.level) this.applyLevel(pending);
    }, this.levelOpensAt - now);
  }

  private applyLevel(level: MusicLevel): void {
    this.level = level;
    this.levelOpensAt = performance.now() + LEVEL_WINDOW_MS;
    if (this.musicActive) this.music?.setLevel(level);
  }

  /** The end of an encounter, once per session; music reads nothing else of the result. */
  playMusicOutcome(scope: string, outcome: CombatOutcome): void {
    if (scope !== this.combatScope || scope === this.outcomeScope) return;
    this.outcomeScope = scope;
    this.setMusicContext(outcome);
  }

  playCombat(id: TacticalSoundId, scope: string, eventId: string): void {
    if (scope !== this.combatScope || this.combatEvents.has(eventId)) return;
    this.combatEvents.add(eventId);
    if (this.combatEvents.size > 512) this.combatEvents.delete(this.combatEvents.values().next().value!);
    this.playSound(id, scope);
  }

  setEnabled(enabled: boolean, event: Event): void {
    if (!event.isTrusted || this.disposed) return;
    this.enabled = enabled;
    this.effectsChoice = enabled;
    this.persist();
    if (enabled) void this.unlock();
    else this.stop();
  }

  setVolume(value: number): void {
    if (!Number.isFinite(value) || this.disposed) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gain) this.gain.gain.value = this.volume;
    if (this.volume === 0) this.stop();
    this.persist();
  }

  private persist(): void {
    try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify(this.effectsChoice === null ? { volume: this.volume } : { enabled: this.effectsChoice, volume: this.volume })); }
    catch { /* A denied preference write never blocks the action. */ }
  }

  private persistMusic(): void {
    try { localStorage.setItem(MUSIC_PREFERENCE_KEY, JSON.stringify({ enabled: this.musicEnabled, volume: this.musicVolume })); }
    catch { /* A denied preference write never blocks the action. */ }
  }

  private get musicActive(): boolean {
    return this.musicEnabled && this.musicVolume > 0 && this.musicFactory !== null;
  }

  /** Read-only snapshot for tests and dev QA; never part of game state. */
  musicSnapshot(): { context: MusicContextId | null; scene: string | null; active: boolean; unlocked: boolean; host: unknown } {
    return { context: this.musicContext, scene: this.musicScene, active: this.musicActive, unlocked: this.context?.state === 'running', host: (this.music as { state?: unknown } | null)?.state ?? null };
  }

  /** The presentation context selects the track; audio still waits for a real gesture. */
  setMusicContext(id: MusicContextId | null): void {
    this.musicContext = id;
    if (this.musicActive) this.music?.setContext(id);
  }

  /** Combat scene for the biome ambience (null outside combat). */
  setMusicScene(sceneId: string | null): void {
    this.musicScene = sceneId;
    if (this.musicActive) this.music?.setAmbience(sceneId);
  }

  /** Un-muting is itself a real gesture: it unlocks audio and resumes the current context. */
  setMusicEnabled(enabled: boolean, event: Event): void {
    if (!event.isTrusted || this.disposed) return;
    this.musicEnabled = enabled;
    this.persistMusic();
    if (this.musicActive) { void this.unlock(); this.resumeMusic(); }
    else { this.music?.setContext(null); this.music?.setAmbience(null); }
  }

  /** A fanfare is an event, not a place: resuming never replays it. */
  private resumeMusic(): void {
    if (!isFanfare(this.musicContext)) this.music?.setContext(this.musicContext);
    this.music?.setLevel(this.level);
    this.music?.setAmbience(this.musicScene);
  }

  setMusicVolume(value: number): void {
    if (!Number.isFinite(value) || this.disposed) return;
    const wasActive = this.musicActive;
    this.musicVolume = Math.max(0, Math.min(1, value));
    this.music?.setVolume(this.musicVolume);
    if (!this.musicActive) { this.music?.setContext(null); this.music?.setAmbience(null); }
    else if (!wasActive) this.resumeMusic();
    this.persistMusic();
  }

  private async unlock(): Promise<void> {
    if (this.disposed || (!this.enabled && !this.musicActive) || document.hidden) return;
    try {
      if (!this.context) {
        if (!window.AudioContext) return;
        this.context = new AudioContext();
        this.mix = createMix(this.context);
        this.gain = this.context.createGain();
        this.gain.gain.value = this.volume;
        this.gain.connect(this.mix.input);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.musicActive) void this.startMusic();
      if (!this.enabled) return;
      if (!this.warming) this.warming = this.warm();
      if (this.combatScope && !this.combatWarming) this.combatWarming = this.warm(COMBAT_SOUND_IDS);
      if (this.synthSources.size) this.renderSynth([...this.synthSources]);
      await this.warming;
    } catch { /* Unsupported/blocked audio is silent, with no gameplay dependency. */ }
  }

  private startMusic(): Promise<void> {
    if (this.music || !this.context || !this.mix || !this.musicFactory) return Promise.resolve();
    const context = this.context, output = this.mix.input;
    this.musicLoading ??= (async () => {
      try {
        const host = await this.musicFactory!(context, output);
        if (this.disposed) { host.dispose(); return; }
        this.music = host;
        host.setVolume(this.musicVolume);
        if (this.musicActive) { host.setContext(this.musicContext); host.setLevel(this.level); host.setAmbience(this.musicScene); }
      } catch { this.musicLoading = null; /* Music is optional and fails silently. */ }
    })();
    return this.musicLoading;
  }

  private async warm(ids: readonly GameSoundId[] = UI_SOUND_IDS): Promise<void> {
    await Promise.all(ids.map(async id => {
      try {
        const response = await fetch(`/assets/audio/${isCombatSound(id) ? 'combat-fx-v1' : 'ui-fx-v1'}/${id}.wav`, { signal: this.abort.signal });
        if (!response.ok) return;
        const buffer = await this.context!.decodeAudioData(await response.arrayBuffer());
        if (!this.disposed && buffer.duration > 0 && buffer.duration <= (isCombatSound(id) ? 1 : 0.6)) this.buffers.set(id, buffer);
      } catch { /* No retry/polling, delayed cue or blocking fallback. */ }
    }));
  }

  play(id: UiSoundId): void {
    this.playSound(id);
  }

  private playSound(id: GameSoundId, scope?: string, source?: CombatSoundSource): void {
    if (this.disposed || !this.enabled || this.volume === 0 || document.hidden || this.context?.state !== 'running') return;
    const now = performance.now();
    // A synthesized family that is not rendered yet falls back to its file; an explicit preview never does.
    const wanted = source ?? (isCombatSound(id) && this.synthSources.has(id) ? 'synth' : 'file');
    const buffer = wanted === 'synth' && isCombatSound(id) ? this.synthBuffers.get(id) ?? (source ? undefined : this.buffers.get(id)) : this.buffers.get(id);
    if (!buffer) return;
    if (scope) {
      if (now - (this.combatCadence.get(id) ?? -Infinity) < (id === 'step' ? 120 : 45)) return;
    } else if (now - this.lastPlayedAt < 50) return;
    try {
      const ui = !isCombatSound(id), uiVoices = [...this.voices].filter(([, voice]) => !isCombatSound(voice.id));
      const candidates = ui && uiVoices.length >= 2 ? uiVoices : [...this.voices];
      if (candidates.length && (this.voices.size >= (this.combatScope ? 4 : 2) || ui && uiVoices.length >= 2)) {
        const [oldest, voice] = candidates.reduce((lowest, candidate) => soundPriority(candidate[1].id) < soundPriority(lowest[1].id) ? candidate : lowest);
        if (this.combatScope && soundPriority(voice.id) > soundPriority(id)) return;
        oldest.stop(); oldest.disconnect(); this.voices.delete(oldest);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      // Candidate PCM peaks <=0.2; 4 voices *1.1*0.2 <=0.88 before master volume.
      const voiceGain = this.combatScope ? this.context!.createGain() : null;
      if (voiceGain) { voiceGain.gain.value = 1.1; voiceGain.connect(this.gain!); }
      source.connect(voiceGain ?? this.gain!);
      source.onended = () => { this.voices.delete(source); source.disconnect(); voiceGain?.disconnect(); };
      this.voices.set(source, { id, scope });
      this.lastPlayedAt = now;
      if (scope) this.combatCadence.set(id, now);
      source.start();
    } catch { /* No sound failure may escape into an owner callback. */ }
  }

  stop(): void {
    for (const voice of this.voices.keys()) { try { voice.stop(); voice.disconnect(); } catch { /* already ended */ } }
    this.voices.clear();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('pointerdown', this.gesture, true);
    window.removeEventListener('keydown', this.gesture, true);
    document.removeEventListener('visibilitychange', this.visibility);
    this.abort.abort(); this.stop(); this.buffers.clear(); this.synthBuffers.clear();
    if (this.levelTimer !== null) window.clearTimeout(this.levelTimer);
    if (this.levelReturn !== null) window.clearTimeout(this.levelReturn);
    try { this.music?.dispose(); } catch { /* already gone */ }
    this.music = null;
    this.mix?.dispose();
    void this.context?.close().catch(() => {});
  }
}
