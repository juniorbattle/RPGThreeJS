import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const runtimeSource = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const configSource = readFileSync(new URL('./combatPresentationConfig.js', import.meta.url), 'utf8');
const bridgeSource = readFileSync(new URL('./CombatBridge.ts', import.meta.url), 'utf8');
const workbenchSource = readFileSync(new URL('./UnitMotionWorkbench.ts', import.meta.url), 'utf8');

describe('V11A.1 combat visual clarity contracts', () => {
  it('hides non-involved units during combat stage and restores them on exit', () => {
    expect(runtimeSource).toContain('G._stageFaded=[]');
    expect(runtimeSource).toContain('o._opSnap=');
    expect(runtimeSource).toContain('o.grp.visible=false');
    expect(runtimeSource).toContain('G._stageFaded=null');
    expect(runtimeSource).toContain('getUnitVisualState(o.team,o.alive,o.downed)');
  });

  it('keeps tactical overlays below unit presentation layers', () => {
    expect(runtimeSource).toContain("from './combatRenderLayers'");
    expect(runtimeSource).toContain('COMBAT_RENDER_LAYERS.TILE_ACTION');
    expect(runtimeSource).toContain('COMBAT_RENDER_LAYERS.UNIT_SHADOW');
    expect(runtimeSource).toContain('COMBAT_RENDER_LAYERS.UNIT_SPRITE');
    expect(runtimeSource).toContain('COMBAT_RENDER_LAYERS.UNIT_STATUS');
    expect(runtimeSource).toContain('COMBAT_RENDER_LAYERS.BOSS_ALERT');
  });

  it('disables permanent borders except for explicit grid QA', () => {
    expect(configSource).toContain('showBaseGridBorders: false');
    expect(configSource).toContain('showDebugGridBorders: true');
    expect(runtimeSource).toContain("GRID_DEBUG_ENABLED=QA_ENABLED&&campaignParams.get('grid')==='1'");
    expect(runtimeSource).toContain('if(!GRID_DEBUG_ENABLED)return;');
    expect(bridgeSource).toContain("params.get('grid') === '1'");
    expect(bridgeSource).toContain("devGrid ? '&grid=1' : ''");
  });

  it('uses presentation-only boss and elite intent state with owned cleanup', () => {
    expect(runtimeSource).toContain("from './bossIntentPresentation'");
    expect(runtimeSource).toContain("badge.name='boss-intent-alert'");
    expect(runtimeSource).toContain('resolveBossIntentVisualState({alive:u.alive,boss:u.boss,elite:u.elite,ap:u.ap,cooldown:u._ultCooldown');
    expect(runtimeSource).toContain('disposeBossIntentPresentation(u)');
    expect(runtimeSource).not.toContain('bossWarningGround');
    expect(workbenchSource).toContain("'boss-charge'");
    expect(workbenchSource).toContain("'boss-ultimate'");
  });

  it('preserves the static camera contract', () => {
    expect(runtimeSource).toContain('function focusCam(){ }');
    expect(runtimeSource).toContain('function actionCam(){ }');
    expect(runtimeSource).toContain('function stageFrame(){ }');
    expect(runtimeSource).not.toContain('tween(cam');
    expect(runtimeSource).not.toContain('tweenP(cam');
  });
});
