import * as THREE from 'three';
import { createUvWaveMaterial, type UvWaveConfig } from './backgroundMaterials';

export interface BackgroundLayerConfig {
  id: string;
  texture?: string;
  position?: [number, number, number];
  size?: [number, number];
  parallax?: number;
  opacity?: number;
  shader?: UvWaveConfig | null;
  fallback?: [string, string];
}

export interface BackgroundSceneConfig {
  id: string;
  enabled: boolean;
  layers: BackgroundLayerConfig[];
}

interface Layer {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.Material>;
  texture: THREE.Texture;
  material: THREE.Material;
  config: BackgroundLayerConfig;
}

function fallbackTexture(colors: [string, string]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, 16);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 16, 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function loadTexture(url: string | undefined, fallback: [string, string]): Promise<THREE.Texture> {
  if (!url) return fallbackTexture(fallback);
  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  } catch {
    return fallbackTexture(fallback);
  }
}

/**
 * Decorative parallax backdrop made of stacked planes. Non-interactive by design
 * (each layer has raycast disabled) so gameplay clicks always pass through to the
 * scene. `reducedGraphics` keeps only the rearmost layer and freezes shader time.
 */
export class BackgroundLayerSystem {
  /** Cap on simultaneously loaded layers to bound draw/overdraw cost. */
  static readonly MAX_LAYERS = 3;
  private readonly root = new THREE.Group();
  private readonly layers: Layer[] = [];
  private visible = true;
  private origin = new THREE.Vector3();

  constructor(private readonly scene: THREE.Scene) {
    this.root.name = 'BackgroundLayers';
    this.root.renderOrder = -100;
    this.scene.add(this.root);
  }

  async createLayer(config: BackgroundLayerConfig): Promise<THREE.Mesh> {
    const texture = await loadTexture(config.texture, config.fallback ?? ['#65828b', '#31483d']);
    const material = config.shader?.type === 'uvWave'
      ? createUvWaveMaterial(texture, config.shader, config.opacity ?? 1)
      : new THREE.MeshBasicMaterial({
        map: texture,
        transparent: (config.opacity ?? 1) < 1,
        opacity: config.opacity ?? 1,
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      });
    const size = config.size ?? [32, 18];
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
    mesh.name = config.id;
    mesh.position.set(...(config.position ?? [0, 0, -25]));
    mesh.frustumCulled = false;
    mesh.renderOrder = -100 + this.layers.length;
    mesh.raycast = () => {};
    this.root.add(mesh);
    this.layers.push({ mesh, texture, material, config });
    return mesh;
  }

  async load(config: BackgroundSceneConfig): Promise<void> {
    this.disposeLayers();
    this.visible = config.enabled;
    this.root.visible = config.enabled;
    if (!config.enabled) return;
    for (const layer of config.layers.slice(0, BackgroundLayerSystem.MAX_LAYERS)) await this.createLayer(layer);
  }

  update(deltaTime: number, camera: THREE.Camera, reducedGraphics = false): void {
    if (!this.visible) return;
    this.root.position.copy(camera.position);
    this.root.quaternion.copy(camera.quaternion);
    const elapsed = (this.root.userData.time ?? 0) + deltaTime;
    this.root.userData.time = elapsed;
    for (let index = 0; index < this.layers.length; index += 1) {
      const layer = this.layers[index]!;
      layer.mesh.visible = !reducedGraphics || index === 0;
      const base = layer.config.position ?? [0, 0, -25];
      const parallax = reducedGraphics ? 0 : (layer.config.parallax ?? 0);
      layer.mesh.position.set(
        base[0] - (camera.position.x - this.origin.x) * parallax,
        base[1] - (camera.position.y - this.origin.y) * parallax * 0.3,
        base[2],
      );
      if (layer.material instanceof THREE.ShaderMaterial) {
        layer.material.uniforms.uTime!.value = reducedGraphics ? 0 : elapsed;
      }
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.visible = visible;
  }

  dispose(): void {
    this.disposeLayers();
    this.root.removeFromParent();
  }

  private disposeLayers(): void {
    for (const layer of this.layers) {
      layer.mesh.geometry.dispose();
      layer.material.dispose();
      layer.texture.dispose();
      layer.mesh.removeFromParent();
    }
    this.layers.length = 0;
  }
}
