/**
 * The credits screen's text (final audit 2026-11-11, OD-2026-11-11-E B9). It comes from the operator, word for word:
 * no name or role is written here by an agent. While the list is empty, the title shows no Crédits entry.
 * One entry per line; an empty string leaves a blank line between groups.
 */
export const CREDITS_LINES: readonly string[] = Object.freeze([]);

export function hasCredits(): boolean {
  return CREDITS_LINES.some((line) => line.trim().length > 0);
}
