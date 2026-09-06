import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveCombatPoseLayout, resolveCombatPoseSet, type CombatPoseAsset, type CombatPoseSet } from './CombatPoseRegistry';
import {
  clearCombatPoseTextureCacheForTests,
  combatPoseTextureCacheSize,
  loadCombatPoseTexture,
  setCombatUnitPose,
  type CombatPoseTextureLoader,
  type CombatPoseVisualUnit,
} from './CombatPoseVisual';

function makeVisualUnit(poseSet: CombatPoseSet | null): CombatPoseVisualUnit {
  const unitRoot = new THREE.Group();
  unitRoot.position.set(4, 2, -3);
  unitRoot.rotation.set(0.1, -0.2, 0.3);
  unitRoot.scale.set(1.2, 0.9, 1.1);
  const texture = new THREE.Texture();
  const geometry = new THREE.PlaneGeometry(1.4, 1.9);
  const poseVisual = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
  poseVisual.position.set(0.1, 0.8, 0.02);
  unitRoot.add(poseVisual);
  return {
    unitRoot,
    poseVisual,
    poseSet,
    canonicalVisual: Object.freeze({ geometry, texture, position: poseVisual.position.clone() }),
    poseGeometries: new Map(),
    faceSign: 1,
    poseOriginYOffset: 0,
    poseBasePosition: poseVisual.position.clone(),
    poseRequestId: 0,
    currentPose: null,
  };
}

function expectTransformUnchanged(
  object: THREE.Object3D,
  expected: { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 },
): void {
  expect(object.position.equals(expected.position)).toBe(true);
  expect(object.quaternion.equals(expected.quaternion)).toBe(true);
  expect(object.scale.equals(expected.scale)).toBe(true);
}

describe('CombatPoseVisual', () => {
  beforeEach(() => {
    clearCombatPoseTextureCacheForTests();
  });

  it('switches poseVisual texture, geometry and anchor offset without mutating unitRoot', async () => {
    const set = resolveCombatPoseSet('warrior')!;
    const unit = makeVisualUnit(set);
    const rootTransform = {
      position: unit.unitRoot.position.clone(),
      quaternion: unit.unitRoot.quaternion.clone(),
      scale: unit.unitRoot.scale.clone(),
    };
    const load: CombatPoseTextureLoader = vi.fn(async () => new THREE.Texture());

    for (const pose of ['prepare', 'dash', 'attack', 'cast'] as const) {
      const result = await setCombatUnitPose(unit, pose, { loadTexture: load });
      const layout = resolveCombatPoseLayout(set, set.poses[pose]);
      expect(result).toEqual({ pose, usedFallback: false });
      expect(unit.currentPose).toBe(pose);
      expect(unit.poseVisual.geometry.parameters.width).toBeCloseTo(layout.width, 10);
      expect(unit.poseVisual.geometry.parameters.height).toBeCloseTo(layout.height, 10);
      expect(unit.poseVisual.position.x).toBeCloseTo(layout.offsetX, 10);
      expect(unit.poseVisual.position.y).toBeCloseTo(layout.offsetY, 10);
      expectTransformUnchanged(unit.unitRoot, rootTransform);
    }
  });

  it('mirrors the local X anchor offset with enemy facing', async () => {
    const set = resolveCombatPoseSet('serpent_oracle')!;
    const unit = makeVisualUnit(set);
    unit.faceSign = -1;
    unit.poseVisual.scale.x = -1;
    const layout = resolveCombatPoseLayout(set, set.poses.attack);

    await setCombatUnitPose(unit, 'attack', { loadTexture: async () => new THREE.Texture() });

    expect(unit.poseVisual.position.x).toBeCloseTo(-layout.offsetX, 10);
    expect(unit.poseVisual.position.y).toBeCloseTo(layout.offsetY, 10);
  });

  it('keeps the authored anchor coincident with root when switching during a pulse', async () => {
    const set = resolveCombatPoseSet('serpent_oracle')!;
    const unit = makeVisualUnit(set);
    unit.faceSign = -1;
    unit.poseVisual.scale.set(-1.14, 1.14, 1.14);
    const layout = resolveCombatPoseLayout(set, set.poses.attack);

    await setCombatUnitPose(unit, 'attack', { loadTexture: async () => new THREE.Texture() });

    expect(unit.poseVisual.position.x).toBeCloseTo(-layout.offsetX * 1.14, 10);
    expect(unit.poseVisual.position.y).toBeCloseTo(layout.offsetY * 1.14, 10);
  });

  it('reuses a cached texture across repeated swaps and character instances', async () => {
    const set = resolveCombatPoseSet('cave_rat')!;
    const first = makeVisualUnit(set);
    const second = makeVisualUnit(set);
    const texture = new THREE.Texture();
    const load = vi.fn(async () => texture);

    await setCombatUnitPose(first, 'prepare', { loadTexture: load });
    await setCombatUnitPose(first, 'prepare', { loadTexture: load });
    await setCombatUnitPose(second, 'prepare', { loadTexture: load });

    expect(load).toHaveBeenCalledTimes(1);
    expect(combatPoseTextureCacheSize()).toBe(1);
    expect(first.poseVisual.material.map).toBe(texture);
    expect(second.poseVisual.material.map).toBe(texture);
  });

  it('evicts failed loads so a transient error can be retried', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const texture = new THREE.Texture();
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(texture);

    expect(await loadCombatPoseTexture('/retry.png', load)).toBeNull();
    expect(combatPoseTextureCacheSize()).toBe(0);
    expect(await loadCombatPoseTexture('/retry.png', load)).toBe(texture);
    expect(load).toHaveBeenCalledTimes(2);
    consoleWarn.mockRestore();
  });

  it('keeps the canonical sprite for an unknown unit', async () => {
    const unit = makeVisualUnit(null);
    const geometry = unit.canonicalVisual.geometry;
    const texture = unit.canonicalVisual.texture;
    const position = unit.canonicalVisual.position.clone();

    const result = await setCombatUnitPose(unit, 'attack', { warn: vi.fn() });

    expect(result).toEqual({ pose: null, usedFallback: true });
    expect(unit.poseVisual.geometry).toBe(geometry);
    expect(unit.poseVisual.material.map).toBe(texture);
    expect(unit.poseVisual.position.equals(position)).toBe(true);
  });

  it('falls back a missing requested pose to PREPARE', async () => {
    const source = resolveCombatPoseSet('warrior')!;
    const partial = {
      ...source,
      poses: { prepare: source.poses.prepare },
    } as unknown as CombatPoseSet;
    const unit = makeVisualUnit(partial);
    const load = vi.fn(async () => new THREE.Texture());
    const warn = vi.fn();

    const result = await setCombatUnitPose(unit, 'attack', { loadTexture: load, warn });

    expect(result).toEqual({ pose: 'prepare', usedFallback: true });
    expect(load).toHaveBeenCalledWith(source.poses.prepare.src);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Missing attack pose'));
  });

  it('falls back to PREPARE when a requested texture fails', async () => {
    const source = resolveCombatPoseSet('warrior')!;
    const unit = makeVisualUnit(source);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const load = vi.fn(async (src: string) => {
      if (src === source.poses.attack.src) throw new Error('missing attack');
      return new THREE.Texture();
    });

    const result = await setCombatUnitPose(unit, 'attack', { loadTexture: load, warn: vi.fn() });

    expect(result).toEqual({ pose: 'prepare', usedFallback: true });
    expect(load).toHaveBeenCalledWith(source.poses.attack.src);
    expect(load).toHaveBeenCalledWith(source.poses.prepare.src);
    consoleWarn.mockRestore();
  });

  it('falls back to the canonical sprite when PREPARE also fails', async () => {
    const source = resolveCombatPoseSet('warrior')!;
    const unit = makeVisualUnit(source);
    const canonicalGeometry = unit.canonicalVisual.geometry;
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const load = vi.fn(async () => { throw new Error('unavailable'); });

    const result = await setCombatUnitPose(unit, 'cast', { loadTexture: load, warn: vi.fn() });

    expect(result).toEqual({ pose: null, usedFallback: true });
    expect(unit.poseVisual.geometry).toBe(canonicalGeometry);
    expect(unit.poseVisual.material.map).toBe(unit.canonicalVisual.texture);
    consoleWarn.mockRestore();
  });

  it('honours exceptional scaleCorrection without changing the set scale', () => {
    const source = resolveCombatPoseSet('warrior')!;
    const asset: CombatPoseAsset = { ...source.poses.prepare, scaleCorrection: 0.5 };
    const corrected = resolveCombatPoseLayout(source, asset);
    const normal = resolveCombatPoseLayout(source, source.poses.prepare);
    expect(corrected.width).toBeCloseTo(normal.width * 0.5, 10);
    expect(source.worldUnitsPerPixel).toBe(0.00338608);
  });
});
