import type { CinematicPlayer } from '../cinematics/CinematicPlayer';
import type { CinematicRegistry } from '../cinematics/CinematicRegistry';
import type { VideoCinematicResult, VideoCinematicResultReason } from '../cinematics/CinematicTypes';
import type { JourneySession } from '../cinematics/JourneySession';
import { copyNarrativeBackdrop, releaseNarrativeBackdrop } from '../cinematics/JourneyBackdrop';
import { NarrativeStage } from '../cinematics/NarrativeStage';
import { createGenericBoundaryTableau, resolveNarrativeBoundaryTableau, type NarrativeTableauSpec } from '../cinematics/NarrativeTableau';
import type {
  JourneySecondaryActionPresentation,
  JourneySessionState,
} from '../cinematics/JourneyTypes';
import {
  JOURNEY_PRESENTATION_MAP,
  resolveBoundaryCinematic,
  resolveBoundaryPresentationCandidates,
  resolveBoundaryPrimaryPresentation,
  resolveCandidateCinematicIds,
  type JourneyPresentationMap,
} from './JourneyPresentationResolver';
import { planJourneyBoundary, type JourneyBoundaryKind } from './JourneyRunNodeAdapter';
import type { RunNode } from '../game/types';
import type { NarrativeAuthoringMedia } from '../cinematics/NarrativePresentationPolicy';
import type { PlayerFacingSurfaceMode } from '../cinematics/NarrativePresentationMode';

/**
 * Presents one campaign boundary through the CIN-1 Journey runtime and reports what the player
 * pressed. It owns presentation only: it never enters a run node, never mutates GameState and never
 * decides route validity. GameApp re-verifies the reported ID against RunSystem before committing.
 */
export type JourneyBoundaryOutcomeKind = 'node' | 'secondary' | 'terminal' | 'aborted';

export interface JourneyBoundaryOutcome {
  kind: JourneyBoundaryOutcomeKind;
  /** Node ID for `node`, secondary action ID for `secondary`, otherwise null. */
  id: string | null;
  boundary: JourneyBoundaryKind;
  /** The presentation key looked up for this boundary, for diagnostics. */
  presentationKey: string;
  /** The mapped local cinematic, or undefined when the boundary has no reviewed clip yet. */
  cinematicId: string | undefined;
  /** How the cinematic surface settled (`unavailable` when nothing is mapped). */
  surfaceReason: VideoCinematicResultReason;
  trace: readonly JourneySessionState[];
  presentationMode?: PlayerFacingSurfaceMode;
  presentationBeatId?: string;
  fallbackActive: boolean;
}

export interface JourneyBoundaryRequest {
  currentNodeId: string | null;
  currentContentId?: string | null;
  currentLabel?: string;
  available: readonly RunNode[];
  secondary?: readonly JourneySecondaryActionPresentation[];
  reducedMotion?: boolean;
}

type JourneyPresentationSession = Pick<
  JourneySession,
  'state' | 'stateTrace' | 'frozenSurface' | 'presentCinematic' | 'requestAgency' | 'preloadCandidates' | 'dispose'
> & {
  setTableau?: (tableau: NarrativeTableauSpec) => void;
  presentStill?: (image?: string, id?: string) => Promise<VideoCinematicResult>;
  presentPassiveBackdrop?: (backdrop: HTMLElement) => Promise<VideoCinematicResult>;
  presentCinematicBeat?: NarrativeStage['presentCinematicBeat'];
  enterCinematicHold?: NarrativeStage['enterCinematicHold'];
  presentTravelStill?: NarrativeStage['presentTravelStill'];
  setPresentationBeat?: NarrativeStage['setPresentationBeat'];
  preloadPresentationCandidates?: NarrativeStage['preloadPresentationCandidates'];
};

export interface JourneyCampaignBoundaryOptions {
  player: CinematicPlayer;
  registry: CinematicRegistry;
  root?: HTMLElement;
  presentationMap?: JourneyPresentationMap;
  /** Injectable so tests can prove catastrophic Journey failure drops back to TravelView. */
  createSession?: () => JourneyPresentationSession;
  mediaMode?: NarrativeAuthoringMedia;
  /** Test/host timing override; production keeps NarrativeStage's campaign reveal duration. */
  transitionRevealMs?: number;
  dev?: boolean;
}

export class JourneyCampaignBoundary {
  private readonly presentationMap: JourneyPresentationMap;
  private readonly createSession: () => JourneyPresentationSession;
  private session: JourneyPresentationSession | null = null;
  private pendingBackdrop: HTMLElement | null = null;
  private readonly presentedKeys = new Set<string>();
  private surfaceReady: Promise<void> = Promise.resolve();
  private resolveSurfaceReady: (() => void) | null = null;

  constructor(options: JourneyCampaignBoundaryOptions) {
    this.presentationMap = options.presentationMap ?? JOURNEY_PRESENTATION_MAP;
    this.createSession = options.createSession ?? (() => new NarrativeStage({
      player: options.player,
      registry: options.registry,
      mediaMode: options.mediaMode ?? 'VIDEO',
      dev: options.dev ?? false,
      ...(options.transitionRevealMs === undefined ? {} : { transitionRevealMs: options.transitionRevealMs }),
      ...(options.root ? { root: options.root } : {}),
    }));
  }

  get activeState(): JourneySessionState | null {
    return this.session?.state ?? null;
  }

  waitUntilSurfaceReady(): Promise<void> {
    return this.surfaceReady;
  }

  async present(request: JourneyBoundaryRequest): Promise<JourneyBoundaryOutcome> {
    this.surfaceReady = new Promise<void>((resolve) => { this.resolveSurfaceReady = resolve; });
    this.disposeSession();
    const context = {
      currentNodeId: request.currentNodeId,
      currentContentId: request.currentContentId ?? null,
      available: request.available,
    };
    const { key, cinematicId } = resolveBoundaryCinematic(context, this.presentationMap);
    const plan = planJourneyBoundary(request.available, {
      ...(request.currentLabel ? { currentLabel: request.currentLabel } : {}),
      ...(request.secondary ? { secondary: request.secondary } : {}),
    });
    const playId = cinematicId && !this.presentedKeys.has(key) ? cinematicId : undefined;
    const presentationBeat = resolveBoundaryPrimaryPresentation(context, playId);
    const presentationCandidates = resolveBoundaryPresentationCandidates(context);
    const session = this.createSession();
    this.session = session;
    const tableau = resolveNarrativeBoundaryTableau(key) ?? createGenericBoundaryTableau(key, plan.kind);
    if (tableau) session.setTableau?.(tableau);
    const fallbackBackdrop = this.pendingBackdrop;
    this.pendingBackdrop = null;

    let result: VideoCinematicResult;
    try {
      if (playId) {
        const videoBeat = resolveBoundaryPrimaryPresentation({ ...context, available: [] }, playId);
        result = videoBeat?.mode === 'CINEMATIC_VIDEO' && session.presentCinematicBeat
          ? await session.presentCinematicBeat(videoBeat, {
            ...(request.reducedMotion === undefined ? {} : { reducedMotion: request.reducedMotion }),
          }, fallbackBackdrop)
          : await session.presentCinematic(playId, {
            ...(request.reducedMotion === undefined ? {} : { reducedMotion: request.reducedMotion }),
          }, fallbackBackdrop);
        if (presentationBeat?.mode === 'CINEMATIC_HOLD' && session.enterCinematicHold) {
          await session.enterCinematicHold(presentationBeat, tableau.stillImage);
        } else if (presentationBeat?.mode === 'TRAVEL_STILL' && session.presentTravelStill) {
          result = await session.presentTravelStill(presentationBeat, {
            fallbackAsset: tableau.stillImage,
            reducedMotion: request.reducedMotion,
          });
        }
      } else if (presentationBeat?.mode === 'TRAVEL_STILL' && session.presentTravelStill) {
        result = await session.presentTravelStill(presentationBeat, {
          fallbackAsset: tableau.stillImage,
          reducedMotion: request.reducedMotion,
        });
      } else if (presentationBeat?.mode === 'CINEMATIC_HOLD' && fallbackBackdrop && session.presentPassiveBackdrop) {
        result = await session.presentPassiveBackdrop(fallbackBackdrop);
        session.setPresentationBeat?.(presentationBeat);
      } else if (presentationBeat?.mode === 'CINEMATIC_HOLD' && session.enterCinematicHold) {
        result = await session.enterCinematicHold(presentationBeat, tableau.stillImage);
      } else if (presentationBeat?.mode === 'STATIC_TABLEAU' && session.presentStill) {
        session.setPresentationBeat?.(presentationBeat);
        result = await session.presentStill(tableau.stillImage, `narrative-static:${tableau.id}`);
      } else if (tableau.staticFallbackOnly && session.presentStill) {
        result = await session.presentStill(tableau.stillImage, `narrative-static:${tableau.id}`);
      } else if (fallbackBackdrop && session.presentPassiveBackdrop) {
        result = await session.presentPassiveBackdrop(fallbackBackdrop);
      } else {
        result = await session.presentCinematic(playId ?? key, {
          ...(request.reducedMotion === undefined ? {} : { reducedMotion: request.reducedMotion }),
        }, fallbackBackdrop);
      }
    } catch (error) {
      this.signalSurfaceReady();
      throw error;
    }
    this.signalSurfaceReady();
    if (cinematicId) this.presentedKeys.add(key);
    session.preloadPresentationCandidates?.(presentationCandidates);
    session.preloadCandidates(resolveCandidateCinematicIds(context, this.presentationMap));

    const frozenSurface = session.frozenSurface;
    const fallbackActive = frozenSurface?.dataset.fallbackActive === 'true'
      || Boolean(
        frozenSurface
        && (presentationBeat?.mode === 'CINEMATIC_VIDEO' || presentationBeat?.mode === 'CINEMATIC_HOLD')
        && frozenSurface.dataset.cinematicFreezeSurface !== 'canvas',
      )
      || (presentationBeat?.mode === 'TRAVEL_STILL' && !presentationBeat.travelStillSource)
      || (presentationBeat?.mode === 'CINEMATIC_HOLD' && !playId && !fallbackBackdrop);
    const commit = await session.requestAgency(plan.presentation);
    if (commit.kind === 'secondary' && session.frozenSurface) this.captureBackdrop(session.frozenSurface);
    const trace = [...session.stateTrace];
    this.disposeSession();

    const base = {
      boundary: plan.kind,
      presentationKey: key,
      cinematicId,
      surfaceReason: result.reason,
      trace,
      presentationMode: presentationBeat?.mode,
      presentationBeatId: presentationBeat?.beatId,
      fallbackActive,
    };
    if (commit.kind === 'choice' && commit.id) return { kind: 'node', id: commit.id, ...base };
    if (commit.kind === 'secondary' && commit.id) return { kind: 'secondary', id: commit.id, ...base };
    if (commit.kind === 'continue') {
      if (plan.kind === 'single' && plan.singleNodeId) return { kind: 'node', id: plan.singleNodeId, ...base };
      if (plan.kind === 'terminal') return { kind: 'terminal', id: null, ...base };
    }
    // No affordance can be read as a route: anything else is explicitly no decision.
    return { kind: 'aborted', id: null, ...base };
  }

  /** Releases the Journey surface, overlay, listeners and every preloaded candidate. */
  dispose(): void {
    this.signalSurfaceReady();
    this.disposeSession();
    releaseNarrativeBackdrop(this.pendingBackdrop);
    this.pendingBackdrop = null;
  }

  /** Captures a passive decoder-free copy of the held cinematic for the next boundary. */
  captureBackdrop(surface: HTMLElement): boolean {
    const snapshot = copyNarrativeBackdrop(surface);
    if (!snapshot) return false;
    releaseNarrativeBackdrop(this.pendingBackdrop);
    this.pendingBackdrop = snapshot;
    return true;
  }

  markCinematicPresented(cinematicId: string): void {
    for (const [key, mappedId] of Object.entries(this.presentationMap)) {
      if (mappedId === cinematicId) this.presentedKeys.add(key);
    }
  }

  private disposeSession(): void {
    this.session?.dispose();
    this.session = null;
  }

  private signalSurfaceReady(): void {
    this.resolveSurfaceReady?.();
    this.resolveSurfaceReady = null;
  }
}
