/**
 * Set 1.20.0, post-demo Lot 4 — DRAFT: the final act's campaign binding. Not canon until the operator approves the final
 * act; it reaches `dev` only on the operator's order. Data only: nothing here imports RunSystem.
 *
 * The final act has no honour or force outcome of its own: the ending follows the four plateau outcomes (R4, Lot 5).
 * Its run holds the capital's small map; the Tournament before it is a board RunSystem reads from saved facts.
 */
import type { PlateauCampaignBinding } from '../PlateauRegistry';
import { FINALE_CHALLENGES } from './finaleCombat';
import { FINALE_ATLAS_REGIONS } from './finalePresentation';
import { FINALE_BRANCH_COMMITMENTS, FINALE_GUARDIANS, FINALE_OPTIONAL_POIS, FINALE_ROUTE, FINALE_TOPOLOGY } from './finaleTopology';
import { FINALE_BOARD_NODE_IDS } from './finaleTournament';

export const FINALE_PLATEAU_BINDING: PlateauCampaignBinding = Object.freeze({
  regionId: 'finale-capital',
  runIdPrefix: 'finale-',
  canonicalNodeIds: Object.freeze(FINALE_ROUTE.map((node) => node.id)),
  optionalNodeIds: Object.freeze(FINALE_OPTIONAL_POIS.map((poi) => poi.id)),
  startNodeId: 'finale-arena-gate',
  refugeNodeIds: Object.freeze(['finale-last-refuge']),
  finalRefugeNodeId: 'finale-last-refuge',
  judgementNodeId: 'finale-breach',
  branchCommitments: FINALE_BRANCH_COMMITMENTS,
  eliteRouteContentIds: Object.freeze(['finale_demon_square']),
  challengeCombatIds: Object.freeze(Object.keys(FINALE_CHALLENGES)),
  guardianIds: Object.freeze(FINALE_GUARDIANS.map((guardian) => guardian.id)),
  atlasIds: Object.freeze(FINALE_ATLAS_REGIONS.map((region) => region.image)),
  resolveOutcome: () => null,
  outcomeRelations: Object.freeze({ honour: Object.freeze([]), force: Object.freeze([]) }),
  boardNodeIds: FINALE_BOARD_NODE_IDS,
  topology: FINALE_TOPOLOGY,
});
