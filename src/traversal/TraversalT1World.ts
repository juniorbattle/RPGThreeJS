import { TRAVERSAL_T0_WORLD_PRESENTATION, TRAVERSAL_WORLD_ASSETS } from './TraversalT0World';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import type { TraversalWorldPresentation, TraversalWorldSection } from './TraversalWorldModel';

export const TRAVERSAL_T1_WORLD_ASSETS = Object.freeze({
  valmir: '/assets/generated/lion-phase/traversal/t1/world-v1/valmir-road.png',
  shrine: '/assets/generated/lion-phase/traversal/t1/world-v1/old-shrine.png',
});
const bounds = [-350, 2350, 3550, 4600, 5800, 6850, 8050, 9650, 11650];
export const TRAVERSAL_T1_WORLD: readonly TraversalWorldSection[] = Object.freeze(
  bounds.slice(0, -1).map((worldStart, index): TraversalWorldSection => {
    const worldEnd = bounds[index + 1]!;
    const authored = ({
      1: { id: 'reserve-halt', asset: TRAVERSAL_T1_WORLD_ASSETS.valmir, kind: 'ENVIRONMENT' as const },
      3: { id: 'valmir-road', asset: TRAVERSAL_T1_WORLD_ASSETS.valmir, kind: 'CORRIDOR' as const },
      5: { id: 't1-junction', asset: TRAVERSAL_WORLD_ASSETS.fork, kind: 'TRANSITION' as const },
      6: { id: 't1-selected-route', asset: TRAVERSAL_WORLD_ASSETS.forest, kind: 'ENVIRONMENT' as const },
    } as const)[index as 1 | 3 | 5 | 6];
    return Object.freeze({ id: authored?.id ?? `t1-forest-${index}`, kind: authored?.kind ?? 'FOREST',
      worldStart, worldEnd, coreStart: worldStart + (worldEnd - worldStart) * .2,
      coreEnd: worldStart + (worldEnd - worldStart) * .8, asset: authored?.asset ?? TRAVERSAL_WORLD_ASSETS.forest,
      mirror: index % 2 === 0,
      ...(index === 5 ? { props: [{ id: 't1-junction-sign', asset: TRAVERSAL_T0_ASSETS.forkSign,
        worldX: 7390, groundPercent: 57, vehicleHeightRatio: .68 }] } : {}),
      ...(index === 6 ? { variantAssets: {
        'lion-second-trial-event': TRAVERSAL_T1_WORLD_ASSETS.shrine,
        'lion-second-trial-combat': TRAVERSAL_WORLD_ASSETS.ambush,
      } } : {}),
    });
  }));

export function resolveTraversalT1World(branch: string): readonly TraversalWorldSection[] {
  const selected = TRAVERSAL_T1_WORLD.find(section => section.id === 't1-selected-route')!;
  const asset = selected.variantAssets?.[branch];
  if (!asset) return TRAVERSAL_T1_WORLD;
  return TRAVERSAL_T1_WORLD.map(section => section.id === 't1-junction'
    ? Object.freeze({ ...section, id: 't1-selected-approach', kind: 'FOREST' as const,
      asset: TRAVERSAL_WORLD_ASSETS.forest, props: undefined })
    : section.id === selected.id ? Object.freeze({ ...section, asset, variantAssets: undefined }) : section);
}

export const TRAVERSAL_T1_WORLD_PRESENTATION: TraversalWorldPresentation = Object.freeze({
  ...TRAVERSAL_T0_WORLD_PRESENTATION, checkpointSections: TRAVERSAL_T1_WORLD,
  directionSignPropId: 't1-junction-sign', resolveWorld: resolveTraversalT1World,
});
