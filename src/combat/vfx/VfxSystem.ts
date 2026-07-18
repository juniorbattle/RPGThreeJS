import * as THREE from 'three';
import { getVfxPreset } from './VfxPresets';
import {
  VFX_SPRITE_SHEETS,
  disposeVfxSpriteSheetTextures,
  loadVfxSpriteSheetTexture,
  setVfxSpriteSheetFrame,
} from './VfxSpriteSheets';
import { getVfxTexture, disposeVfxTextures } from './VfxTextures';
import type {
  VfxAnchor,
  VfxContext,
  VfxPlayResult,
  VfxPreset,
  VfxStep,
  VfxTextureName,
  VfxUnitLike,
} from './VfxTypes';

const SHARED_PLANE = new THREE.PlaneGeometry(1, 1);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;
const easeInOut = (value: number) => (value < 0.5 ? 2 * value * value : 1 - (-2 * value + 2) ** 2 / 2);

function asColor(value: string | number | undefined, fallback = 0xffffff) {
  return new THREE.Color(value ?? fallback);
}

function unitGround(unit?: VfxUnitLike | null) {
  return unit?.grp?.position.clone() ?? new THREE.Vector3();
}

function unitBody(unit?: VfxUnitLike | null) {
  const point = unitGround(unit);
  point.y += (unit?.size ?? 1) > 1 ? 1.18 : 0.78;
  return point;
}

function contextTargetPoint(context: VfxContext) {
  if (context.targetPoint) {
    return new THREE.Vector3(context.targetPoint.x, context.targetPoint.y, context.targetPoint.z);
  }
  const target = context.targetUnits?.[0];
  return target ? unitGround(target) : unitGround(context.sourceUnit);
}

export function resolveVfxAnchors(anchor: VfxAnchor, context: VfxContext): THREE.Vector3[] {
  const sourceGround = unitGround(context.sourceUnit);
  const source = unitBody(context.sourceUnit);
  const targetGround = context.targetUnits?.[0] ? unitGround(context.targetUnits[0]) : contextTargetPoint(context);
  const target = context.targetUnits?.[0]
    ? unitBody(context.targetUnits[0])
    : contextTargetPoint(context).add(new THREE.Vector3(0, 0.7, 0));

  switch (anchor) {
    case 'source': return [source];
    case 'sourceGround': return [sourceGround.add(new THREE.Vector3(0, 0.055, 0))];
    case 'target': return [target];
    case 'targetGround': return [targetGround.add(new THREE.Vector3(0, 0.055, 0))];
    case 'groundTarget': return [contextTargetPoint(context).add(new THREE.Vector3(0, 0.055, 0))];
    case 'midpoint': return [source.add(target).multiplyScalar(0.5)];
    case 'allTargets': {
      const targets = context.targetUnits?.length
        ? context.targetUnits.map((unit) => unitBody(unit))
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

function animate(duration: number, frame: (progress: number, eased: number) => void) {
  if (duration <= 0) {
    frame(1, 1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
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

function makeSprite(step: VfxStep, textureName: VfxTextureName, color?: string | number) {
  const material = new THREE.SpriteMaterial({
    map: getVfxTexture(textureName),
    color: asColor(color ?? step.color),
    transparent: true,
    opacity: step.opacity ?? 1,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    fog: false,
    blending: blendingFor(step),
    rotation: step.rotation ?? 0,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 28;
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
  plane.renderOrder = 18;
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

  play(presetId: string, context: VfxContext): VfxPlayResult {
    const preset = getVfxPreset(presetId);
    if (!preset) {
      return { played: false, presetId, impactTime: 0, completion: Promise.resolve() };
    }
    const durationScale = clamp(context.durationScale ?? 1, 0.45, 1.75);
    const completion = Promise.all(
      preset.steps.map((step) => this.scheduleStep(step, preset, context, durationScale)),
    ).then(() => undefined);
    return {
      played: true,
      presetId,
      impactTime: preset.impactTime * durationScale,
      completion,
    };
  }

  dispose() {
    cleanupVfxObjects(this.activeObjects);
    this.activeObjects.clear();
    disposeVfxTextures();
    disposeVfxSpriteSheetTextures();
  }

  private track<T extends THREE.Object3D>(object: T, context: VfxContext) {
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

  private async scheduleStep(step: VfxStep, preset: VfxPreset, context: VfxContext, durationScale: number) {
    await waitSeconds(step.startTime * durationScale, context);
    const duration = step.duration * durationScale;
    try {
      if (step.type === 'screenShake') {
        const magnitude = (step.scale ?? 0.2) * clamp(context.intensity ?? 1, 0.35, 1.8) * this.quality(step, preset, context);
        context.helpers?.screenShake?.(magnitude, duration);
        await waitSeconds(duration, context);
        return;
      }
      if (step.type === 'screenFlash') {
        const emphasis = clamp(context.intensity ?? 1, 0.7, 1.25);
        const opacity = Math.min(0.22, (step.opacity ?? 0.12) * emphasis * this.quality(step, preset, context));
        if (context.helpers?.screenFlash) context.helpers.screenFlash(String(step.color ?? '#ffffff'), opacity);
        else this.fallbackScreenFlash(String(step.color ?? '#ffffff'), opacity, duration);
        await waitSeconds(duration, context);
        return;
      }
      if (step.type === 'hitStop') {
        await waitSeconds(duration, context);
        return;
      }
      if (step.type === 'projectile') {
        await this.playProjectile(step, preset, context, duration);
        return;
      }
      if (step.type === 'spriteSheet' && step.sheetMode === 'projectile') {
        await this.playSpriteSheetProjectile(step, preset, context, duration);
        return;
      }

      const anchors = resolveVfxAnchors(step.anchor, context);
      await Promise.all(anchors.map((anchor) => this.playAtAnchor(step, preset, context, duration, anchor)));
    } catch (error) {
      console.warn(`[CombatVfx] Step ${step.type} failed safely.`, error);
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
    const sprite = this.track(makeSprite(step, texture), context);
    const objects: THREE.Object3D[] = [sprite];
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const baseScale = (step.scale ?? 1) * intensity;
    sprite.position.copy(anchor);
    sprite.scale.setScalar(baseScale * 0.32);
    try {
      await animate(duration, (progress, eased) => {
        const pulse = progress < 0.36 ? progress / 0.36 : 1 - (progress - 0.36) / 0.64;
        sprite.scale.setScalar(baseScale * (0.32 + eased * 0.83));
        (sprite.material as THREE.SpriteMaterial).opacity = (step.opacity ?? 1) * clamp(pulse, 0, 1);
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
      const sprite = this.track(makeSprite(step, texture, color), context);
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
      const baseScale = (step.scale ?? 0.14) * particleScale * (0.72 + Math.random() * 0.52);
      sprite.position.copy(origin);
      sprite.scale.setScalar(smoke ? baseScale * 0.65 : baseScale * 0.35);
      entries.push({ sprite, origin, velocity, baseScale, delay: vertical ? Math.random() * 0.18 : 0 });
      objects.push(sprite);
    }
    try {
      await animate(duration, (progress) => {
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
    const core = this.track(makeSprite(step, step.texture ?? 'projectileCore'), context);
    const objects: THREE.Object3D[] = [core];
    const baseScale = (step.scale ?? 0.28) * clamp(context.particleScale ?? 1, 0.45, 1.8);
    core.position.copy(start);
    core.scale.setScalar(baseScale);
    const trails: THREE.Sprite[] = [];
    for (let index = 0; index < count; index += 1) {
      const trailStep = { ...step, opacity: (step.opacity ?? 0.9) * 0.42 };
      const trail = this.track(makeSprite(trailStep, 'softParticle', index % 2 ? step.secondaryColor : step.color), context);
      trail.position.copy(start);
      trail.scale.setScalar(baseScale * (0.46 - index * 0.018));
      trails.push(trail);
      objects.push(trail);
    }
    try {
      await animate(duration, (progress, eased) => {
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
    const texture = await loadVfxSpriteSheetTexture(step.spriteSheet);
    setVfxSpriteSheetFrame(texture, definition, 0);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      fog: false,
      blending: blendingFor(step),
      rotation: step.rotation ?? 0,
    });
    const sprite = this.track(new THREE.Sprite(material), context);
    const objects: THREE.Object3D[] = [sprite];
    const intensity = clamp(context.intensity ?? 1, 0.35, 1.8);
    const quality = this.quality(step, preset, context);
    const baseHeight = (step.scale ?? 1) * intensity * (context.reducedGraphics ? 0.9 : 1);
    const frameAspect = definition.rows / definition.cols;
    sprite.renderOrder = 30;
    sprite.position.copy(anchor);
    if (definition.align === 'bottom') sprite.position.y += baseHeight * 0.5;
    sprite.scale.set(baseHeight * frameAspect, baseHeight, 1);
    try {
      await animate(duration, (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        setVfxSpriteSheetFrame(texture, definition, frame);
        material.opacity = (step.opacity ?? 1) * (0.82 + quality * 0.18);
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
    const texture = await loadVfxSpriteSheetTexture(step.spriteSheet);
    setVfxSpriteSheetFrame(texture, definition, 0);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: asColor(step.color),
      transparent: true,
      opacity: step.opacity ?? 1,
      alphaTest: 0.01,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      fog: false,
      blending: blendingFor(step),
      rotation: step.rotation ?? 0,
    });
    const sprite = this.track(new THREE.Sprite(material), context);
    const objects: THREE.Object3D[] = [sprite];
    const start = resolveVfxAnchor(step.anchor, context);
    const end = resolveVfxAnchor(step.targetAnchor ?? 'target', context);
    end.y += step.heightOffset ?? 0;
    const baseHeight = (step.scale ?? 0.9)
      * clamp(context.particleScale ?? 1, 0.45, 1.8)
      * (context.reducedGraphics ? 0.9 : 1);
    const frameAspect = definition.rows / definition.cols;
    const projectedStart = start.clone().project(context.camera);
    const projectedEnd = end.clone().project(context.camera);
    material.rotation += Math.atan2(projectedEnd.y - projectedStart.y, projectedEnd.x - projectedStart.x);
    sprite.renderOrder = 30;
    sprite.position.copy(start);
    sprite.scale.set(baseHeight * frameAspect, baseHeight, 1);
    try {
      await animate(duration, (progress) => {
        const frame = Math.min(definition.frameCount - 1, Math.floor(progress * definition.frameCount));
        const travel = easeOutCubic(clamp(progress / 0.7, 0, 1));
        setVfxSpriteSheetFrame(texture, definition, frame);
        sprite.position.lerpVectors(start, end, travel);
        sprite.position.y += Math.sin(Math.PI * travel) * 0.24;
      });
    } finally {
      this.cleanup(objects);
      texture.dispose();
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
    const radius = (step.radius ?? 1) * (step.scale ?? 1) * intensity;
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
      await animate(duration, (progress, eased) => {
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
    const glow = this.track(makeSprite(step, step.texture ?? 'magicGlow'), context);
    const objects: THREE.Object3D[] = [light, glow];
    const scale = (step.scale ?? 1) * clamp(context.intensity ?? 1, 0.35, 1.8);
    light.position.copy(anchor);
    glow.position.copy(anchor);
    glow.scale.setScalar(scale * 0.4);
    try {
      await animate(duration, (progress, eased) => {
        const pulse = Math.sin(Math.PI * progress);
        light.intensity = pulse * 2.15 * quality;
        glow.scale.setScalar(scale * (0.4 + eased * 0.9));
        (glow.material as THREE.SpriteMaterial).opacity = (step.opacity ?? 0.5) * pulse * quality;
      });
    } finally {
      this.cleanup(objects);
    }
  }

  private fallbackScreenFlash(color: string, opacity: number, duration: number) {
    if (typeof document === 'undefined') return;
    const element = document.createElement('div');
    element.style.cssText = `position:fixed;inset:0;z-index:18;pointer-events:none;background:${color};opacity:${opacity}`;
    document.body.appendChild(element);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = clamp((now - start) / Math.max(1, duration * 1000), 0, 1);
      element.style.opacity = String(opacity * (1 - progress));
      if (progress < 1) requestAnimationFrame(tick);
      else element.remove();
    };
    requestAnimationFrame(tick);
  }
}
