import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';

/** Presentation geography only. No decisions, rewards or collision authority. */
export type TraversalWorldSectionKind = 'FOREST' | 'ENVIRONMENT' | 'CORRIDOR' | 'TRANSITION';
export interface TraversalWorldSection {
  readonly id: string;
  readonly kind: TraversalWorldSectionKind;
  readonly worldStart: number;
  readonly worldEnd: number;
  readonly coreStart: number;
  readonly coreEnd: number;
  readonly asset: string;
  readonly mirror: boolean;
  readonly clearedAsset?: string;
  readonly variantAssets?: Readonly<Record<string, string>>;
  readonly props?: readonly {
    readonly id: string;
    readonly asset: string;
    readonly worldX: number;
    readonly groundPercent: number;
    readonly vehicleHeightRatio: number;
  }[];
}

const ROOT = '/assets/generated/lion-phase/traversal/t0/world-v1';
export const TRAVERSAL_WORLD_ASSETS = Object.freeze({
  forest: `${ROOT}/forest-road.png`,
  merchant: `${ROOT}/reference-convergence/merchant-halt.png`,
  ambush: `${ROOT}/opening-ambush.png`,
  ambushCleared: `${ROOT}/ambush-cleared.png`,
  fork: `${ROOT}/forest-junction.png`,
  rest: `${ROOT}/reference-convergence/refugee-halt.png`,
  nomad: `${ROOT}/reference-convergence/nomad-waystation.png`,
  caravan: `${ROOT}/reference-convergence/damaged-caravan.png`,
  ruins: `${ROOT}/ruined-outpost.png`,
});

// Each section owns a whole interval, including its approach and departure terrain.
// Alternating edge orientation joins the same painted forest boundary to itself.
// The merchant stands at world 1450, inside the clearing, but does not own it.
export const TRAVERSAL_T0_WORLD: readonly TraversalWorldSection[] = Object.freeze(
  Array.from({ length: 10 }, (_, index): TraversalWorldSection => {
    // Give inhabited clearings longer approaches and departures. Adjacent forest/outpost
    // intervals absorb the spacing; the same authored boundaries still meet exactly.
    const boundaries = [-350, 850, 2050, 3250, 4850, 5250, 6850, 8050, 9650, 10450, 11650];
    const worldStart = boundaries[index]!;
    const worldEnd = boundaries[index + 1]!;
    const authored = ({
      1: { id: 'merchant-halt', kind: 'ENVIRONMENT', asset: TRAVERSAL_WORLD_ASSETS.merchant },
      2: { id: 'opening-ambush', kind: 'CORRIDOR', asset: TRAVERSAL_WORLD_ASSETS.ambush },
      3: { id: 'nomad-waystation', kind: 'ENVIRONMENT', asset: TRAVERSAL_WORLD_ASSETS.nomad },
      5: { id: 'resting-clearing', kind: 'ENVIRONMENT', asset: TRAVERSAL_WORLD_ASSETS.rest },
      6: { id: 'forest-junction', kind: 'TRANSITION', asset: TRAVERSAL_WORLD_ASSETS.fork },
      7: { id: 'selected-route', kind: 'ENVIRONMENT', asset: TRAVERSAL_WORLD_ASSETS.forest },
    } as const)[index as 1 | 2 | 3 | 5 | 6 | 7];
    return Object.freeze({
      id: authored?.id ?? `forest-${index}`,
      kind: authored?.kind ?? 'FOREST',
      worldStart, worldEnd,
      coreStart: worldStart + (index === 6 ? 780 : (worldEnd - worldStart) * .2),
      coreEnd: worldStart + (index === 6 ? 1080 : (worldEnd - worldStart) * .8),
      asset: authored?.asset ?? TRAVERSAL_WORLD_ASSETS.forest,
      mirror: index % 2 === 0,
      ...(index === 2 ? { clearedAsset: TRAVERSAL_WORLD_ASSETS.ambushCleared } : {}),
      ...(index === 6 ? { props: Object.freeze([Object.freeze({ id: 'junction-sign',
        asset: TRAVERSAL_T0_ASSETS.forkSign, worldX: 7840, groundPercent: 57, vehicleHeightRatio: .68 })]) } : {}),
      ...(index === 7 ? { variantAssets: Object.freeze({
        'lion-first-trial-event': TRAVERSAL_WORLD_ASSETS.caravan,
        'lion-first-trial-combat': TRAVERSAL_WORLD_ASSETS.ruins,
      }) } : {}),
    });
  }),
);

export function traversalLocation(id: string): TraversalWorldSection | undefined {
  return TRAVERSAL_T0_WORLD.find(section => section.id === id);
}
