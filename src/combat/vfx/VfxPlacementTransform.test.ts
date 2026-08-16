import { describe, it, expect } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  resolvePlacement,
  resolvePivotCenter,
  resolveMirrorSigns,
  resolveRotationRadians,
  resolveTravelAnchor,
  resolveSlotPositionMode,
  resolveSlotDirectionProfile,
  resolveSlotMirrorProfile,
  resolveSlotPhases,
  resolveSlotLocalImpactTime,
  resolveSlotImpactEvents,
  resolvePhaseStartTimes,
  choreographyToPhases,
  setSlotPhase,
  nudgeSlotPhase,
  materializeSlotPhases,
  setSlotPositionMode,
  toggleSlotImpactFx,
  setSlotImpactPower,
  clearSlotImpactFx,
  hasActiveImpactFx,
  usesSlotImpactFx,
  VFX_PLACEMENT_PROFILES,
  VFX_AIM_PROFILES,
  VFX_MIRROR_PROFILES,
  VFX_PIVOT_PROFILES,
  VFX_POSITION_MODES,
  VFX_TRAVEL_FROM_ENDPOINTS,
  VFX_TRAVEL_TO_ENDPOINTS,
  VFX_IMPACT_POWERS,
  DEFAULT_AIM_PROFILE,
  DEFAULT_ROTATION_DEGREES,
  DEFAULT_MIRROR_PROFILE,
  DEFAULT_PIVOT_PROFILE,
  DEFAULT_POSITION_MODE,
  DEFAULT_TRAVEL_FROM,
  DEFAULT_TRAVEL_TO,
  DEFAULT_PHASE,
  DEFAULT_IMPACT_POWER,
  MAX_PHASE,
  DEFAULT_TRAVEL_DIRECTION_PROFILE,
  DEFAULT_TRAVEL_MIRROR_PROFILE,
  type VfxPresetDraft,
  type VfxPlacementProfile,
  type VfxAimProfile,
  type VfxMirrorProfile,
  type VfxPivotProfile,
  type VfxPositionMode,
  type VfxTravelEndpoint,
  type VfxSlotImpactFx,
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

// ============================================================ V2.5 New Placement Profiles

describe('V2.5 New Placement Profiles', () => {
  it('BOTTOM resolves to targetBottom anchor', () => {
    expect(resolvePlacement('BOTTOM').anchor).toBe('targetBottom');
  });

  it('CASTER_FRONT resolves to sourceFront anchor', () => {
    expect(resolvePlacement('CASTER_FRONT').anchor).toBe('sourceFront');
  });

  it('CASTER_BACK resolves to sourceBack anchor', () => {
    expect(resolvePlacement('CASTER_BACK').anchor).toBe('sourceBack');
  });

  it('VFX_PLACEMENT_PROFILES includes BOTTOM, CASTER_FRONT, CASTER_BACK', () => {
    expect(VFX_PLACEMENT_PROFILES).toContain('BOTTOM');
    expect(VFX_PLACEMENT_PROFILES).toContain('CASTER_FRONT');
    expect(VFX_PLACEMENT_PROFILES).toContain('CASTER_BACK');
  });

  it('compileDraft resolves BOTTOM to targetBottom', () => {
    const draft = makeDraft({ visualSlots: [makeSlotWithTransform('BOTTOM')] });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('targetBottom');
  });

  it('compileDraft resolves CASTER_FRONT to sourceFront', () => {
    const draft = makeDraft({ visualSlots: [makeSlotWithTransform('CASTER_FRONT')] });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('sourceFront');
  });

  it('compileDraft resolves CASTER_BACK to sourceBack', () => {
    const draft = makeDraft({ visualSlots: [makeSlotWithTransform('CASTER_BACK')] });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.anchor).toBe('sourceBack');
  });
});

// ============================================================ V2.5 POSITION / TRAVEL

describe('V2.5 Position Model', () => {
  it('VFX_POSITION_MODES exposes FIXED and TRAVEL', () => {
    expect(VFX_POSITION_MODES).toEqual(['FIXED', 'TRAVEL']);
  });

  it('resolveSlotPositionMode defaults to FIXED when absent', () => {
    const slot = createVisualSlot('r1_0001');
    expect(resolveSlotPositionMode(slot)).toBe('FIXED');
  });

  it('resolveSlotPositionMode returns TRAVEL when set', () => {
    const slot = createVisualSlot('r1_0001', { positionMode: 'TRAVEL' });
    expect(resolveSlotPositionMode(slot)).toBe('TRAVEL');
  });

  it('resolveTravelAnchor maps all endpoints', () => {
    expect(resolveTravelAnchor('CASTER')).toBe('source');
    expect(resolveTravelAnchor('CASTER_FRONT')).toBe('sourceFront');
    expect(resolveTravelAnchor('CASTER_BACK')).toBe('sourceBack');
    expect(resolveTravelAnchor('TARGET')).toBe('target');
    expect(resolveTravelAnchor('FRONT')).toBe('targetFront');
    expect(resolveTravelAnchor('BACK')).toBe('targetBack');
    expect(resolveTravelAnchor('TOP')).toBe('targetTop');
    expect(resolveTravelAnchor('BOTTOM')).toBe('targetBottom');
    expect(resolveTravelAnchor('GROUND')).toBe('groundTarget');
    expect(resolveTravelAnchor('SKY')).toBe('sky');
  });

  it('SKY is only in FROM endpoints, not TO', () => {
    expect(VFX_TRAVEL_FROM_ENDPOINTS).toContain('SKY');
    expect(VFX_TRAVEL_TO_ENDPOINTS).not.toContain('SKY');
  });

  it('setSlotPositionMode seeds travel defaults on first TRAVEL', () => {
    const draft = makeDraft();
    const slotId = draft.visualSlots[0]!.id;
    const updated = setSlotPositionMode(draft, slotId, 'TRAVEL');
    const slot = updated.visualSlots[0]!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.travelFrom).toBe(DEFAULT_TRAVEL_FROM);
    expect(slot.travelTo).toBe(DEFAULT_TRAVEL_TO);
    expect(slot.aimProfile).toBe(DEFAULT_TRAVEL_DIRECTION_PROFILE);
    expect(slot.mirrorProfile).toBe(DEFAULT_TRAVEL_MIRROR_PROFILE);
  });

  it('setSlotPositionMode does not overwrite already-customized travel values', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL',
        travelFrom: 'SKY',
        travelTo: 'BACK',
        aimProfile: 'TO_TARGET',
        mirrorProfile: 'HORIZONTAL',
      })],
    });
    const slotId = draft.visualSlots[0]!.id;
    // Toggle to FIXED then back to TRAVEL
    const fixed = setSlotPositionMode(draft, slotId, 'FIXED');
    const reTravel = setSlotPositionMode(fixed, slotId, 'TRAVEL');
    const slot = reTravel.visualSlots[0]!;
    expect(slot.travelFrom).toBe('SKY');
    expect(slot.travelTo).toBe('BACK');
    expect(slot.aimProfile).toBe('TO_TARGET');
    expect(slot.mirrorProfile).toBe('HORIZONTAL');
  });

  it('compileDraft includes travelFromAnchor and travelToAnchor for TRAVEL slots', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
      })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.travelFromAnchor).toBe('sourceFront');
    expect(slot.travelToAnchor).toBe('target');
  });

  it('compileDraft omits travel anchors for FIXED slots', () => {
    const draft = makeDraft();
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const slot = compiled.slots[0]!;
    expect(slot.positionMode).toBe('FIXED');
    expect(slot.travelFromAnchor).toBeUndefined();
    expect(slot.travelToAnchor).toBeUndefined();
  });

  it('TRAVEL slot defaults to ALONG_PATH direction', () => {
    const slot = createVisualSlot('r1_0001', { positionMode: 'TRAVEL' });
    expect(resolveSlotDirectionProfile(slot)).toBe('ALONG_PATH');
  });

  it('TRAVEL slot defaults to AUTO_HORIZONTAL mirror', () => {
    const slot = createVisualSlot('r1_0001', { positionMode: 'TRAVEL' });
    expect(resolveSlotMirrorProfile(slot)).toBe('AUTO_HORIZONTAL');
  });

  it('FIXED slot defaults to FIXED direction', () => {
    const slot = createVisualSlot('r1_0001');
    expect(resolveSlotDirectionProfile(slot)).toBe('FIXED');
  });
});

// ============================================================ V2.5 PHASE Execution

describe('V2.5 Phase Execution', () => {
  it('choreographyToPhases TOGETHER produces all zeros', () => {
    expect(choreographyToPhases('TOGETHER', 3)).toEqual([0, 0, 0]);
  });

  it('choreographyToPhases SEQUENCE produces 0,1,2,...', () => {
    expect(choreographyToPhases('SEQUENCE', 3)).toEqual([0, 1, 2]);
  });

  it('choreographyToPhases PAIR_THEN_LAST produces 0,0,1,2,...', () => {
    expect(choreographyToPhases('PAIR_THEN_LAST', 4)).toEqual([0, 0, 1, 2]);
  });

  it('choreographyToPhases PAIR_THEN_LAST with <3 slots degrades to TOGETHER', () => {
    expect(choreographyToPhases('PAIR_THEN_LAST', 2)).toEqual([0, 0]);
  });

  it('resolveSlotPhases uses choreography when no explicit phases', () => {
    const draft = makeDraft({
      choreography: 'SEQUENCE',
      visualSlots: [createVisualSlot('r1_0001'), createVisualSlot('r1_0002'), createVisualSlot('r1_0003')],
    });
    expect(resolveSlotPhases(draft)).toEqual([0, 1, 2]);
  });

  it('resolveSlotPhases uses explicit phases when authored', () => {
    const draft = makeDraft({
      choreography: 'TOGETHER',
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 2 }),
        createVisualSlot('r1_0003', { phase: 1 }),
      ],
    });
    expect(resolveSlotPhases(draft)).toEqual([0, 2, 1]);
  });

  it('resolvePhaseStartTimes: same phase starts together', () => {
    const phases = [0, 0, 0];
    const durations = [0.5, 0.3, 0.4];
    const starts = resolvePhaseStartTimes(phases, durations);
    expect(starts).toEqual([0, 0, 0]);
  });

  it('resolvePhaseStartTimes: sequential phases wait for longest', () => {
    const phases = [0, 0, 1];
    const durations = [0.5, 0.3, 0.4];
    const starts = resolvePhaseStartTimes(phases, durations);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBe(0);
    // Phase 1 starts after longest of phase 0 = 0.5
    expect(starts[2]).toBeCloseTo(0.5);
  });

  it('resolvePhaseStartTimes: sparse phases behave like dense', () => {
    const phases = [0, 5, 10];
    const durations = [0.3, 0.4, 0.2];
    const starts = resolvePhaseStartTimes(phases, durations);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo(0.3);
    expect(starts[2]).toBeCloseTo(0.7);
  });

  it('setSlotPhase clamps to 0..MAX_PHASE', () => {
    const draft = makeDraft();
    const slotId = draft.visualSlots[0]!.id;
    const tooHigh = setSlotPhase(draft, slotId, 999);
    expect(tooHigh.visualSlots[0]!.phase).toBe(MAX_PHASE);
    const tooLow = setSlotPhase(draft, slotId, -5);
    expect(tooLow.visualSlots[0]!.phase).toBe(0);
  });

  it('nudgeSlotPhase materializes legacy phases first', () => {
    const draft = makeDraft({
      choreography: 'SEQUENCE',
      visualSlots: [createVisualSlot('r1_0001'), createVisualSlot('r1_0002')],
    });
    const slotId = draft.visualSlots[1]!.id;
    const nudged = nudgeSlotPhase(draft, slotId, 1);
    // Original phase 1 + 1 = 2
    expect(nudged.visualSlots[1]!.phase).toBe(2);
  });

  it('materializeSlotPhases writes effective phases onto all slots', () => {
    const draft = makeDraft({
      choreography: 'SEQUENCE',
      visualSlots: [createVisualSlot('r1_0001'), createVisualSlot('r1_0002')],
    });
    const materialized = materializeSlotPhases(draft);
    expect(materialized.visualSlots[0]!.phase).toBe(0);
    expect(materialized.visualSlots[1]!.phase).toBe(1);
  });

  it('compileDraft uses phase-based start times', () => {
    const draft = makeDraft({
      choreography: 'TOGETHER',
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.phase).toBe(0);
    expect(compiled.slots[1]!.phase).toBe(1);
    expect(compiled.slots[1]!.startTime).toBeGreaterThan(compiled.slots[0]!.startTime);
  });
});

// ============================================================ V2.5 Per-Slot Impact FX

describe('V2.5 Per-Slot Impact FX', () => {
  it('hasActiveImpactFx returns false for undefined', () => {
    expect(hasActiveImpactFx(undefined)).toBe(false);
  });

  it('hasActiveImpactFx returns false for all-off block', () => {
    expect(hasActiveImpactFx({ flash: false, shake: false, hitStop: false })).toBe(false);
  });

  it('hasActiveImpactFx returns true for flash only', () => {
    expect(hasActiveImpactFx({ flash: true })).toBe(true);
  });

  it('toggleSlotImpactFx enables flash', () => {
    const draft = makeDraft();
    const slotId = draft.visualSlots[0]!.id;
    const updated = toggleSlotImpactFx(draft, slotId, 'flash');
    expect(updated.visualSlots[0]!.impactFx?.flash).toBe(true);
    expect(hasActiveImpactFx(updated.visualSlots[0]!.impactFx)).toBe(true);
  });

  it('toggleSlotImpactFx disables and drops the block entirely', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'LIGHT' } })],
    });
    const slotId = draft.visualSlots[0]!.id;
    const updated = toggleSlotImpactFx(draft, slotId, 'flash');
    expect(updated.visualSlots[0]!.impactFx).toBeUndefined();
  });

  it('toggleSlotImpactFx seeds default power on first enable', () => {
    const draft = makeDraft();
    const slotId = draft.visualSlots[0]!.id;
    const updated = toggleSlotImpactFx(draft, slotId, 'shake');
    expect(updated.visualSlots[0]!.impactFx?.power).toBe(DEFAULT_IMPACT_POWER);
  });

  it('setSlotImpactPower updates power on active block', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'LIGHT' } })],
    });
    const slotId = draft.visualSlots[0]!.id;
    const updated = setSlotImpactPower(draft, slotId, 'STRONG');
    expect(updated.visualSlots[0]!.impactFx?.power).toBe('STRONG');
  });

  it('setSlotImpactPower is a no-op when no active FX', () => {
    const draft = makeDraft();
    const slotId = draft.visualSlots[0]!.id;
    const updated = setSlotImpactPower(draft, slotId, 'STRONG');
    expect(updated.visualSlots[0]!.impactFx).toBeUndefined();
  });

  it('clearSlotImpactFx removes the block', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, shake: true, power: 'STRONG' } })],
    });
    const slotId = draft.visualSlots[0]!.id;
    const updated = clearSlotImpactFx(draft, slotId);
    expect(updated.visualSlots[0]!.impactFx).toBeUndefined();
  });

  it('resolveSlotLocalImpactTime returns 45% for FIXED, 100% for TRAVEL', () => {
    expect(resolveSlotLocalImpactTime(1.0, 'FIXED')).toBeCloseTo(0.45);
    expect(resolveSlotLocalImpactTime(2.0, 'FIXED')).toBeCloseTo(0.9);
    expect(resolveSlotLocalImpactTime(1.0, 'TRAVEL')).toBeCloseTo(1.0);
    expect(resolveSlotLocalImpactTime(0.8, 'TRAVEL')).toBeCloseTo(0.8);
  });

  it('resolveSlotImpactEvents produces events for active channels', () => {
    const fx: VfxSlotImpactFx = { flash: true, shake: true, hitStop: false, power: 'STRONG' };
    const events = resolveSlotImpactEvents(fx, 0.5);
    expect(events).toHaveLength(2);
    expect(events[0]!.type).toBe('screenFlash');
    expect(events[1]!.type).toBe('screenShake');
  });

  it('resolveSlotImpactEvents returns empty for inactive block', () => {
    expect(resolveSlotImpactEvents({ flash: false, shake: false, hitStop: false }, 0.5)).toEqual([]);
  });

  it('usesSlotImpactFx detects authored drafts', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true } })],
    });
    expect(usesSlotImpactFx(draft)).toBe(true);
  });

  it('usesSlotImpactFx false for legacy drafts', () => {
    const draft = makeDraft();
    expect(usesSlotImpactFx(draft)).toBe(false);
  });

  it('compileDraft produces per-slot technical events when authored', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'STRONG' } })],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(compiled.usesSlotImpactFx).toBe(true);
    expect(compiled.technical.length).toBeGreaterThan(0);
    expect(compiled.technical[0]!.type).toBe('screenFlash');
  });

  it('compileDraft uses legacy polish when no slot FX authored', () => {
    const draft = makeDraft({ technicalPolish: 'LIGHT' });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(compiled.usesSlotImpactFx).toBe(false);
    expect(compiled.technical.length).toBe(3); // flash + shake + hitStop
  });

  it('compileDraft slot impactTime follows phase changes', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0, impactFx: { flash: true } }),
        createVisualSlot('r1_0002', { phase: 1, impactFx: { flash: true } }),
      ],
    });
    const compiled = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    // Phase 1 starts after phase 0, so slot 2's impact should be later
    expect(compiled.slots[1]!.impactTime).toBeGreaterThan(compiled.slots[0]!.impactTime);
  });
});

// ============================================================ V2.5 AUTO_HORIZONTAL Flag

describe('V2.5 AUTO_HORIZONTAL Explicit Flag', () => {
  it('resolveMirrorSigns AUTO_HORIZONTAL sets autoMirrorHorizontal=true', () => {
    const s = resolveMirrorSigns('AUTO_HORIZONTAL');
    expect(s.autoMirrorHorizontal).toBe(true);
    expect(s.mirrorX).toBe(1);
    expect(s.mirrorY).toBe(1);
  });

  it('resolveMirrorSigns NONE sets autoMirrorHorizontal=false', () => {
    const s = resolveMirrorSigns('NONE');
    expect(s.autoMirrorHorizontal).toBe(false);
  });

  it('resolveMirrorSigns HORIZONTAL sets autoMirrorHorizontal=false', () => {
    const s = resolveMirrorSigns('HORIZONTAL');
    expect(s.autoMirrorHorizontal).toBe(false);
  });

  it('compileDraft includes autoMirrorHorizontal flag', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'AUTO_HORIZONTAL' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.autoMirrorHorizontal).toBe(true);
  });

  it('compileDraft autoMirrorHorizontal=false for explicit HORIZONTAL', () => {
    const draft = makeDraft({
      visualSlots: [makeSlotWithTransform('TARGET', { mirror: 'HORIZONTAL' })],
    });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.autoMirrorHorizontal).toBe(false);
    expect(compiled.slots[0]!.mirrorX).toBe(-1);
  });
});

// ============================================================ V2.5 Fingerprint Stability

describe('V2.5 Fingerprint Stability', () => {
  it('V2.4 draft without V2.5 fields fingerprints identically to itself', () => {
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
    const fp1 = computeFingerprint(oldDraft);
    const fp2 = computeFingerprint(oldDraft);
    expect(fp1).toBe(fp2);
  });

  it('fingerprint changes when POSITION mode switches to TRAVEL', () => {
    const d1 = makeDraft({ visualSlots: [createVisualSlot('r1_0001')] });
    const d2 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET' })],
    });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when travel FROM changes', () => {
    const d1 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { positionMode: 'TRAVEL', travelFrom: 'CASTER_FRONT', travelTo: 'TARGET' })],
    });
    const d2 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { positionMode: 'TRAVEL', travelFrom: 'SKY', travelTo: 'TARGET' })],
    });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when PHASE is authored', () => {
    const d1 = makeDraft({ visualSlots: [createVisualSlot('r1_0001')] });
    const d2 = makeDraft({ visualSlots: [createVisualSlot('r1_0001', { phase: 1 })] });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when Impact FX is enabled', () => {
    const d1 = makeDraft({ visualSlots: [createVisualSlot('r1_0001')] });
    const d2 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'LIGHT' } })],
    });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint changes when Impact FX power changes', () => {
    const d1 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'LIGHT' } })],
    });
    const d2 = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: true, power: 'STRONG' } })],
    });
    expect(computeFingerprint(d1)).not.toBe(computeFingerprint(d2));
  });

  it('fingerprint stable: absent V2.5 fields == explicit defaults', () => {
    const bare = makeDraft({ visualSlots: [createVisualSlot('r1_0001', { placementProfile: 'TARGET' })] });
    const withDefaults = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        placementProfile: 'TARGET',
        positionMode: 'FIXED',
        aimProfile: 'FIXED',
        rotationDegrees: 0,
        mirrorProfile: 'NONE',
        pivotProfile: 'CENTER',
      })],
    });
    expect(computeFingerprint(bare)).toBe(computeFingerprint(withDefaults));
  });

  it('fingerprint stable: all-off Impact FX == no Impact FX', () => {
    const noFx = makeDraft({ visualSlots: [createVisualSlot('r1_0001')] });
    const allOffFx = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', { impactFx: { flash: false, shake: false, hitStop: false } })],
    });
    expect(computeFingerprint(noFx)).toBe(computeFingerprint(allOffFx));
  });
});

// ============================================================ V2.5 Backward Compatibility

describe('V2.5 Backward Compatibility', () => {
  it('old draft without V2.5 fields compiles with FIXED position', () => {
    const oldDraft: VfxPresetDraft = {
      actionKey: 'old',
      presetId: 'composer_old',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compileDraft(oldDraft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(compiled.slots[0]!.positionMode).toBe('FIXED');
    expect(compiled.slots[0]!.phase).toBe(0);
    expect(compiled.slots[0]!.autoMirrorHorizontal).toBe(false);
    expect(compiled.slots[0]!.technical).toEqual([]);
  });

  it('old published entry without V2.5 fields validates', () => {
    const oldEntry: PublishedVfxEntry = {
      actionKey: 'old',
      presetId: 'published_old',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validatePublishedEntry(oldEntry).ok).toBe(true);
  });

  it('published entry with V2.5 TRAVEL fields validates', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'travel',
      presetId: 'published_travel',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'CASTER_FRONT',
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
        aimProfile: 'ALONG_PATH',
        mirrorProfile: 'AUTO_HORIZONTAL',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validatePublishedEntry(entry).ok).toBe(true);
  });

  it('published entry with V2.5 Impact FX validates', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'fx',
      presetId: 'published_fx',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'BIG',
        timingProfile: 'LONG',
        placementProfile: 'TARGET',
        impactFx: { flash: true, shake: true, power: 'STRONG' },
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validatePublishedEntry(entry).ok).toBe(true);
  });

  it('published entry with TRAVEL but no endpoints fails validation', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'bad_travel',
      presetId: 'published_bad_travel',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
        positionMode: 'TRAVEL',
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validatePublishedEntry(entry).ok).toBe(false);
  });

  it('published entry with invalid phase fails validation', () => {
    const entry: PublishedVfxEntry = {
      actionKey: 'bad_phase',
      presetId: 'published_bad_phase',
      fingerprint: 'abcd1234',
      visualSlots: [{
        id: 's1',
        candidateId: 'r1_0001',
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
        phase: -1,
      }],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validatePublishedEntry(entry).ok).toBe(false);
  });

  it('draftToPublishedEntry preserves V2.5 fields', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        placementProfile: 'CASTER_FRONT',
        positionMode: 'TRAVEL',
        travelFrom: 'SKY',
        travelTo: 'FRONT',
        aimProfile: 'ALONG_PATH',
        mirrorProfile: 'AUTO_HORIZONTAL',
        phase: 2,
        impactFx: { flash: true, shake: true, power: 'STRONG' },
      })],
    });
    const entry = draftToPublishedEntry(draft);
    const slot = entry.visualSlots[0]!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.travelFrom).toBe('SKY');
    expect(slot.travelTo).toBe('FRONT');
    expect(slot.aimProfile).toBe('ALONG_PATH');
    expect(slot.phase).toBe(2);
    expect(slot.impactFx?.flash).toBe(true);
    expect(slot.impactFx?.power).toBe('STRONG');
  });

  it('publishedEntryToDraft preserves V2.5 fields', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        positionMode: 'TRAVEL',
        travelFrom: 'SKY',
        travelTo: 'BACK',
        phase: 3,
        impactFx: { hitStop: true, power: 'LIGHT' },
      })],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const slot = restored.visualSlots[0]!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.travelFrom).toBe('SKY');
    expect(slot.travelTo).toBe('BACK');
    expect(slot.phase).toBe(3);
    expect(slot.impactFx?.hitStop).toBe(true);
  });
});

// ============================================================ V2.5 Compile Parity

describe('V2.5 Compile Parity', () => {
  it('TRAVEL slot: draft and published round-trip produce identical compiled travel anchors', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        placementProfile: 'CASTER_FRONT',
        positionMode: 'TRAVEL',
        travelFrom: 'CASTER_FRONT',
        travelTo: 'TARGET',
        aimProfile: 'ALONG_PATH',
        mirrorProfile: 'AUTO_HORIZONTAL',
      })],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const c1 = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const c2 = compileDraft(restored, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const s1 = c1.slots[0]!;
    const s2 = c2.slots[0]!;
    expect(s1.positionMode).toBe(s2.positionMode);
    expect(s1.travelFromAnchor).toBe(s2.travelFromAnchor);
    expect(s1.travelToAnchor).toBe(s2.travelToAnchor);
    expect(s1.aimProfile).toBe(s2.aimProfile);
    expect(s1.autoMirrorHorizontal).toBe(s2.autoMirrorHorizontal);
  });

  it('Impact FX slot: draft and published round-trip produce identical technical events', () => {
    const draft = makeDraft({
      visualSlots: [createVisualSlot('r1_0001', {
        impactFx: { flash: true, shake: true, power: 'STRONG' },
      })],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const c1 = compileDraft(draft, { includeTechnical: true, getCadence: NOOP_CADENCE });
    const c2 = compileDraft(restored, { includeTechnical: true, getCadence: NOOP_CADENCE });
    expect(c1.usesSlotImpactFx).toBe(c2.usesSlotImpactFx);
    expect(c1.technical).toEqual(c2.technical);
  });

  it('PHASE-authored draft: round-trip preserves phase timing', () => {
    const draft = makeDraft({
      visualSlots: [
        createVisualSlot('r1_0001', { phase: 0 }),
        createVisualSlot('r1_0002', { phase: 1 }),
        createVisualSlot('r1_0003', { phase: 1 }),
      ],
    });
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    const c1 = compileDraft(draft, { includeTechnical: false, getCadence: NOOP_CADENCE });
    const c2 = compileDraft(restored, { includeTechnical: false, getCadence: NOOP_CADENCE });
    expect(c1.slots.map((s) => s.phase)).toEqual(c2.slots.map((s) => s.phase));
    expect(c1.slots.map((s) => s.startTime)).toEqual(c2.slots.map((s) => s.startTime));
  });
});
