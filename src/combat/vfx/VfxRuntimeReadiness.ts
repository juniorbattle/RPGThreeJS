/**
 * VFX Runtime Readiness — DEV-only pre-flight acquisition.
 *
 * Ensures that every CartoonCoffee candidate needed by a Composer draft has
 * its native PNG available in megapack-runtime BEFORE playback starts.
 *
 * Uses a real HTTP check (HEAD) against the runtime asset URL — NOT the
 * static runtime manifest — because candidates acquired dynamically during
 * the current dev session may not appear in the static manifest.
 *
 * Deduplicates concurrent acquisition requests via an in-flight promise map.
 */

import { resolveCandidateSource } from './VfxResourceManager';
import type { VfxPresetDraft } from './VfxPresetComposer';

export type FetchFn = typeof fetch;

export interface RuntimeReadinessOptions {
  fetchFn?: FetchFn;
}

export interface CandidateReadinessResult {
  candidateId: string;
  ready: boolean;
  acquired: boolean;
  error?: string;
}

export interface DraftReadinessResult {
  ready: boolean;
  candidates: CandidateReadinessResult[];
  failedCandidates: string[];
}

/** In-flight acquisition deduplication: candidateId → Promise. */
const _inFlight = new Map<string, Promise<CandidateReadinessResult>>();

/**
 * Checks whether the runtime PNG for a candidate is already available by
 * issuing a HEAD request to the runtime asset URL.
 */
async function checkRuntimePngExists(
  candidateId: string,
  fetchFn: FetchFn,
): Promise<boolean> {
  const source = resolveCandidateSource(candidateId);
  if (!source) return false;
  try {
    const res = await fetchFn(source.url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Posts to the DEV acquisition bridge to sync the candidate's native PNG
 * into megapack-runtime.
 */
async function acquireCandidate(
  candidateId: string,
  fetchFn: FetchFn,
): Promise<boolean> {
  try {
    const res = await fetchFn('/dev/vfx-acquire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * Ensures a single candidate's runtime PNG is ready for playback.
 *
 * 1. Validates the candidate exists in inventory (isSlotPlayable).
 * 2. Checks if the PNG already exists via HEAD request.
 * 3. If missing, POSTs to /dev/vfx-acquire.
 * 4. Verifies acquisition succeeded with a second HEAD check.
 *
 * Deduplicates concurrent calls for the same candidate via an in-flight map.
 */
export async function ensureCandidateRuntimeReady(
  candidateId: string,
  options: RuntimeReadinessOptions = {},
): Promise<CandidateReadinessResult> {
  if (!resolveCandidateSource(candidateId)) {
    return {
      candidateId,
      ready: false,
      acquired: false,
      error: 'Candidate not in inventory or unsupported native format',
    };
  }

  const fetchFn = options.fetchFn ?? globalThis.fetch;

  // Deduplicate: if already in-flight, share the same promise
  const existing = _inFlight.get(candidateId);
  if (existing) return existing;

  const promise = (async (): Promise<CandidateReadinessResult> => {
    // Step 1: Check if PNG already exists
    const exists = await checkRuntimePngExists(candidateId, fetchFn);
    if (exists) {
      return { candidateId, ready: true, acquired: false };
    }

    // Step 2: Acquire via DEV bridge
    const acquired = await acquireCandidate(candidateId, fetchFn);
    if (!acquired) {
      return {
        candidateId,
        ready: false,
        acquired: false,
        error: 'Acquisition failed',
      };
    }

    // Step 3: Verify the PNG now exists
    const verified = await checkRuntimePngExists(candidateId, fetchFn);
    if (!verified) {
      return {
        candidateId,
        ready: false,
        acquired: true,
        error: 'Acquisition reported success but PNG not found',
      };
    }

    return { candidateId, ready: true, acquired: true };
  })();

  _inFlight.set(candidateId, promise);
  try {
    return await promise;
  } finally {
    _inFlight.delete(candidateId);
  }
}

/**
 * Ensures every unique playable candidate in a draft is runtime-ready.
 *
 * Returns a summary with per-candidate results and a list of any failures.
 */
export async function ensureDraftRuntimeReady(
  draft: VfxPresetDraft,
  options: RuntimeReadinessOptions = {},
): Promise<DraftReadinessResult> {
  const uniqueCandidates = Array.from(new Set(
    draft.visualSlots
      .filter((slot) => resolveCandidateSource(slot.candidateId) !== null)
      .map((slot) => slot.candidateId),
  ));

  const results = await Promise.all(
    uniqueCandidates.map((id) => ensureCandidateRuntimeReady(id, options)),
  );

  const failed = results.filter((r) => !r.ready);
  return {
    ready: failed.length === 0,
    candidates: results,
    failedCandidates: failed.map((r) => r.candidateId),
  };
}

/**
 * Clears the in-flight map. Useful for tests.
 */
export function _clearInFlight(): void {
  _inFlight.clear();
}
