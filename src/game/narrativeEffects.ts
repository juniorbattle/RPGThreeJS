/**
 * The game truth a dialogue effect changes, in one place (OD-2026-11-13-F, Q1).
 *
 * GameApp applies every authored effect through this function and keeps only what is presentation or lifecycle: the
 * effect's delay, the fight it holds until the dialogue ends, the chapter beat it shows and the save it writes at a
 * durable route boundary. The QA drivers apply the same function, so a simulated chronicle changes the state exactly as
 * the game does instead of copying the game's switch.
 */
import { createRecruitInstance, getItemCategory } from './catalog';
import { completeCampaignEnding } from './finalAct';
import { resolveLionFinaleExecution, resolveSelectedLionFinaleCombat } from './lionFinale';
import { calibrateLionAmount } from './lionReputationCalibration';
import { resolvePendingPlateauFinaleCombat, resolvePlateauFinaleExecution } from './plateauFinale';
import { closeCurrentPlateau, completePlateauChronicle, plateauFinaleOf } from './plateauProgression';
import { canRecruit } from './refugeRecruitment';
import { changeReputation } from './reputation';
import { creditRunReward, setClanRelation } from './runSystem';
import type { GameState, NarrativeEffect } from './types';

/** What the caller still owes after the state changed. Absent fields ask for nothing. */
export interface NarrativeEffectOutcome {
  /** The fight to start once the dialogue ends; it replaces any fight an earlier effect named. */
  combatId?: string;
  /** The chapter beat a finished chapter names (the Lion's `finishChapter`). */
  chapterBeatId?: string;
  /** A durable route selection was just made: GameApp saves it at once, so a reload resumes the selected boss. */
  saveNow?: boolean;
}

export function applyNarrativeEffect(state: GameState, effect: NarrativeEffect): NarrativeEffectOutcome {
  switch (effect.type) {
    case 'setFlag':
      state.flags[effect.key] = effect.value;
      return {};
    case 'addGold':
      if (effect.amount >= 0) creditRunReward(state, { gold: effect.amount });
      else state.gold = Math.max(0, state.gold - Math.abs(effect.amount));
      return {};
    case 'addReputation':
      changeReputation(state, effect.amount, 'narrative');
      return {};
    case 'addItem':
      creditRunReward(state, { category: getItemCategory(effect.itemId) ?? 'consumables', itemId: effect.itemId, quantity: effect.quantity });
      return {};
    case 'recruitUnit':
      // OD-2026-11-11-F (F2): eight recruitable heroes, two per plateau; refugeRecruitment.ts owns the rule.
      if (canRecruit(state, effect.unitId)) state.clan.members.push(createRecruitInstance(effect.unitId));
      return {};
    case 'startCombat':
      return { combatId: effect.combatId };
    case 'resolveLionFinale': {
      const existingCombat = resolveSelectedLionFinaleCombat(state.flags);
      if (existingCombat) return { combatId: existingCombat };
      const execution = resolveLionFinaleExecution(state, effect.intent);
      Object.assign(state.flags, execution.flagChanges);
      if (execution.reputationDelta !== 0) {
        changeReputation(state, calibrateLionAmount({ kind: 'finale', amount: execution.reputationDelta }), `lion-finale:${execution.trialCause ?? execution.route}`);
      }
      return { combatId: execution.combatId, saveNow: true };
    }
    case 'finishChapter':
      state.endingId = effect.endingId;
      // Set 1.20.0: RunSystem records the Lion's outcome and relations as the chronicle ends.
      closeCurrentPlateau(state);
      return { chapterBeatId: effect.endingId };
    case 'setClanRelation':
      setClanRelation(state, effect.clan, effect.stance, effect.cause);
      return {};
    case 'resolvePlateauFinale': {
      const finale = plateauFinaleOf(effect.plateauId);
      if (!finale) throw new Error(`No finale for plateau '${effect.plateauId}'.`);
      const existingCombat = resolvePendingPlateauFinaleCombat(finale, state.flags);
      if (existingCombat) return { combatId: existingCombat };
      const execution = resolvePlateauFinaleExecution(finale, state, effect.intent);
      Object.assign(state.flags, execution.flagChanges);
      if (execution.reputationDelta !== 0) {
        changeReputation(state, execution.reputationDelta, `${effect.plateauId}-finale:${execution.trialCause ?? execution.route}`);
      }
      return { combatId: execution.combatId, saveNow: true };
    }
    case 'completePlateau':
      completePlateauChronicle(state, effect.plateauId);
      return {};
    case 'completeEpilogue':
      completeCampaignEnding(state);
      return {};
  }
}
