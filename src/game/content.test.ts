import { describe, expect, it } from 'vitest';
import { campaignNodes, combatConfigs, dialogues } from './content';

describe('campaign content integrity', () => {
  it('only references existing nodes, dialogues and combats', () => {
    const nodeIds = new Set(campaignNodes.map((node) => node.id));

    for (const node of campaignNodes) {
      for (const link of node.links) expect(nodeIds.has(link), `${node.id} -> ${link}`).toBe(true);
      if (node.dialogueId) expect(dialogues.has(node.dialogueId), node.dialogueId).toBe(true);
      if (node.combatId) expect(combatConfigs.has(node.combatId), node.combatId).toBe(true);
    }
  });

  it('routes the optional patrol back through the mandatory village chapter', () => {
    const patrol = campaignNodes.find((node) => node.id === 'random-a');
    expect(patrol?.links).toContain('village');
    expect(patrol?.links).not.toContain('mystery-b');
  });
});
