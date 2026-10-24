export type NarrativeAuthoringMedia = 'STILL' | 'VIDEO';

export interface NarrativePresentationPolicyInput {
  search: string;
  dev: boolean;
}

/** OD-2026-10-24-A: legacy URLs cannot re-enable retired cinematic production. */
export function resolveNarrativeAuthoringMedia(_input: NarrativePresentationPolicyInput): NarrativeAuthoringMedia {
  return 'STILL';
}
