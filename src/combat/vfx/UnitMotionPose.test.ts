import { describe, expect, it } from 'vitest';
import {
  UNIT_MOTION_ACTORS,
  UNIT_MOTION_TYPES,
  compileUnitMotion,
  createUnitMotionStep,
  resolveUnitMotionStep,
  sampleUnitMotionOffset,
  unitMotionDestinationsForActor,
  validateCasterMotionStep,
  validateLinkedUnitMotion,
  validateUnitMotionStep,
  type CasterMotionStep,
  type MutableVec3,
} from './CasterMotion';
import {
  addMotionToBeat,
  compileDraft,
  validateChoreographyBeats,
  restoreDraftBundle,
  serializeDraftBundle,
  validateDraft,
  validateDraftForPublication,
  type VfxPresetDraft,
} from './VfxPresetComposer';
import {
  computeFingerprint,
  draftToPublishedEntry,
  publishedEntryToDraft,
  validatePublishedEntry,
} from './PublishedVfxRegistry';

function draftWith(motions: CasterMotionStep[]): VfxPresetDraft {
  return {
    actionKey: 'test_action',
    presetId: 'test_preset',
    visualSlots: [{
      id: 'slot',
      candidateId: 'r1_0001',
      sizeProfile: 'MID',
      timingProfile: 'NORMAL',
      placementProfile: 'TARGET',
    }],
    choreography: 'TOGETHER',
    technicalPolish: 'OFF',
    casterMotion: motions,
    beats: [{ id: 'beat', startDelay: 0, vfxSlotIds: ['slot'], casterMotionIds: motions.map((m) => m.id) }],
  };
}

const resolver = (anchor: string, out: MutableVec3): void => {
  out.x = anchor.startsWith('target') ? 4 : anchor.startsWith('source') ? -4 : 0;
  out.y = 0;
  out.z = 0;
};

describe('linked Unit Motion + Pose authoring', () => {
  it('exposes the canonical actor and motion vocabularies', () => {
    expect(UNIT_MOTION_ACTORS).toEqual(['CASTER', 'TARGET']);
    expect(UNIT_MOTION_TYPES).toEqual(['HOLD', 'DASH_SHORT', 'DASH_THROUGH', 'JUMP_UP', 'JUMP_DOWN', 'JUMP_ARC']);
    expect(UNIT_MOTION_TYPES).not.toContain('IDLE');
  });

  it('creates a safe CASTER + PREPARE + HOLD step by default', () => {
    expect(createUnitMotionStep()).toMatchObject({ actor: 'CASTER', pose: 'prepare', type: 'HOLD' });
  });

  it('allows pose and motion to be selected independently without inference', () => {
    expect(createUnitMotionStep('DASH_SHORT', { pose: 'prepare' })).toMatchObject({ pose: 'prepare', type: 'DASH_SHORT' });
    expect(createUnitMotionStep('HOLD', { pose: 'dash' })).toMatchObject({ pose: 'dash', type: 'HOLD' });
    expect(createUnitMotionStep('JUMP_ARC', { pose: 'cast' })).toMatchObject({ pose: 'cast', type: 'JUMP_ARC' });
  });

  it('resolves HOLD as an explicit spatial no-op', () => {
    const step = createUnitMotionStep('HOLD', { pose: 'attack' });
    const resolved = resolveUnitMotionStep(step);
    const compiled = compileUnitMotion([step]);
    expect(resolved).toMatchObject({ destination: 'ORIGIN', distance: 0, height: 0, returnToOrigin: false });
    expect(compiled.steps[0]).toMatchObject({ actor: 'CASTER', pose: 'attack', type: 'HOLD', isNoop: true });
    expect(compiled.hasEffect).toBe(false);
    expect(compiled.hasPresentation).toBe(true);
  });

  it('normalizes legacy IDLE to HOLD without adding a pose override', () => {
    const resolved = resolveUnitMotionStep({ id: 'legacy', type: 'IDLE' });
    expect(resolved).toMatchObject({ actor: 'CASTER', pose: null, type: 'HOLD' });
    expect(validateCasterMotionStep({ id: 'legacy', type: 'IDLE' }).ok).toBe(true);
  });

  it('preserves legacy no-pose behavior as inherit/current visual', () => {
    const compiled = compileUnitMotion([{ id: 'legacy', type: 'DASH_SHORT' }]);
    expect(compiled.steps[0]?.pose).toBeNull();
    expect(compiled.steps[0]?.actor).toBe('CASTER');
  });

  it('requires actor, pose and canonical type for strict new steps', () => {
    expect(validateUnitMotionStep(createUnitMotionStep()).ok).toBe(true);
    expect(validateUnitMotionStep({ id: 'legacy', type: 'DASH_SHORT' }).ok).toBe(false);
    expect(validateUnitMotionStep({ id: 'legacy', actor: 'CASTER', type: 'IDLE', pose: 'prepare' }).ok).toBe(false);
    expect(validateLinkedUnitMotion([{ id: 'legacy', type: 'DASH_SHORT' }]).ok).toBe(false);
  });

  it('rejects meaningful displacement fields on HOLD', () => {
    expect(validateUnitMotionStep({ ...createUnitMotionStep(), distance: 0.5 }).ok).toBe(false);
    expect(validateUnitMotionStep({ ...createUnitMotionStep(), height: 1 }).ok).toBe(false);
    expect(validateUnitMotionStep({ ...createUnitMotionStep(), destination: 'TARGET' }).ok).toBe(false);
    expect(validateUnitMotionStep({ ...createUnitMotionStep(), returnToOrigin: true }).ok).toBe(false);
  });

  it('filters actor-aware destination choices', () => {
    expect(unitMotionDestinationsForActor('CASTER')).toEqual(['ORIGIN', 'TARGET', 'TARGET_FRONT', 'TARGET_BACK']);
    expect(unitMotionDestinationsForActor('TARGET')).toEqual(['ORIGIN', 'CASTER', 'CASTER_FRONT', 'CASTER_BACK']);
  });

  it('resolves TARGET defaults toward CASTER and validates actor destinations', () => {
    const resolved = resolveUnitMotionStep(createUnitMotionStep('DASH_SHORT', { actor: 'TARGET', pose: 'dash' }));
    expect(resolved.destination).toBe('CASTER');
    expect(validateUnitMotionStep(createUnitMotionStep('DASH_SHORT', {
      actor: 'TARGET', pose: 'dash', destination: 'TARGET',
    })).ok).toBe(false);
    expect(validateUnitMotionStep(createUnitMotionStep('DASH_SHORT', {
      actor: 'TARGET', pose: 'dash', destination: 'CASTER_FRONT',
    })).ok).toBe(true);
  });

  it('samples CASTER and TARGET from the same compiled plan without cross-talk', () => {
    const caster = createUnitMotionStep('DASH_THROUGH', { actor: 'CASTER', pose: 'attack', returnToOrigin: false });
    const target = createUnitMotionStep('DASH_THROUGH', { actor: 'TARGET', pose: 'dash', returnToOrigin: false });
    const compiled = compileUnitMotion([caster, target]);
    const casterOut: MutableVec3 = { x: 0, y: 0, z: 0 };
    const targetOut: MutableVec3 = { x: 0, y: 0, z: 0 };
    sampleUnitMotionOffset(compiled, 1, 'CASTER', resolver, casterOut);
    sampleUnitMotionOffset(compiled, 1, 'TARGET', resolver, targetOut);
    expect(casterOut.x).toBeGreaterThan(0);
    expect(targetOut.x).toBeLessThan(0);
  });
});

describe('linked Unit Motion + Pose Beats and publication', () => {
  it('allows one CASTER and one TARGET step in the same Beat', () => {
    const caster = createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'attack' });
    const target = createUnitMotionStep('JUMP_ARC', { actor: 'TARGET', pose: 'dash' });
    expect(validateChoreographyBeats(draftWith([caster, target])).ok).toBe(true);
  });

  it('rejects duplicate same-actor steps in one Beat', () => {
    const a = createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'attack' });
    const b = createUnitMotionStep('DASH_SHORT', { actor: 'CASTER', pose: 'dash' });
    const result = validateChoreographyBeats(draftWith([a, b]));
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('CASTER');
  });

  it('refuses assignment that would create a same-actor duplicate', () => {
    const a = createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'attack' });
    const b = createUnitMotionStep('DASH_SHORT', { actor: 'CASTER', pose: 'dash' });
    const draft = draftWith([a, b]);
    draft.beats![0]!.casterMotionIds = [a.id];
    const result = addMotionToBeat(draft, 'beat', b.id);
    expect(result).toBe(draft);
  });

  it('keeps Beat.startDelay as the sole authored start authority', () => {
    const caster = createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'cast' });
    const target = createUnitMotionStep('JUMP_ARC', { actor: 'TARGET', pose: 'dash' });
    const draft = draftWith([caster, target]);
    draft.beats![0]!.startDelay = 0.4;
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect('startTime' in caster).toBe(false);
    expect('startTime' in target).toBe(false);
    expect(compiled.compiledBeats[0]?.startTime).toBe(0.4);
    expect(compiled.compiledBeats[0]?.casterMotions.map((motion) => motion.startTime)).toEqual([0.4, 0.4]);
    expect(compiled.casterMotion.steps.map((motion) => motion.startTime)).toEqual([0.4, 0.4]);
  });

  it('loads legacy drafts but requires linked steps for publication', () => {
    const legacy = draftWith([{ id: 'legacy', type: 'DASH_SHORT' }]);
    expect(validateDraft(legacy)).toBe(true);
    expect(validateDraftForPublication(legacy)).toBe(false);
    expect(validateDraftForPublication(draftWith([createUnitMotionStep()]))).toBe(true);
  });

  it('round-trips linked fields through portable draft export/import', () => {
    const motion = createUnitMotionStep('HOLD', { actor: 'TARGET', pose: 'cast' });
    const restored = restoreDraftBundle(serializeDraftBundle({ test_action: draftWith([motion]) }));
    expect(restored.ok).toBe(true);
    expect(restored.drafts?.test_action?.casterMotion?.[0]).toMatchObject({
      actor: 'TARGET', pose: 'cast', type: 'HOLD',
    });
  });

  it('round-trips actor, pose, HOLD and TARGET through publication', () => {
    const motion = createUnitMotionStep('HOLD', { actor: 'TARGET', pose: 'cast' });
    const draft = draftWith([motion]);
    const entry = draftToPublishedEntry(draft);
    const restored = publishedEntryToDraft(entry);
    expect(restored.casterMotion?.[0]).toMatchObject({ actor: 'TARGET', pose: 'cast', type: 'HOLD' });
    expect(validatePublishedEntry(entry).ok).toBe(true);
  });

  it('published validation rejects invalid actor and pose values', () => {
    const motion = createUnitMotionStep('HOLD', { actor: 'TARGET', pose: 'cast' });
    const entry = draftToPublishedEntry(draftWith([motion]));
    const invalidActor = { ...entry, casterMotion: [{ ...entry.casterMotion![0]!, actor: 'OTHER' }] };
    const invalidPose = { ...entry, casterMotion: [{ ...entry.casterMotion![0]!, pose: 'hit' }] };
    expect(validatePublishedEntry(invalidActor).ok).toBe(false);
    expect(validatePublishedEntry(invalidPose).ok).toBe(false);
  });

  it('changes fingerprints when actor, pose or motion changes', () => {
    const base = createUnitMotionStep('HOLD', { actor: 'CASTER', pose: 'attack' });
    const baseFingerprint = computeFingerprint(draftWith([base]));
    expect(computeFingerprint(draftWith([{ ...base, actor: 'TARGET', destination: 'ORIGIN' }]))).not.toBe(baseFingerprint);
    expect(computeFingerprint(draftWith([{ ...base, pose: 'cast' }]))).not.toBe(baseFingerprint);
    expect(computeFingerprint(draftWith([{ ...base, type: 'DASH_SHORT', destination: 'TARGET' }]))).not.toBe(baseFingerprint);
  });

  it('keeps legacy published IDLE and no-actor/no-pose entries readable', () => {
    const legacySpatial = draftWith([{ id: 'legacy-dash', type: 'DASH_SHORT' }]);
    const spatialEntry = draftToPublishedEntry(legacySpatial);
    expect(validatePublishedEntry(spatialEntry).ok).toBe(true);
    expect(publishedEntryToDraft(spatialEntry).casterMotion?.[0]).toEqual({ id: 'legacy-dash', type: 'DASH_SHORT' });

    const baseEntry = draftToPublishedEntry({ ...legacySpatial, casterMotion: undefined, beats: undefined });
    const idleEntry = { ...baseEntry, casterMotion: [{ id: 'legacy-idle', type: 'IDLE' as const }] };
    expect(validatePublishedEntry(idleEntry).ok).toBe(true);
    expect(compileUnitMotion(publishedEntryToDraft(idleEntry).casterMotion).steps[0]).toMatchObject({
      actor: 'CASTER', pose: null, type: 'HOLD', isNoop: true,
    });
  });

  it('keeps legacy spatial-motion fingerprints unchanged by implicit compatibility defaults', () => {
    const legacy = draftWith([{ id: 'legacy', type: 'DASH_SHORT' }]);
    const explicitDefaults = draftWith([{ id: 'legacy', type: 'DASH_SHORT', actor: 'CASTER', pose: 'prepare' }]);
    expect(computeFingerprint(legacy)).not.toBe(computeFingerprint(explicitDefaults));
    expect(resolveUnitMotionStep(legacy.casterMotion![0]!).pose).toBeNull();
  });
});
