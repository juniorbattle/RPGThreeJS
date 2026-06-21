import type { GameState, MysteryEvent } from './types';

export function chooseMysteryEvent(
  nodeId: string,
  pool: MysteryEvent[],
  state: GameState,
  random: () => number = Math.random,
): MysteryEvent {
  const assignedId = state.mysteryAssignments[nodeId];
  if (assignedId) {
    const assigned = pool.find((event) => event.id === assignedId);
    if (assigned) return assigned;
  }

  const eligible = pool.filter((event) => {
    if (event.unique && state.seenUniqueEvents.includes(event.id)) return false;
    if (event.requiresFlag && !state.flags[event.requiresFlag]) return false;
    if (event.excludesFlag && state.flags[event.excludesFlag]) return false;
    return true;
  });
  const candidates = eligible.length > 0 ? eligible : pool.filter((event) => !event.unique);
  if (candidates.length === 0) throw new Error(`Mystery pool for '${nodeId}' has no eligible event.`);

  const total = candidates.reduce((sum, event) => sum + event.weight, 0);
  let cursor = random() * total;
  const selected = candidates.find((event) => {
    cursor -= event.weight;
    return cursor <= 0;
  }) ?? candidates[candidates.length - 1]!;

  state.mysteryAssignments[nodeId] = selected.id;
  if (selected.unique && !state.seenUniqueEvents.includes(selected.id)) {
    state.seenUniqueEvents.push(selected.id);
  }
  return selected;
}

export function tickCombatCooldowns(state: GameState): void {
  for (const [nodeId, readyAt] of Object.entries(state.combatCooldowns)) {
    if (state.stepCounter >= readyAt) delete state.combatCooldowns[nodeId];
  }
}
