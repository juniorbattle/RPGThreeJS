import { describe, expect, it } from 'vitest';
import { isChoiceBlocked, resolveContestOutcome } from './contestResolution';
import type { DialogueChoice, GameState } from './types';
import { createInitialState } from './store';

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createInitialState(), ...overrides };
}

const normalChoice: DialogueChoice = {
  text: 'Test',
  next: 'next-step',
  effects: [],
};

const contestableChoice: DialogueChoice = {
  text: 'Claim',
  next: 'success-step',
  requiresFlag: 'helpedRefugees',
  effects: [{ type: 'addReputation', amount: 5 }],
  contest: {
    kind: 'lie',
    risk: 'high',
    truthState: 'known',
    success: { next: 'success-step', effects: [{ type: 'addReputation', amount: 5 }] },
    failure: { next: 'failure-step', effects: [{ type: 'addReputation', amount: -8 }, { type: 'setFlag', key: 'liedToAlaric', value: true }] },
  },
};

describe('contest resolution', () => {
  it('returns normal path when requirements are met', () => {
    const state = stateWith({ flags: { helpedRefugees: true } });
    const result = resolveContestOutcome(contestableChoice, state);
    expect(result.type).toBe('normal');
    if (result.type === 'normal') expect(result.next).toBe('success-step');
  });

  it('returns contest-failure when requirements fail and contest exists', () => {
    const state = stateWith({ flags: {} });
    const result = resolveContestOutcome(contestableChoice, state);
    expect(result.type).toBe('contest-failure');
    if (result.type === 'contest-failure') {
      expect(result.next).toBe('failure-step');
      expect(result.effects).toHaveLength(2);
    }
  });

  it('returns blocked when requirements fail and no contest', () => {
    const blockedChoice: DialogueChoice = { text: 'Blocked', next: 'next', requiresFlag: 'missingFlag', effects: [] };
    const state = stateWith({ flags: {} });
    const result = resolveContestOutcome(blockedChoice, state);
    expect(result.type).toBe('blocked');
  });

  it('returns normal for choice with no requirements', () => {
    const state = stateWith({});
    const result = resolveContestOutcome(normalChoice, state);
    expect(result.type).toBe('normal');
  });

  it('known truth state with failed requirements still routes to failure deterministically', () => {
    const knownTruthChoice: DialogueChoice = {
      ...contestableChoice,
      contest: {
        ...contestableChoice.contest!,
        truthState: 'known',
      },
    };
    const state = stateWith({ flags: {} });
    const result = resolveContestOutcome(knownTruthChoice, state);
    expect(result.type).toBe('contest-failure');
  });

  it('blocked by gold without contest returns blocked', () => {
    const goldChoice: DialogueChoice = {
      text: 'Buy',
      next: 'bought',
      requiresGold: 100,
      effects: [],
    };
    const state = stateWith({ gold: 10 });
    const result = resolveContestOutcome(goldChoice, state);
    expect(result.type).toBe('blocked');
  });

  it('blocked by reputation min without contest returns blocked', () => {
    const repChoice: DialogueChoice = {
      text: 'Demand',
      next: 'granted',
      requiresReputationMin: 50,
      effects: [],
    };
    const state = stateWith({ reputation: 20 });
    const result = resolveContestOutcome(repChoice, state);
    expect(result.type).toBe('blocked');
  });

  it('excludesFlag blocking is detected', () => {
    const choice: DialogueChoice = {
      text: 'Safe',
      next: 'safe-step',
      excludesFlag: 'silencedWitnesses',
      effects: [],
    };
    const state = stateWith({ flags: { silencedWitnesses: true } });
    expect(isChoiceBlocked(choice, state)).toBe(true);
  });
});
