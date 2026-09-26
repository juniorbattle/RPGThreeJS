import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isExhausted } from './combatExhaustion';

const runtime = readFileSync(new URL('./legacyCombatRuntime.js', import.meta.url), 'utf8');

describe('Essoufflé participation', () => {
  it('distinguishes staged zero AP from real exhaustion', () => {
    expect(isExhausted({ alive: true, ap: 0, _hasStartedTurn: false })).toBe(false);
    expect(isExhausted({ alive: true, ap: 1, _hasStartedTurn: true })).toBe(false);
    expect(isExhausted({ alive: true, ap: 0, _hasStartedTurn: true })).toBe(true);
    expect(isExhausted({ alive: false, ap: 0, _hasStartedTurn: true })).toBe(false);
  });

  it('marks first real beginTurn before unchanged AP regeneration and shares the predicate', () => {
    expect(runtime).toContain('_hasStartedTurn:false');
    expect(runtime).toMatch(/async function beginTurn\(u\)\{ if\(G.over\)return; u\._hasStartedTurn=true;/);
    expect(runtime).toContain('const regen=(u.boss||u.elite)?2:1; u.ap=Math.min(u.maxap,u.ap+regen)');
    expect(runtime).toContain('ap:QA_FULL_AP?unitMaxAp:0');
    expect(runtime.match(/exhausted:isExhausted\(u\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(runtime).toContain('const group=u.statusIndicatorGroup,exhausted=isExhausted(u)');
    expect(runtime).not.toContain('G.round>1&&u.ap<=0');
  });
});
