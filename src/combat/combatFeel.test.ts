import { describe, expect, it } from 'vitest';
import { combatFeelProfileId, resolveCombatFeel } from './combatFeel';

describe('combat feel profiles', () => {
  it('keeps combat feel inputs presentation-only', () => {
    expect(combatFeelProfileId({ motionPreset: 'melee_light', visualTier: 1 })).toBe('light');
    expect(combatFeelProfileId({ motionPreset: 'melee_heavy', visualTier: 3 })).toBe('heavy');
    expect(combatFeelProfileId({ motionPreset: 'heal_cast', visualTier: 4 })).toBe('support');
    expect(combatFeelProfileId({ motionPreset: 'magic_cast', visualTier: 3 })).toBe('cast');
    expect(combatFeelProfileId({ motionPreset: 'ranged_attack', visualTier: 2 })).toBe('ranged');
    expect(combatFeelProfileId({ motionPreset: 'buff_cast', visualTier: 6 })).toBe('boss');
  });

  it('gives bosses and heavy actions more anticipation and impact weight than light actions', () => {
    const light = resolveCombatFeel({ motionPreset: 'melee_light' });
    const heavy = resolveCombatFeel({ motionPreset: 'melee_heavy' });
    const boss = resolveCombatFeel({ motionPreset: 'melee_heavy', boss: true });
    expect(heavy.motionDurationScale).toBeGreaterThan(light.motionDurationScale);
    expect(heavy.impactHold).toBeGreaterThan(light.impactHold);
    expect(boss.motionDurationScale).toBeGreaterThan(heavy.motionDurationScale);
    expect(boss.shakeFrequency).toBeLessThan(heavy.shakeFrequency);
  });

  it('reduces secondary movement and hold without removing the profile', () => {
    const normal = resolveCombatFeel({ motionPreset: 'melee_heavy', boss: true });
    const reduced = resolveCombatFeel({ motionPreset: 'melee_heavy', boss: true, reducedGraphics: true });
    expect(reduced.id).toBe(normal.id);
    expect(reduced.motionIntensity).toBeLessThan(normal.motionIntensity);
    expect(reduced.impactHold).toBeLessThan(normal.impactHold);
  });
});
