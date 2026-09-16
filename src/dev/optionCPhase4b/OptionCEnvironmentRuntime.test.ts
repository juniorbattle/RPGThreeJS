import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OPTION_C_ENVIRONMENT_PACK_ROOT,
  OptionCEnvironmentCatalog,
  optionCEnvironmentBackground,
} from './OptionCEnvironmentRuntime';

function json(path: string): unknown {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as unknown;
}

describe('Option C full-demo environment runtime catalog', () => {
  const root = 'public/assets/dev/option-c/phase4b/environment/demo-environment-pack-v1';
  const manifest = json(`${root}/manifest.json`) as {
    assets: { runtimeCandidatePath: string; sha256: string }[];
  };
  const catalog = new OptionCEnvironmentCatalog(
    json(`${root}/beat-background-map.json`),
    manifest,
  );

  it('resolves every approved demo context without a fallback', () => {
    expect(catalog.totalContexts).toBe(165);
    expect(catalog.mappedContexts).toBe(165);
    expect(catalog.unmappedContexts).toBe(0);
    expect(catalog.fallbackContexts).toBe(0);
    expect(catalog.visualFamilies).toHaveLength(13);
    expect(catalog.manifestAssetCount).toBe(44);
  });

  it('preserves the approved surface coverage', () => {
    expect(catalog.contextsFor('travel')).toHaveLength(23);
    expect(catalog.contextsFor('tableau')).toHaveLength(74);
    expect(catalog.contextsFor('strategic')).toHaveLength(17);
    expect(catalog.contextsFor('combat-stage')).toHaveLength(17);
    expect(catalog.uniqueAssetsFor('strategic').map((entry) => entry.assetId)).toEqual([
      'forest_route_strategic',
      'bois_clair_burning_strategic',
      'lion_sanctum_strategic',
    ]);
    expect(catalog.uniqueAssetsFor('combat-stage').map((entry) => entry.assetId)).toEqual([
      'forest_route_stage',
      'bois_clair_burning_stage',
      'lion_sanctum_stage',
    ]);
  });

  it('keeps every runtime URL inside the isolated approved DEV pack', () => {
    for (const surface of ['travel', 'tableau', 'strategic', 'combat-stage'] as const) {
      for (const entry of catalog.contextsFor(surface)) {
        expect(entry.url.startsWith(OPTION_C_ENVIRONMENT_PACK_ROOT)).toBe(true);
        expect(entry.characterFree).toBe(true);
        expect(entry.width / entry.height).toBeCloseTo(16 / 9, 2);
      }
    }
  });

  it('keeps all 44 approved environment plate bytes exactly manifest-locked', () => {
    expect(manifest.assets).toHaveLength(44);
    for (const asset of manifest.assets) {
      const bytes = readFileSync(resolve(process.cwd(), asset.runtimeCandidatePath));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });

  it('fails visibly instead of silently selecting a generic background', () => {
    expect(() => catalog.resolve('tableau', 'dialogue:not-real')).toThrow(/No STATIC_TABLEAU/);
    expect(() => catalog.resolve('travel', 'dialogue:acte_ouverture')).toThrow(/No TRAVEL/);
  });

  it('uses explicit per-plate Combat Stage fit and contact-shadow metadata', () => {
    const expected = {
      forest_route_stage: { positionY: 0.18, opacity: 0.76, scale: 1.2 },
      bois_clair_burning_stage: { positionY: -0.04, opacity: 0.82, scale: 1.2 },
      lion_sanctum_stage: { positionY: 0.6, opacity: 0.76, scale: 1.28 },
    } as const;
    for (const environment of catalog.uniqueAssetsFor('combat-stage')) {
      const background = optionCEnvironmentBackground(environment);
      const tuning = expected[environment.assetId as keyof typeof expected];
      expect(tuning).toBeDefined();
      expect(background.layers[0]?.position).toEqual([0, tuning.positionY, -8]);
      expect(background.layers[0]?.size).toEqual([13.17, 7.4]);
      expect(background.combatStageGrounding).toEqual({
        contactShadowOpacity: tuning.opacity,
        contactShadowScale: tuning.scale,
        contactShadowPitch: -1.2,
      });
    }
  });

  it('refuses a Combat Stage plate without reviewed grounding metadata', () => {
    expect(() => optionCEnvironmentBackground({
      assetId: 'unreviewed_stage',
      surface: 'combat-stage',
      url: '/assets/unreviewed.png',
    })).toThrow(/no explicit grounding metadata/);
  });
});
