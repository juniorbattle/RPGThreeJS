export type CinematicReductionClassification =
  | 'KEEP_MAJOR_VIDEO'
  | 'OPTIONAL_VIDEO'
  | 'CONVERT_TO_STATIC_TABLEAU'
  | 'CONVERT_TO_TRAVEL_STILL'
  | 'CONVERT_TO_HOLD_STILL'
  | 'COMBAT_OWNED'
  | 'LEGACY_UNUSED';

export interface CinematicReductionDecision {
  classification: CinematicReductionClassification;
  justification: string;
  criterion: 'PHYSICAL_ACTION' | 'MAJOR_REVEAL' | 'WORLD_CHANGE' | 'IMPORTANT_ENTRANCE' | 'MAJOR_RESCUE_FAILURE' | 'CLIMAX' | 'SPECTACLE' | 'TALKING' | 'TRAVEL' | 'SCENIC_PUNCTUATION' | 'LEGACY';
}

/**
 * CIN-6E-A.4R presentation-only reduction policy. Existing media remains on
 * disk and in the production manifest; this map decides how each slot should
 * be used by the static-tableau-first presentation layer.
 */
export const CINEMATIC_REDUCTION_POLICY = Object.freeze<Record<string, Readonly<CinematicReductionDecision>>>({
  lion_judgement: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'CLIMAX', justification: 'Major judgement and route-climax ceremony.' },
  serpent_general_reveal: { classification: 'COMBAT_OWNED', criterion: 'IMPORTANT_ENTRANCE', justification: 'Boss entrance belongs to the combat handoff, never to dialogue.' },
  lion_champion_reveal: { classification: 'COMBAT_OWNED', criterion: 'IMPORTANT_ENTRANCE', justification: 'Champion entrance belongs to the combat handoff, never to dialogue.' },
  forest_journey_tension: { classification: 'CONVERT_TO_TRAVEL_STILL', criterion: 'TRAVEL', justification: 'Atmospheric movement is route texture rather than a major story action.' },
  camp_departure: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'IMPORTANT_ENTRANCE', justification: 'Opening departure establishes the company and begins the Lion chapter.' },
  alaric_audience_arrival: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'IMPORTANT_ENTRANCE', justification: 'Major court entrance and Audience ceremony; all dialogue starts afterward.' },
  refugees_approach: { classification: 'OPTIONAL_VIDEO', criterion: 'IMPORTANT_ENTRANCE', justification: 'The refugee arrival can retain motion as a brief encounter reveal before tableau dialogue.' },
  first_refuge_arrival: { classification: 'OPTIONAL_VIDEO', criterion: 'WORLD_CHANGE', justification: 'Arrival establishes a new refuge location before management and dialogue.' },
  first_refuge_departure: { classification: 'CONVERT_TO_TRAVEL_STILL', criterion: 'TRAVEL', justification: 'Route departure is travel continuity, not a dramatic action beat.' },
  valmir_route_fork: { classification: 'CONVERT_TO_TRAVEL_STILL', criterion: 'TRAVEL', justification: 'The fork is persistent route geography best held as a travel still.' },
  bois_clair_arrival: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'WORLD_CHANGE', justification: 'Bois-Clair burning is a major physical event and world-state reveal.' },
  bois_clair_saved: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'MAJOR_RESCUE_FAILURE', justification: 'Major rescue outcome visibly changes the village state.' },
  bois_clair_sacrificed: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'MAJOR_RESCUE_FAILURE', justification: 'Major failure outcome visibly changes the village and refugee state.' },
  second_refuge_departure: { classification: 'CONVERT_TO_TRAVEL_STILL', criterion: 'TRAVEL', justification: 'Route departure is travel continuity, not a major dramatic action.' },
  witnesses_encounter: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'The beat is witness testimony and decision context.' },
  ruins_approach_context: { classification: 'CONVERT_TO_HOLD_STILL', criterion: 'SCENIC_PUNCTUATION', justification: 'The ruins approach is dialogue-free environmental punctuation before danger.' },
  shadow_signs: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'The core content is Seraphine and Elara interpreting evidence.' },
  final_refuge_dossier: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'The dossier is a sustained company discussion and evidence review.' },
  serpent_route_ending: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'CLIMAX', justification: 'Route climax and ending-state spectacle.' },
  lion_trial_route_ending: { classification: 'KEEP_MAJOR_VIDEO', criterion: 'CLIMAX', justification: 'Route climax and Lion recognition ceremony.' },
  cedric_encounter: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'Recruitment negotiation is character dialogue.' },
  garen_encounter: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'Recruitment negotiation is character dialogue.' },
  serpent_road_tension: { classification: 'COMBAT_OWNED', criterion: 'IMPORTANT_ENTRANCE', justification: 'Enemy reveal belongs to the following tactical-combat handoff.' },
  shrine_reveal_context: { classification: 'OPTIONAL_VIDEO', criterion: 'MAJOR_REVEAL', justification: 'The intact shrine is a compact environmental reveal before a tableau choice.' },
  injured_merchant_encounter: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'The player-facing content is a conversation and aid decision.' },
  abandoned_cart_reveal: { classification: 'OPTIONAL_VIDEO', criterion: 'MAJOR_REVEAL', justification: 'The marked cart is a compact physical clue reveal before inspection dialogue.' },
  spider_nest_reveal: { classification: 'COMBAT_OWNED', criterion: 'SPECTACLE', justification: 'Creature reveal belongs to the tactical-combat setup.' },
  troll_crossing_reveal: { classification: 'COMBAT_OWNED', criterion: 'IMPORTANT_ENTRANCE', justification: 'Blocking creature entrance belongs to the tactical-combat setup.' },
  serpent_duelist_reveal: { classification: 'COMBAT_OWNED', criterion: 'IMPORTANT_ENTRANCE', justification: 'Duelist entrance belongs to the tactical-combat setup.' },
  young_dragon_encounter: { classification: 'OPTIONAL_VIDEO', criterion: 'MAJOR_REVEAL', justification: 'The living dragon and nest are an important reveal before the choice tableau.' },
  serpent_informant_encounter: { classification: 'CONVERT_TO_STATIC_TABLEAU', criterion: 'TALKING', justification: 'The informant beat is interrogation and protection/betrayal dialogue.' },
  'qa-placeholder': { classification: 'LEGACY_UNUSED', criterion: 'LEGACY', justification: 'Manifest-only QA placeholder with no production video source.' },
});

export function resolveCinematicReduction(cinematicId: string): Readonly<CinematicReductionDecision> | undefined {
  return CINEMATIC_REDUCTION_POLICY[cinematicId];
}

export function shouldPlayDialoguePreludeVideo(cinematicId: string): boolean {
  const classification = resolveCinematicReduction(cinematicId)?.classification;
  return classification === 'KEEP_MAJOR_VIDEO' || classification === 'OPTIONAL_VIDEO' || classification === 'COMBAT_OWNED';
}
