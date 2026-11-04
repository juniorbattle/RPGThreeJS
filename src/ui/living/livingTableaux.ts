import type { LivingScript } from './LivingTableauPlayer';
import { ALARIC_AUDIENCE } from './alaricAudience';
import { BOIS_CLAIR_ARRIVAL } from './boisClairArrival';
import { BOIS_CLAIR_SACRIFICED, BOIS_CLAIR_SAVED } from './boisClairAftermath';
import { LION_JUDGEMENT } from './lionJudgement';
import { LION_TRIAL_ROUTE_ENDING, SERPENT_ROUTE_ENDING } from './routeEndings';

/**
 * The living tableaux of sets 1.13.0 (OD-2026-11-04-A) and 1.14.0 (OD-2026-11-04-B), exhaustively, keyed by the beat
 * id of their moment. The ids name the moment only: no video slot is reopened and no video descriptor is activated.
 */
export const LIVING_TABLEAUX: Readonly<Record<string, LivingScript>> = Object.freeze({
  bois_clair_arrival: BOIS_CLAIR_ARRIVAL,
  bois_clair_saved: BOIS_CLAIR_SAVED,
  bois_clair_sacrificed: BOIS_CLAIR_SACRIFICED,
  lion_judgement: LION_JUDGEMENT,
  alaric_audience_arrival: ALARIC_AUDIENCE,
  serpent_route_ending: SERPENT_ROUTE_ENDING,
  lion_trial_route_ending: LION_TRIAL_ROUTE_ENDING,
});

/** The dialogue whose tableau keeps a living tableau's light, fire and weather alive behind the words. */
export const LIVING_BACKDROPS: Readonly<Record<string, string>> = Object.freeze({
  village_choice: 'bois_clair_arrival',
  village_defense_aftermath: 'bois_clair_saved',
  village_raid_aftermath: 'bois_clair_sacrificed',
  lion_finale_judgement: 'lion_judgement',
  // Set 1.14.0: the dialogue after the audience, the aftermath dialogue just before each route ending, on that ending's
  // tableau, and the epilogue that follows both endings, in the judgement hall.
  lion_briefing: 'alaric_audience_arrival',
  serpent_general_aftermath: 'serpent_route_ending',
  lion_trial_aftermath: 'lion_trial_route_ending',
  epilogue: 'lion_judgement',
});

/**
 * For the backdrops of set 1.14.0, the picture the dialogue's environment must show for the backdrop to be drawn: a
 * backdrop never lights the hall in place of the ruins or the terrace. The epilogue's picture is a copy of the
 * judgement hall under its own name.
 */
export const LIVING_BACKDROP_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  lion_briefing: 'alaric-audience-tableau.png',
  serpent_general_aftermath: 'serpent-finale-tableau-aftermath.png',
  lion_trial_aftermath: 'lion-trial-tableau-aftermath.png',
  epilogue: 'lion-judgement-epilogue-tableau.png',
});

/** Whether a dialogue's environment shows the picture its backdrop is drawn for. */
export function livingBackdropFits(dialogueId: string, environmentImage: string): boolean {
  const expected = LIVING_BACKDROP_IMAGES[dialogueId];
  return !expected || environmentImage.includes(expected);
}
