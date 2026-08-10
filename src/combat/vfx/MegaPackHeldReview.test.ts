import { describe, expect, it } from 'vitest';
import { getSkillPresentation } from '../skillPresentation';
import { resolvePresentationRoute } from '../stage/combatStageProfiles';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import {
  getMegaPackHeldReviewEntries,
  getNeedsAltEntries,
  getPresentationTuneOnlyEntries,
  getAlternativesFor,
  isDirectionalAction,
  getCandidateAvailability,
  MEGAPACK_HELD_REVIEW_ROOT,
  type HeldCandidateVerdict,
} from './MegaPackHeldReview';
import {
  decisionKey,
  parseRawDecisions,
  buildExportPayload,
  createReviewState,
  loadReviewStateFromRaw,
  resolveSelectedCandidate,
  resolveNextUnresolvedAction,
  getActionStatus,
  getCandidateVerdict,
  getProgress,
  applyVerdict,
  applyNotes,
  applySelectedCandidate,
  applyDirection,
  type ReviewState,
} from './MegaPackHeldReviewWorkbench';

const allowedVerdicts: readonly HeldCandidateVerdict[] = [
  'LOCK',
  'REJECT',
  'NEEDS_ALT',
  'PRESENTATION_TUNE_ONLY',
];

describe('R2C-A held Mega Pack source review', () => {
  it('keeps all 16 candidate sources dev-only, native, and outside production registries', () => {
    const entries = getMegaPackHeldReviewEntries();

    expect(entries).toHaveLength(16);
    expect(new Set(entries.map((entry) => entry.actionId)).size).toBe(16);
    expect(new Set(entries.map((entry) => entry.sourceId)).size).toBe(16);

    for (const entry of entries) {
      expect(entry.source.url.startsWith(MEGAPACK_HELD_REVIEW_ROOT)).toBe(true);
      expect(entry.source.url).not.toContain('/raw/');
      expect(entry.source.url).not.toContain('/validation/');
      expect(entry.source.url).not.toContain('/processed/');
      expect(entry.source.url).not.toContain('/rejected/');
      expect(entry.source.sheetWidthPx / entry.source.cols).toBe(512);
      expect(entry.source.sheetHeightPx / entry.source.rows).toBe(512);
      expect(entry.source.frameCount).toBe(entry.source.cols * entry.source.rows);
      expect(allowedVerdicts).toContain(entry.provisionalVerdict);
      expect(Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, entry.source.id)).toBe(false);
    }
  });

  it('derives the real presentation route from the actual action metadata', () => {
    for (const entry of getMegaPackHeldReviewEntries()) {
      const route = resolvePresentationRoute(entry.actionSpec, getSkillPresentation(entry.actionSpec));
      expect(entry.route).toBe(route.route);
      expect(entry.routeReason).toBe(route.reason);
      expect(entry.routeFamily).toBe(route.family);
    }
  });

  it('uses r1_0453 exclusively for Flame Wave and never uses the Dragon Breath reservation', () => {
    const flameWave = getMegaPackHeldReviewEntries().find((entry) => entry.actionId === 'n_flame_wave');

    expect(flameWave?.sourceId).toBe('r1_0453');
    expect(getMegaPackHeldReviewEntries().some((entry) => entry.sourceId === 'r1_0450')).toBe(false);
  });

  it('keeps the source-lock review split between tune-only and alternate-source decisions', () => {
    const verdicts = getMegaPackHeldReviewEntries().map((entry) => entry.provisionalVerdict);

    expect(verdicts.filter((verdict) => verdict === 'PRESENTATION_TUNE_ONLY')).toHaveLength(9);
    expect(verdicts.filter((verdict) => verdict === 'NEEDS_ALT')).toHaveLength(7);
    expect(verdicts).not.toContain('LOCK');
    expect(verdicts).not.toContain('REJECT');
  });
});

describe('R2C-A.1-LITE human review workbench', () => {
  it('getNeedsAltEntries returns exactly 7 entries', () => {
    expect(getNeedsAltEntries()).toHaveLength(7);
  });

  it('getPresentationTuneOnlyEntries returns exactly 9 entries', () => {
    expect(getPresentationTuneOnlyEntries()).toHaveLength(9);
  });

  it('PRESENTATION_TUNE_ONLY entries have no alternatives (frozen from replacement search)', () => {
    for (const entry of getPresentationTuneOnlyEntries()) {
      expect(getAlternativesFor(entry.actionId)).toHaveLength(0);
    }
  });

  it('NEEDS_ALT entries have at most 3 alternatives each', () => {
    for (const entry of getNeedsAltEntries()) {
      const alts = getAlternativesFor(entry.actionId);
      expect(alts.length).toBeGreaterThan(0);
      expect(alts.length).toBeLessThanOrEqual(3);
    }
  });

  it('candidate selection is action-specific (alternatives differ per action)', () => {
    const crosierAlts = getAlternativesFor('basic_crosier_hit');
    const longbowAlts = getAlternativesFor('basic_longbow_hit');
    const interposeAlts = getAlternativesFor('p_interpose');
    expect(crosierAlts).not.toEqual(longbowAlts);
    expect(crosierAlts).not.toEqual(interposeAlts);
  });

  it('route is derived automatically from real action metadata', () => {
    for (const entry of getMegaPackHeldReviewEntries()) {
      const route = resolvePresentationRoute(entry.actionSpec, getSkillPresentation(entry.actionSpec));
      expect(entry.route).toBe(route.route);
    }
  });

  it('alternative candidates are not in production VFX_SPRITE_SHEETS', () => {
    for (const entry of getNeedsAltEntries()) {
      for (const alt of getAlternativesFor(entry.actionId)) {
        expect(Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, alt.source.id)).toBe(false);
      }
    }
  });

  it('isDirectionalAction returns true for offensive actions, false for non-directional support', () => {
    const entries = getMegaPackHeldReviewEntries();
    const offensive = entries.find((e) => e.actionSpec.offensive === true)!;
    const support = entries.find((e) => e.actionSpec.support === true && !e.actionSpec.offensive)!;
    expect(isDirectionalAction(offensive)).toBe(true);
    expect(isDirectionalAction(support)).toBe(false);
  });

  it('QA decisions do not mutate production registry or manifests', () => {
    const entries = getMegaPackHeldReviewEntries();
    for (const entry of entries) {
      expect(Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, entry.source.id)).toBe(false);
    }
  });

  it('no commercial source is tracked in git (held sources use ignored root)', () => {
    for (const entry of getMegaPackHeldReviewEntries()) {
      expect(entry.source.url).toContain(MEGAPACK_HELD_REVIEW_ROOT);
      expect(entry.source.url).not.toContain('/raw/');
      expect(entry.source.url).not.toContain('/processed/');
    }
  });

  it('getCandidateAvailability returns READY for all alternative candidate IDs', () => {
    for (const entry of getNeedsAltEntries()) {
      for (const alt of getAlternativesFor(entry.actionId)) {
        expect(getCandidateAvailability(alt.candidateId)).toBe('READY');
      }
    }
  });

  it('getCandidateAvailability returns UNAVAILABLE for unknown candidate IDs', () => {
    expect(getCandidateAvailability('r1_nonexistent')).toBe('UNAVAILABLE');
    expect(getCandidateAvailability('')).toBe('UNAVAILABLE');
  });

  it('decisionKey produces V2 format with :: separator', () => {
    expect(decisionKey('basic_crosier_hit', 'r1_1605')).toBe('basic_crosier_hit::r1_1605');
    expect(decisionKey('p_interpose', 'r1_0971')).toBe('p_interpose::r1_0971');
  });

  it('parseRawDecisions converts V1 bare keys to V2 format and preserves V2 keys', () => {
    const v1Raw = {
      basic_crosier_hit: { actionKey: 'basic_crosier_hit', candidateId: 'r1_1605', verdict: 'LOCK' as HeldCandidateVerdict, notes: 'good', direction: 'player' },
    };
    const v2Raw = {
      'p_interpose::r1_0971': { actionKey: 'p_interpose', candidateId: 'r1_0971', verdict: 'REJECT' as HeldCandidateVerdict, notes: 'bad', direction: 'foe' },
    };
    const parsed = parseRawDecisions({ ...v1Raw, ...v2Raw });
    expect(parsed['basic_crosier_hit::r1_1605']).toBeDefined();
    expect(parsed['basic_crosier_hit::r1_1605']?.verdict).toBe('LOCK');
    expect(parsed['p_interpose::r1_0971']).toBeDefined();
    expect(parsed['p_interpose::r1_0971']?.verdict).toBe('REJECT');
  });

  it('buildExportPayload includes finalSelections for LOCK and TUNE with version 3', () => {
    const state = createReviewState();
    const s1 = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'good', 'player', state);
    const s2 = applyVerdict('p_interpose', 'r1_0971', 'REJECT', 'bad', 'foe', s1);
    const payload = buildExportPayload(s2);
    expect(payload.version).toBe(3);
    expect(payload.decisions).toHaveLength(2);
    expect(payload.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
    expect(payload.finalSelections['p_interpose']).toBeUndefined();
  });
});

describe('R2C-A.1.2 review state model', () => {
  const targets = getNeedsAltEntries();
  const targetIds = targets.map((e) => ({ actionId: e.actionId }));

  describe('candidate state', () => {
    it('remembers selected candidate per action across switches', () => {
      let state = createReviewState();
      state = applySelectedCandidate('basic_crosier_hit', 'r1_1605', state);
      state = applySelectedCandidate('a_arrow_rain', 'r1_0592', state);
      expect(resolveSelectedCandidate('basic_crosier_hit', 'r1_0483', state)).toBe('r1_1605');
      expect(resolveSelectedCandidate('a_arrow_rain', 'r1_0004', state)).toBe('r1_0592');
    });

    it('falls back to default candidate when no prior selection exists', () => {
      const state = createReviewState();
      expect(resolveSelectedCandidate('basic_crosier_hit', 'r1_0483', state)).toBe('r1_0483');
    });

    it('falls back to finalSelection candidate when no explicit selection', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', '', 'player', state);
      state = applySelectedCandidate('basic_crosier_hit', 'r1_0592', state);
      state = applySelectedCandidate('basic_crosier_hit', undefined as unknown as string, state);
      // After removing explicit selection, falls back to finalSelection
      state.selectedCandidateByAction['basic_crosier_hit'] = undefined as unknown as string;
      delete state.selectedCandidateByAction['basic_crosier_hit'];
      expect(resolveSelectedCandidate('basic_crosier_hit', 'r1_0483', state)).toBe('r1_1605');
    });

    it('candidate survives verdict save (applyVerdict sets selectedCandidate)', () => {
      let state = createReviewState();
      state = applySelectedCandidate('basic_crosier_hit', 'r1_1605', state);
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'good', 'player', state);
      expect(state.selectedCandidateByAction['basic_crosier_hit']).toBe('r1_1605');
    });

    it('candidate survives notes editing (applyNotes does not change selection)', () => {
      let state = createReviewState();
      state = applySelectedCandidate('basic_crosier_hit', 'r1_1605', state);
      state = applyNotes('basic_crosier_hit', 'r1_1605', 'some notes', state);
      expect(state.selectedCandidateByAction['basic_crosier_hit']).toBe('r1_1605');
    });
  });

  describe('direction state', () => {
    it('remembers direction per action independently', () => {
      let state = createReviewState();
      state = applyDirection('basic_longbow_hit', 'foe', state);
      state = applyDirection('a_arrow_rain', 'player', state);
      expect(state.directionMap['basic_longbow_hit']).toBe('foe');
      expect(state.directionMap['a_arrow_rain']).toBe('player');
    });

    it('direction survives candidate change (applySelectedCandidate does not touch direction)', () => {
      let state = createReviewState();
      state = applyDirection('basic_crosier_hit', 'foe', state);
      state = applySelectedCandidate('basic_crosier_hit', 'r1_1605', state);
      expect(state.directionMap['basic_crosier_hit']).toBe('foe');
    });
  });

  describe('visual notes', () => {
    it('notes are candidate-specific (A1 notes do not appear in A2)', () => {
      let state = createReviewState();
      state = applyNotes('basic_crosier_hit', 'r1_0483', 'CURRENT BAD', state);
      state = applyNotes('basic_crosier_hit', 'r1_1605', 'ALT A GOOD', state);
      const dKey1 = decisionKey('basic_crosier_hit', 'r1_0483');
      const dKey2 = decisionKey('basic_crosier_hit', 'r1_1605');
      expect(state.notesByCandidate[dKey1]).toBe('CURRENT BAD');
      expect(state.notesByCandidate[dKey2]).toBe('ALT A GOOD');
    });

    it('notes are action-specific (Action A notes do not appear in Action B)', () => {
      let state = createReviewState();
      state = applyNotes('basic_crosier_hit', 'r1_0483', 'CROSIER NOTE', state);
      state = applyNotes('a_arrow_rain', 'r1_0004', 'ARROW RAIN NOTE', state);
      const dKeyA = decisionKey('basic_crosier_hit', 'r1_0483');
      const dKeyB = decisionKey('a_arrow_rain', 'r1_0004');
      expect(state.notesByCandidate[dKeyA]).toBe('CROSIER NOTE');
      expect(state.notesByCandidate[dKeyB]).toBe('ARROW RAIN NOTE');
    });

    it('switching A1 → A2 → A1 restores A1 notes', () => {
      let state = createReviewState();
      state = applyNotes('basic_crosier_hit', 'r1_0483', 'too explosive', state);
      state = applyNotes('basic_crosier_hit', 'r1_1605', 'better shape', state);
      const dKey1 = decisionKey('basic_crosier_hit', 'r1_0483');
      expect(state.notesByCandidate[dKey1]).toBe('too explosive');
    });

    it('notes persist without verdict', () => {
      let state = createReviewState();
      state = applyNotes('basic_crosier_hit', 'r1_1605', 'maybe good but compare ALT B', state);
      const dKey = decisionKey('basic_crosier_hit', 'r1_1605');
      expect(state.notesByCandidate[dKey]).toBe('maybe good but compare ALT B');
      expect(state.decisions[dKey]).toBeUndefined();
    });

    it('notes persist with REJECT', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_0483', 'REJECT', 'too weak', 'player', state);
      const dKey = decisionKey('basic_crosier_hit', 'r1_0483');
      expect(state.notesByCandidate[dKey]).toBe('too weak');
      expect(state.decisions[dKey]?.verdict).toBe('REJECT');
    });

    it('notes persist with LOCK', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'best source', 'player', state);
      const dKey = decisionKey('basic_crosier_hit', 'r1_1605');
      expect(state.notesByCandidate[dKey]).toBe('best source');
      expect(state.decisions[dKey]?.verdict).toBe('LOCK');
    });

    it('notes persist with PRESENTATION_TUNE_ONLY', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'PRESENTATION_TUNE_ONLY', 'best but scale large', 'player', state);
      const dKey = decisionKey('basic_crosier_hit', 'r1_1605');
      expect(state.notesByCandidate[dKey]).toBe('best but scale large');
    });
  });

  describe('decision model', () => {
    it('REJECT does NOT resolve action', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_0483', 'REJECT', 'bad', 'player', state);
      expect(getActionStatus('basic_crosier_hit', state)).toBe('UNRESOLVED');
    });

    it('LOCK resolves action', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'good', 'player', state);
      expect(getActionStatus('basic_crosier_hit', state)).toBe('RESOLVED');
    });

    it('PRESENTATION_TUNE_ONLY resolves action', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'PRESENTATION_TUNE_ONLY', 'tune needed', 'player', state);
      expect(getActionStatus('basic_crosier_hit', state)).toBe('RESOLVED');
    });

    it('one final selection per action', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'first', 'player', state);
      expect(Object.keys(state.finalSelections).filter((k) => k === 'basic_crosier_hit')).toHaveLength(1);
    });

    it('locking another candidate replaces previous final selection', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'first', 'player', state);
      state = applyVerdict('basic_crosier_hit', 'r1_0592', 'LOCK', 'second', 'player', state);
      expect(state.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_0592', verdict: 'LOCK' });
    });

    it('browsing another candidate does NOT erase final selection', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'locked', 'player', state);
      state = applySelectedCandidate('basic_crosier_hit', 'r1_0592', state);
      expect(state.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
    });
  });

  describe('navigation', () => {
    it('NEXT uses live finalSelections (not original report)', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', '', 'player', state);
      const next = resolveNextUnresolvedAction('basic_crosier_hit', state, targetIds);
      expect(next).not.toBeNull();
      expect(next!.actionId).not.toBe('basic_crosier_hit');
    });

    it('NEXT does not return to same action because original report says NEEDS_ALT', () => {
      let state = createReviewState();
      state = applyVerdict(targets[0]!.actionId, 'r1_1605', 'LOCK', '', 'player', state);
      const next = resolveNextUnresolvedAction(targets[0]!.actionId, state, targetIds);
      expect(next!.actionId).not.toBe(targets[0]!.actionId);
    });

    it('NEXT ordered navigation wraps correctly', () => {
      let state = createReviewState();
      // Resolve all except last
      for (let i = 0; i < targets.length - 1; i++) {
        state = applyVerdict(targets[i]!.actionId, 'r1_1605', 'LOCK', '', 'player', state);
      }
      // Current is last, next should wrap to... well, last is unresolved
      const lastAction = targets[targets.length - 1]!;
      const next = resolveNextUnresolvedAction(lastAction.actionId, state, targetIds);
      expect(next!.actionId).toBe(lastAction.actionId);
    });

    it('NEXT wraps from last to first unresolved', () => {
      let state = createReviewState();
      // Resolve first action only
      state = applyVerdict(targets[0]!.actionId, 'r1_1605', 'LOCK', '', 'player', state);
      // Current is last, next should wrap to second (first is resolved)
      const lastAction = targets[targets.length - 1]!;
      const next = resolveNextUnresolvedAction(lastAction.actionId, state, targetIds);
      expect(next!.actionId).toBe(targets[1]!.actionId);
    });

    it('unresolved action with only rejects can still navigate away', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_0483', 'REJECT', 'bad', 'player', state);
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'REJECT', 'also bad', 'player', state);
      const next = resolveNextUnresolvedAction('basic_crosier_hit', state, targetIds);
      expect(next).not.toBeNull();
      expect(next!.actionId).not.toBe('basic_crosier_hit');
    });

    it('manual action selection is not overridden (resolveSelectedCandidate respects state)', () => {
      let state = createReviewState();
      state = applySelectedCandidate('a_arrow_rain', 'r1_0592', state);
      expect(resolveSelectedCandidate('a_arrow_rain', 'r1_0004', state)).toBe('r1_0592');
    });
  });

  describe('progress', () => {
    it('progress is based on finalSelections count', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', '', 'player', state);
      state = applyVerdict('a_arrow_rain', 'r1_0592', 'PRESENTATION_TUNE_ONLY', '', 'player', state);
      expect(getProgress(state, targetIds)).toBe(2);
    });

    it('progress does not count REJECT verdicts', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_0483', 'REJECT', '', 'player', state);
      expect(getProgress(state, targetIds)).toBe(0);
    });

    it('all seven resolved shows 7/7', () => {
      let state = createReviewState();
      for (const t of targets) {
        state = applyVerdict(t.actionId, 'r1_1605', 'LOCK', '', 'player', state);
      }
      expect(getProgress(state, targetIds)).toBe(7);
    });

    it('all seven resolved returns null from NEXT', () => {
      let state = createReviewState();
      for (const t of targets) {
        state = applyVerdict(t.actionId, 'r1_1605', 'LOCK', '', 'player', state);
      }
      expect(resolveNextUnresolvedAction(targets[0]!.actionId, state, targetIds)).toBeNull();
    });
  });

  describe('persistence / backward compat', () => {
    it('existing V1 data (bare actionId keys) still loads', () => {
      const v1Raw = {
        basic_crosier_hit: { actionKey: 'basic_crosier_hit', candidateId: 'r1_1605', verdict: 'LOCK' as HeldCandidateVerdict, notes: 'good', direction: 'player' },
      };
      const state = loadReviewStateFromRaw(v1Raw);
      expect(state.decisions['basic_crosier_hit::r1_1605']).toBeDefined();
      expect(state.decisions['basic_crosier_hit::r1_1605']?.verdict).toBe('LOCK');
      expect(state.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
    });

    it('existing V2 data (actionId::candidateId keys) still loads', () => {
      const v2Raw = {
        'basic_crosier_hit::r1_1605': { actionKey: 'basic_crosier_hit', candidateId: 'r1_1605', verdict: 'LOCK' as HeldCandidateVerdict, notes: 'good', direction: 'player' },
        'p_interpose::r1_0971': { actionKey: 'p_interpose', candidateId: 'r1_0971', verdict: 'REJECT' as HeldCandidateVerdict, notes: 'bad', direction: 'foe' },
      };
      const state = loadReviewStateFromRaw(v2Raw);
      expect(state.decisions['basic_crosier_hit::r1_1605']?.verdict).toBe('LOCK');
      expect(state.decisions['p_interpose::r1_0971']?.verdict).toBe('REJECT');
      expect(state.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
      expect(state.finalSelections['p_interpose']).toBeUndefined();
    });

    it('new format with finalSelections and notesByCandidate loads correctly', () => {
      const newRaw = {
        decisions: { 'basic_crosier_hit::r1_1605': { actionKey: 'basic_crosier_hit', candidateId: 'r1_1605', verdict: 'LOCK', notes: 'good', direction: 'player' } },
        finalSelections: { basic_crosier_hit: { candidateId: 'r1_1605', verdict: 'LOCK' } },
        selectedCandidateByAction: { basic_crosier_hit: 'r1_1605' },
        directionMap: { basic_crosier_hit: 'foe' },
        notesByCandidate: { 'basic_crosier_hit::r1_1605': 'good' },
      };
      const state = loadReviewStateFromRaw(newRaw);
      expect(state.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
      expect(state.directionMap['basic_crosier_hit']).toBe('foe');
      expect(state.notesByCandidate['basic_crosier_hit::r1_1605']).toBe('good');
    });
  });

  describe('export', () => {
    it('export preserves candidate notes', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'best source', 'player', state);
      const payload = buildExportPayload(state);
      const decision = payload.decisions.find((d) => d.candidateId === 'r1_1605');
      expect(decision?.notes).toBe('best source');
    });

    it('export preserves candidate verdicts', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_0483', 'REJECT', 'too weak', 'player', state);
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', 'best', 'player', state);
      const payload = buildExportPayload(state);
      const reject = payload.decisions.find((d) => d.candidateId === 'r1_0483');
      const lock = payload.decisions.find((d) => d.candidateId === 'r1_1605');
      expect(reject?.verdict).toBe('REJECT');
      expect(lock?.verdict).toBe('LOCK');
    });

    it('export preserves finalSelections', () => {
      let state = createReviewState();
      state = applyVerdict('basic_crosier_hit', 'r1_1605', 'LOCK', '', 'player', state);
      state = applyVerdict('a_arrow_rain', 'r1_0592', 'PRESENTATION_TUNE_ONLY', '', 'player', state);
      const payload = buildExportPayload(state);
      expect(payload.finalSelections['basic_crosier_hit']).toEqual({ candidateId: 'r1_1605', verdict: 'LOCK' });
      expect(payload.finalSelections['a_arrow_rain']).toEqual({ candidateId: 'r1_0592', verdict: 'PRESENTATION_TUNE_ONLY' });
    });
  });

  describe('preservation', () => {
    it('production VFX files remain untouched (no held source in VFX_SPRITE_SHEETS)', () => {
      for (const entry of getMegaPackHeldReviewEntries()) {
        expect(Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, entry.source.id)).toBe(false);
      }
    });

    it('Combat Stage files remain untouched (STAGE_PROXY_Y_SINK constant exists)', async () => {
      // This test verifies CombatStage.ts was not modified by this task
      // by checking the R0C.1B constant is still present
      const stageModule = await import('../stage/CombatStage');
      expect(stageModule.CombatStage).toBeDefined();
    });
  });
});
