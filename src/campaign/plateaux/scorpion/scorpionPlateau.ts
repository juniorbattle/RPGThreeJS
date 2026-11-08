/**
 * Set 1.20.0, post-demo Lot 3 — the Scorpion plateau's campaign binding, canon since OD-2026-11-08-D. It reaches
 * `dev` only on the operator's order. Data only: nothing here imports RunSystem.
 */
import type { PlateauCampaignBinding, PlateauOutcome } from '../PlateauRegistry';
import { SCORPION_CHALLENGES } from './scorpionCombat';
import { SCORPION_BRANCH_COMMITMENTS, SCORPION_GUARDIANS, SCORPION_OPTIONAL_POIS, SCORPION_ROUTE, SCORPION_TOPOLOGY } from './scorpionTopology';
import { SCORPION_ATLAS_REGIONS } from './scorpionPresentation';

/** The Scorpion's outcome from saved facts: the Prophète des Ombres's defeat closes the honour path, the won trial the force path. */
export function resolveScorpionPlateauOutcome(flags: Readonly<Record<string, boolean>>): PlateauOutcome | null {
  if (flags.scorpionShadowProphetDefeated) return 'honour';
  if (flags.scorpionTrialWon) return 'force';
  return null;
}

export const SCORPION_PLATEAU_BINDING: PlateauCampaignBinding = Object.freeze({
  regionId: 'scorpion-deserts',
  runIdPrefix: 'scorpion-',
  canonicalNodeIds: Object.freeze(SCORPION_ROUTE.map((node) => node.id)),
  optionalNodeIds: Object.freeze(SCORPION_OPTIONAL_POIS.map((poi) => poi.id)),
  startNodeId: 'scorpion-camp',
  refugeNodeIds: Object.freeze(['scorpion-first-refuge', 'scorpion-second-refuge', 'scorpion-final-refuge']),
  finalRefugeNodeId: 'scorpion-final-refuge',
  judgementNodeId: 'scorpion-judgement',
  branchCommitments: SCORPION_BRANCH_COMMITMENTS,
  eliteRouteContentIds: Object.freeze(['scorpion_flamekeeper', 'scorpion_lost_faithful']),
  challengeCombatIds: Object.freeze(Object.keys(SCORPION_CHALLENGES)),
  guardianIds: Object.freeze(SCORPION_GUARDIANS.map((guardian) => guardian.id)),
  atlasIds: Object.freeze(SCORPION_ATLAS_REGIONS.map((region) => region.image)),
  resolveOutcome: resolveScorpionPlateauOutcome,
  // Approved with the plateau (OD-2026-11-08-D), as `scorpion.consequences.json` records them. A codex left to the
  // Phénix under oath stands against the force outcome.
  outcomeRelations: Object.freeze({
    honour: Object.freeze([{ clan: 'scorpion', stance: 'ally' }, { clan: 'phoenix', stance: 'enemy' }] as const),
    force: Object.freeze([{ clan: 'scorpion', stance: 'enemy' }, { clan: 'phoenix', stance: 'enemy' }] as const),
  }),
  topology: SCORPION_TOPOLOGY,
});
