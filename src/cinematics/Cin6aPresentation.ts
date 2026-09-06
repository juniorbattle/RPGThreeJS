import type { VideoCinematicTrigger } from './CinematicTypes';

type TruthFlags = Readonly<Record<string, boolean | undefined>>;

/**
 * CIN-6A lifecycle mappings are Journey-only until CIN-7 changes the production default.
 * They consume already-authoritative node/content/state facts and never mutate them.
 */
export const CIN6A_JOURNEY_TRIGGERS = Object.freeze({
  beforeDialogue: Object.freeze({
    lion_briefing: 'alaric_audience_arrival',
    village_choice: 'bois_clair_arrival',
    shadow_signs: 'shadow_signs',
    final_refuge: 'final_refuge_dossier',
  }),
  beforeCombat: Object.freeze({
    forest_ambush: 'forest_journey_tension',
    wolf_pack: 'forest_journey_tension',
    ruins_guardians: 'ruins_approach_context',
  }),
});

export const CIN6A_REFUGE_ARRIVALS = Object.freeze({
  'lion-first-refuge': 'first_refuge_arrival',
});

export const CIN6A_REFUGE_DEPARTURES = Object.freeze({
  'lion-first-refuge': 'first_refuge_departure',
  'lion-second-refuge': 'second_refuge_departure',
});

export function resolveCin6aJourneyTrigger(trigger: VideoCinematicTrigger): string | undefined {
  if (trigger.hook === 'beforeDialogue') return CIN6A_JOURNEY_TRIGGERS.beforeDialogue[trigger.dialogueId as keyof typeof CIN6A_JOURNEY_TRIGGERS.beforeDialogue];
  if (trigger.hook === 'beforeCombat') return CIN6A_JOURNEY_TRIGGERS.beforeCombat[trigger.combatId as keyof typeof CIN6A_JOURNEY_TRIGGERS.beforeCombat];
  return undefined;
}

export function resolveCin6aRefugeArrival(nodeId: string): string | undefined {
  return CIN6A_REFUGE_ARRIVALS[nodeId as keyof typeof CIN6A_REFUGE_ARRIVALS];
}

export function resolveCin6aRefugeDeparture(nodeId: string): string | undefined {
  return CIN6A_REFUGE_DEPARTURES[nodeId as keyof typeof CIN6A_REFUGE_DEPARTURES];
}

export function resolveCin6aBoisClairAftermath(
  combatId: string,
  victory: boolean,
  flags: TruthFlags,
): string | undefined {
  return victory
    && combatId === 'village_defense'
    && flags.missionSuccess === true
    && flags.missionGreed !== true
    ? 'bois_clair_saved'
    : undefined;
}

export function resolveCin6aSerpentEnding(
  combatId: string,
  victory: boolean,
  flags: TruthFlags,
): string | undefined {
  return victory && combatId === 'serpent_captain' && flags.serpentGeneralDefeated === true
    ? 'serpent_route_ending'
    : undefined;
}
