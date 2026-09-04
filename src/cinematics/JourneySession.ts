import { CinematicPreloader } from './CinematicPreloader';
import type { CinematicPlayer } from './CinematicPlayer';
import type { CinematicRegistry } from './CinematicRegistry';
import type {
  HeldVideoCinematic,
  VideoCinematicPlaybackOptions,
  VideoCinematicResult,
} from './CinematicTypes';
import { JourneyOverlay } from './JourneyOverlay';
import {
  canJourneyTransition,
  type JourneyAgencyPresentation,
  type JourneyCommit,
  type JourneySessionState,
} from './JourneyTypes';

export interface JourneySessionOptions {
  player: CinematicPlayer;
  registry: CinematicRegistry;
  root?: HTMLElement;
  preloader?: CinematicPreloader;
  onStateChange?: (state: JourneySessionState, previous: JourneySessionState) => void;
}

const TRACE_LIMIT = 64;

/**
 * Presentation-only Journey session: cinematic → freeze → player agency → next transition.
 *
 * It owns nothing but DOM, media and preloads. It imports no game module, never reads or mutates
 * GameState, never enters a run node, never resolves dialogue and never starts combat. Failure of
 * any kind still reaches a safe presentation state, so a broken cinematic can never deadlock play.
 */
export class JourneySession {
  private readonly player: CinematicPlayer;
  private readonly root: HTMLElement;
  private readonly preloader: CinematicPreloader;
  private readonly onStateChange: JourneySessionOptions['onStateChange'];
  private readonly trace: JourneySessionState[] = ['IDLE'];
  private currentState: JourneySessionState = 'IDLE';
  private surface: HeldVideoCinematic | null = null;
  private overlay: JourneyOverlay | null = null;
  private pendingAgency: ((commit: JourneyCommit) => void) | null = null;

  constructor(options: JourneySessionOptions) {
    this.player = options.player;
    this.root = options.root ?? document.body;
    this.preloader = options.preloader ?? new CinematicPreloader(options.registry);
    this.onStateChange = options.onStateChange;
  }

  get state(): JourneySessionState {
    return this.currentState;
  }

  get stateTrace(): readonly JourneySessionState[] {
    return this.trace;
  }

  /** The frozen presentation surface, or null when nothing is mounted. */
  get frozenSurface(): HTMLElement | null {
    return this.surface?.surface ?? null;
  }

  get agencyOverlay(): JourneyOverlay | null {
    return this.overlay;
  }

  get candidatePreloader(): CinematicPreloader {
    return this.preloader;
  }

  /**
   * Plays a local cinematic and freezes on its final presentation.
   *
   * Skipped, reduced-motion, unavailable, autoplay-rejected, errored, timed-out and aborted
   * playback all still land in FREEZE, on a poster, on the descriptor fallback, or on a neutral
   * surface — the same boundary a fully played clip reaches.
   */
  async presentCinematic(id: string, options: VideoCinematicPlaybackOptions = {}): Promise<VideoCinematicResult> {
    if (!this.transition('PLAYING')) {
      return { id, reason: this.currentState === 'DISPOSED' ? 'aborted' : 'busy', played: false };
    }
    const previous = this.surface;
    this.surface = null;
    const held = await this.player.playHeld(id, options);
    if (!this.transition('FREEZE')) {
      // Disposed while the clip was playing: own nothing, leave nothing mounted.
      held.release();
      previous?.release();
      return held.result;
    }
    this.surface = held.surface ? held : this.createNeutralSurface(held.result);
    previous?.release();
    return held.result;
  }

  /**
   * Shows the Journey agency overlay over the frozen presentation and resolves with the single
   * committed affordance. Disposal or an unavailable state resolves `aborted`, which carries no
   * gameplay meaning.
   */
  requestAgency(presentation: JourneyAgencyPresentation): Promise<JourneyCommit> {
    if (!canJourneyTransition(this.currentState, 'AGENCY')) {
      console.warn(`[Journey] Agency unavailable from ${this.currentState}.`);
      return Promise.resolve({ kind: 'aborted', id: null });
    }
    return new Promise<JourneyCommit>((resolve) => {
      let settled = false;
      const settle = (commit: JourneyCommit) => {
        if (settled) return;
        settled = true;
        this.pendingAgency = null;
        this.disposeOverlay();
        if (commit.kind !== 'aborted') this.transition('TRANSITIONING');
        resolve(commit);
      };
      this.pendingAgency = settle;
      this.overlay = new JourneyOverlay(presentation, { onCommit: settle }, {
        standalone: this.surface === null,
        root: this.root,
      });
      this.overlay.mount();
      this.transition('AGENCY');
    });
  }

  /** One-successor path: leave a freeze without ever showing agency controls. */
  beginTransition(): boolean {
    if (this.currentState !== 'FREEZE') return false;
    return this.transition('TRANSITIONING');
  }

  /** Drops the frozen presentation surface. */
  releaseFreeze(): void {
    this.surface?.release();
    this.surface = null;
    if (this.currentState === 'FREEZE' || this.currentState === 'TRANSITIONING') this.transition('IDLE');
  }

  preloadCandidates(ids: readonly string[]): void {
    if (this.currentState === 'DISPOSED') return;
    this.preloader.preload(ids);
  }

  releaseCandidates(ids: readonly string[]): void {
    this.preloader.release(ids);
  }

  dispose(): void {
    if (this.currentState === 'DISPOSED') return;
    this.pendingAgency?.({ kind: 'aborted', id: null });
    this.disposeOverlay();
    if (this.currentState === 'PLAYING') this.player.abort();
    this.surface?.release();
    this.surface = null;
    this.preloader.clear();
    this.transition('DISPOSED');
  }

  private createNeutralSurface(result: VideoCinematicResult): HeldVideoCinematic {
    const neutral = document.createElement('div');
    neutral.className = 'journey-surface journey-surface--neutral';
    neutral.dataset.journeyFallback = result.reason;
    neutral.setAttribute('aria-hidden', 'true');
    this.root.append(neutral);
    return { result, surface: neutral, release: () => neutral.remove() };
  }

  private disposeOverlay(): void {
    this.overlay?.dispose();
    this.overlay = null;
  }

  private transition(to: JourneySessionState): boolean {
    if (!canJourneyTransition(this.currentState, to)) {
      console.warn(`[Journey] Ignored invalid transition ${this.currentState} → ${to}.`);
      return false;
    }
    const previous = this.currentState;
    this.currentState = to;
    this.trace.push(to);
    if (this.trace.length > TRACE_LIMIT) this.trace.splice(0, this.trace.length - TRACE_LIMIT);
    this.onStateChange?.(to, previous);
    return true;
  }
}
