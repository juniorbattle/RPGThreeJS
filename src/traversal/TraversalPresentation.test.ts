import { describe, expect, it } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createTraversalPresentation, hasAuthoredTraversalPresentation } from './TraversalPresentation';

describe('Traversal presentation registry', () => {
  it('registers the authored T0/T1 scenes and keeps future/retired legs closed', () => {
    expect(hasAuthoredTraversalPresentation('T0')).toBe(true);
    expect(hasAuthoredTraversalPresentation('T1')).toBe(true);
    for (const legId of ['T2', 'T3', 'T4'] as const) {
      expect(hasAuthoredTraversalPresentation(legId)).toBe(false);
    }
  });

  it('refuses an unconfigured leg before accessing scene state', () => {
    for (const legId of ['T3'] as const) {
      const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === legId)!;
      expect(() => createTraversalPresentation({ leg } as Parameters<typeof createTraversalPresentation>[0]))
        .toThrow(`Traversal presentation is not authored for ${legId}.`);
    }
  });
});
