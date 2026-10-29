// @vitest-environment happy-dom
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { CombatArena } from './CombatArena';
import { ARENA_GROUND_Y } from './arenaProps';
import { ARENA_PLATFORM, ARENA_THEMES } from './arenaThemes';

async function buildArena(sceneId: string) {
  const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18 });
  await arena.build();
  arena.root.updateMatrixWorld(true);
  return arena;
}

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
    });
  }
});
