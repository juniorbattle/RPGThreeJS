export type CombatTeam = 'player' | 'foe';

export interface UnitVisualState {
  visible: boolean;
  bodyOpacity: number;
  shadowOpacity: number;
  targetable: boolean;
}

export function getUnitVisualState(
  team: CombatTeam,
  alive: boolean,
  downed: boolean,
): UnitVisualState {
  if (alive) {
    return { visible: true, bodyOpacity: 1, shadowOpacity: 0.62, targetable: true };
  }
  if (team === 'player' && downed) {
    return { visible: true, bodyOpacity: 0.34, shadowOpacity: 0.12, targetable: false };
  }
  return { visible: false, bodyOpacity: 0, shadowOpacity: 0, targetable: false };
}
