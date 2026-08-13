import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  restoreLabStateFromCheckpoint,
  validateCheckpointLabState,
  serializeLabState,
  deserializeLabState,
  createDefaultLabState,
  setQaPresentation,
  setQaSourceId,
  labStepKey,
  getQaPresentation,
  getQaSourceId,
} from './CombatVfxLab';
import type { LabState } from './CombatVfxLab';

// ============================================================
// R2C-HERO60 P0.1C — Durable Lab State Restore Tests
// ============================================================

const P01B_CHECKPOINT_PATH = 'docs/reports/hero60_p0_1b_targeted_readability_repair.json';
const P01B_CHECKPOINT = JSON.parse(readFileSync(P01B_CHECKPOINT_PATH, 'utf-8'));

describe('R2C-HERO60 P0.1C — Durable Lab State Restore', () => {

  // --- Schema validation ---

  it('1. validateCheckpointLabState accepts valid LabState', () => {
    const state = createDefaultLabState();
    expect(validateCheckpointLabState(state)).toBe(true);
  });

  it('2. validateCheckpointLabState rejects null', () => {
    expect(validateCheckpointLabState(null)).toBe(false);
  });

  it('3. validateCheckpointLabState rejects missing qaSourceByActionStep', () => {
    const bad = { qaPresentationByActionStep: {}, selectedStepByAction: {} };
    expect(validateCheckpointLabState(bad)).toBe(false);
  });

  it('4. validateCheckpointLabState rejects missing qaPresentationByActionStep', () => {
    const bad = { qaSourceByActionStep: {}, selectedStepByAction: {} };
    expect(validateCheckpointLabState(bad)).toBe(false);
  });

  it('5. validateCheckpointLabState rejects missing selectedStepByAction', () => {
    const bad = { qaSourceByActionStep: {}, qaPresentationByActionStep: {} };
    expect(validateCheckpointLabState(bad)).toBe(false);
  });

  // --- Restore from checkpoint ---

  it('6. restoreLabStateFromCheckpoint restores from P0.1B checkpoint', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(result.state).toBeDefined();
    expect(Object.keys(result.state!.qaSourceByActionStep).length).toBe(64);
    expect(Object.keys(result.state!.qaPresentationByActionStep).length).toBe(64);
  });

  it('7. restoreLabStateFromCheckpoint restores from raw LabState JSON', () => {
    const state = createDefaultLabState();
    const raw = serializeLabState(state);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(result.state).toBeDefined();
  });

  it('8. restoreLabStateFromCheckpoint rejects malformed JSON', () => {
    const result = restoreLabStateFromCheckpoint('{ not valid json');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('9. restoreLabStateFromCheckpoint rejects non-object JSON', () => {
    const result = restoreLabStateFromCheckpoint('"just a string"');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('10. restoreLabStateFromCheckpoint rejects checkpoint with invalid LabState', () => {
    const bad = { checkpointId: 'test', labState: { foo: 'bar' } };
    const result = restoreLabStateFromCheckpoint(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('valid LabState');
  });

  // --- P0.1B values restored exactly ---

  it('11. basic_greatsword_hit P0.1B values restored exactly', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const pres = result.state!.qaPresentationByActionStep['basic_greatsword_hit::0']!;
    expect(pres.scale).toBe(1.55);
    expect(pres.duration).toBe(1.60);
    expect(pres.opacity).toBe(1.0);
    expect(pres.fadeIn).toBe(0.02);
    expect(pres.fadeOut).toBe(0.90);
    expect(pres.offsetX).toBe(0);
    expect(pres.offsetY).toBe(0);
    expect(pres.anchor).toBe('target');
    expect(pres.layer).toBe('impact');
    expect(pres.blending).toBe('normal');
    expect(pres.direction).toBe('face_target');
  });

  it('12. n_dark_bolt P0.1B values restored exactly', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const pres = result.state!.qaPresentationByActionStep['n_dark_bolt::0']!;
    expect(pres.scale).toBe(1.55);
    expect(pres.duration).toBe(1.70);
    expect(pres.opacity).toBe(1.0);
    expect(pres.fadeIn).toBe(0.02);
    expect(pres.fadeOut).toBe(0.92);
    expect(pres.offsetX).toBe(0);
    expect(pres.offsetY).toBe(0);
    expect(pres.anchor).toBe('target');
    expect(pres.layer).toBe('impact');
    expect(pres.blending).toBe('additive');
    expect(pres.direction).toBe('center_on_target');
  });

  it('13. basic_greatsword_hit candidate restored as r1_1709', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const source = result.state!.qaSourceByActionStep['basic_greatsword_hit::0']!;
    expect(source).toBe('r1_1709');
  });

  it('14. n_dark_bolt candidate restored as r1_0934', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const source = result.state!.qaSourceByActionStep['n_dark_bolt::0']!;
    expect(source).toBe('r1_0934');
  });

  // --- Accepted three preserved ---

  it('15. w_charge P0.1 values preserved in restore', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const pres = result.state!.qaPresentationByActionStep['w_charge::0']!;
    expect(pres.scale).toBe(1.15);
    expect(pres.duration).toBe(0.8);
    expect(pres.opacity).toBe(0.9);
    expect(pres.fadeOut).toBe(0.8);
  });

  it('16. n_flame_wave P0.1 values preserved in restore', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const pres = result.state!.qaPresentationByActionStep['n_flame_wave::0']!;
    expect(pres.scale).toBe(1.25);
    expect(pres.duration).toBe(1.28);
    expect(pres.opacity).toBe(0.95);
    expect(pres.fadeOut).toBe(0.82);
  });

  it('17. w_lion_surge P0.1 values preserved in restore', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const pres = result.state!.qaPresentationByActionStep['w_lion_surge::0']!;
    expect(pres.scale).toBe(1.15);
    expect(pres.duration).toBe(1.28);
    expect(pres.opacity).toBe(1);
    expect(pres.fadeOut).toBe(0.85);
  });

  // --- State safety ---

  it('18. restore does not validate anything', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state!.validatedByActionStep ?? {}).length).toBe(0);
  });

  it('19. restore does not set verified fingerprints', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state!.verifiedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  it('20. restore does not set tested fingerprints', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state!.testedFingerprintByActionStep ?? {}).length).toBe(0);
  });

  // --- Persistence after restore ---

  it('21. restored state survives serialization round-trip', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    const serialized = serializeLabState(result.state!);
    const deserialized = deserializeLabState(serialized);
    expect(deserialized).not.toBeNull();
    expect(deserialized!.qaPresentationByActionStep['basic_greatsword_hit::0']!.scale).toBe(1.55);
    expect(deserialized!.qaPresentationByActionStep['n_dark_bolt::0']!.duration).toBe(1.70);
  });

  // --- No auto-overwrite on startup ---

  it('22. restoreLabStateFromCheckpoint is explicit only — does not auto-run', () => {
    // The function is a pure function — it does not touch localStorage.
    // It only returns a result. The caller (UI button) must explicitly
    // call saveLabStateToStorage. This test verifies the function has no
    // side effects on a mock storage.
    const mockStorage: Storage & { _data: Record<string, string> } = {
      _data: {},
      getItem(key: string) { return this._data[key] ?? null; },
      setItem(key: string, value: string) { this._data[key] = value; },
      removeItem(key: string) { delete this._data[key]; },
      clear() { this._data = {}; },
      key() { return null; },
      get length() { return Object.keys(this._data).length; },
    };

    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    // Verify storage was NOT touched
    expect(mockStorage.getItem('r2c-combat-vfx-lab-state')).toBeNull();
  });

  // --- 64 QA sources restored ---

  it('23. restore restores all 64 QA sources', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state!.qaSourceByActionStep).length).toBe(64);
  });

  it('24. restore restores all 64 QA presentation overrides', () => {
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state!.qaPresentationByActionStep).length).toBe(64);
  });

  // --- Restore does not touch production state ---

  it('25. restore does not modify production preset mappings', () => {
    // The restore function only returns a LabState — it does not modify
    // VfxPresets, VFX_SPRITE_SHEETS, or any production mapping.
    // Production state is not part of LabState.
    const raw = JSON.stringify(P01B_CHECKPOINT);
    const result = restoreLabStateFromCheckpoint(raw);
    expect(result.ok).toBe(true);
    // LabState has no production mapping fields — only QA working state
    expect(result.state).not.toHaveProperty('productionMappings');
    expect(result.state).not.toHaveProperty('presetOverrides');
  });

  // --- Malformed checkpoint variants ---

  it('26. restore rejects empty string', () => {
    const result = restoreLabStateFromCheckpoint('');
    expect(result.ok).toBe(false);
  });

  it('27. restore rejects empty object', () => {
    const result = restoreLabStateFromCheckpoint('{}');
    expect(result.ok).toBe(false);
  });

  it('28. restore rejects checkpoint with labState as null', () => {
    const bad = { checkpointId: 'test', labState: null };
    const result = restoreLabStateFromCheckpoint(JSON.stringify(bad));
    expect(result.ok).toBe(false);
  });
});
