// @vitest-environment happy-dom
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAVERSAL_PURSUER_IMAGE, TraversalRoutePursuitRenderer } from './TraversalRoutePursuitRenderer';
import { TRAVERSAL_PURSUER_RUN } from './TraversalPursuerSprite';

const assetPath = '/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png';
const root = resolve(process.cwd(), 'public/assets/generated/lion-phase/traversal/t0');

describe('T0 Pursuit art contract', () => {
  it('renders only the approved decorative image without the geometric DEV proxy', () => {
    const renderer = new TraversalRoutePursuitRenderer();
    const image = renderer.element.querySelector<HTMLImageElement>('img');
    expect(TRAVERSAL_PURSUER_IMAGE).toBe(assetPath);
    expect(renderer.element.getAttribute('aria-hidden')).toBe('true');
    expect(renderer.element.querySelectorAll('.traversal-pursuer-sprite')).toHaveLength(1);
    const loader = renderer.element.querySelector<HTMLImageElement>('.traversal-pursuer-sprite__loader');
    expect(loader?.hidden).toBe(true);
    expect(loader?.getAttribute('src')).toBe(TRAVERSAL_PURSUER_RUN);
    expect(image?.getAttribute('src')).toBe(assetPath);
    expect(image?.getAttribute('alt')).toBe('');
    expect(renderer.element.querySelector('button, input, a, [tabindex]')).toBeNull();
    expect(renderer.element.querySelector('.traversal-route-pursuit__head, .traversal-route-pursuit__body, .traversal-route-pursuit__wheel')).toBeNull();
    expect(renderer.element.textContent).not.toContain('DEV · REAR PURSUER');
    renderer.dispose();
  });

  it('ships the six-frame transparent sheet with declared dimensions and unchanged reference', () => {
    const metadata = JSON.parse(readFileSync(resolve(root, 'pursuit/shadow-pursuer-run-v1.json'), 'utf8'));
    const png = readFileSync(resolve(root, 'pursuit/shadow-pursuer-run-v1.png'));
    expect(png.readUInt32BE(16)).toBe(metadata.grid.columns * metadata.grid.frameWidth);
    expect(png.readUInt32BE(20)).toBe(metadata.grid.rows * metadata.grid.frameHeight);
    expect(png[25]).toBe(6);
    expect(createHash('sha256').update(png).digest('hex')).toBe(metadata.sheetSha256);
    expect(createHash('sha256').update(readFileSync(resolve(root, 'pursuit/shadow-pursuer.png'))).digest('hex')).toBe(metadata.referenceSha256);
    expect(new Set(metadata.frames.map((frame: { feetBaseline: number }) => frame.feetBaseline))).toEqual(new Set([226, 227]));
  });

  it('registers the sole Pursuit PNG with matching dimensions and SHA-256', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'asset-manifest.json'), 'utf8')) as {
      assets: { id: string; path: string; role: string; width: number; height: number; sha256: string }[];
    };
    const entries = manifest.assets.filter(asset => asset.role === 'pursuit');
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry).toMatchObject({ id: 'pursuit-shadow-pursuer', path: assetPath,
      width: 640, height: 336 });
    const png = readFileSync(resolve(root, 'pursuit/shadow-pursuer.png'));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(entry.width);
    expect(png.readUInt32BE(20)).toBe(entry.height);
    expect(png[25]).toBe(6); // PNG RGBA
    expect(createHash('sha256').update(png).digest('hex')).toBe(entry.sha256);
  });
});
