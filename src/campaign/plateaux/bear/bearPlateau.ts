/**
 * Set 1.20.0, post-demo Lot 1 — DRAFT: the Bear plateau's campaign binding. Not canon until the operator approves the
 * plateau; it reaches `dev` only on the operator's order. Data only: nothing here imports RunSystem.
 */
import type { PlateauCampaignBinding, PlateauOutcome } from '../PlateauRegistry';
import { BEAR_CHALLENGES } from './bearCombat';
import { BEAR_BRANCH_COMMITMENTS, BEAR_GUARDIANS, BEAR_OPTIONAL_POIS, BEAR_ROUTE, BEAR_TOPOLOGY } from './bearTopology';
import { BEAR_ATLAS_REGIONS } from './bearPresentation';

/** The Bear's outcome from saved facts: the Master Spy's defeat closes the honour path, the won trial the force path. */
export function resolveBearPlateauOutcome(flags: Readonly<Record<string, boolean>>): PlateauOutcome | null {
  if (flags.bearMasterSpyDefeated) return 'honour';
  if (flags.bearTrialWon) return 'force';
  return null;
}

export const BEAR_PLATEAU_BINDING: PlateauCampaignBinding = Object.freeze({
  regionId: 'bear-mountains',
  runIdPrefix: 'bear-',
  canonicalNodeIds: Object.freeze(BEAR_ROUTE.map((node) => node.id)),
  optionalNodeIds: Object.freeze(BEAR_OPTIONAL_POIS.map((poi) => poi.id)),
  startNodeId: 'bear-camp',
  refugeNodeIds: Object.freeze(['bear-first-refuge', 'bear-second-refuge', 'bear-final-refuge']),
  finalRefugeNodeId: 'bear-final-refuge',
  judgementNodeId: 'bear-judgement',
  branchCommitments: BEAR_BRANCH_COMMITMENTS,
  eliteRouteContentIds: Object.freeze(['bear_corrupted_beast', 'bear_gallery_guardians']),
  challengeCombatIds: Object.freeze(Object.keys(BEAR_CHALLENGES)),
  guardianIds: Object.freeze(BEAR_GUARDIANS.map((guardian) => guardian.id)),
  atlasIds: Object.freeze(BEAR_ATLAS_REGIONS.map((region) => region.image)),
  resolveOutcome: resolveBearPlateauOutcome,
  // Proposed with the plateau, as `bear.consequences.json` records them. A Raven pact made in the mines stands.
  outcomeRelations: Object.freeze({
    honour: Object.freeze([{ clan: 'bear', stance: 'ally' }, { clan: 'raven', stance: 'enemy' }] as const),
    force: Object.freeze([{ clan: 'bear', stance: 'enemy' }, { clan: 'raven', stance: 'enemy' }] as const),
  }),
  topology: BEAR_TOPOLOGY,
});
