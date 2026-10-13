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

const castSource = movementRuntime.slice(movementRuntime.indexOf('const SPRITE_MOTION_PRESETS=UNIT_MOTION_PRESETS;'), movementRuntime.indexOf('function orientMult('));
const killTweenSource = movementRuntime.match(/function killTweens\(obj\)\{[^\n]+/)![0];

function actualCast(reducedInitially = false) {
  const vector = (x: number, y: number, z = 0) => ({ x, y, z, copy(p: { x: number; y: number; z: number }) { this.x = p.x; this.y = p.y; this.z = p.z; } });
  const unit = { gx: 0, gz: 0, size: 1, baseY: 0.9, spriteFacing: 1, visualFacingX: -1, _motionPlaying: false,
    grp: { position: vector(0, 4) },
    spr: { position: vector(0, 0.9), scale: vector(-2, 2, 1), rotation: { z: 0 } },
    outline: { position: vector(0, 0.9), scale: vector(-2.2, 2.2, 1), rotation: { z: 0 } } };
  const harness = new Function('UNIT_MOTION_PRESETS', 'createCanonicalUnitMotionBaseline', 'beginUnitMotion', 'cancelUnitMotion', 'isUnitMotionCurrent', 'onceAsync',
    `let REDUCED_GRAPHICS=${reducedInitially}; const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),cl=clamp,lerp=(a,b,t)=>a+(b-a)*t,easeOutCubic=t=>t,easeInOut=t=>t;
    const cellAt=()=>({topY:4}),wX=x=>x,wZ=z=>z,largeUnitSpriteScale=()=>2; ${tweenSource} ${killTweenSource} ${castSource}
    return {play:playSpriteMotion,advance:updateTweens,setReduced:v=>{REDUCED_GRAPHICS=v;settleReducedCastMotion();},cancel:killSpriteMotion,pending:()=>tweens.length,groupTweens:obj=>tweens.filter(o=>o.obj===obj).length,activeCasts:()=>castMotionBaselines.size};`)(
    UNIT_MOTION_PRESETS, createCanonicalUnitMotionBaseline, beginUnitMotion, cancelUnitMotion, isUnitMotionCurrent, onceAsync,
  );
  return { harness, unit };
}

async function castTrace(preset: string, initially: boolean, switches: Record<number, boolean> = {}, cancelAt?: number, holdUntil?: number) {
  const { harness, unit } = actualCast(initially);
  let releaseHold: (() => void) | undefined;
  const impact = vi.fn(async () => { if (holdUntil !== undefined) await new Promise<void>(resolve => { releaseHold = resolve; }); });
  let finished = false, reduced = initially, completedAt = -1;
  const promise = harness.play(unit, preset, { onImpact: impact }).then(() => { finished = true; });
  const trace: { tick: number; reduced: boolean; y: number; spriteX: number; spriteY: number; outlineX: number; outlineY: number; impacts: number }[] = [];
  for (let tick = 0; tick < 100 && !finished; tick++) {
    if (switches[tick] !== undefined) { reduced = switches[tick]!; harness.setReduced(reduced); }
    if (tick === holdUntil) releaseHold?.();
    if (tick === cancelAt) { harness.cancel(unit); unit.grp.position.y = 9; unit.spr.scale.x = -3; unit.outline.scale.x = -3.3; }
    harness.advance(0.01);
    trace.push({ tick, reduced, y: unit.grp.position.y, spriteX: unit.spr.scale.x, spriteY: unit.spr.scale.y, outlineX: unit.outline.scale.x, outlineY: unit.outline.scale.y, impacts: impact.mock.calls.length });
    for (let flush = 0; flush < 10; flush++) await Promise.resolve();
    if (finished) completedAt = tick;
  }
  expect(finished).toBe(true); await promise; harness.advance(1);
  expect(harness.pending()).toBe(0);
  expect(harness.activeCasts()).toBe(0);
  return { trace, unit, impact, completedAt };
}

describe('actual cast decoration and live reduction', () => {
  it.each(['magic_cast', 'heal_cast', 'buff_cast', 'debuff_cast'])('holds signed baselines without changing completion for %s', async preset => {
    const normal = await castTrace(preset, false), reduced = await castTrace(preset, true);
    expect(normal.trace.some(s => s.y > 4 && s.spriteY < 2 && s.outlineY < 2.2)).toBe(true);
    expect(reduced.trace.every(s => s.y === 4 && s.spriteX === -2 && s.spriteY === 2 && s.outlineX === -2.2 && s.outlineY === 2.2)).toBe(true);
    expect(normal.completedAt).toBe(reduced.completedAt);
    expect(normal.impact).toHaveBeenCalledTimes(1); expect(reduced.impact).toHaveBeenCalledTimes(1);
    expect(normal.unit.grp.position.y).toBe(4); expect(reduced.unit.grp.position.y).toBe(4);
  });

  it.each(['magic_cast', 'heal_cast', 'buff_cast', 'debuff_cast'])('retains impact timing through live lift and recoil changes for %s', async preset => {
    const normal = await castTrace(preset, false);
    const live = await castTrace(preset, false, { 2: true, 8: false, 12: true, 18: false, 25: true, 30: false, 35: true });
    expect(live.trace.filter(s => s.reduced).every(s => s.y === 4 && s.spriteX === -2 && s.spriteY === 2 && s.outlineX === -2.2 && s.outlineY === 2.2)).toBe(true);
    expect(live.trace.some(s => s.tick >= 8 && s.tick < 12 && s.y > 4)).toBe(true);
    expect(live.trace.some(s => s.tick >= 30 && s.tick < 35 && s.y > 4)).toBe(true);
    expect(live.completedAt).toBe(normal.completedAt);
    expect(live.trace.find(s => s.impacts === 1)?.tick).toBe(normal.trace.find(s => s.impacts === 1)?.tick);
    expect(live.impact).toHaveBeenCalledTimes(1);
  });

  it.each(['magic_cast', 'heal_cast', 'buff_cast', 'debuff_cast'])('grounds the held impact pose even without an active tween for %s', async preset => {
    const normal = await castTrace(preset, false, {}, undefined, 40);
    const live = await castTrace(preset, false, { 25: true, 30: false, 35: true }, undefined, 40);
    expect(normal.trace.filter(s => s.tick >= 25 && s.tick < 40).every(s => s.y > 4)).toBe(true);
    expect(live.trace.filter(s => s.reduced).every(s => s.y === 4 && s.spriteX === -2 && s.spriteY === 2 && s.outlineX === -2.2 && s.outlineY === 2.2)).toBe(true);
    expect(live.completedAt).toBe(normal.completedAt);
    expect(live.trace.find(s => s.impacts === 1)?.tick).toBe(normal.trace.find(s => s.impacts === 1)?.tick);
    expect(live.impact).toHaveBeenCalledTimes(1);
  });

  it.each([2, 30])('does not overwrite newer transforms after local motion cancellation at tick %s', async tick => {
    const result = await castTrace('heal_cast', false, {}, tick);
    expect(result.impact).toHaveBeenCalledTimes(tick === 2 ? 0 : 1);
    expect(result.unit.grp.position.y).toBe(9);
    expect(result.unit.spr.scale.x).toBe(-3); expect(result.unit.outline.scale.x).toBe(-3.3);
  });

  it('settles an empty-tween impact hold without completing or overwriting a replacement pose', async () => {
    const { harness, unit } = actualCast();
    let releaseHold!: () => void, finished = false;
    const impact = vi.fn(() => new Promise<void>(resolve => { releaseHold = resolve; }));
    const promise = harness.play(unit, 'heal_cast', { onImpact: impact }).then(() => { finished = true; });
    for(let tick=0; tick<40; tick++){ harness.advance(0.01); for(let n=0;n<10;n++) await Promise.resolve(); }
    expect(impact).toHaveBeenCalledTimes(1); expect(unit._motionPlaying).toBe(true);
    expect(unit.grp.position.y).toBeGreaterThan(4); expect(harness.groupTweens(unit.grp.position)).toBe(0);
    harness.setReduced(true); harness.advance(0);
    expect(unit.grp.position.y).toBe(4); expect(unit.spr.scale.x).toBe(-2); expect(unit.outline.scale.x).toBe(-2.2);
    expect(finished).toBe(false); expect(impact).toHaveBeenCalledTimes(1);
    harness.cancel(unit); unit.grp.position.y=9; unit.spr.scale.x=-3; unit.outline.scale.x=-3.3;
    harness.advance(0.1); releaseHold(); await promise; harness.advance(1);
    expect(unit.grp.position.y).toBe(9); expect(unit.spr.scale.x).toBe(-3); expect(unit.outline.scale.x).toBe(-3.3);
    expect(impact).toHaveBeenCalledTimes(1); expect(harness.pending()).toBe(0); expect(harness.activeCasts()).toBe(0);
  });

  it('keeps teleport outside cast decoration reduction', async () => {
    const normal = await castTrace('teleport', false), reduced = await castTrace('teleport', true);
    expect(normal.trace.map(s => s.y)).toEqual(reduced.trace.map(s => s.y));
    expect(normal.trace.map(s => [s.spriteX,s.spriteY,s.outlineX,s.outlineY])).toEqual(reduced.trace.map(s => [s.spriteX,s.spriteY,s.outlineX,s.outlineY]));
    expect(reduced.trace.some(s => s.y > 4)).toBe(true);
    expect(normal.completedAt).toBe(reduced.completedAt);
  });
});
