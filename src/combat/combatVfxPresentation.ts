import { skillById } from '../game/skills';
import {
  ENEMY_SKILL_IDS,
  HERO_SKILL_IDS,
  getSkillPresentation,
  type HeroSkillId,
  type EnemySkillId,
} from './skillPresentation';
import type { VfxContext, VfxOrientation, VfxScaleTier } from './vfx/VfxTypes';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Presentation-only hierarchy. These values never affect AP, damage, targeting
 * or any other combat rule; they only tune the existing motion/VFX pipeline.
 */
export const ACTION_PRESENTATION_TIERS = Object.freeze({
  1: { intensity: 0.88, particleScale: 0.90, durationScale: 0.94, motionDurationScale: 0.92, motionIntensity: 0.94, afterEffectDelay: 0.03 },
  2: { intensity: 0.98, particleScale: 0.98, durationScale: 0.98, motionDurationScale: 0.98, motionIntensity: 1.00, afterEffectDelay: 0.035 },
  3: { intensity: 1.07, particleScale: 1.04, durationScale: 1.01, motionDurationScale: 1.02, motionIntensity: 1.04, afterEffectDelay: 0.04 },
  4: { intensity: 1.14, particleScale: 1.08, durationScale: 1.04, motionDurationScale: 1.05, motionIntensity: 1.08, afterEffectDelay: 0.05 },
  5: { intensity: 1.20, particleScale: 1.11, durationScale: 1.04, motionDurationScale: 1.08, motionIntensity: 1.11, afterEffectDelay: 0.07 },
  6: { intensity: 1.25, particleScale: 1.14, durationScale: 1.05, motionDurationScale: 1.10, motionIntensity: 1.14, afterEffectDelay: 0.09 },
} as const);

export interface StaticVfxTierPresentation {
  scaleMultiplier: number;
  impactOpacityFloor: number;
  impactRenderOrder: number;
}

/**
 * Shared static VFX hierarchy for the combat runtime and the QA Workbench.
 * Preset and spritesheet scales still define each effect's silhouette; this
 * table only restores a readable progression between action tiers.
 */
export const STATIC_VFX_TIER_PRESENTATION: Readonly<Record<VfxScaleTier, StaticVfxTierPresentation>> = Object.freeze({
  basic: Object.freeze({ scaleMultiplier: 1, impactOpacityFloor: 0.80, impactRenderOrder: 74 }),
  '2ap': Object.freeze({ scaleMultiplier: 1.10, impactOpacityFloor: 0.84, impactRenderOrder: 76 }),
  '3ap': Object.freeze({ scaleMultiplier: 1.18, impactOpacityFloor: 0.88, impactRenderOrder: 78 }),
  '4ap': Object.freeze({ scaleMultiplier: 1.28, impactOpacityFloor: 0.91, impactRenderOrder: 80 }),
  '5ap_ultimate': Object.freeze({ scaleMultiplier: 1.42, impactOpacityFloor: 0.94, impactRenderOrder: 82 }),
  boss: Object.freeze({ scaleMultiplier: 1.50, impactOpacityFloor: 0.96, impactRenderOrder: 84 }),
});

export function getStaticVfxTierPresentation(scaleTier: VfxScaleTier = 'basic'): StaticVfxTierPresentation {
  return STATIC_VFX_TIER_PRESENTATION[scaleTier];
}

export interface ActionPresentationTuning {
  intensity: number;
  particleScale: number;
  durationScale: number;
  motionDurationScale: number;
  motionIntensity: number;
  afterEffectDelay: number;
  tier: number;
  scaleTier: VfxScaleTier;
  presentationScale: number;
  staticScaleMultiplier: number;
  impactOpacityFloor: number;
  impactRenderOrder: number;
}

export interface ResolvedCombatVfxPresentation {
  skillId: string;
  presetId: string;
  orientation?: VfxOrientation;
  scaleTier: VfxScaleTier;
  presentationScale: number;
  staticScaleMultiplier: number;
  impactOpacityFloor: number;
  impactRenderOrder: number;
  intensity: number;
  particleScale: number;
  durationScale: number;
  tier: number;
  impactCount?: number;
  ultimate?: true;
  visualTier?: number;
}

export function getActionVisualTier(spec: { key?: string; charge?: number; ap?: number } = {}): number {
  const presentation = getSkillPresentation(spec);
  if (presentation?.visualTier) return presentation.visualTier;
  if (spec.key === 'attack') return clamp(Math.floor(spec.charge ?? 0) + 1, 1, 3);
  return clamp(Math.round(spec.ap ?? 1), 1, 5);
}

export function getActionPresentationTuning(spec: { key?: string; charge?: number; ap?: number } = {}): ActionPresentationTuning {
  const tier = getActionVisualTier(spec);
  const base = ACTION_PRESENTATION_TIERS[tier as 1 | 2 | 3 | 4 | 5 | 6] ?? ACTION_PRESENTATION_TIERS[1];
  const presentation = getSkillPresentation(spec);
  const scaleTier: VfxScaleTier = presentation?.scaleTier
    ?? (tier >= 6 ? 'boss' : tier >= 5 ? '5ap_ultimate' : tier >= 4 ? '4ap' : tier >= 3 ? '3ap' : tier >= 2 ? '2ap' : 'basic');
  const staticPresentation = getStaticVfxTierPresentation(scaleTier);
  return {
    ...base,
    tier,
    scaleTier,
    presentationScale: clamp(presentation?.visualScale ?? 1, 0.55, 1.45),
    staticScaleMultiplier: staticPresentation.scaleMultiplier,
    impactOpacityFloor: staticPresentation.impactOpacityFloor,
    impactRenderOrder: staticPresentation.impactRenderOrder,
  };
}

/**
 * Resolves the full combat VFX presentation for a skill/action ID, using
 * skillPresentation.ts as the single source of truth. Returns undefined for
 * unknown or unmapped IDs.
 */
export function resolveCombatVfxPresentation(skillId: string): ResolvedCombatVfxPresentation | undefined {
  const presentation = getSkillPresentation({ key: skillId });
  if (!presentation) return undefined;
  const skill = skillById.get(skillId);
  const tuning = getActionPresentationTuning({ key: skillId, ap: skill?.ap });
  return {
    skillId,
    presetId: presentation.vfxPreset,
    orientation: presentation.orientation,
    scaleTier: tuning.scaleTier,
    presentationScale: tuning.presentationScale,
    staticScaleMultiplier: tuning.staticScaleMultiplier,
    impactOpacityFloor: tuning.impactOpacityFloor,
    impactRenderOrder: tuning.impactRenderOrder,
    intensity: tuning.intensity,
    particleScale: tuning.particleScale,
    durationScale: tuning.durationScale,
    tier: tuning.tier,
    ...(presentation.impactCount ? { impactCount: presentation.impactCount } : {}),
    ...(presentation.ultimate ? { ultimate: presentation.ultimate } : {}),
    ...(presentation.visualTier ? { visualTier: presentation.visualTier } : {}),
  };
}

/**
 * Applies resolved presentation metadata to a VfxContext, preserving all
 * runtime helpers and reducedGraphics from the base context.
 */
export function applyResolvedPresentationToContext(
  resolved: ResolvedCombatVfxPresentation,
  base: VfxContext,
): VfxContext {
  return {
    ...base,
    intensity: resolved.intensity,
    particleScale: resolved.particleScale,
    durationScale: resolved.durationScale,
    orientation: resolved.orientation,
    scaleTier: resolved.scaleTier,
    presentationScale: resolved.presentationScale,
    staticScaleMultiplier: resolved.staticScaleMultiplier,
    impactOpacityFloor: resolved.impactOpacityFloor,
    impactRenderOrder: resolved.impactRenderOrder,
  };
}

export const COMBAT_VFX_SKILL_IDS: readonly string[] = Object.freeze([
  ...HERO_SKILL_IDS,
  ...ENEMY_SKILL_IDS,
]);

export type { HeroSkillId, EnemySkillId };
