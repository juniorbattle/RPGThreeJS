import * as THREE from 'three';
import type { VfxSpriteSheetId, LegacyVfxSpriteSheetId, NativeVfxSpriteSheetId, VfxSpritePresentationOverride, VfxStep } from './VfxTypes';
import { vfxResourceManager, resolveSheetSource, resolveCandidateSource } from './VfxResourceManager';

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
  /** Atlas pixel width. Used for per-definition half-texel UV inset calculation. */
  sheetWidthPx: number;
  /** Atlas pixel height. Used for per-definition half-texel UV inset calculation. */
  sheetHeightPx: number;
  rows: number;
  cols: number;
  frameCount: number;
  frameDurationMs: number;
  align: 'center' | 'bottom';
  presentation: VfxSpriteSheetPresentation;
  /** R1.2.4 candidate ID from the corrected inventory (megapack-native only). */
  sourceCandidateId?: string;
  /** CartoonCoffee source collection name (megapack-native only). */
  sourceCollection?: string;
  /** Original source filename from the CartoonCoffee pack (megapack-native only). */
  sourceFilename?: string;
  /** Native cell width in pixels: sheetWidthPx / cols. */
  nativeCellWidthPx?: number;
  /** Native cell height in pixels: sheetHeightPx / rows. */
  nativeCellHeightPx?: number;
  /** Whether this sheet is a legacy 1280/5×5 asset or a native CartoonCoffee asset. */
  assetGeneration?: 'legacy' | 'megapack-native';
}

/**
 * Minimal atlas shape used by isolated development review tools.  It stays
 * separate from VfxSpriteSheetDefinition so an unapproved source never has to
 * enter the production VFX registry to be previewed.
 */
export interface VfxSpriteSheetFrameDefinition {
  sheetWidthPx: number;
  sheetHeightPx: number;
  rows: number;
  cols: number;
  frameCount: number;
}

export interface ResolvedVfxSpriteSheetPresentation {
  align: 'center' | 'bottom';
  layer: 'ground' | 'impact';
  blending: 'normal' | 'additive';
  scaleMultiplier: number;
  opacityMultiplier: number;
  fadeIn: number;
  fadeOut: number;
}

/**
 * Resolves per-step sprite presentation overrides against definition defaults.
 * Step override → definition presentation default → safe runtime fallback.
 * When no overrides are present, the result is identical to the definition's
 * own presentation values plus its align field.
 */
export function resolveVfxSpriteSheetPresentation(
  definition: VfxSpriteSheetDefinition,
  step?: VfxStep,
): ResolvedVfxSpriteSheetPresentation {
  const dp = definition.presentation;
  const ov: VfxSpritePresentationOverride | undefined = step?.spritePresentation;
  return {
    align: ov?.align ?? definition.align,
    layer: ov?.layer ?? dp.layer,
    blending: ov?.blending ?? dp.blending,
    scaleMultiplier: ov?.scaleMultiplier ?? dp.scaleMultiplier,
    opacityMultiplier: ov?.opacityMultiplier ?? dp.opacityMultiplier,
    fadeIn: ov?.fadeIn ?? dp.fadeIn,
    fadeOut: ov?.fadeOut ?? dp.fadeOut,
  };
}

/**
 * Runtime sheets are authored row-major from the top-left. Three.js uploads
 * TextureLoader images with flipY enabled, so the UV row offset below must be
 * expressed from the bottom of the WebGL texture. Keep this invariant explicit
 * instead of relying on Texture's implicit default.
 */
export const VFX_SPRITE_SHEET_FLIP_Y = true;

/**
 * A half-texel UV inset prevents LinearFilter from sampling neighbouring cells
 * at cell boundaries, eliminating texture bleeding without switching to
 * NearestFilter or modifying the PNGs. The inset is computed per-definition
 * from the sheet's actual pixel dimensions, supporting native 4×4/2048,
 * 8×8/4096, and legacy 5×5/1280 atlases simultaneously.
 */
const VFX_UV_INSET_TEXELS = 0.5;

export function getVfxSpriteSheetFrameUv(
  definition: VfxSpriteSheetFrameDefinition,
  frameIndex: number,
) {
  const safeFrame = Math.max(0, Math.min(definition.frameCount - 1, Math.floor(frameIndex)));
  const column = safeFrame % definition.cols;
  const row = Math.floor(safeFrame / definition.cols);
  const cellWidth = 1 / definition.cols;
  const cellHeight = 1 / definition.rows;
  const insetU = VFX_UV_INSET_TEXELS / definition.sheetWidthPx;
  const insetV = VFX_UV_INSET_TEXELS / definition.sheetHeightPx;
  return {
    safeFrame,
    column,
    row,
    repeatX: cellWidth - insetU * 2,
    repeatY: cellHeight - insetV * 2,
    offsetX: column * cellWidth + insetU,
    offsetY: 1 - (row + 1) * cellHeight + insetV,
  };
}

/**
 * Validates a sprite sheet definition. Returns an array of error strings;
 * empty array means valid.
 *
 * Basic checks (always applied):
 * - frameCount <= rows * cols
 * - sheetWidthPx > 0, sheetHeightPx > 0
 * - rows > 0, cols > 0
 *
 * Integral cell checks (applied for all known runtime sheets):
 * - sheetWidthPx % cols === 0
 * - sheetHeightPx % rows === 0
 */
export function validateVfxSpriteSheetDefinition(definition: VfxSpriteSheetDefinition): string[] {
  const errors: string[] = [];
  if (definition.sheetWidthPx <= 0) errors.push('sheetWidthPx must be > 0');
  if (definition.sheetHeightPx <= 0) errors.push('sheetHeightPx must be > 0');
  if (definition.rows <= 0) errors.push('rows must be > 0');
  if (definition.cols <= 0) errors.push('cols must be > 0');
  if (definition.frameCount > definition.rows * definition.cols) {
    errors.push(`frameCount (${definition.frameCount}) must be <= rows * cols (${definition.rows * definition.cols})`);
  }
  if (definition.sheetWidthPx % definition.cols !== 0) {
    errors.push(`sheetWidthPx (${definition.sheetWidthPx}) must be divisible by cols (${definition.cols})`);
  }
  if (definition.sheetHeightPx % definition.rows !== 0) {
    errors.push(`sheetHeightPx (${definition.sheetHeightPx}) must be divisible by rows (${definition.rows})`);
  }
  return errors;
}

const _nativeSheetDefinitions: Record<NativeVfxSpriteSheetId, VfxSpriteSheetDefinition> = {
  megapack_dash_wind_white_v3: { id: 'megapack_dash_wind_white_v3', url: '/assets/vfx/megapack-runtime/r1_2561.png', sheetWidthPx: 2048, sheetHeightPx: 2048, rows: 4, cols: 4, frameCount: 16, frameDurationMs: 50, align: 'center', presentation: { scaleMultiplier: 1.4, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.8, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_2561', sourceCollection: 'Wind VFX Spritesheets', sourceFilename: 'Dash_Wind_White_v3_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_blue_slash_flurry: { id: 'megapack_blue_slash_flurry', url: '/assets/vfx/megapack-runtime/r1_1605.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'center', presentation: { scaleMultiplier: 1.6, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.85, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_1605', sourceCollection: 'Sword Slash VFX Spritesheets', sourceFilename: 'Blue Slash v1 - Flurry_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_lightning_slash_flurry: { id: 'megapack_lightning_slash_flurry', url: '/assets/vfx/megapack-runtime/r1_1712.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'center', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_1712', sourceCollection: 'Sword Slash VFX Spritesheets', sourceFilename: 'Lightning Slash v1 - Flurry_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_shield_on: { id: 'megapack_shield_on', url: '/assets/vfx/megapack-runtime/r1_0971.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.48, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0971', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Shield_On_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_impact_darkness_lv3: { id: 'megapack_impact_darkness_lv3', url: '/assets/vfx/megapack-runtime/r1_0545.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.8, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.88, layer: 'ground', blending: 'additive' }, sourceCandidateId: 'r1_0545', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Impact_Darkness_Lv3_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_fire_slash_spin: { id: 'megapack_fire_slash_spin', url: '/assets/vfx/megapack-runtime/r1_1700.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'center', presentation: { scaleMultiplier: 1.62, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.82, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_1700', sourceCollection: 'Sword Slash VFX Spritesheets', sourceFilename: 'Fire Slash v1 - Spin_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_flamethrower_001: { id: 'megapack_flamethrower_001', url: '/assets/vfx/megapack-runtime/r1_0450.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'center', presentation: { scaleMultiplier: 1.55, opacityMultiplier: 1, fadeIn: 0.02, fadeOut: 0.78, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0450', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Flamethrower_001_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_positive_buff_v3: { id: 'megapack_positive_buff_v3', url: '/assets/vfx/megapack-runtime/r1_0677.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.46, opacityMultiplier: 0.98, fadeIn: 0.04, fadeOut: 0.84, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0677', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Positive_Buff_V3_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_heart_buff_v3: { id: 'megapack_heart_buff_v3', url: '/assets/vfx/megapack-runtime/r1_0503.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.82, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0503', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Heart_Buff_V3_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_angry_smoke_burst: { id: 'megapack_angry_smoke_burst', url: '/assets/vfx/megapack-runtime/r1_2509.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.44, opacityMultiplier: 0.86, fadeIn: 0.03, fadeOut: 0.8, layer: 'impact', blending: 'normal' }, sourceCandidateId: 'r1_2509', sourceCollection: 'Wind VFX Spritesheets', sourceFilename: 'Angry_Smoke_Burst_White_v2_A_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_healing_v3: { id: 'megapack_healing_v3', url: '/assets/vfx/megapack-runtime/r1_0480.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.58, opacityMultiplier: 1, fadeIn: 0.04, fadeOut: 0.86, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0480', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Healing_V3_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_hex_bursts_center_v2: { id: 'megapack_hex_bursts_center_v2', url: '/assets/vfx/megapack-runtime/r1_0525.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.54, opacityMultiplier: 1, fadeIn: 0.03, fadeOut: 0.82, layer: 'impact', blending: 'additive' }, sourceCandidateId: 'r1_0525', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Hex_Bursts_Center_V2_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_charge_darkness_v1_a: { id: 'megapack_charge_darkness_v1_a', url: '/assets/vfx/megapack-runtime/r1_0129.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'center', presentation: { scaleMultiplier: 1.4, opacityMultiplier: 0.8, fadeIn: 0.06, fadeOut: 0.9, layer: 'ground', blending: 'additive' }, sourceCandidateId: 'r1_0129', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Charge_Darkness_v1_A_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_impact_darkness_lv2: { id: 'megapack_impact_darkness_lv2', url: '/assets/vfx/megapack-runtime/r1_0544.png', sheetWidthPx: 4096, sheetHeightPx: 4096, rows: 8, cols: 8, frameCount: 64, frameDurationMs: 20, align: 'bottom', presentation: { scaleMultiplier: 1.5, opacityMultiplier: 0.9, fadeIn: 0.03, fadeOut: 0.85, layer: 'ground', blending: 'additive' }, sourceCandidateId: 'r1_0544', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Impact_Darkness_Lv2_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
  megapack_impact_shockwave_v1: { id: 'megapack_impact_shockwave_v1', url: '/assets/vfx/megapack-runtime/r1_0592.png', sheetWidthPx: 2048, sheetHeightPx: 2048, rows: 4, cols: 4, frameCount: 16, frameDurationMs: 50, align: 'center', presentation: { scaleMultiplier: 1.6, opacityMultiplier: 0.8, fadeIn: 0.02, fadeOut: 0.7, layer: 'ground', blending: 'additive' }, sourceCandidateId: 'r1_0592', sourceCollection: 'Essentials VFX Spritesheets', sourceFilename: 'Impact_Shockwave v1_spritesheet.png', nativeCellWidthPx: 512, nativeCellHeightPx: 512, assetGeneration: 'megapack-native' },
};

export const NATIVE_SPRITE_SHEET_IDS = Object.freeze(Object.keys(_nativeSheetDefinitions) as NativeVfxSpriteSheetId[]);

/**
 * R2C-C.1.1: Legacy 1280/5×5/25f definitions have been REMOVED from source.
 * Their PNG files were manually deleted. The ID list is retained as a
 * frozen string array for tests to verify retirement. The full definitions
 * object (_legacySheetDefinitions) has been removed — historical info
 * lives in docs/reports/r2c-c-1-legacy-sprite-sheet-retirement.*.
 */
export const LEGACY_SPRITE_SHEET_IDS = Object.freeze([
  'basic_arrow_hit_small', 'basic_axe_chop_medium', 'basic_bite_snap_small', 'basic_blade_crescent_medium',
  'basic_body_slam_heavy', 'basic_bolt_hit_small', 'basic_bullet_hit_medium', 'basic_claw_rake_small',
  'basic_dagger_crosscut_small', 'basic_execution_slash_heavy', 'basic_greatsword_cleave_heavy',
  'basic_hammer_crush_heavy', 'basic_horn_ram_medium', 'basic_mace_impact_medium', 'basic_shield_bash_medium',
  'basic_shuriken_cut_small', 'basic_spear_stab_medium', 'basic_staff_strike_small', 'basic_sword_slash_heavy',
  'basic_sword_slash_small', 'basic_tail_whip_medium', 'basic_titan_crush_heavy',
  'skill_wind_slash_swirl_medium', 'skill_holy_radiance_burst_heavy', 'skill_barrier_guard_heavy',
  'skill_barrier_shield_ring_medium', 'skill_void_rune_orb_medium', 'skill_fire_impact_burst_medium',
  'skill_heal_blessing_bloom_heavy', 'skill_holy_sigil_burst_medium', 'skill_support_leaf_burst_medium',
  'skill_arcane_vortex_nova_heavy', 'skill_arcane_orbit_burst_medium', 'skill_arcane_sigil_burst_medium',
  'skill_fire_smoke_explosion_heavy', 'skill_poison_maw_bite_heavy', 'skill_ice_pillar_impact_heavy',
  'skill_fire_vortex_nova_heavy', 'skill_barrier_nature_guard_medium', 'skill_arcane_slash_burst_medium',
  'skill_meteor_impact_burst_heavy', 'skill_holy_light_pillar_medium', 'skill_void_singularity_implosion_ultimate',
  'skill_void_spiral_implosion_medium', 'skill_fire_spark_cluster_medium', 'skill_starburst_impact_medium',
] as const satisfies readonly LegacyVfxSpriteSheetId[]);
export const VFX_SPRITE_SHEETS: Readonly<Record<VfxSpriteSheetId, VfxSpriteSheetDefinition>> = Object.freeze({
  ..._nativeSheetDefinitions,
}) as Readonly<Record<VfxSpriteSheetId, VfxSpriteSheetDefinition>>;

export const VFX_SPRITE_SHEET_IDS = Object.freeze(Object.keys(VFX_SPRITE_SHEETS) as VfxSpriteSheetId[]);

/** Reserved native sheets synced to runtime but not yet assigned to a preset. */
export const RESERVED_NATIVE_SHEET_IDS = Object.freeze([
  'megapack_flamethrower_001',
] as const satisfies readonly VfxSpriteSheetId[]);

export function configureVfxSpriteSheetTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = VFX_SPRITE_SHEET_FLIP_Y;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Loads a sprite-sheet texture through the shared VfxResourceManager.
 *
 * The manager owns and caches the base texture (with LRU eviction and
 * weighted memory budget).  This function returns a configured CLONE
 * for independent per-playback UV state, preserving existing behavior.
 *
 * Call releaseVfxSpriteSheetTexture(id, texture) when playback ends
 * instead of calling texture.dispose() directly.
 */
export async function loadVfxSpriteSheetTexture(id: VfxSpriteSheetId) {
  const descriptor = resolveSheetSource(id);
  if (!descriptor) throw new Error(`Unknown sprite sheet: ${id}`);
  const baseTexture = await vfxResourceManager.acquire(id, descriptor);
  return configureVfxSpriteSheetTexture(baseTexture.clone());
}

/**
 * Releases a previously loaded sprite-sheet clone.  Disposes the clone's
 * GPU resources and decrements the manager's reference count, making the
 * base texture eligible for LRU eviction when no other playback uses it.
 */
export function releaseVfxSpriteSheetTexture(id: VfxSpriteSheetId, texture: THREE.Texture) {
  texture.dispose();
  vfxResourceManager.release(id);
}

export function setVfxSpriteSheetFrame(
  texture: THREE.Texture,
  definition: VfxSpriteSheetFrameDefinition,
  frameIndex: number,
) {
  const uv = getVfxSpriteSheetFrameUv(definition, frameIndex);
  texture.repeat.set(uv.repeatX, uv.repeatY);
  texture.offset.set(uv.offsetX, uv.offsetY);
}

export function disposeVfxSpriteSheetTextures() {
  vfxResourceManager.disposeAll();
}

/**
 * Loads a Lab candidate texture through the shared VfxResourceManager.
 *
 * The candidate must be a valid CartoonCoffee inventory candidate with a
 * supported native format. The manager owns and caches the base texture;
 * this function returns a configured clone for independent per-playback UV
 * state, same as production sprite sheets.
 *
 * Call releaseLabCandidateTexture(candidateId, texture) when playback ends.
 */
export async function loadLabCandidateTexture(candidateId: string) {
  const descriptor = resolveCandidateSource(candidateId);
  if (!descriptor) throw new Error(`Unknown or unsupported candidate: ${candidateId}`);
  const baseTexture = await vfxResourceManager.acquire(candidateId, descriptor);
  return configureVfxSpriteSheetTexture(baseTexture.clone());
}

/**
 * Releases a previously loaded Lab candidate clone. Disposes the clone's
 * GPU resources and decrements the manager's reference count.
 */
export function releaseLabCandidateTexture(candidateId: string, texture: THREE.Texture) {
  texture.dispose();
  vfxResourceManager.release(candidateId);
}

/**
 * Builds a temporary VfxSpriteSheetDefinition from a CartoonCoffee inventory
 * record for Lab playback. This does NOT register the definition in
 * VFX_SPRITE_SHEETS — it is used only for the duration of a single playback.
 */
export function buildLabSheetDefinition(
  candidateId: string,
  record: { width: number; height: number; nativeGrid: string; nativeFrameCount: number; nativeCellWidth: number; nativeCellHeight: number },
): VfxSpriteSheetDefinition {
  const grid = record.nativeGrid.split('x');
  const rows = parseInt(grid[0] ?? '4', 10);
  const cols = parseInt(grid[1] ?? '4', 10);
  const is2048 = record.width === 2048;
  return {
    id: `lab:${candidateId}` as VfxSpriteSheetId,
    url: `/assets/vfx/megapack-runtime/${candidateId}.png`,
    sheetWidthPx: record.width,
    sheetHeightPx: record.height,
    rows,
    cols,
    frameCount: record.nativeFrameCount,
    frameDurationMs: is2048 ? 50 : 20,
    align: 'center',
    presentation: {
      scaleMultiplier: 1.4,
      opacityMultiplier: 1,
      fadeIn: 0.02,
      fadeOut: 0.82,
      layer: 'impact',
      blending: 'additive',
    },
    sourceCandidateId: candidateId,
    assetGeneration: 'megapack-native',
    nativeCellWidthPx: record.nativeCellWidth,
    nativeCellHeightPx: record.nativeCellHeight,
  };
}
