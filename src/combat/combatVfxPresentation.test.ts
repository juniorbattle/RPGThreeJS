import { describe, expect, it } from 'vitest';
import { skillById } from '../game/skills';
import { VFX_PRESET_IDS, getVfxPreset } from './vfx/VfxPresets';
import { HERO_SKILL_IDS, ENEMY_SKILL_IDS, getSkillPresentation } from './skillPresentation';
import {
  ACTION_PRESENTATION_TIERS,
  COMBAT_VFX_SKILL_IDS,
  applyResolvedPresentationToContext,
  getActionPresentationTuning,
  getActionVisualTier,
  resolveCombatVfxPresentation,
} from './combatVfxPresentation';
import type { VfxContext } from './vfx/VfxTypes';

const VALID_SCALE_TIERS = new Set(['basic', '2ap', '3ap', '4ap', '5ap_ultimate', 'boss']);

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
  it('applies orientation, scaleTier, presentationScale, intensity, particleScale, durationScale', () => {
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
    const preset = getVfxPreset(resolved!.presetId);
    expect(preset).toBeDefined();
    for (const step of preset!.steps) {
      expect(step.sheetMode).not.toBe('sky_descent');
      expect(step.skyDescent).toBeUndefined();
    }
  });
});
