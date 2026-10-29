import { describe, expect, it } from 'vitest';
import { CombatCameraDirector, shotFor, shotPosition, type CameraShot } from './CombatCameraDirector';

const BASE: CameraShot = { tx: 0, ty: 2.4, tz: 0, yaw: 0, dist: 16.2, height: 6.15, fov: 0 };

describe('combat camera director', () => {
  it('keeps the tactical overview untouched', () => {
    expect(shotFor('tactical', BASE)).toEqual(BASE);
    expect(shotFor('spotlight', BASE)).toEqual(BASE); // no actor: nothing to frame
  });

  it('pushes in for actions and goes low and close for the spotlight', () => {
    const actor = { x: -2.95, z: 0.59 }, target = { x: 1.77, z: -0.59 };
    const action = shotFor('action', BASE, actor, target);
    const spot = shotFor('spotlight', BASE, actor, target);
    expect(action.dist).toBeLessThan(BASE.dist);
    expect(spot.dist).toBeLessThan(action.dist);
    expect(spot.height).toBeLessThan(action.height);
    expect(shotPosition(spot).y).toBeLessThan(shotPosition(BASE).y);
  });

  it('never orbits past the diorama flanks', () => {
    for (const x of [-4.7, -2, 0, 2, 4.7]) for (const tx of [-4.7, 0, 4.7]) {
      for (const kind of ['action', 'aoe', 'spotlight', 'impact'] as const) {
        expect(Math.abs(shotFor(kind, BASE, { x, z: 1 }, { x: tx, z: -1 }).yaw)).toBeLessThanOrEqual(0.24);
      }
    }
  });

  it('tweens to a shot and resolves when it lands, then restores the overview', async () => {
    const director = new CombatCameraDirector(BASE);
    director.sway = 0;
    const done = director.frame('spotlight', { x: -2, z: 0 }, { x: 2, z: 0 }, 0.5);
    for (let i = 0; i < 40; i++) director.update(1 / 60);
    await done;
    expect(director.shot.dist).toBeCloseTo(shotFor('spotlight', BASE, { x: -2, z: 0 }, { x: 2, z: 0 }).dist);
    const back = director.restore(0.3);
    for (let i = 0; i < 30; i++) director.update(1 / 60);
    await back;
    expect(director.shot).toEqual(BASE);
    expect(director.kind).toBe('tactical');
  });
});
