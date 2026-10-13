import { describe, expect, it } from 'vitest';
import {
  CombatCameraFeedback,
  STATIC_COMBAT_CAMERA_POLICY,
  applyAdditiveCameraShake,
  beginActionFrame,
  frameAction,
  frameActiveUnit,
  frameAoeAction,
  frameBossAction,
  frameCombatStage,
  restoreCamera,
  snapshotCameraState,
} from './combatCameraFeedback';

const baseline = snapshotCameraState({ tx: 1, ty: 2, tz: 3, dist: 9, height: 4, yaw: 0.2 }, 31);

describe('combat camera feedback', () => {
  it('captures every camera baseline field and enables static mode', () => {
    expect(baseline).toEqual({ tx: 1, ty: 2, tz: 3, dist: 9, height: 4, yaw: 0.2, fov: 31 });
    expect(STATIC_COMBAT_CAMERA_POLICY).toEqual({
      staticCombatCamera: true,
      shakeEnabled: true,
      maxShakeMagnitude: 0.30,
    });
  });

  it('does not reframe for active units or combat stage participants', () => {
    const actionBaseline = beginActionFrame(baseline, baseline.fov);
    expect(frameActiveUnit(actionBaseline, { x: 90, y: 20, z: -40 })).toEqual(baseline);
    expect(frameCombatStage(actionBaseline, [
      { x: -100, y: 0, z: -100 },
      { x: 100, y: 10, z: 100 },
    ])).toEqual(baseline);
    expect(actionBaseline).toEqual(baseline);
  });

  it('does not reframe regular, boss, or AoE actions', () => {
    expect(frameAction(baseline, { x: -20, y: 1, z: -2 }, { x: 12, y: 3, z: 8 })).toEqual(baseline);
    expect(frameBossAction(baseline, { x: 50, y: 8, z: 50 }, { x: -50, y: 1, z: -50 })).toEqual(baseline);
    expect(frameAoeAction(baseline, { x: 100, y: 0, z: 100 })).toEqual(baseline);
    expect(baseline).toEqual({ tx: 1, ty: 2, tz: 3, dist: 9, height: 4, yaw: 0.2, fov: 31 });
  });

  it('restores immediately without creating a new camera path', () => {
    const restored = restoreCamera(baseline);
    expect(restored).toEqual(baseline);
    expect(restored).not.toBe(baseline);
  });

  it('applies shake to rendered position only', () => {
    const position = { x: 10, y: 5, z: 7 };
    expect(applyAdditiveCameraShake(position, { x: 0.02, y: -0.01, active: true })).toEqual({ x: 10.02, y: 4.99, z: 7 });
    expect(position).toEqual({ x: 10, y: 5, z: 7 });
    expect(baseline).toEqual({ tx: 1, ty: 2, tz: 3, dist: 9, height: 4, yaw: 0.2, fov: 31 });
  });

  it('bounds and deduplicates shake for one action token', () => {
    const feedback = new CombatCameraFeedback();
    expect(feedback.request({ token: 'action-1', magnitude: 0.5, duration: 0.3, frequency: 12 })).toBe(true);
    expect(feedback.request({ token: 'action-1', magnitude: 0.8, duration: 0.2 })).toBe(false);
    feedback.tick(1 / 48);
    const sample = feedback.sample();
    expect(Math.abs(sample.x)).toBeLessThanOrEqual(STATIC_COMBAT_CAMERA_POLICY.maxShakeMagnitude);
    expect(Math.abs(sample.y)).toBeLessThanOrEqual(STATIC_COMBAT_CAMERA_POLICY.maxShakeMagnitude);
    expect(feedback.activeToken).toBe('action-1');
  });

  it('decays shake to exact zero without changing static camera fields', () => {
    const feedback = new CombatCameraFeedback();
    const renderedBaseline = { x: 10, y: 5, z: 7 };
    feedback.request({ token: 'action-2', magnitude: 0.5, duration: 0.25, frequency: 12 });
    feedback.tick(0.3);
    expect(feedback.sample()).toEqual({ x: 0, y: 0, active: false });
    expect(applyAdditiveCameraShake(renderedBaseline, feedback.sample())).toEqual(renderedBaseline);
    expect(feedback.activeToken).toBeNull();
    expect(restoreCamera(baseline)).toEqual(baseline);
  });

  it('can disable shake without enabling any alternate camera movement', () => {
    const feedback = new CombatCameraFeedback({ ...STATIC_COMBAT_CAMERA_POLICY, shakeEnabled: false });
    expect(feedback.request({ token: 'action-3', magnitude: 0.5, duration: 0.25 })).toBe(false);
    expect(feedback.sample()).toEqual({ x: 0, y: 0, active: false });
    expect(frameAction(baseline, { x: 100, y: 100, z: 100 })).toEqual(baseline);
  });
});
