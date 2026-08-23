/**
 * R2C-VFX Composer V2.6.3 — DEMO workload summary tests.
 *
 * The dashboard is pure telemetry. These tests pin the state machine so it can
 * never disagree with the V2.6.2 batch publish semantics, and prove the counters
 * are a strict partition of the DEMO scope.
 */
import { describe, expect, it } from 'vitest';

import {
  buildDemoWorkloadSummary,
  classifyWorkloadState,
  type WorkloadState,
} from './DemoVfxWorkload';
import {
  createEmptyComposerStore,
  putDraft,
  recordSavedFingerprint,
  type ComposerStore,
} from './VfxComposerPlayback';
import {
  publishEntry,
  PUBLISHED_REGISTRY_SCHEMA_VERSION,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import { createDraftFromAction, type VfxPresetDraft } from './VfxPresetComposer';
import { getActionsInScope, getScopeCensus } from './DemoVfxActionScope';

const DEMO_KEYS = getActionsInScope('DEMO').map((a) => a.actionKey);
const KEY_A = DEMO_KEYS[0]!;
const KEY_B = DEMO_KEYS[1]!;

function draftWithSlots(actionKey: string, candidateId = 'blade_hit_small'): VfxPresetDraft {
  return createDraftFromAction({
    actionKey,
    presetId: `composer_${actionKey}`,
    visualSteps: [{ candidateId }],
  });
}

function emptyDraft(actionKey: string): VfxPresetDraft {
  return createDraftFromAction({ actionKey, presetId: `composer_${actionKey}`, visualSteps: [] });
}

function createEmptyRegistry(): PublishedVfxRegistry {
  return { schemaVersion: PUBLISHED_REGISTRY_SCHEMA_VERSION, actions: {} };
}

function publish(registry: PublishedVfxRegistry, draft: VfxPresetDraft): PublishedVfxRegistry {
  return publishEntry(registry, draft);
}

describe('DemoVfxWorkload — state machine', () => {
  it('reports REMAINING with no draft and no publication', () => {
    expect(classifyWorkloadState(KEY_A, createEmptyComposerStore(), createEmptyRegistry()))
      .toBe<WorkloadState>('REMAINING');
  });

  it('reports REMAINING for an empty scaffold draft', () => {
    const store = putDraft(createEmptyComposerStore(), emptyDraft(KEY_A));
    expect(classifyWorkloadState(KEY_A, store, createEmptyRegistry())).toBe<WorkloadState>('REMAINING');
  });

  it('reports IN_PROGRESS for an unsaved draft with real work', () => {
    const store = putDraft(createEmptyComposerStore(), draftWithSlots(KEY_A));
    expect(classifyWorkloadState(KEY_A, store, createEmptyRegistry())).toBe<WorkloadState>('IN_PROGRESS');
  });

  it('reports READY once the draft is explicitly saved', () => {
    const draft = draftWithSlots(KEY_A);
    let store = putDraft(createEmptyComposerStore(), draft);
    store = recordSavedFingerprint(store, KEY_A, draft);
    expect(classifyWorkloadState(KEY_A, store, createEmptyRegistry())).toBe<WorkloadState>('READY');
  });

  it('reports PUBLISHED when the published fingerprint matches the draft', () => {
    const draft = draftWithSlots(KEY_A);
    let store = putDraft(createEmptyComposerStore(), draft);
    store = recordSavedFingerprint(store, KEY_A, draft);
    const registry = publish(createEmptyRegistry(), draft);
    expect(classifyWorkloadState(KEY_A, store, registry)).toBe<WorkloadState>('PUBLISHED');
  });

  it('reports PUBLISHED when an entry exists and no local draft remains', () => {
    const registry = publish(createEmptyRegistry(), draftWithSlots(KEY_A));
    expect(classifyWorkloadState(KEY_A, createEmptyComposerStore(), registry))
      .toBe<WorkloadState>('PUBLISHED');
  });

  it('falls back to IN_PROGRESS when the draft moves ahead of the publication', () => {
    const published = draftWithSlots(KEY_A, 'blade_hit_small');
    const registry = publish(createEmptyRegistry(), published);
    const edited = draftWithSlots(KEY_A, 'blade_hit_heavy');
    const store = putDraft(createEmptyComposerStore(), edited);
    expect(classifyWorkloadState(KEY_A, store, registry)).toBe<WorkloadState>('IN_PROGRESS');
  });

  it('reports READY when a saved draft is ahead of an older publication', () => {
    const registry = publish(createEmptyRegistry(), draftWithSlots(KEY_A, 'blade_hit_small'));
    const edited = draftWithSlots(KEY_A, 'blade_hit_heavy');
    let store = putDraft(createEmptyComposerStore(), edited);
    store = recordSavedFingerprint(store, KEY_A, edited);
    expect(classifyWorkloadState(KEY_A, store, registry)).toBe<WorkloadState>('READY');
  });

  it('treats a stale saved fingerprint as IN_PROGRESS', () => {
    const original = draftWithSlots(KEY_A, 'blade_hit_small');
    let store = putDraft(createEmptyComposerStore(), original);
    store = recordSavedFingerprint(store, KEY_A, original);
    // Operator keeps editing after saving.
    store = putDraft(store, draftWithSlots(KEY_A, 'blade_hit_heavy'));
    expect(classifyWorkloadState(KEY_A, store, createEmptyRegistry())).toBe<WorkloadState>('IN_PROGRESS');
  });
});

describe('DemoVfxWorkload — summary aggregation', () => {
  const emptyStore: ComposerStore = createEmptyComposerStore();

  it('counts every DEMO action and nothing else', () => {
    const summary = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    expect(summary.actions).toBe(getScopeCensus().demo);
    expect(summary.entries).toHaveLength(summary.actions);
  });

  it('partitions the scope exactly across the four states', () => {
    const summary = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    expect(summary.published + summary.ready + summary.inProgress + summary.remaining)
      .toBe(summary.actions);
  });

  it('starts fully REMAINING on a clean install', () => {
    const summary = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    expect(summary.remaining).toBe(summary.actions);
    expect(summary.published).toBe(0);
    expect(summary.ready).toBe(0);
    expect(summary.inProgress).toBe(0);
  });

  it('tracks mixed states across several actions', () => {
    const readyDraft = draftWithSlots(KEY_A);
    let store = putDraft(createEmptyComposerStore(), readyDraft);
    store = recordSavedFingerprint(store, KEY_A, readyDraft);
    store = putDraft(store, draftWithSlots(KEY_B));

    const publishedKey = DEMO_KEYS[2]!;
    const registry = publish(createEmptyRegistry(), draftWithSlots(publishedKey));

    const summary = buildDemoWorkloadSummary(store, registry);
    expect(summary.ready).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.published).toBe(1);
    expect(summary.remaining).toBe(summary.actions - 3);
  });

  it('ignores drafts and publications for out-of-scope actions', () => {
    const upcomingKey = getActionsInScope('UPCOMING')[0]!.actionKey;
    const draft = draftWithSlots(upcomingKey);
    let store = putDraft(createEmptyComposerStore(), draft);
    store = recordSavedFingerprint(store, upcomingKey, draft);
    const registry = publish(createEmptyRegistry(), draft);

    const summary = buildDemoWorkloadSummary(store, registry);
    expect(summary.published).toBe(0);
    expect(summary.ready).toBe(0);
    expect(summary.entries.some((e) => e.actionKey === upcomingKey)).toBe(false);
  });

  it('reports group progress that sums to the scope totals', () => {
    const summary = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    const totalInGroups = summary.groups.reduce((acc, g) => acc + g.total, 0);
    const doneInGroups = summary.groups.reduce((acc, g) => acc + g.done, 0);
    expect(totalInGroups).toBe(summary.actions);
    expect(doneInGroups).toBe(summary.published);
  });

  it('never emits an empty group bucket', () => {
    const summary = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    for (const group of summary.groups) expect(group.total).toBeGreaterThan(0);
  });

  it('marks a group complete only when every action in it is published', () => {
    let registry = createEmptyRegistry();
    const summary0 = buildDemoWorkloadSummary(emptyStore, registry);
    const target = summary0.groups[0]!;
    const keysInGroup = summary0.entries.filter((e) => e.group === target.group).map((e) => e.actionKey);

    for (const key of keysInGroup.slice(0, -1)) {
      registry = publish(registry, draftWithSlots(key));
    }
    let partial = buildDemoWorkloadSummary(emptyStore, registry);
    expect(partial.groups.find((g) => g.group === target.group)!.done).toBe(keysInGroup.length - 1);

    registry = publish(registry, draftWithSlots(keysInGroup.at(-1)!));
    partial = buildDemoWorkloadSummary(emptyStore, registry);
    const finalGroup = partial.groups.find((g) => g.group === target.group)!;
    expect(finalGroup.done).toBe(finalGroup.total);
  });

  it('is deterministic for identical inputs', () => {
    const a = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    const b = buildDemoWorkloadSummary(emptyStore, createEmptyRegistry());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
