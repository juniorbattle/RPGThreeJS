/**
 * R0B — Combat Execution Stage profiles with universal routing.
 *
 * Explicit profiles (BASIC_MELEE, FLAME_WAVE, DEVOURING_ECLIPSE) take highest
 * priority. A generic semantic resolver derives a Stage profile for every
 * other combat action from structured metadata (type, offensive, support,
 * radius, mode, ultimate, etc.). No normal combat action falls back to
 * tactical-only presentation.
 */

/** Named presentation-only anchor points inside the Stage scene's local space. */
export type StageSlotId =
  | 'attackerStart'
  | 'attackerImpact'
  | 'casterSlot'
  | 'casterCenter'
  | 'primaryTarget'
  | 'secondaryTargetLeft'
  | 'secondaryTargetRight'
  | 'targetLeft'
  | 'targetCenter'
  | 'targetRight'
  | 'allyLeft'
  | 'allyCenter'
  | 'allyRight'
  | 'arenaCenter'
  | 'stageGround'
  | 'projectileOrigin'
  | 'projectileImpact'
  | 'skyEntry';

export interface StageVec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Presentation coordinates only. These do NOT mirror tactical gx/gz/grid
 * geometry — the Stage is a separate frontal composition.
 */
export const STAGE_LAYOUT: Readonly<Record<StageSlotId, Readonly<StageVec3>>> = Object.freeze({
  attackerStart: Object.freeze({ x: -3.1, y: 0, z: 0 }),
  attackerImpact: Object.freeze({ x: -0.55, y: 0, z: 0 }),
  casterSlot: Object.freeze({ x: -2.5, y: 0, z: 0 }),
  casterCenter: Object.freeze({ x: 0, y: 0, z: 0 }),
  primaryTarget: Object.freeze({ x: 2.5, y: 0, z: 0 }),
  secondaryTargetLeft: Object.freeze({ x: 1.5, y: 0, z: -0.9 }),
  secondaryTargetRight: Object.freeze({ x: 1.5, y: 0, z: 0.9 }),
  targetLeft: Object.freeze({ x: 2.2, y: 0, z: -1.1 }),
  targetCenter: Object.freeze({ x: 2.5, y: 0, z: 0 }),
  targetRight: Object.freeze({ x: 2.2, y: 0, z: 1.1 }),
  allyLeft: Object.freeze({ x: -1.6, y: 0, z: -1.1 }),
  allyCenter: Object.freeze({ x: -1.6, y: 0, z: 0 }),
  allyRight: Object.freeze({ x: -1.6, y: 0, z: 1.1 }),
  arenaCenter: Object.freeze({ x: 0, y: 0, z: 0 }),
  stageGround: Object.freeze({ x: 0, y: -0.02, z: 0 }),
  projectileOrigin: Object.freeze({ x: -2.1, y: 1.6, z: 0 }),
  projectileImpact: Object.freeze({ x: 2.1, y: 1.4, z: 0 }),
  skyEntry: Object.freeze({ x: 0, y: 5.5, z: 0 }),
});

// ----------------------------------------------------------- faction-aware sides

/** Faction side for Stage presentation. Player=LEFT, Enemy=RIGHT. */
export type StageFactionSide = 'player' | 'enemy';

/** Resolved faction-side assignment for a Stage session. */
export interface StageSideAssignment {
  sourceSide: StageFactionSide;
  targetSide: StageFactionSide;
  /** True when X coordinates should be mirrored (source is enemy/right side). */
  mirrorX: boolean;
}

const SUPPORT_LAYOUTS: ReadonlySet<StageLayoutType> = new Set(['support_single', 'support_group', 'self_target']);

/**
 * Determines faction-side assignment from the acting unit's team and the profile layout.
 * Player side is always LEFT, enemy side is always RIGHT, regardless of who is acting.
 * Support actions keep targets on the same faction side as the source.
 * Offensive actions place targets on the opposite faction side.
 */
export function resolveStageSideAssignment(
  profile: CombatStageProfile,
  sourceTeam: string,
): StageSideAssignment {
  const sourceSide: StageFactionSide = sourceTeam === 'player' ? 'player' : 'enemy';
  const isSupport = SUPPORT_LAYOUTS.has(profile.layout);
  const targetSide: StageFactionSide = isSupport ? sourceSide : (sourceSide === 'player' ? 'enemy' : 'player');
  return { sourceSide, targetSide, mirrorX: sourceSide === 'enemy' };
}

/**
 * Returns the actual Stage coordinate for a slot, applying X-mirror when
 * the source faction is on the RIGHT (enemy) side.
 * Neutral slots (arenaCenter, stageGround, skyEntry) are never mirrored.
 */
const NEUTRAL_SLOTS: ReadonlySet<StageSlotId> = new Set(['arenaCenter', 'stageGround', 'skyEntry']);

export function resolveStageSlotCoordinate(slot: StageSlotId, mirrorX: boolean): Readonly<StageVec3> {
  const base = STAGE_LAYOUT[slot];
  if (!mirrorX || NEUTRAL_SLOTS.has(slot) || base.x === 0) return base;
  return Object.freeze({ x: -base.x, y: base.y, z: base.z });
}

/** Direction sign from source to target in Stage X space. +1 = L→R, -1 = R→L. */
export function stageDirectionSign(assignment: StageSideAssignment): number {
  return assignment.mirrorX ? -1 : 1;
}

export type StagePilotId =
  | 'BASIC_MELEE'
  | 'FLAME_WAVE'
  | 'DEVOURING_ECLIPSE'
  | 'QA_MULTI_TARGET'
  | 'QA_SUPPORT_GROUP'
  | 'BASIC_RANGED'
  | 'SINGLE_TARGET_OFFENSIVE'
  | 'MULTI_TARGET_OFFENSIVE'
  | 'SINGLE_TARGET_HEAL'
  | 'GROUP_HEAL'
  | 'SELF_AND_ALLIES_SUPPORT'
  | 'SELF_BUFF'
  | 'SINGLE_ALLY_BUFF'
  | 'GROUP_BUFF'
  | 'SINGLE_TARGET_DEBUFF'
  | 'GROUP_DEBUFF'
  | 'MOVEMENT'
  | 'TELEPORT'
  | 'LEAP'
  | 'ARENA_ULTIMATE'
  | 'SKY_DESCENT_ULTIMATE'
  | 'BOSS_SIGNATURE';

/** Generic presentation family derived from action metadata. */
export type StagePresentationFamily = Exclude<StagePilotId, 'BASIC_MELEE' | 'FLAME_WAVE' | 'DEVOURING_ECLIPSE' | 'QA_MULTI_TARGET' | 'QA_SUPPORT_GROUP'>;

/** Presentation layout archetype — controls slot assignment and framing. */
export type StageLayoutType =
  | 'single_target'
  | 'multi_target_offensive'
  | 'support_single'
  | 'support_group'
  | 'self_aoe'
  | 'self_target'
  | 'movement'
  | 'arena_ultimate';

/** Profile-relative inter-phase timing gaps (presentation only, ms). */
export interface StagePhaseTiming {
  /** Pause after Stage enter completes, before action begins. */
  settleMs: number;
  /** Gap between VFX release and impact VFX reaching meaningful moment. */
  releaseToImpactMs: number;
  /** Gap between impact VFX and authoritative resolution / hit reaction. */
  impactToReactionMs: number;
  /** Gap between hit reaction and damage/heal feedback (float text). */
  reactionToFeedbackMs: number;
  /** Brief recovery hold before Stage exit begins. */
  recoveryMs: number;
}

export interface CombatStageProfile {
  id: StagePilotId;
  /** Runtime action spec.key values this profile activates for. */
  actionKeys: readonly string[];
  /** Presentation layout archetype. */
  layout: StageLayoutType;
  /** Half-height of the orthographic frustum, in world units (frontal framing). */
  cameraFrustumHalfHeight: number;
  /** Where impact/release VFX should appear (target area, AoE center, etc.). */
  impactAnchorSlot: StageSlotId;
  /** Where cast/aura/charge VFX should appear (at caster/source). */
  castAnchorSlot: StageSlotId;
  /** Attacker/caster slot at rest before motion starts. */
  actorStartSlot: StageSlotId;
  /** Attacker/caster slot at the moment of impact. */
  actorImpactSlot: StageSlotId;
  /** Primary opposing participant slot. */
  targetSlot: StageSlotId;
  /** All target slots for multi-target layouts. Single-element for single-target. */
  targetSlots: readonly StageSlotId[];
  /** Total scene-swap mask fade duration, in (ms) each direction. */
  transitionInMs: number;
  transitionOutMs: number;
  /** Extra readability hold after VFX completion, beyond impactHold. Seconds. */
  extraHoldSeconds: number;
  /** Reduced expensive punctuation (e.g. skip approach dash) under reducedGraphics. */
  reducedGraphicsSkipApproach?: boolean;
  /** Actor proxy windup/approach tween duration (actorStartSlot -> actorImpactSlot), ms. */
  approachMs: number;
  /** Actor proxy recoil tween duration (actorImpactSlot -> actorStartSlot) after impact, ms. */
  recoilMs: number;
  /** Impact/hit-reaction scale-punch duration, ms. */
  impactPulseMs: number;
  /** Presentation phase timing gaps. */
  phases: StagePhaseTiming;
  /** True for dev-QA-only profiles that should not activate in normal play. */
  qaOnly?: boolean;
  /** True for generic profiles derived from action metadata (not explicitly authored). */
  generic?: boolean;
  /** True for support layouts where the caster is also an affected target. */
  casterIncludedInTargets?: boolean;
}

/** Minimal action spec shape needed for generic Stage profile resolution. */
export interface ActionSpecForStage {
  key?: string;
  type?: string;
  offensive?: boolean;
  support?: boolean;
  self?: boolean;
  radius?: number;
  range?: readonly [number, number] | [number, number];
  mode?: string;
  dest?: boolean;
  targetMode?: string;
  healPercent?: number;
  flatHeal?: number;
  apRestore?: boolean;
  cure?: boolean;
  revive?: boolean;
  status?: string;
  ap?: number;
  shape?: string;
  effects?: readonly { kind: string; target?: string }[];
}

/** Minimal presentation shape needed for generic Stage profile resolution. */
export interface PresentationForStage {
  ultimate?: true;
  visualTier?: number;
  motionPreset?: string;
  castStyle?: string;
  scaleTier?: string;
}

const BASIC_MELEE: CombatStageProfile = {
  id: 'BASIC_MELEE',
  actionKeys: ['attack'],
  layout: 'single_target',
  cameraFrustumHalfHeight: 2.6,
  impactAnchorSlot: 'primaryTarget',
  castAnchorSlot: 'attackerImpact',
  actorStartSlot: 'attackerStart',
  actorImpactSlot: 'attackerImpact',
  targetSlot: 'primaryTarget',
  targetSlots: ['primaryTarget'],
  transitionInMs: 120,
  transitionOutMs: 100,
  extraHoldSeconds: 0.02,
  reducedGraphicsSkipApproach: true,
  approachMs: 190,
  recoilMs: 130,
  impactPulseMs: 140,
  phases: { settleMs: 60, releaseToImpactMs: 0, impactToReactionMs: 30, reactionToFeedbackMs: 0, recoveryMs: 80 },
};

const FLAME_WAVE: CombatStageProfile = {
  id: 'FLAME_WAVE',
  actionKeys: ['n_flame_wave'],
  layout: 'multi_target_offensive',
  cameraFrustumHalfHeight: 3.1,
  impactAnchorSlot: 'targetCenter',
  castAnchorSlot: 'casterSlot',
  actorStartSlot: 'casterSlot',
  actorImpactSlot: 'casterSlot',
  targetSlot: 'targetCenter',
  targetSlots: ['targetLeft', 'targetCenter', 'targetRight'],
  transitionInMs: 140,
  transitionOutMs: 120,
  extraHoldSeconds: 0.12,
  approachMs: 0,
  recoilMs: 0,
  impactPulseMs: 240,
  phases: { settleMs: 80, releaseToImpactMs: 50, impactToReactionMs: 50, reactionToFeedbackMs: 30, recoveryMs: 120 },
};

const DEVOURING_ECLIPSE: CombatStageProfile = {
  id: 'DEVOURING_ECLIPSE',
  actionKeys: ['d_devouring_eclipse'],
  layout: 'arena_ultimate',
  cameraFrustumHalfHeight: 3.6,
  impactAnchorSlot: 'arenaCenter',
  castAnchorSlot: 'casterSlot',
  actorStartSlot: 'casterSlot',
  actorImpactSlot: 'casterSlot',
  targetSlot: 'targetCenter',
  targetSlots: ['targetCenter', 'targetLeft', 'targetRight'],
  transitionInMs: 160,
  transitionOutMs: 140,
  extraHoldSeconds: 0.32,
  approachMs: 0,
  recoilMs: 0,
  impactPulseMs: 380,
  phases: { settleMs: 100, releaseToImpactMs: 80, impactToReactionMs: 60, reactionToFeedbackMs: 40, recoveryMs: 200 },
};

const QA_MULTI_TARGET: CombatStageProfile = {
  id: 'QA_MULTI_TARGET',
  actionKeys: ['__qa_multi_target'],
  layout: 'multi_target_offensive',
  cameraFrustumHalfHeight: 3.1,
  impactAnchorSlot: 'targetCenter',
  castAnchorSlot: 'casterSlot',
  actorStartSlot: 'casterSlot',
  actorImpactSlot: 'casterSlot',
  targetSlot: 'targetCenter',
  targetSlots: ['targetLeft', 'targetCenter', 'targetRight'],
  transitionInMs: 140,
  transitionOutMs: 120,
  extraHoldSeconds: 0.12,
  approachMs: 0,
  recoilMs: 0,
  impactPulseMs: 240,
  phases: { settleMs: 80, releaseToImpactMs: 50, impactToReactionMs: 50, reactionToFeedbackMs: 30, recoveryMs: 120 },
  qaOnly: true,
};

const QA_SUPPORT_GROUP: CombatStageProfile = {
  id: 'QA_SUPPORT_GROUP',
  actionKeys: ['__qa_support_group'],
  layout: 'support_group',
  cameraFrustumHalfHeight: 3.1,
  impactAnchorSlot: 'allyCenter',
  castAnchorSlot: 'casterCenter',
  actorStartSlot: 'casterCenter',
  actorImpactSlot: 'casterCenter',
  targetSlot: 'allyCenter',
  targetSlots: ['allyLeft', 'allyCenter', 'allyRight'],
  transitionInMs: 140,
  transitionOutMs: 120,
  extraHoldSeconds: 0.15,
  approachMs: 0,
  recoilMs: 0,
  impactPulseMs: 220,
  phases: { settleMs: 80, releaseToImpactMs: 40, impactToReactionMs: 40, reactionToFeedbackMs: 30, recoveryMs: 120 },
  qaOnly: true,
};

export const COMBAT_STAGE_PROFILES: readonly CombatStageProfile[] = Object.freeze([
  BASIC_MELEE,
  FLAME_WAVE,
  DEVOURING_ECLIPSE,
  QA_MULTI_TARGET,
  QA_SUPPORT_GROUP,
]);

// ----------------------------------------------------------- generic profiles

function genericProfile(
  id: StagePresentationFamily,
  layout: StageLayoutType,
  cameraFrustumHalfHeight: number,
  impactAnchorSlot: StageSlotId,
  castAnchorSlot: StageSlotId,
  actorStartSlot: StageSlotId,
  actorImpactSlot: StageSlotId,
  targetSlot: StageSlotId,
  targetSlots: readonly StageSlotId[],
  transitionInMs: number,
  transitionOutMs: number,
  extraHoldSeconds: number,
  approachMs: number,
  recoilMs: number,
  impactPulseMs: number,
  phases: StagePhaseTiming,
  casterIncludedInTargets?: boolean,
): CombatStageProfile {
  return {
    id,
    actionKeys: [],
    layout,
    cameraFrustumHalfHeight,
    impactAnchorSlot,
    castAnchorSlot,
    actorStartSlot,
    actorImpactSlot,
    targetSlot,
    targetSlots,
    transitionInMs,
    transitionOutMs,
    extraHoldSeconds,
    approachMs,
    recoilMs,
    impactPulseMs,
    phases,
    generic: true,
    ...(casterIncludedInTargets ? { casterIncludedInTargets } : {}),
  };
}

const GENERIC_BASIC_RANGED: CombatStageProfile = genericProfile(
  'BASIC_RANGED', 'single_target', 2.6,
  'primaryTarget', 'casterSlot', 'casterSlot', 'casterSlot',
  'primaryTarget', ['primaryTarget'],
  120, 100, 0.02, 0, 0, 140,
  { settleMs: 50, releaseToImpactMs: 0, impactToReactionMs: 25, reactionToFeedbackMs: 0, recoveryMs: 70 },
);

const GENERIC_SINGLE_TARGET_OFFENSIVE: CombatStageProfile = genericProfile(
  'SINGLE_TARGET_OFFENSIVE', 'single_target', 2.6,
  'primaryTarget', 'attackerImpact', 'attackerStart', 'attackerImpact',
  'primaryTarget', ['primaryTarget'],
  120, 100, 0.04, 160, 120, 140,
  { settleMs: 50, releaseToImpactMs: 0, impactToReactionMs: 25, reactionToFeedbackMs: 0, recoveryMs: 70 },
);

const GENERIC_MULTI_TARGET_OFFENSIVE: CombatStageProfile = genericProfile(
  'MULTI_TARGET_OFFENSIVE', 'multi_target_offensive', 3.1,
  'targetCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'targetCenter', ['targetLeft', 'targetCenter', 'targetRight'],
  140, 120, 0.10, 0, 0, 220,
  { settleMs: 70, releaseToImpactMs: 30, impactToReactionMs: 40, reactionToFeedbackMs: 20, recoveryMs: 90 },
);

const GENERIC_SINGLE_TARGET_HEAL: CombatStageProfile = genericProfile(
  'SINGLE_TARGET_HEAL', 'support_single', 2.6,
  'allyCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'allyCenter', ['allyCenter'],
  120, 100, 0.06, 0, 0, 160,
  { settleMs: 50, releaseToImpactMs: 0, impactToReactionMs: 30, reactionToFeedbackMs: 0, recoveryMs: 80 },
);

const GENERIC_GROUP_HEAL: CombatStageProfile = genericProfile(
  'GROUP_HEAL', 'support_group', 3.1,
  'allyCenter', 'casterCenter', 'casterCenter', 'casterCenter',
  'allyCenter', ['allyLeft', 'allyCenter', 'allyRight'],
  140, 120, 0.12, 0, 0, 200,
  { settleMs: 70, releaseToImpactMs: 20, impactToReactionMs: 35, reactionToFeedbackMs: 20, recoveryMs: 100 },
  true,
);

const GENERIC_SELF_AND_ALLIES_SUPPORT: CombatStageProfile = genericProfile(
  'SELF_AND_ALLIES_SUPPORT', 'support_group', 3.1,
  'allyCenter', 'casterCenter', 'casterCenter', 'casterCenter',
  'allyCenter', ['allyLeft', 'allyCenter', 'allyRight'],
  140, 120, 0.10, 0, 0, 200,
  { settleMs: 70, releaseToImpactMs: 20, impactToReactionMs: 35, reactionToFeedbackMs: 20, recoveryMs: 100 },
  true,
);

const GENERIC_SELF_BUFF: CombatStageProfile = genericProfile(
  'SELF_BUFF', 'self_target', 2.4,
  'casterSlot', 'casterSlot', 'casterSlot', 'casterSlot',
  'casterSlot', ['casterSlot'],
  120, 100, 0.04, 0, 0, 140,
  { settleMs: 40, releaseToImpactMs: 0, impactToReactionMs: 20, reactionToFeedbackMs: 0, recoveryMs: 60 },
);

const GENERIC_SINGLE_ALLY_BUFF: CombatStageProfile = genericProfile(
  'SINGLE_ALLY_BUFF', 'support_single', 2.6,
  'allyCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'allyCenter', ['allyCenter'],
  120, 100, 0.06, 0, 0, 160,
  { settleMs: 50, releaseToImpactMs: 0, impactToReactionMs: 25, reactionToFeedbackMs: 0, recoveryMs: 70 },
);

const GENERIC_GROUP_BUFF: CombatStageProfile = genericProfile(
  'GROUP_BUFF', 'support_group', 3.1,
  'allyCenter', 'casterCenter', 'casterCenter', 'casterCenter',
  'allyCenter', ['allyLeft', 'allyCenter', 'allyRight'],
  140, 120, 0.10, 0, 0, 200,
  { settleMs: 70, releaseToImpactMs: 20, impactToReactionMs: 35, reactionToFeedbackMs: 20, recoveryMs: 100 },
  true,
);

const GENERIC_SINGLE_TARGET_DEBUFF: CombatStageProfile = genericProfile(
  'SINGLE_TARGET_DEBUFF', 'single_target', 2.6,
  'primaryTarget', 'casterSlot', 'casterSlot', 'casterSlot',
  'primaryTarget', ['primaryTarget'],
  120, 100, 0.04, 0, 0, 140,
  { settleMs: 50, releaseToImpactMs: 0, impactToReactionMs: 25, reactionToFeedbackMs: 0, recoveryMs: 70 },
);

const GENERIC_GROUP_DEBUFF: CombatStageProfile = genericProfile(
  'GROUP_DEBUFF', 'multi_target_offensive', 3.1,
  'targetCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'targetCenter', ['targetLeft', 'targetCenter', 'targetRight'],
  140, 120, 0.08, 0, 0, 200,
  { settleMs: 60, releaseToImpactMs: 20, impactToReactionMs: 30, reactionToFeedbackMs: 15, recoveryMs: 80 },
);

const GENERIC_MOVEMENT: CombatStageProfile = genericProfile(
  'MOVEMENT', 'movement', 2.6,
  'casterSlot', 'casterSlot', 'casterSlot', 'casterSlot',
  'casterSlot', ['casterSlot'],
  120, 100, 0.02, 0, 0, 120,
  { settleMs: 40, releaseToImpactMs: 0, impactToReactionMs: 20, reactionToFeedbackMs: 0, recoveryMs: 60 },
);

const GENERIC_TELEPORT: CombatStageProfile = genericProfile(
  'TELEPORT', 'movement', 2.6,
  'casterSlot', 'casterSlot', 'casterSlot', 'casterSlot',
  'casterSlot', ['casterSlot'],
  120, 100, 0.02, 0, 0, 120,
  { settleMs: 40, releaseToImpactMs: 0, impactToReactionMs: 20, reactionToFeedbackMs: 0, recoveryMs: 60 },
);

const GENERIC_LEAP: CombatStageProfile = genericProfile(
  'LEAP', 'movement', 2.6,
  'casterSlot', 'casterSlot', 'casterSlot', 'casterSlot',
  'casterSlot', ['casterSlot'],
  120, 100, 0.02, 0, 0, 140,
  { settleMs: 40, releaseToImpactMs: 0, impactToReactionMs: 20, reactionToFeedbackMs: 0, recoveryMs: 60 },
);

const GENERIC_ARENA_ULTIMATE: CombatStageProfile = genericProfile(
  'ARENA_ULTIMATE', 'arena_ultimate', 3.6,
  'arenaCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'targetCenter', ['targetCenter', 'targetLeft', 'targetRight'],
  160, 140, 0.28, 0, 0, 340,
  { settleMs: 100, releaseToImpactMs: 60, impactToReactionMs: 50, reactionToFeedbackMs: 30, recoveryMs: 180 },
);

const GENERIC_SKY_DESCENT_ULTIMATE: CombatStageProfile = genericProfile(
  'SKY_DESCENT_ULTIMATE', 'arena_ultimate', 3.6,
  'arenaCenter', 'casterSlot', 'casterSlot', 'casterSlot',
  'targetCenter', ['targetCenter', 'targetLeft', 'targetRight'],
  160, 140, 0.28, 0, 0, 340,
  { settleMs: 100, releaseToImpactMs: 80, impactToReactionMs: 50, reactionToFeedbackMs: 30, recoveryMs: 180 },
);

const GENERIC_BOSS_SIGNATURE: CombatStageProfile = genericProfile(
  'BOSS_SIGNATURE', 'single_target', 3.2,
  'primaryTarget', 'attackerImpact', 'attackerStart', 'attackerImpact',
  'primaryTarget', ['primaryTarget'],
  150, 130, 0.16, 180, 140, 280,
  { settleMs: 80, releaseToImpactMs: 30, impactToReactionMs: 40, reactionToFeedbackMs: 20, recoveryMs: 120 },
);

const GENERIC_PROFILE_BY_FAMILY: ReadonlyMap<StagePresentationFamily, CombatStageProfile> = new Map(
  ([
    GENERIC_BASIC_RANGED,
    GENERIC_SINGLE_TARGET_OFFENSIVE,
    GENERIC_MULTI_TARGET_OFFENSIVE,
    GENERIC_SINGLE_TARGET_HEAL,
    GENERIC_GROUP_HEAL,
    GENERIC_SELF_AND_ALLIES_SUPPORT,
    GENERIC_SELF_BUFF,
    GENERIC_SINGLE_ALLY_BUFF,
    GENERIC_GROUP_BUFF,
    GENERIC_SINGLE_TARGET_DEBUFF,
    GENERIC_GROUP_DEBUFF,
    GENERIC_MOVEMENT,
    GENERIC_TELEPORT,
    GENERIC_LEAP,
    GENERIC_ARENA_ULTIMATE,
    GENERIC_SKY_DESCENT_ULTIMATE,
    GENERIC_BOSS_SIGNATURE,
  ] as const).map((p) => [p.id as StagePresentationFamily, p]),
);

// ----------------------------------------------------------- classification

const SKY_DESCENT_KEYS = new Set(['n_dark_meteor']);

export function classifyActionPresentation(
  spec: ActionSpecForStage,
  presentation?: PresentationForStage | null,
): StagePresentationFamily {
  const isUltimate = Boolean(presentation?.ultimate);
  const isBossSig = presentation?.visualTier === 6;
  const hasRadius = Boolean(spec.radius && spec.radius > 0);
  const isMove = spec.type === 'move' || (spec.mode && ['teleport', 'swap', 'leap', 'retreat', 'dash', 'strike'].includes(spec.mode));

  if (isUltimate) {
    if (SKY_DESCENT_KEYS.has(spec.key ?? '') || (spec.type === 'mag' && hasRadius && presentation?.castStyle === 'ultimateCast' && spec.key?.includes('meteor'))) {
      return 'SKY_DESCENT_ULTIMATE';
    }
    // Ultimate support actions use support family layouts for proper faction-side slots
    if (spec.support === true || spec.type === 'heal' || spec.type === 'revive' || spec.type === 'buff') {
      const hasHealEffect = Boolean(spec.effects?.some((e) => e.kind === 'heal' || e.kind === 'revive'));
      const isHeal = spec.type === 'heal' || spec.type === 'revive' || Boolean(spec.healPercent || spec.flatHeal) || hasHealEffect;
      if (isHeal) return hasRadius ? 'GROUP_HEAL' : 'SINGLE_TARGET_HEAL';
      if (spec.self && !hasRadius) return 'SELF_BUFF';
      if (hasRadius) return 'GROUP_BUFF';
      return 'SINGLE_ALLY_BUFF';
    }
    return 'ARENA_ULTIMATE';
  }

  if (isBossSig) return 'BOSS_SIGNATURE';

  if (isMove) {
    if (spec.mode === 'teleport' || spec.mode === 'swap') return 'TELEPORT';
    if (spec.mode === 'leap') return 'LEAP';
    return 'MOVEMENT';
  }

  if (spec.self && spec.offensive && hasRadius) {
    return 'MULTI_TARGET_OFFENSIVE';
  }

  if (spec.self && !spec.offensive) {
    if (hasRadius && spec.support) return 'SELF_AND_ALLIES_SUPPORT';
    return 'SELF_BUFF';
  }

  if (spec.support || spec.type === 'heal' || spec.type === 'revive' || spec.type === 'buff') {
    const hasHealEffect = Boolean(spec.effects?.some((e) => e.kind === 'heal' || e.kind === 'revive'));
    const isHeal = spec.type === 'heal' || spec.type === 'revive' || Boolean(spec.healPercent || spec.flatHeal) || hasHealEffect;
    if (isHeal) {
      return hasRadius ? 'GROUP_HEAL' : 'SINGLE_TARGET_HEAL';
    }
    return hasRadius ? 'GROUP_BUFF' : 'SINGLE_ALLY_BUFF';
  }

  if (spec.type === 'debuff') {
    return hasRadius ? 'GROUP_DEBUFF' : 'SINGLE_TARGET_DEBUFF';
  }

  if (spec.offensive) {
    if (hasRadius) return 'MULTI_TARGET_OFFENSIVE';
    if (presentation?.motionPreset === 'ranged_attack') return 'BASIC_RANGED';
    return 'SINGLE_TARGET_OFFENSIVE';
  }

  return 'SINGLE_TARGET_OFFENSIVE';
}

// ----------------------------------------------------------- presentation routing

/** Deterministic presentation route for a combat action. */
export interface ActionPresentationRoute {
  route: 'stage' | 'tactical';
  reason: string;
  family: string;
}

/** Movement modes that indicate a repositioning action. */
const MOVEMENT_MODES = new Set(['teleport', 'swap', 'leap', 'retreat', 'dash', 'strike']);

/**
 * Resolves the presentation route for a combat action.
 *
 * Priority:
 * 1. ULTIMATE → STAGE (regardless of function)
 * 2. NON-ULTIMATE offensive/hostile control → STAGE
 * 3. NON-ULTIMATE support/heal/buff/cleanse/revive → TACTICAL
 * 4. NON-ULTIMATE movement/teleport/leap/reposition → TACTICAL
 * 5. Fallback → STAGE (safety)
 */
export function resolvePresentationRoute(
  spec?: ActionSpecForStage | null,
  presentation?: PresentationForStage | null,
): ActionPresentationRoute {
  if (!spec?.key) return { route: 'tactical', reason: 'no-key', family: 'NONE' };

  const isUltimate = Boolean(presentation?.ultimate);
  const isMove = spec.type === 'move' || (spec.mode != null && MOVEMENT_MODES.has(spec.mode));
  const isSupport = spec.support === true || spec.type === 'heal' || spec.type === 'revive' || spec.type === 'buff';
  const isOffensive = spec.offensive === true || spec.type === 'debuff';

  // 1. Ultimate → STAGE (highest priority, regardless of function)
  if (isUltimate) {
    return { route: 'stage', reason: 'ultimate', family: 'ULTIMATE' };
  }

  // 2. Non-ultimate offensive/hostile control → STAGE
  if (isOffensive) {
    const family = classifyActionPresentation(spec, presentation);
    return { route: 'stage', reason: 'offensive', family };
  }

  // 3. Non-ultimate support/heal/buff/cleanse/revive → TACTICAL
  if (isSupport) {
    return { route: 'tactical', reason: 'support', family: 'SUPPORT' };
  }

  // 4. Non-ultimate movement/teleport/leap/reposition → TACTICAL
  if (isMove) {
    return { route: 'tactical', reason: 'movement', family: 'MOVEMENT' };
  }

  // 5. Fallback → STAGE (safety — no action should be silently unclassified)
  return { route: 'stage', reason: 'fallback', family: 'SINGLE_TARGET_OFFENSIVE' };
}

// ----------------------------------------------------------- resolvers

/** Non-QA profiles only — used by resolveCombatStageProfile for normal play. */
const PLAY_PROFILES: readonly CombatStageProfile[] = Object.freeze(
  COMBAT_STAGE_PROFILES.filter((profile) => !profile.qaOnly),
);

const PROFILE_BY_ACTION_KEY: ReadonlyMap<string, CombatStageProfile> = new Map(
  COMBAT_STAGE_PROFILES.flatMap((profile) => profile.actionKeys.map((key) => [key, profile] as const)),
);

const PLAY_PROFILE_BY_ACTION_KEY: ReadonlyMap<string, CombatStageProfile> = new Map(
  PLAY_PROFILES.flatMap((profile) => profile.actionKeys.map((key) => [key, profile] as const)),
);

/** Returns the explicit Stage profile for a runtime action spec, or undefined. Excludes QA-only and generic profiles. */
export function resolveCombatStageProfile(spec?: { key?: string } | null): CombatStageProfile | undefined {
  if (!spec?.key) return undefined;
  return PLAY_PROFILE_BY_ACTION_KEY.get(spec.key);
}

/** Returns ANY profile including QA-only ones. Used by dev QA harness. */
export function resolveCombatStageProfileIncludingQA(spec?: { key?: string } | null): CombatStageProfile | undefined {
  if (!spec?.key) return undefined;
  return PROFILE_BY_ACTION_KEY.get(spec.key);
}

/**
 * Semantic resolver: returns a Stage profile only for actions routed to Stage.
 * Tactical-routed actions (non-ultimate support/movement) return undefined.
 * Returns undefined only for null/empty specs or tactical-routed actions.
 */
export function resolveCombatStageProfileUniversal(
  spec?: ActionSpecForStage | null,
  presentation?: PresentationForStage | null,
): CombatStageProfile | undefined {
  if (!spec?.key) return undefined;

  const route = resolvePresentationRoute(spec, presentation);
  if (route.route !== 'stage') return undefined;

  const explicit = PLAY_PROFILE_BY_ACTION_KEY.get(spec.key);
  if (explicit) return explicit;

  const qa = PROFILE_BY_ACTION_KEY.get(spec.key);
  if (qa) return qa;

  const family = classifyActionPresentation(spec, presentation);
  return GENERIC_PROFILE_BY_FAMILY.get(family) ?? GENERIC_PROFILE_BY_FAMILY.get('SINGLE_TARGET_OFFENSIVE');
}

/** An action is Stage-eligible only when its presentation route resolves to 'stage'. */
export function isStageEligibleAction(
  spec?: ActionSpecForStage | null,
  presentation?: PresentationForStage | null,
): boolean {
  if (!spec?.key) return false;
  return resolvePresentationRoute(spec, presentation).route === 'stage';
}

/** Returns resolved profile info for QA/debug display. */
export function getStageProfileInfo(
  spec?: ActionSpecForStage | null,
  presentation?: PresentationForStage | null,
): { id: string; layout: StageLayoutType; explicit: boolean; impactAnchor: StageSlotId; sourceSlot: StageSlotId } | null {
  if (!spec?.key) return null;
  const explicit = PLAY_PROFILE_BY_ACTION_KEY.get(spec.key);
  if (explicit) return { id: explicit.id, layout: explicit.layout, explicit: true, impactAnchor: explicit.impactAnchorSlot, sourceSlot: explicit.actorStartSlot };
  const qa = PROFILE_BY_ACTION_KEY.get(spec.key);
  if (qa) return { id: qa.id, layout: qa.layout, explicit: false, impactAnchor: qa.impactAnchorSlot, sourceSlot: qa.actorStartSlot };
  const family = classifyActionPresentation(spec, presentation);
  const generic = GENERIC_PROFILE_BY_FAMILY.get(family) ?? GENERIC_PROFILE_BY_FAMILY.get('SINGLE_TARGET_OFFENSIVE')!;
  return { id: generic.id, layout: generic.layout, explicit: false, impactAnchor: generic.impactAnchorSlot, sourceSlot: generic.actorStartSlot };
}
