/** Runtime participation is distinct from AP staged at zero before a first turn. */
export function isExhausted(unit: { alive: boolean; ap: number; _hasStartedTurn?: boolean } | null | undefined): boolean {
  return Boolean(unit?.alive && unit._hasStartedTurn && unit.ap <= 0);
}
