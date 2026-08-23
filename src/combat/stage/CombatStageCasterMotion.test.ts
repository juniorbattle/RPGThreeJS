// @vitest-environment happy-dom
/**
 * PHASE B — Combat Stage caster motion integration.
 *
 * Verifies that the motion layer is genuinely ADDITIVE and genuinely SCOPED:
 * it moves the caster proxy and nothing else. The camera, the target proxies
 * and the tactical view must be provably untouched.
 */
import * as THREE from 'three';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike } from './CombatStage';
import { compileCasterMotion, createCasterMotionStep } from '../vfx/CasterMotion';

beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function stubGetContext() {
    return {
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillRect: () => undefined,
      fillStyle: '#000',
    };
  };
});

function makeSpriteSource(width = 1.4, height = 1.9): StageSpriteSource {
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(width, height);
  return { spr: new THREE.Mesh(geometry, material) };
}

describe('CombatStage — caster motion', () => {
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.PerspectiveCamera;
  let renderPass: RenderPassLike;
  let tiltShiftStrength: UniformLike;
  let stage: CombatStage;
  let attacker: StageSpriteSource;
  let target: StageSpriteSource;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(33, 16 / 9, 0.1, 200);
    tacticalCamera.position.set(1, 2, 3);
    renderPass = { scene: tacticalScene, camera: tacticalCamera };
    tiltShiftStrength = { value: 2.6 };
    stage = new CombatStage({
      renderPass, tacticalScene, tacticalCamera, tiltShiftStrength, width: 1280, height: 720,
    });
    attacker = makeSpriteSource();
    target = makeSpriteSource();
  });

  it('starts every session motion-free', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    expect(stage.hasCasterMotion()).toBe(false);
    expect(stage.casterMotionOffsetSnapshot()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('reports an installed effective motion plan', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('DASH_SHORT')]));
    expect(stage.hasCasterMotion()).toBe(true);
  });

  it('treats a no-op plan as no motion at all', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('IDLE')]));
    expect(stage.hasCasterMotion()).toBe(false);
  });

  /**
   * Motion is layered as `position = base + offset`. Proving the offset is
   * EXACTLY zero therefore proves the proxy position is bit-for-bit the
   * pre-Phase-B value. Comparing raw positions across two ticks cannot show
   * this, because the pre-existing approach lerp advances with wall-clock time.
   */
  it('contributes an exactly-zero offset when no motion is authored', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.tick(0.016);
    expect(stage.casterMotionOffsetSnapshot()).toEqual({ x: 0, y: 0, z: 0 });
    stage.setCasterMotion(null);
    stage.tick(0.016);
    expect(stage.casterMotionOffsetSnapshot()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('contributes an exactly-zero offset for a no-op IDLE plan', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('IDLE')]));
    stage.tick(0.016);
    expect(stage.casterMotionOffsetSnapshot()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('returns the offset to zero once a returning motion has fully settled', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('DASH_SHORT', { startTime: 0, duration: 0.02, returnToOrigin: true }),
    ]));
    await new Promise((resolve) => setTimeout(resolve, 120));
    stage.tick(0.016);
    const offset = stage.casterMotionOffsetSnapshot();
    expect(offset.x).toBeCloseTo(0, 10);
    expect(offset.y).toBeCloseTo(0, 10);
    expect(offset.z).toBeCloseTo(0, 10);
  });

  it('displaces the attacker proxy horizontally during a dash', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.tick(0.016);
    const baseline = stage.attackerProxyPosition()!;
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('DASH_SHORT', { startTime: 0, duration: 5, distance: 1, returnToOrigin: false }),
    ]));
    await new Promise((resolve) => setTimeout(resolve, 60));
    stage.tick(0.016);
    const moved = stage.attackerProxyPosition()!;
    expect(Math.abs(moved.x - baseline.x)).toBeGreaterThan(0);
  });

  it('raises the attacker proxy vertically during a jump', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.tick(0.016);
    const baseline = stage.attackerProxyPosition()!;
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('JUMP_UP', { startTime: 0, duration: 5, height: 2, returnToOrigin: false }),
    ]));
    await new Promise((resolve) => setTimeout(resolve, 60));
    stage.tick(0.016);
    expect(stage.attackerProxyPosition()!.y).toBeGreaterThan(baseline.y);
  });

  it('never moves the target proxies', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.tick(0.016);
    const baseline = stage.targetProxyPosition(0)!;
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('DASH_THROUGH', { startTime: 0, duration: 5, returnToOrigin: false }),
    ]));
    await new Promise((resolve) => setTimeout(resolve, 60));
    stage.tick(0.016);
    const after = stage.targetProxyPosition(0)!;
    expect(after.x).toBeCloseTo(baseline.x, 10);
    expect(after.y).toBeCloseTo(baseline.y, 10);
    expect(after.z).toBeCloseTo(baseline.z, 10);
  });

  it('never moves the Stage camera', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    const cameraPosition = stage.camera.position.clone();
    const cameraZoom = stage.camera.zoom;
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('JUMP_ARC', { startTime: 0, duration: 5 }),
    ]));
    await new Promise((resolve) => setTimeout(resolve, 60));
    stage.tick(0.016);
    expect(stage.camera.position.equals(cameraPosition)).toBe(true);
    expect(stage.camera.zoom).toBe(cameraZoom);
  });

  it('never mutates the tactical camera', async () => {
    const position = tacticalCamera.position.clone();
    const fov = tacticalCamera.fov;
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('DASH_THROUGH')]));
    await new Promise((resolve) => setTimeout(resolve, 40));
    stage.tick(0.016);
    await stage.exit();
    expect(tacticalCamera.position.equals(position)).toBe(true);
    expect(tacticalCamera.fov).toBe(fov);
  });

  it('clears motion on exit so it cannot leak into the next action', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('DASH_THROUGH')]));
    expect(stage.hasCasterMotion()).toBe(true);
    await stage.exit();
    expect(stage.hasCasterMotion()).toBe(false);
    expect(stage.casterMotionOffsetSnapshot()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('clears motion when a new session begins', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('DASH_THROUGH')]));
    await stage.exit();
    await stage.enter(makeSpriteSource(), [makeSpriteSource()], { key: 'attack' });
    expect(stage.hasCasterMotion()).toBe(false);
  });

  it('restores the tactical render pass normally after a motion session', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('JUMP_ARC')]));
    stage.tick(0.016);
    await stage.exit();
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('is safe to install motion while inactive', () => {
    expect(() => {
      stage.setCasterMotion(compileCasterMotion([createCasterMotionStep('DASH_SHORT')]));
      stage.tick(0.016);
    }).not.toThrow();
  });

  it('keeps the attacker proxy position finite across a long tick sweep', async () => {
    await stage.enter(attacker, [target], { key: 'attack' });
    stage.setCasterMotion(compileCasterMotion([
      createCasterMotionStep('DASH_THROUGH', { startTime: 0, duration: 0.05 }),
      createCasterMotionStep('JUMP_ARC', { startTime: 0.05, duration: 0.05 }),
    ]));
    for (let i = 0; i < 40; i++) {
      stage.tick(0.016);
      const position = stage.attackerProxyPosition()!;
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
      expect(Number.isFinite(position.z)).toBe(true);
    }
  });
});
