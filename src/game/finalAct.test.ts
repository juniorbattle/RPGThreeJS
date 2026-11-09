// @vitest-environment happy-dom
/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Final act", COMBAT_AND_VFX "Clan supports"), post-demo Lot 4: RunSystem's authority
 * over the final act. The board is read from saved facts only; supports and enemy-clan foes are derived from the saved
 * relations before each fight and never saved; the act closes once, after the breach.
 */
import { describe, expect, it } from 'vitest';
import { POST_DEMO_COMBATS } from './postDemoContent';
import {
  campaignEndingId, completeCampaignEnding, completeFinalAct, finalActCombatConfig, isTournamentComplete, nextEpilogueStep, nextTournamentStep,
  tournamentBoard,
} from './finalAct';
import { createInitialState } from './store';
import { meetClan, setClanRelation } from './campaignRelations';
import type { GameState } from './types';

const combat = (id: string) => POST_DEMO_COMBATS.get(id)!;

function withRelations(stances: Partial<Record<'lion' | 'bear' | 'raven' | 'dragon' | 'wolf' | 'scorpion' | 'phoenix' | 'serpent', 'ally' | 'neutral' | 'enemy'>>): GameState {
  const state = createInitialState();
  for (const [clan, stance] of Object.entries(stances)) {
    meetClan(state, clan as never, 'test.arrival');
    setClanRelation(state, clan as never, stance!, 'test.cause');
  }
  return state;
}

describe('the Tournament board (set 1.20.0, Lot 4)', () => {
  it('reads its order and progress from saved facts: a won bout waits for its verdict before the next fight', () => {
    const state = createInitialState();
    expect(tournamentBoard(state).entered).toBe(false);
    expect(nextTournamentStep(state)).toMatchObject({ entry: { nodeId: 'finale-bout-raven' }, action: 'fight' });
    state.flags.finaleRavenBoutWon = true;
    expect(nextTournamentStep(state)).toMatchObject({ entry: { nodeId: 'finale-bout-raven' }, action: 'after' });
    expect(tournamentBoard(state).entries[0]).toMatchObject({ status: 'after', result: 'Victoire · le verdict attend' });
    state.flags.finaleRavenHumiliated = true;
    expect(tournamentBoard(state).entries.map((entry) => entry.status)).toEqual(['done', 'next', 'locked', 'locked', 'locked']);
    Object.assign(state.flags, { finaleWolfBoutWon: true, finaleWolfSpared: true, finalePhoenixBoutWon: true, finalePhoenixSpared: true,
      finaleSerpentChampionFallen: true, finaleBreachOpened: true });
    expect(nextTournamentStep(state)).toMatchObject({ entry: { nodeId: 'finale-arena-chaos' }, action: 'opening' });
    expect(isTournamentComplete(state)).toBe(false);
    state.flags.finaleArenaEscaped = true;
    expect(isTournamentComplete(state)).toBe(true);
    expect(nextTournamentStep(state)).toBeNull();
    expect(tournamentBoard(state).entries.map((entry) => entry.result)).toEqual(['Victoire · champion humilié', 'Victoire · champion relevé',
      'Victoire · champion relevé', 'Victoire · la brèche s’ouvre', 'Arène quittée']);
  });
});

describe('clan supports and enemy-clan foes before a final-act fight (set 1.20.0, Lot 4)', () => {
  it('gives every allied clan’s support but the one of the clan fought, and changes nothing outside the final act', () => {
    const state = withRelations({ lion: 'ally', bear: 'ally', raven: 'ally', serpent: 'enemy' });
    expect(finalActCombatConfig(state, combat('finale_raven_bout')).supports!.map((support) => support.id)).toEqual(['support_lion', 'support_bear']);
    expect(finalActCombatConfig(state, combat('finale_breach')).supports!.map((support) => [support.clanLabel, support.label, support.skillId])).toEqual([
      ['Clan du Lion', 'Lames du Lion', 'w_whirl'], ['Clan de l’Ours', 'Rempart de l’Ours', 'p_oathwall'], ['Clan du Corbeau', 'Fumée du Corbeau', 'ni_smoke_bomb']]);
    const scorpionFight = POST_DEMO_COMBATS.get('scorpion_inquisitor')!;
    expect(finalActCombatConfig(state, scorpionFight)).toBe(scorpionFight);
  });

  it('adds one foe per enemy clan its rule names, in the order the company met them, up to the free places', () => {
    const state = withRelations({ bear: 'enemy', raven: 'enemy', dragon: 'enemy', wolf: 'enemy', scorpion: 'enemy', phoenix: 'enemy', serpent: 'enemy' });
    expect(finalActCombatConfig(state, combat('finale_wolf_bout')).enemyVisualIds).toEqual(['wolf_champion', 'wolf_hunter', 'wolf_raider']);
    expect(finalActCombatConfig(state, combat('finale_arena_assault')).escortVisualIds).toEqual(['breach_demon', 'breach_demon']);
    expect(finalActCombatConfig(state, combat('finale_burning_streets')).enemyVisualIds).toEqual(['breach_demon', 'breach_demon', 'bear_warrior', 'raven_scout']);
    expect(finalActCombatConfig(state, combat('finale_breach')).escortVisualIds).toEqual(['breach_demon', 'bear_warrior', 'raven_scout']);
    expect(finalActCombatConfig(state, combat('finale_breach')).supports).toBeUndefined();
    // A neutral clan neither supports nor opposes.
    expect(finalActCombatConfig(withRelations({ lion: 'neutral' }), combat('finale_breach')).escortVisualIds).toEqual(['breach_demon']);
  });
});

describe('the end of the final act (set 1.20.0, Lot 4)', () => {
  it('closes once, only after the breach is won', () => {
    const state = createInitialState();
    state.campaign!.currentChapterId = 'finale';
    state.campaign!.chapters.finale.status = 'active';
    state.run.status = 'completed';
    expect(completeFinalAct(state)).toBe(false);
    state.flags.finaleEntityDefeated = true;
    expect(completeFinalAct(state)).toBe(true);
    expect(state.endingId).toBe('finale-breach');
    expect(state.campaign!.chapters.finale.status).toBe('completed');
    expect(completeFinalAct(state)).toBe(false);
  });
});

/** A won breach whose four plateaux ended on the given outcomes, at the given reputation, the act not yet closed. */
function wonBreach(outcomes: readonly ('honour' | 'force')[], reputation: number, stances: Parameters<typeof withRelations>[0] = {}): GameState {
  const state = withRelations(stances);
  (['lion', 'bear', 'dragon', 'scorpion'] as const).forEach((chapter, index) => {
    state.campaign!.chapters[chapter] = { status: 'completed', outcome: outcomes[index]! };
  });
  state.campaign!.currentChapterId = 'finale';
  state.campaign!.chapters.finale.status = 'active';
  state.run = { ...state.run, id: 'finale-20261111', status: 'completed' };
  state.flags.finaleEntityDefeated = true;
  state.reputation = reputation;
  return state;
}

describe('the endings (set 1.20.0, Lot 5 draft)', () => {
  it('records the ending R4 decides when the act closes, and names its epilogue', () => {
    const respect = wonBreach(['honour', 'honour', 'honour', 'force'], 70);
    expect(nextEpilogueStep(respect)).toBeNull();
    expect(completeFinalAct(respect)).toBe(true);
    expect([respect.campaign!.ending, respect.campaign!.finalAct.stage]).toEqual(['respect', 'epilogue']);
    expect(nextEpilogueStep(respect)).toEqual({ kind: 'dialogue', dialogueId: 'finale_epilogue_respect' });
    const balance = wonBreach(['honour', 'honour', 'honour', 'honour'], 39);
    completeFinalAct(balance);
    expect(nextEpilogueStep(balance)).toEqual({ kind: 'dialogue', dialogueId: 'finale_epilogue_balance' });
  });

  it('leads the Fear ending through its choice: the last stand then the closing scene, or the closing scene', () => {
    const state = wonBreach(['force', 'force', 'force', 'force'], 10);
    completeFinalAct(state);
    expect(nextEpilogueStep(state)).toEqual({ kind: 'dialogue', dialogueId: 'finale_epilogue_fear' });
    expect(completeCampaignEnding(state)).toBe(false);
    state.flags.finaleFearLastStand = true;
    expect(nextEpilogueStep(state)).toEqual({ kind: 'combat', combatId: 'finale_last_stand' });
    expect(completeCampaignEnding(state)).toBe(false);
    state.flags.finaleLastStandWon = true;
    expect(nextEpilogueStep(state)).toEqual({ kind: 'dialogue', dialogueId: 'finale_fear_close' });
    expect(completeCampaignEnding(state)).toBe(true);
    expect([state.campaign!.finalAct.stage, state.endingId]).toEqual(['completed', 'ending-fear-last-stand']);
    expect(nextEpilogueStep(state)).toBeNull();
    expect(completeCampaignEnding(state)).toBe(false);
    const fate = wonBreach(['force', 'force', 'force', 'honour'], 10);
    completeFinalAct(fate);
    fate.flags.finaleFearFateAccepted = true;
    expect(nextEpilogueStep(fate)).toEqual({ kind: 'dialogue', dialogueId: 'finale_fear_close' });
    expect(completeCampaignEnding(fate)).toBe(true);
    expect(fate.endingId).toBe('ending-fear-fate');
    expect(campaignEndingId('balance', {})).toBe('ending-balance');
  });

  it('ends the chronicle at the breach when the record lacks the four outcomes, as only a corrupted record does', () => {
    const state = wonBreach(['honour', 'honour', 'honour', 'honour'], 70);
    delete state.campaign!.chapters.scorpion.outcome;
    completeFinalAct(state);
    expect([state.campaign!.ending, state.campaign!.finalAct.stage, nextEpilogueStep(state)]).toEqual([null, 'completed', null]);
  });

  it('prepares the last stand alone against all: no support, the Serpent’s raider and the other enemy clans’ foes, four at most', () => {
    const state = withRelations({ lion: 'ally', bear: 'enemy', raven: 'enemy', dragon: 'enemy', wolf: 'enemy', scorpion: 'enemy', serpent: 'enemy' });
    const config = finalActCombatConfig(state, combat('finale_last_stand'));
    expect(config.supports).toBeUndefined();
    expect(config.enemyVisualIds).toEqual(['serpent_raider', 'bear_warrior', 'raven_scout', 'dragon_guardian']);
    const few = finalActCombatConfig(withRelations({ bear: 'enemy', serpent: 'enemy' }), combat('finale_last_stand'));
    expect(few.enemyVisualIds).toEqual(['serpent_raider', 'bear_warrior']);
  });
});
