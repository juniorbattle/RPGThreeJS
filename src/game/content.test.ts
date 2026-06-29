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

  it('routes the first refuge into the village objective branches', () => {
    const refuge = campaignNodes.find((node) => node.id === 'lion-first-refuge');
    expect(refuge?.links).toContain('lion-valmir-road');
    expect(refuge?.links).toContain('lion-reserve-trail');
    expect(refuge?.links).not.toContain('lion-final-judgement');
  });

  it('keeps route and dialogue choices limited to two impactful options', () => {
    expect(campaignNodes.every((node) => node.links.length <= 2)).toBe(true);
    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        expect(step.choices?.length ?? 0, `${dialogue.id}:${step.id}`).toBeLessThanOrEqual(2);
      }
    }
  });
});
