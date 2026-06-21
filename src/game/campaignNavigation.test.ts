import { describe, expect, it } from 'vitest';
import { campaignNodes } from './content';
import { buildCampaignAdjacency, getReachableNodeIds } from './campaignNavigation';

describe('campaign navigation', () => {
  it('makes authored links traversable in both directions', () => {
    const adjacency = buildCampaignAdjacency(campaignNodes);
    expect(adjacency.get('village')?.has('mystery-a')).toBe(true);
    expect(adjacency.get('mystery-a')?.has('village')).toBe(true);
    expect(adjacency.get('village-battle')?.has('valmir-market')).toBe(true);
  });

  it('does not expose neighboring nodes until the current node can be left', () => {
    expect(getReachableNodeIds(campaignNodes, 'village', false).size).toBe(0);
    expect(getReachableNodeIds(campaignNodes, 'village', true)).toContain('mystery-a');
  });
});
