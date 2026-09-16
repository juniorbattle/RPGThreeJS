import type { CombatStageProfile, StageSlotId } from '../../combat/stage/combatStageProfiles';

export type PilotUnitId = 'alistair' | 'goblin' | 'lion-champion';
export type RuntimeProofScenarioId = 'alistair-vs-goblin' | 'alistair-vs-lion-champion' | 'all-three';
export type RuntimeProofEnvironmentId = 'forest_route' | 'bois_clair_burning' | 'lion_sanctum';

export interface PilotRuntimeUnit {
  id: PilotUnitId;
  displayName: string;
  imageUrl: string;
  manifestUrl: string;
  deliveryFitScale: number;
  scaleCorrection: 1;
  targetWorldHeight: number;
  canvasPx: 512;
  footBaselinePx: number;
  pivotPx: readonly [number, number];
  idleAlphaBBoxPx: readonly [number, number, number, number];
  team: 'player' | 'foe';
  contactShadowSize: readonly [number, number];
}

export const PILOT_RUNTIME_UNITS: Readonly<Record<PilotUnitId, PilotRuntimeUnit>> = Object.freeze({
  alistair: Object.freeze({
    id: 'alistair',
    displayName: 'Alistair',
    imageUrl: '/assets/dev/option-c/combat-poses-v2/split-poses/alistair/alistair-idle.png',
    manifestUrl: '/assets/dev/option-c/combat-poses-v2/manifests/alistair-manifest.json',
    deliveryFitScale: 0.68,
    scaleCorrection: 1,
    targetWorldHeight: 2.1,
    canvasPx: 512,
    footBaselinePx: 431,
    pivotPx: [256, 431] as const,
    idleAlphaBBoxPx: [129, 185, 382, 431] as const,
    team: 'player',
    contactShadowSize: [1.42, 0.58] as const,
  }),
  goblin: Object.freeze({
    id: 'goblin',
    displayName: 'Goblin',
    imageUrl: '/assets/dev/option-c/combat-poses-v2/split-poses/goblin/goblin-idle.png',
    manifestUrl: '/assets/dev/option-c/combat-poses-v2/manifests/goblin-manifest.json',
    deliveryFitScale: 0.5,
    scaleCorrection: 1,
    targetWorldHeight: 1.6,
    canvasPx: 512,
    footBaselinePx: 384,
    pivotPx: [256, 384] as const,
    idleAlphaBBoxPx: [162, 177, 350, 384] as const,
    team: 'foe',
    contactShadowSize: [1.05, 0.44] as const,
  }),
  'lion-champion': Object.freeze({
    id: 'lion-champion',
    displayName: 'Lion Champion',
    imageUrl: '/assets/dev/option-c/combat-poses-v2/split-poses/lion-champion/lion-champion-idle.png',
    manifestUrl: '/assets/dev/option-c/combat-poses-v2/manifests/lion-champion-manifest.json',
    deliveryFitScale: 0.74,
    scaleCorrection: 1,
    targetWorldHeight: 2.8,
    canvasPx: 512,
    footBaselinePx: 446,
    pivotPx: [256, 446] as const,
    idleAlphaBBoxPx: [121, 157, 390, 446] as const,
    team: 'foe',
    contactShadowSize: [1.86, 0.76] as const,
  }),
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
    actionKeys: ['__option_c_combat_poses_v2_runtime_proof'],
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
    label: 'Pilot comparison — actual runtime scale',
    environmentId: 'bois_clair_burning',
    environmentAssetId: 'bois_clair_burning_stage',
    attacker: 'alistair',
    targets: ['goblin', 'lion-champion'] as const,
    // Existing semantic Stage slots, spread across the frontal camera for an
    // unobstructed three-unit scale comparison. No production profile changes.
    profile: proofProfile(['arenaCenter', 'primaryTarget'], 3.1),
  }),
});

export function visibleAlphaHeightPx(unit: PilotRuntimeUnit): number {
  return unit.idleAlphaBBoxPx[3] - unit.idleAlphaBBoxPx[1];
}

export function worldUnitsPerSourcePixel(unit: PilotRuntimeUnit): number {
  return unit.targetWorldHeight / visibleAlphaHeightPx(unit);
}

export function runtimePlaneSize(unit: PilotRuntimeUnit): readonly [number, number] {
  const side = unit.canvasPx * worldUnitsPerSourcePixel(unit);
  return [side, side];
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
