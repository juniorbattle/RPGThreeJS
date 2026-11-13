/**
 * OD-2026-11-13-F (Q1) — a whole chronicle played by the QA driver, from a new chronicle of the current Lion to an ending.
 *
 * Each chapter starts from the state the previous one leaves, passed through `between` (a real save and reload in the
 * tests), never from a fixture or a forced reputation. A plan names the path of each Seal plateau and the final act's
 * policy; the paths are the ones the post-demo QA already plays (honour: merits and the claim; force: greed and the
 * trial). QA tooling: it never runs in the game and owns no truth.
 */
import { requirePlateauCampaign, type CampaignChapterId } from '../campaign/plateaux/PlateauRegistry';
import type { GameState } from '../game/types';
import { playLion, playPlateau, type PlateauPlaythrough, type PlateauScenario } from './plateauDriver';

export type ChroniclePath = 'honour' | 'force';
export type PostLionChapterId = Exclude<CampaignChapterId, 'lion'>;

export const CHRONICLE_CHAPTERS = Object.freeze(['lion', 'bear', 'dragon', 'scorpion', 'finale'] as const);
export const POST_LION_CHAPTERS = Object.freeze(['bear', 'dragon', 'scorpion', 'finale'] as const);

/** One seed per chapter, as the game draws one when the campaign continues; the Lion's is the new chronicle's. */
export const CHRONICLE_SEEDS: Readonly<Record<CampaignChapterId, number>> = Object.freeze({
  lion: 20261113, bear: 20261114, dragon: 20261115, scorpion: 20261116, finale: 20261117,
});

export interface ChroniclePlan {
  name: string;
  lion: ChroniclePath;
  bear: ChroniclePath;
  dragon: ChroniclePath;
  scorpion: ChroniclePath;
  /** The final act's policy and any explicit answer (the Fear epilogue's choice). */
  finale: Pick<PlateauScenario, 'prefer'> & Partial<Pick<PlateauScenario, 'answers'>>;
}

/** The four ways a chronicle ends, each played from a new chronicle (Fear twice: its two answers). */
export const CHRONICLE_PLANS = Object.freeze({
  respect: { name: 'Respect', lion: 'honour', bear: 'honour', dragon: 'honour', scorpion: 'honour', finale: { prefer: 'merit' } },
  balance: { name: 'Équilibre', lion: 'honour', bear: 'honour', dragon: 'force', scorpion: 'force', finale: { prefer: 'merit' } },
  fearLastStand: { name: 'Peur, dernier carré', lion: 'force', bear: 'force', dragon: 'force', scorpion: 'force',
    finale: { prefer: 'greed', answers: { finale_epilogue_fear: 'finaleFearLastStand' } } },
  fearFate: { name: 'Peur, destin accepté', lion: 'force', bear: 'force', dragon: 'force', scorpion: 'force',
    finale: { prefer: 'greed', answers: { finale_epilogue_fear: 'finaleFearFateAccepted' } } },
} satisfies Record<string, ChroniclePlan>);

/** The scenario of one chapter of a plan: the path's policy, with the Dragon honour run's fights at its two later forks. */
export function chapterScenario(plan: ChroniclePlan, chapterId: CampaignChapterId): PlateauScenario {
  if (chapterId === 'finale') return { name: `${plan.name} — finale`, intent: 'claim_recognition', ...plan.finale };
  const path = plan[chapterId];
  const base: PlateauScenario = path === 'honour'
    ? { name: `${plan.name} — ${chapterId}`, prefer: 'merit', intent: 'claim_recognition' }
    : { name: `${plan.name} — ${chapterId}`, prefer: 'greed', intent: 'request_trial' };
  return chapterId === 'dragon' && path === 'honour'
    ? { ...base, forks: { 'dragon-second-trial': 'combat', 'dragon-final-trial': 'combat' } } : base;
}

export interface ChroniclePlaythrough {
  /** Each chapter as the driver played it. */
  chapters: Record<CampaignChapterId, PlateauPlaythrough>;
  /** The state each chapter left, after `between` (a save and its reload in the tests). */
  saved: Record<CampaignChapterId, GameState>;
}

/** Plays a whole chronicle under a plan; `between` takes each chapter's end (the save the next chapter continues from). */
export function playChronicle(plan: ChroniclePlan, between: (state: GameState) => GameState = (state) => state): ChroniclePlaythrough {
  const chapters = {} as Record<CampaignChapterId, PlateauPlaythrough>;
  const saved = {} as Record<CampaignChapterId, GameState>;
  chapters.lion = playLion(chapterScenario(plan, 'lion'), CHRONICLE_SEEDS.lion);
  saved.lion = between(chapters.lion.state);
  let previous = saved.lion;
  for (const chapterId of POST_LION_CHAPTERS) {
    chapters[chapterId] = playPlateau(chapterId, previous, chapterScenario(plan, chapterId), CHRONICLE_SEEDS[chapterId]);
    saved[chapterId] = between(chapters[chapterId].state);
    previous = saved[chapterId];
  }
  return { chapters, saved };
}

/** The chapter before a post-Lion chapter. */
export function previousChapter(chapterId: PostLionChapterId): CampaignChapterId {
  return CHRONICLE_CHAPTERS[CHRONICLE_CHAPTERS.indexOf(chapterId) - 1]!;
}

/**
 * A middle of each post-Lion chapter where the map autosaves: the Seal plateaux's second refuge (after their second
 * trial and the place it leads to), the capital's last refuge (after its fork), the Tournament's third bout.
 */
export function midChapterStop(chapterId: PostLionChapterId | 'tournament'): string {
  if (chapterId === 'tournament') return 'finale-bout-phoenix';
  const route = requirePlateauCampaign(chapterId).topology.route ?? [];
  const refuges = route.filter((node) => node.type === 'refuge');
  if (chapterId === 'finale') return refuges[0]!.id;
  const middle = refuges.find((node) => node.depth > 7 && node.depth < 14);
  if (!middle) throw new Error(`No middle refuge on the ${chapterId} route.`);
  return middle.id;
}
