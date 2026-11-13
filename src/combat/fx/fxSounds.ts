import { composedCue, signatureId, SIGNATURE_SKILLS, type Gesture, type Weight } from '../../audio/cueTable';
import type { FxElement } from './fxPalettes';
import type { FxRecipe } from './fxRecipes';

/**
 * Sound marks on the FX clock (OD-2026-11-01-B). A mark's identity comes from the recipe alone, whatever the hit, miss,
 * critical, damage or target: the blow is heard as gesture, element and weight, and the result family says how it
 * landed. Weight is read from the skill's AP cost and the unit's height when the action plays.
 */
export interface FxSoundMark {
  at: number;
  /** Counted from the landing of the projectile. */
  afterHit?: boolean;
  /** A composed mark: gesture of the recipe, element of the recipe. */
  gesture?: Gesture;
  element?: FxElement;
  /** A signature mark names its cue. */
  cue?: string;
}

/** The gesture of every signature that has no cues of its own: 47 skills and the 14 enemy attacks. */
const RECIPE_GESTURES: Readonly<Record<string, Gesture>> = {
  w_break_guard: 'heavy', w_whirl: 'heavy', p_holy_strike: 'blade', p_interpose: 'ward', p_oathwall: 'ward', d_cursed_blade: 'blade', d_blood_pact: 'ward',
  l_long_thrust: 'thrust', l_haft_recoil: 'thrust', l_griffon_jump: 'thrust', n_dark_bolt: 'cast', n_flame_wave: 'cast',
  w_salvation: 'mend', w_purify: 'mend', w_sanctuary: 'ward', r_arcane_blade: 'blade', r_rune_step: 'cast', r_scarlet_circle: 'cast', e_vigor_rune: 'ward', e_binding_seal: 'cast',
  a_precise_shot: 'shot', a_hawk_leap: 'shot', a_arrow_rain: 'shot', ni_venom_blade: 'blade', ni_shadow_step: 'dash', ni_smoke_bomb: 'throw',
  ro_sneak_attack: 'blade', ro_jaw_trap: 'heavy', ar_calibrated_shot: 'gun', ar_explosive_retreat: 'gun', ar_incendiary_grenade: 'throw',
  enemy_heavy_strike: 'heavy', enemy_crush: 'heavy', enemy_dark_bolt: 'cast', enemy_hex: 'cast', enemy_venom_strike: 'blade', enemy_binding_shot: 'shot', enemy_dragon_breath: 'breath',
  boss_guard: 'ward', boss_regen: 'mend', boss_fortify: 'ward', boss_freeze: 'cast', boss_pin: 'shot',
  boss_celestial_bolt: 'cast', boss_sentence: 'cast', boss_broken_oath: 'cast', boss_breach_grip: 'cast',
  attack_bite: 'bite', attack_mandibles: 'bite', attack_fangs: 'bite', attack_claws: 'bite', attack_tongue: 'bite', attack_ram: 'heavy',
  attack_rock: 'throw', attack_sling: 'throw', attack_thrown_blades: 'throw', attack_breath: 'breath', attack_emerald_breath: 'breath', attack_cold_wave: 'breath', attack_seal: 'cast',
};

/** Seconds from the blow to the wave of a signature, as the camera opens on the field. */
const WAVE_AFTER_BLOW = 0.3;
const SIGNATURES = new Set(SIGNATURE_SKILLS);

/** Lays the recipe's marks: charge, blow and wave for a signature, the blow for any other skill. */
export function withSoundMarks(recipe: FxRecipe): FxRecipe {
  const afterHit = Boolean(recipe.projectile);
  if (SIGNATURES.has(recipe.id)) {
    return { ...recipe, marks: [
      { at: 0.02, cue: signatureId(recipe.id, 'charge') },
      { at: recipe.impactAt, afterHit, cue: signatureId(recipe.id, 'blow') },
      { at: recipe.impactAt + WAVE_AFTER_BLOW, afterHit, cue: signatureId(recipe.id, 'wave') },
    ] };
  }
  const gesture = RECIPE_GESTURES[recipe.id];
  return gesture ? { ...recipe, marks: [{ at: recipe.impactAt, afterHit, gesture, element: recipe.element }] } : recipe;
}

/** Departure of a moving skill: its element on a dash; the arrival is a landing. */
export function withMoveSound(recipe: FxRecipe, phase: 'depart' | 'arrive'): FxRecipe {
  return { ...recipe, marks: [{ at: 0.02, gesture: phase === 'arrive' ? 'land' : 'dash', element: phase === 'arrive' ? 'earth' : recipe.element }] };
}

export function markCue(mark: FxSoundMark, weight: Weight): string | null {
  return mark.cue ?? (mark.gesture && mark.element ? composedCue(mark.gesture, mark.element, weight) : null);
}

/** What the shared recipes' `sfx` steps mean on the table; a step that sounds like a landed blow stays silent. */
const SHARED_STEPS: Readonly<Record<string, readonly [Gesture, FxElement]>> = {
  slash: ['blade', 'steel'], heavy_slash: ['heavy', 'steel'], thrust: ['thrust', 'steel'], bow: ['shot', 'steel'], throw: ['throw', 'steel'], blunt: ['heavy', 'blunt'],
  bite: ['bite', 'steel'], cannon: ['gun', 'fire'], cast: ['cast', 'arcane'], breath: ['breath', 'fire'], curse: ['cast', 'shadow'], void: ['cast', 'shadow'],
  fire_burst: ['cast', 'fire'], ice: ['cast', 'ice'], earth: ['heavy', 'earth'], quake: ['heavy', 'earth'], heal: ['mend', 'heal'], shield: ['ward', 'arcane'], holy_charge: ['ward', 'holy'],
  dash: ['dash', 'wind'], wind: ['dash', 'wind'], teleport: ['dash', 'arcane'], land: ['land', 'earth'], poison: ['bite', 'poison'],
};

export function sharedStepCue(id: string, weight: Weight): string | null {
  const pair = SHARED_STEPS[id];
  return pair ? composedCue(pair[0], pair[1], weight) : null;
}

export const SHARED_STEP_IDS = Object.keys(SHARED_STEPS);
