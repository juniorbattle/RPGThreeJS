/**
 * Pure tempo rules of the tactical runtime: action AP settlement and the
 * boss / elite AP budget. The runtime (`legacyCombatRuntime.js`) stays the only
 * owner of resolution; these helpers only compute numbers from values it passes.
 */

/** AP a unit keeps after paying an action, then receiving +1 AP per knock-out it scored during that action. */
export function settleActionAp(input: { ap: number; maxap: number; cost: number; knockOuts: number }): number {
  const paid = Math.max(0, input.ap - Math.max(0, input.cost || 0));
  return Math.min(input.maxap, paid + Math.max(0, input.knockOuts || 0));
}

export interface BossTempoProfile {
  /** AP cost of the boss or elite's ultimate (its costliest skill), or null when it has none. */
  ultimateCost: number | null;
  /** AP cost of its heavy skill (the costliest one below the ultimate, from 4 AP), or null. */
  heavyCost: number | null;
}

export interface BossTempoRules {
  maxap: number;
  /** AP regenerated at the start of a boss or elite turn. */
  regen: number;
  /** AP recovered at the end of a turn that keeps at least 1 AP ("Souffle"). */
  breath: number;
  /** AP held during the charge turns, so the CHARGE telegraph stays readable. */
  chargeHold: number;
}

/** The cooldown turn on which the heavy skill is planned (two turns before the ultimate). */
export const BOSS_HEAVY_COOLDOWN = 2;

/** Reads the ultimate and heavy costs from the AP costs of a unit's offensive skills. */
export function bossTempoProfile(offensiveSkillCosts: readonly number[]): BossTempoProfile {
  const costs = offensiveSkillCosts.filter(cost => Number.isFinite(cost) && cost > 0);
  const ultimate = costs.filter(cost => cost >= 5);
  const ultimateCost = ultimate.length ? Math.min(...ultimate) : null;
  const heavy = costs.filter(cost => cost >= 4 && (ultimateCost === null || cost < ultimateCost));
  return { ultimateCost, heavyCost: heavy.length ? Math.max(...heavy) : null };
}

/**
 * Least AP a boss or elite should keep at the end of a turn whose ultimate
 * cooldown (already decremented for this turn) is `cooldown`, so that its
 * cycle escalates: light actions, the heavy skill two turns out, a held charge,
 * then the ultimate as soon as the cooldown reaches 0. It never plans to end a
 * turn on 0 AP (which would leave it Essoufflé); only the ultimate itself spends
 * everything.
 */
export function bossApReserve(cooldown: number, profile: BossTempoProfile, rules: BossTempoRules): number {
  if (profile.ultimateCost === null) return Math.min(rules.maxap, 1);
  const ultimateCost = profile.ultimateCost;
  const startNeed = (cd: number): number => {
    if (cd <= 0) return ultimateCost;
    return endReserve(cd) + (cd === BOSS_HEAVY_COOLDOWN && profile.heavyCost !== null ? profile.heavyCost : 0);
  };
  const endReserve = (cd: number): number => {
    const next = startNeed(Math.max(0, cd - 1));
    let need = Math.max(1, next - rules.regen - rules.breath);
    if (cd <= 1) need = Math.max(need, rules.chargeHold);
    return Math.min(rules.maxap, need);
  };
  return endReserve(Math.max(0, Math.floor(cooldown)));
}
