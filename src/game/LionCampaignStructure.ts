export type LionCampaignNodeRole =
  | 'MAJOR_LOCATION'
  | 'REFUGE'
  | 'ROUTE_ENCOUNTER'
  | 'ROUTE_COMBAT'
  | 'MAJOR_REVELATION'
  | 'FINAL_LOCATION';

export type LionCampaignSpatialRole = 'LOCATION_ANCHOR' | 'ROUTE_INTERRUPT';

export type LionCampaignEntryPolicy =
  | 'LOCATION_ARRIVAL'
  | 'TRAVERSAL_INTERRUPT'
  | 'DIRECT_CONTINUATION'
  | 'CINEMATIC_ENTRY';

export type LionCampaignExitPolicy =
  | 'START_TRAVERSAL'
  | 'RESUME_TRAVERSAL'
  | 'ROUTE_FORK'
  | 'LOCATION_CONTINUATION'
  | 'END_CAMPAIGN';

export type LionCampaignContentAuthority = 'DIALOGUE' | 'COMBAT' | 'NONE';

export interface LionCampaignNodeDefinition {
  readonly id: string;
  readonly role: LionCampaignNodeRole;
  readonly spatialRole: LionCampaignSpatialRole;
  readonly contentAuthority: LionCampaignContentAuthority;
  /**
   * Allowed runtime content IDs. RunSystem remains authoritative for selecting
   * seeded/adaptive variants; this list only constrains what may legally resolve.
   */
  readonly allowedContentIds: readonly string[];
  readonly environmentContextId: string;
  readonly expectedEnvironmentFamily: string;
  readonly cast: {
    readonly required: readonly string[];
    readonly optional: readonly string[];
  };
  /** Non-character narrative entities rendered by presentation logic, not Character System V2. */
  readonly presentationEntities?: readonly string[];
  readonly entryPolicy: LionCampaignEntryPolicy;
  readonly exitPolicy: LionCampaignExitPolicy;
  readonly expectedNextNodeIds: readonly string[];
}

function node(
  definition: Omit<LionCampaignNodeDefinition, 'environmentContextId'>,
): LionCampaignNodeDefinition {
  return Object.freeze({
    ...definition,
    environmentContextId: `node:${definition.id}`,
    allowedContentIds: Object.freeze([...definition.allowedContentIds]),
    cast: Object.freeze({
      required: Object.freeze([...definition.cast.required]),
      optional: Object.freeze([...definition.cast.optional]),
    }),
    presentationEntities: definition.presentationEntities
      ? Object.freeze([...definition.presentationEntities])
      : undefined,
    expectedNextNodeIds: Object.freeze([...definition.expectedNextNodeIds]),
  });
}

/**
 * High-level campaign contract only.
 *
 * This registry owns node identity, campaign/spatial role, legal content,
 * cast identities, environment context, topology expectation and entry/exit
 * contracts. It deliberately does NOT own asset paths, dialogue bodies,
 * combat composition, branch selection, or future Traversal T0-T4 relations.
 */
export const LION_CAMPAIGN_STRUCTURE: readonly LionCampaignNodeDefinition[] = Object.freeze([
  node({
    id: 'lion-camp',
    role: 'MAJOR_LOCATION',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['camp_departure'],
    expectedEnvironmentFamily: 'LION_CAMP',
    cast: {
      required: ['maelor', 'alistair', 'marian', 'sage_seraphine', 'kestrel'],
      optional: [],
    },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-audience'],
  }),
  node({
    id: 'lion-audience',
    role: 'MAJOR_LOCATION',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['lion_briefing'],
    expectedEnvironmentFamily: 'ALARIC_AUDIENCE',
    cast: {
      required: ['alaric', 'alistair', 'sage_seraphine', 'maelor'],
      optional: [],
    },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-opening-ambush'],
  }),
  node({
    id: 'lion-opening-ambush',
    role: 'ROUTE_COMBAT',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'COMBAT',
    allowedContentIds: ['forest_ambush', 'wolf_pack'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: { required: [], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-nomad-crossroads'],
  }),
  node({
    id: 'lion-nomad-crossroads',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['mystery_recruit'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: { required: ['kestrel', 'cedric'], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-refugees'],
  }),
  node({
    id: 'lion-refugees',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['refugee_trial'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: {
      required: ['kestrel', 'marian', 'refugee_mother', 'alistair', 'maelor'],
      optional: ['cedric'],
    },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'ROUTE_FORK',
    expectedNextNodeIds: ['lion-first-trial-event', 'lion-first-trial-combat'],
  }),
  node({
    id: 'lion-first-trial-event',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['mystery_help', 'mystery_treasure'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: {
      required: [],
      optional: ['survivor', 'maelor', 'sage_seraphine'],
    },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-first-refuge'],
  }),
  node({
    id: 'lion-first-trial-combat',
    role: 'ROUTE_COMBAT',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'COMBAT',
    allowedContentIds: ['spider_nest', 'forest_patrol', 'serpent_reprisals'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: { required: [], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-first-refuge'],
  }),
  node({
    id: 'lion-first-refuge',
    role: 'REFUGE',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'NONE',
    allowedContentIds: ['forest_refuge'],
    expectedEnvironmentFamily: 'FIRST_REFUGE',
    cast: { required: [], optional: ['cedric'] },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-reserve-trail'],
  }),
  node({
    id: 'lion-reserve-trail',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['reserve_trail'],
    expectedEnvironmentFamily: 'VALMIR_ROAD',
    cast: {
      required: ['kestrel', 'alistair', 'maelor', 'sage_seraphine'],
      optional: ['cedric'],
    },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-valmir-road'],
  }),
  node({
    id: 'lion-valmir-road',
    role: 'ROUTE_COMBAT',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'COMBAT',
    allowedContentIds: ['road_to_valmir', 'marsh_crossing'],
    expectedEnvironmentFamily: 'VALMIR_ROAD',
    cast: { required: [], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'ROUTE_FORK',
    expectedNextNodeIds: ['lion-second-trial-event', 'lion-second-trial-combat'],
  }),
  node({
    id: 'lion-second-trial-event',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['old_shrine_event'],
    expectedEnvironmentFamily: 'VALMIR_ROAD',
    cast: { required: ['sage_seraphine', 'maelor'], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-village-choice'],
  }),
  node({
    id: 'lion-second-trial-combat',
    role: 'ROUTE_COMBAT',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'COMBAT',
    allowedContentIds: ['troll_crossing', 'serpent_checkpoint', 'serpent_duelist_trial'],
    expectedEnvironmentFamily: 'FOREST_ROAD',
    cast: { required: [], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-village-choice'],
  }),
  node({
    id: 'lion-village-choice',
    role: 'MAJOR_LOCATION',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['village_choice'],
    expectedEnvironmentFamily: 'BOIS_CLAIR',
    cast: {
      required: ['villageoise', 'marian', 'serpent_raider', 'kestrel', 'sage_seraphine', 'maelor', 'alistair'],
      optional: ['cedric'],
    },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-second-refuge'],
  }),
  node({
    id: 'lion-second-refuge',
    role: 'REFUGE',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'NONE',
    allowedContentIds: ['forest_refuge'],
    expectedEnvironmentFamily: 'SECOND_REFUGE',
    cast: { required: [], optional: ['cedric'] },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-lancer-recruit'],
  }),
  node({
    id: 'lion-lancer-recruit',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['mystery_lancer_recruit'],
    expectedEnvironmentFamily: 'WITNESS_ROAD',
    cast: { required: ['lancer'], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-witnesses'],
  }),
  node({
    id: 'lion-witnesses',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['witnesses_on_road'],
    expectedEnvironmentFamily: 'WITNESS_ROAD',
    cast: {
      required: ['kestrel', 'marian', 'survivor', 'alistair', 'maelor', 'sage_seraphine'],
      optional: [],
    },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'ROUTE_FORK',
    expectedNextNodeIds: ['lion-final-trial-event', 'lion-final-trial-combat'],
  }),
  node({
    id: 'lion-final-trial-event',
    role: 'ROUTE_ENCOUNTER',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['mystery_dragon_roost', 'serpent_informant', 'mystery_shrine'],
    expectedEnvironmentFamily: 'SHADOW_RUINS',
    cast: {
      required: ['sage_seraphine', 'maelor'],
      optional: ['young_dragon_elite', 'serpent_oracle'],
    },
    presentationEntities: ['shrine_apparition'],
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-shadow-signs'],
  }),
  node({
    id: 'lion-final-trial-combat',
    role: 'ROUTE_COMBAT',
    spatialRole: 'ROUTE_INTERRUPT',
    contentAuthority: 'COMBAT',
    allowedContentIds: ['ruins_guardians', 'serpent_hunters'],
    expectedEnvironmentFamily: 'SHADOW_RUINS',
    cast: { required: [], optional: [] },
    entryPolicy: 'TRAVERSAL_INTERRUPT',
    exitPolicy: 'RESUME_TRAVERSAL',
    expectedNextNodeIds: ['lion-shadow-signs'],
  }),
  node({
    id: 'lion-shadow-signs',
    role: 'MAJOR_REVELATION',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['shadow_signs'],
    expectedEnvironmentFamily: 'SHADOW_RUINS',
    cast: {
      required: ['sage_seraphine', 'elara', 'alistair', 'maelor'],
      optional: ['cedric', 'lancer'],
    },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-final-refuge'],
  }),
  node({
    id: 'lion-final-refuge',
    role: 'REFUGE',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['final_refuge'],
    expectedEnvironmentFamily: 'FINAL_REFUGE',
    cast: {
      required: ['maelor', 'sage_seraphine', 'marian', 'alistair'],
      optional: ['cedric', 'lancer'],
    },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'START_TRAVERSAL',
    expectedNextNodeIds: ['lion-final-judgement'],
  }),
  node({
    id: 'lion-final-judgement',
    role: 'FINAL_LOCATION',
    spatialRole: 'LOCATION_ANCHOR',
    contentAuthority: 'DIALOGUE',
    allowedContentIds: ['lion_finale_judgement'],
    expectedEnvironmentFamily: 'LION_JUDGEMENT',
    cast: { required: ['alaric'], optional: [] },
    entryPolicy: 'LOCATION_ARRIVAL',
    exitPolicy: 'END_CAMPAIGN',
    expectedNextNodeIds: [],
  }),
]);

export const LION_CAMPAIGN_NODES_BY_ID = new Map(
  LION_CAMPAIGN_STRUCTURE.map((definition) => [definition.id, definition] as const),
);

export function getLionCampaignNodeDefinition(
  nodeId: string,
): LionCampaignNodeDefinition | undefined {
  return LION_CAMPAIGN_NODES_BY_ID.get(nodeId);
}
