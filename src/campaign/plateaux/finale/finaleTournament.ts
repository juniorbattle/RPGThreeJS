/**
 * Set 1.20.0 (TRAVERSAL "Post-demo surfaces", CAMPAIGN_AND_STATE "Final act"), post-demo Lot 4 — canon since the
 * operator accepted the final act (OD-2026-11-09-A).
 *
 * The Tournament of the Great (roadmap §3.6): ordered arena fights presented on an encounter board, then the final
 * against the Serpent's champion, Maelor's betrayal and the breach, and the escape from the arena. The board is not a
 * POI map and not a second navigation mode: RunSystem owns its order and progression and reads it from saved facts
 * (each fight's victory, then its verdict or the scene that follows it). The opponents are the clans the company met as
 * rivals and whose lands it never crossed (the roadmap names the Wolf and the Raven as examples), in the order the
 * company met them, then the Serpent, always the finalist (F2). Data only: nothing here imports RunSystem.
 */
import type { CampaignClanId } from '../campaignIds';

export interface TournamentEntry {
  /** Stable board identity; also the place where its choice and echoes are anchored in the consequence map. */
  readonly nodeId: string;
  readonly label: string;
  /** The clan the fight opposes, if any. */
  readonly clan: CampaignClanId | null;
  readonly kind: 'bout' | 'final' | 'chaos';
  /** The scene that opens the entry before its fight, when the entry starts with a choice (the chaos). */
  readonly openingDialogueId?: string;
  readonly combatId: string;
  /** The fact the fight's victory records. */
  readonly victoryFlag: string;
  /** The scene that follows the victory and the facts one of which it records (a verdict, the breach). */
  readonly afterDialogueId?: string;
  readonly afterFlags?: readonly string[];
}

export const FINALE_TOURNAMENT: readonly TournamentEntry[] = Object.freeze([
  { nodeId: 'finale-bout-raven', label: 'Champion du Corbeau', clan: 'raven', kind: 'bout', combatId: 'finale_raven_bout',
    victoryFlag: 'finaleRavenBoutWon', afterDialogueId: 'finale_raven_verdict', afterFlags: Object.freeze(['finaleRavenSpared', 'finaleRavenHumiliated']) },
  { nodeId: 'finale-bout-wolf', label: 'Champion du Loup', clan: 'wolf', kind: 'bout', combatId: 'finale_wolf_bout',
    victoryFlag: 'finaleWolfBoutWon', afterDialogueId: 'finale_wolf_verdict', afterFlags: Object.freeze(['finaleWolfSpared', 'finaleWolfHumiliated']) },
  { nodeId: 'finale-bout-phoenix', label: 'Champion du Phénix', clan: 'phoenix', kind: 'bout', combatId: 'finale_phoenix_bout',
    victoryFlag: 'finalePhoenixBoutWon', afterDialogueId: 'finale_phoenix_verdict', afterFlags: Object.freeze(['finalePhoenixSpared', 'finalePhoenixHumiliated']) },
  { nodeId: 'finale-bout-serpent', label: 'Finale : champion du Serpent', clan: 'serpent', kind: 'final', combatId: 'finale_serpent_final',
    victoryFlag: 'finaleSerpentChampionFallen', afterDialogueId: 'finale_betrayal', afterFlags: Object.freeze(['finaleBreachOpened']) },
  { nodeId: 'finale-arena-chaos', label: 'La brèche s’ouvre', clan: null, kind: 'chaos', openingDialogueId: 'finale_arena_chaos',
    combatId: 'finale_arena_assault', victoryFlag: 'finaleArenaEscaped' },
] satisfies TournamentEntry[]);

/** The scene that opens the Tournament, before its first fight, and the fact it records. */
export const FINALE_TOURNAMENT_ARRIVAL = Object.freeze({ dialogueId: 'finale_arrival', flag: 'finaleTournamentEntered' });

export const FINALE_BOARD_NODE_IDS: readonly string[] = Object.freeze(FINALE_TOURNAMENT.map((entry) => entry.nodeId));
