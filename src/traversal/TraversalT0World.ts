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
// Clearance-only derivatives retain all upper roadside identity. Originals remain
// byte-identical in world-v1; provenance records the removed lower-road prop piles.
const CLEARANCE = '/assets/generated/lion-phase/traversal/t0/depth-v1/clearance';
/** Logical road units on each side of a join; presentation only, outside owned intervals. */
export const TRAVERSAL_SECTION_OVERLAP = 60;
export const TRAVERSAL_WORLD_ASSETS = Object.freeze({
  forest: `${ROOT}/forest-road.png`,
  merchant: `${CLEARANCE}/merchant-halt.png`,
  ambush: `${ROOT}/opening-ambush.png`,
  ambushCleared: `${ROOT}/ambush-cleared.png`,
  fork: `${ROOT}/forest-junction.png`,
  rest: `${CLEARANCE}/refugee-halt.png`,
  nomad: `${ROOT}/reference-convergence/nomad-waystation.png`,
  caravan: `${CLEARANCE}/damaged-caravan.png`,
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

/** Derive geography from the branch already committed by RunSystem. No route mutation.
 * The fade changes camera axis: the junction and its sign do not exist on this lateral road.
 * Keep the encounter's road coordinate/core so return-to-route and contact timing are stable.
 */
export function resolveTraversalWorld(presentedBranch: string): readonly TraversalWorldSection[] {
  const selected = traversalLocation('selected-route')!;
  const asset = selected.variantAssets?.[presentedBranch];
  if (!asset) return TRAVERSAL_T0_WORLD;
  const junction = traversalLocation('forest-junction')!;
  return TRAVERSAL_T0_WORLD.map(section => {
    if (section.id === junction.id) return Object.freeze({ ...section,
      id: 'selected-approach', kind: 'ENVIRONMENT' as const,
      // The human route approaches a caravan through open woods; the combat route
      // enters the overgrown outpost perimeter. Keep authored image widths intact.
      asset: asset === TRAVERSAL_WORLD_ASSETS.caravan ? TRAVERSAL_WORLD_ASSETS.forest : asset,
      props: undefined,
    });
    return section.id === selected.id ? Object.freeze({ ...section, asset, variantAssets: undefined }) : section;
  });
}
