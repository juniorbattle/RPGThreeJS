// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 1: RunSystem's passage from the Lion to the Bear, and the Bear's closing.
 *
 * The Lion closes from its existing victory facts: a genuine demo save whose chronicle ended (written by the `origin/dev`
 * demo code) continues into a Bear run with every Lion fact unchanged and the approved Lion relations set. The Bear
 * closes from its epilogue, and a relation an authored choice of the Bear set stands against the outcome.
 */
import { afterEach, describe, expect, it } from 'vitest';
import lionHonourComplete from './__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from './__fixtures__/demo-v6-lion-force-complete.json';
import midLion from './__fixtures__/demo-v6-mid-lion.json';
import bearMap from '../campaign/consequences/bear.consequences.json';
import lionMap from '../campaign/consequences/lion.consequences.json';
import { consequenceMapSchema } from '../campaign/consequences/ConsequenceMap';
import { requirePlateauCampaign } from '../campaign/plateaux/PlateauRegistry';
import {
  canBeginCurrentPlateau,
  closeCurrentPlateau,
  combatVictoryFacts,
  completePlateauChronicle,
  continueCampaign,
  nextPlayablePlateau,
  pendingPlateauFinaleCombat,
  plateauEpilogueDialogueId,
  runPlateauId,
} from './plateauProgression';
import { getClanRelation, getClanRelationCauses, isClanMet, selectPoiMap, setClanRelation } from './runSystem';
import { migrateState, SaveRepository } from './store';
import type { GameState } from './types';

afterEach(() => localStorage.clear());

const load = (fixture: unknown): GameState => migrateState(structuredClone(fixture));

function bearRunFrom(fixture: unknown, seed = 20261108): GameState {
  const state = load(fixture);
  if (!continueCampaign(state, seed)) throw new Error('The campaign did not continue.');
  return state;
}

describe('plateau progression (set 1.20.0, Lot 1)', () => {
  it('states the outcome relations exactly as the Lion and Bear consequence maps record them', () => {
    for (const [chapterId, raw] of [['lion', lionMap], ['bear', bearMap]] as const) {
      const map = consequenceMapSchema.parse(raw);
      const binding = requirePlateauCampaign(chapterId);
      expect(binding.outcomeRelations.honour).toEqual(map.outcomes.honour.clanRelations);
      expect(binding.outcomeRelations.force).toEqual(map.outcomes.force.clanRelations);
      expect(binding.resolveOutcome(Object.fromEntries(map.outcomes.honour.facts.map((fact) => [fact, true])))).toBe('honour');
      expect(binding.resolveOutcome(Object.fromEntries(map.outcomes.force.facts.map((fact) => [fact, true])))).toBe('force');
    }
  });

  it('continues an ended demo honour chronicle into a Bear run, with every Lion fact unchanged', () => {
    const before = load(lionHonourComplete);
    expect(nextPlayablePlateau(before)).toBe('bear');
    const state = bearRunFrom(lionHonourComplete);
    expect(runPlateauId(state)).toBe('bear');
    expect(state.run.id).toBe('bear-20261108');
    expect(state.run.status).toBe('active');
    expect(state.currentNodeId).toBe('bear-camp');
    expect(state.endingId).toBeNull();
    expect(selectPoiMap(state).nodes.filter((node) => node.canMove).map((node) => node.id)).toEqual(['bear-audience']);
    // Every saved Lion fact carries over unchanged.
    expect(state.flags).toEqual(before.flags);
    expect(state.reputation).toBe(before.reputation);
    expect(state.clan).toEqual(before.clan);
    expect(state.inventory).toEqual(before.inventory);
    expect(state.gold).toBe(before.gold);
    expect(state.resolvedNodeIds).toEqual(before.resolvedNodeIds);
    // The approved Lion relations, then the Bear's clans met as neutral.
    expect(state.campaign!.chapters.lion).toEqual({ status: 'completed', outcome: 'honour' });
    expect(state.campaign!.chapters.bear).toEqual({ status: 'active' });
    expect(state.campaign!.currentChapterId).toBe('bear');
    expect(getClanRelation(state, 'lion')).toBe('ally');
    expect(getClanRelation(state, 'serpent')).toBe('enemy');
    expect(getClanRelationCauses(state, 'lion')).toEqual(['lion.arrival', 'lion.outcome.honour']);
    expect(isClanMet(state, 'bear') && isClanMet(state, 'raven')).toBe(true);
    expect([getClanRelation(state, 'bear'), getClanRelation(state, 'raven')]).toEqual(['neutral', 'neutral']);
    expect(isClanMet(state, 'dragon')).toBe(false);
  });

  it('sets the force relations from an ended demo force chronicle', () => {
    const state = bearRunFrom(lionForceComplete);
    expect(state.campaign!.chapters.lion.outcome).toBe('force');
    expect(getClanRelation(state, 'lion')).toBe('neutral');
    expect(getClanRelation(state, 'serpent')).toBe('enemy');
  });

  it('saves and resumes the Bear run through the V6 envelope', () => {
    const state = bearRunFrom(lionHonourComplete);
    const saves = new SaveRepository();
    saves.saveAuto(state);
    const resumed = saves.loadAuto()!;
    expect(resumed.run.id).toBe('bear-20261108');
    expect(resumed.campaign).toEqual(state.campaign);
    expect(runPlateauId(resumed)).toBe('bear');
    expect(selectPoiMap(resumed).nodes.filter((node) => node.canMove).map((node) => node.id)).toEqual(['bear-audience']);
  });

  it('refuses to continue a chronicle that has not ended, and closes a plateau only once', () => {
    const mid = load(midLion);
    expect(nextPlayablePlateau(mid)).toBeNull();
    expect(continueCampaign(mid)).toBeNull();
    expect(mid.campaign!.currentChapterId).toBe('lion');
    const state = load(lionHonourComplete);
    expect(closeCurrentPlateau(state)).toEqual({ chapterId: 'lion', outcome: 'honour', nextChapterId: 'bear' });
    expect(closeCurrentPlateau(state)).toBeNull();
    expect(canBeginCurrentPlateau(state)).toBe(true);
    expect(continueCampaign(state, 7)?.id).toBe('bear-7');
    expect(continueCampaign(state, 8)).toBeNull();
  });

  it('closes the Bear from its epilogue: honour makes the Bear an ally and the Raven an enemy', () => {
    const state = bearRunFrom(lionHonourComplete);
    expect(completePlateauChronicle(state, 'bear')).toBeNull();
    Object.assign(state.flags, combatVictoryFacts('bear_master_spy'));
    state.run.status = 'completed';
    expect(completePlateauChronicle(state, 'lion')).toBeNull();
    expect(completePlateauChronicle(state, 'bear')).toEqual({ chapterId: 'bear', outcome: 'honour', nextChapterId: 'dragon' });
    expect(state.endingId).toBe('bear-seal-honour');
    expect(getClanRelation(state, 'bear')).toBe('ally');
    expect(getClanRelation(state, 'raven')).toBe('enemy');
    // The Dragon is not built: the campaign stops here with its record intact.
    expect(nextPlayablePlateau(state)).toBeNull();
    expect(continueCampaign(state)).toBeNull();
    expect(state.campaign!.currentChapterId).toBe('dragon');
  });

  it('keeps a Raven pact made in the mines against the force outcome', () => {
    const state = bearRunFrom(lionForceComplete);
    setClanRelation(state, 'raven', 'ally', 'bear.mines');
    Object.assign(state.flags, combatVictoryFacts('bear_borin'));
    state.run.status = 'completed';
    expect(completePlateauChronicle(state, 'bear')?.outcome).toBe('force');
    expect(getClanRelation(state, 'bear')).toBe('enemy');
    expect(getClanRelation(state, 'raven')).toBe('ally');
    expect(getClanRelationCauses(state, 'raven')).toEqual(['bear.arrival', 'bear.mines']);
  });

  it('routes the finale owners by plateau: pending fight, victory facts and epilogue', () => {
    const lion = load(lionHonourComplete);
    expect(plateauEpilogueDialogueId(lion)).toBe('epilogue');
    expect(combatVictoryFacts('bear_mines_defense')).toEqual({ bearRavenMinersDefeated: true });
    const bear = bearRunFrom(lionHonourComplete);
    expect(plateauEpilogueDialogueId(bear)).toBe('bear_epilogue');
    expect(pendingPlateauFinaleCombat(bear)).toBeNull();
    bear.flags.bearFinaleTrialSelected = true;
    expect(pendingPlateauFinaleCombat(bear)).toBe('bear_borin');
    Object.assign(bear.flags, combatVictoryFacts('bear_borin'));
    expect(pendingPlateauFinaleCombat(bear)).toBeNull();
  });
});
