/**
 * Narrative moods (OD-2026-11-01-B): the authored scene chooses the music, from a presentation-side table keyed by its
 * existing id. The table is written once by reading the scenes and is never computed from route, choice, reputation,
 * resources or outcome. It adds no field to campaign content and changes no text, choice, stage or outcome. Every
 * authored scene is listed, so a new one has to be placed; a scene with no mood uses the refuge context.
 */
export type NarrativeMood = 'refuge' | 'tension' | 'drama';

const refuge: readonly string[] = [
  'roadside_peddler', 'first_refuge_gathering', 'post_opening_trail', 'post_spider_nest', 'post_troll_crossing', 'post_young_dragon_roost', 'ate_first_refuge_watch',
  'rep_event_refuge_supply_offer', 'rep_event_public_petition', 'camp_departure', 'mystery_help', 'mystery_treasure', 'mystery_shrine', 'old_shrine_event',
  'village_defense_aftermath', 'mystery_lancer_recruit', 'ate_maelor_seal_analysis', 'post_serpent_patrol', 'post_serpent_duelist_trial', 'post_serpent_reprisals',
  'post_serpent_hunters',
];

const tension: readonly string[] = [
  'pre_opening_trail', 'pre_valmir_road', 'pre_serpent_patrol', 'pre_spider_nest', 'pre_serpent_reprisals', 'pre_serpent_checkpoint', 'pre_ruins_guardians',
  'pre_witness_road_clash', 'pre_serpent_hunters', 'pre_village_defense', 'pre_village_raid', 'pre_serpent_duelist_trial', 'pre_troll_crossing', 'pre_young_dragon_roost', 'pre_lion_chief',
  'post_ruins_guardians', 'lion_briefing', 'reserve_trail', 'mystery_recruit', 'mystery_ambush', 'serpent_duelist_trial', 'mystery_troll_crossing', 'mystery_dragon_roost',
  'serpent_informant', 'shadow_signs', 'serpent_pursuit_pre_combat', 'final_refuge', 'ate_alaric_reports', 'ate_serpent_scout_report', 'ate_village_fear',
  'ate_serpent_general_warning', 'ate_lion_council_doubt', 'ate_ruins_awaken', 'ate_serpent_retreat_order', 'rep_event_serpent_rumour_market', 'rep_event_fallen_banner_claimant',
  'rep_event_roadside_intimidation', 'rep_event_brokered_information',
];

const drama: readonly string[] = [
  'acte_ouverture', 'post_valmir_road', 'post_serpent_checkpoint', 'post_witness_road_clash', 'refugee_trial', 'village_choice', 'village_raid_aftermath', 'witnesses_on_road',
  'ate_bois_clair_night_watch', 'rep_event_village_memorial_request', 'rep_event_displaced_family_demand', 'rep_event_bois_clair_denunciation',
  'lion_finale_judgement', 'serpent_general_aftermath', 'lion_trial_aftermath', 'epilogue',
];

export const SCENE_MOODS: Readonly<Record<string, NarrativeMood>> = Object.fromEntries([
  ...refuge.map((id) => [id, 'refuge']), ...tension.map((id) => [id, 'tension']), ...drama.map((id) => [id, 'drama']),
]);

/**
 * Set 1.20.0 ("Post-demo moments", "Music"): the mood of every post-demo dialogue, under the same rules. Each takes the
 * mood of its Lion counterpart, the approved Lion dialogue whose tableau its scene replaced (`environmentContext` in the
 * plateau's scene briefs), so a scene sounds like the Lion scene it was drawn from:
 * - the dialogues that follow a living tableau, or keep its backdrop, since 2026-11-13 (PLATEAU_MOMENTS_DRAFT_2026-11-13,
 *   question 5 A): the audiences as `lion_briefing`, the post-combat dialogues and epilogues as `serpent_general_aftermath`
 *   and `epilogue`, the betrayal as `shadow_signs`; the epilogues of fear and balance keep `epilogue`'s drama;
 * - every other one by OD-2026-11-13-F (P1): the pre-combat and pre-boss scenes, judgements, vigils, the breach and the
 *   end of the act take tension or drama, and the arrivals, gatherings and shrines whose counterpart is a refuge scene
 *   stay in the refuge context.
 * The lists were computed from the scene briefs, not by hand. A refuge dialogue is listed explicitly too, so every
 * post-demo dialogue has a decided mood and a new one has to be placed (moods.test.ts).
 */
const postDemoRefuge: readonly string[] = [
  'bear_ancient_relic', 'bear_arrival', 'bear_mountain_shrine', 'bear_outpost_gathering',
  'dragon_arrival', 'dragon_crystal_clues', 'dragon_hermitage_gathering',
  'scorpion_arrival', 'scorpion_buried_library', 'scorpion_oasis_gathering', 'scorpion_sacred_ashes', 'scorpion_sand_riddle', 'scorpion_warded_path',
  'finale_capital_arrival',
];

const postDemoTension: readonly string[] = [
  'bear_audience', 'bear_borin_pre_combat', 'bear_dark_vein', 'bear_master_spy_pre_combat', 'bear_mines_defense_aftermath',
  'bear_mines_seizure_aftermath', 'bear_ore_convoy', 'bear_pre_mines_defense', 'bear_pre_mines_seizure', 'bear_raven_camp', 'bear_raven_messenger',
  'bear_raven_traps', 'bear_sacred_mines', 'bear_vigil',
  'dragon_audience', 'dragon_captive_wolf', 'dragon_crystal_altar', 'dragon_kaelen_pre_combat', 'dragon_lair_assault_aftermath',
  'dragon_lair_seizure_aftermath', 'dragon_pre_lair_assault', 'dragon_pre_lair_seizure', 'dragon_shaman_pre_combat', 'dragon_shaman_traces',
  'dragon_vigil', 'dragon_wolf_envoy', 'dragon_wolf_lair', 'dragon_wolf_traps', 'dragon_young_dragon',
  'scorpion_audience', 'scorpion_corrupted_texts', 'scorpion_inquisitor_pre_combat', 'scorpion_phoenix_temple', 'scorpion_pre_temple_assault',
  'scorpion_pre_temple_seizure', 'scorpion_prophet_pre_combat', 'scorpion_prophet_traces', 'scorpion_scholars', 'scorpion_temple_assault_aftermath',
  'scorpion_temple_seizure_aftermath', 'scorpion_vigil',
  'finale_allied_rally', 'finale_arena_assault_aftermath', 'finale_arena_chaos', 'finale_arrival', 'finale_betrayal', 'finale_breach_confrontation',
  'finale_last_vigil', 'finale_phoenix_verdict', 'finale_pre_serpent_final', 'finale_raven_verdict', 'finale_wolf_verdict',
];

const postDemoDrama: readonly string[] = [
  'bear_epilogue', 'bear_judgement', 'bear_master_spy_aftermath', 'bear_miners_testimony', 'bear_trapped_miners', 'bear_trial_aftermath',
  'dragon_epilogue', 'dragon_freed_pilgrims', 'dragon_judgement', 'dragon_shaman_aftermath', 'dragon_terrorized_village', 'dragon_trial_aftermath',
  'scorpion_epilogue', 'scorpion_judgement', 'scorpion_phoenix_faithful', 'scorpion_prophet_aftermath', 'scorpion_temple_witnesses',
  'scorpion_trial_aftermath',
  'finale_act_end', 'finale_breach_aftermath', 'finale_epilogue_balance', 'finale_epilogue_fear', 'finale_epilogue_respect', 'finale_fear_close',
  'finale_trapped_citizens',
];

export const POST_DEMO_SCENE_MOODS: Readonly<Record<string, NarrativeMood>> = Object.freeze(Object.fromEntries([
  ...postDemoRefuge.map((id) => [id, 'refuge']), ...postDemoTension.map((id) => [id, 'tension']), ...postDemoDrama.map((id) => [id, 'drama']),
]));

export const sceneMood = (dialogueId: string | null | undefined): NarrativeMood =>
  (dialogueId ? SCENE_MOODS[dialogueId] ?? POST_DEMO_SCENE_MOODS[dialogueId] : undefined) ?? 'refuge';
