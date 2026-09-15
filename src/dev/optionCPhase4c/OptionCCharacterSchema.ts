/**
 * Phase 4C-GLM — Character Pipeline Schema
 *
 * Generalizes the Kestrel (Phase 4B) runtime integration into a reusable
 * character definition.  Every field mirrors a concrete Kestrel contract so
 * that new characters can be added without inventing new conventions.
 *
 * GLM owns structure, not final art.  New characters remain at most
 * SCALING_DRAFT or DEV_PRODUCTION_CANDIDATE — never PRODUCTION_APPROVED
 * unless explicitly promoted through the operator-authorized path.
 */

import type { SpriteFrameAnimationDefinition } from '../../render/SpriteFrameAnimation';

// ---------------------------------------------------------------------------
// Validation authority (production promotion gate)
// ---------------------------------------------------------------------------

/**
 * The authority performing the validation. This controls whether
 * PRODUCTION_APPROVED is a valid art status for the given definition.
 *
 * - GLM:      may set at most DEV_PRODUCTION_CANDIDATE
 * - CODEX:    may set at most FINAL_PRODUCTION_CANDIDATE
 * - OPERATOR: may set PRODUCTION_APPROVED (explicit operator-authorized promotion)
 */
export type OptionCValidationAuthority = 'GLM' | 'CODEX' | 'OPERATOR';

// ---------------------------------------------------------------------------
// Semantic enums
// ---------------------------------------------------------------------------

export type OptionCArtStatus =
  | 'GOLD_REFERENCE' // Kestrel / Forest Road
  | 'SCALING_DRAFT' // early GLM-derived runtime representation
  | 'DEV_PRODUCTION_CANDIDATE' // structurally mature GLM output
  | 'FINAL_PRODUCTION_CANDIDATE' // Codex output ready for operator review
  | 'ART_PENDING_CODEX' // final art remains missing
  | 'REJECTED' // structurally invalid
  | 'PRODUCTION_APPROVED'; // ONLY set by operator approval — never by GLM or Codex

/**
 * Production promotion state machine (authority model):
 *
 *   GLM      → SCALING_DRAFT → DEV_PRODUCTION_CANDIDATE
 *   CODEX    → FINAL_PRODUCTION_CANDIDATE
 *   OPERATOR → PRODUCTION_APPROVED   (operator-only gate)
 *
 * A Codex generation mission MUST NOT self-promote its output directly to
 * PRODUCTION_APPROVED. Only operator approval may set PRODUCTION_APPROVED.
 * GOLD_REFERENCE is a fixed structural/runtime reference status (Kestrel,
 * Forest Road) and is never the result of a promotion step.
 */

export type OptionCSurface = 'travel' | 'tableau' | 'strategic' | 'combat-stage';

export type OptionCAnimationState =
  | 'idle'
  | 'dash'
  | 'attack'
  | 'cast' // alias of skill for semantic clarity
  | 'skill'
  | 'hurt'
  | 'guard'
  | 'death'
  | 'victory'
  | 'special'
  | 'rangedRelease'
  | 'heavyAttack';

export type OptionCFacing = 'LEFT' | 'RIGHT' | 'FORWARD';

export type OptionCMirrorPolicy =
  | 'runtime' // mirror via CSS/transform at runtime (preferred)
  | 'bakedLeft' // image faces left, mirror at runtime for right
  | 'bakedRight' // image faces right, mirror at runtime for left
  | 'noMirror'; // forward-facing only

export type OptionCLoadingPolicy =
  | 'eager' // preload immediately when surface mounts
  | 'lazy' // load on first display
  | 'predictive'; // load when next-state prediction justifies it

export type OptionCPreloadPolicy = 'onDemand' | 'withSurface' | 'withCharacter';

// ---------------------------------------------------------------------------
// Identity spec (Section 9)
// ---------------------------------------------------------------------------

export interface OptionCCharacterIdentity {
  /** Stable character id matching game catalog definitionId. */
  readonly id: string;
  /** Human-readable display name. */
  readonly displayName: string;
  /** Canonical pixel art source path (640x768 full body). */
  readonly canonicalSource: string;
  /** Weapon family from game catalog. */
  readonly weapon: string;
  /** Combat archetype: knight, cleric, mage, archer, rogue. */
  readonly archetype: string;
  /** Silhouette class for grouping. */
  readonly silhouetteClass: string;
  /** Body class: humanoid, heavy, robed, lithe, beast. */
  readonly bodyClass: string;
  /** Head profile description. */
  readonly headProfile: string;
  /** Mask / headgear / hair description. */
  readonly maskProfile: string;
  /** Primary color palette family. */
  readonly paletteFamily: readonly string[];
  /** Secondary equipment notes. */
  readonly equipmentProfile: string;
  /** Tableau staging requirements. */
  readonly tableauRequirements: string;
  /** Strategic combat requirements. */
  readonly strategicRequirements: string;
  /** Combat stage requirements. */
  readonly combatStageRequirements: string;
  /** Animation states this character supports. */
  readonly animationStates: readonly OptionCAnimationState[];
}

// ---------------------------------------------------------------------------
// Animation metadata (Section 14)
// ---------------------------------------------------------------------------

export interface OptionCAnimationMetadata {
  readonly state: OptionCAnimationState;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount: number;
  readonly frameDurationMs: number;
  readonly loop: boolean;
  readonly oneShot: boolean;
  readonly returnState?: OptionCAnimationState;
  /** Y position of the foot baseline in pixels from top. */
  readonly footBaseline: number;
  /** Pivot X in pixels from left. */
  readonly pivotX: number;
  /** Pivot Y in pixels from top. */
  readonly pivotY: number;
  readonly mirrorAllowed: boolean;
  /** Scale factor relative to the 512x512 Option C frame. */
  readonly surfaceScale: number;
  readonly preloadPolicy: OptionCPreloadPolicy;
  /** Ordered list of frame URLs. */
  readonly frames: readonly string[];
}

// ---------------------------------------------------------------------------
// Anchor contract (Section 15)
// ---------------------------------------------------------------------------

export interface OptionCAnchorContract {
  /** Foot center anchor — bottom-center of the character sprite. */
  readonly footCenter: { readonly x: number; readonly y: number };
  /** Body center anchor — vertical midpoint of the torso. */
  readonly bodyCenter: { readonly x: number; readonly y: number };
  /** Head reference — approximate head center for look-target alignment. */
  readonly headReference: { readonly x: number; readonly y: number };
  /** Weapon reference — approximate weapon position for VFX alignment. */
  readonly weaponReference?: { readonly x: number; readonly y: number };
}

// ---------------------------------------------------------------------------
// Scale contract (Section 16)
// ---------------------------------------------------------------------------

export interface OptionCScaleContract {
  /**
   * Tableau narrative actor scale (0-1 relative to the tableau canvas).
   * This is an ABSOLUTE narrative scale applied to the actor on the tableau
   * stage (e.g. 0.92 for Kestrel). It is NOT a world-plane size.
   */
  readonly tableau: number;
  /**
   * Strategic combat scale. This is a RELATIVE ASSET MULTIPLIER against the
   * native 512×512 Option C frame (1.0 = native frame size). It is NOT the
   * strategic runtime Three.js proxy plane size (that plane is a fixed
   * 2.08×2.08 world unit geometry owned by the runtime, separate from this
   * multiplier). Do not confuse this normalized multiplier with a world
   * plane size.
   */
  readonly strategic: number;
  /**
   * Combat stage scale. This is a RELATIVE ASSET MULTIPLIER against the
   * native 512×512 Option C frame (1.0 = native frame size). It is NOT the
   * combat-stage runtime Three.js proxy plane size (that plane is a fixed
   * 2.08×2.08 world unit geometry owned by the runtime, separate from this
   * multiplier). Do not confuse this normalized multiplier with a world
   * plane size.
   */
  readonly combatStage: number;
  /** Whether these values are DRAFT_SCALE (GLM-selected) or final. */
  readonly draftScale: boolean;
}

// ---------------------------------------------------------------------------
// Surface assets (per-surface resolution)
// ---------------------------------------------------------------------------

export interface OptionCSurfaceAssets {
  readonly tableau: string;
  readonly strategic: string;
  readonly combatStage: string;
}

// ---------------------------------------------------------------------------
// Sources (canonical + Option C derivatives)
// ---------------------------------------------------------------------------

export interface OptionCCharacterSources {
  /** Canonical 640x768 pixel art. */
  readonly canonical: string;
  /** Phase 4B runtime derivatives (Kestrel only). */
  readonly phase4bRoot?: string;
  /** Phase 4C draft root for this character. */
  readonly phase4cRoot?: string;
}

// ---------------------------------------------------------------------------
// Codex handoff slots (Section 36)
// ---------------------------------------------------------------------------

export interface OptionCCodexHandoffSlot {
  readonly slotName: string;
  readonly expectedDimensions: readonly [number, number];
  readonly transparent: boolean;
  readonly anchor: string;
  readonly surfaceScale: number;
  readonly frameCountRange: readonly [number, number];
  readonly timingMetadata: string;
  readonly canonicalReference: string;
  readonly kestrelReference: string;
  readonly fileDestination: string;
  readonly runtimeSemanticKey: string;
}

// ---------------------------------------------------------------------------
// QA status
// ---------------------------------------------------------------------------

export interface OptionCQaStatus {
  readonly registryValidated: boolean;
  readonly manifestResolved: boolean;
  readonly animationValidated: boolean;
  readonly anchorValidated: boolean;
  readonly scaleValidated: boolean;
  readonly selectiveLoadingValidated: boolean;
  readonly labWired: boolean;
  readonly backwardCompatible: boolean;
}

// ---------------------------------------------------------------------------
// Full character definition (Section 10)
// ---------------------------------------------------------------------------

export interface OptionCCharacterDefinition {
  readonly identity: OptionCCharacterIdentity;
  readonly sources: OptionCCharacterSources;
  readonly masterStatus: OptionCArtStatus;
  readonly surfaceAssets: OptionCSurfaceAssets;
  readonly animations: readonly OptionCAnimationMetadata[];
  readonly anchors: OptionCAnchorContract;
  readonly scales: OptionCScaleContract;
  readonly mirrorPolicy: OptionCMirrorPolicy;
  readonly loadingPolicy: OptionCLoadingPolicy;
  readonly runtimeStatus: OptionCArtStatus;
  readonly qaStatus: OptionCQaStatus;
  readonly codexHandoffSlots: readonly OptionCCodexHandoffSlot[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isOptionCArtStatus(value: string | null): value is OptionCArtStatus {
  return value === 'GOLD_REFERENCE'
    || value === 'SCALING_DRAFT'
    || value === 'DEV_PRODUCTION_CANDIDATE'
    || value === 'FINAL_PRODUCTION_CANDIDATE'
    || value === 'ART_PENDING_CODEX'
    || value === 'REJECTED'
    || value === 'PRODUCTION_APPROVED';
}

export function isOptionCSurface(value: string | null): value is OptionCSurface {
  return value === 'travel' || value === 'tableau' || value === 'strategic' || value === 'combat-stage';
}

export function isOptionCAnimationState(value: string | null): value is OptionCAnimationState {
  return value === 'idle'
    || value === 'dash'
    || value === 'attack'
    || value === 'cast'
    || value === 'skill'
    || value === 'hurt'
    || value === 'guard'
    || value === 'death'
    || value === 'victory'
    || value === 'special'
    || value === 'rangedRelease'
    || value === 'heavyAttack';
}

export function isOptionCFacing(value: string | null): value is OptionCFacing {
  return value === 'LEFT' || value === 'RIGHT' || value === 'FORWARD';
}

/**
 * Convert OptionCAnimationMetadata to the existing SpriteFrameAnimationDefinition
 * so the Phase 4B animation controller can consume it unchanged.
 */
export function toSpriteFrameAnimationDefinition(
  metadata: OptionCAnimationMetadata,
): SpriteFrameAnimationDefinition<OptionCAnimationState> {
  return {
    state: metadata.state,
    frames: metadata.frames,
    frameDurationMs: metadata.frameDurationMs,
    loop: metadata.loop,
    returnState: metadata.returnState,
  };
}

/**
 * Validate that an animation metadata block is internally consistent.
 * Returns null on success, error message on failure.
 */
export function validateAnimationMetadata(meta: OptionCAnimationMetadata): string | null {
  if (meta.frameCount < 1) return `Animation '${meta.state}' has invalid frameCount ${meta.frameCount}.`;
  if (meta.frames.length !== meta.frameCount) {
    return `Animation '${meta.state}' frameCount=${meta.frameCount} but frames.length=${meta.frames.length}.`;
  }
  if (!Number.isFinite(meta.frameDurationMs) || meta.frameDurationMs <= 0) {
    return `Animation '${meta.state}' has invalid frameDurationMs ${meta.frameDurationMs}.`;
  }
  if (meta.oneShot && meta.loop) return `Animation '${meta.state}' cannot be both oneShot and loop.`;
  if (meta.oneShot && !meta.returnState) return `Animation '${meta.state}' is oneShot but has no returnState.`;
  if (meta.frameWidth < 1 || meta.frameHeight < 1) {
    return `Animation '${meta.state}' has invalid dimensions ${meta.frameWidth}x${meta.frameHeight}.`;
  }
  return null;
}

/**
 * Validate a full character definition.
 * Returns null on success, error message on failure.
 */
/**
 * Validate a character definition. The `authority` parameter controls whether
 * PRODUCTION_APPROVED is permitted (operator-only). Defaults to `'GLM'` which
 * is the most restrictive — autonomous GLM/Codex missions cannot self-promote.
 *
 * For operator-authorized promotion, call with `authority: 'OPERATOR'` or use
 * the dedicated `validateOperatorPromotion` wrapper.
 */
export function validateCharacterDefinition(
  def: OptionCCharacterDefinition,
  authority: OptionCValidationAuthority = 'GLM',
): string | null {
  if (!def.identity.id) return 'Character identity.id is empty.';
  if (!def.identity.canonicalSource) return `Character '${def.identity.id}' has no canonicalSource.`;
  if (def.animations.length === 0) return `Character '${def.identity.id}' has no animations.`;
  const states = new Set<string>();
  for (const anim of def.animations) {
    if (states.has(anim.state)) return `Character '${def.identity.id}' has duplicate animation state '${anim.state}'.`;
    states.add(anim.state);
    const err = validateAnimationMetadata(anim);
    if (err) return err;
  }
  if (def.scales.tableau <= 0 || def.scales.strategic <= 0 || def.scales.combatStage <= 0) {
    return `Character '${def.identity.id}' has non-positive scale.`;
  }
  if (def.anchors.footCenter.x < 0 || def.anchors.footCenter.y < 0) {
    return `Character '${def.identity.id}' has negative foot anchor.`;
  }
  // Production promotion gate: PRODUCTION_APPROVED is operator-only.
  // GLM tops out at DEV_PRODUCTION_CANDIDATE; Codex tops out at
  // FINAL_PRODUCTION_CANDIDATE. Only OPERATOR authority permits
  // PRODUCTION_APPROVED.
  if (authority !== 'OPERATOR') {
    if (def.masterStatus === 'PRODUCTION_APPROVED' || def.runtimeStatus === 'PRODUCTION_APPROVED') {
      return `Character '${def.identity.id}' must not be PRODUCTION_APPROVED without operator authorization (authority=${authority}).`;
    }
  }
  return null;
}

/**
 * Validate a character definition for operator-authorized promotion to
 * PRODUCTION_APPROVED. This is the explicit operator gate — it permits
 * PRODUCTION_APPROVED only when called through this dedicated path.
 *
 * The definition must still pass all structural validation. The caller is
 * asserting that an operator has explicitly authorized this promotion.
 */
export function validateOperatorPromotion(def: OptionCCharacterDefinition): string | null {
  return validateCharacterDefinition(def, 'OPERATOR');
}
