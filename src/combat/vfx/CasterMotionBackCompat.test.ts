/**
 * PHASE B NON-REGRESSION GATE.
 *
 * Caster motion was specified as a purely ADDITIVE layer. This suite is the
 * executable proof of that claim, run against the REAL published registry
 * rather than synthetic fixtures.
 *
 * If any of these tests fail, Phase B has broken existing content and must not
 * ship — regardless of how well the new feature itself works.
 */

import { describe, it, expect } from 'vitest';
import publishedRegistryData from './generated/published-vfx-presets.json';
import {
  computeFingerprint,
  draftToPublishedEntry,
  publishedEntryToDraft,
  validatePublishedEntry,
  validatePublishedRegistry,
  type PublishedVfxEntry,
  type PublishedVfxRegistry,
} from './PublishedVfxRegistry';
import {
  compileDraft,
  validateDraft,
  serializeDraft,
  deserializeDraft,
  addCasterMotion,
  removeCasterMotion,
  hasCasterMotion,
  type VfxPresetDraft,
} from './VfxPresetComposer';
import { compileCasterMotion, createCasterMotionStep } from './CasterMotion';

const registry = publishedRegistryData as PublishedVfxRegistry;
const entries = Object.values(registry.actions) as PublishedVfxEntry[];
const actionKeys = Object.keys(registry.actions);

/** Compile options mirroring production, with a fixed cadence for determinism. */
const compileOptions = {
  includeTechnical: true,
  getCadence: () => ({ frameCount: 64, frameDurationMs: 33.125 }),
};

describe('Phase B back-compat — the real published registry', () => {
  it('contains the expected 33 published actions', () => {
    expect(actionKeys).toHaveLength(33);
  });

  it('has no pre-existing entry carrying caster motion', () => {
    for (const entry of entries) {
      expect(entry.casterMotion).toBeUndefined();
    }
  });

  it('still validates as a whole registry after the additive schema change', () => {
    expect(validatePublishedRegistry(registry).ok).toBe(true);
  });

  it('validates every individual entry unchanged', () => {
    for (const entry of entries) {
      const result = validatePublishedEntry(entry);
      expect(result.errors).toEqual([]);
    }
  });

  it('keeps schemaVersion at 1 — motion is additive, not a migration', () => {
    expect(registry.schemaVersion).toBe(1);
  });
});

describe('Phase B back-compat — fingerprint stability', () => {
  /**
   * THE decisive test. Every stored fingerprint was computed BEFORE caster
   * motion existed. Recomputing them with the Phase B code must reproduce the
   * exact same hashes, otherwise the Composer would report all 33 published
   * actions as "MODIFIED SINCE PUBLISH".
   */
  it('recomputes the identical stored fingerprint for all 33 published actions', () => {
    const drifted: string[] = [];
    for (const entry of entries) {
      const draft = publishedEntryToDraft(entry);
      const recomputed = computeFingerprint(draft);
      if (recomputed !== entry.fingerprint) {
        drifted.push(`${entry.actionKey}: stored=${entry.fingerprint} recomputed=${recomputed}`);
      }
    }
    expect(drifted).toEqual([]);
  });

  it('is unaffected by an absent, empty, or all-no-op motion list', () => {
    for (const entry of entries.slice(0, 5)) {
      const base = publishedEntryToDraft(entry);
      const empty: VfxPresetDraft = { ...base, casterMotion: [] };
      const noop: VfxPresetDraft = { ...base, casterMotion: [createCasterMotionStep('IDLE')] };
      expect(computeFingerprint(empty)).toBe(entry.fingerprint);
      expect(computeFingerprint(noop)).toBe(entry.fingerprint);
    }
  });

  it('DOES change once an effective motion is authored', () => {
    const base = publishedEntryToDraft(entries[0]!);
    const moved = addCasterMotion(base, 'DASH_SHORT');
    expect(computeFingerprint(moved)).not.toBe(computeFingerprint(base));
    expect(computeFingerprint(moved)).not.toBe(entries[0]!.fingerprint);
  });

  it('returns to the original fingerprint when the motion is removed again', () => {
    for (const entry of entries.slice(0, 5)) {
      const base = publishedEntryToDraft(entry);
      const moved = addCasterMotion(base, 'JUMP_ARC');
      const step = moved.casterMotion![0]!;
      const reverted = removeCasterMotion(moved, step.id);
      expect(computeFingerprint(reverted)).toBe(entry.fingerprint);
    }
  });
});

describe('Phase B back-compat — compiled playback parity', () => {
  /**
   * Motion must not perturb the compiled VISUAL plan in any way. Slots, timing,
   * phases and technical events are compared field-by-field.
   */
  it('produces an identical compiled slot plan with and without an empty motion list', () => {
    for (const entry of entries) {
      const base = publishedEntryToDraft(entry);
      const withEmpty: VfxPresetDraft = { ...base, casterMotion: [] };
      const a = compileDraft(base, compileOptions);
      const b = compileDraft(withEmpty, compileOptions);
      expect(JSON.stringify(b.slots)).toBe(JSON.stringify(a.slots));
      expect(JSON.stringify(b.technical)).toBe(JSON.stringify(a.technical));
      expect(b.totalDuration).toBe(a.totalDuration);
      expect(b.impactTime).toBe(a.impactTime);
    }
  });

  it('leaves slots, technical events and impactTime untouched even with real motion', () => {
    for (const entry of entries.slice(0, 8)) {
      const base = publishedEntryToDraft(entry);
      const moved = addCasterMotion(base, 'DASH_SHORT');
      const a = compileDraft(base, compileOptions);
      const b = compileDraft(moved, compileOptions);
      expect(JSON.stringify(b.slots)).toBe(JSON.stringify(a.slots));
      expect(JSON.stringify(b.technical)).toBe(JSON.stringify(a.technical));
      expect(b.impactTime).toBe(a.impactTime);
    }
  });

  it('always exposes an empty motion plan for pre-Phase-B presets', () => {
    for (const entry of entries) {
      const compiled = compileDraft(publishedEntryToDraft(entry), compileOptions);
      expect(compiled.casterMotion.steps).toHaveLength(0);
      expect(compiled.casterMotion.hasEffect).toBe(false);
    }
  });

  it('only ever extends totalDuration, never shortens it', () => {
    for (const entry of entries.slice(0, 8)) {
      const base = publishedEntryToDraft(entry);
      const a = compileDraft(base, compileOptions);
      const b = compileDraft(addCasterMotion(base, 'JUMP_ARC'), compileOptions);
      expect(b.totalDuration).toBeGreaterThanOrEqual(a.totalDuration);
    }
  });
});

describe('Phase B back-compat — serialization round-trips', () => {
  it('accepts every published entry converted to a draft', () => {
    for (const entry of entries) {
      expect(validateDraft(publishedEntryToDraft(entry))).toBe(true);
    }
  });

  it('round-trips a legacy draft with no motion field added', () => {
    for (const entry of entries) {
      const draft = publishedEntryToDraft(entry);
      const restored = deserializeDraft(serializeDraft(draft));
      expect(restored).not.toBeNull();
      expect(restored!.casterMotion).toBeUndefined();
      expect(computeFingerprint(restored!)).toBe(entry.fingerprint);
    }
  });

  it('round-trips an authored motion without loss', () => {
    const draft = addCasterMotion(publishedEntryToDraft(entries[0]!), 'JUMP_ARC', {
      duration: 0.5, distance: 0.75, height: 1.25,
      destination: 'TARGET_BACK', easing: 'EASE_IN_OUT', returnToOrigin: true,
    });
    const restored = deserializeDraft(serializeDraft(draft));
    expect(restored).not.toBeNull();
    expect(restored!.casterMotion).toEqual(draft.casterMotion);
    expect(computeFingerprint(restored!)).toBe(computeFingerprint(draft));
  });

  it('rejects a draft carrying structurally invalid motion', () => {
    const draft = publishedEntryToDraft(entries[0]!);
    expect(validateDraft({ ...draft, casterMotion: [{ id: 'x', type: 'WARP' }] })).toBe(false);
    expect(validateDraft({ ...draft, casterMotion: 'nope' })).toBe(false);
  });

  it('omits casterMotion from a published entry when no effective motion exists', () => {
    const base = publishedEntryToDraft(entries[0]!);
    expect(draftToPublishedEntry(base).casterMotion).toBeUndefined();
    expect(draftToPublishedEntry({ ...base, casterMotion: [] }).casterMotion).toBeUndefined();
    const noop = { ...base, casterMotion: [createCasterMotionStep('IDLE')] };
    expect(draftToPublishedEntry(noop).casterMotion).toBeUndefined();
  });

  it('persists and restores casterMotion through a full publish round-trip', () => {
    const draft = addCasterMotion(publishedEntryToDraft(entries[0]!), 'DASH_THROUGH');
    const entry = draftToPublishedEntry(draft);
    expect(entry.casterMotion).toHaveLength(1);
    expect(validatePublishedEntry(entry).errors).toEqual([]);
    const back = publishedEntryToDraft(entry);
    expect(hasCasterMotion(back)).toBe(true);
    expect(computeFingerprint(back)).toBe(entry.fingerprint);
  });

  it('does not alias motion arrays between draft and published entry', () => {
    const draft = addCasterMotion(publishedEntryToDraft(entries[0]!), 'DASH_SHORT');
    const entry = draftToPublishedEntry(draft);
    expect(entry.casterMotion).not.toBe(draft.casterMotion);
    expect(entry.casterMotion![0]).not.toBe(draft.casterMotion![0]);
  });
});

describe('Phase B back-compat — draft operations are immutable', () => {
  it('never mutates the input draft', () => {
    const base = publishedEntryToDraft(entries[0]!);
    const before = JSON.stringify(base);
    addCasterMotion(base, 'DASH_SHORT');
    removeCasterMotion(base, 'missing');
    expect(JSON.stringify(base)).toBe(before);
  });

  it('drops the field entirely when the last motion is removed', () => {
    const base = publishedEntryToDraft(entries[0]!);
    const moved = addCasterMotion(base, 'DASH_SHORT');
    const reverted = removeCasterMotion(moved, moved.casterMotion![0]!.id);
    expect('casterMotion' in reverted).toBe(false);
  });

  it('returns the same object reference when removing an unknown motion id', () => {
    const base = publishedEntryToDraft(entries[0]!);
    expect(removeCasterMotion(base, 'does_not_exist')).toBe(base);
  });

  it('appends sequentially so a new motion never overlaps existing motion', () => {
    let draft = publishedEntryToDraft(entries[0]!);
    draft = addCasterMotion(draft, 'DASH_SHORT');
    draft = addCasterMotion(draft, 'JUMP_UP');
    const [first, second] = draft.casterMotion!;
    const overrides = new Map([
      [first!.id, 0],
      [second!.id, compileCasterMotion([first!]).steps[0]!.endTime],
    ]);
    const compiled = compileCasterMotion(draft.casterMotion, overrides);
    const [c1, c2] = compiled.steps;
    expect(c2!.startTime).toBeGreaterThanOrEqual(c1!.endTime);
  });
});

describe('V2.7.1 back-compat — legacy startTime is silently ignored', () => {
  it('compiles a motion step carrying a legacy startTime field without using it', () => {
    const legacy = { id: 'm', type: 'DASH_SHORT', startTime: 0.5, duration: 0.2 } as unknown;
    const compiled = compileCasterMotion([legacy as never]);
    expect(compiled.steps[0]!.startTime).toBe(0);
  });
});
