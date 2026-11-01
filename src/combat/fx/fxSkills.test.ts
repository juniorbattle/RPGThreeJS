import { describe, expect, it } from 'vitest';
import { skillById } from '../../game/skills';
import { HERO_SKILL_IDS, SKILL_PRESENTATION } from '../skillPresentation';
import type { FxRecipe, FxStep } from './fxRecipes';
import { hasSkillMoveFx, listSkillFxRecipes, skillFxRecipe, skillMoveFxRecipe } from './fxSkills';

const FLIGHT = 0.8;
const stepAt = (recipe: FxRecipe, step: FxStep) => step.at + (step.afterHit ? FLIGHT : 0);
const impactOf = (recipe: FxRecipe) => recipe.impactAt + (recipe.projectile ? recipe.projectile.at + FLIGHT - recipe.projectile.at : 0);
const ULTIMATES = HERO_SKILL_IDS.filter((id) => SKILL_PRESENTATION[id].ultimate);
/** A skill's silhouette: which primitives it draws, ignoring timing and sizes. */
const silhouette = (recipe: FxRecipe) => [...new Set(recipe.steps.filter((step) => !['shake', 'flash', 'sfx', 'slowmo', 'punch', 'light', 'speedLines'].includes(step.kind)).map((step) => `${step.kind}:${step.element ?? ''}`))].sort().join(' ');

describe('skill signatures', () => {
  it('give every hero skill its own effect, on the action or on the move', () => {
    for (const id of HERO_SKILL_IDS) {
      expect(skillFxRecipe(id) ?? skillMoveFxRecipe(id, 'arrive'), id).not.toBeNull();
    }
    expect(listSkillFxRecipes().every((id) => skillById.has(id))).toBe(true);
  });

  it('never share one silhouette between two skills', () => {
    const seen = new Map<string, string>();
    for (const id of listSkillFxRecipes()) {
      const shape = silhouette(skillFxRecipe(id)!);
      expect(seen.get(shape), `${id} draws the same effect as ${seen.get(shape)}`).toBeUndefined();
      seen.set(shape, id);
    }
  });

  it('keep ultimates cinematic, with a charge before the blow', () => {
    expect(ULTIMATES).toHaveLength(12);
    for (const id of ULTIMATES) {
      const recipe = skillFxRecipe(id)!;
      expect(recipe.cinematic, id).toBe(true);
      expect(recipe.authored, id).toBe(true);
      expect(impactOf(recipe), id).toBeGreaterThan(0.8);
      expect(recipe.steps.some((step) => stepAt(recipe, step) < impactOf(recipe) - 0.3), `${id} charges`).toBe(true);
    }
  });

  it('never fire a circle after the blow: no seal, no pulse, at most one ring on it', () => {
    for (const id of listSkillFxRecipes()) {
      const recipe = skillFxRecipe(id)!;
      const impact = impactOf(recipe);
      for (const step of recipe.steps) {
        if (step.kind === 'pulse') throw new Error(`${id} pulses`);
        if (step.kind === 'ring') expect(stepAt(recipe, step), `${id}: ring after the blow`).toBeLessThanOrEqual(impact + 0.01);
        if (step.kind === 'circle') {
          expect(stepAt(recipe, step) + Number(step.p?.duration ?? 1.1), `${id}: seal outlives the blow`).toBeLessThanOrEqual(impact + 1.1);
          expect(step.p?.pulse, id).toBeUndefined();
        }
      }
      const blowRings = recipe.steps.filter((step) => step.kind === 'ring' && !step.p?.inward && Math.abs(stepAt(recipe, step) - impact) < 0.1);
      expect(blowRings.length, `${id}: rings on the blow`).toBeLessThanOrEqual(1);
    }
  });

  it('draw seals for spells only', () => {
    for (const id of ['w_lion_surge', 'l_firmament_lance', 'a_zenith_arrow', 'ni_silent_assassin', 'ro_fault_breaker', 'ar_artillery_barrage', 'w_whirl']) {
      expect(skillFxRecipe(id)!.steps.some((step) => step.kind === 'circle'), id).toBe(false);
    }
  });

  it('keep support ultimates calm: no shake, no slow motion', () => {
    for (const id of ['w_miracle', 'e_absolute_harmony']) {
      expect(skillFxRecipe(id)!.steps.some((step) => step.kind === 'shake' || step.kind === 'slowmo'), id).toBe(false);
    }
  });

  it('stay close on single-target ultimates and pull back on the others', () => {
    const holds = (id: string) => skillFxRecipe(id)!.steps.some((step) => step.kind === 'punch' && step.p?.hold === true);
    for (const id of ['a_zenith_arrow', 'ni_silent_assassin', 'ro_fault_breaker']) expect(holds(id), id).toBe(true);
    for (const id of ['n_dark_meteor', 'w_lion_surge', 'ar_artillery_barrage']) expect(holds(id), id).toBe(false);
  });

  it('give moving skills their own departure and arrival, with no explosion left on the landing', () => {
    for (const id of ['d_void_step', 'n_teleport', 'r_rune_step', 'e_transpose']) {
      expect(hasSkillMoveFx(id), id).toBe(true);
      expect(skillMoveFxRecipe(id, 'depart'), id).not.toBeNull();
      expect(skillMoveFxRecipe(id, 'arrive'), id).not.toBeNull();
    }
    expect(skillMoveFxRecipe('ar_explosive_retreat', 'arrive')!.steps.some((step) => step.kind === 'orb')).toBe(false);
    expect(hasSkillMoveFx('sword_slash')).toBe(false);
  });
});
