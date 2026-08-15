import type * as THREE from 'three';

export type VfxQualityMode = 'full' | 'reduced';

export type LegacyVfxSpriteSheetId =
  | 'basic_arrow_hit_small'
  | 'basic_axe_chop_medium'
  | 'basic_bite_snap_small'
  | 'basic_blade_crescent_medium'
  | 'basic_body_slam_heavy'
  | 'basic_bolt_hit_small'
  | 'basic_bullet_hit_medium'
  | 'basic_claw_rake_small'
  | 'basic_dagger_crosscut_small'
  | 'basic_execution_slash_heavy'
  | 'basic_greatsword_cleave_heavy'
  | 'basic_hammer_crush_heavy'
  | 'basic_horn_ram_medium'
  | 'basic_mace_impact_medium'
  | 'basic_shield_bash_medium'
  | 'basic_shuriken_cut_small'
  | 'basic_spear_stab_medium'
  | 'basic_staff_strike_small'
  | 'basic_sword_slash_heavy'
  | 'basic_sword_slash_small'
  | 'basic_tail_whip_medium'
  | 'basic_titan_crush_heavy'
  | 'skill_wind_slash_swirl_medium'
  | 'skill_holy_radiance_burst_heavy'
  | 'skill_barrier_guard_heavy'
  | 'skill_barrier_shield_ring_medium'
  | 'skill_void_rune_orb_medium'
  | 'skill_fire_impact_burst_medium'
  | 'skill_heal_blessing_bloom_heavy'
  | 'skill_holy_sigil_burst_medium'
  | 'skill_support_leaf_burst_medium'
  | 'skill_arcane_vortex_nova_heavy'
  | 'skill_arcane_orbit_burst_medium'
  | 'skill_arcane_sigil_burst_medium'
  | 'skill_fire_smoke_explosion_heavy'
  | 'skill_poison_maw_bite_heavy'
  | 'skill_ice_pillar_impact_heavy'
  | 'skill_fire_vortex_nova_heavy'
  | 'skill_barrier_nature_guard_medium'
  | 'skill_arcane_slash_burst_medium'
  | 'skill_meteor_impact_burst_heavy'
  | 'skill_holy_light_pillar_medium'
  | 'skill_void_singularity_implosion_ultimate'
  | 'skill_void_spiral_implosion_medium'
  | 'skill_fire_spark_cluster_medium'
  | 'skill_starburst_impact_medium';

export type NativeVfxSpriteSheetId =
  | 'megapack_dash_wind_white_v3'
  | 'megapack_blue_slash_flurry'
  | 'megapack_lightning_slash_flurry'
  | 'megapack_shield_on'
  | 'megapack_impact_darkness_lv3'
  | 'megapack_fire_slash_spin'
  | 'megapack_flamethrower_001'
  | 'megapack_positive_buff_v3'
  | 'megapack_heart_buff_v3'
  | 'megapack_angry_smoke_burst'
  | 'megapack_healing_v3'
  | 'megapack_hex_bursts_center_v2'
  | 'megapack_charge_darkness_v1_a'
  | 'megapack_impact_darkness_lv2'
  | 'megapack_impact_shockwave_v1';

export type VfxSpriteSheetId = LegacyVfxSpriteSheetId | NativeVfxSpriteSheetId;

export type VfxSpriteSheetMode = 'billboard' | 'projectile' | 'sky_descent';

/** Presentation-only directional metadata. It never changes targeting or area rules. */
export type VfxOrientation =
  | 'none'
  | 'face_target'
  | 'source_to_target'
  | 'align_line'
  | 'align_cone'
  | 'center_on_target'
  | 'center_on_aoe_origin'
  | 'source_to_destination';

/** Visual hierarchy only: combat calculations remain entirely unchanged. */
export type VfxScaleTier = 'basic' | '2ap' | '3ap' | '4ap' | '5ap_ultimate' | 'boss';

export type VfxAnchor =
  | 'source'
  | 'target'
  | 'targetFront'
  | 'targetBack'
  | 'targetTop'
  | 'midpoint'
  | 'groundTarget'
  | 'allTargets'
  | 'sourceGround'
  | 'targetGround'
  | 'camera'
  | 'screen';

/**
 * Semantic anchors used by the cinematic presentation layer. They are mapped
 * to the existing tactical VFX anchors at playback time and never alter a
 * skill's target cells.
 */
export type CinematicAnchor =
  | 'caster'
  | 'target'
  | 'source'
  | 'destination'
  | 'impactPoint'
  | 'aoeOrigin'
  | 'self'
  | 'arena';

/** Presentation-only orientation metadata for staged combat VFX. */
export type CinematicOrientation = VfxOrientation | 'sky_descent';

export type CinematicPhaseType = 'cast' | 'prePosition' | 'travel' | 'impact' | 'aftermath';

export interface VfxSkyDescentOptions {
  /** World height above the real impact point where the effect starts. */
  startHeight?: number;
  /** Optional lateral offset, in world coordinates, for a readable descent. */
  lateralOffset?: { x?: number; z?: number };
  scaleStart?: number;
  scaleEnd?: number;
  rotationMode?: 'path' | 'none';
  /** Reduced mode keeps the descent but can shorten it slightly. */
  reducedGraphicsMultiplier?: number;
}

export interface CinematicReducedProfile {
  enabled?: boolean;
  durationMultiplier?: number;
  intensityMultiplier?: number;
  skipSecondary?: boolean;
}

export interface CinematicPhase {
  id: string;
  type: CinematicPhaseType;
  startMs: number;
  durationMs: number;
  /** Existing VFX preset id only; raw assets are never valid here. */
  preset: string;
  anchor: CinematicAnchor;
  orientation?: CinematicOrientation;
  intensity?: number;
  scaleMultiplier?: number;
  opacityMultiplier?: number;
  skyDescent?: VfxSkyDescentOptions;
  reducedGraphics?: CinematicReducedProfile;
}

export interface CinematicDescriptor {
  id: string;
  totalMs: number;
  impactAtMs: number;
  phases: readonly CinematicPhase[];
  reducedGraphics?: CinematicReducedProfile;
}

export type VfxStepType =
  | 'particleBurst'
  | 'projectile'
  | 'slashArc'
  | 'shockwave'
  | 'groundRing'
  | 'magicCircle'
  | 'screenFlash'
  | 'screenShake'
  | 'lightPulse'
  | 'smokePuff'
  | 'sparkleBurst'
  | 'impactStar'
  | 'spriteSheet'
  | 'hitStop';

export type VfxTextureName =
  | 'softParticle'
  | 'sparkle'
  | 'slashArc'
  | 'smokePuff'
  | 'ringGradient'
  | 'projectileCore'
  | 'magicGlow'
  | 'magicCircle'
  | 'impactStar';

export interface VfxStep {
  id?: string;
  type: VfxStepType;
  anchor: VfxAnchor;
  targetAnchor?: VfxAnchor;
  texture?: VfxTextureName;
  spriteSheet?: VfxSpriteSheetId;
  sheetMode?: VfxSpriteSheetMode;
  startTime: number;
  duration: number;
  color?: string | number;
  secondaryColor?: string | number;
  scale?: number;
  radius?: number;
  count?: number;
  speed?: number;
  opacity?: number;
  heightOffset?: number;
  reducedGraphicsMultiplier?: number;
  rise?: number;
  spread?: number;
  rotation?: number;
  orientation?: VfxOrientation;
  /** Reusable presentation-only sky-to-ground trajectory primitive. */
  skyDescent?: VfxSkyDescentOptions;
  blending?: 'additive' | 'normal';
  /** Per-step sprite sheet presentation overrides. When absent, the
   *  definition's presentation defaults are used unchanged. */
  spritePresentation?: VfxSpritePresentationOverride;
}

export interface VfxSpritePresentationOverride {
  align?: 'center' | 'bottom';
  layer?: 'ground' | 'impact';
  blending?: 'normal' | 'additive';
  scaleMultiplier?: number;
  opacityMultiplier?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface VfxPreset {
  id: string;
  label?: string;
  duration: number;
  impactTime: number;
  tags: readonly string[];
  particleBudget: number;
  reducedGraphicsScale: number;
  steps: readonly VfxStep[];
}

export interface VfxUnitLike {
  grp?: THREE.Object3D;
  size?: number;
  gx?: number;
  gz?: number;
  baseY?: number;
  alive?: boolean;
  /** Actual rendered sprite height in world units. When present, enables precise visual center anchoring. */
  visualHeight?: number;
  /** Actual rendered sprite width in world units. Used for front/back offset calculation. */
  visualWidth?: number;
}

export interface VfxRuntimeHelpers {
  wait?: (seconds: number) => Promise<void>;
  screenShake?: (magnitude: number, duration: number) => void;
  screenFlash?: (color?: string, opacity?: number) => void;
  floatText?: (unit: VfxUnitLike, text: string, color?: string, big?: boolean) => void;
  wX?: (gridX: number) => number;
  wZ?: (gridZ: number) => number;
  tileTop?: (gridX: number, gridZ: number) => number;
}

export interface VfxContext {
  scene: THREE.Scene;
  camera: THREE.Camera;
  sourceUnit?: VfxUnitLike | null;
  targetUnits?: readonly VfxUnitLike[];
  targetPoint?: THREE.Vector3 | { x: number; y: number; z: number } | null;
  reducedGraphics?: boolean;
  intensity?: number;
  particleScale?: number;
  durationScale?: number;
  orientation?: VfxOrientation;
  scaleTier?: VfxScaleTier;
  presentationScale?: number;
  /** Shared static action-tier multiplier. It never changes tactical area. */
  staticScaleMultiplier?: number;
  /** Minimum peak opacity for foreground impact sprites. */
  impactOpacityFloor?: number;
  /** Foreground render order selected from the static action tier. */
  impactRenderOrder?: number;
  /** Presentation-only ground height offset (world Y). Negative values lower
   *  ground-based effects toward the combat floor. Does not affect tactical
   *  target points, AoE centers, hitboxes, or any gameplay rule. */
  groundYOffset?: number;
  /** Presentation-only multiplier for larger targets (2x2/boss). Does not affect targeting. */
  targetSizeMultiplier?: number;
  /** Applied by a cinematic phase without mutating registered VFX presets. */
  opacityMultiplier?: number;
  cinematicPhase?: {
    anchor?: VfxAnchor;
    orientation?: VfxOrientation;
    skyDescent?: VfxSkyDescentOptions;
  };
  helpers?: VfxRuntimeHelpers;
}

export interface VfxPlayResult {
  played: boolean;
  presetId: string;
  impactTime: number;
  completion: Promise<void>;
}
