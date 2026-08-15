import * as THREE from 'three';
import { getStaticVfxTierPresentation } from '../combatVfxPresentation';
import { getVfxPreset } from './VfxPresets';
import {
  VFX_SPRITE_SHEETS,
  configureVfxSpriteSheetTexture,
  disposeVfxSpriteSheetTextures,
  loadVfxSpriteSheetTexture,
  releaseVfxSpriteSheetTexture,
  resolveVfxSpriteSheetPresentation,
  setVfxSpriteSheetFrame,
  loadLabCandidateTexture,
  releaseLabCandidateTexture,
} from './VfxSpriteSheets';
import type { ResolvedVfxSpriteSheetPresentation, VfxSpriteSheetFrameDefinition, VfxSpriteSheetDefinition } from './VfxSpriteSheets';
import { getVfxTexture, disposeVfxTextures } from './VfxTextures';
import type {
  CinematicAnchor,
  CinematicDescriptor,
  CinematicOrientation,
  CinematicPhaseType,
  VfxAnchor,
  VfxContext,
  VfxPlayResult,
  VfxPreset,
  VfxSpriteSheetId,
  VfxStep,
  VfxTextureName,
  VfxUnitLike,
} from './VfxTypes';

const SHARED_PLANE = new THREE.PlaneGeometry(1, 1);
// Persistent combat badges use 60. Keep ground effects grounded and let short
// action impacts read clearly above both sprites and status feedback.
export const VFX_RENDER_ORDER = Object.freeze({ ground: 38, impact: 74 });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;
const easeInOut = (value: number) => (value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2);
const devReviewTextureLoader = new THREE.TextureLoader();

/** Dev-only source shape. It deliberately cannot be added to VFX_SPRITE_SHEETS. */
export interface DevVfxReviewSpriteSheetDefinition extends VfxSpriteSheetFrameDefinition {
  id: string;
  url: string;
  frameDurationMs: number;
  align: 'center' | 'bottom';
  blending: 'normal' | 'additive';
}

export interface DevVfxReviewPlaybackOptions {
  mode: 'billboard' | 'projectile';
  anchor: VfxAnchor;
  targetAnchor?: VfxAnchor;
  scale: number;
  opacity: number;
  /** Omit to preserve the source's native frame cadence during held review. */
  durationMs?: number;
  heightOffset?: number;
}

export const CINEMATIC_PHASE_TYPES: readonly CinematicPhaseType[] = Object.freeze([
  'cast', 'prePosition', 'travel', 'impact', 'aftermath',
]);

export const CINEMATIC_TIMING_GUIDELINES = Object.freeze({
  fourAp: { totalMs: [720, 950] as const, impactAtMs: [400, 550] as const },
  fiveAp: { totalMs: [1150, 1450] as const, impactAtMs: [650, 850] as const },
  boss: { totalMs: [1050, 1500] as const, apocalypseMaxMs: 1650 },
});

function asColor(value: string | number | undefined, fallback = 0xffffff) {
  return new THREE.Color(value ?? fallback);
}

function unitGround(unit?: VfxUnitLike | null) {
  return unit?.grp?.position.clone() ?? new THREE.Vector3();
}

// ============================================================ Visual Metrics

export interface VfxUnitVisualMetrics {
  ground: THREE.Vector3;
  center: THREE.Vector3;
  top: THREE.Vector3;
  radius: number;
  height: number;
}

const FALLBACK_NORMAL_HEIGHT = 1.56;
const FALLBACK_LARGE_HEIGHT = 2.36;
const TOP_PRESENTATION_MARGIN = 0.15;

export function resolveVfxUnitMetrics(unit?: VfxUnitLike | null): VfxUnitVisualMetrics {
  const ground = unitGround(unit);
  const size = unit?.size ?? 1;
  const visualHeight = unit?.visualHeight ?? (size > 1 ? FALLBACK_LARGE_HEIGHT : FALLBACK_NORMAL_HEIGHT);
  const baseY = unit?.baseY ?? visualHeight * 0.5;
  const center = ground.clone().add(new THREE.Vector3(0, baseY, 0));
  const top = ground.clone().add(new THREE.Vector3(0, baseY + visualHeight * 0.5 + TOP_PRESENTATION_MARGIN, 0));
  const radius = Math.max(0.3, visualHeight * 0.3);
  return { ground, center, top, radius, height: visualHeight };
}

function contextPresentationScale(context: VfxContext) {
  const tier = getStaticVfxTierPresentation(context.scaleTier ?? 'basic');
  return (context.staticScaleMultiplier ?? tier.scaleMultiplier)
    * clamp(context.presentationScale ?? 1, 0.55, 1.45);
}

function contextImpactOpacityFloor(context: VfxContext) {
  const tier = getStaticVfxTierPresentation(context.scaleTier ?? 'basic');
  return clamp(context.impactOpacityFloor ?? tier.impactOpacityFloor, 0, 1);
}

function contextImpactRenderOrder(context: VfxContext) {
  const tier = getStaticVfxTierPresentation(context.scaleTier ?? 'basic');
  return Math.max(VFX_RENDER_ORDER.impact, context.impactRenderOrder ?? tier.impactRenderOrder);
}

function contextTargetSizeMultiplier(context: VfxContext) {
  if (context.targetSizeMultiplier !== undefined) return context.targetSizeMultiplier;
  const size = context.targetUnits?.[0]?.size ?? 1;
  return size > 1 ? 1.3 : 1.0;
}

function foregroundPeakOpacity(value: number, context: VfxContext) {
  return clamp(Math.max(value, contextImpactOpacityFloor(context)) * (context.opacityMultiplier ?? 1), 0, 1);
}

function directionalRotation(step: VfxStep, context: VfxContext) {
  const orientation = step.orientation ?? context.cinematicPhase?.orientation ?? context.orientation;
  if (!orientation || orientation === 'none' || orientation === 'center_on_target'
    || orientation === 'center_on_aoe_origin' || orientation === 'source_to_destination') return 0;
  const source = resolveVfxAnchor('source', context).project(context.camera);
  const target = resolveVfxAnchor(step.targetAnchor ?? 'target', context).project(context.camera);
  return Math.atan2(target.y - source.y, target.x - source.x);
}

function cinematicAnchorToVfxAnchor(anchor: CinematicAnchor): VfxAnchor {
  switch (anchor) {
    case 'caster':
    case 'source':
    case 'self': return 'source';
    case 'target':
    case 'destination': return 'target';
    case 'impactPoint':
    case 'aoeOrigin':
    case 'arena': return 'groundTarget';
    default: return 'groundTarget';
  }
}

function cinematicOrientationToVfxOrientation(orientation?: CinematicOrientation) {
  return orientation === 'sky_descent' ? 'center_on_aoe_origin' : orientation;
}

export function validateCinematicDescriptor(
  descriptor: CinematicDescriptor | undefined,
  hasPreset: (presetId: string) => boolean = (presetId) => Boolean(getVfxPreset(presetId)),
) {
  const issues: string[] = [];
  if (!descriptor) return ['Missing cinematic descriptor.'];
  if (!descriptor.id) issues.push('Cinematic descriptor requires an id.');
  if (!Number.isFinite(descriptor.totalMs) || descriptor.totalMs <= 0) issues.push('totalMs must be positive.');
  if (!Number.isFinite(descriptor.impactAtMs) || descriptor.impactAtMs < 0 || descriptor.impactAtMs > descriptor.totalMs) {
    issues.push('impactAtMs must be within totalMs.');
  }
  if (!descriptor.phases.length) issues.push('Cinematic descriptor requires at least one phase.');
  const ids = new Set<string>();
  for (const phase of descriptor.phases) {
    if (!CINEMATIC_PHASE_TYPES.includes(phase.type)) issues.push(`Unknown phase type: ${phase.type}.`);
    if (!phase.id || ids.has(phase.id)) issues.push(`Phase ids must be unique: ${phase.id || '(missing)'}.`);
    ids.add(phase.id);
    if (!hasPreset(phase.preset)) issues.push(`Unknown VFX preset: ${phase.preset}.`);
    if (!Number.isFinite(phase.startMs) || phase.startMs < 0) issues.push(`Phase ${phase.id} startMs must be non-negative.`);
    if (!Number.isFinite(phase.durationMs) || phase.durationMs <= 0) issues.push(`Phase ${phase.id} durationMs must be positive.`);
    if (phase.startMs + phase.durationMs > descriptor.totalMs) {
      issues.push(`Phase ${phase.id} exceeds totalMs.`);
    }
    if (phase.orientation === 'sky_descent' && phase.type !== 'travel') {
      issues.push(`sky_descent is reserved for travel phases (${phase.id}).`);
    }
  }
  return issues;
}

export function getCinematicPlayablePhases(descriptor: CinematicDescriptor, reducedGraphics = false) {
  return descriptor.phases.filter((phase) => {
    const reduced = { ...descriptor.reducedGraphics, ...phase.reducedGraphics };
    if (!reducedGraphics) return true;
    if (reduced?.enabled === false) return false;
    return !(reduced?.skipSecondary && phase.type === 'aftermath');
  });
}

function unitBody(unit?: VfxUnitLike | null) {
  return resolveVfxUnitMetrics(unit).center;
}

function contextTargetPoint(context: VfxContext) {
  if (context.targetPoint) {
    return new THREE.Vector3(context.targetPoint.x, context.targetPoint.y, context.targetPoint.z);
  }
  const target = context.targetUnits?.[0];
  return target ? unitGround(target) : unitGround(context.sourceUnit);
}

export function resolveVfxAnchors(anchor: VfxAnchor, context: VfxContext): THREE.Vector3[] {
  const sourceMetrics = resolveVfxUnitMetrics(context.sourceUnit);
  const sourceGround = sourceMetrics.ground;
  const source = sourceMetrics.center;
  const targetUnit = context.targetUnits?.[0];
  const targetMetrics = resolveVfxUnitMetrics(targetUnit);
  const targetGround = targetUnit ? targetMetrics.ground : contextTargetPoint(context);
  const target = targetUnit ? targetMetrics.center : contextTargetPoint(context).add(new THREE.Vector3(0, 0.7, 0));

  // Caster→target ground-plane direction for FRONT/BACK
  const dirX = targetGround.x - sourceGround.x;
  const dirZ = targetGround.z - sourceGround.z;
  const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ);
  const ndirX = dirLen > 0.001 ? dirX / dirLen : 1;
  const ndirZ = dirLen > 0.001 ? dirZ / dirLen : 0;
  const targetRadius = targetMetrics.radius;

  switch (anchor) {
    case 'source': return [source];
    case 'sourceGround': return [sourceGround.clone().add(new THREE.Vector3(0, 0.055, 0))];
    case 'target': return [target];
    case 'targetGround': return [targetGround.clone().add(new THREE.Vector3(0, 0.055, 0))];
    case 'groundTarget': return [contextTargetPoint(context).add(new THREE.Vector3(0, 0.055, 0))];
    case 'midpoint': return [source.clone().add(target).multiplyScalar(0.5)];
    case 'allTargets': {
      const targets = context.targetUnits?.length
        ? context.targetUnits.map((unit) => resolveVfxUnitMetrics(unit).center)
        : [target];
      return targets;
    }
    case 'camera': return [context.camera.position.clone()];
    case 'screen': return [new THREE.Vector3()];
    default: return [target];
  }
}

export function resolveVfxAnchor(anchor: VfxAnchor, context: VfxContext) {
  return resolveVfxAnchors(anchor, context)[0] ?? new THREE.Vector3();
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) item.dispose();
    return;
  }
  material.dispose();
}

export function cleanupVfxObjects(objects: Iterable<THREE.Object3D>) {
  for (const object of objects) {
    object.removeFromParent();
    const renderable = object as THREE.Object3D & { material?: THREE.Material | THREE.Material[] };
    if (renderable.material) disposeMaterial(renderable.material);
  }
}

function animate(
  duration: number,
  frame: (progress: number, eased: number) => void,
  isActive: () => boolean = () => true,
) {
  if (!isActive()) return Promise.resolve();
  if (duration <= 0) {
    frame(1, 1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      if (!isActive()) {
        resolve();
        return;
      }
      const progress = clamp((now - start) / (duration * 1000), 0, 1);
      frame(progress, easeOutCubic(progress));
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function waitSeconds(seconds: number, context: VfxContext) {
  if (seconds <= 0) return Promise.resolve();
  return context.helpers?.wait?.(seconds) ?? new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
}

function blendingFor(step: VfxStep) {
  return step.blending === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending;
}

function spriteSheetBlending(resolved: ResolvedVfxSpriteSheetPresentation, step: VfxStep) {
  if (step.spritePresentation?.blending !== undefined) {
    return resolved.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending;
  }
  return resolved.blending === 'additive' ? THREE.AdditiveBlending : blendingFor(step);
}

export function spriteSheetEnvelope(progress: number, resolved: ResolvedVfxSpriteSheetPresentation) {
  const { fadeIn, fadeOut } = resolved;
  if (fadeIn <= 0 && fadeOut >= 1) return 1;
  const fadeInProgress = easeOutCubic(clamp(progress / Math.max(fadeIn, 0.001), 0, 1));
  const fadeOutProgress = clamp((progress - fadeOut) / Math.max(1 - fadeOut, 0.001), 0, 1);
  return fadeInProgress * (1 - easeInOut(fadeOutProgress));
}

function spriteSheetScalePulse(progress: number, resolved: ResolvedVfxSpriteSheetPresentation) {
  const peak = clamp(progress / resolved.fadeOut, 0, 1);
  return 0.94 + Math.sin(Math.PI * peak) * 0.12;
}

/**
 * Three.Sprite scales around its center by default. A fixed Y offset therefore
 * cannot keep a bottom-aligned effect grounded while its scale pulse changes.
 * Pinning the actual sprite pivot to its lower edge keeps the authored baseline
 * stable without altering frame UVs or production PNGs.
 */
export function configureVfxSpriteSheetPivot(
  sprite: THREE.Sprite,
  align: 'center' | 'bottom',
) {
  sprite.center.set(0.5, align === 'bottom' ? 0 : 0.5);
  return sprite;
}

function makeSprite(step: VfxStep, textureName: VfxTextureName, context: VfxContext, color?: string | number) {
  const material = new THREE.SpriteMaterial({
    map: getVfxTexture(textureName),
    color: asColor(color ?? step.color),
    transparent: true,
    opacity: foregroundPeakOpacity(step.opacity ?? 1, context),
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    fog: false,
    blending: blendingFor(step),
    rotation: step.rotation ?? 0,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = contextImpactRenderOrder(context);
  return sprite;
}

function makeGroundPlane(step: VfxStep, textureName: VfxTextureName) {
  const material = new THREE.MeshBasicMaterial({
    map: getVfxTexture(textureName),
    color: asColor(step.color),
    transparent: true,
    opacity: step.opacity ?? 0.8,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    fog: false,
    side: THREE.DoubleSide,
    blending: blendingFor(step),
  });
  const plane = new THREE.Mesh(SHARED_PLANE, material);
  plane.rotation.x = -Math.PI / 2;
  plane.rotation.z = step.rotation ?? 0;
  plane.renderOrder = VFX_RENDER_ORDER.ground;
  return plane;
}

interface ParticleEntry {
  sprite: THREE.Sprite;
  origin: THREE.Vector3;
  velocity: THREE.Vector3;
  baseScale: number;
  delay: number;
}

export class VfxSystem {
  private readonly activeObjects = new Set<THREE.Object3D>();
  private disposed = false;
  private resolveDisposal: (() => void) | null = null;
  private readonly disposal = new Promise<void>((resolve) => {
    this.resolveDisposal = resolve;
  });

  get activeObjectCount(): number {
    return this.activeObjects.size;
  }

  play(presetId: string, context: VfxContext): VfxPlayResult {
    const preset = this.disposed ? undefined : getVfxPreset(presetId);
    if (!preset) {
      return { played: false, presetId, impactTime: 0, completion: Promise.resolve() };
    }
    return this.playPreset(preset, context, presetId);
  }

  /**
   * Plays a preset directly without looking it up by ID. Used by the Lab
   * for QA override playback with modified presets.
   */
  playPreset(preset: VfxPreset, context: VfxContext, presetId?: string): VfxPlayResult {
    if (this.disposed) {
      return { played: false, presetId: presetId ?? preset.id, impactTime: 0, completion: Promise.resolve() };
    }
    const durationScale = clamp(context.durationScale ?? 1, 0.45, 1.75);
    const completion = Promise.all(
      preset.steps.map((step) => this.scheduleStep(step, preset, context, durationScale)),
    ).then(() => undefined);
    return {
      played: true,
      presetId: presetId ?? preset.id,
      impactTime: preset.impactTime * durationScale,
      completion,
    };
  }

  /**
   * Lab sprite-sheet playback through VfxResourceManager.
   *
   * Plays a single CartoonCoffee candidate sprite sheet using the same
   * billboard pipeline as production playback. The texture is loaded and
   * released through the shared VfxResourceManager — no second texture cache.
   *
   * Presentation overrides (scale, opacity, fadeIn, fadeOut, layer, blending,
   * offsetX, offsetY, duration) are applied from the QA state.
   */
  playLabSpriteSheet(
    candidateId: string,
    sheetDef: VfxSpriteSheetDefinition,
    step: VfxStep,
    context: VfxContext,
    overrides: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      duration?: number;
      opacity?: number;
      layer?: 'ground' | 'impact';
      blending?: 'normal' | 'additive';
      fadeIn?: number;
      fadeOut?: number;
      mirrorX?: number;
      mirrorY?: number;
      pivotCenterX?: number;
      pivotCenterY?: number;
      rotationOffset?: number;
      aimProfile?: string;
    },
    options?: { strict?: boolean },
  ): VfxPlayResult {
    if (this.disposed) {
      return { played: false, presetId: `lab:${candidateId}`, impactTime: 0, completion: Promise.resolve() };
    }
    const strict = options?.strict ?? false;
    return {
      played: true,
      presetId: `lab:${candidateId}`,
      impactTime: (overrides.duration ?? step.duration) / 2,
      completion: this.playLabSpriteSheetInternal(candidateId, sheetDef, step, context, overrides).catch((error) => {
        console.warn(`[CombatVfx] Lab candidate ${candidateId} failed safely.`, error);
        if (strict) throw error;
      }),
    };
  }

  private async playLabSpriteSheetInternal(
    candidateId: string,
    sheetDef: VfxSpriteSheetDefinition,
    step: VfxStep,
    context: VfxContext,
    overrides: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      duration?: number;
      opacity?: number;
      layer?: 'ground' | 'impact';
      blending?: 'normal' | 'additive';
      fadeIn?: number;
      fadeOut?: number;
      mirrorX?: number;
      mirrorY?: number;
      pivotCenterX?: number;
      pivotCenterY?: number;
      rotationOffset?: number;
      aimProfile?: string;
    },
  ) {
    const texture = await loadLabCandidateTexture(candidateId);
    if (this.disposed) {
      releaseLabCandidateTexture(candidateId, texture);
      return;
    }
    setVfxSpriteSheetFrame(texture, sheetDef, 0);
    const resolved = resolveVfxSpriteSheetPresentation(sheetDef, step);
    const effectiveLayer = overrides.layer ?? resolved.layer;
    const effectiveBlending = overrides.blending ?? resolved.blending;
    const effectiveScale = overrides.scale ?? resolved.scaleMultiplier;
    const effectiveOpacity = overrides.opacity ?? resolved.opacityMultiplier;
    const effectiveFadeIn = overrides.fadeIn ?? resolved.fadeIn;
    const effectiveFadeOut = overrides.fadeOut ?? resolved.fadeOut;
    const effectiveResolved: ResolvedVfxSpriteSheetPresentation = {
      align: resolved.align,
      layer: effectiveLayer,
      blending: effectiveBlending,
      scaleMultiplier: effectiveScale,
      opacityMultiplier: effectiveOpacity,
      fadeIn: effectiveFadeIn,
      fadeOut: effectiveFadeOut,
    };
    // Transform: pivot (override sprite center)
    const pivotX = overrides.pivotCenterX ?? 0.5;
    const pivotY = overrides.pivotCenterY ?? (resolved.align === 'bottom' ? 0 : 0.5);
    // Transform: mirror signs (default 1 = no mirror)
    const mirrorX = overrides.mirrorX ?? 1;
    const mirrorY = overrides.mirrorY ?? 1;
    // Transform: rotation — combine directional rotation + authored offset
    const dirRot = directionalRotation(step, context);
    const rotationOffset = overrides.rotationOffset ?? 0;
    const aimProfile = overrides.aimProfile ?? 'FIXED';
    const effectiveRotation = aimProfile === 'TO_TARGET' ? dirRot + rotationOffset : rotationOffset;
    // Transform: AUTO_HORIZONTAL — flip X based on screen-space direction
    let effectiveMirrorX = mirrorX;
    if (aimProfile === 'TO_TARGET' && mirrorX === -1) {
      // AUTO_HORIZONTAL: check screen-space direction
      const sourceProj = resolveVfxAnchor('source', context).project(context.camera);
      const targetProj = resolveVfxAnchor('target', context).project(context.camera);
      effectiveMirrorX = targetProj.x < sourceProj.x ? -1 : 1;
    }
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: effectiveLayer === 'ground',
      toneMapped: false,
      fog: false,
      blending: effectiveBlending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      rotation: effectiveRotation,
    });
    const sprite = new THREE.Sprite(material);
    sprite.center.set(pivotX, pivotY);
    this.track(sprite, context);
    const objects: THREE.Object3D[] = [sprite];
    const anchor = resolveVfxAnchor(step.anchor, context);
    anchor.y += step.heightOffset ?? 0;
    anchor.x += overrides.offsetX ?? 0;
    anchor.y += overrides.offsetY ?? 0;
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const baseHeight = (step.scale ?? 1)
      * effectiveScale
      * intensity
      * (context.reducedGraphics ? 0.94 : 1)
      * contextPresentationScale(context)
      * contextTargetSizeMultiplier(context);
    const frameAspect = sheetDef.rows / sheetDef.cols;
    const requestedOpacity = (step.opacity ?? 1) * effectiveOpacity;
    const baseOpacity = effectiveLayer === 'ground'
      ? clamp(requestedOpacity * (context.opacityMultiplier ?? 1), 0, 1)
      : foregroundPeakOpacity(requestedOpacity, context);
    sprite.renderOrder = effectiveLayer === 'ground'
      ? VFX_RENDER_ORDER.ground
      : contextImpactRenderOrder(context);
    sprite.position.copy(anchor);
    const duration = overrides.duration ?? step.duration;
    try {
      await this.animate(duration, (progress) => {
        const frame = Math.min(sheetDef.frameCount - 1, Math.floor(progress * sheetDef.frameCount));
        const scale = baseHeight * spriteSheetScalePulse(progress, effectiveResolved);
        setVfxSpriteSheetFrame(texture, sheetDef, frame);
        sprite.position.copy(anchor);
        sprite.scale.set(scale * frameAspect * effectiveMirrorX, scale * mirrorY, 1);
        material.opacity = baseOpacity * spriteSheetEnvelope(progress, effectiveResolved);
      });
    } finally {
      this.cleanup(objects);
      releaseLabCandidateTexture(candidateId, texture);
    }
  }

  /**
   * Isolated R2C-A source preview. It loads a held asset directly for local
   * review, without registering it as a combat preset or production asset.
   */
  playDevReviewSpriteSheet(
    definition: DevVfxReviewSpriteSheetDefinition,
    context: VfxContext,
    options: DevVfxReviewPlaybackOptions,
  ): VfxPlayResult {
    if (this.disposed) {
      return { played: false, presetId: `review:${definition.id}`, impactTime: 0, completion: Promise.resolve() };
    }
    const durationMs = options.durationMs ?? definition.frameDurationMs * definition.frameCount;
    return {
      played: true,
      presetId: `review:${definition.id}`,
      impactTime: durationMs / 2000,
      completion: this.playDevReviewSpriteSheetInternal(definition, context, options).catch((error) => {
        console.warn(`[CombatVfx] Held R2C-A source ${definition.id} failed safely.`, error);
      }),
    };
  }

  /**
   * Plays presentation phases on top of the existing preset library. It only
   * changes timing, anchor and intensity; combat resolution still happens in
   * the legacy runtime at its usual impact point.
   */
  playCinematic(descriptor: CinematicDescriptor, context: VfxContext, fallbackPresetId?: string): VfxPlayResult {
    if (this.disposed) {
      return { played: false, presetId: descriptor.id, impactTime: 0, completion: Promise.resolve() };
    }
    const issues = validateCinematicDescriptor(descriptor);
    if (issues.length) {
      console.warn('[CombatVfx] Invalid cinematic descriptor; using stable fallback.', issues);
      return fallbackPresetId ? this.play(fallbackPresetId, context) : {
        played: false,
        presetId: descriptor.id,
        impactTime: 0,
        completion: Promise.resolve(),
      };
    }

    const sequenceDurationScale = clamp(context.durationScale ?? 1, 0.45, 1.75);
    const phases = getCinematicPlayablePhases(descriptor, Boolean(context.reducedGraphics));
    const completion = Promise.all(phases.map(async (phase) => {
      const phaseReduced = context.reducedGraphics
        ? { ...descriptor.reducedGraphics, ...phase.reducedGraphics }
        : undefined;
      const phaseDurationMultiplier = clamp(phaseReduced?.durationMultiplier ?? 1, 0.45, 1.25);
      await this.wait((phase.startMs / 1000) * sequenceDurationScale, context);
      if (this.disposed) return;
      const preset = getVfxPreset(phase.preset);
      if (!preset) return;
      const phaseDurationScale = (phase.durationMs / 1000) / preset.duration;
      const intensity = (context.intensity ?? 1)
        * clamp(phase.intensity ?? 1, 0.35, 1.8)
        * clamp(phaseReduced?.intensityMultiplier ?? 1, 0.35, 1.2);
      const phaseContext: VfxContext = {
        ...context,
        intensity,
        durationScale: sequenceDurationScale * phaseDurationScale * phaseDurationMultiplier,
        presentationScale: (context.presentationScale ?? 1) * clamp(phase.scaleMultiplier ?? 1, 0.4, 2.5),
        opacityMultiplier: (context.opacityMultiplier ?? 1) * clamp(phase.opacityMultiplier ?? 1, 0.15, 1.5),
        cinematicPhase: {
          anchor: cinematicAnchorToVfxAnchor(phase.anchor),
          orientation: cinematicOrientationToVfxOrientation(phase.orientation),
          ...(phase.orientation === 'sky_descent' ? { skyDescent: phase.skyDescent } : {}),
        },
      };
      await this.play(phase.preset, phaseContext).completion;
    })).then(() => undefined);

    return {
      played: true,
      presetId: descriptor.id,
      impactTime: (descriptor.impactAtMs / 1000) * sequenceDurationScale,
      completion,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.resolveDisposal?.();
    this.resolveDisposal = null;
    cleanupVfxObjects(this.activeObjects);
    this.activeObjects.clear();
    disposeVfxTextures();
    disposeVfxSpriteSheetTextures();
  }

  private wait(seconds: number, context: VfxContext): Promise<void> {
    if (this.disposed || seconds <= 0) return Promise.resolve();
    return Promise.race([waitSeconds(seconds, context), this.disposal]).then(() => undefined);
  }

  private animate(duration: number, frame: (progress: number, eased: number) => void): Promise<void> {
    return animate(duration, frame, () => !this.disposed);
  }

  private track<T extends THREE.Object3D>(object: T, context: VfxContext) {
    if (this.disposed) return object;
    this.activeObjects.add(object);
    context.scene.add(object);
    return object;
  }

  private cleanup(objects: THREE.Object3D[]) {
    cleanupVfxObjects(objects);
    for (const object of objects) this.activeObjects.delete(object);
  }

  private quality(step: VfxStep, preset: VfxPreset, context: VfxContext) {
    if (!context.reducedGraphics) return 1;
    return clamp(step.reducedGraphicsMultiplier ?? preset.reducedGraphicsScale, 0.25, 0.75);
  }

  private adjustedCount(step: VfxStep, preset: VfxPreset, context: VfxContext) {
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    return Math.max(1, Math.round((step.count ?? 1) * intensity * this.quality(step, preset, context)));
  }

  private withCinematicOverrides(step: VfxStep, context: VfxContext): VfxStep {
    const phase = context.cinematicPhase;
    if (!phase && context.opacityMultiplier === undefined) return step;
    const skyDescent = phase?.skyDescent;
    return {
      ...step,
      anchor: phase?.anchor ?? step.anchor,
      orientation: phase?.orientation ?? step.orientation,
      opacity: (step.opacity ?? 1) * (context.opacityMultiplier ?? 1),
      ...(skyDescent ? { sheetMode: 'sky_descent' as const, skyDescent } : {}),
    };
  }

  private async scheduleStep(step: VfxStep, preset: VfxPreset, context: VfxContext, durationScale: number) {
    const effectiveStep = this.withCinematicOverrides(step, context);
    await this.wait(effectiveStep.startTime * durationScale, context);
    if (this.disposed) return;
    const duration = effectiveStep.duration * durationScale;
    try {
      if (effectiveStep.type === 'screenShake') {
        const magnitude = (effectiveStep.scale ?? 0.2) * clamp(context.intensity ?? 1, 0.35, 1.8) * this.quality(effectiveStep, preset, context);
        context.helpers?.screenShake?.(magnitude, duration);
        await this.wait(duration, context);
        return;
      }
      if (effectiveStep.type === 'screenFlash') {
        const emphasis = clamp(context.intensity ?? 1, 0.7, 1.25);
        const opacity = Math.min(0.22, (effectiveStep.opacity ?? 0.12) * emphasis * this.quality(effectiveStep, preset, context));
        if (context.helpers?.screenFlash) context.helpers.screenFlash(String(effectiveStep.color ?? '#ffffff'), opacity);
        else this.fallbackScreenFlash(String(effectiveStep.color ?? '#ffffff'), opacity, duration);
        await this.wait(duration, context);
        return;
      }
      if (effectiveStep.type === 'hitStop') {
        await this.wait(duration, context);
        return;
      }
      if (effectiveStep.type === 'projectile') {
        await this.playProjectile(effectiveStep, preset, context, duration);
        return;
      }
      if (effectiveStep.type === 'spriteSheet' && effectiveStep.sheetMode === 'projectile') {
        await this.playSpriteSheetProjectile(effectiveStep, preset, context, duration);
        return;
      }
      if (effectiveStep.type === 'spriteSheet' && effectiveStep.sheetMode === 'sky_descent') {
        await this.playSpriteSheetSkyDescent(effectiveStep, preset, context, duration);
        return;
      }

      const anchors = resolveVfxAnchors(effectiveStep.anchor, context);
      await Promise.all(anchors.map((anchor) => this.playAtAnchor(effectiveStep, preset, context, duration, anchor)));
    } catch (error) {
      console.warn(`[CombatVfx] Step ${effectiveStep.type} failed safely.`, error);
    }
  }

  private async playAtAnchor(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
    anchor: THREE.Vector3,
  ) {
    anchor.y += step.heightOffset ?? 0;
    const groundYOffset = context.groundYOffset ?? 0;
    const isGroundBased = step.type === 'spriteSheet'
      || step.type === 'shockwave'
      || step.type === 'groundRing'
      || step.type === 'magicCircle'
      || step.type === 'particleBurst'
      || step.type === 'smokePuff';
    if (isGroundBased && groundYOffset !== 0) {
      anchor.y += groundYOffset;
    }
    switch (step.type) {
      case 'particleBurst':
        await this.playParticles(step, preset, context, duration, anchor, false, false);
        break;
      case 'sparkleBurst':
        await this.playParticles(step, preset, context, duration, anchor, true, false);
        break;
      case 'smokePuff':
        await this.playParticles(step, preset, context, duration, anchor, false, true);
        break;
      case 'slashArc':
      case 'impactStar':
        await this.playBillboard(step, context, duration, anchor);
        break;
      case 'spriteSheet':
        await this.playSpriteSheetBillboard(step, preset, context, duration, anchor);
        break;
      case 'shockwave':
        await this.playGroundPulse(step, preset, context, duration, anchor, true);
        break;
      case 'groundRing':
      case 'magicCircle':
        await this.playGroundPulse(step, preset, context, duration, anchor, false);
        break;
      case 'lightPulse':
        await this.playLightPulse(step, preset, context, duration, anchor);
        break;
      default:
        break;
    }
  }

  private async playBillboard(step: VfxStep, context: VfxContext, duration: number, anchor: THREE.Vector3) {
    const texture = step.texture ?? (step.type === 'slashArc' ? 'slashArc' : 'impactStar');
    const sprite = this.track(makeSprite(step, texture, context), context);
    const objects: THREE.Object3D[] = [sprite];
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const baseScale = (step.scale ?? 1) * intensity * contextPresentationScale(context);
    sprite.position.copy(anchor);
    (sprite.material as THREE.SpriteMaterial).rotation += directionalRotation(step, context);
    sprite.scale.setScalar(baseScale * 0.32);
    try {
      await this.animate(duration, (progress, eased) => {
        const pulse = progress < 0.36 ? progress / 0.36 : 1 - (progress - 0.36) / 0.64;
        sprite.scale.setScalar(baseScale * (0.32 + eased * 0.83));
        (sprite.material as THREE.SpriteMaterial).opacity = foregroundPeakOpacity(step.opacity ?? 1, context) * clamp(pulse, 0, 1);
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private async playParticles(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
    anchor: THREE.Vector3,
    vertical: boolean,
    smoke: boolean,
  ) {
    const texture = step.texture ?? (vertical ? 'sparkle' : smoke ? 'smokePuff' : 'softParticle');
    const count = this.adjustedCount(step, preset, context);
    const particleScale = clamp(context.particleScale ?? 1, 0.45, 1.8);
    const spread = step.spread ?? 0.85;
    const speed = step.speed ?? 1;
    const rise = step.rise ?? (vertical ? 1.25 : 0.55);
    const entries: ParticleEntry[] = [];
    const objects: THREE.Object3D[] = [];
    for (let index = 0; index < count; index += 1) {
      const color = index % 3 === 0 && step.secondaryColor ? step.secondaryColor : step.color;
      const sprite = this.track(makeSprite(step, texture, context, color), context);
      const angle = Math.random() * Math.PI * 2;
      const radial = Math.random() * spread;
      const origin = anchor.clone();
      origin.x += Math.cos(angle) * radial * (vertical ? 0.55 : 0.2);
      origin.z += Math.sin(angle) * radial * (vertical ? 0.55 : 0.2);
      const velocity = new THREE.Vector3(
        Math.cos(angle) * radial * speed,
        (vertical ? 0.75 + Math.random() * 0.55 : 0.18 + Math.random() * rise) * speed,
        Math.sin(angle) * radial * speed,
      );
      if (smoke) velocity.multiplyScalar(0.48);
    const baseScale = (step.scale ?? 0.14) * particleScale * contextPresentationScale(context) * (0.72 + Math.random() * 0.52);
      sprite.position.copy(origin);
      sprite.scale.setScalar(smoke ? baseScale * 0.65 : baseScale * 0.35);
      entries.push({ sprite, origin, velocity, baseScale, delay: vertical ? Math.random() * 0.18 : 0 });
      objects.push(sprite);
    }
    try {
      await this.animate(duration, (progress) => {
        for (const entry of entries) {
          const local = clamp((progress - entry.delay) / (1 - entry.delay), 0, 1);
          entry.sprite.visible = local > 0;
          entry.sprite.position.copy(entry.origin).addScaledVector(entry.velocity, easeOutCubic(local));
          const scale = smoke
            ? entry.baseScale * (0.65 + local * 1.2)
            : entry.baseScale * (0.35 + Math.sin(Math.PI * local) * 0.9);
          entry.sprite.scale.setScalar(scale);
          (entry.sprite.material as THREE.SpriteMaterial).opacity = (step.opacity ?? 0.85) * (1 - local) ** (smoke ? 1.35 : 0.78);
        }
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private async playProjectile(step: VfxStep, preset: VfxPreset, context: VfxContext, duration: number) {
    const start = resolveVfxAnchor(step.anchor, context);
    const end = resolveVfxAnchor(step.targetAnchor ?? 'target', context);
    end.y += step.heightOffset ?? 0;
    const count = this.adjustedCount(step, preset, context);
    const core = this.track(makeSprite(step, step.texture ?? 'projectileCore', context), context);
    const objects: THREE.Object3D[] = [core];
    const baseScale = (step.scale ?? 0.28) * clamp(context.particleScale ?? 1, 0.45, 1.8) * contextPresentationScale(context);
    core.position.copy(start);
    core.scale.setScalar(baseScale);
    const trails: THREE.Sprite[] = [];
    for (let index = 0; index < count; index += 1) {
      const trailStep = { ...step, opacity: (step.opacity ?? 0.9) * 0.42 };
      const trail = this.track(makeSprite(
        trailStep,
        'softParticle',
        context,
        index % 2 ? step.secondaryColor : step.color,
      ), context);
      trail.position.copy(start);
      trail.scale.setScalar(baseScale * (0.46 - index * 0.018));
      trails.push(trail);
      objects.push(trail);
    }
    try {
      await this.animate(duration, (progress, eased) => {
        const arc = Math.sin(Math.PI * eased) * 0.42;
        core.position.lerpVectors(start, end, eased);
        core.position.y += arc;
        core.scale.setScalar(baseScale * (0.92 + Math.sin(progress * Math.PI * 5) * 0.1));
        for (let index = 0; index < trails.length; index += 1) {
          const lag = (index + 1) * 0.032;
          const local = clamp(eased - lag, 0, 1);
          const trail = trails[index];
          if (!trail) continue;
          trail.position.lerpVectors(start, end, local);
          trail.position.y += Math.sin(Math.PI * local) * 0.42;
          (trail.material as THREE.SpriteMaterial).opacity = (step.opacity ?? 0.9) * 0.42 * Math.sin(Math.PI * clamp(progress * 1.18, 0, 1));
        }
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private async playSpriteSheetBillboard(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
    anchor: THREE.Vector3,
  ) {
    if (!step.spriteSheet) return;
    const definition = VFX_SPRITE_SHEETS[step.spriteSheet];
    if (!definition) {
      if (import.meta.env?.DEV) console.warn(`[VFX] Unresolved sprite sheet: ${step.spriteSheet} — skipping (legacy asset deleted)`);
      return;
    }
    const texture = await loadVfxSpriteSheetTexture(step.spriteSheet);
    if (this.disposed) {
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
      return;
    }
    setVfxSpriteSheetFrame(texture, definition, 0);
    const resolved = resolveVfxSpriteSheetPresentation(definition, step);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: resolved.layer === 'ground',
      toneMapped: false,
      fog: false,
      blending: spriteSheetBlending(resolved, step),
      rotation: step.rotation ?? 0,
    });
    const sprite = this.track(configureVfxSpriteSheetPivot(new THREE.Sprite(material), resolved.align), context);
    const objects: THREE.Object3D[] = [sprite];
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const quality = this.quality(step, preset, context);
    const baseHeight = (step.scale ?? 1)
      * resolved.scaleMultiplier
      * intensity
      * (context.reducedGraphics ? 0.94 : 1)
      * contextPresentationScale(context)
      * contextTargetSizeMultiplier(context);
    const frameAspect = definition.rows / definition.cols;
    const requestedOpacity = (step.opacity ?? 1)
      * resolved.opacityMultiplier
      * (context.reducedGraphics ? 0.94 + quality * 0.06 : 1);
    const baseOpacity = resolved.layer === 'ground'
      ? clamp(requestedOpacity * (context.opacityMultiplier ?? 1), 0, 1)
      : foregroundPeakOpacity(requestedOpacity, context);
    sprite.renderOrder = resolved.layer === 'ground'
      ? VFX_RENDER_ORDER.ground
      : contextImpactRenderOrder(context);
    sprite.position.copy(anchor);
    try {
      await this.animate(duration, (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        const scale = baseHeight * spriteSheetScalePulse(progress, resolved);
        setVfxSpriteSheetFrame(texture, definition, frame);
        sprite.position.copy(anchor);
        sprite.scale.set(scale * frameAspect, scale, 1);
        material.opacity = baseOpacity * spriteSheetEnvelope(progress, resolved);
      });
    } finally {
      this.cleanup(objects);
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
    }
  }

  private async playDevReviewSpriteSheetInternal(
    definition: DevVfxReviewSpriteSheetDefinition,
    context: VfxContext,
    options: DevVfxReviewPlaybackOptions,
  ) {
    const texture = configureVfxSpriteSheetTexture(await devReviewTextureLoader.loadAsync(definition.url));
    if (this.disposed) {
      texture.dispose();
      return;
    }
    setVfxSpriteSheetFrame(texture, definition, 0);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: options.opacity,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      fog: false,
      blending: definition.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const sprite = this.track(configureVfxSpriteSheetPivot(new THREE.Sprite(material), definition.align), context);
    const objects: THREE.Object3D[] = [sprite];
    const start = resolveVfxAnchor(options.anchor, context);
    const end = options.mode === 'projectile'
      ? resolveVfxAnchor(options.targetAnchor ?? 'target', context)
      : start.clone();
    start.y += options.heightOffset ?? 0;
    end.y += options.heightOffset ?? 0;
    const projectedStart = start.clone().project(context.camera);
    const projectedEnd = end.clone().project(context.camera);
    if (options.mode === 'projectile') {
      material.rotation = Math.atan2(projectedEnd.y - projectedStart.y, projectedEnd.x - projectedStart.x);
    }
    const qualityScale = context.reducedGraphics ? 0.9 : 1;
    const baseScale = options.scale * qualityScale;
    const aspect = definition.rows / definition.cols;
    sprite.renderOrder = VFX_RENDER_ORDER.impact + 1;
    try {
      const durationMs = options.durationMs ?? definition.frameDurationMs * definition.frameCount;
      await this.animate(Math.max(0.24, durationMs / 1000), (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        const travel = easeOutCubic(clamp(progress / 0.78, 0, 1));
        const envelope = progress < 0.05 ? progress / 0.05 : progress > 0.84 ? (1 - progress) / 0.16 : 1;
        const pulse = 0.94 + Math.sin(Math.PI * progress) * (context.reducedGraphics ? 0.035 : 0.085);
        setVfxSpriteSheetFrame(texture, definition, frame);
        sprite.position.lerpVectors(start, end, options.mode === 'projectile' ? travel : 0);
        if (options.mode === 'projectile') sprite.position.y += Math.sin(Math.PI * travel) * 0.28;
        sprite.scale.set(baseScale * aspect * pulse, baseScale * pulse, 1);
        material.opacity = clamp(options.opacity * envelope, 0, 1);
      });
    } finally {
      this.cleanup(objects);
      texture.dispose();
    }
  }

  private async playSpriteSheetProjectile(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
  ) {
    if (!step.spriteSheet) return;
    const definition = VFX_SPRITE_SHEETS[step.spriteSheet];
    if (!definition) {
      if (import.meta.env?.DEV) console.warn(`[VFX] Unresolved sprite sheet: ${step.spriteSheet} — skipping (legacy asset deleted)`);
      return;
    }
    const texture = await loadVfxSpriteSheetTexture(step.spriteSheet);
    if (this.disposed) {
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
      return;
    }
    setVfxSpriteSheetFrame(texture, definition, 0);
    const resolved = resolveVfxSpriteSheetPresentation(definition, step);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: resolved.layer === 'ground',
      toneMapped: false,
      fog: false,
      blending: spriteSheetBlending(resolved, step),
      rotation: step.rotation ?? 0,
    });
    const sprite = this.track(new THREE.Sprite(material), context);
    const objects: THREE.Object3D[] = [sprite];
    const start = resolveVfxAnchor(step.anchor, context);
    const end = resolveVfxAnchor(step.targetAnchor ?? 'target', context);
    end.y += step.heightOffset ?? 0;
    const baseHeight = (step.scale ?? 0.9)
      * resolved.scaleMultiplier
      * clamp(context.particleScale ?? 1, 0.45, 1.8)
      * (context.reducedGraphics ? 0.94 : 1)
      * contextPresentationScale(context);
    const frameAspect = definition.rows / definition.cols;
    const quality = this.quality(step, preset, context);
    const requestedOpacity = (step.opacity ?? 1)
      * resolved.opacityMultiplier
      * (context.reducedGraphics ? 0.94 + quality * 0.06 : 1);
    const baseOpacity = resolved.layer === 'ground'
      ? clamp(requestedOpacity * (context.opacityMultiplier ?? 1), 0, 1)
      : foregroundPeakOpacity(requestedOpacity, context);
    const projectedStart = start.clone().project(context.camera);
    const projectedEnd = end.clone().project(context.camera);
    material.rotation += Math.atan2(projectedEnd.y - projectedStart.y, projectedEnd.x - projectedStart.x);
    sprite.renderOrder = resolved.layer === 'ground'
      ? VFX_RENDER_ORDER.ground
      : contextImpactRenderOrder(context);
    sprite.position.copy(start);
    try {
      await this.animate(duration, (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        const travel = easeOutCubic(clamp(progress / 0.67, 0, 1));
        const scale = baseHeight * spriteSheetScalePulse(progress, resolved);
        setVfxSpriteSheetFrame(texture, definition, frame);
        sprite.position.lerpVectors(start, end, travel);
        sprite.position.y += Math.sin(Math.PI * travel) * 0.24;
        sprite.scale.set(scale * frameAspect, scale, 1);
        material.opacity = baseOpacity * spriteSheetEnvelope(progress, resolved);
      });
    } finally {
      this.cleanup(objects);
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
    }
  }

  /**
   * A reusable sky-to-ground trajectory for future cinematic attacks. The
   * destination is still the exact tactical impact anchor; only the sprite's
   * visual origin is raised and offset for readability.
   */
  private async playSpriteSheetSkyDescent(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
  ) {
    if (!step.spriteSheet) return;
    const definition = VFX_SPRITE_SHEETS[step.spriteSheet];
    if (!definition) {
      if (import.meta.env?.DEV) console.warn(`[VFX] Unresolved sprite sheet: ${step.spriteSheet} — skipping (legacy asset deleted)`);
      return;
    }
    const texture = await loadVfxSpriteSheetTexture(step.spriteSheet);
    if (this.disposed) {
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
      return;
    }
    setVfxSpriteSheetFrame(texture, definition, 0);
    const resolved = resolveVfxSpriteSheetPresentation(definition, step);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: resolved.layer === 'ground',
      toneMapped: false,
      fog: false,
      blending: spriteSheetBlending(resolved, step),
      rotation: step.rotation ?? 0,
    });
    const sprite = this.track(configureVfxSpriteSheetPivot(new THREE.Sprite(material), resolved.align), context);
    const objects: THREE.Object3D[] = [sprite];
    const options = step.skyDescent ?? {};
    const end = resolveVfxAnchor(step.targetAnchor ?? step.anchor, context);
    end.y += step.heightOffset ?? 0;
    const lateral = options.lateralOffset ?? {};
    const start = end.clone().add(new THREE.Vector3(
      lateral.x ?? 0.85,
      options.startHeight ?? 4.8,
      lateral.z ?? -0.62,
    ));
    const baseHeight = (step.scale ?? 1)
      * resolved.scaleMultiplier
      * clamp(context.particleScale ?? 1, 0.45, 1.8)
      * (context.reducedGraphics ? 0.94 : 1)
      * contextPresentationScale(context);
    const frameAspect = definition.rows / definition.cols;
    const quality = this.quality(step, preset, context);
    const requestedOpacity = (step.opacity ?? 1)
      * resolved.opacityMultiplier
      * (context.reducedGraphics ? 0.94 + quality * 0.06 : 1);
    const baseOpacity = resolved.layer === 'ground'
      ? clamp(requestedOpacity * (context.opacityMultiplier ?? 1), 0, 1)
      : foregroundPeakOpacity(requestedOpacity, context);
    const reducedDuration = context.reducedGraphics
      ? clamp(options.reducedGraphicsMultiplier ?? 0.86, 0.65, 1)
      : 1;
    const actualDuration = duration * reducedDuration;
    if (options.rotationMode !== 'none') {
      const projectedStart = start.clone().project(context.camera);
      const projectedEnd = end.clone().project(context.camera);
      material.rotation += Math.atan2(projectedEnd.y - projectedStart.y, projectedEnd.x - projectedStart.x);
    }
    sprite.renderOrder = resolved.layer === 'ground'
      ? VFX_RENDER_ORDER.ground
      : contextImpactRenderOrder(context);
    sprite.position.copy(start);
    try {
      await this.animate(actualDuration, (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        const descent = easeInOut(progress);
        const scaleStart = clamp(options.scaleStart ?? 0.56, 0.2, 2);
        const scaleEnd = clamp(options.scaleEnd ?? 1.18, 0.25, 2.5);
        const scale = baseHeight
          * (scaleStart + (scaleEnd - scaleStart) * descent)
          * spriteSheetScalePulse(progress, resolved);
        setVfxSpriteSheetFrame(texture, definition, frame);
        sprite.position.lerpVectors(start, end, descent);
        sprite.scale.set(scale * frameAspect, scale, 1);
        material.opacity = baseOpacity * spriteSheetEnvelope(progress, resolved);
      });
    } finally {
      this.cleanup(objects);
      releaseVfxSpriteSheetTexture(step.spriteSheet, texture);
    }
  }

  private async playGroundPulse(
    step: VfxStep,
    preset: VfxPreset,
    context: VfxContext,
    duration: number,
    anchor: THREE.Vector3,
    withCracks: boolean,
  ) {
    const texture = step.texture ?? (step.type === 'magicCircle' ? 'magicCircle' : 'ringGradient');
    const plane = this.track(makeGroundPlane(step, texture), context);
    const objects: THREE.Object3D[] = [plane];
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const radius = (step.radius ?? 1) * (step.scale ?? 1) * intensity * contextPresentationScale(context);
    plane.position.copy(anchor);
    plane.scale.setScalar(radius * 0.18);

    const crackCount = withCracks ? this.adjustedCount(step, preset, context) : 0;
    const cracks: THREE.Mesh[] = [];
    for (let index = 0; index < crackCount; index += 1) {
      const crackStep = { ...step, opacity: (step.opacity ?? 0.7) * 0.62, blending: 'normal' as const };
      const crack = this.track(makeGroundPlane(crackStep, 'softParticle'), context);
      const angle = index / Math.max(1, crackCount) * Math.PI * 2 + Math.random() * 0.32;
      crack.position.copy(anchor);
      crack.position.x += Math.cos(angle) * radius * 0.18;
      crack.position.z += Math.sin(angle) * radius * 0.18;
      crack.rotation.z = angle;
      crack.scale.set(radius * 0.035, radius * (0.22 + Math.random() * 0.18), 1);
      cracks.push(crack);
      objects.push(crack);
    }
    try {
      await this.animate(duration, (progress, eased) => {
        const fade = 1 - easeInOut(progress);
        plane.scale.setScalar(radius * (0.18 + eased * 1.82));
        plane.rotation.z = (step.rotation ?? 0) + progress * (step.type === 'magicCircle' ? 0.72 : 0.18);
        (plane.material as THREE.MeshBasicMaterial).opacity = (step.opacity ?? 0.75) * fade;
        for (const crack of cracks) {
          crack.scale.y *= 1 + (1 - progress) * 0.014;
          (crack.material as THREE.MeshBasicMaterial).opacity = (step.opacity ?? 0.7) * 0.58 * fade;
        }
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private async playLightPulse(step: VfxStep, preset: VfxPreset, context: VfxContext, duration: number, anchor: THREE.Vector3) {
    const quality = this.quality(step, preset, context);
    const light = this.track(new THREE.PointLight(asColor(step.color), 0, 4.2, 2), context);
    const glow = this.track(makeSprite(step, step.texture ?? 'magicGlow', context), context);
    const objects: THREE.Object3D[] = [light, glow];
    const scale = (step.scale ?? 1) * clamp(context.intensity ?? 1, 0.35, 1.8) * contextPresentationScale(context);
    light.position.copy(anchor);
    glow.position.copy(anchor);
    glow.scale.setScalar(scale * 0.4);
    try {
      await this.animate(duration, (progress, eased) => {
        const pulse = Math.sin(Math.PI * progress);
        light.intensity = pulse * 2.15 * quality;
        glow.scale.setScalar(scale * (0.4 + eased * 0.9));
        (glow.material as THREE.SpriteMaterial).opacity = foregroundPeakOpacity(step.opacity ?? 0.5, context) * pulse * quality;
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private fallbackScreenFlash(color: string, opacity: number, duration: number) {
    if (typeof document === 'undefined' || this.disposed) return;
    const element = document.createElement('div');
    element.style.cssText = `position:fixed;inset:0;z-index:18;pointer-events:none;background:${color};opacity:${opacity}`;
    document.body.appendChild(element);
    const start = performance.now();
    const tick = (now: number) => {
      if (this.disposed) {
        element.remove();
        return;
      }
      const progress = clamp((now - start) / Math.max(1, duration * 1000), 0, 1);
      element.style.opacity = String(opacity * (1 - progress));
      if (progress < 1) requestAnimationFrame(tick);
      else element.remove();
    };
    requestAnimationFrame(tick);
  }
}
