import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIT_FOCUS_POLICY } from '../UnitFocusController';
import { createPixelSpriteMaterial, PIXEL_FOCUS_GLSL, pixelFocusResponse } from './PixelSpriteMaterial';

describe('pixel sprite focus response', () => {
  it('makes a focus-dimmed unit clearly semi-transparent and recedes it by shade and saturation', () => {
    const dimmed = pixelFocusResponse(DEFAULT_UNIT_FOCUS_POLICY.dimOpacity);
    expect(dimmed.alpha).toBeLessThan(0.5);
    expect(dimmed.alpha).toBeGreaterThan(0.2);
    expect(dimmed.shade).toBeLessThan(0.75);
    expect(dimmed.saturation).toBeLessThan(0.6);
  });

  it('leaves full opacity untouched and still fades out completely at 0', () => {
    expect(pixelFocusResponse(1)).toEqual({ alpha: 1, shade: 1, saturation: 1 });
    expect(pixelFocusResponse(0).alpha).toBe(0);
  });

  it('keeps valid targets close to full presence', () => {
    const target = pixelFocusResponse(DEFAULT_UNIT_FOCUS_POLICY.validTargetOpacity);
    expect(target.alpha).toBeGreaterThan(0.85);
    expect(target.shade).toBeGreaterThan(0.9);
  });

  it('is monotonic so fades never flicker', () => {
    let previous = pixelFocusResponse(0);
    for (let step = 1; step <= 20; step++) {
      const next = pixelFocusResponse(step / 20);
      expect(next.alpha).toBeGreaterThanOrEqual(previous.alpha);
      expect(next.shade).toBeGreaterThanOrEqual(previous.shade);
      previous = next;
    }
  });

  it('injects the same mapping into the sprite shader, before the hit flash', () => {
    const { material } = createPixelSpriteMaterial(new THREE.Texture(), { width: 64, height: 32 });
    const shader = { uniforms: {}, fragmentShader: 'void main() {\n#include <map_fragment>\n}', vertexShader: '' };
    material.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, {} as THREE.WebGLRenderer);
    const source = shader.fragmentShader;
    expect(source).toContain(PIXEL_FOCUS_GLSL);
    expect(source.indexOf('pixelFocus')).toBeLessThan(source.indexOf('uPixelFlash, 0.0, 1.0'));
    expect(material.alphaTest).toBe(0);
  });
});
