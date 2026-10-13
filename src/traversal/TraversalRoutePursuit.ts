import type { TraversalLane } from './TraversalRunRuntime';

export interface TraversalPursuitLanePhase {
  readonly fromProgress01: number;
  readonly lane: TraversalLane;
}

export interface TraversalRoutePursuitWindow {
  readonly id: string;
  readonly segmentId: string;
  readonly startProgress01: number;
  readonly endProgress01: number;
  readonly startPressure01: number;
  readonly lanePhases: readonly TraversalPursuitLanePhase[];
}

export interface TraversalRoutePursuitState {
  readonly segmentId: string;
  readonly activeWindowId: string | null;
  readonly pressure01: number;
  readonly resolvedWindowIds: readonly string[];
  readonly escapedWindowIds: readonly string[];
  readonly caughtWindowIds: readonly string[];
  readonly caughtCount: number;
}

export interface TraversalRoutePursuitOutcome {
  readonly windowId: string;
  readonly result: 'STARTED' | 'CAUGHT' | 'ESCAPED' | 'COMMITTED_CHARGE';
  readonly pressure01: number;
}

export const PURSUIT_SAME_LANE_PER_SECOND = .11;
export const PURSUIT_OPPOSITE_LANE_PER_SECOND = -.075;
export const PURSUIT_COLLISION_PRESSURE = .22;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function createRoutePursuit(segmentId: string): TraversalRoutePursuitState {
  return Object.freeze({ segmentId, activeWindowId: null, pressure01: 0,
    resolvedWindowIds: Object.freeze([]), escapedWindowIds: Object.freeze([]),
    caughtWindowIds: Object.freeze([]), caughtCount: 0 });
}

export function pursuerLaneAt(window: TraversalRoutePursuitWindow,
  progress01: number): TraversalLane {
  let lane = window.lanePhases[0]!.lane;
  for (const phase of window.lanePhases) {
    if (phase.fromProgress01 > progress01) break;
    lane = phase.lane;
  }
  return lane;
}

/** Integrates only the portion of the step inside the authored window, split at lane changes. */
export function resolveRoutePursuit(state: TraversalRoutePursuitState,
  window: TraversalRoutePursuitWindow | undefined, previousProgress01: number,
  nextProgress01: number, caravanLane: TraversalLane, deltaMs: number,
  collisionCountDelta: number, activeDriving: boolean, chargeAtWindowEnd = false): {
    readonly state: TraversalRoutePursuitState;
    readonly outcomes: readonly TraversalRoutePursuitOutcome[];
  } {
  if (!activeDriving || !window || window.segmentId !== state.segmentId
    || state.resolvedWindowIds.includes(window.id) || nextProgress01 <= previousProgress01)
    return { state, outcomes: [] };
  if (!Number.isFinite(deltaMs) || deltaMs < 0 || !Number.isInteger(collisionCountDelta)
    || collisionCountDelta < 0) throw new Error('Invalid route pursuit step.');
  const start = window.startProgress01;
  const end = window.endProgress01;
  const started = state.activeWindowId !== window.id;
  if (started && !(previousProgress01 < start && nextProgress01 >= start))
    return { state, outcomes: [] };
  const from = Math.max(previousProgress01, start);
  const to = Math.min(nextProgress01, end);
  if (to < from || (to === from && !(previousProgress01 < start && nextProgress01 === start)))
    return { state, outcomes: [] };
  let pressure = started ? window.startPressure01 : state.pressure01;
  const outcomes: TraversalRoutePursuitOutcome[] = [];
  if (started) outcomes.push(Object.freeze({ windowId: window.id, result: 'STARTED', pressure01: pressure }));

  const boundaries = [from, ...window.lanePhases.map(phase => phase.fromProgress01)
    .filter(progress => progress > from && progress < to), to];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const phaseFrom = boundaries[index]!;
    const phaseTo = boundaries[index + 1]!;
    const seconds = (phaseTo - phaseFrom) / (nextProgress01 - previousProgress01) * deltaMs / 1000;
    pressure = clamp01(pressure + seconds * (caravanLane === pursuerLaneAt(window, phaseFrom)
      ? PURSUIT_SAME_LANE_PER_SECOND : PURSUIT_OPPOSITE_LANE_PER_SECOND));
    if (pressure >= 1) break;
  }
  pressure = clamp01(pressure + collisionCountDelta * PURSUIT_COLLISION_PRESSURE);
  const charge = chargeAtWindowEnd && nextProgress01 >= end;
  const caught = !chargeAtWindowEnd && pressure >= 1;
  const escaped = !chargeAtWindowEnd && !caught && nextProgress01 >= end;
  if (caught || escaped || charge) outcomes.push(Object.freeze({ windowId: window.id,
    result: charge ? 'COMMITTED_CHARGE' : caught ? 'CAUGHT' : 'ESCAPED', pressure01: pressure }));
  const resolvedWindowIds = caught || escaped || charge
    ? Object.freeze([...state.resolvedWindowIds, window.id]) : state.resolvedWindowIds;
  return { state: Object.freeze({ segmentId: state.segmentId,
    activeWindowId: caught || escaped || charge ? null : window.id,
    pressure01: pressure, resolvedWindowIds,
    caughtWindowIds: caught ? Object.freeze([...state.caughtWindowIds, window.id]) : state.caughtWindowIds,
    escapedWindowIds: escaped ? Object.freeze([...state.escapedWindowIds, window.id]) : state.escapedWindowIds,
    caughtCount: state.caughtCount + Number(caught) }), outcomes: Object.freeze(outcomes) };
}
