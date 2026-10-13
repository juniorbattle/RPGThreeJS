import { describe, expect, it } from 'vitest';
import { resolveBossIntentVisualState } from './bossIntentPresentation';

describe('boss intent presentation', () => {
  it('uses the existing boss and elite warning thresholds', () => {
    expect(resolveBossIntentVisualState({ alive: true, boss: true, ap: 3, cooldown: 1 })?.level).toBe('charge');
    expect(resolveBossIntentVisualState({ alive: true, elite: true, ap: 5, cooldown: 0 })?.level).toBe('ultimate');
    expect(resolveBossIntentVisualState({ alive: true, boss: true, ap: 4, cooldown: 0 })?.level).toBe('charge');
    expect(resolveBossIntentVisualState({ alive: true, boss: true, ap: 5, cooldown: 2 })).toBeNull();
  });

  it('never presents ordinary or defeated units from gameplay state', () => {
    expect(resolveBossIntentVisualState({ alive: true, ap: 5, cooldown: 0 })).toBeNull();
    expect(resolveBossIntentVisualState({ alive: false, boss: true, ap: 5, cooldown: 0 })).toBeNull();
  });

  it('makes bosses stronger than elites while preserving opacity floors', () => {
    const boss = resolveBossIntentVisualState({ alive: true, boss: true, ap: 5, cooldown: 0 });
    const elite = resolveBossIntentVisualState({ alive: true, elite: true, ap: 5, cooldown: 0 });
    expect(boss?.minOpacity).toBe(0.85);
    expect(elite?.minOpacity).toBe(0.75);
    expect(boss!.badgeScale).toBeGreaterThan(elite!.badgeScale);
    expect(boss!.ringPulse).toBeGreaterThan(elite!.ringPulse);
    expect(boss!.silhouettePulse).toBeGreaterThan(elite!.silhouettePulse);
  });

  it('reduces the warning to badge and ring presentation in reduced graphics', () => {
    const normal = resolveBossIntentVisualState({ alive: true, boss: true, ap: 5, cooldown: 0 });
    const reduced = resolveBossIntentVisualState({ alive: true, boss: true, ap: 5, cooldown: 0 }, true);
    expect(reduced?.label).toBe('ULTIME');
    expect(reduced?.silhouettePulse).toBe(0);
    expect(reduced!.ringPulse).toBeLessThan(normal!.ringPulse);
  });

  it('supports presentation-only QA previews without changing gameplay fields', () => {
    const source = { alive: true, ap: 0, cooldown: 5, previewLevel: 'charge' as const };
    expect(resolveBossIntentVisualState(source)?.label).toBe('CHARGE');
    expect(source).toEqual({ alive: true, ap: 0, cooldown: 5, previewLevel: 'charge' });
  });
});
