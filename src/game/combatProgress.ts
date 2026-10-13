import type { CombatResult, GameState } from './types';
import { getFinalStats } from './catalog';

export function applyCombatProgress(
  state: GameState,
  result: CombatResult,
  maxPlayerUnits: number,
): void {
  if (!result.victory) return;
  if (result.consumables) state.inventory.consumables = { ...result.consumables };
  for (const unit of state.clan.members) {
    const stats = getFinalStats(unit);
    const reportedHealth = result.unitHealth[unit.id];
    if (reportedHealth !== undefined) {
      unit.currentHealth = Math.max(0, Math.min(stats.maxHealth, Math.floor(reportedHealth)));
    } else {
      unit.currentHealth = Math.max(0, Math.min(stats.maxHealth, Math.floor(unit.currentHealth)));
    }
  }
  state.deployment.unitIds = result.participants
    .filter((id) => state.clan.members.some((unit) => unit.id === id))
    .slice(0, maxPlayerUnits);
}
