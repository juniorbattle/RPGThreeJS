// @vitest-environment happy-dom
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { CombatArena } from './CombatArena';
import { ARENA_GROUND_Y } from './arenaProps';
import { ARENA_PLATFORM, ARENA_THEMES } from './arenaThemes';
import { coplanarOverlaps } from './arenaZFight';

// where the combat camera stands: the tactical view at both ends of its yaw, and the low action shots
const COMBAT_EYES = [[0, 8.55, 16.2], [3.85, 8.55, 15.7], [-3.85, 8.55, 15.7], [6, 3, 10], [-6, 3, 10]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

async function buildArena(sceneId: string) {
  const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18 });
  await arena.build();
  arena.root.updateMatrixWorld(true);
  return arena;
}

describe('CombatArena in reduced graphics', () => {
  it('builds the Bear arenas without their band, clutter, horizon and atmosphere', async () => {
    for (const sceneId of ['bear_mountain_pass', 'bear_mine_galleries', 'bear_hall_terrace']) {
      const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18, reducedGraphics: true });
      await arena.build();
      expect(arena.theme.id).toBe(sceneId);
      expect(arena.describe().atmosphere).toBe(0);
      expect(arena.describe().farPlate, sceneId).toBe(true);
      arena.dispose();
    }
  }, 60000);
});

describe('CombatArena generation', () => {
  for (const sceneId of Object.keys(ARENA_THEMES)) {
    describe(sceneId, () => {
      let arena: CombatArena;
      beforeAll(async () => { arena = await buildArena(sceneId); }, 60000);

      it('stands every prop on the ground, clear of the platform', () => {
        const props = arena.root.children.filter((o) => o.name.startsWith('arena-prop:') && !/fire|smoke/.test(o.name));
        expect(props.length).toBeGreaterThan(20);
        for (const prop of props) {
          // the prop's root sits on the ground (sunk at most a few centimetres)
          expect(prop.position.y, prop.name).toBeLessThanOrEqual(ARENA_GROUND_Y);
          expect(prop.position.y, prop.name).toBeGreaterThan(ARENA_GROUND_Y - 0.05);
          const insideX = Math.abs(prop.position.x) < ARENA_PLATFORM.halfWidth;
          const insideZ = Math.abs(prop.position.z) < ARENA_PLATFORM.halfDepth;
          expect(insideX && insideZ, `${prop.name} on the platform`).toBe(false);
        }
      });

      it('grounds its decor and keeps the draw budget', () => {
        const names = arena.root.children.map((o) => o.name);
        expect(names).toContain('arena-contact-shadows');
        expect(names).toContain('arena-weeds');
        let meshes = 0;
        arena.root.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.visible) meshes++; });
        // static decor is merged per material: a few hundred draws at most, shadow pass apart
        expect(meshes).toBeLessThan(420);
        expect(arena.describe().mergedMeshes).toBeGreaterThan(50);
      });

      it('leaves no two faces fighting for the same pixels', () => {
        expect(coplanarOverlaps(arena.root, COMBAT_EYES)).toEqual([]);
      });

      it('hangs every banner in front of its pole', () => {
        const cloths: THREE.Object3D[] = [];
        arena.root.traverse((object) => { if (object.name === 'arena-banner-cloth') cloths.push(object); });
        expect(cloths.length).toBeGreaterThan(0);
        for (const cloth of cloths) expect(cloth.position.z).toBeGreaterThan(0.08);
      });

      it('gives every pixel-art decor material its sharp texels', () => {
        const seen = new Set<THREE.Material & { map: THREE.Texture }>();
        arena.root.traverse((object) => {
          const material = (object as THREE.Mesh).material;
          for (const entry of [material ?? []].flat() as Array<THREE.Material & { map: THREE.Texture }>) if (entry.map?.userData.pixelArt) seen.add(entry);
        });
        expect(seen.size).toBeGreaterThan(5);
        for (const material of seen) {
          expect(material.userData.sharpTexels, material.name).toBe(true);
          expect(material.map.magFilter).toBe(THREE.LinearFilter);
        }
      });
    });
  }
});
