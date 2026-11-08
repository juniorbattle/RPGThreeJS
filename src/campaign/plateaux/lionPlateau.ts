/**
 * Set 1.20.0, post-demo Lot 0: the Lion's campaign binding in the plateau registry.
 *
 * Every value is read from the Lion's existing tables, never copied, so the Lion plays exactly as before. The branch
 * commitments and the canonical elite fights moved here from RunSystem unchanged (sets 1.17.0 and 1.4.0); RunSystem
 * now reads them through the registry. This module is data only and must not import RunSystem.
 */
import { CHALLENGES } from '../../game/challenges';
import { lionBossVictoryFacts } from '../../game/lionFinale';
import { LION_FINAL_JUDGEMENT_NODE_ID, LION_FINAL_REFUGE_NODE_ID } from '../LionFinalRefugeServices';
import { GUARD_POSTS, LION_CANONICAL_POI_IDS, LOT_E_ELITES, LOT_E_POIS } from '../LionPoiAuthoring';
import { LION_TRAVERSAL_LEGS } from '../LionCampaignTravelRelations';
import { LION_FIRST_TRIAL, LION_OPENING_LOCAL_ROUTES, LION_OPENING_REQUIRED, LION_POI_METADATA } from '../LionPoiTopology';
import { areLionFinalRefugeServicesAvailable } from '../LionFinalRefugeServices';
import type { PlateauTopology } from './PlateauTopology';
import { LION_POI_REGIONS } from '../LionPoiMap';
import type { PlateauCampaignBinding, PlateauOutcome } from './PlateauRegistry';

/**
 * Set 1.17.0 (OD-2026-11-07-C): the three authored exclusive forks and the POI that resolves each chapter. Once saved
 * facts show a branch chosen, the company is committed to its target until that POI is resolved.
 */
export const LION_BRANCH_COMMITMENTS = Object.freeze([
  Object.freeze({ legId: 'T0', resolvingNodeId: 'lion-first-refuge' }),
  Object.freeze({ legId: 'T1', resolvingNodeId: 'lion-village-choice' }),
  Object.freeze({ legId: 'T3', resolvingNodeId: 'lion-shadow-signs' }),
]);

/** The canonical elite fights the route can draw at its forks; the map shows them as elite. */
export const LION_ELITE_ROUTE_CONTENT_IDS = Object.freeze(['troll_crossing', 'serpent_duelist_trial', 'young_dragon_roost']);

export const LION_REFUGE_NODE_IDS = Object.freeze(['lion-first-refuge', 'lion-second-refuge']);

/**
 * The Lion's outcome from saved facts: the Serpent General's defeat closes the honour path (Serpent pursuit), the won
 * trial closes the force path (Lion trial). Null until one of these boss victories is recorded.
 */
export function resolveLionPlateauOutcome(flags: Readonly<Record<string, boolean>>): PlateauOutcome | null {
  // Same priority as `resolveCompletedLionRoute`, without its fallback: no victory, no outcome.
  if (flags.serpentGeneralDefeated) return 'honour';
  if (flags.lionTrialWon) return 'force';
  return null;
}

/** The boss victory fact that records each outcome, as `lionBossVictoryFacts` sets it. */
export const LION_OUTCOME_FACTS: Readonly<Record<PlateauOutcome, string>> = Object.freeze({
  honour: Object.keys(lionBossVictoryFacts('serpent_captain')).find((key) => key === 'serpentGeneralDefeated')!,
  force: Object.keys(lionBossVictoryFacts('lion_chief')).find((key) => key === 'lionTrialWon')!,
});

/** The Lion's topology, read from its existing tables: the navigation rules it had, unchanged (set 1.20.0, Lot 1). */
export const LION_TOPOLOGY: PlateauTopology = Object.freeze({
  plateauId: 'lion',
  startNodeId: 'lion-camp',
  legs: LION_TRAVERSAL_LEGS,
  localRoutes: LION_OPENING_LOCAL_ROUTES,
  localRoutesRequire: LION_OPENING_REQUIRED,
  // The first refuge requires an actual first trial, and the direct local trial route ignores the refugees.
  gatedTrial: Object.freeze({ nodeIds: LION_FIRST_TRIAL, gatedNodeId: 'lion-first-refuge', bypassOnDirectRouteNodeId: 'lion-refugees' }),
  metadata: LION_POI_METADATA,
  optionalPois: LOT_E_POIS,
  guardians: LOT_E_ELITES,
  guardPosts: GUARD_POSTS,
  finalRefugeNodeId: LION_FINAL_REFUGE_NODE_ID,
  finalRefugeServicesAvailable: areLionFinalRefugeServicesAvailable,
});

export const LION_PLATEAU_BINDING: PlateauCampaignBinding = Object.freeze({
  regionId: 'lion-forest',
  runIdPrefix: 'lion-',
  canonicalNodeIds: LION_CANONICAL_POI_IDS,
  optionalNodeIds: Object.freeze(LOT_E_POIS.map((poi) => poi.id)),
  startNodeId: 'lion-camp',
  refugeNodeIds: LION_REFUGE_NODE_IDS,
  finalRefugeNodeId: LION_FINAL_REFUGE_NODE_ID,
  judgementNodeId: LION_FINAL_JUDGEMENT_NODE_ID,
  branchCommitments: LION_BRANCH_COMMITMENTS,
  eliteRouteContentIds: LION_ELITE_ROUTE_CONTENT_IDS,
  challengeCombatIds: Object.freeze(Object.keys(CHALLENGES)),
  guardianIds: Object.freeze(LOT_E_ELITES.map((elite) => elite.id)),
  atlasIds: Object.freeze(LION_POI_REGIONS.map((region) => region.image)),
  resolveOutcome: resolveLionPlateauOutcome,
  topology: LION_TOPOLOGY,
});
