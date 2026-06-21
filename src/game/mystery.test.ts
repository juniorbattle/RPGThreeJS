import { describe, expect, it } from 'vitest';
import { createInitialState } from './store';
import { chooseMysteryEvent, tickCombatCooldowns } from './mystery';
import type { MysteryEvent } from './types';

const pool: MysteryEvent[] = [
  { id: 'unique', dialogueId: 'a', weight: 1, unique: true },
  { id: 'repeat', dialogueId: 'b', weight: 1, unique: false },
];

describe('mystery events', () => {
  it('persists a first draw and does not reroll it', () => {
    const state = createInitialState();
    const first = chooseMysteryEvent('m1', pool, state, () => 0);
    const second = chooseMysteryEvent('m1', pool, state, () => 0.99);
    expect(first.id).toBe('unique');
    expect(second.id).toBe('unique');
    expect(state.seenUniqueEvents).toEqual(['unique']);
  });

  it('reactivates random combats after their ready step', () => {
    const state = createInitialState();
    state.combatCooldowns.patrol = 3;
    state.stepCounter = 2;
    tickCombatCooldowns(state);
    expect(state.combatCooldowns.patrol).toBe(3);
    state.stepCounter = 3;
    tickCombatCooldowns(state);
    expect(state.combatCooldowns.patrol).toBeUndefined();
  });
});
