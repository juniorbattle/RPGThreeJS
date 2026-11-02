import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CombatArena } from '../../combat/arena/CombatArena';
import { resolvePixelSheet } from '../../combat/pixel/PixelSpriteSheets';
import { PixelSpriteRig, setPixelSpriteLight } from '../../combat/pixel/PixelSpriteMaterial';

const MARCH: ReadonlyArray<{ unit: string; x: number; z: number; delay: number }> = [
  { unit: 'serpent_brute', x: 0.3, z: -8, delay: 0 }, { unit: 'serpent_raider', x: -1.6, z: -8.6, delay: 0.5 },
  { unit: 'serpent_raider', x: 1.9, z: -9, delay: 1 }, { unit: 'serpent_raider', x: -0.5, z: -10, delay: 1.8 },
  { unit: 'serpent_brute', x: 1, z: -10.8, delay: 2.5 }, { unit: 'serpent_raider', x: -2.6, z: -11, delay: 3.2 },
  { unit: 'serpent_raider', x: 2.8, z: -11.6, delay: 4 },
];
const MARCH_SPEED = 0.5;
/** The curb stones are baked with the decor: only their material still tells them apart. */
const CURB_TINT = 'd8d2c6';

interface Marcher { rig: PixelSpriteRig; mesh: THREE.Mesh; baseY: number; x: number; z: number; delay: number }

/** The Bois-Clair arena as a story shot, for the comparison only (OD-2026-11-02-A). The platform can be taken away. */
export class OpeningArenaShot {
  readonly element: HTMLCanvasElement;
  private readonly marchers: Marcher[] = [];
  private readonly textures: THREE.Texture[] = [];

  private constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly composer: EffectComposer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly arena: CombatArena,
  ) {
    this.element = renderer.domElement;
  }

  static async create(width: number, height: number, options: { platform: boolean; reducedGraphics: boolean }): Promise<OpeningArenaShot> {
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120b10);
    const camera = new THREE.PerspectiveCamera(33, width / height, 0.1, 200);
    const hemi = new THREE.HemisphereLight(0xcfd8ca, 0x313d36, 0.86);
    const sun = new THREE.DirectionalLight(0xffead1, 1.78);
    sun.position.set(-8, 14, 6);
    sun.castShadow = true;
    const fill = new THREE.DirectionalLight(0xd5b184, 0.48);
    fill.position.set(10, 6, 8);
    scene.add(hemi, sun, fill);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.26, 0.6, 0.78));
    composer.addPass(new OutputPass());

    const arena = new CombatArena({ sceneId: 'bois_clair_burning', columns: 8, rows: 4, tile: 1.18, reducedGraphics: options.reducedGraphics });
    await arena.build();
    if (!options.platform) {
      arena.root.traverse((object) => {
        const curb = ((object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined)?.color?.getHexString() === CURB_TINT;
        if (curb || object.name === 'arena-grout-bed' || object.name.startsWith('arena-tiles-')) object.visible = false;
      });
    }
    scene.add(arena.root);
    arena.applyLighting({ renderer, scene, hemi, sun, fill });
    setPixelSpriteLight(arena.theme.spriteTint, arena.theme.spriteRim);

    const shot = new OpeningArenaShot(renderer, composer, scene, camera, arena);
    await shot.addMarchers();
    return shot;
  }

  private async addMarchers(): Promise<void> {
    const loader = new THREE.TextureLoader();
    for (const march of MARCH) {
      const entry = resolvePixelSheet(march.unit);
      if (!entry) continue;
      const texture = await loader.loadAsync(entry.file);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      this.textures.push(texture);
      const rig = new PixelSpriteRig(entry, texture);
      rig.play('idle');
      const mesh = new THREE.Mesh(rig.createGeometry(), rig.handle.material);
      mesh.scale.x = -1;
      mesh.position.set(march.x, rig.layout.centerY, march.z);
      this.scene.add(mesh);
      this.marchers.push({ rig, mesh, baseY: rig.layout.centerY, x: march.x, z: march.z, delay: march.delay });
    }
  }

  render(seconds: number, dt: number): void {
    const push = Math.min(1, seconds / 12);
    this.camera.position.set(0.7 - push * 1.1, 1.3, 12.6 - push * 1.5);
    this.camera.lookAt(-0.3, 1.9, -2);
    for (const marcher of this.marchers) {
      const walked = Math.max(0, seconds - marcher.delay) * MARCH_SPEED;
      marcher.mesh.position.x = marcher.x - walked * 0.14;
      marcher.mesh.position.z = marcher.z + walked;
      marcher.mesh.position.y = marcher.baseY + Math.abs(Math.sin(seconds * 5.4 + marcher.z)) * 0.05;
      marcher.rig.update(dt);
    }
    this.arena.update(seconds, dt, this.camera);
    this.composer.render();
  }

  dispose(): void {
    for (const marcher of this.marchers) {
      marcher.mesh.removeFromParent();
      marcher.mesh.geometry.dispose();
      marcher.rig.dispose();
    }
    for (const texture of this.textures) texture.dispose();
    this.arena.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.element.remove();
  }
}
