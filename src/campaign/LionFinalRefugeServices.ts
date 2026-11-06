import type { GameState } from '../game/types';
import { resolveSelectedLionFinaleCombat } from '../game/lionFinale';

export const LION_FINAL_REFUGE_NODE_ID = 'lion-final-refuge';
export const LION_FINAL_JUDGEMENT_NODE_ID = 'lion-final-judgement';

/** The judgement has begun once its node was entered, resolved or a finale combat was chosen. */
export function hasLionJudgementBegun(state: Readonly<GameState>): boolean {
  return state.run.visitedNodeIds.includes(LION_FINAL_JUDGEMENT_NODE_ID)
    || state.resolvedNodeIds.includes(LION_FINAL_JUDGEMENT_NODE_ID)
    || resolveSelectedLionFinaleCombat(state.flags) !== null;
}

/**
 * Set 1.15.0 (OD-2026-11-05-E): after its unchanged dialogue, and on each return before the
 * judgement, the final refuge offers the existing refuge services. Derived only from existing
 * facts (resolved nodes, judgement entry); it adds no saved field. The map reads it to make the
 * resolved final refuge reusable, like the two refuges.
 */
export function areLionFinalRefugeServicesAvailable(state: Readonly<GameState>): boolean {
  return state.run.status === 'active'
    && state.resolvedNodeIds.includes(LION_FINAL_REFUGE_NODE_ID)
    && !hasLionJudgementBegun(state);
}

/** The services open when the company stands at the resolved final refuge before the judgement. */
export function areLionFinalRefugeServicesOpen(state: Readonly<GameState>): boolean {
  return state.run.currentNodeId === LION_FINAL_REFUGE_NODE_ID && areLionFinalRefugeServicesAvailable(state);
}
