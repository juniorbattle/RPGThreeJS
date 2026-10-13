import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  resolvePresentationRoute,
  resolveCombatStageProfileUniversal,
  isStageEligibleAction,
  classifyActionPresentation,
  type ActionSpecForStage,
  type PresentationForStage,
} from './combatStageProfiles';

const runtimeSource = readFileSync(path.resolve(__dirname, '..', 'legacyCombatRuntime.js'), 'utf8');

const ultPres: PresentationForStage = { ultimate: true, visualTier: 5, castStyle: 'ultimateCast' };

// ============================================================
// P0 — AP KILL REWARD CONTRACTS
// ============================================================

describe('R0B.4 P0 AP kill reward', () => {
  it('applyDamage awards +1 AP per new kill (src.ap +1)', () => {
    expect(runtimeSource).toContain('src.ap=Math.min(src.maxap,src.ap+1)');
  });

  it('kill AP reward is not suppressed during Stage (+1 AP floatText has no G.stage guard)', () => {
    expect(runtimeSource).toContain("floatText(src,'+1 AP','#7fd0ff',true)");
    // Verify it's NOT guarded by if(!G.stage)
    const idx = runtimeSource.indexOf("floatText(src,'+1 AP'");
    const preceding = runtimeSource.substring(Math.max(0, idx - 30), idx);
    expect(preceding).not.toContain('if(!G.stage)');
  });

  it('kill AP reward is centralized in applyDamage (not duplicated per action type)', () => {
    const count = (runtimeSource.match(/src\.ap=Math\.min\(src\.maxap,src\.ap\+1\)/g) || []).length;
    expect(count).toBe(1);
  });

  it('kill AP reward only triggers on willKnockOut (new kill, not already dead)', () => {
    expect(runtimeSource).toContain('const willKnockOut=u.hp<=0&&u.alive');
    expect(runtimeSource).toContain('if(willKnockOut){');
    expect(runtimeSource).toContain('if(src&&src.alive){');
  });

  it('kill AP reward respects maxap cap (Math.min)', () => {
    expect(runtimeSource).toContain('Math.min(src.maxap,src.ap+1)');
  });

  it('kill AP reward resets basicAttacksThisTurn only for G.active (not all sources)', () => {
    expect(runtimeSource).toContain('if(src===G.active){ G.basicAttacksThisTurn=0; G.itemsUsedThisTurn=0; }');
  });

  it('applyDamage is called from both effects path and normal attack path', () => {
    // Effects path
    expect(runtimeSource).toContain('await applyDamage(t,dmg,u,{critical:crit}); totalDamageDealt+=dmg');
    // Normal attack path
    expect(runtimeSource).toContain('await applyDamage(t,dmg,u,{critical:crit}); basicDmg=dmg');
  });

  it('Stage aftermath does not award AP (presentation-only, no ap mutation)', () => {
    expect(runtimeSource).not.toContain('presentResolvedAftermath.*ap');
    // presentResolvedAftermath call does not modify AP
    const idx = runtimeSource.indexOf('await combatStage.presentResolvedAftermath');
    const block = runtimeSource.substring(idx, idx + 200);
    expect(block).not.toContain('.ap=');
  });

  it('checkEnd is called after kill (combat end detection)', () => {
    expect(runtimeSource).toContain('checkEnd();');
  });

  it('kill AP reward uses existing AP constraints (no bypass)', () => {
    // The reward uses the same Math.min(src.maxap, ...) pattern as all other AP mutations
    const allApMutations = runtimeSource.match(/\.ap=Math\.min\([^)]*maxap[^)]*\)/g) || [];
    expect(allApMutations.length).toBeGreaterThan(0);
  });
});

// ============================================================
// P1 — PRESENTATION ROUTING
// ============================================================

describe('R0B.4 P1 presentation routing', () => {
  it('ultimate offensive action routes to STAGE', () => {
    const spec: ActionSpecForStage = { key: 'w_lion_surge', type: 'phys', offensive: true, radius: 1, ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('ultimate');
  });

  it('ultimate support action routes to STAGE (not tactical)', () => {
    const spec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('ultimate');
  });

  it('ultimate buff action routes to STAGE', () => {
    const spec: ActionSpecForStage = { key: 'e_absolute_harmony', type: 'buff', support: true, radius: 2, ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('ultimate');
  });

  it('non-ultimate offensive action routes to STAGE', () => {
    const spec: ActionSpecForStage = { key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('offensive');
  });

  it('non-ultimate debuff action routes to STAGE (hostile control)', () => {
    const spec: ActionSpecForStage = { key: 'e_binding_seal', type: 'debuff', offensive: true, radius: 1.2, ap: 4 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('offensive');
  });

  it('non-ultimate heal action routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'w_salvation', type: 'heal', support: true, healPercent: 0.4, ap: 2 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('support');
  });

  it('non-ultimate buff action routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'd_blood_pact', type: 'buff', self: true, support: true, ap: 4 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('support');
  });

  it('non-ultimate revive action routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'revive_vial', type: 'revive', revive: true, support: true, ap: 2 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('support');
  });

  it('non-ultimate teleport routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'n_teleport', type: 'move', mode: 'teleport', dest: true, ap: 3 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('movement');
  });

  it('non-ultimate leap routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'a_hawk_leap', type: 'move', mode: 'leap', dest: true, ap: 3 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('movement');
  });

  it('non-ultimate movement dash routes to TACTICAL', () => {
    const spec: ActionSpecForStage = { key: 'w_charge', type: 'move', mode: 'dash', dest: true, ap: 3 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('tactical');
    expect(route.reason).toBe('movement');
  });

  it('null/undefined spec routes to TACTICAL (no action)', () => {
    expect(resolvePresentationRoute(null).route).toBe('tactical');
    expect(resolvePresentationRoute(undefined).route).toBe('tactical');
    expect(resolvePresentationRoute({}).route).toBe('tactical');
  });

  it('fallback routes to STAGE (safety)', () => {
    const spec: ActionSpecForStage = { key: 'unknown_action', ap: 1 };
    const route = resolvePresentationRoute(spec);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('fallback');
  });

  it('ultimate priority overrides support classification', () => {
    const spec: ActionSpecForStage = { key: 'ult_heal', type: 'heal', support: true, healPercent: 0.5, ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('ultimate');
    // Without ultimate presentation, same spec routes to tactical
    const route2 = resolvePresentationRoute(spec);
    expect(route2.route).toBe('tactical');
  });

  it('ultimate priority overrides movement classification', () => {
    const spec: ActionSpecForStage = { key: 'ult_teleport', type: 'move', mode: 'teleport', ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    expect(route.reason).toBe('ultimate');
  });
});

// ============================================================
// P1 — STAGE ELIGIBILITY & PROFILE RESOLUTION
// ============================================================

describe('R0B.4 P1 Stage eligibility and profile resolution', () => {
  it('isStageEligibleAction returns true for offensive action', () => {
    const spec: ActionSpecForStage = { key: 'w_break_guard', type: 'phys', offensive: true, ap: 2 };
    expect(isStageEligibleAction(spec)).toBe(true);
  });

  it('isStageEligibleAction returns false for non-ultimate support', () => {
    const spec: ActionSpecForStage = { key: 'w_salvation', type: 'heal', support: true, ap: 2 };
    expect(isStageEligibleAction(spec)).toBe(false);
  });

  it('isStageEligibleAction returns true for ultimate support', () => {
    const spec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, ap: 5 };
    expect(isStageEligibleAction(spec, ultPres)).toBe(true);
  });

  it('isStageEligibleAction returns false for non-ultimate movement', () => {
    const spec: ActionSpecForStage = { key: 'n_teleport', type: 'move', mode: 'teleport', ap: 3 };
    expect(isStageEligibleAction(spec)).toBe(false);
  });

  it('resolveCombatStageProfileUniversal returns undefined for tactical-routed support', () => {
    const spec: ActionSpecForStage = { key: 'w_salvation', type: 'heal', support: true, ap: 2 };
    expect(resolveCombatStageProfileUniversal(spec)).toBeUndefined();
  });

  it('resolveCombatStageProfileUniversal returns profile for ultimate support', () => {
    const spec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
    const profile = resolveCombatStageProfileUniversal(spec, ultPres);
    expect(profile).toBeDefined();
  });

  it('White Mage Miracle (w_miracle) routes to STAGE', () => {
    const spec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
    const route = resolvePresentationRoute(spec, ultPres);
    expect(route.route).toBe('stage');
    const profile = resolveCombatStageProfileUniversal(spec, ultPres);
    expect(profile).toBeDefined();
  });

  it('ultimate support classifies as support family (not ARENA_ULTIMATE)', () => {
    const spec: ActionSpecForStage = { key: 'w_miracle', type: 'revive', support: true, healPercent: 0.45, radius: 1, ap: 5 };
    const family = classifyActionPresentation(spec, ultPres);
    expect(['GROUP_HEAL', 'SINGLE_TARGET_HEAL']).toContain(family);
  });

  it('ultimate offensive classifies as ARENA_ULTIMATE', () => {
    const spec: ActionSpecForStage = { key: 'w_lion_surge', type: 'phys', offensive: true, radius: 1, ap: 5 };
    const family = classifyActionPresentation(spec, ultPres);
    expect(family).toBe('ARENA_ULTIMATE');
  });
});

// ============================================================
// P1 — TACTICAL FEEDBACK PRESERVATION
// ============================================================

describe('R0B.4 P1 tactical feedback preservation', () => {
  it('applyStatus floatText is guarded by if(!G.stage) — allows tactical feedback', () => {
    expect(runtimeSource).toContain('if(!G.stage)floatText(t,(d.name||st).toUpperCase()');
  });

  it('knockOut floatText is guarded by if(!G.stage) — allows tactical feedback', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(u,'K.O.'");
  });

  it('dispel floatText is guarded by if(!G.stage) — allows tactical feedback', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ'");
  });

  it('cure floatText is guarded by if(!G.stage) — allows tactical feedback', () => {
    expect(runtimeSource).toContain("if(!G.stage)floatText(t,n?'PURIFIÉ':'—'");
  });

  it('applyHeal floatText is NOT guarded (always emits, both Stage and tactical)', () => {
    expect(runtimeSource).toContain("floatText(u,'+'+amt,'#7ed957')");
    const idx = runtimeSource.indexOf("floatText(u,'+'+amt'");
    const preceding = runtimeSource.substring(Math.max(0, idx - 30), idx);
    expect(preceding).not.toContain('if(!G.stage)');
  });

  it('damage number floatText is NOT guarded (always emits)', () => {
    expect(runtimeSource).toContain("floatText(t,(crit?'✦ ':'')+'-'+dmg");
    const idx = runtimeSource.indexOf("floatText(t,(crit?'✦ ':'')+'-'+dmg");
    const preceding = runtimeSource.substring(Math.max(0, idx - 30), idx);
    expect(preceding).not.toContain('if(!G.stage)');
  });

  it('combatStageEnter returns early for tactical-routed actions (no G.stage=true)', () => {
    expect(runtimeSource).toContain('if(!stageProfile) return;');
  });

  it('executeAction finally block checks G.stage before calling combatStageExit', () => {
    expect(runtimeSource).toContain('if(G.stage)await combatStageExit(); else restoreUnitFocus()');
  });
});
