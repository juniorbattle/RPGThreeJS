// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 3: the QA driver plays the Scorpion (DRAFT) on both paths, from ends of the Dragon that the
 * driver itself played from ends of the Bear, themselves played from genuine demo saves whose Lion chronicle ended. Each
 * scenario checks the outcome, the clan relations, the reputation the plateau moved, and that the scenes name the
 * causes, the Bear's and the Dragon's included.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../game/__fixtures__/demo-v6-lion-force-complete.json';
import { SCORPION_FINALE } from '../campaign/plateaux/scorpion/scorpionFinale';
import { computePlateauReputationBounds } from '../game/reputationBounds';
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

/** An honourable Dragon (the Chaman des Ombres fallen, the altar's shard sealed), after an honourable Bear. */
const dragonHonourEnd = playPlateau('dragon', playBearPlateau(lionEnd(lionHonourComplete, 57), {
  name: 'Bear honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['bear-poi-mine-lift-cache', 'bear-poi-depths-reserve'],
}).state, {
  name: 'Dragon honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['dragon-poi-terrace-cache', 'dragon-poi-peak-reserve'],
  forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' },
}).state;
/** A greedy Dragon (the Crystal kept, the Seal taken from Kaelen), after a greedy Bear. */
const dragonForceEnd = playPlateau('dragon', playBearPlateau(lionEnd(lionForceComplete, 40), {
  name: 'Bear greed', prefer: 'greed', intent: 'claim_recognition', answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' },
}).state, {
  name: 'Dragon greed', prefer: 'greed', intent: 'claim_recognition', answers: { dragon_wolf_envoy: 'dragonWolfOfferRefused', dragon_wolf_lair: 'dragonCrystalKept' },
}).state;

const said = (run: PlateauPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId).map((line) => line.text).join('\n');

const HONOUR: PlateauScenario = {
  name: 'perfect honour', prefer: 'merit', intent: 'claim_recognition',
  guardianChests: ['scorpion-poi-ruin-cache', 'scorpion-poi-sanctum-reserve'],
};
const KEPT: PlateauScenario = {
  name: 'greed, codex kept', prefer: 'greed', intent: 'claim_recognition',
  answers: { scorpion_phoenix_faithful: 'scorpionOathRefused', scorpion_phoenix_temple: 'scorpionCodexKept' },
};
const OATH: PlateauScenario = {
  name: 'oath to the Phénix, codex left to it', prefer: 'greed', intent: 'claim_recognition',
  answers: { scorpion_phoenix_faithful: 'scorpionPhoenixOath', scorpion_phoenix_temple: 'scorpionCodexProtected' },
};
const VOLUNTARY: PlateauScenario = { name: 'honour, voluntary trial', prefer: 'merit', intent: 'request_trial' };

describe('Scorpion plateau QA driver (set 1.20.0, Lot 3 draft)', () => {
  it('starts from a finished Dragon: the Dragon and Wolf relations stand, the Scorpion and Phénix are met as neutral', () => {
    const run = playPlateau('scorpion', dragonHonourEnd, HONOUR, 20261110, 'scorpion-opening-ambush');
    expect(run.state.run.id).toBe('scorpion-20261110');
    expect(run.state.campaign!.chapters.dragon).toEqual({ status: 'completed', outcome: 'honour' });
    expect(getClanRelation(run.state, 'dragon')).toBe('ally');
    expect(getClanRelation(run.state, 'wolf')).toBe('enemy');
    expect([getClanRelation(run.state, 'scorpion'), getClanRelation(run.state, 'phoenix')]).toEqual(['neutral', 'neutral']);
    expect(said(run, 'scorpion_audience')).toContain('Kaelen vous a confié le Sceau du Dragon');
  });

  it('plays a perfect honour run: the Grand Inquisiteur seals the alliance, the Prophète des Ombres falls, +6 reputation', () => {
    const run = playPlateau('scorpion', dragonHonourEnd, HONOUR, 20261110);
    const { state } = run;
    expect(state.run.status).toBe('completed');
    expect(state.endingId).toBe('scorpion-seal-honour');
    expect(state.campaign!.chapters.scorpion).toEqual({ status: 'completed', outcome: 'honour' });
    expect(state.campaign!.currentChapterId).toBe('finale');
    expect(getClanRelation(state, 'scorpion')).toBe('ally');
    expect(getClanRelation(state, 'phoenix')).toBe('enemy');
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('scorpion').perfectMax);
    expect(run.fights).toEqual(expect.arrayContaining(['scorpion_guardian_flamekeeper', 'scorpion_guardian_zealot', 'scorpion_temple_assault',
      'scorpion_shadow_prophet']));
    expect(run.fights).not.toContain('scorpion_inquisitor');
    const judgement = said(run, 'scorpion_judgement');
    const named = SCORPION_FINALE.deeds.filter((entry) => entry.kind === 'merit' && entry.flag !== SCORPION_FINALE.honourFact && state.flags[entry.flag]);
    expect(named.map((deed) => deed.flag).sort()).toEqual(['scorpionAshesRespected', 'scorpionFaithfulFreed', 'scorpionLibraryRespected',
      'scorpionMandateHonour', 'scorpionOathRefused', 'scorpionRiddleSolved', 'scorpionWardsRespected']);
    for (const deed of named) expect(judgement, deed.flag).toContain(deed.phrase);
    expect(judgement).toContain('vous m’avez rapporté le codex prophétique');
    expect(judgement).toContain(SCORPION_FINALE.witnesses.supportive);
    expect(judgement).toContain(SCORPION_FINALE.evidence.text);
    // The Bear's dark ore and the Dragon's altar shard are named beside the soiled page; the freed faithful at the cell.
    const texts = said(run, 'scorpion_corrupted_texts');
    expect(texts).toContain('éclat du filon sombre de l’Ours');
    expect(texts).toContain('la même souillure que l’éclat de l’autel du Cristal');
    expect(said(run, 'scorpion_prophet_traces')).toContain('fidèle que vous avez arraché aux érudits parlait de ce prophète');
    expect(said(run, 'scorpion_vigil')).toContain('fidèles du Phénix ont laissé une lampe à notre porte');
    expect(said(run, 'scorpion_epilogue')).toContain('le Grand Inquisiteur a scellé l’alliance du Scorpion');
    expect(said(run, 'scorpion_epilogue')).toContain('Quatre Sceaux');
  });

  it('plays a greedy run from a greedy Dragon: the claim is rejected, the Seal is taken from the Grand Inquisiteur by the trial', () => {
    const run = playPlateau('scorpion', dragonForceEnd, KEPT);
    const { state } = run;
    expect(said(run, 'scorpion_audience')).toContain('Sceau du Dragon arraché à Kaelen');
    expect(said(run, 'scorpion_corrupted_texts')).not.toContain('filon sombre');
    expect(state.endingId).toBe('scorpion-seal-force');
    expect(state.campaign!.chapters.scorpion.outcome).toBe('force');
    expect(state.flags.scorpionFinaleTrialSelected).toBe(true);
    expect(state.flags.scorpionTrialRequested).toBe(false);
    expect(run.fights).toEqual(expect.arrayContaining(['scorpion_temple_seizure', 'scorpion_inquisitor']));
    expect(getClanRelation(state, 'scorpion')).toBe('enemy');
    expect(getClanRelation(state, 'phoenix')).toBe('enemy');
    expect(getClanRelation(state, 'dragon')).toBe('enemy');
    expect(state.reputation).toBeLessThan(run.reputationStart);
    const judgement = said(run, 'scorpion_judgement');
    expect(judgement).toContain('vous avez gardé le codex pour votre clan');
    expect(judgement).toContain('vous avez livré un fidèle du Phénix à nos interrogatoires');
    expect(judgement).toContain(SCORPION_FINALE.witnesses.silenced);
    expect(said(run, 'scorpion_epilogue')).toContain('le Scorpion n’oubliera pas ce Sceau arraché');
  });

  it('keeps the Phénix an ally after an oath kept and the codex left to it, against the force outcome', () => {
    const run = playPlateau('scorpion', dragonForceEnd, OATH);
    const { state } = run;
    expect(state.campaign!.chapters.scorpion.outcome).toBe('force');
    expect(run.fights).not.toContain('scorpion_temple_assault');
    expect(run.fights).not.toContain('scorpion_temple_seizure');
    expect(said(run, 'scorpion_phoenix_temple')).toContain('serment fait à nos fidèles');
    expect(getClanRelation(state, 'scorpion')).toBe('enemy');
    expect(getClanRelation(state, 'phoenix')).toBe('ally');
    expect(getClanRelationCauses(state, 'phoenix')).toContain('scorpion.codex');
    const judgement = said(run, 'scorpion_judgement');
    expect(judgement).toContain('vous avez laissé le codex au Phénix');
    expect(judgement).toContain('vous avez juré fidélité au Phénix');
  });

  it('lets an honourable company still ask for the trial, at a cost', () => {
    const run = playPlateau('scorpion', dragonHonourEnd, VOLUNTARY);
    const { state } = run;
    expect(state.campaign!.chapters.scorpion.outcome).toBe('force');
    expect(state.flags.scorpionTrialRequested).toBe(true);
    expect(run.fights).toContain('scorpion_inquisitor');
    // The route's +3 (no guardian taken, no claim), with the voluntary trial (-1).
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('scorpion').honourFloor - 1 - 1);
  });

  it('saves and resumes a finished Scorpion through the V6 envelope with its record intact', () => {
    const run = playPlateau('scorpion', dragonHonourEnd, HONOUR);
    const saves = new SaveRepository();
    saves.saveAuto(run.state);
    const resumed = saves.loadAuto()!;
    expect(resumed.campaign).toEqual(run.state.campaign);
    expect(resumed.endingId).toBe('scorpion-seal-honour');
    expect(resumed.run.id).toBe(run.state.run.id);
    localStorage.clear();
  });
});
