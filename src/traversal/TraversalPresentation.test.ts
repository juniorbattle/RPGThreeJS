import { describe, expect, it } from 'vitest';
import { createTraversalPresentation, hasAuthoredTraversalPresentation } from './TraversalPresentation';

describe('Traversal presentation registry', () => {
  it('registers the accepted T0/T1/T3 scenes and keeps retired legs closed', () => {
    expect(hasAuthoredTraversalPresentation('T0')).toBe(true);
    expect(hasAuthoredTraversalPresentation('T1')).toBe(true);
    expect(hasAuthoredTraversalPresentation('T3')).toBe(true);
    for (const legId of ['T2', 'T4'] as const) {
      expect(hasAuthoredTraversalPresentation(legId)).toBe(false);
    }
  });

  it('refuses an unconfigured leg before accessing scene state', () => {
    for (const legId of ['T2', 'T4'] as const) {
      const leg = { id: legId } as unknown as Parameters<typeof createTraversalPresentation>[0]['leg'];
      expect(() => createTraversalPresentation({ leg } as Parameters<typeof createTraversalPresentation>[0]))
        .toThrow(`Traversal presentation is not authored for ${legId}.`);
    }
  });
});
