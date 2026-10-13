import { describe, expect, it } from 'vitest';
import { createInitialState, migrateState } from './store';
import { applyCombatProgress } from './combatProgress';
import { getFinalStats } from './catalog';
import { restUnits, useConsumable } from './management';

describe('combat progress synchronization', () => {
  it('persists participants and consumables after victory', () => {
    const state = createInitialState();
    applyCombatProgress(state, {
      victory: true,
      combatId: 'test',
      consumables: { potion: 1 },
      participants: ['archer', 'warrior'],
      unitHealth: { archer: 44, warrior: 1 },
    }, 3);
    expect(state.inventory.consumables).toEqual({ potion: 1 });
    expect(state.deployment.unitIds).toEqual(['archer', 'warrior']);
    expect(state.clan.members.find((unit) => unit.id === 'archer')!.currentHealth).toBe(44);
    expect(state.clan.members.find((unit) => unit.id === 'warrior')!.currentHealth).toBe(1);
  });

  it('recovers a participating KO unit at 1 HP while preserving the raw tactical result', () => {
    const state = createInitialState();
    state.clan.members.find(unit => unit.id === 'archer')!.currentHealth = 0;
    const result = {
      victory: true,
      combatId: 'test',
      participants: ['warrior', 'white_mage'],
      unitHealth: { warrior: 0, white_mage: 80 },
    };
    const raw = structuredClone(result);
    applyCombatProgress(state, result, 4);
    expect(state.clan.members.find((unit) => unit.id === 'warrior')!.currentHealth).toBe(1);
    expect(state.clan.members.find((unit) => unit.id === 'white_mage')!.currentHealth).toBe(80);
    expect(state.clan.members.find((unit) => unit.id === 'archer')!.currentHealth).toBe(0);
    expect(result).toEqual(raw);
    expect(migrateState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('allows a recovered fighter to drink a potion, then heal fully at the existing paid rest', () => {
    const state = createInitialState(), hero = state.clan.members.find(unit => unit.id === 'warrior')!;
    state.inventory.consumables.potion = 2;
    applyCombatProgress(state, { victory: true, combatId: 'test', participants: [hero.id],
      unitHealth: { [hero.id]: 0 } }, 4);
    expect(useConsumable(state, hero.id, 'potion')).toBe(true);
    expect(hero.currentHealth).toBe(56);
    expect(state.inventory.consumables.potion).toBe(1);
    const gold = state.gold;
    expect(restUnits(state)).toBe(true);
    expect(hero.currentHealth).toBe(getFinalStats(hero).maxHealth);
    expect(state.gold).toBe(gold - 15);
  });

  it('does not mutate campaign progression after defeat', () => {
    const state = createInitialState();
    const before = structuredClone(state);
    applyCombatProgress(state, {
      victory: false,
      combatId: 'test',
      consumables: {},
      participants: ['warrior'],
      unitHealth: { warrior: 0 },
    }, 4);
    expect(state).toEqual(before);
  });
});
