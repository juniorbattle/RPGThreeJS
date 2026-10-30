import * as THREE from 'three';
import { PixelAnimationClock, pixelSheetLayout, type PixelSheetEntry } from './PixelSpriteSheets';

/**
 * Arena lighting shared by every pixel sprite. The arena sets it once per
 * scene so sprites sit in the same light as the procedural decor (HD-2D),
 * without touching `material.color`, which combat feedback uses for flashes.
 */
export const PIXEL_SPRITE_LIGHT = {
  uPixelTint: { value: new THREE.Color(1, 1, 1) },
  uPixelRim: { value: new THREE.Color(0, 0, 0) },
};

export function setPixelSpriteLight(tint: THREE.ColorRepresentation, rim: THREE.ColorRepresentation = 0x000000): void {
  PIXEL_SPRITE_LIGHT.uPixelTint.value.set(tint);
  PIXEL_SPRITE_LIGHT.uPixelRim.value.set(rim);
}

/**
 * How a pixel sprite answers `material.opacity`. A focus-dimmed unit (0.42)
 * must read as clearly semi-transparent, so coverage follows the opacity
 * (smoothed) down to full transparency; shade and saturation recede on top of
 * it so a dimmed sprite does not melt into a same-hue ground, such as
 * green-clad brigands on the forest grass.
 */
export const PIXEL_FOCUS_RESPONSE = Object.freeze({
  /** Opacity below which the sprite is fully receded in shade and saturation. */
  focusLow: 0.2,
  /** Opacity at which coverage is already full. */
  coverageFull: 1,
  minShade: 0.6,
  minSaturation: 0.35,
});

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** CPU mirror of the shader mapping, for tests and tuning. */
export function pixelFocusResponse(opacity: number): { alpha: number; shade: number; saturation: number } {
  const fade = Math.min(1, Math.max(0, opacity));
  const focus = smoothstep(PIXEL_FOCUS_RESPONSE.focusLow, 1, fade);
  return {
    alpha: smoothstep(0, PIXEL_FOCUS_RESPONSE.coverageFull, fade),
    shade: PIXEL_FOCUS_RESPONSE.minShade + (1 - PIXEL_FOCUS_RESPONSE.minShade) * focus,
    saturation: PIXEL_FOCUS_RESPONSE.minSaturation + (1 - PIXEL_FOCUS_RESPONSE.minSaturation) * focus,
  };
}

const glslFloat = (value: number) => value.toFixed(3);

/** Fragment code applying `pixelFocusResponse` to `diffuseColor` (its alpha holds the material opacity). */
export const PIXEL_FOCUS_GLSL = `  float pixelFade = clamp(diffuseColor.a, 0.0, 1.0);
  float pixelFocus = smoothstep(${glslFloat(PIXEL_FOCUS_RESPONSE.focusLow)}, 1.0, pixelFade);
  float pixelLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  diffuseColor.rgb = mix(vec3(pixelLuma), diffuseColor.rgb, mix(${glslFloat(PIXEL_FOCUS_RESPONSE.minSaturation)}, 1.0, pixelFocus));
  diffuseColor.rgb *= mix(${glslFloat(PIXEL_FOCUS_RESPONSE.minShade)}, 1.0, pixelFocus);
  diffuseColor.a = smoothstep(0.0, ${glslFloat(PIXEL_FOCUS_RESPONSE.coverageFull)}, pixelFade);`;

export interface PixelSpriteMaterialHandle {
  material: THREE.MeshBasicMaterial;
  /** 0..1 white hit flash, decays in `PixelSpriteRig.update`. */
  flash: { value: number };
}

/**
 * MeshBasicMaterial with "sharp bilinear" sampling: texels stay square and
 * crisp at any non-integer zoom, edges get a one-screen-pixel blend instead of
 * the shimmering of NearestFilter. Keeps color/alphaTest semantics; opacity
 * follows `pixelFocusResponse`.
 */
export function createPixelSpriteMaterial(texture: THREE.Texture, sheetSize: { width: number; height: number }): PixelSpriteMaterialHandle {
  const flash = { value: 0 };
  const texSize = { value: new THREE.Vector2(sheetSize.width, sheetSize.height) };
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    // Cut-out happens on the texel alpha in the shader below: a material-level
    // alphaTest would also cut sprites faded below 50% (focus dim, spotlight).
    alphaTest: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPixelTexSize = texSize;
    shader.uniforms.uPixelFlash = flash;
    shader.uniforms.uPixelTint = PIXEL_SPRITE_LIGHT.uPixelTint;
    shader.uniforms.uPixelRim = PIXEL_SPRITE_LIGHT.uPixelRim;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec2 uPixelTexSize;\nuniform float uPixelFlash;\nuniform vec3 uPixelTint;\nuniform vec3 uPixelRim;\nvoid main() {')
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec2 pixelUv = vMapUv * uPixelTexSize;
  vec2 pixelSeam = floor(pixelUv + 0.5);
  vec2 pixelStep = max(fwidth(pixelUv), vec2(1e-5));
  pixelUv = pixelSeam + clamp((pixelUv - pixelSeam) / pixelStep, -0.5, 0.5);
  vec4 sampledDiffuseColor = texture2D(map, pixelUv / uPixelTexSize);
  if (sampledDiffuseColor.a < 0.5) discard;
  sampledDiffuseColor.a = 1.0;
  diffuseColor *= sampledDiffuseColor;
  diffuseColor.rgb = diffuseColor.rgb * uPixelTint + uPixelRim * vMapUv.y * 0.35;
${PIXEL_FOCUS_GLSL}
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.98, 0.92), clamp(uPixelFlash, 0.0, 1.0));
#endif`);
  };
  material.customProgramCacheKey = () => 'combat-pixel-sprite-v3';
  return { material, flash };
}

/** Per-unit sheet texture + clock. The texture image is shared between units. */
export class PixelSpriteRig {
  readonly clock: PixelAnimationClock;
  readonly texture: THREE.Texture;
  readonly handle: PixelSpriteMaterialHandle;
  readonly layout;
  speed = 1;
  private lastCell = -1;

  constructor(readonly entry: PixelSheetEntry, sheetTexture: THREE.Texture) {
    this.layout = pixelSheetLayout(entry);
    this.texture = sheetTexture.clone();
    this.texture.needsUpdate = true;
    this.texture.repeat.set(1 / this.layout.columns, 1);
    this.texture.offset.set(0, 0);
    const image = sheetTexture.image as { width?: number; height?: number } | undefined;
    const width = image?.width || entry.cell[0] * this.layout.columns;
    const height = image?.height || entry.cell[1];
    this.handle = createPixelSpriteMaterial(this.texture, { width, height });
    this.clock = new PixelAnimationClock(entry, 'idle');
    this.applyCell(this.clock.cellIndex());
  }

  /** Builds the cell plane with the feet anchor on the local origin's X. */
  createGeometry(): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(this.layout.width, this.layout.height);
    geometry.translate(this.layout.anchorShiftX, 0, 0);
    return geometry;
  }

  play(name: string, restart = true): void {
    this.clock.play(name, restart);
    this.applyCell(this.clock.cellIndex());
  }

  get current(): string {
    return this.clock.name;
  }

  get done(): boolean {
    return this.clock.done;
  }

  update(dtSeconds: number): void {
    this.applyCell(this.clock.advance(dtSeconds * 1000, this.speed));
    if (this.handle.flash.value > 0) this.handle.flash.value = Math.max(0, this.handle.flash.value - dtSeconds * 6.5);
  }

  flash(amount = 0.85): void {
    this.handle.flash.value = Math.max(this.handle.flash.value, amount);
  }

  private applyCell(index: number): void {
    if (index === this.lastCell) return;
    this.lastCell = index;
    this.texture.offset.x = index / this.layout.columns;
  }

  dispose(): void {
    this.texture.dispose();
    this.handle.material.dispose();
  }
}
