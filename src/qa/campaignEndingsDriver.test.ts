// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 5 (DRAFT endings): complete campaigns simulated by the QA driver, from genuine demo saves
 * whose Lion chronicle ended, through the Bear, the Dragon, the Scorpion and the final act, to the ending R4 decides:
 * all honour, all force (both answers of the Fear ending), two and two, three and one, and the gauge's limits that turn a
 * lopsided result into Balance. Each run checks the recorded ending, the closed chronicle and that the epilogue names
 * its causes.
 */
import { describe, expect, it } from 'vitest';
import lionHonourComplete from '../game/__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from '../game/__fixtures__/demo-v6-lion-force-complete.json';
import { selectPlateauOutcomes } from '../game/campaignRelations';
import { migrateState, SaveRepository } from '../game/store';
import type { GameState } from '../game/types';
import { playBearPlateau } from './bearPlateauDriver';
import { playPlateau, type PlateauPlaythrough, type PlateauScenario } from './plateauDriver';
import { loadEpilogueStartQa } from './postDemoQaSaves';
import { nextEpilogueStep } from '../game/finalAct';

function lionEnd(fixture: unknown, reputation: number): GameState {
  const state = migrateState(structuredClone(fixture));
  state.reputation = reputation;
  return state;
}

const HONOUR = { prefer: 'merit', intent: 'claim_recognition' } as const;
const FORCE = { prefer: 'greed', intent: 'request_trial' } as const;
type Path = typeof HONOUR | typeof FORCE;

/** Plays the Bear, the Dragon and the Scorpion from a Lion end, each on its path. */
function sealEnd(lion: GameState, bear: Path, dragon: Path, scorpion: Path): GameState {
  const afterBear = playBearPlateau(lion, { name: 'Bear', ...bear }).state;
  const afterDragon = playPlateau('dragon', afterBear, { name: 'Dragon', ...dragon,
    ...(dragon === HONOUR ? { forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' } } : {}) }).state;
  return playPlateau('scorpion', afterDragon, { name: 'Scorpion', ...scorpion }).state;
}

const said = (run: PlateauPlaythrough, dialogueId: string) => run.lines.filter((line) => line.dialogueId === dialogueId).map((line) => line.text).join('\n');
const finale = (end: GameState, scenario: Partial<PlateauScenario> = {}) =>
  playPlateau('finale', end, { name: 'finale', prefer: 'merit', intent: 'claim_recognition', ...scenario }, 20261111);

const allHonour = sealEnd(lionEnd(lionHonourComplete, 57), HONOUR, HONOUR, HONOUR);
const allForce = sealEnd(lionEnd(lionForceComplete, 40), FORCE, FORCE, FORCE);

describe('complete campaigns reach the ending R4 decides (set 1.20.0, Lot 5 draft)', () => {
  it('all honour: Respect, the allies close the breach and the four Seals are named as confided', () => {
    expect(selectPlateauOutcomes(allHonour).map((entry) => entry.outcome)).toEqual(['honour', 'honour', 'honour', 'honour']);
    const run = finale(allHonour);
    expect(run.state.campaign!.ending).toBe('respect');
    expect(run.state.campaign!.finalAct.stage).toBe('completed');
    expect(run.state.endingId).toBe('ending-respect');
    const epilogue = said(run, 'finale_epilogue_respect');
    expect(epilogue).toContain('Quatre Sceaux : le Sceau du Lion, qu’Alaric nous a confié ; le Sceau de l’Ours, que Borin nous a confié ; '
      + 'le Sceau du Dragon, que Kaelen nous a confié ; le Sceau du Scorpion, que le Grand Inquisiteur nous a confié.');
    expect(epilogue).toContain('les bannières tiennent la ligne jusqu’au bout : celles du Lion, de l’Ours, du Corbeau, du Dragon, du Loup, du Scorpion et du Phénix');
    expect(epilogue).toContain('il y a les civils sauvés de l’arène');
    expect(run.lines.find((line) => line.dialogueId === 'finale_epilogue_respect' && line.stepId === 'acclaim')!.speaker).toBe('Chef Alaric');
    expect(run.fights).not.toContain('finale_last_stand');
  });

  it('all force, last stand: Fear, the company fights alone against all and the landless clan is struck from the clans', () => {
    const run = finale(allForce, { prefer: 'greed', answers: { finale_epilogue_fear: 'finaleFearLastStand' } });
    expect(run.state.campaign!.ending).toBe('fear');
    expect(run.state.endingId).toBe('ending-fear-last-stand');
    expect(said(run, 'finale_epilogue_fear')).toContain('le Sceau du Lion, gagné contre son Champion ; le Sceau de l’Ours, arraché à Borin');
    expect(said(run, 'finale_epilogue_fear')).toContain('Personne n’a oublié la foule abandonnée de l’arène.');
    // Alone against all: no clan support, the Serpent's raider and the enemy clans' foes in the order the company met them.
    const lastStand = run.configs.find((config) => config.id === 'finale_last_stand')!;
    expect(lastStand.supports).toBeUndefined();
    expect(lastStand.enemyVisualIds).toEqual(['serpent_raider', 'bear_warrior', 'raven_scout', 'dragon_guardian']);
    expect(said(run, 'finale_fear_close')).toContain('Nous nous sommes battus seuls contre tous');
    expect(said(run, 'finale_fear_close')).toContain('Le clan sans terre n’existe plus');
  });

  it('all force, fate accepted: Fear, Alistair gives himself up and the clan lives on, fallen once more', () => {
    const run = finale(allForce, { prefer: 'greed', answers: { finale_epilogue_fear: 'finaleFearFateAccepted' } });
    expect(run.state.endingId).toBe('ending-fear-fate');
    expect(run.fights).not.toContain('finale_last_stand');
    expect(said(run, 'finale_fear_close')).toContain('Vous avez accepté votre destin, Alistair');
    expect(said(run, 'finale_fear_close')).toContain('votre clan vivra, mais déchu');
  });

  it('two and two: Balance, the epilogue says why and names allies and enemies', () => {
    const end = sealEnd(lionEnd(lionHonourComplete, 57), HONOUR, FORCE, FORCE);
    expect(selectPlateauOutcomes(end).map((entry) => entry.outcome)).toEqual(['honour', 'honour', 'force', 'force']);
    const run = finale(end);
    expect(run.state.campaign!.ending).toBe('balance');
    expect(run.state.endingId).toBe('ending-balance');
    const epilogue = said(run, 'finale_epilogue_balance');
    expect(epilogue).toContain('Deux Sceaux confiés, deux arrachés : les clans nous respectent autant qu’ils nous craignent.');
    expect(epilogue).toContain('le Sceau du Dragon, arraché à Kaelen');
    expect(epilogue).toMatch(/Certaines bannières se tiennent à nos côtés : celles du Lion, de l’Ours/);
    expect(epilogue).toMatch(/D’autres nous observent de loin : celles du Dragon, du Scorpion/);
  });

  it('three honour and one force: Respect still, the Lion’s Seal named as won against its Champion', () => {
    const end = sealEnd(lionEnd(lionForceComplete, 40), HONOUR, HONOUR, HONOUR);
    expect(selectPlateauOutcomes(end).map((entry) => entry.outcome)).toEqual(['force', 'honour', 'honour', 'honour']);
    const run = finale(end);
    expect(run.state.reputation).toBeGreaterThanOrEqual(40);
    expect(run.state.endingId).toBe('ending-respect');
    expect(said(run, 'finale_epilogue_respect')).toContain('le Sceau du Lion, gagné contre son Champion ; le Sceau de l’Ours, que Borin nous a confié');
  });

  it('turns a lopsided result into Balance at the gauge’s limits, read when the act closes', () => {
    const atClosing = (end: GameState, reputation: number, prefer: 'merit' | 'greed') =>
      finale(end, { prefer, beforeClosing: (state) => { state.reputation = reputation; } }).state;
    expect(atClosing(allHonour, 40, 'merit').campaign!.ending).toBe('respect');
    const lowHonour = finale(allHonour, { beforeClosing: (state) => { state.reputation = 39; } });
    expect(lowHonour.state.campaign!.ending).toBe('balance');
    expect(said(lowHonour, 'finale_epilogue_balance')).toContain('Quatre Sceaux confiés, et pourtant notre nom pèse moins que nos actes');
    expect(atClosing(allForce, 59, 'greed').campaign!.ending).toBe('fear');
    const highForce = finale(allForce, { prefer: 'greed', beforeClosing: (state) => { state.reputation = 60; } });
    expect(highForce.state.campaign!.ending).toBe('balance');
    expect(said(highForce, 'finale_epilogue_balance')).toContain('Quatre Sceaux arrachés, et pourtant notre nom inspire encore le respect');
  });

  it('saves and resumes a chronicle in its epilogue and a closed one, through the V6 envelope', () => {
    const saves = new SaveRepository();
    const done = finale(allForce, { prefer: 'greed', answers: { finale_epilogue_fear: 'finaleFearFateAccepted' } });
    saves.saveAuto(done.state);
    const resumed = saves.loadAuto()!;
    expect(resumed.campaign!.ending).toBe('fear');
    expect(resumed.campaign!.finalAct.stage).toBe('completed');
    expect(resumed.endingId).toBe('ending-fear-fate');
    localStorage.clear();
  });

  it('opens each ending at the start of its epilogue for the QA lab, the ending already recorded by RunSystem', async () => {
    for (const ending of ['respect', 'fear', 'balance'] as const) {
      const state = await loadEpilogueStartQa(ending);
      expect([state.campaign!.ending, state.campaign!.finalAct.stage], ending).toEqual([ending, 'epilogue']);
      expect(nextEpilogueStep(state), ending).toEqual({ kind: 'dialogue', dialogueId: `finale_epilogue_${ending}` });
    }
  });
});
