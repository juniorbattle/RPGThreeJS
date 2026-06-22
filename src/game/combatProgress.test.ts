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
    }, 3);
    expect(state.inventory.consumables).toEqual({ potion: 1 });
    expect(state.deployment.unitIds).toEqual(['archer', 'knight']);
  });

  it('does not mutate campaign progression after defeat', () => {
    const state = createInitialState();
    const before = structuredClone(state);
    applyCombatProgress(state, {
      victory: false,
      combatId: 'test',
      consumables: {},
      participants: [],
    }, 4);
    expect(state).toEqual(before);
  });
});
