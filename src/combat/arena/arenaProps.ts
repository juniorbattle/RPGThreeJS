import * as THREE from 'three';
import { seeded, type Rng } from './pixelArt';
import type { ArenaPalette, ArenaProp } from './arenaThemes';
import {
  bannerTexture, barkTexture, metalTexture, plankTexture, roofTexture, stoneBlockTexture, strawTexture, timberWallTexture,
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
      vec3 c = f > 0.66 ? vec3(1.0, 0.93, 0.66) : f > 0.44 ? vec3(1.0, 0.7, 0.24) : f > 0.25 ? vec3(0.96, 0.38, 0.1) : vec3(0.55, 0.12, 0.05);
      gl_FragColor = vec4(c * 0.92, 1.0);
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

function fireBillboard(ctx: PropContext, seed: number, w: number, h: number, light?: { color: string; intensity: number; distance: number }): THREE.Mesh {
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

function billboard(ctx: PropContext, key: string, draw: () => DecorSprite, scale: number, castShadow: boolean): THREE.Object3D {
  const { texture, sprite } = decorSprite(ctx, key, draw);
  const w = sprite.canvas.width / DECOR_TEXELS_PER_UNIT * scale;
  const h = sprite.canvas.height / DECOR_TEXELS_PER_UNIT * scale;
  const geometry = new THREE.PlaneGeometry(w, h);
  geometry.translate((sprite.canvas.width / 2 - sprite.anchor[0]) / DECOR_TEXELS_PER_UNIT * scale, h / 2 - (sprite.canvas.height - sprite.anchor[1]) / DECOR_TEXELS_PER_UNIT * scale, 0);
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
  const shaft = mesh(cylinderGeometry(0.4, 0.44, shaftH, 12, 1.6), stone, ctx);
  shaft.position.y = 0.56 + shaftH / 2;
  g.add(shaft);
  if (broken) {
    const chunk = mesh(cylinderGeometry(0.38, 0.4, 1.1, 12, 1.6), stone, ctx);
    chunk.rotation.set(Math.PI / 2, 0, rng() * 0.6 - 0.3);
    chunk.position.set(0.9 + rng() * 0.3, 0.38, 0.5 + rng() * 0.4);
    g.add(chunk);
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

function statue(ctx: PropContext, seed: number): THREE.Group {
  const g = new THREE.Group();
  const stone = stoneMaterial(ctx, seed, 0.2);
  g.add(at(mesh(boxGeometry(2.4, 1.0, 1.8, 1.6), stone, ctx), 0, 0.5, 0));
  g.add(at(mesh(boxGeometry(1.7, 1.6, 1.3, 1.6), stone, ctx), 0, 1.8, 0));
  const gold = litMaterial(ctx, 'gold', null, { color: '#c39a3c', metalness: 0.65, roughness: 0.4, emissive: '#3a2606' });
  const disc = mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.18, 24), gold, ctx);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 3.6, 0);
  g.add(disc);
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const ray = mesh(new THREE.ConeGeometry(0.16, 0.7, 4), gold, ctx);
    ray.position.set(Math.cos(a) * 1.45, 3.6 + Math.sin(a) * 1.45, 0);
    ray.rotation.z = a - Math.PI / 2;
    g.add(ray);
  }
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ color: '#ffd77a', transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false, fog: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 3.6, -0.2);
  g.add(halo);
  ctx.animated.push((t) => { (halo.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 0.8 + seed) * 0.04; });
  return g;
}

function house(ctx: PropContext, rng: Rng, seed: number, burning: boolean): THREE.Group {
  const g = new THREE.Group();
  const w = 4.6, h = 2.7, d = 3.4;
  const wallTex = repeatTexture(ctx, `timber-${burning}`, () => timberWallTexture(ctx.palette, 31 + (burning ? 1 : 0), burning).toTexture({ repeat: true }));
  const wallMat = litMaterial(ctx, `timber-${burning}`, wallTex);
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
  for (const wx of [-1.5, 1.2]) {
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.4), glowMaterial(burning ? '#e8742a' : '#d9a24e'));
    glow.position.set(wx, 1.55, d / 2 + 0.02);
    glow.raycast = () => {};
    g.add(glow);
    if (burning) ctx.animated.push((t) => { (glow.material as THREE.MeshBasicMaterial).color.setHSL(0.065, 0.95, 0.42 + Math.sin(t * 9 + wx * 3) * 0.07); });
  }
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

function cart(ctx: PropContext, rng: Rng): THREE.Group {
  const g = new THREE.Group();
  const wood = woodMaterial(ctx);
  const bed = mesh(boxGeometry(2.6, 0.5, 1.5, 1), wood, ctx);
  bed.position.y = 0.9;
  g.add(bed);
  for (const side of [-1, 1]) {
    const wheel = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.14, 14), woodMaterial(ctx, true), ctx);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0.3, 0.6, side * 0.82);
    g.add(wheel);
  }
  const shaft = mesh(boxGeometry(2, 0.1, 0.1, 1), wood, ctx);
  shaft.position.set(-2, 0.55, 0);
  shaft.rotation.z = 0.25;
  g.add(shaft);
  const sack = mesh(new THREE.SphereGeometry(0.42, 8, 6), litMaterial(ctx, 'sack', repeatTexture(ctx, 'straw', () => strawTexture(9).toTexture({ repeat: true }))), ctx);
  sack.scale.set(1.2, 0.7, 1);
  sack.position.set(-0.4 + rng() * 0.3, 1.35, 0);
  g.add(sack);
  return g;
}

function haystack(ctx: PropContext): THREE.Group {
  const g = new THREE.Group();
  const straw = litMaterial(ctx, 'straw', repeatTexture(ctx, 'straw', () => strawTexture(9).toTexture({ repeat: true })));
  const stack = mesh(new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), straw, ctx);
  stack.scale.set(1.3, 1.1, 1.1);
  g.add(stack);
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
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.2), glowMaterial('#ffb54d'));
  cage.position.set(0.58, 2.2, 0);
  cage.raycast = () => {};
  g.add(cage);
  const cap = mesh(new THREE.ConeGeometry(0.26, 0.2, 4), litMaterial(ctx, 'metal-dark', null, { color: '#2a2622', roughness: 0.7 }), ctx);
  cap.position.set(0.58, 2.5, 0);
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  ctx.lights.push({ anchor: cage, color: '#ffbf6a', intensity: 5.5, distance: 7.5, flicker: 0.12 });
  ctx.animated.push((t) => { (cage.material as THREE.MeshBasicMaterial).color.setHSL(0.09, 1, 0.62 + Math.sin(t * 7 + seed) * 0.04); });
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
    case 'tree': object = billboard(ctx, `tree-${seed % 5}`, () => drawTree(ctx.palette, seed % 5), s, true); break;
    case 'pine': object = billboard(ctx, `pine-${seed % 4}`, () => drawPine(ctx.palette, seed % 4), s, true); break;
    case 'dead_tree': object = billboard(ctx, `dead-${seed % 3}-${!!prop.burning}`, () => drawDeadTree(ctx.palette, seed % 3, !!prop.burning), s, true); break;
    case 'bush': object = billboard(ctx, `bush-${seed % 4}`, () => drawBush(ctx.palette, seed % 4), s, false); break;
    case 'fern': object = billboard(ctx, `fern-${seed % 4}`, () => drawFern(ctx.palette, seed % 4), s, false); break;
    case 'grass': object = billboard(ctx, `grass-${seed % 3}`, () => drawGrass(ctx.palette, seed % 3), s, false); break;
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
    case 'haystack': object = haystack(ctx); break;
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
