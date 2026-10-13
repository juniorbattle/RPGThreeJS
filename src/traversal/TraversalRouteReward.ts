import type { TraversalLane } from './TraversalRunRuntime';

/** Physical route pickups only. Campaign economy belongs to the caller. */
export interface TraversalRoutePickup {
  readonly id: string;
  readonly segmentId: string;
  readonly lane: TraversalLane;
  readonly progress01: number;
  readonly gold: number;
}

export interface TraversalRouteRewardState {
  readonly segmentId: string;
  readonly resolvedPickupIds: readonly string[];
  readonly collectedPickupIds: readonly string[];
  readonly collectedGold: number;
}

export interface TraversalRouteRewardOutcome {
  readonly pickup: TraversalRoutePickup;
  readonly result: 'COLLECTED' | 'MISSED';
}

export function createRouteReward(segmentId: string): TraversalRouteRewardState {
  return Object.freeze({ segmentId, resolvedPickupIds: Object.freeze([]),
    collectedPickupIds: Object.freeze([]), collectedGold: 0 });
}

export function resolveRouteReward(state: TraversalRouteRewardState,
  pickups: readonly TraversalRoutePickup[], previousProgress01: number, nextProgress01: number,
  lane: TraversalLane, activeDriving: boolean): {
    readonly state: TraversalRouteRewardState;
    readonly outcomes: readonly TraversalRouteRewardOutcome[];
  } {
  if (!activeDriving || nextProgress01 <= previousProgress01) return { state, outcomes: [] };
  const resolved = new Set(state.resolvedPickupIds);
  const collected = [...state.collectedPickupIds];
  const outcomes: TraversalRouteRewardOutcome[] = [];
  let collectedGold = state.collectedGold;
  for (const pickup of pickups) {
    if (pickup.segmentId !== state.segmentId || resolved.has(pickup.id)
      || previousProgress01 >= pickup.progress01 || nextProgress01 < pickup.progress01) continue;
    resolved.add(pickup.id);
    const result = lane === pickup.lane ? 'COLLECTED' : 'MISSED';
    if (result === 'COLLECTED') { collected.push(pickup.id); collectedGold += pickup.gold; }
    outcomes.push(Object.freeze({ pickup, result }));
  }
  if (!outcomes.length) return { state, outcomes };
  return { state: Object.freeze({ segmentId: state.segmentId,
    resolvedPickupIds: Object.freeze([...resolved]), collectedPickupIds: Object.freeze(collected),
    collectedGold }), outcomes: Object.freeze(outcomes) };
}
