import { describe, expect, it } from 'vitest';
import {
  PILOT_RUNTIME_UNITS,
  RUNTIME_PROOF_SCENARIOS,
  parseRuntimeProofEnvironment,
  runtimePlaneSize,
  visibleAlphaHeightPx,
  worldUnitsPerSourcePixel,
} from './runtimeProofConfig';

describe('Character System V2 runtime proof configuration', () => {
  it('uses promoted production assets with no hidden scale correction', () => {
    for (const unit of Object.values(PILOT_RUNTIME_UNITS).filter((candidate) => candidate.canonicalPromoted)) {
      expect(unit.imageUrl).toMatch(/^\/assets\/characters\/pixel\/combat\//);
      expect(unit.manifestUrl).toBe('/assets/characters/pixel/character-system-v2-manifest.json');
      expect(unit.scaleCorrection).toBe(1);
      expect(worldUnitsPerSourcePixel(unit)).toBe(0.00625);
      expect(unit.useRegistryPose).toBe(true);
    }
  });

  it('maps all eight village militia poses through the promoted production registry', () => {
    const militia = Object.values(PILOT_RUNTIME_UNITS).filter((unit) => unit.id.startsWith('militia-'));
    expect(militia).toHaveLength(8);
    expect(new Set(militia.map((unit) => unit.pose))).toEqual(new Set(['prepare', 'dash', 'attack', 'cast']));
    for (const unit of militia) {
      expect(unit.imageUrl).toMatch(/^\/assets\/characters\/pixel\/combat\/village_militia_/);
      expect(unit.manifestUrl).toBe('/assets/characters/pixel/character-system-v2-manifest.json');
      expect(unit.scaleCorrection).toBe(1);
      expect(unit.canonicalPromoted).toBe(true);
      expect(unit.useRegistryPose).toBe(true);
      expect(unit.expectedManifestStatus).toBe('PROMOTED');
      expect(worldUnitsPerSourcePixel(unit)).toBe(0.00625);
    }
  });

  it('preserves the required strategic/runtime hierarchy', () => {
    const goblin = PILOT_RUNTIME_UNITS.goblin.targetWorldHeight;
    const alistair = PILOT_RUNTIME_UNITS.alistair.targetWorldHeight;
    const lion = PILOT_RUNTIME_UNITS['lion-champion'].targetWorldHeight;
    expect(goblin).toBeLessThan(alistair);
    expect(alistair).toBeLessThan(lion);
  });

  it('maps visible source pixels to world size without per-pose fitting', () => {
    for (const unit of Object.values(PILOT_RUNTIME_UNITS)) {
      const [, planeHeight] = runtimePlaneSize(unit);
      const visibleWorldHeight = planeHeight * visibleAlphaHeightPx(unit) / unit.sourceSizePx[1];
      expect(visibleWorldHeight).toBeCloseTo(unit.targetWorldHeight, 8);
    }
  });

  it('covers 512x512, 640x512, 512x640 and 640x640 production canvases', () => {
    const dimensions = ['canvas-512', 'canvas-640x512', 'canvas-512x640', 'canvas-640x640'].map((scenarioId) => {
      const scenario = RUNTIME_PROOF_SCENARIOS[scenarioId as keyof typeof RUNTIME_PROOF_SCENARIOS];
      return PILOT_RUNTIME_UNITS[scenario.attacker].sourceSizePx.join('x');
    });
    expect(dimensions).toEqual(['512x512', '640x512', '512x640', '640x640']);
  });

  it('covers all required Stage environments and proof compositions', () => {
    expect(new Set(Object.values(RUNTIME_PROOF_SCENARIOS).map((scenario) => scenario.environmentAssetId))).toEqual(new Set([
      'bois_clair_burning_stage',
      'forest_route_stage',
      'lion_sanctum_stage',
    ]));
    expect(RUNTIME_PROOF_SCENARIOS['all-three'].targets).toEqual(['goblin', 'lion-champion']);
    expect(parseRuntimeProofEnvironment('lion_sanctum_stage', 'forest_route')).toBe('lion_sanctum');
  });
});
