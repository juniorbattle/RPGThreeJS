/**
 * Set 1.20.0, post-demo Lot 0: the campaign's closed identity lists. A leaf module with no imports, so the save schema
 * can use them without loading campaign content.
 */

/** The clans named by the roadmap (§3.1 to §3.4) and the operator's post-demo decision. No other clan exists. */
export const CAMPAIGN_CLAN_IDS = Object.freeze([
  'lion', 'serpent', 'bear', 'raven', 'dragon', 'wolf', 'scorpion', 'phoenix',
] as const);
export type CampaignClanId = typeof CAMPAIGN_CLAN_IDS[number];

/** Four Seal plateaux in their fixed order (P3), then the final act (F1). */
export const CAMPAIGN_CHAPTER_IDS = Object.freeze(['lion', 'bear', 'dragon', 'scorpion', 'finale'] as const);
export type CampaignChapterId = typeof CAMPAIGN_CHAPTER_IDS[number];
export type SealPlateauId = Exclude<CampaignChapterId, 'finale'>;

/** The two outcomes of a Seal plateau (roadmap §2.3). The Lion's Serpent pursuit is honour, its Lion trial force. */
export type PlateauOutcome = 'honour' | 'force';
