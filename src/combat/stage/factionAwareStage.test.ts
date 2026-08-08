// @vitest-environment happy-dom
import * as THREE from 'three';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  resolveStageSideAssignment,
  resolveStageSlotCoordinate,
  stageDirectionSign,
  resolveCombatStageProfileUniversal,
  type ActionSpecForStage,
  type PresentationForStage,
  type StageSideAssignment,
} from './combatStageProfiles';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike } from './CombatStage';

beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function stubGetContext() {
    return {
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillRect: () => undefined,
      fillStyle: '#000',
    };
  };
});

function makeSpriteSource(team?: string): { source: StageSpriteSource; team?: string } {
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(1.4, 1.9);
  const spr = new THREE.Mesh(geometry, material);
  const source: StageSpriteSource = { spr, team };
  return { source, team };
}

function makeStage(): CombatStage {
  const tacticalScene = new THREE.Scene();
  const tacticalCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  const renderPass: RenderPassLike = { scene: tacticalScene, camera: tacticalCamera };
  const tiltShiftStrength: UniformLike = { value: 2.6 };
  return new CombatStage({
    renderPass,
    tacticalScene,
    tacticalCamera,
    tiltShiftStrength,
    width: 1280,
    height: 720,
  });
}

const meleeSpec: ActionSpecForStage = { key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 };
const healSpec: ActionSpecForStage = { key: 'w_salvation', type: 'heal', support: true, healPercent: 0.4, ap: 2 };
const groupHealSpec: ActionSpecForStage = { key: 'w_sanctuary', type: 'buff', support: true, radius: 1.3, ap: 4, effects: [{ kind: 'heal', target: 'allies' }] };
const selfBuffSpec: ActionSpecForStage = { key: 'd_blood_pact', type: 'buff', self: true, support: true, ap: 4 };
const multiTargetSpec: ActionSpecForStage = { key: 'a_arrow_rain', type: 'phys', offensive: true, radius: 1.2, ap: 4 };
const ultimateSpec: ActionSpecForStage = { key: 'w_lion_surge', type: 'phys', offensive: true, radius: 1, ap: 5 };
const ultimatePres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
const ultHealSpec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
const ultGroupSupportSpec: ActionSpecForStage = { key: 'e_absolute_harmony', type: 'buff', support: true, radius: 2, ap: 5 };
const ultSelfBuffSpec: ActionSpecForStage = { key: 'ult_self_buff', type: 'buff', self: true, support: true, ap: 5 };

describe('R0B.1 faction-aware Stage sides', () => {
  describe('resolveStageSideAssignment', () => {
    it('player source → LEFT side, enemy target → RIGHT side (offensive)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      expect(assignment.sourceSide).toBe('player');
      expect(assignment.targetSide).toBe('enemy');
      expect(assignment.mirrorX).toBe(false);
    });

    it('enemy source → RIGHT side, player target → LEFT side (offensive)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      expect(assignment.sourceSide).toBe('enemy');
      expect(assignment.targetSide).toBe('player');
      expect(assignment.mirrorX).toBe(true);
    });

    it('player ultimate support → both source and target on player side (LEFT)', () => {
      const profile = resolveCombatStageProfileUniversal(ultHealSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      expect(assignment.sourceSide).toBe('player');
      expect(assignment.targetSide).toBe('player');
      expect(assignment.mirrorX).toBe(false);
    });

    it('enemy ultimate support → both source and target on enemy side (RIGHT)', () => {
      const profile = resolveCombatStageProfileUniversal(ultHealSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      expect(assignment.sourceSide).toBe('enemy');
      expect(assignment.targetSide).toBe('enemy');
      expect(assignment.mirrorX).toBe(true);
    });

    it('player ultimate self-buff → source on player side (LEFT), no mirror', () => {
      const profile = resolveCombatStageProfileUniversal(ultSelfBuffSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      expect(assignment.sourceSide).toBe('player');
      expect(assignment.targetSide).toBe('player');
      expect(assignment.mirrorX).toBe(false);
    });

    it('enemy ultimate self-buff → source on enemy side (RIGHT), mirror', () => {
      const profile = resolveCombatStageProfileUniversal(ultSelfBuffSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      expect(assignment.sourceSide).toBe('enemy');
      expect(assignment.mirrorX).toBe(true);
    });
  });

  describe('resolveStageSlotCoordinate', () => {
    it('player attack: source X < target X (L→R)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      const sourceX = resolveStageSlotCoordinate(profile.actorStartSlot, assignment.mirrorX).x;
      const targetX = resolveStageSlotCoordinate(profile.targetSlot, assignment.mirrorX).x;
      expect(sourceX).toBeLessThan(targetX);
    });

    it('enemy attack: source X > target X (R→L)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      const sourceX = resolveStageSlotCoordinate(profile.actorStartSlot, assignment.mirrorX).x;
      const targetX = resolveStageSlotCoordinate(profile.targetSlot, assignment.mirrorX).x;
      expect(sourceX).toBeGreaterThan(targetX);
    });

    it('player multi-target group stays RIGHT when enemies are targets', () => {
      const profile = resolveCombatStageProfileUniversal(multiTargetSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      for (const slot of profile.targetSlots) {
        const x = resolveStageSlotCoordinate(slot, assignment.mirrorX).x;
        expect(x).toBeGreaterThan(0);
      }
    });

    it('enemy multi-target group stays LEFT when players are targets', () => {
      const profile = resolveCombatStageProfileUniversal(multiTargetSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      for (const slot of profile.targetSlots) {
        const x = resolveStageSlotCoordinate(slot, assignment.mirrorX).x;
        expect(x).toBeLessThan(0);
      }
    });

    it('player ultimate group support stays LEFT side', () => {
      const profile = resolveCombatStageProfileUniversal(ultGroupSupportSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      for (const slot of profile.targetSlots) {
        const x = resolveStageSlotCoordinate(slot, assignment.mirrorX).x;
        expect(x).toBeLessThanOrEqual(0);
      }
    });

    it('enemy ultimate group support stays RIGHT side', () => {
      const profile = resolveCombatStageProfileUniversal(ultGroupSupportSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      for (const slot of profile.targetSlots) {
        const x = resolveStageSlotCoordinate(slot, assignment.mirrorX).x;
        expect(x).toBeGreaterThan(0);
      }
    });

    it('player ultimate self-buff stays LEFT', () => {
      const profile = resolveCombatStageProfileUniversal(ultSelfBuffSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      const x = resolveStageSlotCoordinate(profile.actorStartSlot, assignment.mirrorX).x;
      expect(x).toBeLessThan(0);
    });

    it('enemy ultimate self-buff stays RIGHT', () => {
      const profile = resolveCombatStageProfileUniversal(ultSelfBuffSpec, ultimatePres)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      const x = resolveStageSlotCoordinate(profile.actorStartSlot, assignment.mirrorX).x;
      expect(x).toBeGreaterThan(0);
    });

    it('arenaCenter remains center (x=0) regardless of source faction', () => {
      expect(resolveStageSlotCoordinate('arenaCenter', false).x).toBe(0);
      expect(resolveStageSlotCoordinate('arenaCenter', true).x).toBe(0);
    });

    it('player projectile direction is positive X (L→R)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'player');
      const originX = resolveStageSlotCoordinate('projectileOrigin', assignment.mirrorX).x;
      const impactX = resolveStageSlotCoordinate('projectileImpact', assignment.mirrorX).x;
      expect(originX).toBeLessThan(impactX);
    });

    it('enemy projectile direction is negative X (R→L)', () => {
      const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
      const assignment = resolveStageSideAssignment(profile, 'foe');
      const originX = resolveStageSlotCoordinate('projectileOrigin', assignment.mirrorX).x;
      const impactX = resolveStageSlotCoordinate('projectileImpact', assignment.mirrorX).x;
      expect(originX).toBeGreaterThan(impactX);
    });

    it('stageDirectionSign returns +1 for player, -1 for enemy', () => {
      const playerAssignment: StageSideAssignment = { sourceSide: 'player', targetSide: 'enemy', mirrorX: false };
      const enemyAssignment: StageSideAssignment = { sourceSide: 'enemy', targetSide: 'player', mirrorX: true };
      expect(stageDirectionSign(playerAssignment)).toBe(1);
      expect(stageDirectionSign(enemyAssignment)).toBe(-1);
    });

    it('explicit Flame Wave profile still works with faction-aware resolution', () => {
      const flameSpec: ActionSpecForStage = { key: 'n_flame_wave', type: 'mag', offensive: true, radius: 1.6, ap: 4 };
      const profile = resolveCombatStageProfileUniversal(flameSpec);
      expect(profile).toBeDefined();
      expect(profile!.id).toBe('FLAME_WAVE');
      const playerAssignment = resolveStageSideAssignment(profile!, 'player');
      const enemyAssignment = resolveStageSideAssignment(profile!, 'foe');
      expect(playerAssignment.mirrorX).toBe(false);
      expect(enemyAssignment.mirrorX).toBe(true);
    });

    it('explicit Devouring Eclipse profile still works with faction-aware resolution', () => {
      const eclipseSpec: ActionSpecForStage = { key: 'd_devouring_eclipse', type: 'mag', offensive: true, radius: 1.5, ap: 5 };
      const eclipsePres: PresentationForStage = { ultimate: true, visualTier: 5 };
      const profile = resolveCombatStageProfileUniversal(eclipseSpec, eclipsePres);
      expect(profile).toBeDefined();
      expect(profile!.id).toBe('DEVOURING_ECLIPSE');
      const enemyAssignment = resolveStageSideAssignment(profile!, 'foe');
      expect(enemyAssignment.mirrorX).toBe(true);
      const impactX = resolveStageSlotCoordinate(profile!.impactAnchorSlot, enemyAssignment.mirrorX).x;
      expect(impactX).toBe(0);
    });
  });
});

describe('R0B.1 faction-aware CombatStage', () => {
  let stage: CombatStage;
  let renderPass: RenderPassLike;
  let tacticalScene: THREE.Scene;
  let tacticalCamera: THREE.Camera;
  let tiltShiftStrength: UniformLike;

  beforeEach(() => {
    tacticalScene = new THREE.Scene();
    tacticalCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
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

  it('player source is on left (negative X)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'player' });
    expect(stage.attackerProxyPosition()!.x).toBeLessThan(0);
    await stage.exit();
  });

  it('enemy source is on right (positive X)', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe' });
    expect(stage.attackerProxyPosition()!.x).toBeGreaterThan(0);
    await stage.exit();
  });

  it('player target of enemy action stays left (negative X)', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe' });
    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).toBeLessThan(0);
    await stage.exit();
  });

  it('enemy target of player action stays right (positive X)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'player' });
    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).toBeGreaterThan(0);
    await stage.exit();
  });

  it('boss/elite can remain anchored on right (stationaryAttacker)', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe', stationaryAttacker: true });
    const info = stage.getActiveProfileInfo();
    expect(info).not.toBeNull();
    expect(info!.stationaryAttacker).toBe(true);
    expect(info!.sourceSide).toBe('enemy');
    expect(stage.attackerProxyPosition()!.x).toBeGreaterThan(0);
    await stage.exit();
  });

  it('arena ultimate remains centered regardless of source faction', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    await stage.enter(attacker.source, [target.source], ultimateSpec, { profile, sourceTeam: 'foe' });
    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.targetPoint.x).toBe(0);
    await stage.exit();
  });

  it('reduced graphics uses the same faction-side rules', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe', reducedGraphics: true });
    expect(stage.attackerProxyPosition()!.x).toBeGreaterThan(0);
    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos!.x).toBeLessThan(0);
    await stage.exit();
  });

  it('tactical return remains exact after enemy-source session', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe' });
    await stage.exit();
    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('getActiveSideAssignment returns correct sides for player offensive', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'player' });
    const assignment = stage.getActiveSideAssignment();
    expect(assignment).not.toBeNull();
    expect(assignment!.sourceSide).toBe('player');
    expect(assignment!.targetSide).toBe('enemy');
    expect(assignment!.mirrorX).toBe(false);
    await stage.exit();
  });

  it('getActiveSideAssignment returns correct sides for enemy offensive', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker.source, [target.source], meleeSpec, { profile, sourceTeam: 'foe' });
    const assignment = stage.getActiveSideAssignment();
    expect(assignment).not.toBeNull();
    expect(assignment!.sourceSide).toBe('enemy');
    expect(assignment!.targetSide).toBe('player');
    expect(assignment!.mirrorX).toBe(true);
    await stage.exit();
  });

  it('player ultimate group support stays on player side (LEFT)', async () => {
    const attacker = makeSpriteSource('player');
    const ally1 = makeSpriteSource('player');
    const ally2 = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(ultGroupSupportSpec, ultimatePres)!;
    await stage.enter(attacker.source, [attacker.source, ally1.source, ally2.source], ultGroupSupportSpec, { profile, sourceTeam: 'player' });
    const assignment = stage.getActiveSideAssignment();
    expect(assignment!.sourceSide).toBe('player');
    expect(assignment!.targetSide).toBe('player');
    await stage.exit();
  });

  it('enemy ultimate group support stays on enemy side (RIGHT)', async () => {
    const attacker = makeSpriteSource('foe');
    const ally1 = makeSpriteSource('foe');
    const ally2 = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(ultGroupSupportSpec, ultimatePres)!;
    await stage.enter(attacker.source, [attacker.source, ally1.source, ally2.source], ultGroupSupportSpec, { profile, sourceTeam: 'foe' });
    const assignment = stage.getActiveSideAssignment();
    expect(assignment!.sourceSide).toBe('enemy');
    expect(assignment!.targetSide).toBe('enemy');
    expect(assignment!.mirrorX).toBe(true);
    await stage.exit();
  });
});
