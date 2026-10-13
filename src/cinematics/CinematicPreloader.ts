import type { CinematicRegistry } from './CinematicRegistry';

export type CinematicPreloadStatus = 'preloading' | 'ready' | 'skipped' | 'failed';

export interface CinematicPreloaderOptions {
  /** Hard cap on retained media elements, so a Journey never preloads the whole campaign. */
  maxEntries?: number;
  createVideoElement?: () => HTMLVideoElement;
}

interface PreloadEntry {
  status: CinematicPreloadStatus;
  video: HTMLVideoElement | null;
  listeners: AbortController | null;
}

const DEFAULT_MAX_ENTRIES = 3;

/**
 * Prepares candidate next clips from local shipped media only.
 *
 * It never starts playback, never touches gameplay and never throws: an unknown ID, a
 * placeholder-only descriptor, an unsupported codec or a media error all resolve to a recorded
 * non-fatal status. Repeated requests for the same ID are deduplicated, and every retained element
 * is released on `release`/`clear`.
 */
export class CinematicPreloader {
  private readonly entries = new Map<string, PreloadEntry>();
  private readonly maxEntries: number;
  private readonly createVideoElement: () => HTMLVideoElement;

  constructor(
    private readonly registry: CinematicRegistry,
    options: CinematicPreloaderOptions = {},
  ) {
    this.maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
    this.createVideoElement = options.createVideoElement ?? (() => document.createElement('video'));
  }

  /** Tracked IDs, including the ones that resolved to a non-fatal skip. */
  get size(): number {
    return this.entries.size;
  }

  /** Retained media elements. Bounded by `maxEntries`. */
  get retainedCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) if (entry.video) count += 1;
    return count;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  statusOf(id: string): CinematicPreloadStatus | undefined {
    return this.entries.get(id)?.status;
  }

  preload(ids: readonly string[]): void {
    for (const id of ids) this.preloadOne(id);
    this.enforceBound();
  }

  release(ids: readonly string[]): void {
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (!entry) continue;
      this.disposeEntry(entry);
      this.entries.delete(id);
    }
  }

  clear(): void {
    for (const entry of this.entries.values()) this.disposeEntry(entry);
    this.entries.clear();
  }

  private preloadOne(id: string): void {
    if (!id || this.entries.has(id)) return;
    const descriptor = this.registry.get(id);
    if (!descriptor || descriptor.placeholderOnly) {
      this.entries.set(id, { status: 'skipped', video: null, listeners: null });
      return;
    }
    const video = this.createVideoElement();
    const playable = descriptor.sources.filter((source) => video.canPlayType(source.type) !== '');
    if (!playable.length) {
      this.entries.set(id, { status: 'skipped', video: null, listeners: null });
      return;
    }
    const entry: PreloadEntry = { status: 'preloading', video, listeners: new AbortController() };
    this.entries.set(id, entry);
    video.autoplay = false;
    video.muted = true;
    video.preload = 'auto';
    for (const source of playable) {
      const element = document.createElement('source');
      element.src = source.src;
      element.type = source.type;
      video.append(element);
    }
    video.addEventListener('loadeddata', () => { entry.status = 'ready'; }, { signal: entry.listeners?.signal });
    video.addEventListener('canplaythrough', () => { entry.status = 'ready'; }, { signal: entry.listeners?.signal });
    video.addEventListener('error', () => {
      entry.status = 'failed';
      this.disposeEntry(entry);
    }, { once: true, signal: entry.listeners?.signal });
    try {
      video.load();
    } catch {
      entry.status = 'failed';
      this.disposeEntry(entry);
    }
  }

  private enforceBound(): void {
    for (const [id, entry] of this.entries) {
      if (this.retainedCount <= this.maxEntries) return;
      if (!entry.video) continue;
      this.disposeEntry(entry);
      this.entries.delete(id);
    }
  }

  private disposeEntry(entry: PreloadEntry): void {
    entry.listeners?.abort();
    entry.listeners = null;
    const video = entry.video;
    if (!video) return;
    entry.video = null;
    video.pause();
    video.removeAttribute('src');
    video.replaceChildren();
    try { video.load(); } catch {}
    video.remove();
  }
}
