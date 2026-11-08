import { describe, expect, it } from 'vitest';
import { createRunState, generateRunGraph, plateauCampaignForRun } from '../../game/runSystem';
import { LION_CANONICAL_POI_IDS, LOT_E_ELITES, LOT_E_POIS } from '../LionPoiAuthoring';
import { LION_TRAVERSAL_LEGS } from '../LionCampaignTravelRelations';
import {
  CAMPAIGN_CHAPTER_IDS,
  CAMPAIGN_CLAN_IDS,
  PLATEAU_REGISTRY,
  SEAL_PLATEAU_IDS,
  getPlateau,
  nextChapterId,
  plateauForNodeId,
  requirePlateauCampaign,
} from './PlateauRegistry';
import { LION_OUTCOME_FACTS, resolveLionPlateauOutcome } from './lionPlateau';

describe('post-demo plateau registry (set 1.20.0, Lot 0)', () => {
  it('orders four Seal plateaux then the final act, with the Phoenix plateau retired', () => {
    expect(PLATEAU_REGISTRY.map((entry) => entry.id)).toEqual(['lion', 'bear', 'dragon', 'scorpion', 'finale']);
    expect(CAMPAIGN_CHAPTER_IDS).toEqual(['lion', 'bear', 'dragon', 'scorpion', 'finale']);
    expect(SEAL_PLATEAU_IDS).toEqual(['lion', 'bear', 'dragon', 'scorpion']);
    expect(PLATEAU_REGISTRY.map((entry) => entry.order)).toEqual([1, 2, 3, 4, 5]);
    expect(getPlateau('finale').kind).toBe('final_act');
    expect(PLATEAU_REGISTRY.some((entry) => (entry.id as string) === 'phoenix')).toBe(false);
    expect(nextChapterId('lion')).toBe('bear');
    expect(nextChapterId('scorpion')).toBe('finale');
    expect(nextChapterId('finale')).toBeNull();
  });

  it('pairs each plateau with the roadmap duality, every clan appearing once', () => {
    const pairs = PLATEAU_REGISTRY.filter((entry) => entry.kind === 'seal_plateau')
      .map((entry) => [entry.id, entry.hostClan, entry.rivalClan, entry.roadmapSections.join()]);
    expect(pairs).toEqual([
      ['lion', 'lion', 'serpent', '§3.1'],
      ['bear', 'bear', 'raven', '§3.2'],
      ['dragon', 'dragon', 'wolf', '§3.3'],
      ['scorpion', 'scorpion', 'phoenix', '§3.4'],
    ]);
    const clans = pairs.flatMap(([, host, rival]) => [host, rival]);
    expect([...clans].sort()).toEqual([...CAMPAIGN_CLAN_IDS].sort());
  });

  it('designates the Scorpion chief by his title until the operator validates a name (P5)', () => {
    expect(getPlateau('scorpion').chief).toEqual({ title: 'Grand Inquisiteur', name: null });
    expect(JSON.stringify(PLATEAU_REGISTRY.map(({ campaign: _campaign, ...entry }) => entry))).not.toMatch(/Kael(?!en)/);
  });

  it('reserves distinct ID prefixes and leaves every Lion durable ID unchanged', () => {
    const prefixes = PLATEAU_REGISTRY.map((entry) => entry.idPrefix);
    expect(prefixes).toEqual(['lion-', 'bear-', 'dragon-', 'scorpion-', 'finale-']);
    for (const prefix of prefixes) {
      expect(prefixes.filter((other) => other !== prefix && other.startsWith(prefix))).toEqual([]);
    }
    const graphIds = generateRunGraph(20261108).nodes.map((node) => node.id);
    expect(graphIds).toHaveLength(33);
    expect(graphIds.every((id) => plateauForNodeId(id)?.id === 'lion')).toBe(true);
    expect([...graphIds].sort()).toEqual([...LION_CANONICAL_POI_IDS, ...LOT_E_POIS.map((poi) => poi.id)].sort());
  });

  it('binds the Lion to its existing tables without copying or changing them', () => {
    const lion = requirePlateauCampaign('lion');
    expect(getPlateau('lion').status).toBe('canon');
    expect(lion.canonicalNodeIds).toBe(LION_CANONICAL_POI_IDS);
    expect(lion.canonicalNodeIds).toHaveLength(21);
    expect(lion.optionalNodeIds).toHaveLength(12);
    expect(lion.guardianIds).toEqual(LOT_E_ELITES.map((elite) => elite.id));
    expect(lion.refugeNodeIds).toEqual(['lion-first-refuge', 'lion-second-refuge']);
    expect(lion.finalRefugeNodeId).toBe('lion-final-refuge');
    expect(lion.judgementNodeId).toBe('lion-final-judgement');
    expect(lion.branchCommitments).toEqual([
      { legId: 'T0', resolvingNodeId: 'lion-first-refuge' },
      { legId: 'T1', resolvingNodeId: 'lion-village-choice' },
      { legId: 'T3', resolvingNodeId: 'lion-shadow-signs' },
    ]);
    for (const { legId } of lion.branchCommitments) {
      expect(LION_TRAVERSAL_LEGS.find((leg) => leg.id === legId)?.stages.some((stage) => stage.mode === 'IN_TRAVERSAL_FORK')).toBe(true);
    }
    expect(lion.challengeCombatIds).toHaveLength(7);
    expect(lion.atlasIds).toHaveLength(3);
    expect(plateauCampaignForRun(createRunState(7))).toBe(lion);
    expect(plateauCampaignForRun({ id: 'legacy-run' })).toBe(lion);
  });

  it('builds the Bear as a playable draft (Lot 1) while the later chapters stay reserved without content', () => {
    expect(getPlateau('bear').status).toBe('draft');
    expect(requirePlateauCampaign('bear').runIdPrefix).toBe('bear-');
    expect(requirePlateauCampaign('bear').topology.plateauId).toBe('bear');
    for (const id of ['dragon', 'scorpion', 'finale'] as const) {
      expect(getPlateau(id).status).toBe('planned');
      expect(getPlateau(id).campaign).toBeNull();
      expect(() => requirePlateauCampaign(id)).toThrow(/not built/);
    }
  });

  it('reads the Lion outcome from its boss victory facts: Serpent pursuit is honour, Lion trial is force', () => {
    expect(LION_OUTCOME_FACTS).toEqual({ honour: 'serpentGeneralDefeated', force: 'lionTrialWon' });
    expect(resolveLionPlateauOutcome({})).toBeNull();
    expect(resolveLionPlateauOutcome({ lionTrialRequested: true })).toBeNull();
    expect(resolveLionPlateauOutcome({ serpentGeneralDefeated: true })).toBe('honour');
    expect(resolveLionPlateauOutcome({ lionTrialWon: true })).toBe('force');
  });
});
