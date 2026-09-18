import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMBAT_POSES,
  combatPoseAssetScale,
  listCombatPoseSets,
  resolveCombatPoseAsset,
  resolveCombatPoseLayout,
  resolveCombatPoseSet,
  resolveCombatPoseUnitId,
  resolvePoseAssetFromSet,
  resolveStrategicUnitVisual,
  type CombatPoseAsset,
  type CombatPoseSet,
} from './CombatPoseRegistry';

const ASSET_ROOT = join(process.cwd(), 'public', 'assets', 'characters', 'pixel', 'combat');

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

function visibleHeight(set: CombatPoseSet): number {
  const pose = set.poses.prepare;
  return (pose.alphaBoundsPx.bottom - pose.alphaBoundsPx.top) * set.worldUnitsPerPixel;
}

describe('CombatPoseRegistry production V2', () => {
  it('covers the promoted 27-set / 108-PNG inventory exactly once', () => {
    const sets = listCombatPoseSets();
    const registrySources = sets.flatMap((set) => COMBAT_POSES.map((pose) => set.poses[pose].src));
    const diskSources = listPngs(ASSET_ROOT).map((path) => path
      .slice(join(process.cwd(), 'public').length)
      .replaceAll('\\', '/'));

    expect(sets).toHaveLength(27);
    expect(registrySources).toHaveLength(108);
    expect(new Set(registrySources).size).toBe(108);
    expect(diskSources).toHaveLength(108);
    expect([...registrySources].sort()).toEqual([...diskSources].sort());
    expect(registrySources.every((src) => src.startsWith('/assets/characters/pixel/combat/'))).toBe(true);
    expect(registrySources.some((src) => src.includes('/combat-stage/poses/'))).toBe(false);
  });

  it('records production dimensions that match every PNG IHDR', () => {
    for (const set of listCombatPoseSets()) {
      for (const pose of COMBAT_POSES) {
        const asset = set.poses[pose];
        const path = join(process.cwd(), 'public', asset.src);
        expect(existsSync(path), asset.src).toBe(true);
        expect(pngSize(path), asset.src).toEqual(asset.sourceSizePx);
        expect(asset.scaleCorrection).toBe(1);
      }
    }
  });

  it('resolves production IDs and existing runtime aliases', () => {
    expect(resolveCombatPoseUnitId('alistair')).toBe('alistair');
    expect(resolveCombatPoseUnitId('warrior')).toBe('alistair');
    expect(resolveCombatPoseUnitId('marian')).toBe('white_mage');
    expect(resolveCombatPoseUnitId('/assets/characters/pixel/masters/alistair.png')).toBe('alistair');
    expect(resolveCombatPoseUnitId('serpent_captain')).toBe('serpent_general_boss');
    expect(resolveCombatPoseSet('forest_badger')?.unitId).toBe('forest_badger');
  });

  it('maps the approved source semantics to prepare, dash, attack and cast', () => {
    for (const set of listCombatPoseSets()) {
      expect(set.poses.prepare.src, set.unitId).toBe(`${set.sourceFolder}/prepare.png`);
      expect(set.poses.dash.src, set.unitId).toBe(`${set.sourceFolder}/dash.png`);
      expect(set.poses.attack.src, set.unitId).toBe(`${set.sourceFolder}/attack.png`);
      expect(set.poses.cast.src, set.unitId).toBe(`${set.sourceFolder}/cast.png`);
    }
  });

  it('uses PREPARE as the explicit strategic unit-map visual', () => {
    const strategic = resolveStrategicUnitVisual('warrior')!;
    const set = resolveCombatPoseSet('alistair')!;
    expect(strategic.unitId).toBe('alistair');
    expect(strategic.src).toBe(set.poses.prepare.src);
    expect(strategic.sourceSizePx).toEqual(set.poses.prepare.sourceSizePx);
    expect(strategic.anchor).toEqual(set.poses.prepare.anchor);
    expect(strategic.worldUnitsPerPixel).toBe(set.worldUnitsPerPixel);
    expect(strategic.scaleCorrection).toBe(1);
    for (const unitId of ['lancer', 'village_militia_spearman', 'village_militia_slinger']) {
      expect(resolveStrategicUnitVisual(unitId)?.src).toBe(`/assets/characters/pixel/combat/${unitId}/prepare.png`);
    }
  });

  it('returns undefined for unknown units so non-migrated sprites retain their fallback', () => {
    expect(resolveCombatPoseUnitId('unknown_unit')).toBeUndefined();
    expect(resolveCombatPoseSet('unknown_unit')).toBeUndefined();
    expect(resolveCombatPoseAsset('unknown_unit', 'attack')).toBeUndefined();
    expect(resolveStrategicUnitVisual('unknown_unit')).toBeUndefined();
    expect(resolveCombatPoseUnitId('village_militia_brute')).toBeUndefined();
    expect(resolveCombatPoseSet('village_militia_brute')).toBeUndefined();
  });

  it('resolves all four promoted village militia poses and keeps brute Master-only', () => {
    for (const unitId of ['village_militia_spearman', 'village_militia_slinger']) {
      expect(resolveCombatPoseUnitId(unitId)).toBe(unitId);
      for (const pose of COMBAT_POSES) {
        expect(resolveCombatPoseAsset(unitId, pose)?.src).toBe(`/assets/characters/pixel/combat/${unitId}/${pose}.png`);
      }
    }
    expect(resolveCombatPoseAsset('village_militia_brute', 'prepare')).toBeUndefined();
  });

  it('falls back a missing requested semantic pose to PREPARE', () => {
    const prepare = resolveCombatPoseAsset('alistair', 'prepare')!;
    const partial = { poses: { prepare } } as unknown as Pick<CombatPoseSet, 'poses'>;
    expect(resolvePoseAssetFromSet(partial, 'cast')).toBe(prepare);
  });

  it('maps source-pixel anchors to the unit-root origin with explicit plane-centre math', () => {
    const asset: CombatPoseAsset = {
      src: '/test.png',
      sourceSizePx: { width: 200, height: 100 },
      alphaBoundsPx: { left: 0, top: 0, right: 200, bottom: 100 },
      anchor: { x: 40, y: 90 },
      scaleCorrection: 1,
      characterBoundFx: false,
    };
    const set = {
      unitId: 'test',
      sourceFolder: 'test',
      scaleFamily: 'STANDARD_HUMANOID',
      worldUnitsPerPixel: 0.01,
      poses: {},
    } as CombatPoseSet;
    expect(resolveCombatPoseLayout(set, asset)).toEqual({
      width: 2,
      height: 1,
      offsetX: 0.6,
      offsetY: 0.4,
    });
  });

  it('uses one authoritative physical pixel scale across strategic and Stage', () => {
    const scales = new Set(listCombatPoseSets().map((set) => set.worldUnitsPerPixel));
    expect([...scales]).toEqual([0.00625]);
    for (const set of listCombatPoseSets()) {
      for (const pose of COMBAT_POSES) {
        expect(combatPoseAssetScale(set, set.poses[pose])).toBe(0.00625);
      }
    }
  });

  it('preserves normalized small < humanoid < elite/boss hierarchy outside the approved Lancer scale exception', () => {
    const sets = listCombatPoseSets();
    const heights = (family: CombatPoseSet['scaleFamily']) => sets
      .filter((set) => set.scaleFamily === family)
      .filter((set) => set.unitId !== 'lancer')
      .map(visibleHeight);
    const small = heights('SMALL_CREATURE');
    const humanoid = heights('STANDARD_HUMANOID');
    const large = heights('LARGE_ELITE_BOSS');
    expect(Math.max(...small)).toBeLessThan(Math.min(...humanoid));
    expect(Math.max(...humanoid)).toBeLessThan(Math.min(...large));
    expect(visibleHeight(resolveCombatPoseSet('lancer')!)).toBeCloseTo(2.5375);
  });

  it('supports all approved variable canvases without changing pixel scale', () => {
    const dimensions = new Set(listCombatPoseSets().flatMap((set) => COMBAT_POSES.map((pose) => {
      const size = set.poses[pose].sourceSizePx;
      return `${size.width}x${size.height}`;
    })));
    expect(dimensions).toEqual(new Set(['512x512', '640x512', '512x640', '640x640']));
  });

  it('keeps all authored anchors finite and inside source image bounds', () => {
    for (const set of listCombatPoseSets()) {
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
