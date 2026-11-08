/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Calibration"), approved by the operator in the Lot 0 package (OD-2026-11-08-A).
 *
 * In the post-demo game the Lion is the first plateau of the full game, with recalibrated reputation amounts and
 * thresholds. The authored content keeps the demo's values; this layer applies the approved calibration when the game
 * plays, so the reputation bounds test can keep measuring the demo apart. The frozen demo is preserved by a Git tag set
 * on `dev` before the first integration (OD-2026-11-08-A, point 6).
 *
 * It changes amounts and thresholds only: never a choice, an outcome, a route or a line, and never a saved value.
 * A leaf module (types only), so content, campaign and verdict code can all use it.
 */
import type { CombatConfig, DialogueSequence, NarrativeEffect } from './types';

export const LION_REPUTATION_CALIBRATION = Object.freeze({
  id: 'lion-post-demo-2026-11-08',
  decision: 'OD-2026-11-08-A',
  status: 'approved' as const,
  scale: 0.3,
});

export type LionReputationSourceKind = 'choice' | 'contest_failure' | 'step' | 'combat' | 'finale' | 'consequence';

export interface LionReputationAmountSource {
  kind: LionReputationSourceKind;
  amount: number;
  /** Combat rank, for combat rewards. */
  rank?: CombatConfig['encounterRank'];
}

/**
 * Approved amount rule: every amount is scaled by 0.3 and rounded, keeping its sign and at least one point; a routine
 * victory (an ordinary fight's positive reward) gives no reputation. Elite and boss rewards and every loss keep a value.
 */
export function calibrateLionAmount(source: LionReputationAmountSource): number {
  if (source.amount === 0) return 0;
  if (source.kind === 'combat' && source.rank === 'normal' && source.amount > 0) return 0;
  return Math.sign(source.amount) * Math.max(1, Math.round(Math.abs(source.amount) * LION_REPUTATION_CALIBRATION.scale));
}

/** Approved thresholds, keyed like the reputation ledger: content gates by dialogue, step and choice, code thresholds by name. */
export const LION_CALIBRATED_THRESHOLDS: Readonly<Record<string, number>> = Object.freeze({
  'gate:mystery_recruit:1:0': 27,
  'gate:mystery_lancer_recruit:1:0': 24,
  'gate:witnesses_on_road:1:0': 35,
  'code:alaric_credible': 33,
  'code:alaric_high': 42,
});

/** Alaric's credibility thresholds in the demo, kept for measurement only. */
export const LION_DEMO_ALARIC_THRESHOLDS = Object.freeze({ credible: 45, high: 70 });

/** Alaric's credibility thresholds the game uses: credible support, high public reputation and the bluff allowances. */
export const LION_ALARIC_THRESHOLDS = Object.freeze({
  credible: LION_CALIBRATED_THRESHOLDS['code:alaric_credible']!,
  high: LION_CALIBRATED_THRESHOLDS['code:alaric_high']!,
});

function calibrateEffects(effects: readonly NarrativeEffect[], kind: LionReputationSourceKind): NarrativeEffect[] {
  return effects.map((effect) => effect.type === 'addReputation'
    ? { ...effect, amount: calibrateLionAmount({ kind, amount: effect.amount }) }
    : effect);
}

/**
 * The Lion dialogue as the game plays it: calibrated reputation effects and choice thresholds, everything else as
 * authored. A content gate missing from the table keeps its authored value; the bounds test requires the table to be
 * complete.
 */
export function calibrateLionDialogue(sequence: DialogueSequence): DialogueSequence {
  return {
    ...sequence,
    steps: sequence.steps.map((step) => ({
      ...step,
      effects: calibrateEffects(step.effects, 'step'),
      ...(step.choices ? {
        choices: step.choices.map((choice, index) => {
          const gate = LION_CALIBRATED_THRESHOLDS[`gate:${sequence.id}:${step.id}:${index}`];
          return {
            ...choice,
            effects: calibrateEffects(choice.effects, 'choice'),
            ...(choice.requiresReputationMin !== undefined && gate !== undefined ? { requiresReputationMin: gate } : {}),
            ...(choice.contest ? {
              contest: {
                ...choice.contest,
                success: { ...choice.contest.success, effects: calibrateEffects(choice.contest.success.effects, 'choice') },
                failure: { ...choice.contest.failure, effects: calibrateEffects(choice.contest.failure.effects, 'contest_failure') },
              },
            } : {}),
          };
        }),
      } : {}),
    })),
  };
}

/** A Lion fight as the game plays it: its reputation reward calibrated by its rank, everything else as authored. */
export function calibrateLionCombatConfig(config: CombatConfig): CombatConfig {
  const reputation = calibrateLionAmount({ kind: 'combat', amount: config.rewards.reputation, rank: config.encounterRank });
  return reputation === config.rewards.reputation ? config : { ...config, rewards: { ...config.rewards, reputation } };
}
