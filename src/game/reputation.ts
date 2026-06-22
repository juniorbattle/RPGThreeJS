import type { GameState, ReputationRule } from './types';

export const reputationRules: ReputationRule[] = [
  { min: 0, max: 19, label: 'Hostile', shopPriceMultiplier: 1.35, ambushWeightMultiplier: 1.7, eventWeightModifiers: { hostile: 1.6, helpful: 0.55 } },
  { min: 20, max: 39, label: 'Méfiant', shopPriceMultiplier: 1.15, ambushWeightMultiplier: 1.3, eventWeightModifiers: { hostile: 1.25, helpful: 0.8 } },
  { min: 40, max: 59, label: 'Neutre', shopPriceMultiplier: 1, ambushWeightMultiplier: 1, eventWeightModifiers: {} },
  { min: 60, max: 79, label: 'Respecté', shopPriceMultiplier: 0.9, ambushWeightMultiplier: 0.75, eventWeightModifiers: { hostile: 0.75, helpful: 1.25 } },
  { min: 80, max: 100, label: 'Renommé', shopPriceMultiplier: 0.78, ambushWeightMultiplier: 0.5, eventWeightModifiers: { hostile: 0.5, helpful: 1.55 } },
];

export function getReputationRule(value: number): ReputationRule {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  return reputationRules.find((rule) => normalized >= rule.min && normalized <= rule.max)
    ?? reputationRules[2]!;
}

export function changeReputation(state: GameState, delta: number, source: string): number {
  state.reputation = Math.max(0, Math.min(100, state.reputation + Math.trunc(delta)));
  state.reputationHistory.push({ delta: Math.trunc(delta), source, value: state.reputation });
  return state.reputation;
}

export function getShopPrice(basePrice: number, reputation: number): number {
  return Math.max(1, Math.round(basePrice * getReputationRule(reputation).shopPriceMultiplier));
}

