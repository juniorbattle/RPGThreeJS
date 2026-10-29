import { describe, expect, it } from 'vitest';
import { apAccentSteps, fieldBeatFor, fieldWaveCells, fxIntensity, scaleStep } from './fxIntensity';
import type { FxStep } from './fxRecipes';

describe('FX weight by AP cost', () => {
  it('grows monotonically with the AP cost, ultimates on top', () => {
    const weights = [1, 2, 3, 4, 5].map((ap) => fxIntensity({ ap }));
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]!.scale).toBeGreaterThan(weights[i - 1]!.scale);
      expect(weights[i]!.count).toBeGreaterThan(weights[i - 1]!.count);
      expect(weights[i]!.glow).toBeGreaterThan(weights[i - 1]!.glow);
    }
    const ultimate = fxIntensity({ ap: 5, ultimate: true });
    expect(ultimate.scale).toBeGreaterThan(weights[4]!.scale);
    expect(ultimate.field).toBe(true);
    expect(weights.some((w) => w.field)).toBe(false);
    expect(fxIntensity().weight).toBe('standard');
  });

  it('scales sizes and counts but never the timing of a step', () => {
    const step: FxStep = { at: 0.42, kind: 'burst', anchor: 'targetChest', p: { count: 20, size: 0.1, speed: 3, duration: 0.5 } };
    const heavy = scaleStep(step, fxIntensity({ ap: 4 }));
    expect(heavy.at).toBe(0.42);
    expect(heavy.p!.duration).toBe(0.5);
    expect(heavy.p!.count as number).toBeGreaterThan(20);
    expect(heavy.p!.size as number).toBeGreaterThan(0.1);
    const cellFlame = scaleStep({ at: 0.3, kind: 'flame', cells: true, p: { width: 1.05, height: 2.6 } }, fxIntensity({ ap: 5 }));
    expect(cellFlame.p!.width).toBe(1.05); // a cell's footprint, whatever the cost
    expect(cellFlame.p!.height as number).toBeGreaterThan(2.6);
    const seal = scaleStep({ at: 0, kind: 'circle', p: { radius: 1.6 } }, fxIntensity({ ultimate: true }));
    expect(seal.p!.pulse).toBe(true);
    expect(scaleStep({ at: 0, kind: 'circle', p: { radius: 1.6 } }, fxIntensity({ ap: 5 })).p!.pulse).toBeUndefined();
    const flash = scaleStep({ at: 0, kind: 'flash', p: { opacity: 0.3 } }, fxIntensity({ ultimate: true }));
    expect(flash.p!.opacity as number).toBeLessThanOrEqual(0.34);
  });

  it('stacks more impact layers on dearer skills', () => {
    const layers = [2, 3, 4, 5].map((ap) => apAccentSteps(0.4, 'fire', fxIntensity({ ap }), true).length);
    expect(layers[0]).toBe(0);
    expect(layers[1]).toBeGreaterThan(0);
    expect(layers[2]).toBeGreaterThan(layers[1]!);
    expect(layers[3]).toBeGreaterThan(layers[2]!);
    // ultimates get the field finale instead of accents
    expect(apAccentSteps(0.4, 'fire', fxIntensity({ ultimate: true }), true)).toEqual([]);
  });

  it('rolls the ultimate field wave across the whole grid, nearest cells first', () => {
    const cells = [];
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 4; gz++) cells.push({ x: (gx - 3.5) * 1.18, z: (gz - 1.5) * 1.18 });
    const wave = fieldWaveCells(cells, { x: -4, z: 0 }, 16);
    expect(wave.length).toBe(16);
    for (let i = 1; i < wave.length; i++) expect(wave[i]!.delay).toBeGreaterThanOrEqual(wave[i - 1]!.delay);
    const xs = wave.map((w) => w.cell.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(7); // spans the field
    expect(fieldBeatFor('fire')).toBe('flame');
    expect(fieldBeatFor('holy')).toBe('pillar');
  });
});
