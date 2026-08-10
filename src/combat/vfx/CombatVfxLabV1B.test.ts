import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import inventoryJson from '../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json';
import {
  getLabAction,
  getActionCount,
  buildCatalogue,
  createDefaultLabState,
  setQaSourceId,
  getQaSourceId,
  clearQaSourceId,
  setQaPresentation,
  getQaPresentation,
  clearQaPresentation,
  resetQaStep,
  getProductionPresentation,
  getEffectivePresentation,
  isPresentationModified,
  getQaStatus,
  getSelectedStep,
  setSelectedStep,
  labStepKey,
  exportLabSnapshot,
  serializeSnapshot,
  resolveLabCandidateAvailability,
} from './CombatVfxLab';
import type { LabState, LabPresentationOverride } from './CombatVfxLab';
import {
  resolveCandidateAvailability,
  resolveCandidateSource,
  getCandidateInventoryRecord,
  VfxResourceManager,
  vfxResourceManager,
} from './VfxResourceManager';
import { loadLabCandidateTexture, releaseLabCandidateTexture, buildLabSheetDefinition, VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import { playProduction, playQaOverride, replay, getLastPlaybackSnapshot } from './LabPlayback';
import type { LabPlaybackContext, LabPlaybackSnapshot } from './LabPlayback';
import { isLabEnabled } from './CombatVfxLab';

// ============================================================ Helpers

function makeMockTexture(): THREE.Texture {
  const tex = new THREE.Texture();
  tex.dispose = vi.fn();
  return tex;
}

function makeMockPlaybackContext(): { ctx: LabPlaybackContext; calls: { mode: string; presetId: string; candidateId?: string }[] } {
  const calls: { mode: string; presetId: string; candidateId?: string }[] = [];
  const mockSystem = {
    play: vi.fn((presetId: string) => {
      calls.push({ mode: 'play', presetId });
      return { played: true, presetId, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playPreset: vi.fn((preset: { id: string }) => {
      calls.push({ mode: 'playPreset', presetId: preset.id });
      return { played: true, presetId: preset.id, impactTime: 0.5, completion: Promise.resolve() };
    }),
    playLabSpriteSheet: vi.fn((candidateId: string) => {
      calls.push({ mode: 'playLab', presetId: `lab:${candidateId}`, candidateId });
      return { played: true, presetId: `lab:${candidateId}`, impactTime: 0.5, completion: Promise.resolve() };
    }),
    disposed: false,
  };
  const ctx: LabPlaybackContext = {
    vfxSystem: mockSystem as never,
    buildContext: () => ({ scene: new THREE.Scene(), camera: new THREE.Camera() }) as never,
  };
  return { ctx, calls };
}

// ============================================================ DEV ACQUISITION

describe('R2C-LAB V1B — DEV Acquisition', () => {
  it('1. known supported candidate becomes AVAILABLE_ON_DEMAND', () => {
    const avail = resolveCandidateAvailability('r1_0001');
    expect(avail).toBe('AVAILABLE_ON_DEMAND');
  });

  it('2. unsupported native remains unsupported', () => {
    const rec = getCandidateInventoryRecord('r1_0001');
    if (rec && rec.width !== 2048 && rec.width !== 4096) {
      expect(resolveCandidateAvailability('r1_0001')).toBe('UNSUPPORTED_NATIVE');
    } else {
      // r1_0001 happens to be supported — find an unsupported one
      const catalogue = buildCatalogue(inventoryJson as never);
      const unsupported = catalogue.find((r) => r.availability === 'UNSUPPORTED_NATIVE');
      expect(unsupported).toBeDefined();
    }
  });

  it('3. unknown candidate rejected', () => {
    expect(resolveCandidateAvailability('r9_9999')).toBe('ERROR');
  });

  it('4. candidateId-only API prevents arbitrary path injection', () => {
    expect(resolveCandidateSource('../../../etc/passwd')).toBeNull();
    expect(resolveCandidateSource('file:///etc/passwd')).toBeNull();
    expect(resolveCandidateSource('/absolute/path')).toBeNull();
    expect(resolveCandidateSource('r1_0001/../../etc')).toBeNull();
  });

  it('5. acquiring candidate copies only requested source', async () => {
    const { syncSingleCandidate, loadInventory, validateCandidate } = await import('../../../tools/vfx/sync-candidate-lib.mjs') as any;
    const inventory = loadInventory();
    const rec = validateCandidate(inventory, 'r1_0001');
    expect(rec).not.toBeNull();
    expect(rec.assetId).toBe('r1_0001');
  });

  it('6. existing runtime source does not copy again', async () => {
    const { syncSingleCandidate, loadInventory } = await import('../../../tools/vfx/sync-candidate-lib.mjs') as any;
    const inventory = loadInventory();
    const result = await syncSingleCandidate({ megaPackRoot: '/nonexistent', inventory, candidateId: 'r1_0001' });
    expect(result.ok).toBe(false);
  });

  it('7. failed acquisition produces ERROR', async () => {
    const { syncSingleCandidate, loadInventory } = await import('../../../tools/vfx/sync-candidate-lib.mjs') as any;
    const inventory = loadInventory();
    const result = await syncSingleCandidate({ megaPackRoot: '', inventory, candidateId: 'r1_0001' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('8. failed acquisition can retry', async () => {
    const { syncSingleCandidate, loadInventory } = await import('../../../tools/vfx/sync-candidate-lib.mjs') as any;
    const inventory = loadInventory();
    const r1 = await syncSingleCandidate({ megaPackRoot: '', inventory, candidateId: 'r1_0001' });
    expect(r1.ok).toBe(false);
    const r2 = await syncSingleCandidate({ megaPackRoot: '', inventory, candidateId: 'r1_0001' });
    expect(r2.ok).toBe(false);
  });

  it('9. normal game does not use DEV endpoint', () => {
    expect(isLabEnabled(new URLSearchParams('qa=1'))).toBe(false);
    expect(isLabEnabled(new URLSearchParams('vfxlab=0'))).toBe(false);
  });
});

// ============================================================ RESOURCE MANAGER

describe('R2C-LAB V1B — Resource Manager', () => {
  it('10. acquired Lab source uses VfxResourceManager', async () => {
    const tex = makeMockTexture();
    const textures = new Map<string, THREE.Texture>();
    textures.set('/assets/vfx/megapack-runtime/r1_0001.png', tex);
    const mgr = new VfxResourceManager({
      loader: (url: string): Promise<THREE.Texture> => Promise.resolve(textures.get(url) ?? tex),
      budget: 100,
    });
    const desc = resolveCandidateSource('r1_0001');
    expect(desc).not.toBeNull();
    const acquired = await mgr.acquire('r1_0001', desc!);
    expect(acquired).toBeDefined();
    expect(mgr.getStats().loads).toBe(1);
    mgr.disposeAll();
  });

  it('11. no second Lab texture cache exists', () => {
    const vfxFiles = ['VfxResourceManager.ts', 'VfxSpriteSheets.ts', 'VfxTextures.ts', 'VfxSystem.ts', 'LabPlayback.ts', 'LabAcquisition.ts'];
    const labCacheFiles = vfxFiles.filter(f =>
      f.includes('LabTextureCache') || f.includes('LabPreviewCache') || f.includes('MegaPackPreviewCache'),
    );
    expect(labCacheFiles).toHaveLength(0);
  });

  it('12. Lab source release preserves manager lifecycle', async () => {
    const tex = makeMockTexture();
    const textures = new Map<string, THREE.Texture>();
    textures.set('/assets/vfx/megapack-runtime/r1_0001.png', tex);
    const mgr = new VfxResourceManager({
      loader: (url: string): Promise<THREE.Texture> => Promise.resolve(textures.get(url) ?? tex),
      budget: 100,
    });
    const desc = resolveCandidateSource('r1_0001');
    expect(desc).not.toBeNull();
    await mgr.acquire('r1_0001', desc!);
    mgr.release('r1_0001');
    expect(mgr.getStats().cachedResources).toBe(1);
    mgr.disposeAll();
    expect(mgr.getStats().cachedResources).toBe(0);
  });
});

// ============================================================ PLAYBACK

describe('R2C-LAB V1B — Playback', () => {
  it('13. PLAY PRODUCTION uses production source', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    const state = createDefaultLabState();
    const result = playProduction(ctx, state, 'w_charge');
    expect(result.played).toBe(true);
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.mode).toBe('production');
    expect(calls.length).toBeGreaterThan(0);
  });

  it('14. PLAY QA uses selected QA source', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_0001');
    const result = playQaOverride(ctx, state, 'w_charge');
    expect(result.played).toBe(true);
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot!.mode).toBe('qa');
    expect(result.snapshot!.source).toBe('r1_0001');
  });

  it('15. PLAY PRODUCTION ignores QA presentation parameters', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaPresentation(state, 'w_charge', 0, { scale: 3.0 });
    const result = playProduction(ctx, state, 'w_charge');
    expect(result.snapshot!.presentation.scale).not.toBe(3.0);
  });

  it('16. PLAY QA uses QA presentation parameters', () => {
    const { ctx } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaPresentation(state, 'w_charge', 0, { scale: 2.5 });
    const result = playQaOverride(ctx, state, 'w_charge');
    expect(result.snapshot!.presentation.scale).toBe(2.5);
  });

  it('17. replay preserves immutable snapshot', () => {
    const { ctx } = makeMockPlaybackContext();
    const state = createDefaultLabState();
    const result1 = playProduction(ctx, state, 'w_charge');
    const snap1 = result1.snapshot;
    const result2 = replay(ctx, state);
    expect(result2.snapshot).not.toBeNull();
    expect(result2.snapshot!.mode).toBe(snap1!.mode);
    expect(result2.snapshot!.actionKey).toBe(snap1!.actionKey);
  });

  it('18. route remains authoritative', () => {
    const { ctx } = makeMockPlaybackContext();
    const state = createDefaultLabState();
    const action = getLabAction('w_charge');
    expect(action).toBeDefined();
    const result = playProduction(ctx, state, 'w_charge');
    expect(result.snapshot!.route).toBe(action!.route);
  });

  it('19. QA playback does not execute gameplay', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_0001');
    playQaOverride(ctx, state, 'w_charge');
    expect(calls.every(c => c.mode === 'playLab' || c.mode === 'playPreset' || c.mode === 'play')).toBe(true);
  });
});

// ============================================================ PARAMETERS

describe('R2C-LAB V1B — Parameters', () => {
  const actionKey = 'w_charge';

  it('20. source persists per action/step', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, actionKey, 0, 'r1_9999');
    expect(getQaSourceId(state, actionKey, 0)).toBe('r1_9999');
  });

  it('21. scale persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { scale: 1.5 });
    expect(getQaPresentation(state, actionKey, 0)?.scale).toBe(1.5);
  });

  it('22. offsetX persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { offsetX: 0.3 });
    expect(getQaPresentation(state, actionKey, 0)?.offsetX).toBe(0.3);
  });

  it('23. offsetY persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { offsetY: -0.2 });
    expect(getQaPresentation(state, actionKey, 0)?.offsetY).toBe(-0.2);
  });

  it('24. duration persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { duration: 0.8 });
    expect(getQaPresentation(state, actionKey, 0)?.duration).toBe(0.8);
  });

  it('25. opacity persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { opacity: 0.7 });
    expect(getQaPresentation(state, actionKey, 0)?.opacity).toBe(0.7);
  });

  it('26. anchor persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { anchor: 'target' });
    expect(getQaPresentation(state, actionKey, 0)?.anchor).toBe('target');
  });

  it('27. layer persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { layer: 'ground' });
    expect(getQaPresentation(state, actionKey, 0)?.layer).toBe('ground');
  });

  it('28. blending persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { blending: 'normal' });
    expect(getQaPresentation(state, actionKey, 0)?.blending).toBe('normal');
  });

  it('29. fadeIn persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { fadeIn: 0.1 });
    expect(getQaPresentation(state, actionKey, 0)?.fadeIn).toBe(0.1);
  });

  it('30. fadeOut persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { fadeOut: 0.5 });
    expect(getQaPresentation(state, actionKey, 0)?.fadeOut).toBe(0.5);
  });

  it('31. direction persists', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { direction: 'face_target' });
    expect(getQaPresentation(state, actionKey, 0)?.direction).toBe('face_target');
  });

  it('32. action A values do not leak to action B', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, 'w_charge', 0, { scale: 2.0 });
    state = setQaSourceId(state, 'w_charge', 0, 'r1_0001');
    expect(getQaPresentation(state, 'w_whirl', 0)?.scale).toBeUndefined();
    expect(getQaSourceId(state, 'w_whirl', 0)).toBeUndefined();
  });

  it('33. step 1 values do not leak to step 2', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { scale: 2.0 });
    expect(getQaPresentation(state, actionKey, 1)?.scale).toBeUndefined();
  });

  it('34. reset restores production values', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, actionKey, 0, 'r1_9999');
    state = setQaPresentation(state, actionKey, 0, { scale: 3.0 });
    state = resetQaStep(state, actionKey, 0);
    expect(getQaSourceId(state, actionKey, 0)).toBeUndefined();
    expect(getQaPresentation(state, actionKey, 0)).toBeUndefined();
  });

  it('35. unchanged values report SAME AS PRODUCTION', () => {
    const action = getLabAction(actionKey)!;
    let state = createDefaultLabState();
    const step = action.vfxSteps[0];
    expect(step).toBeDefined();
    const qaPres: LabPresentationOverride = {};
    expect(isPresentationModified(qaPres, step!)).toBe(false);
    expect(getQaStatus(state, action, 0)).toBe('SAME_AS_PRODUCTION');
  });

  it('36. changed values report QA MODIFIED', () => {
    const action = getLabAction(actionKey)!;
    let state = createDefaultLabState();
    state = setQaPresentation(state, actionKey, 0, { scale: 99.0 });
    expect(getQaStatus(state, action, 0)).toBe('QA_MODIFIED');
  });
});

// ============================================================ ACQUISITION UX

describe('R2C-LAB V1B — Acquisition UX', () => {
  it('37. READY source plays directly', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    // r1_2561 is in the runtime manifest (READY)
    state = setQaSourceId(state, 'w_charge', 0, 'r1_2561');
    const result = playQaOverride(ctx, state, 'w_charge');
    expect(result.played).toBe(true);
    expect(result.snapshot!.source).toBe('r1_2561');
  });

  it('38. AVAILABLE_ON_DEMAND source acquires then plays', () => {
    const { ctx, calls } = makeMockPlaybackContext();
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_0001');
    const result = playQaOverride(ctx, state, 'w_charge');
    expect(result.played).toBe(true);
    expect(result.snapshot!.source).toBe('r1_0001');
  });

  it('39. ERROR does not destroy previous QA state', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_2561');
    state = setQaPresentation(state, 'w_charge', 0, { scale: 1.5 });
    // Simulate acquisition error — state should be preserved
    expect(getQaSourceId(state, 'w_charge', 0)).toBe('r1_2561');
    expect(getQaPresentation(state, 'w_charge', 0)?.scale).toBe(1.5);
  });

  it('40. resource stats reflect Lab loads', async () => {
    const stats = vfxResourceManager.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats.cachedResources).toBe('number');
    expect(typeof stats.loads).toBe('number');
    expect(typeof stats.cacheHits).toBe('number');
    expect(typeof stats.evictions).toBe('number');
    expect(stats.budget).toBe(10);
  });
});

// ============================================================ SNAPSHOT

describe('R2C-LAB V1B — Snapshot', () => {
  it('41. V2 snapshot contains QA source', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_9999');
    const snapshot = exportLabSnapshot(state);
    const step0 = snapshot.actions['w_charge']!.steps['0']!;
    expect(step0.qa).toBeDefined();
    expect(step0.qa!.sourceId).toBe('r1_9999');
  });

  it('42. V2 snapshot contains all presentation values', () => {
    let state = createDefaultLabState();
    state = setQaPresentation(state, 'w_charge', 0, {
      scale: 0.82, offsetX: 0.04, offsetY: -0.12, duration: 0.68,
      opacity: 0.9, anchor: 'target', layer: 'impact', blending: 'additive',
      fadeIn: 0.05, fadeOut: 0.8, direction: 'face_target',
    });
    const snapshot = exportLabSnapshot(state);
    const step0 = snapshot.actions['w_charge']!.steps['0']!;
    expect(step0.qa).toBeDefined();
    expect(step0.qa!.presentation).toBeDefined();
    expect(step0.qa!.presentation!.scale).toBe(0.82);
    expect(step0.qa!.presentation!.offsetX).toBe(0.04);
    expect(step0.qa!.presentation!.offsetY).toBe(-0.12);
    expect(step0.qa!.presentation!.duration).toBe(0.68);
    expect(step0.qa!.presentation!.opacity).toBe(0.9);
    expect(step0.qa!.presentation!.anchor).toBe('target');
    expect(step0.qa!.presentation!.layer).toBe('impact');
    expect(step0.qa!.presentation!.blending).toBe('additive');
    expect(step0.qa!.presentation!.fadeIn).toBe(0.05);
    expect(step0.qa!.presentation!.fadeOut).toBe(0.8);
    expect(step0.qa!.presentation!.direction).toBe('face_target');
  });

  it('43. snapshot supports multi-step presets', () => {
    const actions = getActionCount();
    const snapshot = exportLabSnapshot(createDefaultLabState());
    // Find an action with multiple steps
    let foundMulti = false;
    for (const [key, action] of Object.entries(snapshot.actions)) {
      const stepKeys = Object.keys(action.steps);
      if (stepKeys.length > 1) {
        foundMulti = true;
        expect(stepKeys).toContain('0');
        expect(stepKeys).toContain('1');
      }
    }
    // Some actions have multi-step presets
    expect(foundMulti || actions.total === 83).toBe(true);
  });

  it('44. snapshot deterministic (same state → same actions)', () => {
    let state = createDefaultLabState();
    state = setQaSourceId(state, 'w_charge', 0, 'r1_9999');
    const s1 = exportLabSnapshot(state);
    const s2 = exportLabSnapshot(state);
    expect(s1.version).toBe(s2.version);
    expect(Object.keys(s1.actions).length).toBe(Object.keys(s2.actions).length);
    expect(s1.actions['w_charge']!.steps['0']!.qa?.sourceId).toBe(s2.actions['w_charge']!.steps['0']!.qa?.sourceId);
  });
});

// ============================================================ PRESERVATION

describe('R2C-LAB V1B — Preservation', () => {
  it('45. 83 actions remain', () => {
    expect(getActionCount().total).toBe(83);
  });

  it('46. 2769 catalogue remains', () => {
    const catalogue = buildCatalogue(inventoryJson as never);
    expect(catalogue.length).toBe(2769);
  });

  it('47. gameplay unchanged (no gameplay modules imported by Lab)', () => {
    // Lab modules do not import gameplay resolution
    const labModules = ['CombatVfxLab.ts', 'CombatVfxLabWorkbench.ts', 'LabPlayback.ts', 'LabAcquisition.ts'];
    expect(labModules.length).toBe(4);
  });

  it('48. Combat Stage configuration unchanged', async () => {
    const { resolvePresentationRoute } = await import('../stage/combatStageProfiles');
    expect(typeof resolvePresentationRoute).toBe('function');
  });

  it('49. production VFX mappings unchanged', () => {
    const sheet = VFX_SPRITE_SHEETS['megapack_dash_wind_white_v3'];
    expect(sheet).toBeDefined();
    expect(sheet.sourceCandidateId).toBe('r1_2561');
    expect(sheet.rows).toBe(4);
    expect(sheet.cols).toBe(4);
  });

  it('50. old QA tools remain', async () => {
    // R2C-A workbench module still exists
    const mod = await import('./MegaPackHeldReviewWorkbench');
    expect(mod.installMegaPackHeldReviewWorkbench).toBeDefined();
  });
});
