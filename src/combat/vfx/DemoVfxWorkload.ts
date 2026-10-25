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

import { isMissingSpriteSheetStep } from './VfxMissingSheetStandIn';
import { VFX_PRESETS } from './VfxPresets';
import type { ComposerStore } from './VfxComposerPlayback';
import type { VfxPresetDraft } from './VfxPresetComposer';
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

/** Sheets the base presets still name although their art was retired (R2C-C-1). */
const RETIRED_BASE_SHEETS: ReadonlySet<string> = new Set(
  Object.values(VFX_PRESETS).flatMap((preset) => preset.steps.filter(isMissingSpriteSheetStep).map((step) => String(step.spriteSheet))),
);

/** True for a slot seeded with retired base art: selecting an action creates it, the operator did not. */
export function isRetiredBaseArtSlot(candidateId: string): boolean {
  return RETIRED_BASE_SHEETS.has(candidateId);
}

/**
 * A draft counts as authoring work once it holds something the operator added:
 * a visual slot that is not retired base art, unit motion, explicit beats or a
 * technical polish. The scaffold left behind by selecting an action, empty or
 * seeded with retired sheets, is not "in progress".
 */
function hasMeaningfulWork(draft: VfxPresetDraft | undefined): boolean {
  if (!draft) return false;
  return (Array.isArray(draft.visualSlots) && draft.visualSlots.some((slot) => !isRetiredBaseArtSlot(slot.candidateId)))
    || (draft.casterMotion?.length ?? 0) > 0
    || (draft.beats?.length ?? 0) > 0
    || (draft.technicalPolish !== undefined && draft.technicalPolish !== 'OFF');
}

/** Short marks for the action list, one per workload state. */
export const WORKLOAD_STATE_MARKS: Readonly<Record<WorkloadState, string>> = Object.freeze({
  PUBLISHED: '✓',
  READY: '●',
  IN_PROGRESS: '◐',
  REMAINING: '○',
});

/**
 * The nearest action after (or before) `current` in list order that is not
 * PUBLISHED, wrapping around; null when every other action is published.
 */
export function nextActionToCompose(
  order: readonly string[],
  current: string,
  stateOf: (actionKey: string) => WorkloadState,
  direction: 1 | -1 = 1,
): string | null {
  const count = order.length;
  const found = order.indexOf(current);
  // An unknown current action starts just outside the list, so the first step lands on its first or last entry.
  const start = found >= 0 ? found : direction === 1 ? -1 : count;
  for (let step = 1; step <= count; step += 1) {
    const candidate = order[(((start + direction * step) % count) + count) % count]!;
    if (candidate !== current && stateOf(candidate) !== 'PUBLISHED') return candidate;
  }
  return null;
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
