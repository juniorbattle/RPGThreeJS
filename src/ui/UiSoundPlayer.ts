import { COMBAT_SOUND_IDS, UI_SOUND_IDS, isCombatSound, soundPriority, type GameSoundId, type TacticalSoundId, type UiSoundId } from './GameSoundCatalog';
export { UI_SOUND_IDS } from './GameSoundCatalog';
export type { UiSoundId } from './GameSoundCatalog';
export type UiSoundFeedback = (id: UiSoundId) => void;
const PREFERENCE_KEY = 'rpg-threejs:ui-audio:v1';

/** Optional parent-owned presentation. No gameplay state, resolution or delayed cue queue. */
export class UiSoundPlayer {
  enabled = false;
  volume = 0.5;
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
    if (event.isTrusted && this.enabled) void this.unlock();
  };
  private readonly visibility = () => {
    if (!document.hidden) return;
    this.stop();
    void this.context?.suspend().catch(() => {});
  };

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCE_KEY) ?? 'null');
      this.enabled = saved?.enabled === true;
      if (typeof saved?.volume === 'number' && Number.isFinite(saved.volume)) this.volume = Math.max(0, Math.min(1, saved.volume));
    } catch { /* Preferences are optional; silence remains playable. */ }
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

  private async unlock(): Promise<void> {
    if (this.disposed || !this.enabled || document.hidden) return;
    try {
      if (!this.context) {
        if (!window.AudioContext) return;
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.gain.value = this.volume;
        this.gain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.warming) this.warming = this.warm();
      if (this.combatScope && !this.combatWarming) this.combatWarming = this.warm(COMBAT_SOUND_IDS);
      await this.warming;
    } catch { /* Unsupported/blocked audio is silent, with no gameplay dependency. */ }
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
    void this.context?.close().catch(() => {});
  }
}
