export const UI_SOUND_IDS = ['navigate', 'confirm', 'back', 'refused', 'saved', 'reward', 'recover', 'travel-start'] as const;
export type UiSoundId = typeof UI_SOUND_IDS[number];
export const COMBAT_SOUND_IDS = ['step', 'light-blade', 'heavy-weapon', 'thrust', 'bow-release', 'magic-cast', 'magic-impact', 'physical-impact', 'miss', 'critical', 'status-negative', 'support', 'knockout', 'player-turn', 'victory', 'defeat'] as const;
export type CombatSoundId = typeof COMBAT_SOUND_IDS[number];
export type GameSoundId = UiSoundId | CombatSoundId;
export const TACTICAL_SOUND_IDS = [...COMBAT_SOUND_IDS, 'navigate', 'confirm', 'back', 'refused', 'recover'] as const;
export type TacticalSoundId = typeof TACTICAL_SOUND_IDS[number];
export const isCombatSound = (id: GameSoundId): id is CombatSoundId => (COMBAT_SOUND_IDS as readonly string[]).includes(id);
export function soundPriority(id: GameSoundId): number {
  if (id === 'victory' || id === 'defeat') return 5;
  if (id === 'knockout') return 4;
  if (id === 'critical') return 3;
  return id === 'step' || !isCombatSound(id) ? 0 : 1;
}
