import type { TraversalOccluder } from './TraversalDepth';

const ROOT = '/assets/generated/lion-phase/traversal/t0/foreground';
export const TRAVERSAL_FOREGROUND_ASSETS = Object.freeze({ fern: `${ROOT}/ferns.png`, roots: `${ROOT}/roots.png` });

/** Authored T0 verge spacing, outside collision and campaign authority. */
export const TRAVERSAL_OCCLUDERS: readonly TraversalOccluder[] = Object.freeze(Array.from({ length: 40 }, (_, index) => ({
  id: `near-road-${index}`,
  worldX: -120 + index * 435 + [0, 60, -35, 110][index % 4]!,
  asset: index % 3 === 1 ? TRAVERSAL_FOREGROUND_ASSETS.roots : TRAVERSAL_FOREGROUND_ASSETS.fern,
  groundPercent: index % 3 === 1 ? 87.6 : 86.1,
  vehicleHeightRatio: index % 3 === 1 ? .24 : [.36, .32, .39][index % 3]!,
  mirror: index % 2 === 1,
})));
