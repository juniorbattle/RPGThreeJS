// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  type VfxPresetDraft,
  type VfxNativeCadence,
} from './VfxPresetComposer';
import {
  publishedEntryToDraft,
  draftToPublishedEntry,
  publishEntry,
  type PublishedVfxRegistry,
  PUBLISHED_REGISTRY_SCHEMA_VERSION,
} from './PublishedVfxRegistry';
import {
  isActionPublished,
  resolveActionVfxPresetId,
  getPublishedDraft,
  getActiveRegistry,
  __devUpdateOverlay,
  __devClearOverlay,
} from './PublishedVfxResolver';

// Mock cadence for parity tests
const CADENCE_64F_2120: VfxNativeCadence = { frameCount: 64, frameDurationMs: 2120 / 64 };
const CADENCE_16F_520: VfxNativeCadence = { frameCount: 16, frameDurationMs: 520 / 16 };
const CADENCE_64F_2640: VfxNativeCadence = { frameCount: 64, frameDurationMs: 2640 / 64 };

const mockGetCadence = (candidateId: string): VfxNativeCadence | null => {
  if (candidateId === 'r1_0489') return CADENCE_64F_2120;
  if (candidateId === 'r1_2561') return CADENCE_16F_520;
  if (candidateId === 'r1_0545') return CADENCE_64F_2120;
  if (candidateId === 'r1_1605') return CADENCE_64F_2640;
  return null;
};

function makeDraft(
  actionKey: string,
  candidateId: string,
  size: 'LOW' | 'MID' | 'BIG' | 'GIGA',
  timing: 'QUICK' | 'NORMAL' | 'LONG',
): VfxPresetDraft {
  return {
    actionKey,
    presetId: `composer_${actionKey}`,
    visualSlots: [createVisualSlot(candidateId, { sizeProfile: size, timingProfile: timing, placementProfile: 'TARGET' })],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
  };
}

function emptyRegistry(): PublishedVfxRegistry {
  return { schemaVersion: PUBLISHED_REGISTRY_SCHEMA_VERSION, actions: {} };
}

// ============================================================ Semantic Parity

describe('R2C-VFX V2.3 — Semantic Timing Parity (Composer == Published)', () => {
  it('70. 64f 2120ms reference: QUICK ~0.74s', () => {
    const draft = makeDraft('test_action', 'r1_0489', 'MID', 'QUICK');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(0.74, 1);
  });

  it('71. 64f 2120ms reference: NORMAL ~1.27s', () => {
    const draft = makeDraft('test_action', 'r1_0489', 'MID', 'NORMAL');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(1.27, 1);
  });

  it('72. 64f 2120ms reference: LONG ~2.12s', () => {
    const draft = makeDraft('test_action', 'r1_0489', 'MID', 'LONG');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(2.12, 1);
  });

  it('73. 16f 520ms reference: QUICK 0.40s (floored)', () => {
    const draft = makeDraft('test_action', 'r1_2561', 'MID', 'QUICK');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBe(0.40);
  });

  it('74. 16f 520ms reference: NORMAL 0.65s (floored)', () => {
    const draft = makeDraft('test_action', 'r1_2561', 'MID', 'NORMAL');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBe(0.65);
  });

  it('75. 16f 520ms reference: LONG 1.00s (floored)', () => {
    const draft = makeDraft('test_action', 'r1_2561', 'MID', 'LONG');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBe(1.00);
  });

  it('76. 64f 2640ms reference: QUICK ~0.92s', () => {
    const draft = makeDraft('test_action', 'r1_1605', 'MID', 'QUICK');
    const composerCompiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    const publishedDraft = publishedEntryToDraft(draftToPublishedEntry(draft));
    const publishedCompiled = compileDraft(publishedDraft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(composerCompiled.slots[0]?.duration ?? 0, 5);
    expect(publishedCompiled.slots[0]?.duration).toBeCloseTo(0.92, 1);
  });
});

// ============================================================ Size Parity

describe('R2C-VFX V2.3 — Semantic Size Parity', () => {
  it('80. LOW resolves to 1.80', () => {
    const draft = makeDraft('test', 'r1_0489', 'LOW', 'QUICK');
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(compiled.slots[0]?.finalDisplayHeight).toBeCloseTo(1.80, 5);
  });

  it('81. MID resolves to 2.50', () => {
    const draft = makeDraft('test', 'r1_0489', 'MID', 'QUICK');
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(compiled.slots[0]?.finalDisplayHeight).toBeCloseTo(2.50, 5);
  });

  it('82. BIG resolves to 3.40', () => {
    const draft = makeDraft('test', 'r1_0489', 'BIG', 'QUICK');
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(compiled.slots[0]?.finalDisplayHeight).toBeCloseTo(3.40, 5);
  });

  it('83. GIGA resolves to 5.50', () => {
    const draft = makeDraft('test', 'r1_0489', 'GIGA', 'QUICK');
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: mockGetCadence });
    expect(compiled.slots[0]?.finalDisplayHeight).toBeCloseTo(5.50, 5);
  });
});

// ============================================================ Resolver Tests

describe('R2C-VFX V2.3 — Action Override Resolver', () => {
  it('90. resolveActionVfxPresetId returns published_ when published', () => {
    __devClearOverlay();
    const draft = makeDraft('basic_crosier_hit', 'r1_0489', 'LOW', 'QUICK');
    const registry = publishEntry(emptyRegistry(), draft);
    __devUpdateOverlay(registry);
    expect(resolveActionVfxPresetId('basic_crosier_hit', 'basic_crosier_hit')).toBe('published_basic_crosier_hit');
    __devClearOverlay();
  });

  it('91. resolveActionVfxPresetId returns static fallback when not published', () => {
    __devClearOverlay();
    expect(resolveActionVfxPresetId('basic_crosier_hit', 'basic_crosier_hit')).toBe('basic_crosier_hit');
  });

  it('92. isActionPublished returns true for published action', () => {
    __devClearOverlay();
    const draft = makeDraft('basic_crosier_hit', 'r1_0489', 'LOW', 'QUICK');
    const registry = publishEntry(emptyRegistry(), draft);
    __devUpdateOverlay(registry);
    expect(isActionPublished('basic_crosier_hit')).toBe(true);
    __devClearOverlay();
  });

  it('93. isActionPublished returns false for unpublished action', () => {
    __devClearOverlay();
    expect(isActionPublished('basic_crosier_hit')).toBe(false);
  });

  it('94. getPublishedDraft returns draft for published action', () => {
    __devClearOverlay();
    const draft = makeDraft('basic_crosier_hit', 'r1_0489', 'LOW', 'QUICK');
    const registry = publishEntry(emptyRegistry(), draft);
    __devUpdateOverlay(registry);
    const publishedDraft = getPublishedDraft('basic_crosier_hit');
    expect(publishedDraft).not.toBeNull();
    expect(publishedDraft?.actionKey).toBe('basic_crosier_hit');
    expect(publishedDraft?.visualSlots[0]?.candidateId).toBe('r1_0489');
    __devClearOverlay();
  });

  it('95. getPublishedDraft returns null for unpublished action', () => {
    __devClearOverlay();
    expect(getPublishedDraft('basic_crosier_hit')).toBeNull();
  });

  it('96. dev overlay takes priority over durable registry', () => {
    __devClearOverlay();
    const draft = makeDraft('basic_crosier_hit', 'r1_0489', 'LOW', 'QUICK');
    const overlayRegistry = publishEntry(emptyRegistry(), draft);
    __devUpdateOverlay(overlayRegistry);
    expect(isActionPublished('basic_crosier_hit')).toBe(true);
    __devClearOverlay();
    // After clearing overlay, should fall back to durable (empty)
    expect(isActionPublished('basic_crosier_hit')).toBe(false);
  });
});
