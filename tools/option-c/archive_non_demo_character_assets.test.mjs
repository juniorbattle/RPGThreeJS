import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const pixelRoot = resolve(root, 'public/assets/characters/pixel');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sha256 = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

const ACTIVE = [
  'alaric', 'maelor', 'refugee_mother', 'sage_seraphine', 'survivor', 'villageoise',
  'wounded_merchant',
];
const ARCHIVED = [
  'aldric', 'chroniqueur', 'eldwin', 'forest_viper', 'future_herbalist',
  'future_lion_scribe', 'future_lion_spearman', 'future_shadow_envoy', 'giant_mygale',
  'gunnar', 'lyra', 'morvan', 'mountain_ram', 'river_crab', 'seal_guardian',
  'seraphine', 'shrine_apparition', 'swamp_crocodile', 'talon', 'troll',
  'undead_champion',
];

describe('Option C non-combat archive pass', () => {
  it('keeps exactly seven active full PNGs and twenty-one byte-preserved archive PNGs', async () => {
    const full = (await readdir(resolve(pixelRoot, 'full'))).filter((name) => name.endsWith('.png')).sort();
    const archive = (await readdir(resolve(pixelRoot, 'archive/non-demo'))).filter((name) => name.endsWith('.png')).sort();
    expect(full).toEqual(ACTIVE.map((id) => `${id}.png`).sort());
    expect(archive).toEqual(ARCHIVED.map((id) => `${id}.png`).sort());

    const manifest = await readJson('public/assets/characters/pixel/archive/non-demo/archive-manifest.json');
    expect(manifest.counts).toEqual({
      archivedNonDemoIdentities: 20,
      seraphineAliasSourcesArchived: 1,
      archivedFiles: 21,
    });
    for (const entry of manifest.entries) {
      expect(await sha256(resolve(root, entry.archivePath))).toBe(entry.sha256);
      expect(entry.originalFullReferencesRemaining).toBe(0);
    }
  });

  it('collapses the byte-identical Seraphine source to one active canonical identity', async () => {
    const aliases = await readJson('public/assets/characters/pixel/character-alias-map.json');
    const alias = aliases.entries.find((entry) => entry.runtimeId === 'seraphine');
    expect(alias).toMatchObject({
      aliasOf: 'sage_seraphine',
      canonicalAssetPath: '/assets/characters/pixel/full/sage_seraphine.png',
      legacyFullPath: '/assets/characters/pixel/archive/non-demo/seraphine.png',
    });
    expect(await sha256(resolve(pixelRoot, 'full/sage_seraphine.png')))
      .toBe(await sha256(resolve(pixelRoot, 'archive/non-demo/seraphine.png')));
  });

  it('records the final required and optional non-combat queues with no broken references', async () => {
    const census = await readJson('public/assets/characters/pixel/non-combat-master-census.json');
    const report = await readJson('public/assets/characters/pixel/full-cleanup-report.json');
    expect(census.FINAL_NON_COMBAT_GENERATION_QUEUE).toEqual([
      'alaric', 'maelor', 'sage_seraphine', 'refugee_mother', 'survivor', 'villageoise',
      'wounded_merchant',
    ]);
    expect(census.OPTIONAL_GENERIC_QUEUE).toEqual(['villageois', 'refugee']);
    expect(report).toMatchObject({
      FULL_CLEANUP: 'PASS',
      ACTIVE_DEMO_NON_COMBAT: 7,
      OPTIONAL_GENERIC_NON_COMBAT: 2,
      ARCHIVED_NON_DEMO: 20,
      SERAPHINE_DUPLICATE_RESOLVED: true,
      BROKEN_CHARACTER_REFERENCES: 0,
    });
  });

  it('retains all twenty-five masters and one hundred combat poses at manifest hashes', async () => {
    const manifest = await readJson('public/assets/characters/pixel/character-system-v2-manifest.json');
    expect(manifest.units).toHaveLength(25);
    const assets = manifest.units.flatMap((unit) => [unit.master, ...Object.values(unit.poses)]);
    expect(assets).toHaveLength(125);
    for (const asset of assets) {
      expect(await sha256(resolve(root, 'public', asset.src.replace(/^\//u, ''))), asset.src)
        .toBe(asset.sha256);
    }
  });
});
