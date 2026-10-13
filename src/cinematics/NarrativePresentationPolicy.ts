export type NarrativeAuthoringMedia = 'STILL' | 'VIDEO';

export interface NarrativePresentationPolicyInput {
  search: string;
  dev: boolean;
}

/**
 * Static tableaux are the CIN-6.7.1 authoring truth. The legacy
 * `?journey=cinematic` selector keeps its video behaviour unless `media=stills`
 * explicitly asks for the static review surface.
 */
export function resolveNarrativeAuthoringMedia(input: NarrativePresentationPolicyInput): NarrativeAuthoringMedia {
  if (!input.dev) return 'VIDEO';
  const params = new URLSearchParams(input.search.startsWith('?') ? input.search.slice(1) : input.search);
  const media = params.get('media');
  if (media === 'stills') return 'STILL';
  if (media === 'video') return 'VIDEO';
  return params.get('presentation') === 'narrative' ? 'STILL' : 'VIDEO';
}

