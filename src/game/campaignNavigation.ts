import type { CampaignNode } from './types';

export function buildCampaignAdjacency(nodes: CampaignNode[]): Map<string, Set<string>> {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const node of nodes) {
    for (const linkedId of node.links) {
      adjacency.get(node.id)?.add(linkedId);
      adjacency.get(linkedId)?.add(node.id);
    }
  }
  return adjacency;
}

export function getReachableNodeIds(
  nodes: CampaignNode[],
  currentNodeId: string,
  canLeaveCurrent: boolean,
): Set<string> {
  if (!canLeaveCurrent) return new Set();
  return new Set(buildCampaignAdjacency(nodes).get(currentNodeId) ?? []);
}
