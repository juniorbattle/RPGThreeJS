import { describe, expect, it } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import { auditTraversalT0Route, resolveTraversalBeatCrossing, resolveTraversalT0Route } from './TraversalT0Route';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import { auditTraversalRouteAuthoring } from './TraversalCheckpointRoute';
import { T0_ROUTE_SEGMENTS } from './TraversalT0CheckpointRoute';
import { TRAVERSAL_T0_WORLD } from './TraversalT0World';
import { traversalRouteProgressBounds } from './TraversalRouteModel';

const t0 = () => LION_TRAVERSAL_LEGS.find(leg => leg.id === 'T0')!;
const route = () => {
  const state = createInitialState();
  return resolveTraversalT0Route(t0(), state.run.graph.nodes,
    state.clan.members.map(member => member.definitionId));
};

describe('TraversalT0Route', () => {
  it('derives only authored checkpoints from the canonical relation', () => {
    const resolved = route();
    expect(resolved.legId).toBe('T0');
    expect(resolved.originNodeId).toBe(t0().originNodeId);
    expect(resolved.destinationNodeId).toBe(t0().destinationNodeId);
    expect(resolved.beats.filter(beat => !beat.branchNodeId).map(beat => beat.campaignNodeIds))
      .toEqual(t0().stages.map(stage => stage.nodeIds));
    expect(resolved.beats).toHaveLength(6);
    expect(resolved.beats.every(beat => beat.campaignNodeIds.length > 0)).toBe(true);
    expect(resolved.beats.every(beat => beat.campaignNodeIds.length > 0)).toBe(true);
  });

  it('keeps Cedric, Refugees, and both branch consequences on their authored sections', () => {
    const resolved = route();
    const cedric = resolved.beats.find(beat => beat.campaignNodeIds.includes('lion-nomad-crossroads'))!;
    const refugees = resolved.beats.find(beat => beat.campaignNodeIds.includes('lion-refugees'))!;
    expect(cedric).toMatchObject({ characterId: 'cedric', locationId: 'nomad-waystation',
      engagement: 'ROUTE', interactionPolicy: 'MANDATORY_CONFIRM' });
    expect(cedric.visualAsset).toBe(resolveCharacterAsset('cedric', 'full'));
    expect(refugees).toMatchObject({ locationId: 'resting-clearing', category: 'OPTIONAL_EVENT',
      engagement: 'ROUTE', interactionPolicy: 'OPTIONAL_CONFIRM' });
    expect(resolveTraversalBeatCrossing(refugees, 0, refugees.progress01, 0)).toBe('TRIGGERED');
    expect(resolveTraversalBeatCrossing(refugees, 0, refugees.progress01, 1)).toBe('TRIGGERED');
    expect(resolved.beats.filter(beat => beat.branchNodeId).map(beat => beat.locationId))
      .toEqual(['selected-route', 'selected-route']);
  });

  it('keeps fork selection and branch availability separate from presentation', () => {
    const resolved = route();
    const fork = resolved.beats.find(beat => beat.type === 'fork')!;
    expect(fork.campaignNodeIds).toEqual(['lion-first-trial-event', 'lion-first-trial-combat']);
    expect(fork.locationId).toBe('forest-junction');
    for (const beat of resolved.beats.filter(candidate => candidate.branchNodeId)) {
      expect(beat.branchNodeId).toBe(beat.campaignNodeIds[0]);
      expect(beat.engagement).toBe('ROUTE');
    }
  });

  it('uses the retained cart only for a canonical treasure branch assignment', () => {
    const state = createInitialState();
    const nodes = state.run.graph.nodes.map(node => node.id === 'lion-first-trial-event'
      ? { ...node, contentId: 'mystery_treasure' } : node);
    const resolved = resolveTraversalT0Route(t0(), nodes,
      state.clan.members.map(member => member.definitionId));
    expect(resolved.beats.find(beat => beat.branchNodeId === 'lion-first-trial-event')?.visualAsset)
      .toBe(TRAVERSAL_T0_ASSETS.abandonedCart);
    expect(resolved.beats.filter(beat => !beat.branchNodeId)
      .some(beat => beat.visualAsset === TRAVERSAL_T0_ASSETS.abandonedCart)).toBe(false);
  });

  it('rejects missing canonical RunSystem nodes', () => {
    const state = createInitialState();
    const nodes = state.run.graph.nodes.filter(node => node.id !== 'lion-nomad-crossroads');
    expect(auditTraversalT0Route(t0(), nodes)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_RUN_NODE', subjectId: 'lion-nomad-crossroads' }),
    ]));
  });

  it('matches every T0 checkpoint, branch and painted location to its campaign stage', () => {
    const locations = new Set(TRAVERSAL_T0_WORLD.map(section => section.id));
    expect(auditTraversalRouteAuthoring(t0(), route(), T0_ROUTE_SEGMENTS, locations)).toEqual([]);

    const wrongStage = { ...T0_ROUTE_SEGMENTS[1]!, nextCheckpointId: 'lion-witnesses' };
    const wrongLocation = { ...T0_ROUTE_SEGMENTS[2]!, worldSectionId: 'missing-clearing' };
    const drifted = T0_ROUTE_SEGMENTS.map((segment, index) => index === 1 ? wrongStage
      : index === 2 ? wrongLocation : segment);
    expect(auditTraversalRouteAuthoring(t0(), route(), drifted, locations)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CHECKPOINT_MAPPING', subjectId: 'T0:1' }),
      expect.objectContaining({ code: 'MISSING_LOCATION', subjectId: 'route-3' }),
    ]));
    const resolved = route();
    const injected = { ...resolved, beats: [...resolved.beats, {
      ...resolved.beats[0]!, id: 'invented-stage', campaignNodeIds: ['lion-witnesses'],
    }] };
    expect(auditTraversalRouteAuthoring(t0(), injected, T0_ROUTE_SEGMENTS, locations))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'BEAT_MAPPING', subjectId: 'invented-stage' }),
      ]));
  });

  it('derives road progress from authored beats, including the branch and arrival', () => {
    const resolved = route();
    expect(T0_ROUTE_SEGMENTS.map((_, index) => traversalRouteProgressBounds(resolved, index)))
      .toEqual([
        { start: 0, end: .2 }, { start: .2, end: .4 },
        { start: .4, end: .6 }, { start: .6, end: .8 },
        { start: .8, end: .91 }, { start: .91, end: 1 },
      ]);
  });
});
