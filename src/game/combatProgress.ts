import type { CombatResult, GameState } from './types';
import { getFinalStats } from './catalog';

export function applyCombatProgress(
  state: GameState,
  result: CombatResult,
  maxPlayerUnits: number,
): void {
  if (!result.victory) return;
  if (result.consumables) state.inventory.consumables = { ...result.consumables };
  const participants = new Set(result.participants);
  for (const unit of state.clan.members) {
    const stats = getFinalStats(unit);
    const reportedHealth = result.unitHealth[unit.id];
    if (reportedHealth !== undefined) {
      // Tactical KO remains in the result; recovery belongs to the campaign victory boundary.
      unit.currentHealth = Math.max(participants.has(unit.id) ? 1 : 0,
        Math.min(stats.maxHealth, Math.floor(reportedHealth)));
    } else {
      unit.currentHealth = Math.max(0, Math.min(stats.maxHealth, Math.floor(unit.currentHealth)));
    }
  }
  state.deployment.unitIds = result.participants
    .filter((id) => state.clan.members.some((unit) => unit.id === id))
    .slice(0, maxPlayerUnits);
}
