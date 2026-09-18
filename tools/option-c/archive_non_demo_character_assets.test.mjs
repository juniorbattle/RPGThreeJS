import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const pixelRoot = resolve(root, 'public/assets/characters/pixel');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const sha256 = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

const RETIRED = [
  'alaric', 'maelor', 'sage_seraphine', 'refugee_mother', 'survivor', 'villageoise',
  'wounded_merchant',
];
const ARCHIVED = [
  'aldric', 'chroniqueur', 'eldwin', 'forest_viper', 'future_herbalist',
  'future_lion_scribe', 'future_lion_spearman', 'future_shadow_envoy', 'giant_mygale',
  'gunnar', 'lyra', 'morvan', 'mountain_ram', 'river_crab', 'seal_guardian',
  'seraphine', 'shrine_apparition', 'swamp_crocodile', 'talon', 'troll',
  'undead_champion',
];

describe('Option C final master promotion and archive pass', () => {
  it('retires the active full root while preserving the historical artwork byte-identically', async () => {
    await expect(access(resolve(pixelRoot, 'full'))).rejects.toThrow();
    const archive = (await readdir(resolve(pixelRoot, 'archive/non-demo'))).filter((name) => name.endsWith('.png')).sort();
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

    const retired = await readJson('public/assets/characters/pixel/archive/legacy-full/legacy-full-retirement-manifest.json');
    expect(retired.entries.map((entry) => entry.characterId)).toEqual(RETIRED);
    for (const entry of retired.entries) {
      expect(await sha256(resolve(root, entry.archivePath))).toBe(entry.sha256);
      expect(entry.reason).toBe('CHARACTER_SYSTEM_V2_MASTER_PROMOTION');
    }
  });

  it('collapses the byte-identical Seraphine source to one active canonical identity', async () => {
    const aliases = await readJson('public/assets/characters/pixel/character-alias-map.json');
    const alias = aliases.entries.find((entry) => entry.runtimeId === 'seraphine');
    expect(alias).toMatchObject({
      aliasOf: 'sage_seraphine',
      canonicalAssetPath: '/assets/characters/pixel/masters/sage_seraphine.png',
      legacyFullPath: '/assets/characters/pixel/archive/non-demo/seraphine.png',
    });
    const retired = await readJson('public/assets/characters/pixel/archive/legacy-full/legacy-full-retirement-manifest.json');
    const seraphine = retired.entries.find((entry) => entry.characterId === 'sage_seraphine');
    expect(seraphine.archivePath).toBe('public/assets/characters/pixel/archive/non-demo/seraphine.png');
  });

  it('records the final required and optional non-combat queues with no broken references', async () => {
    const census = await readJson('public/assets/characters/pixel/non-combat-master-census.json');
    const report = await readJson('public/assets/characters/pixel/full-cleanup-report.json');
    expect(census.ACTIVE_FULL_IDENTITIES).toEqual([]);
    expect(census.FINAL_NON_COMBAT_GENERATION_QUEUE).toEqual([]);
    expect(census.OPTIONAL_GENERIC_REGISTERED).toEqual(['villageois', 'refugee']);
    expect(report).toMatchObject({
      FULL_CLEANUP: 'PASS',
      ACTIVE_DEMO_NON_COMBAT: 0,
      OPTIONAL_GENERIC_REGISTERED: 2,
      GENERIC_VILLAGE_MILITIA_REGISTERED: 3,
      ARCHIVED_NON_DEMO: 20,
      SERAPHINE_DUPLICATE_RESOLVED: true,
      BROKEN_CHARACTER_REFERENCES: 0,
    });
  });

  it('retains one hundred eight combat poses while promoting thirty-seven authoritative masters', async () => {
    const manifest = await readJson('public/assets/characters/pixel/character-system-v2-manifest.json');
    expect(manifest.units).toHaveLength(37);
    const assets = manifest.units.flatMap((unit) => [unit.master, ...Object.values(unit.poses)]);
    expect(assets).toHaveLength(145);
    for (const asset of assets) {
      expect(await sha256(resolve(root, 'public', asset.src.replace(/^\//u, ''))), asset.src)
        .toBe(asset.sha256);
    }
  });
});
