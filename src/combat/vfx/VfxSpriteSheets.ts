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
  artillery_barrage: { id: 'artillery_barrage', url: '/assets/vfx/runtime/v2/artillery_barrage.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.32, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  dragon_breath: { id: 'dragon_breath', url: '/assets/vfx/runtime/v2/dragon_breath.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.42, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.9, layer: 'impact', blending: 'additive' } },
  heavy_execution: { id: 'heavy_execution', url: '/assets/vfx/runtime/v2/heavy_execution.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.38, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  meteor_fall: { id: 'meteor_fall', url: '/assets/vfx/runtime/v2/meteor_fall.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  titan_slam: { id: 'titan_slam', url: '/assets/vfx/runtime/v2/titan_slam.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 0.98, fadeIn: 0.02, fadeOut: 0.84, layer: 'ground', blending: 'additive' } },
  burn_mark: { id: 'burn_mark', url: '/assets/vfx/runtime/v2/burn_mark_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.22, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  silence_seal: { id: 'silence_seal', url: '/assets/vfx/runtime/v2/silence_seal_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.18, opacityMultiplier: 0.98, fadeIn: 0.03, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  curse_mark: { id: 'curse_mark', url: '/assets/vfx/runtime/v2/curse_mark_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.24, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' } },
  weak_mark: { id: 'weak_mark', url: '/assets/vfx/runtime/v2/weak_mark_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.12, opacityMultiplier: 0.96, fadeIn: 0.04, fadeOut: 0.84, layer: 'impact', blending: 'additive' } },
  regen_aura: { id: 'regen_aura', url: '/assets/vfx/runtime/v2/regen_aura_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.48, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.84, layer: 'ground', blending: 'additive' } },
  revive_pillar: { id: 'revive_pillar', url: '/assets/vfx/runtime/v2/revive_pillar_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.6, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.9, layer: 'impact', blending: 'additive' } },
  holy_aura: { id: 'holy_aura', url: '/assets/vfx/runtime/v2/holy_aura_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.52, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.86, layer: 'ground', blending: 'additive' } },
  bless_field: { id: 'bless_field', url: '/assets/vfx/runtime/v2/bless_field_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.56, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.86, layer: 'ground', blending: 'additive' } },
  boost_aura: { id: 'boost_aura', url: '/assets/vfx/runtime/v2/boost_aura_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.4, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.84, layer: 'ground', blending: 'additive' } },
  smoke_burst: { id: 'smoke_burst', url: '/assets/vfx/runtime/v2/smoke_burst_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.44, opacityMultiplier: 0.86, fadeIn: 0.02, fadeOut: 0.7, layer: 'ground', blending: 'normal' } },
  mace_impact: { id: 'mace_impact', url: '/assets/vfx/runtime/v2/mace_impact_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.52, opacityMultiplier: 1, fadeIn: 0.01, fadeOut: 0.68, layer: 'impact', blending: 'additive' } },
  line_blast: { id: 'line_blast', url: '/assets/vfx/runtime/v2/line_blast_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.58, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.72, layer: 'impact', blending: 'additive' } },
  cone_blast: { id: 'cone_blast', url: '/assets/vfx/runtime/v2/cone_blast_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.68, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.74, layer: 'impact', blending: 'additive' } },
  dark_explosion: { id: 'dark_explosion', url: '/assets/vfx/runtime/v2/dark_explosion_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.72, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' } },
  explosion_large: { id: 'explosion_large', url: '/assets/vfx/runtime/v2/explosion_large_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.95, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  judgement_beam: { id: 'judgement_beam', url: '/assets/vfx/runtime/v2/judgement_beam_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 2.02, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.86, layer: 'impact', blending: 'additive' } },
  holy_explosion: { id: 'holy_explosion', url: '/assets/vfx/runtime/v2/holy_explosion_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.92, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' } },
  eclipse_devour: { id: 'eclipse_devour', url: '/assets/vfx/runtime/v2/eclipse_devour_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 2.04, opacityMultiplier: 0.98, fadeIn: 0.02, fadeOut: 0.85, layer: 'ground', blending: 'additive' } },
  drain_field: { id: 'drain_field', url: '/assets/vfx/runtime/v2/drain_field_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.78, opacityMultiplier: 0.96, fadeIn: 0.02, fadeOut: 0.84, layer: 'ground', blending: 'additive' } },
  zenith_arrow: { id: 'zenith_arrow', url: '/assets/vfx/runtime/v2/zenith_arrow_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'center', presentation: { scaleMultiplier: 1.84, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.76, layer: 'impact', blending: 'additive' } },
  fault_breaker: { id: 'fault_breaker', url: '/assets/vfx/runtime/v2/fault_breaker_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 1.96, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'ground', blending: 'additive' } },
  apocalypse_field: { id: 'apocalypse_field', url: '/assets/vfx/runtime/v2/apocalypse_field_5x5_25f_1280.png', rows: 5, cols: 5, frameCount: 25, frameDurationMs: 40, align: 'bottom', presentation: { scaleMultiplier: 2.24, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.88, layer: 'ground', blending: 'additive' } },
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
