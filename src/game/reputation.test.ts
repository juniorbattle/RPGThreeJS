import { describe, expect, it } from 'vitest';
import { createInitialState } from './store';
import { changeReputation, getReputationRule, getShopPrice } from './reputation';

describe('reputation rules', () => {
  it('maps the global reputation to configured tiers', () => {
    expect(getReputationRule(10).label).toBe('Hostile');
    expect(getReputationRule(50).label).toBe('Neutre');
    expect(getReputationRule(90).label).toBe('Renommé');
  });

  it('clamps changes and records their source', () => {
    const state = createInitialState();
    changeReputation(state, 80, 'test');
    expect(state.reputation).toBe(100);
    expect(state.reputationHistory.at(-1)).toEqual({ delta: 80, source: 'test', value: 100 });
  });

  it('applies shop multipliers', () => {
    expect(getShopPrice(100, 10)).toBe(135);
    expect(getShopPrice(100, 90)).toBe(78);
  });
});
