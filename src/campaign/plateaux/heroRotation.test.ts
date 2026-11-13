import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../game/store';
import { resolvePostDemoDialogue } from '../../game/postDemoContent';

/**
 * Operator, 2026-11-13: on each plateau one hero of the clan accompanies the advisers at the meetings with the chief, in
 * turn, as Alistair does on the Lion's: Marian on the Bear's, Elara on the Dragon's, Kestrel on the Scorpion's. The hero
 * takes Alistair's lines at the arrival, the audience, the acceptance of the trial and the vigil; the words are unchanged
 * and Alistair keeps the decisions of the road.
 */
const ROTATION = [
  { plateau: 'bear', hero: 'marian', arrival: 'bear_arrival', audience: 'bear_audience', trial: 'bear_borin_pre_combat', vigil: 'bear_vigil', road: 'bear_sacred_mines' },
  { plateau: 'dragon', hero: 'elara', arrival: 'dragon_arrival', audience: 'dragon_audience', trial: 'dragon_kaelen_pre_combat', vigil: 'dragon_vigil', road: 'dragon_wolf_lair' },
  { plateau: 'scorpion', hero: 'kestrel', arrival: 'scorpion_arrival', audience: 'scorpion_audience', trial: 'scorpion_inquisitor_pre_combat', vigil: 'scorpion_vigil', road: 'scorpion_phoenix_temple' },
] as const;

const steps = (id: string) => resolvePostDemoDialogue(id, createInitialState())!.steps;

describe('the hero who accompanies the advisers, plateau by plateau', () => {
  for (const { plateau, hero, arrival, audience, trial, vigil, road } of ROTATION) {
    it(`gives the ${plateau}'s meetings with the chief to ${hero}, and leaves the road's decisions to Alistair`, () => {
      expect(steps(arrival)[0]!.actorId).toBe(hero);
      expect(steps(audience).find((step) => step.id === 'alistair')!.actorId).toBe(hero);
      expect(steps(audience).find((step) => step.id === 'alistair')!.tag).toBe('Clan sans terre');
      expect(steps(trial).find((step) => step.text === 'Nous l’assumerons.')!.actorId).toBe(hero);
      expect(steps(vigil)[0]!.actorId).toBe(hero);
      expect(steps(road).find((step) => step.id === 'choice')!.actorId).toBe('alistair');
      for (const id of [arrival, audience, trial, vigil]) expect(steps(id).some((step) => step.actorId === 'alistair'), id).toBe(false);
    });
  }
});
