import { CinematicOverlay } from './CinematicOverlay';
import type { CinematicRegistry } from './CinematicRegistry';
import type {
  HeldVideoCinematic,
  VideoCinematicPlaybackOptions,
  VideoCinematicResult,
  VideoCinematicResultReason,
} from './CinematicTypes';

interface ActivePlayback {
  id: string;
  abortController: AbortController;
}

function settledWithoutSurface(id: string, reason: VideoCinematicResultReason): Promise<HeldVideoCinematic> {
  return Promise.resolve({ result: { id, reason, played: false }, surface: null, release: () => undefined });
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
    return this.run(id, options, false).then((held) => held.result);
  }

  /**
   * Journey hold: identical playback, except the settled presentation surface stays mounted so a
   * Journey session can freeze on it and layer player agency over it. The caller owns `release`.
   */
  playHeld(id: string, options: VideoCinematicPlaybackOptions = {}): Promise<HeldVideoCinematic> {
    return this.run(id, options, true);
  }

  private run(id: string, options: VideoCinematicPlaybackOptions, hold: boolean): Promise<HeldVideoCinematic> {
    if (this.active) return settledWithoutSurface(id, 'busy');
    const descriptor = this.registry.get(id);
    if (!descriptor) return settledWithoutSurface(id, 'unavailable');
    if (options.signal?.aborted) return settledWithoutSurface(id, 'aborted');
    const reducedMotion = options.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion) return settledWithoutSurface(id, 'reduced-motion');

    const abortController = new AbortController();
    this.active = { id, abortController };
    return new Promise<HeldVideoCinematic>((resolve) => {
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
        if (hold) overlay.freeze();
        else overlay.dispose();
        if (this.active?.abortController === abortController) this.active = null;
        resolve({
          result: { id, reason, played: reason === 'ended' || reason === 'skipped', ...(error === undefined ? {} : { error }) },
          surface: hold ? overlay.element : null,
          release: () => overlay.dispose(),
        });
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
      // Give local media enough time to load and dispatch `ended` after its declared duration.
      // The timeout remains a hard non-blocking guard; it must not race a healthy long clip.
      timeout = window.setTimeout(
        () => finish('timeout'),
        options.timeoutMs ?? Math.max(12_000, (descriptor.durationMs ?? 0) + 5_000),
      );

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
