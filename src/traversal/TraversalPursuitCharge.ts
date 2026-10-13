import type { TraversalLane } from './TraversalRunRuntime';

/** Presentation-only charge. All positions use the same logical ground coordinates.
 * CONTACT observes geometry only; it cannot resolve a battle or substitute for an authored mapping.
 * Inputs are constant within a step: split steps at lane, caravan-geometry or viewport changes.
 * The active caravan remains inside the viewport; unsupported geometry/arithmetic fails closed.
 */
export interface TraversalPursuitCharge {
  readonly windowId: string;
  readonly lane: TraversalLane;
  readonly phase: 'CHARGING' | 'COLLISION_PENDING' | 'EXITED';
  readonly left: number;
  readonly speed: number;
  readonly acceleration: number;
  readonly elapsedSeconds: number;
}

export interface TraversalChargeGeometry {
  readonly caravanLane: TraversalLane;
  readonly caravanLeft: number;
  readonly caravanRight: number;
  readonly pursuerWidth: number;
  readonly viewportRight: number;
  /** No discrete-lane collision while the caravan is visibly between lanes. */
  readonly contactEnabled?: boolean;
}

export interface TraversalChargeObservation {
  readonly windowId: string;
  readonly lane: TraversalLane;
  readonly kind: 'CONTACT' | 'MISS_EXITED';
}

function finite(value: number): boolean { return Number.isFinite(value); }
function laneValid(lane: TraversalLane): boolean { return lane === 0 || lane === 1; }

export function createPursuitCharge(input: {
  readonly windowId: string; readonly lane: TraversalLane; readonly left: number;
  readonly speed: number; readonly acceleration: number;
}): TraversalPursuitCharge {
  if (!input.windowId.trim() || !laneValid(input.lane) || !finite(input.left)
    || !finite(input.speed) || input.speed <= 0 || !finite(input.speed * input.speed)
    || !finite(input.acceleration) || input.acceleration <= 0) {
    throw new Error('Invalid authored Pursuit charge input.');
  }
  return Object.freeze({ ...input, phase: 'CHARGING', elapsedSeconds: 0 });
}

/** Earliest crossing time, using the stable positive root of distance = v*t + a*t*t/2. */
function crossingSeconds(distance: number, speed: number, acceleration: number): number {
  if (distance <= 0) return 0;
  const discriminant = speed * speed + 2 * acceleration * distance;
  if (!finite(discriminant) || !finite(2 * distance)) throw new Error('Invalid Pursuit charge arithmetic scale.');
  return 2 * distance / (speed + Math.sqrt(discriminant));
}

export function advancePursuitCharge(state: TraversalPursuitCharge, seconds: number,
  geometry: TraversalChargeGeometry, active = true): {
    readonly state: TraversalPursuitCharge; readonly observations: readonly TraversalChargeObservation[];
  } {
  if (!finite(seconds) || seconds < 0 || !laneValid(geometry.caravanLane)
    || !finite(geometry.caravanLeft) || !finite(geometry.caravanRight)
    || geometry.caravanRight <= geometry.caravanLeft || !finite(geometry.pursuerWidth)
    || geometry.pursuerWidth <= 0 || !finite(geometry.viewportRight) || geometry.viewportRight <= 0
    || geometry.caravanRight > geometry.viewportRight) {
    throw new Error('Invalid Pursuit charge step geometry.');
  }
  if (!active || seconds === 0 || state.phase !== 'CHARGING') return { state, observations: [] };

  const exitLeft = Math.max(state.left, geometry.viewportRight);
  const exitAt = crossingSeconds(exitLeft - state.left, state.speed, state.acceleration);
  const canContact = geometry.contactEnabled !== false && state.lane === geometry.caravanLane && state.left <= geometry.caravanRight;
  const contactLeft = Math.max(state.left, geometry.caravanLeft - geometry.pursuerWidth);
  const contactAt = canContact
    ? crossingSeconds(contactLeft - state.left, state.speed, state.acceleration) : Infinity;
  const contact = contactAt <= exitAt;
  const eventAt = Math.min(contactAt, exitAt);
  const ended = eventAt <= seconds;
  const elapsed = ended ? eventAt : seconds;
  const next = Object.freeze({ ...state,
    phase: ended ? contact ? 'COLLISION_PENDING' as const : 'EXITED' as const : 'CHARGING' as const,
    left: ended ? contact ? contactLeft : exitLeft
      : state.left + state.speed * elapsed + state.acceleration * elapsed * elapsed / 2,
    speed: state.speed + state.acceleration * elapsed,
    elapsedSeconds: state.elapsedSeconds + elapsed,
  });
  const observations = ended ? Object.freeze([Object.freeze({ windowId: state.windowId,
    lane: state.lane, kind: contact ? 'CONTACT' as const : 'MISS_EXITED' as const })]) : [];
  return { state: next, observations };
}
