// @vitest-environment happy-dom
import * as path from 'node:path';
import * as THREE from 'three';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  resolveStageSideAssignment,
  resolveCombatStageProfileUniversal,
  type ActionSpecForStage,
  type PresentationForStage,
} from './combatStageProfiles';
import { CombatStage, type RenderPassLike, type StageSpriteSource, type UniformLike, type StageAftermathSnapshot } from './CombatStage';
import { getUnitVisualState } from '../unitVisualState';

const runtimeSource = readFileSync(path.resolve(__dirname, '..', 'legacyCombatRuntime.js'), 'utf8');
const stageSource = readFileSync(path.resolve(__dirname, 'CombatStage.ts'), 'utf8');

beforeAll(() => {
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext = function stubGetContext() {
    return {
      createLinearGradient: () => ({ addColorStop: () => undefined }),
      fillRect: () => undefined,
      fillStyle: '#000',
    };
  };
});

function makeSpriteSource(team?: string, alive?: boolean, downed?: boolean): StageSpriteSource {
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(1.4, 1.9);
  const spr = new THREE.Mesh(geometry, material);
  return { spr, team, alive, downed };
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
const healSpec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
const reviveSpec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', revive: true, support: true, healPercent: 0.5, radius: 1, ap: 5 };
const ultPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };

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

// ============================================================
// P0 — FEEDBACK DEDUPLICATION (runtime source contracts)
// ============================================================

describe('R0B.3 P0 feedback deduplication', () => {
  it('applyStatus suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,(d.name||st).toUpperCase()");
  });

  it('knockOut suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(u,'K.O.'");
  });

  it('dispel effect suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ'");
  });

  it('cure action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ':'—'");
  });

  it('dispelAllies post-action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(n&&!G.stage)floatText(t,'PURIFIÉ'");
  });

  it('status-only action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,sn.toUpperCase()+' !'");
  });

  it('applyHeal floatText is NOT suppressed (heal number stays once)', () => {
    expect(runtimeSource).toContain("floatText(u,'+'+amt,'#7ed957')");
  });

  it('damage number floatText in attack loop is NOT suppressed', () => {
    expect(runtimeSource).toContain("floatText(t,(crit?'✦ ':'')+'-'+dmg");
  });

  it('reviveUnit floatText is NOT suppressed (heal number for revive stays)', () => {
    expect(runtimeSource).toContain("floatText(u,'+'+hp,'#7ed957',true)");
  });

  it('Stage aftermath does not emit +SOIN heal label', () => {
    expect(runtimeSource).not.toContain("'+SOIN'");
  });

  it('Stage aftermath emits RANIMÉ for revived units', () => {
    expect(stageSource).toContain("'RANIMÉ'");
  });

  it('aftermath snapshot includes revived flag', () => {
    expect(runtimeSource).toContain('revived:!_pre.alive&&_un.alive');
  });
});

// ============================================================
// P1 — TACTICAL KO HERO GHOST
// ============================================================

describe('R0B.3 P1 tactical KO hero ghost', () => {
  it('KO player tactical representation remains visible (getUnitVisualState)', () => {
    const state = getUnitVisualState('player', false, true);
    expect(state.visible).toBe(true);
    expect(state.bodyOpacity).toBeGreaterThan(0);
  });

  it('KO player tactical visual is red/translucent (knockOut sets red tint)', () => {
    expect(runtimeSource).toContain("if(u.team==='player'&&u.mat&&u.mat.color)u.mat.color.set('#ff5a4a')");
  });

  it('KO enemy behavior remains existing (invisible, no ghost)', () => {
    const state = getUnitVisualState('foe', false, true);
    expect(state.visible).toBe(false);
    expect(state.bodyOpacity).toBe(0);
  });

  it('combatStageExit restores red tint for KO player units', () => {
    expect(runtimeSource).toContain("if(!o.alive&&o.downed&&o.team==='player'&&o.mat&&o.mat.color)o.mat.color.set('#ff5a4a')");
  });
});

// ============================================================
// P2 — ALREADY-KO STAGE PROXY
// ============================================================

describe('R0B.3 P2 already-KO Stage proxy', () => {
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

  it('already-KO target enters Stage with KO appearance (reduced opacity)', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });
    expect(stage.targetProxyIsKO(0)).toBe(true);
    expect(stage.targetProxyOpacity(0)).toBeLessThan(1);
    await stage.exit();
  });

  it('already-KO target enters Stage with red tint', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });
    const color = stage.targetProxyColor(0);
    expect(color).not.toBe('#ffffff');
    await stage.exit();
  });

  it('living target enters normally (full opacity, white color)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe', true, false);
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });
    expect(stage.targetProxyIsKO(0)).toBe(false);
    expect(stage.targetProxyOpacity(0)).toBe(1);
    expect(stage.targetProxyColor(0)).toBe('#ffffff');
    await stage.exit();
  });
});

// ============================================================
// P3 — REVIVE CHOREOGRAPHY
// ============================================================

describe('R0B.3 P3 revive choreography', () => {
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

  it('successful revive changes Stage proxy KO → alive only after authoritative resolve', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });

    // Before aftermath: proxy is KO
    expect(stage.targetProxyIsKO(0)).toBe(true);

    // Aftermath with revived=true triggers the transition
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: koTarget, ko: false, revived: true, statusesApplied: [], statusesRemoved: [], healed: true }],
    });
    await stage.presentResolvedAftermath(snapshot);

    // After aftermath: proxy is no longer KO
    expect(stage.targetProxyIsKO(0)).toBe(false);
    await stage.exit();
  });

  it('failed/non-revive does not fake resurrection (proxy stays KO)', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });

    // Aftermath with revived=false — proxy should stay KO
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: koTarget, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot);
    expect(stage.targetProxyIsKO(0)).toBe(true);
    await stage.exit();
  });

  it('revive feedback appears once (RANIMÉ)', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: koTarget, ko: false, revived: true, statusesApplied: [], statusesRemoved: [], healed: true }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    const reviveCalls = floatTextCalls.filter((c) => c.text.includes('RANIMÉ'));
    expect(reviveCalls.length).toBe(1);
    await stage.exit();
  });

  it('revive target remains on correct faction side (player LEFT)', async () => {
    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });
    const assignment = stage.getActiveSideAssignment();
    expect(assignment).not.toBeNull();
    expect(assignment!.sourceSide).toBe('player');
    expect(assignment!.targetSide).toBe('player');
    // Target proxy should be on LEFT (negative X) since it's a player unit
    const targetPos = stage.targetProxyPosition(0);
    expect(targetPos).not.toBeNull();
    expect(targetPos!.x).toBeLessThanOrEqual(0);
    await stage.exit();
  });
});

// ============================================================
// P4 — KO DURING ATTACK + MULTI-TARGET DEDUP
// ============================================================

describe('R0B.3 P4 KO during attack and multi-target dedup', () => {
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

  it('KO feedback emitted once during Stage (not duplicated)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    const koCalls = floatTextCalls.filter((c) => c.text === 'K.O.');
    expect(koCalls.length).toBe(1);
    await stage.exit();
  });

  it('status applied feedback emitted once during Stage', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: [], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    const poisonCalls = floatTextCalls.filter((c) => c.text.includes('POISON'));
    expect(poisonCalls.length).toBe(1);
    await stage.exit();
  });

  it('status removed feedback emitted once during Stage', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('player');
    const profile = resolveCombatStageProfileUniversal(healSpec, ultPres)!;
    await stage.enter(attacker, [target], healSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: false, revived: false, statusesApplied: [], statusesRemoved: ['burn'], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    const purifyCalls = floatTextCalls.filter((c) => c.text.includes('PURIFIÉ'));
    expect(purifyCalls.length).toBe(1);
    await stage.exit();
  });

  it('multi-target feedback remains per-proxy (each target gets own feedback)', async () => {
    const attacker = makeSpriteSource('player');
    const t1 = makeSpriteSource('foe');
    const t2 = makeSpriteSource('foe');
    const t3 = makeSpriteSource('foe');
    const multiSpec: ActionSpecForStage = { key: 'a_arrow_rain', type: 'phys', offensive: true, radius: 1.2, ap: 4 };
    const profile = resolveCombatStageProfileUniversal(multiSpec)!;
    await stage.enter(attacker, [t1, t2, t3], multiSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ unit: unknown; text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [
        { unit: t1, ko: false, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: [], healed: false },
        { unit: t2, ko: true, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
        { unit: t3, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      ],
    });
    await stage.presentResolvedAftermath(snapshot, (unit, text) => { floatTextCalls.push({ unit, text }); });

    // T1 gets poison only
    expect(floatTextCalls.some((c) => c.unit === t1 && c.text.includes('POISON'))).toBe(true);
    expect(floatTextCalls.some((c) => c.unit === t1 && c.text === 'K.O.')).toBe(false);
    // T2 gets KO only
    expect(floatTextCalls.some((c) => c.unit === t2 && c.text === 'K.O.')).toBe(true);
    expect(floatTextCalls.some((c) => c.unit === t2 && c.text.includes('POISON'))).toBe(false);
    // T3 gets no feedback
    expect(floatTextCalls.some((c) => c.unit === t3)).toBe(false);
    await stage.exit();
  });

  it('no duplicate Stage status/KO feedback (single emission per event)', async () => {
    const attacker = makeSpriteSource('player');
    const target = makeSpriteSource('foe');
    const profile = resolveCombatStageProfileUniversal(meleeSpec)!;
    await stage.enter(attacker, [target], meleeSpec, { profile, sourceTeam: 'player' });

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: target, ko: true, revived: false, statusesApplied: [{ name: 'Poison', color: '#9bd45a' }], statusesRemoved: [], healed: false }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    // One KO, one POISON — no duplicates
    expect(floatTextCalls.filter((c) => c.text === 'K.O.').length).toBe(1);
    expect(floatTextCalls.filter((c) => c.text.includes('POISON')).length).toBe(1);
    await stage.exit();
  });
});

// ============================================================
// P5 — PRESERVATION CONTRACTS
// ============================================================

describe('R0B.3 P5 preservation contracts', () => {
  it('Stage routing covers offensive/ultimate; support/movement route to tactical', () => {
    const stageSpecs: Array<{ spec: ActionSpecForStage; pres?: PresentationForStage }> = [
      { spec: meleeSpec },
      { spec: healSpec, pres: ultPres },
      { spec: reviveSpec, pres: ultPres },
      { spec: { key: 'test_debuff', type: 'debuff', offensive: true, ap: 3 } },
      { spec: { key: 'test_ult', type: 'phys', offensive: true, radius: 1, ap: 5 }, pres: { ultimate: true, visualTier: 5 } },
    ];
    for (const { spec, pres } of stageSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec, pres);
      expect(profile, `Stage-routed ${spec.key} should resolve`).toBeDefined();
    }

    const tacticalSpecs: ActionSpecForStage[] = [
      { key: 'test_buff', type: 'buff', support: true, ap: 2 },
      { key: 'test_move', type: 'move', mode: 'dash', ap: 2 },
    ];
    for (const spec of tacticalSpecs) {
      const profile = resolveCombatStageProfileUniversal(spec);
      expect(profile, `Tactical-routed ${spec.key} should be undefined`).toBeUndefined();
    }
  });

  it('tactical return exact after revive Stage session', async () => {
    const tacticalScene = new THREE.Scene();
    const tacticalCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    const renderPass: RenderPassLike = { scene: tacticalScene, camera: tacticalCamera };
    const tiltShiftStrength: UniformLike = { value: 2.6 };
    const stage = new CombatStage({ renderPass, tacticalScene, tacticalCamera, tiltShiftStrength, width: 1280, height: 720 });

    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player' });

    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: koTarget, ko: false, revived: true, statusesApplied: [], statusesRemoved: [], healed: true }],
    });
    await stage.presentResolvedAftermath(snapshot);
    await stage.exit();

    expect(stage.isActive()).toBe(false);
    expect(renderPass.scene).toBe(tacticalScene);
    expect(renderPass.camera).toBe(tacticalCamera);
    expect(tiltShiftStrength.value).toBe(2.6);
  });

  it('impact synchronization preserved (notifyImpact before resolveImpact)', () => {
    expect(runtimeSource).toContain('combatStage.notifyImpact()');
    expect(runtimeSource).toContain('await resolveImpact()');
    const block = runtimeSource.match(/combatStage\.notifyImpact\(\);[\s\S]*?await resolveImpact\(\);/);
    expect(block).not.toBeNull();
  });

  it('reduced graphics retains essential KO/revive/status readability', async () => {
    const tacticalScene = new THREE.Scene();
    const tacticalCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    const renderPass: RenderPassLike = { scene: tacticalScene, camera: tacticalCamera };
    const tiltShiftStrength: UniformLike = { value: 2.6 };
    const stage = new CombatStage({ renderPass, tacticalScene, tacticalCamera, tiltShiftStrength, width: 1280, height: 720 });

    const attacker = makeSpriteSource('player');
    const koTarget = makeSpriteSource('player', false, true);
    const profile = resolveCombatStageProfileUniversal(reviveSpec, ultPres)!;
    await stage.enter(attacker, [koTarget], reviveSpec, { profile, sourceTeam: 'player', reducedGraphics: true });

    // KO target is still visibly KO in reduced graphics
    expect(stage.targetProxyIsKO(0)).toBe(true);
    expect(stage.targetProxyOpacity(0)).toBeLessThan(1);

    const floatTextCalls: Array<{ text: string }> = [];
    const snapshot = makeAftermathSnapshot({
      attacker: { unit: attacker, ko: false, revived: false, statusesApplied: [], statusesRemoved: [], healed: false },
      targets: [{ unit: koTarget, ko: false, revived: true, statusesApplied: [], statusesRemoved: [], healed: true }],
    });
    await stage.presentResolvedAftermath(snapshot, (_u, text) => { floatTextCalls.push({ text }); });
    // Revive feedback still appears in reduced graphics
    expect(floatTextCalls.some((c) => c.text.includes('RANIMÉ'))).toBe(true);
    await stage.exit();
  });
});
