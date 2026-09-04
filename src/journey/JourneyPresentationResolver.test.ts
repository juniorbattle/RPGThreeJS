import { describe, expect, it } from 'vitest';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import {
  contentRevealKey,
  edgeKey,
  JOURNEY_PRESENTATION_MAP,
  nodeArrivalKey,
  resolveBoundaryCinematic,
  resolveCandidateCinematicIds,
  resolveJourneyPresentation,
  stateKey,
} from './JourneyPresentationResolver';

function branchContext() {
  const state = createInitialState();
  state.run.currentNodeId = 'lion-refugees';
  state.currentNodeId = 'lion-refugees';
  return {
    currentNodeId: 'lion-refugees',
    currentContentId: 'refugee_trial',
    available: getAvailableRunNodes(state),
  };
}

describe('journey presentation resolver', () => {
  it('builds stable keys for every future mapping category', () => {
    expect(nodeArrivalKey('lion-camp')).toBe('node:lion-camp:arrival');
    expect(edgeKey('lion-refugees', 'lion-first-trial-event')).toBe('edge:lion-refugees>lion-first-trial-event');
    expect(contentRevealKey('refugee_trial')).toBe('content:refugee_trial:reveal');
    expect(stateKey('lionConduct', 'honour')).toBe('state:lionConduct:honour');
  });

  it('ships no production mappings in CIN-2', () => {
    expect(Object.keys(JOURNEY_PRESENTATION_MAP)).toEqual([]);
    expect(Object.isFrozen(JOURNEY_PRESENTATION_MAP)).toBe(true);
    for (const id of ['serpent_general_reveal', 'lion_judgement', 'lion_champion_reveal']) {
      expect(Object.values(JOURNEY_PRESENTATION_MAP)).not.toContain(id);
    }
  });

  it('resolves no cinematic for a real boundary while the map is empty', () => {
    const context = branchContext();
    const resolved = resolveBoundaryCinematic(context);
    expect(resolved.cinematicId).toBeUndefined();
    expect(resolved.key).toBe('node:lion-refugees:arrival');
    expect(resolveCandidateCinematicIds(context)).toEqual([]);
    expect(resolveJourneyPresentation('node:lion-refugees:arrival')).toBeUndefined();
  });

  it('prefers node arrival over content reveal with an injected map', () => {
    const context = branchContext();
    expect(resolveBoundaryCinematic(context, {
      'node:lion-refugees:arrival': 'clip-arrival',
      'content:refugee_trial:reveal': 'clip-reveal',
    })).toEqual({ key: 'node:lion-refugees:arrival', cinematicId: 'clip-arrival' });
    expect(resolveBoundaryCinematic(context, {
      'content:refugee_trial:reveal': 'clip-reveal',
    })).toEqual({ key: 'content:refugee_trial:reveal', cinematicId: 'clip-reveal' });
  });

  it('falls back to a diagnostic key when nothing is known', () => {
    expect(resolveBoundaryCinematic({ currentNodeId: null, available: [] }).key).toBe('node:unknown:arrival');
  });

  it('resolves candidates edge-first and deduplicates shared clips', () => {
    const context = branchContext();
    const [first, second] = context.available;
    expect(first && second).toBeTruthy();
    expect(resolveCandidateCinematicIds(context, {
      [edgeKey('lion-refugees', first!.id)]: 'clip-edge-a',
      [nodeArrivalKey(first!.id)]: 'clip-arrival-a',
      [nodeArrivalKey(second!.id)]: 'clip-edge-a',
    })).toEqual(['clip-edge-a', 'clip-arrival-a']);
  });

  it('never derives candidates from unavailable nodes', () => {
    const context = branchContext();
    expect(resolveCandidateCinematicIds(context, {
      'node:lion-final-judgement:arrival': 'clip-finale',
    })).toEqual([]);
  });
});
