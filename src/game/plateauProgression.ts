/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE, OD-2026-11-07-I), post-demo Lot 1: RunSystem's passage from one plateau to the next.
 *
 * A Seal plateau closes once its outcome is read from saved facts: RunSystem records the outcome once, meets the host
 * and rival clans, sets the clan relations the outcome carries (a relation an authored choice of the same plateau set
 * stands) and opens the next chapter. The next plateau then begins as a new run under its own durable ID prefix; every
 * saved fact of the plateaux behind it (flags, reputation, company, inventory, resolved POIs) carries over unchanged.
 *
 * The Lion closes from its existing victory facts, so a demo save whose chronicle ended continues into the Bear without
 * replaying anything and with no Lion fact changed. GameApp calls these functions and decides nothing itself.
 */
import {
  getPlateau,
  nextChapterId,
  plateauIdForRun,
  requirePlateauCampaign,
  type CampaignChapterId,
  type PlateauOutcome,
  type SealPlateauId,
} from '../campaign/plateaux/PlateauRegistry';
import {
  campaignProgressOf,
  completeCurrentChapter,
  getClanRelationCauses,
  meetClan,
  recordPlateauOutcome,
  setClanRelation,
} from './campaignRelations';
import { lionBossVictoryFacts, resolvePendingLionFinaleCombat } from './lionFinale';
import { plateauVictoryFacts, resolvePendingPlateauFinaleCombat, type PlateauFinaleDefinition } from './plateauFinale';
import { PLATEAU_FINALES, postDemoChapterOf } from './postDemoContent';
import { createPlateauRunState, secureRunLoot } from './runSystem';
import type { GameState, RunState } from './types';

/** The chapter that owns the current run. */
export function runPlateauId(state: Pick<GameState, 'run'>): CampaignChapterId {
  return plateauIdForRun(state.run);
}

/** The finale of a built post-demo plateau; the Lion keeps its own finale owner. */
export function plateauFinaleOf(chapterId: CampaignChapterId): PlateauFinaleDefinition | undefined {
  return PLATEAU_FINALES[chapterId];
}

/** The finale fight still owed on the run's judgement node after a reload, or null. */
export function pendingPlateauFinaleCombat(state: Pick<GameState, 'run' | 'flags'>): string | null {
  const chapterId = runPlateauId(state);
  if (chapterId === 'lion') return resolvePendingLionFinaleCombat(state.flags);
  const finale = plateauFinaleOf(chapterId);
  return finale ? resolvePendingPlateauFinaleCombat(finale, state.flags) : null;
}

/** The durable facts a won fight records: the Lion's boss facts, or a post-demo plateau's victory facts. */
export function combatVictoryFacts(combatId: string): Readonly<Record<string, boolean>> {
  const chapterId = postDemoChapterOf(combatId);
  const finale = chapterId ? plateauFinaleOf(chapterId) : undefined;
  return finale ? plateauVictoryFacts(finale, combatId) : lionBossVictoryFacts(combatId);
}

/** The epilogue the run's boss victory leads to. */
export function plateauEpilogueDialogueId(state: Pick<GameState, 'run'>): string {
  const chapterId = runPlateauId(state);
  return chapterId === 'lion' ? 'epilogue' : plateauFinaleOf(chapterId)?.epilogueDialogueId ?? 'epilogue';
}

/** The cause recorded when a plateau's clans are first met. */
export function arrivalCause(chapterId: CampaignChapterId): string {
  return `${chapterId}.arrival`;
}

/** The cause recorded for a relation an outcome sets. */
export function outcomeCause(chapterId: SealPlateauId, outcome: PlateauOutcome): string {
  return `${chapterId}.outcome.${outcome}`;
}

function meetPlateauClans(state: GameState, chapterId: CampaignChapterId): void {
  const { hostClan, rivalClan } = getPlateau(chapterId);
  for (const clan of [hostClan, rivalClan]) if (clan) meetClan(state, clan, arrivalCause(chapterId));
}

/** True when an authored choice of this plateau already set the clan's relation. */
function relationSetByChoice(state: GameState, chapterId: SealPlateauId, clan: Parameters<typeof getClanRelationCauses>[1]): boolean {
  return getClanRelationCauses(state, clan).some((cause) => cause.startsWith(`${chapterId}.`)
    && cause !== arrivalCause(chapterId) && !cause.startsWith(`${chapterId}.outcome.`));
}

export interface PlateauClosure {
  chapterId: SealPlateauId;
  outcome: PlateauOutcome;
  nextChapterId: CampaignChapterId | null;
}

/**
 * Closes the run's plateau once its outcome is known. Once only: a plateau already closed, a plateau that is not the
 * current chapter or a plateau without an outcome returns null and changes nothing.
 */
export function closeCurrentPlateau(state: GameState): PlateauClosure | null {
  const progress = campaignProgressOf(state);
  const chapterId = runPlateauId(state);
  if (progress.currentChapterId !== chapterId || getPlateau(chapterId).kind !== 'seal_plateau') return null;
  const sealId = chapterId as SealPlateauId;
  const binding = requirePlateauCampaign(sealId);
  const outcome = progress.chapters[sealId].outcome ?? binding.resolveOutcome(state.flags);
  if (!outcome) return null;
  recordPlateauOutcome(state, sealId, outcome);
  meetPlateauClans(state, sealId);
  for (const { clan, stance } of binding.outcomeRelations[outcome]) {
    if (!relationSetByChoice(state, sealId, clan)) setClanRelation(state, clan, stance, outcomeCause(sealId, outcome));
  }
  return { chapterId: sealId, outcome, nextChapterId: completeCurrentChapter(state) };
}

/**
 * Ends a post-demo plateau's chronicle from its epilogue: the plateau closes and its ending is recorded, so the
 * campaign boundary presents the end of the chronicle. Refuses a plateau that does not own the run.
 */
export function completePlateauChronicle(state: GameState, plateauId: CampaignChapterId): PlateauClosure | null {
  if (plateauId === 'lion' || runPlateauId(state) !== plateauId) return null;
  const closure = closeCurrentPlateau(state);
  if (closure) state.endingId = `${closure.chapterId}-seal-${closure.outcome}`;
  return closure;
}

/**
 * The next plateau can begin when the current chapter is open, built, and not yet the run's plateau: the run behind it
 * has closed.
 */
export function canBeginCurrentPlateau(state: GameState): boolean {
  const progress = campaignProgressOf(state);
  const current = progress.currentChapterId;
  return state.run.status === 'completed' && runPlateauId(state) !== current
    && progress.chapters[current].status === 'active' && getPlateau(current).campaign !== null;
}

/** The chapter the company would continue into from its completed run, or null. Closes nothing. */
export function nextPlayablePlateau(state: GameState): CampaignChapterId | null {
  if (state.run.status !== 'completed') return null;
  const progress = campaignProgressOf(state);
  const chapterId = runPlateauId(state);
  if (progress.currentChapterId !== chapterId) return canBeginCurrentPlateau(state) ? progress.currentChapterId : null;
  if (!getPlateau(chapterId).campaign?.resolveOutcome(state.flags)) return null;
  const next = nextChapterId(chapterId);
  return next && getPlateau(next).campaign ? next : null;
}

/**
 * Continues the campaign from a completed run: closes its plateau if a demo save left it open, then begins the next
 * plateau as a new run. The run behind it keeps nothing transient: its remaining loot is secured first. Returns the new
 * run, or null when the campaign cannot continue (outcome missing, next chapter not built).
 */
export function continueCampaign(state: GameState, seed = Date.now() & 0x7fffffff): RunState | null {
  if (state.run.status !== 'completed') return null;
  closeCurrentPlateau(state);
  if (!canBeginCurrentPlateau(state)) return null;
  secureRunLoot(state);
  const chapterId = campaignProgressOf(state).currentChapterId;
  const run = createPlateauRunState(chapterId, seed);
  state.run = run;
  state.currentNodeId = run.currentNodeId;
  state.visitedNodeIds = [...run.visitedNodeIds];
  state.endingId = null;
  meetPlateauClans(state, chapterId);
  return run;
}
