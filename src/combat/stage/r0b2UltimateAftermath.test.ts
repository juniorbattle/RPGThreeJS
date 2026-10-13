// @vitest-environment happy-dom
import * as THREE from 'three';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveStageSideAssignment,
  resolveStageSlotCoordinate,
  resolveCombatStageProfileUniversal,
  COMBAT_STAGE_PROFILES,
  type ActionSpecForStage,
  type PresentationForStage,
} from './combatStageProfiles';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike, type StageAftermathSnapshot } from './CombatStage';

beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function stubGetContext() {
    return {
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillRect: () => undefined,
      fillStyle: '#000',
    };
  };
});

function makeSpriteSource(team?: string): StageSpriteSource {
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(1.4, 1.9);
  const spr = new THREE.Mesh(geometry, material);
  return { spr, team };
}

function makeStage(reducedGraphics = false): CombatStage {
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

const ultimateSpec: ActionSpecForStage = { key: 'w_lion_surge', type: 'phys', offensive: true, radius: 1, ap: 5 };
const ultimatePres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
const eclipseSpec: ActionSpecForStage = { key: 'd_devouring_eclipse', type: 'mag', offensive: true, radius: 1.5, ap: 5 };
const eclipsePres: PresentationForStage = { ultimate: true, visualTier: 5 };
const skyDescentSpec: ActionSpecForStage = { key: 'n_dark_meteor', type: 'mag', offensive: true, radius: 2, ap: 5 };
const skyDescentPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
const meleeSpec: ActionSpecForStage = { key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 };
const healSpec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
const healPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };
const groupHealSpec: ActionSpecForStage = { key: 'e_absolute_harmony', type: 'buff', support: true, radius: 2, ap: 5 };
const groupHealPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };

function makeAftermathSnapshot(
  overrides: Partial<StageAftermathSnapshot> = {},
): StageAftermathSnapshot {
  return {
    attacker: { unit: {}, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
    targets: [],
    isUltimate: false,
    ...overrides,
  };
}

describe('R0B.2 ultimate target layout', () => {
  it('arena ultimate target actor stays faction side (player source → target RIGHT)', () => {
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    const assignment = resolveStageSideAssignment(profile, 'player');
    for (const slot of profile.targetSlots) {
      const x = resolveStageSlotCoordinate(slot, assignment.mirrorX).x;
      expect(x).toBeGreaterThan(0);
    }
  });

  it('arenaCenter remains VFX-only center semantic (impactAnchor=arenaCenter, targetSlot≠arenaCenter)', () => {
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    expect(profile.impactAnchorSlot).toBe('arenaCenter');
    expect(profile.targetSlot).not.toBe('arenaCenter');
    for (const slot of profile.targetSlots) {
      expect(slot).not.toBe('arenaCenter');
    }
  });

  it('player ultimate target enemy remains right (positive X)', () => {
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    const assignment = resolveStageSideAssignment(profile, 'player');
    const targetX = resolveStageSlotCoordinate(profile.targetSlot, assignment.mirrorX).x;
    expect(targetX).toBeGreaterThan(0);
  });

  it('enemy ultimate target player remains left (negative X)', () => {
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    const assignment = resolveStageSideAssignment(profile, 'foe');
    const targetX = resolveStageSlotCoordinate(profile.targetSlot, assignment.mirrorX).x;
    expect(targetX).toBeLessThan(0);
  });

  it('Devouring Eclipse actor targets are not arenaCenter', () => {
    const profile = resolveCombatStageProfileUniversal(eclipseSpec, eclipsePres)!;
    expect(profile.id).toBe('DEVOURING_ECLIPSE');
    expect(profile.impactAnchorSlot).toBe('arenaCenter');
    expect(profile.targetSlot).not.toBe('arenaCenter');
    for (const slot of profile.targetSlots) {
      expect(slot).not.toBe('arenaCenter');
    }
  });

  it('skyEntry is never used as target actor position in any profile', () => {
    const allSpecs: Array<{ spec: ActionSpecForStage; pres?: PresentationForStage }> = [
      { spec: ultimateSpec, pres: ultimatePres },
      { spec: eclipseSpec, pres: eclipsePres },
      { spec: skyDescentSpec, pres: skyDescentPres },
      { spec: meleeSpec },
      { spec: healSpec },
      { spec: groupHealSpec },
      { spec: { key: 'test_move', type: 'move', mode: 'dash', ap: 2 } },
      { spec: { key: 'test_debuff', type: 'debuff', offensive: true, ap: 3 } },
      { spec: { key: 'test_self_buff', type: 'buff', self: true, support: true, ap: 3 } },
    ];
    for (const { spec, pres } of allSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec, pres);
      if (!profile) continue;
      expect(profile.targetSlot).not.toBe('skyEntry');
      for (const slot of profile.targetSlots) {
        expect(slot).not.toBe('skyEntry');
      }
    }
    for (const profile of COMBAT_STAGE_PROFILES) {
      expect(profile.targetSlot).not.toBe('skyEntry');
      for (const slot of profile.targetSlots) {
        expect(slot).not.toBe('skyEntry');
      }
    }
  });

  it('boss caster stays right (stationaryAttacker, enemy source)', () => {
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    const assignment = resolveStageSideAssignment(profile, 'foe');
    const sourceX = resolveStageSlotCoordinate(profile.actorStartSlot, assignment.mirrorX).x;
    expect(sourceX).toBeGreaterThan(0);
  });
});

describe('R0B.2 resolved aftermath feedback', () => {
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

  it('Stage aftermath does not perform gameplay resolution (unit state unchanged)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const mockUnit = { alive: true, hp: 50, statuses: { burn: 2 } };
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: mockUnit, ko: false, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: [], healed: false }],
    });

    const floatTextCalls: Array<{ text: string }> = [];
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });

    expect(mockUnit.alive).toBe(true);
    expect(mockUnit.hp).toBe(50);
    expect(mockUnit.statuses).toEqual({ burn: 2 });
    await stage.exit();
  });

  it('KO state triggers Stage proxy fade (koFadeProxyCount > 0)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });

    await stage.presentResolvedAftermath(snapshot);
    expect(stage.koFadeProxyCount()).toBeGreaterThan(0);
    expect(stage.targetProxyOpacity(0)).toBeLessThanOrEqual(1);
    await stage.exit();
  });

  it('status result triggers Stage feedback (floatText called with status name)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ unit: unknown; text: string; color: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [{ name: 'Brûlure', color: '#ff9a52' }], statusesRemoved: [], healed: false }],
    });

    await stage.presentResolvedAftermath(snapshot, (unit, text, color) => { floatTextCalls.push({ unit, text, color }); });
    const statusCall = floatTextCalls.find((c) => c.text.includes('BRÛLURE'));
    expect(statusCall).toBeDefined();
    expect(statusCall!.unit).toBe(target);
    await stage.exit();
  });

  it('heal/buff result does not emit duplicate Stage label (heal number comes from applyHeal)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(healSpec, healPres)!;
    await stage.enter(attacker, [target], healSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ unit: unknown; text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: true }],
    });

    await stage.presentResolvedAftermath(snapshot, (unit, text) => { floatTextCalls.push({ unit, text }); });
    // No '+SOIN' label — heal number is emitted by applyHeal in the runtime, not Stage aftermath
    const healLabel = floatTextCalls.find((c) => c.text.includes('SOIN'));
    expect(healLabel).toBeUndefined();
    await stage.exit();
  });

  it('group feedback maps to individual proxies (each target gets its own floatText)', async () => {
    const attacker = makeSpriteSource('player');
    const ally1 = makeSpriteSource('player');
    const ally2 = makeSpriteSource('player');
    const ally3 = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(groupHealSpec, groupHealPres)!;
    await stage.enter(attacker, [attacker, ally1, ally2, ally3], groupHealSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ unit: unknown; text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [
        { unit: ally1, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: true },
        { unit: ally2, ko: false, revived: false, statusesApplied: [{ name: 'Force+', color: '#ffd27a' }], statusesRemoved: [], healed: false },
        { unit: ally3, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      ],
    });

    await stage.presentResolvedAftermath(snapshot, (unit, text) => { floatTextCalls.push({ unit, text }); });
    expect(floatTextCalls.some((c) => c.unit === ally1 && c.text.includes('SOIN'))).toBe(false);
    expect(floatTextCalls.some((c) => c.unit === ally2 && c.text.includes('FORCE'))).toBe(true);
    expect(floatTextCalls.some((c) => c.unit === ally3 && c.text.includes('K.O.'))).toBe(true);
    await stage.exit();
  });

  it('tactical state is not duplicated/mutated by Stage aftermath', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const originalState = { alive: true, hp: 30, statuses: { poison: 1 } };
    const mockUnit = { ...originalState, statuses: { ...originalState.statuses } };
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: mockUnit, ko: true, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: ['regen'], healed: false }],
    });

    await stage.presentResolvedAftermath(snapshot, () => {});
    expect(mockUnit.alive).toBe(originalState.alive);
    expect(mockUnit.hp).toBe(originalState.hp);
    expect(mockUnit.statuses).toEqual(originalState.statuses);
    await stage.exit();
  });

  it('tactical return remains exact after aftermath session', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot);
    await stage.exit();

    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('Stage routing covers offensive/ultimate; support/movement route to tactical', () => {
    const stageSpecs: Array<{ spec: ActionSpecForStage; pres?: PresentationForStage }> = [
      { spec: meleeSpec },
      { spec: ultimateSpec, pres: ultimatePres },
      { spec: eclipseSpec, pres: eclipsePres },
      { spec: skyDescentSpec, pres: skyDescentPres },
      { spec: healSpec, pres: healPres },
      { spec: groupHealSpec, pres: groupHealPres },
      { spec: { key: 'test_debuff', type: 'debuff', offensive: true, ap: 3 } },
      { spec: { key: 'test_ranged', type: 'phys', offensive: true, ap: 2 } },
    ];
    for (const { spec, pres } of stageSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec, pres);
      expect(profile, `Stage-routed action ${spec.key} should resolve`).toBeDefined();
    }

    const tacticalSpecs: ActionSpecForStage[] = [
      { key: 'test_buff', type: 'buff', support: true, ap: 2 },
      { key: 'test_self_buff', type: 'buff', self: true, support: true, ap: 3 },
      { key: 'test_move', type: 'move', mode: 'dash', ap: 2 },
      { key: 'test_teleport', type: 'move', mode: 'teleport', ap: 3 },
      { key: 'test_leap', type: 'move', mode: 'leap', ap: 3 },
    ];
    for (const spec of tacticalSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec);
      expect(profile, `Tactical-routed action ${spec.key} should be undefined`).toBeUndefined();
    }
  });

  it('reduced graphics still produces essential KO/status feedback', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player', reducedGraphics: true });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: [], healed: false }],
    });

    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    expect(stage.koFadeProxyCount()).toBeGreaterThan(0);
    expect(floatTextCalls.some((c) => c.text.includes('K.O.'))).toBe(true);
    expect(floatTextCalls.some((c) => c.text.includes('POISON'))).toBe(true);
    await stage.exit();
  });

  it('aftermath with no consequences returns quickly (no hold)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });

    const start = performance.now();
    await stage.presentResolvedAftermath(snapshot);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(stage.koFadeProxyCount()).toBe(0);
    await stage.exit();
  });

  it('arena ultimate target proxy stays faction side on Stage (integration)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    await stage.enter(attacker, [target], ultimateSpec, { profile, sourceTeam: 'player' });

    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).toBeGreaterThan(0);

    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.targetPoint.x).toBe(0);
    await stage.exit();
  });

  it('enemy ultimate target proxy stays left on Stage (integration)', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(ultimateSpec, ultimatePres)!;
    await stage.enter(attacker, [target], ultimateSpec, { profile, sourceTeam: 'foe' });

    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).toBeLessThan(0);

    const override = stage.getVfxContextOverride();
    expect(override).not.toBeNull();
    expect(override!.targetPoint.x).toBe(0);
    await stage.exit();
  });

  it('Devouring Eclipse target proxy is not at arenaCenter (integration)', async () => {
    const attacker = makeSpriteSource('foe');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(eclipseSpec, eclipsePres)!;
    await stage.enter(attacker, [target], eclipseSpec, { profile, sourceTeam: 'foe' });

    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).not.toBe(0);
    expect(targetPos!.x).toBeLessThan(0);

    const override = stage.getVfxContextOverride();
    expect(override!.targetPoint.x).toBe(0);
    await stage.exit();
  });

  it('status removal (cleanse) triggers PURIFIÉ feedback', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(healSpec, healPres)!;
    await stage.enter(attacker, [target], healSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [], statusesRemoved: ['burn', 'poison'], healed: true }],
    });

    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    expect(floatTextCalls.some((c) => c.text.includes('PURIFIÉ'))).toBe(true);
    await stage.exit();
  });

  it('aftermathActive flag is true during aftermath and false after', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });

    expect(stage.isAftermathActive()).toBe(false);
    const promise = stage.presentResolvedAftermath(snapshot);
    expect(stage.isAftermathActive()).toBe(true);
    await promise;
    expect(stage.isAftermathActive()).toBe(false);
    await stage.exit();
  });
});
