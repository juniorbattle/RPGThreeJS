import type { TraversalLane } from './TraversalRunRuntime';

/** Ephemeral motion only. Campaign stages and rewards belong to RunSystem. */
export interface TraversalRouteSegment {
  readonly id: string;
  readonly durationMs: number;
  readonly vMin: number;
  readonly vMax: number;
  /** Fixed momentum recovery; never changes the route clock. */
  readonly speedRecoveryMs?: number;
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

export const DEFAULT_ROUTE_SPEED_RECOVERY_MS = 2400;

function requireSegment(segment: TraversalRouteSegment): void {
  if (!segment.id || !Number.isFinite(segment.durationMs) || segment.durationMs <= 0
    || !Number.isFinite(segment.vMin) || segment.vMin <= 0
    || !Number.isFinite(segment.vMax) || segment.vMax < segment.vMin
    || (segment.speedRecoveryMs !== undefined && (!Number.isFinite(segment.speedRecoveryMs)
      || segment.speedRecoveryMs <= 0))) {
    throw new Error(`Invalid Traversal route segment: ${segment.id}`);
  }
}

export function baseRouteSpeedAt(segment: TraversalRouteSegment, elapsedMs: number): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / segment.durationMs));
  // The late rise gives each road a cruise and an obvious final rush.
  const crescendo = progress * progress * (3 - 2 * progress);
  return segment.vMin + (segment.vMax - segment.vMin) * crescendo;
}

export function routeSpeedRecovery01(state: TraversalRouteRunState,
  segment: TraversalRouteSegment): number {
  return state.speedResetAtMs < 0 ? 1 : Math.min(1, Math.max(0,
    (state.elapsedMs - state.speedResetAtMs)
      / (segment.speedRecoveryMs ?? DEFAULT_ROUTE_SPEED_RECOVERY_MS)));
}

function speedAt(segment: TraversalRouteSegment, elapsedMs: number, resetAtMs: number): number {
  const base = baseRouteSpeedAt(segment, elapsedMs);
  if (resetAtMs < 0) return base;
  const recovery = Math.min(1, Math.max(0,
    (elapsedMs - resetAtMs) / (segment.speedRecoveryMs ?? DEFAULT_ROUTE_SPEED_RECOVERY_MS)));
  const eased = recovery * recovery * (3 - 2 * recovery);
  return segment.vMin + (base - segment.vMin) * eased;
}

export function createRouteRun(segment: TraversalRouteSegment, segmentIndex: number,
  lane: TraversalLane = 0): TraversalRouteRunState {
  requireSegment(segment);
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0) throw new Error('Invalid route segment index.');
  return Object.freeze({ segmentId: segment.id, segmentIndex, elapsedMs: 0, progress01: 0,
    speed: segment.vMin, lane, complete: false, speedResetAtMs: -1 });
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

/** Forecast only the current visual road distance to an authored contact point. */
export function forecastRouteDistance(state: TraversalRouteRunState,
  segment: TraversalRouteSegment, contactProgress01: number): number {
  requireSegment(segment);
  if (state.segmentId !== segment.id) throw new Error('Route state and segment mismatch.');
  const targetMs = Math.min(segment.durationMs, Math.max(state.elapsedMs,
    contactProgress01 * segment.durationMs));
  let sample = state;
  let distance = 0;
  while (sample.elapsedMs < targetMs) {
    const next = advanceRouteRun(sample, segment, Math.min(40, targetMs - sample.elapsedMs));
    distance += (sample.speed + next.speed) / 2 * (next.elapsedMs - sample.elapsedMs) * .28;
    sample = next;
  }
  return distance;
}
