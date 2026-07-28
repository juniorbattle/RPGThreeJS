import type { VideoCinematicDescriptor } from './CinematicTypes';

export interface CinematicOverlayCallbacks {
  onSkip: () => void;
  onToggleMuted: () => void;
}

export class CinematicOverlay {
  readonly element = document.createElement('section');
  readonly video = document.createElement('video');
  readonly skipButton = document.createElement('button');
  readonly muteButton = document.createElement('button');
  private readonly fallback = document.createElement('div');
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

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
    this.element.append(this.video, this.fallback, controls);
  }

  mount(muted: boolean): void {
    this.setMuted(muted);
    this.root.append(this.element);
    (this.skipButton.hidden ? this.muteButton : this.skipButton).focus();
  }

  showFallback(): void {
    this.video.hidden = true;
    this.muteButton.hidden = true;
    this.fallback.hidden = false;
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted;
    this.muteButton.textContent = muted ? 'Activer le son' : 'Couper le son';
    this.muteButton.setAttribute('aria-pressed', String(!muted));
  }

  dispose(): void {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.replaceChildren();
    try { this.video.load(); } catch {}
    this.element.remove();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
}
