import type { LivingScript } from './LivingTableauPlayer';
import { BOIS_CLAIR_ARRIVAL } from './boisClairArrival';
import { BOIS_CLAIR_SACRIFICED, BOIS_CLAIR_SAVED } from './boisClairAftermath';
import { LION_JUDGEMENT } from './lionJudgement';

/**
 * The living tableaux of set 1.13.0 (OD-2026-11-04-A), exhaustively, keyed by the beat id of their moment. The ids name
 * the moment only: no video slot is reopened and no video descriptor is activated.
 */
export const LIVING_TABLEAUX: Readonly<Record<string, LivingScript>> = Object.freeze({
  bois_clair_arrival: BOIS_CLAIR_ARRIVAL,
  bois_clair_saved: BOIS_CLAIR_SAVED,
  bois_clair_sacrificed: BOIS_CLAIR_SACRIFICED,
  lion_judgement: LION_JUDGEMENT,
});

/** The dialogue each living tableau precedes, whose tableau keeps its light, fire and smoke alive behind the words. */
export const LIVING_BACKDROPS: Readonly<Record<string, string>> = Object.freeze({
  village_choice: 'bois_clair_arrival',
  village_defense_aftermath: 'bois_clair_saved',
  village_raid_aftermath: 'bois_clair_sacrificed',
  lion_finale_judgement: 'lion_judgement',
});
