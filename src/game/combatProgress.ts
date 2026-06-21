import type { CombatResult, GameState } from './types';

export function applyCombatProgress(
  state: GameState,
  result: CombatResult,
  maxPlayerUnits: number,
): void {
  if (!result.victory) return;
  if (result.consumables) state.inventory.consumables = { ...result.consumables };
  for (const progress of result.progress) {
    const unit = state.clan.members.find((candidate) => candidate.id === progress.unitId);
    if (!unit) continue;
    unit.level = progress.level;
    unit.xp = progress.xp;
  }
  state.deployment.unitIds = result.participants
    .filter((id) => state.clan.members.some((unit) => unit.id === id))
    .slice(0, maxPlayerUnits);
}
