import type { LionPlayableTraversalLegId } from './LionCampaignTravelRelations';

/** OD-2026-10-09-A clarification: incidental road battles reuse ordinary forest
 * formations. These bindings never substitute for a fork's canonical encounter. */
export const LION_PURSUIT_ENCOUNTER_POOL = Object.freeze(['forest_patrol', 'forest_ambush', 'wolf_pack']);

// OD-2026-10-13-C: random ordinary types and counts, within each leg's difficulty.
const openingEnemies = Object.freeze(['serpent_raider', 'wolf', 'cave_rat', 'goblin',
  'forest_badger', 'village_militia_slinger']);
const approachEnemies = Object.freeze([...openingEnemies, 'village_militia_spearman',
  'venom_serpent', 'forest_spider', 'marsh_toad', 'wild_boar', 'skeleton']);
export const LION_PURSUIT_ENEMY_POOLS = Object.freeze({
  T0: openingEnemies,
  T1: approachEnemies,
  T3: Object.freeze([...approachEnemies, 'serpent_brute', 'serpent_oracle']),
});
export const LION_PURSUIT_ENEMY_COUNTS = Object.freeze({
  T0: Object.freeze([2, 2] as const),
  T1: Object.freeze([2, 3] as const),
  T3: Object.freeze([3, 4] as const),
});

/** Independent draws permit mixed groups and duplicates; no stat or campaign-state writes. */
export function rollLionPursuitEnemyFormation(legId: LionPlayableTraversalLegId,
  random: () => number): string[] | null {
  const pool = LION_PURSUIT_ENEMY_POOLS[legId], [minimum, maximum] = LION_PURSUIT_ENEMY_COUNTS[legId];
  const valid = (draw: number) => Number.isFinite(draw) && draw >= 0 && draw < 1;
  const countDraw = random();
  if (!valid(countDraw)) return null;
  const count = minimum + Math.floor(countDraw * (maximum - minimum + 1)), enemies: string[] = [];
  for (let index = 0; index < count; index++) {
    const draw = random();
    if (!valid(draw)) return null;
    enemies.push(pool[Math.floor(draw * pool.length)]!);
  }
  return enemies;
}

export interface LionPursuitEncounterBinding {
  readonly legId: LionPlayableTraversalLegId;
  readonly segmentId: string;
  readonly windowId: string;
  readonly phase: 'BEFORE_REFUGEES' | 'BEFORE_BRANCH' | 'AFTER_BRANCH';
  readonly branchNodeId?: string;
  readonly combatIds: readonly string[];
}

export const LION_PURSUIT_ENCOUNTER_BINDINGS: readonly LionPursuitEncounterBinding[] = Object.freeze([
  { legId: 'T0', segmentId: 'route-3', windowId: 't0:r3:pursuit-1', phase: 'BEFORE_REFUGEES' },
  { legId: 'T0', segmentId: 'route-5a', windowId: 't0:r5a:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-first-trial-event' },
  { legId: 'T0', segmentId: 'route-5b', windowId: 't0:r5b:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-first-trial-combat' },
  { legId: 'T0', segmentId: 'route-6', windowId: 't0:r6:pursuit-1', phase: 'AFTER_BRANCH' },
  { legId: 'T1', segmentId: 't1-route-4a', windowId: 't1:t0:r5a:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-second-trial-event' },
  { legId: 'T1', segmentId: 't1-route-4b', windowId: 't1:t0:r5b:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-second-trial-combat' },
  { legId: 'T1', segmentId: 't1-route-5', windowId: 't1:t0:r6:pursuit-1', phase: 'AFTER_BRANCH' },
  { legId: 'T3', segmentId: 't3-route-4a', windowId: 't3:t0:r5a:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-final-trial-event' },
  { legId: 'T3', segmentId: 't3-route-4b', windowId: 't3:t0:r5b:pursuit-1', phase: 'BEFORE_BRANCH', branchNodeId: 'lion-final-trial-combat' },
  { legId: 'T3', segmentId: 't3-route-5', windowId: 't3:t0:r6:pursuit-1', phase: 'AFTER_BRANCH' },
].map(binding => Object.freeze({ ...binding, combatIds: LION_PURSUIT_ENCOUNTER_POOL })) as LionPursuitEncounterBinding[]);
