import type { TraversalLane } from './TraversalRunRuntime';

/** Ephemeral Route-only hazards. No campaign, DOM, or save authority. */
export interface TraversalRouteHazard {
  readonly id: string;
  readonly segmentId: string;
  readonly progress01: number;
  readonly lane: TraversalLane;
  readonly kind: 'roadblock' | 'fallen-branch';
  readonly severity: 1 | 2;
}

export interface TraversalRouteRiskState {
  readonly segmentId: string;
  readonly resolvedHazardIds: readonly string[];
  readonly collisionCount: number;
  readonly lastCollisionId: string | null;
}

export interface TraversalRouteRiskOutcome {
  readonly hazard: TraversalRouteHazard;
  readonly result: 'COLLISION' | 'PASSED';
}

export function createRouteRisk(segmentId: string): TraversalRouteRiskState {
  return Object.freeze({ segmentId, resolvedHazardIds: Object.freeze([]),
    collisionCount: 0, lastCollisionId: null });
}

export function resolveRouteRisk(state: TraversalRouteRiskState,
  hazards: readonly TraversalRouteHazard[], previousProgress01: number, nextProgress01: number,
  lane: TraversalLane, activeDriving: boolean): {
    readonly state: TraversalRouteRiskState;
    readonly outcomes: readonly TraversalRouteRiskOutcome[];
  } {
  if (!activeDriving || nextProgress01 <= previousProgress01) return { state, outcomes: [] };
  const resolved = new Set(state.resolvedHazardIds);
  const outcomes: TraversalRouteRiskOutcome[] = [];
  for (const hazard of hazards) {
    if (hazard.segmentId !== state.segmentId || resolved.has(hazard.id)
      || previousProgress01 >= hazard.progress01 || nextProgress01 < hazard.progress01) continue;
    resolved.add(hazard.id);
    outcomes.push(Object.freeze({ hazard, result: lane === hazard.lane ? 'COLLISION' : 'PASSED' }));
  }
  if (!outcomes.length) return { state, outcomes };
  const collisions = outcomes.filter(outcome => outcome.result === 'COLLISION');
  return { state: Object.freeze({ segmentId: state.segmentId,
    resolvedHazardIds: Object.freeze([...resolved]),
    collisionCount: state.collisionCount + collisions.length,
    lastCollisionId: collisions.at(-1)?.hazard.id ?? state.lastCollisionId }),
  outcomes: Object.freeze(outcomes) };
}
