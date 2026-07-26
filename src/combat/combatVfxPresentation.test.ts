import { describe, expect, it } from 'vitest';
import { skillById } from '../game/skills';
import { VFX_PRESET_IDS, getVfxPreset } from './vfx/VfxPresets';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS, getSkillPresentation } from './skillPresentation';
import {
  ACTION_PRESENTATION_TIERS,
  COMBAT_VFX_SKILL_IDS,
  STATIC_VFX_TIER_PRESENTATION,
  applyResolvedPresentationToContext,
  getActionPresentationTuning,
  getActionVisualTier,
  getStaticVfxTierPresentation,
  resolveCombatVfxPresentation,
} from './combatVfxPresentation';
import type { VfxContext } from './vfx/VfxTypes';

const VALID_SCALE_TIERS = new Set(['basic', '2ap', '3ap', '4ap', '5ap_ultimate', 'boss']);
const PRIORITY_5AP_IDS = [
  'w_lion_surge', 'p_radiant_judgement', 'd_devouring_eclipse',
  'l_firmament_lance', 'n_dark_meteor', 'w_miracle',
  'r_perfect_duality', 'e_absolute_harmony', 'a_zenith_arrow',
  'ni_silent_assassin', 'ro_fault_breaker', 'ar_artillery_barrage',
] as const;
const PRIORITY_4AP_IDS = [
  'w_whirl', 'p_oathwall', 'd_blood_pact', 'l_griffon_jump',
  'n_flame_wave', 'w_sanctuary', 'r_scarlet_circle', 'e_binding_seal',
  'a_arrow_rain', 'ni_smoke_bomb', 'ro_jaw_trap', 'ar_incendiary_grenade',
] as const;
const PRIORITY_BOSS_IDS = [
  'boss_apocalypse', 'boss_titan_slam', 'boss_execution', 'boss_inferno',
  'boss_quake', 'boss_roar', 'boss_freeze', 'enemy_dragon_breath', 'boss_pin',
] as const;

const makeBaseContext = (): VfxContext => ({
  scene: {} as never,
  camera: {} as never,
  sourceUnit: null,
  targetUnits: [],
  reducedGraphics: false,
  helpers: {
    wait: async () => undefined,
    screenShake: () => undefined,
    screenFlash: () => undefined,
    floatText: () => undefined,
    wX: () => 0,
    wZ: () => 0,
    tileTop: () => 0,
  },
});

describe('combatVfxPresentation — resolver', () => {
  it('resolves n_dark_meteor to the static ultimate preset with no cinematic', () => {
    const resolved = resolveCombatVfxPresentation('n_dark_meteor');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('ultimate_dark_meteor');
    expect(resolved!.scaleTier).toBe('5ap_ultimate');
    expect(resolved!.ultimate).toBe(true);
    expect(resolved!.visualTier).toBe(5);
    expect(resolved!.presetId).not.toContain('raw');

    const presentation = getSkillPresentation({ key: 'n_dark_meteor' });
    expect(presentation?.cinematic).toBeUndefined();
  });

  it('resolves every HERO_SKILL_ID to a valid preset and scaleTier', () => {
    for (const skillId of HERO_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(VFX_PRESET_IDS).toContain(resolved!.presetId);
      expect(VALID_SCALE_TIERS.has(resolved!.scaleTier)).toBe(true);
      expect(resolved!.presetId).not.toContain('raw');
    }
  });

  it('resolves every ENEMY_SKILL_ID to a valid preset and scaleTier', () => {
    for (const skillId of ENEMY_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(VFX_PRESET_IDS).toContain(resolved!.presetId);
      expect(VALID_SCALE_TIERS.has(resolved!.scaleTier)).toBe(true);
      expect(resolved!.presetId).not.toContain('raw');
    }
  });

  it('resolves key enemy/boss skill IDs correctly', () => {
    const checks: Array<[string, string]> = [
      ['enemy_dark_bolt', 'shadow_lightning_bolt'],
      ['boss_freeze', 'frost_bind'],
      ['boss_apocalypse', 'boss_apocalypse_v2'],
      ['boss_titan_slam', 'boss_titan_slam'],
      ['boss_execution', 'boss_execution'],
      ['enemy_dragon_breath', 'enemy_dragon_breath'],
    ];
    for (const [skillId, expectedPreset] of checks) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(resolved!.presetId).toBe(expectedPreset);
      expect(resolved!.presetId).not.toContain('raw');
    }
  });

  it('returns undefined for unknown skill IDs', () => {
    expect(resolveCombatVfxPresentation('nonexistent_skill')).toBeUndefined();
  });
});

describe('combatVfxPresentation — context helper', () => {
  it('applies orientation, scale, visibility, intensity, particle and duration metadata', () => {
    const resolved = resolveCombatVfxPresentation('n_dark_bolt');
    expect(resolved).toBeDefined();
    const base = makeBaseContext();
    const context = applyResolvedPresentationToContext(resolved!, base);
    expect(context.orientation).toBe(resolved!.orientation);
    expect(context.scaleTier).toBe(resolved!.scaleTier);
    expect(context.presentationScale).toBe(resolved!.presentationScale);
    expect(context.intensity).toBe(resolved!.intensity);
    expect(context.particleScale).toBe(resolved!.particleScale);
    expect(context.durationScale).toBe(resolved!.durationScale);
    expect(context.staticScaleMultiplier).toBe(resolved!.staticScaleMultiplier);
    expect(context.impactOpacityFloor).toBe(resolved!.impactOpacityFloor);
    expect(context.impactRenderOrder).toBe(resolved!.impactRenderOrder);
  });

  it('preserves base helpers', () => {
    const resolved = resolveCombatVfxPresentation('w_break_guard');
    expect(resolved).toBeDefined();
    const base = makeBaseContext();
    const context = applyResolvedPresentationToContext(resolved!, base);
    expect(context.helpers).toBe(base.helpers);
    expect(context.helpers?.wait).toBe(base.helpers?.wait);
    expect(context.helpers?.screenShake).toBe(base.helpers?.screenShake);
    expect(context.helpers?.screenFlash).toBe(base.helpers?.screenFlash);
    expect(context.helpers?.floatText).toBe(base.helpers?.floatText);
    expect(context.helpers?.wX).toBe(base.helpers?.wX);
    expect(context.helpers?.wZ).toBe(base.helpers?.wZ);
    expect(context.helpers?.tileTop).toBe(base.helpers?.tileTop);
  });

  it('preserves reducedGraphics from base context', () => {
    const resolved = resolveCombatVfxPresentation('e_binding_seal');
    expect(resolved).toBeDefined();
    const base = { ...makeBaseContext(), reducedGraphics: true };
    const context = applyResolvedPresentationToContext(resolved!, base);
    expect(context.reducedGraphics).toBe(true);
  });

  it('does not erase reducedGraphics when base has it false', () => {
    const resolved = resolveCombatVfxPresentation('ro_jaw_trap');
    expect(resolved).toBeDefined();
    const base = { ...makeBaseContext(), reducedGraphics: false };
    const context = applyResolvedPresentationToContext(resolved!, base);
    expect(context.reducedGraphics).toBe(false);
  });
});

describe('combatVfxPresentation — combat parity', () => {
  const paritySkills = [
    'n_dark_meteor',
    'n_dark_bolt',
    'e_binding_seal',
    'ro_jaw_trap',
    'boss_freeze',
    'ar_explosive_retreat',
  ];

  it('resolved values match getActionPresentationTuning for the same skill', () => {
    for (const skillId of paritySkills) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      const skill = skillById.get(skillId);
      const tuning = getActionPresentationTuning({ key: skillId, ap: skill?.ap });
      expect(resolved!.intensity).toBe(tuning.intensity);
      expect(resolved!.particleScale).toBe(tuning.particleScale);
      expect(resolved!.durationScale).toBe(tuning.durationScale);
      expect(resolved!.scaleTier).toBe(tuning.scaleTier);
      expect(resolved!.presentationScale).toBe(tuning.presentationScale);
      expect(resolved!.staticScaleMultiplier).toBe(tuning.staticScaleMultiplier);
      expect(resolved!.impactOpacityFloor).toBe(tuning.impactOpacityFloor);
      expect(resolved!.impactRenderOrder).toBe(tuning.impactRenderOrder);
      expect(resolved!.tier).toBe(tuning.tier);
    }
  });

  it('resolved preset matches the presentation vfxPreset', () => {
    for (const skillId of paritySkills) {
      const resolved = resolveCombatVfxPresentation(skillId);
      const presentation = getSkillPresentation({ key: skillId });
      expect(resolved!.presetId).toBe(presentation!.vfxPreset);
    }
  });
});

describe('combatVfxPresentation — tuning extraction', () => {
  it('exposes ACTION_PRESENTATION_TIERS with 6 tiers', () => {
    expect(ACTION_PRESENTATION_TIERS[1]).toBeDefined();
    expect(ACTION_PRESENTATION_TIERS[6]).toBeDefined();
    expect(ACTION_PRESENTATION_TIERS[1].intensity).toBe(0.88);
    expect(ACTION_PRESENTATION_TIERS[6].intensity).toBe(1.25);
  });

  it('getActionVisualTier returns presentation.visualTier when defined', () => {
    expect(getActionVisualTier({ key: 'n_dark_meteor' })).toBe(5);
    expect(getActionVisualTier({ key: 'boss_slam' })).toBe(6);
  });

  it('getActionVisualTier falls back to AP-based tier', () => {
    expect(getActionVisualTier({ key: 'attack', charge: 2 })).toBe(3);
    expect(getActionVisualTier({ ap: 4 })).toBe(4);
    expect(getActionVisualTier({ ap: 5 })).toBe(5);
  });

  it('getActionPresentationTuning derives correct scaleTier from tier', () => {
    expect(getActionPresentationTuning({ ap: 1 }).scaleTier).toBe('basic');
    expect(getActionPresentationTuning({ ap: 2 }).scaleTier).toBe('2ap');
    expect(getActionPresentationTuning({ ap: 3 }).scaleTier).toBe('3ap');
    expect(getActionPresentationTuning({ ap: 4 }).scaleTier).toBe('4ap');
    expect(getActionPresentationTuning({ ap: 5 }).scaleTier).toBe('5ap_ultimate');
  });

  it('keeps static scale, opacity and foreground order strictly increasing by tier', () => {
    const tiers = ['basic', '2ap', '3ap', '4ap', '5ap_ultimate', 'boss'] as const;
    const profiles = tiers.map((tier) => getStaticVfxTierPresentation(tier));
    for (let index = 1; index < profiles.length; index += 1) {
      expect(profiles[index]!.scaleMultiplier).toBeGreaterThan(profiles[index - 1]!.scaleMultiplier);
      expect(profiles[index]!.impactOpacityFloor).toBeGreaterThan(profiles[index - 1]!.impactOpacityFloor);
      expect(profiles[index]!.impactRenderOrder).toBeGreaterThan(profiles[index - 1]!.impactRenderOrder);
    }
    expect(STATIC_VFX_TIER_PRESENTATION.basic.impactRenderOrder).toBeGreaterThan(60);
  });
});

describe('combatVfxPresentation — V10G-R1 priority hierarchy', () => {
  it('resolves every priority 5 AP ultimate with dominant static presentation', () => {
    for (const skillId of PRIORITY_5AP_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(resolved).toMatchObject({
        scaleTier: '5ap_ultimate',
        ultimate: true,
        staticScaleMultiplier: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].scaleMultiplier,
        impactOpacityFloor: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].impactOpacityFloor,
        impactRenderOrder: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].impactRenderOrder,
      });
      expect(resolved!.presetId).not.toContain('raw');
    }
  });

  it('resolves every priority 4 AP skill above lower-tier presentation', () => {
    for (const skillId of PRIORITY_4AP_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(resolved!.scaleTier).toBe('4ap');
      expect(resolved!.staticScaleMultiplier).toBe(STATIC_VFX_TIER_PRESENTATION['4ap'].scaleMultiplier);
      expect(resolved!.impactOpacityFloor).toBeGreaterThanOrEqual(0.9);
      expect(resolved!.impactRenderOrder).toBeGreaterThan(60);
    }
  });

  it('resolves boss and enemy signatures with the strongest static tier', () => {
    for (const skillId of PRIORITY_BOSS_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(resolved!.scaleTier).toBe('boss');
      expect(resolved!.staticScaleMultiplier).toBe(STATIC_VFX_TIER_PRESENTATION.boss.scaleMultiplier);
      expect(resolved!.impactOpacityFloor).toBe(STATIC_VFX_TIER_PRESENTATION.boss.impactOpacityFloor);
      expect(resolved!.impactRenderOrder).toBeGreaterThan(
        STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].impactRenderOrder,
      );
    }
  });
});

describe('combatVfxPresentation — no raw paths', () => {
  it('no resolved preset ID contains raw/', () => {
    for (const skillId of COMBAT_VFX_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      if (!resolved) continue;
      expect(resolved.presetId).not.toContain('raw');
      expect(resolved.presetId).not.toContain('/assets/vfx/raw');
    }
  });

  it('every resolved preset ID exists in VFX_PRESET_IDS', () => {
    for (const skillId of COMBAT_VFX_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      if (!resolved) continue;
      expect(VFX_PRESET_IDS).toContain(resolved.presetId);
      expect(getVfxPreset(resolved.presetId)).toBeDefined();
    }
  });
});

describe('combatVfxPresentation — n_dark_meteor static', () => {
  it('has no cinematic descriptor on n_dark_meteor presentation', () => {
    const presentation = getSkillPresentation({ key: 'n_dark_meteor' });
    expect(presentation).toBeDefined();
    expect(presentation!.cinematic).toBeUndefined();
  });

  it('resolves to a static preset without sky_descent or travel phases', () => {
    const resolved = resolveCombatVfxPresentation('n_dark_meteor');
    expect(resolved).toBeDefined();
    expect(resolved).toMatchObject({
      scaleTier: '5ap_ultimate',
      staticScaleMultiplier: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].scaleMultiplier,
      impactOpacityFloor: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].impactOpacityFloor,
      impactRenderOrder: STATIC_VFX_TIER_PRESENTATION['5ap_ultimate'].impactRenderOrder,
    });
    expect(resolved!.presentationScale).toBeGreaterThan(1);
    const preset = getVfxPreset(resolved!.presetId);
    expect(preset).toBeDefined();
    expect(preset!.steps.some((step) => step.type === 'projectile')).toBe(false);
    for (const step of preset!.steps) {
      expect(step.sheetMode).not.toBe('sky_descent');
      expect(step.skyDescent).toBeUndefined();
    }
  });
});

describe('combatVfxPresentation — V10G-R2A cleanup coverage', () => {
  it('every resolved combat preset exists in VFX_PRESETS', () => {
    for (const skillId of COMBAT_VFX_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      if (!resolved) continue;
      expect(VFX_PRESET_IDS).toContain(resolved.presetId);
      expect(getVfxPreset(resolved.presetId)).toBeDefined();
    }
  });

  it('shadow_lightning_bolt remains active and resolvable', () => {
    const resolved = resolveCombatVfxPresentation('n_dark_bolt');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('shadow_lightning_bolt');
    expect(getVfxPreset('shadow_lightning_bolt')).toBeDefined();
  });

  it('teleport_burst remains active and resolvable', () => {
    const resolved = resolveCombatVfxPresentation('n_teleport');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('teleport_burst');
    expect(getVfxPreset('teleport_burst')).toBeDefined();
  });

  it('root_vines remains active and resolvable', () => {
    const resolved = resolveCombatVfxPresentation('e_binding_seal');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('root_vines');
    expect(getVfxPreset('root_vines')).toBeDefined();
  });

  it('frost_bind remains active and resolvable', () => {
    const resolved = resolveCombatVfxPresentation('boss_freeze');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('frost_bind');
    expect(getVfxPreset('frost_bind')).toBeDefined();
  });

  it('boss_apocalypse_v2 remains active (boss_apocalypse removed)', () => {
    const resolved = resolveCombatVfxPresentation('boss_apocalypse');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('boss_apocalypse_v2');
    expect(getVfxPreset('boss_apocalypse_v2')).toBeDefined();
    expect(getVfxPreset('boss_apocalypse')).toBeUndefined();
  });

  it('no resolved preset contains raw/', () => {
    for (const skillId of COMBAT_VFX_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      if (!resolved) continue;
      expect(resolved.presetId).not.toContain('raw');
    }
  });

  it('obsolete presets are no longer in VFX_PRESET_IDS', () => {
    const obsolete = [
      'melee_light', 'melee_heavy', 'boss_apocalypse',
      'status_burn_mark', 'status_silence_seal', 'status_weak_mark',
      'support_bless_field', 'impact_mace', 'shape_line_blast',
      'impact_dark_explosion', 'ultimate_judgement_beam', 'ultimate_holy_explosion',
      'ultimate_eclipse_devour', 'ultimate_drain_field',
      'ultimate_zenith_arrow_v2', 'ultimate_fault_breaker_v2',
    ];
    for (const id of obsolete) {
      expect(VFX_PRESET_IDS).not.toContain(id);
      expect(getVfxPreset(id)).toBeUndefined();
    }
  });

  it('fallback-required presets remain available', () => {
    const fallbacks = [
      'fireball', 'heal_burst', 'generic_hit', 'sword_slash', 'blunt_impact',
      'arrow_shot', 'dark_bolt', 'bless_aura', 'curse_pulse', 'poison_bite',
      'guard_barrier', 'boss_slam', 'boss_quake', 'critical_hit', 'kill_spark',
      'support_revive_pillar', 'support_holy_aura', 'impact_explosion_large',
    ];
    for (const id of fallbacks) {
      expect(VFX_PRESET_IDS).toContain(id);
      expect(getVfxPreset(id)).toBeDefined();
    }
  });
});

describe('combatVfxPresentation — V10G-R2A.1 generic overlay cleanup', () => {
  it('authored spritesheet actions resolve to presets (no generic fallback noise)', () => {
    const authoredSkillIds = [
      'n_dark_meteor', 'boss_apocalypse', 'boss_quake', 'boss_inferno',
      'p_radiant_judgement', 'd_devouring_eclipse', 'ar_artillery_barrage',
      'w_lion_surge', 'ro_fault_breaker', 'e_binding_seal',
      'boss_freeze', 'n_dark_bolt',
    ];
    for (const skillId of authoredSkillIds) {
      const resolved = resolveCombatVfxPresentation(skillId);
      expect(resolved).toBeDefined();
      expect(resolved!.presetId).not.toBe('generic_hit');
      expect(getVfxPreset(resolved!.presetId)).toBeDefined();
    }
  });

  it('n_dark_meteor keeps authored static preset without generic impact noise', () => {
    const resolved = resolveCombatVfxPresentation('n_dark_meteor');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('ultimate_dark_meteor');
    expect(resolved!.scaleTier).toBe('5ap_ultimate');
    const preset = getVfxPreset(resolved!.presetId);
    expect(preset).toBeDefined();
    expect(preset!.steps.some((step) => step.type === 'spriteSheet')).toBe(true);
  });

  it('boss_apocalypse resolves to boss_apocalypse_v2 (not generic)', () => {
    const resolved = resolveCombatVfxPresentation('boss_apocalypse');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('boss_apocalypse_v2');
    const preset = getVfxPreset(resolved!.presetId);
    expect(preset).toBeDefined();
    expect(preset!.steps.some((step) => step.type === 'spriteSheet')).toBe(true);
  });

  it('boss_quake retains authored VFX without obsolete duplicate overlays', () => {
    const resolved = resolveCombatVfxPresentation('boss_quake');
    expect(resolved).toBeDefined();
    expect(resolved!.presetId).toBe('boss_quake');
    const preset = getVfxPreset(resolved!.presetId);
    expect(preset).toBeDefined();
    expect(preset!.steps.some((step) => step.type === 'spriteSheet' || step.type === 'shockwave')).toBe(true);
  });

  it('root_vines and frost_bind remain visible and resolvable', () => {
    const rootResolved = resolveCombatVfxPresentation('e_binding_seal');
    expect(rootResolved).toBeDefined();
    expect(rootResolved!.presetId).toBe('root_vines');
    expect(getVfxPreset('root_vines')).toBeDefined();

    const frostResolved = resolveCombatVfxPresentation('boss_freeze');
    expect(frostResolved).toBeDefined();
    expect(frostResolved!.presetId).toBe('frost_bind');
    expect(getVfxPreset('frost_bind')).toBeDefined();
  });

  it('shadow_lightning_bolt and teleport_burst remain active', () => {
    const boltResolved = resolveCombatVfxPresentation('n_dark_bolt');
    expect(boltResolved).toBeDefined();
    expect(boltResolved!.presetId).toBe('shadow_lightning_bolt');
    expect(getVfxPreset('shadow_lightning_bolt')).toBeDefined();

    const teleportResolved = resolveCombatVfxPresentation('n_teleport');
    expect(teleportResolved).toBeDefined();
    expect(teleportResolved!.presetId).toBe('teleport_burst');
    expect(getVfxPreset('teleport_burst')).toBeDefined();
  });

  it('fallback-required generic_hit remains available for non-authored actions', () => {
    expect(VFX_PRESET_IDS).toContain('generic_hit');
    expect(getVfxPreset('generic_hit')).toBeDefined();
  });

  it('no resolved preset references raw/ paths', () => {
    for (const skillId of COMBAT_VFX_SKILL_IDS) {
      const resolved = resolveCombatVfxPresentation(skillId);
      if (!resolved) continue;
      expect(resolved.presetId).not.toContain('raw');
    }
  });

  it('V10G-R2A removed presets remain removed', () => {
    const obsolete = [
      'melee_light', 'melee_heavy', 'boss_apocalypse',
      'status_burn_mark', 'status_silence_seal', 'status_weak_mark',
      'support_bless_field', 'impact_mace', 'shape_line_blast',
      'impact_dark_explosion', 'ultimate_judgement_beam', 'ultimate_holy_explosion',
      'ultimate_eclipse_devour', 'ultimate_drain_field',
      'ultimate_zenith_arrow_v2', 'ultimate_fault_breaker_v2',
    ];
    for (const id of obsolete) {
      expect(VFX_PRESET_IDS).not.toContain(id);
      expect(getVfxPreset(id)).toBeUndefined();
    }
  });
});
