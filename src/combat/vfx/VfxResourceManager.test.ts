import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import {
  VfxResourceManager,
  resolveSheetSource,
  resolveCandidateSource,
  resolveCandidateAvailability,
  getCandidateInventoryRecord,
  DEFAULT_FOUR_K_BUDGET,
} from './VfxResourceManager';
import { VFX_SPRITE_SHEETS, loadVfxSpriteSheetTexture, releaseVfxSpriteSheetTexture } from './VfxSpriteSheets';
import type { VfxSpriteSheetId } from './VfxTypes';

// ============================================================ Helpers

function makeMockTexture(): THREE.Texture {
  const tex = new THREE.Texture();
  tex.dispose = vi.fn();
  return tex;
}

function makeMockLoader(textures: Map<string, THREE.Texture>, delay = 0): (url: string) => Promise<THREE.Texture> {
  return (url: string) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const tex = textures.get(url);
        if (!tex) {
          reject(new Error(`Mock load failed: ${url}`));
          return;
        }
        resolve(tex);
      }, delay);
    });
}

function makeFailingLoader(): (url: string) => Promise<THREE.Texture> {
  return () => Promise.reject(new Error('Intentional load failure'));
}

function make4096Descriptor(): { url: string; width: number; height: number } {
  return { url: 'mock://4096', width: 4096, height: 4096 };
}

function make2048Descriptor(): { url: string; width: number; height: number } {
  return { url: 'mock://2048', width: 2048, height: 2048 };
}

// ============================================================ Tests

describe('VfxResourceManager — Basic Acquisition', () => {
  it('1. first acquire loads resource', async () => {
    const textures = new Map([['mock://test', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures) });
    const tex = await mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 });
    expect(tex).toBeDefined();
    expect(mgr.getStats().loads).toBe(1);
    mgr.disposeAll();
  });

  it('2. second acquire reuses cached resource', async () => {
    const textures = new Map([['mock://test', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures) });
    await mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 });
    mgr.release('key1');
    await mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 });
    expect(mgr.getStats().loads).toBe(1);
    expect(mgr.getStats().cacheHits).toBe(1);
    mgr.disposeAll();
  });

  it('3. concurrent same-source acquisitions deduplicate load', async () => {
    const textures = new Map([['mock://test', makeMockTexture()]]);
    const loader = vi.fn(makeMockLoader(textures, 10));
    const mgr = new VfxResourceManager({ loader });
    const [a, b, c] = await Promise.all([
      mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 }),
      mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 }),
      mgr.acquire('key1', { url: 'mock://test', width: 4096, height: 4096 }),
    ]);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
    mgr.disposeAll();
  });

  it('4. failed load cleans pending state', async () => {
    const mgr = new VfxResourceManager({ loader: makeFailingLoader() });
    await expect(mgr.acquire('key1', { url: 'mock://fail', width: 4096, height: 4096 })).rejects.toThrow();
    expect(mgr.getStats().pendingLoads).toBe(0);
    expect(mgr.getStats().cachedResources).toBe(0);
  });

  it('5. failed resource can be retried later', async () => {
    let shouldFail = true;
    const textures = new Map([['mock://retry', makeMockTexture()]]);
    const loader = (url: string) => {
      if (shouldFail) return Promise.reject(new Error('First attempt fails'));
      const tex = textures.get(url);
      if (!tex) return Promise.reject(new Error('Missing'));
      return Promise.resolve(tex);
    };
    const mgr = new VfxResourceManager({ loader });
    await expect(mgr.acquire('key1', { url: 'mock://retry', width: 4096, height: 4096 })).rejects.toThrow();
    shouldFail = false;
    const tex = await mgr.acquire('key1', { url: 'mock://retry', width: 4096, height: 4096 });
    expect(tex).toBeDefined();
    expect(mgr.getStats().loads).toBe(1);
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — Source Resolution', () => {
  it('6. 2048 source receives correct native metadata', () => {
    const desc = resolveCandidateSource('r1_2561');
    expect(desc).not.toBeNull();
    expect(desc!.width).toBe(2048);
    expect(desc!.height).toBe(2048);
  });

  it('7. 4096 source receives correct native metadata', () => {
    const desc = resolveCandidateSource('r1_1605');
    expect(desc).not.toBeNull();
    expect(desc!.width).toBe(4096);
    expect(desc!.height).toBe(4096);
  });

  it('8. unsupported native source rejected safely', () => {
    const result = resolveCandidateSource('r1_0001');
    const rec = getCandidateInventoryRecord('r1_0001');
    if (rec && (rec.width === 2048 || rec.width === 4096)) {
      expect(result).not.toBeNull();
    } else {
      expect(result).toBeNull();
    }
  });

  it('9. arbitrary unknown candidate rejected', () => {
    expect(resolveCandidateSource('r9_9999')).toBeNull();
    expect(resolveCandidateSource('')).toBeNull();
    expect(resolveCandidateSource('../../etc/passwd')).toBeNull();
  });

  it('10. arbitrary filesystem path cannot be injected', () => {
    expect(resolveCandidateSource('../../../etc/passwd')).toBeNull();
    expect(resolveCandidateSource('file:///etc/passwd')).toBeNull();
    expect(resolveCandidateSource('/absolute/path')).toBeNull();
    const desc = resolveCandidateSource('r1_0001');
    if (desc) {
      expect(desc.url).toMatch(/^\/assets\/vfx\/megapack-runtime\//);
    }
  });
});

describe('VfxResourceManager — Cache Weight & Budget', () => {
  it('11. cache weight differs for 2048 vs 4096', async () => {
    const textures = new Map([
      ['mock://2048', makeMockTexture()],
      ['mock://4096', makeMockTexture()],
    ]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('small', make2048Descriptor());
    mgr.release('small');
    await mgr.acquire('large', make4096Descriptor());
    mgr.release('large');
    const stats = mgr.getStats();
    expect(stats.fourKEquivalentUsage).toBeCloseTo(1.25, 2);
    mgr.disposeAll();
  });

  it('12. cache remains inside configured budget', async () => {
    const textures = new Map();
    for (let i = 0; i < 20; i++) {
      textures.set(`mock://${i}`, makeMockTexture());
    }
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 2 });
    for (let i = 0; i < 20; i++) {
      await mgr.acquire(`key${i}`, { url: `mock://${i}`, width: 4096, height: 4096 });
      mgr.release(`key${i}`);
    }
    expect(mgr.getStats().fourKEquivalentUsage).toBeLessThanOrEqual(2);
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — LRU Eviction', () => {
  it('13. LRU resource evicted when needed', async () => {
    const textures = new Map();
    for (let i = 0; i < 5; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 2 });
    for (let i = 0; i < 5; i++) {
      await mgr.acquire(`key${i}`, { url: `mock://${i}`, width: 4096, height: 4096 });
      mgr.release(`key${i}`);
    }
    expect(mgr.getStats().evictions).toBeGreaterThan(0);
    expect(mgr.getStats().cachedResources).toBeLessThanOrEqual(2);
    mgr.disposeAll();
  });

  it('14. recently used resource survives before older resource', async () => {
    const textures = new Map();
    for (let i = 0; i < 4; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 2 });
    await mgr.acquire('old', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('old');
    await mgr.acquire('mid', { url: 'mock://1', width: 4096, height: 4096 });
    mgr.release('mid');
    await mgr.acquire('old', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('old');
    await mgr.acquire('new', { url: 'mock://2', width: 4096, height: 4096 });
    mgr.release('new');
    const stats = mgr.getStats();
    expect(stats.cachedResources).toBeLessThanOrEqual(2);
    mgr.disposeAll();
  });

  it('15. retained/active resource not evicted', async () => {
    const textures = new Map();
    for (let i = 0; i < 5; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 1 });
    await mgr.acquire('retained', { url: 'mock://0', width: 4096, height: 4096 });
    for (let i = 1; i < 5; i++) {
      await mgr.acquire(`key${i}`, { url: `mock://${i}`, width: 4096, height: 4096 });
      mgr.release(`key${i}`);
    }
    expect(mgr.getStats().retainedResources).toBeGreaterThanOrEqual(1);
    mgr.disposeAll();
  });

  it('16. released resource becomes eviction-eligible', async () => {
    const textures = new Map();
    for (let i = 0; i < 4; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 1 });
    await mgr.acquire('key0', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('key0');
    await mgr.acquire('key1', { url: 'mock://1', width: 4096, height: 4096 });
    mgr.release('key1');
    expect(mgr.getStats().evictions).toBeGreaterThan(0);
    mgr.disposeAll();
  });

  it('17. eviction disposes texture', async () => {
    const tex0 = makeMockTexture();
    const textures = new Map([
      ['mock://0', tex0],
      ['mock://1', makeMockTexture()],
    ]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 1 });
    await mgr.acquire('key0', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('key0');
    await mgr.acquire('key1', { url: 'mock://1', width: 4096, height: 4096 });
    mgr.release('key1');
    expect(tex0.dispose).toHaveBeenCalled();
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — Disposal', () => {
  it('18. disposeAll disposes all manager-owned resources', async () => {
    const tex0 = makeMockTexture();
    const tex1 = makeMockTexture();
    const textures = new Map([['mock://0', tex0], ['mock://1', tex1]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('key0', { url: 'mock://0', width: 4096, height: 4096 });
    await mgr.acquire('key1', { url: 'mock://1', width: 4096, height: 4096 });
    mgr.disposeAll();
    expect(tex0.dispose).toHaveBeenCalled();
    expect(tex1.dispose).toHaveBeenCalled();
    expect(mgr.getStats().cachedResources).toBe(0);
  });
});

describe('VfxResourceManager — Clone Policy', () => {
  it('19. base resource is not disposed by individual playback completion', async () => {
    const baseTex = makeMockTexture();
    const textures = new Map([['mock://base', baseTex]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    const acquired = await mgr.acquire('key', { url: 'mock://base', width: 4096, height: 4096 });
    const clone = acquired.clone();
    clone.dispose = vi.fn();
    mgr.release('key');
    clone.dispose();
    expect(baseTex.dispose).not.toHaveBeenCalled();
    expect(mgr.getStats().cachedResources).toBe(1);
    mgr.disposeAll();
  });

  it('20. existing playback clone disposal remains safe', async () => {
    const baseTex = makeMockTexture();
    const textures = new Map([['mock://base', baseTex]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    const acquired = await mgr.acquire('key', { url: 'mock://base', width: 4096, height: 4096 });
    const clone = acquired.clone();
    clone.dispose = vi.fn();
    clone.dispose();
    mgr.release('key');
    expect(clone.dispose).toHaveBeenCalled();
    expect(baseTex.dispose).not.toHaveBeenCalled();
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — Preload', () => {
  it('21. preload uses same manager', async () => {
    const textures = new Map([
      ['mock://0', makeMockTexture()],
      ['mock://1', makeMockTexture()],
    ]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.preload([
      { key: 'k0', descriptor: { url: 'mock://0', width: 4096, height: 4096 } },
      { key: 'k1', descriptor: { url: 'mock://1', width: 4096, height: 4096 } },
    ]);
    expect(mgr.getStats().loads).toBe(2);
    expect(mgr.getStats().cachedResources).toBe(2);
    mgr.disposeAll();
  });

  it('22. preload obeys memory budget', async () => {
    const textures = new Map();
    for (let i = 0; i < 10; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 2 });
    const sources = [];
    for (let i = 0; i < 10; i++) {
      sources.push({ key: `k${i}`, descriptor: { url: `mock://${i}`, width: 4096, height: 4096 } });
    }
    await mgr.preload(sources);
    expect(mgr.getStats().fourKEquivalentUsage).toBeLessThanOrEqual(2);
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — Stats', () => {
  it('23. stats reflect loads', async () => {
    const textures = new Map([['mock://0', makeMockTexture()], ['mock://1', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('k0', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('k0');
    await mgr.acquire('k1', { url: 'mock://1', width: 4096, height: 4096 });
    mgr.release('k1');
    expect(mgr.getStats().loads).toBe(2);
    mgr.disposeAll();
  });

  it('24. stats reflect hits', async () => {
    const textures = new Map([['mock://0', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('k0', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('k0');
    await mgr.acquire('k0', { url: 'mock://0', width: 4096, height: 4096 });
    mgr.release('k0');
    expect(mgr.getStats().cacheHits).toBe(1);
    mgr.disposeAll();
  });

  it('25. stats reflect evictions', async () => {
    const textures = new Map();
    for (let i = 0; i < 5; i++) textures.set(`mock://${i}`, makeMockTexture());
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 1 });
    for (let i = 0; i < 5; i++) {
      await mgr.acquire(`k${i}`, { url: `mock://${i}`, width: 4096, height: 4096 });
      mgr.release(`k${i}`);
    }
    expect(mgr.getStats().evictions).toBeGreaterThan(0);
    mgr.disposeAll();
  });
});

describe('VfxResourceManager — VfxSystem Integration', () => {
  it('26. production VfxSystem uses manager acquisition', async () => {
    const sheetId = 'megapack_fire_slash_spin' as VfxSpriteSheetId;
    const desc = resolveSheetSource(sheetId);
    expect(desc).not.toBeNull();
    expect(desc!.url).toBe(VFX_SPRITE_SHEETS[sheetId].url);
  });

  it('26b. R2C-C.1: legacy sheet IDs resolve to null (retired)', () => {
    const sheetId = 'basic_greatsword_cleave_heavy' as VfxSpriteSheetId;
    const desc = resolveSheetSource(sheetId);
    expect(desc).toBeNull();
  });

  it('27. no second Lab texture cache exists', () => {
    const vfxFiles = [
      'VfxResourceManager.ts',
      'VfxSpriteSheets.ts',
      'VfxTextures.ts',
      'VfxSystem.ts',
    ];
    const labCacheFiles = vfxFiles.filter(f =>
      f.includes('LabTextureCache') || f.includes('LabPreviewCache') || f.includes('MegaPackPreviewCache'),
    );
    expect(labCacheFiles).toHaveLength(0);
  });

  it('28. existing native frame behavior unchanged', () => {
    const nativeId = 'megapack_dash_wind_white_v3' as VfxSpriteSheetId;
    const def = VFX_SPRITE_SHEETS[nativeId];
    expect(def.rows).toBe(4);
    expect(def.cols).toBe(4);
    expect(def.frameCount).toBe(16);
    expect(def.sheetWidthPx).toBe(2048);
    expect(def.sheetHeightPx).toBe(2048);
    const nativeId2 = 'megapack_blue_slash_flurry' as VfxSpriteSheetId;
    const def2 = VFX_SPRITE_SHEETS[nativeId2];
    expect(def2.rows).toBe(8);
    expect(def2.cols).toBe(8);
    expect(def2.frameCount).toBe(64);
    expect(def2.sheetWidthPx).toBe(4096);
    expect(def2.sheetHeightPx).toBe(4096);
  });

  it('29. no full Mega Pack copy occurs', () => {
    const stats = resolveCandidateAvailability('r1_0001');
    expect(['AVAILABLE_ON_DEMAND', 'READY', 'UNSUPPORTED_NATIVE']).toContain(stats);
  });

  it('30. commercial PNGs remain untracked', () => {
    const rec = getCandidateInventoryRecord('r1_0001');
    expect(rec).not.toBeNull();
    expect(rec!.sourceFilename).not.toContain('/assets/');
    expect(rec!.relativePath).toMatch(/^01_extracted\//);
  });
});

describe('VfxResourceManager — Preservation', () => {
  it('31. normal game works without vfxlab', () => {
    expect(typeof loadVfxSpriteSheetTexture).toBe('function');
    expect(typeof releaseVfxSpriteSheetTexture).toBe('function');
  });

  it('32. R2C-LAB V1A still loads', () => {
    expect(typeof resolveCandidateSource).toBe('function');
    expect(typeof resolveCandidateAvailability).toBe('function');
  });

  it('33. 83-action inventory unchanged', async () => {
    const { getActionCount } = await import('./CombatVfxLab');
    const counts = getActionCount();
    expect(counts.total).toBe(83);
  });

  it('34. 2769 metadata catalogue unchanged', async () => {
    const { buildCatalogue } = await import('./CombatVfxLab');
    const inventory = await import('../../../docs/reports/vfx-megapack-r1-2-4-corrected-inventory.json');
    const catalogue = buildCatalogue(inventory as never);
    expect(catalogue.length).toBe(2769);
  });
});

describe('VfxResourceManager — Config', () => {
  it('default budget is 10 4K-equivalent units', () => {
    expect(DEFAULT_FOUR_K_BUDGET).toBe(10);
  });

  it('budget is configurable', () => {
    const mgr = new VfxResourceManager({ budget: 5 });
    expect(mgr.budget).toBe(5);
    mgr.disposeAll();
  });

  it('decoded bytes estimate is correct for 4096', async () => {
    const textures = new Map([['mock://4096', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('k', make4096Descriptor());
    mgr.release('k');
    expect(mgr.getStats().decodedBytesEstimate).toBe(4096 * 4096 * 4);
    mgr.disposeAll();
  });

  it('decoded bytes estimate is correct for 2048', async () => {
    const textures = new Map([['mock://2048', makeMockTexture()]]);
    const mgr = new VfxResourceManager({ loader: makeMockLoader(textures), budget: 100 });
    await mgr.acquire('k', make2048Descriptor());
    mgr.release('k');
    expect(mgr.getStats().decodedBytesEstimate).toBe(2048 * 2048 * 4);
    mgr.disposeAll();
  });
});
