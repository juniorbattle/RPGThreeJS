/**
 * Set 1.20.0, post-demo Lot 1 opening: the Lion's content as the game plays it, under the approved reputation
 * calibration (OD-2026-11-08-A). The content registries keep the authored demo values; only play goes through here.
 * Post-demo plateaux register their own content, authored at the post-demo scale, and are not recalibrated.
 */
import { combatConfigs, dialogues } from './content';
import { LION_CONTEXTUAL_DIALOGUE_ALIASES, LION_CONTEXTUAL_DIALOGUE_BUILDERS } from './lionFinale';
import { calibrateLionCombatConfig, calibrateLionDialogue } from './lionReputationCalibration';
import { getPostDemoCombat } from './postDemoContent';
import type { CombatConfig, DialogueSequence } from './types';

/** Every dialogue and fight the demo registered is Lion content. */
const LION_DIALOGUE_IDS: ReadonlySet<string> = new Set([
  ...dialogues.keys(),
  ...Object.keys(LION_CONTEXTUAL_DIALOGUE_BUILDERS),
  ...Object.keys(LION_CONTEXTUAL_DIALOGUE_ALIASES),
]);
const LION_COMBAT_IDS: ReadonlySet<string> = new Set(combatConfigs.keys());

export function isLionDialogue(dialogueId: string): boolean {
  return LION_DIALOGUE_IDS.has(dialogueId);
}

export function isLionCombat(combatId: string): boolean {
  return LION_COMBAT_IDS.has(combatId);
}

/** A dialogue as played: a Lion dialogue under the calibration, any other as authored. */
export function playableDialogue(sequence: DialogueSequence): DialogueSequence {
  return isLionDialogue(sequence.id) ? calibrateLionDialogue(sequence) : sequence;
}

/** A fight's configuration as played: a Lion fight with its calibrated reputation reward, any other as authored. */
export function playableCombatConfig(combatId: string): CombatConfig | undefined {
  const config = combatConfigs.get(combatId);
  if (config) return isLionCombat(combatId) ? calibrateLionCombatConfig(config) : config;
  // Set 1.20.0: post-demo fights are authored at the post-demo scale and play as authored.
  return getPostDemoCombat(combatId);
}

/** Any fight's configuration, Lion or post-demo, as authored. */
export function anyCombatConfig(combatId: string): CombatConfig | undefined {
  return combatConfigs.get(combatId) ?? getPostDemoCombat(combatId);
}
