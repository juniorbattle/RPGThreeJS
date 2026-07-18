import * as THREE from 'three';
import type { VfxSpriteSheetId } from './VfxTypes';

export interface VfxSpriteSheetPresentation {
  /** Multiplies the presentation scale without changing the skill's logical targeting. */
  scaleMultiplier: number;
  /** Lets reduced graphics stay legible while the sheet's alpha still controls its fade. */
  opacityMultiplier: number;
  /** Normalized fade-in duration. */
  fadeIn: number;
  /** Normalized point at which the sheet clears rapidly after its peak. */
  fadeOut: number;
  /** Ground sheets retain depth; impact sheets may briefly overlap combatants. */
  layer: 'ground' | 'impact';
  /** Bright sprite sheets use additive light so they read against painted scenes. */
  blending: 'normal' | 'additive';
}

export interface VfxSpriteSheetDefinition {
  id: VfxSpriteSheetId;
  url: string;
  rows: number;
  cols: number;
  frameCount: number;
  frameDurationMs: number;
  align: 'center' | 'bottom';
  presentation: VfxSpriteSheetPresentation;
}

export const VFX_SPRITE_SHEETS = {
  slash_arc: { id: 'slash_arc', url: '/assets/vfx/runtime/v1/slash_arc.png', rows: 5, cols: 6, frameCount: 30, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.16, opacityMultiplier: 1, fadeIn: 0.06, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  small_impact: { id: 'small_impact', url: '/assets/vfx/runtime/v1/small_impact.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.34, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.67, layer: 'impact', blending: 'additive' } },
  thrust_line: { id: 'thrust_line', url: '/assets/vfx/runtime/v1/thrust_line.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.2, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  projectile_shot: { id: 'projectile_shot', url: '/assets/vfx/runtime/v1/projectile_shot.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.16, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  magic_bolt: { id: 'magic_bolt', url: '/assets/vfx/runtime/v1/magic_bolt.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  fire_explosion: { id: 'fire_explosion', url: '/assets/vfx/runtime/v1/fire_explosion.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.34, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.72, layer: 'impact', blending: 'additive' } },
  heal_touch: { id: 'heal_touch', url: '/assets/vfx/runtime/v1/heal_touch.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.26, opacityMultiplier: 0.96, fadeIn: 0.07, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  buff_pulse: { id: 'buff_pulse', url: '/assets/vfx/runtime/v1/buff_pulse.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.3, opacityMultiplier: 0.95, fadeIn: 0.05, fadeOut: 0.83, layer: 'impact', blending: 'additive' } },
  barrier_shell: { id: 'barrier_shell', url: '/assets/vfx/runtime/v1/barrier_shell.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.22, opacityMultiplier: 0.96, fadeIn: 0.06, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  teleport_burst: { id: 'teleport_burst', url: '/assets/vfx/runtime/v1/teleport_burst.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.34, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.75, layer: 'impact', blending: 'additive' } },
  shockwave_ring: { id: 'shockwave_ring', url: '/assets/vfx/runtime/v1/shockwave_ring.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 0.96, fadeIn: 0.04, fadeOut: 0.74, layer: 'ground', blending: 'additive' } },
  leap_impact: { id: 'leap_impact', url: '/assets/vfx/runtime/v1/leap_impact.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.38, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.74, layer: 'impact', blending: 'additive' } },
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
