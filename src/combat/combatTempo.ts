/**
 * Pure tempo rules of the tactical runtime: action AP settlement and the
 * boss / elite AP budget. The runtime (`legacyCombatRuntime.js`) stays the only
 * owner of resolution; these helpers only compute numbers from values it passes.
 */

/**
 * AP a unit keeps after paying an action, then receiving +1 AP per knock-out it scored during that action and any AP
 * the action gave the unit itself (a grimoire's gift, an AP restore on oneself: final audit 2026-11-11, A8).
 */
export function settleActionAp(input: { ap: number; maxap: number; cost: number; knockOuts: number; bonusAp?: number }): number {
  const paid = Math.max(0, input.ap - Math.max(0, input.cost || 0));
  return Math.min(input.maxap, paid + Math.max(0, input.knockOuts || 0) + Math.max(0, input.bonusAp || 0));
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

/**
 * Operator decision after the 2026-11-11 PC playtest: a boss or elite cycle lasts four turns (light action, heavy skill,
 * CHARGE, ultimate), and bosses and elites regenerate 3 AP per turn so that cycle is affordable without ending a turn
 * Essoufflé. The cooldown is set after each ultimate and decremented at the start of each turn.
 */
export const BOSS_ULTIMATE_COOLDOWN = 4;
export const BOSS_ELITE_AP_REGEN = 3;

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

/**
 * Fury (set 1.21.0, OD-2026-11-11-B): a boss or elite below half its maximum HP. Derived from current HP, never saved.
 */
export const FURY_HP_RATIO = 0.5;

export function isInFury(unit: { alive: boolean; boss?: boolean; elite?: boolean; hp: number; maxhp: number } | null | undefined): boolean {
  return Boolean(unit && unit.alive && (unit.boss || unit.elite) && unit.hp > 0 && unit.maxhp > 0 && unit.hp < unit.maxhp * FURY_HP_RATIO);
}

/**
 * Whether a unit in Fury takes its free basic attack now: at most once per turn, after the first offensive action it
 * resolves in that turn, never on its ultimate's turn, after a support action, or while Brisé, Entravé or Muet.
 */
export function furyStrikeAllowed(input: {
  inFury: boolean;
  firstOffensiveActionThisTurn: boolean;
  usedThisTurn: boolean;
  castUltimateThisTurn: boolean;
  staggered: boolean;
  rooted: boolean;
  silenced: boolean;
  fightOpen: boolean;
}): boolean {
  return input.inFury && input.firstOffensiveActionThisTurn && !input.usedThisTurn && !input.castUltimateThisTurn
    && !input.staggered && !input.rooted && !input.silenced && input.fightOpen;
}

/** Set 1.22.0 (OD-2026-11-11-E, final audit B3): share of its maximum HP that breaks a boss or elite's charge. */
export const CHARGE_BREAK_RATIO = 0.15;

/** Damage the company must deal during one CHARGE or ULTIME window to break the charge. */
export function chargeBreakThreshold(maxhp: number): number {
  return Math.max(1, Math.ceil(Math.max(0, maxhp) * CHARGE_BREAK_RATIO));
}

/** Whole-percent progress toward the break, shown on the badge in text (0 to 100). */
export function chargeBreakPercent(dealt: number, maxhp: number): number {
  return Math.min(100, Math.floor((100 * Math.max(0, dealt)) / chargeBreakThreshold(maxhp)));
}

/**
 * Set 1.22.0 (OD-2026-11-11-E, final audit B3b): a boss or elite's Guard counts only the AP above its cycle reserve
 * (`bossApReserve` for its current cooldown, at the end of its turn after the Souffle); other units guard with every AP.
 */
export function bossGuardAp(ap: number, reserve: number): number {
  return Math.max(0, Math.floor(ap) - Math.max(0, Math.floor(reserve)));
}
