import * as THREE from 'three';
import {
  resolveCombatPoseLayout,
  type CombatPose,
  type CombatPoseAsset,
  type CombatPoseSet,
} from './CombatPoseRegistry';

export type CombatPoseMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
export type CombatPoseTextureLoader = (src: string) => Promise<THREE.Texture>;

export interface CombatPoseVisualUnit {
  unitRoot: THREE.Object3D;
  poseVisual: CombatPoseMesh;
  poseSet: CombatPoseSet | null;
  canonicalVisual: Readonly<{
    geometry: THREE.PlaneGeometry;
    texture: THREE.Texture | null;
    position: THREE.Vector3;
  }>;
  poseGeometries: Map<string, THREE.PlaneGeometry>;
  faceSign: 1 | -1;
  /** Stage-wide visual sink; never applied to the authoritative unitRoot. */
  poseOriginYOffset: number;
  /** Unmirrored anchor offset; Stage facing/pulse is applied from this baseline. */
  poseBasePosition: THREE.Vector3;
  poseRequestId: number;
  currentPose: CombatPose | null;
}

export interface SetCombatUnitPoseOptions {
  loadTexture?: CombatPoseTextureLoader;
  warn?: (message: string, error?: unknown) => void;
}

export interface SetCombatUnitPoseResult {
  pose: CombatPose | null;
  usedFallback: boolean;
}

const textureCache = new Map<string, Promise<THREE.Texture | null>>();

const defaultTextureLoader: CombatPoseTextureLoader = async (src) => {
  const texture = await new THREE.TextureLoader().loadAsync(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
};

function devWarn(message: string, error?: unknown): void {
  if (!import.meta.env.DEV) return;
  if (error === undefined) console.warn(message);
  else console.warn(message, error);
}

export function loadCombatPoseTexture(
  src: string,
  loadTexture: CombatPoseTextureLoader = defaultTextureLoader,
): Promise<THREE.Texture | null> {
  const cached = textureCache.get(src);
  if (cached) return cached;
  let pending: Promise<THREE.Texture | null>;
  pending = loadTexture(src)
    .catch((error) => {
      devWarn(`[CombatPose] Texture unavailable: ${src}`, error);
      return null;
    })
    .then((texture) => {
      if (!texture && textureCache.get(src) === pending) textureCache.delete(src);
      return texture;
    });
  textureCache.set(src, pending);
  return pending;
}

export function preloadCombatPoseSet(
  set: CombatPoseSet,
  loadTexture: CombatPoseTextureLoader = defaultTextureLoader,
): Promise<readonly (THREE.Texture | null)[]> {
  return Promise.all(Object.values(set.poses).map((asset) => loadCombatPoseTexture(asset.src, loadTexture)));
}

function geometryFor(unit: CombatPoseVisualUnit, asset: CombatPoseAsset, width: number, height: number): THREE.PlaneGeometry {
  const existing = unit.poseGeometries.get(asset.src);
  if (existing) return existing;
  const geometry = new THREE.PlaneGeometry(width, height);
  unit.poseGeometries.set(asset.src, geometry);
  return geometry;
}

function syncPoseVisualPosition(unit: CombatPoseVisualUnit): void {
  const pulse = Math.abs(unit.poseVisual.scale.y) || 1;
  const base = unit.poseBasePosition;
  unit.poseVisual.position.set(base.x * unit.faceSign * pulse, base.y * pulse, base.z);
}

export function restoreCanonicalCombatUnitVisual(unit: CombatPoseVisualUnit): void {
  unit.poseVisual.geometry = unit.canonicalVisual.geometry;
  unit.poseVisual.material.map = unit.canonicalVisual.texture;
  unit.poseVisual.material.needsUpdate = true;
  unit.poseBasePosition.copy(unit.canonicalVisual.position);
  syncPoseVisualPosition(unit);
  unit.currentPose = null;
}

export async function setCombatUnitPose(
  unit: CombatPoseVisualUnit,
  requestedPose: CombatPose,
  options: SetCombatUnitPoseOptions = {},
): Promise<SetCombatUnitPoseResult> {
  const requestId = ++unit.poseRequestId;
  const warn = options.warn ?? devWarn;
  const set = unit.poseSet;
  if (!set) {
    restoreCanonicalCombatUnitVisual(unit);
    warn('[CombatPose] No pose set; using canonical Combat Stage sprite.');
    return { pose: null, usedFallback: true };
  }

  const poses = set.poses as Partial<Record<CombatPose, CombatPoseAsset>>;
  const requestedAsset = poses[requestedPose];
  if (!requestedAsset) warn(`[CombatPose] Missing ${requestedPose} pose for '${set.unitId}'; falling back to prepare.`);
  const attempts: Array<{ pose: CombatPose; asset: CombatPoseAsset }> = [];
  if (requestedAsset) attempts.push({ pose: requestedPose, asset: requestedAsset });
  if (requestedPose !== 'prepare' && poses.prepare && poses.prepare !== requestedAsset) {
    attempts.push({ pose: 'prepare', asset: poses.prepare });
  }

  for (const attempt of attempts) {
    const texture = await loadCombatPoseTexture(attempt.asset.src, options.loadTexture);
    if (requestId !== unit.poseRequestId) return { pose: unit.currentPose, usedFallback: true };
    if (!texture) {
      warn(`[CombatPose] Failed to load ${attempt.pose} pose for '${set.unitId}'.`);
      continue;
    }
    const layout = resolveCombatPoseLayout(set, attempt.asset);
    unit.poseVisual.geometry = geometryFor(unit, attempt.asset, layout.width, layout.height);
    unit.poseVisual.material.map = texture;
    unit.poseVisual.material.needsUpdate = true;
    const offsetY = layout.offsetY + unit.poseOriginYOffset;
    unit.poseBasePosition.set(layout.offsetX, offsetY, unit.canonicalVisual.position.z);
    syncPoseVisualPosition(unit);
    unit.currentPose = attempt.pose;
    return { pose: attempt.pose, usedFallback: attempt.pose !== requestedPose };
  }

  restoreCanonicalCombatUnitVisual(unit);
  warn(`[CombatPose] PREPARE unavailable for '${set.unitId}'; using canonical Combat Stage sprite.`);
  return { pose: null, usedFallback: true };
}

export function disposeCombatPoseVisual(unit: CombatPoseVisualUnit): void {
  for (const geometry of unit.poseGeometries.values()) geometry.dispose();
  unit.poseGeometries.clear();
}

export function disposeCombatPoseTextureCache(): void {
  for (const pending of textureCache.values()) void pending.then((texture) => texture?.dispose());
  textureCache.clear();
}

export function combatPoseTextureCacheSize(): number {
  return textureCache.size;
}

export function clearCombatPoseTextureCacheForTests(): void {
  for (const pending of textureCache.values()) void pending.then((texture) => texture?.dispose());
  textureCache.clear();
}
