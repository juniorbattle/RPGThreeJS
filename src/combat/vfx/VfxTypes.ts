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
  | 'shadow_lightning_bolt';

export type VfxSpriteSheetMode = 'billboard' | 'projectile';

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
  helpers?: VfxRuntimeHelpers;
}

export interface VfxPlayResult {
  played: boolean;
  presetId: string;
  impactTime: number;
  completion: Promise<void>;
}
