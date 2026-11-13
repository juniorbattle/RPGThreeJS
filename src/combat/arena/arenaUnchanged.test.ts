// @vitest-environment happy-dom
/**
 * The Lion's, the Bear's, the Dragon's and the Scorpion's arenas stay as the operator validated them while other
 * plateaux get theirs: each one, in full and in reduced graphics, is digested (theme data, scene graph, transforms,
 * geometry, materials and every pixel of every texture painted in code) and compared with the digest recorded when the
 * next plateau's arenas were added (the Scorpion's on 2026-11-12, the final act's on 2026-11-13). A deliberate change to
 * one of these arenas updates its line: run this file with `ARENA_DIGEST_PRINT=1` to print the new digests.
 */
import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CombatArena } from './CombatArena';
import { ARENA_THEMES, type ArenaSceneId } from './arenaThemes';
import { PixelCanvas } from './pixelArt';

const RECORDED: Readonly<Record<string, string>> = {
  forest_route: 'af0af7a59b106f7b',
  'forest_route:reduced': '1b9207c1b502b8f5',
  bois_clair_burning: '89f5abac4fe1e73c',
  'bois_clair_burning:reduced': '48e44a92fa62ab0a',
  lion_sanctum: 'a569f0208319ceae',
  'lion_sanctum:reduced': '6efd0ac709b98859',
  bear_mountain_pass: '09557d2595b91da1',
  'bear_mountain_pass:reduced': '4f3f5305aa1f3659',
  bear_mine_galleries: '64fbfbe31cdc927f',
  'bear_mine_galleries:reduced': '6b7f97d514744e6b',
  bear_hall_terrace: '41aa6fce5edebd2c',
  'bear_hall_terrace:reduced': '6e27d0f5342e43f7',
  dragon_peak_trail: '8f44b5db3ec3218f',
  'dragon_peak_trail:reduced': 'cfb191b2fa4fb7be',
  dragon_snowy_summit: '85f2006723d8d9c1',
  'dragon_snowy_summit:reduced': 'e5b7083181a801c5',
  dragon_hall_esplanade: '0118183df466ea51',
  'dragon_hall_esplanade:reduced': 'b46a3cd8ef8dc74e',
  dragon_wolf_cave: 'f8a56d5b211ba9a3',
  'dragon_wolf_cave:reduced': 'a87ff02ac20093d6',
  // recorded on `dev` at `c9f67e9c`, before the final act's arenas were added (2026-11-13)
  scorpion_dune_track: '8228bf6f85ea42f9',
  'scorpion_dune_track:reduced': '6683817271cd7ef4',
  scorpion_dune_crest: '11726987126bbd6d',
  'scorpion_dune_crest:reduced': '8842c2a2a071254c',
  scorpion_phoenix_ruins: '09432520c3f0f73c',
  'scorpion_phoenix_ruins:reduced': '5a86cc1439c5978a',
  scorpion_phoenix_temple: '31a02b303d455480',
  'scorpion_phoenix_temple:reduced': '69fb026c811f05fc',
  scorpion_ash_sanctuary: '9e56e13d8529705f',
  'scorpion_ash_sanctuary:reduced': 'fb6630f8d78180dc',
  scorpion_records_court: '62118126fb398ff6',
  'scorpion_records_court:reduced': 'fb141d93deab0b81',
};

function fnv(text: string): string {
  let a = 0x811c9dc5, b = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = (Math.imul(b, 33) + c) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
const numbers = (array: ArrayLike<number>) => fnv(Array.from(array, (v) => Math.round(v * 1e4)).join(','));
const f = (v: number) => Math.round(v * 1e4);

function texture(t: THREE.Texture | null | undefined): string {
  if (!t) return '-';
  return `${t.userData.digest ?? 'file'}|${t.wrapS},${t.wrapT}|${f(t.repeat.x)},${f(t.repeat.y)}|${t.magFilter},${t.minFilter}`;
}

function material(m: THREE.Material): string {
  const any = m as unknown as Record<string, unknown>;
  const parts: unknown[] = [m.type, m.transparent, f(m.opacity), m.side, m.depthWrite, m.blending, f(m.alphaTest), m.polygonOffset, m.polygonOffsetFactor, m.toneMapped,
    m.vertexColors, JSON.stringify(m.userData)];
  for (const key of ['color', 'emissive']) if (any[key] instanceof THREE.Color) parts.push((any[key] as THREE.Color).getHexString());
  for (const key of ['roughness', 'metalness', 'emissiveIntensity', 'flatShading', 'fog']) if (key in any) parts.push(any[key]);
  for (const key of ['map', 'emissiveMap']) if (key in any) parts.push(texture(any[key] as THREE.Texture));
  if ((m as THREE.ShaderMaterial).isShaderMaterial) {
    const shader = m as THREE.ShaderMaterial;
    parts.push(fnv(shader.vertexShader), fnv(shader.fragmentShader),
      JSON.stringify(Object.entries(shader.uniforms).filter(([key]) => key !== 'uTime').map(([key, u]) => [key, u.value])));
  }
  return parts.join('|');
}

/**
 * The ambience each arena played when its digest was recorded. The post-demo ambiences (2026-11-13) changed what these
 * arenas play, not what they show: the digest reads each theme with the sound it had then, so every pixel is still
 * checked against the same record (the sound itself is checked in `arenaThemes.test.ts` and `music.test.ts`).
 */
const RECORDED_SOUND: Readonly<Partial<Record<ArenaSceneId, string>>> = {
  bear_mountain_pass: 'forest_route', bear_mine_galleries: 'lion_sanctum', bear_hall_terrace: 'lion_sanctum',
  dragon_peak_trail: 'forest_route', dragon_snowy_summit: 'lion_sanctum', dragon_hall_esplanade: 'forest_route', dragon_wolf_cave: 'lion_sanctum',
  scorpion_dune_track: 'forest_route', scorpion_dune_crest: 'lion_sanctum', scorpion_phoenix_ruins: 'forest_route', scorpion_phoenix_temple: 'lion_sanctum',
  scorpion_ash_sanctuary: 'lion_sanctum', scorpion_records_court: 'forest_route',
};

async function digest(sceneId: string, reduced: boolean): Promise<string> {
  const arena = new CombatArena({ sceneId, columns: 8, rows: 4, tile: 1.18, reducedGraphics: reduced });
  await arena.build();
  arena.root.updateMatrixWorld(true);
  const theme = ARENA_THEMES[sceneId as ArenaSceneId];
  // the spread keeps every key in its place: the text is the one recorded
  const lines: string[] = [JSON.stringify({ ...theme, sound: RECORDED_SOUND[sceneId as ArenaSceneId] ?? theme.sound }), JSON.stringify(arena.describe())];
  arena.root.traverse((o) => {
    const mesh = o as THREE.Mesh & THREE.InstancedMesh & THREE.PointLight;
    const parts: unknown[] = [o.name, o.type, ...o.position.toArray().map(f), f(o.rotation.x), f(o.rotation.y), f(o.rotation.z), ...o.scale.toArray().map(f),
      o.visible, o.renderOrder, o.castShadow, o.receiveShadow, JSON.stringify(o.userData)];
    if (mesh.geometry) {
      for (const [name, attribute] of Object.entries(mesh.geometry.attributes)) parts.push(name, numbers((attribute as THREE.BufferAttribute).array));
      if (mesh.geometry.index) parts.push('index', numbers(mesh.geometry.index.array));
    }
    if (mesh.material) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) parts.push(material(m));
    if (mesh.customDepthMaterial) parts.push(material(mesh.customDepthMaterial));
    if (mesh.isInstancedMesh) parts.push(numbers(mesh.instanceMatrix.array));
    if (mesh.isLight) parts.push(mesh.color.getHexString(), f(mesh.intensity), f(mesh.distance));
    lines.push(parts.join('|'));
  });
  arena.dispose();
  return fnv(lines.join('\n'));
}

const UNCHANGED = ['forest_route', 'bois_clair_burning', 'lion_sanctum', 'bear_mountain_pass', 'bear_mine_galleries', 'bear_hall_terrace',
  'dragon_peak_trail', 'dragon_snowy_summit', 'dragon_hall_esplanade', 'dragon_wolf_cave',
  'scorpion_dune_track', 'scorpion_dune_crest', 'scorpion_phoenix_ruins', 'scorpion_phoenix_temple', 'scorpion_ash_sanctuary', 'scorpion_records_court'] as const;

describe('the Lion’s, the Bear’s, the Dragon’s and the Scorpion’s arenas', () => {
  const toTexture = PixelCanvas.prototype.toTexture;
  const found: Record<string, string> = {};
  beforeAll(() => {
    // every texture painted in code carries the digest of its pixels
    PixelCanvas.prototype.toTexture = function digestedTexture(this: PixelCanvas, options) {
      const result = toTexture.call(this, options);
      result.userData.digest = `${this.width}x${this.height}:${numbers(this.data)}`;
      return result;
    };
  });
  afterAll(() => {
    PixelCanvas.prototype.toTexture = toTexture;
    if (process.env.ARENA_DIGEST_PRINT) console.log(JSON.stringify(found, null, 2));
  });

  it('stay identical, to the pixel, in full and in reduced graphics', async () => {
    for (const sceneId of UNCHANGED) for (const reduced of [false, true]) {
      const key = `${sceneId}${reduced ? ':reduced' : ''}`;
      found[key] = await digest(sceneId, reduced);
    }
    expect(found).toEqual(RECORDED);
  }, 240000);
});
