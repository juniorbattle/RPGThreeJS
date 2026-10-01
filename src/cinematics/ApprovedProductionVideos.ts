/** The operator-approved production video slots. Beat IDs outside this set retain
 * their campaign meaning, but must use a non-video presentation surface. */
export const APPROVED_PRODUCTION_VIDEO_IDS = Object.freeze([
  'camp_departure',
  'alaric_audience_arrival',
  'bois_clair_arrival',
  'bois_clair_saved',
  'bois_clair_sacrificed',
  'lion_judgement',
  'serpent_route_ending',
  'lion_trial_route_ending',
] as const);

const approvedIds: ReadonlySet<string> = new Set(APPROVED_PRODUCTION_VIDEO_IDS);

export function isApprovedProductionVideo(id: string): boolean {
  return approvedIds.has(id);
}
