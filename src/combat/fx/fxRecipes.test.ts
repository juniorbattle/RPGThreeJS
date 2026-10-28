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
});
