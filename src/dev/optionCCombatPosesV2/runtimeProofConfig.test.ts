import { describe, expect, it } from 'vitest';
import {
  PILOT_RUNTIME_UNITS,
  RUNTIME_PROOF_SCENARIOS,
  parseRuntimeProofEnvironment,
  runtimePlaneSize,
  visibleAlphaHeightPx,
  worldUnitsPerSourcePixel,
} from './runtimeProofConfig';

describe('Option C Combat Poses V2 runtime proof configuration', () => {
  it('locks the approved scale factors and forbids hidden scale correction', () => {
    expect(PILOT_RUNTIME_UNITS.alistair.deliveryFitScale).toBe(0.68);
    expect(PILOT_RUNTIME_UNITS.goblin.deliveryFitScale).toBe(0.5);
    expect(PILOT_RUNTIME_UNITS['lion-champion'].deliveryFitScale).toBe(0.74);
    expect(Object.values(PILOT_RUNTIME_UNITS).every((unit) => unit.scaleCorrection === 1)).toBe(true);
  });

  it('preserves the required runtime hierarchy', () => {
    const goblin = PILOT_RUNTIME_UNITS.goblin.targetWorldHeight;
    const alistair = PILOT_RUNTIME_UNITS.alistair.targetWorldHeight;
    const lion = PILOT_RUNTIME_UNITS['lion-champion'].targetWorldHeight;
    expect(goblin).toBeLessThan(alistair);
    expect(alistair).toBeLessThan(lion);
  });

  it('maps visible source pixels to the authored target world height without per-pose fitting', () => {
    for (const unit of Object.values(PILOT_RUNTIME_UNITS)) {
      const [, planeHeight] = runtimePlaneSize(unit);
      const visibleWorldHeight = planeHeight * visibleAlphaHeightPx(unit) / unit.canvasPx;
      expect(visibleWorldHeight).toBeCloseTo(unit.targetWorldHeight, 8);
    }
  });

  it('keeps pilot source pixel density within a coherent 1.30 ratio', () => {
    const densities = Object.values(PILOT_RUNTIME_UNITS).map((unit) => 1 / worldUnitsPerSourcePixel(unit));
    expect(Math.max(...densities) / Math.min(...densities)).toBeLessThanOrEqual(1.3);
  });

  it('covers all required production Combat Stage environments and proof compositions', () => {
    expect(Object.values(RUNTIME_PROOF_SCENARIOS).map((scenario) => scenario.environmentAssetId).sort()).toEqual([
      'bois_clair_burning_stage',
      'forest_route_stage',
      'lion_sanctum_stage',
    ]);
    expect(RUNTIME_PROOF_SCENARIOS['all-three'].targets).toEqual(['goblin', 'lion-champion']);
    expect(parseRuntimeProofEnvironment('lion_sanctum_stage', 'forest_route')).toBe('lion_sanctum');
  });
});
