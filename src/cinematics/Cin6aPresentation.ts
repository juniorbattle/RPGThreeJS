import type { VideoCinematicTrigger } from './CinematicTypes';
import { resolveCompletedLionRoute } from '../game/lionFinale';

type TruthFlags = Readonly<Record<string, boolean | undefined>>;

export interface JourneyPresentationContext {
  flags?: TruthFlags;
  boundaryResolved?: boolean;
}

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

export const CIN6C_P1_RUNTIME_IDS = Object.freeze([
  'cedric_encounter',
  'garen_encounter',
  'serpent_road_tension',
  'shrine_reveal_context',
  'injured_merchant_encounter',
  'abandoned_cart_reveal',
  'spider_nest_reveal',
  'troll_crossing_reveal',
  'serpent_duelist_reveal',
  'young_dragon_encounter',
  'serpent_informant_encounter',
] as const);

/** Unique P1 content wins before the two census-approved reuse families. */
export const CIN6C_P1_JOURNEY_TRIGGERS = Object.freeze({
  beforeDialogue: Object.freeze({
    mystery_recruit: 'cedric_encounter',
    mystery_lancer_recruit: 'garen_encounter',
    mystery_help: 'injured_merchant_encounter',
    mystery_treasure: 'abandoned_cart_reveal',
    old_shrine_event: 'shrine_reveal_context',
    mystery_shrine: 'shrine_reveal_context',
    mystery_dragon_roost: 'young_dragon_encounter',
    serpent_informant: 'serpent_informant_encounter',
  }),
  beforeCombat: Object.freeze({
    spider_nest: 'spider_nest_reveal',
    troll_crossing: 'troll_crossing_reveal',
    serpent_duelist_trial: 'serpent_duelist_reveal',
    forest_patrol: 'serpent_road_tension',
    serpent_reprisals: 'serpent_road_tension',
    serpent_checkpoint: 'serpent_road_tension',
    serpent_hunters: 'serpent_road_tension',
  }),
});

const CIN6C_DIALOGUE_RESOLUTION_FLAGS = Object.freeze({
  mystery_recruit: Object.freeze(['recruitedCedric']),
  mystery_lancer_recruit: Object.freeze(['recruitedLancer']),
  mystery_help: Object.freeze(['helpedMerchant', 'abandonedMerchant']),
  mystery_treasure: Object.freeze(['returnedLostTreasure', 'claimedLostTreasure']),
  old_shrine_event: Object.freeze(['shrineRested', 'shrineLooted']),
  mystery_shrine: Object.freeze(['preservedShrine', 'desecratedShrine']),
  mystery_dragon_roost: Object.freeze(['challengedYoungDragon', 'sparedYoungDragon']),
  serpent_informant: Object.freeze(['protectedInformant', 'betrayedInformant']),
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

export function resolveCin6cJourneyTrigger(
  trigger: VideoCinematicTrigger,
  context: JourneyPresentationContext = {},
): string | undefined {
  if (context.boundaryResolved === true) return undefined;

  if (trigger.hook === 'beforeDialogue') {
    const dialogueId = trigger.dialogueId as keyof typeof CIN6C_P1_JOURNEY_TRIGGERS.beforeDialogue;
    const cinematicId = CIN6C_P1_JOURNEY_TRIGGERS.beforeDialogue[dialogueId];
    if (!cinematicId) return undefined;
    const resolvedFlags = CIN6C_DIALOGUE_RESOLUTION_FLAGS[dialogueId] ?? [];
    return resolvedFlags.some((flag) => context.flags?.[flag] === true) ? undefined : cinematicId;
  }

  if (trigger.hook === 'beforeCombat') {
    return CIN6C_P1_JOURNEY_TRIGGERS.beforeCombat[
      trigger.combatId as keyof typeof CIN6C_P1_JOURNEY_TRIGGERS.beforeCombat
    ];
  }

  return undefined;
}

/** Resolves only an already-selected content ID for immediate-candidate preloading. */
export function resolveCin6cContentCandidateId(contentId: string): string | undefined {
  return CIN6C_P1_JOURNEY_TRIGGERS.beforeDialogue[
    contentId as keyof typeof CIN6C_P1_JOURNEY_TRIGGERS.beforeDialogue
  ] ?? CIN6C_P1_JOURNEY_TRIGGERS.beforeCombat[
    contentId as keyof typeof CIN6C_P1_JOURNEY_TRIGGERS.beforeCombat
  ];
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
  if (!victory) return undefined;
  if (combatId === 'village_raid' && flags.missionGreed === true) return 'bois_clair_sacrificed';
  if (combatId === 'village_defense' && flags.missionSuccess === true && flags.missionGreed !== true) {
    return 'bois_clair_saved';
  }
  return undefined;
}

function completedLionRoute(flags: TruthFlags): ReturnType<typeof resolveCompletedLionRoute> {
  return resolveCompletedLionRoute({
    serpentGeneralDefeated: flags.serpentGeneralDefeated === true,
    lionTrialWon: flags.lionTrialWon === true,
    lionTrialRequested: flags.lionTrialRequested === true,
  });
}

export function resolveCin6aSerpentEnding(
  combatId: string,
  victory: boolean,
  flags: TruthFlags,
): string | undefined {
  return victory
    && combatId === 'serpent_captain'
    && flags.serpentGeneralDefeated === true
    && completedLionRoute(flags) === 'serpent_pursuit'
    ? 'serpent_route_ending'
    : undefined;
}

export function resolveCin6bLionTrialEnding(
  combatId: string,
  victory: boolean,
  flags: TruthFlags,
): string | undefined {
  return victory
    && combatId === 'lion_chief'
    && flags.lionTrialWon === true
    && completedLionRoute(flags) === 'lion_trial'
    ? 'lion_trial_route_ending'
    : undefined;
}
