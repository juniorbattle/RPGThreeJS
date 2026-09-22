import type { TraversalRouteBeat } from './TraversalT0Route';
import { TRAVERSAL_LOCAL_NARRATIVES } from '../game/campaignGrammarContent';

export type TraversalInteractionGrammar = 'WORLD' | 'LOCAL_MICRO_NARRATIVE' | 'LOCAL_COMBAT' | 'CANONICAL_INTERRUPT' | 'ROUTE_FORK';

/** Semantic content class, independent of placement, sprite identity and optionality. */
export function classifyTraversalInteraction(beat: TraversalRouteBeat): TraversalInteractionGrammar {
  if (beat.type === 'fork') return 'ROUTE_FORK';
  if (beat.campaignNodeIds.length) return 'CANONICAL_INTERRUPT';
  if (TRAVERSAL_LOCAL_NARRATIVES[beat.id]) return 'LOCAL_MICRO_NARRATIVE';
  if (beat.roadCombatId) return 'LOCAL_COMBAT';
  return 'WORLD';
}
