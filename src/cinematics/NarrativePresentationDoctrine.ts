import { z } from 'zod';
import type { PlayerFacingSurfaceMode } from './NarrativePresentationMode';

/**
 * Narrative Presentation Doctrine - Phase 4C-GLM.3
 *
 * This is the planning-layer contract that complements (not replaces) the
 * existing runtime `ResolvedPresentationBeat`. The runtime beat owns the
 * actual presentation mode, asset, cast and fallback. This contract owns the
 * doctrine decisions: which beats are main events, which require cinematics,
 * what tier those cinematics are, where they are placed, and how combat
 * outcomes relate to each beat.
 *
 * Authoritative doctrine document:
 *   docs/art-direction/option-c/narrative-presentation-doctrine.md
 *
 * Invariants enforced here mirror the doctrine document and are validated
 * by `validateNarrativePresentationDoctrine` below.
 */

// ---------------------------------------------------------------------------
// Section 1 - Presentation mode vocabulary (reuses existing runtime modes)
// ---------------------------------------------------------------------------

/**
 * The primary interactive mode of a beat. This is the surface that carries
 * normal interactive dialogue and choices. CINEMATIC_VIDEO is intentionally
 * excluded - video may precede or follow interaction, never host it.
 */
export const PRIMARY_INTERACTIVE_MODES = Object.freeze([
  'STATIC_TABLEAU',
  'TRAVEL_STILL',
  'NONE',
] as const);
export type PrimaryInteractiveMode = typeof PRIMARY_INTERACTIVE_MODES[number];

export const primaryInteractiveModeSchema = z.enum(PRIMARY_INTERACTIVE_MODES);

// ---------------------------------------------------------------------------
// Section 2 - Cinematic requirement / tier / placement
// ---------------------------------------------------------------------------

export const CINEMATIC_REQUIREMENTS = Object.freeze([
  'NONE',
  'OPTIONAL',
  'REQUIRED',
] as const);
export type CinematicRequirement = typeof CINEMATIC_REQUIREMENTS[number];
export const cinematicRequirementSchema = z.enum(CINEMATIC_REQUIREMENTS);

/**
 * QUICK is a production classification of CINEMATIC_VIDEO, not an independent
 * runtime dialogue surface. MAJOR is reserved for the strongest narrative
 * moments. TBD is a valid state - exact tier may remain undecided until
 * artistic production.
 */
export const CINEMATIC_TIERS = Object.freeze([
  'NONE',
  'QUICK',
  'MAJOR',
  'TBD',
] as const);
export type CinematicTier = typeof CINEMATIC_TIERS[number];
export const cinematicTierSchema = z.enum(CINEMATIC_TIERS);

/**
 * Placement for most main-event cinematics is intentionally NOT decided in
 * this mission. TBD is a valid state.
 */
export const CINEMATIC_PLACEMENTS = Object.freeze([
  'TBD',
  'BEFORE',
  'AFTER',
  'BOTH',
] as const);
export type CinematicPlacement = typeof CINEMATIC_PLACEMENTS[number];
export const cinematicPlacementSchema = z.enum(CINEMATIC_PLACEMENTS);

// ---------------------------------------------------------------------------
// Section 3 - Combat outcome
// ---------------------------------------------------------------------------

/**
 * Replaces simplistic combat-owned YES/NO thinking.
 * - NONE: no combat results from this beat
 * - CONDITIONAL: combat may result from dialogue choice, contest, route state, etc.
 * - REQUIRED: combat always occurs at this beat
 */
export const COMBAT_OUTCOMES = Object.freeze([
  'NONE',
  'CONDITIONAL',
  'REQUIRED',
] as const);
export type CombatOutcome = typeof COMBAT_OUTCOMES[number];
export const combatOutcomeSchema = z.enum(COMBAT_OUTCOMES);

// ---------------------------------------------------------------------------
// Section 4 - NarrativePresentationDefinition contract
// ---------------------------------------------------------------------------

export const narrativePresentationDefinitionSchema = z.object({
  beatId: z.string().min(1),
  primaryInteractiveMode: primaryInteractiveModeSchema,
  mainEvent: z.boolean(),
  cinematicRequirement: cinematicRequirementSchema,
  cinematicTier: cinematicTierSchema,
  cinematicPlacement: cinematicPlacementSchema,
  combatOutcome: combatOutcomeSchema,
  combatTrigger: z.string().optional(),
  notes: z.string().optional(),
});

export type NarrativePresentationDefinition = z.infer<
  typeof narrativePresentationDefinitionSchema
>;

// ---------------------------------------------------------------------------
// Section 5 - Doctrine registry
// ---------------------------------------------------------------------------

/**
 * The canonical doctrine registry. Each entry references a `beatId` from the
 * existing `FINAL_PRESENTATION_BEATS` registry and adds the doctrine fields.
 *
 * This registry is the single source of truth for the demo presentation
 * matrix. It is machine-readable and validated by
 * `validateNarrativePresentationDoctrine`.
 */
export const NARRATIVE_PRESENTATION_DOCTRINE: readonly NarrativePresentationDefinition[] = Object.freeze([
  // --- Prologue / opening ---
  { beatId: 'media:camp_departure', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Prologue opening - company leaves the fallen camp.' },
  { beatId: 'dialogue:acte_ouverture', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Opening camp dialogue.' },
  { beatId: 'dialogue:camp_departure', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Camp departure dialogue.' },

  // --- Alaric audience ---
  { beatId: 'media:alaric_audience_arrival', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Major court entrance and Audience ceremony.' },
  { beatId: 'dialogue:lion_briefing', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Alaric briefing - mission choice. Main event dialogue.' },

  // --- Forest road / opening ambush ---
  { beatId: 'media:forest_journey_tension', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Atmospheric forest tension before opening combat.' },
  { beatId: 'combat:forest_ambush', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'forest_ambush', notes: 'Opening ambush combat node.' },
  { beatId: 'combat:wolf_pack', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'wolf_pack', notes: 'Wolf pack combat node.' },
  { beatId: 'dialogue:post_opening_trail', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post-opening-ambush dialogue.' },

  // --- Cedric recruitment ---
  { beatId: 'media:cedric_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Cedric encounter reveal before recruitment dialogue. Placement TBD - not explicitly locked by approved decision.' },
  { beatId: 'dialogue:mystery_recruit', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Cedric recruitment - character moment with choice.' },

  // --- Refugees ---
  { beatId: 'media:refugees_approach', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Refugee arrival reveal.' },
  { beatId: 'dialogue:refugee_trial', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Refugee moral choice - major story moment.' },

  // --- First trial (event/combat branch) ---
  { beatId: 'dialogue:mystery_help', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Injured merchant - aid decision.' },
  { beatId: 'media:injured_merchant_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Injured merchant reveal.' },
  { beatId: 'dialogue:mystery_treasure', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Abandoned cart - inspection dialogue.' },
  { beatId: 'media:abandoned_cart_reveal', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Abandoned cart reveal.' },
  { beatId: 'combat:forest_patrol', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'forest_patrol', notes: 'Forest patrol combat node.' },
  { beatId: 'combat:spider_nest', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'spider_nest', notes: 'Spider nest combat node.' },
  { beatId: 'media:spider_nest_reveal', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Spider nest reveal - combat-owned.' },
  { beatId: 'dialogue:post_spider_nest', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post spider nest dialogue.' },
  { beatId: 'combat:serpent_reprisals', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'serpent_reprisals', notes: 'Serpent reprisals - triggered by dialogue startCombat effect.' },
  { beatId: 'dialogue:post_serpent_reprisals', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post serpent reprisals dialogue.' },
  { beatId: 'dialogue:post_serpent_patrol', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post serpent patrol dialogue.' },

  // --- First refuge ---
  { beatId: 'media:first_refuge_arrival', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'First refuge arrival.' },
  { beatId: 'media:first_refuge_departure', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to travel still.' },
  { beatId: 'dialogue:forest_refuge', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'First refuge management dialogue.' },

  // --- Valmir road ---
  { beatId: 'media:valmir_route_fork', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to travel still.' },
  { beatId: 'combat:marsh_crossing', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'marsh_crossing', notes: 'Marsh crossing combat node.' },
  { beatId: 'combat:road_to_valmir', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'road_to_valmir', notes: 'Road to Valmir combat node.' },

  // --- Bois-Clair siege (major world event) ---
  { beatId: 'media:bois_clair_arrival', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Bois-Clair burning - major world-state reveal.' },
  { beatId: 'dialogue:village_choice', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'village_defense|village_raid', notes: 'Bois-Clair siege choice - leads to conditional combat.' },
  { beatId: 'combat:village_defense', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'village_defense', notes: 'Village defense - triggered by village_choice.' },
  { beatId: 'combat:village_raid', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'village_raid', notes: 'Village raid - triggered by village_choice.' },
  { beatId: 'media:bois_clair_saved', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Bois-Clair saved - major rescue outcome.' },
  { beatId: 'media:bois_clair_sacrificed', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Bois-Clair sacrificed - major failure outcome.' },

  // --- Second trial combat ---
  { beatId: 'combat:serpent_checkpoint', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'serpent_checkpoint', notes: 'Serpent checkpoint combat node.' },
  { beatId: 'dialogue:post_serpent_checkpoint', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post serpent checkpoint dialogue.' },
  { beatId: 'combat:serpent_duelist_trial', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'serpent_duelist_trial', notes: 'Serpent duelist - triggered by dialogue choice.' },
  { beatId: 'media:serpent_duelist_reveal', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Serpent duelist reveal - combat-owned.' },
  { beatId: 'dialogue:post_serpent_duelist_trial', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post serpent duelist dialogue.' },
  { beatId: 'combat:troll_crossing', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'troll_crossing', notes: 'Troll crossing - triggered by dialogue choice.' },
  { beatId: 'media:troll_crossing_reveal', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Troll crossing reveal - combat-owned.' },
  { beatId: 'dialogue:mystery_troll_crossing', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'troll_crossing', notes: 'Troll crossing dialogue with combat choice.' },

  // --- Garen recruitment ---
  { beatId: 'media:garen_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Garen encounter reveal before recruitment dialogue. Placement TBD - not explicitly locked by approved decision.' },
  { beatId: 'dialogue:mystery_lancer_recruit', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Garen recruitment - character moment with contest.' },

  // --- Final trial ---
  { beatId: 'dialogue:mystery_shrine', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Shrine choice dialogue.' },
  { beatId: 'media:shrine_reveal_context', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Shrine reveal context.' },
  { beatId: 'dialogue:old_shrine_event', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Old shrine event dialogue.' },
  { beatId: 'dialogue:mystery_dragon_roost', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'young_dragon_roost', notes: 'Dragon roost dialogue with combat choice.' },
  { beatId: 'media:young_dragon_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'OPTIONAL', cinematicTier: 'QUICK', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Young dragon encounter reveal.' },
  { beatId: 'combat:young_dragon_roost', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'young_dragon_roost', notes: 'Young dragon roost - triggered by dialogue choice.' },
  { beatId: 'combat:ruins_guardians', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'REQUIRED', combatTrigger: 'ruins_guardians', notes: 'Ruins guardians combat node.' },
  { beatId: 'dialogue:post_ruins_guardians', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post ruins guardians dialogue.' },
  { beatId: 'combat:serpent_hunters', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'CONDITIONAL', combatTrigger: 'serpent_hunters', notes: 'Serpent hunters - triggered by dialogue choice.' },
  { beatId: 'dialogue:post_serpent_hunters', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Post serpent hunters dialogue.' },

  // --- Shadow signs / witnesses ---
  { beatId: 'media:shadow_signs', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to static tableau.' },
  { beatId: 'media:witnesses_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to static tableau.' },
  { beatId: 'media:ruins_approach_context', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to hold still.' },
  { beatId: 'media:final_refuge_dossier', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to static tableau.' },

  // --- Final refuge ---
  { beatId: 'dialogue:final_refuge', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Final refuge dossier - major pre-finale discussion.' },

  // --- Finale / judgement ---
  { beatId: 'media:lion_judgement', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'BEFORE', combatOutcome: 'NONE', notes: 'Lion judgement - major climax video.' },
  { beatId: 'dialogue:lion_finale_judgement', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Lion finale judgement dialogue with choice.' },
  { beatId: 'media:serpent_general_reveal', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'BEFORE', combatOutcome: 'NONE', notes: 'Serpent general reveal - combat-owned boss entrance.' },
  { beatId: 'media:lion_champion_reveal', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'BEFORE', combatOutcome: 'NONE', notes: 'Lion champion reveal - combat-owned boss entrance.' },
  { beatId: 'combat:serpent_captain', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'BEFORE', combatOutcome: 'REQUIRED', combatTrigger: 'serpent_captain', notes: 'Serpent Pursuit boss combat. Cinematic layer is the serpent_general_reveal video played BEFORE combat.' },
  { beatId: 'combat:lion_chief', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'BEFORE', combatOutcome: 'REQUIRED', combatTrigger: 'lion_chief', notes: 'Lion Trial boss combat. Cinematic layer is the lion_champion_reveal video played BEFORE combat.' },

  // --- Route endings (major) ---
  { beatId: 'media:serpent_route_ending', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Serpent route climax and ending-state spectacle.' },
  { beatId: 'media:lion_trial_route_ending', primaryInteractiveMode: 'NONE', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'MAJOR', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Lion Trial route climax and recognition ceremony.' },
  { beatId: 'dialogue:lion_trial_aftermath', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Lion trial aftermath dialogue.' },
  { beatId: 'dialogue:serpent_general_aftermath', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Serpent general aftermath dialogue.' },

  // --- Epilogue ---
  { beatId: 'dialogue:epilogue', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: true, cinematicRequirement: 'REQUIRED', cinematicTier: 'TBD', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Epilogue - Sage Seraphine closing. Cinematic required.' },

  // --- ATE (adversarial tale events) ---
  { beatId: 'dialogue:ate_alaric_reports', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_bois_clair_night_watch', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_first_refuge_watch', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_lion_council_doubt', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_maelor_seal_analysis', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_ruins_awaken', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_serpent_general_warning', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_serpent_retreat_order', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_serpent_scout_report', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },
  { beatId: 'dialogue:ate_village_fear', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'ATE.' },

  // --- Reputation events ---
  { beatId: 'dialogue:rep_event_bois_clair_denunciation', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_brokered_information', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_displaced_family_demand', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_fallen_banner_claimant', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_public_petition', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_refuge_supply_offer', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_roadside_intimidation', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_serpent_rumour_market', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },
  { beatId: 'dialogue:rep_event_village_memorial_request', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Reputation event.' },

  // --- Travel boundaries (edges) ---
  { beatId: 'edge:lion-camp>lion-audience', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-audience>lion-opening-ambush', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-opening-ambush>lion-nomad-crossroads', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-nomad-crossroads>lion-refugees', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-refugees>lion-first-trial-event', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Route decision boundary - hold.' },
  { beatId: 'edge:lion-refugees>lion-first-trial-combat', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Route decision boundary - hold.' },
  { beatId: 'edge:lion-first-trial-event>lion-first-refuge', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-first-trial-combat>lion-first-refuge', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-first-refuge>lion-reserve-trail', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },
  { beatId: 'edge:lion-reserve-trail>lion-valmir-road', primaryInteractiveMode: 'TRAVEL_STILL', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Travel boundary.' },

  // --- Remaining media beats ---
  { beatId: 'media:serpent_road_tension', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Combat-owned enemy reveal.' },
  { beatId: 'media:second_refuge_departure', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to travel still.' },
  { beatId: 'media:serpent_informant_encounter', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Converted to static tableau.' },
  { beatId: 'media:qa-placeholder', primaryInteractiveMode: 'NONE', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Legacy unused.' },

  // --- Remaining dialogue beats ---
  { beatId: 'dialogue:mystery_ambush', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Legacy compatibility dialogue.' },
  { beatId: 'dialogue:mystery_troll_crossing_legacy', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Legacy compatibility dialogue.' },
  { beatId: 'dialogue:serpent_duelist_trial_legacy', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Legacy compatibility dialogue.' },
  { beatId: 'dialogue:witnesses_on_road', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Witnesses on road dialogue.' },
  { beatId: 'dialogue:shadow_signs', primaryInteractiveMode: 'STATIC_TABLEAU', mainEvent: false, cinematicRequirement: 'NONE', cinematicTier: 'NONE', cinematicPlacement: 'TBD', combatOutcome: 'NONE', notes: 'Shadow signs dialogue.' },
]);

// ---------------------------------------------------------------------------
// Section 6 - Validation rules
// ---------------------------------------------------------------------------

export interface DoctrineValidationResult {
  valid: boolean;
  errors: readonly string[];
}

/**
 * Validate the doctrine registry against all doctrine invariants.
 *
 * Rules:
 * 1. MAIN_EVENT â†’ cinematicRequirement must not be NONE
 * 2. PROLOGUE â†’ cinematicRequirement = REQUIRED
 * 3. EPILOGUE â†’ cinematicRequirement = REQUIRED
 * 4. STATIC_TABLEAU â†’ dialogue allowed (no restriction)
 * 5. CINEMATIC_VIDEO â†’ normal dialogue forbidden (enforced by runtime, not here)
 * 6. CINEMATIC_HOLD â†’ dialogue forbidden, choices forbidden (enforced by runtime)
 * 7. COMBAT_OUTCOME = CONDITIONAL â†’ must not imply combat always occurs
 * 8. TBD cinematic placement â†’ valid state
 * 9. QUICK â†’ treated as CINEMATIC_VIDEO production subtype, not independent surface
 * 10. primaryInteractiveMode must never be CINEMATIC_VIDEO
 */
export function validateNarrativePresentationDoctrine(
  definitions: readonly NarrativePresentationDefinition[] = NARRATIVE_PRESENTATION_DOCTRINE,
): DoctrineValidationResult {
  const errors: string[] = [];

  for (const def of definitions) {
    const id = def.beatId;

    // Rule 1: MAIN_EVENT â†’ cinematicRequirement MUST equal REQUIRED (strictly enforced)
    // OPTIONAL is NOT valid for MAIN_EVENT.
    if (def.mainEvent && def.cinematicRequirement !== 'REQUIRED') {
      errors.push(`${id}: MAIN_EVENT requires cinematicRequirement = REQUIRED (got ${def.cinematicRequirement})`);
    }

    // Rule 2: PROLOGUE â†’ cinematicRequirement = REQUIRED
    if (id.includes('camp_departure') && id.startsWith('media:') && def.cinematicRequirement !== 'REQUIRED') {
      errors.push(`${id}: PROLOGUE requires cinematicRequirement = REQUIRED`);
    }

    // Rule 3: EPILOGUE â†’ cinematicRequirement = REQUIRED
    if (id === 'dialogue:epilogue' && def.cinematicRequirement !== 'REQUIRED') {
      errors.push(`${id}: EPILOGUE requires cinematicRequirement = REQUIRED`);
    }

    // Rule 7: COMBAT_OUTCOME = CONDITIONAL is valid, no additional constraint
    // (CONDITIONAL means combat MAY result, not that it always does)

    // Rule 10: primaryInteractiveMode must never be CINEMATIC_VIDEO
    // (enforced by the type system - CINEMATIC_VIDEO is not in PRIMARY_INTERACTIVE_MODES)
  }

  // Check for duplicate beatIds
  const seen = new Set<string>();
  for (const def of definitions) {
    if (seen.has(def.beatId)) {
      errors.push(`${def.beatId}: duplicate doctrine definition`);
    }
    seen.add(def.beatId);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the doctrine definition for a specific beat.
 */
export function getNarrativePresentationDefinition(
  beatId: string,
  definitions: readonly NarrativePresentationDefinition[] = NARRATIVE_PRESENTATION_DOCTRINE,
): NarrativePresentationDefinition | undefined {
  return definitions.find((def) => def.beatId === beatId);
}

/**
 * Get all beats marked as main events.
 */
export function getMainEventBeats(
  definitions: readonly NarrativePresentationDefinition[] = NARRATIVE_PRESENTATION_DOCTRINE,
): readonly NarrativePresentationDefinition[] {
  return definitions.filter((def) => def.mainEvent);
}

/**
 * Get all beats with a cinematic requirement (OPTIONAL or REQUIRED).
 */
export function getCinematicRequiredBeats(
  definitions: readonly NarrativePresentationDefinition[] = NARRATIVE_PRESENTATION_DOCTRINE,
): readonly NarrativePresentationDefinition[] {
  return definitions.filter((def) => def.cinematicRequirement === 'REQUIRED');
}

/**
 * Get all beats with conditional combat outcomes.
 */
export function getConditionalCombatBeats(
  definitions: readonly NarrativePresentationDefinition[] = NARRATIVE_PRESENTATION_DOCTRINE,
): readonly NarrativePresentationDefinition[] {
  return definitions.filter((def) => def.combatOutcome === 'CONDITIONAL');
}

/**
 * Absolute interaction invariants. These are enforced by the runtime
 * presentation system (RuntimePresentationStepCensus, NarrativeStagingAudit)
 * and are restated here as doctrine constants for reference.
 */
export const DOCTRINE_INVARIANTS = Object.freeze({
  DIALOGUE_STEPS_ON_VIDEO: 0,
  DIALOGUE_STEPS_ON_HOLD: 0,
  CHOICE_STEPS_ON_HOLD: 0,
});

