import type { VideoCinematicDescriptor } from './CinematicTypes';

// HTMLMediaElement.HAVE_CURRENT_DATA. Kept local because lightweight DOM test hosts do not all
// expose the browser's static media constants even though they implement numeric readyState.
const HAVE_CURRENT_DECODED_FRAME = 2;

interface VideoFramePumpElement {
  requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
}

export interface CinematicOverlayCallbacks {
  onSkip: () => void;
  onToggleMuted: () => void;
}

export class CinematicOverlay {
  readonly element = document.createElement('section');
  readonly video = document.createElement('video');
  readonly freezeFrame = document.createElement('canvas');
  readonly skipButton = document.createElement('button');
  readonly muteButton = document.createElement('button');
  private readonly fallback = document.createElement('div');
  private readonly posterSurface = document.createElement('div');
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private framePumpActive = false;
  private videoFrameCallbackHandle: number | null = null;
  private animationFrameHandle: number | null = null;
  private canvasHasFrame = false;
  private fallbackSelected = false;
  private frozen = false;
  private disposed = false;

  constructor(
    private readonly descriptor: VideoCinematicDescriptor,
    callbacks: CinematicOverlayCallbacks,
    allowSkip = true,
    private readonly root: HTMLElement = document.body,
  ) {
    this.element.className = 'cinematic-overlay';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', descriptor.title);
    this.video.className = 'cinematic-overlay__video';
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    if (descriptor.poster) this.video.poster = descriptor.poster;
    this.freezeFrame.className = 'cinematic-overlay__freeze-frame';
    this.freezeFrame.setAttribute('aria-hidden', 'true');
    this.freezeFrame.hidden = true;
    // Avoid retaining the browser's default 300x150 backing buffer before a snapshot is needed.
    this.freezeFrame.width = 0;
    this.freezeFrame.height = 0;
    this.posterSurface.className = 'cinematic-overlay__poster';
    this.posterSurface.hidden = true;
    this.fallback.className = 'cinematic-overlay__fallback';
    this.fallback.hidden = true;
    this.fallback.innerHTML = `<span>✦</span><h2></h2><p></p>`;
    this.fallback.querySelector('h2')!.textContent = descriptor.title;
    this.fallback.querySelector('p')!.textContent = descriptor.fallbackText ?? 'La chronique continue.';
    const controls = document.createElement('div');
    controls.className = 'cinematic-overlay__controls';
    this.muteButton.type = 'button';
    this.muteButton.className = 'cinematic-overlay__control';
    this.muteButton.addEventListener('click', callbacks.onToggleMuted);
    this.skipButton.type = 'button';
    this.skipButton.className = 'cinematic-overlay__control cinematic-overlay__skip';
    this.skipButton.textContent = descriptor.placeholderOnly ? 'Continuer' : 'Passer';
    this.skipButton.hidden = !allowSkip;
    this.skipButton.addEventListener('click', callbacks.onSkip);
    controls.append(this.muteButton, this.skipButton);
    this.element.append(this.video, this.freezeFrame, this.posterSurface, this.fallback, controls);
  }

  mount(muted: boolean): void {
    this.setMuted(muted);
    this.root.append(this.element);
    (this.skipButton.hidden ? this.muteButton : this.skipButton).focus();
  }

  showFallback(): void {
    this.fallbackSelected = true;
    this.stopFramePump();
    this.makeVideoDecoderOnly();
    this.clearFreezeFrame();
    this.posterSurface.hidden = true;
    this.muteButton.hidden = true;
    this.fallback.hidden = false;
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted;
    this.muteButton.textContent = muted ? 'Activer le son' : 'Couper le son';
    this.muteButton.setAttribute('aria-pressed', String(!muted));
  }

  /**
   * Keep the video alive as decoder/clock/audio source while presenting every decoded frame on
   * the one canvas owned by this overlay. Chromium's video-frame callback is preferred because it
   * follows decoded frame delivery; RAF is a defensive fallback for older engines.
   */
  startFramePump(): void {
    if (this.framePumpActive || this.frozen || this.disposed) return;
    this.framePumpActive = true;
    const videoFramePump = this.video as HTMLVideoElement & VideoFramePumpElement;
    if (
      typeof videoFramePump.requestVideoFrameCallback === 'function'
      && typeof videoFramePump.cancelVideoFrameCallback === 'function'
    ) {
      this.element.dataset.cinematicFramePump = 'video-frame';
      this.scheduleVideoFrame();
      return;
    }
    this.element.dataset.cinematicFramePump = 'animation-frame';
    this.scheduleAnimationFrame();
  }

  /**
   * Journey hold: keep this surface mounted after playback settled instead of disposing it.
   * A successful decoded-frame canvas snapshot becomes the authoritative visual. Lifecycle
   * events alone do not prove that an ended video remains browser-composited. Capture therefore
   * happens before pause/hide, then degrades safely to the poster or text fallback.
   */
  freeze(): void {
    if (this.frozen || this.disposed) return;
    this.frozen = true;
    const capturedLatestFrame = !this.fallbackSelected && this.drawCurrentFrame();
    this.stopFramePump();
    if (capturedLatestFrame || this.canvasHasFrame) {
      this.element.dataset.cinematicFreezeSurface = 'canvas';
    } else if (this.descriptor.poster) {
      this.showPoster();
      this.element.dataset.cinematicFreezeSurface = 'poster';
    } else {
      this.showFallback();
      this.element.dataset.cinematicFreezeSurface = 'fallback';
    }
    this.video.pause();
    if (this.element.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
    this.element.classList.add('cinematic-overlay--frozen');
    this.element.removeAttribute('aria-modal');
    this.element.removeAttribute('aria-label');
    this.element.setAttribute('role', 'presentation');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.inert = true;
    this.skipButton.hidden = true;
    this.skipButton.disabled = true;
    this.muteButton.hidden = true;
    this.muteButton.disabled = true;
  }

  get isFrozen(): boolean {
    return this.frozen;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopFramePump();
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.replaceChildren();
    try { this.video.load(); } catch {}
    this.clearFreezeFrame();
    this.element.remove();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  private drawCurrentFrame(): boolean {
    if (
      this.video.videoWidth <= 0
      || this.video.videoHeight <= 0
      || !Number.isFinite(this.video.readyState)
      || this.video.readyState < HAVE_CURRENT_DECODED_FRAME
    ) return false;

    const context = this.freezeFrame.getContext('2d');
    if (!context) return false;

    try {
      if (
        this.freezeFrame.width !== this.video.videoWidth
        || this.freezeFrame.height !== this.video.videoHeight
      ) {
        this.freezeFrame.width = this.video.videoWidth;
        this.freezeFrame.height = this.video.videoHeight;
        this.canvasHasFrame = false;
      }
      context.drawImage(this.video, 0, 0, this.freezeFrame.width, this.freezeFrame.height);
      this.canvasHasFrame = true;
      this.posterSurface.hidden = true;
      this.fallback.hidden = true;
      this.freezeFrame.hidden = false;
      this.makeVideoDecoderOnly();
      this.element.dataset.cinematicVisualSurface = 'canvas';
      return true;
    } catch {
      return false;
    }
  }

  private clearFreezeFrame(): void {
    this.freezeFrame.hidden = true;
    this.freezeFrame.width = 0;
    this.freezeFrame.height = 0;
    this.canvasHasFrame = false;
  }

  private showPoster(): void {
    this.stopFramePump();
    this.makeVideoDecoderOnly();
    this.clearFreezeFrame();
    this.fallback.hidden = true;
    this.posterSurface.style.backgroundImage = `url("${this.descriptor.poster}")`;
    this.posterSurface.hidden = false;
  }

  private scheduleVideoFrame(): void {
    const videoFramePump = this.video as HTMLVideoElement & Required<VideoFramePumpElement>;
    this.videoFrameCallbackHandle = videoFramePump.requestVideoFrameCallback(() => {
      this.videoFrameCallbackHandle = null;
      if (!this.framePumpActive || this.frozen || this.disposed) return;
      if (!this.video.paused && !this.video.ended) this.drawCurrentFrame();
      if (this.framePumpActive && !this.frozen && !this.disposed && !this.video.ended) this.scheduleVideoFrame();
    });
  }

  private scheduleAnimationFrame(): void {
    this.animationFrameHandle = window.requestAnimationFrame(() => {
      this.animationFrameHandle = null;
      if (!this.framePumpActive || this.frozen || this.disposed) return;
      if (!this.video.paused && !this.video.ended) this.drawCurrentFrame();
      if (this.framePumpActive && !this.frozen && !this.disposed && !this.video.ended) this.scheduleAnimationFrame();
    });
  }

  private stopFramePump(): void {
    this.framePumpActive = false;
    if (this.videoFrameCallbackHandle !== null) {
      const videoFramePump = this.video as HTMLVideoElement & VideoFramePumpElement;
      videoFramePump.cancelVideoFrameCallback?.(this.videoFrameCallbackHandle);
      this.videoFrameCallbackHandle = null;
    }
    if (this.animationFrameHandle !== null) {
      window.cancelAnimationFrame(this.animationFrameHandle);
      this.animationFrameHandle = null;
    }
    if (this.element.dataset.cinematicFramePump) this.element.dataset.cinematicFramePump = 'stopped';
  }

  private makeVideoDecoderOnly(): void {
    this.video.hidden = false;
    this.video.classList.add('cinematic-overlay__video--decoder');
    this.video.setAttribute('aria-hidden', 'true');
  }
}
