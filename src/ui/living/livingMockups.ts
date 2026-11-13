import type { LivingScript } from './LivingTableauPlayer';
import { BEAR_ARRIVAL } from './plateauArrivals';

/**
 * Mock-ups of proposed post-demo living tableaux, played from the QA lab only (PLATEAU_MOMENTS_DRAFT_2026-11-13). None is
 * wired to the game or listed in `LIVING_TABLEAUX` until the operator approves its moment table. Each names the dialogue
 * it would precede, whose mood it takes through the existing table.
 */
export const LIVING_MOCKUPS: Readonly<Record<string, { script: LivingScript; following: string }>> = Object.freeze({
  bear_arrival_moment: { script: BEAR_ARRIVAL, following: 'bear_audience' },
});
