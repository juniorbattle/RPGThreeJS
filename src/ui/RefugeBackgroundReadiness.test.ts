// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { preloadRefugeBackground } from './RefugeBackgroundReadiness';

afterEach(() => vi.unstubAllGlobals());

it('reports decoded dimensions for a loaded refuge plate', async () => {
  const decode = vi.fn(async () => {});
  class LoadedImage {
    naturalWidth = 2048;
    naturalHeight = 1152;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decode = decode;
    set src(_url: string) { queueMicrotask(() => this.onload?.()); }
  }
  vi.stubGlobal('Image', LoadedImage);
  const result = await preloadRefugeBackground('/assets/first-refuge-tableau.png');
  expect(decode).toHaveBeenCalledOnce();
  expect(result).toEqual({
    backgroundUrl: '/assets/first-refuge-tableau.png', backgroundReady: true,
    naturalWidth: 2048, naturalHeight: 1152,
  });
});

it('reports a decode failure without blocking the caller', async () => {
  class UndecodableImage {
    naturalWidth = 2048;
    naturalHeight = 1152;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decode = async () => { throw new Error('decode failed'); };
    set src(_url: string) { queueMicrotask(() => this.onload?.()); }
  }
  vi.stubGlobal('Image', UndecodableImage);
  const result = await preloadRefugeBackground('/assets/second-refuge-night-tableau.png');
  expect(result.backgroundReady).toBe(false);
  expect(result.error).toContain('decoded');
});
