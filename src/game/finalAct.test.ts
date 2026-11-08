// @vitest-environment happy-dom
/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Final act", COMBAT_AND_VFX "Clan supports"), post-demo Lot 4: RunSystem's authority
 * over the final act. The board is read from saved facts only; supports and enemy-clan foes are derived from the saved
 * relations before each fight and never saved; the act closes once, after the breach.
 */
import { describe, expect, it } from 'vitest';
import { POST_DEMO_COMBATS } from './postDemoContent';
import { completeFinalAct, finalActCombatConfig, isTournamentComplete, nextTournamentStep, tournamentBoard } from './finalAct';
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
