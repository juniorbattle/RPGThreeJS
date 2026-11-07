import { describe, expect, it } from 'vitest';
import { CHALLENGES, challengeForContent, challengeHeld, describeChallenge } from './challenges';
import { combatConfigs } from './content';
import { createInitialState } from './store';
import { challengeVerdict, creditChallengePrime, selectPoiMap } from './runSystem';
import { LOT_E_ELITES, LOT_E_POIS } from '../campaign/LionPoiAuthoring';
import { toCombatResult } from '../combat/protocol';
import type { CombatResult } from './types';

/** Set 1.18.0 (OD-2026-11-07-F). Pure fixtures; they are not played combat evidence. */
const win = (combatId: string, facts: Partial<CombatResult> = {}): CombatResult =>
  ({ combatId, victory: true, participants: ['a', 'b', 'c'], unitHealth: {}, rounds: 5, itemsUsed: 0, ...facts });

describe('challenge declarations (set 1.18.0)', () => {
  it('declares exactly the six decided challenges, with their condition and prime', () => {
    const wolves = LOT_E_POIS.find(poi => poi.id === 'lion-poi-opening-wolves')!.combat!.variants.map(variant => variant.id);
    expect(Object.keys(CHALLENGES).sort()).toEqual([...wolves, 'troll_crossing', 'serpent_duelist_trial', 'young_dragon_roost',
      ...LOT_E_ELITES.map(elite => elite.combat.id)].sort());
    const text = (id: string) => describeChallenge(CHALLENGES[id]!);
    expect(text(wolves[0]!)).toEqual({ condition: '3 héros au plus', prime: '1 gemme rouge' });
    expect(text('troll_crossing')).toEqual({ condition: 'Sans objets', prime: '2 gemmes rouges' });
    expect(text('serpent_duelist_trial')).toEqual({ condition: 'Victoire en 8 manches', prime: '2 gemmes rouges' });
    expect(text('young_dragon_roost')).toEqual({ condition: '3 héros au plus', prime: '2 gemmes rouges' });
    for (const elite of LOT_E_ELITES) expect(text(elite.combat.id)).toEqual({ condition: '3 héros au plus', prime: '2 gemmes rouges' });
  });

  it('attaches the declaration to each challenge config and lowers the deployment limit to three heroes', () => {
    for (const [id, challenge] of Object.entries(CHALLENGES)) {
      const config = combatConfigs.get(id)!;
      expect(config.challenge).toMatchObject({ kind: challenge.kind, primeRedGems: challenge.primeRedGems });
      if (challenge.kind === 'max_heroes') expect(config.maxPlayerUnits).toBe(3);
    }
    expect(combatConfigs.get('troll_crossing')!.maxPlayerUnits).toBe(4);
    expect(combatConfigs.get('serpent_duelist_trial')!.challenge?.limit).toBe(8);
    // Everything else, rewards included, is unchanged.
    expect(combatConfigs.get('forest_patrol')!.challenge).toBeUndefined();
    expect(combatConfigs.get('forest_patrol')!.maxPlayerUnits).toBe(4);
    expect(combatConfigs.get('young_dragon_roost')!.rewards).toEqual({ gold: 260, reputation: 2, materials: { red_gem: 3, iron_ore: 2 } });
  });

  it('maps an event that offers the fight to its challenge', () => {
    expect(challengeForContent('mystery_dragon_roost')?.combatId).toBe('young_dragon_roost');
    expect(challengeForContent('mystery_troll_crossing')?.combatId).toBe('troll_crossing');
    expect(challengeForContent('serpent_checkpoint')).toBeUndefined();
  });
});

describe('RunSystem decides the prime from reported facts (set 1.18.0)', () => {
  it('holds each condition only on the reported facts, never on a missing one', () => {
    expect(challengeHeld(CHALLENGES.young_dragon_roost!, { heroes: 3 })).toBe(true);
    expect(challengeHeld(CHALLENGES.young_dragon_roost!, { heroes: 4 })).toBe(false);
    expect(challengeHeld(CHALLENGES.young_dragon_roost!, { heroes: 0 })).toBe(false);
    expect(challengeHeld(CHALLENGES.troll_crossing!, { heroes: 4, itemsUsed: 0 })).toBe(true);
    expect(challengeHeld(CHALLENGES.troll_crossing!, { heroes: 4, itemsUsed: 1 })).toBe(false);
    expect(challengeHeld(CHALLENGES.troll_crossing!, { heroes: 4 })).toBe(false);
    expect(challengeHeld(CHALLENGES.serpent_duelist_trial!, { heroes: 4, rounds: 8 })).toBe(true);
    expect(challengeHeld(CHALLENGES.serpent_duelist_trial!, { heroes: 4, rounds: 9 })).toBe(false);
    expect(challengeHeld(CHALLENGES.serpent_duelist_trial!, { heroes: 4 })).toBe(false);
  });

  it('credits two red gems on a held victory, one for the initiation, and nothing otherwise', () => {
    const state = createInitialState(), gems = () => state.inventory.materials.red_gem ?? 0, before = gems();
    expect(creditChallengePrime(state, win('troll_crossing'))).toMatchObject({ held: true, primeRedGems: 2, condition: 'Sans objets' });
    expect(gems()).toBe(before + 2);
    expect(creditChallengePrime(state, win('poi_opening_wolves_a'))?.held).toBe(true);
    expect(gems()).toBe(before + 3);
    expect(creditChallengePrime(state, win('serpent_duelist_trial', { rounds: 11 }))).toMatchObject({ held: false, condition: 'Victoire en 8 manches' });
    expect(creditChallengePrime(state, win('troll_crossing', { itemsUsed: 2 }))?.held).toBe(false);
    expect(creditChallengePrime(state, win('troll_crossing', { victory: false }))).toBeNull();
    expect(creditChallengePrime(state, win('forest_patrol'))).toBeNull();
    expect(gems()).toBe(before + 3);
    expect(challengeVerdict(win('young_dragon_roost', { participants: ['a', 'b', 'c', 'd'] }))?.held).toBe(false);
  });

  it('carries rounds and items used through the combat protocol as transient facts', () => {
    const message = { type: 'rpg-threejs:combat-result', victory: true, combatId: 'serpent_duelist_trial', inventory: {}, participants: ['a'],
      unitHealth: { a: 10 }, rounds: 6, itemsUsed: 0 };
    expect(toCombatResult(message)).toMatchObject({ rounds: 6, itemsUsed: 0 });
    const { rounds: _r, itemsUsed: _i, ...older } = message;
    expect(toCombatResult(older)).not.toHaveProperty('rounds');
  });

  it('raises the conditional Lot E red_gem ceiling from 10 to 15 and no further', () => {
    const lotE = [...LOT_E_POIS.flatMap(poi => poi.combat ? [poi.combat.rewards] : []), ...LOT_E_ELITES.map(elite => elite.combat.rewards)];
    const base = lotE.reduce((sum, rewards) => sum + (rewards.materials.red_gem ?? 0), 0);
    const lotEPrimes = [...LOT_E_POIS.filter(poi => poi.combat).map(poi => CHALLENGES[poi.combat!.variants[0]!.id]?.primeRedGems ?? 0),
      ...LOT_E_ELITES.map(elite => CHALLENGES[elite.combat.id]?.primeRedGems ?? 0)].reduce((a, b) => a + b, 0);
    expect(base).toBe(10);expect(base + lotEPrimes).toBe(15);
  });

  it('states the challenge on the map place, never on an ordinary one', () => {
    const state = createInitialState();
    const wolves = selectPoiMap(state).nodes.find(node => node.id === 'lion-poi-opening-wolves')!;
    expect(wolves.challenge).toEqual({ condition: '3 héros au plus', prime: '1 gemme rouge' });
    expect(selectPoiMap(state).nodes.find(node => node.id === 'lion-poi-opening-patrol')!.challenge).toBeUndefined();
  });
});
