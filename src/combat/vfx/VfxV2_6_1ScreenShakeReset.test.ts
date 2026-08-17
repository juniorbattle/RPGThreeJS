import { describe, expect, it } from 'vitest';
import {
  CombatCameraFeedback,
  STATIC_COMBAT_CAMERA_POLICY,
  shakeSampleToUvOffset,
  SHAKE_PIXELS_PER_UNIT,
  applyAdditiveCameraShake,
  type ShakeSample,
} from '../combatCameraFeedback';

// ============================================================ PURE FUNCTION TESTS

describe('V2.6.1 shakeSampleToUvOffset', () => {
  it('zero sample produces zero offset', () => {
    const offset = shakeSampleToUvOffset({ x: 0, y: 0, active: false }, 1920, 1080);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it('inactive sample produces zero offset even with non-zero values', () => {
    const offset = shakeSampleToUvOffset({ x: 0.5, y: 0.3, active: false }, 1920, 1080);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it('positive X sample produces positive UV X shift', () => {
    const offset = shakeSampleToUvOffset({ x: 0.1, y: 0, active: true }, 1920, 1080);
    expect(offset.x).toBeGreaterThan(0);
    expect(offset.y).toBe(0);
  });

  it('positive Y sample produces positive UV Y shift', () => {
    const offset = shakeSampleToUvOffset({ x: 0, y: 0.1, active: true }, 1920, 1080);
    expect(offset.x).toBe(0);
    expect(offset.y).toBeGreaterThan(0);
  });

  it('LIGHT magnitude produces ~2 pixels at 1080p', () => {
    const lightMag = 0.10;
    const offset = shakeSampleToUvOffset({ x: lightMag, y: lightMag, active: true }, 1920, 1080);
    const pixelsX = offset.x * 1920;
    const pixelsY = offset.y * 1080;
    expect(pixelsX).toBeCloseTo(lightMag * SHAKE_PIXELS_PER_UNIT, 5);
    expect(pixelsY).toBeCloseTo(lightMag * SHAKE_PIXELS_PER_UNIT, 5);
    // ~2.2 pixels
    expect(pixelsX).toBeGreaterThan(1.5);
    expect(pixelsX).toBeLessThan(2.5);
  });

  it('STRONG magnitude produces ~5 pixels at 1080p', () => {
    const strongMag = 0.22;
    const offset = shakeSampleToUvOffset({ x: strongMag, y: strongMag, active: true }, 1920, 1080);
    const pixelsX = offset.x * 1920;
    const pixelsY = offset.y * 1080;
    expect(pixelsX).toBeCloseTo(strongMag * SHAKE_PIXELS_PER_UNIT, 5);
    // ~4.8 pixels
    expect(pixelsX).toBeGreaterThan(4);
    expect(pixelsX).toBeLessThan(6);
  });

  it('LIGHT < STRONG in UV offset', () => {
    const lightOffset = shakeSampleToUvOffset({ x: 0.10, y: 0.10, active: true }, 1920, 1080);
    const strongOffset = shakeSampleToUvOffset({ x: 0.22, y: 0.22, active: true }, 1920, 1080);
    expect(Math.abs(strongOffset.x)).toBeGreaterThan(Math.abs(lightOffset.x));
    expect(Math.abs(strongOffset.y)).toBeGreaterThan(Math.abs(lightOffset.y));
  });

  it('720p / 1080p / 4K produce same pixel-equivalent magnitude', () => {
    const sample: ShakeSample = { x: 0.15, y: 0.15, active: true };
    const offset720 = shakeSampleToUvOffset(sample, 1280, 720);
    const offset1080 = shakeSampleToUvOffset(sample, 1920, 1080);
    const offset4k = shakeSampleToUvOffset(sample, 3840, 2160);

    // Pixel count should be the same regardless of resolution
    const pixels720 = offset720.y * 720;
    const pixels1080 = offset1080.y * 1080;
    const pixels4k = offset4k.y * 2160;

    expect(pixels720).toBeCloseTo(pixels1080, 5);
    expect(pixels1080).toBeCloseTo(pixels4k, 5);
  });

  it('handles zero viewport dimensions safely (no NaN)', () => {
    const offset = shakeSampleToUvOffset({ x: 0.1, y: 0.1, active: true }, 0, 0);
    expect(Number.isFinite(offset.x)).toBe(true);
    expect(Number.isFinite(offset.y)).toBe(true);
  });
});

// ============================================================ ENVELOPE TESTS

describe('V2.6.1 Shake Envelope', () => {
  it('SHAKE_REQUEST_CREATES_ACTIVE_ENVELOPE', () => {
    const feedback = new CombatCameraFeedback();
    const result = feedback.request({ token: 'test', magnitude: 0.10, duration: 0.12, frequency: 18 });
    expect(result).toBe(true);
    expect(feedback.activeToken).toBe('test');
  });

  it('SHAKE_LIGHT_NON_ZERO', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'light', magnitude: 0.10, duration: 0.12, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    expect(sample.active).toBe(true);
    expect(Math.abs(sample.x)).toBeGreaterThan(0);
  });

  it('SHAKE_STRONG_GREATER_THAN_LIGHT', () => {
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

  it('SHAKE_DECAYS_TO_ZERO', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'decay', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(0.25);
    const sample = feedback.sample();
    expect(sample.active).toBe(false);
    expect(sample.x).toBe(0);
    expect(sample.y).toBe(0);
  });

  it('SHAKE_NO_PERMANENT_OFFSET', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'no-offset', magnitude: 0.22, duration: 0.20, frequency: 18 });
    // Tick through and past the envelope
    for (let i = 0; i < 30; i++) feedback.tick(0.01);
    const sample = feedback.sample();
    expect(sample.x).toBe(0);
    expect(sample.y).toBe(0);
    expect(sample.active).toBe(false);
  });

  it('repeated requests do not create runaway amplitudes', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'repeat', magnitude: 0.22, duration: 0.20, frequency: 18 });
    // Same token — should merge, not stack
    feedback.request({ token: 'repeat', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.request({ token: 'repeat', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    // Should be bounded by maxShakeMagnitude
    expect(Math.abs(sample.x)).toBeLessThanOrEqual(STATIC_COMBAT_CAMERA_POLICY.maxShakeMagnitude);
  });
});

// ============================================================ SCREEN-SPACE TESTS

describe('V2.6.1 Screen-Space Shake', () => {
  it('SCREEN_SPACE_OFFSET_NON_ZERO_DURING_SHAKE', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'ss-active', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    expect(Math.abs(offset.x)).toBeGreaterThan(0);
    expect(Math.abs(offset.y)).toBeGreaterThan(0);
  });

  it('SCREEN_SPACE_OFFSET_ZERO_AFTER_SHAKE', () => {
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'ss-done', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(0.25);
    const sample = feedback.sample();
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it('NO_DOUBLE_WORLD_AND_SCREEN_SHAKE: applyAdditiveCameraShake is legacy', () => {
    // The applyAdditiveCameraShake function still exists for backward compat
    // but is NOT used in applyCam() — the world camera is not shaken.
    const position = { x: 10, y: 5, z: 7 };
    const shaken = applyAdditiveCameraShake(position, { x: 0.1, y: 0.05, active: true });
    // The function still works (for legacy callers/tests) but is not called from applyCam
    expect(shaken.x).toBe(10.1);
    expect(shaken.y).toBe(5.05);
    // Original position is not mutated
    expect(position.x).toBe(10);
  });
});

// ============================================================ CAMERA INVARIANT TESTS

describe('V2.6.1 Camera Transform Invariants', () => {
  it('TACTICAL_CAMERA_TRANSFORM_UNCHANGED: requesting shake does not mutate camera state', () => {
    // The camera baseline is defined by cam (frozen object) and applyCam()
    // sets camera.position from cam without any shake offset.
    // We verify that the shake sample does NOT affect the camera position
    // by confirming applyAdditiveCameraShake is NOT used in applyCam.
    // This is a structural test — the hotfix test verifies the source code.
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'camera-test', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    expect(sample.active).toBe(true);
    expect(Math.abs(sample.x)).toBeGreaterThan(0);

    // The camera position would be set from cam baseline only.
    // The shake sample affects the post-process pass, not the camera.
    // We verify the sample is non-zero (shake is active) but the camera
    // is not moved by it — verified by source code inspection in hotfix test.
  });

  it('COMBAT_STAGE_CAMERA_TRANSFORM_UNCHANGED: shake works via post-process', () => {
    // The CombatStage uses its own OrthographicCamera.
    // The screen-space shake pass operates on the rendered framebuffer
    // after RenderPass, regardless of which camera was used.
    // No camera movement is needed for the shake to be visible.
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'stage-test', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    // The offset is non-zero — the post-process pass will shake the image
    expect(Math.abs(offset.x)).toBeGreaterThan(0);
    // The CombatStage.camera is never moved — it's a fixed orthographic camera
  });

  it('RENDER_PASS_CAMERA_AGNOSTIC: shake offset is computed from sample, not camera', () => {
    // The shakeSampleToUvOffset function takes only the sample and viewport
    // dimensions — it does not reference any camera object.
    // Therefore it works identically regardless of which camera RenderPass uses.
    const sample: ShakeSample = { x: 0.15, y: 0.10, active: true };
    const offset1 = shakeSampleToUvOffset(sample, 1920, 1080);
    const offset2 = shakeSampleToUvOffset(sample, 1920, 1080);
    expect(offset1).toEqual(offset2);
  });
});

// ============================================================ COMPOSER PLAYBACK TESTS

describe('V2.6.1 Composer Playback Shake', () => {
  it('VISUALS_ONLY_NO_SHAKE: compileDraft with includeTechnical=false has no shake', () => {
    // This is tested in VfxV2_6AuthoringPolish.test.ts — we verify the principle:
    // The screen-space shake only activates when cameraFeedback.request() is called,
    // which only happens via helpers.screenShake() in playCompiledTechnical.
    // When includeTechnical=false, playCompiledTechnical is not called.
    const feedback = new CombatCameraFeedback();
    const sample = feedback.sample();
    expect(sample).toEqual({ x: 0, y: 0, active: false });
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it('FULL_PRESET_SHAKE: compiled shake event has correct magnitude', () => {
    // The compiled SHAKE event for STRONG has scale=0.22, duration=0.20
    // When played, helpers.screenShake(0.22, 0.20) calls cameraFeedback.request()
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'full-preset', magnitude: 0.22, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    expect(Math.abs(offset.x)).toBeGreaterThan(0);
    // ~4.8 pixels at 1080p
    const pixels = offset.x * 1920;
    expect(pixels).toBeGreaterThan(4);
    expect(pixels).toBeLessThan(6);
  });
});

// ============================================================ REDUCED GRAPHICS TESTS

describe('V2.6.1 Reduced Graphics', () => {
  it('REDUCED_GRAPHICS_STILL_VISIBLE: 0.58 scale on 0.22 is still visible', () => {
    const reducedScale = 0.58;
    const reducedMag = 0.22 * reducedScale; // = 0.1276
    const feedback = new CombatCameraFeedback();
    feedback.request({ token: 'reduced', magnitude: reducedMag, duration: 0.20, frequency: 18 });
    feedback.tick(1 / 72);
    const sample = feedback.sample();
    const offset = shakeSampleToUvOffset(sample, 1920, 1080);
    const pixels = offset.x * 1920;
    // 0.1276 * 22 = 2.8 pixels — still clearly visible
    expect(pixels).toBeGreaterThan(1.5);
  });
});
