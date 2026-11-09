/**
 * Set 1.20.0 (AUTHORING_AND_QA "Delivery package", CAMPAIGN_AND_STATE), post-demo Lot 0: the consequence map format.
 *
 * Each plateau has one versioned data file that links every major choice to the durable fact it sets, its reputation
 * and clan-relation effects, and the later scenes that echo it and name its cause. Each plateau is written map first,
 * before any line (brief, Lots 1 to 3). The narrative coherence validator reads the map together with the content and
 * fails on a fact set and never read, a fact read and never set, a major choice without a later echo, an echo that does
 * not name its cause, a broken dialogue link, an unknown actor or an unreachable step.
 *
 * Format version 1. A change of shape bumps `schemaVersion` and adds an explicit migration of the map files.
 */
import { z } from 'zod';
import { CAMPAIGN_CHAPTER_IDS, CAMPAIGN_CLAN_IDS } from '../plateaux/campaignIds';

export const CONSEQUENCE_MAP_SCHEMA_VERSION = 1 as const;

const id = z.string().min(1);
const flagRecord = z.record(z.boolean());

/**
 * A durable fact. `flag` is a game flag set by content or RunSystem; `flag_pattern` a family of flags with a variable
 * suffix (`refugeSecured:*`); `system` a lifecycle or bookkeeping flag that carries no narrative consequence and is
 * exempt from the echo rules, though it must still be set and read.
 */
export const consequenceFactSchema = z.object({
  id,
  kind: z.enum(['flag', 'flag_pattern', 'system']),
  summary: z.string().min(1),
}).strict();

export const clanRelationEffectSchema = z.object({
  clan: z.enum(CAMPAIGN_CLAN_IDS),
  stance: z.enum(['ally', 'neutral', 'enemy']),
}).strict();

export const choiceOptionSchema = z.object({
  /** Index of the choice in the step, as authored. */
  choiceIndex: z.number().int().nonnegative(),
  /** Which plateau path the option feeds (roadmap §2.3), or neutral. */
  path: z.enum(['honour', 'force', 'neutral']),
  /** Flags the choice sets to true directly, exactly as its effects do. */
  sets: z.array(id),
  /** Facts RunSystem records later because of this option (a boss victory, a route). */
  leadsTo: z.array(id).default([]),
  /** Reputation the option's own effects move, in the demo values (the validator checks it against content). */
  reputation: z.number().int(),
  clanRelations: z.array(clanRelationEffectSchema).default([]),
}).strict();

export const echoSchema = z.object({
  id,
  /** The fact whose consequence this scene shows. */
  fact: id,
  scope: z.enum(['same_plateau', 'later_plateau', 'tournament', 'final_act', 'epilogue']),
  /** `implemented` echoes are checked against content; `planned` ones are design only and count for nothing yet. */
  status: z.enum(['implemented', 'planned']),
  /** The chapter where the echo plays (defaults to the map's plateau). */
  chapterId: z.enum(CAMPAIGN_CHAPTER_IDS).optional(),
  nodeId: id,
  dialogueId: id,
  stepId: id.optional(),
  /** Flags under which the echo dialogue is built; must include `fact`. */
  state: flagRecord,
  /** Words of the echo that name its cause. They must appear with the fact and disappear without it. */
  causePhrase: z.string().min(8),
  /**
   * The counterfactual state the phrase must be absent from, when "the same state without the fact" is not a state the
   * game can reach (for a route ending, the other route's facts). Defaults to `state` with the fact set to false.
   */
  contrast: flagRecord.optional(),
}).strict();

export const majorChoiceSchema = z.object({
  id,
  summary: z.string().min(1),
  nodeId: id,
  dialogueId: id,
  stepId: id,
  /** Flags needed to build a state-built dialogue that holds this choice. */
  buildState: flagRecord.default({}),
  options: z.array(choiceOptionSchema).min(2),
  echoes: z.array(echoSchema).min(1),
}).strict();

export const outcomeSchema = z.object({
  /** Facts that record this outcome. */
  facts: z.array(id).min(1),
  clanRelations: z.array(clanRelationEffectSchema),
  /** Relation effects are canon only once the operator approves them. */
  relationStatus: z.enum(['proposed', 'approved']),
  echoes: z.array(echoSchema).default([]),
}).strict();

export const coherenceExceptionSchema = z.object({
  kind: z.enum(['fact_set_never_read', 'fact_read_never_set', 'unreachable_dialogue', 'unreachable_step', 'unknown_actor']),
  subject: id,
  reason: z.string().min(1),
}).strict();

export const consequenceMapSchema = z.object({
  schemaVersion: z.literal(CONSEQUENCE_MAP_SCHEMA_VERSION),
  plateauId: z.enum(CAMPAIGN_CHAPTER_IDS),
  /** `canon` for approved content; `draft` until the operator approves the plateau. */
  status: z.enum(['canon', 'draft']),
  sources: z.array(z.string().min(1)).min(1),
  facts: z.array(consequenceFactSchema),
  majorChoices: z.array(majorChoiceSchema),
  outcomes: z.object({ honour: outcomeSchema, force: outcomeSchema }).strict(),
  /**
   * Post-demo Lot 5: facts, major choices and echoes added as drafts to a map that is already canon, until the
   * operator approves them; the map's own `status` keeps describing the rest. Optional: every earlier map stays valid.
   */
  draftIds: z.array(id).optional(),
  exceptions: z.array(coherenceExceptionSchema).default([]),
}).strict();

/**
 * Every map of the campaign, the final act included (post-demo Lot 4). The final act has no honour or force outcome of
 * its own: the ending follows the four plateau outcomes (R4, Lot 5), so its map may omit `outcomes`. A Seal plateau's
 * map keeps stating both. An extension of format version 1: every existing map stays valid unchanged.
 */
export const campaignConsequenceMapSchema = consequenceMapSchema.extend({
  outcomes: consequenceMapSchema.shape.outcomes.optional(),
}).superRefine((map, context) => {
  if (map.plateauId !== 'finale' && !map.outcomes) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['outcomes'], message: 'A Seal plateau states its honour and force outcomes.' });
  }
});

export type ConsequenceFact = z.infer<typeof consequenceFactSchema>;
export type ConsequenceEcho = z.infer<typeof echoSchema>;
export type MajorChoice = z.infer<typeof majorChoiceSchema>;
export type ConsequenceMap = z.infer<typeof consequenceMapSchema>;
export type CampaignConsequenceMap = z.infer<typeof campaignConsequenceMapSchema>;
export type CoherenceException = z.infer<typeof coherenceExceptionSchema>;
