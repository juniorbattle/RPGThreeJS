import { COMBAT_SOUND_IDS, UI_SOUND_IDS, isCombatSound, soundPriority, type GameSoundId, type TacticalSoundId, type UiSoundId } from './GameSoundCatalog';
export { UI_SOUND_IDS } from './GameSoundCatalog';
export type { UiSoundId } from './GameSoundCatalog';
export type UiSoundFeedback = (id: UiSoundId) => void;
const PREFERENCE_KEY = 'rpg-threejs:ui-audio:v1';
const MUSIC_PREFERENCE_KEY = 'rpg-threejs:music:v1';

/** Music contexts (OD-2026-10-29-B); the engine itself loads lazily on the first real gesture. */
export type MusicContextId = 'title' | 'map' | 'dialogue' | 'combat' | 'boss';
export interface MusicHost {
  setContext(id: MusicContextId | null): void;
  setAmbience(sceneId: string | null): void;
  setVolume(volume: number): void;
  dispose(): void;
}
export type MusicFactory = (context: AudioContext) => MusicHost | Promise<MusicHost>;
const loadMusic: MusicFactory = async context => (await import('../audio/music/MusicDirector')).createMusicDirector(context);

/**
 * Optional parent-owned presentation: the single audio owner for cues, music and ambience. No gameplay state,
 * resolution or delayed cue queue. Effects default off; music defaults on but is only armed until a real gesture.
 */
export class UiSoundPlayer {
  enabled = false;
  volume = 0.5;
  musicEnabled = true;
  musicVolume = 0.6;
  private music: MusicHost | null = null;
  private musicLoading: Promise<void> | null = null;
  private musicContext: MusicContextId | null = null;
  private musicScene: string | null = null;
  private readonly musicFactory: MusicFactory | null;
  private context: AudioContext | null = null;
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
    void this.context?.suspend().catch(() => {});
  };

  constructor(options: { music?: MusicFactory | null } = {}) {
    this.musicFactory = options.music === undefined ? loadMusic : options.music;
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCE_KEY) ?? 'null');
      this.enabled = saved?.enabled === true;
      if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume)) this.volume = Math.max(0, Math.min(1, saved.volume));
    } catch { /* Preferences are optional; silence remains playable. */ }
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
  }

  endCombat(scope: string): void {
    if (scope !== this.combatScope) return;
    this.stop(); this.combatScope = null; this.combatEvents.clear(); this.combatCadence.clear();
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
    try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ enabled: this.enabled, volume: this.volume })); }
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
    if (this.musicActive) { void this.unlock(); this.music?.setContext(this.musicContext); this.music?.setAmbience(this.musicScene); }
    else { this.music?.setContext(null); this.music?.setAmbience(null); }
  }

  setMusicVolume(value: number): void {
    if (!Number.isFinite(value) || this.disposed) return;
    const wasActive = this.musicActive;
    this.musicVolume = Math.max(0, Math.min(1, value));
    this.music?.setVolume(this.musicVolume);
    if (!this.musicActive) { this.music?.setContext(null); this.music?.setAmbience(null); }
    else if (!wasActive) { this.music?.setContext(this.musicContext); this.music?.setAmbience(this.musicScene); }
    this.persistMusic();
  }

  private async unlock(): Promise<void> {
    if (this.disposed || (!this.enabled && !this.musicActive) || document.hidden) return;
    try {
      if (!this.context) {
        if (!window.AudioContext) return;
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = this.volume;
        this.gain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.musicActive) void this.startMusic();
      if (!this.enabled) return;
      if (!this.warming) this.warming = this.warm();
      if (this.combatScope && !this.combatWarming) this.combatWarming = this.warm(COMBAT_SOUND_IDS);
      await this.warming;
    } catch { /* Unsupported/blocked audio is silent, with no gameplay dependency. */ }
  }

  private startMusic(): Promise<void> {
    if (this.music || !this.context || !this.musicFactory) return Promise.resolve();
    const context = this.context;
    this.musicLoading ??= (async () => {
      try {
        const host = await this.musicFactory!(context);
        if (this.disposed) { host.dispose(); return; }
        this.music = host;
        host.setVolume(this.musicVolume);
        if (this.musicActive) { host.setContext(this.musicContext); host.setAmbience(this.musicScene); }
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

  private playSound(id: GameSoundId, scope?: string): void {
    if (this.disposed || !this.enabled || this.volume === 0 || document.hidden || this.context?.state !== 'running') return;
    const buffer = this.buffers.get(id), now = performance.now();
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
      // Candidate PCM peaks <=0.2; 4 voices *0.55*0.2 <=0.44 before master volume.
      const voiceGain = this.combatScope ? this.context!.createGain() : null;
      if (voiceGain) { voiceGain.gain.value = 0.55; voiceGain.connect(this.gain!); }
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
    this.abort.abort(); this.stop(); this.buffers.clear();
    try { this.music?.dispose(); } catch { /* already gone */ }
    this.music = null;
    void this.context?.close().catch(() => {});
  }
}
