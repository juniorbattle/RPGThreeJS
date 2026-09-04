/**
 * PURE campaign-presentation policy.
 *
 * Decides only HOW the current campaign boundary is presented — never what the campaign is. Route
 * truth, node availability and progression stay entirely inside RunSystem.
 *
 * CIN-2 keeps TravelView as the production default. Cinematic Journey is a DEV-only selector so a
 * stale query string can never flip a shipped build into an unreviewed presentation.
 */
export type CampaignPresentationMode = 'travel' | 'journey';

export const JOURNEY_SELECTOR_PARAM = 'journey';

export interface CampaignPresentationPolicyInput {
  /** `window.location.search` (with or without the leading `?`). */
  search: string;
  /** `import.meta.env.DEV`. Journey is unavailable when false. */
  dev: boolean;
}

/**
 * `?journey=cinematic` in a DEV build selects Journey. Everything else — no selector,
 * `?journey=travel`, an unknown value, or any production build — stays on TravelView.
 */
export function resolveCampaignPresentation(input: CampaignPresentationPolicyInput): CampaignPresentationMode {
  const selector = readJourneySelector(input.search);
  if (!input.dev) return 'travel';
  return selector === 'cinematic' ? 'journey' : 'travel';
}

export function readJourneySelector(search: string): string | null {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(JOURNEY_SELECTOR_PARAM);
}

/** True when the selector explicitly demands the TravelView fallback. */
export function isTravelForced(search: string): boolean {
  return readJourneySelector(search) === 'travel';
}
