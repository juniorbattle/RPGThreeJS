import * as THREE from 'three';
import { FX_PALETTES, type FxElement, type FxPalette } from './fxPalettes';
import { createFireMaterial } from '../arena/arenaProps';
import fxSheetsJson from '../../render/generated/combatFxSheets.json';

interface FxSheetEntry { file: string; grid: [number, number]; frames: number }
/** Locally generated FX spritesheets (tools/openai-art); empty until the art mission runs. */
export const FX_SHEETS = (fxSheetsJson as { sheets: Record<string, FxSheetEntry> }).sheets;

/**
 * Procedural combat FX engine (Octopath-style: white-hot cores that bloom,
 * saturated bodies, pixel-square sparks, light that actually hits the arena).
 * Everything is generated in code, so effects exist in every build, with no
 * spritesheet dependency. All lifetimes run on "FX time", which the runtime
 * scales for hit-stop and slow motion.
 */
export interface FxHooks {
  shake(magnitude: number, duration: number): void;
  flash(color: string, opacity: number, duration?: number): void;
  sfx(id: string, options?: { volume?: number; pitch?: number; pan?: number }): void;
  /** Slow motion: FX/tween time scale for `duration` real seconds. */
  slowmo(scale: number, duration: number): void;
  speedLines(duration: number, color: string): void;
  /** Optional camera punch toward a world point. */
  punch?(point: THREE.Vector3, duration: number): void;
}

interface LiveEffect {
  update(dt: number, camera: THREE.Camera): boolean;
  dispose(): void;
}

type Vec = THREE.Vector3;

/**
 * Draw order against the combat layers (combatRenderLayers.ts): ground marks
 * stay under the unit sprites (50), everything that stands up (sparks, stars,
 * slashes, flames, beams) draws over them, under the floating text (90).
 */
const FX_LAYER = {
  groundDecal: 27, groundCircle: 28, groundRing: 29,
  volume: 75, beam: 76, billboard: 77, sparks: 78, slash: 79, projectile: 80, sheet: 81,
} as const;
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
/** Heartbeat of the seals of ultimates and boss signatures (seconds per beat). */
const PULSE_PERIOD = 0.62;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// ---------------------------------------------------------------- shaders

const RAMP_VERTEX = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/**
 * Gradient-map material: a grayscale intensity texture is mapped through the
 * palette ramp dark → edge → body → core, so one texture serves every element.
 */
function rampMaterial(map: THREE.Texture, palette: FxPalette, options: { additive?: boolean; sweep?: boolean; bands?: number } = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uCore: { value: new THREE.Color(palette.core) },
      uBody: { value: new THREE.Color(palette.body) },
      uEdge: { value: new THREE.Color(palette.edge) },
      uDark: { value: new THREE.Color(palette.dark) },
      uOpacity: { value: 1 },
      uBoost: { value: 1.25 },
      uSweep: { value: new THREE.Vector2(0, 1) },
      uBands: { value: options.bands ?? 6 },
    },
    vertexShader: RAMP_VERTEX,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uCore, uBody, uEdge, uDark; uniform float uOpacity, uBoost, uBands; uniform vec2 uSweep; varying vec2 vUv;
    void main(){
      vec4 t = texture2D(uMap, vUv);
      float i = t.r;
      // crisp tone bands instead of airbrushed gradients: edges read sharp, like the pixel decor
      if (uBands > 0.5) i = floor(i * uBands + 0.35) / uBands;
      ${options.sweep ? 'float head = uSweep.x; float tail = uSweep.y; float u = vUv.x; float k = smoothstep(tail, tail + 0.18, u) * (1.0 - smoothstep(head, head + 0.02, u)); i *= k; i = mix(i, i * 1.25, smoothstep(head - 0.25, head, u));' : ''}
      vec3 c = i > 0.78 ? mix(uBody, uCore, (i - 0.78) / 0.22) : i > 0.45 ? mix(uEdge, uBody, (i - 0.45) / 0.33) : mix(uDark, uEdge, i / 0.45);
      float a = t.a * smoothstep(0.02, 0.2, i) * uOpacity;
      if (a < 0.004) discard;
      gl_FragColor = vec4(c * uBoost, a);
    }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: options.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
    fog: false,
  });
}

const POINTS_VERTEX = `attribute vec3 aColor; attribute float aSize; attribute float aAlpha; uniform float uScale; varying vec3 vColor; varying float vAlpha;
void main(){ vColor = aColor; vAlpha = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = max(1.0, aSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }`;
const POINTS_FRAGMENT = `varying vec3 vColor; varying float vAlpha; uniform float uSoft;
void main(){ vec2 d = abs(gl_PointCoord - 0.5) * 2.0; float edge = max(d.x, d.y); float a = vAlpha * (uSoft > 0.5 ? 1.0 - smoothstep(0.2, 1.0, length(gl_PointCoord - 0.5) * 2.0) : step(edge, 0.98));
  if (a < 0.01) discard; gl_FragColor = vec4(vColor, a); }`;

// ---------------------------------------------------------------- canvas textures

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, nearest = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  if (nearest) { texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.generateMipmaps = false; }
  return texture;
}

function makeTextures() {
  const disc = canvasTexture(64, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(230,230,230,1)'); g.addColorStop(0.6, 'rgba(120,120,120,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  });
  const ring = canvasTexture(128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, s * 0.18, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.35, 'rgba(70,70,70,0.45)'); g.addColorStop(0.72, 'rgba(200,200,200,0.95)'); g.addColorStop(0.84, 'rgba(255,255,255,1)'); g.addColorStop(0.93, 'rgba(150,150,150,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  });
  const star = canvasTexture(128, (c, s) => {
    c.translate(s / 2, s / 2);
    const spikes = [[0, 1], [Math.PI / 2, 1], [Math.PI, 1], [Math.PI * 1.5, 1], [Math.PI / 4, 0.55], [Math.PI * 0.75, 0.55], [Math.PI * 1.25, 0.55], [Math.PI * 1.75, 0.55]] as const;
    for (const [a, len] of spikes) {
      c.save(); c.rotate(a);
      const g = c.createLinearGradient(0, 0, (s / 2) * len, 0);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(160,160,160,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -s * 0.05 * len); c.lineTo((s / 2) * len, 0); c.lineTo(0, s * 0.05 * len); c.closePath(); c.fill();
      c.restore();
    }
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.18);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-s / 2, -s / 2, s, s);
  });
  // Crescent: u runs along the arc (0 → 1), v across the blade (bright edge).
  const crescent = canvasTexture(128, (c, s) => {
    const img = c.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const u = x / (s - 1), v = y / (s - 1);
      const across = Math.max(0, 1 - Math.abs(v - 0.62) / (0.38 * (0.25 + Math.sin(u * Math.PI) * 0.75)));
      const blade = Math.pow(across, 1.6) * (0.35 + 0.65 * Math.sin(u * Math.PI));
      const i = (y * s + x) * 4;
      const value = Math.round(Math.min(1, blade * 1.15) * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = value;
      img.data[i + 3] = value > 6 ? 255 : 0;
    }
    c.putImageData(img, 0, 0);
  });
  const beam = canvasTexture(64, (c, s) => {
    const g = c.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(120,120,120,0.8)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(120,120,120,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    const v = c.createLinearGradient(0, 0, 0, s);
    v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.15, 'rgba(0,0,0,0)'); v.addColorStop(0.85, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = v; c.fillRect(0, 0, s, s);
  });
  // Pixel-art seal (grayscale, nearest filtered): concentric rings, a band of
  // rune glyphs, a dashed ring and dotted inner rings. Deliberately no star
  // or polygon: the circles read as runic seals, with no unwanted symbolism.
  const runes = canvasTexture(128, (c, s) => {
    const img = c.createImageData(s, s);
    const set = (x: number, y: number, v: number) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= s || y >= s) return;
      const i = (y * s + x) * 4; const val = Math.max(img.data[i] ?? 0, v);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val; img.data[i + 3] = 255;
    };
    const cx = s / 2 - 0.5, cy = s / 2 - 0.5;
    const ring = (r: number, v: number, on = (_a: number) => true) => {
      for (let a = 0; a < Math.PI * 2; a += 0.4 / r) if (on(a)) set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, v);
    };
    ring(61, 255); ring(60, 235); ring(58, 140); ring(46, 230); ring(45, 200); ring(26, 170); ring(8, 210);
    ring(41, 200, (a) => ((a / (Math.PI * 2)) * 24) % 1 < 0.6); // dashed
    ring(18, 190, (a) => ((a / (Math.PI * 2)) * 40) % 1 < 0.3); // dotted
    // rune glyphs (3×5, upright = pointing outward) between the outer rings
    const glyphs = [
      ['#.#', '#.#', '###', '..#', '..#'], ['##.', '#.#', '##.', '#.#', '##.'], ['#..', '#.#', '###', '#.#', '..#'],
      ['.##', '#..', '.#.', '..#', '##.'], ['###', '..#', '.#.', '#..', '###'], ['#.#', '.#.', '#.#', '.#.', '#.#'],
    ];
    const slots = 18;
    for (let k = 0; k < slots; k++) {
      const a = (k / slots) * Math.PI * 2;
      const rx = Math.cos(a), ry = Math.sin(a), tx = -ry, ty = rx;
      const glyph = glyphs[k % glyphs.length]!;
      glyph.forEach((row, gy) => [...row].forEach((ch, gx) => {
        if (ch === '#') set(cx + rx * (52 + 2 - gy) + tx * (gx - 1), cy + ry * (52 + 2 - gy) + ty * (gx - 1), 245);
      }));
      const b = a + Math.PI / slots; // separator dot between glyphs
      set(cx + Math.cos(b) * 52, cy + Math.sin(b) * 52, 170);
    }
    for (let k = 0; k < 12; k++) { // beads between the dashed and inner rings
      const a = (k / 12) * Math.PI * 2 + Math.PI / 12;
      const x = cx + Math.cos(a) * 34, y = cy + Math.sin(a) * 34, v = k % 2 ? 160 : 230;
      set(x, y, v); set(x + 1, y, v * 0.8); set(x - 1, y, v * 0.8); set(x, y + 1, v * 0.8); set(x, y - 1, v * 0.8);
    }
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) set(cx + x, cy + y, 240);
    c.putImageData(img, 0, 0);
  }, true);
  // Tile flash (16×16, nearest): bright rim, bevel and a soft fill, for the exact cells an action hits.
  const tile = canvasTexture(16, (c, s) => {
    const img = c.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const edge = Math.min(x, y, s - 1 - x, s - 1 - y);
      const v = edge === 0 ? 255 : edge === 1 ? 235 : edge === 2 ? 110 : 58;
      const i = (y * s + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }, true);
  return { disc, ring, star, crescent, beam, runes, tile };
}

// ---------------------------------------------------------------- engine

export interface BurstOptions {
  count?: number;
  speed?: number;
  up?: number;
  gravity?: number;
  size?: number;
  life?: number;
  spread?: number;
  soft?: boolean;
  /** Directional bias (unit vector) for sprays and breath. */
  direction?: Vec;
  cone?: number;
  colors?: string[];
  drag?: number;
  additive?: boolean;
}

export class FxEngine {
  readonly root = new THREE.Group();
  private readonly live: LiveEffect[] = [];
  private readonly scheduled: Array<{ at: number; fn: () => void }> = [];
  private readonly textures = makeTextures();
  private clock = 0;
  private readonly lights: Array<{ light: THREE.PointLight; t: number; dur: number; peak: number }>;
  reduced = false;

  constructor(private readonly scene: THREE.Scene, private readonly camera: THREE.Camera, readonly hooks: FxHooks, lightPool = 3) {
    this.root.name = 'CombatFx';
    scene.add(this.root);
    // A fixed pool of point lights keeps shader programs stable (no recompiles
    // when effects light up the arena).
    this.lights = Array.from({ length: lightPool }, () => {
      const light = new THREE.PointLight('#ffffff', 0, 9, 1.7);
      light.castShadow = false;
      this.root.add(light);
      return { light, t: 0, dur: 0, peak: 0 };
    });
  }

  get time(): number {
    return this.clock;
  }

  get activeCount(): number {
    return this.live.length;
  }

  palette(element: FxElement): FxPalette {
    return FX_PALETTES[element];
  }

  /** Runs `fn` after `delay` FX seconds. */
  after(delay: number, fn: () => void): void {
    if (delay <= 0) { fn(); return; }
    this.scheduled.push({ at: this.clock + delay, fn });
  }

  wait(delay: number): Promise<void> {
    return new Promise((resolve) => this.after(delay, resolve));
  }

  update(dt: number): void {
    this.clock += dt;
    for (let i = this.scheduled.length - 1; i >= 0; i--) {
      const job = this.scheduled[i]!;
      if (job.at <= this.clock) { this.scheduled.splice(i, 1); job.fn(); }
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const fx = this.live[i]!;
      if (!fx.update(dt, this.camera)) { fx.dispose(); this.live.splice(i, 1); }
    }
    for (const entry of this.lights) {
      if (entry.dur <= 0) continue;
      entry.t += dt;
      const k = entry.t / entry.dur;
      entry.light.intensity = k >= 1 ? 0 : entry.peak * (k < 0.12 ? k / 0.12 : Math.pow(1 - (k - 0.12) / 0.88, 1.6));
      if (k >= 1) entry.dur = 0;
    }
  }

  clear(): void {
    for (const fx of this.live.splice(0)) fx.dispose();
    this.scheduled.length = 0;
    for (const entry of this.lights) { entry.dur = 0; entry.light.intensity = 0; }
  }

  dispose(): void {
    this.clear();
    for (const t of Object.values(this.textures)) t.dispose();
    for (const t of this.sheetTextures.values()) t.dispose();
    this.root.removeFromParent();
  }

  private add(fx: LiveEffect): void {
    this.live.push(fx);
  }

  /**
   * Moves a standing effect a little toward the camera, so an effect centred
   * on a unit is drawn over its sprite instead of fighting the same depth.
   */
  private nudge(position: Vec, amount = 0.32): Vec {
    this.camera.getWorldPosition(tmpV);
    const dx = tmpV.x - position.x, dz = tmpV.z - position.z;
    const len = Math.hypot(dx, dz) || 1;
    return new THREE.Vector3(position.x + (dx / len) * amount, position.y, position.z + (dz / len) * amount);
  }

  private billboard(mesh: THREE.Object3D, camera: THREE.Camera, roll = 0): void {
    camera.getWorldQuaternion(tmpQ);
    mesh.quaternion.copy(tmpQ);
    if (roll) mesh.rotateOnAxis(Z_AXIS, roll);
  }

  // ------------------------------------------------------------ light

  light(position: Vec, color: string, intensity = 14, duration = 0.5, distance = 9): void {
    const slot = this.lights.reduce((a, b) => (a.dur <= 0 ? a : b.dur <= 0 ? b : a.t / a.dur > b.t / b.dur ? a : b));
    slot.light.position.copy(position);
    slot.light.color.set(color);
    slot.light.distance = distance;
    slot.t = 0;
    slot.dur = duration;
    slot.peak = this.reduced ? intensity * 0.6 : intensity;
  }

  // ------------------------------------------------------------ particles

  burst(position: Vec, element: FxElement, options: BurstOptions = {}): void {
    const pal = FX_PALETTES[element];
    const count = Math.max(1, Math.round((options.count ?? 24) * (this.reduced ? 0.45 : 1)));
    const colors = (options.colors ?? [pal.core, pal.body, pal.body, pal.edge]).map((c) => new THREE.Color(c));
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count);
    const vel: number[] = [], life: number[] = [], baseSize: number[] = [];
    const speed = options.speed ?? 3, up = options.up ?? 1.2, spread = options.spread ?? 0.15, cone = options.cone ?? 1;
    const dir = options.direction ? options.direction.clone().normalize() : null;
    for (let i = 0; i < count; i++) {
      const r1 = hash(i + this.clock * 13.1), r2 = hash(i * 3.7 + this.clock), r3 = hash(i * 9.1 + 4.2 + this.clock * 2);
      pos[i * 3] = position.x + (r1 - 0.5) * spread * 2;
      pos[i * 3 + 1] = position.y + (r2 - 0.5) * spread * 2;
      pos[i * 3 + 2] = position.z + (r3 - 0.5) * spread * 2;
      let vx = (r1 - 0.5) * 2, vy = r2 * up + (r3 - 0.5) * 0.4, vz = (r3 - 0.5) * 2;
      if (dir) { vx = dir.x + (r1 - 0.5) * cone; vy = dir.y + (r2 - 0.5) * cone * 0.6 + up * 0.25; vz = dir.z + (r3 - 0.5) * cone; }
      const len = Math.hypot(vx, vy, vz) || 1;
      const s = speed * (0.45 + hash(i * 1.3 + this.clock) * 0.75);
      vel.push((vx / len) * s, (vy / len) * s + (dir ? 0 : up * 0.6), (vz / len) * s);
      life.push((options.life ?? 0.7) * (0.6 + hash(i * 5.3) * 0.6));
      const c = colors[i % colors.length]!;
      col[i * 3] = c.r * 1.6; col[i * 3 + 1] = c.g * 1.6; col[i * 3 + 2] = c.b * 1.6;
      baseSize.push((options.size ?? 0.11) * (0.6 + hash(i * 7.7) * 0.8));
      size[i] = baseSize[i]!; alpha[i] = 1;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 900 }, uSoft: { value: options.soft ? 1 : 0 } },
      vertexShader: POINTS_VERTEX, fragmentShader: POINTS_FRAGMENT,
      // Hard sparks are opaque pixels (bright values still bloom): they stay
      // readable over a sunlit forest, where additive sparks wash out.
      transparent: true, depthWrite: false, blending: (options.additive ?? options.soft ?? false) ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, fog: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = FX_LAYER.sparks;
    this.root.add(points);
    const gravity = options.gravity ?? 4, drag = options.drag ?? 1.6;
    let t = 0;
    const maxLife = Math.max(...life);
    this.add({
      update: (dt) => {
        t += dt;
        const damp = Math.exp(-drag * dt);
        for (let i = 0; i < count; i++) {
          const k = t / life[i]!;
          if (k >= 1) { alpha[i] = 0; continue; }
          vel[i * 3]! *= damp; vel[i * 3 + 2]! *= damp; vel[i * 3 + 1] = vel[i * 3 + 1]! * damp - gravity * dt;
          pos[i * 3]! += vel[i * 3]! * dt; pos[i * 3 + 1]! += vel[i * 3 + 1]! * dt; pos[i * 3 + 2]! += vel[i * 3 + 2]! * dt;
          alpha[i] = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
          size[i] = baseSize[i]! * (1 - k * 0.5);
        }
        geometry.attributes.position!.needsUpdate = true;
        geometry.attributes.aAlpha!.needsUpdate = true;
        geometry.attributes.aSize!.needsUpdate = true;
        return t < maxLife;
      },
      dispose: () => { this.root.remove(points); geometry.dispose(); material.dispose(); },
    });
  }

  /** Slow rising motes (healing, holy, dark wisps, embers). */
  motes(position: Vec, element: FxElement, options: { count?: number; radius?: number; rise?: number; life?: number; size?: number; sink?: boolean } = {}): void {
    const radius = options.radius ?? 0.6;
    const count = options.count ?? 22;
    for (let i = 0; i < 2; i++) {
      this.after(i * 0.12, () => this.burst(position.clone().add(new THREE.Vector3(0, options.sink ? 1.6 : 0.1, 0)), element, {
        count: Math.round(count / 2), speed: 0.35, up: options.sink ? -1.2 : options.rise ?? 2.2, gravity: options.sink ? 0.6 : -0.4, spread: radius,
        life: options.life ?? 1.3, size: options.size ?? 0.09, drag: 0.6, soft: true,
      }));
    }
  }

  smoke(position: Vec, options: { count?: number; color?: string; size?: number; life?: number; spread?: number } = {}): void {
    this.burst(position, 'smoke', {
      count: options.count ?? 14, speed: 0.9, up: 1.1, gravity: -0.3, spread: options.spread ?? 0.35,
      life: options.life ?? 1.2, size: options.size ?? 0.55, drag: 2.2, soft: true, additive: false,
      colors: [options.color ?? '#3a3440', '#4a4452', '#2a2630'],
    });
  }

  // ------------------------------------------------------------ billboards

  private rampBillboard(map: THREE.Texture, element: FxElement, width: number, height: number, position: Vec, options: {
    duration: number; grow?: [number, number]; roll?: number; spin?: number; fadeIn?: number; boost?: number; additive?: boolean;
    onUpdate?: (k: number, mesh: THREE.Mesh, material: THREE.ShaderMaterial) => void; sweep?: boolean; follow?: () => Vec;
  }): THREE.Mesh {
    const material = rampMaterial(map, FX_PALETTES[element], { additive: options.additive, sweep: options.sweep });
    material.uniforms.uBoost!.value = options.boost ?? 1.25;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.copy(options.follow ? position : this.nudge(position));
    mesh.renderOrder = FX_LAYER.billboard;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    let t = 0;
    const [g0, g1] = options.grow ?? [1, 1];
    const fadeIn = options.fadeIn ?? 0.08;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / options.duration;
        if (options.follow) mesh.position.copy(options.follow());
        this.billboard(mesh, camera, (options.roll ?? 0) + (options.spin ?? 0) * t);
        mesh.scale.setScalar(g0 + (g1 - g0) * easeOut(k));
        material.uniforms.uOpacity!.value = (k < fadeIn ? k / fadeIn : 1) * (1 - Math.pow(clamp01((k - 0.45) / 0.55), 1.4));
        options.onUpdate?.(k, mesh, material);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
    return mesh;
  }

  impactStar(position: Vec, element: FxElement, size = 1.4, duration = 0.28): void {
    const roll = hash(this.clock) * Math.PI;
    // dark backing: the star keeps a silhouette on bright ground
    this.rampBillboard(this.textures.star, element, size * 1.12, size * 1.12, position, { duration: duration * 0.9, grow: [0.35, 1.25], roll, fadeIn: 0.05, boost: 0.32, additive: false });
    this.rampBillboard(this.textures.star, element, size, size, position, { duration, grow: [0.35, 1.25], roll, fadeIn: 0.05, boost: 2.0 });
    this.rampBillboard(this.textures.disc, element, size * 0.8, size * 0.8, position, { duration: duration * 0.8, grow: [0.6, 1.4], fadeIn: 0.02, boost: 1.2 });
  }

  glow(position: Vec, element: FxElement, size = 2, duration = 0.5, follow?: () => Vec): void {
    this.rampBillboard(this.textures.disc, element, size, size, position, { duration, grow: [0.7, 1.1], fadeIn: 0.25, boost: 1.0, follow });
  }

  /** Sweeping crescent slash in screen space, rolled by `angle` (radians). */
  slash(position: Vec, element: FxElement, options: { angle?: number; size?: number; duration?: number; flip?: boolean; thickness?: number; under?: boolean; dark?: boolean } = {}): void {
    const size = options.size ?? 2.2, duration = options.duration ?? 0.32;
    const thickness = options.thickness ?? 0.8;
    // A dark, slightly larger blade under the bright one carves the arc into
    // any background (sunlit stone, snow, fire).
    if (options.under !== false) this.slash(position, element, { ...options, size: size * 1.07, thickness: thickness * 1.25, under: false, dark: true });
    const geometry = new THREE.RingGeometry(size * (0.5 - thickness * 0.25), size * 0.5, 40, 1, Math.PI * 0.08, Math.PI * 0.84);
    // remap uv: u along arc, v across the blade
    const uv = geometry.attributes.uv as THREE.BufferAttribute;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const inner = size * (0.5 - thickness * 0.25), outer = size * 0.5;
    for (let i = 0; i < uv.count; i++) {
      const x = posAttr.getX(i), y = posAttr.getY(i);
      const a = Math.atan2(y, x), r = Math.hypot(x, y);
      uv.setXY(i, clamp01((a - Math.PI * 0.08) / (Math.PI * 0.84)), clamp01((r - inner) / (outer - inner)));
    }
    // the blade's apex, not the arc's centre, sits on the anchor: the cut
    // crosses the target instead of hovering above it like a halo
    geometry.translate(0, -(inner + outer) / 2, 0);
    const dark = options.dark === true;
    const material = rampMaterial(this.textures.crescent, FX_PALETTES[element], { sweep: true, additive: !dark });
    material.uniforms.uBoost!.value = dark ? 0.28 : 2.1;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.nudge(position, 0.4));
    mesh.renderOrder = dark ? FX_LAYER.billboard : FX_LAYER.slash;
    mesh.frustumCulled = false;
    if (options.flip) mesh.scale.x = -1;
    this.root.add(mesh);
    const roll = options.angle ?? (hash(this.clock * 3) - 0.5) * 1.2;
    let t = 0;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / duration;
        this.billboard(mesh, camera, roll);
        if (options.flip) mesh.scale.x = -1;
        const head = easeOut(Math.min(1, k * 1.6)) * 1.05;
        const tail = Math.max(0, (k - 0.25) / 0.75) * 1.05;
        material.uniforms.uSweep!.value.set(head, tail);
        material.uniforms.uOpacity!.value = (k > 0.8 ? (1 - k) / 0.2 : 1) * (dark ? 0.7 : 1);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); geometry.dispose(); material.dispose(); },
    });
  }

  // ------------------------------------------------------------ ground & volumes

  ring(position: Vec, element: FxElement, options: { radius?: number; duration?: number; ground?: boolean; from?: number; boost?: number } = {}): void {
    const radius = options.radius ?? 1.6, duration = options.duration ?? 0.5;
    const material = rampMaterial(this.textures.ring, FX_PALETTES[element]);
    material.uniforms.uBoost!.value = options.boost ?? 2.3;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.position.copy(position);
    if (options.ground !== false) { mesh.rotation.x = -Math.PI / 2; mesh.position.y = Math.max(position.y, 0.06); }
    mesh.renderOrder = FX_LAYER.groundRing;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    let t = 0;
    const from = options.from ?? 0.15;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / duration;
        if (options.ground === false) this.billboard(mesh, camera);
        mesh.scale.setScalar(radius * (from + (1 - from) * easeOut(k)));
        material.uniforms.uOpacity!.value = 1 - Math.pow(clamp01(k), 2);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
  }

  /**
   * Rotating pixel-rune seal on the ground. `pulse` (ultimates and boss
   * signatures only) gives it a heartbeat: two quick flares per beat, each
   * sending a ring of light out from the seal's rim.
   */
  circle(position: Vec, element: FxElement, options: { radius?: number; duration?: number; spin?: number; pulse?: boolean } = {}): void {
    const radius = options.radius ?? 1.3, duration = options.duration ?? 1.1;
    const material = rampMaterial(this.textures.runes, FX_PALETTES[element]);
    material.uniforms.uBoost!.value = 2.1;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, Math.max(0.05, position.y + 0.05), position.z);
    mesh.renderOrder = FX_LAYER.groundCircle;
    this.root.add(mesh);
    let t = 0, beats = 0;
    const spin = options.spin ?? 1.2;
    const period = PULSE_PERIOD;
    this.add({
      update: (dt) => {
        t += dt;
        const k = t / duration;
        mesh.rotation.z += spin * dt;
        let grow = 0.4 + 0.6 * easeOut(Math.min(1, k * 3));
        let boost = 2.1;
        if (options.pulse && k > 0.12 && k < 0.85) {
          const phase = (t % period) / period;
          const flare = Math.exp(-Math.pow(phase / 0.06, 2)) + 0.7 * Math.exp(-Math.pow((phase - 0.22) / 0.06, 2));
          boost += flare * 1.8;
          grow *= 1 + flare * 0.035;
          const beat = Math.floor(t / period);
          if (beat > beats) {
            beats = beat;
            this.ring(new THREE.Vector3(position.x, Math.max(0.06, position.y + 0.06), position.z), element, { radius: radius * 1.55, duration: 0.6, from: 0.72, boost: 1.7 });
          }
        }
        mesh.scale.setScalar(grow);
        material.uniforms.uBoost!.value = boost;
        material.uniforms.uOpacity!.value = (k < 0.15 ? k / 0.15 : 1) * (k > 0.75 ? (1 - k) / 0.25 : 1);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
  }

  /** Column of light falling from the sky onto a point. */
  pillar(position: Vec, element: FxElement, options: { radius?: number; height?: number; duration?: number } = {}): void {
    const radius = options.radius ?? 0.55, height = options.height ?? 9, duration = options.duration ?? 0.8;
    const material = rampMaterial(this.textures.beam, FX_PALETTES[element]);
    material.uniforms.uBoost!.value = 1.6;
    const geometry = new THREE.PlaneGeometry(radius * 2, height);
    geometry.translate(0, height / 2, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.nudge(position, 0.25)).setY(Math.max(0, position.y - 0.05));
    mesh.renderOrder = FX_LAYER.beam;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / duration;
        camera.getWorldPosition(tmpV);
        mesh.rotation.y = Math.atan2(tmpV.x - mesh.position.x, tmpV.z - mesh.position.z);
        const w = k < 0.15 ? 0.2 + (k / 0.15) * 1.2 : 1.4 - (k - 0.15) * 1.4;
        mesh.scale.set(Math.max(0.05, w), k < 0.1 ? k / 0.1 : 1, 1);
        material.uniforms.uOpacity!.value = k > 0.6 ? (1 - k) / 0.4 : 1;
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); geometry.dispose(); material.dispose(); },
    });
  }

  /** Flash streak between two points (thrusts, lances, dashes). */
  streak(from: Vec, to: Vec, element: FxElement, options: { width?: number; duration?: number } = {}): void {
    const width = options.width ?? 0.35, duration = options.duration ?? 0.25;
    const length = from.distanceTo(to);
    const material = rampMaterial(this.textures.beam, FX_PALETTES[element]);
    material.uniforms.uBoost!.value = 1.7;
    const geometry = new THREE.PlaneGeometry(width, length);
    const mesh = new THREE.Mesh(geometry, material);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mesh.position.copy(mid);
    mesh.renderOrder = FX_LAYER.slash;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    const axis = to.clone().sub(from).normalize();
    let t = 0;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / duration;
        // Plane: long side along the axis, face turned toward the camera.
        camera.getWorldPosition(tmpV);
        const toCam = tmpV.sub(mid).normalize();
        const side = new THREE.Vector3().crossVectors(axis, toCam).normalize();
        const normal = new THREE.Vector3().crossVectors(side, axis).normalize();
        mesh.matrix.makeBasis(side, axis, normal).setPosition(mid);
        mesh.matrixAutoUpdate = false;
        mesh.matrix.scale(new THREE.Vector3(k < 0.2 ? 0.4 + k * 3 : 1 - (k - 0.2) * 1.1, 1, 1));
        material.uniforms.uOpacity!.value = 1 - Math.pow(clamp01(k), 1.5);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); geometry.dispose(); material.dispose(); },
    });
  }

  /** Orb flying from → to (optional arc); resolves on arrival. */
  projectile(from: Vec, to: Vec, element: FxElement, options: { size?: number; speed?: number; arc?: number; trail?: boolean; streak?: boolean } = {}): Promise<void> {
    const size = options.size ?? 0.7, speed = options.speed ?? 14, arc = options.arc ?? 0.6;
    const distance = from.distanceTo(to);
    const duration = Math.max(0.12, distance / speed);
    const pos = from.clone();
    return new Promise((resolve) => {
      const material = rampMaterial(this.textures.disc, FX_PALETTES[element]);
      material.uniforms.uBoost!.value = 1.8;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, options.streak ? size * 0.32 : size), material);
      mesh.renderOrder = FX_LAYER.projectile;
      mesh.frustumCulled = false;
      this.root.add(mesh);
      const dir = to.clone().sub(from);
      let t = 0, trailClock = 0, done = false;
      this.add({
        update: (dt, camera) => {
          t += dt;
          const k = Math.min(1, t / duration);
          pos.copy(from).lerp(to, k);
          pos.y += Math.sin(k * Math.PI) * arc * distance * 0.12;
          mesh.position.copy(pos);
          // streaks (arrows, bolts) roll along their screen-space direction
          const screenA = pos.clone().project(camera), screenB = pos.clone().add(dir.clone().multiplyScalar(0.01)).project(camera);
          this.billboard(mesh, camera, options.streak ? Math.atan2(screenB.y - screenA.y, screenB.x - screenA.x) : t * 6);
          trailClock += dt;
          if (options.trail !== false && trailClock > 0.03) {
            trailClock = 0;
            this.burst(pos.clone(), element, { count: 3, speed: 0.4, up: 0.2, gravity: 0.5, life: 0.35, size: size * 0.16, spread: size * 0.15 });
          }
          if (k >= 1 && !done) { done = true; resolve(); }
          return k < 1;
        },
        dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); if (!done) { done = true; resolve(); } },
      });
    });
  }

  /** Jagged lightning bolt from the sky (or `from`) to a point, flickering. */
  bolt(to: Vec, element: FxElement, options: { from?: Vec; duration?: number; width?: number; branches?: number } = {}): void {
    const from = options.from ?? to.clone().add(new THREE.Vector3((hash(this.clock) - 0.5) * 2, 9, -1));
    const duration = options.duration ?? 0.35;
    let regen = 0;
    const make = () => {
      const segments = 9;
      const points: Vec[] = [];
      for (let i = 0; i <= segments; i++) {
        const p = from.clone().lerp(to, i / segments);
        if (i > 0 && i < segments) p.add(new THREE.Vector3((hash(i + this.clock * 31) - 0.5) * 0.9, 0, (hash(i * 2 + this.clock * 17) - 0.5) * 0.5));
        points.push(p);
      }
      return points;
    };
    const group = new THREE.Group();
    this.root.add(group);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(FX_PALETTES[element].core).multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const glowMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(FX_PALETTES[element].edge).multiplyScalar(1.4), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const build = () => {
      for (const child of [...group.children]) { group.remove(child); (child as THREE.Mesh).geometry.dispose(); }
      const pts = make();
      const width = options.width ?? 0.07;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!, b = pts[i + 1]!;
        const len = a.distanceTo(b);
        for (const [mat, w] of [[material, width], [glowMaterial, width * 4]] as const) {
          const seg = new THREE.Mesh(new THREE.CylinderGeometry(w, w, len, 5, 1, true), mat);
          seg.position.copy(a).add(b).multiplyScalar(0.5);
          seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
          seg.renderOrder = FX_LAYER.projectile;
          group.add(seg);
        }
      }
    };
    build();
    let t = 0;
    this.add({
      update: (dt) => {
        t += dt; regen += dt;
        if (regen > 0.05) { regen = 0; build(); }
        const k = t / duration;
        const flicker = 0.6 + hash(t * 97) * 0.4;
        material.opacity = (1 - k) * flicker;
        glowMaterial.opacity = 0.35 * (1 - k) * flicker;
        return k < 1;
      },
      dispose: () => { for (const child of group.children) (child as THREE.Mesh).geometry.dispose(); this.root.remove(group); material.dispose(); glowMaterial.dispose(); },
    });
  }

  /** Crystal or stone spikes erupting from the ground. */
  shards(position: Vec, element: FxElement, options: { count?: number; radius?: number; height?: number; duration?: number } = {}): void {
    const count = options.count ?? 7, radius = options.radius ?? 0.8, height = options.height ?? 1.4, duration = options.duration ?? 0.9;
    const pal = FX_PALETTES[element];
    const group = new THREE.Group();
    group.position.copy(position);
    group.position.y = 0;
    this.root.add(group);
    const solid = new THREE.MeshStandardMaterial({ color: pal.body, emissive: pal.edge, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92, flatShading: true });
    const meshes: Array<{ mesh: THREE.Mesh; h: number }> = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + hash(i + this.clock) * 0.6;
      const r = i === 0 ? 0 : radius * (0.4 + hash(i * 3.1) * 0.6);
      const h = height * (i === 0 ? 1.25 : 0.55 + hash(i * 1.7) * 0.5);
      const geometry = new THREE.ConeGeometry(0.16 + hash(i) * 0.12, 1, 5);
      geometry.translate(0, 0.5, 0);
      const m = new THREE.Mesh(geometry, solid);
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      m.rotation.set((hash(i * 4.4) - 0.5) * 0.6, a, (hash(i * 6.6) - 0.5) * 0.6);
      m.scale.set(1, 0.01, 1);
      group.add(m);
      meshes.push({ mesh: m, h });
    }
    let t = 0;
    this.add({
      update: (dt) => {
        t += dt;
        const k = t / duration;
        const rise = easeOut(Math.min(1, k * 5));
        for (const { mesh, h } of meshes) mesh.scale.set(1, Math.max(0.01, h * rise * (k > 0.75 ? 1 - (k - 0.75) * 2 : 1)), 1);
        solid.opacity = k > 0.75 ? 0.92 * (1 - (k - 0.75) / 0.25) : 0.92;
        return k < 1;
      },
      dispose: () => { for (const { mesh } of meshes) mesh.geometry.dispose(); solid.dispose(); this.root.remove(group); },
    });
  }

  /** Fresnel shield bubble around a point. */
  dome(position: Vec, element: FxElement, options: { radius?: number; duration?: number } = {}): void {
    const radius = options.radius ?? 1.1, duration = options.duration ?? 1.0;
    const pal = FX_PALETTES[element];
    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(pal.body) }, uCore: { value: new THREE.Color(pal.core) }, uOpacity: { value: 0 }, uTime: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vP = position; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform vec3 uColor, uCore; uniform float uOpacity, uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); float hex = step(0.92, fract((vP.y * 6.0 + atan(vP.z, vP.x) * 3.0) + uTime * 0.4)); float a = (f * 0.9 + hex * 0.25) * uOpacity; if (a < 0.01) discard; gl_FragColor = vec4(mix(uColor, uCore, f) * 1.4, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), material);
    mesh.position.set(position.x, Math.max(0, position.y - 0.05), position.z);
    mesh.renderOrder = FX_LAYER.volume;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt) => {
        t += dt;
        const k = t / duration;
        mesh.scale.setScalar(radius * (0.3 + 0.7 * easeOut(Math.min(1, k * 4))));
        material.uniforms.uTime!.value = t;
        material.uniforms.uOpacity!.value = (k < 0.15 ? k / 0.15 : 1) * (k > 0.7 ? (1 - k) / 0.3 : 1);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
  }

  /** Energy sphere that grows (explode) or collapses (implode). */
  orb(position: Vec, element: FxElement, options: { radius?: number; duration?: number; implode?: boolean; dark?: boolean } = {}): void {
    const radius = options.radius ?? 1.4, duration = options.duration ?? 0.6;
    this.rampBillboard(this.textures.disc, element, radius * 2, radius * 2, position, {
      duration,
      grow: options.implode ? [1.3, 0.05] : [0.2, 1.2],
      fadeIn: options.implode ? 0.3 : 0.04,
      boost: options.dark ? 0.9 : 1.5,
      additive: !options.dark,
    });
    if (options.dark) {
      // void core: a normal-blended near-black disc inside the glow
      this.rampBillboard(this.textures.disc, 'smoke', radius * 1.2, radius * 1.2, position, { duration, grow: options.implode ? [1.2, 0.05] : [0.2, 1], fadeIn: 0.2, boost: 0.25, additive: false });
    }
  }

  /** Short-lived column of pixel fire. */
  flame(position: Vec, options: { width?: number; height?: number; duration?: number } = {}): void {
    const width = options.width ?? 1.2, height = options.height ?? 2.4, duration = options.duration ?? 0.9;
    const material = createFireMaterial(hash(this.clock) * 10, [Math.max(10, Math.round(width * 16)), Math.max(14, Math.round(height * 16))]);
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.translate(0, height / 2, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.nudge(position, 0.34)).setY(Math.max(0, position.y - 0.05));
    mesh.renderOrder = FX_LAYER.beam;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const k = t / duration;
        camera.getWorldPosition(tmpV);
        mesh.rotation.y = Math.atan2(tmpV.x - mesh.position.x, tmpV.z - mesh.position.z);
        material.uniforms.uTime!.value = t * 1.6;
        material.uniforms.uPower!.value = k < 0.15 ? k / 0.15 * 1.2 : 1.2 - (k - 0.15) * 1.3;
        mesh.scale.set(1, 0.5 + easeOut(Math.min(1, k * 4)) * 0.6, 1);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); geometry.dispose(); material.dispose(); },
    });
  }

  private readonly sheetTextures = new Map<string, THREE.Texture>();

  /** Additive frame-sheet effect (generated art) layered over the procedural FX. */
  sheet(position: Vec, id: string, options: { size?: number; duration?: number } = {}): boolean {
    const entry = FX_SHEETS[id];
    if (!entry || this.reduced) return false;
    let texture = this.sheetTextures.get(id);
    if (!texture) {
      texture = new THREE.TextureLoader().load(entry.file);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.sheetTextures.set(id, texture);
    }
    const [cols, rows] = entry.grid;
    const map = texture.clone();
    map.repeat.set(1 / cols, 1 / rows);
    map.needsUpdate = true;
    const size = options.size ?? 3, duration = options.duration ?? 0.8;
    const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    mesh.position.copy(position);
    mesh.renderOrder = FX_LAYER.sheet;
    mesh.frustumCulled = false;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt, camera) => {
        t += dt;
        const frame = Math.min(entry.frames - 1, Math.floor((t / duration) * entry.frames));
        map.offset.set((frame % cols) / cols, 1 - (Math.floor(frame / cols) + 1) / rows);
        this.billboard(mesh, camera);
        return t < duration;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); map.dispose(); },
    });
    return true;
  }

  /** Flashes one battle-grid cell: the exact tiles an action hits light up under the effect. */
  cellFlash(position: Vec, element: FxElement, options: { size?: number; duration?: number } = {}): void {
    const size = options.size ?? 1.1, duration = options.duration ?? 0.5;
    const material = rampMaterial(this.textures.tile, FX_PALETTES[element], { bands: 0 });
    material.uniforms.uBoost!.value = 2.6;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, 0.045, position.z);
    mesh.renderOrder = FX_LAYER.groundDecal;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt) => {
        t += dt;
        const k = t / duration;
        mesh.scale.setScalar(1 + easeOut(k) * 0.05);
        material.uniforms.uOpacity!.value = (k < 0.08 ? k / 0.08 : 1) * (k > 0.45 ? Math.max(0, 1 - (k - 0.45) / 0.55) : 1);
        return k < 1;
      },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
  }

  /** Scorch / crack decal on the floor that lingers a moment. */
  decal(position: Vec, element: FxElement, options: { radius?: number; duration?: number } = {}): void {
    const radius = options.radius ?? 1, duration = options.duration ?? 2.2;
    const material = new THREE.MeshBasicMaterial({ map: this.textures.disc, color: FX_PALETTES[element].dark, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, 0.04, position.z);
    mesh.renderOrder = FX_LAYER.groundDecal;
    this.root.add(mesh);
    let t = 0;
    this.add({
      update: (dt) => { t += dt; const k = t / duration; material.opacity = 0.6 * (1 - k); return k < 1; },
      dispose: () => { this.root.remove(mesh); mesh.geometry.dispose(); material.dispose(); },
    });
  }
}
