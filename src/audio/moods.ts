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

export const sceneMood = (dialogueId: string | null | undefined): NarrativeMood => (dialogueId ? SCENE_MOODS[dialogueId] : undefined) ?? 'refuge';
