// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  // profiles
  VFX_SIZE_PROFILES,
  VFX_TIMING_PROFILES,
  VFX_PLACEMENT_PROFILES,
  VFX_CHOREOGRAPHIES,
  VFX_TECHNICAL_POLISH_LEVELS,
  SIZE_PROFILE_TARGET_HEIGHT,
  TIMING_PROFILE_NATIVE_MULTIPLIER,
  VISIBILITY_DEFAULTS,
  // resolvers
  resolveSlotScale,
  computeFinalDisplayHeight,
  runtimeScaleMultiplierProduct,
  nativeDurationSeconds,
  resolveSlotDuration,
  resolveSlotVisibility,
  resolvePlacement,
  resolveChoreographyStartTimes,
  choreographyCompatibility,
  resolveTechnicalEffects,
  resolveAutoPolishLevel,
  // slot ops
  createVisualSlot,
  addSlot,
  removeSlot,
  replaceSlotCandidate,
  moveSlotUp,
  moveSlotDown,
  updateSlotProfile,
  setSlotAdvancedOverride,
  clearSlotAdvancedOverride,
  setChoreography,
  setTechnicalPolish,
  // compile + serialize
  compileDraft,
  serializeDraft,
  deserializeDraft,
  validateDraft,
  serializeDraftBundle,
  restoreDraftBundle,
  // migration
  createDraftFromAction,
  deriveAutoPlacement,
} from './VfxPresetComposer';
import type { VfxPresetDraft, VfxNativeCadence } from './VfxPresetComposer';
import {
  COMPOSER_STORAGE_KEY,
  createEmptyComposerStore,
  putDraft,
  getDraft,
  deleteDraft,
  loadComposerStore,
  saveComposerStore,
  exportComposerDrafts,
  importComposerDrafts,
  deserializeComposerStore,
} from './VfxComposerPlayback';
import { getVfxPreset } from './VfxPresets';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';

// ============================================================ Fixtures

/** 4096px source: 64 frames @ 20ms = 1.28s native. */
const CADENCE_4096: VfxNativeCadence = { frameCount: 64, frameDurationMs: 20 };
/** 2048px source: 16 frames @ 50ms = 0.80s native. */
const CADENCE_2048: VfxNativeCadence = { frameCount: 16, frameDurationMs: 50 };

const cadenceMap: Record<string, VfxNativeCadence> = {
  r1_1709: CADENCE_4096,
  r1_0934: CADENCE_4096,
  r1_2561: CADENCE_2048,
  slotA: CADENCE_4096,
  slotB: CADENCE_4096,
  slotC: CADENCE_4096,
};

const getCadence = (candidateId: string): VfxNativeCadence | null =>
  cadenceMap[candidateId] ?? null;

function baseDraft(candidateIds: string[] = ['slotA']): VfxPresetDraft {
  return {
    actionKey: 'basic_greatsword_hit',
    presetId: 'composer_basic_greatsword_hit',
    visualSlots: candidateIds.map((id) => createVisualSlot(id)),
    choreography: 'TOGETHER',
    technicalPolish: 'AUTO',
    autoPlacement: 'TARGET',
    tier: 1,
  };
}

/** All AP tiers from `STATIC_VFX_TIER_PRESENTATION`. */
const TIER_PRESENTATION_SCALES = [
  { tier: 'basic', contextPresentationScale: 1.00 },
  { tier: '2ap', contextPresentationScale: 1.05 },
  { tier: '3ap', contextPresentationScale: 1.12 },
  { tier: '4ap', contextPresentationScale: 1.30 },
  { tier: '5ap_ultimate', contextPresentationScale: 1.55 },
];

describe('R2C-VFX LAB V2 — Simple Preset Composer', () => {

  // ============================================================ Size Resolver

  describe('semantic LOW/MID/BIG size resolver', () => {
    it('1. exposes exactly three size profiles', () => {
      expect(VFX_SIZE_PROFILES).toEqual(['LOW', 'MID', 'BIG']);
    });

    it('2. LOW is clearly visible, never tiny', () => {
      expect(SIZE_PROFILE_TARGET_HEIGHT).toEqual({ LOW: 1.8, MID: 2.5, BIG: 3.4 });
    });

    it('3. profiles are strictly ordered LOW < MID < BIG', () => {
      expect(SIZE_PROFILE_TARGET_HEIGHT.LOW).toBeLessThan(SIZE_PROFILE_TARGET_HEIGHT.MID);
      expect(SIZE_PROFILE_TARGET_HEIGHT.MID).toBeLessThan(SIZE_PROFILE_TARGET_HEIGHT.BIG);
    });

    it('4. resolved size produces a PREDICTABLE final height across every AP tier', () => {
      for (const profile of VFX_SIZE_PROFILES) {
        for (const { contextPresentationScale } of TIER_PRESENTATION_SCALES) {
          const factors = { contextPresentationScale };
          const scale = resolveSlotScale(profile, factors);
          const finalHeight = computeFinalDisplayHeight(scale, factors);
          expect(finalHeight).toBeCloseTo(SIZE_PROFILE_TARGET_HEIGHT[profile], 5);
        }
      }
    });

    it('5. no double scaling: intensity is divided out', () => {
      const factors = { intensity: 1.8, contextPresentationScale: 1.55 };
      const scale = resolveSlotScale('MID', factors);
      expect(computeFinalDisplayHeight(scale, factors)).toBeCloseTo(SIZE_PROFILE_TARGET_HEIGHT.MID, 5);
    });

    it('6. no double scaling: large-target multiplier is divided out', () => {
      const factors = { targetSizeMultiplier: 1.3, contextPresentationScale: 1.3 };
      const scale = resolveSlotScale('BIG', factors);
      expect(computeFinalDisplayHeight(scale, factors)).toBeCloseTo(SIZE_PROFILE_TARGET_HEIGHT.BIG, 5);
    });

    it('7. no double scaling: preset step scale is divided out', () => {
      const factors = { stepScale: 2.1, contextPresentationScale: 1.12 };
      const scale = resolveSlotScale('LOW', factors);
      expect(computeFinalDisplayHeight(scale, factors)).toBeCloseTo(SIZE_PROFILE_TARGET_HEIGHT.LOW, 5);
    });

    it('8. reducedGraphics factor is compensated', () => {
      const factors = { reducedGraphics: true, contextPresentationScale: 1.05 };
      expect(runtimeScaleMultiplierProduct(factors)).toBeCloseTo(0.94 * 1.05, 5);
      const scale = resolveSlotScale('MID', factors);
      expect(computeFinalDisplayHeight(scale, factors)).toBeCloseTo(SIZE_PROFILE_TARGET_HEIGHT.MID, 5);
    });

    it('9. degenerate factors fall back to the target height', () => {
      expect(resolveSlotScale('MID', { intensity: 0 })).toBe(SIZE_PROFILE_TARGET_HEIGHT.MID);
    });
  });

  // ============================================================ Timing Resolver

  describe('native timing profiles', () => {
    it('10. exposes exactly three timing profiles', () => {
      expect(VFX_TIMING_PROFILES).toEqual(['QUICK', 'NORMAL', 'LONG']);
    });

    it('11. native duration derives from frameCount x frameDurationMs', () => {
      expect(nativeDurationSeconds(CADENCE_4096)).toBeCloseTo(1.28, 5);
      expect(nativeDurationSeconds(CADENCE_2048)).toBeCloseTo(0.80, 5);
    });

    it('12. QUICK preserves the native readable cadence', () => {
      expect(TIMING_PROFILE_NATIVE_MULTIPLIER.QUICK).toBe(1.0);
      expect(resolveSlotDuration('QUICK', CADENCE_4096)).toBeCloseTo(1.28, 3);
    });

    it('13. NORMAL adds readability over native cadence', () => {
      expect(TIMING_PROFILE_NATIVE_MULTIPLIER.NORMAL).toBeGreaterThan(1.0);
      // P0.1B human calibration accepted 1.60s-1.70s for a 1.28s native source.
      const normal = resolveSlotDuration('NORMAL', CADENCE_4096);
      expect(normal).toBeGreaterThan(1.28);
      expect(normal).toBeLessThanOrEqual(1.75);
    });

    it('14. LONG is deliberately more emphasised than NORMAL', () => {
      expect(TIMING_PROFILE_NATIVE_MULTIPLIER.LONG)
        .toBeGreaterThan(TIMING_PROFILE_NATIVE_MULTIPLIER.NORMAL);
      expect(resolveSlotDuration('LONG', CADENCE_4096))
        .toBeGreaterThan(resolveSlotDuration('NORMAL', CADENCE_4096));
    });

    it('15. timing scales with native cadence, NOT fixed AP constants', () => {
      const long4096 = resolveSlotDuration('NORMAL', CADENCE_4096);
      const long2048 = resolveSlotDuration('NORMAL', CADENCE_2048);
      expect(long4096).not.toBeCloseTo(long2048, 2);
      expect(long4096 / nativeDurationSeconds(CADENCE_4096))
        .toBeCloseTo(long2048 / nativeDurationSeconds(CADENCE_2048), 2);
    });

    it('16. missing cadence falls back safely without throwing', () => {
      expect(resolveSlotDuration('NORMAL', null)).toBeGreaterThan(0);
      expect(resolveSlotDuration('NORMAL', { frameCount: 0, frameDurationMs: 0 })).toBeGreaterThan(0);
    });
  });

  // ============================================================ Visibility

  describe('visibility defaults', () => {
    it('17. opacity is at full visibility', () => {
      expect(VISIBILITY_DEFAULTS.opacity).toBe(1.0);
    });

    it('18. fadeIn is disabled for every timing profile', () => {
      for (const profile of VFX_TIMING_PROFILES) {
        expect(resolveSlotVisibility(profile).fadeIn).toBe(0);
      }
    });

    it('19. fadeOut is late for every timing profile — no A1-style early fade', () => {
      for (const profile of VFX_TIMING_PROFILES) {
        const { fadeOut } = resolveSlotVisibility(profile);
        expect(fadeOut).toBe(1);
        expect(fadeOut).not.toBe(0.08);
        expect(fadeOut).not.toBe(0.10);
        expect(fadeOut).not.toBe(0.18);
      }
    });

    it('20. longer timing keeps the peak visible at least as long', () => {
      expect(resolveSlotVisibility('LONG').fadeOut)
        .toBeGreaterThanOrEqual(resolveSlotVisibility('QUICK').fadeOut);
    });
  });

  // ============================================================ Placement

  describe('placement profiles', () => {
    it('21. exposes AUTO/TARGET/CASTER/GROUND only', () => {
      expect(VFX_PLACEMENT_PROFILES).toEqual(['AUTO', 'TARGET', 'CASTER', 'GROUND']);
    });

    it('22. TARGET anchors on the target in the impact layer', () => {
      const resolved = resolvePlacement('TARGET');
      expect(resolved.anchor).toBe('target');
      expect(resolved.layer).toBe('impact');
    });

    it('23. CASTER anchors on the source', () => {
      expect(resolvePlacement('CASTER').anchor).toBe('source');
    });

    it('24. GROUND keeps its ground anchor but renders in the foreground impact layer', () => {
      const resolved = resolvePlacement('GROUND');
      expect(resolved.anchor).toBe('groundTarget');
      expect(resolved.layer).toBe('impact');
    });

    it('25. AUTO follows the derived hint, defaulting to TARGET', () => {
      expect(resolvePlacement('AUTO', 'GROUND').layer).toBe('impact');
      expect(resolvePlacement('AUTO', 'CASTER').anchor).toBe('source');
      expect(resolvePlacement('AUTO').anchor).toBe('target');
    });

    it('26. AUTO hint derives from already-authored action semantics', () => {
      expect(deriveAutoPlacement({ actionKey: 'a', visualSteps: [{ anchor: 'source' }] })).toBe('CASTER');
      expect(deriveAutoPlacement({ actionKey: 'a', visualSteps: [{ anchor: 'groundTarget' }] })).toBe('GROUND');
      expect(deriveAutoPlacement({ actionKey: 'a', visualSteps: [{ anchor: 'target' }] })).toBe('TARGET');
      expect(deriveAutoPlacement({ actionKey: 'a', visualSteps: [{ layer: 'ground' }] })).toBe('GROUND');
      expect(deriveAutoPlacement({ actionKey: 'a', visualSteps: [] })).toBe('TARGET');
    });
  });

  // ============================================================ Slot Operations

  describe('ADD / REMOVE / REORDER spritesheet', () => {
    it('27. ADD appends a slot with semantic defaults', () => {
      const draft = addSlot(baseDraft([]), 'r1_1709');
      expect(draft.visualSlots).toHaveLength(1);
      expect(draft.visualSlots[0]!.candidateId).toBe('r1_1709');
      expect(draft.visualSlots[0]!.sizeProfile).toBe('MID');
      expect(draft.visualSlots[0]!.timingProfile).toBe('NORMAL');
      expect(draft.visualSlots[0]!.placementProfile).toBe('AUTO');
    });

    it('28. ADD supports an arbitrary number of slots', () => {
      let draft = baseDraft([]);
      for (const id of ['slotA', 'slotB', 'slotC']) draft = addSlot(draft, id);
      expect(draft.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'slotB', 'slotC']);
    });

    it('29. REMOVE deletes only the targeted slot', () => {
      const draft = baseDraft(['slotA', 'slotB', 'slotC']);
      const next = removeSlot(draft, draft.visualSlots[1]!.id);
      expect(next.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'slotC']);
    });

    it('30. REPLACE swaps the candidate and preserves semantic profiles', () => {
      let draft = baseDraft(['slotA']);
      draft = updateSlotProfile(draft, draft.visualSlots[0]!.id, { sizeProfile: 'BIG', timingProfile: 'LONG' });
      const next = replaceSlotCandidate(draft, draft.visualSlots[0]!.id, 'r1_0934');
      expect(next.visualSlots[0]!.candidateId).toBe('r1_0934');
      expect(next.visualSlots[0]!.sizeProfile).toBe('BIG');
      expect(next.visualSlots[0]!.timingProfile).toBe('LONG');
    });

    it('31. MOVE UP reorders toward the front', () => {
      const draft = baseDraft(['slotA', 'slotB', 'slotC']);
      const next = moveSlotUp(draft, draft.visualSlots[2]!.id);
      expect(next.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'slotC', 'slotB']);
    });

    it('32. MOVE DOWN reorders toward the back', () => {
      const draft = baseDraft(['slotA', 'slotB', 'slotC']);
      const next = moveSlotDown(draft, draft.visualSlots[0]!.id);
      expect(next.visualSlots.map((s) => s.candidateId)).toEqual(['slotB', 'slotA', 'slotC']);
    });

    it('33. out-of-range reorder is a no-op', () => {
      const draft = baseDraft(['slotA', 'slotB']);
      expect(moveSlotUp(draft, draft.visualSlots[0]!.id).visualSlots.map((s) => s.candidateId))
        .toEqual(['slotA', 'slotB']);
      expect(moveSlotDown(draft, draft.visualSlots[1]!.id).visualSlots.map((s) => s.candidateId))
        .toEqual(['slotA', 'slotB']);
    });

    it('34. slot operations never mutate the source draft', () => {
      const draft = baseDraft(['slotA', 'slotB']);
      const before = JSON.stringify(draft.visualSlots);
      addSlot(draft, 'slotC');
      removeSlot(draft, draft.visualSlots[0]!.id);
      moveSlotDown(draft, draft.visualSlots[0]!.id);
      expect(JSON.stringify(draft.visualSlots)).toBe(before);
    });
  });

  // ============================================================ Choreography

  describe('TOGETHER choreography', () => {
    it('35. every slot starts at 0', () => {
      expect(resolveChoreographyStartTimes('TOGETHER', [1.0, 1.5, 0.8])).toEqual([0, 0, 0]);
    });

    it('36. compiled draft plays all slots simultaneously', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'TOGETHER');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      expect(compiled.slots.map((s) => s.startTime)).toEqual([0, 0, 0]);
    });

    it('37. total duration equals the longest slot', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB']), 'TOGETHER');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      const longest = Math.max(...compiled.slots.map((s) => s.duration));
      expect(compiled.totalDuration).toBeCloseTo(longest, 3);
    });
  });

  describe('SEQUENCE choreography', () => {
    it('38. slots play one after another', () => {
      expect(resolveChoreographyStartTimes('SEQUENCE', [1.0, 1.5, 0.8])).toEqual([0, 1.0, 2.5]);
    });

    it('39. start times are computed automatically — never authored', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'SEQUENCE');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      const [a, b, c] = compiled.slots;
      expect(a!.startTime).toBe(0);
      expect(b!.startTime).toBeCloseTo(a!.duration, 3);
      expect(c!.startTime).toBeCloseTo(a!.duration + b!.duration, 3);
    });

    it('40. total duration is the sum of all slots', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'SEQUENCE');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      const sum = compiled.slots.reduce((total, s) => total + s.duration, 0);
      expect(compiled.totalDuration).toBeCloseTo(sum, 3);
    });
  });

  describe('PAIR_THEN_LAST choreography', () => {
    it('41. first two slots play together, third follows the pair', () => {
      const starts = resolveChoreographyStartTimes('PAIR_THEN_LAST', [1.0, 1.5, 0.8]);
      expect(starts[0]).toBe(0);
      expect(starts[1]).toBe(0);
      expect(starts[2]).toBeCloseTo(1.5, 3);
    });

    it('42. the pair delay uses the LONGER of the two paired slots', () => {
      expect(resolveChoreographyStartTimes('PAIR_THEN_LAST', [2.0, 0.5, 1.0])[2]).toBeCloseTo(2.0, 3);
    });

    it('43. slots beyond the third continue sequentially', () => {
      const starts = resolveChoreographyStartTimes('PAIR_THEN_LAST', [1.0, 1.0, 0.5, 0.5]);
      expect(starts).toEqual([0, 0, 1.0, 1.5]);
    });

    it('44. compiled three-slot draft: two together then a climax', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'PAIR_THEN_LAST');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      expect(compiled.slots[0]!.startTime).toBe(0);
      expect(compiled.slots[1]!.startTime).toBe(0);
      expect(compiled.slots[2]!.startTime).toBeGreaterThan(0);
      expect(compiled.compatibility.compatible).toBe(true);
    });

    it('45. is reported incompatible below three slots, with an explanation', () => {
      const compat = choreographyCompatibility('PAIR_THEN_LAST', 2);
      expect(compat.compatible).toBe(false);
      expect(compat.reason).toContain('3');
    });

    it('46. TOGETHER and SEQUENCE stay compatible from one slot upward', () => {
      expect(choreographyCompatibility('TOGETHER', 1).compatible).toBe(true);
      expect(choreographyCompatibility('SEQUENCE', 1).compatible).toBe(true);
      expect(choreographyCompatibility('TOGETHER', 0).compatible).toBe(false);
    });

    it('47. exposes exactly the three required templates', () => {
      expect(VFX_CHOREOGRAPHIES).toEqual(['TOGETHER', 'SEQUENCE', 'PAIR_THEN_LAST']);
    });
  });

  // ============================================================ Technical Polish

  describe('technical polish separation', () => {
    it('48. exposes AUTO/OFF/LIGHT/STRONG only', () => {
      expect(VFX_TECHNICAL_POLISH_LEVELS).toEqual(['AUTO', 'OFF', 'LIGHT', 'STRONG']);
    });

    it('49. OFF produces no technical effects', () => {
      expect(resolveTechnicalEffects('OFF', 0.5, 1)).toEqual([]);
    });

    it('50. LIGHT and STRONG produce flash + shake + hitStop', () => {
      for (const level of ['LIGHT', 'STRONG'] as const) {
        const effects = resolveTechnicalEffects(level, 0.5);
        expect(effects.map((e) => e.type).sort()).toEqual(['hitStop', 'screenFlash', 'screenShake']);
      }
    });

    it('51. STRONG is more intense than LIGHT', () => {
      const light = resolveTechnicalEffects('LIGHT', 0.5);
      const strong = resolveTechnicalEffects('STRONG', 0.5);
      const flashOf = (fx: typeof light) => fx.find((e) => e.type === 'screenFlash')!.opacity!;
      const shakeOf = (fx: typeof light) => fx.find((e) => e.type === 'screenShake')!.scale!;
      expect(flashOf(strong)).toBeGreaterThan(flashOf(light));
      expect(shakeOf(strong)).toBeGreaterThan(shakeOf(light));
    });

    it('52. AUTO derives from the action tier', () => {
      expect(resolveAutoPolishLevel(1)).toBe('LIGHT');
      expect(resolveAutoPolishLevel(3)).toBe('LIGHT');
      expect(resolveAutoPolishLevel(4)).toBe('STRONG');
      expect(resolveAutoPolishLevel(5)).toBe('STRONG');
    });

    it('53. technical effects are never visual slots', () => {
      const draft = baseDraft(['slotA']);
      const compiled = compileDraft(draft, { includeTechnical: true, getCadence });
      expect(compiled.slots).toHaveLength(1);
      expect(compiled.slots.every((s) => s.candidateId === 'slotA')).toBe(true);
      expect(compiled.technical.length).toBeGreaterThan(0);
    });
  });

  // ============================================================ Playback Separation

  describe('visual-only vs full playback', () => {
    it('54. visual-only compilation excludes ALL technical effects', () => {
      const draft = setTechnicalPolish(baseDraft(['slotA', 'slotB']), 'STRONG');
      const compiled = compileDraft(draft, { includeTechnical: false, getCadence });
      expect(compiled.technical).toEqual([]);
      expect(compiled.slots).toHaveLength(2);
    });

    it('55. full compilation includes technical polish', () => {
      const draft = setTechnicalPolish(baseDraft(['slotA']), 'STRONG');
      const compiled = compileDraft(draft, { includeTechnical: true, getCadence });
      expect(compiled.technical.length).toBe(3);
    });

    it('56. visual-only and full produce IDENTICAL visual slots', () => {
      const draft = setTechnicalPolish(baseDraft(['slotA', 'slotB']), 'STRONG');
      const visualsOnly = compileDraft(draft, { includeTechnical: false, getCadence });
      const full = compileDraft(draft, { includeTechnical: true, getCadence });
      expect(JSON.stringify(visualsOnly.slots)).toBe(JSON.stringify(full.slots));
    });

    it('57. visual-only stays empty even when polish is AUTO on a high tier', () => {
      const draft: VfxPresetDraft = { ...baseDraft(['slotA']), technicalPolish: 'AUTO', tier: 5 };
      expect(compileDraft(draft, { includeTechnical: false, getCadence }).technical).toEqual([]);
      expect(compileDraft(draft, { includeTechnical: true, getCadence }).technical.length).toBe(3);
    });
  });

  // ============================================================ Compilation

  describe('draft compilation', () => {
    it('58. every compiled slot carries complete runtime values', () => {
      const compiled = compileDraft(baseDraft(['slotA']), { includeTechnical: false, getCadence });
      const slot = compiled.slots[0]!;
      expect(slot.scale).toBeGreaterThan(0);
      expect(slot.duration).toBeGreaterThan(0);
      expect(slot.opacity).toBe(1);
      expect(slot.fadeIn).toBe(0);
      expect(slot.fadeOut).toBe(1);
      expect(slot.anchor).toBe('target');
      expect(slot.layer).toBe('impact');
      expect(slot.offsetX).toBe(0);
      expect(slot.offsetY).toBe(0);
    });

    it('59. ADVANCED keeps spatial/timing overrides but cannot weaken V2.2 visibility or layering', () => {
      let draft = baseDraft(['slotA']);
      const slotId = draft.visualSlots[0]!.id;
      draft = setSlotAdvancedOverride(draft, slotId, {
        scale: 9.5,
        duration: 3.25,
        opacity: 0.2,
        fadeIn: 0.4,
        fadeOut: 0.5,
        layer: 'ground',
      });
      const slot = compileDraft(draft, { includeTechnical: false, getCadence }).slots[0]!;
      expect(slot.scale).toBe(9.5);
      expect(slot.duration).toBe(3.25);
      expect(slot.opacity).toBe(1);
      expect(slot.fadeIn).toBe(0);
      expect(slot.fadeOut).toBe(1);
      expect(slot.layer).toBe('impact');
    });

    it('60. clearing ADVANCED restores semantic resolution', () => {
      let draft = baseDraft(['slotA']);
      const slotId = draft.visualSlots[0]!.id;
      draft = setSlotAdvancedOverride(draft, slotId, { scale: 9.5 });
      draft = clearSlotAdvancedOverride(draft, slotId);
      const slot = compileDraft(draft, { includeTechnical: false, getCadence }).slots[0]!;
      expect(slot.scale).not.toBe(9.5);
      expect(slot.scale).toBeCloseTo(resolveSlotScale('MID'), 5);
    });

    it('61. empty drafts compile safely', () => {
      const compiled = compileDraft(baseDraft([]), { includeTechnical: true, getCadence });
      expect(compiled.slots).toEqual([]);
      expect(compiled.totalDuration).toBe(0);
      expect(compiled.compatibility.compatible).toBe(false);
    });
  });

  // ============================================================ Serialization

  describe('draft serialization and restore', () => {
    it('62. round-trips a draft through JSON', () => {
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'PAIR_THEN_LAST');
      const restored = deserializeDraft(serializeDraft(draft));
      expect(restored).not.toBeNull();
      expect(restored!.choreography).toBe('PAIR_THEN_LAST');
      expect(restored!.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'slotB', 'slotC']);
    });

    it('63. rejects malformed draft JSON', () => {
      expect(deserializeDraft('{ not json')).toBeNull();
      expect(deserializeDraft('"a string"')).toBeNull();
      expect(deserializeDraft('{}')).toBeNull();
    });

    it('64. rejects drafts with invalid semantic profiles', () => {
      const bad = { ...baseDraft(['slotA']), visualSlots: [{ id: 'x', candidateId: 'y', sizeProfile: 'HUGE', timingProfile: 'NORMAL', placementProfile: 'AUTO' }] };
      expect(validateDraft(bad)).toBe(false);
    });

    it('65. rejects drafts with an unknown choreography', () => {
      expect(validateDraft({ ...baseDraft(['slotA']), choreography: 'SPIRAL' })).toBe(false);
    });

    it('66. bundle export/import round-trips every draft', () => {
      const drafts = {
        basic_greatsword_hit: baseDraft(['r1_1709']),
        n_dark_bolt: { ...baseDraft(['r1_0934']), actionKey: 'n_dark_bolt' },
      };
      const result = restoreDraftBundle(serializeDraftBundle(drafts));
      expect(result.ok).toBe(true);
      expect(Object.keys(result.drafts!).sort()).toEqual(['basic_greatsword_hit', 'n_dark_bolt']);
    });

    it('66b. repairs only the two known indicator assignments during action migration', () => {
      const rain = createDraftFromAction({
        actionKey: 'a_arrow_rain',
        visualSteps: [{ candidateId: 'r1_0004' }],
      });
      const zenith = createDraftFromAction({
        actionKey: 'a_zenith_arrow',
        visualSteps: [{ candidateId: 'r1_0005' }],
      });
      const unrelated = createDraftFromAction({
        actionKey: 'unrelated_action',
        visualSteps: [{ candidateId: 'r1_0004' }],
      });

      expect(rain.visualSlots[0]!.candidateId).toBe('r1_0614');
      expect(zenith.visualSlots[0]!.candidateId).toBe('r1_0963');
      expect(unrelated.visualSlots[0]!.candidateId).toBe('r1_0004');
    });

    it('67. bundle import accepts a bare drafts map', () => {
      const result = restoreDraftBundle(JSON.stringify({ a: { ...baseDraft(['slotA']), actionKey: 'a' } }));
      expect(result.ok).toBe(true);
      expect(result.drafts!.a).toBeDefined();
    });

    it('68. bundle import skips invalid drafts instead of failing wholesale', () => {
      const result = restoreDraftBundle(JSON.stringify({
        good: { ...baseDraft(['slotA']), actionKey: 'good' },
        bad: { nope: true },
      }));
      expect(result.ok).toBe(true);
      expect(result.drafts!.good).toBeDefined();
      expect(result.skipped).toContain('bad');
    });

    it('69. bundle import rejects a bundle with zero valid drafts', () => {
      const result = restoreDraftBundle(JSON.stringify({ bad: { nope: true } }));
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ============================================================ Durable Store

  describe('durable + portable draft store', () => {
    beforeEach(() => { localStorage.clear(); });

    it('70. store put/get/delete work by actionKey', () => {
      let store = createEmptyComposerStore();
      store = putDraft(store, baseDraft(['slotA']));
      expect(getDraft(store, 'basic_greatsword_hit')).toBeDefined();
      store = deleteDraft(store, 'basic_greatsword_hit');
      expect(getDraft(store, 'basic_greatsword_hit')).toBeUndefined();
    });

    it('71. store survives a localStorage save/load cycle', () => {
      let store = createEmptyComposerStore();
      store = putDraft(store, setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'PAIR_THEN_LAST'));
      saveComposerStore(localStorage, store);
      const loaded = loadComposerStore(localStorage);
      expect(loaded.drafts.basic_greatsword_hit!.choreography).toBe('PAIR_THEN_LAST');
      expect(loaded.drafts.basic_greatsword_hit!.visualSlots).toHaveLength(3);
    });

    it('72. localStorage is a cache only — portable JSON is the durable source', () => {
      let store = createEmptyComposerStore();
      store = putDraft(store, baseDraft(['r1_1709']));
      const portable = exportComposerDrafts(store);
      // Simulate a completely different browser profile.
      localStorage.clear();
      const fresh = loadComposerStore(localStorage);
      expect(Object.keys(fresh.drafts)).toHaveLength(0);
      const imported = importComposerDrafts(fresh, portable);
      expect(imported.ok).toBe(true);
      expect(imported.store!.drafts.basic_greatsword_hit!.visualSlots[0]!.candidateId).toBe('r1_1709');
    });

    it('73. fresh-profile import restores the exact composition', () => {
      let store = createEmptyComposerStore();
      let draft = baseDraft(['slotA', 'slotB', 'slotC']);
      draft = setChoreography(draft, 'PAIR_THEN_LAST');
      draft = setTechnicalPolish(draft, 'STRONG');
      draft = updateSlotProfile(draft, draft.visualSlots[0]!.id, { sizeProfile: 'BIG', timingProfile: 'LONG', placementProfile: 'GROUND' });
      store = putDraft(store, draft);
      const portable = exportComposerDrafts(store);

      localStorage.clear();
      const imported = importComposerDrafts(loadComposerStore(localStorage), portable);
      const restored = imported.store!.drafts.basic_greatsword_hit!;
      expect(restored.choreography).toBe('PAIR_THEN_LAST');
      expect(restored.technicalPolish).toBe('STRONG');
      expect(restored.visualSlots[0]!.sizeProfile).toBe('BIG');
      expect(restored.visualSlots[0]!.timingProfile).toBe('LONG');
      expect(restored.visualSlots[0]!.placementProfile).toBe('GROUND');
      expect(restored.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'slotB', 'slotC']);
    });

    it('74. compiled output is identical before export and after import', () => {
      let store = createEmptyComposerStore();
      const draft = setChoreography(baseDraft(['slotA', 'slotB', 'slotC']), 'SEQUENCE');
      store = putDraft(store, draft);
      const before = compileDraft(draft, { includeTechnical: true, getCadence });
      const imported = importComposerDrafts(createEmptyComposerStore(), exportComposerDrafts(store));
      const after = compileDraft(imported.store!.drafts.basic_greatsword_hit!, { includeTechnical: true, getCadence });
      expect(JSON.stringify(after.slots)).toBe(JSON.stringify(before.slots));
      expect(JSON.stringify(after.technical)).toBe(JSON.stringify(before.technical));
    });

    it('75. corrupt store data degrades to an empty store', () => {
      localStorage.setItem(COMPOSER_STORAGE_KEY, '{ not json');
      expect(Object.keys(loadComposerStore(localStorage).drafts)).toHaveLength(0);
      expect(deserializeComposerStore('{ not json')).toBeNull();
      expect(deserializeComposerStore('{}')).toBeNull();
    });

    it('76. invalid drafts inside a store are dropped, valid ones survive', () => {
      localStorage.setItem(COMPOSER_STORAGE_KEY, JSON.stringify({
        drafts: { good: { ...baseDraft(['slotA']), actionKey: 'good' }, bad: { nope: 1 } },
      }));
      const loaded = loadComposerStore(localStorage);
      expect(loaded.drafts.good).toBeDefined();
      expect(loaded.drafts.bad).toBeUndefined();
    });
  });

  // ============================================================ Migration

  describe('migration from existing presets', () => {
    it('77. creates a draft from an existing action', () => {
      const draft = createDraftFromAction({
        actionKey: 'basic_greatsword_hit',
        presetId: 'basic_greatsword_cleave',
        tier: 1,
        visualSteps: [{ candidateId: 'r1_1709', anchor: 'target', layer: 'impact' }],
      });
      expect(draft.actionKey).toBe('basic_greatsword_hit');
      expect(draft.presetId).toBe('basic_greatsword_cleave');
      expect(draft.visualSlots).toHaveLength(1);
      expect(draft.visualSlots[0]!.candidateId).toBe('r1_1709');
      expect(draft.autoPlacement).toBe('TARGET');
    });

    it('78. existing candidates seed the draft but are NOT locked', () => {
      let draft = createDraftFromAction({
        actionKey: 'n_dark_bolt',
        visualSteps: [{ candidateId: 'r1_0934' }],
      });
      draft = replaceSlotCandidate(draft, draft.visualSlots[0]!.id, 'slotB');
      expect(draft.visualSlots[0]!.candidateId).toBe('slotB');
      draft = removeSlot(draft, draft.visualSlots[0]!.id);
      expect(draft.visualSlots).toHaveLength(0);
    });

    it('79. multi-step presets migrate to multiple slots', () => {
      const draft = createDraftFromAction({
        actionKey: 'd_devouring_eclipse',
        visualSteps: [
          { candidateId: 'slotA', anchor: 'groundTarget' },
          { candidateId: 'slotB' },
          { candidateId: 'slotC' },
        ],
      });
      expect(draft.visualSlots).toHaveLength(3);
      expect(draft.autoPlacement).toBe('GROUND');
      expect(draft.choreography).toBe('SEQUENCE');
    });

    it('80. steps without any source are skipped', () => {
      const draft = createDraftFromAction({
        actionKey: 'x',
        visualSteps: [{ candidateId: 'slotA' }, {}, { spriteSheetId: 'megapack_shield_on' }],
      });
      expect(draft.visualSlots.map((s) => s.candidateId)).toEqual(['slotA', 'megapack_shield_on']);
    });

    it('81. migration never validates or applies anything', () => {
      const draft = createDraftFromAction({ actionKey: 'x', visualSteps: [{ candidateId: 'slotA' }] });
      expect(draft).not.toHaveProperty('validated');
      expect(draft).not.toHaveProperty('applied');
      expect(draft).not.toHaveProperty('verified');
    });
  });

  // ============================================================ Production Safety

  describe('production remains unchanged', () => {
    it('82. composer operations do not touch registered production presets', () => {
      const before = JSON.stringify(getVfxPreset('basic_greatsword_cleave') ?? null);
      let draft = createDraftFromAction({
        actionKey: 'basic_greatsword_hit',
        presetId: 'basic_greatsword_cleave',
        visualSteps: [{ candidateId: 'r1_1709' }],
      });
      draft = addSlot(draft, 'r1_0934');
      draft = setChoreography(draft, 'SEQUENCE');
      draft = setTechnicalPolish(draft, 'STRONG');
      compileDraft(draft, { includeTechnical: true, getCadence });
      expect(JSON.stringify(getVfxPreset('basic_greatsword_cleave') ?? null)).toBe(before);
    });

    it('83. composer never registers new production sprite sheets', () => {
      const before = Object.keys(VFX_SPRITE_SHEETS).length;
      let draft = baseDraft([]);
      draft = addSlot(draft, 'r1_1709');
      draft = addSlot(draft, 'r1_0934');
      compileDraft(draft, { includeTechnical: true, getCadence });
      expect(Object.keys(VFX_SPRITE_SHEETS).length).toBe(before);
    });

    it('84. the draft model carries no production mapping fields', () => {
      const draft = baseDraft(['slotA']);
      expect(draft).not.toHaveProperty('productionMappings');
      expect(draft).not.toHaveProperty('presetOverrides');
      expect(draft).not.toHaveProperty('validatedByActionStep');
    });

    it('85. the composer store is isolated from the legacy Lab state key', () => {
      expect(COMPOSER_STORAGE_KEY).toBe('r2c-vfx-composer-drafts');
      expect(COMPOSER_STORAGE_KEY).not.toBe('r2c-combat-vfx-lab-state');
    });
  });
});
