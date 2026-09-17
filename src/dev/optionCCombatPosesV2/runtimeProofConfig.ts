import type { CombatPose } from '../../combat/stage/CombatPoseRegistry';
import type { CombatStageProfile, StageSlotId } from '../../combat/stage/combatStageProfiles';
import manifestJson from '../../render/generated/characterSystemV2Manifest.json';

export type PilotUnitId =
  | 'alistair'
  | 'goblin'
  | 'lion-champion'
  | 'canvas-512'
  | 'canvas-640x512'
  | 'canvas-512x640'
  | 'canvas-640x640';
export type RuntimeProofScenarioId =
  | 'alistair-vs-goblin'
  | 'alistair-vs-lion-champion'
  | 'all-three'
  | 'canvas-512'
  | 'canvas-640x512'
  | 'canvas-512x640'
  | 'canvas-640x640';
export type RuntimeProofEnvironmentId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';

export interface PilotRuntimeUnit {
  id: PilotUnitId;
  combatPoseUnitId: string;
  pose: CombatPose;
  displayName: string;
  imageUrl: string;
  manifestUrl: string;
  scaleCorrection: 1;
  targetWorldHeight: number;
  sourceSizePx: readonly [number, number];
  footBaselinePx: number;
  pivotPx: readonly [number, number];
  alphaBBoxPx: readonly [number, number, number, number];
  worldUnitsPerPixel: number;
  team: 'player' | 'foe';
  contactShadowSize: readonly [number, number];
}

interface ManifestPose {
  src: string;
  sourceSizePx: { width: number; height: number };
  alphaBoundsPx: { left: number; top: number; right: number; bottom: number };
  anchor: { x: number; y: number };
  scaleCorrection: number;
}

interface ManifestUnit {
  unitId: string;
  worldUnitsPerPixel: number;
  poses: Record<CombatPose, ManifestPose>;
}

const manifest = manifestJson as unknown as { units: ManifestUnit[] };
const unitById = new Map(manifest.units.map((unit) => [unit.unitId, unit]));

function proofUnit(
  id: PilotUnitId,
  combatPoseUnitId: string,
  pose: CombatPose,
  displayName: string,
  team: 'player' | 'foe',
  contactShadowSize: readonly [number, number],
): PilotRuntimeUnit {
  const unit = unitById.get(combatPoseUnitId);
  const asset = unit?.poses[pose];
  if (!unit || !asset || asset.scaleCorrection !== 1) {
    throw new Error(`Missing promoted runtime-proof asset ${combatPoseUnitId}:${pose}.`);
  }
  const bounds = asset.alphaBoundsPx;
  return Object.freeze({
    id,
    combatPoseUnitId,
    pose,
    displayName,
    imageUrl: asset.src,
    manifestUrl: '/assets/characters/pixel/character-system-v2-manifest.json',
    scaleCorrection: 1,
    targetWorldHeight: (asset.anchor.y - bounds.top) * unit.worldUnitsPerPixel,
    sourceSizePx: [asset.sourceSizePx.width, asset.sourceSizePx.height] as const,
    footBaselinePx: asset.anchor.y,
    pivotPx: [asset.anchor.x, asset.anchor.y] as const,
    alphaBBoxPx: [bounds.left, bounds.top, bounds.right, bounds.bottom] as const,
    worldUnitsPerPixel: unit.worldUnitsPerPixel,
    team,
    contactShadowSize,
  });
}

export const PILOT_RUNTIME_UNITS: Readonly<Record<PilotUnitId, PilotRuntimeUnit>> = Object.freeze({
  alistair: proofUnit('alistair', 'alistair', 'prepare', 'Alistair', 'player', [1.42, 0.58]),
  goblin: proofUnit('goblin', 'goblin', 'prepare', 'Goblin', 'foe', [1.05, 0.44]),
  'lion-champion': proofUnit('lion-champion', 'lion_champion', 'prepare', 'Lion Champion', 'foe', [1.86, 0.76]),
  'canvas-512': proofUnit('canvas-512', 'archer', 'prepare', '512×512 Prepare', 'player', [1.42, 0.58]),
  'canvas-640x512': proofUnit('canvas-640x512', 'alistair', 'attack', '640×512 Attack', 'foe', [1.42, 0.58]),
  'canvas-512x640': proofUnit('canvas-512x640', 'forest_troll_elite', 'cast', '512×640 Cast', 'foe', [1.86, 0.76]),
  'canvas-640x640': proofUnit('canvas-640x640', 'lion_champion', 'cast', '640×640 Cast', 'foe', [1.86, 0.76]),
});

export interface RuntimeProofScenario {
  id: RuntimeProofScenarioId;
  label: string;
  environmentId: RuntimeProofEnvironmentId;
  environmentAssetId: `${RuntimeProofEnvironmentId}_stage`;
  attacker: PilotUnitId;
  targets: readonly PilotUnitId[];
  profile: CombatStageProfile;
}

function proofProfile(
  targetSlots: readonly StageSlotId[],
  cameraFrustumHalfHeight: number,
): CombatStageProfile {
  return Object.freeze({
    id: targetSlots.length > 1 ? 'QA_MULTI_TARGET' : 'BASIC_MELEE',
    actionKeys: ['__character_system_v2_runtime_proof'],
    layout: targetSlots.length > 1 ? 'multi_target_offensive' : 'single_target',
    cameraFrustumHalfHeight,
    impactAnchorSlot: targetSlots[0] ?? 'primaryTarget',
    castAnchorSlot: 'attackerStart',
    actorStartSlot: 'attackerStart',
    actorImpactSlot: 'attackerImpact',
    targetSlot: targetSlots[0] ?? 'primaryTarget',
    targetSlots,
    transitionInMs: 0,
    transitionOutMs: 0,
    extraHoldSeconds: 0,
    approachMs: 0,
    recoilMs: 0,
    impactPulseMs: 140,
    phases: {
      settleMs: 0,
      releaseToImpactMs: 0,
      impactToReactionMs: 0,
      reactionToFeedbackMs: 0,
      recoveryMs: 0,
    },
    qaOnly: true,
  });
}

export const RUNTIME_PROOF_SCENARIOS: Readonly<Record<RuntimeProofScenarioId, RuntimeProofScenario>> = Object.freeze({
  'alistair-vs-goblin': Object.freeze({
    id: 'alistair-vs-goblin',
    label: 'Alistair vs Goblin',
    environmentId: 'forest_route',
    environmentAssetId: 'forest_route_stage',
    attacker: 'alistair',
    targets: ['goblin'] as const,
    profile: proofProfile(['primaryTarget'], 2.6),
  }),
  'alistair-vs-lion-champion': Object.freeze({
    id: 'alistair-vs-lion-champion',
    label: 'Alistair vs Lion Champion',
    environmentId: 'lion_sanctum',
    environmentAssetId: 'lion_sanctum_stage',
    attacker: 'alistair',
    targets: ['lion-champion'] as const,
    profile: proofProfile(['primaryTarget'], 2.6),
  }),
  'all-three': Object.freeze({
    id: 'all-three',
    label: 'Production scale hierarchy',
    environmentId: 'bois_clair_burning',
    environmentAssetId: 'bois_clair_burning_stage',
    attacker: 'alistair',
    targets: ['goblin', 'lion-champion'] as const,
    profile: proofProfile(['secondaryTargetLeft', 'secondaryTargetRight'], 3.1),
  }),
  'canvas-512': Object.freeze({
    id: 'canvas-512',
    label: '512×512 prepare production proof',
    environmentId: 'forest_route',
    environmentAssetId: 'forest_route_stage',
    attacker: 'canvas-512',
    targets: [] as const,
    profile: proofProfile([], 2.8),
  }),
  'canvas-640x512': Object.freeze({
    id: 'canvas-640x512',
    label: '640×512 attack production proof',
    environmentId: 'forest_route',
    environmentAssetId: 'forest_route_stage',
    attacker: 'canvas-640x512',
    targets: [] as const,
    profile: proofProfile([], 2.8),
  }),
  'canvas-512x640': Object.freeze({
    id: 'canvas-512x640',
    label: '512×640 cast production proof',
    environmentId: 'bois_clair_burning',
    environmentAssetId: 'bois_clair_burning_stage',
    attacker: 'canvas-512x640',
    targets: [] as const,
    profile: proofProfile([], 3.2),
  }),
  'canvas-640x640': Object.freeze({
    id: 'canvas-640x640',
    label: '640×640 cast production proof',
    environmentId: 'lion_sanctum',
    environmentAssetId: 'lion_sanctum_stage',
    attacker: 'canvas-640x640',
    targets: [] as const,
    profile: proofProfile([], 3.2),
  }),
});

export function visibleAlphaHeightPx(unit: PilotRuntimeUnit): number {
  return unit.footBaselinePx - unit.alphaBBoxPx[1];
}

export function worldUnitsPerSourcePixel(unit: PilotRuntimeUnit): number {
  return unit.worldUnitsPerPixel;
}

export function runtimePlaneSize(unit: PilotRuntimeUnit): readonly [number, number] {
  return [
    unit.sourceSizePx[0] * unit.worldUnitsPerPixel,
    unit.sourceSizePx[1] * unit.worldUnitsPerPixel,
  ];
}

export function parseRuntimeProofScenario(value: string | null): RuntimeProofScenario {
  if (value && value in RUNTIME_PROOF_SCENARIOS) {
    return RUNTIME_PROOF_SCENARIOS[value as RuntimeProofScenarioId];
  }
  return RUNTIME_PROOF_SCENARIOS['all-three'];
}

export function parseRuntimeProofEnvironment(
  value: string | null,
  fallback: RuntimeProofEnvironmentId,
): RuntimeProofEnvironmentId {
  const normalized = value?.replace(/_stage$/, '') ?? '';
  if (normalized === 'forest_route' || normalized === 'bois_clair_burning' || normalized === 'lion_sanctum') {
    return normalized;
  }
  return fallback;
}
