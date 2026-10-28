import * as THREE from 'three';
import { makeNoise, seeded } from './pixelArt';
import { arenaBandProps, arenaClutterProps, arenaThemeFor, type ArenaTheme } from './arenaThemes';
import { groundTexture, tileSideTexture, tileTopTexture } from './arenaTextures';
import { buildProp, type PropContext } from './arenaProps';
import { drawFern, drawGrass, DECOR_TEXELS_PER_UNIT } from './arenaSprites';
import platesJson from '../../render/generated/combatArenaPlates.json';

interface GeneratedPlate { file: string; aspect: number; width: number; z: number; bottomY: number }
/** Locally generated arena layers (tools/openai-art); empty until the art mission runs. */
const GENERATED_PLATES = (platesJson as { plates: Record<string, { mid?: GeneratedPlate }> }).plates;

export interface CombatArenaOptions {
  sceneId: string;
  columns: number;
  rows: number;
  tile: number;
  reducedGraphics?: boolean;
  /** Maximum dynamic point lights kept from the prop requests. */
  maxLights?: number;
}

export interface ArenaLightTargets {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
}

const TILE_VARIANTS = 6;
const _camWorld = new THREE.Vector3();
const _objWorld = new THREE.Vector3();
const _parentQuat = new THREE.Quaternion();
const _euler = new THREE.Euler();

/**
 * Procedural HD-2D combat arena: a raised 8×4 slab platform whose joints are
 * the tactical grid, a pixel-textured ground, 3D architecture, pixel-art
 * vegetation billboards, flickering fire light and a painted far plate.
 * Gameplay is untouched: every tile top stays at y = 0.
 */
export class CombatArena {
  readonly root = new THREE.Group();
  readonly theme: ArenaTheme;
  private readonly ctx: PropContext;
  private readonly lights: Array<{ light: THREE.PointLight; base: number; flicker: number; phase: number }> = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private farPlate: THREE.Mesh | null = null;
  private lightTargets: ArenaLightTargets | null = null;
  private baseIntensity = { hemi: 1, sun: 1, fill: 1 };
  private dim = { value: 1, from: 1, to: 1, t: 0, duration: 0 };

  constructor(private readonly options: CombatArenaOptions) {
    this.theme = arenaThemeFor(options.sceneId);
    this.root.name = `CombatArena:${this.theme.id}`;
    const reduced = Boolean(options.reducedGraphics);
    this.ctx = {
      palette: this.theme.palette,
      reduced,
      textures: new Map(),
      materials: new Map(),
      billboards: [],
      animated: [],
      lights: [],
      sprites: new Map(),
      shadows: true,
    };
  }

  get platformSize(): { width: number; depth: number } {
    return { width: this.options.columns * this.options.tile, depth: this.options.rows * this.options.tile };
  }

  async build(): Promise<void> {
    this.buildPlatform();
    this.buildGround();
    this.buildEdgeVegetation();
    const bandRng = seeded(5150 + this.theme.id.length * 13);
    const midPlate = GENERATED_PLATES[this.theme.id]?.mid;
    // A generated mid-ground frieze replaces the procedural band.
    const band = this.ctx.reduced || midPlate ? [] : arenaBandProps(this.theme, bandRng);
    const clutter = this.ctx.reduced ? [] : arenaClutterProps(this.theme, seeded(6262 + this.theme.id.length * 7));
    for (const prop of [...this.theme.props, ...band, ...clutter]) {
      if (this.ctx.reduced && (prop.kind === 'grass' || prop.kind === 'fern' || prop.kind === 'smoke')) continue;
      const object = buildProp(this.ctx, prop);
      if (object) this.root.add(object);
    }
    this.root.updateMatrixWorld(true);
    this.buildLights();
    await this.buildFarPlate();
    if (midPlate) await this.buildMidPlate(midPlate);
  }

  private async buildMidPlate(plate: GeneratedPlate): Promise<void> {
    if (typeof window === 'undefined' || /happy-dom/i.test(window.navigator?.userAgent ?? '')) return;
    try {
      const texture = await new THREE.TextureLoader().loadAsync(plate.file);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.ctx.textures.set('mid-plate', texture);
      const height = plate.width * plate.aspect;
      const geometry = new THREE.PlaneGeometry(plate.width, height);
      this.geometries.push(geometry);
      const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, transparent: false, fog: true, color: '#e6e6e6' });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, plate.bottomY + height / 2, plate.z);
      mesh.raycast = () => {};
      mesh.name = 'arena-mid-plate';
      this.root.add(mesh);
    } catch (error) {
      console.warn('Plan intermédiaire indisponible', plate.file, error);
    }
  }

  // ------------------------------------------------------------ platform

  private buildPlatform(): void {
    const { columns, rows, tile } = this.options;
    const { width, depth } = this.platformSize;
    const pal = this.theme.palette;
    const sideTexture = tileSideTexture(this.theme.tile, pal).toTexture({ repeat: true });
    this.ctx.textures.set('tile-side', sideTexture);

    // Grout bed: the dark joints between slabs read as the tactical grid.
    const bedGeo = new THREE.BoxGeometry(width + 0.08, 0.5, depth + 0.08);
    this.geometries.push(bedGeo);
    const bedMat = new THREE.MeshStandardMaterial({ color: pal.stoneDark[0], roughness: 1 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.y = -0.25 - 0.045;
    bed.receiveShadow = true;
    bed.raycast = () => {};
    bed.name = 'arena-grout-bed';
    this.root.add(bed);

    const slabGeo = new THREE.BoxGeometry(tile * 0.955, 0.07, tile * 0.955);
    this.geometries.push(slabGeo);
    const rng = seeded(4242 + this.theme.id.length * 97);
    const buckets: Array<Array<[number, number, number]>> = Array.from({ length: TILE_VARIANTS }, () => []);
    for (let gx = 0; gx < columns; gx++) for (let gz = 0; gz < rows; gz++) {
      const variant = Math.floor(rng() * TILE_VARIANTS);
      buckets[variant]?.push([gx, gz, (rng() - 0.5) * 0.012]);
    }
    const dummy = new THREE.Object3D();
    buckets.forEach((cells, variant) => {
      if (!cells.length) return;
      const top = tileTopTexture(this.theme.tile, pal, 900 + variant * 31 + this.theme.id.length).toTexture();
      this.ctx.textures.set(`tile-top-${variant}`, top);
      const topMat = new THREE.MeshStandardMaterial({ map: top, roughness: this.theme.tile === 'sanctum_marble' ? 0.62 : 0.94, metalness: 0 });
      const sideMat = new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.95 });
      const instanced = new THREE.InstancedMesh(slabGeo, [sideMat, sideMat, topMat, sideMat, sideMat, sideMat], cells.length);
      cells.forEach(([gx, gz, lift], i) => {
        dummy.position.set((gx - (columns - 1) / 2) * tile, -0.035 + lift, (gz - (rows - 1) / 2) * tile);
        dummy.rotation.set(0, (Math.floor(rng() * 4) * Math.PI) / 2, 0);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      });
      instanced.instanceMatrix.needsUpdate = true;
      instanced.receiveShadow = true;
      instanced.raycast = () => {};
      instanced.name = `arena-tiles-${variant}`;
      this.root.add(instanced);
    });

    // Curb: a ring of dressed stones framing the field of battle.
    const curbMat = new THREE.MeshStandardMaterial({ map: sideTexture, color: '#d8d2c6', roughness: 0.95 });
    const curbH = 0.22, curbW = 0.26;
    const curbs: Array<[number, number, number, number]> = [
      [0, -(depth / 2 + curbW / 2 + 0.02), width + curbW * 2 + 0.04, curbW],
      [0, depth / 2 + curbW / 2 + 0.02, width + curbW * 2 + 0.04, curbW],
      [-(width / 2 + curbW / 2 + 0.02), 0, curbW, depth],
      [width / 2 + curbW / 2 + 0.02, 0, curbW, depth],
    ];
    for (const [x, z, w, d] of curbs) {
      const geo = new THREE.BoxGeometry(w, curbH, d);
      this.geometries.push(geo);
      const curb = new THREE.Mesh(geo, curbMat);
      curb.position.set(x, -0.1 + curbH / 2 - 0.06, z);
      curb.castShadow = true;
      curb.receiveShadow = true;
      curb.raycast = () => {};
      this.root.add(curb);
    }
  }

  // ------------------------------------------------------------ ground

  private buildGround(): void {
    const texture = groundTexture(this.theme.ground, this.theme.palette, 11 + this.theme.id.length).toTexture({ repeat: true });
    this.ctx.textures.set('ground', texture);
    const width = 96, depth = 74;
    texture.repeat.set(width / 4, depth / 4);
    const geometry = new THREE.PlaneGeometry(width, depth, 64, 48);
    this.geometries.push(geometry);
    // Large-scale light/shade so the repeating texel pattern never reads as a carpet:
    // soft noise patches, a darker band hugging the platform and a falloff toward the fog.
    const rng = seeded(311 + this.theme.id.length);
    const noise = makeNoise(rng, 8);
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const { width: pw, depth: pd } = this.platformSize;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = -pos.getY(i) - 16;
      let k = 0.78 + (noise(x / 9 + 4, z / 9 + 4) - 0.5) * 0.5;
      const dx = Math.max(0, Math.abs(x) - pw / 2), dz = Math.max(0, Math.abs(z) - pd / 2);
      const edge = Math.hypot(dx, dz);
      if (edge < 1.4) k *= 0.72 + edge * 0.2;
      k *= 1 - Math.min(0.25, Math.max(0, -z - 6) * 0.012);
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = Math.max(0.35, Math.min(1.15, k));
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, vertexColors: true });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.16, -16);
    ground.receiveShadow = true;
    ground.raycast = () => {};
    ground.name = 'arena-ground';
    this.root.add(ground);
  }

  /** Grass and ferns hugging the curb so the platform grows out of the ground. */
  private buildEdgeVegetation(): void {
    if (this.ctx.reduced) return;
    const { width, depth } = this.platformSize;
    const rng = seeded(77 + this.theme.id.length);
    const grassKey = 'edge-grass';
    const grass = drawGrass(this.theme.palette, 2);
    const fern = drawFern(this.theme.palette, 1);
    const grassTex = grass.canvas.toTexture();
    const fernTex = fern.canvas.toTexture();
    this.ctx.textures.set(grassKey, grassTex);
    this.ctx.textures.set('edge-fern', fernTex);
    const make = (sprite: typeof grass, texture: THREE.Texture, scale: number) => {
      const w = sprite.canvas.width / DECOR_TEXELS_PER_UNIT * scale, h = sprite.canvas.height / DECOR_TEXELS_PER_UNIT * scale;
      const geo = new THREE.PlaneGeometry(w, h);
      geo.translate(0, h / 2 - (sprite.canvas.height - sprite.anchor[1]) / DECOR_TEXELS_PER_UNIT * scale, 0);
      this.geometries.push(geo);
      const mat = new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat);
      m.raycast = () => {};
      this.ctx.billboards.push(m);
      return m;
    };
    const count = 34;
    for (let i = 0; i < count; i++) {
      const edge = Math.floor(rng() * 4);
      const t = rng() - 0.5;
      const out = 0.3 + rng() * 0.6;
      let x = 0, z = 0;
      if (edge === 0) { x = t * (width + 1); z = -(depth / 2 + out); }
      else if (edge === 1) { x = t * (width + 1); z = depth / 2 + out; }
      else if (edge === 2) { x = -(width / 2 + out); z = t * depth; }
      else { x = width / 2 + out; z = t * depth; }
      const useFern = rng() < 0.25 && this.theme.id !== 'bois_clair_burning';
      const m = useFern ? make(fern, fernTex, 0.7 + rng() * 0.3) : make(grass, grassTex, 0.8 + rng() * 0.5);
      m.position.set(x, -0.15, z);
      this.root.add(m);
    }
  }

  // ------------------------------------------------------------ lights

  private buildLights(): void {
    const max = this.options.maxLights ?? (this.ctx.reduced ? 2 : 6);
    const requests = [...this.ctx.lights]
      .map((request) => ({ request, world: request.anchor.getWorldPosition(new THREE.Vector3()) }))
      // keep the lights closest to the battlefield: they are the ones the camera sees lighting the slabs
      .sort((a, b) => a.world.length() - b.world.length())
      .slice(0, max);
    for (const { request, world } of requests) {
      const light = new THREE.PointLight(request.color, request.intensity, request.distance, 1.6);
      light.position.copy(world);
      light.castShadow = false;
      this.root.add(light);
      this.lights.push({ light, base: request.intensity, flicker: request.flicker, phase: world.x * 1.7 + world.z });
    }
  }

  applyLighting(targets: ArenaLightTargets): void {
    const l = this.theme.light;
    this.lightTargets = targets;
    this.baseIntensity = { hemi: l.hemiIntensity, sun: l.sunIntensity, fill: l.fillIntensity };
    targets.hemi.color.set(l.hemiSky);
    targets.hemi.groundColor.set(l.hemiGround);
    targets.hemi.intensity = l.hemiIntensity;
    targets.sun.color.set(l.sunColor);
    targets.sun.intensity = l.sunIntensity;
    targets.sun.position.set(...l.sunPosition);
    targets.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(targets.sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 70 });
    targets.sun.shadow.camera.updateProjectionMatrix();
    targets.sun.shadow.map?.dispose();
    targets.sun.shadow.map = null;
    targets.fill.color.set(l.fillColor);
    targets.fill.intensity = l.fillIntensity;
    targets.renderer.toneMappingExposure = l.exposure;
    targets.scene.background = new THREE.Color(this.theme.background);
    targets.scene.fog = new THREE.FogExp2(this.theme.fog.color, this.theme.fog.density);
  }

  // ------------------------------------------------------------ far plate

  private async buildFarPlate(): Promise<void> {
    const plate = this.theme.farPlate;
    const happy = typeof window === 'undefined' || /happy-dom/i.test(window.navigator?.userAgent ?? '');
    let texture: THREE.Texture | null = null;
    if (!happy) {
      try {
        texture = await new THREE.TextureLoader().loadAsync(plate.file);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
      } catch (error) {
        console.warn('Plan lointain indisponible', plate.file, error);
      }
    }
    const image = texture?.image as { width?: number; height?: number } | undefined;
    const aspect = image?.width && image?.height ? image.height / image.width : 0.35;
    const height = plate.width * aspect;
    const geometry = new THREE.PlaneGeometry(plate.width, height);
    this.geometries.push(geometry);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: texture ? plate.tint : this.theme.fog.color,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    if (texture) this.ctx.textures.set('far-plate', texture);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, plate.bottomY + height / 2, plate.z);
    mesh.renderOrder = -20;
    mesh.raycast = () => {};
    mesh.name = 'arena-far-plate';
    this.root.add(mesh);
    this.farPlate = mesh;
  }

  /**
   * Spotlight mood: tweens the ambient/sun/fill rig toward `amount` of its
   * authored intensity (fires, candles and lanterns keep burning).
   */
  setDim(amount: number, seconds = 0.4): void {
    this.dim = { value: this.dim.value, from: this.dim.value, to: Math.max(0, amount), t: 0, duration: Math.max(0, seconds) };
    if (this.dim.duration === 0) this.applyDim(this.dim.to);
  }

  get dimLevel(): number {
    return this.dim.value;
  }

  private applyDim(value: number): void {
    this.dim.value = value;
    const targets = this.lightTargets;
    if (!targets) return;
    targets.hemi.intensity = this.baseIntensity.hemi * value;
    targets.sun.intensity = this.baseIntensity.sun * (0.25 + value * 0.75) * value;
    targets.fill.intensity = this.baseIntensity.fill * value;
    if (this.farPlate) (this.farPlate.material as THREE.MeshBasicMaterial).color.set(this.theme.farPlate.tint).multiplyScalar(0.35 + value * 0.65);
  }

  // ------------------------------------------------------------ frame

  update(t: number, dt: number, camera: THREE.Camera): void {
    camera.getWorldPosition(_camWorld);
    for (const board of this.ctx.billboards) {
      board.getWorldPosition(_objWorld);
      let yaw = Math.atan2(_camWorld.x - _objWorld.x, _camWorld.z - _objWorld.z);
      if (board.parent && board.parent !== this.root) {
        board.parent.getWorldQuaternion(_parentQuat);
        _euler.setFromQuaternion(_parentQuat, 'YXZ');
        yaw -= _euler.y;
      }
      board.rotation.y = yaw;
    }
    for (const fn of this.ctx.animated) fn(t, dt);
    for (const entry of this.lights) {
      const n = Math.sin(t * 9.1 + entry.phase) * 0.5 + Math.sin(t * 13.7 + entry.phase * 2.3) * 0.3 + Math.sin(t * 3.1 + entry.phase) * 0.2;
      entry.light.intensity = entry.base * (1 + n * entry.flicker);
    }
    if (this.farPlate) this.farPlate.position.x = _camWorld.x * 0.12;
    if (this.dim.value !== this.dim.to) {
      this.dim.t += dt;
      const k = this.dim.duration > 0 ? Math.min(1, this.dim.t / this.dim.duration) : 1;
      this.applyDim(this.dim.from + (this.dim.to - this.dim.from) * (k * k * (3 - 2 * k)));
      if (k >= 1) this.applyDim(this.dim.to);
    }
  }

  /** Small read-only census for QA tooling. */
  describe() {
    return {
      theme: this.theme.id,
      props: this.theme.props.length,
      billboards: this.ctx.billboards.length,
      lights: this.lights.length,
      textures: this.ctx.textures.size,
      farPlate: Boolean(this.farPlate && (this.farPlate.material as THREE.MeshBasicMaterial).map),
    };
  }

  dispose(): void {
    this.root.removeFromParent();
    this.root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    for (const g of this.geometries) g.dispose();
    for (const t of this.ctx.textures.values()) t.dispose();
    for (const m of this.ctx.materials.values()) m.dispose();
  }
}
