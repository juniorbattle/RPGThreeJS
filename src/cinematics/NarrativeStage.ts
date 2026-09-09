import { NarrativeBeatDirector } from './NarrativeBeatDirector';
import type { CinematicPlayer } from './CinematicPlayer';
import { CinematicPreloader } from './CinematicPreloader';
import type { CinematicRegistry } from './CinematicRegistry';
import type { VideoCinematicPlaybackOptions, VideoCinematicResult } from './CinematicTypes';
import { JourneySession } from './JourneySession';
import type { JourneyAgencyPresentation, JourneyCommit, JourneySessionState } from './JourneyTypes';
import { isNarrativeBeatInteractive, type NarrativeDialogueMode, type NarrativeMediaPhase, type NarrativeTableauSpec, type NarrativeTransitionKind } from './NarrativeTableau';
import { NarrativeUtilityDock } from './NarrativeUtilityDock';

export type NarrativeMediaSurfaceKind = 'LIVE_CANVAS' | 'HELD_FRAME' | 'PASSIVE_BACKDROP' | 'PAINTED_FALLBACK' | 'NONE';

export interface NarrativeStageOptions {
  player: CinematicPlayer;
  registry: CinematicRegistry;
  root?: HTMLElement;
  preloader?: CinematicPreloader;
  onStateChange?: (state: JourneySessionState, previous: JourneySessionState) => void;
}

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
  private director: NarrativeBeatDirector | null = null;
  private tableau: NarrativeTableauSpec | null = null;
  private mounted = false;
  private disposed = false;
  private activeMediaId: string | null = null;
  private mediaSurfaceKind: NarrativeMediaSurfaceKind = 'NONE';

  constructor(options: NarrativeStageOptions) {
    this.root = options.root ?? document.body;
    this.player = options.player;
    this.element.className = 'narrative-stage';
    this.element.setAttribute('aria-label', 'Scène narrative');
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

  setTableau(tableau: NarrativeTableauSpec): void {
    if (this.disposed) return;
    this.tableau = tableau;
    this.element.dataset.narrativeTableau = tableau.id;
    this.element.dataset.narrativeGrammar = tableau.grammar;
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

  async presentCinematic(
    id: string,
    options: VideoCinematicPlaybackOptions = {},
    fallbackBackdrop: HTMLElement | null = null,
    phase: NarrativeMediaPhase = 'INTRO_MEDIA',
  ): Promise<VideoCinematicResult> {
    this.ensureMounted();
    if (this.disposed) return { id, reason: 'aborted', played: false };
    this.activateMediaPhase(phase);
    this.setMediaSurfaceKind('LIVE_CANVAS');
    this.activeMediaId = id;
    try {
      const result = await this.session.presentCinematic(id, { ...options, root: this.mediaLayer }, fallbackBackdrop);
      this.updateSettledMediaKind();
      return result;
    } finally {
      if (this.activeMediaId === id) this.activeMediaId = null;
    }
  }

  async presentPaintedFallback(title: string, image?: string): Promise<VideoCinematicResult> {
    const backdrop = document.createElement('div');
    backdrop.className = 'narrative-media-surface narrative-media-surface--painted';
    backdrop.dataset.narrativeFallback = title;
    backdrop.setAttribute('aria-hidden', 'true');
    if (image) backdrop.style.backgroundImage = `url("${image}")`;
    return this.presentCinematic(`narrative-fallback:${this.tableau?.id ?? title}`, { reducedMotion: false, passive: true }, backdrop);
  }

  async presentPassiveBackdrop(backdrop: HTMLElement): Promise<VideoCinematicResult> {
    backdrop.classList.add('narrative-media-surface', 'narrative-media-surface--passive');
    backdrop.setAttribute('aria-hidden', 'true');
    return this.presentCinematic(`narrative-backdrop:${this.tableau?.id ?? 'passive'}`, { reducedMotion: false, passive: true }, backdrop);
  }

  requestAgency(presentation: JourneyAgencyPresentation): Promise<JourneyCommit> {
    this.ensureMounted();
    const targetKind = presentation.mode === 'branch' ? 'ROUTE_CHOICE' : 'CONTEXT_ACTION';
    this.director?.seekKind(targetKind);
    const result = this.session.requestAgency(presentation);
    const utility = this.session.agencyOverlay?.utilityElement;
    if (utility && !utility.hidden && utility.childElementCount) this.utilityDock.mount(utility);
    return result.finally(() => this.utilityDock.dispose());
  }

  activateDialogueStep(stepId: string, mode: NarrativeDialogueMode, anchorId?: string): void {
    this.ensureMounted();
    this.director?.seekDialogueStep(stepId);
    this.element.dataset.narrativeDialogueMode = mode;
    this.element.dataset.narrativeDialogueStep = stepId;
    if (anchorId) this.element.dataset.narrativeAnchor = anchorId;
    else delete this.element.dataset.narrativeAnchor;
  }

  beginTransition(transition: NarrativeTransitionKind): void {
    this.ensureMounted();
    this.director?.seekKind('TRANSITION');
    this.element.dataset.narrativeTransition = transition;
    this.transitionLayer.dataset.transition = transition;
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
    if (this.activeMediaId && this.player.activeId === this.activeMediaId) this.player.skip();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.utilityDock.dispose();
    this.director?.dispose();
    this.director = null;
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
    this.mediaSurfaceKind = 'NONE';
  }

  private ensureMounted(): void {
    if (this.mounted || this.disposed) return;
    this.root.append(this.element);
    this.mounted = true;
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
      this.setMediaSurfaceKind(surface.dataset.cinematicFreezeSurface === 'canvas' ? 'HELD_FRAME' : 'PAINTED_FALLBACK');
      return;
    }
    if (surface.matches('canvas, .journey-surface--snapshot, .narrative-media-surface--passive')) {
      this.setMediaSurfaceKind('PASSIVE_BACKDROP');
      return;
    }
    this.setMediaSurfaceKind('PAINTED_FALLBACK');
  }

  private setMediaSurfaceKind(kind: NarrativeMediaSurfaceKind): void {
    this.mediaSurfaceKind = kind;
    this.element.dataset.narrativeMediaSurface = kind;
  }
}
