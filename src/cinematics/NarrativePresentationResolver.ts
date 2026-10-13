import { FINAL_PRESENTATION_BEATS } from './FinalPresentationRegistry.generated';
import type { PlayerFacingSurfaceMode, ResolvedPresentationBeat } from './NarrativePresentationMode';

const BEATS: readonly ResolvedPresentationBeat[] = FINAL_PRESENTATION_BEATS;

export type PresentationLifecycleHook =
  | 'CAMPAIGN_BOUNDARY'
  | 'BEFORE_DIALOGUE'
  | 'BEFORE_COMBAT'
  | 'AFTER_COMBAT'
  | 'CHAPTER_BEAT'
  | 'RESUME';

export interface PresentationBeatQuery {
  beatId?: string;
  nodeId?: string;
  edgeId?: string;
  contentId?: string;
  dialogueId?: string;
  combatId?: string;
  cinematicId?: string;
  lifecycleHook?: PresentationLifecycleHook;
  expectedMode?: PlayerFacingSurfaceMode;
}

const BY_BEAT = new Map<string, ResolvedPresentationBeat>(BEATS.map((beat) => [beat.beatId, beat]));
const BY_DIALOGUE = new Map(
  BEATS.filter((beat) => beat.dialogueId).map((beat) => [beat.dialogueId!, beat]),
);
const BY_COMBAT = new Map(
  BEATS.filter((beat) => beat.combatId && beat.mode === 'COMBAT')
    .map((beat) => [beat.combatId!, beat]),
);

export function getResolvedPresentationBeat(beatId: string): ResolvedPresentationBeat | undefined {
  return BY_BEAT.get(beatId);
}

/**
 * The sole pure lookup path from an already-authoritative content identity to presentation.
 * The ranking is identity-based and never guesses campaign outcomes from presentation state.
 */
export function resolvePresentationBeat(query: PresentationBeatQuery): ResolvedPresentationBeat | undefined {
  if (query.beatId) return BY_BEAT.get(query.beatId);
  if (query.dialogueId) return BY_DIALOGUE.get(query.dialogueId);
  if (query.combatId && (!query.expectedMode || query.expectedMode === 'COMBAT')) return BY_COMBAT.get(query.combatId);
  if (query.edgeId) return BY_BEAT.get(`edge:${query.edgeId}`);
  if (query.cinematicId) return BY_BEAT.get(`media:${query.cinematicId}`);

  const candidates = BEATS.filter((beat) => (
    (!query.nodeId || beat.nodeId === query.nodeId)
    && (!query.contentId || beat.contentId === query.contentId)
    && (!query.combatId || beat.combatId === query.combatId)
    && (!query.expectedMode || beat.mode === query.expectedMode)
  ));
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function resolvePresentationCandidates(
  queries: readonly PresentationBeatQuery[],
): readonly ResolvedPresentationBeat[] {
  const found = queries
    .map(resolvePresentationBeat)
    .filter((beat): beat is ResolvedPresentationBeat => Boolean(beat));
  return [...new Map(found.map((beat) => [beat.beatId, beat])).values()];
}

export function resolveDialoguePresentation(dialogueId: string): ResolvedPresentationBeat | undefined {
  return BY_DIALOGUE.get(dialogueId);
}

export function resolveCombatPresentation(combatId: string): ResolvedPresentationBeat | undefined {
  return BY_COMBAT.get(combatId);
}

export function resolveEdgePresentation(fromNodeId: string, toNodeId: string): ResolvedPresentationBeat | undefined {
  return BY_BEAT.get(`edge:${fromNodeId}>${toNodeId}`);
}

export function resolveCinematicPresentation(cinematicId: string): ResolvedPresentationBeat | undefined {
  return BY_BEAT.get(`media:${cinematicId}`);
}
