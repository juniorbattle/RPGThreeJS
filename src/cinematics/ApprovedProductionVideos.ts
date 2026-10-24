/** Historical media identities retained for provenance; authored campaign beats survive retirement. */
export const HISTORICAL_PRODUCTION_VIDEO_IDS = Object.freeze([
  'camp_departure',
  'alaric_audience_arrival',
  'bois_clair_arrival',
  'bois_clair_saved',
  'bois_clair_sacrificed',
  'lion_judgement',
  'serpent_route_ending',
  'lion_trial_route_ending',
] as const);

/** OD-2026-10-24-A retires all production video slots. */
export const APPROVED_PRODUCTION_VIDEO_IDS: readonly string[] = Object.freeze([]);

const approvedIds: ReadonlySet<string> = new Set(APPROVED_PRODUCTION_VIDEO_IDS);

export function isApprovedProductionVideo(id: string): boolean {
  return approvedIds.has(id);
}
