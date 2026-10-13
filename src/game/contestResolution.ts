import type { DialogueChoice, GameState, NarrativeEffect } from './types';

export type ContestResult =
  | { type: 'normal'; next: string | null; effects: NarrativeEffect[] }
  | { type: 'contest-failure'; next: string; effects: NarrativeEffect[] }
  | { type: 'blocked' };

export function isChoiceBlocked(choice: DialogueChoice, state: GameState): boolean {
  const availableGold = state.gold + state.run.temporaryLoot.gold;
  if (choice.requiresGold !== undefined && availableGold < choice.requiresGold) return true;
  if (choice.requiresFlag !== undefined && !state.flags[choice.requiresFlag]) return true;
  if (choice.excludesFlag !== undefined && !!state.flags[choice.excludesFlag]) return true;
  if (choice.requiresReputationMin !== undefined && state.reputation < choice.requiresReputationMin) return true;
  if (choice.requiresReputationMax !== undefined && state.reputation > choice.requiresReputationMax) return true;
  return false;
}

export function resolveContestOutcome(choice: DialogueChoice, state: GameState): ContestResult {
  const blocked = isChoiceBlocked(choice, state);
  if (!blocked) return { type: 'normal', next: choice.next, effects: choice.effects };
  if (choice.contest) return { type: 'contest-failure', next: choice.contest.failure.next, effects: choice.contest.failure.effects };
  return { type: 'blocked' };
}
