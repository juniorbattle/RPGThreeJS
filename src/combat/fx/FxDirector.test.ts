import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { combatAudioMessageSchema } from '../CombatAudio';
import { FxDirector } from './FxDirector';
import type { FxEngine } from './FxEngine';
import type { FxRecipe } from './fxRecipes';
import { skillFxRecipe, skillMoveFxRecipe } from './fxSkills';

const recipe: FxRecipe = {
  id: 'test', element: 'shadow', impactAt: 0.1, duration: 0.5, authored: true,
  steps: [
    { at: 0, kind: 'dome', anchor: 'sourceGround', p: { radius: 1.4 } },
    { at: 0, kind: 'slash', anchor: 'targetChest', p: { size: 2.2 } },
    { at: 0, kind: 'motes', anchor: 'target', p: { radius: 0.5, rise: 1.6 } },
    { at: 0, kind: 'ring', anchor: 'point', p: { radius: 2 } },
    { at: 0, kind: 'shot', anchor: 'sourceChest', to: 'targetChest', p: { size: 0.5 } },
    { at: 0, kind: 'burst', anchor: 'sourceMouth', p: { life: 0.5, reach: true, spray: 'target' } },
  ],
};

function play(sourceHeight: number, targetHeight: number) {
  const engine = { after: (_: number, run: () => void) => run(), wait: () => Promise.resolve(), reduced: false, hooks: {}, dome: vi.fn(), slash: vi.fn(), motes: vi.fn(), ring: vi.fn(), projectile: vi.fn(), burst: vi.fn() };
  const unit = (height: number, x: number) => ({ position: new THREE.Vector3(x, 0, 0), height });
  new FxDirector(engine as unknown as FxEngine).play(recipe, { source: unit(sourceHeight, 0), targets: [unit(targetHeight, 10)], point: new THREE.Vector3(10, 0, 0), cells: [] });
  return engine;
}
const option = (spy: ReturnType<typeof vi.fn>, key: string, arg = 2) => (spy.mock.calls[0]?.[arg] as Record<string, number>)[key];

describe('FxDirector sound marks', () => {
  const unit = { position: new THREE.Vector3(), height: 2 };
  function sounds(recipes: readonly FxRecipe[], soundWeight: 'l' | 'm' | 'h' = 'l') {
    const mark = vi.fn(), sfx = vi.fn();
    const engine = new Proxy({ after: (_: number, run: () => void) => run(), wait: () => Promise.resolve(), palette: () => ({}), reduced: false, hooks: { mark, sfx } } as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : () => {}),
    });
    const director = new FxDirector(engine as unknown as FxEngine);
    for (const recipe of recipes) director.play(recipe, { source: unit, targets: [unit], point: new THREE.Vector3(), cells: [new THREE.Vector3()], soundWeight });
    return { mark, sfx };
  }

  it('tells the marks of a depart, an arrival and a skill of one action apart by their recipe', () => {
    const { mark } = sounds([skillMoveFxRecipe('a_hawk_leap', 'depart')!, skillMoveFxRecipe('a_hawk_leap', 'arrive')!, skillFxRecipe('a_hawk_leap')!], 'm');
    expect(mark.mock.calls).toEqual([
      ['fx.dash.wind.l', 0, 'a_hawk_leap_depart'],
      ['fx.land.earth.l', 0, 'a_hawk_leap_arrive'],
      ['fx.shot.wind.m', 0, 'a_hawk_leap'],
    ]);
  });

  it('carries the weight of the action and tells two steps of one shared recipe apart', () => {
    const shared: FxRecipe = { id: 'shared', element: 'steel', impactAt: 0.1, duration: 0.5, steps: [
      { at: 0, kind: 'sfx', p: { id: 'slash' } }, { at: 0.2, kind: 'sfx', p: { id: 'slash' } },
    ] };
    const { sfx } = sounds([shared], 'h');
    expect(sfx.mock.calls.map((call) => (call[1] as { key: string; weight: string }))).toEqual([
      expect.objectContaining({ key: 'shared:0', weight: 'h' }), expect.objectContaining({ key: 'shared:0.2', weight: 'h' }),
    ]);
  });

  it('keys its cues in the runtime by mark, recipe and step, and weighs them without this turn\'s surcharge', () => {
    const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
    expect(runtime).toContain("combatCue(cue,'mark'+index+'.'+recipe)");
    expect(runtime).toContain("combatCue(cue,'step-'+id+'.'+(step?.key??''))");
    expect(runtime).toContain("soundWeight(spec.key==='attack'?(spec.charge||0)+1:spec.item?1:spec.ap,u?.visualHeight)");
    expect(runtime).not.toContain('soundWeight(spec.ap');
    expect(combatAudioMessageSchema.safeParse({ type: 'rpg-threejs:combat-sound', sessionId: 's', id: 'fx.land.earth.l', eventId: 'action-12:mark0.a_hawk_leap_arrive:' }).success).toBe(true);
    expect(combatAudioMessageSchema.safeParse({ type: 'rpg-threejs:combat-sound', sessionId: 's', id: 'fx.blade.steel.l', eventId: 'action-12:step-slash.sword_slash:0.2:' }).success).toBe(true);
  });
});

describe('FxDirector field shot', () => {
  const cells = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 0, 0)];
  const unit = { position: new THREE.Vector3(), height: 2 };
  const engine = { after: vi.fn(), wait: () => Promise.resolve(), palette: () => ({}), reduced: false, hooks: {} };
  const duration = (written: number) => new FxDirector(engine as unknown as FxEngine)
    .play({ id: 'test', element: 'fire', impactAt: 1, duration: written, steps: [] }, { source: unit, targets: [unit], point: new THREE.Vector3(), cells, power: { ultimate: true } }).duration;

  it('closes under a second and a half after the blow', () => {
    expect(duration(1.2)).toBeCloseTo(2.29);
  });

  it('never closes before the recipe has played', () => {
    expect(duration(3)).toBe(3);
  });
});

describe('FxDirector body scale', () => {
  it('draws what wraps a boss to its height', () => {
    const engine = play(4.4, 4.4);
    expect(option(engine.dome, 'radius')).toBeCloseTo(2.57);
    expect(option(engine.motes, 'radius')).toBeCloseTo(0.92);
    expect(option(engine.motes, 'rise')).toBeCloseTo(2.93);
  });

  it('throws bigger from a bigger body', () => {
    expect(option(play(4.8, 2).projectile, 'size', 3)).toBeCloseTo(1);
    expect(option(play(2, 2).projectile, 'size', 3)).toBeCloseTo(0.5);
  });

  it('lands a breath from the mouth on the target, however far it stands', () => {
    const engine = play(4, 2);
    const mouth = engine.burst.mock.calls[0]?.[0] as THREE.Vector3;
    expect(mouth.x).toBeCloseTo(1.44);
    expect(mouth.y).toBeCloseTo(3.12);
    expect(option(engine.burst, 'speed')).toBeCloseTo(mouth.distanceTo(new THREE.Vector3(10, 0.8, 0)) / 0.5);
  });

  it('keeps a blow and a place on the ground at their written size', () => {
    const engine = play(4.4, 4.4);
    expect(option(engine.slash, 'size')).toBeCloseTo(2.2);
    expect(option(engine.ring, 'radius')).toBeCloseTo(2);
  });

  it('never shrinks an effect on a small unit', () => {
    const engine = play(1.2, 1.2);
    expect(option(engine.dome, 'radius')).toBeCloseTo(1.4);
    expect(option(engine.motes, 'radius')).toBeCloseTo(0.5);
  });
});
