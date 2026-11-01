/**
 * The closed table of composed and signature cues (OD-2026-11-01-B): at most 160 identities with the sixteen families.
 * Pure strings, shared by the combat document (typed allowlist) and the parent owner (rendering, fallback).
 *
 * A composed cue is gesture + element + weight, rendered once into one buffer. A signature cue is one of the charge,
 * blow and wave written for the twelve Ultimates and the eight boss signatures. Neither ever names a result: the
 * result families stay the sound of hit, miss, critical and knock-out.
 */
import type { FxElement } from '../combat/fx/fxPalettes';
import type { CombatSoundId } from '../ui/GameSoundCatalog';

export type Gesture = 'blade' | 'heavy' | 'thrust' | 'shot' | 'gun' | 'throw' | 'cast' | 'breath' | 'bite' | 'dash' | 'land' | 'ward' | 'mend';
export type Weight = 'l' | 'm' | 'h';
export type SignaturePart = 'charge' | 'blow' | 'wave';

/** The file a composed cue falls back to before it is rendered. */
export const GESTURE_FAMILY: Readonly<Record<Gesture, CombatSoundId>> = {
  blade: 'light-blade', heavy: 'heavy-weapon', thrust: 'thrust', shot: 'bow-release', gun: 'heavy-weapon', throw: 'bow-release',
  cast: 'magic-cast', breath: 'magic-cast', bite: 'light-blade', dash: 'light-blade', land: 'step', ward: 'support', mend: 'support',
};

/** Which weights exist for each pair: only what a recipe, a basic attack or a move can reach. */
const COMPOSED: Readonly<Record<Gesture, Partial<Record<FxElement, string>>>> = {
  blade: { steel: 'lm', gold: 'l', holy: 'l', shadow: 'l', blood: 'lm', poison: 'lm' },
  heavy: { gold: 'lh', steel: 'mh', blunt: 'lm', earth: 'lmh' },
  thrust: { sky: 'lmh', steel: 'lm' },
  shot: { wind: 'lmh', steel: 'lh' },
  gun: { fire: 'lm' },
  throw: { smoke: 'h', fire: 'h', earth: 'lm', blunt: 'lm', steel: 'lm' },
  cast: { shadow: 'lm', fire: 'lh', blood: 'mh', arcane: 'lmh', ice: 'lh' },
  breath: { fire: 'lm', nature: 'lm', ice: 'lm' },
  bite: { steel: 'lm', earth: 'lm', poison: 'lm', blood: 'l' },
  dash: { gold: 'l', holy: 'l', shadow: 'l', sky: 'l', fire: 'l', blood: 'l', arcane: 'l', wind: 'l', earth: 'l' },
  land: { earth: 'l' },
  ward: { holy: 'mh', blood: 'mh', nature: 'h', arcane: 'l', shadow: 'm' },
  mend: { heal: 'l', ice: 'm', nature: 'm' },
};

export const composedId = (gesture: Gesture, element: FxElement, weight: Weight): string => `fx.${gesture}.${element}.${weight}`;

export const COMPOSED_CUE_IDS: readonly string[] = (Object.entries(COMPOSED) as Array<[Gesture, Partial<Record<FxElement, string>>]>)
  .flatMap(([gesture, elements]) => (Object.entries(elements) as Array<[FxElement, string]>)
    .flatMap(([element, weights]) => [...weights].map((weight) => composedId(gesture, element, weight as Weight))));

export const ULTIMATE_SKILLS = ['w_lion_surge', 'p_radiant_judgement', 'd_devouring_eclipse', 'l_firmament_lance', 'n_dark_meteor', 'w_miracle', 'r_perfect_duality', 'e_absolute_harmony', 'a_zenith_arrow', 'ni_silent_assassin', 'ro_fault_breaker', 'ar_artillery_barrage'] as const;
export const BOSS_SIGNATURES = ['boss_slam', 'boss_quake', 'boss_titan_slam', 'boss_roar', 'boss_execution', 'boss_flurry', 'boss_inferno', 'boss_apocalypse'] as const;
export const SIGNATURE_SKILLS: readonly string[] = [...ULTIMATE_SKILLS, ...BOSS_SIGNATURES];
export const SIGNATURE_PARTS: readonly SignaturePart[] = ['charge', 'blow', 'wave'];
export const signatureId = (skill: string, part: SignaturePart): string => `sig.${skill}.${part}`;
export const SIGNATURE_CUE_IDS: readonly string[] = SIGNATURE_SKILLS.flatMap((skill) => SIGNATURE_PARTS.map((part) => signatureId(skill, part)));

/** The gesture family of each signature's blow: what a signature cue falls back to. */
const BLOW_FAMILY: Readonly<Record<string, CombatSoundId>> = {
  w_lion_surge: 'heavy-weapon', p_radiant_judgement: 'magic-cast', d_devouring_eclipse: 'magic-cast', l_firmament_lance: 'thrust', n_dark_meteor: 'magic-cast',
  w_miracle: 'support', r_perfect_duality: 'magic-cast', e_absolute_harmony: 'support', a_zenith_arrow: 'bow-release', ni_silent_assassin: 'light-blade',
  ro_fault_breaker: 'heavy-weapon', ar_artillery_barrage: 'heavy-weapon', boss_slam: 'heavy-weapon', boss_quake: 'heavy-weapon', boss_titan_slam: 'heavy-weapon',
  boss_roar: 'status-negative', boss_execution: 'heavy-weapon', boss_flurry: 'light-blade', boss_inferno: 'magic-cast', boss_apocalypse: 'magic-cast',
};

export const COMPOSED_CUE_MAX_SECONDS = 1;
export const SIGNATURE_CUE_MAX_SECONDS = 2.5;
export const CUE_TABLE_MAX_BYTES = 32 * 1024 * 1024;

const SIGNATURES = new Set(SIGNATURE_CUE_IDS);
export const isSignatureCue = (id: string): boolean => SIGNATURES.has(id);
export const isTableCue = (id: string): boolean => id.startsWith('fx.') || id.startsWith('sig.');

/** The gesture family of a table cue. */
export function cueFamily(id: string): CombatSoundId | null {
  const [kind, name] = id.split('.');
  if (kind === 'fx') return GESTURE_FAMILY[name as Gesture] ?? null;
  return kind === 'sig' ? BLOW_FAMILY[name!] ?? null : null;
}

/** The weight class, from the skill's catalogued AP cost and the unit's catalogued height, and nothing else. */
export function soundWeight(ap = 1, height = 1.9): Weight {
  const rank = (ap >= 4 ? 2 : ap === 3 ? 1 : 0) + (height >= 3.2 ? 1 : 0);
  return rank >= 2 ? 'h' : rank === 1 ? 'm' : 'l';
}

/** The table's nearest cue: the weight asked, then lighter, then heavier; null when the pair does not exist. */
export function composedCue(gesture: Gesture, element: FxElement, weight: Weight): string | null {
  const weights = COMPOSED[gesture]?.[element];
  if (!weights) return null;
  const order: readonly Weight[] = weight === 'h' ? ['h', 'm', 'l'] : weight === 'm' ? ['m', 'l', 'h'] : ['l', 'm', 'h'];
  const found = order.find((candidate) => weights.includes(candidate));
  return found ? composedId(gesture, element, found) : null;
}
