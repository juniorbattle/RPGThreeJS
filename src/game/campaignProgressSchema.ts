/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE, OD-2026-11-07-I), post-demo Lot 0: the schema of the durable campaign record.
 * A leaf module (zod and the closed identity lists only), so the save schema in `types.ts` can include it. The record's
 * derivation and migration live in `campaignProgress.ts`.
 */
import { z } from 'zod';
import { CAMPAIGN_CHAPTER_IDS, CAMPAIGN_CLAN_IDS, type CampaignChapterId } from '../campaign/plateaux/campaignIds';

export const CAMPAIGN_PROGRESS_VERSION = 1 as const;

export const clanRelationStanceSchema = z.enum(['ally', 'neutral', 'enemy']);
export type ClanRelationStance = z.infer<typeof clanRelationStanceSchema>;

/** A met clan's relation and the consequence-map facts that explain it, so an echo can name its cause. */
export const clanRelationSchema = z.object({
  stance: clanRelationStanceSchema,
  causeIds: z.array(z.string().min(1)).max(16),
}).strict();
export type ClanRelation = z.infer<typeof clanRelationSchema>;

export const chapterProgressSchema = z.object({
  status: z.enum(['locked', 'active', 'completed']),
  outcome: z.enum(['honour', 'force']).optional(),
}).strict();
export type ChapterProgress = z.infer<typeof chapterProgressSchema>;

export const FINAL_ACT_STAGES = Object.freeze(['not_started', 'tournament', 'capital', 'breach', 'epilogue', 'completed'] as const);
export const CAMPAIGN_ENDING_IDS = Object.freeze(['respect', 'fear', 'balance'] as const);
export type CampaignEndingId = typeof CAMPAIGN_ENDING_IDS[number];

const chaptersShape = Object.fromEntries(CAMPAIGN_CHAPTER_IDS.map((id) => [id, chapterProgressSchema])) as
  Record<CampaignChapterId, typeof chapterProgressSchema>;

export const campaignProgressV1Schema = z.object({
  version: z.literal(CAMPAIGN_PROGRESS_VERSION),
  currentChapterId: z.enum(CAMPAIGN_CHAPTER_IDS),
  chapters: z.object(chaptersShape).strict(),
  /** Only met clans have an entry; an absent clan reads as neutral. */
  clanRelations: z.record(z.enum(CAMPAIGN_CLAN_IDS), clanRelationSchema),
  finalAct: z.object({
    stage: z.enum(FINAL_ACT_STAGES),
    /** Final-act fights won, in order, by durable ID. */
    completedFightIds: z.array(z.string().min(1)),
  }).strict(),
  ending: z.enum(CAMPAIGN_ENDING_IDS).nullable(),
}).strict();
export type CampaignProgress = z.infer<typeof campaignProgressV1Schema>;

/** The current schema. A future version adds its own schema and an explicit step in `migrateCampaignProgress`. */
export const campaignProgressSchema = campaignProgressV1Schema;

export function createCampaignProgress(): CampaignProgress {
  return {
    version: CAMPAIGN_PROGRESS_VERSION,
    currentChapterId: 'lion',
    chapters: {
      lion: { status: 'active' },
      bear: { status: 'locked' },
      dragon: { status: 'locked' },
      scorpion: { status: 'locked' },
      finale: { status: 'locked' },
    },
    clanRelations: {},
    finalAct: { stage: 'not_started', completedFightIds: [] },
    ending: null,
  };
}
