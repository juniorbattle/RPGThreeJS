import type { RunNode } from '../game/types';

/**
 * PURE presentation resolver: "which cinematic corresponds to this campaign boundary?"
 *
 * It answers with a local cinematic ID or nothing. It never derives, reads back into, or changes
 * game truth — a missing mapping simply means the Journey surface degrades, never that progression
 * is blocked.
 *
 * CIN-2 ships the production map EMPTY on purpose. Real reviewed pilot media is a CIN-3 gate, so no
 * campaign boundary claims cinematic coverage yet.
 */
export type JourneyPresentationCategory = 'node' | 'edge' | 'content' | 'state';

export type JourneyPresentationMap = Readonly<Record<string, string>>;

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
 * PRODUCTION MAPPINGS — intentionally empty in CIN-2.
 *
 * Populating this belongs to CIN-3, once real reviewed clips exist and ship locally. Nothing here
 * may reference a cinematic that is not already present in the shipped manifest.
 */
export const JOURNEY_PRESENTATION_MAP: JourneyPresentationMap = Object.freeze({});

export function resolveJourneyPresentation(
  key: string,
  map: JourneyPresentationMap = JOURNEY_PRESENTATION_MAP,
): string | undefined {
  return map[key];
}

export interface JourneyBoundaryPresentationContext {
  /** The boundary the player currently stands on, when known. */
  currentNodeId: string | null;
  /** The resolved content of the current boundary, when known. */
  currentContentId?: string | null;
  available: readonly RunNode[];
}

/**
 * Ordered lookup for the current boundary: arrival first, then the resolved content reveal.
 * The first mapped key wins; an unmapped boundary resolves to `undefined`.
 */
export function resolveBoundaryCinematic(
  context: JourneyBoundaryPresentationContext,
  map: JourneyPresentationMap = JOURNEY_PRESENTATION_MAP,
): { key: string; cinematicId: string | undefined } {
  const keys: string[] = [];
  if (context.currentNodeId) keys.push(nodeArrivalKey(context.currentNodeId));
  if (context.currentContentId) keys.push(contentRevealKey(context.currentContentId));
  for (const key of keys) {
    const cinematicId = map[key];
    if (cinematicId) return { key, cinematicId };
  }
  return { key: keys[0] ?? 'node:unknown:arrival', cinematicId: undefined };
}

/**
 * Candidate clips worth preparing while the player decides: the edge to each available successor,
 * then that successor's arrival. Only mapped local IDs are returned, deduplicated in order, so an
 * empty production map preloads nothing at all.
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
  }
  return ids;
}
