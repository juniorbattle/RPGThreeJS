/**
 * V2.6.2 — Pure batch publish plan classification.
 *
 * Given a ComposerStore and the active published registry, produces a
 * deterministic plan classifying every draft into a batch eligibility state.
 * No DOM, no fetch, no side effects — fully testable.
 */

import type { ComposerStore } from './VfxComposerPlayback';
import { getSavedFingerprint } from './VfxComposerPlayback';
import type { VfxPresetDraft } from './VfxPresetComposer';
import { validateDraftForPublication } from './VfxPresetComposer';
import {
  computeFingerprint,
  getPublishedEntry,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import { getCandidateInventoryRecord, resolveCandidateSource } from './VfxResourceManager';

// ============================================================ Classification States

export type BatchClassification =
  | 'READY_NEW'
  | 'READY_UPDATE'
  | 'READY_ALREADY_PUBLISHED'
  | 'MODIFIED_SINCE_SAVE'
  | 'NOT_SAVED'
  | 'BLOCKED';

export interface BatchEntry {
  actionKey: string;
  classification: BatchClassification;
  draft: VfxPresetDraft;
  savedFingerprint: string | undefined;
  currentFingerprint: string;
  publishedFingerprint: string | undefined;
  blockReason?: string;
}

export interface BatchPublishPlan {
  entries: BatchEntry[];
  readyNew: string[];
  readyUpdate: string[];
  readyAlreadyPublished: string[];
  modifiedSinceSave: string[];
  notSaved: string[];
  blocked: BatchEntry[];
  /** Drafts eligible for batch publication (READY_NEW + READY_UPDATE). */
  eligible: BatchEntry[];
  hasEligible: boolean;
  hasBlocked: boolean;
}

// ============================================================ Plan Builder

/**
 * Classifies every draft in the store against the published registry.
 *
 * Classification logic:
 *   NOT_SAVED — no saved fingerprint
 *   MODIFIED_SINCE_SAVE — saved fingerprint differs from current
 *   BLOCKED — saved & current match, but draft fails validation or candidate checks
 *   READY_ALREADY_PUBLISHED — saved & current match, published fingerprint already equals current
 *   READY_NEW — saved & current match, no published entry exists
 *   READY_UPDATE — saved & current match, published entry exists but fingerprint differs
 */
export function buildBatchPublishPlan(
  store: ComposerStore,
  registry: PublishedVfxRegistry,
): BatchPublishPlan {
  const entries: BatchEntry[] = [];

  for (const [actionKey, draft] of Object.entries(store.drafts)) {
    const savedFp = getSavedFingerprint(store, actionKey);
    const currentFp = computeFingerprint(draft);
    const publishedEntry = getPublishedEntry(registry, actionKey);
    const publishedFp = publishedEntry?.fingerprint;

    let classification: BatchClassification;
    let blockReason: string | undefined;

    if (!savedFp) {
      classification = 'NOT_SAVED';
    } else if (savedFp !== currentFp) {
      classification = 'MODIFIED_SINCE_SAVE';
    } else {
      // Saved fingerprint matches current — check validity for BLOCKED
      if (!validateDraftForPublication(draft)) {
        classification = 'BLOCKED';
        blockReason = 'Draft failed schema validation';
      } else {
        let candidateOk = true;
        for (const slot of draft.visualSlots) {
          if (!getCandidateInventoryRecord(slot.candidateId)) {
            candidateOk = false;
            blockReason = `Candidate ${slot.candidateId} not found in inventory`;
            break;
          }
          if (!resolveCandidateSource(slot.candidateId)) {
            candidateOk = false;
            blockReason = `Candidate ${slot.candidateId} has unsupported atlas format`;
            break;
          }
        }
        if (!candidateOk) {
          classification = 'BLOCKED';
        } else if (publishedFp && publishedFp === currentFp) {
          classification = 'READY_ALREADY_PUBLISHED';
        } else if (publishedEntry) {
          classification = 'READY_UPDATE';
        } else {
          classification = 'READY_NEW';
        }
      }
    }

    entries.push({
      actionKey,
      classification,
      draft,
      savedFingerprint: savedFp,
      currentFingerprint: currentFp,
      publishedFingerprint: publishedFp,
      ...(blockReason ? { blockReason } : {}),
    });
  }

  const readyNew = entries.filter((e) => e.classification === 'READY_NEW').map((e) => e.actionKey);
  const readyUpdate = entries.filter((e) => e.classification === 'READY_UPDATE').map((e) => e.actionKey);
  const readyAlreadyPublished = entries.filter((e) => e.classification === 'READY_ALREADY_PUBLISHED').map((e) => e.actionKey);
  const modifiedSinceSave = entries.filter((e) => e.classification === 'MODIFIED_SINCE_SAVE').map((e) => e.actionKey);
  const notSaved = entries.filter((e) => e.classification === 'NOT_SAVED').map((e) => e.actionKey);
  const blocked = entries.filter((e) => e.classification === 'BLOCKED');
  const eligible = entries.filter((e) => e.classification === 'READY_NEW' || e.classification === 'READY_UPDATE');

  return {
    entries,
    readyNew,
    readyUpdate,
    readyAlreadyPublished,
    modifiedSinceSave,
    notSaved,
    blocked,
    eligible,
    hasEligible: eligible.length > 0,
    hasBlocked: blocked.length > 0,
  };
}
