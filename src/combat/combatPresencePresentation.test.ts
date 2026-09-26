import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveStrategicUnitVisual } from './stage/CombatPoseRegistry';
import { combatLargeUnitPresenceScale, combatVisibleHeight } from './combatPresencePresentation';

describe('large combat presence', () => {
  const hero = combatVisibleHeight(resolveStrategicUnitVisual('alistair'));
  it('uses reviewed alpha-visible height to restore elite and boss presence', () => {
    for (const [id, tier, ratio] of [
      ['serpent_duelist_elite', 'elite', 1.85],
      ['young_dragon_elite', 'elite', 1.85],
      ['forest_troll_elite', 'elite', 1.85],
      ['lion_champion', 'boss', 2],
      ['serpent_general_boss', 'boss', 2],
    ] as const) {
      const visual = resolveStrategicUnitVisual(id)!;
      const scale = combatLargeUnitPresenceScale(visual, tier);
      expect(scale).toBeGreaterThan(1);
      expect(combatVisibleHeight(visual) * scale / hero).toBeCloseTo(ratio, 4);
    }
  });
  it('leaves missing visual metadata at its authored size', () => {
    expect(combatLargeUnitPresenceScale(null, 'boss')).toBe(1);
    expect(combatLargeUnitPresenceScale({ alphaBoundsPx: { top: 10, bottom: 10 }, worldUnitsPerPixel: 1, scaleCorrection: 1 }, 'elite')).toBe(1);
  });
  it('keeps the canonical sprite scale guard and applies presence only to visual geometry', () => {
    const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');
    expect(runtime).toContain('if(u.authoritativePhysicalScale)return 1');
    expect(runtime).toContain('new THREE.PlaneGeometry(s.w*visualPresenceScale,s.h*visualPresenceScale)');
    expect(runtime).toContain('u.baseY=s.baseY*visualPresenceScale');
  });
});
