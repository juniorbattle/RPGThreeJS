import type { GameState, RunNode } from '../game/types';
import { assets } from '../render/assetManifest';
import { resolveFinalRefugeServicesPresentation, resolveRefugePresentation } from './RefugePresentation';

/**
 * OD-2026-11-13-F (P3): the backdrop of the company register and the shop is the refuge of the part in progress, on the
 * approved image its refuge screen shows: the refuge the company stands at, else the last refuge it visited on this run,
 * else the run's first refuge. Presentation only: it reads the route and changes nothing, and nothing is saved.
 */
export function companyBackdrop(state: Readonly<GameState>): string {
  const nodes = state.run.graph.nodes;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = [...state.run.visitedNodeIds].reverse().map((id) => byId.get(id));
  const byDepth = [...nodes].sort((a, b) => a.depth - b.depth);
  for (const node of [byId.get(state.run.currentNodeId), ...visited, ...byDepth]) {
    const image = refugeImage(node);
    if (image) return image;
  }
  return assets.screens.management.background;
}

function refugeImage(node: RunNode | undefined): string | undefined {
  if (!node) return undefined;
  return (resolveRefugePresentation(node) ?? resolveFinalRefugeServicesPresentation(node))?.background;
}
