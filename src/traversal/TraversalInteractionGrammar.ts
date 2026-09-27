import type { TraversalRouteBeat } from './TraversalT0Route';
export type TraversalInteractionGrammar = 'CANONICAL_INTERRUPT' | 'ROUTE_FORK';

/** Semantic content class, independent of placement, sprite identity and optionality. */
export function classifyTraversalInteraction(beat: TraversalRouteBeat): TraversalInteractionGrammar {
  if (beat.type === 'fork') return 'ROUTE_FORK';
  return 'CANONICAL_INTERRUPT';
}
