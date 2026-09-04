import type { RunNode, RunNodeType } from '../game/types';

/**
 * Shared PURE route-presentation semantics.
 *
 * TravelView and the Cinematic Journey adapter both read route meaning from here, so the two
 * surfaces can never drift into different interpretations of the same RunNode. This module holds no
 * DOM and no campaign truth: risk/reward/difficulty/hint are read from the authoritative node and
 * only fall back to type defaults when the node does not declare them.
 *
 * ONE ROUTE TRUTH · ONE PRESENTATION INTERPRETATION · TWO POSSIBLE UI SURFACES
 */
export interface RunNodePresentation {
  label: string;
  risk: number;
  reward: number;
  hint: string;
  difficulty: string;
}

export const RUN_NODE_TYPE_PRESENTATION: Readonly<Record<RunNodeType, { label: string; risk: number; reward: number }>> = Object.freeze({
  combat: { label: 'Combat', risk: 2, reward: 3 },
  event: { label: 'Événement', risk: 1, reward: 3 },
  mystery: { label: 'Mystère', risk: 2, reward: 2 },
  recruitment: { label: 'Recrutement', risk: 1, reward: 2 },
  shop: { label: 'Marchand', risk: 0, reward: 1 },
  refuge: { label: 'Refuge', risk: 0, reward: 1 },
  story: { label: 'Récit', risk: 1, reward: 2 },
  boss: { label: 'Boss', risk: 3, reward: 3 },
});

export const RUN_NODE_DIFFICULTY_LABELS: Readonly<Record<NonNullable<RunNode['difficulty']>, string>> = Object.freeze({
  safe: 'Sûr',
  standard: 'Standard',
  dangerous: 'Dangereux',
  decisive: 'Décisif',
});

export function runNodePresentation(node: RunNode): RunNodePresentation {
  const fallback = RUN_NODE_TYPE_PRESENTATION[node.type];
  return {
    label: fallback.label,
    risk: node.risk ?? fallback.risk,
    reward: node.reward ?? fallback.reward,
    hint: node.hint ?? 'Route inconnue.',
    // A node without an authored difficulty reads as its type label, as TravelView has always done.
    difficulty: node.difficulty ? RUN_NODE_DIFFICULTY_LABELS[node.difficulty] : fallback.label,
  };
}

/** Plain-text rating scale for surfaces that cannot render markup meters. */
export function ratingScale(value: number, max = 3): string {
  const filled = Math.max(0, Math.min(max, Math.trunc(value)));
  return '◆'.repeat(filled) + '◇'.repeat(max - filled);
}
