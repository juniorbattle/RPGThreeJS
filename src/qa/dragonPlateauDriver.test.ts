// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 2: the QA driver plays the Dragon (DRAFT) on both paths, from ends of the Bear that the
 * driver itself played from genuine demo saves whose Lion chronicle ended. Each scenario checks the outcome, the clan
 * relations, the reputation the plateau moved, and that the scenes name the causes, the Lion's and the Bear's included.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../game/__fixtures__/demo-v6-lion-force-complete.json';
import { DRAGON_FINALE } from '../campaign/plateaux/dragon/dragonFinale';
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

/** An honourable Bear (the Master Spy fallen, the dark ore sealed), from the Lion's honour end. */
const bearHonourEnd = playBearPlateau(lionEnd(lionHonourComplete, 57), {
  name: 'Bear honour', prefer: 'merit', intent: 'claim_recognition', guardianChests: ['bear-poi-mine-lift-cache', 'bear-poi-depths-reserve'],
}).state;
/** A greedy Bear (the dark ore seized, the Seal taken from Borin), from the Lion's force end. */
const bearForceEnd = playBearPlateau(lionEnd(lionForceComplete, 40), {
  name: 'Bear greed', prefer: 'greed', intent: 'claim_recognition', answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' },
}).state;

const said = (run: PlateauPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId).map((line) => line.text).join('\n');

const HONOUR: PlateauScenario = {
  name: 'perfect honour', prefer: 'merit', intent: 'claim_recognition',
  guardianChests: ['dragon-poi-terrace-cache', 'dragon-poi-peak-reserve'],
  // The perfect run takes the two elite fights (+1 each); the quiet merits of those forks weigh in Kaelen's judgement only.
  forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' },
};
const KEPT: PlateauScenario = {
  name: 'greed, crystal kept', prefer: 'greed', intent: 'claim_recognition',
  answers: { dragon_wolf_envoy: 'dragonWolfOfferRefused', dragon_wolf_lair: 'dragonCrystalKept' },
};
const ALLIANCE: PlateauScenario = {
  name: 'Wolf pact, crystal left to the Wolf', prefer: 'greed', intent: 'claim_recognition',
  answers: { dragon_wolf_envoy: 'dragonWolfPact', dragon_wolf_lair: 'dragonWolfAlliance' },
};
const VOLUNTARY: PlateauScenario = { name: 'honour, voluntary trial', prefer: 'merit', intent: 'request_trial' };

describe('Dragon plateau QA driver (set 1.20.0, Lot 2 draft)', () => {
  it('starts from a finished Bear: the Bear and Raven relations stand, the Dragon and Wolf are met as neutral', () => {
    const run = playPlateau('dragon', bearHonourEnd, HONOUR, 20261109, 'dragon-opening-ambush');
    expect(run.state.run.id).toBe('dragon-20261109');
    expect(run.state.campaign!.chapters.bear).toEqual({ status: 'completed', outcome: 'honour' });
    expect(getClanRelation(run.state, 'bear')).toBe('ally');
    expect([getClanRelation(run.state, 'dragon'), getClanRelation(run.state, 'wolf')]).toEqual(['neutral', 'neutral']);
    expect(said(run, 'dragon_audience')).toContain('Borin vous a confié le Sceau de l’Ours');
  });

  it('plays a perfect honour run: Kaelen seals the alliance, the Chaman des Ombres falls, +12 reputation', () => {
    const run = playPlateau('dragon', bearHonourEnd, HONOUR, 20261109);
    const { state } = run;
    expect(state.run.status).toBe('completed');
    expect(state.endingId).toBe('dragon-seal-honour');
    expect(state.campaign!.chapters.dragon).toEqual({ status: 'completed', outcome: 'honour' });
    expect(state.campaign!.currentChapterId).toBe('scorpion');
    expect(getClanRelation(state, 'dragon')).toBe('ally');
    expect(getClanRelation(state, 'wolf')).toBe('enemy');
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('dragon').perfectMax);
    expect(run.fights).toEqual(expect.arrayContaining(['dragon_guardian_champion', 'dragon_guardian_wyrm', 'dragon_lair_assault', 'dragon_shadow_shaman']));
    expect(run.fights).not.toContain('dragon_kaelen');
    const judgement = said(run, 'dragon_judgement');
    const named = DRAGON_FINALE.deeds.filter((entry) => entry.kind === 'merit' && entry.flag !== DRAGON_FINALE.honourFact && state.flags[entry.flag]);
    expect(named.map((deed) => deed.flag).sort()).toEqual(['dragonMandateHonour', 'dragonTrapsDisarmed', 'dragonVillageProtected',
      'dragonWolfHeard', 'dragonWolfOfferRefused']);
    for (const deed of named) expect(judgement, deed.flag).toContain(deed.phrase);
    expect(judgement).toContain(DRAGON_FINALE.witnesses.supportive);
    expect(judgement).toContain(DRAGON_FINALE.evidence.text);
    // The Lion's Shadows and the Bear's dark ore are named at the altar; the heard Wolf warrior at the shaman's camp.
    const altar = said(run, 'dragon_crystal_altar');
    expect(altar).toContain('la même souillure que l’éclat du filon sombre');
    expect(altar).toMatch(/preuves des Ombres que nous (avons confiées au Lion|gardons encore pour nous)/);
    expect(said(run, 'dragon_shaman_traces')).toContain('guerrier du Loup que vous avez relâché parlait de ce chaman');
    expect(said(run, 'dragon_vigil')).toContain('du hameau ont fait monter du pain et du bois');
    expect(said(run, 'dragon_epilogue')).toContain('Kaelen a scellé l’alliance du Dragon');
  });

  it('plays a greedy run from a greedy Bear: the claim is rejected, the Seal is taken from Kaelen by the trial', () => {
    const run = playPlateau('dragon', bearForceEnd, KEPT);
    const { state } = run;
    expect(said(run, 'dragon_audience')).toContain('Sceau de l’Ours arraché à Borin');
    expect(state.endingId).toBe('dragon-seal-force');
    expect(state.campaign!.chapters.dragon.outcome).toBe('force');
    expect(state.flags.dragonFinaleTrialSelected).toBe(true);
    expect(state.flags.dragonTrialRequested).toBe(false);
    expect(run.fights).toEqual(expect.arrayContaining(['dragon_lair_seizure', 'dragon_kaelen']));
    expect(getClanRelation(state, 'dragon')).toBe('enemy');
    expect(getClanRelation(state, 'wolf')).toBe('enemy');
    expect(getClanRelation(state, 'bear')).toBe('enemy');
    expect(state.reputation).toBeLessThan(run.reputationStart);
    const judgement = said(run, 'dragon_judgement');
    expect(judgement).toContain('vous avez gardé le Cristal d’Écho pour votre clan');
    expect(judgement).toContain(DRAGON_FINALE.witnesses.silenced);
    expect(said(run, 'dragon_epilogue')).toContain('le Dragon n’oubliera pas ce Sceau arraché');
  });

  it('keeps the Wolf an ally after a pact and the crystal left to it, against the force outcome', () => {
    const run = playPlateau('dragon', bearForceEnd, ALLIANCE);
    const { state } = run;
    expect(state.campaign!.chapters.dragon.outcome).toBe('force');
    expect(run.fights).not.toContain('dragon_lair_assault');
    expect(run.fights).not.toContain('dragon_lair_seizure');
    expect(said(run, 'dragon_wolf_lair')).toContain('pacte scellé avec notre émissaire');
    expect(getClanRelation(state, 'dragon')).toBe('enemy');
    expect(getClanRelation(state, 'wolf')).toBe('ally');
    expect(getClanRelationCauses(state, 'wolf')).toContain('dragon.crystal');
    expect(said(run, 'dragon_judgement')).toContain('vous avez laissé le Cristal aux mains du Loup');
  });

  it('lets an honourable company still ask for the trial, at a cost', () => {
    const run = playPlateau('dragon', bearHonourEnd, VOLUNTARY);
    const { state } = run;
    expect(state.campaign!.chapters.dragon.outcome).toBe('force');
    expect(state.flags.dragonTrialRequested).toBe(true);
    expect(run.fights).toContain('dragon_kaelen');
    // The honour run takes events at forks here: the route's +10 less the two elite fights (+2), the claim (+1) and the
    // Chaman (+1), with the voluntary trial (-1).
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('dragon').honourFloor - 2 - 2 - 1);
  });

  it('saves and resumes a finished Dragon through the V6 envelope with its record intact', () => {
    const run = playPlateau('dragon', bearHonourEnd, HONOUR);
    const saves = new SaveRepository();
    saves.saveAuto(run.state);
    const resumed = saves.loadAuto()!;
    expect(resumed.campaign).toEqual(run.state.campaign);
    expect(resumed.endingId).toBe('dragon-seal-honour');
    expect(resumed.run.id).toBe(run.state.run.id);
    localStorage.clear();
  });
});
