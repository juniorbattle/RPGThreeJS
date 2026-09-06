import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assets } from '../../render/assetManifest';
import {
  COMBAT_POSES,
  COMBAT_POSE_SOURCE_FOLDER_TO_UNIT_ID,
  combatPoseAssetScale,
  listCombatPoseSets,
  resolveCombatPoseAsset,
  resolveCombatPoseLayout,
  resolveCombatPoseSet,
  resolveCombatPoseUnitId,
  resolvePoseAssetFromSet,
  type CombatPoseAsset,
  type CombatPoseSet,
} from './CombatPoseRegistry';

const ASSET_ROOT = join(process.cwd(), 'public', 'assets', 'combat-stage', 'poses');

const PROFILE_BY_UNIT = {
  warrior: 'alistair',
  white_mage: 'marian',
  dark_mage: 'elara',
  archer: 'kestrel',
  rogue: 'cedric',
  lancer: 'lancer',
  forest_badger: 'forest_badger',
  wild_boar: 'wild_boar',
  cave_rat: 'cave_rat',
  forest_spider: 'forest_spider',
  goblin: 'goblin',
  marsh_toad: 'marsh_toad',
  serpent_raider: 'serpent_raider',
  serpent_brute: 'serpent_brute',
  serpent_oracle: 'serpent_oracle',
  skeleton: 'skeleton',
  venom_serpent: 'venom_serpent',
  wolf: 'wolf',
  young_dragon_elite: 'young_dragon_elite',
  lion_champion: 'lion_champion',
  forest_troll_elite: 'forest_troll_elite',
  serpent_general_boss: 'serpent_general_boss',
  serpent_duelist_elite: 'serpent_duelist_elite',
  serpent_elite_brute: 'serpent_elite_brute',
} as const;

function listPngs(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...listPngs(path));
    else if (entry.name.endsWith('.png')) files.push(path);
  }
  return files;
}

function pngSize(path: string): { width: number; height: number } {
  const data = readFileSync(path);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

describe('CombatPoseRegistry', () => {
  it('covers the committed 25-set / 100-PNG inventory exactly once', () => {
    const sets = listCombatPoseSets();
    const registrySources = sets.flatMap((set) => COMBAT_POSES.map((pose) => set.poses[pose].src));
    const diskSources = listPngs(ASSET_ROOT).map((path) => path
      .slice(join(process.cwd(), 'public').length)
      .replaceAll('\\', '/'));

    expect(sets).toHaveLength(25);
    expect(registrySources).toHaveLength(100);
    expect(new Set(registrySources).size).toBe(100);
    expect(diskSources).toHaveLength(100);
    expect([...registrySources].sort()).toEqual([...diskSources].sort());
  });

  it('records source dimensions that match every PNG IHDR', () => {
    for (const set of listCombatPoseSets()) {
      for (const pose of COMBAT_POSES) {
        const asset = set.poses[pose];
        const path = join(process.cwd(), 'public', asset.src);
        expect(existsSync(path), asset.src).toBe(true);
        expect(pngSize(path), asset.src).toEqual(asset.sourceSizePx);
      }
    }
  });

  it('uses the complete explicit source-folder to canonical-ID mapping', () => {
    expect(COMBAT_POSE_SOURCE_FOLDER_TO_UNIT_ID).toEqual({
      'heroes/warrior_sheet_4x1': 'warrior',
      'heroes/white_mage_sheet_4x1': 'white_mage',
      'heroes/dark_mage_sheet_4x1': 'dark_mage',
      'heroes/archer_sheet_4x1': 'archer',
      'heroes/rogue_sheet_4x1': 'rogue',
      'heroes/lancer_sheet_4x1': 'lancer',
      'enemies/enemy_badger_4x1_2560x768': 'forest_badger',
      'enemies/enemy_bat_4x1_2560x768': 'cave_bat',
      'enemies/enemy_boar_4x1_2560x768': 'wild_boar',
      'enemies/enemy_cave_rat_4x1_2560x768': 'cave_rat',
      'enemies/enemy_forest_spider_4x1_2560x768': 'forest_spider',
      'enemies/enemy_goblin_4x1_2560x768': 'goblin',
      'enemies/enemy_marsh_toad_4x1_2560x768': 'marsh_toad',
      'enemies/enemy_masked_assassin_4x1_2560x768': 'serpent_raider',
      'enemies/enemy_serpent_mace_knight_4x1_2560x768': 'serpent_brute',
      'enemies/enemy_serpent_mage_4x1_2560x768': 'serpent_oracle',
      'enemies/enemy_skeleton_4x1_2560x768': 'skeleton',
      'enemies/enemy_venom_serpent_4x1_2560x768': 'venom_serpent',
      'enemies/enemy_wolf_4x1_2560x768': 'wolf',
      'bosses/enemy_dragon_elite_4x1_2560x768': 'young_dragon_elite',
      'bosses/enemy_lion_king_boss_4x1_2560x768': 'lion_champion',
      'bosses/enemy_ogre_elite_4x1_2560x768': 'forest_troll_elite',
      'bosses/enemy_serpent_champion_4x1_2560x768': 'serpent_general_boss',
      'bosses/enemy_serpent_duelist_elite_4x1_2560x768': 'serpent_duelist_elite',
      'bosses/enemy_serpent_halberd_elite_4x1_2560x768': 'serpent_elite_brute',
    });
  });

  it('resolves canonical IDs and existing runtime identity aliases', () => {
    expect(resolveCombatPoseUnitId('warrior')).toBe('warrior');
    expect(resolveCombatPoseUnitId('alistair')).toBe('warrior');
    expect(resolveCombatPoseUnitId('/assets/characters/pixel/full/alistair.png')).toBe('warrior');
    expect(resolveCombatPoseUnitId('/assets/characters/pixel/full/cave_rat.png')).toBe('cave_rat');
    expect(resolveCombatPoseUnitId('serpent_captain')).toBe('serpent_general_boss');
    expect(resolveCombatPoseSet('forest_badger')?.unitId).toBe('forest_badger');
    expect(resolveCombatPoseSet('/assets/characters/pixel/full/forest_badger.png')?.unitId).toBe('forest_badger');
  });

  it('maps semantic poses independently of source slot numbers', () => {
    const warrior = resolveCombatPoseSet('warrior')!;
    expect(warrior.poses.prepare.src).toMatch(/_04_pose4\.png$/);
    expect(warrior.poses.dash.src).toMatch(/_02_pose2\.png$/);
    expect(warrior.poses.attack.src).toMatch(/_01_pose1\.png$/);
    expect(warrior.poses.cast.src).toMatch(/_03_pose3\.png$/);

    const caveRat = resolveCombatPoseSet('cave_rat')!;
    expect(caveRat.poses.prepare.src).toMatch(/_01_pose1\.png$/);
    expect(caveRat.poses.dash.src).toMatch(/_02_pose2\.png$/);
    expect(caveRat.poses.attack.src).toMatch(/_03_pose3\.png$/);
    expect(caveRat.poses.cast.src).toMatch(/_04_pose4\.png$/);
  });

  it('applies the validated semantic convention to every hero, enemy and boss set', () => {
    for (const set of listCombatPoseSets()) {
      const hero = set.sourceFolder.startsWith('heroes/');
      expect(set.poses.prepare.src, set.unitId).toMatch(new RegExp(hero ? '_04_pose4\\.png$' : '_01_pose1\\.png$'));
      expect(set.poses.dash.src, set.unitId).toMatch(/_02_pose2\.png$/);
      expect(set.poses.attack.src, set.unitId).toMatch(new RegExp(hero ? '_01_pose1\\.png$' : '_03_pose3\\.png$'));
      expect(set.poses.cast.src, set.unitId).toMatch(new RegExp(hero ? '_03_pose3\\.png$' : '_04_pose4\\.png$'));
    }
  });

  it('returns undefined for an unknown unit so runtime can preserve its canonical sprite', () => {
    expect(resolveCombatPoseUnitId('unknown_unit')).toBeUndefined();
    expect(resolveCombatPoseSet('unknown_unit')).toBeUndefined();
    expect(resolveCombatPoseAsset('unknown_unit', 'attack')).toBeUndefined();
  });

  it('falls back a missing requested semantic pose to PREPARE', () => {
    const prepare = resolveCombatPoseAsset('warrior', 'prepare')!;
    const partial = { poses: { prepare } } as unknown as Pick<CombatPoseSet, 'poses'>;
    expect(resolvePoseAssetFromSet(partial, 'cast')).toBe(prepare);
  });

  it('maps source-pixel anchors to the unit-root origin with explicit plane-centre math', () => {
    const asset: CombatPoseAsset = {
      src: '/test.png',
      sourceSizePx: { width: 200, height: 100 },
      anchor: { x: 40, y: 90 },
    };
    const set = { unitId: 'test', sourceFolder: 'test', worldUnitsPerPixel: 0.01, poses: {} } as CombatPoseSet;
    expect(resolveCombatPoseLayout(set, asset)).toEqual({
      width: 2,
      height: 1,
      offsetX: 0.6,
      offsetY: 0.4,
    });
  });

  it('calibrates each common pixel scale from its authoritative combatHeight and PREPARE source', () => {
    for (const set of listCombatPoseSets()) {
      if (set.unitId === 'cave_bat') {
        expect(set.poses.prepare.sourceSizePx.height * set.worldUnitsPerPixel).toBeCloseTo(1.4, 4);
        continue;
      }
      const profileId = PROFILE_BY_UNIT[set.unitId as keyof typeof PROFILE_BY_UNIT];
      expect(profileId, set.unitId).toBeDefined();
      const profile = assets.characterProfiles[profileId!];
      expect(set.poses.prepare.sourceSizePx.height * set.worldUnitsPerPixel, set.unitId)
        .toBeCloseTo(profile.combatHeight, 4);
    }
  });

  it('uses one stable worldUnitsPerPixel despite different pose dimensions', () => {
    const set = resolveCombatPoseSet('warrior')!;
    const prepare = set.poses.prepare;
    const dash = set.poses.dash;
    const prepareLayout = resolveCombatPoseLayout(set, prepare);
    const dashLayout = resolveCombatPoseLayout(set, dash);

    expect(prepare.sourceSizePx).not.toEqual(dash.sourceSizePx);
    expect(combatPoseAssetScale(set, prepare)).toBe(set.worldUnitsPerPixel);
    expect(combatPoseAssetScale(set, dash)).toBe(set.worldUnitsPerPixel);
    expect(prepareLayout.width / prepare.sourceSizePx.width).toBeCloseTo(set.worldUnitsPerPixel, 10);
    expect(dashLayout.height / dash.sourceSizePx.height).toBeCloseTo(set.worldUnitsPerPixel, 10);
  });

  it('keeps all authored anchors finite and inside their source image bounds', () => {
    for (const set of listCombatPoseSets()) {
      expect(set.worldUnitsPerPixel, set.unitId).toBeGreaterThan(0);
      for (const pose of COMBAT_POSES) {
        const { anchor, sourceSizePx } = set.poses[pose];
        expect(Number.isFinite(anchor.x), `${set.unitId}:${pose}:x`).toBe(true);
        expect(Number.isFinite(anchor.y), `${set.unitId}:${pose}:y`).toBe(true);
        expect(anchor.x, `${set.unitId}:${pose}:x`).toBeGreaterThanOrEqual(0);
        expect(anchor.x, `${set.unitId}:${pose}:x`).toBeLessThanOrEqual(sourceSizePx.width);
        expect(anchor.y, `${set.unitId}:${pose}:y`).toBeGreaterThanOrEqual(0);
        expect(anchor.y, `${set.unitId}:${pose}:y`).toBeLessThanOrEqual(sourceSizePx.height);
      }
    }
  });
});
