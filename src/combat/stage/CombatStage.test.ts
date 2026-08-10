// @vitest-environment happy-dom
import * as THREE from 'three';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike } from './CombatStage';

// happy-dom does not implement a real 2D canvas rendering backend.
// BackgroundLayerSystem's fallback texture only needs a linear-gradient fill,
// so a minimal stub is enough to keep these tests deterministic and fast.
beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function stubGetContext() {
    return {
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillRect: () => undefined,
      fillStyle: '#000',
    };
  };
});

function makeSpriteSource(width = 1.4, height = 1.9): { source: StageSpriteSource; texture: THREE.Texture } {
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(width, height);
  const spr = new THREE.Mesh(geometry, material);
  return { source: { spr }, texture };
}

describe('CombatStage', () => {
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.PerspectiveCamera;
  let renderPass: RenderPassLike;
  let tiltShiftStrength: UniformLike;
  let stage: CombatStage;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(33, 16 / 9, 0.1, 200);
    tacticalCamera.position.set(1, 2, 3);
    renderPass = { scene: tacticalScene, camera: tacticalCamera };
    tiltShiftStrength = { value: 2.6 };
    stage = new CombatStage({
      renderPass,
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength,
      width: 1280,
      height: 720,
    });
  });

  it('does not activate for non-pilot actions (zero side effects)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const activated = await stage.enter(attacker.source, [target.source], { key: 'w_whirl' });
    expect(activated).toBe(false);
    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
  });

  it('never touches the live tilt-shift value for non-pilot actions, even across repeated enter/exit calls', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    tiltShiftStrength.value = 2.6;
    await stage.enter(attacker.source, [target.source], { key: 'w_whirl' });
    await stage.exit();
    expect(tiltShiftStrength.value).toBe(2.6);
    // Simulate an external system nudging tilt-shift between actions (e.g. settings change).
    tiltShiftStrength.value = 3.1;
    await stage.enter(attacker.source, [target.source], { key: 'n_dark_bolt' });
    await stage.exit();
    expect(tiltShiftStrength.value).toBe(3.1);
  });

  it('activates for the basic attack pilot action and swaps the render pass to the Stage', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const activated = await stage.enter(attacker.source, [target.source], { key: 'attack' });
    expect(activated).toBe(true);
    expect(stage.isActive()).toBe(true);
    expect(renderPass.scene).toBe(stage.scene);
    expect(renderPass.camera).toBe(stage.camera);
    expect(tiltShiftStrength.value).toBe(0.22);
  });

  it('restores the tactical render pass and the exact previous tilt-shift value on exit', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'n_flame_wave' });
    await stage.exit();
    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('never mutates the tactical camera object or its transform', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const originalPosition = tacticalCamera.position.clone();
    const originalFov = tacticalCamera.fov;
    await stage.enter(attacker.source, [target.source], { key: 'd_devouring_eclipse' });
    await stage.exit();
    expect(tacticalCamera.position.equals(originalPosition)).toBe(true);
    expect(tacticalCamera.fov).toBe(originalFov);
  });

  it('uses a dedicated OrthographicCamera, never the tactical camera instance', () => {
    expect(stage.camera).toBeInstanceOf(THREE.OrthographicCamera);
    expect(stage.camera).not.toBe(tacticalCamera);
    expect(stage.scene).not.toBe(tacticalScene);
  });

  it('borrows the sprite texture without ever disposing it, while disposing its own proxy geometry/material', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    let textureDisposed = false;
    attacker.texture.dispose = () => {
      textureDisposed = true;
    };
    await stage.enter(attacker.source, [target.source], { key: 'attack' });

    const proxyMesh = stage.scene.children.find(
      (child): child is THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> =>
        child instanceof THREE.Mesh && (child.material as THREE.MeshBasicMaterial).map === attacker.texture,
    );
    expect(proxyMesh).toBeDefined();
    let geometryDisposed = false;
    let materialDisposed = false;
    proxyMesh!.geometry.dispose = () => {
      geometryDisposed = true;
    };
    proxyMesh!.material.dispose = () => {
      materialDisposed = true;
    };

    await stage.exit();

    expect(geometryDisposed).toBe(true);
    expect(materialDisposed).toBe(true);
    expect(textureDisposed).toBe(false);
  });

  it('keeps Combat Stage active under reduced graphics instead of bypassing it', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const activated = await stage.enter(attacker.source, [target.source], { key: 'attack' }, { reducedGraphics: true });
    expect(activated).toBe(true);
    expect(stage.isActive()).toBe(true);
    expect(renderPass.scene).toBe(stage.scene);
  });

  it('exposes a VFX scene/camera override only while a pilot session is active', async () => {
    expect(stage.getVfxContextOverride()).toBeNull();
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'n_flame_wave' });
    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.scene).toBe(stage.scene);
    expect(override!.camera).toBe(stage.camera);
    expect(override!.targetPoint).toBeInstanceOf(THREE.Vector3);
    expect(override!.sourceUnit).toBeDefined();
    expect(override!.sourceUnit.grp).toBeDefined();
    expect(override!.targetUnits.length).toBeGreaterThanOrEqual(1);
    expect(override!.targetUnits[0]?.grp).toBeDefined();
    await stage.exit();
    expect(stage.getVfxContextOverride()).toBeNull();
  });

  it('returns a Stage-space VfxUnitLike proxy for staged participants and null for unstaged/inactive', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const bystander = makeSpriteSource();
    expect(stage.getVfxUnitProxy(attacker.source)).toBeNull();
    await stage.enter(attacker.source, [target.source], { key: 'attack' });
    const attackerProxy = stage.getVfxUnitProxy(attacker.source);
    const targetProxy = stage.getVfxUnitProxy(target.source);
    expect(attackerProxy).not.toBeNull();
    expect(targetProxy).not.toBeNull();
    expect(attackerProxy!.grp).toBeDefined();
    expect(targetProxy!.grp).toBeDefined();
    expect(attackerProxy!.grp!.position.x).toBeLessThan(0);
    expect(targetProxy!.grp!.position.x).toBeGreaterThan(0);
    expect(stage.getVfxUnitProxy(bystander.source)).toBeNull();
    await stage.exit();
    expect(stage.getVfxUnitProxy(attacker.source)).toBeNull();
  });

  it('returns phase timing only while a pilot session is active', async () => {
    expect(stage.getActivePhaseTiming()).toBeNull();
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'attack' });
    const timing = stage.getActivePhaseTiming();
    expect(timing).not.toBeNull();
    expect(timing!.settleMs).toBeGreaterThanOrEqual(0);
    expect(timing!.impactToReactionMs).toBeGreaterThanOrEqual(0);
    expect(timing!.recoveryMs).toBeGreaterThanOrEqual(0);
    await stage.exit();
    expect(stage.getActivePhaseTiming()).toBeNull();
  });

  it('creates separate VFX proxies for multiple targets', async () => {
    const attacker = makeSpriteSource();
    const target1 = makeSpriteSource();
    const target2 = makeSpriteSource();
    const target3 = makeSpriteSource();
    await stage.enter(attacker.source, [target1.source, target2.source, target3.source], { key: 'n_flame_wave' });
    const p1 = stage.getVfxUnitProxy(target1.source);
    const p2 = stage.getVfxUnitProxy(target2.source);
    const p3 = stage.getVfxUnitProxy(target3.source);
    expect(p1).not.toBeNull();
    expect(p2).not.toBeNull();
    expect(p3).not.toBeNull();
    expect(p1).not.toBe(p2);
    expect(p2).not.toBe(p3);
    await stage.exit();
  });

  it('resolves float text anchors for multiple targets', async () => {
    const attacker = makeSpriteSource();
    const target1 = makeSpriteSource();
    const target2 = makeSpriteSource();
    await stage.enter(attacker.source, [target1.source, target2.source], { key: 'n_flame_wave' });
    expect(stage.getFloatTextAnchor(target1.source)).toBeInstanceOf(THREE.Vector3);
    expect(stage.getFloatTextAnchor(target2.source)).toBeInstanceOf(THREE.Vector3);
    await stage.exit();
  });

  it('resolves a Stage-space float text anchor for staged participants and null for unrelated units/when inactive', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const bystander = makeSpriteSource();
    expect(stage.getFloatTextAnchor(attacker.source)).toBeNull();
    await stage.enter(attacker.source, [target.source], { key: 'attack' });
    expect(stage.getFloatTextAnchor(attacker.source)).toBeInstanceOf(THREE.Vector3);
    expect(stage.getFloatTextAnchor(target.source)).toBeInstanceOf(THREE.Vector3);
    expect(stage.getFloatTextAnchor(bystander.source)).toBeNull();
  });

  it('restores tactical presentation immediately when an interrupted/forced restore occurs mid-session', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'd_devouring_eclipse' });
    expect(stage.isActive()).toBe(true);

    stage.forceRestoreTactical();

    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('exit() is a safe no-op when the Stage was never activated', async () => {
    await expect(stage.exit()).resolves.toBeUndefined();
    expect(renderPass.scene).toBe(tacticalScene);
  });

  it('dispose() is idempotent and leaves no active session', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'attack' });
    stage.dispose();
    stage.dispose();
    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
  });

  it('updates the orthographic frustum on resize without touching the tactical camera', () => {
    const before = { left: stage.camera.left, top: stage.camera.top };
    stage.handleResize(800, 600);
    expect(stage.camera.left).not.toBe(before.left);
    expect(tacticalCamera.aspect).toBe(16 / 9);
  });

  it('tick() is a cheap no-op while inactive and does not throw', () => {
    expect(() => stage.tick(0.016)).not.toThrow();
  });

  it('activates with a generic profile passed via options', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 });
    expect(profile).toBeDefined();
    const activated = await stage.enter(attacker.source, [target.source], { key: 'w_break_guard' }, { profile });
    expect(activated).toBe(true);
    expect(stage.isActive()).toBe(true);
    expect(renderPass.scene).toBe(stage.scene);
    await stage.exit();
  });

  it('caster-inclusive ultimate support includes source proxy in target units', async () => {
    const attacker = makeSpriteSource();
    const ally1 = makeSpriteSource();
    const ally2 = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'e_absolute_harmony', type: 'buff', support: true, radius: 2, ap: 5 }, { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' });
    expect(profile).toBeDefined();
    expect(profile!.casterIncludedInTargets).toBe(true);
    await stage.enter(attacker.source, [attacker.source, ally1.source, ally2.source], { key: 'e_absolute_harmony' }, { profile });
    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.targetUnits.length).toBe(3);
    expect(override!.targetUnits[0]).toBe(override!.sourceUnit);
    await stage.exit();
  });

  it('ultimate self-target action creates no target proxies and source is target', async () => {
    const attacker = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'ult_self_buff', type: 'buff', self: true, support: true, ap: 5 }, { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' });
    expect(profile).toBeDefined();
    await stage.enter(attacker.source, [attacker.source], { key: 'ult_self_buff' }, { profile });
    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.targetUnits.length).toBe(1);
    expect(override!.targetUnits[0]).toBe(override!.sourceUnit);
    await stage.exit();
  });

  it('ultimate movement action activates Stage with just the caster', async () => {
    const attacker = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'ult_teleport', type: 'move', mode: 'teleport', ap: 5 }, { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' });
    expect(profile).toBeDefined();
    const activated = await stage.enter(attacker.source, [], { key: 'ult_teleport' }, { profile });
    expect(activated).toBe(true);
    expect(stage.isActive()).toBe(true);
    await stage.exit();
  });

  it('getActiveProfileInfo returns correct info for generic profiles', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 });
    await stage.enter(attacker.source, [target.source], { key: 'w_break_guard' }, { profile });
    const info = stage.getActiveProfileInfo();
    expect(info).not.toBeNull();
    expect(info!.id).toBe('SINGLE_TARGET_OFFENSIVE');
    expect(info!.explicit).toBe(false);
    await stage.exit();
  });

  it('getActiveProfileInfo returns explicit=true for pilot profiles', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], { key: 'attack' });
    const info = stage.getActiveProfileInfo();
    expect(info).not.toBeNull();
    expect(info!.id).toBe('BASIC_MELEE');
    expect(info!.explicit).toBe(true);
    await stage.exit();
  });

  it('reduced graphics still activates Stage with generic profile', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 });
    const activated = await stage.enter(attacker.source, [target.source], { key: 'w_break_guard' }, { profile, reducedGraphics: true });
    expect(activated).toBe(true);
    expect(stage.isActive()).toBe(true);
    expect(renderPass.scene).toBe(stage.scene);
    await stage.exit();
  });

  it('tactical return is safe after generic profile session', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const profile = resolveCombatStageProfileUniversal({ key: 'a_precise_shot', type: 'phys', offensive: true, ap: 2 });
    await stage.enter(attacker.source, [target.source], { key: 'a_precise_shot' }, { profile });
    await stage.exit();
    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });
});

const STAGE_PROXY_Y_SINK = 0.08;

describe('R0C.1 player ground alignment', () => {
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.PerspectiveCamera;
  let renderPass: RenderPassLike;
  let tiltShiftStrength: UniformLike;
  let stage: CombatStage;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(33, 16 / 9, 0.1, 200);
    renderPass = { scene: tacticalScene, camera: tacticalCamera };
    tiltShiftStrength = { value: 2.6 };
    stage = new CombatStage({
      renderPass,
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength,
      width: 1280,
      height: 720,
    });
  });

  const meleeSpec = { key: 'w_break_guard', type: 'phys' as const, offensive: true, ap: 2 };
  let meleeProfile: import('./combatStageProfiles').CombatStageProfile;

  beforeEach(async () => {
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    meleeProfile = resolveCombatStageProfileUniversal(meleeSpec)!;
  });

  it('player attacker proxy Y is lowered by heroGroundOffset (feet sink to ground)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const pos = stage.attackerProxyPosition()!;
    const height = 1.9;
    const expectedY = height * 0.5 - height * 0.05 - STAGE_PROXY_Y_SINK;
    expect(pos.y).toBeCloseTo(expectedY, 4);
    await stage.exit();
  });

  it('enemy attacker proxy Y is NOT lowered (no heroGroundOffset)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'foe' });
    const pos = stage.attackerProxyPosition()!;
    const height = 1.9;
    expect(pos.y).toBeCloseTo(height * 0.5 - STAGE_PROXY_Y_SINK, 4);
    await stage.exit();
  });

  it('enemy target proxy Y is unchanged when source is player', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const targetPos = stage.targetProxyPosition(0)!;
    const height = 1.9;
    expect(targetPos.y).toBeCloseTo(height * 0.5 - STAGE_PROXY_Y_SINK, 4);
    await stage.exit();
  });

  it('player target proxy Y is lowered in support layout (player-side targets)', async () => {
    const attacker = makeSpriteSource();
    const ally1 = makeSpriteSource();
    const ally2 = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const ultSpec = { key: 'e_absolute_harmony', type: 'buff' as const, support: true, radius: 2, ap: 5 };
    const ultPres = { ultimate: true as const, visualTier: 5, castStyle: 'ultimateCast' as const };
    const profile = resolveCombatStageProfileUniversal(ultSpec, ultPres)!;
    await stage.enter(attacker.source, [attacker.source, ally1.source, ally2.source], ultSpec, { profile, sourceTeam: 'player' });
    const targetPos = stage.targetProxyPosition(0)!;
    const height = 1.9;
    const expectedY = height * 0.5 - height * 0.05 - STAGE_PROXY_Y_SINK;
    expect(targetPos.y).toBeCloseTo(expectedY, 4);
    await stage.exit();
  });

  it('faction LEFT/RIGHT doctrine unchanged — player source on LEFT, enemy on RIGHT', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    expect(stage.attackerProxyPosition()!.x).toBeLessThan(0);
    expect(stage.targetProxyPosition(0)!.x).toBeGreaterThan(0);
    await stage.exit();
  });

  it('boss/elite stationary attacker position unchanged', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'foe', stationaryAttacker: true });
    const pos = stage.attackerProxyPosition()!;
    expect(pos.x).toBeGreaterThan(0);
    const height = 1.9;
    expect(pos.y).toBeCloseTo(height * 0.5 - STAGE_PROXY_Y_SINK, 4);
    await stage.exit();
  });

  it('float text anchor follows proxy position (includes ground offset)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const anchor = stage.getFloatTextAnchor(attacker.source)!;
    const proxyPos = stage.attackerProxyPosition()!;
    expect(anchor.y).toBeGreaterThan(proxyPos.y);
    expect(anchor.x).toBeCloseTo(proxyPos.x, 4);
    await stage.exit();
  });

  it('arenaCenter and stageGround remain at y=0', async () => {
    const { STAGE_LAYOUT } = await import('./combatStageProfiles');
    expect(STAGE_LAYOUT.arenaCenter.y).toBe(0);
    expect(STAGE_LAYOUT.stageGround.y).toBe(-0.02);
  });
});

describe('R0C.1B Stage vertical grounding tune', () => {
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.PerspectiveCamera;
  let renderPass: RenderPassLike;
  let tiltShiftStrength: UniformLike;
  let stage: CombatStage;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(33, 16 / 9, 0.1, 200);
    renderPass = { scene: tacticalScene, camera: tacticalCamera };
    tiltShiftStrength = { value: 2.6 };
    stage = new CombatStage({
      renderPass,
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength,
      width: 1280,
      height: 720,
    });
  });

  const meleeSpec = { key: 'w_break_guard', type: 'phys' as const, offensive: true, ap: 2 };
  let meleeProfile: import('./combatStageProfiles').CombatStageProfile;

  beforeEach(async () => {
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    meleeProfile = resolveCombatStageProfileUniversal(meleeSpec)!;
  });

  it('player attacker proxy is lower than pre-R0C.1B baseline', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const pos = stage.attackerProxyPosition()!;
    const height = 1.9;
    const preR0C1BY = height * 0.5 - height * 0.05;
    expect(pos.y).toBeLessThan(preR0C1BY);
    expect(pos.y).toBeCloseTo(preR0C1BY - STAGE_PROXY_Y_SINK, 4);
    await stage.exit();
  });

  it('enemy attacker proxy is also lowered by the same sink', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'foe' });
    const pos = stage.attackerProxyPosition()!;
    const height = 1.9;
    const preR0C1BY = height * 0.5;
    expect(pos.y).toBeLessThan(preR0C1BY);
    expect(pos.y).toBeCloseTo(preR0C1BY - STAGE_PROXY_Y_SINK, 4);
    await stage.exit();
  });

  it('player-enemy relative Y difference is preserved (sink is uniform)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const playerY = stage.attackerProxyPosition()!.y;
    const enemyY = stage.targetProxyPosition(0)!.y;
    const height = 1.9;
    const expectedDiff = height * 0.05;
    expect(enemyY - playerY).toBeCloseTo(expectedDiff, 4);
    await stage.exit();
  });

  it('multi-target layout: all target proxies receive the sink', async () => {
    const attacker = makeSpriteSource();
    const t1 = makeSpriteSource();
    const t2 = makeSpriteSource();
    const t3 = makeSpriteSource();
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    const ultSpec = { key: 'e_absolute_harmony', type: 'buff' as const, support: true, radius: 2, ap: 5 };
    const ultPres = { ultimate: true as const, visualTier: 5, castStyle: 'ultimateCast' as const };
    const profile = resolveCombatStageProfileUniversal(ultSpec, ultPres)!;
    await stage.enter(attacker.source, [attacker.source, t1.source, t2.source, t3.source], ultSpec, { profile, sourceTeam: 'player' });
    const height = 1.9;
    for (let i = 0; i < 3; i++) {
      const pos = stage.targetProxyPosition(i)!;
      const expectedY = height * 0.5 - height * 0.05 - STAGE_PROXY_Y_SINK;
      expect(pos.y).toBeCloseTo(expectedY, 4);
    }
    await stage.exit();
  });

  it('float text anchor remains above proxy after sink', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    const anchor = stage.getFloatTextAnchor(attacker.source)!;
    const proxyPos = stage.attackerProxyPosition()!;
    expect(anchor.y).toBeGreaterThan(proxyPos.y);
    expect(anchor.x).toBeCloseTo(proxyPos.x, 4);
    await stage.exit();
  });

  it('slot ordering remains correct (attacker left, targets right, Z-spread)', async () => {
    const { STAGE_LAYOUT } = await import('./combatStageProfiles');
    expect(STAGE_LAYOUT.attackerStart.x).toBeLessThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.primaryTarget.x).toBeGreaterThan(STAGE_LAYOUT.arenaCenter.x);
    expect(STAGE_LAYOUT.targetLeft.z).toBeLessThan(STAGE_LAYOUT.targetCenter.z);
    expect(STAGE_LAYOUT.targetCenter.z).toBeLessThan(STAGE_LAYOUT.targetRight.z);
  });
});

describe('R0C.2 Combat Stage visual filter parity', () => {
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.PerspectiveCamera;
  let renderPass: RenderPassLike;
  let tiltShiftStrength: UniformLike;
  let stage: CombatStage;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(33, 16 / 9, 0.1, 200);
    renderPass = { scene: tacticalScene, camera: tacticalCamera };
    tiltShiftStrength = { value: 2.6 };
    stage = new CombatStage({
      renderPass,
      tacticalScene,
      tacticalCamera,
      tiltShiftStrength,
      width: 1280,
      height: 720,
    });
  });

  const meleeSpec = { key: 'w_break_guard', type: 'phys' as const, offensive: true, ap: 2 };
  let meleeProfile: import('./combatStageProfiles').CombatStageProfile;

  beforeEach(async () => {
    const { resolveCombatStageProfileUniversal } = await import('./combatStageProfiles');
    meleeProfile = resolveCombatStageProfileUniversal(meleeSpec)!;
  });

  it('Stage scene has fog matching tactical scene parameters', () => {
    expect(stage.scene.fog).toBeDefined();
    expect(stage.scene.fog).toBeInstanceOf(THREE.FogExp2);
    const fog = stage.scene.fog as THREE.FogExp2;
    expect(fog.density).toBeCloseTo(0.01, 4);
  });

  it('Stage scene has hemisphere light (not flat ambient)', () => {
    const lights = stage.scene.children.filter((c) => c instanceof THREE.Light);
    const hemi = lights.find((l) => l instanceof THREE.HemisphereLight);
    expect(hemi).toBeDefined();
  });

  it('Stage scene has directional sun light matching tactical', () => {
    const lights = stage.scene.children.filter((c) => c instanceof THREE.Light);
    const dir = lights.find((l) => l instanceof THREE.DirectionalLight && (l as THREE.DirectionalLight).intensity > 1);
    expect(dir).toBeDefined();
    expect((dir as THREE.DirectionalLight).intensity).toBeCloseTo(1.78, 2);
  });

  it('Stage scene has directional fill light matching tactical', () => {
    const lights = stage.scene.children.filter((c) => c instanceof THREE.Light);
    const fill = lights.find((l) => l instanceof THREE.DirectionalLight && (l as THREE.DirectionalLight).intensity < 1);
    expect(fill).toBeDefined();
    expect((fill as THREE.DirectionalLight).intensity).toBeCloseTo(0.48, 2);
  });

  it('tilt-shift is set to reduced stage value (not zero) during active stage', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    expect(tiltShiftStrength.value).toBe(0.22);
    expect(tiltShiftStrength.value).toBeGreaterThan(0);
    await stage.exit();
  });

  it('tilt-shift is restored to original value on exit', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    tiltShiftStrength.value = 0.5;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    expect(tiltShiftStrength.value).toBe(0.22);
    await stage.exit();
    expect(tiltShiftStrength.value).toBe(0.5);
  });

  it('tilt-shift is restored even after forced restore', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    tiltShiftStrength.value = 0.5;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    stage.forceRestoreTactical();
    expect(tiltShiftStrength.value).toBe(0.5);
  });

  it('Stage render pass uses Stage scene and camera during active session', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile: meleeProfile, sourceTeam: 'player' });
    expect(renderPass.scene).toBe(stage.scene);
    expect(renderPass.camera).toBe(stage.camera);
    await stage.exit();
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
  });

  it('non-pilot actions do not alter tilt-shift (no stage activation)', async () => {
    const attacker = makeSpriteSource();
    const target = makeSpriteSource();
    tiltShiftStrength.value = 0.5;
    await stage.enter(attacker.source, [target.source], { key: 'w_whirl' });
    await stage.exit();
    expect(tiltShiftStrength.value).toBe(0.5);
  });
});
