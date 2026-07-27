import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getCarouselStatusFrame,
  getStatusIndicatorAsset,
  getStatusLabel,
  getVisibleStatusIndicators,
} from './statusPresentation';

describe('status presentation', () => {
  it('sorts state and negative effects before positive effects', () => {
    const result = getVisibleStatusIndicators({ regen: 2, burn: 1, root: 2, barrier: 3 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['exhausted', 'root', 'burn', 'regen', 'barrier']);
  });

  it('lets Brisé override derived Essoufflé', () => {
    const result = getVisibleStatusIndicators({ staggered: 1, burn: 2 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['staggered', 'burn']);
    expect(result.visible.some(({ key }) => key === 'exhausted')).toBe(false);
  });

  it('shows Essoufflé when AP exhaustion is derived', () => {
    const result = getVisibleStatusIndicators({ poison: 2 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['exhausted', 'poison']);
  });

  it('limits badges and reports overflow for compact callers', () => {
    const result = getVisibleStatusIndicators({ burn: 1, poison: 2, blind: 2, weak: 1, regen: 3 });
    expect(result.visible.map(({ key }) => key)).toEqual(['burn', 'poison', 'blind']);
    expect(result.overflowCount).toBe(2);
  });

  it('keeps positive statuses presentable after higher priority effects', () => {
    const result = getVisibleStatusIndicators({ boost: 1, barrier: 1, regen: 1, curse: 2 }, { maxVisible: 10 });
    expect(result.visible.map(({ key }) => key)).toEqual(['curse', 'regen', 'boost', 'barrier']);
  });

  it('returns corrected French labels', () => {
    expect(getStatusLabel('burn')).toBe('Brûlure');
    expect(getStatusLabel('staggered')).toBe('Brisé');
    expect(getStatusLabel('exhausted')).toBe('Essoufflé');
    expect(getStatusLabel('curse')).toBe('Malédiction');
    expect(getStatusLabel('weak')).toBe('Affaibli');
    expect(getStatusLabel('slow')).toBe('Ralenti');
  });

  it('keeps a single status stable without carousel cycling', () => {
    const frame = getCarouselStatusFrame({ burn: 2 }, 12_000);
    expect(frame?.current.key).toBe('burn');
    expect(frame?.next).toBeUndefined();
    expect(frame?.transitionProgress).toBe(0);
    expect(frame?.total).toBe(1);
  });

  it('cycles multiple statuses in priority order deterministically', () => {
    const statuses = { burn: 2, root: 1 };
    const first = getCarouselStatusFrame(statuses, 0, { phaseOffsetMs: 0 });
    const next = getCarouselStatusFrame(statuses, 1_100, { phaseOffsetMs: 0 });
    const repeat = getCarouselStatusFrame(statuses, 1_100, { phaseOffsetMs: 0 });
    expect(first?.current.key).toBe('root');
    expect(next?.current.key).toBe('burn');
    expect(repeat).toEqual(next);
  });

  it('gives Brisé priority and suppresses Essoufflé in the carousel', () => {
    const frame = getCarouselStatusFrame({ burn: 2, staggered: 1 }, 0, { exhausted: true });
    expect(frame?.current.key).toBe('staggered');
    expect(frame?.signature).not.toContain('exhausted');
  });

  it('reports the complete carousel status count instead of truncating it', () => {
    const frame = getCarouselStatusFrame({ burn: 1, poison: 1, blind: 1, weak: 1, regen: 1 }, 0);
    expect(frame?.total).toBe(5);
    expect(frame?.signature.split('|')).toHaveLength(5);
  });

  it('maps the processed indicator assets and keeps Canvas fallback entries', () => {
    const runtimeKeys = ['burn', 'poison', 'slow', 'root', 'blind', 'weak', 'curse', 'silence', 'exhausted', 'staggered'];
    for (const key of runtimeKeys) {
      const asset = getStatusIndicatorAsset(key);
      expect(asset?.url).toMatch(/^\/assets\/status-indicators\/runtime\//);
      const publicPath = asset?.url?.replace(/^\/assets\//, 'public/assets/');
      expect(publicPath && existsSync(resolve(process.cwd(), publicPath))).toBe(true);
    }
    expect(getStatusIndicatorAsset('regen')).toEqual({ id: 'status_regen_indicator', fallback: 'canvas', url: undefined });
  });

  it('reduces carousel motion without removing the indicator', () => {
    const normal = getCarouselStatusFrame({ staggered: 1, burn: 1 }, 1_350);
    const reduced = getCarouselStatusFrame({ staggered: 1, burn: 1 }, 1_350, { reducedGraphics: true });
    expect(reduced?.current.key).toBe(normal?.current.key);
    expect(reduced?.transitionMs).toBeLessThanOrEqual(normal?.transitionMs ?? 0);
    expect(reduced?.spriteScale).toBeLessThan(normal?.spriteScale ?? 0);
  });
});

describe('V10G-R2A.3 compact exhausted indicator', () => {
  it('status carousel includes exhausted indicator when exhausted', () => {
    const result = getVisibleStatusIndicators({}, { exhausted: true, maxVisible: 10 });
    expect(result.visible.some(({ key }) => key === 'exhausted')).toBe(true);
  });

  it('status carousel includes staggered indicator when staggered', () => {
    const result = getVisibleStatusIndicators({ staggered: 1 }, { maxVisible: 10 });
    expect(result.visible.some(({ key }) => key === 'staggered')).toBe(true);
  });

  it('Brisé overrides Essoufflé visually in carousel', () => {
    const result = getVisibleStatusIndicators({ staggered: 1 }, { exhausted: true, maxVisible: 10 });
    expect(result.visible.some(({ key }) => key === 'staggered')).toBe(true);
    expect(result.visible.some(({ key }) => key === 'exhausted')).toBe(false);
  });

  it('exhausted indicator uses compact carousel badge, not floor ring', () => {
    const frame = getCarouselStatusFrame({}, 0, { exhausted: true });
    expect(frame).toBeDefined();
    expect(frame?.current.key).toBe('exhausted');
    expect(frame?.current.shortCode).toBe('ESS');
    expect(frame?.current.spriteScale).toBeLessThan(1.1);
  });

  it('staggered indicator uses compact carousel badge, not floor ring', () => {
    const frame = getCarouselStatusFrame({ staggered: 1 }, 0);
    expect(frame).toBeDefined();
    expect(frame?.current.key).toBe('staggered');
    expect(frame?.current.shortCode).toBe('BRI');
    expect(frame?.current.spriteScale).toBeLessThan(1.15);
  });

  it('exhausted and staggered indicator assets remain referenced', () => {
    const exhaustedAsset = getStatusIndicatorAsset('exhausted');
    expect(exhaustedAsset?.url).toMatch(/^\/assets\/status-indicators\/runtime\//);
    const staggeredAsset = getStatusIndicatorAsset('staggered');
    expect(staggeredAsset?.url).toMatch(/^\/assets\/status-indicators\/runtime\//);
  });
});
