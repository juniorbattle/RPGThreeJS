/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE, OD-2026-11-07-I), post-demo Lot 0: the durable campaign record.
 *
 * Clan relations, plateau progress and outcomes, final-act progress and the chosen ending are durable facts. They live
 * in one independently versioned record inside the V6 save, as `run.poiExpedition` already does: the V6 envelope, its
 * keys and every Lion field stay exactly as the demo writes them, and this record carries its own version with an
 * explicit migration. A demo save without the record resumes at its saved point with every clan neutral until met and
 * no Lion fact changed. A frozen demo build reading a post-demo save ignores the record.
 *
 * Never saved here: waves, boss phases, clan supports (derived from relations before each final-act fight), used
 * supports and any visual or transient state. RunSystem is the only writer, through `campaignRelations.ts`.
 */
import { resolveLionPlateauOutcome } from '../campaign/plateaux/lionPlateau';
import {
  campaignProgressSchema,
  createCampaignProgress,
  type CampaignProgress,
} from './campaignProgressSchema';

export * from './campaignProgressSchema';

/** The saved facts the derivation reads. Structural, so a V6 state of any age fits. */
export interface CampaignDerivationSource {
  flags: Readonly<Record<string, boolean>>;
  endingId: string | null;
  run: { status: 'active' | 'completed' | 'failed' };
  campaign?: unknown;
}

/**
 * Derives the record for a save that predates it: the Lion is the current chapter, completed when the demo chronicle
 * ended, with its outcome when a boss victory recorded one; later chapters stay locked; no clan is met yet, so every
 * clan reads neutral. Reads saved facts only and writes none of them.
 */
export function deriveCampaignProgress(source: CampaignDerivationSource): CampaignProgress {
  const progress = createCampaignProgress();
  const outcome = resolveLionPlateauOutcome(source.flags);
  const completed = source.run.status === 'completed' || Boolean(source.endingId?.startsWith('lion-seal'));
  progress.chapters.lion = { status: completed ? 'completed' : 'active', ...(outcome ? { outcome } : {}) };
  return progress;
}

/**
 * Explicit migration of the campaign record: absent (any demo or older save) -> derived v1; v1 -> unchanged. An
 * unknown or malformed record throws, so the save is refused as invalid rather than silently rewritten.
 */
export function migrateCampaignProgress(source: CampaignDerivationSource): CampaignProgress {
  if (source.campaign === undefined) return deriveCampaignProgress(source);
  return campaignProgressSchema.parse(source.campaign);
}
