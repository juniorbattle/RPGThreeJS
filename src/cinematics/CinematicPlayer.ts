import { CinematicOverlay } from './CinematicOverlay';
import type { CinematicRegistry } from './CinematicRegistry';
import type {
  VideoCinematicPlaybackOptions,
  VideoCinematicResult,
  VideoCinematicResultReason,
} from './CinematicTypes';

interface ActivePlayback {
  id: string;
  abortController: AbortController;
}

export class CinematicPlayer {
  private active: ActivePlayback | null = null;

  constructor(
    private readonly registry: CinematicRegistry,
    private readonly root: HTMLElement = document.body,
  ) {}

  get isPlaying(): boolean {
    return this.active !== null;
  }

  play(id: string, options: VideoCinematicPlaybackOptions = {}): Promise<VideoCinematicResult> {
    if (this.active) return Promise.resolve({ id, reason: 'busy', played: false });
    const descriptor = this.registry.get(id);
    if (!descriptor) return Promise.resolve({ id, reason: 'unavailable', played: false });
    if (options.signal?.aborted) return Promise.resolve({ id, reason: 'aborted', played: false });
    const reducedMotion = options.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion) return Promise.resolve({ id, reason: 'reduced-motion', played: false });

    const abortController = new AbortController();
    this.active = { id, abortController };
    return new Promise<VideoCinematicResult>((resolve) => {
      let settled = false;
      let timeout: number | null = null;
      let stallTimeout: number | null = null;
      const muted = options.muted ?? true;
      const mediaListeners = new AbortController();
      const finish = (reason: VideoCinematicResultReason, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timeout !== null) window.clearTimeout(timeout);
        if (stallTimeout !== null) window.clearTimeout(stallTimeout);
        window.removeEventListener('keydown', onKeyDown);
        options.signal?.removeEventListener('abort', onExternalAbort);
        abortController.signal.removeEventListener('abort', onInternalAbort);
        mediaListeners.abort();
        overlay.dispose();
        if (this.active?.abortController === abortController) this.active = null;
        resolve({ id, reason, played: reason === 'ended' || reason === 'skipped', ...(error === undefined ? {} : { error }) });
      };
      const onSkip = () => finish(descriptor.placeholderOnly ? 'placeholder' : 'skipped');
      const onToggleMuted = () => {
        overlay.setMuted(!overlay.video.muted);
        if (!overlay.video.muted) void Promise.resolve(overlay.video.play()).catch(() => overlay.setMuted(true));
      };
      const overlay = new CinematicOverlay(descriptor, { onSkip, onToggleMuted }, options.allowSkip ?? true, this.root);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && (options.allowSkip ?? true)) onSkip();
      };
      const onExternalAbort = () => abortController.abort();
      const onInternalAbort = () => finish('aborted');
      const resetStallTimeout = () => {
        if (stallTimeout !== null) window.clearTimeout(stallTimeout);
        stallTimeout = window.setTimeout(() => finish('timeout'), options.stallTimeoutMs ?? 4_000);
      };

      overlay.mount(muted);
      window.addEventListener('keydown', onKeyDown);
      options.signal?.addEventListener('abort', onExternalAbort, { once: true });
      abortController.signal.addEventListener('abort', onInternalAbort, { once: true });
      timeout = window.setTimeout(() => finish('timeout'), options.timeoutMs ?? Math.max(12_000, descriptor.durationMs ?? 0));

      if (descriptor.placeholderOnly) {
        overlay.showFallback();
        if (timeout !== null) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => finish('placeholder'), options.placeholderDurationMs ?? 1_200);
        return;
      }

      const playableSources = descriptor.sources.filter((source) => overlay.video.canPlayType(source.type) !== '');
      if (!playableSources.length) {
        overlay.showFallback();
        finish('unavailable');
        return;
      }
      for (const mediaSource of playableSources) {
        const source = document.createElement('source');
        source.src = mediaSource.src;
        source.type = mediaSource.type;
        overlay.video.append(source);
      }
      if (descriptor.captions) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.src = descriptor.captions;
        track.default = true;
        overlay.video.append(track);
      }
      overlay.video.addEventListener('ended', () => finish('ended'), { once: true, signal: mediaListeners.signal });
      overlay.video.addEventListener('error', (event) => finish('error', event), { once: true, signal: mediaListeners.signal });
      overlay.video.addEventListener('stalled', resetStallTimeout, { signal: mediaListeners.signal });
      overlay.video.addEventListener('waiting', resetStallTimeout, { signal: mediaListeners.signal });
      overlay.video.addEventListener('playing', () => {
        if (stallTimeout !== null) window.clearTimeout(stallTimeout);
        stallTimeout = null;
      }, { signal: mediaListeners.signal });
      try {
        overlay.video.load();
        void Promise.resolve(overlay.video.play()).catch((error) => {
          overlay.showFallback();
          finish('autoplay-rejected', error);
        });
      } catch (error) {
        overlay.showFallback();
        finish('error', error);
      }
    });
  }

  abort(): void {
    this.active?.abortController.abort();
  }

  dispose(): void {
    this.abort();
  }
}
