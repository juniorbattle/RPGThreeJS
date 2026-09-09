import { NarrativeBeatDirector } from './NarrativeBeatDirector';
import type { CinematicPlayer } from './CinematicPlayer';
import { CinematicPreloader } from './CinematicPreloader';
import type { CinematicRegistry } from './CinematicRegistry';
import type { VideoCinematicMediaEvent, VideoCinematicPlaybackOptions, VideoCinematicResult } from './CinematicTypes';
import type { DialogueSequence } from '../game/types';
import { JourneySession } from './JourneySession';
import type { JourneyAgencyPresentation, JourneyCommit, JourneySessionState } from './JourneyTypes';
import { isNarrativeBeatInteractive, type NarrativeDialogueMode, type NarrativeMediaPhase, type NarrativeTableauSpec, type NarrativeTransitionKind } from './NarrativeTableau';
import { NarrativeUtilityDock } from './NarrativeUtilityDock';
import { NarrativeSceneSurface } from './NarrativeSceneSurface';
import type { NarrativeAuthoringMedia } from './NarrativePresentationPolicy';
import { NarrativeSurfaceReadiness, type NarrativeSurfaceReadinessStatus, type NarrativeSurfaceTimelineRecord } from './NarrativeSurfaceReadiness';

export type NarrativeMediaSurfaceKind = 'STILL' | 'VIDEO' | 'HELD_VIDEO' | 'PASSIVE_BACKDROP' | 'FALLBACK' | 'NONE';

export interface NarrativeStageOptions {
  player: CinematicPlayer;
  registry: CinematicRegistry;
  root?: HTMLElement;
  preloader?: CinematicPreloader;
  onStateChange?: (state: JourneySessionState, previous: JourneySessionState) => void;
  mediaMode?: NarrativeAuthoringMedia;
  loadingIndicatorDelayMs?: number;
  videoStartupTimeoutMs?: number;
  transitionRevealMs?: number;
}

const DEFAULT_LOADING_INDICATOR_DELAY_MS = 450;
const DEFAULT_VIDEO_STARTUP_TIMEOUT_MS = 5_000;
const DEFAULT_TRANSITION_REVEAL_MS = 280;

function createLayer(name: string): HTMLElement {
  const layer = document.createElement('div');
  layer.className = `narrative-stage__${name}`;
  layer.dataset.narrativeLayer = name;
  return layer;
}

export class NarrativeStage {
  readonly element = document.createElement('section');
  readonly mediaLayer = createLayer('media');
  readonly dialogueLayer = createLayer('dialogue');
  readonly agencyLayer = createLayer('agency');
  readonly transitionLayer = createLayer('transition');
  readonly utilityLayer = createLayer('utility');
  private readonly root: HTMLElement;
  private readonly player: CinematicPlayer;
  private readonly session: JourneySession;
  private readonly utilityDock: NarrativeUtilityDock;
  private readonly mediaMode: NarrativeAuthoringMedia;
  private readonly loadingIndicatorDelayMs: number;
  private readonly videoStartupTimeoutMs: number;
  private readonly transitionRevealMs: number;
  private director: NarrativeBeatDirector | null = null;
  private tableau: NarrativeTableauSpec | null = null;
  private mounted = false;
  private disposed = false;
  private activeMediaId: string | null = null;
  private mediaSurfaceKind: NarrativeMediaSurfaceKind = 'NONE';
  private sceneSurface: NarrativeSceneSurface | null = null;
  private boundDialogue: DialogueSequence | null = null;
  private readiness: NarrativeSurfaceReadiness | null = null;
  private loadingIndicatorTimer: number | null = null;
  private videoStartupTimer: number | null = null;
  private revealPromise: Promise<void> | null = null;

  constructor(options: NarrativeStageOptions) {
    this.root = options.root ?? document.body;
    this.player = options.player;
    this.mediaMode = options.mediaMode ?? 'VIDEO';
    this.loadingIndicatorDelayMs = options.loadingIndicatorDelayMs ?? DEFAULT_LOADING_INDICATOR_DELAY_MS;
    this.videoStartupTimeoutMs = options.videoStartupTimeoutMs ?? DEFAULT_VIDEO_STARTUP_TIMEOUT_MS;
    this.transitionRevealMs = options.transitionRevealMs ?? DEFAULT_TRANSITION_REVEAL_MS;
    this.element.className = 'narrative-stage';
    this.element.setAttribute('aria-label', 'Scène narrative');
    this.element.dataset.narrativeAuthoringMedia = this.mediaMode;
    this.element.append(this.mediaLayer, this.dialogueLayer, this.agencyLayer, this.transitionLayer, this.utilityLayer);
    this.utilityDock = new NarrativeUtilityDock(this.utilityLayer);
    this.session = new JourneySession({
      player: options.player,
      registry: options.registry,
      preloader: options.preloader ?? new CinematicPreloader(options.registry),
      root: this.element,
      mediaRoot: this.mediaLayer,
      agencyRoot: this.agencyLayer,
      onStateChange: options.onStateChange,
    });
  }

  get state(): JourneySessionState {
    return this.session.state;
  }

  get stateTrace(): readonly JourneySessionState[] {
    return this.session.stateTrace;
  }

  get frozenSurface(): HTMLElement | null {
    return this.session.frozenSurface;
  }

  get agencyOverlay() {
    return this.session.agencyOverlay;
  }

  get candidatePreloader(): CinematicPreloader {
    return this.session.candidatePreloader;
  }

  get activeTableau(): NarrativeTableauSpec | null {
    return this.tableau;
  }

  get currentMediaSurfaceKind(): NarrativeMediaSurfaceKind {
    return this.mediaSurfaceKind;
  }

  get mediaReadinessStatus(): NarrativeSurfaceReadinessStatus | 'IDLE' {
    return this.readiness?.status ?? 'IDLE';
  }

  get mediaTimeline(): readonly NarrativeSurfaceTimelineRecord[] {
    return this.readiness?.timeline ?? [];
  }

  awaitMediaVisibleReady(): Promise<NarrativeMediaSurfaceKind> {
    return this.readiness?.waitUntilVisible() ?? Promise.resolve(this.mediaSurfaceKind);
  }

  setTableau(tableau: NarrativeTableauSpec): void {
    if (this.disposed) return;
    this.tableau = tableau;
    this.element.dataset.narrativeTableau = tableau.id;
    this.element.dataset.narrativeGrammar = tableau.grammar;
    const initialPhase = tableau.phases?.[0];
    if (initialPhase) {
      this.element.dataset.narrativeLayoutProfile = initialPhase.layoutProfile;
      this.element.dataset.narrativeLayoutPlacement = initialPhase.layoutPlacement;
    } else {
      delete this.element.dataset.narrativeLayoutProfile;
      delete this.element.dataset.narrativeLayoutPlacement;
    }
    this.director?.dispose();
    this.director = new NarrativeBeatDirector(tableau.beats, {
      onBeat: (beat) => {
        this.element.dataset.narrativeBeat = beat.id;
        this.element.dataset.narrativeBeatKind = beat.kind;
        if (beat.anchorId) this.element.dataset.narrativeAnchor = beat.anchorId;
        else delete this.element.dataset.narrativeAnchor;
      },
      onStateChange: (state) => { this.element.dataset.narrativeBeatState = state; },
    });
    this.director.start();
  }

  bindDialogue(sequence: DialogueSequence): void {
    this.boundDialogue = sequence;
    this.sceneSurface?.bindDialogue(sequence);
  }

  async presentCinematic(
    id: string,
    options: VideoCinematicPlaybackOptions = {},
    fallbackBackdrop: HTMLElement | null = null,
    phase: NarrativeMediaPhase = 'INTRO_MEDIA',
  ): Promise<VideoCinematicResult> {
    if (this.disposed) return { id, reason: 'aborted', played: false };
    if (this.mediaMode === 'STILL') {
      return this.presentStill(this.tableau?.stillImage, `narrative-still:${this.tableau?.id ?? id}`);
    }
    const readiness = this.beginSurfacePreparation();
    this.activateMediaPhase(phase);
    this.setMediaSurfaceKind('VIDEO');
    this.element.dataset.narrativeCastOwnership = 'VIDEO_OWNS_CAST';
    this.activeMediaId = id;
    const stageFallback = this.createPreparedSceneSurface(this.tableau?.stillImage);
    const resolvedFallback = stageFallback?.element ?? fallbackBackdrop;
    this.videoStartupTimer = window.setTimeout(() => {
      if (this.readiness !== readiness || readiness.status !== 'PREPARING') return;
      this.recordReadinessEvent(readiness, 'MEDIA_TIMEOUT');
      if (this.activeMediaId === id && this.player.activeId === id) this.player.abort();
    }, this.videoStartupTimeoutMs);
    try {
      const onMediaEvent = (event: VideoCinematicMediaEvent) => {
        options.onMediaEvent?.(event);
        if (this.readiness !== readiness) return;
        this.recordReadinessEvent(readiness, event);
        if (event === 'FIRST_CANVAS_DRAW' && readiness.status === 'PREPARING') {
          this.clearVideoStartupTimer();
          this.setMediaSurfaceKind('VIDEO');
          this.element.dataset.narrativeCastOwnership = 'VIDEO_OWNS_CAST';
          void this.revealPreparedSurface(readiness, 'VIDEO');
        }
      };
      const result = await this.session.presentCinematic(
        id,
        { ...options, root: this.mediaLayer, onMediaEvent },
        resolvedFallback,
      );
      this.clearVideoStartupTimer();
      if (readiness.status === 'PREPARING') {
        this.recordReadinessEvent(readiness, 'MEDIA_FAILED');
        if (stageFallback) {
          this.sceneSurface = stageFallback;
          await stageFallback.whenRenderable();
        }
        this.setMediaSurfaceKind('FALLBACK');
        this.element.dataset.narrativeCastOwnership = stageFallback ? 'STAGE_OWNS_CAST' : 'ENVIRONMENT_ONLY';
        await this.revealPreparedSurface(readiness, 'FALLBACK');
      } else if (this.session.frozenSurface?.matches('.narrative-scene-surface')) {
        this.sceneSurface = stageFallback;
        this.setMediaSurfaceKind('FALLBACK');
        this.element.dataset.narrativeCastOwnership = stageFallback ? 'STAGE_OWNS_CAST' : 'ENVIRONMENT_ONLY';
      } else {
        stageFallback?.dispose();
        if (this.sceneSurface === stageFallback) this.sceneSurface = null;
        this.updateSettledMediaKind();
      }
      return result;
    } finally {
      this.clearVideoStartupTimer();
      if (this.activeMediaId === id) this.activeMediaId = null;
    }
  }

  async presentPaintedFallback(title: string, image?: string): Promise<VideoCinematicResult> {
    return this.presentStill(image, `narrative-fallback:${this.tableau?.id ?? title}`, 'FALLBACK');
  }

  async presentPassiveBackdrop(backdrop: HTMLElement): Promise<VideoCinematicResult> {
    const readiness = this.beginSurfacePreparation();
    backdrop.classList.add('narrative-media-surface', 'narrative-media-surface--passive');
    backdrop.setAttribute('aria-hidden', 'true');
    const result = await this.session.presentCinematic(
      `narrative-backdrop:${this.tableau?.id ?? 'passive'}`,
      { reducedMotion: false, passive: true },
      backdrop,
    );
    this.setMediaSurfaceKind('PASSIVE_BACKDROP');
    this.element.dataset.narrativeCastOwnership = 'ENVIRONMENT_ONLY';
    await this.revealPreparedSurface(readiness, 'PASSIVE_BACKDROP');
    return result;
  }

  async presentStill(
    image?: string,
    id = `narrative-still:${this.tableau?.id ?? 'fallback'}`,
    kind: 'STILL' | 'FALLBACK' = 'STILL',
  ): Promise<VideoCinematicResult> {
    if (this.disposed) return { id, reason: 'aborted', played: false };
    const readiness = this.beginSurfacePreparation();
    this.sceneSurface?.dispose();
    const tableau = this.tableau;
    if (!tableau) {
      const fallback = document.createElement('div');
      fallback.className = 'narrative-media-surface narrative-media-surface--painted';
      if (image) fallback.style.backgroundImage = `url("${image}")`;
      const result = await this.session.presentCinematic(id, { reducedMotion: false, passive: true }, fallback);
      this.setMediaSurfaceKind('FALLBACK');
      this.element.dataset.narrativeCastOwnership = 'ENVIRONMENT_ONLY';
      await this.revealPreparedSurface(readiness, 'FALLBACK');
      return result;
    }
    const surface = new NarrativeSceneSurface(this.mediaLayer, tableau);
    this.sceneSurface = surface;
    if (this.boundDialogue) surface.bindDialogue(this.boundDialogue);
    surface.mount(image ?? tableau.stillImage);
    await surface.whenRenderable();
    const result = await this.session.presentCinematic(id, { reducedMotion: false, passive: true }, surface.element);
    this.setMediaSurfaceKind(kind);
    this.element.dataset.narrativeCastOwnership = surface.castLayer.childElementCount ? 'STAGE_OWNS_CAST' : 'ENVIRONMENT_ONLY';
    await this.revealPreparedSurface(readiness, kind);
    return result;
  }

  requestAgency(presentation: JourneyAgencyPresentation): Promise<JourneyCommit> {
    this.ensureMounted();
    if (this.readiness && this.readiness.status !== 'VISIBLE') {
      this.element.dataset.narrativeInteractionBlocked = 'agency-before-surface-ready';
      return Promise.resolve({ kind: 'aborted', id: null });
    }
    const targetKind = presentation.mode === 'branch' ? 'ROUTE_CHOICE' : 'CONTEXT_ACTION';
    this.director?.seekKind(targetKind);
    const result = this.session.requestAgency(presentation);
    const utility = this.session.agencyOverlay?.utilityElement;
    if (utility && !utility.hidden && utility.childElementCount) this.utilityDock.mount(utility);
    return result.finally(() => this.utilityDock.dispose());
  }

  activateDialogueStep(
    stepId: string,
    mode: NarrativeDialogueMode,
    anchorId?: string,
    phaseId?: string,
    speakerId?: string,
    strategy?: string,
    layoutProfile?: string,
    layoutPlacement?: string,
  ): void {
    this.ensureMounted();
    if (this.readiness && this.readiness.status !== 'VISIBLE') {
      this.element.dataset.narrativeInteractionBlocked = 'dialogue-before-surface-ready';
      return;
    }
    if (this.readiness) this.recordReadinessEvent(this.readiness, 'FIRST_DIALOGUE_ACTIVATION');
    this.director?.seekDialogueStep(stepId);
    this.element.dataset.narrativeDialogueMode = mode;
    this.element.dataset.narrativeDialogueStep = stepId;
    if (phaseId) {
      this.element.dataset.narrativeVisualPhase = phaseId;
      this.sceneSurface?.setPhase(phaseId, speakerId);
    }
    if (speakerId) this.element.dataset.narrativeSpeaker = speakerId;
    if (strategy) this.element.dataset.narrativePresentationStrategy = strategy;
    if (layoutProfile) this.element.dataset.narrativeLayoutProfile = layoutProfile;
    if (layoutPlacement) this.element.dataset.narrativeLayoutPlacement = layoutPlacement;
    if (anchorId) this.element.dataset.narrativeAnchor = anchorId;
    else delete this.element.dataset.narrativeAnchor;
  }

  beginTransition(transition: NarrativeTransitionKind): void {
    this.ensureMounted();
    this.director?.seekKind('TRANSITION');
    this.element.dataset.narrativeTransition = transition;
    this.transitionLayer.dataset.transition = transition;
  }

  /** Keeps the last tableau visible below the shared scene transition while its input is locked. */
  prepareGlobalHandoff(): void {
    if (this.disposed) return;
    this.element.classList.add('narrative-stage--handoff');
    this.element.dataset.narrativeInteraction = 'LOCKED';
    this.dialogueLayer.inert = true;
    this.agencyLayer.inert = true;
  }

  preloadCandidates(ids: readonly string[]): void {
    this.session.preloadCandidates(ids);
  }

  releaseCandidates(ids: readonly string[]): void {
    this.session.releaseCandidates(ids);
  }

  releaseFreeze(): void {
    this.session.releaseFreeze();
    this.setMediaSurfaceKind('NONE');
  }

  skipPresentation(): void {
    const current = this.director?.current;
    if (!current || current.skippable === false || isNarrativeBeatInteractive(current)) return;
    this.director?.skip();
    if (this.activeMediaId && this.player.activeId === this.activeMediaId) {
      if (this.readiness?.status === 'PREPARING') this.player.abort();
      else this.player.skip();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearPreparationTimers();
    this.readiness?.dispose();
    this.utilityDock.dispose();
    this.director?.dispose();
    this.director = null;
    this.sceneSurface?.dispose();
    this.sceneSurface = null;
    this.session.dispose();
    this.activeMediaId = null;
    this.mediaLayer.replaceChildren();
    this.dialogueLayer.replaceChildren();
    this.agencyLayer.replaceChildren();
    this.transitionLayer.replaceChildren();
    this.utilityLayer.replaceChildren();
    this.element.remove();
    this.mounted = false;
    this.tableau = null;
    this.boundDialogue = null;
    this.mediaSurfaceKind = 'NONE';
  }

  private ensureMounted(): void {
    if (this.mounted || this.disposed) return;
    this.root.append(this.element);
    this.mounted = true;
  }

  private beginSurfacePreparation(): NarrativeSurfaceReadiness {
    this.clearPreparationTimers();
    this.readiness?.dispose();
    const readiness = new NarrativeSurfaceReadiness();
    this.readiness = readiness;
    this.revealPromise = null;
    this.element.dataset.narrativeSurfaceReadiness = 'PREPARING';
    this.syncReadinessTimeline();
    this.element.dataset.narrativeInteraction = 'LOCKED';
    this.element.setAttribute('aria-busy', 'true');
    this.dialogueLayer.inert = true;
    this.agencyLayer.inert = true;
    this.transitionLayer.replaceChildren();
    const shield = document.createElement('div');
    shield.className = 'narrative-media-transition is-covering';
    shield.setAttribute('aria-hidden', 'true');
    shield.innerHTML = '<span class="narrative-media-transition__motif"></span><span class="narrative-media-transition__loading" hidden><i></i><i></i><i></i></span>';
    this.transitionLayer.append(shield);
    this.loadingIndicatorTimer = window.setTimeout(() => {
      if (this.readiness !== readiness || readiness.status !== 'PREPARING') return;
      const indicator = shield.querySelector<HTMLElement>('.narrative-media-transition__loading');
      if (indicator) indicator.hidden = false;
      shield.classList.add('is-waiting');
      this.element.dataset.narrativeLoadingIndicator = 'visible';
    }, this.loadingIndicatorDelayMs);
    this.ensureMounted();
    return readiness;
  }

  private async revealPreparedSurface(
    readiness: NarrativeSurfaceReadiness,
    kind: NarrativeMediaSurfaceKind,
  ): Promise<void> {
    if (this.readiness !== readiness || this.disposed) return;
    if (this.revealPromise) return this.revealPromise;
    readiness.markReady(kind);
    this.syncReadinessTimeline();
    this.element.dataset.narrativeSurfaceReadiness = 'READY';
    this.clearLoadingIndicatorTimer();
    this.revealPromise = (async () => {
      const shield = this.transitionLayer.querySelector<HTMLElement>('.narrative-media-transition');
      shield?.classList.remove('is-covering', 'is-waiting');
      shield?.classList.add('is-revealing');
      if (this.transitionRevealMs > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, this.transitionRevealMs));
      }
      if (this.readiness !== readiness || this.disposed) return;
      this.transitionLayer.replaceChildren();
      delete this.element.dataset.narrativeLoadingIndicator;
      this.element.dataset.narrativeSurfaceReadiness = 'VISIBLE';
      this.element.dataset.narrativeInteraction = 'ACTIVE';
      this.element.removeAttribute('aria-busy');
      this.dialogueLayer.inert = false;
      this.agencyLayer.inert = false;
      readiness.markVisible();
      this.syncReadinessTimeline();
    })();
    return this.revealPromise;
  }

  private createPreparedSceneSurface(image?: string): NarrativeSceneSurface | null {
    if (!this.tableau) return null;
    const surface = new NarrativeSceneSurface(this.mediaLayer, this.tableau);
    if (this.boundDialogue) surface.bindDialogue(this.boundDialogue);
    surface.prepare(image ?? this.tableau.stillImage);
    return surface;
  }

  private clearLoadingIndicatorTimer(): void {
    if (this.loadingIndicatorTimer === null) return;
    window.clearTimeout(this.loadingIndicatorTimer);
    this.loadingIndicatorTimer = null;
  }

  private clearVideoStartupTimer(): void {
    if (this.videoStartupTimer === null) return;
    window.clearTimeout(this.videoStartupTimer);
    this.videoStartupTimer = null;
  }

  private clearPreparationTimers(): void {
    this.clearLoadingIndicatorTimer();
    this.clearVideoStartupTimer();
  }

  private recordReadinessEvent(
    readiness: NarrativeSurfaceReadiness,
    event: Parameters<NarrativeSurfaceReadiness['record']>[0],
  ): void {
    readiness.record(event);
    if (this.readiness === readiness) this.syncReadinessTimeline();
  }

  private syncReadinessTimeline(): void {
    if (!this.readiness) {
      delete this.element.dataset.narrativeMediaTimeline;
      return;
    }
    this.element.dataset.narrativeMediaTimeline = JSON.stringify(this.readiness.timeline);
  }

  private activateMediaPhase(phase: NarrativeMediaPhase): void {
    const beat = this.tableau?.beats.find((candidate) => candidate.mediaPhase === phase);
    if (beat?.dialogueStepId) this.director?.seekDialogueStep(beat.dialogueStepId);
    else if (beat) this.director?.seekKind(beat.kind);
    this.element.dataset.narrativeMediaPhase = phase;
  }

  private updateSettledMediaKind(): void {
    const surface = this.session.frozenSurface;
    if (!surface) {
      this.setMediaSurfaceKind('NONE');
      return;
    }
    if (surface.matches('.cinematic-overlay')) {
      this.setMediaSurfaceKind(surface.dataset.cinematicFreezeSurface === 'canvas' ? 'HELD_VIDEO' : 'FALLBACK');
      return;
    }
    if (surface.matches('canvas, .journey-surface--snapshot, .narrative-media-surface--passive')) {
      this.setMediaSurfaceKind('PASSIVE_BACKDROP');
      return;
    }
    if (surface.matches('.narrative-media-surface--still')) {
      this.setMediaSurfaceKind('STILL');
      return;
    }
    this.setMediaSurfaceKind('FALLBACK');
  }

  private setMediaSurfaceKind(kind: NarrativeMediaSurfaceKind): void {
    this.mediaSurfaceKind = kind;
    this.element.dataset.narrativeMediaSurface = kind;
  }
}
