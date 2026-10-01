import { TRAVERSAL_T0_WORLD_PRESENTATION, TRAVERSAL_WORLD_ASSETS } from './TraversalT0World';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import type { TraversalWorldPresentation, TraversalWorldSection } from './TraversalWorldModel';
import type { GameState } from '../game/types';

export const TRAVERSAL_T3_WORLD_ASSETS = Object.freeze({
  witnesses: '/assets/generated/lion-phase/traversal/t3/world-v1/witness-road.png',
  ruins: '/assets/generated/lion-phase/traversal/t3/world-v1/shadow-ruins.png',
  dragon: '/assets/generated/lion-phase/traversal/t3/world-v1/dragon-roost.png',
});
const bounds = [-350, 2350, 3550, 4600, 5800, 6850, 8050, 9650, 11650];
export const TRAVERSAL_T3_WORLD: readonly TraversalWorldSection[] = Object.freeze(
  bounds.slice(0, -1).map((worldStart, index): TraversalWorldSection => {
    const worldEnd = bounds[index + 1]!;
    const authored = ({
      1: { id: 'lancer-halt', asset: TRAVERSAL_T3_WORLD_ASSETS.witnesses, kind: 'ENVIRONMENT' as const },
      3: { id: 'witness-road', asset: TRAVERSAL_T3_WORLD_ASSETS.witnesses, kind: 'CORRIDOR' as const },
      5: { id: 't3-junction', asset: TRAVERSAL_WORLD_ASSETS.fork, kind: 'TRANSITION' as const },
      6: { id: 't3-selected-route', asset: TRAVERSAL_WORLD_ASSETS.forest, kind: 'ENVIRONMENT' as const },
    } as const)[index as 1 | 3 | 5 | 6];
    return Object.freeze({ id: authored?.id ?? `t3-forest-${index}`, kind: authored?.kind ?? 'FOREST',
      worldStart, worldEnd, coreStart: worldStart + (worldEnd - worldStart) * .2,
      coreEnd: worldStart + (worldEnd - worldStart) * .8, asset: authored?.asset ?? TRAVERSAL_WORLD_ASSETS.forest,
      mirror: index % 2 === 0,
      ...(index === 5 ? { props: [{ id: 't3-junction-sign', asset: TRAVERSAL_T0_ASSETS.forkSign,
        worldX: 7390, groundPercent: 57, vehicleHeightRatio: .68 }] } : {}),
    });
  }));

/** Reads an owner-resolved content ID; never chooses or persists an adaptive variant. */
export function resolveTraversalT3World(branch: string, contentId?: string): readonly TraversalWorldSection[] {
  const selected = TRAVERSAL_T3_WORLD.find(section => section.id === 't3-selected-route')!;
  if (!branch || branch === 'main') return TRAVERSAL_T3_WORLD;
  const eventAssets: Readonly<Record<string, string>> = {
    mystery_dragon_roost: TRAVERSAL_T3_WORLD_ASSETS.dragon,
    mystery_shrine: TRAVERSAL_T3_WORLD_ASSETS.ruins,
    serpent_informant: TRAVERSAL_T3_WORLD_ASSETS.ruins,
    mystery_lancer_recruit: TRAVERSAL_T3_WORLD_ASSETS.witnesses,
  };
  const asset = branch === 'lion-final-trial-event' ? eventAssets[contentId ?? '']
    : branch === 'lion-final-trial-combat' && (contentId === 'ruins_guardians' || contentId === 'serpent_hunters')
      ? TRAVERSAL_T3_WORLD_ASSETS.ruins : undefined;
  if (!asset) throw new Error(`Unknown canonical T3 checkpoint: ${branch}/${contentId}`);
  return TRAVERSAL_T3_WORLD.map(section => section.id === 't3-junction'
    ? Object.freeze({ ...section, id: 't3-selected-approach', kind: 'FOREST' as const,
      asset: TRAVERSAL_WORLD_ASSETS.forest, props: undefined })
    : section.id === selected.id ? Object.freeze({ ...section, asset, variantAssets: undefined }) : section);
}

/** Scene-local bridge to campaign truth, refreshed after RunSystem selects the fork. */
export function createTraversalT3WorldPresentation(getState: () => GameState): TraversalWorldPresentation {
  return Object.freeze({
    ...TRAVERSAL_T0_WORLD_PRESENTATION, checkpointSections: TRAVERSAL_T3_WORLD,
    directionSignPropId: 't3-junction-sign', resolveWorld: (branch: string) => resolveTraversalT3World(branch,
      getState().run.graph.nodes.find(node => node.id === branch)?.contentId),
  });
}
