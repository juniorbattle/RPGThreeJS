/**
 * PURE campaign-presentation policy.
 *
 * Decides only HOW the current campaign boundary is presented — never what the campaign is. Route
 * truth, node availability and progression stay entirely inside RunSystem.
 *
 * Journey/NarrativeStage is the normal campaign surface. Only DEV may explicitly select the
 * legacy TravelView; production recovery is owned by GameApp's catastrophic-failure latch.
 */
export type CampaignPresentationMode = 'travel' | 'journey';

export const JOURNEY_SELECTOR_PARAM = 'journey';
export const PRESENTATION_SELECTOR_PARAM = 'presentation';

export interface CampaignPresentationPolicyInput {
  /** `window.location.search` (with or without the leading `?`). */
  search: string;
  /** `import.meta.env.DEV`. Allows the explicit legacy TravelView override. */
  dev: boolean;
}

/**
 * No selector is required. Existing cinematic/narrative selectors remain compatible; unknown
 * values leave the default intact. An explicit DEV travel selector takes precedence.
 */
export function resolveCampaignPresentation(input: CampaignPresentationPolicyInput): CampaignPresentationMode {
  return input.dev && isTravelForced(input.search) ? 'travel' : 'journey';
}

export function readJourneySelector(search: string): string | null {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(JOURNEY_SELECTOR_PARAM);
}

export function readPresentationSelector(search: string): string | null {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(PRESENTATION_SELECTOR_PARAM);
}

/** True when the selector explicitly demands the TravelView fallback. */
export function isTravelForced(search: string): boolean {
  return readJourneySelector(search) === 'travel' || readPresentationSelector(search) === 'travel';
}
