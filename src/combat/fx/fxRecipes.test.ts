import { describe, expect, it } from 'vitest';
import { VFX_PRESETS } from '../vfx/VfxPresets';
import { SKILL_PRESENTATION, HERO_SKILL_IDS } from '../skillPresentation';
import { COMBAT_SFX_IDS } from '../audio/CombatSfx';
import { listExplicitFxRecipes, recipeImpactTime, resolveFxRecipe } from './fxRecipes';
import { elementForTags } from './fxPalettes';

describe('procedural combat FX recipes', () => {
  it('resolves a recipe with an impact inside its duration for every VFX preset', () => {
    for (const preset of Object.values(VFX_PRESETS)) {
      const recipe = resolveFxRecipe(preset.id, preset.tags ?? []);
      expect(recipe.steps.length, preset.id).toBeGreaterThan(0);
      const impact = recipeImpactTime(recipe, 6);
      expect(impact, preset.id).toBeGreaterThanOrEqual(0);
      expect(impact, preset.id).toBeLessThan(recipe.duration + recipeImpactTime(recipe, 6));
    }
  });

  it('gives every hero ultimate a cinematic recipe', () => {
    for (const id of HERO_SKILL_IDS) {
      const presentation = SKILL_PRESENTATION[id];
      if (!presentation?.ultimate) continue;
      const preset = VFX_PRESETS[presentation.vfxPreset];
      const recipe = resolveFxRecipe(presentation.vfxPreset, preset?.tags ?? []);
      expect(recipe.cinematic, `${id} → ${presentation.vfxPreset}`).toBe(true);
    }
  });

  it('only cues sounds the SFX engine can synthesize', () => {
    const known = new Set<string>(COMBAT_SFX_IDS);
    const ids = new Set([...listExplicitFxRecipes(), ...Object.keys(VFX_PRESETS)]);
    for (const id of ids) {
      const recipe = resolveFxRecipe(id, VFX_PRESETS[id]?.tags ?? []);
      for (const step of recipe.steps) if (step.kind === 'sfx') expect(known.has(String(step.p?.id)), `${id}: ${step.p?.id}`).toBe(true);
      if (recipe.projectile?.sfx) expect(known.has(recipe.projectile.sfx), `${id}: ${recipe.projectile.sfx}`).toBe(true);
    }
  });

  it('delays the impact of projectile recipes by the flight time', () => {
    const arrow = resolveFxRecipe('arrow_shot', ['physical', 'ranged', 'projectile']);
    expect(recipeImpactTime(arrow, 12)).toBeGreaterThan(recipeImpactTime(arrow, 2));
  });

  it('maps preset tags to element palettes', () => {
    expect(elementForTags(['magic', 'fire', 'projectile'])).toBe('fire');
    expect(elementForTags(['support', 'revive', 'holy'])).toBe('holy');
    expect(elementForTags(['physical', 'melee', 'blade'])).toBe('steel');
  });

  it('draws rune seals for spells only: martial skills and basic weapon hits never carry one', () => {
    const hasSeal = (id: string) => resolveFxRecipe(id, VFX_PRESETS[id]?.tags ?? []).steps.some((step) => step.kind === 'circle');
    for (const id of ['sword_slash', 'blunt_impact', 'thrust_line', 'arrow_shot', 'arrow_rain', 'leap_impact', 'boss_quake', 'pilot_w_charge', 'pilot_w_whirl',
      'basic_greatsword_hit', 'basic_grimoire_hit', 'basic_crosier_hit', 'basic_wand_hit', 'basic_longbow_hit', 'basic_dagger_hit']) {
      expect(hasSeal(id), id).toBe(false);
    }
    for (const id of ['fireball', 'heal_burst', 'curse_pulse', 'frost_bind', 'skill_arcane_vortex', 'skill_fire_impact']) expect(hasSeal(id), id).toBe(true);
  });

  it('keeps martial ultimates martial and spell ultimates magic', () => {
    for (const id of ['ultimate_lion_surge', 'ultimate_firmament_lance', 'ultimate_zenith_arrow', 'ultimate_silent_assassin', 'ultimate_fault_breaker', 'ultimate_artillery_barrage', 'boss_execution', 'boss_titan_slam']) {
      const recipe = resolveFxRecipe(id);
      expect(recipe.magic, id).toBe(false);
      expect(recipe.steps.some((step) => step.kind === 'circle'), id).toBe(false);
      expect(recipe.steps.some((step) => step.kind === 'pulse') || id === 'boss_titan_slam', `${id} pulses its battle aura`).toBe(true);
    }
    for (const id of ['ultimate_radiant_judgement', 'ultimate_devouring_eclipse', 'ultimate_dark_meteor', 'ultimate_miracle', 'ultimate_absolute_harmony', 'boss_inferno']) {
      expect(resolveFxRecipe(id).magic, id).toBe(true);
    }
  });

  it('gives every boss signature (tier 6) a charge before its cinematic strike', () => {
    for (const [key, presentation] of Object.entries(SKILL_PRESENTATION)) {
      if (presentation?.visualTier !== 6 || presentation.vfxPreset === 'caster_roar') continue; // the roar preset is shared with a 3 AP cry
      const recipe = resolveFxRecipe(presentation.vfxPreset, VFX_PRESETS[presentation.vfxPreset]?.tags ?? []);
      expect(recipe.cinematic, key).toBe(true);
      const charge = recipe.steps.some((step) => step.at === 0 && (step.kind === 'circle' || step.kind === 'pulse'));
      expect(charge, `${key} charges`).toBe(true);
      expect(recipe.impactAt, key).toBeGreaterThan(0.4);
    }
  });
});
