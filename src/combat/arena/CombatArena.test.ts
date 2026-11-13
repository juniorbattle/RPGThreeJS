// @vitest-environment happy-dom
import * as THREE from 'three';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CombatArena } from './CombatArena';
import { ARENA_GROUND_Y, type PropContext } from './arenaProps';
import { ARENA_PLATFORM, ARENA_THEMES, BEAR_ARENA_IDS, DRAGON_ARENA_IDS, SCORPION_ARENA_IDS } from './arenaThemes';
import { coplanarOverlaps } from './arenaZFight';
import { PixelCanvas } from './pixelArt';

/** The validated staging shows no banner in the Phoenix's ruins and sanctuary, nor on the wild dune crest at dusk. */
const BANNERLESS = new Set(['scorpion_phoenix_ruins', 'scorpion_ash_sanctuary', 'scorpion_dune_crest']);

// where the combat camera stands: the tactical view at both ends of its yaw, and the low action shots
const COMBAT_EYES = [[0, 8.55, 16.2], [3.85, 8.55, 15.7], [-3.85, 8.55, 15.7], [6, 3, 10], [-6, 3, 10]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

async function buildArena(sceneId: string) {
  const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18 });
  await arena.build();
  arena.root.updateMatrixWorld(true);
  return arena;
}

describe('CombatArena in reduced graphics', () => {
  it('builds the Bear, Dragon and Scorpion arenas without their band, clutter, horizon and atmosphere', async () => {
    for (const sceneId of [...BEAR_ARENA_IDS, ...DRAGON_ARENA_IDS, ...SCORPION_ARENA_IDS]) {
      const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18, reducedGraphics: true });
      await arena.build();
      expect(arena.theme.id).toBe(sceneId);
      expect(arena.describe().atmosphere).toBe(0);
      expect(arena.describe().farPlate, sceneId).toBe(true);
      expect(arena.root.children.some((o) => /^arena-(cloud-bank|ridge-line|tree-line|dune-line)$/.test(o.name)), sceneId).toBe(false);
      arena.dispose();
    }
  }, 180000);

  it('closes the Scorpion’s open arenas on dune crests, its sanctuary on its rock, and its nave and court on their walls', async () => {
    const horizons: Array<[string, string | null]> = [
      ['scorpion_dune_track', 'arena-dune-line'], ['scorpion_dune_crest', 'arena-dune-line'], ['scorpion_phoenix_ruins', 'arena-dune-line'],
      ['scorpion_ash_sanctuary', 'arena-ridge-line'], ['scorpion_phoenix_temple', null], ['scorpion_records_court', null],
    ];
    for (const [sceneId, horizon] of horizons) {
      const arena = await buildArena(sceneId);
      const lines = arena.root.children.filter((o) => /^arena-(cloud-bank|ridge-line|tree-line|dune-line)$/.test(o.name));
      expect(lines.map((o) => o.name), sceneId).toEqual(horizon ? [horizon, horizon] : []);
      arena.dispose();
    }
  }, 180000);

  it('closes the Dragon’s peaks on the sea of clouds and the Wolf’s cave on its rock', async () => {
    const horizons = [['dragon_peak_trail', 'arena-cloud-bank'], ['dragon_snowy_summit', 'arena-cloud-bank'], ['dragon_hall_esplanade', 'arena-cloud-bank'], ['dragon_wolf_cave', 'arena-ridge-line']] as const;
    for (const [sceneId, horizon] of horizons) {
      const arena = await buildArena(sceneId);
      expect(arena.root.children.filter((o) => o.name === horizon).length, sceneId).toBe(2);
      arena.dispose();
    }
  }, 120000);
});

describe('the Scorpion’s arenas as built', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('shows the Phoenix’s signs only in its places and the Scorpion’s only in its own, and never paints a purple texel', async () => {
    const phoenixPlaces = new Set(['scorpion_phoenix_ruins', 'scorpion_phoenix_temple', 'scorpion_ash_sanctuary']);
    const scorpionPlaces = new Set(['scorpion_dune_track', 'scorpion_records_court']);
    for (const sceneId of SCORPION_ARENA_IDS) {
      const painted: PixelCanvas[] = [];
      const toTexture = PixelCanvas.prototype.toTexture;
      const spy = vi.spyOn(PixelCanvas.prototype, 'toTexture').mockImplementation(function (this: PixelCanvas, options) {
        painted.push(this);
        return toTexture.call(this, options);
      });
      const arena = await buildArena(sceneId);
      spy.mockRestore();
      const keys = [...(arena as unknown as { ctx: PropContext }).ctx.textures.keys()];
      const phoenixSigns = keys.filter((key) => /phoenix-relief|-phoenix$|ward-circle/.test(key));
      const scorpionSigns = keys.filter((key) => /scorpion-relief|-scorpion$/.test(key));
      if (phoenixPlaces.has(sceneId)) {
        expect(phoenixSigns.length, sceneId).toBeGreaterThan(0);
        expect(scorpionSigns, sceneId).toEqual([]);
      } else if (scorpionPlaces.has(sceneId)) {
        expect(scorpionSigns.length, sceneId).toBeGreaterThan(0);
        expect(phoenixSigns, sceneId).toEqual([]);
      } else {
        expect([...phoenixSigns, ...scorpionSigns], sceneId).toEqual([]);
      }
      expect(painted.length, sceneId).toBeGreaterThan(10);
      let purple = 0;
      for (const pc of painted) for (let i = 0; i < pc.data.length; i += 4) {
        const r = pc.data[i]!, g = pc.data[i + 1]!, b = pc.data[i + 2]!, a = pc.data[i + 3]!;
        if (a && r - g > 12 && b - g > 12) purple++;
      }
      expect(purple, sceneId).toBe(0);
      arena.dispose();
    }
  }, 180000);
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
        expect(cloths.length > 0, sceneId).toBe(!BANNERLESS.has(sceneId));
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
