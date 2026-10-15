import type { RunNode } from './types';

export interface OptionalEncounterIgnoreConsequence {
  reputation: number;
  flag: string;
  feedback: string;
}

/** Existing authored opt-outs. Historical event identities/flags stay V6 compatible. */
export function resolveOptionalEncounterIgnoreConsequence(
  legId: string, node: Pick<RunNode, 'id' | 'contentId'>,
): OptionalEncounterIgnoreConsequence | null {
  if (legId !== 'T0') return null;
  const flag = node.id === 'lion-refugees' && node.contentId === 'refugee_trial'
    ? 'ignoredRefugees'
    : node.id === 'lion-first-trial-event' && node.contentId === 'mystery_help'
      ? 'abandonedMerchant' : null;
  return flag ? { reputation: -2, flag, feedback: 'Réputation -2' } : null;
}
