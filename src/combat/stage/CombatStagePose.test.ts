// @vitest-environment happy-dom
import * as THREE from 'three';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike } from './CombatStage';
import { resolveCombatPoseLayout, resolveCombatPoseSet } from './CombatPoseRegistry';
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
  const texture = new THREE.Texture();
  const spr = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.9),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.6),
    new THREE.MeshBasicMaterial({ map: new THREE.Texture(), transparent: true }),
  );
  return { spr, blob, ...identity };
}

describe('CombatStage pose integration', () => {
  let stage: CombatStage;

  beforeEach(() => {
    clearCombatPoseTextureCacheForTests();
    const tacticalScene = new THREE.Scene();
    const tacticalCamera = new THREE.PerspectiveCamera();
    const renderPass: RenderPassLike = { scene: tacticalScene, camera: tacticalCamera };
    const tiltShiftStrength: UniformLike = { value: 0.5 };
    stage = new CombatStage({
      renderPass,
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength,
      width: 1280,
      height: 720,
    });
    vi.spyOn(THREE.TextureLoader.prototype, 'loadAsync').mockImplementation(async (src) => {
      const texture = new THREE.Texture();
      texture.name = String(src);
      return texture;
    });
  });

  afterEach(() => {
    stage.dispose();
    vi.restoreAllMocks();
  });

  it('renders PREPARE under a stable Stage unitRoot and swaps only poseVisual', async () => {
    const attacker = source({ portrait: '/assets/characters/pixel/full/alistair.png', name: 'Warrior', team: 'player' });
    const target = source({ name: 'Unknown target', team: 'foe' });
    const baseProfile = resolveCombatStageProfile({ key: 'attack' })!;
    const profile = { ...baseProfile, transitionInMs: 0, transitionOutMs: 0 };

    expect(await stage.enter(attacker, [target], { key: 'attack' }, { profile })).toBe(true);
    expect(stage.attackerPoseVisualSnapshot()).toMatchObject({ unitId: 'warrior', pose: 'prepare' });

    const root = stage.scene.children.find((child) => child.name.startsWith('CombatStageUnitRoot:'));
    expect(root).toBeInstanceOf(THREE.Group);
    expect(root?.children.map((child) => child.name)).toEqual(['groundVisual', 'poseVisual']);

    const groundVisual = root?.getObjectByName('groundVisual')!;
    const groundLocalPosition = groundVisual.position.clone();
    const originalTransform = stage.attackerUnitRootTransform()!;
    const prepareVisual = stage.attackerPoseVisualSnapshot()!;
    const warriorSet = resolveCombatPoseSet('warrior')!;
    const prepareLayout = resolveCombatPoseLayout(warriorSet, warriorSet.poses.prepare);
    expect(prepareVisual.localPosition.y).toBeCloseTo(prepareLayout.offsetY - 0.08, 10);
    expect(await stage.setCombatUnitPose(attacker, 'dash')).toBe(true);
    const dashVisual = stage.attackerPoseVisualSnapshot()!;
    const afterDash = stage.attackerUnitRootTransform()!;

    expect(dashVisual.pose).toBe('dash');
    expect({ width: dashVisual.width, height: dashVisual.height }).not.toEqual({
      width: prepareVisual.width,
      height: prepareVisual.height,
    });
    expect(afterDash.position.equals(originalTransform.position)).toBe(true);
    expect(afterDash.quaternion.equals(originalTransform.quaternion)).toBe(true);
    expect(afterDash.scale.equals(originalTransform.scale)).toBe(true);

    await stage.setCombatUnitPose(attacker, 'attack');
    await stage.setCombatUnitPose(attacker, 'cast');
    const afterAllPoses = stage.attackerUnitRootTransform()!;
    expect(afterAllPoses.position.equals(originalTransform.position)).toBe(true);
    expect(afterAllPoses.quaternion.equals(originalTransform.quaternion)).toBe(true);
    expect(afterAllPoses.scale.equals(originalTransform.scale)).toBe(true);
    expect(groundVisual.position.equals(groundLocalPosition)).toBe(true);
  });

  it('cycles the selected posed unit in semantic order for DEV validation', async () => {
    const attacker = source({ combatPoseUnitId: 'cave_rat', name: 'Cave Rat', team: 'foe' });
    const target = source({ name: 'Fallback target', team: 'player' });
    const baseProfile = resolveCombatStageProfile({ key: 'attack' })!;
    const profile = { ...baseProfile, transitionInMs: 0, transitionOutMs: 0 };
    await stage.enter(attacker, [target], { key: 'attack' }, { profile, sourceTeam: 'foe' });

    expect(stage.getPoseQaState()).toMatchObject({ unitId: 'cave_rat', pose: 'prepare', total: 1 });
    expect(await stage.cycleSelectedPose()).toMatchObject({ pose: 'dash' });
    expect(await stage.cycleSelectedPose()).toMatchObject({ pose: 'attack' });
    expect(await stage.cycleSelectedPose()).toMatchObject({ pose: 'cast' });
    expect(await stage.cycleSelectedPose()).toMatchObject({ pose: 'prepare' });
  });

  it('keeps the canonical Stage sprite when no pose identity resolves', async () => {
    const attacker = source({ name: 'Canonical only', team: 'player' });
    const target = source({ team: 'foe' });
    const baseProfile = resolveCombatStageProfile({ key: 'attack' })!;
    const profile = { ...baseProfile, transitionInMs: 0, transitionOutMs: 0 };
    await stage.enter(attacker, [target], { key: 'attack' }, { profile });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(stage.attackerPoseVisualSnapshot()).toMatchObject({ unitId: null, pose: null, width: 1.4, height: 1.9 });
    expect(await stage.setCombatUnitPose(attacker, 'attack')).toBe(false);
    expect(stage.attackerPoseVisualSnapshot()).toMatchObject({ unitId: null, pose: null, width: 1.4, height: 1.9 });
    warning.mockRestore();
  });
});
