import type { RunNode } from './types';

export interface TraversalIgnoreConsequence {
  reputation: number;
  flag: string;
  feedback: string;
}

/** Content-sensitive authored opt-outs, never a blanket penalty for optional encounters. */
export function resolveTraversalIgnoreConsequence(
  legId: string, node: Pick<RunNode, 'id' | 'contentId'>,
): TraversalIgnoreConsequence | null {
  if (legId !== 'T0') return null;
  const flag = node.id === 'lion-refugees' && node.contentId === 'refugee_trial'
    ? 'ignoredRefugees'
    : node.id === 'lion-first-trial-event' && node.contentId === 'mystery_help'
      ? 'abandonedMerchant' : null;
  return flag ? { reputation: -2, flag, feedback: 'Réputation -2' } : null;
}
