/**
 * Set 1.22.0 (OD-2026-11-11-E, final audit B2): foes grow from plateau to plateau. RunSystem names the fight's plateau
 * in the combat launch request; the tactical runtime multiplies each foe's maximum and starting HP, and the direct damage
 * of each hit a foe deals, by the plateau's factor. A fight launched without a plateau (standalone or QA) uses 1.00.
 * Damage over time, clan supports, heroes, formations, skills, AI and rewards are unchanged. The factor is transient and
 * never saved. These five values are the contract's: any change to them requires a new amendment.
 */
export const PLATEAU_FOE_FACTORS = Object.freeze({
  lion: 1.0,
  bear: 1.1,
  dragon: 1.2,
  scorpion: 1.3,
  finale: 1.4,
} as const);

export type ScaledPlateauId = keyof typeof PLATEAU_FOE_FACTORS;

export const SCALED_PLATEAU_IDS = Object.freeze(Object.keys(PLATEAU_FOE_FACTORS) as ScaledPlateauId[]);

/** The factor of a plateau, or 1.00 when the fight names none. */
export function plateauFoeFactor(plateauId: string | null | undefined): number {
  return plateauId && plateauId in PLATEAU_FOE_FACTORS ? PLATEAU_FOE_FACTORS[plateauId as ScaledPlateauId] : 1;
}

/** A scaled foe value: rounded to an integer, never below 1. */
export function scaleFoeValue(value: number, factor: number): number {
  return Math.max(1, Math.round(value * factor));
}
