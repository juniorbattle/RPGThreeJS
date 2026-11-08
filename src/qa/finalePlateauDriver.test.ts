// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 4: the QA driver plays the final act (DRAFT) from ends of the Scorpion that the driver itself
 * played, through the Bear and the Dragon, from genuine demo saves whose Lion chronicle ended. Each scenario checks the
 * Tournament board RunSystem keeps, the relations the verdicts set, the supports and enemy-clan foes RunSystem prepares
 * before each fight, the reputation the act moves, and that the scenes name the causes, the four plateaux's included.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../game/__fixtures__/demo-v6-lion-force-complete.json';
import { computePlateauReputationBounds } from '../game/reputationBounds';
import { tournamentBoard } from '../game/finalAct';
import { getClanRelation, getClanRelationCauses } from '../game/runSystem';
import { migrateState, SaveRepository } from '../game/store';
import type { GameState } from '../game/types';
import { playBearPlateau } from './bearPlateauDriver';
import { playPlateau, type PlateauPlaythrough, type PlateauScenario } from './plateauDriver';

function lionEnd(fixture: unknown, reputation: number): GameState {
  const state = migrateState(structuredClone(fixture));
  state.reputation = reputation;
  return state;
}

/** An honourable company: every plateau won by the honour path, every evidence sealed. */
const honourEnd = (() => {
  const bear = playBearPlateau(lionEnd(lionHonourComplete, 57), { name: 'Bear', prefer: 'merit', intent: 'claim_recognition',
    guardianChests: ['bear-poi-mine-lift-cache', 'bear-poi-depths-reserve'] }).state;
  const dragon = playPlateau('dragon', bear, { name: 'Dragon', prefer: 'merit', intent: 'claim_recognition',
    guardianChests: ['dragon-poi-terrace-cache', 'dragon-poi-peak-reserve'], forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' } }).state;
  return playPlateau('scorpion', dragon, { name: 'Scorpion', prefer: 'merit', intent: 'claim_recognition',
    guardianChests: ['scorpion-poi-ruin-cache', 'scorpion-poi-sanctum-reserve'] }).state;
})();
/** A greedy company: the dark ore seized, the Crystal and the codex kept, every Seal taken by the trial. */
const forceEnd = (() => {
  const bear = playBearPlateau(lionEnd(lionForceComplete, 40), { name: 'Bear', prefer: 'greed', intent: 'claim_recognition',
    answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' } }).state;
  const dragon = playPlateau('dragon', bear, { name: 'Dragon', prefer: 'greed', intent: 'claim_recognition',
    answers: { dragon_wolf_envoy: 'dragonWolfOfferRefused', dragon_wolf_lair: 'dragonCrystalKept' } }).state;
  return playPlateau('scorpion', dragon, { name: 'Scorpion', prefer: 'greed', intent: 'claim_recognition',
    answers: { scorpion_phoenix_faithful: 'scorpionOathRefused', scorpion_phoenix_temple: 'scorpionCodexKept' } }).state;
})();

const said = (run: PlateauPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId).map((line) => line.text).join('\n');
const config = (run: PlateauPlaythrough, combatId: string) => run.configs.find((entry) => entry.id === combatId)!;

const HONOUR: PlateauScenario = { name: 'honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['finale-poi-reserve'] };
const GREED: PlateauScenario = { name: 'greed', prefer: 'greed', intent: 'claim_recognition' };

describe('final act QA driver (set 1.20.0, Lot 4 draft)', () => {
  it('opens on the Tournament board RunSystem keeps, in order, and stops before the final', () => {
    const run = playPlateau('finale', honourEnd, HONOUR, 20261111, 'finale-bout-serpent');
    expect(run.state.run.id).toBe('finale-20261111');
    expect(run.state.campaign!.chapters.scorpion).toEqual({ status: 'completed', outcome: 'honour' });
    const board = tournamentBoard(run.state);
    expect(board.entered).toBe(true);
    expect(board.entries.map((entry) => [entry.nodeId, entry.status, entry.result])).toEqual([
      ['finale-bout-raven', 'done', 'Victoire · champion relevé'],
      ['finale-bout-wolf', 'done', 'Victoire · champion relevé'],
      ['finale-bout-phoenix', 'done', 'Victoire · champion relevé'],
      ['finale-bout-serpent', 'next', 'À combattre'],
      ['finale-arena-chaos', 'locked', 'À venir'],
    ]);
    // A Tournament fight is not a POI: the map's first POI is still unplayed.
    expect(run.state.resolvedNodeIds.some((id) => id.startsWith('finale-'))).toBe(false);
    expect(run.fights).toEqual(['finale_raven_bout', 'finale_wolf_bout', 'finale_phoenix_bout']);
  });

  it('plays an honourable final act: the rivals become unexpected allies, every ally supports, +4 reputation', () => {
    const run = playPlateau('finale', honourEnd, HONOUR, 20261111);
    const { state } = run;
    expect(state.run.status).toBe('completed');
    expect(state.endingId).toBe('finale-breach');
    expect(state.campaign!.chapters.finale.status).toBe('completed');
    for (const clan of ['lion', 'bear', 'dragon', 'scorpion', 'raven', 'wolf', 'phoenix'] as const) expect(getClanRelation(state, clan), clan).toBe('ally');
    expect(getClanRelation(state, 'serpent')).toBe('enemy');
    expect(getClanRelationCauses(state, 'raven')).toContain('finale.tournament.raven');
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('finale').perfectMax);
    // Before each fight RunSystem names every allied clan's support, but the one of the clan fought.
    expect(config(run, 'finale_raven_bout').supports!.map((support) => support.id)).toEqual(
      ['support_lion', 'support_bear', 'support_dragon', 'support_scorpion']);
    expect(config(run, 'finale_breach').supports!).toHaveLength(7);
    // The Serpent, always an enemy, adds its foe to the final; no other clan adds one to an honourable company.
    expect(config(run, 'finale_serpent_final').escortVisualIds).toEqual(['serpent_raider', 'serpent_raider']);
    expect(config(run, 'finale_breach').escortVisualIds).toEqual(['breach_demon', 'serpent_raider']);
    expect(run.fights).toEqual(expect.arrayContaining(['finale_serpent_final', 'finale_arena_assault', 'finale_breach', 'finale_guardian_ramparts']));
    expect(run.fights).not.toContain('finale_demon_square');
    // The scenes name their causes.
    expect(said(run, 'finale_betrayal')).toContain('Vous ne m’avez jamais écouté');
    const rally = said(run, 'finale_allied_rally');
    for (const phrase of ['les guerriers d’Alaric tiennent parole', 'les guerriers de Borin tiennent parole', 'les gardiens de Kaelen tiennent parole',
      'les érudits du Grand Inquisiteur tiennent parole', 'le champion du Corbeau que vous avez relevé dans l’arène']) expect(rally, phrase).toContain(phrase);
    const vigil = said(run, 'finale_last_vigil');
    for (const phrase of ['l’éclat que vous avez rapporté des mines de l’Ours', 'l’éclat de la souillure du Cristal', 'la page souillée du codex',
      'les civils que vous avez couverts dans l’arène', 'les habitants que vous avez dégagés des décombres']) expect(vigil, phrase).toContain(phrase);
    expect(vigil).toMatch(/les preuves des Ombres (confiées à Alaric|que nous gardons depuis les plaines)/);
  });

  it('plays a greedy final act: Maelor names the advice the company followed, the enemy clans add their foes', () => {
    const run = playPlateau('finale', forceEnd, GREED, 20261112);
    const { state } = run;
    expect(state.endingId).toBe('finale-breach');
    expect(said(run, 'finale_betrayal')).toContain(
      'le filon sombre gardé pour le clan, le Cristal gardé pour le clan, le codex gardé pour le clan et la page souillée brûlée sur mon conseil. '
      + 'Et dans cette arène encore, les champions du Corbeau, du Loup et du Phénix humiliés devant les clans.');
    for (const clan of ['raven', 'wolf', 'phoenix', 'bear', 'dragon', 'scorpion', 'serpent'] as const) expect(getClanRelation(state, clan), clan).toBe('enemy');
    expect(getClanRelation(state, 'lion')).toBe('neutral');
    // An enemy clan is a redoubtable opponent at the Tournament, and its foes fill the capital's formations.
    expect(config(run, 'finale_raven_bout').enemyVisualIds).toEqual(['raven_champion', 'raven_scout', 'raven_scout']);
    expect(config(run, 'finale_raven_bout').supports).toBeUndefined();
    expect(config(run, 'finale_burning_streets').enemyVisualIds).toEqual(['breach_demon', 'breach_demon', 'bear_warrior', 'raven_scout']);
    expect(config(run, 'finale_breach').escortVisualIds).toEqual(['breach_demon', 'bear_warrior', 'raven_scout']);
    expect(run.fights).toContain('finale_demon_square');
    expect(state.reputation).toBeLessThan(run.reputationStart);
    const rally = said(run, 'finale_allied_rally');
    for (const phrase of ['Alaric garde ses guerriers loin de nous', 'les guerriers de Borin n’ont pas oublié', 'les gardiens de Kaelen n’ont pas oublié',
      'les érudits du Grand Inquisiteur n’ont pas oublié', 'le champion du Loup humilié devant les clans']) expect(rally, phrase).toContain(phrase);
    expect(said(run, 'finale_last_vigil')).toContain('la foule laissée dans les tribunes');
  });

  it('saves and resumes in the middle of the Tournament, and a finished final act, through the V6 envelope', () => {
    const saves = new SaveRepository();
    const mid = playPlateau('finale', honourEnd, HONOUR, 20261111, 'finale-arena-chaos');
    saves.saveAuto(mid.state);
    const resumed = saves.loadAuto()!;
    expect(resumed.run.id).toBe(mid.state.run.id);
    expect(tournamentBoard(resumed).entries.map((entry) => entry.status)).toEqual(['done', 'done', 'done', 'done', 'next']);
    const done = playPlateau('finale', honourEnd, HONOUR, 20261111);
    saves.saveAuto(done.state);
    expect(saves.loadAuto()!.campaign).toEqual(done.state.campaign);
    localStorage.clear();
  });
});
