import type { RunNode } from '../game/types';

/**
 * PURE authorization guard for the single route-commit path.
 *
 * Route validity is decided against RunSystem, never against the DOM. A stale callback, a detached
 * overlay, a duplicated click or a call from an unauthorized presentation mode can therefore never
 * advance the campaign, even if every UI protection fails at once.
 */
export const ROUTE_COMMIT_MODES = Object.freeze(['TRAVEL', 'JOURNEY'] as const);

export type RouteCommitMode = typeof ROUTE_COMMIT_MODES[number];

export type RouteCommitRejection = 'unauthorized-mode' | 'commit-in-flight' | 'unavailable-node';

export type RouteCommitDecision =
  | { authorized: true; node: RunNode }
  | { authorized: false; rejection: RouteCommitRejection };

export interface RouteCommitGuardInput {
  mode: string;
  commitInFlight: boolean;
  nodeId: string;
  /** Called only once the cheap authorization checks pass, so RunSystem is not queried needlessly. */
  listAvailable: () => readonly RunNode[];
}

export function isRouteCommitMode(mode: string): mode is RouteCommitMode {
  return (ROUTE_COMMIT_MODES as readonly string[]).includes(mode);
}

export function evaluateRouteCommit(input: RouteCommitGuardInput): RouteCommitDecision {
  if (!isRouteCommitMode(input.mode)) return { authorized: false, rejection: 'unauthorized-mode' };
  if (input.commitInFlight) return { authorized: false, rejection: 'commit-in-flight' };
  if (!input.nodeId) return { authorized: false, rejection: 'unavailable-node' };
  const node = input.listAvailable().find((candidate) => candidate.id === input.nodeId);
  if (!node) return { authorized: false, rejection: 'unavailable-node' };
  return { authorized: true, node };
}
