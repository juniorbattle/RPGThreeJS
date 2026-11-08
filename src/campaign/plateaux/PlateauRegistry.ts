/**
 * Set 1.20.0 (PRODUCTION-CONTRACTS-POST-DEMO-FRAMEWORK-1, OD-2026-11-07-I), post-demo Lot 0: the plateau registry.
 *
 * The campaign is four Seal plateaux in a fixed order (the Lion, the Bear, the Dragon, the Scorpion) and one final act.
 * Each entry states what the campaign owners need to know about a chapter: its durable ID prefix, its Seal, its host
 * and rival clans, its roadmap section, its authoring status and, once built, its campaign binding (canonical and
 * optional POIs, refuges, exclusive forks with their branch commitments, challenges, guardians and the predicate that
 * reads its outcome from saved facts).
 *
 * The Lion's binding points at the Lion's existing tables; it copies none of their values, so the Lion plays exactly as
 * before. The Bear, the Dragon, the Scorpion and the final act are reserved here only (order, prefix, clans, roadmap
 * section): they carry no content until their own lot builds them as playable drafts, which become canon only on the
 * operator's approval of each plateau.
 */
import type { CampaignChapterId, CampaignClanId, PlateauOutcome, SealPlateauId } from './campaignIds';
import { CAMPAIGN_CHAPTER_IDS } from './campaignIds';
import { LION_PLATEAU_BINDING } from './lionPlateau';
import { BEAR_PLATEAU_BINDING } from './bear/bearPlateau';
import type { PlateauTopology } from './PlateauTopology';

export { CAMPAIGN_CLAN_IDS, CAMPAIGN_CHAPTER_IDS } from './campaignIds';
export type { CampaignClanId, CampaignChapterId, SealPlateauId, PlateauOutcome } from './campaignIds';

export const CAMPAIGN_CLAN_LABELS: Readonly<Record<CampaignClanId, string>> = Object.freeze({
  lion: 'Clan du Lion',
  serpent: 'Clan du Serpent',
  bear: 'Clan de l’Ours',
  raven: 'Clan du Corbeau',
  dragon: 'Clan du Dragon',
  wolf: 'Clan du Loup',
  scorpion: 'Clan du Scorpion',
  phoenix: 'Clan du Phénix',
});

/**
 * `canon`: approved content (the Lion demo). `draft`: playable on the post-demo branch, identifiable as draft and not
 * canon until the operator approves the plateau. `planned`: reserved, no content yet.
 */
export type PlateauAuthoringStatus = 'canon' | 'draft' | 'planned';

/**
 * The share of the 0–100 reputation a chapter may move on a perfect run and on a consistent honour run. Built chapters
 * are measured from their content by the reputation bounds test; planned chapters hold this budget until they are
 * built, and their measured bounds must then fit it.
 */
export interface ReputationBudget {
  /** Highest total gain a perfect run can collect in the chapter. */
  perfectMax: number;
  /** Total gain of a consistent honour run under the least favourable drawn variants. */
  honourFloor: number;
}

export interface PlateauBranchCommitment {
  /** Travel-relation leg holding the exclusive fork. */
  legId: string;
  /** The POI whose resolution releases the commitment. */
  resolvingNodeId: string;
}

export interface PlateauOutcomeRelation {
  clan: CampaignClanId;
  stance: 'ally' | 'neutral' | 'enemy';
}

/** What RunSystem reads about a built chapter. Data only: no function here may import RunSystem. */
export interface PlateauCampaignBinding {
  regionId: string;
  runIdPrefix: string;
  canonicalNodeIds: readonly string[];
  optionalNodeIds: readonly string[];
  startNodeId: string;
  refugeNodeIds: readonly string[];
  finalRefugeNodeId: string;
  judgementNodeId: string;
  branchCommitments: readonly PlateauBranchCommitment[];
  /** Content IDs of the elite fights on the canonical route, shown as elite on the map. */
  eliteRouteContentIds: readonly string[];
  challengeCombatIds: readonly string[];
  guardianIds: readonly string[];
  /** Atlas identities of the chapter's map regions. */
  atlasIds: readonly string[];
  /** Reads the plateau outcome from saved facts; null while no outcome is recorded. */
  resolveOutcome: (flags: Readonly<Record<string, boolean>>) => PlateauOutcome | null;
  /**
   * The clan relations each outcome sets, exactly as the plateau's consequence map states them (a test holds the two
   * equal). A relation an authored choice of the same plateau already set is kept: the outcome never overrides it.
   */
  outcomeRelations: Readonly<Record<PlateauOutcome, readonly PlateauOutcomeRelation[]>>;
  /** The navigation topology RunSystem applies to the plateau's runs. */
  topology: PlateauTopology;
}

export interface PlateauChief {
  /** The chief's title, always usable. */
  title: string;
  /** The chief's name when a source gives one; null while the operator has not validated it (P5). */
  name: string | null;
}

export interface PlateauDefinition {
  id: CampaignChapterId;
  order: number;
  kind: 'seal_plateau' | 'final_act';
  /** Every new durable ID of this chapter starts with this prefix; no Lion ID changes. */
  idPrefix: string;
  label: string;
  /** Roadmap sections this chapter follows. */
  roadmapSections: readonly string[];
  status: PlateauAuthoringStatus;
  hostClan: CampaignClanId | null;
  rivalClan: CampaignClanId | null;
  chief: PlateauChief | null;
  reputationBudget: ReputationBudget;
  campaign: PlateauCampaignBinding | null;
}

/**
 * Reputation budgets approved in the Lot 0 package (OD-2026-11-08-A). The Lion's figures are its measured bounds under
 * the approved recalibration; the others are targets that their plateau must fit once built. The perfect maxima add up
 * to 70, the distance from the starting 30 to 100, so only a perfect run reaches 100, and only in the final act.
 */
export const REPUTATION_BUDGETS: Readonly<Record<CampaignChapterId, ReputationBudget>> = Object.freeze({
  // Measured from the Lion's content under the approved calibration (reputation bounds test).
  lion: Object.freeze({ perfectMax: 32, honourFloor: 27 }),
  // Targets: smaller amounts plateau after plateau (R2); a consistent honour run reaches 80 at the Dragon's end.
  bear: Object.freeze({ perfectMax: 16, honourFloor: 13 }),
  dragon: Object.freeze({ perfectMax: 12, honourFloor: 10 }),
  scorpion: Object.freeze({ perfectMax: 6, honourFloor: 4 }),
  // The last points of a perfect run come in the final act, so 100 is reached only at the end of the game.
  finale: Object.freeze({ perfectMax: 4, honourFloor: 3 }),
});

export const PLATEAU_REGISTRY: readonly PlateauDefinition[] = Object.freeze([
  Object.freeze({
    id: 'lion', order: 1, kind: 'seal_plateau', idPrefix: 'lion-', label: 'Les Plaines du Courage',
    roadmapSections: Object.freeze(['§3.1']), status: 'canon', hostClan: 'lion', rivalClan: 'serpent',
    chief: Object.freeze({ title: 'Vieux Lion', name: 'Alaric' }),
    reputationBudget: REPUTATION_BUDGETS.lion,
    campaign: LION_PLATEAU_BINDING,
  }),
  Object.freeze({
    id: 'bear', order: 2, kind: 'seal_plateau', idPrefix: 'bear-', label: 'Les Montagnes de la Résilience',
    // Lot 1: accepted as canon by the operator (OD-2026-11-08-B); its images stay provisional.
    roadmapSections: Object.freeze(['§3.2']), status: 'canon', hostClan: 'bear', rivalClan: 'raven',
    chief: Object.freeze({ title: 'Ancien Ours', name: 'Borin' }),
    reputationBudget: REPUTATION_BUDGETS.bear,
    campaign: BEAR_PLATEAU_BINDING,
  }),
  Object.freeze({
    id: 'dragon', order: 3, kind: 'seal_plateau', idPrefix: 'dragon-', label: 'Les Pics Célestes',
    roadmapSections: Object.freeze(['§3.3']), status: 'planned', hostClan: 'dragon', rivalClan: 'wolf',
    chief: Object.freeze({ title: 'Ancien Dragon', name: 'Kaelen' }),
    reputationBudget: REPUTATION_BUDGETS.dragon,
    campaign: null,
  }),
  Object.freeze({
    id: 'scorpion', order: 4, kind: 'seal_plateau', idPrefix: 'scorpion-', label: 'Les Déserts Arides',
    roadmapSections: Object.freeze(['§3.4']), status: 'planned', hostClan: 'scorpion', rivalClan: 'phoenix',
    // P5: the chief is renamed; until the operator validates a name, texts use his title only.
    chief: Object.freeze({ title: 'Grand Inquisiteur', name: null }),
    reputationBudget: REPUTATION_BUDGETS.scorpion,
    campaign: null,
  }),
  Object.freeze({
    id: 'finale', order: 5, kind: 'final_act', idPrefix: 'finale-', label: 'L’acte final',
    roadmapSections: Object.freeze(['§3.6', '§3.7']), status: 'planned', hostClan: null, rivalClan: null,
    chief: null,
    reputationBudget: REPUTATION_BUDGETS.finale,
    campaign: null,
  }),
] satisfies readonly PlateauDefinition[]);

export const SEAL_PLATEAU_IDS: readonly SealPlateauId[] = Object.freeze(
  PLATEAU_REGISTRY.filter((entry) => entry.kind === 'seal_plateau').map((entry) => entry.id as SealPlateauId),
);

export function getPlateau(id: CampaignChapterId): PlateauDefinition {
  const entry = PLATEAU_REGISTRY.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown campaign chapter '${id}'.`);
  return entry;
}

/** The chapter that owns a durable POI ID, by its prefix; undefined for an ID no chapter claims. */
export function plateauForNodeId(nodeId: string): PlateauDefinition | undefined {
  return PLATEAU_REGISTRY.find((entry) => nodeId.startsWith(entry.idPrefix));
}

/** The chapter that follows another in the fixed order, or null after the final act. */
export function nextChapterId(id: CampaignChapterId): CampaignChapterId | null {
  const index = CAMPAIGN_CHAPTER_IDS.indexOf(id);
  return CAMPAIGN_CHAPTER_IDS[index + 1] ?? null;
}

/** The campaign binding of a built chapter. Only the Lion is built in Lot 0. */
export function requirePlateauCampaign(id: CampaignChapterId): PlateauCampaignBinding {
  const binding = getPlateau(id).campaign;
  if (!binding) throw new Error(`Campaign chapter '${id}' is not built yet.`);
  return binding;
}

/**
 * The campaign binding of the plateau that owns a run, by its durable run ID prefix. Every run saved by the demo is a
 * Lion run, so an unclaimed ID keeps the Lion's binding rather than strand an old save.
 */
export function plateauCampaignForRun(run: { id: string }): PlateauCampaignBinding {
  return PLATEAU_REGISTRY.find((entry) => entry.campaign && run.id.startsWith(entry.campaign.runIdPrefix))?.campaign
    ?? requirePlateauCampaign('lion');
}

/** The chapter that owns a run, by the same rule as its binding: an unclaimed (demo) run ID is the Lion's. */
export function plateauIdForRun(run: { id: string }): CampaignChapterId {
  return PLATEAU_REGISTRY.find((entry) => entry.campaign && run.id.startsWith(entry.campaign.runIdPrefix))?.id ?? 'lion';
}

/** The navigation topology of the plateau that owns a run. */
export function topologyForRun(run: { id: string }): PlateauTopology {
  return plateauCampaignForRun(run).topology;
}
