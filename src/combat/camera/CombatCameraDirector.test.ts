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
      for (const kind of ['action', 'skill', 'focus', 'aoe', 'spotlight', 'impact'] as const) {
        expect(Math.abs(shotFor(kind, BASE, { x, z: 1 }, { x: tx, z: -1 }).yaw)).toBeLessThanOrEqual(0.24);
      }
    }
  });

  it('grades the focus: attack push-in, then skill, then elite or boss focus, then spotlight', () => {
    for (const [actor, target] of [
      [{ x: -2.95, z: 0.59 }, { x: 1.77, z: -0.59 }],
      [{ x: 4.1, z: 0 }, { x: -2.4, z: 1.2 }], // a boss on its 2x2 footprint toward a hero
      [{ x: 0.5, z: 0.6 }, { x: 0.5, z: 0.6 }], // a self buff: the caster alone
    ]) {
      const action = shotFor('action', BASE, actor, target), skill = shotFor('skill', BASE, actor, target);
      const focus = shotFor('focus', BASE, actor, target), spot = shotFor('spotlight', BASE, actor, target);
      expect(skill.dist).toBeLessThan(action.dist);
      expect(focus.dist).toBeLessThan(skill.dist);
      expect(spot.dist).toBeLessThan(focus.dist);
      expect(skill.height).toBeLessThan(action.height);
      expect(focus.height).toBeLessThan(skill.height);
      expect(spot.height).toBeLessThan(focus.height);
      // bounded: never closer than the spotlight's floor, the arena still fills the background
      expect(focus.dist).toBeGreaterThanOrEqual(BASE.dist * 0.5);
    }
  });

  it('eases a skill focus in softly (sine) and lands on the same shot', async () => {
    const actor = { x: -2, z: 0 }, target = { x: 2, z: 0 };
    const cubic = new CombatCameraDirector(BASE), sine = new CombatCameraDirector(BASE);
    cubic.sway = 0; sine.sway = 0;
    const a = cubic.frame('skill', actor, target, 0.6, 'cubic'), b = sine.frame('skill', actor, target, 0.6, 'sine');
    cubic.update(0.06); sine.update(0.06);
    // at 10 % of the move the sine ease has gone further, then both slow into the same shot
    expect(BASE.dist - sine.shot.dist).toBeGreaterThan(BASE.dist - cubic.shot.dist);
    for (let i = 0; i < 40; i++) { cubic.update(1 / 60); sine.update(1 / 60); }
    await Promise.all([a, b]);
    expect(sine.shot.dist).toBeCloseTo(shotFor('skill', BASE, actor, target).dist);
    expect(sine.shot).toEqual(cubic.shot);
  });

  it('reports rest only on the overview with no move in flight', () => {
    const director = new CombatCameraDirector(BASE);
    expect(director.atRest).toBe(true);
    void director.frame('focus', { x: -2, z: 0 }, { x: 2, z: 0 }, 0.5, 'sine');
    expect(director.atRest).toBe(false);
    void director.restore(0.4, 'sine');
    expect(director.atRest).toBe(false); // still travelling back
    for (let i = 0; i < 30; i++) director.update(1 / 60);
    expect(director.atRest).toBe(true);
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
