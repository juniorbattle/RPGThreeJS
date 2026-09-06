// @vitest-environment happy-dom
import * as THREE from 'three';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compileUnitMotion,
  createUnitMotionStep,
  type CompiledUnitMotion,
} from '../vfx/CasterMotion';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike } from './CombatStage';
import { clearCombatPoseTextureCacheForTests } from './CombatPoseVisual';
import { resolveCombatStageProfile } from './combatStageProfiles';

beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = () => ({
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    fillStyle: '#000',
  });
});

function source(identity?: Partial<StageSpriteSource>): StageSpriteSource {
  const spr = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.9),
    new THREE.MeshBasicMaterial({ map: new THREE.Texture() }),
  );
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.6),
    new THREE.MeshBasicMaterial({ map: new THREE.Texture(), transparent: true }),
  );
  return { spr, blob, ...identity };
}

function plan(...steps: ReturnType<typeof createUnitMotionStep>[]): CompiledUnitMotion {
  return compileUnitMotion(steps);
}

describe('CombatStage linked Unit Motion + Pose runtime', () => {
  let stage: CombatStage;
  let caster: StageSpriteSource;
  let target: StageSpriteSource;

  beforeEach(async () => {
    clearCombatPoseTextureCacheForTests();
    vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async (src) => {
      const texture = new THREE.Texture();
      texture.name = String(src);
      return texture;
    });
    const tacticalScene = new THREE.Scene();
    const tacticalCamera = new THREE.PerspectiveCamera();
    const renderPass: RenderPassLike = { scene: tacticalScene, camera: tacticalCamera };
    const tiltShiftStrength: UniformLike = { value: 0.5 };
    stage = new CombatStage({ renderPass, tacticalScene, tacticalCamera, tiltShiftStrength, width: 1280, height: 720 });
    caster = source({ combatPoseUnitId: 'warrior', name: 'Warrior', team: 'player' });
    target = source({ combatPoseUnitId: 'cave_rat', name: 'Cave Rat', team: 'foe' });
    const baseProfile = resolveCombatStageProfile({ key: 'attack' })!;
    await stage.enter(caster, [target], { key: 'attack' }, {
      profile: { ...baseProfile, transitionInMs: 0, transitionOutMs: 0 },
      sourceTeam: 'player',
    });
  });

  afterEach(() => {
    stage.dispose();
    vi.restoreAllMocks();
  });

  it('CASTER ATTACK + HOLD changes pose without moving caster root', async () => {
    const compiled = plan(createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'attack' }));
    const before = stage.attackerUnitRootTransform()!;
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    stage.tick(0.016);
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('attack');
    expect(stage.attackerUnitRootTransform()!.position.equals(before.position)).toBe(true);
  });

  it('TARGET CAST + HOLD changes only target pose and neither root', async () => {
    const compiled = plan(createUnitMotionStep('HOLD', { actor: 'TARGET', pose: 'cast' }));
    const casterBefore = stage.attackerUnitRootTransform()!.position;
    const targetBefore = stage.targetUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    stage.tick(0.016);
    expect(stage.targetPoseVisualSnapshot()?.pose).toBe('cast');
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('prepare');
    expect(stage.attackerUnitRootTransform()!.position.equals(casterBefore)).toBe(true);
    expect(stage.targetUnitRootTransform()!.position.equals(targetBefore)).toBe(true);
  });

  it('CASTER movement moves caster root but never target root', async () => {
    const compiled = plan(createUnitMotionStep('DASH_THROUGH', {
      actor: 'CASTER', pose: 'dash', duration: 0.05, destination: 'TARGET_BACK', returnToOrigin: false,
    }));
    const casterBefore = stage.attackerUnitRootTransform()!.position;
    const targetBefore = stage.targetUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    await new Promise((resolve) => setTimeout(resolve, 30));
    stage.tick(0.016);
    expect(stage.attackerUnitRootTransform()!.position.equals(casterBefore)).toBe(false);
    expect(stage.targetUnitRootTransform()!.position.equals(targetBefore)).toBe(true);
  });

  it('TARGET movement moves target root and shadow but never caster root', async () => {
    const compiled = plan(createUnitMotionStep('JUMP_ARC', {
      actor: 'TARGET', pose: 'dash', duration: 0.08, destination: 'CASTER_FRONT', returnToOrigin: false,
    }));
    const casterBefore = stage.attackerUnitRootTransform()!.position;
    const targetBefore = stage.targetUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    await new Promise((resolve) => setTimeout(resolve, 35));
    stage.tick(0.016);
    const movedTarget = stage.targetUnitRootTransform()!.position;
    expect(movedTarget.equals(targetBefore)).toBe(false);
    expect(stage.attackerUnitRootTransform()!.position.equals(casterBefore)).toBe(true);
    expect(stage.targetMotionOffsetSnapshot().y).toBeGreaterThan(0);
    expect(stage.getVfxUnitProxy(target)?.grp?.position.equals(movedTarget)).toBe(true);
  });

  it('does not sample movement until the linked pose has been applied', async () => {
    const compiled = plan(createUnitMotionStep('DASH_SHORT', {
      actor: 'CASTER', pose: 'dash', duration: 0.1, destination: 'TARGET_FRONT', returnToOrigin: false,
    }));
    const before = stage.attackerUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await new Promise((resolve) => setTimeout(resolve, 20));
    stage.tick(0.016);
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('prepare');
    expect(stage.attackerUnitRootTransform()!.position.equals(before)).toBe(true);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    stage.tick(0.016);
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('dash');
    expect(stage.attackerUnitRootTransform()!.position.equals(before)).toBe(false);
  });

  it('returnToOrigin restores spatial root without changing the authored pose', async () => {
    const compiled = plan(createUnitMotionStep('DASH_SHORT', {
      actor: 'CASTER', pose: 'attack', duration: 0.02, destination: 'TARGET', returnToOrigin: true,
    }));
    const before = stage.attackerUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    await new Promise((resolve) => setTimeout(resolve, 60));
    stage.tick(0.016);
    expect(stage.attackerUnitRootTransform()!.position.equals(before)).toBe(true);
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('attack');
  });

  it('normal completion cleanup restores both roots and PREPARE poses', async () => {
    const compiled = plan(
      createUnitMotionStep('DASH_THROUGH', { actor: 'CASTER', pose: 'attack', destination: 'TARGET_BACK', returnToOrigin: false }),
      createUnitMotionStep('JUMP_UP', { actor: 'TARGET', pose: 'cast', height: 1, returnToOrigin: false }),
    );
    const casterBefore = stage.attackerUnitRootTransform()!.position;
    const targetBefore = stage.targetUnitRootTransform()!.position;
    stage.setUnitMotion(compiled);
    await Promise.all(compiled.steps.map((step) => stage.applyUnitMotionStep(step)));
    await new Promise((resolve) => setTimeout(resolve, 30));
    stage.tick(0.016);
    await stage.resetUnitMotionPresentation();
    expect(stage.attackerUnitRootTransform()!.position.equals(casterBefore)).toBe(true);
    expect(stage.targetUnitRootTransform()!.position.equals(targetBefore)).toBe(true);
    expect(stage.attackerPoseVisualSnapshot()?.pose).toBe('prepare');
    expect(stage.targetPoseVisualSnapshot()?.pose).toBe('prepare');
  });

  it('cancellation cleanup is idempotent and clears both actor plans', async () => {
    const compiled = plan(createUnitMotionStep('DASH_SHORT', { actor: 'TARGET', pose: 'dash' }));
    stage.setUnitMotion(compiled);
    await stage.applyUnitMotionStep(compiled.steps[0]!);
    await stage.resetUnitMotionPresentation();
    await stage.resetUnitMotionPresentation();
    expect(stage.hasCasterMotion()).toBe(false);
    expect(stage.hasTargetMotion()).toBe(false);
    expect(stage.targetPoseVisualSnapshot()?.pose).toBe('prepare');
  });

  it('missing TARGET pose set falls back safely without moving caster', async () => {
    stage.dispose();
    const tacticalScene = new THREE.Scene();
    const tacticalCamera = new THREE.PerspectiveCamera();
    stage = new CombatStage({
      renderPass: { scene: tacticalScene, camera: tacticalCamera },
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength: { value: 0.5 },
      width: 1280,
      height: 720,
    });
    const fallbackTarget = source({ name: 'Unknown', team: 'foe' });
    const baseProfile = resolveCombatStageProfile({ key: 'attack' })!;
    await stage.enter(caster, [fallbackTarget], { key: 'attack' }, {
      profile: { ...baseProfile, transitionInMs: 0, transitionOutMs: 0 },
    });
    const compiled = plan(createUnitMotionStep('HOLD', { actor: 'TARGET', pose: 'cast' }));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await stage.applyUnitMotionStep(compiled.steps[0]!)).toBe(false);
    expect(stage.targetPoseVisualSnapshot()?.pose).toBeNull();
    warning.mockRestore();
  });
});
