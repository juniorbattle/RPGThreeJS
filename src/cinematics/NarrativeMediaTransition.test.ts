// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../game/content';
import { presentCinematicDialogue } from './CinematicDialogueSession';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';
import { NarrativeStage } from './NarrativeStage';
import { ALARIC_AUDIENCE_TABLEAU } from './NarrativeTableau';

const registry = () => new CinematicRegistry({
  version: 1,
  cinematics: [{ id: 'audience', title: 'Audience', sources: [{ src: '/audience.mp4', type: 'video/mp4' }] }],
});

let pendingFrame: ((now: number, metadata: unknown) => void) | null = null;
let nextFrameHandle = 0;

function createVideoStage(options: { loading?: number; startup?: number; reveal?: number } = {}) {
  const cinematicRegistry = registry();
  const player = new CinematicPlayer(cinematicRegistry);
  const stage = new NarrativeStage({
    player,
    registry: cinematicRegistry,
    mediaMode: 'VIDEO',
    loadingIndicatorDelayMs: options.loading ?? 40,
    videoStartupTimeoutMs: options.startup ?? 1_000,
    transitionRevealMs: options.reveal ?? 20,
  });
  stage.setTableau(ALARIC_AUDIENCE_TABLEAU);
  stage.bindDialogue(dialogues.get('lion_briefing')!);
  return { stage, player };
}

function makeFrameRenderable(video: HTMLVideoElement): void {
  Object.defineProperties(video, {
    videoWidth: { configurable: true, value: 1920 },
    videoHeight: { configurable: true, value: 1080 },
    readyState: { configurable: true, value: 2 },
    paused: { configurable: true, value: false },
    ended: { configurable: true, value: false },
  });
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('NarrativeStage media transition gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pendingFrame = null;
    nextFrameHandle = 0;
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    Object.defineProperties(HTMLVideoElement.prototype, {
      requestVideoFrameCallback: {
        configurable: true,
        value: vi.fn((callback: (now: number, metadata: unknown) => void) => {
          pendingFrame = callback;
          return ++nextFrameHandle;
        }),
      },
      cancelVideoFrameCallback: { configurable: true, value: vi.fn() },
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    Reflect.deleteProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback');
    Reflect.deleteProperty(HTMLVideoElement.prototype, 'cancelVideoFrameCallback');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('keeps transition and dialogue locked through metadata, data and play until a canvas frame is painted', async () => {
    const { stage } = createVideoStage();
    const openLiveDialogue = vi.fn(async () => {
      stage.activateDialogueStep('1', 'SPEAKER_CARD', 'lion-side', 'AUDIENCE_AUTHORITY', 'alaric');
    });
    const pending = presentCinematicDialogue({
      player: { playHeld: vi.fn() },
      stage,
      cinematicId: 'audience',
      playback: { reducedMotion: false },
      openLiveDialogue,
      openHeldDialogue: async () => undefined,
      openFallbackDialogue: async () => undefined,
    });
    const video = document.querySelector<HTMLVideoElement>('video')!;

    expect(stage.mediaReadinessStatus).toBe('PREPARING');
    expect(document.querySelector('.narrative-media-transition.is-covering')).not.toBeNull();
    expect(stage.dialogueLayer.inert).toBe(true);
    expect(openLiveDialogue).not.toHaveBeenCalled();

    video.dispatchEvent(new Event('loadedmetadata'));
    await flush();
    expect(openLiveDialogue).not.toHaveBeenCalled();
    video.dispatchEvent(new Event('loadeddata'));
    await flush();
    expect(openLiveDialogue).not.toHaveBeenCalled();
    video.dispatchEvent(new Event('playing'));
    await flush();
    expect(openLiveDialogue).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(40);
    expect(document.querySelector<HTMLElement>('.narrative-media-transition__loading')?.hidden).toBe(false);
    expect(openLiveDialogue).not.toHaveBeenCalled();

    makeFrameRenderable(video);
    pendingFrame?.(40, {});
    expect(stage.mediaTimeline.map((entry) => entry.event)).toEqual(expect.arrayContaining([
      'VIDEO_ELEMENT_CREATED', 'METADATA', 'LOADED_DATA', 'PLAY_PROMISE_RESOLVED', 'PLAYING',
      'FIRST_VIDEO_FRAME', 'FIRST_CANVAS_DRAW', 'MEDIA_VISIBLE_READY',
    ]));
    expect(stage.mediaReadinessStatus).toBe('READY');
    expect(openLiveDialogue).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    await flush();
    expect(stage.mediaReadinessStatus).toBe('VISIBLE');
    expect(stage.dialogueLayer.inert).toBe(false);
    expect(openLiveDialogue).toHaveBeenCalledTimes(1);
    const timeline = new Map(stage.mediaTimeline.map((entry) => [entry.event, entry.at]));
    expect(timeline.get('FIRST_DIALOGUE_ACTIVATION')!).toBeGreaterThan(timeline.get('FIRST_CANVAS_DRAW')!);

    video.dispatchEvent(new Event('ended'));
    await expect(pending).resolves.toMatchObject({ reason: 'ended' });
  });

  it('does not flash the delayed loading indicator for fast media', async () => {
    const { stage } = createVideoStage({ loading: 80, reveal: 5 });
    const media = stage.presentCinematic('audience', { reducedMotion: false });
    const video = document.querySelector<HTMLVideoElement>('video')!;
    makeFrameRenderable(video);
    pendingFrame?.(0, {});
    expect(document.querySelector<HTMLElement>('.narrative-media-transition__loading')?.hidden).toBe(true);
    await vi.advanceTimersByTimeAsync(5);
    expect(stage.mediaReadinessStatus).toBe('VISIBLE');
    expect(stage.element.dataset.narrativeLoadingIndicator).toBeUndefined();
    video.dispatchEvent(new Event('ended'));
    await media;
  });

  it('keeps the shield up and reveals stage-owned cast before dialogue when video startup times out', async () => {
    const { stage } = createVideoStage({ loading: 10, startup: 30, reveal: 5 });
    const openLiveDialogue = vi.fn(async () => {
      stage.activateDialogueStep('1', 'SPEAKER_CARD', 'lion-side', 'AUDIENCE_AUTHORITY', 'alaric');
    });
    const pending = presentCinematicDialogue({
      player: { playHeld: vi.fn() },
      stage,
      cinematicId: 'audience',
      playback: { reducedMotion: false },
      openLiveDialogue,
      openHeldDialogue: async () => undefined,
      openFallbackDialogue: async () => undefined,
    });

    await vi.advanceTimersByTimeAsync(30);
    await flush();
    expect(openLiveDialogue).not.toHaveBeenCalled();
    expect(document.querySelector('.narrative-media-transition')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(5);
    await flush();

    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    expect(stage.element.dataset.narrativeCastOwnership).toBe('STAGE_OWNS_CAST');
    expect(document.querySelectorAll('.narrative-cast__actor').length).toBeGreaterThan(0);
    expect(stage.mediaReadinessStatus).toBe('VISIBLE');
    expect(openLiveDialogue).toHaveBeenCalledTimes(1);
    expect(stage.mediaTimeline.map((entry) => entry.event)).toEqual(expect.arrayContaining([
      'MEDIA_TIMEOUT', 'MEDIA_FAILED', 'FALLBACK_READY', 'TRANSITION_REVEAL', 'FIRST_DIALOGUE_ACTIVATION',
    ]));
    await expect(pending).resolves.toMatchObject({ reason: 'aborted', presentation: 'fallback' });
  });
});
