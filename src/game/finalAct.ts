/**
 * Set 1.20.0 (CAMPAIGN_AND_STATE "Final act", COMBAT_AND_VFX "Clan supports"), post-demo Lot 4: RunSystem's authority
 * over the final act.
 *
 * RunSystem owns the Tournament board's order and progression, read from saved facts only: each fight's victory, then
 * the verdict or the scene that follows it. It derives, before each final-act fight, the supports of the allied clans
 * and the foes of the enemy clans from the saved clan relations; neither is saved. It closes the final act once the
 * breach is won. Presentation reads these functions and decides nothing.
 */
import { FINALE_TOURNAMENT, FINALE_TOURNAMENT_ARRIVAL, type TournamentEntry } from '../campaign/plateaux/finale/finaleTournament';
import {
  CLAN_FOES,
  CLAN_SUPPORTS,
  FINALE_CLAN_ORDER,
  FINALE_ENEMY_CLAN_RULES,
  FINALE_VICTORY_FACTS,
} from '../campaign/plateaux/finale/finaleCombat';
import { CAMPAIGN_CLAN_IDS, CAMPAIGN_CLAN_LABELS, type CampaignClanId } from '../campaign/plateaux/PlateauRegistry';
import { campaignProgressOf, completeCurrentChapter, getClanRelation, isClanMet } from './campaignRelations';
import type { CombatConfig, GameState } from './types';

export type TournamentEntryStatus = 'done' | 'next' | 'after' | 'locked';

export interface TournamentBoardEntry {
  nodeId: string;
  label: string;
  clan: CampaignClanId | null;
  kind: TournamentEntry['kind'];
  status: TournamentEntryStatus;
  /** The entry's result, stated in text (UI_AND_ACCESSIBILITY "Post-demo surfaces"). */
  result: string;
}

export interface TournamentBoard {
  /** True once the Tournament's opening scene has played. */
  entered: boolean;
  entries: TournamentBoardEntry[];
  complete: boolean;
}

const RESULTS: Readonly<Record<string, string>> = Object.freeze({
  finaleRavenSpared: 'Victoire · champion relevé', finaleRavenHumiliated: 'Victoire · champion humilié',
  finaleWolfSpared: 'Victoire · champion relevé', finaleWolfHumiliated: 'Victoire · champion humilié',
  finalePhoenixSpared: 'Victoire · champion relevé', finalePhoenixHumiliated: 'Victoire · champion humilié',
  finaleBreachOpened: 'Victoire · la brèche s’ouvre',
});

function entryDone(entry: TournamentEntry, flags: Readonly<Record<string, boolean>>): boolean {
  return Boolean(flags[entry.victoryFlag]) && (!entry.afterFlags || entry.afterFlags.some((flag) => flags[flag]));
}

/** The Tournament board, in order, with each entry's status and result. */
export function tournamentBoard(state: Pick<GameState, 'flags'>): TournamentBoard {
  const { flags } = state;
  let reachedNext = false;
  const entries = FINALE_TOURNAMENT.map((entry): TournamentBoardEntry => {
    let status: TournamentEntryStatus;
    let result: string;
    if (entryDone(entry, flags)) {
      status = 'done';
      const after = entry.afterFlags?.find((flag) => flags[flag]);
      result = after ? RESULTS[after] ?? 'Victoire' : entry.kind === 'chaos' ? 'Arène quittée' : 'Victoire';
    } else if (!reachedNext) {
      reachedNext = true;
      status = flags[entry.victoryFlag] ? 'after' : 'next';
      result = status === 'after' ? 'Victoire · le verdict attend' : 'À combattre';
    } else {
      status = 'locked';
      result = 'À venir';
    }
    return { nodeId: entry.nodeId, label: entry.label, clan: entry.clan, kind: entry.kind, status, result };
  });
  return { entered: Boolean(flags[FINALE_TOURNAMENT_ARRIVAL.flag]), entries, complete: entries.every((entry) => entry.status === 'done') };
}

export function isTournamentComplete(state: Pick<GameState, 'flags'>): boolean {
  return tournamentBoard(state).complete;
}

export interface TournamentStep {
  entry: TournamentEntry;
  /** `opening`: the entry's opening scene (and its fight); `fight`: the fight; `after`: the scene that follows a won fight. */
  action: 'opening' | 'fight' | 'after';
}

/** The board's next step, or null when the Tournament is over. RunSystem owns the order. */
export function nextTournamentStep(state: Pick<GameState, 'flags'>): TournamentStep | null {
  const entry = FINALE_TOURNAMENT.find((candidate) => !entryDone(candidate, state.flags));
  if (!entry) return null;
  if (state.flags[entry.victoryFlag]) return { entry, action: 'after' };
  return { entry, action: entry.openingDialogueId ? 'opening' : 'fight' };
}

/** The board entry a final-act fight belongs to, if any. */
export function tournamentEntryOfCombat(combatId: string): TournamentEntry | undefined {
  return FINALE_TOURNAMENT.find((entry) => entry.combatId === combatId);
}

export function isTournamentNodeId(nodeId: string): boolean {
  return FINALE_TOURNAMENT.some((entry) => entry.nodeId === nodeId);
}

/** The facts a won final-act fight records. */
export function finaleVictoryFacts(combatId: string): Readonly<Record<string, boolean>> {
  return FINALE_VICTORY_FACTS[combatId] ?? {};
}

function alliedClans(state: GameState): CampaignClanId[] {
  return CAMPAIGN_CLAN_IDS.filter((clan) => isClanMet(state, clan) && getClanRelation(state, clan) === 'ally');
}

function enemyClans(state: GameState): CampaignClanId[] {
  return FINALE_CLAN_ORDER.filter((clan) => isClanMet(state, clan) && getClanRelation(state, clan) === 'enemy');
}

/**
 * A final-act fight as RunSystem prepares it from the saved clan relations: every allied clan's support (but the support
 * of the clan the fight opposes), and the foes of the enemy clans its rule names, up to the formation's free places.
 * Any other fight is returned unchanged. Nothing here is saved.
 */
export function finalActCombatConfig(state: GameState, config: CombatConfig): CombatConfig {
  if (!config.id.startsWith('finale_')) return config;
  const opposed = tournamentEntryOfCombat(config.id)?.clan ?? null;
  const supports = alliedClans(state).filter((clan) => clan !== opposed).flatMap((clan) => {
    const support = CLAN_SUPPORTS[clan];
    return support ? [{ id: `support_${clan}`, clanLabel: CAMPAIGN_CLAN_LABELS[clan], label: support.label, skillId: support.skillId }] : [];
  });
  const rule = FINALE_ENEMY_CLAN_RULES[config.id] ?? 'all';
  const candidates = rule === 'none' ? [] : rule === 'all' ? enemyClans(state) : enemyClans(state).filter((clan) => rule.includes(clan));
  const foes = candidates.flatMap((clan) => CLAN_FOES[clan] ? [CLAN_FOES[clan]!] : []);
  const prepared: CombatConfig = { ...config, ...(supports.length ? { supports } : {}) };
  if (config.isBoss) {
    const free = Math.max(0, 3 - config.escortVisualIds.length);
    return { ...prepared, escortVisualIds: [...config.escortVisualIds, ...foes.slice(0, free)] };
  }
  const free = Math.max(0, 4 - config.enemyVisualIds.length);
  return { ...prepared, enemyVisualIds: [...config.enemyVisualIds, ...foes.slice(0, free)] };
}

/**
 * Closes the final act once the breach is won: the chapter completes and the chronicle ends there until the epilogues
 * exist (Lot 5). Once only; refuses a run that has not won the breach.
 */
export function completeFinalAct(state: GameState): boolean {
  const progress = campaignProgressOf(state);
  if (progress.currentChapterId !== 'finale' || progress.chapters.finale.status !== 'active') return false;
  if (!state.flags.finaleEntityDefeated || state.run.status !== 'completed') return false;
  completeCurrentChapter(state);
  state.endingId = 'finale-breach';
  return true;
}
