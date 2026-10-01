import { describe, expect, it } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createTraversalPresentation, hasAuthoredTraversalPresentation } from './TraversalPresentation';

describe('Traversal presentation registry', () => {
  it('registers only the authored T0 scene', () => {
    expect(hasAuthoredTraversalPresentation('T0')).toBe(true);
    for (const legId of ['T1', 'T2', 'T3', 'T4'] as const) {
      expect(hasAuthoredTraversalPresentation(legId)).toBe(false);
    }
  });

  it('refuses an unconfigured leg before accessing scene state', () => {
    for (const legId of ['T1', 'T3'] as const) {
      const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === legId)!;
      expect(() => createTraversalPresentation({ leg } as Parameters<typeof createTraversalPresentation>[0]))
        .toThrow(`Traversal presentation is not authored for ${legId}.`);
    }
  });
});
