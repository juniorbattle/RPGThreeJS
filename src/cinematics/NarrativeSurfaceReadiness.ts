import type { NarrativeMediaSurfaceKind } from './NarrativeStage';

export type NarrativeSurfaceReadinessStatus = 'PREPARING' | 'READY' | 'VISIBLE' | 'FAILED' | 'DISPOSED';

export type NarrativeSurfaceTimelineEvent =
  | 'TRANSITION_START'
  | 'VIDEO_ELEMENT_CREATED'
  | 'METADATA'
  | 'LOADED_DATA'
  | 'PLAY_PROMISE_RESOLVED'
  | 'PLAYING'
  | 'FIRST_VIDEO_FRAME'
  | 'FIRST_CANVAS_DRAW'
  | 'MEDIA_TIMEOUT'
  | 'MEDIA_FAILED'
  | 'FALLBACK_READY'
  | 'MEDIA_VISIBLE_READY'
  | 'TRANSITION_REVEAL'
  | 'FIRST_DIALOGUE_ACTIVATION';

export interface NarrativeSurfaceTimelineRecord {
  event: NarrativeSurfaceTimelineEvent;
  at: number;
}

/**
 * One presentation-only gate shared by still, video and fallback surfaces.
 * A video reaches READY only after pixels were copied to the authoritative canvas.
 */
export class NarrativeSurfaceReadiness {
  private currentStatus: NarrativeSurfaceReadinessStatus = 'PREPARING';
  private currentSurface: NarrativeMediaSurfaceKind = 'NONE';
  private readonly records: NarrativeSurfaceTimelineRecord[] = [];
  private readonly visiblePromise: Promise<NarrativeMediaSurfaceKind>;
  private resolveVisible!: (surface: NarrativeMediaSurfaceKind) => void;
  private settled = false;

  constructor(private readonly clock: () => number = () => performance.now()) {
    this.visiblePromise = new Promise((resolve) => { this.resolveVisible = resolve; });
    this.record('TRANSITION_START');
  }

  get status(): NarrativeSurfaceReadinessStatus { return this.currentStatus; }
  get surface(): NarrativeMediaSurfaceKind { return this.currentSurface; }
  get timeline(): readonly NarrativeSurfaceTimelineRecord[] { return this.records; }

  record(event: NarrativeSurfaceTimelineEvent): void {
    if (this.currentStatus === 'DISPOSED') return;
    if (this.records.some((entry) => entry.event === event)) return;
    this.records.push({ event, at: this.clock() });
  }

  markReady(surface: NarrativeMediaSurfaceKind): void {
    if (this.currentStatus !== 'PREPARING') return;
    this.currentSurface = surface;
    this.currentStatus = 'READY';
    this.record(surface === 'FALLBACK' ? 'FALLBACK_READY' : 'MEDIA_VISIBLE_READY');
    if (surface === 'FALLBACK') this.record('MEDIA_VISIBLE_READY');
  }

  markVisible(): void {
    if (this.currentStatus !== 'READY') return;
    this.currentStatus = 'VISIBLE';
    this.record('TRANSITION_REVEAL');
    if (!this.settled) {
      this.settled = true;
      this.resolveVisible(this.currentSurface);
    }
  }

  markFailed(): void {
    if (this.currentStatus === 'DISPOSED' || this.currentStatus === 'VISIBLE') return;
    this.currentStatus = 'FAILED';
    this.record('MEDIA_FAILED');
  }

  waitUntilVisible(): Promise<NarrativeMediaSurfaceKind> {
    return this.visiblePromise;
  }

  dispose(): void {
    if (this.currentStatus === 'DISPOSED') return;
    this.currentStatus = 'DISPOSED';
    if (!this.settled) {
      this.settled = true;
      this.resolveVisible('NONE');
    }
  }
}
