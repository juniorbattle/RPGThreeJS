// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import {
  computeFingerprint,
  draftToPublishedEntry,
  publishedPresetId,
  publishEntry,
  unpublishEntry,
  getPublishedEntry,
  compareFingerprint,
  serializeRegistry,
  validatePublishedEntry,
  validatePublishedRegistry,
  PUBLISHED_REGISTRY_SCHEMA_VERSION,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import {
  createVisualSlot,
  type VfxPresetDraft,
  type VfxSizeProfile,
  type VfxTimingProfile,
  type VfxPlacementProfile,
} from './VfxPresetComposer';

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

function makeRegistry(actions: Record<string, unknown> = {}): PublishedVfxRegistry {
  return { schemaVersion: PUBLISHED_REGISTRY_SCHEMA_VERSION, actions: actions as PublishedVfxRegistry['actions'] };
}

// ============================================================ Registry Tests

describe('R2C-VFX V2.3 — Published VFX Registry', () => {
  describe('empty registry / static fallback', () => {
    it('1. empty registry returns null for any actionKey', () => {
      const registry = makeRegistry();
      expect(getPublishedEntry(registry, 'basic_crosier_hit')).toBeNull();
      expect(getPublishedEntry(registry, 'w_break_guard')).toBeNull();
    });

    it('2. compareFingerprint returns not_published for empty registry', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      expect(compareFingerprint(registry, draft)).toBe('not_published');
    });

    it('3. validatePublishedRegistry accepts empty registry', () => {
      const registry = makeRegistry();
      const result = validatePublishedRegistry(registry);
      expect(result.ok).toBe(true);
    });
  });

  describe('single published action', () => {
    it('4. publishEntry adds the action to the registry', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      const updated = publishEntry(registry, draft);
      expect(getPublishedEntry(updated, 'basic_crosier_hit')).not.toBeNull();
      expect(getPublishedEntry(updated, 'basic_crosier_hit')?.presetId).toBe('published_basic_crosier_hit');
    });

    it('5. compareFingerprint returns published after publishing', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      const updated = publishEntry(registry, draft);
      expect(compareFingerprint(updated, draft)).toBe('published');
    });

    it('6. original registry is not mutated by publishEntry', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      publishEntry(registry, draft);
      expect(getPublishedEntry(registry, 'basic_crosier_hit')).toBeNull();
    });
  });

  describe('unpublish', () => {
    it('7. unpublishEntry removes the action from the registry', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      const published = publishEntry(registry, draft);
      const unpublished = unpublishEntry(published, 'basic_crosier_hit');
      expect(getPublishedEntry(unpublished, 'basic_crosier_hit')).toBeNull();
    });

    it('8. unpublishEntry on non-existent action is a no-op', () => {
      const registry = makeRegistry();
      const result = unpublishEntry(registry, 'nonexistent');
      expect(result).toBe(registry);
    });

    it('9. static fallback restored after unpublish', () => {
      const registry = makeRegistry();
      const draft = makeDraft('basic_crosier_hit');
      const published = publishEntry(registry, draft);
      const unpublished = unpublishEntry(published, 'basic_crosier_hit');
      expect(compareFingerprint(unpublished, draft)).toBe('not_published');
    });
  });

  describe('two actions / independent dedicated IDs', () => {
    it('10. publishing action A does not affect action B', () => {
      const registry = makeRegistry();
      const draftA = makeDraft('basic_crosier_hit');
      const draftB = makeDraft('w_break_guard');
      let registry_ = publishEntry(registry, draftA);
      registry_ = publishEntry(registry_, draftB);
      expect(getPublishedEntry(registry_, 'basic_crosier_hit')?.presetId).toBe('published_basic_crosier_hit');
      expect(getPublishedEntry(registry_, 'w_break_guard')?.presetId).toBe('published_w_break_guard');
    });

    it('11. unpublishing action A leaves action B intact', () => {
      const registry = makeRegistry();
      const draftA = makeDraft('basic_crosier_hit');
      const draftB = makeDraft('w_break_guard');
      let registry_ = publishEntry(registry, draftA);
      registry_ = publishEntry(registry_, draftB);
      registry_ = unpublishEntry(registry_, 'basic_crosier_hit');
      expect(getPublishedEntry(registry_, 'basic_crosier_hit')).toBeNull();
      expect(getPublishedEntry(registry_, 'w_break_guard')).not.toBeNull();
    });
  });

  describe('shared static preset isolation', () => {
    it('12. two actions sharing sword_slash get independent published IDs', () => {
      const draftA = makeDraft('w_break_guard', { visualSlots: [createVisualSlot('r1_0489')] });
      const draftB = makeDraft('d_cursed_blade', { visualSlots: [createVisualSlot('r1_0489')] });
      const registry = makeRegistry();
      let registry_ = publishEntry(registry, draftA);
      registry_ = publishEntry(registry_, draftB);
      const entryA = getPublishedEntry(registry_, 'w_break_guard');
      const entryB = getPublishedEntry(registry_, 'd_cursed_blade');
      expect(entryA?.presetId).toBe('published_w_break_guard');
      expect(entryB?.presetId).toBe('published_d_cursed_blade');
      expect(entryA?.presetId).not.toBe(entryB?.presetId);
    });
  });
});

// ============================================================ Fingerprint Tests

describe('R2C-VFX V2.3 — Fingerprint', () => {
  it('20. same semantic draft produces same fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit');
    const draft2 = makeDraft('basic_crosier_hit');
    expect(computeFingerprint(draft1)).toBe(computeFingerprint(draft2));
  });

  it('21. updatedAt change does NOT change fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { updatedAt: 1000 });
    const draft2 = makeDraft('basic_crosier_hit', { updatedAt: 2000 });
    expect(computeFingerprint(draft1)).toBe(computeFingerprint(draft2));
  });

  it('22. candidate change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489')] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_1605')] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('23. slot order change produces different fingerprint', () => {
    const slot1 = createVisualSlot('r1_0489');
    const slot2 = createVisualSlot('r1_1605');
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [slot1, slot2] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [slot2, slot1] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('24. SIZE change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { sizeProfile: 'LOW' })] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { sizeProfile: 'GIGA' })] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('25. TIMING change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { timingProfile: 'QUICK' })] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { timingProfile: 'LONG' })] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('26. PLACEMENT change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { placementProfile: 'TARGET' })] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { placementProfile: 'CASTER' })] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('27. choreography change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { choreography: 'TOGETHER' });
    const draft2 = makeDraft('basic_crosier_hit', { choreography: 'SEQUENCE' });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('28. technical polish change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { technicalPolish: 'OFF' });
    const draft2 = makeDraft('basic_crosier_hit', { technicalPolish: 'STRONG' });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('29. advanced override change produces different fingerprint', () => {
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { advanced: { scale: 1.5 } })] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { advanced: { scale: 2.0 } })] });
    expect(computeFingerprint(draft1)).not.toBe(computeFingerprint(draft2));
  });

  it('30. fingerprint is 8-char hex string', () => {
    const draft = makeDraft('basic_crosier_hit');
    const fp = computeFingerprint(draft);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ============================================================ Validation Tests

describe('R2C-VFX V2.3 — Publish Transaction Validation', () => {
  it('40. valid publish entry passes validation', () => {
    const draft = makeDraft('basic_crosier_hit');
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(true);
  });

  it('41. invalid candidate (non-r1 format) is rejected', () => {
    const draft = makeDraft('basic_crosier_hit', {
      visualSlots: [{ id: 'slot_1', candidateId: 'invalid_id', sizeProfile: 'LOW', timingProfile: 'QUICK', placementProfile: 'TARGET' }],
    });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('candidateId'))).toBe(true);
  });

  it('42. invalid timing profile is rejected', () => {
    const draft = makeDraft('basic_crosier_hit', {
      visualSlots: [{ id: 'slot_1', candidateId: 'r1_0489', sizeProfile: 'LOW', timingProfile: 'INVALID' as unknown as VfxTimingProfile, placementProfile: 'TARGET' }],
    });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('timingProfile'))).toBe(true);
  });

  it('43. invalid size profile is rejected', () => {
    const draft = makeDraft('basic_crosier_hit', {
      visualSlots: [{ id: 'slot_1', candidateId: 'r1_0489', sizeProfile: 'HUGE' as unknown as VfxSizeProfile, timingProfile: 'QUICK', placementProfile: 'TARGET' }],
    });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('sizeProfile'))).toBe(true);
  });

  it('44. empty visualSlots is rejected', () => {
    const draft = makeDraft('basic_crosier_hit', { visualSlots: [] });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('visualSlots'))).toBe(true);
  });

  it('45. duplicate action replace only same action entry', () => {
    const registry = makeRegistry();
    const draft1 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_0489', { sizeProfile: 'LOW' })] });
    const draft2 = makeDraft('basic_crosier_hit', { visualSlots: [createVisualSlot('r1_1605', { sizeProfile: 'GIGA' })] });
    let registry_ = publishEntry(registry, draft1);
    const fp1 = getPublishedEntry(registry_, 'basic_crosier_hit')?.fingerprint;
    registry_ = publishEntry(registry_, draft2);
    const entry = getPublishedEntry(registry_, 'basic_crosier_hit');
    expect(entry?.fingerprint).not.toBe(fp1);
    expect(entry?.visualSlots[0]?.candidateId).toBe('r1_1605');
  });

  it('46. candidateExists callback rejects unknown candidate', () => {
    const draft = makeDraft('basic_crosier_hit', {
      visualSlots: [{ id: 'slot_1', candidateId: 'r1_9999', sizeProfile: 'LOW', timingProfile: 'QUICK', placementProfile: 'TARGET' }],
    });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry, {
      candidateExists: (id) => id !== 'r1_9999',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('not found'))).toBe(true);
  });

  it('47. isSupportedFormat callback rejects unsupported candidate', () => {
    const draft = makeDraft('basic_crosier_hit', {
      visualSlots: [{ id: 'slot_1', candidateId: 'r1_0573', sizeProfile: 'LOW', timingProfile: 'QUICK', placementProfile: 'TARGET' }],
    });
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry, {
      isSupportedFormat: (id) => id !== 'r1_0573',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('unsupported'))).toBe(true);
  });

  it('48. serializeRegistry produces deterministic JSON with sorted keys', () => {
    const registry = makeRegistry();
    const draftB = makeDraft('w_break_guard');
    const draftA = makeDraft('basic_crosier_hit');
    let registry_ = publishEntry(registry, draftB);
    registry_ = publishEntry(registry_, draftA);
    const serialized = serializeRegistry(registry_);
    const parsed = JSON.parse(serialized);
    const keys = Object.keys(parsed.actions);
    expect(keys).toEqual(['basic_crosier_hit', 'w_break_guard']);
  });
});

// ============================================================ Published Preset ID Tests

describe('R2C-VFX V2.3 — Published Preset ID', () => {
  it('60. publishedPresetId is deterministic', () => {
    expect(publishedPresetId('basic_crosier_hit')).toBe('published_basic_crosier_hit');
    expect(publishedPresetId('w_break_guard')).toBe('published_w_break_guard');
    expect(publishedPresetId('n_dark_bolt')).toBe('published_n_dark_bolt');
  });

  it('61. draftToPublishedEntry assigns correct presetId', () => {
    const draft = makeDraft('basic_crosier_hit');
    const entry = draftToPublishedEntry(draft);
    expect(entry.presetId).toBe('published_basic_crosier_hit');
  });

  it('62. draftToPublishedEntry strips updatedAt', () => {
    const draft = makeDraft('basic_crosier_hit', { updatedAt: 12345 });
    const entry = draftToPublishedEntry(draft);
    expect((entry as unknown as Record<string, unknown>).updatedAt).toBeUndefined();
  });
});
