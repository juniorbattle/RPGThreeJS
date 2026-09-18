import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveStrategicUnitVisual } from './stage/CombatPoseRegistry';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');

describe('Strategic Character System V2 integration', () => {
  it('resolves map sprites explicitly from CombatPoseSet.prepare', () => {
    expect(runtime).toContain("import { resolveStrategicUnitVisual } from './stage/CombatPoseRegistry'");
    expect(runtime).toContain('const strategicVisual=strategicVisualFor(def)');
    expect(runtime).toContain('strategicVisual?.src||def.portrait');
    expect(resolveStrategicUnitVisual('alistair')?.src).toBe('/assets/characters/pixel/combat/alistair/prepare.png');
    expect(resolveStrategicUnitVisual('lancer')?.src).toBe('/assets/characters/pixel/combat/lancer/prepare.png');
    expect(resolveStrategicUnitVisual('village_militia_spearman')?.src).toBe('/assets/characters/pixel/combat/village_militia_spearman/prepare.png');
    expect(resolveStrategicUnitVisual('village_militia_slinger')?.src).toBe('/assets/characters/pixel/combat/village_militia_slinger/prepare.png');
    expect(resolveStrategicUnitVisual('village_militia_brute')).toBeUndefined();
  });

  it('retains portrait exclusively for UI and unmigrated fallback semantics', () => {
    expect(runtime).toContain('function uiPortraitFor(path){ return path; }');
    expect(runtime).toContain('uiPortraitFor(u.portrait)');
    expect(runtime).toContain('uiPortraitFor(def.portrait)');
  });

  it('uses the registry physical scale and authored anchor without strategic rescaling', () => {
    expect(runtime).toContain('const scale=strategic.worldUnitsPerPixel*strategic.scaleCorrection');
    expect(runtime).toContain('const baseY=(strategic.anchor.y-strategic.sourceSizePx.height*0.5)*scale');
    expect(runtime).toContain('if(u.authoritativePhysicalScale)return 1');
  });
});
