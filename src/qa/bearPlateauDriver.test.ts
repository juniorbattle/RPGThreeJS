// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 1: the QA driver plays the Bear (DRAFT) on both paths, from genuine demo saves whose Lion
 * chronicle ended, to the Bear's epilogue. Each scenario checks the outcome, the clan relations, the reputation the
 * plateau moved, and that the scenes the player sees name the causes of what the plateau became.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../game/__fixtures__/demo-v6-lion-force-complete.json';
import { BEAR_FINALE } from '../campaign/plateaux/bear/bearFinale';
import { computePlateauReputationBounds } from '../game/reputationBounds';
import { getClanRelation, getClanRelationCauses, selectPoiMap } from '../game/runSystem';
import { migrateState, SaveRepository } from '../game/store';
import type { GameState } from '../game/types';
import { playBearPlateau, type BearPlaythrough, type BearScenario } from './bearPlateauDriver';

/** A post-demo Lion end: the demo save, at the reputation a calibrated Lion honour run is sure of (30 + 27). */
function lionEnd(fixture: unknown, reputation: number): GameState {
  const state = migrateState(structuredClone(fixture));
  state.reputation = reputation;
  return state;
}

const said = (run: BearPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId).map((line) => line.text).join('\n');

const HONOUR: BearScenario = {
  name: 'perfect honour', prefer: 'merit', intent: 'claim_recognition',
  guardianChests: ['bear-poi-mine-lift-cache', 'bear-poi-depths-reserve'],
};
const SEIZURE: BearScenario = {
  name: 'greed, mines seized', prefer: 'greed', intent: 'claim_recognition',
  answers: { bear_raven_messenger: 'bearRavenOfferRefused', bear_sacred_mines: 'bearMinesSeized' },
};
const PACT: BearScenario = {
  name: 'Raven pact, mines abandoned', prefer: 'greed', intent: 'claim_recognition',
  answers: { bear_raven_messenger: 'bearRavenPact', bear_sacred_mines: 'bearMinesAbandoned' },
};
const VOLUNTARY: BearScenario = { name: 'honour, voluntary trial', prefer: 'merit', intent: 'request_trial' };

describe('Bear plateau QA driver (set 1.20.0, Lot 1 draft)', () => {
  it('plays a perfect honour run: Borin seals the alliance, the Master Spy falls, +16 reputation', () => {
    const run = playBearPlateau(lionEnd(lionHonourComplete, 57), HONOUR);
    const { state } = run;
    expect(state.run.status).toBe('completed');
    expect(state.endingId).toBe('bear-seal-honour');
    expect(state.campaign!.chapters.bear).toEqual({ status: 'completed', outcome: 'honour' });
    expect(state.campaign!.currentChapterId).toBe('dragon');
    expect(getClanRelation(state, 'bear')).toBe('ally');
    expect(getClanRelation(state, 'raven')).toBe('enemy');
    // Exactly the perfect maximum the bounds test measures from the content.
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('bear').perfectMax);
    expect(run.fights).toEqual(expect.arrayContaining(['bear_guardian_foreman', 'bear_guardian_depths', 'bear_mines_defense', 'bear_master_spy']));
    expect(run.fights).not.toContain('bear_borin');
    // The Lion's outcome echoes at the audience, and Borin names the Bear's own deeds.
    expect(said(run, 'bear_audience')).toMatch(/Alaric/);
    const judgement = said(run, 'bear_judgement');
    for (const deed of BEAR_FINALE.deeds.filter((entry) => entry.kind === 'merit')) {
      expect(judgement, deed.flag).toContain(deed.phrase);
    }
    expect(judgement).toContain(BEAR_FINALE.witnesses.supportive);
    expect(judgement).toContain(BEAR_FINALE.evidence.text);
    expect(said(run, 'bear_epilogue')).toContain('Borin a scellé l’alliance de l’Ours');
    // Every POI of the route is resolved and the guardians are down.
    expect(Object.values(state.run.poiExpedition!.elites).every((elite) => elite.defeated)).toBe(true);
    expect(selectPoiMap(state).nodes.find((node) => node.id === 'bear-judgement')?.status).toBe('resolved');
  });

  it('plays a greedy run: the claim is rejected, the Sceau is taken from Borin by the trial', () => {
    const run = playBearPlateau(lionEnd(lionForceComplete, 40), SEIZURE);
    const { state } = run;
    expect(state.endingId).toBe('bear-seal-force');
    expect(state.campaign!.chapters.bear.outcome).toBe('force');
    expect(state.flags.bearFinaleTrialSelected).toBe(true);
    expect(state.flags.bearTrialRequested).toBe(false);
    expect(run.fights).toEqual(expect.arrayContaining(['bear_mines_seizure', 'bear_borin']));
    expect(getClanRelation(state, 'bear')).toBe('enemy');
    expect(getClanRelation(state, 'raven')).toBe('enemy');
    expect(state.reputation).toBeLessThan(run.reputationStart);
    const judgement = said(run, 'bear_judgement');
    expect(judgement).toContain('vous avez gardé le filon sombre pour votre clan');
    expect(judgement).toContain(BEAR_FINALE.witnesses.silenced);
    expect(said(run, 'bear_epilogue')).toContain('l’Ours ne pardonnera pas ce Sceau arraché');
  });

  it('keeps the Raven an ally after a pact and abandoned mines, against the force outcome', () => {
    const run = playBearPlateau(lionEnd(lionForceComplete, 40), PACT);
    const { state } = run;
    expect(state.campaign!.chapters.bear.outcome).toBe('force');
    expect(run.fights).not.toContain('bear_mines_defense');
    expect(run.fights).not.toContain('bear_mines_seizure');
    expect(getClanRelation(state, 'bear')).toBe('enemy');
    expect(getClanRelation(state, 'raven')).toBe('ally');
    expect(getClanRelationCauses(state, 'raven')).toContain('bear.mines');
    expect(said(run, 'bear_judgement')).toContain('vous avez laissé le Corbeau vider nos galeries');
  });

  it('lets an honourable company still ask for the trial, at a cost', () => {
    const run = playBearPlateau(lionEnd(lionHonourComplete, 57), VOLUNTARY);
    const { state } = run;
    expect(state.campaign!.chapters.bear.outcome).toBe('force');
    expect(state.flags.bearTrialRequested).toBe(true);
    expect(run.fights).toContain('bear_borin');
    // The canonical honour floor, without the honour claim (+1) and the Master Spy (+1), with the voluntary trial (-1).
    expect(state.reputation - run.reputationStart).toBe(computePlateauReputationBounds('bear').honourFloor - 2 - 1);
  });

  it('saves and resumes the finished Bear through the V6 envelope with its record intact', () => {
    const run = playBearPlateau(lionEnd(lionHonourComplete, 57), HONOUR);
    const saves = new SaveRepository();
    saves.saveAuto(run.state);
    const resumed = saves.loadAuto()!;
    expect(resumed.campaign).toEqual(run.state.campaign);
    expect(resumed.endingId).toBe('bear-seal-honour');
    expect(resumed.run.id).toBe(run.state.run.id);
    localStorage.clear();
  });
});
