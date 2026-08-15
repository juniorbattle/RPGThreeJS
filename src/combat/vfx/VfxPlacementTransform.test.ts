import { describe, it, expect } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  resolvePlacement,
  resolvePivotCenter,
  resolveMirrorSigns,
  resolveRotationRadians,
  VFX_PLACEMENT_PROFILES,
  VFX_AIM_PROFILES,
  VFX_MIRROR_PROFILES,
  VFX_PIVOT_PROFILES,
  DEFAULT_AIM_PROFILE,
  DEFAULT_ROTATION_DEGREES,
  DEFAULT_MIRROR_PROFILE,
  DEFAULT_PIVOT_PROFILE,
  type VfxPresetDraft,
  type VfxPlacementProfile,
  type VfxAimProfile,
  type VfxMirrorProfile,
  type VfxPivotProfile,
} from './VfxPresetComposer';
import {
  computeFingerprint,
  validatePublishedEntry,
  draftToPublishedEntry,
  publishedEntryToDraft,
  type PublishedVfxEntry,
} from './PublishedVfxRegistry';

// ============================================================ Helpers

function makeDraft(overrides: Partial<VfxPresetDraft> = {}): VfxPresetDraft {
  return {
    actionKey: 'test_action',
    presetId: 'composer_test_action',
    visualSlots: [createVisualSlot('r1_0001')],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
    ...overrides,
  };
}

function makeSlotWithTransform(
  placement: VfxPlacementProfile,
  transform: {
    aim?: VfxAimProfile;
    rotation?: number;
    mirror?: VfxMirrorProfile;
    pivot?: VfxPivotProfile;
  } = {},
) {
  return createVisualSlot('r1_0001', {
    placementProfile: placement,
    ...(transform.aim ? { aimProfile: transform.aim } : {}),
    ...(transform.rotation != null ? { rotationDegrees: transform.rotation } : {}),
    ...(transform.mirror ? { mirrorProfile: transform.mirror } : {}),
    ...(transform.pivot ? { pivotProfile: transform.pivot } : {}),
  });
}

const NOOP_CADENCE = () => ({ frameCount: 16, frameDurationMs: 40 });

// ============================================================ Placement Tests

describe('V2.4 Placement Profiles', () => {
  it('VFX_PLACEMENT_PROFILES includes FRONT, BACK, TOP', () => {
    expect(VFX_PLACEMENT_PROFILES).toContain('FRONT');
    expect(VFX_PLACEMENT_PROFILES).toContain('BACK');
    expect(VFX_PLACEMENT_PROFILES).toContain('TOP');
    expect(VFX_PLACEMENT_PROFILES).toContain('AUTO');
    expect(VFX_PLACEMENT_PROFILES).toContain('TARGET');
    expect(VFX_PLACEMENT_PROFILES).toContain('CASTER');
    expect(VFX_PLACEMENT_PROFILES).toContain('GROUND');
  });

  it('TARGET placement resolves to target anchor', () => {
    const p = resolvePlacement('TARGET');
    expect(p.anchor).toBe('target');
  });

  it('FRONT placement resolves to targetFront anchor', () => {
    const p = resolvePlacement('FRONT');
    expect(p.anchor).toBe('targetFront');
  });

  it('BACK placement resolves to targetBack anchor', () => {
    const p = resolvePlacement('BACK');
    expect(p.anchor).toBe('targetBack');
  });

  it('TOP placement resolves to targetTop anchor', () => {
    const p = resolvePlacement('TOP');
    expect(p.anchor).toBe('targetTop');
  });

  it('CASTER placement resolves to source anchor', () => {
    const p = resolvePlacement('CASTER');
    expect(p.anchor).toBe('source');
  });

  it('GROUND placement resolves to groundTarget anchor', () => {
    const p = resolvePlacement('GROUND');
    expect(p.anchor).toBe('groundTarget');
  });

  it('AUTO placement falls back to TARGET when no hint', () => {
    const p = resolvePlacement('AUTO');
    expect(p.anchor).toBe('target');
  });

  it('AUTO placement uses hint when provided', () => {
    const p = resolvePlacement('AUTO', 'FRONT');
    expect(p.anchor).toBe('targetFront');
  });
});

// ============================================================ Transform Resolution Tests

describe('V2.4 Transform Resolution', () => {
  it('resolvePivotCenter CENTER returns (0.5, 0.5)', () => {
    const c = resolvePivotCenter('CENTER');
    expect(c.x).toBe(0.5);
    expect(c.y).toBe(0.5);
  });

  it('resolvePivotCenter LEFT returns (0.0, 0.5)', () => {
    const c = resolvePivotCenter('LEFT');
    expect(c.x).toBe(0.0);
    expect(c.y).toBe(0.5);
  });

  it('resolvePivotCenter RIGHT returns (1.0, 0.5)', () => {
    const c = resolvePivotCenter('RIGHT');
    expect(c.x).toBe(1.0);
    expect(c.y).toBe(0.5);
  });

  it('resolvePivotCenter TOP returns (0.5, 1.0)', () => {
    const c = resolvePivotCenter('TOP');
    expect(c.x).toBe(0.5);
    expect(c.y).toBe(1.0);
  });

  it('resolvePivotCenter BOTTOM returns (0.5, 0.0)', () => {
    const c = resolvePivotCenter('BOTTOM');
    expect(c.x).toBe(0.5);
    expect(c.y).toBe(0.0);
  });

  it('resolveMirrorSigns NONE returns (1, 1)', () => {
    const s = resolveMirrorSigns('NONE');
    expect(s.mirrorX).toBe(1);
    expect(s.mirrorY).toBe(1);
  });

  it('resolveMirrorSigns HORIZONTAL returns (-1, 1)', () => {
    const s = resolveMirrorSigns('HORIZONTAL');
    expect(s.mirrorX).toBe(-1);
    expect(s.mirrorY).toBe(1);
  });

  it('resolveMirrorSigns VERTICAL returns (1, -1)', () => {
    const s = resolveMirrorSigns('VERTICAL');
    expect(s.mirrorX).toBe(1);
    expect(s.mirrorY).toBe(-1);
  });

  it('resolveMirrorSigns BOTH returns (-1, -1)', () => {
    const s = resolveMirrorSigns('BOTH');
    expect(s.mirrorX).toBe(-1);
    expect(s.mirrorY).toBe(-1);
  });

  it('resolveMirrorSigns AUTO_HORIZONTAL returns (1, 1) as base (runtime decides)', () => {
    const s = resolveMirrorSigns('AUTO_HORIZONTAL');
    expect(s.mirrorX).toBe(1);
    expect(s.mirrorY).toBe(1);
  });

  it('resolveRotationRadians converts degrees to radians', () => {
    expect(resolveRotationRadians('FIXED', 90)).toBeCloseTo(Math.PI / 2);
    expect(resolveRotationRadians('FIXED', -90)).toBeCloseTo(-Math.PI / 2);
    expect(resolveRotationRadians('FIXED', 0)).toBe(0);
    expect(resolveRotationRadians('FIXED', 180)).toBeCloseTo(Math.PI);
    expect(resolveRotationRadians('FIXED', 45)).toBeCloseTo(Math.PI / 4);
    expect(resolveRotationRadians('FIXED', -45)).toBeCloseTo(-Math.PI / 4);
  });

  it('resolveRotationRadians for TO_TARGET also converts degrees to radians (offset)', () => {
    expect(resolveRotationRadians('TO_TARGET', 45)).toBeCloseTo(Math.PI / 4);
    expect(resolveRotationRadians('TO_TARGET', 0)).toBe(0);
  });
});

// ============================================================ Compilation Tests

describe('V2.4 Compilation with Transforms', () => {
  it('compileDraft includes transform fields with defaults', () => {
    const draft = makeDraft();
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(slot.aimProfile).toBe(DEFAULT_AIM_PROFILE);
    expect(slot.rotation).toBe(0);
    expect(slot.mirrorX).toBe(1);
    expect(slot.mirrorY).toBe(1);
    expect(slot.pivotCenterX).toBe(0.5);
    expect(slot.pivotCenterY).toBe(0.5);
  });

  it('compileDraft resolves aim TO_TARGET', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { aim: 'TO_TARGET' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.aimProfile).toBe('TO_TARGET');
  });

  it('compileDraft resolves rotation 90 degrees', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { rotation: 90 })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.rotation).toBeCloseTo(Math.PI / 2);
  });

  it('compileDraft resolves mirror HORIZONTAL', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'HORIZONTAL' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.mirrorX).toBe(-1);
    expect(compiled.slots[0]!.mirrorY).toBe(1);
  });

  it('compileDraft resolves mirror VERTICAL', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'VERTICAL' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.mirrorX).toBe(1);
    expect(compiled.slots[0]!.mirrorY).toBe(-1);
  });

  it('compileDraft resolves mirror BOTH', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'BOTH' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.mirrorX).toBe(-1);
    expect(compiled.slots[0]!.mirrorY).toBe(-1);
  });

  it('compileDraft resolves pivot LEFT', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { pivot: 'LEFT' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.pivotCenterX).toBe(0.0);
    expect(compiled.slots[0]!.pivotCenterY).toBe(0.5);
  });

  it('compileDraft resolves pivot BOTTOM', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { pivot: 'BOTTOM' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.pivotCenterX).toBe(0.5);
    expect(compiled.slots[0]!.pivotCenterY).toBe(0.0);
  });

  it('compileDraft resolves FRONT placement to targetFront anchor', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('FRONT')],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('targetFront');
  });

  it('compileDraft resolves BACK placement to targetBack anchor', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('BACK')],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('targetBack');
  });

  it('compileDraft resolves TOP placement to targetTop anchor', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TOP')],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('targetTop');
  });
});

// ============================================================ Fingerprint Tests

describe('V2.4 Fingerprint Transform Awareness', () => {
  it('fingerprint changes when aim changes', () => {
    const d1 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { aim: 'FIXED' })] });
    const d2 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { aim: 'TO_TARGET' })] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when rotation changes', () => {
    const d1 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { rotation: 0 })] });
    const d2 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { rotation: 90 })] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when mirror changes', () => {
    const d1 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'NONE' })] });
    const d2 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'HORIZONTAL' })] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when pivot changes', () => {
    const d1 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { pivot: 'CENTER' })] });
    const d2 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET', { pivot: 'LEFT' })] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when placement changes', () => {
    const d1 = makeDraft({ visualSlots: [makeSlotWithTransform('TARGET')] });
    const d2 = makeDraft({ visualSlots: [makeSlotWithTransform('FRONT')] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('default transforms fingerprint equivalence — old slot without transforms == new slot with defaults', () => {
    const oldSlot = createVisualSlot('r1_0001', { placementProfile: 'TARGET' });
    const newSlot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      aimProfile: DEFAULT_AIM_PROFILE,
      rotationDegrees: DEFAULT_ROTATION_DEGREES,
      mirrorProfile: DEFAULT_MIRROR_PROFILE,
      pivotProfile: DEFAULT_PIVOT_PROFILE,
    });
    const d1 = makeDraft({ visualSlots: [oldSlot] });
    const d2 = makeDraft({ visualSlots: [newSlot] });
    expect(computeFingerprint(d1)).toBe(computeFingerprint(d2));
  });
});

// ============================================================ Backward Compatibility Tests

describe('V2.4 Backward Compatibility', () => {
  it('old draft without transform fields loads with safe defaults', () => {
    const oldDraft: VfxPresetDraft = {
      actionKey: 'old_action',
      presetId: 'composer_old_action',
      visualSlots: [{
        id: 'slot_1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compileDraft(oldDraft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.aimProfile).toBe(DEFAULT_AIM_PROFILE);
    expect(compiled.slots[0]!.rotation).toBe(0);
    expect(compiled.slots[0]!.mirrorX).toBe(1);
    expect(compiled.slots[0]!.mirrorY).toBe(1);
    expect(compiled.slots[0]!.pivotCenterX).toBe(0.5);
    expect(compiled.slots[0]!.pivotCenterY).toBe(0.5);
  });

  it('old published entry without transform fields remains valid', () => {
    const oldEntry: PublishedVfxEntry = {
      actionKey: 'old_published',
      presetId: 'published_old_published',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 'slot_1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const result = validatePublishedEntry(oldEntry);
    expect(result.ok).toBe(true);
  });

  it('published entry with transform fields validates correctly', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'transform_action',
      presetId: 'published_transform_action',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 'slot_1',
        candidateId: 'r1_0001',
        sizeProfile: 'BIG',
        timingProfile: 'LONG',
        placementProfile: 'FRONT',
        aimProfile: 'TO_TARGET',
        rotationDegrees: 45,
        mirrorProfile: 'AUTO_HORIZONTAL',
        pivotProfile: 'LEFT',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(true);
  });

  it('published entry with invalid aimProfile fails validation', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'bad_aim',
      presetId: 'published_bad_aim',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 'slot_1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
        aimProfile: 'INVALID' as VfxAimProfile,
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
  });

  it('draftToPublishedEntry preserves transform fields', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('FRONT', { aim: 'TO_TARGET', rotation: 45, mirror: 'HORIZONTAL', pivot: 'LEFT' })],
    });
    const entry = draftToPublishedEntry(draft);
    expect(entry.visualSlots[0]!.aimProfile).toBe('TO_TARGET');
    expect(entry.visualSlots[0]!.rotationDegrees).toBe(45);
    expect(entry.visualSlots[0]!.mirrorProfile).toBe('HORIZONTAL');
    expect(entry.visualSlots[0]!.pivotProfile).toBe('LEFT');
    expect(entry.visualSlots[0]!.placementProfile).toBe('FRONT');
  });

  it('publishedEntryToDraft preserves transform fields', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('BACK', { aim: 'TO_TARGET', rotation: -45, mirror: 'BOTH', pivot: 'RIGHT' })],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    expect(restored.visualSlots[0]!.aimProfile).toBe('TO_TARGET');
    expect(restored.visualSlots[0]!.rotationDegrees).toBe(-45);
    expect(restored.visualSlots[0]!.mirrorProfile).toBe('BOTH');
    expect(restored.visualSlots[0]!.pivotProfile).toBe('RIGHT');
    expect(restored.visualSlots[0]!.placementProfile).toBe('BACK');
  });
});

// ============================================================ Composer/Published Compile Parity

describe('V2.4 Composer/Published Compile Parity', () => {
  it('draft and published-entry-to-draft produce identical compiled transforms', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('FRONT', { aim: 'TO_TARGET', rotation: 90, mirror: 'AUTO_HORIZONTAL', pivot: 'LEFT' })],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const c1 = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const c2 = compileDraft(restored, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const s1 = c1.slots[0]!;
    const s2 = c2.slots[0]!;
    expect(s1.aimProfile).toBe(s2.aimProfile);
    expect(s1.rotation).toBe(s2.rotation);
    expect(s1.mirrorX).toBe(s2.mirrorX);
    expect(s1.mirrorY).toBe(s2.mirrorY);
    expect(s1.pivotCenterX).toBe(s2.pivotCenterX);
    expect(s1.pivotCenterY).toBe(s2.pivotCenterY);
    expect(s1.anchor).toBe(s2.anchor);
  });
});
