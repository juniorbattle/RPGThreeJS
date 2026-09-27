import type { TraversalLane } from './TraversalRunRuntime';

/** Ephemeral motion only. Campaign stages and rewards belong to RunSystem. */
export interface TraversalRouteSegment {
  readonly id: string;
  readonly durationMs: number;
  readonly vMin: number;
  readonly vMax: number;
  readonly nextCheckpointId?: string;
  readonly routeVariant?: string;
}

export interface TraversalRouteRunState {
  readonly segmentId: string;
  readonly segmentIndex: number;
  readonly elapsedMs: number;
  readonly progress01: number;
  readonly speed: number;
  readonly lane: TraversalLane;
  readonly complete: boolean;
  readonly speedResetAtMs: number;
}

function requireSegment(segment: TraversalRouteSegment): void {
  if (!segment.id || !Number.isFinite(segment.durationMs) || segment.durationMs <= 0
    || !Number.isFinite(segment.vMin) || segment.vMin <= 0
    || !Number.isFinite(segment.vMax) || segment.vMax < segment.vMin) {
    throw new Error(`Invalid Traversal route segment: ${segment.id}`);
  }
}

function speedAt(segment: TraversalRouteSegment, elapsedMs: number, resetAtMs: number): number {
  const progress = Math.min(1, Math.max(0, (elapsedMs - resetAtMs) / segment.durationMs));
  // The late rise gives each road a cruise and an obvious final rush.
  const crescendo = progress * progress * (3 - 2 * progress);
  return segment.vMin + (segment.vMax - segment.vMin) * crescendo;
}

export function createRouteRun(segment: TraversalRouteSegment, segmentIndex: number,
  lane: TraversalLane = 0): TraversalRouteRunState {
  requireSegment(segment);
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0) throw new Error('Invalid route segment index.');
  return Object.freeze({ segmentId: segment.id, segmentIndex, elapsedMs: 0, progress01: 0,
    speed: segment.vMin, lane, complete: false, speedResetAtMs: 0 });
}

export function advanceRouteRun(state: TraversalRouteRunState, segment: TraversalRouteSegment,
  deltaMs: number): TraversalRouteRunState {
  requireSegment(segment);
  if (state.segmentId !== segment.id) throw new Error('Route state and segment mismatch.');
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new Error('Invalid route delta.');
  if (deltaMs === 0 || state.complete) return state;
  const elapsedMs = Math.min(segment.durationMs, state.elapsedMs + deltaMs);
  const progress01 = elapsedMs / segment.durationMs;
  return Object.freeze({ ...state, elapsedMs, progress01,
    speed: speedAt(segment, elapsedMs, state.speedResetAtMs), complete: progress01 === 1 });
}

export function resetRouteSpeed(state: TraversalRouteRunState,
  segment: TraversalRouteSegment): TraversalRouteRunState {
  requireSegment(segment);
  if (state.segmentId !== segment.id) throw new Error('Route state and segment mismatch.');
  return state.complete ? state : Object.freeze({ ...state, speed: segment.vMin,
    speedResetAtMs: state.elapsedMs });
}

export function setRouteLane(state: TraversalRouteRunState, lane: TraversalLane): TraversalRouteRunState {
  return lane === state.lane ? state : Object.freeze({ ...state, lane });
}

export function completeRouteSegment(state: TraversalRouteRunState,
  segment: TraversalRouteSegment): TraversalRouteRunState {
  return advanceRouteRun(state, segment, segment.durationMs - state.elapsedMs);
}
