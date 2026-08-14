import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  STATIC_VFX_TIER_PRESENTATION,
  getStaticVfxTierPresentation,
} from '../combatVfxPresentation';
import { VFX_RENDER_ORDER, VfxSystem, spriteSheetEnvelope } from './VfxSystem';

describe('VFX render layers', () => {
  it('keeps short impact VFX above status indicators while ground effects stay lower', () => {
    expect(VFX_RENDER_ORDER.ground).toBeLessThan(60);
    expect(VFX_RENDER_ORDER.impact).toBeGreaterThan(60);
  });

  it('refuses late playback and keeps no active objects after disposal', async () => {
    const system = new VfxSystem();
    system.dispose();
    system.dispose();
    const result = system.play('generic_hit', {
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
    });
    expect(result.played).toBe(false);
    await expect(result.completion).resolves.toBeUndefined();
    expect(system.activeObjectCount).toBe(0);
  });

  it('keeps every static action tier above status indicators with boss priority highest', () => {
    for (const profile of Object.values(STATIC_VFX_TIER_PRESENTATION)) {
      expect(profile.impactRenderOrder).toBeGreaterThan(60);
      expect(profile.impactOpacityFloor).toBeGreaterThanOrEqual(0.8);
    }
    expect(getStaticVfxTierPresentation('boss').impactRenderOrder).toBeGreaterThan(
      getStaticVfxTierPresentation('5ap_ultimate').impactRenderOrder,
    );
  });

  it('keeps the native sheet alpha fully visible when the Composer disables fades', () => {
    const presentation = { fadeIn: 0, fadeOut: 1 } as Parameters<typeof spriteSheetEnvelope>[1];
    for (const progress of [0, 0.05, 0.25, 0.5, 0.9, 0.999]) {
      expect(spriteSheetEnvelope(progress, presentation)).toBe(1);
    }
  });
});
