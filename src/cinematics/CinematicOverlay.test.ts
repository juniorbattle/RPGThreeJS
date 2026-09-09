// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CinematicOverlay } from './CinematicOverlay';
import type { VideoCinematicDescriptor } from './CinematicTypes';

const callbacks = { onSkip: vi.fn(), onToggleMuted: vi.fn() };
const posterDescriptor: VideoCinematicDescriptor = {
  id: 'snapshot-pilot',
  title: 'Snapshot pilot',
  sources: [{ src: '/pilot.mp4', type: 'video/mp4' }],
  poster: '/pilot-poster.png',
  fallbackText: 'The chronicle continues.',
};

function setDecodedFrame(overlay: CinematicOverlay, width = 1920, height = 1080): void {
  Object.defineProperties(overlay.video, {
    videoWidth: { configurable: true, value: width },
    videoHeight: { configurable: true, value: height },
    readyState: { configurable: true, value: 2 },
    paused: { configurable: true, value: false },
    ended: { configurable: true, value: false },
  });
}

function canvasContext(drawImage = vi.fn()): CanvasRenderingContext2D {
  return { drawImage } as unknown as CanvasRenderingContext2D;
}

describe('cinematic overlay decoded-frame freeze', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('captures decoded pixels before hiding video and holds the intrinsic-size canvas until disposal', () => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    setDecodedFrame(overlay);
    let videoWasVisibleDuringDraw = false;
    const drawImage = vi.fn(() => { videoWasVisibleDuringDraw = !overlay.video.hidden; });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext(drawImage));

    overlay.freeze();

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledWith(overlay.video, 0, 0, 1920, 1080);
    expect(videoWasVisibleDuringDraw).toBe(true);
    expect(overlay.freezeFrame.width).toBe(1920);
    expect(overlay.freezeFrame.height).toBe(1080);
    expect(overlay.freezeFrame.hidden).toBe(false);
    expect(overlay.video.hidden).toBe(false);
    expect(overlay.video.classList.contains('cinematic-overlay__video--decoder')).toBe(true);
    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('canvas');
    expect(overlay.freezeFrame.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.freezeFrame.tabIndex).toBe(-1);
    expect(overlay.element.contains(overlay.freezeFrame)).toBe(true);
    expect(overlay.element.getAttribute('role')).toBe('presentation');
    expect(overlay.element.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.element.inert).toBe(true);

    overlay.dispose();
    expect(overlay.freezeFrame.width).toBe(0);
    expect(overlay.freezeFrame.height).toBe(0);
    expect(document.querySelector('.cinematic-overlay__freeze-frame')).toBeNull();
  });

  it('falls back to the poster when a canvas context is unavailable', () => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    setDecodedFrame(overlay);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    overlay.freeze();

    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('poster');
    expect(overlay.freezeFrame.hidden).toBe(true);
    expect(overlay.freezeFrame.width).toBe(0);
    expect(overlay.freezeFrame.height).toBe(0);
    expect(overlay.video.hidden).toBe(false);
    expect(overlay.video.classList.contains('cinematic-overlay__video--decoder')).toBe(true);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__poster')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(true);
  });

  it('falls back safely when drawImage throws and releases the attempted pixel buffer', () => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    setDecodedFrame(overlay);
    const drawImage = vi.fn(() => { throw new DOMException('decode surface lost', 'InvalidStateError'); });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext(drawImage));

    expect(() => overlay.freeze()).not.toThrow();

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('poster');
    expect(overlay.freezeFrame.hidden).toBe(true);
    expect(overlay.freezeFrame.width).toBe(0);
    expect(overlay.freezeFrame.height).toBe(0);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__poster')?.hidden).toBe(false);
  });

  it.each([
    { width: 0, height: 1080, readyState: 2 },
    { width: 1920, height: 0, readyState: 2 },
    { width: 1920, height: 1080, readyState: 1 },
  ])('rejects a frame without decodable dimensions/readiness: $width x $height at $readyState', ({ width, height, readyState }) => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    Object.defineProperties(overlay.video, {
      videoWidth: { configurable: true, value: width },
      videoHeight: { configurable: true, value: height },
      readyState: { configurable: true, value: readyState },
    });
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext(drawImage));

    overlay.freeze();

    expect(drawImage).not.toHaveBeenCalled();
    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('poster');
    expect(overlay.freezeFrame.hidden).toBe(true);
  });

  it('uses the text fallback instead of exposing a black video when no poster exists', () => {
    const overlay = new CinematicOverlay({ ...posterDescriptor, poster: undefined }, callbacks);
    overlay.mount(true);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    overlay.freeze();

    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('fallback');
    expect(overlay.video.hidden).toBe(false);
    expect(overlay.video.classList.contains('cinematic-overlay__video--decoder')).toBe(true);
    expect(overlay.freezeFrame.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(false);
  });

  it('keeps live media passive while a dialogue layer owns interaction', () => {
    callbacks.onSkip.mockClear();
    const focus = document.createElement('button');
    document.body.append(focus);
    focus.focus();
    const root = document.createElement('div');
    document.body.append(root);
    const overlay = new CinematicOverlay(posterDescriptor, callbacks, true, root, true);
    overlay.mount(true);
    expect(overlay.element.classList.contains('cinematic-overlay--passive')).toBe(true);
    expect(overlay.element.getAttribute('role')).toBe('presentation');
    expect(overlay.element.hasAttribute('aria-modal')).toBe(false);
    expect(document.activeElement).toBe(focus);
    expect(overlay.skipButton.disabled).toBe(false);
    overlay.skipButton.click();
    expect(callbacks.onSkip).toHaveBeenCalledTimes(1);
    overlay.dispose();
  });

  it('keeps video and canvas crop/layer styling equivalent and noninteractive', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8');
    expect(css).toMatch(/\.cinematic-overlay__video\s*\{[^}]*position:absolute;[^}]*inset:0;[^}]*z-index:1;[^}]*width:100%;[^}]*height:100%;[^}]*object-fit:cover;/s);
    expect(css).toContain('.cinematic-overlay__video--decoder { opacity:0; pointer-events:none; }');
    expect(css).toMatch(/\.cinematic-overlay__freeze-frame\s*\{[^}]*position:absolute;[^}]*inset:0;[^}]*z-index:1;[^}]*width:100%;[^}]*height:100%;[^}]*object-fit:cover;[^}]*pointer-events:none;/s);
    expect(css).toContain('.dialogue--cinematic { z-index:9200; background:transparent; }');
  });

  it('pumps repeated requestVideoFrameCallback frames into the same live canvas and stops on freeze', () => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    setDecodedFrame(overlay);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext(drawImage));
    const pending = new Map<number, (now: number, metadata: unknown) => void>();
    let nextHandle = 0;
    const requestVideoFrameCallback = vi.fn((callback: (now: number, metadata: unknown) => void) => {
      const handle = ++nextHandle;
      pending.set(handle, callback);
      return handle;
    });
    const cancelVideoFrameCallback = vi.fn((handle: number) => { pending.delete(handle); });
    Object.defineProperties(overlay.video, {
      requestVideoFrameCallback: { configurable: true, value: requestVideoFrameCallback },
      cancelVideoFrameCallback: { configurable: true, value: cancelVideoFrameCallback },
    });
    const ownedCanvas = overlay.freezeFrame;

    overlay.startFramePump();
    expect(overlay.element.dataset.cinematicFramePump).toBe('video-frame');
    pending.get(1)?.(0, {});
    pending.delete(1);
    pending.get(2)?.(16, {});
    pending.delete(2);

    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(overlay.freezeFrame).toBe(ownedCanvas);
    expect(document.querySelectorAll('.cinematic-overlay canvas')).toHaveLength(1);
    expect(overlay.freezeFrame.hidden).toBe(false);
    expect(overlay.video.classList.contains('cinematic-overlay__video--decoder')).toBe(true);
    expect(requestVideoFrameCallback).toHaveBeenCalledTimes(3);

    overlay.freeze();

    expect(drawImage).toHaveBeenCalledTimes(3);
    expect(cancelVideoFrameCallback).toHaveBeenCalledWith(3);
    expect(overlay.element.dataset.cinematicFramePump).toBe('stopped');
    expect(overlay.freezeFrame).toBe(ownedCanvas);
    expect(overlay.freezeFrame.hidden).toBe(false);
    expect(overlay.element.dataset.cinematicFreezeSurface).toBe('canvas');
  });

  it('uses requestAnimationFrame when video-frame callbacks are unavailable and cancels it on disposal', () => {
    const overlay = new CinematicOverlay(posterDescriptor, callbacks);
    overlay.mount(true);
    setDecodedFrame(overlay);
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext(drawImage));
    const pending = new Map<number, FrameRequestCallback>();
    let nextHandle = 0;
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const handle = ++nextHandle;
      pending.set(handle, callback);
      return handle;
    });
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => {
      pending.delete(handle);
    });

    overlay.startFramePump();
    expect(overlay.element.dataset.cinematicFramePump).toBe('animation-frame');
    pending.get(1)?.(0);
    pending.delete(1);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    overlay.dispose();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(overlay.freezeFrame.width).toBe(0);
    expect(overlay.freezeFrame.height).toBe(0);
  });
});
