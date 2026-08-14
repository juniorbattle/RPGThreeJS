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

export type VfxPlacementProfile = 'AUTO' | 'TARGET' | 'CASTER' | 'GROUND';

export type VfxChoreography = 'TOGETHER' | 'SEQUENCE' | 'PAIR_THEN_LAST';

export type VfxTechnicalPolish = 'AUTO' | 'OFF' | 'LIGHT' | 'STRONG';

export const VFX_SIZE_PROFILES: readonly VfxSizeProfile[] = ['LOW', 'MID', 'BIG', 'GIGA'];
export const VFX_TIMING_PROFILES: readonly VfxTimingProfile[] = ['QUICK', 'NORMAL', 'LONG'];
export const VFX_PLACEMENT_PROFILES: readonly VfxPlacementProfile[] = ['AUTO', 'TARGET', 'CASTER', 'GROUND'];
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

export interface VfxVisualSlot {
  id: string;
  candidateId: string;
  sizeProfile: VfxSizeProfile;
  timingProfile: VfxTimingProfile;
  placementProfile: VfxPlacementProfile;
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
 * Timing multipliers applied to the candidate's NATIVE cadence.
 *
 *   nativeDuration = frameCount × frameDurationMs / 1000
 *
 * NORMAL = 1.30× is grounded in the P0.1B human readability calibration:
 * a 1.28s native sequence was accepted at 1.60s / 1.70s (1.25×–1.33×).
 * The authored frame sequence is always preserved — only cadence is stretched.
 */
export const TIMING_PROFILE_NATIVE_MULTIPLIER: Readonly<Record<VfxTimingProfile, number>> = Object.freeze({
  QUICK: 1.00,
  NORMAL: 1.30,
  LONG: 1.75,
});

/** Fallback when a candidate has no inventory cadence record. */
export const TIMING_FALLBACK_NATIVE_DURATION = 1.28;

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
  return clamp(
    Math.round(native * multiplier * 1000) / 1000,
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
  CASTER: Object.freeze({ anchor: 'source' as VfxAnchor, layer: 'impact' as const, orientation: 'none' as VfxOrientation }),
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
  return PLACEMENT_TABLE[effective];
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
  patch: Partial<Pick<VfxVisualSlot, 'sizeProfile' | 'timingProfile' | 'placementProfile'>>,
): VfxPresetDraft {
  return {
    ...draft,
    visualSlots: draft.visualSlots.map((slot) =>
      slot.id === slotId ? { ...slot, ...patch } : slot),
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

export function setChoreography(draft: VfxPresetDraft, choreography: VfxChoreography): VfxPresetDraft {
  return { ...draft, choreography, updatedAt: Date.now() };
}

export function setTechnicalPolish(draft: VfxPresetDraft, polish: VfxTechnicalPolish): VfxPresetDraft {
  return { ...draft, technicalPolish: polish, updatedAt: Date.now() };
}

// ============================================================ Compilation

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
  anchor: VfxAnchor;
  layer: 'ground' | 'impact';
  blending: 'normal' | 'additive';
  orientation: VfxOrientation;
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
  /** Empty when compiled for visual-only playback. */
  technical: ResolvedTechnicalEffect[];
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

  const startTimes = resolveChoreographyStartTimes(draft.choreography, durations);

  const slots: CompiledVfxSlot[] = draft.visualSlots.map((slot, index) => {
    const placement = resolvePlacement(slot.placementProfile, draft.autoPlacement);
    const visibility = resolveSlotVisibility(slot.timingProfile);
    const semanticScale = resolveSlotScale(slot.sizeProfile, factors);
    const scale = slot.advanced?.scale ?? semanticScale;
    const duration = durations[index] ?? TIMING_FALLBACK_NATIVE_DURATION;
    const startTime = slot.advanced?.startTime ?? startTimes[index] ?? 0;
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
      finalDisplayHeight: computeFinalDisplayHeight(scale, factors),
    };
  });

  const totalDuration = slots.reduce((max, slot) => Math.max(max, slot.startTime + slot.duration), 0);
  // Impact reads at the peak of the first slot that is visible on screen.
  const first = slots[0];
  const impactTime = first ? Math.round((first.startTime + first.duration * 0.45) * 1000) / 1000 : 0;

  return {
    actionKey: draft.actionKey,
    presetId: draft.presetId,
    choreography: draft.choreography,
    totalDuration: Math.round(totalDuration * 1000) / 1000,
    impactTime,
    slots,
    technical: options.includeTechnical
      ? resolveTechnicalEffects(draft.technicalPolish, impactTime, draft.tier)
      : [],
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
  for (const slot of obj.visualSlots) {
    if (typeof slot !== 'object' || slot === null) return false;
    const s = slot as Record<string, unknown>;
    if (typeof s.id !== 'string' || typeof s.candidateId !== 'string') return false;
    if (!VFX_SIZE_PROFILES.includes(s.sizeProfile as VfxSizeProfile)) return false;
    if (!VFX_TIMING_PROFILES.includes(s.timingProfile as VfxTimingProfile)) return false;
    if (!VFX_PLACEMENT_PROFILES.includes(s.placementProfile as VfxPlacementProfile)) return false;
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
    case 'groundTarget':
    case 'targetGround':
      return 'GROUND';
    case 'target':
    case 'midpoint':
    case 'allTargets':
      return 'TARGET';
    default:
      return 'TARGET';
  }
}

/**
 * Creates a Composer draft from an existing action/preset.
 *
 * Existing candidateIds seed the initial draft content. They are NOT locked —
 * the author is free to remove or replace any slot.
 */
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
    technicalPolish: 'AUTO',
    autoPlacement,
    ...(source.tier !== undefined ? { tier: source.tier } : {}),
    updatedAt: Date.now(),
  };
}
