import type * as THREE from 'three';

export type VfxQualityMode = 'full' | 'reduced';

export type VfxSpriteSheetId =
  | 'slash_arc'
  | 'small_impact'
  | 'thrust_line'
  | 'projectile_shot'
  | 'magic_bolt'
  | 'fire_explosion'
  | 'heal_touch'
  | 'buff_pulse'
  | 'barrier_shell'
  | 'teleport_burst'
  | 'shockwave_ring'
  | 'leap_impact'
  | 'artillery_barrage'
  | 'dragon_breath'
  | 'heavy_execution'
  | 'meteor_fall'
  | 'titan_slam'
  | 'burn_mark'
  | 'silence_seal'
  | 'curse_mark'
  | 'weak_mark'
  | 'regen_aura'
  | 'revive_pillar'
  | 'holy_aura'
  | 'bless_field'
  | 'boost_aura'
  | 'smoke_burst'
  | 'mace_impact'
  | 'line_blast'
  | 'cone_blast'
  | 'dark_explosion'
  | 'explosion_large'
  | 'judgement_beam'
  | 'holy_explosion'
  | 'eclipse_devour'
  | 'drain_field'
  | 'zenith_arrow'
  | 'fault_breaker'
  | 'apocalypse_field'
  | 'shadow_lightning_bolt'
  | 'root_vines'
  | 'frost_bind';

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
