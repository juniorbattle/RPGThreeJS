export const UI_SOUND_IDS = ['navigate', 'confirm', 'back', 'refused', 'saved', 'reward', 'recover', 'travel-start'] as const;
export type UiSoundId = typeof UI_SOUND_IDS[number];
export type UiSoundFeedback = (id: UiSoundId) => void;
const PREFERENCE_KEY = 'rpg-threejs:ui-audio:v1';

/** Optional presentation. No gameplay state, save repository, delayed cue queue or combat bridge. */
export class UiSoundPlayer {
  enabled = false;
  volume = 0.5;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private readonly buffers = new Map<UiSoundId, AudioBuffer>();
  private readonly voices = new Set<AudioBufferSourceNode>();
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
      await this.warming;
    } catch { /* Unsupported/blocked audio is silent, with no gameplay dependency. */ }
  }

  private async warm(): Promise<void> {
    await Promise.all(UI_SOUND_IDS.map(async id => {
      try {
        const response = await fetch(`/assets/audio/ui-fx-v1/${id}.wav`, { signal: this.abort.signal });
        if (!response.ok) return;
        const buffer = await this.context!.decodeAudioData(await response.arrayBuffer());
        if (!this.disposed && buffer.duration > 0 && buffer.duration <= 0.6) this.buffers.set(id, buffer);
      } catch { /* No retry/polling, delayed cue or blocking fallback. */ }
    }));
  }

  play(id: UiSoundId): void {
    if (this.disposed || !this.enabled || this.volume === 0 || document.hidden || this.context?.state !== 'running') return;
    const buffer = this.buffers.get(id), now = performance.now();
    if (!buffer || now - this.lastPlayedAt < 50) return;
    try {
      if (this.voices.size >= 2) {
        const oldest = this.voices.values().next().value!;
        oldest.stop(); oldest.disconnect(); this.voices.delete(oldest);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gain!);
      source.onended = () => { this.voices.delete(source); source.disconnect(); };
      this.voices.add(source);
      this.lastPlayedAt = now;
      source.start();
    } catch { /* No sound failure may escape into an owner callback. */ }
  }

  stop(): void {
    for (const voice of this.voices) { try { voice.stop(); voice.disconnect(); } catch { /* already ended */ } }
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
