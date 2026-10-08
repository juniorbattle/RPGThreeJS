import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  UNIT_MOTION_PRESETS,
  beginUnitMotion,
  cancelUnitMotion,
  createCanonicalUnitMotionBaseline,
  isUnitMotionCurrent,
  onceAsync,
} from './unitMotion';

describe('unit motion foundation', () => {
  it('defines movement cadence within the existing per-cell timing budget', () => {
    const movement = UNIT_MOTION_PRESETS.move_step;
    expect((movement.stepHalf ?? 0) * 2).toBe(0.13);
    expect(movement.settle).toBeLessThanOrEqual(0.08);
  });

  it('builds a complete canonical baseline with signed scales', () => {
    expect(createCanonicalUnitMotionBaseline({
      group: { x: 3, y: 0.4, z: -2 },
      baseY: 0.9,
      spriteScaleX: -1.25,
      spriteScaleY: 1.25,
      outlineScaleX: -1.375,
      outlineScaleY: 1.375,
    })).toEqual({
      group: { x: 3, y: 0.4, z: -2 },
      spritePosition: { x: 0, y: 0.9, z: 0 },
      spriteScale: { x: -1.25, y: 1.25, z: 1 },
      spriteRotationZ: 0,
      outlinePosition: { x: 0, y: 0.9, z: 0 },
      outlineScale: { x: -1.375, y: 1.375, z: 1 },
      outlineRotationZ: 0,
    });
  });

  it('invalidates stale motion epochs on cancel', () => {
    const owner = {};
    const first = beginUnitMotion(owner);
    expect(isUnitMotionCurrent(owner, first)).toBe(true);
    const cancelledAt = cancelUnitMotion(owner);
    expect(cancelledAt).toBeGreaterThan(first);
    expect(isUnitMotionCurrent(owner, first)).toBe(false);
  });

  it('runs an impact callback exactly once', async () => {
    const callback = vi.fn(async () => 7);
    const impact = onceAsync(callback);
    await expect(Promise.all([impact(), impact(), impact()])).resolves.toEqual([7, 7, 7]);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});


const movementRuntime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
const tweenSource = movementRuntime.slice(movementRuntime.indexOf('const tweens=[];'), movementRuntime.indexOf('// ============================= RENDERER'));
const movementSource = movementRuntime.slice(movementRuntime.indexOf('async function moveAlong('), movementRuntime.indexOf('function tickStatusDamage('));

function actualMovement(reducedInitially = false) {
  const position = { x: 0, y: 4, z: 0, clone() { return { x: this.x, y: this.y, z: this.z }; } };
  const unit = { grp: { position }, spr: { rotation: { z: 0 }, scale: { x: -2, y: 2 } }, outline: { rotation: { z: 0 }, scale: { x: -2.2, y: 2.2 } }, facing: { dx: -1 }, gx: 0, gz: 0 };
  const game = { busy: false }, commits: number[][] = [];
  const cells = [{ topY: 4, occupant: unit as typeof unit | null }, { topY: 3, occupant: null as typeof unit | null }, { topY: 1, occupant: null as typeof unit | null }];
  const restore = vi.fn();
  const harness = new Function('G', 'UNIT_MOTION_PRESETS', 'beginUnitMotion', 'isUnitMotionCurrent', 'killSpriteMotion', 'clearHL', 'cellAt', 'spriteScaleSign', 'largeUnitSpriteScale', 'setFacing', 'wX', 'wZ', 'placeUnit', 'restoreUnitVisualBaseline',
    `let REDUCED_GRAPHICS=${reducedInitially}; const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,easeOutCubic=t=>t,easeInOut=t=>t; ${tweenSource} ${movementSource}; return {tweenP,advance:updateTweens,moveAlong,setReduced:value=>{REDUCED_GRAPHICS=value;},pending:()=>tweens.length};`)(
    game, UNIT_MOTION_PRESETS, beginUnitMotion, isUnitMotionCurrent, cancelUnitMotion, () => {},
    (gx: number) => cells[gx], (sprite: { scale: { x: number } }) => Math.sign(sprite.scale.x), () => 2, () => {}, (x: number) => x, (z: number) => z,
    (u: typeof unit, gx: number, gz: number) => { cells[u.gx]!.occupant = null; cells[gx]!.occupant = u; u.gx = gx; u.gz = gz; commits.push([gx, gz]); }, restore,
  );
  return { harness, unit, game, commits, cells, restore };
}

describe('actual ordinary movement completion and live reduction', () => {
  it('keeps untagged tweens unchanged by motion preferences', async () => {
    const { harness } = actualMovement();
    const position = { x: 0, y: 0 };
    const completed = vi.fn();
    const promise = harness.tweenP(position, { x: 8, y: 2 }, 1, (t: number) => t).then(completed);
    harness.advance(0.25); expect(position).toEqual({ x: 2, y: 0.5 });
    harness.setReduced(true); harness.advance(0.25); expect(position).toEqual({ x: 4, y: 1 });
    harness.advance(0.5); await promise; harness.advance(1);
    expect(position).toEqual({ x: 8, y: 2 }); expect(completed).toHaveBeenCalledTimes(1);
  });

  it('switches tagged decoration in flight without changing progress or resolving early', async () => {
    const { harness } = actualMovement();
    const position = { x: 0, y: 0, z: 0 }, completed = vi.fn();
    const promise = harness.tweenP(position, { x: 8, y: 2, z: 4 }, 1, (t: number) => t, { from: { y: 0 }, to: { y: 0 } }).then(completed);
    harness.advance(0.25); expect(position).toEqual({ x: 2, y: 0.5, z: 1 });
    harness.setReduced(true); harness.advance(0.25); expect(position).toEqual({ x: 4, y: 0, z: 2 });
    expect(completed).not.toHaveBeenCalled();
    harness.setReduced(false); harness.advance(0.25); expect(position).toEqual({ x: 6, y: 1.5, z: 3 });
    harness.advance(0.25); await promise; harness.advance(1);
    expect(position).toEqual({ x: 8, y: 2, z: 4 }); expect(completed).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('commits a descending multi-cell path once with initial reduction %s', async reduced => {
    const { harness, unit, game, commits, cells, restore } = actualMovement(reduced);
    let finished = false;
    const promise = harness.moveAlong(unit, [[1, 0], [2, 0]]).then(() => { finished = true; });
    expect(game.busy).toBe(true);
    let decorated = false;
    for (let tick = 0; tick < 100 && !finished; tick++) {
      harness.advance(0.01);
      decorated ||= Math.abs(unit.spr.rotation.z) > 0 || unit.grp.position.y > 4;
      if (reduced) {
        expect(unit.grp.position.y).toBeGreaterThanOrEqual(1);
        expect(unit.grp.position.y).toBeLessThanOrEqual(4);
        expect(unit.spr.rotation.z).toBe(0); expect(unit.outline.rotation.z).toBe(0);
        expect(unit.spr.scale).toEqual({ x: -2, y: 2 }); expect(unit.outline.scale).toEqual({ x: -2.2, y: 2.2 });
      }
      await Promise.resolve(); await Promise.resolve();
    }
    expect(finished).toBe(true); await promise;
    expect(decorated).toBe(!reduced); expect(commits).toEqual([[2, 0]]);
    expect(unit.gx).toBe(2); expect(unit.grp.position).toMatchObject({ x: 2, y: 1, z: 0 });
    expect(cells[0]!.occupant).toBeNull(); expect(cells[2]!.occupant).toBe(unit);
    expect(game.busy).toBe(false); expect(restore).toHaveBeenCalledTimes(1); expect(harness.pending()).toBe(0);
  });

  it('finishes the actual multi-step move once through both live preference changes', async () => {
    const { harness, unit, game, commits, cells, restore } = actualMovement();
    let finished = false;
    const promise = harness.moveAlong(unit, [[1, 0], [2, 0]]).then(() => { finished = true; });
    for (let tick = 0; tick < 100 && !finished; tick++) {
      if(tick===2)harness.setReduced(true);
      if(tick===12)harness.setReduced(false);
      if(tick===18)harness.setReduced(true);
      harness.advance(0.01);
      if(tick>=2&&tick<12||tick>=18){
        expect(unit.spr.rotation.z).toBe(0); expect(unit.outline.rotation.z).toBe(0);
        expect(unit.spr.scale).toEqual({x:-2,y:2}); expect(unit.outline.scale).toEqual({x:-2.2,y:2.2});
        expect(unit.grp.position.y).toBeGreaterThanOrEqual(1); expect(unit.grp.position.y).toBeLessThanOrEqual(4);
      }
      await Promise.resolve(); await Promise.resolve();
    }
    expect(finished).toBe(true); await promise;
    expect(commits).toEqual([[2,0]]); expect(unit.grp.position).toMatchObject({x:2,y:1,z:0});
    expect(cells[0]!.occupant).toBeNull(); expect(cells[2]!.occupant).toBe(unit);
    expect(game.busy).toBe(false); expect(restore).toHaveBeenCalledTimes(1); expect(harness.pending()).toBe(0);
  });
});
