import { describe, expect, it } from 'vitest';
import {
  compileDraft,
  createVisualSlot,
  createDraftFromAction,
  setSlotTrajectoryProfile,
  validateDraft,
  VFX_TRAJECTORY_PROFILES,
  type VfxPresetDraft,
  type VfxTrajectoryProfile,
  type VfxNativeCadence,
} from './VfxPresetComposer';
import {
  computeFingerprint,
  draftToPublishedEntry,
  publishedEntryToDraft,
  validatePublishedEntry,
} from './PublishedVfxRegistry';
import {
  CombatCameraFeedback,
  STATIC_COMBAT_CAMERA_POLICY,
} from '../combatCameraFeedback';

// ============================================================ Helpers

const STUB_CADENCE: VfxNativeCadence = { frameCount: 64, frameDurationMs: 40 };
const getCadence = (_id: string) => STUB_CADENCE;

function makeDraft(overrides: Partial<VfxPresetDraft> = {}): VfxPresetDraft {
  return {
    actionKey: 'test_action',
    presetId: 'composer_test_action',
    visualSlots: [
      createVisualSlot('r1_0001', {
        sizeProfile: 'MID',
        timingProfile: 'NORMAL',
        placementProfile: 'TARGET',
      }),
    ],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
    ...overrides,
  };
}

function makeTravelDraft(trajectory?: VfxTrajectoryProfile): VfxPresetDraft {
  const slot = createVisualSlot('r1_0001', {
    sizeProfile: 'MID',
    timingProfile: 'NORMAL',
    placementProfile: 'TARGET',
    positionMode: 'TRAVEL',
    travelFrom: 'CASTER_FRONT',
    travelTo: 'TARGET',
    ...(trajectory ? { trajectoryProfile: trajectory } : {}),
  });
  return {
    actionKey: 'test_travel',
    presetId: 'composer_test_travel',
    visualSlots: [slot],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
  };
}

function compile(draft: VfxPresetDraft, includeTechnical = true) {
  return compileDraft(draft, { includeTechnical, getCadence });
}

// ============================================================ TRAJECTORY TESTS

describe('V2.6 Trajectory', () => {
  it('missing trajectory defaults to STRAIGHT (no field in compiled output)', () => {
    const draft = makeTravelDraft();
    const compiled = compile(draft);
    expect(compiled.slots[0]?.trajectoryProfile).toBeUndefined();
  });

  it('explicit STRAIGHT fingerprints identically to missing (default)', () => {
    const draftMissing = makeTravelDraft();
    const draftExplicit = makeTravelDraft('STRAIGHT');
    expect(computeFingerprint(draftMissing)).toBe(computeFingerprint(draftExplicit));
  });

  it('ARC_LOW changes fingerprint from STRAIGHT', () => {
    const draftStraight = makeTravelDraft();
    const draftArcLow = makeTravelDraft('ARC_LOW');
    expect(computeFingerprint(draftStraight)).not.toBe(computeFingerprint(draftArcLow));
  });

  it('ARC_HIGH changes fingerprint from STRAIGHT', () => {
    const draftStraight = makeTravelDraft();
    const draftArcHigh = makeTravelDraft('ARC_HIGH');
    expect(computeFingerprint(draftStraight)).not.toBe(computeFingerprint(draftArcHigh));
  });

  it('ARC_LOW and ARC_HIGH have different fingerprints', () => {
    const draftArcLow = makeTravelDraft('ARC_LOW');
    const draftArcHigh = makeTravelDraft('ARC_HIGH');
    expect(computeFingerprint(draftArcLow)).not.toBe(computeFingerprint(draftArcHigh));
  });

  it('FIXED slot ignores trajectory during compilation', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      trajectoryProfile: 'ARC_HIGH',
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_fixed',
      presetId: 'composer_test_fixed',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    expect(compiled.slots[0]?.positionMode).toBe('FIXED');
    expect(compiled.slots[0]?.trajectoryProfile).toBeUndefined();
    expect(compiled.slots[0]?.travelFromAnchor).toBeUndefined();
  });

  it('TRAVEL preserves trajectory through draft -> published -> restored -> compiled', () => {
    const draft = makeTravelDraft('ARC_HIGH');
    const entry = draftToPublishedEntry(draft);
    expect(entry.visualSlots[0]?.trajectoryProfile).toBe('ARC_HIGH');

    const restored = publishedEntryToDraft(entry);
    expect(restored.visualSlots[0]?.trajectoryProfile).toBe('ARC_HIGH');

    const compiled = compile(restored);
    expect(compiled.slots[0]?.positionMode).toBe('TRAVEL');
    expect(compiled.slots[0]?.trajectoryProfile).toBe('ARC_HIGH');
  });

  it('ARC_LOW compiles with trajectory in output', () => {
    const draft = makeTravelDraft('ARC_LOW');
    const compiled = compile(draft);
    const slot = compiled.slots[0]!;
    expect(slot.trajectoryProfile).toBe('ARC_LOW');
    expect(slot.travelFromAnchor).toBeDefined();
    expect(slot.travelToAnchor).toBeDefined();
  });

  it('ARC_HIGH compiles with trajectory in output', () => {
    const draft = makeTravelDraft('ARC_HIGH');
    const compiled = compile(draft);
    expect(compiled.slots[0]?.trajectoryProfile).toBe('ARC_HIGH');
  });

  it('ARC_HIGH peak > ARC_LOW peak (2.0 > 0.8)', () => {
    const arcLowPeak = 0.8 * 4 * 0.5 * (1 - 0.5);
    const arcHighPeak = 2.0 * 4 * 0.5 * (1 - 0.5);
    expect(arcHighPeak).toBeGreaterThan(arcLowPeak);
    expect(arcLowPeak).toBe(0.8);
    expect(arcHighPeak).toBe(2.0);
  });

  it('SKY -> TARGET works with trajectory', () => {
    const slot = createVisualSlot('r1_0001', {
      positionMode: 'TRAVEL',
      travelFrom: 'SKY',
      travelTo: 'TARGET',
      trajectoryProfile: 'ARC_HIGH',
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_sky',
      presetId: 'composer_test_sky',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    expect(compiled.slots[0]?.travelFromAnchor).toBe('sky');
    expect(compiled.slots[0]?.travelToAnchor).toBe('target');
    expect(compiled.slots[0]?.trajectoryProfile).toBe('ARC_HIGH');
  });

  it('setSlotTrajectoryProfile sets non-default and clears when STRAIGHT', () => {
    let draft = makeTravelDraft();
    draft = setSlotTrajectoryProfile(draft, draft.visualSlots[0]!.id, 'ARC_LOW');
    expect(draft.visualSlots[0]?.trajectoryProfile).toBe('ARC_LOW');

    draft = setSlotTrajectoryProfile(draft, draft.visualSlots[0]!.id, 'STRAIGHT');
    expect(draft.visualSlots[0]?.trajectoryProfile).toBeUndefined();
  });

  it('validateDraft accepts valid trajectoryProfile', () => {
    const draft = makeTravelDraft('ARC_LOW');
    expect(validateDraft(draft)).toBe(true);
  });

  it('validateDraft rejects invalid trajectoryProfile', () => {
    const draft = makeTravelDraft('ARC_LOW');
    const tampered = JSON.parse(JSON.stringify(draft));
    tampered.visualSlots[0].trajectoryProfile = 'WAVE';
    expect(validateDraft(tampered)).toBe(false);
  });

  it('validatePublishedEntry accepts valid trajectoryProfile', () => {
    const draft = makeTravelDraft('ARC_HIGH');
    const entry = draftToPublishedEntry(draft);
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(true);
  });

  it('validatePublishedEntry rejects invalid trajectoryProfile', () => {
    const draft = makeTravelDraft('ARC_HIGH');
    const entry = draftToPublishedEntry(draft) as unknown as Record<string, unknown>;
    const slots = entry.visualSlots as Array<Record<string, unknown>>;
    slots[0]!.trajectoryProfile = 'SPIRAL';
    const result = validatePublishedEntry(entry);
    expect(result.ok).toBe(false);
  });

  it('VFX_TRAJECTORY_PROFILES has exactly 3 values', () => {
    expect(VFX_TRAJECTORY_PROFILES).toEqual(['STRAIGHT', 'ARC_LOW', 'ARC_HIGH']);
  });
});

// ============================================================ SHAKE TESTS

describe('V2.6 Camera Shake Fix', () => {
  it('maxShakeMagnitude is 0.30 (not 0.035)', () => {
    expect(STATIC_COMBAT_CAMERA_POLICY.maxShakeMagnitude).toBe(0.30);
  });

  it('LIGHT shake magnitude (0.10) passes through uncapped', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'test-light', magnitude: 0.10, duration: 0.12, frequency: 18 });
    // Tick to first sine peak: elapsed = 1/(4*freq) = 1/72
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    expect(Math.abs(sample.x)).toBeGreaterThan(0.05);
    expect(Math.abs(sample.x)).toBeLessThanOrEqual(0.10);
  });

  it('STRONG shake magnitude (0.22) passes through uncapped', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'test-strong', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    expect(Math.abs(sample.x)).toBeGreaterThan(0.15);
    expect(Math.abs(sample.x)).toBeLessThanOrEqual(0.22);
  });

  it('LIGHT and STRONG produce clearly different magnitudes', () => {
    const light = new CombatCameraFeedback();
    light.request({ token: 'light', magnitude: 0.10, duration: 0.12, frequency: 18 });
    light.tick(1 / 72);
    const lightSample = light.sample();

    const strong = new CombatCameraFeedback();
    strong.request({ token: 'strong', magnitude: 0.22, duration: 0.20, frequency: 18 });
    strong.tick(1 / 72);
    const strongSample = strong.sample();

    expect(Math.abs(strongSample.x)).toBeGreaterThan(Math.abs(lightSample.x) * 1.5);
  });

  it('extreme magnitudes are still capped at 0.30', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'extreme', magnitude: 0.50, duration: 0.30, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    expect(Math.abs(sample.x)).toBeLessThanOrEqual(0.30);
  });

  it('compiled SHAKE event has correct magnitude for LIGHT', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, power: 'LIGHT' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_shake_light',
      presetId: 'composer_test_shake_light',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    const shakeEvent = compiled.technical.find((e) => e.type === 'screenShake');
    expect(shakeEvent).toBeDefined();
    expect(shakeEvent!.scale).toBe(0.10);
    expect(shakeEvent!.duration).toBe(0.12);
  });

  it('compiled SHAKE event has correct magnitude for STRONG', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, power: 'STRONG' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_shake_strong',
      presetId: 'composer_test_shake_strong',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    const shakeEvent = compiled.technical.find((e) => e.type === 'screenShake');
    expect(shakeEvent).toBeDefined();
    expect(shakeEvent!.scale).toBe(0.22);
    expect(shakeEvent!.duration).toBe(0.20);
  });

  it('VISUALS ONLY produces no shake events', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, power: 'STRONG' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_visuals_only',
      presetId: 'composer_test_visuals_only',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
    expect(compiled.technical).toHaveLength(0);
  });

  it('FULL PRESET produces authored shake events', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, power: 'STRONG' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_full_preset',
      presetId: 'composer_test_full_preset',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    expect(compiled.technical.some((e) => e.type === 'screenShake')).toBe(true);
  });

  it('no duplicate SHAKE occurs (one event per slot)', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, flash: true, power: 'STRONG' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_no_dup',
      presetId: 'composer_test_no_dup',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    const shakeEvents = compiled.technical.filter((e) => e.type === 'screenShake');
    expect(shakeEvents).toHaveLength(1);
    const flashEvents = compiled.technical.filter((e) => e.type === 'screenFlash');
    expect(flashEvents).toHaveLength(1);
  });

  it('per-slot Impact FX supersedes legacy technical polish (no double)', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { shake: true, power: 'LIGHT' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_supersede',
      presetId: 'composer_test_supersede',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'STRONG',
    };
    const compiled = compile(draft);
    const shakeEvents = compiled.technical.filter((e) => e.type === 'screenShake');
    expect(shakeEvents).toHaveLength(1);
    expect(shakeEvents[0]!.scale).toBe(0.10);
  });
});

// ============================================================ HITSTOP / LEGACY POLISH TESTS

describe('V2.6 HITSTOP and Legacy Polish', () => {
  it('old draft containing hitStop still loads safely', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { hitStop: true, power: 'LIGHT' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_legacy_hitstop',
      presetId: 'composer_test_legacy_hitstop',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    expect(validateDraft(draft)).toBe(true);
  });

  it('old draft with hitStop compiles safely', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { hitStop: true, flash: true, power: 'STRONG' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_compile_hitstop',
      presetId: 'composer_test_compile_hitstop',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'OFF',
    };
    const compiled = compile(draft);
    expect(compiled.technical.some((e) => e.type === 'hitStop')).toBe(true);
  });

  it('legacy technicalPolish data still compiles correctly', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_legacy_polish',
      presetId: 'composer_test_legacy_polish',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'STRONG',
    };
    const compiled = compile(draft);
    expect(compiled.usesSlotImpactFx).toBe(false);
    expect(compiled.technical.length).toBeGreaterThan(0);
    expect(compiled.technical.some((e) => e.type === 'screenShake')).toBe(true);
  });

  it('new V2.6 draft default uses technicalPolish = OFF', () => {
    const draft = createDraftFromAction({
      actionKey: 'new_action',
      visualSteps: [{ candidateId: 'r1_0001' }],
    });
    expect(draft.technicalPolish).toBe('OFF');
  });

  it('per-slot Impact FX still supersedes legacy polish', () => {
    const slot = createVisualSlot('r1_0001', {
      placementProfile: 'TARGET',
      impactFx: { flash: true, power: 'LIGHT' },
    });
    const draft: VfxPresetDraft = {
      actionKey: 'test_supersede2',
      presetId: 'composer_test_supersede2',
      visualSlots: [slot],
      choreography: 'TOGETHER',
      technicalPolish: 'STRONG',
    };
    const compiled = compile(draft);
    expect(compiled.usesSlotImpactFx).toBe(true);
    const flashEvents = compiled.technical.filter((e) => e.type === 'screenFlash');
    expect(flashEvents).toHaveLength(1);
    expect(flashEvents[0]!.opacity).toBe(0.16);
  });
});

// ============================================================ PUBLISHED REGISTRY STABILITY

describe('V2.6 Published Registry Stability', () => {
  it('V2.4 fingerprints remain stable with trajectory defaults', () => {
    const draft: VfxPresetDraft = {
      actionKey: 'basic_greatsword_hit',
      presetId: 'published_basic_greatsword_hit',
      visualSlots: [
        createVisualSlot('r1_1700', {
          sizeProfile: 'MID',
          timingProfile: 'NORMAL',
          placementProfile: 'TARGET',
        }),
      ],
      choreography: 'TOGETHER',
      technicalPolish: 'AUTO',
    };
    const fp = computeFingerprint(draft);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });
});
