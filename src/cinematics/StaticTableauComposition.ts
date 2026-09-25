import type { NarrativeScreenPosition, NarrativeStagedActorSpec, NarrativeTableauSpec, NarrativeVisualPhaseSpec } from './NarrativeTableau';

/** Visual-only grouping. Authored screenPosition, actor identity and choice lanes remain authoritative. */
export type StaticTableauCompositionProfile =
  | 'AUTHORITY_AUDIENCE'
  | 'ADVISER_EXCHANGE'
  | 'COMPANY_EXCHANGE'
  | 'OPPOSING_GROUPS'
  | 'EVENT_SUBJECT_FOCUS'
  | 'PRE_COMBAT_CONFRONTATION'
  | 'AFTERMATH_GROUP'
  | 'FINALE_FOCUS';

export interface StaticTableauActorTuning {
  xPercent: number;
  scale: number;
  baselineVh: number;
}

const X: Readonly<Record<StaticTableauCompositionProfile, Readonly<Record<NarrativeScreenPosition, number>>>> = {
  AUTHORITY_AUDIENCE: { FAR_LEFT: 17, LEFT: 30, CENTER_LEFT: 41, CENTER: 51, CENTER_RIGHT: 58, RIGHT: 72, FAR_RIGHT: 81 },
  ADVISER_EXCHANGE: { FAR_LEFT: 26, LEFT: 34, CENTER_LEFT: 41, CENTER: 52, CENTER_RIGHT: 62, RIGHT: 68, FAR_RIGHT: 76 },
  COMPANY_EXCHANGE: { FAR_LEFT: 19, LEFT: 32, CENTER_LEFT: 43, CENTER: 52, CENTER_RIGHT: 61, RIGHT: 72, FAR_RIGHT: 82 },
  OPPOSING_GROUPS: { FAR_LEFT: 16, LEFT: 29, CENTER_LEFT: 39, CENTER: 52, CENTER_RIGHT: 64, RIGHT: 76, FAR_RIGHT: 86 },
  EVENT_SUBJECT_FOCUS: { FAR_LEFT: 20, LEFT: 32, CENTER_LEFT: 43, CENTER: 55, CENTER_RIGHT: 64, RIGHT: 74, FAR_RIGHT: 83 },
  PRE_COMBAT_CONFRONTATION: { FAR_LEFT: 18, LEFT: 31, CENTER_LEFT: 41, CENTER: 52, CENTER_RIGHT: 63, RIGHT: 75, FAR_RIGHT: 85 },
  AFTERMATH_GROUP: { FAR_LEFT: 22, LEFT: 34, CENTER_LEFT: 44, CENTER: 52, CENTER_RIGHT: 61, RIGHT: 70, FAR_RIGHT: 80 },
  FINALE_FOCUS: { FAR_LEFT: 20, LEFT: 33, CENTER_LEFT: 43, CENTER: 52, CENTER_RIGHT: 63, RIGHT: 74, FAR_RIGHT: 83 },
};

/** Identity-specific silhouette balance on the foreground plane; authored slots stay fixed. */
const SILHOUETTE_SCALE: Readonly<Record<string, number>> = {
  forest_troll_elite: 1.18,
  young_dragon_elite: 1.16,
  shrine_apparition: .82,
};

export function resolveStaticTableauComposition(
  tableau: NarrativeTableauSpec,
  phase: NarrativeVisualPhaseSpec,
): StaticTableauCompositionProfile {
  if (tableau.family === 'AUDIENCE') return 'AUTHORITY_AUDIENCE';
  if (tableau.family === 'PRE_COMBAT') return 'PRE_COMBAT_CONFRONTATION';
  if (tableau.family === 'AFTERMATH') return 'AFTERMATH_GROUP';
  if (tableau.family === 'FINALE') return 'FINALE_FOCUS';
  const groups = new Set(phase.staticCast.map((actor) => actor.group));
  if (groups.has('ANTAGONIST') && (groups.has('PLAYER_COMPANY') || groups.has('LION_COURT'))) return 'OPPOSING_GROUPS';
  if ((groups.has('LOCAL_CIVILIAN') || groups.has('REFUGEE') || groups.has('RECRUIT_CANDIDATE'))
    && groups.has('PLAYER_COMPANY')) return 'EVENT_SUBJECT_FOCUS';
  if (tableau.family === 'ATE' || phase.layoutProfile === 'ADVISER_EXCHANGE') return 'ADVISER_EXCHANGE';
  return 'COMPANY_EXCHANGE';
}

export function resolveStaticTableauActorTuning(
  profile: StaticTableauCompositionProfile,
  actor: NarrativeStagedActorSpec,
): StaticTableauActorTuning {
  return { xPercent: X[profile][actor.screenPosition], scale: SILHOUETTE_SCALE[actor.actorId] ?? 1, baselineVh: 3 };
}
