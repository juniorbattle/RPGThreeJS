import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { FxDirector } from './FxDirector';
import type { FxEngine } from './FxEngine';
import type { FxRecipe } from './fxRecipes';

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
