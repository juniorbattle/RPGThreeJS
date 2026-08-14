// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { playDraftInCombatStage } from './VfxComposerPlayback';
import type { ComposerPlaybackContext } from './VfxComposerPlayback';
import type { VfxPresetDraft } from './VfxPresetComposer';
import { createVisualSlot } from './VfxPresetComposer';

function makeDraft(slotCount: number): VfxPresetDraft {
  const ids = ['r1_0001', 'r1_0002', 'r1_0003'];
  return {
    actionKey: 'basic_greatsword_hit',
    presetId: 'test_preset',
    visualSlots: Array.from({ length: slotCount }, (_, i) =>
      createVisualSlot(ids[i] ?? `r1_000${i + 1}`),
    ),
    choreography: 'TOGETHER',
    technicalPolish: 'AUTO',
    tier: 1,
  };
}

function makeCtx(buildStageContext?: ComposerPlaybackContext['buildStageContext']): ComposerPlaybackContext {
  return {
    vfxSystem: {
      playLabSpriteSheet: vi.fn(() => ({ completion: Promise.resolve() })),
    } as unknown as ComposerPlaybackContext['vfxSystem'],
    buildContext: vi.fn(() => ({
      source: { gx: 0, gz: 0 },
      target: { gx: 1, gz: 1 },
      helpers: { screenFlash: vi.fn(), screenShake: vi.fn() },
    })) as unknown as ComposerPlaybackContext['buildContext'],
    ...(buildStageContext ? { buildStageContext } : {}),
  };
}

/** Mock buildStageContext that calls playVfx with a minimal context. */
function mockStageContext(): NonNullable<ComposerPlaybackContext['buildStageContext']> {
  return vi.fn(async (_key: string, playVfx: (ctx: never) => Promise<void>) => {
    await playVfx({} as never);
    return true;
  });
}

describe('R2C-VFX LAB V2.1 — Combat Stage playback', () => {
  it('1. rejects empty drafts', async () => {
    const ctx = makeCtx(vi.fn());
    const result = await playDraftInCombatStage(ctx, makeDraft(0), 'full_preset');
    expect(result.played).toBe(false);
    expect(result.reason).toContain('no visual');
  });

  it('2. rejects when buildStageContext is not provided', async () => {
    const ctx = makeCtx(undefined);
    const result = await playDraftInCombatStage(ctx, makeDraft(1), 'full_preset');
    expect(result.played).toBe(false);
    expect(result.reason).toContain('Stage unavailable');
  });

  it('3. calls buildStageContext with the actionKey and a playVfx callback', async () => {
    const buildStageContext = mockStageContext();
    const ctx = makeCtx(buildStageContext);
    const result = await playDraftInCombatStage(ctx, makeDraft(1), 'full_preset');
    expect(result.played).toBe(true);
    expect(buildStageContext).toHaveBeenCalledWith('basic_greatsword_hit', expect.any(Function));
  });

  it('4. returns a snapshot with the correct slot count', async () => {
    const ctx = makeCtx(mockStageContext());
    const result = await playDraftInCombatStage(ctx, makeDraft(3), 'full_preset');
    expect(result.snapshot?.slotCount).toBe(3);
  });

  it('5. visuals_only mode produces zero technical effects in the snapshot', async () => {
    const ctx = makeCtx(mockStageContext());
    const result = await playDraftInCombatStage(ctx, makeDraft(2), 'visuals_only');
    expect(result.snapshot?.technicalEffectCount).toBe(0);
  });

  it('6. full_preset mode with STRONG polish produces technical effects', async () => {
    const ctx = makeCtx(mockStageContext());
    const draft = { ...makeDraft(2), technicalPolish: 'STRONG' as const };
    const result = await playDraftInCombatStage(ctx, draft, 'full_preset');
    expect(result.snapshot?.technicalEffectCount).toBe(3);
  });

  it('7. returns played=false when buildStageContext returns false', async () => {
    const buildStageContext = vi.fn(async () => false);
    const ctx = makeCtx(buildStageContext);
    const result = await playDraftInCombatStage(ctx, makeDraft(1), 'full_preset');
    expect(result.played).toBe(false);
    expect(result.snapshot).toBeNull();
  });

  it('8. does not mutate production presets', async () => {
    const ctx = makeCtx(mockStageContext());
    const draft = makeDraft(2);
    const before = JSON.stringify(draft);
    await playDraftInCombatStage(ctx, draft, 'full_preset');
    expect(JSON.stringify(draft)).toBe(before);
  });
});
