import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getUnitVisualState } from '../unitVisualState';

// The Combat Stage scene was retired (actions now play in the arena with the
// spotlight camera). The tactical feedback contracts below still hold.
const runtimeSource = readFileSync(path.resolve(__dirname, '..', 'legacyCombatRuntime.js'), 'utf8');

// ============================================================
// P0 — FEEDBACK DEDUPLICATION (runtime source contracts)
// ============================================================

describe('R0B.3 P0 feedback deduplication', () => {
  it('applyStatus suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,(d.name||st).toUpperCase()");
  });

  it('knockOut suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(u,'K.O.'");
  });

  it('dispel effect suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ'");
  });

  it('cure action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ':'—'");
  });

  it('dispelAllies post-action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(n&&!G.stage)floatText(t,'PURIFIÉ'");
  });

  it('status-only action suppresses floatText when G.stage is true', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,sn.toUpperCase()+' !'");
  });

  it('applyHeal floatText is NOT suppressed (heal number stays once)', () => {
    expect(runtimeSource).toContain("floatText(u,'+'+amt,'#7ed957')");
  });

  it('damage number floatText in attack loop is NOT suppressed', () => {
    expect(runtimeSource).toContain("floatText(t,(crit?'✦ ':'')+'-'+dmg");
  });

  it('reviveUnit floatText is NOT suppressed (heal number for revive stays)', () => {
    expect(runtimeSource).toContain("floatText(u,'+'+hp,'#7ed957',true)");
  });

  it('Stage aftermath does not emit +SOIN heal label', () => {
    expect(runtimeSource).not.toContain("'+SOIN'");
  });

});

// ============================================================
// P1 — TACTICAL KO HERO GHOST
// ============================================================

describe('R0B.3 P1 tactical KO hero ghost', () => {
  it('KO player tactical representation remains visible (getUnitVisualState)', () => {
    const state = getUnitVisualState('player', false, true);
    expect(state.visible).toBe(true);
    expect(state.bodyOpacity).toBeGreaterThan(0);
  });

  it('KO player tactical visual is red/translucent (knockOut sets red tint)', () => {
    expect(runtimeSource).toContain("if(u.team==='player'&&u.mat&&u.mat.color)u.mat.color.set('#ff5a4a')");
  });

  it('KO enemy behavior remains existing (invisible, no ghost)', () => {
    const state = getUnitVisualState('foe', false, true);
    expect(state.visible).toBe(false);
    expect(state.bodyOpacity).toBe(0);
  });

  it('spotlight exit restores red tint for KO player units', () => {
    expect(runtimeSource).toContain("if(!o.alive&&o.downed&&o.team==='player'&&o.mat&&o.mat.color)o.mat.color.set('#ff5a4a')");
  });
});
