import { describe, expect, it } from 'vitest';
import { resolveNarrativeAuthoringMedia } from './NarrativePresentationPolicy';

describe('Narrative presentation media policy', () => {
  it('makes the explicit narrative selector static-first in DEV', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative', dev: true })).toBe('STILL');
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=stills', dev: true })).toBe('STILL');
  });

  it('preserves an explicit video regression route and the legacy selector', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=video', dev: true })).toBe('VIDEO');
    expect(resolveNarrativeAuthoringMedia({ search: '?journey=cinematic', dev: true })).toBe('VIDEO');
  });

  it('does not expose authoring-only still selection in production', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=stills', dev: false })).toBe('VIDEO');
  });
});
