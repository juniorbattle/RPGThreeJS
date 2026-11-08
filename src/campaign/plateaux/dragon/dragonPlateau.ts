/**
 * Set 1.20.0, post-demo Lot 2 — the Dragon plateau's campaign binding, canon since OD-2026-11-08-C. It reaches `dev`
 * only on the operator's order. Data only: nothing here imports RunSystem.
 */
import type { PlateauCampaignBinding, PlateauOutcome } from '../PlateauRegistry';
import { DRAGON_CHALLENGES } from './dragonCombat';
import { DRAGON_BRANCH_COMMITMENTS, DRAGON_GUARDIANS, DRAGON_OPTIONAL_POIS, DRAGON_ROUTE, DRAGON_TOPOLOGY } from './dragonTopology';
import { DRAGON_ATLAS_REGIONS } from './dragonPresentation';

/** The Dragon's outcome from saved facts: the Chaman des Ombres's defeat closes the honour path, the won trial the force path. */
export function resolveDragonPlateauOutcome(flags: Readonly<Record<string, boolean>>): PlateauOutcome | null {
  if (flags.dragonShadowShamanDefeated) return 'honour';
  if (flags.dragonTrialWon) return 'force';
  return null;
}

export const DRAGON_PLATEAU_BINDING: PlateauCampaignBinding = Object.freeze({
  regionId: 'dragon-peaks',
  runIdPrefix: 'dragon-',
  canonicalNodeIds: Object.freeze(DRAGON_ROUTE.map((node) => node.id)),
  optionalNodeIds: Object.freeze(DRAGON_OPTIONAL_POIS.map((poi) => poi.id)),
  startNodeId: 'dragon-camp',
  refugeNodeIds: Object.freeze(['dragon-first-refuge', 'dragon-second-refuge', 'dragon-final-refuge']),
  finalRefugeNodeId: 'dragon-final-refuge',
  judgementNodeId: 'dragon-judgement',
  branchCommitments: DRAGON_BRANCH_COMMITMENTS,
  eliteRouteContentIds: Object.freeze(['dragon_corrupted_wyrm', 'dragon_shadow_touched']),
  challengeCombatIds: Object.freeze(Object.keys(DRAGON_CHALLENGES)),
  guardianIds: Object.freeze(DRAGON_GUARDIANS.map((guardian) => guardian.id)),
  atlasIds: Object.freeze(DRAGON_ATLAS_REGIONS.map((region) => region.image)),
  resolveOutcome: resolveDragonPlateauOutcome,
  // Approved with the plateau (OD-2026-11-08-C), as `dragon.consequences.json` records them. A Wolf pact kept at the
  // lair stands against the force outcome.
  outcomeRelations: Object.freeze({
    honour: Object.freeze([{ clan: 'dragon', stance: 'ally' }, { clan: 'wolf', stance: 'enemy' }] as const),
    force: Object.freeze([{ clan: 'dragon', stance: 'enemy' }, { clan: 'wolf', stance: 'enemy' }] as const),
  }),
  topology: DRAGON_TOPOLOGY,
});
