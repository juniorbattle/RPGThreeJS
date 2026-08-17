/**
 * R2C-VFX LAB V2 — Simple Preset Composer.
 *
 * Semantic authoring core for combat VFX presets.
 *
 * ARCHITECTURAL PRINCIPLE
 * ----------------------
 *   AUTHOR WITH SEMANTICS. RESOLVE TO NUMERIC VALUES INTERNALLY.
 *
 * User-facing configuration : SIZE / TIMING / PLACEMENT / CHOREOGRAPHY
 * Runtime-facing configuration: scale / duration / fadeIn / fadeOut / opacity
 *                               anchor / layer / blending / orientation / startTime
 *
 * This module is PURE LOGIC. It never touches production presets
 * (`VfxPresets`), production sprite sheet registrations (`VFX_SPRITE_SHEETS`),
 * skill mappings, or gameplay. It only produces draft models and compiled
 * playback plans consumable by the existing `VfxSystem`.
 */

import type { VfxAnchor, VfxOrientation } from './VfxTypes';
import { repairCandidateAssignment } from './VfxSourceSuitability';

// ============================================================ Semantic Profiles

/**
 * LOW is the smallest supported profile but is STILL clearly visible and
 * impactful. It never means "tiny" or "subtle to the point of being hard to
 * perceive".
 */
export type VfxSizeProfile = 'LOW' | 'MID' | 'BIG' | 'GIGA';

/** Timing derives from the candidate's native cadence, never fixed AP constants. */
export type VfxTimingProfile = 'QUICK' | 'NORMAL' | 'LONG';

/**
 * The FIXED `AT` anchor of a spritesheet. This is the same field authored since
 * V2.0 (`placementProfile`), extended with BOTTOM / CASTER_FRONT / CASTER_BACK.
 * Keeping the field name preserves every existing draft and publication byte
 * for byte — no migration pass is required.
 *
 *   CASTER -----> FRONT [ TARGET ] BACK
 *
 * TOP / BOTTOM are the actual visual upper / lower edges of the target body.
 * GROUND remains the tactical floor position and is NOT the same as BOTTOM.
 */
export type VfxPlacementProfile =
  | 'AUTO'
  | 'TARGET'
  | 'FRONT'
  | 'BACK'
  | 'TOP'
  | 'BOTTOM'
  | 'CASTER'
  | 'CASTER_FRONT'
  | 'CASTER_BACK'
  | 'GROUND';

// ============================================================ Position Model

/** The definitive user-facing position mental model. */
export type VfxPositionMode = 'FIXED' | 'TRAVEL';

/** Semantic travel origin. SKY is a reusable descent anchor above the target. */
export type VfxTravelEndpoint =
  | 'CASTER'
  | 'CASTER_FRONT'
  | 'CASTER_BACK'
  | 'TARGET'
  | 'FRONT'
  | 'BACK'
  | 'TOP'
  | 'BOTTOM'
  | 'GROUND'
  | 'SKY';

export const VFX_POSITION_MODES: readonly VfxPositionMode[] = ['FIXED', 'TRAVEL'];

export const VFX_TRAVEL_FROM_ENDPOINTS: readonly VfxTravelEndpoint[] = [
  'CASTER', 'CASTER_FRONT', 'CASTER_BACK', 'TARGET', 'FRONT', 'BACK', 'TOP', 'BOTTOM', 'GROUND', 'SKY',
];

/** SKY is an origin only — nothing travels INTO the sky. */
export const VFX_TRAVEL_TO_ENDPOINTS: readonly VfxTravelEndpoint[] = [
  'TARGET', 'FRONT', 'BACK', 'TOP', 'BOTTOM', 'CASTER', 'CASTER_FRONT', 'CASTER_BACK', 'GROUND',
];

export const DEFAULT_POSITION_MODE: VfxPositionMode = 'FIXED';
/** Seeded the first time a slot switches FIXED -> TRAVEL. */
export const DEFAULT_TRAVEL_FROM: VfxTravelEndpoint = 'CASTER_FRONT';
export const DEFAULT_TRAVEL_TO: VfxTravelEndpoint = 'TARGET';

// ============================================================ Trajectory

/**
 * V2.6 TRAJECTORY — selectable path shape for TRAVEL slots.
 *
 *   STRAIGHT  — linear lerp from FROM to TO (the V2.5 default).
 *   ARC_LOW   — modest vertical parabolic lift.
 *   ARC_HIGH  — large vertical parabolic lift.
 *
 * Only TRAVEL slots use this value. FIXED slots ignore it entirely.
 * Missing field means STRAIGHT for backward compatibility.
 */
export type VfxTrajectoryProfile = 'STRAIGHT' | 'ARC_LOW' | 'ARC_HIGH';

export const VFX_TRAJECTORY_PROFILES: readonly VfxTrajectoryProfile[] = ['STRAIGHT', 'ARC_LOW', 'ARC_HIGH'];
export const DEFAULT_TRAJECTORY_PROFILE: VfxTrajectoryProfile = 'STRAIGHT';

// ============================================================ Transform Profiles

/**
 * DIRECTION (user-facing). The stored field remains `aimProfile` for schema
 * stability.
 *
 *   FIXED       — only the authored ROTATION applies (impact / heal / aura).
 *   TO_TARGET   — screen-space caster→target angle + authored ROTATION offset.
 *   ALONG_PATH  — travel path start→end angle + authored ROTATION offset.
 */
export type VfxAimProfile = 'FIXED' | 'TO_TARGET' | 'ALONG_PATH';
/** Alias expressing the V2.5 user-facing name. */
export type VfxDirectionProfile = VfxAimProfile;

/**
 * MIRROR reverses the visual start/end direction WITHOUT inverting vertical
 * orientation. `AUTO_HORIZONTAL` is displayed as AUTO and is resolved at
 * playback from projected screen-space direction.
 */
export type VfxMirrorProfile = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'BOTH' | 'AUTO_HORIZONTAL';

/**
 * ORIGIN (user-facing) — which local point of the spritesheet is attached to
 * its world position. The stored field remains `pivotProfile`.
 */
export type VfxPivotProfile = 'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
/** Alias expressing the V2.5 user-facing name. */
export type VfxOriginProfile = VfxPivotProfile;

export const VFX_AIM_PROFILES: readonly VfxAimProfile[] = ['FIXED', 'TO_TARGET', 'ALONG_PATH'];
/** DIRECTION options offered for FIXED slots. ALONG_PATH is travel-only. */
export const VFX_FIXED_DIRECTION_PROFILES: readonly VfxAimProfile[] = ['FIXED', 'TO_TARGET'];
export const VFX_MIRROR_PROFILES: readonly VfxMirrorProfile[] = ['NONE', 'AUTO_HORIZONTAL', 'HORIZONTAL', 'VERTICAL', 'BOTH'];
export const VFX_PIVOT_PROFILES: readonly VfxPivotProfile[] = ['CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];

export const VFX_ROTATION_PRESETS: readonly number[] = [-90, -45, 0, 45, 90, 180];

export const DEFAULT_AIM_PROFILE: VfxAimProfile = 'FIXED';
export const DEFAULT_ROTATION_DEGREES = 0;
export const DEFAULT_MIRROR_PROFILE: VfxMirrorProfile = 'NONE';
export const DEFAULT_PIVOT_PROFILE: VfxPivotProfile = 'CENTER';
/** Travel slots orient along their own path by default. */
export const DEFAULT_TRAVEL_DIRECTION_PROFILE: VfxAimProfile = 'ALONG_PATH';
export const DEFAULT_TRAVEL_MIRROR_PROFILE: VfxMirrorProfile = 'AUTO_HORIZONTAL';

// ============================================================ Phase Execution

/**
 * Generalized integer execution phase. All slots sharing a PHASE start
 * together; the next phase begins only once the LONGEST slot of the current
 * phase has finished.
 */
export const DEFAULT_PHASE = 0;
export const MAX_PHASE = 15;

// ============================================================ Per-Slot Impact FX

export type VfxImpactPower = 'LIGHT' | 'STRONG';

export const VFX_IMPACT_POWERS: readonly VfxImpactPower[] = ['LIGHT', 'STRONG'];

/**
 * Technical feedback OWNED BY THE SPRITESHEET responsible for the impact.
 * Default for every slot is fully OFF: nothing is ever auto-enabled from tier,
 * AP cost, Ultimate status, candidate family or action type.
 */
export interface VfxSlotImpactFx {
  flash?: boolean;
  shake?: boolean;
  hitStop?: boolean;
  power?: VfxImpactPower;
}

export const DEFAULT_IMPACT_POWER: VfxImpactPower = 'LIGHT';

/** True when a slot's Impact FX block would produce at least one event. */
export function hasActiveImpactFx(fx?: VfxSlotImpactFx | null): boolean {
  if (!fx) return false;
  return Boolean(fx.flash || fx.shake || fx.hitStop);
}

/**
 * LEGACY preset-level choreography. Preserved for backwards compatibility and
 * still authored by existing drafts, but PHASE is the generalized runtime
 * replacement. See `resolveSlotPhases`.
 */
export type VfxChoreography = 'TOGETHER' | 'SEQUENCE' | 'PAIR_THEN_LAST';

/**
 * LEGACY preset-level technical polish. Superseded by per-slot IMPACT FX.
 * See `resolveTechnicalEvents` for the deterministic compatibility strategy.
 */
export type VfxTechnicalPolish = 'AUTO' | 'OFF' | 'LIGHT' | 'STRONG';

export const VFX_SIZE_PROFILES: readonly VfxSizeProfile[] = ['LOW', 'MID', 'BIG', 'GIGA'];
export const VFX_TIMING_PROFILES: readonly VfxTimingProfile[] = ['QUICK', 'NORMAL', 'LONG'];
export const VFX_PLACEMENT_PROFILES: readonly VfxPlacementProfile[] = [
  'AUTO', 'TARGET', 'FRONT', 'BACK', 'TOP', 'BOTTOM', 'CASTER', 'CASTER_FRONT', 'CASTER_BACK', 'GROUND',
];
export const VFX_CHOREOGRAPHIES: readonly VfxChoreography[] = ['TOGETHER', 'SEQUENCE', 'PAIR_THEN_LAST'];
export const VFX_TECHNICAL_POLISH_LEVELS: readonly VfxTechnicalPolish[] = ['AUTO', 'OFF', 'LIGHT', 'STRONG'];

// ============================================================ Draft Model

/**
 * ADVANCED / DEBUG escape hatch. Collapsed by default in the UI and NOT part
 * of the normal authoring workflow. Any field present here wins over the
 * semantic resolver for that field only.
 */
export interface VfxSlotAdvancedOverride {
  scale?: number;
  duration?: number;
  opacity?: number;
  fadeIn?: number;
  fadeOut?: number;
  offsetX?: number;
  offsetY?: number;
  layer?: 'ground' | 'impact';
  blending?: 'normal' | 'additive';
  orientation?: VfxOrientation;
  anchor?: VfxAnchor;
  /** Explicit startTime. Normally computed by the choreography resolver. */
  startTime?: number;
}

/**
 * A single independently configurable visual building block.
 *
 *   SOURCE + SIZE + SPEED + POSITION + TRANSFORM + PHASE + IMPACT FX
 *
 * Every field describing the VISUAL BEHAVIOUR of a spritesheet lives here.
 * Only cross-slot orchestration (`phase`) refers to other slots.
 */
export interface VfxVisualSlot {
  id: string;
  candidateId: string;
  sizeProfile: VfxSizeProfile;
  timingProfile: VfxTimingProfile;
  /**
   * POSITION = FIXED -> the `AT` anchor. Historically named `placementProfile`;
   * the name is retained so existing drafts and publications load unchanged.
   */
  placementProfile: VfxPlacementProfile;
  /** POSITION mode. Absent means FIXED. */
  positionMode?: VfxPositionMode;
  /** TRAVEL origin. Only meaningful when positionMode is TRAVEL. */
  travelFrom?: VfxTravelEndpoint;
  /** TRAVEL destination. Only meaningful when positionMode is TRAVEL. */
  travelTo?: VfxTravelEndpoint;
  /** V2.6 TRAJECTORY path shape. Only meaningful when positionMode is TRAVEL. Missing means STRAIGHT. */
  trajectoryProfile?: VfxTrajectoryProfile;
  /** DIRECTION (user-facing). Stored as `aimProfile`. Defaults to FIXED. */
  aimProfile?: VfxAimProfile;
  /** ROTATION correction of the source's native angle, in degrees. Defaults to 0. */
  rotationDegrees?: number;
  /** MIRROR mode. Defaults to NONE. */
  mirrorProfile?: VfxMirrorProfile;
  /** ORIGIN (user-facing). Stored as `pivotProfile`. Defaults to CENTER. */
  pivotProfile?: VfxPivotProfile;
  /** Execution PHASE. Absent means the legacy choreography derives it. */
  phase?: number;
  /** Per-slot technical feedback. Absent means fully OFF. */
  impactFx?: VfxSlotImpactFx;
  advanced?: VfxSlotAdvancedOverride;
}

export interface VfxPresetDraft {
  actionKey: string;
  presetId: string;
  visualSlots: VfxVisualSlot[];
  choreography: VfxChoreography;
  technicalPolish: VfxTechnicalPolish;
  /** Semantic hint used by PLACEMENT=AUTO. Derived at migration time. */
  autoPlacement?: Exclude<VfxPlacementProfile, 'AUTO'>;
  /** Action tier (1..6) used by TECHNICAL POLISH=AUTO. */
  tier?: number;
  updatedAt?: number;
}

export const COMPOSER_DRAFT_SCHEMA_VERSION = 1;

export interface VfxComposerDraftBundle {
  schemaVersion: number;
  createdAt: string;
  drafts: Record<string, VfxPresetDraft>;
}

// ============================================================ Size Resolver

/**
 * Target FINAL DISPLAYED HEIGHT in world units, per semantic size profile.
 *
 * These are the authoritative user-visible sizes. The resolver divides out
 * every runtime multiplier so that a given profile produces the SAME visible
 * size across basic / 2AP / 3AP / 4AP / 5AP tiers — no double scaling.
 *
 * V2.2 presentation lock: LOW/MID/BIG/GIGA are fixed semantic heights. Runtime
 * scale compensation keeps those visible heights stable across action tiers.
 * GIGA is intentionally enormous for major Ultimates, boss attacks, meteor /
 * pillar / eruption, large summon effects, transformation effects, and extremely
 * premium signature skills.
 */
export const SIZE_PROFILE_TARGET_HEIGHT: Readonly<Record<VfxSizeProfile, number>> = Object.freeze({
  LOW: 1.80,
  MID: 2.50,
  BIG: 3.40,
  GIGA: 5.50,
});

/** Hard safety clamp on the resolved multiplier handed to the runtime. */
export const SLOT_SCALE_CLAMP = Object.freeze({ min: 0.05, max: 12 });

/**
 * Runtime multipliers that sit between the authored slot scale and the final
 * displayed sprite height. Mirrors `VfxSystem.playLabSpriteSheet`:
 *
 *   finalHeight = stepScale
 *               × slotScale                  <- what this resolver produces
 *               × intensity
 *               × reducedFactor
 *               × contextPresentationScale
 *               × targetSizeMultiplier
 */
export interface VfxRuntimeScaleFactors {
  /** Preset step `scale` field. Defaults to 1. */
  stepScale?: number;
  /** clamp(context.intensity, 0.35, 1.8). Defaults to 1. */
  intensity?: number;
  /** staticScaleMultiplier × clamp(presentationScale, 0.55, 1.45). Defaults to 1. */
  contextPresentationScale?: number;
  /** 1.0 for normal targets, 1.3 for large/boss targets. Defaults to 1. */
  targetSizeMultiplier?: number;
  /** true → runtime applies an extra 0.94 factor. Defaults to false. */
  reducedGraphics?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function runtimeScaleMultiplierProduct(factors: VfxRuntimeScaleFactors = {}): number {
  const stepScale = factors.stepScale ?? 1;
  const intensity = factors.intensity ?? 1;
  const presentation = factors.contextPresentationScale ?? 1;
  const targetSize = factors.targetSizeMultiplier ?? 1;
  const reduced = factors.reducedGraphics ? 0.94 : 1;
  return stepScale * intensity * presentation * targetSize * reduced;
}

/**
 * Resolves a semantic size profile into the numeric slot scale multiplier that
 * the runtime expects, compensating for all downstream multipliers.
 */
export function resolveSlotScale(
  sizeProfile: VfxSizeProfile,
  factors: VfxRuntimeScaleFactors = {},
): number {
  const target = SIZE_PROFILE_TARGET_HEIGHT[sizeProfile];
  const product = runtimeScaleMultiplierProduct(factors);
  if (!Number.isFinite(product) || product <= 0) return target;
  return clamp(target / product, SLOT_SCALE_CLAMP.min, SLOT_SCALE_CLAMP.max);
}

/**
 * Forward computation used by tests: given a resolved slot scale and the
 * runtime factors, what height does the sprite actually reach at its peak?
 */
export function computeFinalDisplayHeight(
  slotScale: number,
  factors: VfxRuntimeScaleFactors = {},
): number {
  return slotScale * runtimeScaleMultiplierProduct(factors);
}

// ============================================================ Timing Resolver

/**
 * Timing multipliers applied to the candidate's GIF preview reference cadence.
 * The reference duration is the sum of per-frame delays in the CartoonCoffee
 * preview GIF — universally 40ms/frame across all 1973 GIFs analysed.
 *
 * V2.2.5 cadence forensics proved:
 *   - ALL CartoonCoffee preview GIFs use 40ms/frame uniformly (zero variable
 *     delays). This is a preview-generation constant, not proven to be
 *     original CartoonCoffee authoring metadata.
 *   - The previous 50ms (2048px) / 20ms (4096px) values were unsupported
 *     RPGThreeJS assumptions from atlas dimension conventions.
 *   - 64f GIF preview reference: ~2.12s; 16f GIF preview reference: ~0.52s.
 *   - QUICK = 1.00× provided no actual acceleration profile — 64f QUICK at
 *     1.28s was still too slow for responsive tactical impacts, and
 *     NORMAL 1.66s / LONG 2.24s made the problem worse.
 *
 * The new multipliers intentionally compress the GIF preview reference
 * cadence for RPGThreeJS game feel:
 *
 *   QUICK  = 0.35× → sharp / immediate / attack-friendly
 *   NORMAL = 0.60× → readable standard effect
 *   LONG   = 1.00× → GIF preview reference speed (cinematic / lingering)
 */
export const TIMING_PROFILE_NATIVE_MULTIPLIER: Readonly<Record<VfxTimingProfile, number>> = Object.freeze({
  QUICK: 0.35,
  NORMAL: 0.60,
  LONG: 1.00,
});

/**
 * Floor durations per timing profile. Ensures QUICK < NORMAL < LONG always
 * produces clearly perceptible visible separation, even for short 16f sources
 * where the multiplier alone would produce too-short durations.
 */
export const TIMING_PROFILE_FLOOR: Readonly<Record<VfxTimingProfile, number>> = Object.freeze({
  QUICK: 0.40,
  NORMAL: 0.65,
  LONG: 1.00,
});

/** Fallback when a candidate has no GIF preview reference cadence. Uses the
 * universal CartoonCoffee preview GIF delay of 40ms/frame × 64 frames. This
 * is an inferred reference cadence, not vendor-native metadata. */
export const TIMING_FALLBACK_NATIVE_DURATION = 2.56;

/** Universal CartoonCoffee preview GIF per-frame delay, extracted from 1973
 * GIF previews. This is a preview-generation constant, not proven to be
 * original CartoonCoffee authoring metadata. */
export const CARTOONCOFFEE_UNIVERSAL_FRAME_DELAY_MS = 40;

export const DURATION_CLAMP = Object.freeze({ min: 0.10, max: 6.0 });

export interface VfxNativeCadence {
  frameCount: number;
  frameDurationMs: number;
}

export function nativeDurationSeconds(cadence: VfxNativeCadence | null | undefined): number {
  if (!cadence || !Number.isFinite(cadence.frameCount) || !Number.isFinite(cadence.frameDurationMs)) {
    return TIMING_FALLBACK_NATIVE_DURATION;
  }
  if (cadence.frameCount <= 0 || cadence.frameDurationMs <= 0) {
    return TIMING_FALLBACK_NATIVE_DURATION;
  }
  return (cadence.frameCount * cadence.frameDurationMs) / 1000;
}

export function resolveSlotDuration(
  timingProfile: VfxTimingProfile,
  cadence: VfxNativeCadence | null | undefined,
): number {
  const native = nativeDurationSeconds(cadence);
  const multiplier = TIMING_PROFILE_NATIVE_MULTIPLIER[timingProfile];
  const floor = TIMING_PROFILE_FLOOR[timingProfile];
  const scaled = Math.round(native * multiplier * 1000) / 1000;
  return clamp(
    Math.max(scaled, floor),
    DURATION_CLAMP.min,
    DURATION_CLAMP.max,
  );
}

// ============================================================ Visibility Defaults

/**
 * Safe visibility defaults. Fade controls are NOT exposed in the standard UI.
 *
 * V2.2 presentation lock: native PNG alpha is preserved at full material
 * opacity for the entire spritesheet lifetime. Fade controls remain in the
 * portable schema for backwards compatibility but are not authored here.
 */
export const VISIBILITY_DEFAULTS = Object.freeze({
  opacity: 1.0,
  fadeIn: 0,
  fadeOutByTiming: Object.freeze({ QUICK: 1, NORMAL: 1, LONG: 1 }) as Readonly<Record<VfxTimingProfile, number>>,
});

/** Lower bound enforced on every composed slot. Never regress to A1 values. */
export const MIN_SAFE_FADE_OUT = 0.85;

export function resolveSlotVisibility(timingProfile: VfxTimingProfile): {
  opacity: number;
  fadeIn: number;
  fadeOut: number;
} {
  return {
    opacity: VISIBILITY_DEFAULTS.opacity,
    fadeIn: VISIBILITY_DEFAULTS.fadeIn,
    fadeOut: Math.max(VISIBILITY_DEFAULTS.fadeOutByTiming[timingProfile], MIN_SAFE_FADE_OUT),
  };
}

// ============================================================ Placement Resolver

export interface ResolvedPlacement {
  anchor: VfxAnchor;
  layer: 'ground' | 'impact';
  orientation: VfxOrientation;
}

const PLACEMENT_TABLE: Readonly<Record<Exclude<VfxPlacementProfile, 'AUTO'>, ResolvedPlacement>> = Object.freeze({
  TARGET: Object.freeze({ anchor: 'target' as VfxAnchor, layer: 'impact' as const, orientation: 'face_target' as VfxOrientation }),
  FRONT: Object.freeze({ anchor: 'targetFront' as VfxAnchor, layer: 'impact' as const, orientation: 'face_target' as VfxOrientation }),
  BACK: Object.freeze({ anchor: 'targetBack' as VfxAnchor, layer: 'impact' as const, orientation: 'face_target' as VfxOrientation }),
  TOP: Object.freeze({ anchor: 'targetTop' as VfxAnchor, layer: 'impact' as const, orientation: 'center_on_target' as VfxOrientation }),
  BOTTOM: Object.freeze({ anchor: 'targetBottom' as VfxAnchor, layer: 'impact' as const, orientation: 'center_on_target' as VfxOrientation }),
  CASTER: Object.freeze({ anchor: 'source' as VfxAnchor, layer: 'impact' as const, orientation: 'none' as VfxOrientation }),
  CASTER_FRONT: Object.freeze({ anchor: 'sourceFront' as VfxAnchor, layer: 'impact' as const, orientation: 'face_target' as VfxOrientation }),
  CASTER_BACK: Object.freeze({ anchor: 'sourceBack' as VfxAnchor, layer: 'impact' as const, orientation: 'face_target' as VfxOrientation }),
  GROUND: Object.freeze({ anchor: 'groundTarget' as VfxAnchor, layer: 'impact' as const, orientation: 'center_on_aoe_origin' as VfxOrientation }),
});

/**
 * Resolves AUTO from the draft's derived semantic hint. Falls back to TARGET,
 * which is the correct default for direct hits (the majority of actions).
 */
export function resolvePlacement(
  placementProfile: VfxPlacementProfile,
  autoHint?: Exclude<VfxPlacementProfile, 'AUTO'>,
): ResolvedPlacement {
  const effective = placementProfile === 'AUTO' ? (autoHint ?? 'TARGET') : placementProfile;
  return PLACEMENT_TABLE[effective] ?? PLACEMENT_TABLE.TARGET;
}

/** Semantic travel endpoint → runtime anchor. */
const TRAVEL_ENDPOINT_ANCHORS: Readonly<Record<VfxTravelEndpoint, VfxAnchor>> = Object.freeze({
  CASTER: 'source',
  CASTER_FRONT: 'sourceFront',
  CASTER_BACK: 'sourceBack',
  TARGET: 'target',
  FRONT: 'targetFront',
  BACK: 'targetBack',
  TOP: 'targetTop',
  BOTTOM: 'targetBottom',
  GROUND: 'groundTarget',
  SKY: 'sky',
});

export function resolveTravelAnchor(endpoint: VfxTravelEndpoint): VfxAnchor {
  return TRAVEL_ENDPOINT_ANCHORS[endpoint] ?? 'target';
}

/** Blending default: additive reads energy edges well for megapack sources. */
export const DEFAULT_BLENDING: 'normal' | 'additive' = 'additive';

// ============================================================ Choreography

export interface ChoreographyCompatibility {
  compatible: boolean;
  reason?: string;
}

export function choreographyCompatibility(
  choreography: VfxChoreography,
  slotCount: number,
): ChoreographyCompatibility {
  if (slotCount < 1) {
    return { compatible: false, reason: 'Add at least one spritesheet.' };
  }
  if (choreography === 'PAIR_THEN_LAST' && slotCount < 3) {
    return {
      compatible: false,
      reason: `PAIR THEN LAST needs at least 3 spritesheets (currently ${slotCount}).`,
    };
  }
  return { compatible: true };
}

/**
 * Computes the startTime for every slot. The user NEVER enters startTime.
 *
 * TOGETHER       — every slot starts at 0.
 * SEQUENCE       — slots play one after another (cumulative durations).
 * PAIR_THEN_LAST — slots 0 and 1 play together, remaining slots follow
 *                  sequentially after the pair completes.
 */
export function resolveChoreographyStartTimes(
  choreography: VfxChoreography,
  durations: readonly number[],
): number[] {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  if (durations.length === 0) return [];

  if (choreography === 'TOGETHER') {
    return durations.map(() => 0);
  }

  if (choreography === 'SEQUENCE') {
    const starts: number[] = [];
    let cursor = 0;
    for (const duration of durations) {
      starts.push(round(cursor));
      cursor += duration;
    }
    return starts;
  }

  // PAIR_THEN_LAST
  if (durations.length < 3) {
    // Not compatible — degrade to TOGETHER rather than producing broken timing.
    return durations.map(() => 0);
  }
  const starts: number[] = [0, 0];
  let cursor = Math.max(durations[0] ?? 0, durations[1] ?? 0);
  for (let i = 2; i < durations.length; i += 1) {
    starts.push(round(cursor));
    cursor += durations[i] ?? 0;
  }
  return starts;
}

// ============================================================ Phase Execution

/**
 * Derives the legacy choreography into explicit integer phases.
 *
 *   TOGETHER       -> 0,0,0,...
 *   SEQUENCE       -> 0,1,2,...
 *   PAIR_THEN_LAST -> 0,0,1,2,...
 */
export function choreographyToPhases(
  choreography: VfxChoreography,
  slotCount: number,
): number[] {
  if (slotCount <= 0) return [];
  if (choreography === 'TOGETHER') return Array.from({ length: slotCount }, () => 0);
  if (choreography === 'SEQUENCE') return Array.from({ length: slotCount }, (_v, i) => i);
  // PAIR_THEN_LAST: first two together, remaining sequential.
  if (slotCount < 3) return Array.from({ length: slotCount }, () => 0);
  return Array.from({ length: slotCount }, (_v, i) => (i < 2 ? 0 : i - 1));
}

/**
 * Authoritative per-slot PHASE resolution.
 *
 * MIGRATION DOCTRINE: a draft is considered "phase-authored" as soon as ANY
 * slot carries an explicit `phase`. Until then the legacy `choreography` is the
 * authority, so every existing V2.4 draft and publication keeps its exact
 * timing without the user recreating anything.
 */
export function resolveSlotPhases(draft: VfxPresetDraft): number[] {
  const slots = draft.visualSlots;
  const authored = slots.some((slot) => typeof slot.phase === 'number' && Number.isFinite(slot.phase));
  if (!authored) return choreographyToPhases(draft.choreography, slots.length);
  return slots.map((slot) => {
    const raw = typeof slot.phase === 'number' && Number.isFinite(slot.phase) ? slot.phase : DEFAULT_PHASE;
    return clamp(Math.round(raw), 0, MAX_PHASE);
  });
}

/**
 * Computes start times from integer phases.
 *
 * All slots sharing a phase start together. The next phase starts only when the
 * LONGEST slot of the previous phase has finished:
 *
 *   phaseDuration    = max(duration of all slots in that phase)
 *   nextPhaseStart   = previousPhaseStart + previousPhaseDuration
 *
 * SPARSE PHASES: sorted unique phase values are processed in ascending order,
 * so `0,2,5` behaves identically to `0,1,2`. No manual timestamps ever exist.
 */
export function resolvePhaseStartTimes(
  phases: readonly number[],
  durations: readonly number[],
): number[] {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  if (phases.length === 0) return [];
  const orderedPhases = [...new Set(phases)].sort((a, b) => a - b);
  const startByPhase = new Map<number, number>();
  let cursor = 0;
  for (const phase of orderedPhases) {
    startByPhase.set(phase, round(cursor));
    let longest = 0;
    for (let i = 0; i < phases.length; i += 1) {
      if (phases[i] !== phase) continue;
      longest = Math.max(longest, durations[i] ?? 0);
    }
    cursor += longest;
  }
  return phases.map((phase) => startByPhase.get(phase) ?? 0);
}

/** Sets a slot's execution PHASE, clamped to the supported range. */
export function setSlotPhase(draft: VfxPresetDraft, slotId: string, phase: number): VfxPresetDraft {
  const next = clamp(Math.round(phase), 0, MAX_PHASE);
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => (slot.id === slotId ? { ...slot, phase: next } : slot)),
    updatedAt: Date.now(),
  };
}

/**
 * Materializes the currently effective phases onto every slot. Used when the
 * author touches PHASE for the first time so that the legacy choreography
 * timing is preserved exactly rather than collapsing to all-zero.
 */
export function materializeSlotPhases(draft: VfxPresetDraft): VfxPresetDraft {
  const phases = resolveSlotPhases(draft);
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot, index) => ({ ...slot, phase: phases[index] ?? DEFAULT_PHASE })),
  };
}

/** Adjusts a slot's PHASE by `delta`, materializing legacy phases first. */
export function nudgeSlotPhase(draft: VfxPresetDraft, slotId: string, delta: number): VfxPresetDraft {
  const materialized = materializeSlotPhases(draft);
  const current = materialized.visualSlots.find((slot) => slot.id === slotId)?.phase ?? DEFAULT_PHASE;
  return setSlotPhase(materialized, slotId, current + delta);
}

// ============================================================ Technical Polish

export interface ResolvedTechnicalEffect {
  type: 'screenFlash' | 'screenShake' | 'hitStop';
  startTime: number;
  duration: number;
  scale?: number;
  opacity?: number;
  color?: string;
}

/**
 * Internal technical polish levels. Values are never exposed to the author.
 * AUTO derives from the action tier.
 */
const POLISH_LEVEL_VALUES = Object.freeze({
  LIGHT: Object.freeze({ flashOpacity: 0.16, shakeMagnitude: 0.10, shakeDuration: 0.12, hitStopDuration: 0.04 }),
  STRONG: Object.freeze({ flashOpacity: 0.30, shakeMagnitude: 0.22, shakeDuration: 0.20, hitStopDuration: 0.08 }),
});

/** AUTO: tiers 1-3 → LIGHT, tiers 4+ → STRONG. */
export function resolveAutoPolishLevel(tier?: number): 'LIGHT' | 'STRONG' {
  return (tier ?? 1) >= 4 ? 'STRONG' : 'LIGHT';
}

export function resolveTechnicalEffects(
  polish: VfxTechnicalPolish,
  impactTime: number,
  tier?: number,
): ResolvedTechnicalEffect[] {
  if (polish === 'OFF') return [];
  const level = polish === 'AUTO' ? resolveAutoPolishLevel(tier) : polish;
  const values = POLISH_LEVEL_VALUES[level];
  const startTime = Math.max(0, Math.round(impactTime * 1000) / 1000);
  return [
    { type: 'screenFlash', startTime, duration: 0.12, opacity: values.flashOpacity, color: '#ffffff' },
    { type: 'screenShake', startTime, duration: values.shakeDuration, scale: values.shakeMagnitude },
    { type: 'hitStop', startTime, duration: values.hitStopDuration },
  ];
}

// ============================================================ Slot Impact FX

/**
 * Semantic ratio through a slot's own duration where its impact reads.
 *
 * FIXED: 45% — the visual peak of an impact/hit/aura animation.
 * TRAVEL: 100% — the destination IS the semantic arrival/impact point.
 */
export const SLOT_IMPACT_RATIO = 0.45;
export const TRAVEL_IMPACT_RATIO = 1.0;

/** Deterministic local impact point inside a slot's own duration. */
export function resolveSlotLocalImpactTime(
  duration: number,
  positionMode: VfxPositionMode = 'FIXED',
): number {
  const ratio = positionMode === 'TRAVEL' ? TRAVEL_IMPACT_RATIO : SLOT_IMPACT_RATIO;
  return Math.round(duration * ratio * 1000) / 1000;
}

/**
 * Builds the technical events owned by a single slot at its OWN absolute impact
 * time. Because the impact time derives from `startTime + duration * ratio`,
 * the events automatically follow any PHASE or SPEED change with no manual
 * resynchronization.
 */
export function resolveSlotImpactEvents(
  fx: VfxSlotImpactFx | undefined,
  absoluteImpactTime: number,
): ResolvedTechnicalEffect[] {
  if (!hasActiveImpactFx(fx)) return [];
  const values = POLISH_LEVEL_VALUES[fx?.power ?? DEFAULT_IMPACT_POWER];
  const startTime = Math.max(0, Math.round(absoluteImpactTime * 1000) / 1000);
  const events: ResolvedTechnicalEffect[] = [];
  if (fx?.flash) {
    events.push({ type: 'screenFlash', startTime, duration: 0.12, opacity: values.flashOpacity, color: '#ffffff' });
  }
  if (fx?.shake) {
    events.push({ type: 'screenShake', startTime, duration: values.shakeDuration, scale: values.shakeMagnitude });
  }
  if (fx?.hitStop) {
    events.push({ type: 'hitStop', startTime, duration: values.hitStopDuration });
  }
  return events;
}

/** True when a draft has been authored with the V2.5 per-slot Impact FX model. */
export function usesSlotImpactFx(draft: VfxPresetDraft): boolean {
  return draft.visualSlots.some((slot) => hasActiveImpactFx(slot.impactFx));
}

/** Toggles one Impact FX channel on a slot. */
export function toggleSlotImpactFx(
  draft: VfxPresetDraft,
  slotId: string,
  channel: 'flash' | 'shake' | 'hitStop',
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId) return slot;
      const current = slot.impactFx ?? {};
      const next: VfxSlotImpactFx = { ...current, [channel]: !current[channel] };
      if (!hasActiveImpactFx(next)) {
        // Fully OFF again: drop the block entirely so the slot fingerprints as
        // an untouched default.
        const { impactFx: _cleared, ...rest } = slot;
        return rest;
      }
      if (!next.power) next.power = DEFAULT_IMPACT_POWER;
      return { ...slot, impactFx: next };
    }),
    updatedAt: Date.now(),
  };
}

/** Sets the POWER of an already-active Impact FX block. */
export function setSlotImpactPower(
  draft: VfxPresetDraft,
  slotId: string,
  power: VfxImpactPower,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId || !hasActiveImpactFx(slot.impactFx)) return slot;
      return { ...slot, impactFx: { ...slot.impactFx, power } };
    }),
    updatedAt: Date.now(),
  };
}

/** Clears every Impact FX channel on a slot. */
export function clearSlotImpactFx(draft: VfxPresetDraft, slotId: string): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId) return slot;
      const { impactFx: _cleared, ...rest } = slot;
      return rest;
    }),
    updatedAt: Date.now(),
  };
}

// ============================================================ Slot Operations

let _slotCounter = 0;

export function createSlotId(): string {
  _slotCounter += 1;
  return `slot_${Date.now().toString(36)}_${_slotCounter.toString(36)}`;
}

export function createVisualSlot(
  candidateId: string,
  overrides: Partial<Omit<VfxVisualSlot, 'id' | 'candidateId'>> = {},
): VfxVisualSlot {
  return {
    id: createSlotId(),
    candidateId,
    sizeProfile: overrides.sizeProfile ?? 'MID',
    timingProfile: overrides.timingProfile ?? 'NORMAL',
    placementProfile: overrides.placementProfile ?? 'AUTO',
    ...(overrides.positionMode ? { positionMode: overrides.positionMode } : {}),
    ...(overrides.travelFrom ? { travelFrom: overrides.travelFrom } : {}),
    ...(overrides.travelTo ? { travelTo: overrides.travelTo } : {}),
    ...(overrides.trajectoryProfile ? { trajectoryProfile: overrides.trajectoryProfile } : {}),
    ...(overrides.aimProfile ? { aimProfile: overrides.aimProfile } : {}),
    ...(overrides.rotationDegrees != null ? { rotationDegrees: overrides.rotationDegrees } : {}),
    ...(overrides.mirrorProfile ? { mirrorProfile: overrides.mirrorProfile } : {}),
    ...(overrides.pivotProfile ? { pivotProfile: overrides.pivotProfile } : {}),
    ...(overrides.phase != null ? { phase: overrides.phase } : {}),
    ...(overrides.impactFx ? { impactFx: overrides.impactFx } : {}),
    ...(overrides.advanced ? { advanced: overrides.advanced } : {}),
  };
}

export function addSlot(
  draft: VfxPresetDraft,
  candidateId: string,
  overrides: Partial<Omit<VfxVisualSlot, 'id' | 'candidateId'>> = {},
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: [...draft.visualSlots, createVisualSlot(candidateId, overrides)],
    updatedAt: Date.now(),
  };
}

export function removeSlot(draft: VfxPresetDraft, slotId: string): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.filter((slot) => slot.id !== slotId),
    updatedAt: Date.now(),
  };
}

/** Replaces a slot's candidate while preserving its semantic profiles. */
export function replaceSlotCandidate(
  draft: VfxPresetDraft,
  slotId: string,
  candidateId: string,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) =>
      slot.id === slotId ? { ...slot, candidateId } : slot),
    updatedAt: Date.now(),
  };
}

export function updateSlotProfile(
  draft: VfxPresetDraft,
  slotId: string,
  patch: Partial<Pick<VfxVisualSlot,
    | 'sizeProfile' | 'timingProfile' | 'placementProfile'
    | 'travelFrom' | 'travelTo' | 'trajectoryProfile'
    | 'aimProfile' | 'rotationDegrees' | 'mirrorProfile' | 'pivotProfile'>>,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) =>
      slot.id === slotId ? { ...slot, ...patch } : slot),
    updatedAt: Date.now(),
  };
}

/**
 * Switches a slot between FIXED and TRAVEL.
 *
 * The first time a slot becomes TRAVEL, sensible defaults are seeded:
 *   FROM = C.FRONT, TO = TARGET, DIRECTION = ALONG PATH, MIRROR = AUTO,
 *   ORIGIN = CENTER
 *
 * Already-customized travel values are never overwritten when toggling
 * FIXED/TRAVEL back and forth.
 */
export function setSlotPositionMode(
  draft: VfxPresetDraft,
  slotId: string,
  mode: VfxPositionMode,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId) return slot;
      if (mode === 'FIXED') return { ...slot, positionMode: 'FIXED' as VfxPositionMode };
      const seeded: VfxVisualSlot = {
        ...slot,
        positionMode: 'TRAVEL',
        travelFrom: slot.travelFrom ?? DEFAULT_TRAVEL_FROM,
        travelTo: slot.travelTo ?? DEFAULT_TRAVEL_TO,
        ...(slot.trajectoryProfile ? { trajectoryProfile: slot.trajectoryProfile } : {}),
      };
      // Seed direction/mirror only when the author has never touched them.
      if (slot.aimProfile == null) seeded.aimProfile = DEFAULT_TRAVEL_DIRECTION_PROFILE;
      if (slot.mirrorProfile == null) seeded.mirrorProfile = DEFAULT_TRAVEL_MIRROR_PROFILE;
      return seeded;
    }),
    updatedAt: Date.now(),
  };
}

/** Sets the V2.6 TRAJECTORY profile on a slot. Only meaningful for TRAVEL slots. */
export function setSlotTrajectoryProfile(
  draft: VfxPresetDraft,
  slotId: string,
  profile: VfxTrajectoryProfile,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId) return slot;
      if (profile === DEFAULT_TRAJECTORY_PROFILE) {
        const { trajectoryProfile: _cleared, ...rest } = slot;
        return rest;
      }
      return { ...slot, trajectoryProfile: profile };
    }),
    updatedAt: Date.now(),
  };
}

export function setSlotAdvancedOverride(
  draft: VfxPresetDraft,
  slotId: string,
  patch: VfxSlotAdvancedOverride,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) =>
      slot.id === slotId ? { ...slot, advanced: { ...(slot.advanced ?? {}), ...patch } } : slot),
    updatedAt: Date.now(),
  };
}

export function clearSlotAdvancedOverride(draft: VfxPresetDraft, slotId: string): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) => {
      if (slot.id !== slotId) return slot;
      const { advanced: _discarded, ...rest } = slot;
      return rest;
    }),
    updatedAt: Date.now(),
  };
}

/** Moves a slot by `delta` positions. Out-of-range moves are no-ops. */
export function moveSlot(draft: VfxPresetDraft, slotId: string, delta: number): VfxPresetDraft {
  const index = draft.visualSlots.findIndex((slot) => slot.id === slotId);
  if (index < 0) return draft;
  const target = index + delta;
  if (target < 0 || target >= draft.visualSlots.length) return draft;
  const slots = [...draft.visualSlots];
  const [moved] = slots.splice(index, 1);
  if (!moved) return draft;
  slots.splice(target, 0, moved);
  return { ...draft, visualSlots: slots, updatedAt: Date.now() };
}

export function moveSlotUp(draft: VfxPresetDraft, slotId: string): VfxPresetDraft {
  return moveSlot(draft, slotId, -1);
}

export function moveSlotDown(draft: VfxPresetDraft, slotId: string): VfxPresetDraft {
  return moveSlot(draft, slotId, 1);
}

/**
 * Sets the legacy preset-level composition.
 *
 * Once a draft has been phase-authored, the composition buttons act as PHASE
 * PRESETS and rewrite every slot's phase, so the two models can never disagree.
 * Untouched drafts keep deriving their phases from `choreography` and therefore
 * keep their exact fingerprint.
 */
export function setChoreography(draft: VfxPresetDraft, choreography: VfxChoreography): VfxPresetDraft {
  const phaseAuthored = draft.visualSlots.some(
    (slot) => typeof slot.phase === 'number' && Number.isFinite(slot.phase),
  );
  if (!phaseAuthored) return { ...draft, choreography, updatedAt: Date.now() };
  const phases = choreographyToPhases(choreography, draft.visualSlots.length);
  return {
    ...draft,
    choreography,
    visualSlots: draft.visualSlots.map((slot, index) => ({ ...slot, phase: phases[index] ?? DEFAULT_PHASE })),
    updatedAt: Date.now(),
  };
}

export function setTechnicalPolish(draft: VfxPresetDraft, polish: VfxTechnicalPolish): VfxPresetDraft {
  return { ...draft, technicalPolish: polish, updatedAt: Date.now() };
}

// ============================================================ Transform Resolution

const PIVOT_CENTER_MAP: Readonly<Record<VfxPivotProfile, { x: number; y: number }>> = Object.freeze({
  CENTER: { x: 0.5, y: 0.5 },
  LEFT: { x: 0.0, y: 0.5 },
  RIGHT: { x: 1.0, y: 0.5 },
  TOP: { x: 0.5, y: 1.0 },
  BOTTOM: { x: 0.5, y: 0.0 },
});

const DEG_TO_RAD = Math.PI / 180;

export function resolvePivotCenter(pivot: VfxPivotProfile): { x: number; y: number } {
  return PIVOT_CENTER_MAP[pivot] ?? PIVOT_CENTER_MAP.CENTER;
}

/**
 * Explicit mirror state.
 *
 * `AUTO_HORIZONTAL` never encodes itself as a numeric sign — it produces the
 * neutral signs plus an explicit `autoMirrorHorizontal` flag that the runtime
 * resolves from projected screen-space direction. This is the V2.4 AUTO bug fix.
 *
 * MIRROR only reverses the visual start/end direction. It must NOT invert the
 * vertical orientation (that is what ROTATE 180 does) and it must NOT move the
 * semantic attachment ORIGIN.
 */
export interface ResolvedMirror {
  mirrorX: number;
  mirrorY: number;
  autoMirrorHorizontal: boolean;
}

export function resolveMirrorSigns(mirror: VfxMirrorProfile): ResolvedMirror {
  switch (mirror) {
    case 'HORIZONTAL': return { mirrorX: -1, mirrorY: 1, autoMirrorHorizontal: false };
    case 'VERTICAL': return { mirrorX: 1, mirrorY: -1, autoMirrorHorizontal: false };
    case 'BOTH': return { mirrorX: -1, mirrorY: -1, autoMirrorHorizontal: false };
    case 'AUTO_HORIZONTAL': return { mirrorX: 1, mirrorY: 1, autoMirrorHorizontal: true };
    default: return { mirrorX: 1, mirrorY: 1, autoMirrorHorizontal: false };
  }
}

/**
 * ROTATION is an artistic correction of the SOURCE's native orientation, e.g.
 * a vertically authored flamethrower needs ±90 to read horizontally in the
 * canonical CASTER-LEFT → TARGET-RIGHT reference setup.
 *
 * For TO_TARGET / ALONG_PATH the authored value is an OFFSET added to the
 * runtime-computed screen angle. Only the offset is compiled here.
 */
export function resolveRotationRadians(_direction: VfxAimProfile, rotationDegrees: number): number {
  const degrees = rotationDegrees ?? DEFAULT_ROTATION_DEGREES;
  return degrees * DEG_TO_RAD;
}

/** Effective POSITION mode of a slot. Absent means FIXED. */
export function resolveSlotPositionMode(slot: VfxVisualSlot): VfxPositionMode {
  return slot.positionMode ?? DEFAULT_POSITION_MODE;
}

/**
 * Effective DIRECTION of a slot. TRAVEL slots default to ALONG_PATH so a
 * projectile never requires the author to pick TO TARGET manually.
 */
export function resolveSlotDirectionProfile(slot: VfxVisualSlot): VfxAimProfile {
  if (slot.aimProfile) return slot.aimProfile;
  return resolveSlotPositionMode(slot) === 'TRAVEL'
    ? DEFAULT_TRAVEL_DIRECTION_PROFILE
    : DEFAULT_AIM_PROFILE;
}

/** Effective MIRROR of a slot. TRAVEL slots default to AUTO. */
export function resolveSlotMirrorProfile(slot: VfxVisualSlot): VfxMirrorProfile {
  if (slot.mirrorProfile) return slot.mirrorProfile;
  return resolveSlotPositionMode(slot) === 'TRAVEL'
    ? DEFAULT_TRAVEL_MIRROR_PROFILE
    : DEFAULT_MIRROR_PROFILE;
}

// ============================================================ Compilation

/**
 * Fully resolved runtime plan for one spritesheet.
 *
 * Downstream playback never needs to understand FIXED / TRAVEL / PHASE / LIGHT
 * buttons — those are Composer semantics. Semantic ANCHORS are intentionally
 * kept here (not baked into world coordinates) so that the actual world
 * positions are resolved from the live gameplay context at playback time.
 */
export interface CompiledVfxSlot {
  slotId: string;
  candidateId: string;
  startTime: number;
  duration: number;
  scale: number;
  opacity: number;
  fadeIn: number;
  fadeOut: number;
  offsetX: number;
  offsetY: number;
  /** Resolved FIXED anchor. Also used as a safe fallback for TRAVEL slots. */
  anchor: VfxAnchor;
  layer: 'ground' | 'impact';
  blending: 'normal' | 'additive';
  orientation: VfxOrientation;
  /** FIXED or TRAVEL. */
  positionMode: VfxPositionMode;
  /** Resolved travel origin anchor. Present only for TRAVEL slots. */
  travelFromAnchor?: VfxAnchor;
  /** Resolved travel destination anchor. Present only for TRAVEL slots. */
  travelToAnchor?: VfxAnchor;
  /** Resolved V2.6 trajectory profile. Present only for TRAVEL slots. */
  trajectoryProfile?: VfxTrajectoryProfile;
  /** Resolved DIRECTION mode (stored as aimProfile in the draft). */
  aimProfile: VfxAimProfile;
  /** Resolved authored ROTATION offset in radians. */
  rotation: number;
  /** Explicit horizontal mirror sign (-1 or 1). */
  mirrorX: number;
  /** Explicit vertical mirror sign (-1 or 1). */
  mirrorY: number;
  /** Explicit AUTO horizontal mirror state, never encoded via mirrorX. */
  autoMirrorHorizontal: boolean;
  /** Resolved ORIGIN X (0..1). */
  pivotCenterX: number;
  /** Resolved ORIGIN Y (0..1). */
  pivotCenterY: number;
  /** Execution phase this slot belongs to. */
  phase: number;
  /** Absolute impact moment owned by this slot. */
  impactTime: number;
  /** Technical events owned by this slot. Empty for visuals-only playback. */
  technical: ResolvedTechnicalEffect[];
  /** Resolved final displayed sprite height, for UI/QA reporting. */
  finalDisplayHeight: number;
}

export interface CompiledVfxDraft {
  actionKey: string;
  presetId: string;
  choreography: VfxChoreography;
  totalDuration: number;
  impactTime: number;
  slots: CompiledVfxSlot[];
  /** Flattened per-slot technical events. Empty for visual-only playback. */
  technical: ResolvedTechnicalEffect[];
  /** True when the events came from per-slot Impact FX rather than legacy polish. */
  usesSlotImpactFx: boolean;
  compatibility: ChoreographyCompatibility;
}

export interface CompileDraftOptions {
  /** false → PLAY VISUALS ONLY (no screenFlash / screenShake / hitStop). */
  includeTechnical: boolean;
  /** Native cadence lookup for the candidate. Drives timing profiles. */
  getCadence: (candidateId: string) => VfxNativeCadence | null;
  /** Runtime multipliers so semantic sizes resolve to predictable final size. */
  scaleFactors?: VfxRuntimeScaleFactors;
}

/**
 * Compiles a semantic draft into a numeric playback plan.
 *
 * This is the single place where semantics become numbers. Nothing downstream
 * needs to know about LOW/MID/BIG or QUICK/NORMAL/LONG.
 */
export function compileDraft(draft: VfxPresetDraft, options: CompileDraftOptions): CompiledVfxDraft {
  const compatibility = choreographyCompatibility(draft.choreography, draft.visualSlots.length);
  const factors = options.scaleFactors ?? {};

  const durations = draft.visualSlots.map((slot) =>
    slot.advanced?.duration ?? resolveSlotDuration(slot.timingProfile, options.getCadence(slot.candidateId)));

  // PHASE is the generalized execution model. Legacy choreography is migrated
  // into phases, so no special TOGETHER / SEQUENCE / PAIR_THEN_LAST runtime
  // algorithm is needed any more.
  const phases = resolveSlotPhases(draft);
  const startTimes = resolvePhaseStartTimes(phases, durations);

  // Per-slot Impact FX is authoritative as soon as the author enables anything.
  const slotFxAuthored = usesSlotImpactFx(draft);

  const slots: CompiledVfxSlot[] = draft.visualSlots.map((slot, index) => {
    const placement = resolvePlacement(slot.placementProfile, draft.autoPlacement);
    const visibility = resolveSlotVisibility(slot.timingProfile);
    const semanticScale = resolveSlotScale(slot.sizeProfile, factors);
    const scale = slot.advanced?.scale ?? semanticScale;
    const duration = durations[index] ?? TIMING_FALLBACK_NATIVE_DURATION;
    const startTime = slot.advanced?.startTime ?? startTimes[index] ?? 0;
    const positionMode = resolveSlotPositionMode(slot);
    const direction = resolveSlotDirectionProfile(slot);
    const rotationDegrees = slot.rotationDegrees ?? DEFAULT_ROTATION_DEGREES;
    const mirror = resolveSlotMirrorProfile(slot);
    const pivot = slot.pivotProfile ?? DEFAULT_PIVOT_PROFILE;
    const { mirrorX, mirrorY, autoMirrorHorizontal } = resolveMirrorSigns(mirror);
    const pivotCenter = resolvePivotCenter(pivot);
    const rotation = resolveRotationRadians(direction, rotationDegrees);
    const travelling = positionMode === 'TRAVEL';
    const travelFrom = slot.travelFrom ?? DEFAULT_TRAVEL_FROM;
    const travelTo = slot.travelTo ?? DEFAULT_TRAVEL_TO;
    const trajectoryProfile = slot.trajectoryProfile ?? DEFAULT_TRAJECTORY_PROFILE;
    // Slot-local impact point. Automatically follows PHASE, SPEED, and POSITION changes.
    const impactTime = Math.round((startTime + resolveSlotLocalImpactTime(duration, positionMode)) * 1000) / 1000;
    const technical = options.includeTechnical && slotFxAuthored
      ? resolveSlotImpactEvents(slot.impactFx, impactTime)
      : [];
    return {
      slotId: slot.id,
      candidateId: slot.candidateId,
      startTime,
      duration,
      scale,
      opacity: visibility.opacity,
      fadeIn: visibility.fadeIn,
      fadeOut: visibility.fadeOut,
      offsetX: slot.advanced?.offsetX ?? 0,
      offsetY: slot.advanced?.offsetY ?? 0,
      anchor: slot.advanced?.anchor ?? placement.anchor,
      layer: 'impact',
      blending: slot.advanced?.blending ?? DEFAULT_BLENDING,
      orientation: slot.advanced?.orientation ?? placement.orientation,
      positionMode,
      ...(travelling ? { travelFromAnchor: resolveTravelAnchor(travelFrom) } : {}),
      ...(travelling ? { travelToAnchor: resolveTravelAnchor(travelTo) } : {}),
      ...(travelling && trajectoryProfile !== DEFAULT_TRAJECTORY_PROFILE ? { trajectoryProfile } : {}),
      aimProfile: direction,
      rotation,
      mirrorX,
      mirrorY,
      autoMirrorHorizontal,
      pivotCenterX: pivotCenter.x,
      pivotCenterY: pivotCenter.y,
      phase: phases[index] ?? DEFAULT_PHASE,
      impactTime,
      technical,
      finalDisplayHeight: computeFinalDisplayHeight(scale, factors),
    };
  });

  const totalDuration = slots.reduce((max, slot) => Math.max(max, slot.startTime + slot.duration), 0);
  /**
   * PRESET GAMEPLAY IMPACT TIME — V2.5.1 doctrine.
   *
   * A. If one or more slots have ACTIVE per-slot Impact FX:
   *    → earliest absolute impactTime among active-FX slots.
   *    This lets the artist identify the real visual impact by placing
   *    FLASH/SHAKE/HITSTOP on the responsible slot.
   *
   * B. If no slot has active Impact FX:
   *    → first slot's impactTime (legacy compatibility), which now follows
   *    the FIXED/TRAVEL rule automatically.
   */
  const first = slots[0];
  const activeFxSlots = slots.filter((s) => s.technical.length > 0);
  const impactTime = activeFxSlots.length > 0
    ? activeFxSlots.reduce((min, s) => Math.min(min, s.impactTime), Infinity)
    : (first ? first.impactTime : 0);

  /**
   * OLD TECHNICAL POLISH COMPATIBILITY — Strategy A.
   *
   * A draft that has NOT been authored with per-slot Impact FX keeps using its
   * legacy global `technicalPolish` at the preset impact time, so existing
   * published artistic behaviour is reproduced exactly. As soon as ANY slot
   * enables Impact FX, the per-slot model takes over completely and the legacy
   * global polish is ignored — real per-slot authoring is never overwritten and
   * old polish is never scattered across every slot.
   */
  const technical = options.includeTechnical
    ? (slotFxAuthored
      ? slots.flatMap((slot) => slot.technical)
      : resolveTechnicalEffects(draft.technicalPolish, impactTime, draft.tier))
    : [];

  return {
    actionKey: draft.actionKey,
    presetId: draft.presetId,
    choreography: draft.choreography,
    totalDuration: Math.round(totalDuration * 1000) / 1000,
    impactTime,
    slots,
    technical,
    usesSlotImpactFx: slotFxAuthored,
    compatibility,
  };
}

// ============================================================ Serialization

export function serializeDraft(draft: VfxPresetDraft): string {
  return JSON.stringify(draft);
}

export function validateDraft(raw: unknown): raw is VfxPresetDraft {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.actionKey !== 'string' || obj.actionKey.length === 0) return false;
  if (typeof obj.presetId !== 'string') return false;
  if (!Array.isArray(obj.visualSlots)) return false;
  if (!VFX_CHOREOGRAPHIES.includes(obj.choreography as VfxChoreography)) return false;
  if (!VFX_TECHNICAL_POLISH_LEVELS.includes(obj.technicalPolish as VfxTechnicalPolish)) return false;
  const VALID_AIM = new Set(VFX_AIM_PROFILES);
  const VALID_MIRROR = new Set(VFX_MIRROR_PROFILES);
  const VALID_PIVOT = new Set(VFX_PIVOT_PROFILES);
  const VALID_POSITION_MODES = new Set(VFX_POSITION_MODES);
  const VALID_TRAVEL_FROM = new Set(VFX_TRAVEL_FROM_ENDPOINTS);
  const VALID_TRAVEL_TO = new Set(VFX_TRAVEL_TO_ENDPOINTS);
  const VALID_POWERS = new Set(VFX_IMPACT_POWERS);
  for (const slot of obj.visualSlots) {
    if (typeof slot !== 'object' || slot === null) return false;
    const s = slot as Record<string, unknown>;
    if (typeof s.id !== 'string' || typeof s.candidateId !== 'string') return false;
    if (!VFX_SIZE_PROFILES.includes(s.sizeProfile as VfxSizeProfile)) return false;
    if (!VFX_TIMING_PROFILES.includes(s.timingProfile as VfxTimingProfile)) return false;
    if (!VFX_PLACEMENT_PROFILES.includes(s.placementProfile as VfxPlacementProfile)) return false;
    if (s.positionMode != null && !VALID_POSITION_MODES.has(s.positionMode as VfxPositionMode)) return false;
    if (s.travelFrom != null && !VALID_TRAVEL_FROM.has(s.travelFrom as VfxTravelEndpoint)) return false;
    if (s.travelTo != null && !VALID_TRAVEL_TO.has(s.travelTo as VfxTravelEndpoint)) return false;
    if (s.trajectoryProfile != null && !VFX_TRAJECTORY_PROFILES.includes(s.trajectoryProfile as VfxTrajectoryProfile)) return false;
    if (s.aimProfile != null && !VALID_AIM.has(s.aimProfile as VfxAimProfile)) return false;
    if (s.rotationDegrees != null && typeof s.rotationDegrees !== 'number') return false;
    if (s.mirrorProfile != null && !VALID_MIRROR.has(s.mirrorProfile as VfxMirrorProfile)) return false;
    if (s.pivotProfile != null && !VALID_PIVOT.has(s.pivotProfile as VfxPivotProfile)) return false;
    if (s.phase != null && (typeof s.phase !== 'number' || !Number.isInteger(s.phase) || s.phase < 0 || s.phase > MAX_PHASE)) return false;
    if (s.impactFx != null) {
      if (typeof s.impactFx !== 'object') return false;
      const fx = s.impactFx as Record<string, unknown>;
      for (const key of ['flash', 'shake', 'hitStop'] as const) {
        if (fx[key] != null && typeof fx[key] !== 'boolean') return false;
      }
      if (fx.power != null && !VALID_POWERS.has(fx.power as VfxImpactPower)) return false;
    }
  }
  return true;
}

export function deserializeDraft(raw: string): VfxPresetDraft | null {
  try {
    const parsed = JSON.parse(raw);
    return validateDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createDraftBundle(drafts: Record<string, VfxPresetDraft>): VfxComposerDraftBundle {
  return {
    schemaVersion: COMPOSER_DRAFT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    drafts,
  };
}

export function serializeDraftBundle(drafts: Record<string, VfxPresetDraft>): string {
  return JSON.stringify(createDraftBundle(drafts), null, 2);
}

export interface DraftBundleRestoreResult {
  ok: boolean;
  drafts?: Record<string, VfxPresetDraft>;
  error?: string;
  skipped?: string[];
}

/**
 * Portable restore. Accepts either a bundle (`{ schemaVersion, drafts }`) or a
 * bare `Record<actionKey, VfxPresetDraft>` map. Invalid individual drafts are
 * skipped rather than failing the whole import.
 */
export function restoreDraftBundle(raw: string): DraftBundleRestoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `Draft bundle parse error: ${(e as Error).message}` };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Draft bundle is not a JSON object.' };
  }
  const container = (parsed as { drafts?: unknown }).drafts ?? parsed;
  if (typeof container !== 'object' || container === null) {
    return { ok: false, error: 'Draft bundle contains no drafts map.' };
  }
  const drafts: Record<string, VfxPresetDraft> = {};
  const skipped: string[] = [];
  for (const [actionKey, value] of Object.entries(container as Record<string, unknown>)) {
    if (validateDraft(value)) drafts[actionKey] = value;
    else skipped.push(actionKey);
  }
  if (Object.keys(drafts).length === 0) {
    return { ok: false, error: 'No valid drafts found in bundle.', skipped };
  }
  return { ok: true, drafts, skipped };
}

// ============================================================ Migration

export interface MigrationSourceStep {
  /** Existing candidate for this visual step, if any. */
  candidateId?: string;
  spriteSheetId?: string;
  anchor?: VfxAnchor;
  layer?: 'ground' | 'impact';
}

export interface MigrationSource {
  actionKey: string;
  presetId?: string;
  tier?: number;
  visualSteps: readonly MigrationSourceStep[];
}

/** Derives the AUTO placement hint from the action's already-authored anchors. */
export function deriveAutoPlacement(
  source: MigrationSource,
): Exclude<VfxPlacementProfile, 'AUTO'> {
  const first = source.visualSteps[0];
  if (first?.layer === 'ground') return 'GROUND';
  switch (first?.anchor) {
    case 'source':
    case 'sourceGround':
      return 'CASTER';
    case 'sourceFront':
      return 'CASTER_FRONT';
    case 'sourceBack':
      return 'CASTER_BACK';
    case 'target':
    case 'midpoint':
    case 'allTargets':
      return 'TARGET';
    case 'targetFront':
      return 'FRONT';
    case 'targetBack':
      return 'BACK';
    case 'targetTop':
      return 'TOP';
    case 'targetBottom':
      return 'BOTTOM';
    case 'targetGround':
    case 'groundTarget':
      return 'GROUND';
    default:
      return 'TARGET';
  }
}

export function createDraftFromAction(source: MigrationSource): VfxPresetDraft {
  const autoPlacement = deriveAutoPlacement(source);
  const visualSlots = source.visualSteps
    .map((step) => step.candidateId ?? step.spriteSheetId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((candidateId) => createVisualSlot(repairCandidateAssignment(source.actionKey, candidateId), {
      sizeProfile: 'MID',
      timingProfile: 'NORMAL',
      placementProfile: 'AUTO',
    }));

  return {
    actionKey: source.actionKey,
    presetId: source.presetId ?? `composer_${source.actionKey}`,
    visualSlots,
    choreography: visualSlots.length >= 3 ? 'SEQUENCE' : 'TOGETHER',
    technicalPolish: 'OFF',
    autoPlacement,
    ...(source.tier !== undefined ? { tier: source.tier } : {}),
    updatedAt: Date.now(),
  };
}
