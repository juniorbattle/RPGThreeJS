import type { RunNode } from '../game/types';
import { resolveCin6cContentCandidateId } from '../cinematics/Cin6aPresentation';
import { resolveCinematicPresentation, resolveEdgePresentation } from '../cinematics/NarrativePresentationResolver';
import type { ResolvedPresentationBeat } from '../cinematics/NarrativePresentationMode';

/**
 * PURE presentation resolver: "which cinematic corresponds to this campaign boundary?"
 *
 * It answers with a local cinematic ID or nothing. It never derives, reads back into, or changes
 * game truth — a missing mapping simply means the Journey surface degrades, never that progression
 * is blocked.
 *
 * CIN-6A populates only reviewed local Journey-node presentation seams. TravelView never reads
 * this map, and lifecycle clips (dialogue/combat/refuge/ending) remain in their own resolvers.
 */
export type JourneyPresentationCategory = 'node' | 'edge' | 'content' | 'state';

/** `null` registers an authored static-only boundary without inventing a runtime media ID. */
export type JourneyPresentationMap = Readonly<Record<string, string | null>>;

/** `node:<nodeId>:arrival` — arriving at a campaign boundary. */
export function nodeArrivalKey(nodeId: string): string {
  return `node:${nodeId}:arrival`;
}

/** `edge:<fromNodeId>><toNodeId>` — travelling a specific route edge. */
export function edgeKey(fromNodeId: string, toNodeId: string): string {
  return `edge:${fromNodeId}>${toNodeId}`;
}

/** `content:<contentId>:reveal` — revealing resolved node content. */
export function contentRevealKey(contentId: string): string {
  return `content:${contentId}:reveal`;
}

/** `state:<fact>:<variant>` — a presentation-relevant historical fact. */
export function stateKey(fact: string, variant: string): string {
  return `state:${fact}:${variant}`;
}

/**
 * REVIEWED CIN-6A JOURNEY BOUNDARIES.
 *
 * These are the moving/frozen contexts used by the initial continuation and three real route
 * choices. Every ID is local and present in the shipped manifest; missing media still degrades.
 */
export const JOURNEY_PRESENTATION_MAP: JourneyPresentationMap = Object.freeze({
  [nodeArrivalKey('lion-camp')]: 'camp_departure',
  [edgeKey('lion-audience', 'lion-opening-ambush')]: null,
  [nodeArrivalKey('lion-refugees')]: 'refugees_approach',
  [nodeArrivalKey('lion-valmir-road')]: 'valmir_route_fork',
  [nodeArrivalKey('lion-witnesses')]: 'witnesses_encounter',
});

export function resolveJourneyPresentation(
  key: string,
  map: JourneyPresentationMap = JOURNEY_PRESENTATION_MAP,
): string | undefined {
  return map[key] ?? undefined;
}

export interface JourneyBoundaryPresentationContext {
  /** The boundary the player currently stands on, when known. */
  currentNodeId: string | null;
  /** The resolved content of the current boundary, when known. */
  currentContentId?: string | null;
  available: readonly RunNode[];
}

/**
 * Ordered lookup for the current boundary: arrival first, then the resolved content reveal, then
 * an authored sole-successor edge. A `null` map entry intentionally selects a static-only beat.
 */
export function resolveBoundaryCinematic(
  context: JourneyBoundaryPresentationContext,
  map: JourneyPresentationMap = JOURNEY_PRESENTATION_MAP,
): { key: string; cinematicId: string | undefined } {
  const keys: string[] = [];
  if (context.currentNodeId) keys.push(nodeArrivalKey(context.currentNodeId));
  if (context.currentContentId) keys.push(contentRevealKey(context.currentContentId));
  if (context.currentNodeId && context.available.length === 1) {
    keys.push(edgeKey(context.currentNodeId, context.available[0]!.id));
  }
  for (const key of keys) {
    const cinematicId = map[key];
    if (Object.prototype.hasOwnProperty.call(map, key)) return { key, cinematicId: cinematicId ?? undefined };
  }
  return { key: keys[0] ?? 'node:unknown:arrival', cinematicId: undefined };
}

/**
 * Candidate clips worth preparing while the player decides: the edge to each available successor,
 * then that successor's arrival. Only mapped local IDs are returned, deduplicated in order, so an
 * unmapped successor preloads nothing at all.
 */
export function resolveCandidateCinematicIds(
  context: JourneyBoundaryPresentationContext,
  map: JourneyPresentationMap = JOURNEY_PRESENTATION_MAP,
): string[] {
  const ids: string[] = [];
  for (const node of context.available) {
    const candidates = context.currentNodeId
      ? [edgeKey(context.currentNodeId, node.id), nodeArrivalKey(node.id)]
      : [nodeArrivalKey(node.id)];
    for (const key of candidates) {
      const cinematicId = map[key];
      if (cinematicId && !ids.includes(cinematicId)) ids.push(cinematicId);
    }
    const contentCinematicId = resolveCin6cContentCandidateId(node.contentId);
    if (contentCinematicId && !ids.includes(contentCinematicId)) ids.push(contentCinematicId);
  }
  return ids;
}

/** Exact runtime modes for only the successors that RunSystem has already made available. */
export function resolveBoundaryPresentationCandidates(
  context: JourneyBoundaryPresentationContext,
): readonly ResolvedPresentationBeat[] {
  if (!context.currentNodeId) return [];
  return context.available
    .map((node) => resolveEdgePresentation(context.currentNodeId!, node.id))
    .filter((beat): beat is ResolvedPresentationBeat => Boolean(beat));
}

export function resolveBoundaryPrimaryPresentation(
  context: JourneyBoundaryPresentationContext,
  cinematicId?: string,
): ResolvedPresentationBeat | undefined {
  const candidates = resolveBoundaryPresentationCandidates(context);
  if (candidates.length) {
    const modes = new Set(candidates.map((beat) => beat.mode));
    const families = new Set(candidates.map((beat) => beat.visualFamily));
    if (modes.size === 1 && families.size === 1) return candidates[0];
  }
  return cinematicId ? resolveCinematicPresentation(cinematicId) : undefined;
}
