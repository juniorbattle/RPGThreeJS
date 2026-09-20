import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';

function publicPath(url: string): string {
  return resolve(process.cwd(), 'public', url.replace(/^\/assets\//, 'assets/'));
}

describe('TraversalT0Assets', () => {
  it('keeps every T0 visual in the project asset tree', () => {
    for (const url of Object.values(TRAVERSAL_T0_ASSETS)) {
      expect(url).toMatch(/^\/assets\/generated\/lion-phase\/traversal\/t0\//);
      expect(existsSync(publicPath(url))).toBe(true);
      expect(readFileSync(publicPath(url)).subarray(1, 4).toString('ascii')).toBe('PNG');
    }
    expect(TRAVERSAL_T0_ASSETS.vehicle).toContain('/vehicle/wooden-4x4/');
    expect(TRAVERSAL_T0_ASSETS.vehicle).not.toContain('/wagon/');
    expect(TRAVERSAL_T0_ASSETS.merchantCaravan).toContain('/entities/merchant-caravan/');
  });
});
