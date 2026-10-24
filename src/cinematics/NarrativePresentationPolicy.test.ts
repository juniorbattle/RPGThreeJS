import { describe, expect, it } from 'vitest';
import { resolveNarrativeAuthoringMedia } from './NarrativePresentationPolicy';

describe('Narrative presentation media policy', () => {
  it('makes the explicit narrative selector static-first in DEV', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative', dev: true })).toBe('STILL');
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=stills', dev: true })).toBe('STILL');
  });

  it('keeps retired video and legacy URLs static', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=video', dev: true })).toBe('STILL');
    expect(resolveNarrativeAuthoringMedia({ search: '?journey=cinematic', dev: true })).toBe('STILL');
  });

  it('uses the same static policy in production', () => {
    expect(resolveNarrativeAuthoringMedia({ search: '?presentation=narrative&media=stills', dev: false })).toBe('STILL');
  });
});
