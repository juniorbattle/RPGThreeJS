import type { CombatConfig } from './types';
import { BEAR_CHALLENGES } from '../campaign/plateaux/bear/bearCombat';
import { DRAGON_CHALLENGES } from '../campaign/plateaux/dragon/dragonCombat';

/**
 * OD-2026-11-07-F (set 1.18.0, COMBAT_AND_VFX): six optional fights are challenges. Each states exactly one condition from
 * a closed list and adds a red-gem prime to its existing rewards when a victory holds it. This table is the static
 * declaration; RunSystem decides the prime from the facts the tactical runtime reports (`decideChallengePrime`).
 */
export type ChallengeKind = 'max_heroes' | 'no_items' | 'max_rounds';
export interface ChallengeDeclaration {
  kind: ChallengeKind;
  /** Heroes for `max_heroes`, rounds for `max_rounds`. */
  limit?: number;
  primeRedGems: number;
}

const THREE_HEROES = (primeRedGems: number): ChallengeDeclaration => ({ kind: 'max_heroes', limit: 3, primeRedGems });

export const CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = {
  // "Meute du détour", the initiation in region I: both stable variants.
  poi_opening_wolves_a: THREE_HEROES(1),
  poi_opening_wolves_b: THREE_HEROES(1),
  troll_crossing: { kind: 'no_items', primeRedGems: 2 },
  // Its authored objective already says "before he cuts the retreat"; the operator calibrates the limit in play.
  serpent_duelist_trial: { kind: 'max_rounds', limit: 8, primeRedGems: 2 },
  young_dragon_roost: THREE_HEROES(2),
  // The two stationary guardians (TRAVERSAL set 1.18.0).
  poi_elite_valley_sentinel: THREE_HEROES(2),
  poi_elite_seal_warden: THREE_HEROES(2),
};

/** Event POIs whose authored choice offers a challenge fight: the map states the challenge on the place itself. */
const CHALLENGE_BY_EVENT: Readonly<Record<string, string>> = {
  mystery_dragon_roost: 'young_dragon_roost',
  mystery_troll_crossing: 'troll_crossing',
};

/** Set 1.20.0: post-demo challenges, from the closed condition list, with the prime decided by RunSystem. */
const POST_DEMO_CHALLENGES: Readonly<Record<string, ChallengeDeclaration>> = Object.freeze({ ...BEAR_CHALLENGES, ...DRAGON_CHALLENGES });

export function challengeFor(combatId: string): ChallengeDeclaration | undefined {
  return CHALLENGES[combatId] ?? POST_DEMO_CHALLENGES[combatId];
}

/** The challenge a place offers, through its own combat or an authored event fight. */
export function challengeForContent(contentId: string): { combatId: string; challenge: ChallengeDeclaration } | undefined {
  const combatId = challengeFor(contentId) ? contentId : CHALLENGE_BY_EVENT[contentId];
  return combatId ? { combatId, challenge: challengeFor(combatId)! } : undefined;
}

export interface ChallengeText { condition: string; prime: string }
export function describeChallenge(challenge: ChallengeDeclaration): ChallengeText {
  const condition = challenge.kind === 'max_heroes' ? `${challenge.limit} héros au plus`
    : challenge.kind === 'no_items' ? 'Sans objets'
      : `Victoire en ${challenge.limit} manches`;
  const gems = challenge.primeRedGems;
  return { condition, prime: `${gems} gemme${gems > 1 ? 's' : ''} rouge${gems > 1 ? 's' : ''}` };
}

/** Facts reported by the tactical runtime with a victory. Transient: never saved. */
export interface ChallengeFacts { heroes: number; rounds?: number; itemsUsed?: number }

/** Whether a victory held the declared condition. An unreported fact never holds it. */
export function challengeHeld(challenge: ChallengeDeclaration, facts: ChallengeFacts): boolean {
  if (challenge.kind === 'max_heroes') return facts.heroes >= 1 && facts.heroes <= (challenge.limit ?? 0);
  if (challenge.kind === 'no_items') return facts.itemsUsed === 0;
  return facts.rounds !== undefined && facts.rounds >= 1 && facts.rounds <= (challenge.limit ?? 0);
}

/**
 * Attaches the static declaration and its text to a combat config, for the tactical runtime (item refusal, round
 * counter, stated condition). A hero cap also lowers the existing deployment limit, which enforces it.
 */
export function withChallenge(config: CombatConfig): CombatConfig {
  const challenge = challengeFor(config.id);
  if (!challenge) return config;
  const text = describeChallenge(challenge);
  return {
    ...config,
    ...(challenge.kind === 'max_heroes' ? { maxPlayerUnits: Math.min(config.maxPlayerUnits, challenge.limit!) } : {}),
    challenge: { kind: challenge.kind, ...(challenge.limit ? { limit: challenge.limit } : {}), primeRedGems: challenge.primeRedGems, ...text },
  };
}
