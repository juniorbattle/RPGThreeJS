// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { resolveTraversalT0Route } from './TraversalT0Route';
import { resolveTraversalT1Route } from './TraversalT1Route';
import { resolveTraversalT3Route } from './TraversalT3Route';
import { TraversalT0Scene } from './TraversalT0Scene';
import { TraversalT1Scene } from './TraversalT1Scene';
import { TraversalT3Scene } from './TraversalT3Scene';
import { resolveTraversalWorldSubject } from './TraversalWorldSubject';
import { TRAVERSAL_PURSUER_IMAGE } from './TraversalRoutePursuitRenderer';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import type { TraversalRouteBeat } from './TraversalRouteModel';

const beat = (characterId: string): TraversalRouteBeat => ({
  id: 'subject-fixture', type: 'campaign-node', category: 'MANDATORY_EVENT', engagement: 'ROUTE',
  progress01: .5, lane: 0, placement: 'LANE', label: 'Fixture', marker: 'speech',
  interactionPolicy: 'MANDATORY_CONFIRM', campaignNodeIds: ['lion-nomad-crossroads'],
  characterId, visualAsset: resolveCharacterAsset(characterId, 'full'),
});

describe('Traversal world subjects stay separate from traveling clan and tactical formations', () => {
  it.each(['warrior', 'marian', 'elara', 'kestrel', 'sage_seraphine', 'maelor'])(
    'keeps %s in the caravan/tableau, never waiting on its own road', identity => {
      const state = createInitialState();
      state.deployment.unitIds = [];
      expect(resolveTraversalWorldSubject(beat(identity), state)).toBeUndefined();
    });

  it.each([['cedric', 'recruitedCedric'], ['lancer', 'recruitedLancer']])(
    'shows %s only while an external recruitment contact', (identity, flag) => {
      const state = createInitialState();
      expect(resolveTraversalWorldSubject(beat(identity), state)?.kind).toBe('external');
      state.flags[flag] = true;
      expect(resolveTraversalWorldSubject(beat(identity), state)).toBeUndefined();
      state.flags[flag] = false;
      state.clan.members.push({ ...state.clan.members[0]!, id: 'reserve', definitionId: identity });
      expect(resolveTraversalWorldSubject(beat(identity), state)).toBeUndefined();
    });

  it.each(['T0', 'T1', 'T3'] as const)('renders %s hostile checkpoints as one shadow without changing truth', id => {
    const state = createInitialState();
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === id)!;
    const before = JSON.stringify(state);
    const options = { root: document.body, leg, getState: () => state,
      getAvailableNodes: () => getAvailableRunNodes(state), onNodeHandoff: vi.fn(), onArrival: vi.fn(), onMenu: vi.fn() };
    const scene = id === 'T0' ? new TraversalT0Scene(options) : id === 'T1'
      ? new TraversalT1Scene(options) : new TraversalT3Scene(options);
    const route = id === 'T0' ? resolveTraversalT0Route(leg, state.run.graph.nodes)
      : id === 'T1' ? resolveTraversalT1Route(leg, state) : resolveTraversalT3Route(leg, state);
    for (const contact of route.beats.filter(candidate => candidate.marker === 'danger')) {
      const entity = scene.element.querySelector(`[data-traversal-beat="${contact.id}"]`)!;
      expect(entity.querySelectorAll('img')).toHaveLength(1);
      expect(entity.querySelector('img')?.getAttribute('src')).toBe(TRAVERSAL_PURSUER_IMAGE);
      expect(entity.querySelector('.traversal-formation-member')).toBeNull();
      expect(contact.campaignNodeIds).not.toHaveLength(0);
    }
    expect(JSON.stringify(state)).toBe(before);
    scene.dispose();
  });

  it('keeps T1 reserve and shrine stops empty while their canonical beats remain interactive', () => {
    const state = createInitialState();
    const leg = LION_TRAVERSAL_LEGS.find(candidate => candidate.id === 'T1')!;
    const route = resolveTraversalT1Route(leg, state);
    for (const id of ['lion-reserve-trail', 'lion-second-trial-event']) {
      const contact = route.beats.find(candidate => candidate.type !== 'fork' && candidate.campaignNodeIds.includes(id))!;
      expect(resolveTraversalWorldSubject(contact, state)).toBeUndefined();
      expect(contact.interactionPolicy).toBe('MANDATORY_CONFIRM');
    }
  });
});
