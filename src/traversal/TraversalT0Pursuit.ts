import type { TraversalRoutePursuitWindow } from './TraversalRoutePursuit';

const AUTHORED_WINDOWS: TraversalRoutePursuitWindow[] = [
  { id: 't0:r3:pursuit-1', segmentId: 'route-3', startProgress01: .22, endProgress01: .78,
    startPressure01: .24, lanePhases: [{ fromProgress01: .22, lane: 0 }, { fromProgress01: .50, lane: 1 }] },
  { id: 't0:r5a:pursuit-1', segmentId: 'route-5a', startProgress01: .20, endProgress01: .78,
    startPressure01: .28, lanePhases: [{ fromProgress01: .20, lane: 0 }, { fromProgress01: .50, lane: 1 }] },
  { id: 't0:r5b:pursuit-1', segmentId: 'route-5b', startProgress01: .18, endProgress01: .80,
    startPressure01: .32, lanePhases: [{ fromProgress01: .18, lane: 1 }, { fromProgress01: .40, lane: 0 },
      { fromProgress01: .61, lane: 1 }] },
  { id: 't0:r6:pursuit-1', segmentId: 'route-6', startProgress01: .18, endProgress01: .84,
    startPressure01: .34, lanePhases: [{ fromProgress01: .18, lane: 0 }, { fromProgress01: .36, lane: 1 },
      { fromProgress01: .62, lane: 0 }] },
];

export const T0_ROUTE_PURSUIT_WINDOWS: readonly TraversalRoutePursuitWindow[] = Object.freeze(
  AUTHORED_WINDOWS.map(window => Object.freeze({ ...window,
    lanePhases: Object.freeze(window.lanePhases.map(phase => Object.freeze(phase))) })));

export function t0RoutePursuitWindow(segmentId: string): TraversalRoutePursuitWindow | undefined {
  return T0_ROUTE_PURSUIT_WINDOWS.find(window => window.segmentId === segmentId);
}
