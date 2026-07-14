import { describe, expect, it } from 'vitest';
import { createInitialState } from './store';
import { applyCombatProgress } from './combatProgress';

describe('combat progress synchronization', () => {
  it('persists participants and consumables after victory', () => {
    const state = createInitialState();
    applyCombatProgress(state, {
      victory: true,
      combatId: 'test',
      consumables: { potion: 1 },
      participants: ['archer', 'knight'],
      unitHealth: { archer: 44, knight: 1 },
    }, 3);
    expect(state.inventory.consumables).toEqual({ potion: 1 });
    expect(state.deployment.unitIds).toEqual(['archer', 'knight']);
    expect(state.clan.members.find((unit) => unit.id === 'archer')!.currentHealth).toBe(44);
    expect(state.clan.members.find((unit) => unit.id === 'knight')!.currentHealth).toBe(1);
  });

  it('sets currentHealth to 0 when a unit is reported dead', () => {
    const state = createInitialState();
    applyCombatProgress(state, {
      victory: true,
      combatId: 'test',
      participants: ['knight', 'cleric'],
      unitHealth: { knight: 0, cleric: 80 },
    }, 4);
    expect(state.clan.members.find((unit) => unit.id === 'knight')!.currentHealth).toBe(0);
    expect(state.clan.members.find((unit) => unit.id === 'cleric')!.currentHealth).toBe(80);
  });

  it('does not mutate campaign progression after defeat', () => {
    const state = createInitialState();
    const before = structuredClone(state);
    applyCombatProgress(state, {
      victory: false,
      combatId: 'test',
      consumables: {},
      participants: [],
      unitHealth: {},
    }, 4);
    expect(state).toEqual(before);
  });
});
