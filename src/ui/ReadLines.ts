/**
 * The dialogue lines this device has already shown (final audit 2026-11-11, OD-2026-11-11-E B9), so a replay can skip
 * them with the fast-forward control. Like the motion choice, it lives on the device, outside the saves: loading or
 * starting a chronicle never changes it, and it never changes game truth. Effects still apply on every line skipped.
 */
const READ_LINES_KEY = 'rpg-threejs:read-lines:v1';

let cache: Set<string> | null = null;

function lines(): Set<string> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(READ_LINES_KEY) ?? '[]') as unknown;
    cache = new Set(Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

const keyOf = (sequenceId: string, stepId: string): string => `${sequenceId}#${stepId}`;

export function hasReadLine(sequenceId: string, stepId: string): boolean {
  return lines().has(keyOf(sequenceId, stepId));
}

export function markLineRead(sequenceId: string, stepId: string): void {
  const set = lines();
  const key = keyOf(sequenceId, stepId);
  if (set.has(key)) return;
  set.add(key);
  try { localStorage.setItem(READ_LINES_KEY, JSON.stringify([...set])); }
  catch { /* A refused write only means the line will not be skippable next time. */ }
}

/** Tests only: forget the in-memory copy so the next read comes from storage again. */
export function resetReadLinesCache(): void {
  cache = null;
}
