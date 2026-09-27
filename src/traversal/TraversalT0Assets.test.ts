import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import { TRAVERSAL_WORLD_ASSETS } from './TraversalT0World';
import { TRAVERSAL_FOREGROUND_ASSETS } from './TraversalDepth';
import { TRAVERSAL_CARAVAN } from './TraversalCaravan';
import bounds from './TraversalSpriteBounds.json';

interface ManifestAsset { path: string; sha256: string }
const root = resolve(process.cwd(), 'public/assets/generated/lion-phase/traversal/t0');
const manifest = JSON.parse(readFileSync(resolve(root, 'asset-manifest.json'), 'utf8')) as {
  assets: ManifestAsset[];
};

function publicPath(url: string): string {
  return resolve(process.cwd(), 'public', url.replace(/^\/assets\//, 'assets/'));
}

describe('TraversalT0Assets', () => {
  it('keeps every runtime asset in the canonical pack and manifest', () => {
    const runtime = [...Object.values(TRAVERSAL_T0_ASSETS), ...Object.values(TRAVERSAL_WORLD_ASSETS),
      ...Object.values(TRAVERSAL_FOREGROUND_ASSETS), TRAVERSAL_CARAVAN.chassis, TRAVERSAL_CARAVAN.wheelSource];
    const registered = new Set(manifest.assets.map(asset => asset.path));
    for (const url of runtime) {
      expect(url).toMatch(/^\/assets\/generated\/lion-phase\/traversal\/t0\//);
      expect(existsSync(publicPath(url))).toBe(true);
      expect(readFileSync(publicPath(url)).subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(registered.has(url)).toBe(true);
    }
    expect(TRAVERSAL_T0_ASSETS.forkSign).toContain('/props/fork-sign.png');
    expect(TRAVERSAL_WORLD_ASSETS.rest).toContain('/world-v1/refugee-halt.png');
  });

  it('has a manifest entry for every T0 PNG and no stale or altered entry', () => {
    const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
      .flatMap(entry => entry.isDirectory() ? files(resolve(directory, entry.name))
        : [resolve(directory, entry.name)]);
    const actual = files(root).filter(file => file.endsWith('.png'))
      .map(file => `/assets/generated/lion-phase/traversal/t0/${file.slice(root.length + 1).replaceAll('\\', '/')}`);
    expect(manifest.assets.map(asset => asset.path).sort()).toEqual(actual.sort());
    for (const asset of manifest.assets) {
      const bytes = readFileSync(publicPath(asset.path));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });

  it('keeps visible bounds for every current T0 sprite and no removed sprite', () => {
    const spriteUrls = [TRAVERSAL_T0_ASSETS.forkSign, TRAVERSAL_T0_ASSETS.abandonedCart,
      ...Object.values(TRAVERSAL_FOREGROUND_ASSETS)];
    for (const url of spriteUrls) expect(Object.keys(bounds)).toContain(url);
    for (const url of Object.keys(bounds).filter(key => key.includes('/traversal/t0/')))
      expect(existsSync(publicPath(url))).toBe(true);
  });

  it('forbids old route scenery in current Traversal source and the manifest', () => {
    const forbidden = /forest-v4\/|t0-wide-road-loop|t0-far-panorama-loop|road-loop\.png|trees-loop\.png|forest-v4\/far/;
    for (const entry of readdirSync(resolve(process.cwd(), 'src/traversal'))) {
      if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue;
      expect(readFileSync(resolve(process.cwd(), 'src/traversal', entry), 'utf8')).not.toMatch(forbidden);
    }
    expect(JSON.stringify(manifest)).not.toMatch(forbidden);
  });
});
