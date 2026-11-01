import { COMPOSED_CUE_IDS, isSignatureCue, isTableCue, SIGNATURE_CUE_IDS } from '../audio/cueTable';

export const UI_SOUND_IDS = ['navigate', 'confirm', 'back', 'refused', 'saved', 'reward', 'recover', 'travel-start'] as const;
export type UiSoundId = typeof UI_SOUND_IDS[number];
export const COMBAT_SOUND_IDS = ['step', 'light-blade', 'heavy-weapon', 'thrust', 'bow-release', 'magic-cast', 'magic-impact', 'physical-impact', 'miss', 'critical', 'status-negative', 'support', 'knockout', 'player-turn', 'victory', 'defeat'] as const;
export type CombatSoundId = typeof COMBAT_SOUND_IDS[number];
/** Composed `fx.*` and signature `sig.*` cues come from the closed table in `audio/cueTable.ts`. */
export type TableCueId = `fx.${string}` | `sig.${string}`;
export type GameSoundId = UiSoundId | CombatSoundId | TableCueId;
/** Every combat identity the parent renders: the sixteen families and the closed table. */
export const TABLE_CUE_IDS: readonly string[] = [...COMBAT_SOUND_IDS, ...COMPOSED_CUE_IDS, ...SIGNATURE_CUE_IDS];
export const TACTICAL_SOUND_IDS = [...COMBAT_SOUND_IDS, 'navigate', 'confirm', 'back', 'refused', 'recover', ...COMPOSED_CUE_IDS, ...SIGNATURE_CUE_IDS] as [string, ...string[]];
export type TacticalSoundId = CombatSoundId | 'navigate' | 'confirm' | 'back' | 'refused' | 'recover' | TableCueId;
export const isCombatSound = (id: string): boolean => isTableCue(id) || (COMBAT_SOUND_IDS as readonly string[]).includes(id);
/** The families that say how a blow landed: a signature cue never takes their voice. */
const RESULT_SOUNDS: ReadonlySet<string> = new Set(['physical-impact', 'magic-impact', 'miss', 'critical', 'knockout', 'victory', 'defeat']);
export const isResultSound = (id: string): boolean => RESULT_SOUNDS.has(id);
export function soundPriority(id: string): number {
  if (id === 'victory' || id === 'defeat') return 5;
  if (id === 'knockout') return 4;
  if (id === 'critical') return 3;
  if (isSignatureCue(id)) return 1.5;
  return id === 'step' || !isCombatSound(id) ? 0 : 1;
}
