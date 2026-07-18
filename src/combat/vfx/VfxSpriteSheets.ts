import * as THREE from 'three';
import type { VfxSpriteSheetId } from './VfxTypes';

export interface VfxSpriteSheetDefinition {
  id: VfxSpriteSheetId;
  url: string;
  rows: number;
  cols: number;
  frameCount: number;
  frameDurationMs: number;
  align: 'center' | 'bottom';
}

export const VFX_SPRITE_SHEETS = {
  slash_arc: { id: 'slash_arc', url: '/assets/vfx/runtime/v1/slash_arc.png', rows: 5, cols: 6, frameCount: 30, frameDurationMs: 40, align: 'center' },
  small_impact: { id: 'small_impact', url: '/assets/vfx/runtime/v1/small_impact.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center' },
  thrust_line: { id: 'thrust_line', url: '/assets/vfx/runtime/v1/thrust_line.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center' },
  projectile_shot: { id: 'projectile_shot', url: '/assets/vfx/runtime/v1/projectile_shot.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center' },
  magic_bolt: { id: 'magic_bolt', url: '/assets/vfx/runtime/v1/magic_bolt.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center' },
  fire_explosion: { id: 'fire_explosion', url: '/assets/vfx/runtime/v1/fire_explosion.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  heal_touch: { id: 'heal_touch', url: '/assets/vfx/runtime/v1/heal_touch.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  buff_pulse: { id: 'buff_pulse', url: '/assets/vfx/runtime/v1/buff_pulse.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  barrier_shell: { id: 'barrier_shell', url: '/assets/vfx/runtime/v1/barrier_shell.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  teleport_burst: { id: 'teleport_burst', url: '/assets/vfx/runtime/v1/teleport_burst.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  shockwave_ring: { id: 'shockwave_ring', url: '/assets/vfx/runtime/v1/shockwave_ring.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
  leap_impact: { id: 'leap_impact', url: '/assets/vfx/runtime/v1/leap_impact.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom' },
} as const satisfies Record<VfxSpriteSheetId, VfxSpriteSheetDefinition>;

export const VFX_SPRITE_SHEET_IDS = Object.freeze(Object.keys(VFX_SPRITE_SHEETS) as VfxSpriteSheetId[]);

const loader = new THREE.TextureLoader();
const texturePromises = new Map<VfxSpriteSheetId, Promise<THREE.Texture>>();

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

export async function loadVfxSpriteSheetTexture(id: VfxSpriteSheetId) {
  let pending = texturePromises.get(id);
  if (!pending) {
    const definition = VFX_SPRITE_SHEETS[id];
    pending = loader.loadAsync(definition.url).then(configureTexture).catch((error) => {
      texturePromises.delete(id);
      throw error;
    });
    texturePromises.set(id, pending);
  }
  const baseTexture = await pending;
  return configureTexture(baseTexture.clone());
}

export function setVfxSpriteSheetFrame(
  texture: THREE.Texture,
  definition: VfxSpriteSheetDefinition,
  frameIndex: number,
) {
  const safeFrame = Math.max(0, Math.min(definition.frameCount - 1, Math.floor(frameIndex)));
  const column = safeFrame % definition.cols;
  const row = Math.floor(safeFrame / definition.cols);
  texture.repeat.set(1 / definition.cols, 1 / definition.rows);
  texture.offset.set(column / definition.cols, 1 - (row + 1) / definition.rows);
}

export function disposeVfxSpriteSheetTextures() {
  for (const pending of texturePromises.values()) pending.then((texture) => texture.dispose()).catch(() => undefined);
  texturePromises.clear();
}
