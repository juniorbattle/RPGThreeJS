import type { CinematicPlayer } from '../cinematics/CinematicPlayer';
import type { CinematicRegistry } from '../cinematics/CinematicRegistry';
import type { VideoCinematicResultReason } from '../cinematics/CinematicTypes';
import type { JourneySession } from '../cinematics/JourneySession';
import { copyNarrativeBackdrop, releaseNarrativeBackdrop } from '../cinematics/JourneyBackdrop';
import { NarrativeStage } from '../cinematics/NarrativeStage';
import { resolveNarrativeBoundaryTableau, type NarrativeTableauSpec } from '../cinematics/NarrativeTableau';
import type {
  JourneySecondaryActionPresentation,
  JourneySessionState,
} from '../cinematics/JourneyTypes';
import {
  JOURNEY_PRESENTATION_MAP,
  resolveBoundaryCinematic,
  resolveCandidateCinematicIds,
  type JourneyPresentationMap,
} from './JourneyPresentationResolver';
import { planJourneyBoundary, type JourneyBoundaryKind } from './JourneyRunNodeAdapter';
import type { RunNode } from '../game/types';

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
> & { setTableau?: (tableau: NarrativeTableauSpec) => void };

export interface JourneyCampaignBoundaryOptions {
  player: CinematicPlayer;
  registry: CinematicRegistry;
  root?: HTMLElement;
  presentationMap?: JourneyPresentationMap;
  /** Injectable so tests can prove catastrophic Journey failure drops back to TravelView. */
  createSession?: () => JourneyPresentationSession;
}

export class JourneyCampaignBoundary {
  private readonly presentationMap: JourneyPresentationMap;
  private readonly createSession: () => JourneyPresentationSession;
  private session: JourneyPresentationSession | null = null;
  private pendingBackdrop: HTMLElement | null = null;
  private readonly presentedKeys = new Set<string>();

  constructor(options: JourneyCampaignBoundaryOptions) {
    this.presentationMap = options.presentationMap ?? JOURNEY_PRESENTATION_MAP;
    this.createSession = options.createSession ?? (() => new NarrativeStage({
      player: options.player,
      registry: options.registry,
      ...(options.root ? { root: options.root } : {}),
    }));
  }

  get activeState(): JourneySessionState | null {
    return this.session?.state ?? null;
  }

  async present(request: JourneyBoundaryRequest): Promise<JourneyBoundaryOutcome> {
    this.disposeSession();
    const context = {
      currentNodeId: request.currentNodeId,
      currentContentId: request.currentContentId ?? null,
      available: request.available,
    };
    const { key, cinematicId } = resolveBoundaryCinematic(context, this.presentationMap);
    const playId = cinematicId && !this.presentedKeys.has(key) ? cinematicId : undefined;
    const session = this.createSession();
    this.session = session;
    const tableau = resolveNarrativeBoundaryTableau(key);
    if (tableau) session.setTableau?.(tableau);
    const fallbackBackdrop = this.pendingBackdrop;
    this.pendingBackdrop = null;

    // An unmapped boundary resolves to no descriptor, so CIN-1 degrades to its neutral safe surface.
    const result = await session.presentCinematic(playId ?? key, {
      ...(request.reducedMotion === undefined ? {} : { reducedMotion: request.reducedMotion }),
    }, fallbackBackdrop);
    if (cinematicId) this.presentedKeys.add(key);
    session.preloadCandidates(resolveCandidateCinematicIds(context, this.presentationMap));

    const plan = planJourneyBoundary(request.available, {
      ...(request.currentLabel ? { currentLabel: request.currentLabel } : {}),
      ...(request.secondary ? { secondary: request.secondary } : {}),
    });
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

  private disposeSession(): void {
    this.session?.dispose();
    this.session = null;
  }
}
