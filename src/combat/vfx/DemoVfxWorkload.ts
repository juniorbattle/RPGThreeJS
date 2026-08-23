/**
 * R2C-VFX Composer V2.6.3 — DEMO scope workload summary.
 *
 * Pure, deterministic aggregation over the DEMO authoring scope. Reuses the
 * V2.6.2 saved-fingerprint / published-fingerprint semantics so the dashboard
 * can never disagree with the batch publish dialog.
 *
 * States are mutually exclusive; every DEMO action lands in exactly one.
 *
 *   PUBLISHED   — a published registry entry exists AND the current draft is
 *                 not ahead of it (no draft, or draft fingerprint == published).
 *   READY       — an explicit SAVE DRAFT fingerprint matches the current draft
 *                 AND publication would still change the registry.
 *   IN_PROGRESS — a draft exists with real authoring work, but it is neither
 *                 READY nor fully PUBLISHED (unsaved edits, or edits made after
 *                 the last publication).
 *   REMAINING   — no meaningful authoring work yet.
 */

import type { ComposerStore } from './VfxComposerPlayback';
import { getSavedFingerprint } from './VfxComposerPlayback';
import {
  computeFingerprint,
  getPublishedEntry,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import {
  getVfxActionScopeRecords,
  DEMO_ACTION_GROUP_ORDER,
  VFX_ACTION_GROUP_LABELS,
  type DemoActionGroup,
} from './DemoVfxActionScope';

export type WorkloadState = 'PUBLISHED' | 'READY' | 'IN_PROGRESS' | 'REMAINING';

export interface WorkloadEntry {
  actionKey: string;
  group: DemoActionGroup;
  state: WorkloadState;
}

export interface WorkloadGroupSummary {
  group: DemoActionGroup;
  label: string;
  /** PUBLISHED count — the "done" numerator. */
  done: number;
  total: number;
}

export interface DemoWorkloadSummary {
  actions: number;
  published: number;
  ready: number;
  inProgress: number;
  remaining: number;
  entries: WorkloadEntry[];
  groups: WorkloadGroupSummary[];
}

/**
 * A draft counts as authoring work only when it actually references at least
 * one visual slot. An empty scaffold left behind by selecting an action is not
 * "in progress".
 */
function hasMeaningfulWork(draft: { visualSlots: unknown[] } | undefined): boolean {
  return Boolean(draft && Array.isArray(draft.visualSlots) && draft.visualSlots.length > 0);
}

export function classifyWorkloadState(
  actionKey: string,
  store: ComposerStore,
  registry: PublishedVfxRegistry,
): WorkloadState {
  const draft = store.drafts[actionKey];
  const publishedEntry = getPublishedEntry(registry, actionKey);
  const publishedFp = publishedEntry?.fingerprint;

  if (!hasMeaningfulWork(draft)) {
    // No local work: published state alone decides.
    return publishedEntry ? 'PUBLISHED' : 'REMAINING';
  }

  const currentFp = computeFingerprint(draft!);
  const savedFp = getSavedFingerprint(store, actionKey);

  if (publishedFp === currentFp) return 'PUBLISHED';
  if (savedFp === currentFp) return 'READY';
  return 'IN_PROGRESS';
}

export function buildDemoWorkloadSummary(
  store: ComposerStore,
  registry: PublishedVfxRegistry,
): DemoWorkloadSummary {
  const entries: WorkloadEntry[] = [];

  for (const record of getVfxActionScopeRecords()) {
    if (record.scope !== 'DEMO') continue;
    entries.push({
      actionKey: record.actionKey,
      group: record.group as DemoActionGroup,
      state: classifyWorkloadState(record.actionKey, store, registry),
    });
  }

  const count = (state: WorkloadState): number => entries.filter((e) => e.state === state).length;

  const groups: WorkloadGroupSummary[] = DEMO_ACTION_GROUP_ORDER
    .map((group) => {
      const inGroup = entries.filter((e) => e.group === group);
      return {
        group,
        label: VFX_ACTION_GROUP_LABELS[group],
        done: inGroup.filter((e) => e.state === 'PUBLISHED').length,
        total: inGroup.length,
      };
    })
    .filter((g) => g.total > 0);

  return {
    actions: entries.length,
    published: count('PUBLISHED'),
    ready: count('READY'),
    inProgress: count('IN_PROGRESS'),
    remaining: count('REMAINING'),
    entries,
    groups,
  };
}
