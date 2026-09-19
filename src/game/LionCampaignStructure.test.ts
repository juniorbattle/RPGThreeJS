import { describe, expect, it } from 'vitest';
import {
  LION_CAMPAIGN_STRUCTURE,
  LION_CAMPAIGN_NODES_BY_ID,
} from './LionCampaignStructure';
import { auditLionCampaignStructure } from './LionCampaignStructureAudit';

describe('LionCampaignStructure', () => {
  it('canonically classifies all 21 RunGraph nodes exactly once', () => {
    expect(LION_CAMPAIGN_STRUCTURE).toHaveLength(21);
    expect(LION_CAMPAIGN_NODES_BY_ID.size).toBe(21);
    expect(new Set(LION_CAMPAIGN_STRUCTURE.map((node) => node.id)).size).toBe(21);
  });

  it('separates route interrupts from location anchors', () => {
    const anchors = LION_CAMPAIGN_STRUCTURE
      .filter((node) => node.spatialRole === 'LOCATION_ANCHOR')
      .map((node) => node.id);
    const interrupts = LION_CAMPAIGN_STRUCTURE
      .filter((node) => node.spatialRole === 'ROUTE_INTERRUPT')
      .map((node) => node.id);

    expect(anchors).toEqual([
      'lion-camp',
      'lion-audience',
      'lion-first-refuge',
      'lion-village-choice',
      'lion-second-refuge',
      'lion-shadow-signs',
      'lion-final-refuge',
      'lion-final-judgement',
    ]);
    expect(interrupts).toHaveLength(13);
  });

  it('exposes current cross-authority debt instead of silently normalizing it', () => {
    const issues = auditLionCampaignStructure(0);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'LEGACY_NODE_MISSING', nodeId: 'lion-lancer-recruit' }),
      expect.objectContaining({ code: 'LEGACY_LINK_MISMATCH', nodeId: 'lion-second-refuge' }),
      expect.objectContaining({ code: 'ENV_NODE_FAMILY_MISMATCH', nodeId: 'lion-reserve-trail' }),
      expect.objectContaining({ code: 'ENV_NODE_CONTEXT_MISSING', nodeId: 'lion-lancer-recruit' }),
      expect.objectContaining({ code: 'ENV_EDGE_CONTEXT_MISSING', nodeId: 'lion-second-refuge' }),
      expect.objectContaining({ code: 'ENV_EDGE_CONTEXT_MISSING', nodeId: 'lion-lancer-recruit' }),
      expect.objectContaining({ code: 'ENV_NODE_FAMILY_MISMATCH', nodeId: 'lion-final-trial-combat' }),
      expect.objectContaining({ code: 'CONTENT_ENV_FAMILY_MISMATCH', nodeId: 'lion-final-trial-event' }),
      expect.objectContaining({ code: 'CHARACTER_VISUAL_UNRESOLVED', nodeId: 'lion-final-trial-event' }),
    ]));
  });
});
