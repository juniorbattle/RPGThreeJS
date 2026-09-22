import { describe, expect, it } from 'vitest';
import { LION_TRAVERSAL_LEGS } from '../campaign/LionCampaignTravelRelations';
import { createInitialState } from '../game/store';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import { beatPassedProgress } from './TraversalRoadSpace';
import {
  auditTraversalT0Route,
  resolveTraversalBeatCrossing,
  resolveTraversalT0Route,
} from './TraversalT0Route';

function t0() {
  return LION_TRAVERSAL_LEGS.find((leg) => leg.id === 'T0')!;
}

describe('TraversalT0Route', () => {
  it('materializes campaign stages from the canonical relation without owning story order', () => {
    const state = createInitialState();
    const route = resolveTraversalT0Route(
      t0(),
      state.run.graph.nodes,
      state.clan.members.map((member) => member.definitionId),
    );
    const campaignBeats = route.beats.filter((beat) => beat.campaignNodeIds.length > 0 && !beat.branchNodeId);
    expect(campaignBeats.map((beat) => beat.campaignNodeIds))
      .toEqual(t0().stages.map((stage) => stage.nodeIds));
    expect(route.originNodeId).toBe(t0().originNodeId);
    expect(route.destinationNodeId).toBe(t0().destinationNodeId);
    expect(route.legId).toBe('T0');
  });

  it('uses exactly two normal lanes and centers every canonical mandatory stage', () => {
    const state = createInitialState();
    const route = resolveTraversalT0Route(t0(), state.run.graph.nodes);
    const optional = route.beats.filter((beat) => beat.interactionPolicy === 'OPTIONAL_CONFIRM');
    const mandatory = route.beats.filter((beat) => beat.interactionPolicy === 'MANDATORY_CONFIRM');
    expect(new Set(optional.map((beat) => beat.lane))).toEqual(new Set([0, 1]));
    expect(optional.every((beat) => beat.placement === 'LANE' && beat.lane !== null)).toBe(true);
    expect(mandatory.every((beat) => beat.placement === 'CENTERED' && beat.lane === null)).toBe(true);
  });

  it('uses Character System V2 for Cedric and canonical creature visuals', () => {
    const state = createInitialState();
    const route = resolveTraversalT0Route(
      t0(),
      state.run.graph.nodes,
      state.clan.members.map((member) => member.definitionId),
    );
    const cedric = route.beats.find((beat) => beat.campaignNodeIds.includes('lion-nomad-crossroads'));
    const enemy = route.beats.find((beat) => beat.type === 'enemy');
    const merchant = route.beats.find((beat) => beat.type === 'npc');
    expect(cedric?.characterId).toBe('cedric');
    expect(cedric?.visualAsset).toBe(resolveCharacterAsset('cedric', 'full'));
    expect(enemy?.visualAsset).toBe(resolveCharacterAsset('wolf', 'full'));
    expect(enemy?.mirrorX).toBe(true);
    expect(merchant?.characterId).toBe('wounded_merchant');
    expect(merchant?.visualAsset).toBe(resolveCharacterAsset('wounded_merchant', 'full'));
    expect(merchant?.locationId).toBe('merchant-halt');
    expect(cedric?.lane).toBeNull();
    expect(route.beats.filter(beat => beat.category === 'OPTIONAL_EVENT').every(beat => beat.lane === 0)).toBe(true);
    expect(route.beats.filter(beat => beat.category === 'OPTIONAL_COMBAT').every(beat => beat.lane === 1)).toBe(true);
    expect(route.beats.some(beat => beat.category === 'SIMPLE_OBSTACLE' || beat.id === 't0:obstacle:broken-cart')).toBe(false);
  });

  it('offers narrative decisions from either lane while combat remains avoidable by lane', () => {
    const state = createInitialState();
    const route = resolveTraversalT0Route(t0(), state.run.graph.nodes);
    const merchant = route.beats.find((beat) => beat.type === 'npc')!;
    const mandatory = route.beats.find((beat) => beat.interactionPolicy === 'MANDATORY_CONFIRM')!;
    expect(resolveTraversalBeatCrossing(merchant, 0, merchant.progress01, 0)).toBe('TRIGGERED');
    expect(resolveTraversalBeatCrossing(merchant, 0, merchant.progress01, 1)).toBe('TRIGGERED');
    const enemy = route.beats.find(beat => beat.category === 'OPTIONAL_COMBAT')!;
    expect(resolveTraversalBeatCrossing(enemy, 0, enemy.progress01, 0)).toBe('NONE');
    expect(resolveTraversalBeatCrossing(enemy, 0, enemy.progress01, 1)).toBe('TRIGGERED');
    expect(resolveTraversalBeatCrossing(merchant, merchant.progress01, beatPassedProgress(merchant.progress01), 1)).toBe('BYPASSED');
    expect(resolveTraversalBeatCrossing(mandatory, 0, mandatory.progress01, 0)).toBe('TRIGGERED');
    expect(resolveTraversalBeatCrossing(mandatory, 0, mandatory.progress01, 1)).toBe('TRIGGERED');
  });

  it('engages either chosen branch from either lane, with no optional bypass', () => {
    const route = resolveTraversalT0Route(t0(), createInitialState().run.graph.nodes);
    for (const beat of route.beats.filter(beat => beat.branchNodeId)) {
      expect(beat.category).toBe('MANDATORY_EVENT');
      expect(beat.interactionPolicy).toBe('MANDATORY_CONFIRM');
      for (const lane of [0, 1] as const) {
        expect(resolveTraversalBeatCrossing(beat, .90, .92, lane)).toBe('TRIGGERED');
      }
    }
  });

  it('rejects missing canonical RunSystem nodes', () => {
    const state = createInitialState();
    const nodes = state.run.graph.nodes.filter((node) => node.id !== 'lion-nomad-crossroads');
    expect(auditTraversalT0Route(t0(), nodes).some((issue) => (
      issue.code === 'MISSING_RUN_NODE' && issue.subjectId === 'lion-nomad-crossroads'
    ))).toBe(true);
  });
});
