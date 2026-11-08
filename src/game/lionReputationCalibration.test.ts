/** The approved Lion reputation calibration as the game plays it (OD-2026-11-08-A, set 1.20.0). */
import { describe, expect, it } from 'vitest';
import { combatConfigs, dialogues } from './content';
import { resolveGameDialogue } from './contextualDialogueContent';
import {
  LION_ALARIC_THRESHOLDS,
  LION_REPUTATION_CALIBRATION,
  calibrateLionAmount,
  calibrateLionDialogue,
} from './lionReputationCalibration';
import { isLionDialogue, playableCombatConfig, playableDialogue } from './playableContent';
import { createInitialState } from './store';
import type { DialogueSequence } from './types';

const choicesOf = (sequence: DialogueSequence) => sequence.steps.flatMap((step) => step.choices ?? []);
const reputationOf = (effects: readonly { type: string; amount?: number }[]) =>
  effects.filter((effect) => effect.type === 'addReputation').map((effect) => effect.amount);

describe('approved Lion reputation calibration (OD-2026-11-08-A)', () => {
  it('is the approved rule: ×0.3 rounded, sign kept, at least one point, routine victories at zero', () => {
    expect(LION_REPUTATION_CALIBRATION).toMatchObject({ status: 'approved', decision: 'OD-2026-11-08-A', scale: 0.3 });
    expect([12, 10, 8, 5, 4, 3, 2, 1, -1, -2, -6, -10, -15].map((amount) => calibrateLionAmount({ kind: 'choice', amount })))
      .toEqual([4, 3, 2, 2, 1, 1, 1, 1, -1, -1, -2, -3, -5]);
    expect(calibrateLionAmount({ kind: 'combat', amount: 1, rank: 'normal' })).toBe(0);
    expect(calibrateLionAmount({ kind: 'combat', amount: -2, rank: 'normal' })).toBe(-1);
    expect(calibrateLionAmount({ kind: 'combat', amount: 1, rank: 'elite' })).toBe(1);
    expect(calibrateLionAmount({ kind: 'finale', amount: 2 })).toBe(1);
    expect(LION_ALARIC_THRESHOLDS).toEqual({ credible: 33, high: 42 });
  });

  it('plays Bois-Clair with its calibrated amounts while the authored dialogue keeps the demo values', () => {
    const authored = choicesOf(dialogues.get('village_choice')!).map((choice) => reputationOf(choice.effects));
    const played = choicesOf(resolveGameDialogue('village_choice', createInitialState())!.sequence)
      .map((choice) => reputationOf(choice.effects));
    expect(authored.filter((amounts) => amounts.length)).toEqual([[10], [-10]]);
    expect(played.filter((amounts) => amounts.length)).toEqual([[3], [-3]]);
  });

  it('plays the witness escort at its calibrated threshold, with a calibrated contest failure', () => {
    const escort = choicesOf(resolveGameDialogue('witnesses_on_road', createInitialState())!.sequence)[0]!;
    expect(escort.requiresReputationMin).toBe(35);
    expect(reputationOf(escort.effects)).toEqual([2]);
    expect(reputationOf(escort.contest!.failure.effects)).toEqual([-1]);
  });

  it('plays the recruits at 27 (Cedric) and 24 (Garen)', () => {
    expect(choicesOf(resolveGameDialogue('mystery_recruit', createInitialState())!.sequence)[0]!.requiresReputationMin).toBe(27);
    expect(choicesOf(resolveGameDialogue('mystery_lancer_recruit', createInitialState())!.sequence)[0]!.requiresReputationMin).toBe(24);
  });

  it('plays the state-built judgement with the calibrated Shadow revelation', () => {
    const state = createInitialState();
    state.flags = { missionSuccess: true, shadowEvidence: true };
    const reveal = choicesOf(resolveGameDialogue('lion_finale_judgement', state)!.sequence)
      .find((choice) => choice.text.startsWith('Révéler'))!;
    expect(reputationOf(reveal.effects)).toEqual([1]);
  });

  it('plays fights with calibrated rewards: Bois-Clair defence 3, the General 4, a routine victory 0, a guardian 1', () => {
    expect(playableCombatConfig('village_defense')!.rewards.reputation).toBe(3);
    expect(playableCombatConfig('serpent_captain')!.rewards.reputation).toBe(4);
    expect(playableCombatConfig('forest_ambush')!.rewards.reputation).toBe(0);
    expect(playableCombatConfig('poi_elite_valley_sentinel')!.rewards.reputation).toBe(1);
    expect(combatConfigs.get('village_defense')!.rewards.reputation).toBe(10);
    expect(playableCombatConfig('village_defense')!.rewards.gold).toBe(combatConfigs.get('village_defense')!.rewards.gold);
    expect(playableCombatConfig('no_such_fight')).toBeUndefined();
  });

  it('leaves content that is not the Lion as authored', () => {
    const draft = { id: 'bear_draft_probe', steps: [{ id: '1', speaker: 'Alistair', tag: '', text: 'Brouillon.', expression: 'neutral',
      portrait: '', side: 'left', next: null, effects: [{ type: 'addReputation', amount: 2 }], choices: [] }] } as DialogueSequence;
    expect(isLionDialogue(draft.id)).toBe(false);
    expect(playableDialogue(draft)).toBe(draft);
    expect(reputationOf(calibrateLionDialogue(draft).steps[0]!.effects)).toEqual([1]);
  });
});
