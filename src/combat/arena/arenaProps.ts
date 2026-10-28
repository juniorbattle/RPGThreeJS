import * as THREE from 'three';
import { seeded, type Rng } from './pixelArt';
import type { ArenaPalette, ArenaProp } from './arenaThemes';
import {
  bannerTexture, barkTexture, burlapTexture, columnTexture, lanternTexture, lionReliefTexture, logEndTexture, metalTexture, plankTexture,
  roofTexture, stoneBlockTexture, strawTexture, timberWallTexture, timberWindowMask,
} from './arenaTextures';
import { DECOR_TEXELS_PER_UNIT, drawBush, drawDeadTree, drawFern, drawGrass, drawPine, drawTree, type DecorSprite } from './arenaSprites';

/** Shared, per-arena caches and animated hooks collected while building props. */
export interface PropContext {
  palette: ArenaPalette;
  reduced: boolean;
  textures: Map<string, THREE.Texture>;
  materials: Map<string, THREE.Material>;
  /** Billboards that turn to face the camera around Y. */
  billboards: THREE.Object3D[];
  /** Per-frame animation callbacks (fire, banners, flicker). */
  animated: Array<(t: number, dt: number) => void>;
  /** Point lights requested by props (anchored to an object); the arena keeps the brightest few. */
  lights: Array<{ anchor: THREE.Object3D; color: string; intensity: number; distance: number; flicker: number }>;
  sprites: Map<string, { texture: THREE.Texture; sprite: DecorSprite }>;
  shadows: boolean;
}

// ---------------------------------------------------------------- helpers

function cached<T extends THREE.Texture | THREE.Material>(map: Map<string, T>, key: string, make: () => T): T {
  let value = map.get(key);
  if (!value) { value = make(); map.set(key, value); }
  return value;
}

function repeatTexture(ctx: PropContext, key: string, make: () => THREE.Texture): THREE.Texture {
  return cached(ctx.textures, key, () => {
    const texture = make();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  });
}

function litMaterial(ctx: PropContext, key: string, map: THREE.Texture | null, extra: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return cached(ctx.materials, key, () => new THREE.MeshStandardMaterial({ map, roughness: 0.96, metalness: 0, ...extra })) as THREE.MeshStandardMaterial;
}

/** Rewrites box UVs so a repeating texture keeps one texel density on every face. */
function boxGeometry(w: number, h: number, d: number, unitsPerRepeat: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const faceDims: Array<[number, number]> = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    const [fw, fh] = faceDims[face] ?? [1, 1];
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v;
      uv.setXY(i, uv.getX(i) * fw / unitsPerRepeat, uv.getY(i) * fh / unitsPerRepeat);
    }
  }
  uv.needsUpdate = true;
  return g;
}

function cylinderGeometry(rTop: number, rBottom: number, h: number, segments: number, unitsPerRepeat: number): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const circumference = Math.PI * 2 * Math.max(rTop, rBottom);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circumference / unitsPerRepeat, uv.getY(i) * h / unitsPerRepeat);
  uv.needsUpdate = true;
  return g;
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], ctx: PropContext, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast && ctx.shadows;
  m.receiveShadow = ctx.shadows;
  m.raycast = () => {};
  return m;
}

function stoneMaterial(ctx: PropContext, seed: number, mossy = 0.5): THREE.MeshStandardMaterial {
  const key = `stone-${seed % 4}-${mossy}`;
  const texture = repeatTexture(ctx, key, () => stoneBlockTexture(ctx.palette, 100 + (seed % 4), 32, 64, 8, mossy).toTexture({ repeat: true }));
  return litMaterial(ctx, key, texture);
}

function fluteMaterial(ctx: PropContext, seed: number, lichen = 0.4): THREE.MeshStandardMaterial {
  const key = `flute-${seed % 3}-${lichen}`;
  const texture = repeatTexture(ctx, key, () => columnTexture(ctx.palette, 300 + (seed % 3), lichen).toTexture({ repeat: true }));
  return litMaterial(ctx, key, texture);
}

/**
 * Column shaft whose flutes wrap a whole number of times (no seam facing the
 * camera); 64 texels per 1.6 m along the shaft, like the ashlar.
 */
function fluteGeometry(rTop: number, rBottom: number, h: number, repeats = 3): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, repeats * 8, 1, true);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repeats, uv.getY(i) * h / 1.6);
  uv.needsUpdate = true;
  return g;
}

function woodMaterial(ctx: PropContext, vertical = false): THREE.MeshStandardMaterial {
  const key = vertical ? 'planks-v' : 'planks-h';
  const texture = repeatTexture(ctx, key, () => plankTexture(ctx.palette, vertical ? 21 : 22, vertical).toTexture({ repeat: true }));
  return litMaterial(ctx, key, texture);
}

function at<T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T {
  object.position.set(x, y, z);
  return object;
}

function glowMaterial(color: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, fog: false });
}

// ---------------------------------------------------------------- pixel fire & smoke

const FIRE_VERTEX = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const NOISE_GLSL = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }
float bayer4(vec2 p){ vec2 q = mod(floor(p), 4.0); int i = int(q.x + q.y * 4.0);
  float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + 0.5) / 16.0; }`;

/** Pixelated flame: fbm advected upward, banded into a four-tone fire ramp. */
export function createFireMaterial(seed: number, pixels: [number, number] = [18, 28]): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed * 3.17 }, uPixels: { value: new THREE.Vector2(...pixels) }, uPower: { value: 1 } },
    vertexShader: FIRE_VERTEX,
    fragmentShader: `uniform float uTime, uSeed, uPower; uniform vec2 uPixels; varying vec2 vUv; ${NOISE_GLSL}
    void main(){
      vec2 cell = floor(vUv * uPixels); vec2 uv = (cell + 0.5) / uPixels;
      float t = uTime * 1.7 + uSeed;
      vec2 q = vec2(uv.x * 3.1 + uSeed, uv.y * 2.4 - t);
      float n = fbm(q + vec2(0.0, fbm(q * 1.4 + t * 0.3)));
      float core = 1.0 - abs(uv.x - 0.5) * 2.3;
      float f = n * 1.35 + core * 0.62 - uv.y * 1.25 - 0.18;
      f *= uPower; f += (bayer4(cell) - 0.5) * 0.08;
      if (f < 0.1) discard;
      vec3 c = f > 0.72 ? vec3(1.0, 0.88, 0.55) : f > 0.46 ? vec3(1.0, 0.62, 0.2) : f > 0.26 ? vec3(0.9, 0.32, 0.08) : vec3(0.5, 0.1, 0.04);
      gl_FragColor = vec4(c * 0.82, 1.0);
    }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    side: THREE.DoubleSide,
  });
}

export function createSmokeMaterial(seed: number, tint: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed * 5.1 }, uTint: { value: new THREE.Color(tint) } },
    vertexShader: FIRE_VERTEX,
    fragmentShader: `uniform float uTime, uSeed; uniform vec3 uTint; varying vec2 vUv; ${NOISE_GLSL}
    void main(){
      vec2 px = vec2(24.0, 64.0); vec2 cell = floor(vUv * px); vec2 uv = (cell + 0.5) / px;
      float t = uTime * 0.22 + uSeed;
      float widen = 0.28 + uv.y * 0.5;
      float sway = (fbm(vec2(uv.y * 2.0, t)) - 0.5) * 0.5 * uv.y;
      float d = abs(uv.x - 0.5 - sway) / widen;
      float n = fbm(vec2(uv.x * 2.6, uv.y * 3.2 - t * 2.2));
      float a = (1.0 - d) * 0.9 + n * 0.75 - 0.75 - uv.y * 0.25;
      a *= smoothstep(0.0, 0.12, uv.y);
      if (a < 0.06 + bayer4(cell) * 0.12) discard;
      float band = a > 0.32 ? 0.55 : 0.36;
      gl_FragColor = vec4(uTint * (0.75 + n * 0.4), band);
    }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
}

function fireBillboard(ctx: PropContext, seed: number, w: number, h: number, light?: { color: string; intensity: number; distance: number }): THREE.Object3D {
  // Wide fires read as several tongues of flame rather than one fat blob.
  if (w > 1.2) {
    const group = new THREE.Group();
    const tongues = Math.min(4, Math.round(w / 0.6));
    for (let i = 0; i < tongues; i++) {
      const k = tongues === 1 ? 0 : i / (tongues - 1) - 0.5;
      const tongue = fireBillboard(ctx, seed * 7 + i, w * 0.48, h * (0.75 + Math.abs(Math.sin(seed + i * 2.3)) * 0.35), i === 0 ? light : undefined);
      tongue.position.set(k * w * 0.62, 0, (i % 2) * 0.04);
      group.add(tongue);
    }
    return group;
  }
  // ~14 fire texels per metre: flames share the decor's pixel scale at any size.
  const material = createFireMaterial(seed, [Math.max(8, Math.round(w * 14)), Math.max(12, Math.round(h * 14))]);
  const geometry = new THREE.PlaneGeometry(w, h);
  geometry.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geometry, material);
  m.renderOrder = 6;
  m.raycast = () => {};
  ctx.billboards.push(m);
  ctx.animated.push((t) => { material.uniforms.uTime!.value = t; });
  if (light) {
    const holder = new THREE.Object3D();
    m.add(holder);
    holder.position.y = h * 0.45;
    ctx.lights.push({ anchor: holder, color: light.color, intensity: light.intensity, distance: light.distance, flicker: 0.35 });
  }
  return m;
}

// ---------------------------------------------------------------- billboards

function decorSprite(ctx: PropContext, key: string, draw: () => DecorSprite) {
  let entry = ctx.sprites.get(key);
  if (!entry) {
    const sprite = draw();
    const texture = sprite.canvas.toTexture();
    ctx.textures.set(`sprite-tex-${key}`, texture);
    entry = { texture, sprite };
    ctx.sprites.set(key, entry);
  }
  return entry;
}

/**
 * Camera-facing vegetation. The sprite is drawn AT its display scale (bucketed
 * by 0.2) so a big tree keeps the decor texel density instead of showing
 * pixels twice the size of the units'.
 */
function billboard(ctx: PropContext, key: string, draw: (scale: number) => DecorSprite, scale: number, castShadow: boolean): THREE.Object3D {
  const bucket = Math.max(0.6, Math.round(scale * 5) / 5);
  const fullKey = `${key}@${bucket}`;
  const { texture, sprite } = decorSprite(ctx, fullKey, () => draw(bucket));
  const residual = scale / bucket;
  const w = sprite.canvas.width / DECOR_TEXELS_PER_UNIT * residual;
  const h = sprite.canvas.height / DECOR_TEXELS_PER_UNIT * residual;
  const geometry = new THREE.PlaneGeometry(w, h);
  geometry.translate((sprite.canvas.width / 2 - sprite.anchor[0]) / DECOR_TEXELS_PER_UNIT * residual, h / 2 - (sprite.canvas.height - sprite.anchor[1]) / DECOR_TEXELS_PER_UNIT * residual, 0);
  key = fullKey;
  const material = cached(ctx.materials, `sprite-mat-${key}`, () => new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide }));
  const m = new THREE.Mesh(geometry, material);
  m.raycast = () => {};
  m.receiveShadow = false;
  if (castShadow && ctx.shadows) {
    m.castShadow = true;
    m.customDepthMaterial = cached(ctx.materials, `sprite-depth-${key}`, () => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 }));
  }
  ctx.billboards.push(m);
  return m;
}

// ---------------------------------------------------------------- architecture

function column(ctx: PropContext, rng: Rng, seed: number, broken: boolean): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, broken ? 0.8 : 0.45);
  const shaftH = broken ? 1.3 + rng() * 1.1 : 4.1;
  g.add(at(mesh(boxGeometry(1.2, 0.36, 1.2, 1.6), stone, ctx), 0, 0.18, 0));
  g.add(at(mesh(boxGeometry(1.0, 0.2, 1.0, 1.6), stone, ctx), 0, 0.46, 0));
  const flute = fluteMaterial(ctx, seed, broken ? 0.8 : 0.35);
  const shaft = mesh(fluteGeometry(0.4, 0.44, shaftH), flute, ctx);
  shaft.position.y = 0.56 + shaftH / 2;
  g.add(shaft);
  if (broken) {
    // jagged break: a few tilted shards on the stump
    for (let i = 0; i < 3; i++) {
      const shard = mesh(boxGeometry(0.34 + rng() * 0.16, 0.22 + rng() * 0.3, 0.3 + rng() * 0.14, 1.6), stone, ctx);
      const a = (i / 3) * Math.PI * 2 + rng();
      shard.position.set(Math.cos(a) * 0.17, 0.56 + shaftH + 0.06, Math.sin(a) * 0.17);
      shard.rotation.set((rng() - 0.5) * 0.5, rng() * 3, (rng() - 0.5) * 0.5);
      g.add(shard);
    }
    const drum = new THREE.Group();
    drum.add(mesh(fluteGeometry(0.38, 0.4, 1.1), flute, ctx));
    for (const end of [-1, 1]) {
      const cap = mesh(new THREE.CircleGeometry(end < 0 ? 0.4 : 0.38, 24), stone, ctx);
      cap.rotation.x = end * -Math.PI / 2;
      cap.position.y = end * 0.55;
      drum.add(cap);
    }
    drum.rotation.set(Math.PI / 2, 0, rng() * 0.6 - 0.3);
    drum.position.set(0.9 + rng() * 0.3, 0.38, 0.5 + rng() * 0.4);
    g.add(drum);
    const cap = mesh(boxGeometry(0.7, 0.4, 0.6, 1.6), stone, ctx);
    cap.rotation.set(0.2, rng() * 2, 0.3);
    cap.position.set(-0.8, 0.2, 0.6);
    g.add(cap);
  } else {
    g.add(at(mesh(boxGeometry(1.0, 0.22, 1.0, 1.6), stone, ctx), 0, 0.56 + shaftH + 0.11, 0));
    g.add(at(mesh(boxGeometry(1.25, 0.3, 1.25, 1.6), stone, ctx), 0, 0.56 + shaftH + 0.37, 0));
  }
  return g;
}

function wall(ctx: PropContext, rng: Rng, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.7);
  const width = 4.2;
  g.add(at(mesh(boxGeometry(width, 1.3, 0.7, 2), stone, ctx), 0, 0.65, 0));
  let x = -width / 2;
  while (x < width / 2 - 0.3) {
    const w = 0.5 + rng() * 0.9, h = rng() * 1.4;
    if (h > 0.2) {
      const block = mesh(boxGeometry(Math.min(w, width / 2 - x), h, 0.66, 2), stone, ctx);
      block.position.set(x + Math.min(w, width / 2 - x) / 2, 1.3 + h / 2, (rng() - 0.5) * 0.04);
      g.add(block);
    }
    x += w;
  }
  return g;
}

function arch(ctx: PropContext, rng: Rng, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.6);
  const span = 2.4, pillarH = 3.2;
  for (const side of [-1, 1]) {
    const pillar = mesh(boxGeometry(0.85, pillarH, 0.85, 1.6), stone, ctx);
    pillar.position.set(side * (span / 2 + 0.42), pillarH / 2, 0);
    g.add(pillar);
  }
  const radius = span / 2 + 0.42;
  const pieces = 9;
  for (let i = 0; i < pieces; i++) {
    if (seed % 2 === 1 && i > pieces - 3) continue; // a ruined arch loses its last voussoirs
    const a = Math.PI * (i + 0.5) / pieces;
    const block = mesh(boxGeometry(0.62, 0.8, 0.85, 1.6), stone, ctx);
    block.position.set(-Math.cos(a) * radius, pillarH + Math.sin(a) * radius * 0.92, 0);
    block.rotation.z = a - Math.PI / 2;
    g.add(block);
  }
  if (seed % 2 === 1) {
    const fallen = mesh(boxGeometry(0.62, 0.8, 0.85, 1.6), stone, ctx);
    fallen.position.set(radius + 0.9, 0.4, 0.9 + rng() * 0.3);
    fallen.rotation.set(0.1, 0.7, 0.2);
    g.add(fallen);
  }
  return g;
}

function stairs(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.3);
  for (let i = 0; i < 3; i++) {
    const step = mesh(boxGeometry(3.4 - i * 0.3, 0.24, 1.6 - i * 0.5, 1.6), stone, ctx);
    step.position.set(0, 0.12 + i * 0.24, -i * 0.25);
    g.add(step);
  }
  return g;
}

function obelisk(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.25);
  g.add(at(mesh(boxGeometry(1.6, 0.6, 1.6, 1.6), stone, ctx), 0, 0.3, 0));
  const shaft = mesh(cylinderGeometry(0.42, 0.62, 5.2, 4, 1.6), stone, ctx);
  shaft.rotation.y = Math.PI / 4;
  shaft.position.y = 0.6 + 2.6;
  g.add(shaft);
  const tip = mesh(new THREE.ConeGeometry(0.42, 0.7, 4), litMaterial(ctx, 'gold', null, { color: '#c39a3c', metalness: 0.6, roughness: 0.45, emissive: '#4a3208' }), ctx);
  tip.rotation.y = Math.PI / 4;
  tip.position.y = 0.6 + 5.2 + 0.35;
  g.add(tip);
  return g;
}

/**
 * The Lion stele: stepped plinth, a carved panel with the house lion and sun
 * medallion in gold relief (emissive mask, so it reads at night without
 * blooming into a blob), a gold sun crown and a pair of guardian lamps.
 */
function statue(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.2);
  g.add(at(mesh(boxGeometry(2.6, 0.5, 1.9, 1.6), stone, ctx), 0, 0.25, 0));
  g.add(at(mesh(boxGeometry(2.2, 0.4, 1.6, 1.6), stone, ctx), 0, 0.7, 0));
  const steleW = 1.5, steleH = 2.25, steleD = 0.5;
  g.add(at(mesh(boxGeometry(steleW, steleH, steleD, 1.6), stone, ctx), 0, 0.9 + steleH / 2, 0));
  const arch = mesh(new THREE.CylinderGeometry(steleW / 2, steleW / 2, steleD, 16, 1, false, -Math.PI / 2, Math.PI), stone, ctx);
  arch.rotation.x = -Math.PI / 2;
  arch.position.y = 0.9 + steleH;
  g.add(arch);
  const relief = cached(ctx.materials, `lion-relief-${seed}`, () => {
    const { face, gold } = lionReliefTexture(ctx.palette, 60 + seed);
    const map = face.toTexture();
    const emissiveMap = gold.toTexture();
    ctx.textures.set(`lion-relief-${seed}`, map);
    ctx.textures.set(`lion-relief-gold-${seed}`, emissiveMap);
    return new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.7, metalness: 0.15 });
  }) as THREE.MeshStandardMaterial;
  const panel = mesh(new THREE.PlaneGeometry(steleW - 0.16, steleH * 0.96), relief, ctx, false);
  panel.position.set(0, 0.9 + steleH * 0.5, steleD / 2 + 0.006);
  g.add(panel);
  // sun crown on the arch
  const gold = litMaterial(ctx, 'gold-statue', null, { color: '#d9ad48', metalness: 0.45, roughness: 0.4, emissive: '#5a3c0c', emissiveIntensity: 0.6 });
  const crownY = 0.9 + steleH + steleW / 2 + 0.42;
  const disc = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 16), gold, ctx);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, crownY, 0);
  g.add(disc);
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + Math.PI / 2;
    const ray = mesh(new THREE.ConeGeometry(0.08, i % 2 ? 0.3 : 0.44, 4), gold, ctx);
    const r = i % 2 ? 0.5 : 0.57;
    ray.position.set(Math.cos(a) * r, crownY + Math.sin(a) * r, 0);
    ray.rotation.z = a - Math.PI / 2;
    g.add(ray);
  }
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), new THREE.MeshBasicMaterial({ color: '#ffd77a', transparent: true, opacity: 0.06, depthWrite: false, toneMapped: false, fog: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, crownY, -0.1);
  halo.raycast = () => {};
  g.add(halo);
  ctx.animated.push((t) => { (halo.material as THREE.MeshBasicMaterial).opacity = 0.05 + Math.sin(t * 0.8 + seed) * 0.025; });
  return g;
}

function house(ctx: PropContext, rng: Rng, seed: number, burning: boolean): THREE.Group {
  const g = new THREE.Group();
  const w = 4.6, h = 2.7, d = 3.4;
  const wallTex = repeatTexture(ctx, `timber-${burning}`, () => timberWallTexture(ctx.palette, 31 + (burning ? 1 : 0), burning).toTexture({ repeat: true }));
  const windowTex = repeatTexture(ctx, `timber-windows-${burning}`, () => timberWindowMask(burning).toTexture({ repeat: true }));
  const fresh = !ctx.materials.has(`timber-${burning}`);
  // the panes glow through the emissive mask: lamplight, or fire flickering inside
  const wallMat = litMaterial(ctx, `timber-${burning}`, wallTex, { emissiveMap: windowTex, emissive: '#ffffff', emissiveIntensity: burning ? 1.1 : 0.85 });
  if (fresh && burning) ctx.animated.push((t) => { wallMat.emissiveIntensity = 0.95 + Math.sin(t * 9.3) * 0.12 + Math.sin(t * 14.1) * 0.08; });
  const body = mesh(boxGeometry(w, h, d, 2.6), wallMat, ctx);
  // keep facade texture at one storey per wall height
  body.position.y = h / 2;
  g.add(body);
  const stone = stoneMaterial(ctx, seed, 0.2);
  g.add(at(mesh(boxGeometry(w + 0.12, 0.45, d + 0.12, 1.6), stone, ctx), 0, 0.22, 0));
  const roofTex = repeatTexture(ctx, `roof-${burning}`, () => roofTexture(ctx.palette, 41, burning).toTexture({ repeat: true }));
  const roofMat = litMaterial(ctx, `roof-${burning}`, roofTex);
  const shape = new THREE.Shape();
  const overhang = 0.35, rise = 1.9;
  shape.moveTo(-(w / 2 + overhang), 0);
  shape.lineTo(w / 2 + overhang, 0);
  shape.lineTo(0, rise);
  shape.lineTo(-(w / 2 + overhang), 0);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + overhang * 2, bevelEnabled: false });
  const uv = roofGeo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.4, uv.getY(i) / 1.4);
  const roof = mesh(roofGeo, roofMat, ctx);
  roof.position.set(0, h, -(d / 2 + overhang));
  if (burning) roof.rotation.z = (rng() - 0.5) * 0.06;
  g.add(roof);
  const chimney = mesh(boxGeometry(0.5, 1.4, 0.5, 1.6), stone, ctx);
  chimney.position.set(w * 0.28, h + 1.3, -0.4);
  g.add(chimney);
  const door = mesh(new THREE.PlaneGeometry(0.9, 1.6), woodMaterial(ctx, true), ctx, false);
  door.position.set(-0.3, 0.8 + 0.4, d / 2 + 0.01);
  g.add(door);
  if (burning) {
    const flames = fireBillboard(ctx, seed + 3, 2.6, 2.4, { color: '#ff7a2a', intensity: 9, distance: 12 });
    flames.position.set((rng() - 0.5) * 1.2, h + rise * 0.55, 0.4);
    g.add(flames);
  }
  return g;
}

function fence(ctx: PropContext, rng: Rng): THREE.Group {
  const g = new THREE.Group();
  const wood = woodMaterial(ctx);
  const length = 3.2;
  for (let i = 0; i <= 3; i++) {
    const post = mesh(boxGeometry(0.16, 1.1, 0.16, 1), wood, ctx);
    post.position.set(-length / 2 + i * (length / 3), 0.55, 0);
    post.rotation.z = (rng() - 0.5) * 0.12;
    g.add(post);
  }
  for (const y of [0.42, 0.85]) {
    const rail = mesh(boxGeometry(length + 0.2, 0.12, 0.08, 1), wood, ctx);
    rail.position.set(0, y, 0.06);
    rail.rotation.z = (rng() - 0.5) * 0.05;
    g.add(rail);
  }
  return g;
}

function barrel(ctx: PropContext): THREE.Group {
  const g = new THREE.Group();
  const body = mesh(cylinderGeometry(0.42, 0.36, 1.0, 12, 1), woodMaterial(ctx, true), ctx);
  body.position.y = 0.5;
  g.add(body);
  const metal = litMaterial(ctx, 'metal', repeatTexture(ctx, 'metal', () => metalTexture(5).toTexture({ repeat: true })), { metalness: 0.4, roughness: 0.6 });
  for (const y of [0.18, 0.82]) {
    const band = mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.07, 12, 1, true), metal, ctx, false);
    band.position.y = y;
    g.add(band);
  }
  return g;
}

function crate(ctx: PropContext): THREE.Group {
  const g = new THREE.Group();
  const box = mesh(boxGeometry(0.95, 0.95, 0.95, 1), woodMaterial(ctx), ctx);
  box.position.y = 0.475;
  g.add(box);
  return g;
}

function sackMaterial(ctx: PropContext): THREE.MeshStandardMaterial {
  return litMaterial(ctx, 'burlap', repeatTexture(ctx, 'burlap', () => burlapTexture(13).toTexture({ repeat: true })));
}

function sack(ctx: PropContext, rng: Rng): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.34, 8, 6);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // flat bottom, a tied neck at the top
    const neck = y > 0.2 ? 0.55 + (0.34 - y) * 1.6 : 1;
    pos.setXYZ(i, pos.getX(i) * neck, Math.max(-0.2, y), pos.getZ(i) * neck);
  }
  geometry.computeVertexNormals();
  const m = mesh(geometry, sackMaterial(ctx), ctx);
  m.scale.set(1, 1.15 + rng() * 0.2, 0.85);
  return m;
}

function cart(ctx: PropContext, rng: Rng): THREE.Group {
  const g = new THREE.Group();
  const wood = woodMaterial(ctx);
  const bed = mesh(boxGeometry(2.6, 0.18, 1.5, 1), wood, ctx);
  bed.position.y = 0.78;
  g.add(bed);
  for (const side of [-1, 1]) {
    const board = mesh(boxGeometry(2.6, 0.36, 0.08, 1), wood, ctx);
    board.position.set(0, 1.04, side * 0.71);
    g.add(board);
    const wheel = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 14), woodMaterial(ctx, true), ctx);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0.3, 0.6, side * 0.84);
    g.add(wheel);
    const hub = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 8), litMaterial(ctx, 'metal-dark', null, { color: '#2a2622', roughness: 0.7 }), ctx);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0.3, 0.6, side * 0.9);
    g.add(hub);
  }
  const back = mesh(boxGeometry(0.08, 0.36, 1.5, 1), wood, ctx);
  back.position.set(1.28, 1.04, 0);
  g.add(back);
  for (const side of [-1, 1]) {
    const shaft = mesh(boxGeometry(2, 0.1, 0.1, 1), wood, ctx);
    shaft.position.set(-2, 0.55, side * 0.5);
    shaft.rotation.z = 0.25;
    g.add(shaft);
  }
  for (let i = 0; i < 3; i++) {
    const s = sack(ctx, rng);
    s.position.set(-0.7 + i * 0.55, 1.07, (rng() - 0.5) * 0.5);
    s.rotation.set((rng() - 0.5) * 0.4, rng() * 3, (rng() - 0.5) * 0.4);
    g.add(s);
  }
  const box = mesh(boxGeometry(0.6, 0.6, 0.6, 1), wood, ctx);
  box.position.set(0.85, 1.17, 0.2);
  box.rotation.y = 0.3;
  g.add(box);
  return g;
}

function haystack(ctx: PropContext, rng: Rng): THREE.Group {
  const g = new THREE.Group();
  const straw = litMaterial(ctx, 'straw', repeatTexture(ctx, 'straw', () => strawTexture(9).toTexture({ repeat: true })));
  // beehive rick: bulging flank, rounded shoulder, a tight crown
  const profile = [[0.98, 0], [1.08, 0.3], [1.12, 0.7], [1.05, 1.1], [0.88, 1.45], [0.62, 1.75], [0.32, 1.95], [0.04, 2.04]].map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(profile, 16);
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 2.6);
  g.add(mesh(geometry, straw, ctx));
  const rope = litMaterial(ctx, 'rope', null, { color: '#3a2a18', roughness: 1 });
  for (const [y, r] of [[0.85, 1.13], [1.48, 0.87]] as const) {
    const band = mesh(new THREE.TorusGeometry(r, 0.035, 4, 18), rope, ctx, false);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  }
  const pole = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 5), woodMaterial(ctx, true), ctx);
  pole.position.y = 2.2;
  pole.rotation.z = (rng() - 0.5) * 0.2;
  g.add(pole);
  // loose straw at the foot (scale-aware billboards in straw tones)
  const strawPal = { ...ctx.palette, grass: ['#3b2a10', '#6a5022', '#977733', '#c2a04f', '#e0c473'] };
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rng();
    const tuft = billboard(ctx, 'straw-tuft', (k) => drawGrass(strawPal, 5, k), 0.8 + rng() * 0.3, false);
    tuft.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15);
    g.add(tuft);
  }
  return g;
}

/** Village well: open stone ring, dark water, gabled roof, crank and bucket. */
function well(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.5);
  const ring = mesh(cylinderGeometry(0.95, 1.0, 0.95, 18, 1.6), stone, ctx);
  ring.position.y = 0.475;
  g.add(ring);
  const inner = mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.95, 18, 1, true), litMaterial(ctx, 'well-inner', null, { color: ctx.palette.stoneDark[1], roughness: 1, side: THREE.BackSide }), ctx, false);
  inner.position.y = 0.475;
  g.add(inner);
  const lip = mesh(new THREE.RingGeometry(0.76, 1.02, 18, 1), stone, ctx);
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = 0.955;
  g.add(lip);
  const water = mesh(new THREE.CircleGeometry(0.78, 18), litMaterial(ctx, 'well-water', null, { color: '#0d1418', roughness: 0.15, metalness: 0.4 }), ctx, false);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.62;
  g.add(water);
  const wood = woodMaterial(ctx, true);
  for (const side of [-1, 1]) {
    const post = mesh(boxGeometry(0.14, 2.1, 0.14, 1), wood, ctx);
    post.position.set(side * 0.9, 1.05, 0);
    g.add(post);
  }
  const roofMat = woodMaterial(ctx);
  for (const side of [-1, 1]) {
    const plank = mesh(boxGeometry(2.3, 0.07, 0.86, 1), roofMat, ctx);
    plank.position.set(0, 2.32, side * 0.32);
    plank.rotation.x = side * 0.62;
    g.add(plank);
  }
  const crank = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6), wood, ctx);
  crank.rotation.z = Math.PI / 2;
  crank.position.y = 1.72;
  g.add(crank);
  const rope = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), litMaterial(ctx, 'rope', null, { color: '#3a2a18', roughness: 1 }), ctx, false);
  rope.position.set(0.1, 1.4, 0);
  g.add(rope);
  const bucket = mesh(cylinderGeometry(0.17, 0.13, 0.26, 8, 1), woodMaterial(ctx, true), ctx);
  bucket.position.set(0.1, 1.0, 0);
  g.add(bucket);
  return g;
}

/** Fallen log: bark side, sawn ring ends, a tuft of fern on the moss. */
function log(ctx: PropContext, rng: Rng, seed: number): THREE.Group {
  const g = new THREE.Group();
  const bark = litMaterial(ctx, 'log-bark', repeatTexture(ctx, 'log-bark', () => barkTexture(ctx.palette, 70 + seed % 2).toTexture({ repeat: true })));
  const length = 2.2 + rng() * 0.8, r = 0.3 + rng() * 0.08;
  const body = mesh(cylinderGeometry(r, r * 1.08, length, 12, 0.8), bark, ctx);
  body.rotation.z = Math.PI / 2;
  body.position.y = r * 0.9;
  g.add(body);
  const ends = litMaterial(ctx, 'log-end', cached(ctx.textures, 'log-end', () => logEndTexture(ctx.palette, 71).toTexture()));
  for (const side of [-1, 1]) {
    const cap = mesh(new THREE.CircleGeometry(side < 0 ? r : r * 1.08, 12), ends, ctx, false);
    cap.rotation.y = side * Math.PI / 2;
    cap.position.set(side * length / 2, r * 0.9, 0);
    g.add(cap);
  }
  const fern = billboard(ctx, `fern-${seed % 4}`, (k) => drawFern(ctx.palette, seed % 4, k), 0.7, false);
  fern.position.set((rng() - 0.5) * length * 0.5, r * 1.6, 0.05);
  g.add(fern);
  return g;
}

/** Charred planks and a scorched beam, fallen from the burning roofs. */
function debris(ctx: PropContext, rng: Rng): THREE.Group {
  const g = new THREE.Group();
  const charred = litMaterial(ctx, 'charred', repeatTexture(ctx, 'planks-h', () => plankTexture(ctx.palette, 22, false).toTexture({ repeat: true })), { color: '#5c4a40' });
  for (let i = 0; i < 4; i++) {
    const plank = mesh(boxGeometry(1.1 + rng() * 0.9, 0.08, 0.22, 1), charred, ctx);
    plank.position.set((rng() - 0.5) * 1.2, 0.05 + i * 0.03, (rng() - 0.5) * 0.9);
    plank.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.25);
    g.add(plank);
  }
  const beam = mesh(boxGeometry(1.9, 0.22, 0.22, 1), charred, ctx);
  beam.position.set(0.2, 0.2, 0.1);
  beam.rotation.set(0, rng() * Math.PI, 0.18);
  g.add(beam);
  const coal = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.12), glowMaterial('#ff6a1f'));
  coal.position.set(0.3, 0.32, 0.1);
  coal.raycast = () => {};
  g.add(coal);
  const phase = rng() * 6;
  ctx.animated.push((t) => { (coal.material as THREE.MeshBasicMaterial).color.setHSL(0.05, 1, 0.42 + Math.sin(t * 5 + phase) * 0.1); });
  return g;
}

function lantern(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const wood = woodMaterial(ctx, true);
  const post = mesh(boxGeometry(0.16, 2.6, 0.16, 1), wood, ctx);
  post.position.y = 1.3;
  g.add(post);
  const arm = mesh(boxGeometry(0.7, 0.1, 0.1, 1), wood, ctx);
  arm.position.set(0.3, 2.5, 0);
  g.add(arm);
  const pane = cached(ctx.textures, 'lantern-pane', () => lanternTexture().toTexture());
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshBasicMaterial({ map: pane, toneMapped: false, fog: false }));
  cage.position.set(0.58, 2.2, 0);
  cage.raycast = () => {};
  g.add(cage);
  const cap = mesh(new THREE.ConeGeometry(0.26, 0.2, 4), litMaterial(ctx, 'metal-dark', null, { color: '#2a2622', roughness: 0.7 }), ctx);
  cap.position.set(0.58, 2.5, 0);
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  ctx.lights.push({ anchor: cage, color: '#ffbf6a', intensity: 5.5, distance: 7.5, flicker: 0.12 });
  ctx.animated.push((t) => { (cage.material as THREE.MeshBasicMaterial).color.setScalar(1.05 + Math.sin(t * 7 + seed) * 0.08 + Math.sin(t * 12.3 + seed * 2) * 0.04); });
  return g;
}

function brazier(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const metal = litMaterial(ctx, 'metal-dark', null, { color: '#2a2622', roughness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5), metal, ctx);
    leg.position.set(Math.cos(a) * 0.25, 0.5, Math.sin(a) * 0.25);
    leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
    g.add(leg);
  }
  const bowl = mesh(new THREE.CylinderGeometry(0.48, 0.28, 0.32, 12), metal, ctx);
  bowl.position.y = 1.08;
  g.add(bowl);
  const coals = new THREE.Mesh(new THREE.CircleGeometry(0.44, 12), glowMaterial('#ff6a1f'));
  coals.rotation.x = -Math.PI / 2;
  coals.position.y = 1.23;
  g.add(coals);
  const flame = fireBillboard(ctx, seed, 0.95, 1.35, { color: '#ff9a4a', intensity: 7, distance: 8.5 });
  flame.position.y = 1.18;
  g.add(flame);
  return g;
}

function banner(ctx: PropContext, seed: number, burning: boolean): THREE.Group {
  const g = new THREE.Group();
  const wood = woodMaterial(ctx, true);
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.08, 4.2, 6), wood, ctx);
  pole.position.y = 2.1;
  g.add(pole);
  const bar = mesh(boxGeometry(1.5, 0.08, 0.08, 1), wood, ctx);
  bar.position.y = 3.9;
  g.add(bar);
  const tex = cached(ctx.textures, `banner-${seed}-${burning}`, () => bannerTexture(ctx.palette, seed, burning).toTexture());
  const cloth = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  const time = { value: 0 };
  cloth.onBeforeCompile = (shader) => {
    shader.uniforms.uWave = time;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uWave;\nvoid main() {')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float sway = (1.0 - uv.y);
        transformed.z += sin(uWave * 2.1 + position.y * 2.6 + position.x * 1.7) * 0.11 * sway;
        transformed.x += sin(uWave * 1.3 + position.y * 1.9) * 0.05 * sway;`);
  };
  const clothGeo = new THREE.PlaneGeometry(1.25, 2.5, 6, 12);
  clothGeo.translate(0, -1.25, 0);
  const flag = new THREE.Mesh(clothGeo, cloth);
  flag.castShadow = ctx.shadows;
  flag.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  flag.position.set(0, 3.86, 0.05);
  flag.raycast = () => {};
  flag.userData.dynamic = true; // vertex-animated: never merged into static decor
  g.add(flag);
  ctx.animated.push((t) => { time.value = t + seed; });
  return g;
}

function candles(ctx: PropContext, rng: Rng, seed: number): THREE.Group {
  const g = new THREE.Group();
  const wax = litMaterial(ctx, 'wax', null, { color: '#e8dcc0', roughness: 0.8, emissive: '#3a2a12' });
  const stone = stoneMaterial(ctx, seed, 0.1);
  const plinth = mesh(boxGeometry(0.9, 0.3, 0.7, 1.6), stone, ctx);
  plinth.position.y = 0.15;
  g.add(plinth);
  for (let i = 0; i < 5; i++) {
    const h = 0.25 + rng() * 0.4;
    const c = mesh(new THREE.CylinderGeometry(0.06, 0.07, h, 6), wax, ctx, false);
    const x = (rng() - 0.5) * 0.7, z = (rng() - 0.5) * 0.45;
    c.position.set(x, 0.3 + h / 2, z);
    g.add(c);
    const flame = fireBillboard(ctx, seed * 10 + i, 0.14, 0.24);
    flame.position.set(x, 0.3 + h, z);
    g.add(flame);
  }
  const anchor = new THREE.Object3D();
  anchor.position.set(0, 0.9, 0);
  g.add(anchor);
  ctx.lights.push({ anchor, color: '#ffc77a', intensity: 3.2, distance: 5.5, flicker: 0.2 });
  return g;
}

function gravestone(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.7);
  const slab = mesh(boxGeometry(0.8, 1.0, 0.22, 1.6), stone, ctx);
  slab.position.y = 0.5;
  g.add(slab);
  const top = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 12, 1, false, 0, Math.PI), stone, ctx);
  top.rotation.set(Math.PI / 2, Math.PI / 2, 0);
  top.position.y = 1.0;
  g.add(top);
  return g;
}

function rock(ctx: PropContext, rng: Rng, seed: number): THREE.Group {
  const g = new THREE.Group();
  const geometry = new THREE.DodecahedronGeometry(0.7, 0);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.78 + ((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.42;
    pos.setXYZ(i, pos.getX(i) * k, Math.max(-0.2, pos.getY(i) * k * 0.7), pos.getZ(i) * k);
  }
  geometry.computeVertexNormals();
  const material = cached(ctx.materials, `rock-${seed % 3}`, () => {
    const base = stoneMaterial(ctx, seed, 0.9) as THREE.MeshStandardMaterial;
    return new THREE.MeshStandardMaterial({ map: base.map, roughness: 1, flatShading: true });
  });
  const m = mesh(geometry, material, ctx);
  m.position.y = 0.28;
  m.rotation.y = rng() * Math.PI;
  g.add(m);
  return g;
}

function smoke(ctx: PropContext, seed: number, tint: string): THREE.Object3D {
  const material = createSmokeMaterial(seed, tint);
  const geometry = new THREE.PlaneGeometry(3.2, 9);
  geometry.translate(0, 4.5, 0);
  const m = new THREE.Mesh(geometry, material);
  m.renderOrder = 4;
  m.raycast = () => {};
  ctx.billboards.push(m);
  ctx.animated.push((t) => { material.uniforms.uTime!.value = t; });
  return m;
}

// ---------------------------------------------------------------- dispatch

export function buildProp(ctx: PropContext, prop: ArenaProp): THREE.Object3D | null {
  const seed = prop.v ?? 1;
  const rng = seeded(seed * 977 + Math.round(prop.x * 31 + prop.z * 17));
  const s = prop.s ?? 1;
  let object: THREE.Object3D | null = null;
  switch (prop.kind) {
    case 'tree': object = billboard(ctx, `tree-${seed % 5}`, (k) => drawTree(ctx.palette, seed % 5, k), s, true); break;
    case 'pine': object = billboard(ctx, `pine-${seed % 4}`, (k) => drawPine(ctx.palette, seed % 4, k), s, true); break;
    case 'dead_tree': {
      const tree = billboard(ctx, `dead-${seed % 3}-${!!prop.burning}`, (k) => drawDeadTree(ctx.palette, seed % 3, !!prop.burning, k), s, true);
      if (!prop.burning) { object = tree; break; }
      // flames licking the forks of the crown
      const group = new THREE.Group();
      group.add(tree);
      const crown = fireBillboard(ctx, seed + 11, 0.9 * s, 1.4 * s);
      crown.position.set(0.25 * s, 3.9 * s, 0.05);
      group.add(crown);
      const fork = fireBillboard(ctx, seed + 17, 0.6 * s, 0.9 * s);
      fork.position.set(-0.6 * s, 3.2 * s, 0.05);
      group.add(fork);
      object = group;
      break;
    }
    case 'bush': object = billboard(ctx, `bush-${seed % 4}`, (k) => drawBush(ctx.palette, seed % 4, k), s, false); break;
    case 'fern': object = billboard(ctx, `fern-${seed % 4}`, (k) => drawFern(ctx.palette, seed % 4, k), s, false); break;
    case 'grass': object = billboard(ctx, `grass-${seed % 3}`, (k) => drawGrass(ctx.palette, seed % 3, k), s, false); break;
    case 'rock': object = rock(ctx, rng, seed); break;
    case 'column': object = column(ctx, rng, seed, false); break;
    case 'broken_column': object = column(ctx, rng, seed, true); break;
    case 'wall': object = wall(ctx, rng, seed); break;
    case 'arch': object = arch(ctx, rng, seed); break;
    case 'stairs': object = stairs(ctx, seed); break;
    case 'obelisk': object = obelisk(ctx, seed); break;
    case 'statue': object = statue(ctx, seed); break;
    case 'house': object = house(ctx, rng, seed, !!prop.burning); break;
    case 'fence': object = fence(ctx, rng); break;
    case 'barrel': object = barrel(ctx); break;
    case 'crate': object = crate(ctx); break;
    case 'cart': object = cart(ctx, rng); break;
    case 'haystack': object = haystack(ctx, rng); break;
    case 'well': object = well(ctx, seed); break;
    case 'log': object = log(ctx, rng, seed); break;
    case 'debris': object = debris(ctx, rng); break;
    case 'lantern': object = lantern(ctx, seed); break;
    case 'brazier': object = brazier(ctx, seed); break;
    case 'banner': object = banner(ctx, seed, !!prop.burning); break;
    case 'candles': object = candles(ctx, rng, seed); break;
    case 'gravestone': object = gravestone(ctx, seed); break;
    case 'fire': object = fireBillboard(ctx, seed, 1.6 * s, 2.2 * s, { color: '#ff7a2a', intensity: 8, distance: 11 }); break;
    case 'smoke': object = smoke(ctx, seed, '#3b3030'); break;
    default: object = null;
  }
  if (!object) return null;
  object.position.set(prop.x, 0, prop.z);
  if (prop.kind !== 'fire' && prop.kind !== 'smoke' && !ctx.billboards.includes(object)) object.rotation.y = prop.r ?? 0;
  const sizedByBuilder = ['tree', 'pine', 'dead_tree', 'bush', 'fern', 'grass', 'fire'].includes(prop.kind);
  if (!sizedByBuilder) object.scale.setScalar(s);
  object.name = `arena-prop:${prop.kind}`;
  return object;
}
