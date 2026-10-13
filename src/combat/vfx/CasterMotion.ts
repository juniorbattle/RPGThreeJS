/**
 * R2C-VFX Composer — linked UNIT MOTION + POSE.
 *
 * Every current authored step binds one semantic actor (CASTER or TARGET), one
 * Phase A CombatPose, and one spatial motion. Legacy caster-only records remain
 * readable through optional compatibility fields and IDLE normalization.
 *
 * The module stays pure and framework-free: it produces actor-filtered offsets
 * against semantic anchors and never mutates Three.js objects, gameplay state,
 * cameras, terrain, or pose assets.
 */

import { COMBAT_POSES, type CombatPose } from '../stage/CombatPoseRegistry';
import type { VfxAnchor } from './VfxTypes';

// ============================================================ Motion Types

export type CombatActorRole = 'CASTER' | 'TARGET';

export const UNIT_MOTION_ACTORS: readonly CombatActorRole[] = ['CASTER', 'TARGET'];

export type UnitMotionType =
  | 'HOLD'
  | 'DASH_SHORT'
  | 'DASH_THROUGH'
  | 'JUMP_UP'
  | 'JUMP_DOWN'
  | 'JUMP_ARC';

export type CasterMotionType = UnitMotionType | 'IDLE';

export const UNIT_MOTION_TYPES: readonly UnitMotionType[] = [
  'HOLD', 'DASH_SHORT', 'DASH_THROUGH', 'JUMP_UP', 'JUMP_DOWN', 'JUMP_ARC',
];

/** Historical export retained for callers; new authoring no longer exposes IDLE. */
export const CASTER_MOTION_TYPES: readonly UnitMotionType[] = UNIT_MOTION_TYPES;

export type UnitMotionDestination =
  | 'ORIGIN'
  | 'TARGET'
  | 'TARGET_FRONT'
  | 'TARGET_BACK'
  | 'CASTER'
  | 'CASTER_FRONT'
  | 'CASTER_BACK';

export type CasterMotionDestination = UnitMotionDestination;

const CASTER_DESTINATIONS: readonly UnitMotionDestination[] = [
  'ORIGIN', 'TARGET', 'TARGET_FRONT', 'TARGET_BACK',
];
const TARGET_DESTINATIONS: readonly UnitMotionDestination[] = [
  'ORIGIN', 'CASTER', 'CASTER_FRONT', 'CASTER_BACK',
];

export const UNIT_MOTION_DESTINATIONS: readonly UnitMotionDestination[] = [
  ...CASTER_DESTINATIONS,
  'CASTER', 'CASTER_FRONT', 'CASTER_BACK',
];

/** Historical export retained for compatibility; UI must filter by actor. */
export const CASTER_MOTION_DESTINATIONS = UNIT_MOTION_DESTINATIONS;

export type CasterMotionEasing = 'LINEAR' | 'EASE_IN' | 'EASE_OUT' | 'EASE_IN_OUT';
export type UnitMotionEasing = CasterMotionEasing;

export const CASTER_MOTION_EASINGS: readonly CasterMotionEasing[] = [
  'LINEAR', 'EASE_IN', 'EASE_OUT', 'EASE_IN_OUT',
];
export const UNIT_MOTION_EASINGS = CASTER_MOTION_EASINGS;

const DESTINATION_ANCHORS: Readonly<Record<Exclude<UnitMotionDestination, 'ORIGIN'>, VfxAnchor>> = Object.freeze({
  TARGET: 'target',
  TARGET_FRONT: 'targetFront',
  TARGET_BACK: 'targetBack',
  CASTER: 'source',
  CASTER_FRONT: 'sourceFront',
  CASTER_BACK: 'sourceBack',
});

export function unitMotionDestinationsForActor(actor: CombatActorRole): readonly UnitMotionDestination[] {
  return actor === 'TARGET' ? TARGET_DESTINATIONS : CASTER_DESTINATIONS;
}

export function normalizeUnitMotionDestination(
  destination: UnitMotionDestination,
  actor: CombatActorRole,
): UnitMotionDestination {
  if (destination === 'ORIGIN') return destination;
  if (actor === 'TARGET') {
    if (destination === 'TARGET') return 'CASTER';
    if (destination === 'TARGET_FRONT') return 'CASTER_FRONT';
    if (destination === 'TARGET_BACK') return 'CASTER_BACK';
  } else {
    if (destination === 'CASTER') return 'TARGET';
    if (destination === 'CASTER_FRONT') return 'TARGET_FRONT';
    if (destination === 'CASTER_BACK') return 'TARGET_BACK';
  }
  return destination;
}

export function resolveMotionAnchor(
  destination: UnitMotionDestination,
  actor: CombatActorRole = 'CASTER',
): VfxAnchor {
  if (destination === 'ORIGIN') return actor === 'TARGET' ? 'target' : 'source';
  return DESTINATION_ANCHORS[destination];
}

// ============================================================ Authoring Model

/**
 * Compatibility shape for persisted motion records. Current Composer-created
 * entries materialize actor + pose; legacy entries may omit both.
 */
export interface CasterMotionStep {
  id: string;
  /** Absent only for legacy data; compatibility resolves it as CASTER. */
  actor?: CombatActorRole;
  /** Absent only for legacy data; compatibility preserves the current visual. */
  pose?: CombatPose;
  type: CasterMotionType;
  /** Seconds of travel. Defaults per type. */
  duration?: number;
  /** Actor-aware semantic destination. Defaults per type. */
  destination?: UnitMotionDestination;
  /** Fraction (0..1) of the actor→destination vector actually travelled. */
  distance?: number;
  /** Vertical amplitude in world units. Only used by the JUMP_* types. */
  height?: number;
  easing?: UnitMotionEasing;
  /** Controls spatial return only; it never selects a pose. */
  returnToOrigin?: boolean;
}

export interface UnitMotionStep extends CasterMotionStep {
  actor: CombatActorRole;
  pose: CombatPose;
  type: UnitMotionType;
}

/** Fully resolved defaults for one motion type. */
export interface CasterMotionDefaults {
  duration: number;
  destination: UnitMotionDestination;
  distance: number;
  height: number;
  easing: UnitMotionEasing;
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
export const UNIT_MOTION_DEFAULTS: Readonly<Record<UnitMotionType, Readonly<CasterMotionDefaults>>> = Object.freeze({
  HOLD: Object.freeze({
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

export const CASTER_MOTION_DEFAULTS: Readonly<Record<CasterMotionType, Readonly<CasterMotionDefaults>>> = Object.freeze({
  ...UNIT_MOTION_DEFAULTS,
  IDLE: UNIT_MOTION_DEFAULTS.HOLD,
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
    ...(overrides.actor ? { actor: overrides.actor } : {}),
    ...(overrides.pose ? { pose: overrides.pose } : {}),
    ...(overrides.duration != null ? { duration: overrides.duration } : {}),
    ...(overrides.destination ? { destination: overrides.destination } : {}),
    ...(overrides.distance != null ? { distance: overrides.distance } : {}),
    ...(overrides.height != null ? { height: overrides.height } : {}),
    ...(overrides.easing ? { easing: overrides.easing } : {}),
    ...(overrides.returnToOrigin != null ? { returnToOrigin: overrides.returnToOrigin } : {}),
  };
}

export function createUnitMotionStep(
  type: UnitMotionType = 'HOLD',
  overrides: Partial<Omit<UnitMotionStep, 'id' | 'type'>> = {},
): UnitMotionStep {
  return createCasterMotionStep(type, {
    ...overrides,
    actor: overrides.actor ?? 'CASTER',
    pose: overrides.pose ?? 'prepare',
  }) as UnitMotionStep;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const COMBAT_POSE_SET = new Set<string>(COMBAT_POSES);
const UNIT_MOTION_TYPE_SET = new Set<string>(UNIT_MOTION_TYPES);

export interface ResolvedUnitMotionStep extends CasterMotionDefaults {
  id: string;
  actor: CombatActorRole;
  pose: CombatPose | null;
  type: UnitMotionType;
  legacy: boolean;
}

/** Resolves legacy and current authored steps without ever throwing. */
export function resolveUnitMotionStep(step: CasterMotionStep): ResolvedUnitMotionStep {
  const type: UnitMotionType = step.type === 'IDLE' || !UNIT_MOTION_TYPE_SET.has(step.type)
    ? 'HOLD'
    : step.type as UnitMotionType;
  const defaults = UNIT_MOTION_DEFAULTS[type];
  const actor: CombatActorRole = step.actor === 'TARGET' ? 'TARGET' : 'CASTER';
  const numeric = (value: number | undefined, fallback: number) =>
    (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  const defaultDestination = normalizeUnitMotionDestination(defaults.destination, actor);
  const authoredDestination = step.destination ?? defaultDestination;
  return {
    id: step.id,
    actor,
    pose: step.pose && COMBAT_POSE_SET.has(step.pose) ? step.pose : null,
    type,
    duration: clamp(numeric(step.duration, defaults.duration), MIN_MOTION_DURATION, MAX_MOTION_DURATION),
    destination: normalizeUnitMotionDestination(authoredDestination, actor),
    distance: type === 'HOLD' ? 0 : clamp(numeric(step.distance, defaults.distance), 0, 1),
    height: type === 'HOLD' ? 0 : clamp(numeric(step.height, defaults.height), 0, 6),
    easing: step.easing ?? defaults.easing,
    returnToOrigin: type === 'HOLD' ? false : step.returnToOrigin ?? defaults.returnToOrigin,
    legacy: step.actor === undefined || step.pose === undefined || step.type === 'IDLE',
  };
}

/** Historical name retained for source compatibility. */
export const resolveCasterMotionStep = resolveUnitMotionStep;

// ============================================================ Validation

export interface CasterMotionValidationResult {
  ok: boolean;
  errors: string[];
}

const COMPAT_MOTION_TYPE_SET = new Set<string>([...UNIT_MOTION_TYPES, 'IDLE']);
const DESTINATION_SET = new Set<string>(UNIT_MOTION_DESTINATIONS);
const ACTOR_SET = new Set<string>(UNIT_MOTION_ACTORS);
const EASING_SET = new Set<string>(CASTER_MOTION_EASINGS);

/** Compatibility validation accepts actor/pose absence and legacy IDLE. */
export function validateCasterMotionStep(raw: unknown): CasterMotionValidationResult {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['motion step must be an object'] };
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== 'string' || s.id.length === 0) errors.push('motion step requires a non-empty id');
  if (typeof s.type !== 'string' || !COMPAT_MOTION_TYPE_SET.has(s.type)) errors.push(`invalid motion type: ${String(s.type)}`);
  if (s.actor !== undefined && !ACTOR_SET.has(String(s.actor))) errors.push(`invalid motion actor: ${String(s.actor)}`);
  if (s.pose !== undefined && !COMBAT_POSE_SET.has(String(s.pose))) errors.push(`invalid combat pose: ${String(s.pose)}`);
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

/** Strict validation for newly authored linked Unit Motion + Pose steps. */
export function validateUnitMotionStep(raw: unknown): CasterMotionValidationResult {
  const compatibility = validateCasterMotionStep(raw);
  const errors = [...compatibility.errors];
  if (typeof raw !== 'object' || raw === null) return { ok: false, errors };
  const s = raw as Record<string, unknown>;
  if (!ACTOR_SET.has(String(s.actor))) errors.push('linked motion step requires a valid actor');
  if (!COMBAT_POSE_SET.has(String(s.pose))) errors.push('linked motion step requires a valid CombatPose');
  if (!UNIT_MOTION_TYPE_SET.has(String(s.type))) errors.push('linked motion step requires a canonical motion type');
  if (ACTOR_SET.has(String(s.actor)) && s.destination !== undefined) {
    const allowed = unitMotionDestinationsForActor(s.actor as CombatActorRole);
    if (!allowed.includes(s.destination as UnitMotionDestination)) {
      errors.push(`${String(s.actor)} cannot use destination ${String(s.destination)}`);
    }
  }
  if (s.type === 'HOLD') {
    if (s.destination !== undefined && s.destination !== 'ORIGIN') errors.push('HOLD destination must be ORIGIN');
    if (s.distance !== undefined && s.distance !== 0) errors.push('HOLD distance must be 0');
    if (s.height !== undefined && s.height !== 0) errors.push('HOLD height must be 0');
    if (s.returnToOrigin !== undefined && s.returnToOrigin !== false) errors.push('HOLD cannot return to origin');
  }
  return { ok: errors.length === 0, errors };
}

function validateMotionList(
  raw: unknown,
  validateStep: (step: unknown) => CasterMotionValidationResult,
): CasterMotionValidationResult {
  if (raw === undefined || raw === null) return { ok: true, errors: [] };
  if (!Array.isArray(raw)) return { ok: false, errors: ['casterMotion must be an array'] };
  const errors: string[] = [];
  const seen = new Set<string>();
  raw.forEach((step, index) => {
    const result = validateStep(step);
    for (const error of result.errors) errors.push(`motion[${index}]: ${error}`);
    const id = (step as { id?: unknown } | null)?.id;
    if (typeof id === 'string') {
      if (seen.has(id)) errors.push(`motion[${index}]: duplicate motion id ${id}`);
      seen.add(id);
    }
  });
  return { ok: errors.length === 0, errors };
}

export function validateCasterMotion(raw: unknown): CasterMotionValidationResult {
  return validateMotionList(raw, (step) => {
    if (typeof step !== 'object' || step === null) return validateCasterMotionStep(step);
    const value = step as Record<string, unknown>;
    const linked = value.actor !== undefined || value.pose !== undefined || value.type === 'HOLD';
    return linked ? validateUnitMotionStep(step) : validateCasterMotionStep(step);
  });
}

export function validateLinkedUnitMotion(raw: unknown): CasterMotionValidationResult {
  return validateMotionList(raw, validateUnitMotionStep);
}

// ============================================================ Compilation

/** One compiled linked Unit Motion + Pose step. Semantic anchors only. */
export interface CompiledCasterMotionStep {
  motionId: string;
  actor: CombatActorRole;
  /** null is the compatibility-only legacy "inherit current visual" state. */
  pose: CombatPose | null;
  type: UnitMotionType;
  startTime: number;
  duration: number;
  /** Absolute end of the outbound travel. */
  motionEndTime: number;
  /** Absolute end including the optional return leg. */
  endTime: number;
  destination: UnitMotionDestination;
  /** Resolved semantic anchor, resolved to a position only by the runtime. */
  destinationAnchor: VfxAnchor;
  distance: number;
  height: number;
  easing: UnitMotionEasing;
  returnToOrigin: boolean;
  /** True when this step can never produce any displacement. */
  isNoop: boolean;
}

export type CompiledUnitMotionStep = CompiledCasterMotionStep;

export interface CompiledCasterMotion {
  steps: CompiledCasterMotionStep[];
  /** Latest absolute time at which either actor is still moving. */
  totalDuration: number;
  /** True when at least one step can actually displace its actor. */
  hasEffect: boolean;
  /** True for spatial movement or an authored semantic pose override. */
  hasPresentation: boolean;
}

export type CompiledUnitMotion = CompiledCasterMotion;

export interface UnitMotionRuntimeHooks {
  install: (motion: CompiledUnitMotion) => void;
  applyStep: (step: CompiledUnitMotionStep) => void | Promise<unknown>;
  cleanup: () => void | Promise<unknown>;
}

export const EMPTY_COMPILED_CASTER_MOTION: CompiledCasterMotion = Object.freeze({
  steps: Object.freeze([]) as unknown as CompiledCasterMotionStep[],
  totalDuration: 0,
  hasEffect: false,
  hasPresentation: false,
});
export const EMPTY_COMPILED_UNIT_MOTION = EMPTY_COMPILED_CASTER_MOTION;

function isNoopMotion(resolved: CasterMotionDefaults & { type: UnitMotionType }): boolean {
  if (resolved.type === 'HOLD') return true;
  const vertical = resolved.type === 'JUMP_UP' || resolved.type === 'JUMP_DOWN' || resolved.type === 'JUMP_ARC';
  const horizontalMoves = resolved.distance > 0 && resolved.destination !== 'ORIGIN';
  const verticalMoves = vertical && resolved.height > 0;
  return !horizontalMoves && !verticalMoves;
}

/**
 * Compiles linked steps into one deterministic actor-aware plan. Beat-provided
 * start times remain the sole motion/pose timing authority; legacy raw
 * `startTime` fields are ignored.
 */
export function compileUnitMotion(
  steps: readonly CasterMotionStep[] | undefined,
  startTimeOverrides?: ReadonlyMap<string, number>,
): CompiledCasterMotion {
  if (!steps || steps.length === 0) return EMPTY_COMPILED_CASTER_MOTION;

  const resolved = steps.map((step, index) => ({
    resolved: resolveUnitMotionStep(step),
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
      actor: r.actor,
      pose: r.pose,
      type: r.type,
      startTime: round3(startTime),
      duration: round3(r.duration),
      motionEndTime,
      endTime,
      destination: r.destination,
      destinationAnchor: resolveMotionAnchor(r.destination, r.actor),
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
    hasPresentation: compiled.some((s) => !s.isNoop || s.pose !== null),
  };
}

/** Historical function name retained for compatibility. */
export const compileCasterMotion = compileUnitMotion;

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
 * Runtime bridge. The runtime writes the vector from the selected actor's base
 * position to the requested semantic anchor into `out`.
 *
 * Keeping this a callback is what lets the motion layer stay free of Three.js
 * and of any knowledge about the Stage layout.
 */
export type CasterMotionAnchorResolver = (anchor: VfxAnchor, out: MutableVec3) => void;

/** Module scratch. Sampling is synchronous, so reuse is safe and allocation-free. */
const _scratchDelta: MutableVec3 = { x: 0, y: 0, z: 0 };

function horizontalFactor(step: CompiledCasterMotionStep, p: number): number {
  if (step.type === 'HOLD' || step.type === 'JUMP_UP') return 0;
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
 * Samples one actor's total displacement at absolute time `t`.
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
export function sampleUnitMotionOffset(
  motion: CompiledCasterMotion,
  t: number,
  actor: CombatActorRole,
  resolveAnchor: CasterMotionAnchorResolver,
  out: MutableVec3,
  enabledMotionIds?: ReadonlySet<string>,
): MutableVec3 {
  out.x = 0;
  out.y = 0;
  out.z = 0;
  if (motion.steps.length === 0) return out;

  let active: CompiledCasterMotionStep | null = null;
  for (let i = 0; i < motion.steps.length; i += 1) {
    const step = motion.steps[i]!;
    if (step.actor !== actor || t < step.startTime || (enabledMotionIds && !enabledMotionIds.has(step.motionId))) continue;
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

/** Historical CASTER-only sampler retained for existing callers. */
export function sampleCasterMotionOffset(
  motion: CompiledCasterMotion,
  t: number,
  resolveAnchor: CasterMotionAnchorResolver,
  out: MutableVec3,
): MutableVec3 {
  return sampleUnitMotionOffset(motion, t, 'CASTER', resolveAnchor, out);
}

export function unitMotionHasEffectForActor(
  motion: CompiledCasterMotion,
  actor: CombatActorRole,
): boolean {
  return motion.steps.some((step) => step.actor === actor && !step.isNoop);
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
  /** Linked Unit Motion + Pose metadata for MOTION events. */
  motionType?: UnitMotionType;
  actor?: CombatActorRole;
  pose?: CombatPose | null;
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
        actor: step.actor,
        pose: step.pose,
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
