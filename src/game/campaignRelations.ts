/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE, OD-2026-11-07-I), post-demo Lot 0: RunSystem's authority over the campaign record.
 *
 * RunSystem owns a durable relation with each clan met (ally, neutral or enemy), set mainly by a plateau's outcome and
 * by authored choices, and read by the Tournament and the final act; it also owns plateau progress, outcomes and the
 * ending. These functions are re-exported by `runSystem.ts` and are the only writers of `state.campaign`. Presentation
 * reads them and never writes. Reputation and relations give no combat stat bonus: nothing here touches a stat.
 *
 * Clan supports are not saved: before a final-act fight RunSystem derives them from the allied clans, and their use in
 * that fight is transient (COMBAT_AND_VFX). Enemy clans likewise derive the foes they add.
 */
import {
  CAMPAIGN_CHAPTER_IDS,
  CAMPAIGN_CLAN_IDS,
  getPlateau,
  nextChapterId,
  type CampaignChapterId,
  type CampaignClanId,
  type PlateauOutcome,
  type SealPlateauId,
} from '../campaign/plateaux/PlateauRegistry';
import {
  migrateCampaignProgress,
  type CampaignEndingId,
  type CampaignProgress,
  type ClanRelationStance,
} from './campaignProgress';
import type { GameState } from './types';

/** The campaign record of a state, derived from saved facts when an in-memory state predates it. */
export function campaignProgressOf(state: GameState): CampaignProgress {
  state.campaign ??= migrateCampaignProgress(state);
  return state.campaign;
}

export function isClanMet(state: GameState, clan: CampaignClanId): boolean {
  return Boolean(campaignProgressOf(state).clanRelations[clan]);
}

/** A clan not met yet reads as neutral. */
export function getClanRelation(state: GameState, clan: CampaignClanId): ClanRelationStance {
  return campaignProgressOf(state).clanRelations[clan]?.stance ?? 'neutral';
}

/** The facts that explain a clan's relation, so a later scene can name its cause. */
export function getClanRelationCauses(state: GameState, clan: CampaignClanId): readonly string[] {
  return campaignProgressOf(state).clanRelations[clan]?.causeIds ?? [];
}

function addCause(causeIds: string[], causeId: string): boolean {
  if (causeIds.includes(causeId)) return false;
  causeIds.push(causeId);
  return true;
}

/** Records a first meeting: the clan becomes met and neutral. Idempotent; returns whether it was newly met. */
export function meetClan(state: GameState, clan: CampaignClanId, causeId: string): boolean {
  const relations = campaignProgressOf(state).clanRelations;
  if (relations[clan]) return false;
  relations[clan] = { stance: 'neutral', causeIds: [causeId] };
  return true;
}

/**
 * Sets a clan's relation for an authored cause (a consequence-map fact). Meets the clan if needed. Idempotent for the
 * same cause and stance; returns whether the record changed.
 */
export function setClanRelation(
  state: GameState,
  clan: CampaignClanId,
  stance: ClanRelationStance,
  causeId: string,
): boolean {
  if (!causeId) throw new Error('A clan relation needs the fact that causes it.');
  const relations = campaignProgressOf(state).clanRelations;
  const entry = relations[clan];
  if (!entry) {
    relations[clan] = { stance, causeIds: [causeId] };
    return true;
  }
  const stanceChanged = entry.stance !== stance;
  entry.stance = stance;
  return addCause(entry.causeIds, causeId) || stanceChanged;
}

export function selectClansByRelation(state: GameState, stance: ClanRelationStance): CampaignClanId[] {
  return CAMPAIGN_CLAN_IDS.filter((clan) => isClanMet(state, clan) && getClanRelation(state, clan) === stance);
}

/**
 * Records a Seal plateau's outcome once. A recorded outcome is a durable fact and never changes: a second call returns
 * false and leaves it as it was.
 */
export function recordPlateauOutcome(state: GameState, chapterId: SealPlateauId, outcome: PlateauOutcome): boolean {
  const chapter = campaignProgressOf(state).chapters[chapterId];
  if (chapter.outcome) return false;
  if (chapter.status === 'locked') throw new Error(`Chapter '${chapterId}' is not open.`);
  chapter.outcome = outcome;
  return true;
}

/**
 * Closes the current chapter and opens the next one in the fixed order. A Seal plateau closes only with a recorded
 * outcome. Once only: closing a chapter that is not current returns null.
 */
export function completeCurrentChapter(state: GameState): CampaignChapterId | null {
  const progress = campaignProgressOf(state);
  const current = progress.currentChapterId;
  const chapter = progress.chapters[current];
  if (chapter.status === 'locked') return null;
  if (getPlateau(current).kind === 'seal_plateau' && !chapter.outcome) {
    throw new Error(`Chapter '${current}' has no recorded outcome.`);
  }
  chapter.status = 'completed';
  const next = nextChapterId(current);
  if (!next) return null;
  progress.chapters[next].status = 'active';
  progress.currentChapterId = next;
  return next;
}

/** The recorded outcomes of the Seal plateaux, in campaign order. */
export function selectPlateauOutcomes(state: GameState): { chapterId: SealPlateauId; outcome: PlateauOutcome }[] {
  const chapters = campaignProgressOf(state).chapters;
  return CAMPAIGN_CHAPTER_IDS
    .filter((id): id is SealPlateauId => id !== 'finale')
    .flatMap((chapterId) => chapters[chapterId].outcome ? [{ chapterId, outcome: chapters[chapterId].outcome! }] : []);
}

/**
 * R4, as the operator chose on the sheet (CAMPAIGN_AND_STATE set 1.20.0): the ending follows the four plateau outcomes.
 * Three or four honour outcomes give Respect, or Balance when reputation is below 40. Three or four force outcomes give
 * Fear, or Balance when reputation is 60 or more. Two and two give Balance.
 */
export function resolveCampaignEnding(outcomes: readonly PlateauOutcome[], reputation: number): CampaignEndingId {
  if (outcomes.length !== 4) throw new Error(`The ending needs the four plateau outcomes, not ${outcomes.length}.`);
  const honour = outcomes.filter((outcome) => outcome === 'honour').length;
  const force = outcomes.length - honour;
  if (honour >= 3) return reputation < 40 ? 'balance' : 'respect';
  if (force >= 3) return reputation >= 60 ? 'balance' : 'fear';
  return 'balance';
}

/** Records the ending once the four outcomes are known. Once only: a recorded ending is returned unchanged. */
export function recordCampaignEnding(state: GameState): CampaignEndingId | null {
  const progress = campaignProgressOf(state);
  if (progress.ending) return progress.ending;
  const outcomes = selectPlateauOutcomes(state).map((entry) => entry.outcome);
  if (outcomes.length !== 4) return null;
  progress.ending = resolveCampaignEnding(outcomes, state.reputation);
  return progress.ending;
}
