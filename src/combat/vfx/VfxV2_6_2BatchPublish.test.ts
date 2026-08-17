// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installVfxComposerPanel } from './CombatVfxComposerPanel';

import {
  createEmptyComposerStore,
  putDraft,
  deleteDraft,
  recordSavedFingerprint,
  getSavedFingerprint,
  clearSavedFingerprint,
  getSavedStatus,
  deserializeComposerStore,
} from './VfxComposerPlayback';
import {
  computeFingerprint,
  publishEntry,
  type PublishedVfxRegistry,
  PUBLISHED_REGISTRY_SCHEMA_VERSION,
} from './PublishedVfxRegistry';
import {
  createVisualSlot,
  type VfxPresetDraft,
} from './VfxPresetComposer';
import { buildBatchPublishPlan } from './BatchPublishPlan';
import { handlePublishAllPresetsRequest, type VfxRegistryIo } from '../../dev/vfxPublishDevServer';

// ============================================================ In-memory registry IO

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createMemoryRegistryIo(initial: PublishedVfxRegistry) {
  let registry = deepClone(initial);
  let writes = 0;
  const io: VfxRegistryIo = {
    readRegistry: () => deepClone(registry),
    writeRegistryAtomic: (next: PublishedVfxRegistry) => {
      writes++;
      registry = deepClone(next);
    },
  };
  return {
    io,
    getRegistry: () => deepClone(registry),
    getWriteCount: () => writes,
  };
}

// ============================================================ Helpers

function makeDraft(
  actionKey: string,
  overrides: Partial<VfxPresetDraft> = {},
): VfxPresetDraft {
  return {
    actionKey,
    presetId: `composer_${actionKey}`,
    visualSlots: [createVisualSlot('r1_0489', { sizeProfile: 'LOW', timingProfile: 'QUICK', placementProfile: 'TARGET' })],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
    ...overrides,
  };
}

function makeDraftWithCandidate(
  actionKey: string,
  candidateId: string,
): VfxPresetDraft {
  return {
    actionKey,
    presetId: `composer_${actionKey}`,
    visualSlots: [createVisualSlot(candidateId, { sizeProfile: 'LOW', timingProfile: 'QUICK', placementProfile: 'TARGET' })],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
  };
}

function emptyRegistry(): PublishedVfxRegistry {
  return { schemaVersion: PUBLISHED_REGISTRY_SCHEMA_VERSION, actions: {} };
}

// ============================================================ Section 30: Classification Tests

describe('V2.6.2 — Classification & Saved Fingerprint', () => {
  it('legacy store without savedFingerprints loads safely', () => {
    const legacyJson = JSON.stringify({
      drafts: {
        basic_greatsword_hit: makeDraft('basic_greatsword_hit'),
      },
      selectedActionKey: 'basic_greatsword_hit',
    });
    const store = deserializeComposerStore(legacyJson);
    expect(store).not.toBeNull();
    expect(store!.drafts['basic_greatsword_hit']).toBeDefined();
    expect(store!.savedFingerprints).toEqual({});
  });

  it('SAVE DRAFT records fingerprint', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    const savedFp = getSavedFingerprint(store, 'basic_greatsword_hit');
    expect(savedFp).toBeDefined();
    expect(savedFp).toBe(computeFingerprint(draft));
  });

  it('normal mutate/autosave does NOT update saved fingerprint', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    const savedFp = getSavedFingerprint(store, 'basic_greatsword_hit');

    // Mutate the draft (change candidate)
    const modifiedDraft = makeDraftWithCandidate('basic_greatsword_hit', 'r1_1605');
    store = putDraft(store, modifiedDraft);

    // Saved fingerprint should NOT have changed
    expect(getSavedFingerprint(store, 'basic_greatsword_hit')).toBe(savedFp);
  });

  it('NOT_SAVED classification when no saved fingerprint', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    const status = getSavedStatus(store, 'basic_greatsword_hit', draft);
    expect(status).toBe('NOT_SAVED');
  });

  it('READY classification when saved fingerprint matches current', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    const status = getSavedStatus(store, 'basic_greatsword_hit', draft);
    expect(status).toBe('READY');
  });

  it('MODIFIED_SINCE_SAVE classification when fingerprint differs', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);

    const modifiedDraft = makeDraftWithCandidate('basic_greatsword_hit', 'r1_1605');
    store = putDraft(store, modifiedDraft);
    const status = getSavedStatus(store, 'basic_greatsword_hit', modifiedDraft);
    expect(status).toBe('MODIFIED_SINCE_SAVE');
  });

  it('saved fingerprint becomes READY again if draft is reverted exactly', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);

    // Modify
    const modifiedDraft = makeDraftWithCandidate('basic_greatsword_hit', 'r1_1605');
    store = putDraft(store, modifiedDraft);
    expect(getSavedStatus(store, 'basic_greatsword_hit', modifiedDraft)).toBe('MODIFIED_SINCE_SAVE');

    // Revert
    store = putDraft(store, draft);
    expect(getSavedStatus(store, 'basic_greatsword_hit', draft)).toBe('READY');
  });

  it('individual successful publish marks current fingerprint saved (via recordSavedFingerprint)', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    // Simulate what the panel does after successful publish
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    expect(getSavedStatus(store, 'basic_greatsword_hit', draft)).toBe('READY');
  });

  it('delete draft removes saved fingerprint', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    expect(getSavedFingerprint(store, 'basic_greatsword_hit')).toBeDefined();

    store = deleteDraft(store, 'basic_greatsword_hit');
    expect(getSavedFingerprint(store, 'basic_greatsword_hit')).toBeUndefined();
  });

  it('RESET ALL clears saved fingerprint metadata (via createEmptyComposerStore)', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('basic_greatsword_hit');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'basic_greatsword_hit', draft);
    expect(store.savedFingerprints).toBeDefined();
    expect(Object.keys(store.savedFingerprints!).length).toBe(1);

    // Simulate RESET ALL
    store = createEmptyComposerStore();
    expect(store.savedFingerprints).toEqual({});
    expect(Object.keys(store.drafts).length).toBe(0);
  });

  it('clearSavedFingerprint removes single entry', () => {
    let store = createEmptyComposerStore();
    const draftA = makeDraft('a');
    const draftB = makeDraft('b');
    store = putDraft(store, draftA);
    store = putDraft(store, draftB);
    store = recordSavedFingerprint(store, 'a', draftA);
    store = recordSavedFingerprint(store, 'b', draftB);
    store = clearSavedFingerprint(store, 'a');
    expect(getSavedFingerprint(store, 'a')).toBeUndefined();
    expect(getSavedFingerprint(store, 'b')).toBeDefined();
  });
});

// ============================================================ Section 31: Batch Plan Tests

describe('V2.6.2 — Batch Publish Plan', () => {
  it('mixed store produces correct plan with A(new), B(update), C(already), D(modified), E(notsaved)', () => {
    let store = createEmptyComposerStore();

    // Draft A: saved + new (not in registry)
    const draftA = makeDraft('action_a');
    store = putDraft(store, draftA);
    store = recordSavedFingerprint(store, 'action_a', draftA);

    // Draft B: saved + update (in registry with different fingerprint)
    const draftB = makeDraft('action_b');
    store = putDraft(store, draftB);
    store = recordSavedFingerprint(store, 'action_b', draftB);
    // Publish a different version of B
    const draftB_old = makeDraftWithCandidate('action_b', 'r1_1605');
    let registry = publishEntry(emptyRegistry(), draftB_old);

    // Draft C: saved + already published (same fingerprint)
    const draftC = makeDraft('action_c');
    store = putDraft(store, draftC);
    store = recordSavedFingerprint(store, 'action_c', draftC);
    registry = publishEntry(registry, draftC);

    // Draft D: modified since save
    const draftD = makeDraft('action_d');
    store = putDraft(store, draftD);
    store = recordSavedFingerprint(store, 'action_d', draftD);
    const draftD_modified = makeDraftWithCandidate('action_d', 'r1_1605');
    store = putDraft(store, draftD_modified);

    // Draft E: not saved
    const draftE = makeDraft('action_e');
    store = putDraft(store, draftE);

    const plan = buildBatchPublishPlan(store, registry);

    expect(plan.readyNew).toEqual(['action_a']);
    expect(plan.readyUpdate).toEqual(['action_b']);
    expect(plan.readyAlreadyPublished).toContain('action_c');
    expect(plan.modifiedSinceSave).toContain('action_d');
    expect(plan.notSaved).toContain('action_e');

    // Eligible = READY_NEW + READY_UPDATE
    const eligibleKeys = plan.eligible.map((e) => e.actionKey);
    expect(eligibleKeys).toContain('action_a');
    expect(eligibleKeys).toContain('action_b');
    expect(eligibleKeys).not.toContain('action_c');
    expect(eligibleKeys).not.toContain('action_d');
    expect(eligibleKeys).not.toContain('action_e');

    expect(plan.hasEligible).toBe(true);
    expect(plan.hasBlocked).toBe(false);
  });

  it('empty store produces empty plan', () => {
    const store = createEmptyComposerStore();
    const plan = buildBatchPublishPlan(store, emptyRegistry());
    expect(plan.entries).toHaveLength(0);
    expect(plan.hasEligible).toBe(false);
    expect(plan.hasBlocked).toBe(false);
  });

  it('all already published produces no eligible', () => {
    let store = createEmptyComposerStore();
    const draft = makeDraft('action_a');
    store = putDraft(store, draft);
    store = recordSavedFingerprint(store, 'action_a', draft);
    const registry = publishEntry(emptyRegistry(), draft);
    const plan = buildBatchPublishPlan(store, registry);
    expect(plan.readyAlreadyPublished).toContain('action_a');
    expect(plan.hasEligible).toBe(false);
  });
});

// ============================================================ Section 32: Atomicity Tests

describe('V2.6.2 — Batch Publish Atomicity (server handler)', () => {
  it('A valid, B valid, C invalid → ok=false, zero writes, registry unchanged', () => {
    const mem = createMemoryRegistryIo(emptyRegistry());
    const draftA = makeDraft('action_a');
    const draftB = makeDraft('action_b');
    const draftC_invalid = {
      actionKey: 'action_c',
      presetId: 'composer_action_c',
      visualSlots: [], // invalid: no slots
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };

    const body = JSON.stringify({ drafts: [draftA, draftB, draftC_invalid] });
    const result = handlePublishAllPresetsRequest(body, mem.io);

    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.registry).toBeUndefined();
    expect(mem.getWriteCount()).toBe(0);
    expect(mem.getRegistry()).toEqual(emptyRegistry());
  });

  it('A valid, B valid, C valid → ok=true, exactly one write, all three in registry', () => {
    const mem = createMemoryRegistryIo(emptyRegistry());
    const draftA = makeDraft('action_a');
    const draftB = makeDraft('action_b');
    const draftC = makeDraft('action_c');

    const body = JSON.stringify({ drafts: [draftA, draftB, draftC] });
    const result = handlePublishAllPresetsRequest(body, mem.io);

    expect(result.ok).toBe(true);
    expect(result.registry).toBeDefined();
    expect(result.registry!.actions['action_a']).toBeDefined();
    expect(result.registry!.actions['action_b']).toBeDefined();
    expect(result.registry!.actions['action_c']).toBeDefined();
    expect(result.publishedCount).toBe(3);
    expect(result.updatedCount).toBe(0);
    expect(mem.getWriteCount()).toBe(1);
  });

  it('invalid JSON returns error, zero writes', () => {
    const mem = createMemoryRegistryIo(emptyRegistry());
    const result = handlePublishAllPresetsRequest('not json', mem.io);
    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
    expect(mem.getWriteCount()).toBe(0);
  });

  it('missing drafts array returns error, zero writes', () => {
    const mem = createMemoryRegistryIo(emptyRegistry());
    const result = handlePublishAllPresetsRequest(JSON.stringify({}), mem.io);
    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
    expect(mem.getWriteCount()).toBe(0);
  });
});

// ============================================================ Section 33: Registry Preservation Test

describe('V2.6.2 — Registry Preservation', () => {
  it('batch updates only some actions, others unchanged, exactly one write', () => {
    // Start with existing registry
    const existing1 = makeDraft('existing_action_1');
    const existing2 = makeDraftWithCandidate('existing_action_2', 'r1_0489');
    const existing3 = makeDraft('existing_action_3');

    let registry = emptyRegistry();
    registry = publishEntry(registry, existing1);
    registry = publishEntry(registry, existing2);
    registry = publishEntry(registry, existing3);

    const mem = createMemoryRegistryIo(registry);

    // Batch: update existing_action_2 + add new_action_4
    const updated2 = makeDraftWithCandidate('existing_action_2', 'r1_1605');
    const new4 = makeDraft('new_action_4');

    const body = JSON.stringify({ drafts: [updated2, new4] });
    const result = handlePublishAllPresetsRequest(body, mem.io);

    expect(result.ok).toBe(true);
    expect(result.registry).toBeDefined();
    const finalRegistry = result.registry!;

    // existing_action_1 unchanged
    expect(finalRegistry.actions['existing_action_1']?.fingerprint).toBe(computeFingerprint(existing1));
    // existing_action_2 updated
    expect(finalRegistry.actions['existing_action_2']?.fingerprint).toBe(computeFingerprint(updated2));
    // existing_action_3 unchanged
    expect(finalRegistry.actions['existing_action_3']?.fingerprint).toBe(computeFingerprint(existing3));
    // new_action_4 added
    expect(finalRegistry.actions['new_action_4']).toBeDefined();
    // Exactly one atomic write
    expect(mem.getWriteCount()).toBe(1);
  });
});

// ============================================================ Section 34: Fingerprint Parity Test

describe('V2.6.2 — Fingerprint Parity (individual vs batch)', () => {
  it('individual published fingerprint equals batch published fingerprint for same draft', () => {
    const draft = makeDraft('action_fp_test');

    // Individual publish
    const individualRegistry = publishEntry(emptyRegistry(), draft);
    const individualFp = individualRegistry.actions['action_fp_test']?.fingerprint;

    // Batch publish via in-memory IO
    const mem = createMemoryRegistryIo(emptyRegistry());
    const body = JSON.stringify({ drafts: [draft] });
    const result = handlePublishAllPresetsRequest(body, mem.io);
    expect(result.ok).toBe(true);
    const batchFp = result.registry!.actions['action_fp_test']?.fingerprint;

    expect(individualFp).toBe(batchFp);
    expect(mem.getWriteCount()).toBe(1);
  });
});

// ============================================================ Section 35: UI Tests

describe('V2.6.2 — Batch Publish UI', () => {
  let dispose: () => void = () => {};
  let origFetch: typeof fetch = () => Promise.resolve({ ok: false } as Response);

  function q<T extends Element = HTMLElement>(selector: string): T | null {
    const root = document.getElementById('r2c-vfx-composer');
    return root?.querySelector<T>(selector) ?? null;
  }

  function qBody<T extends Element = HTMLElement>(selector: string): T | null {
    return document.body.querySelector<T>(selector);
  }

  function click(el: Element | null | undefined): void {
    (el as HTMLElement | null | undefined)?.dispatchEvent(new Event('click', { bubbles: true }));
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.textContent = '';
    document.head.textContent = '';
    origFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/dev/vfx-runtime-status/')) {
        return { ok: true, json: async () => ({ ok: true, exists: true, isPng: true }) } as unknown as Response;
      }
      if (init?.method === 'HEAD') return { ok: true } as Response;
      if (typeof url === 'string' && url.includes('/dev/vfx-publish-all-presets')) {
        const body = JSON.parse(init?.body as string);
        return {
          ok: true,
          json: async () => ({
            ok: true,
            registry: { schemaVersion: 1, actions: {} },
            published: body.drafts.map((d: { actionKey: string }) => d.actionKey),
            updated: [],
            unchanged: [],
            publishedCount: body.drafts.length,
            updatedCount: 0,
            unchangedCount: 0,
          }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
    }) as typeof fetch;
    dispose = installVfxComposerPanel({ enabled: true });
  });

  afterEach(() => {
    dispose();
    localStorage.clear();
    globalThis.fetch = origFetch;
  });

  it('PUBLISH ALL SAVED button exists', () => {
    expect(q('.cmp-publish-all')).not.toBeNull();
  });

  it('SAVE DRAFT marks current draft READY', () => {
    // Click SAVE DRAFT
    click(q('.cmp-save-draft'));
    const badge = q('.cmp-saved-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('SAVED / READY FOR BATCH');
  });

  it('before SAVE DRAFT, status shows NOT SAVED FOR BATCH', () => {
    const badge = q('.cmp-saved-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('NOT SAVED FOR BATCH');
  });

  it('clicking PUBLISH ALL SAVED opens dialog', () => {
    click(q('.cmp-publish-all'));
    expect(qBody('.cmp-batch-dialog')).not.toBeNull();
  });

  it('CANCEL closes dialog without changes', () => {
    click(q('.cmp-publish-all'));
    expect(qBody('.cmp-batch-dialog')).not.toBeNull();
    const cancelBtn = qBody('.cmp-batch-dialog .cmp-cancel')!;
    click(cancelBtn);
    expect(qBody('.cmp-batch-dialog')).toBeNull();
  });

  it('dialog displays counts', () => {
    // Save a draft first so there's something to show
    click(q('.cmp-save-draft'));
    click(q('.cmp-publish-all'));
    const dialog = qBody('.cmp-batch-dialog');
    expect(dialog).not.toBeNull();
    const text = dialog?.textContent ?? '';
    expect(text).toContain('New publications:');
    expect(text).toContain('Updates:');
    expect(text).toContain('Already published:');
    expect(text).toContain('Modified since save:');
    expect(text).toContain('Not explicitly saved:');
    expect(text).toContain('Blocked:');
  });

  it('empty batch shows "Nothing to publish"', () => {
    click(q('.cmp-publish-all'));
    const dialog = qBody('.cmp-batch-dialog');
    expect(dialog).not.toBeNull();
    // With no drafts saved, should show "Nothing to publish"
    const text = dialog?.textContent ?? '';
    expect(text).toContain('Nothing to publish');
  });
});
