/**
 * R2C-VFX Composer — CASTER MOTION TIMELINE (Phase B).
 *
 * A deliberately small, deterministic authoring layer that lets a preset insert
 * CASTER movements between its VFX steps:
 *
 *     VFX → CASTER MOTION → VFX → CASTER MOTION → VFX
 *
 * DESIGN BOUNDARIES (intentional, do not widen without a new mission):
 *   - This is NOT a skeletal/bone animation system.
 *   - This is NOT a general tween engine and adds no dependency.
 *   - It only ever produces a positional OFFSET for the CASTER.
 *   - It never touches the camera, the target, the terrain or the scene.
 *
 * The module is pure and framework-free: it knows nothing about Three.js and
 * resolves nothing to world coordinates. Like every other Composer primitive
 * since V2.4 it stores SEMANTIC ANCHORS and lets the runtime resolve them from
 * the live combat context at playback time.
 */

import type { VfxAnchor } from './VfxTypes';

// ============================================================ Motion Types

/**
 * V1 motion vocabulary. Strictly limited — additional types must not be added
 * without an explicit follow-up mission.
 */
export type CasterMotionType =
  | 'IDLE'
  | 'DASH_SHORT'
  | 'DASH_THROUGH'
  | 'JUMP_UP'
  | 'JUMP_DOWN'
  | 'JUMP_ARC';

export const CASTER_MOTION_TYPES: readonly CasterMotionType[] = [
  'IDLE', 'DASH_SHORT', 'DASH_THROUGH', 'JUMP_UP', 'JUMP_DOWN', 'JUMP_ARC',
];

/**
 * Semantic movement destination. Deliberately mirrors the existing V2.5/V2.6
 * position vocabulary rather than inventing a parallel nomenclature.
 */
export type CasterMotionDestination = 'ORIGIN' | 'TARGET' | 'TARGET_FRONT' | 'TARGET_BACK';

export const CASTER_MOTION_DESTINATIONS: readonly CasterMotionDestination[] = [
  'ORIGIN', 'TARGET', 'TARGET_FRONT', 'TARGET_BACK',
];

export type CasterMotionEasing = 'LINEAR' | 'EASE_IN' | 'EASE_OUT' | 'EASE_IN_OUT';

export const CASTER_MOTION_EASINGS: readonly CasterMotionEasing[] = [
  'LINEAR', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT',
];

/** Destination → existing semantic anchor. No new nomenclature is introduced. */
const DESTINATION_ANCHORS: Readonly<Record<CasterMotionDestination, VfxAnchor>> = Object.freeze({
  ORIGIN: 'source',
  TARGET: 'target',
  TARGET_FRONT: 'targetFront',
  TARGET_BACK: 'targetBack',
});

export function resolveMotionAnchor(destination: CasterMotionDestination): VfxAnchor {
  return DESTINATION_ANCHORS[destination];
}

// ============================================================ Authoring Model

/**
 * One authored caster movement.
 *
 * Every numeric field is optional and falls back to a per-type default, so the
 * author only has to state what they actually want to change.
 */
export interface CasterMotionStep {
  id: string;
  type: CasterMotionType;
  /** Seconds of travel. Defaults per type. */
  duration?: number;
  /** Semantic destination. Defaults per type. */
  destination?: CasterMotionDestination;
  /**
   * Fraction (0..1) of the caster→destination vector actually travelled.
   * 1 means "all the way to the destination anchor".
   */
  distance?: number;
  /** Vertical amplitude in world units. Only used by the JUMP_* types. */
  height?: number;
  easing?: CasterMotionEasing;
  /**
   * true  — the caster animates back to its original position after the motion.
   * false — the caster remains at the motion's final position.
   */
  returnToOrigin?: boolean;
}

/** Fully resolved defaults for one motion type. */
export interface CasterMotionDefaults {
  duration: number;
  destination: CasterMotionDestination;
  distance: number;
  height: number;
  easing: CasterMotionEasing;
  returnToOrigin: boolean;
}

/**
 * Per-type defaults chosen so that picking a type alone already produces the
 * intended archetypal movement:
 *
 *   DASH_SHORT   — warrior: step in, hit, come back.
 *   DASH_THROUGH — rogue/ninja: cross the target and stay behind it.
 *   JUMP_ARC     — lancer: leap, land on the target, come back.
 */
export const CASTER_MOTION_DEFAULTS: Readonly<Record<CasterMotionType, Readonly<CasterMotionDefaults>>> = Object.freeze({
  IDLE: Object.freeze({
    duration: 0.10, destination: 'ORIGIN' as const, distance: 0, height: 0,
    easing: 'LINEAR' as const, returnToOrigin: false,
  }),
  DASH_SHORT: Object.freeze({
    duration: 0.18, destination: 'TARGET' as const, distance: 0.35, height: 0,
    easing: 'EASE_OUT' as const, returnToOrigin: true,
  }),
  DASH_THROUGH: Object.freeze({
    duration: 0.30, destination: 'TARGET_BACK' as const, distance: 1, height: 0,
    easing: 'EASE_OUT' as const, returnToOrigin: false,
  }),
  JUMP_UP: Object.freeze({
    duration: 0.25, destination: 'ORIGIN' as const, distance: 0, height: 0.9,
    easing: 'EASE_OUT' as const, returnToOrigin: false,
  }),
  JUMP_DOWN: Object.freeze({
    duration: 0.22, destination: 'TARGET' as const, distance: 0.35, height: 0.9,
    easing: 'EASE_IN' as const, returnToOrigin: true,
  }),
  JUMP_ARC: Object.freeze({
    duration: 0.40, destination: 'TARGET_FRONT' as const, distance: 0.8, height: 1.1,
    easing: 'EASE_IN_OUT' as const, returnToOrigin: true,
  }),
});

export const MAX_MOTION_DURATION = 5;
export const MIN_MOTION_DURATION = 0.01;

let _motionCounter = 0;

export function createMotionId(): string {
  _motionCounter += 1;
  return `motion_${Date.now().toString(36)}_${_motionCounter.toString(36)}`;
}

/**
 * Creates an authored motion step. Only the fields the author actually
 * overrides are stored, so a default-valued step stays minimal on disk.
 */
export function createCasterMotionStep(
  type: CasterMotionType,
  overrides: Partial<Omit<CasterMotionStep, 'id' | 'type'>> = {},
): CasterMotionStep {
  return {
    id: createMotionId(),
    type,
    ...(overrides.duration != null ? { duration: overrides.duration } : {}),
    ...(overrides.destination ? { destination: overrides.destination } : {}),
    ...(overrides.distance != null ? { distance: overrides.distance } : {}),
    ...(overrides.height != null ? { height: overrides.height } : {}),
    ...(overrides.easing ? { easing: overrides.easing } : {}),
    ...(overrides.returnToOrigin != null ? { returnToOrigin: overrides.returnToOrigin } : {}),
  };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;

/** Resolves one authored step against its type defaults. Never throws. */
export function resolveCasterMotionStep(step: CasterMotionStep): CasterMotionDefaults & {
  id: string;
  type: CasterMotionType;
} {
  const defaults = CASTER_MOTION_DEFAULTS[step.type] ?? CASTER_MOTION_DEFAULTS.IDLE;
  const numeric = (value: number | undefined, fallback: number) =>
    (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  return {
    id: step.id,
    type: step.type,
    duration: clamp(numeric(step.duration, defaults.duration), MIN_MOTION_DURATION, MAX_MOTION_DURATION),
    destination: step.destination ?? defaults.destination,
    distance: clamp(numeric(step.distance, defaults.distance), 0, 1),
    height: clamp(numeric(step.height, defaults.height), 0, 6),
    easing: step.easing ?? defaults.easing,
    returnToOrigin: step.returnToOrigin ?? defaults.returnToOrigin,
  };
}

// ============================================================ Validation

export interface CasterMotionValidationResult {
  ok: boolean;
  errors: string[];
}

const MOTION_TYPE_SET = new Set<string>(CASTER_MOTION_TYPES);
const DESTINATION_SET = new Set<string>(CASTER_MOTION_DESTINATIONS);
const EASING_SET = new Set<string>(CASTER_MOTION_EASINGS);

/** Structural validation of a single authored step. */
export function validateCasterMotionStep(raw: unknown): CasterMotionValidationResult {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['motion step must be an object'] };
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== 'string' || s.id.length === 0) errors.push('motion step requires a non-empty id');
  if (typeof s.type !== 'string' || !MOTION_TYPE_SET.has(s.type)) errors.push(`invalid motion type: ${String(s.type)}`);
  if (s.destination !== undefined && !DESTINATION_SET.has(String(s.destination))) {
    errors.push(`invalid motion destination: ${String(s.destination)}`);
  }
  if (s.easing !== undefined && !EASING_SET.has(String(s.easing))) {
    errors.push(`invalid motion easing: ${String(s.easing)}`);
  }
  for (const field of ['duration', 'distance', 'height'] as const) {
    const value = s[field];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`motion ${field} must be a finite number`);
    } else if (value < 0) {
      errors.push(`motion ${field} must not be negative`);
    }
  }
  if (s.returnToOrigin !== undefined && typeof s.returnToOrigin !== 'boolean') {
    errors.push('motion returnToOrigin must be a boolean');
  }
  return { ok: errors.length === 0, errors };
}

/** Validates a whole authored motion list, including duplicate-id detection. */
export function validateCasterMotion(raw: unknown): CasterMotionValidationResult {
  if (raw === undefined || raw === null) return { ok: true, errors: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ['casterMotion must be an array'] };
  const errors: string[] = [];
  const seen = new Set<string>();
  raw.forEach((step, index) => {
    const result = validateCasterMotionStep(step);
    for (const error of result.errors) errors.push(`motion[${index}]: ${error}`);
    const id = (step as { id?: unknown } | null)?.id;
    if (typeof id === 'string') {
      if (seen.has(id)) errors.push(`motion[${index}]: duplicate motion id ${id}`);
      seen.add(id);
    }
  });
  return { ok: errors.length === 0, errors };
}

// ============================================================ Compilation

/** One compiled motion. Semantic anchors only — never world coordinates. */
export interface CompiledCasterMotionStep {
  motionId: string;
  type: CasterMotionType;
  startTime: number;
  duration: number;
  /** Absolute end of the outbound travel. */
  motionEndTime: number;
  /**
   * Absolute end of the whole step, including the return leg when
   * `returnToOrigin` is set. The return leg mirrors the outbound duration.
   */
  endTime: number;
  destination: CasterMotionDestination;
  /** Resolved semantic anchor, resolved to a position only by the runtime. */
  destinationAnchor: VfxAnchor;
  distance: number;
  height: number;
  easing: CasterMotionEasing;
  returnToOrigin: boolean;
  /** True when this step can never produce any displacement. */
  isNoop: boolean;
}

export interface CompiledCasterMotion {
  steps: CompiledCasterMotionStep[];
  /** Latest absolute time at which the caster is still moving. */
  totalDuration: number;
  /** True when at least one step can actually displace the caster. */
  hasEffect: boolean;
}

export const EMPTY_COMPILED_CASTER_MOTION: CompiledCasterMotion = Object.freeze({
  steps: Object.freeze([]) as unknown as CompiledCasterMotionStep[],
  totalDuration: 0,
  hasEffect: false,
});

function isNoopMotion(resolved: CasterMotionDefaults & { type: CasterMotionType }): boolean {
  if (resolved.type === 'IDLE') return true;
  const vertical = resolved.type === 'JUMP_UP' || resolved.type === 'JUMP_DOWN' || resolved.type === 'JUMP_ARC';
  const horizontalMoves = resolved.distance > 0 && resolved.destination !== 'ORIGIN';
  const verticalMoves = vertical && resolved.height > 0;
  return !horizontalMoves && !verticalMoves;
}

/**
 * Compiles authored motions into a deterministic, time-ordered plan.
 *
 * `startTimeOverrides` is an optional map from motion id to absolute start time.
 * When provided (by the beat scheduler), each motion compiles with its assigned
 * start time. When absent, all motions start at t=0 and order by authored index.
 *
 * Legacy `startTime` fields on raw steps are silently ignored — beat assignment
 * is the sole authority for motion timing.
 */
export function compileCasterMotion(
  steps: readonly CasterMotionStep[] | undefined,
  startTimeOverrides?: ReadonlyMap<string, number>,
): CompiledCasterMotion {
  if (!steps || steps.length === 0) return EMPTY_COMPILED_CASTER_MOTION;

  const resolved = steps.map((step, index) => ({
    resolved: resolveCasterMotionStep(step),
    startTime: startTimeOverrides?.get(step.id) ?? 0,
    index,
  }));
  resolved.sort((a, b) =>
    a.startTime !== b.startTime
      ? a.startTime - b.startTime
      : a.index - b.index);

  const compiled: CompiledCasterMotionStep[] = resolved.map(({ resolved: r, startTime }) => {
    const motionEndTime = round3(startTime + r.duration);
    const endTime = round3(r.returnToOrigin ? motionEndTime + r.duration : motionEndTime);
    return {
      motionId: r.id,
      type: r.type,
      startTime: round3(startTime),
      duration: round3(r.duration),
      motionEndTime,
      endTime,
      destination: r.destination,
      destinationAnchor: resolveMotionAnchor(r.destination),
      distance: r.distance,
      height: r.height,
      easing: r.easing,
      returnToOrigin: r.returnToOrigin,
      isNoop: isNoopMotion(r),
    };
  });

  return {
    steps: compiled,
    totalDuration: compiled.reduce((max, s) => Math.max(max, s.endTime), 0),
    hasEffect: compiled.some((s) => !s.isNoop),
  };
}

// ============================================================ Easing

function ease(easing: CasterMotionEasing, p: number): number {
  const t = clamp(p, 0, 1);
  switch (easing) {
    case 'EASE_IN': return t * t * t;
    case 'EASE_OUT': return 1 - Math.pow(1 - t, 3);
    case 'EASE_IN_OUT': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'LINEAR':
    default: return t;
  }
}

/** Exposed for tests and UI previewing. */
export function easeCasterMotion(easing: CasterMotionEasing, p: number): number {
  return ease(easing, p);
}

// ============================================================ Sampling

export interface MutableVec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Runtime bridge. The runtime writes into `out` the vector going FROM the
 * caster's own base position TO the requested semantic anchor.
 *
 * Keeping this a callback is what lets the motion layer stay free of Three.js
 * and of any knowledge about the Stage layout.
 */
export type CasterMotionAnchorResolver = (anchor: VfxAnchor, out: MutableVec3) => void;

/** Module scratch. Sampling is synchronous, so reuse is safe and allocation-free. */
const _scratchDelta: MutableVec3 = { x: 0, y: 0, z: 0 };

function horizontalFactor(step: CompiledCasterMotionStep, p: number): number {
  if (step.type === 'IDLE' || step.type === 'JUMP_UP') return 0;
  return step.distance * ease(step.easing, p);
}

function verticalOffset(step: CompiledCasterMotionStep, p: number): number {
  const t = clamp(p, 0, 1);
  switch (step.type) {
    case 'JUMP_UP': return step.height * ease(step.easing, t);
    case 'JUMP_DOWN': return step.height * (1 - ease(step.easing, t));
    // Symmetric parabola: raw progress keeps the apex exactly at mid-flight.
    case 'JUMP_ARC': return 4 * step.height * t * (1 - t);
    default: return 0;
  }
}

/**
 * Writes into `out` the displacement produced by one step at progress `p`,
 * where p is 0..1 across the step's OUTBOUND travel.
 */
function sampleStepAt(
  step: CompiledCasterMotionStep,
  p: number,
  resolveAnchor: CasterMotionAnchorResolver,
  out: MutableVec3,
): void {
  out.x = 0;
  out.y = verticalOffset(step, p);
  out.z = 0;
  const factor = horizontalFactor(step, p);
  if (factor === 0 || step.destination === 'ORIGIN') return;
  _scratchDelta.x = 0;
  _scratchDelta.y = 0;
  _scratchDelta.z = 0;
  resolveAnchor(step.destinationAnchor, _scratchDelta);
  out.x += _scratchDelta.x * factor;
  out.z += _scratchDelta.z * factor;
}

/** Resting displacement a completed step leaves behind. */
function sampleResidual(
  step: CompiledCasterMotionStep,
  resolveAnchor: CasterMotionAnchorResolver,
  out: MutableVec3,
): void {
  if (step.returnToOrigin) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return;
  }
  sampleStepAt(step, 1, resolveAnchor, out);
}

const _scratchStep: MutableVec3 = { x: 0, y: 0, z: 0 };

/**
 * Samples the caster's total displacement at absolute time `t`.
 *
 * SEMANTICS (deterministic and fully tested):
 *   - Steps that have completely finished contribute their RESIDUAL: their
 *     final displacement, or zero when they returned to origin. Residuals
 *     accumulate, so DASH_THROUGH → JUMP_UP jumps from behind the target.
 *   - The step currently in flight contributes its animated displacement on
 *     top of those residuals.
 *   - When windows overlap, the LAST started step wins; earlier overlapping
 *     steps contribute nothing while still in flight.
 *
 * Zero allocation: everything is written into `out` using module scratch.
 */
export function sampleCasterMotionOffset(
  motion: CompiledCasterMotion,
  t: number,
  resolveAnchor: CasterMotionAnchorResolver,
  out: MutableVec3,
): MutableVec3 {
  out.x = 0;
  out.y = 0;
  out.z = 0;
  if (motion.steps.length === 0) return out;

  let active: CompiledCasterMotionStep | null = null;
  for (let i = 0; i < motion.steps.length; i += 1) {
    const step = motion.steps[i]!;
    if (t < step.startTime) continue;
    if (t >= step.endTime) {
      sampleResidual(step, resolveAnchor, _scratchStep);
      out.x += _scratchStep.x;
      out.y += _scratchStep.y;
      out.z += _scratchStep.z;
    } else {
      active = step;
    }
  }

  if (active) {
    if (t < active.motionEndTime) {
      const p = active.duration > 0 ? (t - active.startTime) / active.duration : 1;
      sampleStepAt(active, p, resolveAnchor, _scratchStep);
    } else {
      // Return leg: decay the final displacement back to zero.
      const returnP = active.duration > 0 ? (t - active.motionEndTime) / active.duration : 1;
      sampleStepAt(active, 1, resolveAnchor, _scratchStep);
      const remaining = 1 - ease('EASE_OUT', returnP);
      _scratchStep.x *= remaining;
      _scratchStep.y *= remaining;
      _scratchStep.z *= remaining;
    }
    out.x += _scratchStep.x;
    out.y += _scratchStep.y;
    out.z += _scratchStep.z;
  }
  return out;
}

// ============================================================ Unified Timeline

export type VfxTimelineEventKind = 'VFX' | 'MOTION';

/**
 * One event on the SHARED preset clock. VFX slots and caster motions use the
 * same time reference, which is what makes an authored
 * "VFX → MOTION → VFX" sequence reproducible.
 */
export interface VfxTimelineEvent {
  kind: VfxTimelineEventKind;
  /** slotId for VFX events, motionId for MOTION events. */
  id: string;
  startTime: number;
  endTime: number;
  /** Candidate spritesheet for VFX events. */
  candidateId?: string;
  /** Motion type for MOTION events. */
  motionType?: CasterMotionType;
}

export interface TimelineSlotLike {
  slotId: string;
  candidateId: string;
  startTime: number;
  duration: number;
}

/**
 * Merges compiled VFX slots and compiled caster motions into one ordered
 * timeline. Ordering is by startTime, then VFX before MOTION at equal times,
 * then by original index — fully deterministic for simultaneous events.
 */
export function buildUnifiedTimeline(
  slots: readonly TimelineSlotLike[],
  motion: CompiledCasterMotion = EMPTY_COMPILED_CASTER_MOTION,
): VfxTimelineEvent[] {
  const events: { event: VfxTimelineEvent; rank: number; index: number }[] = [];
  slots.forEach((slot, index) => {
    events.push({
      event: {
        kind: 'VFX',
        id: slot.slotId,
        startTime: round3(slot.startTime),
        endTime: round3(slot.startTime + slot.duration),
        candidateId: slot.candidateId,
      },
      rank: 0,
      index,
    });
  });
  motion.steps.forEach((step, index) => {
    events.push({
      event: {
        kind: 'MOTION',
        id: step.motionId,
        startTime: step.startTime,
        endTime: step.endTime,
        motionType: step.type,
      },
      rank: 1,
      index,
    });
  });
  events.sort((a, b) => {
    if (a.event.startTime !== b.event.startTime) return a.event.startTime - b.event.startTime;
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.index - b.index;
  });
  return events.map((e) => e.event);
}
