import type { UnitMotionPresetId } from './unitMotion';

export type CombatFeelProfileId = 'light' | 'heavy' | 'ranged' | 'cast' | 'support' | 'boss';

export interface CombatFeelProfile {
  id: CombatFeelProfileId;
  motionDurationScale: number;
  motionIntensity: number;
  impactHold: number;
  stageLeadIn: number;
  stageLeadOut: number;
  shakeFrequency: number;
}

export interface CombatFeelContext {
  motionPreset: UnitMotionPresetId;
  visualTier?: number;
  boss?: boolean;
  reducedGraphics?: boolean;
}

export const COMBAT_FEEL_PROFILES: Readonly<Record<CombatFeelProfileId, Readonly<CombatFeelProfile>>> = Object.freeze({
  light: Object.freeze({ id: 'light', motionDurationScale: 0.94, motionIntensity: 0.96, impactHold: 0.018, stageLeadIn: 0.12, stageLeadOut: 0.16, shakeFrequency: 22 }),
  heavy: Object.freeze({ id: 'heavy', motionDurationScale: 1.08, motionIntensity: 1.1, impactHold: 0.045, stageLeadIn: 0.18, stageLeadOut: 0.22, shakeFrequency: 16 }),
  ranged: Object.freeze({ id: 'ranged', motionDurationScale: 0.98, motionIntensity: 0.98, impactHold: 0.024, stageLeadIn: 0.13, stageLeadOut: 0.18, shakeFrequency: 20 }),
  cast: Object.freeze({ id: 'cast', motionDurationScale: 1.02, motionIntensity: 1.04, impactHold: 0.032, stageLeadIn: 0.16, stageLeadOut: 0.2, shakeFrequency: 18 }),
  support: Object.freeze({ id: 'support', motionDurationScale: 1, motionIntensity: 0.96, impactHold: 0.02, stageLeadIn: 0.12, stageLeadOut: 0.17, shakeFrequency: 20 }),
  boss: Object.freeze({ id: 'boss', motionDurationScale: 1.16, motionIntensity: 1.14, impactHold: 0.065, stageLeadIn: 0.22, stageLeadOut: 0.28, shakeFrequency: 11 }),
});

export function combatFeelProfileId(context: CombatFeelContext): CombatFeelProfileId {
  if (context.boss || (context.visualTier ?? 0) >= 6) return 'boss';
  if (context.motionPreset === 'melee_heavy' || context.motionPreset === 'self_aoe' || context.motionPreset === 'knockout') return 'heavy';
  if (context.motionPreset === 'ranged_attack') return 'ranged';
  if (context.motionPreset === 'heal_cast' || context.motionPreset === 'buff_cast' || context.motionPreset === 'revive') return 'support';
  if (context.motionPreset === 'magic_cast' || context.motionPreset === 'debuff_cast' || context.motionPreset === 'teleport') return 'cast';
  return 'light';
}

export function resolveCombatFeel(context: CombatFeelContext): CombatFeelProfile {
  const base = COMBAT_FEEL_PROFILES[combatFeelProfileId(context)];
  if (!context.reducedGraphics) return { ...base };
  return {
    ...base,
    motionDurationScale: Math.max(0.88, base.motionDurationScale * 0.94),
    motionIntensity: base.motionIntensity * 0.72,
    impactHold: Math.min(base.impactHold, 0.025),
    stageLeadIn: base.stageLeadIn * 0.72,
    stageLeadOut: base.stageLeadOut * 0.72,
  };
}
