import manifestJson from '../../render/generated/characterSystemV2Manifest.json';
import {
  resolveCharacterUnitId,
  type CharacterScaleFamily,
} from '../../render/CharacterVisualRegistry';

export const COMBAT_POSES = ['prepare', 'dash', 'attack', 'cast'] as const;

export type CombatPose = (typeof COMBAT_POSES)[number];

export interface CombatPoseAsset {
  src: string;
  sourceSizePx: Readonly<{ width: number; height: number }>;
  alphaBoundsPx: Readonly<{ left: number; top: number; right: number; bottom: number }>;
  /** Source pixels; origin is top-left, +x right, +y down. */
  anchor: Readonly<{ x: number; y: number }>;
  scaleCorrection: number;
  /** True only for effects approved as physically attached to the actor. */
  characterBoundFx: boolean;
}

export interface CombatPoseSet {
  unitId: string;
  sourceFolder: string;
  scaleFamily: CharacterScaleFamily;
  worldUnitsPerPixel: number;
  poses: Readonly<Record<CombatPose, CombatPoseAsset>>;
}

export interface CombatPoseLayout {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface StrategicUnitVisual {
  unitId: string;
  scaleFamily: CharacterScaleFamily;
  src: string;
  sourceSizePx: Readonly<{ width: number; height: number }>;
  alphaBoundsPx: Readonly<{ left: number; top: number; right: number; bottom: number }>;
  anchor: Readonly<{ x: number; y: number }>;
  worldUnitsPerPixel: number;
  scaleCorrection: 1;
}

interface ManifestPose {
  src: string;
  sourceSizePx: { width: number; height: number };
  alphaBoundsPx: { left: number; top: number; right: number; bottom: number };
  anchor: { x: number; y: number };
  scaleCorrection: number;
  characterBoundFx: boolean;
}

interface ManifestUnit {
  unitId: string;
  scaleFamily: CharacterScaleFamily;
  worldUnitsPerPixel: number;
  poses: Record<CombatPose, ManifestPose>;
}

const manifest = manifestJson as unknown as {
  status: string;
  counts: { masters: number; combatPoses: number };
  units: ManifestUnit[];
};

if (manifest.status !== 'PROMOTED' || manifest.counts.masters !== 25 || manifest.counts.combatPoses !== 100) {
  throw new Error('Character System V2 combat manifest failed its production gate.');
}

function freezePose(pose: ManifestPose): CombatPoseAsset {
  return Object.freeze({
    src: pose.src,
    sourceSizePx: Object.freeze({ ...pose.sourceSizePx }),
    alphaBoundsPx: Object.freeze({ ...pose.alphaBoundsPx }),
    anchor: Object.freeze({ ...pose.anchor }),
    scaleCorrection: pose.scaleCorrection,
    characterBoundFx: pose.characterBoundFx,
  });
}

const SETS = Object.freeze(manifest.units.map((unit): CombatPoseSet => Object.freeze({
  unitId: unit.unitId,
  sourceFolder: `/assets/characters/pixel/combat/${unit.unitId}`,
  scaleFamily: unit.scaleFamily,
  worldUnitsPerPixel: unit.worldUnitsPerPixel,
  poses: Object.freeze({
    prepare: freezePose(unit.poses.prepare),
    dash: freezePose(unit.poses.dash),
    attack: freezePose(unit.poses.attack),
    cast: freezePose(unit.poses.cast),
  }),
})));

const registry = new Map(SETS.map((set) => [set.unitId, set]));

export function resolveCombatPoseUnitId(identity: string | null | undefined): string | undefined {
  return resolveCharacterUnitId(identity);
}

export function resolveCombatPoseSet(unitId: string | null | undefined): CombatPoseSet | undefined {
  const canonicalId = resolveCombatPoseUnitId(unitId);
  return canonicalId ? registry.get(canonicalId) : undefined;
}

export function resolvePoseAssetFromSet(
  set: Pick<CombatPoseSet, 'poses'> | null | undefined,
  poseName: CombatPose,
): CombatPoseAsset | undefined {
  const poses = set?.poses as Partial<Record<CombatPose, CombatPoseAsset>> | undefined;
  return poses?.[poseName] ?? poses?.prepare;
}

export function resolveCombatPoseAsset(
  unitId: string | null | undefined,
  poseName: CombatPose,
): CombatPoseAsset | undefined {
  return resolvePoseAssetFromSet(resolveCombatPoseSet(unitId), poseName);
}

export function resolveStrategicUnitVisual(
  unitId: string | null | undefined,
): StrategicUnitVisual | undefined {
  const set = resolveCombatPoseSet(unitId);
  if (!set) return undefined;
  const prepare = set.poses.prepare;
  return Object.freeze({
    unitId: set.unitId,
    scaleFamily: set.scaleFamily,
    src: prepare.src,
    sourceSizePx: prepare.sourceSizePx,
    alphaBoundsPx: prepare.alphaBoundsPx,
    anchor: prepare.anchor,
    worldUnitsPerPixel: set.worldUnitsPerPixel,
    scaleCorrection: 1,
  });
}

export function combatPoseAssetScale(set: CombatPoseSet, asset: CombatPoseAsset): number {
  return set.worldUnitsPerPixel * asset.scaleCorrection;
}

/**
 * A Three.js PlaneGeometry is centred. This offset maps a source-pixel anchor
 * (top-left origin, y down) onto the poseVisual local origin / unit root.
 */
export function resolveCombatPoseLayout(set: CombatPoseSet, asset: CombatPoseAsset): CombatPoseLayout {
  const scale = combatPoseAssetScale(set, asset);
  const { width, height } = asset.sourceSizePx;
  return {
    width: width * scale,
    height: height * scale,
    offsetX: (width * 0.5 - asset.anchor.x) * scale,
    offsetY: (asset.anchor.y - height * 0.5) * scale,
  };
}

export function listCombatPoseSets(): readonly CombatPoseSet[] {
  return SETS;
}
