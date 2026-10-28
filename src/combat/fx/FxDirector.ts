import * as THREE from 'three';
import type { FxEngine } from './FxEngine';
import type { FxElement } from './fxPalettes';
import { recipeImpactTime, type FxAnchor, type FxRecipe, type FxStep } from './fxRecipes';

export interface FxUnitRef {
  /** Feet position in world space. */
  position: THREE.Vector3;
  /** Visible figure height (world units). */
  height: number;
}

export interface FxPlayContext {
  source: FxUnitRef;
  targets: FxUnitRef[];
  /** Gameplay impact point (AoE centre), on the ground. */
  point: THREE.Vector3;
  /** World centres of the affected AoE cells, on the ground. */
  cells: THREE.Vector3[];
}

export interface FxPlayback {
  impactTime: number;
  duration: number;
  completion: Promise<void>;
  cinematic: boolean;
}

/** Plays declarative recipes on the FX engine, resolving anchors per step. */
export class FxDirector {
  constructor(private readonly engine: FxEngine) {}

  play(recipe: FxRecipe, ctx: FxPlayContext): FxPlayback {
    const engine = this.engine;
    const firstTarget = ctx.targets[0];
    let hitTime = 0;
    if (recipe.projectile) {
      const proj = recipe.projectile;
      const from = this.anchor(proj.from, ctx, firstTarget);
      const to = this.anchor(proj.to, ctx, firstTarget);
      hitTime = recipeImpactTime({ ...recipe, impactAt: 0 }, from.distanceTo(to));
      engine.after(proj.at, () => {
        if (proj.sfx) engine.hooks.sfx(proj.sfx);
        void engine.projectile(from, to, proj.element ?? recipe.element, { speed: proj.speed, size: proj.size, arc: proj.arc, streak: proj.streak });
      });
    }
    for (const step of recipe.steps) {
      const at = step.at + (step.afterHit ? hitTime : 0);
      engine.after(at, () => this.run(step, recipe, ctx));
    }
    const impactTime = recipe.projectile ? hitTime + recipe.impactAt : recipe.impactAt;
    const duration = recipe.duration + (recipe.projectile ? hitTime : 0);
    return { impactTime, duration, cinematic: Boolean(recipe.cinematic), completion: engine.wait(duration) };
  }

  private anchor(anchor: FxAnchor | undefined, ctx: FxPlayContext, target: FxUnitRef | undefined, jitter = 0): THREE.Vector3 {
    const src = ctx.source;
    const tgt = target ?? { position: ctx.point, height: 1.6 };
    let v: THREE.Vector3;
    switch (anchor) {
      case 'source': v = src.position.clone(); break;
      case 'sourceChest': v = src.position.clone().add(new THREE.Vector3(0, src.height * 0.55, 0)); break;
      case 'sourceGround': v = new THREE.Vector3(src.position.x, 0.02, src.position.z); break;
      case 'target': v = tgt.position.clone(); break;
      case 'targetGround': v = new THREE.Vector3(tgt.position.x, 0.02, tgt.position.z); break;
      case 'point': v = ctx.point.clone(); break;
      case 'pointSky': v = ctx.point.clone().add(new THREE.Vector3(0, 4.4, 0)); break;
      case 'sky': v = tgt.position.clone().add(new THREE.Vector3(-1.8, 10, -3)); break;
      case 'targetChest':
      default: v = tgt.position.clone().add(new THREE.Vector3(0, tgt.height * 0.55, 0));
    }
    if (jitter) v.add(new THREE.Vector3((Math.random() - 0.5) * jitter, 0, (Math.random() - 0.5) * jitter));
    return v;
  }

  private run(step: FxStep, recipe: FxRecipe, ctx: FxPlayContext): void {
    const p = step.p ?? {};
    const num = (key: string, fallback: number) => (typeof p[key] === 'number' ? (p[key] as number) : fallback);
    const element: FxElement = step.element ?? recipe.element;
    const jitter = num('jitter', 0);
    const hooks = this.engine.hooks;
    switch (step.kind) {
      case 'shake': hooks.shake(num('magnitude', 0.2), num('duration', 0.2)); return;
      case 'flash': hooks.flash(this.engine.palette(element).core, num('opacity', 0.1), num('duration', 0.18)); return;
      case 'sfx': hooks.sfx(String(p.id ?? 'hit'), { pitch: num('pitch', 1), volume: num('volume', 1) }); return;
      case 'slowmo': hooks.slowmo(num('scale', 0.35), num('duration', 0.3)); return;
      case 'speedLines': hooks.speedLines(num('duration', 0.8), this.engine.palette(element).body); return;
      case 'punch': hooks.punch?.(this.anchor(step.anchor, ctx, ctx.targets[0]), num('duration', 0.45)); return;
      default: break;
    }
    const places: THREE.Vector3[] = [];
    if (step.cells && ctx.cells.length) {
      for (const cell of ctx.cells) places.push(new THREE.Vector3(cell.x, 0.02, cell.z));
    } else if (step.each && ctx.targets.length) {
      for (const target of ctx.targets) places.push(this.anchor(step.anchor, ctx, target, jitter));
    } else {
      places.push(this.anchor(step.anchor, ctx, ctx.targets[0], jitter));
    }
    const engine = this.engine;
    for (const at of places) {
      switch (step.kind) {
        case 'slash': engine.slash(at, element, { size: num('size', 2.2), angle: num('angle', 0), duration: num('duration', 0.3), flip: p.flip === true }); break;
        case 'star': engine.impactStar(at, element, num('size', 1.4), num('duration', 0.28)); break;
        case 'burst': {
          const direction = p.spray === 'target' && ctx.targets[0]
            ? ctx.targets[0].position.clone().add(new THREE.Vector3(0, ctx.targets[0].height * 0.4, 0)).sub(at).normalize()
            : undefined;
          engine.burst(at, element, {
            count: num('count', 24), speed: num('speed', 3), up: num('up', 1.2), gravity: num('gravity', 4), size: num('size', 0.11),
            life: num('life', 0.7), spread: num('spread', 0.15), soft: p.soft === true, cone: num('cone', 1), direction,
          });
          break;
        }
        case 'ring': engine.ring(at, element, { radius: num('radius', 1.6), duration: num('duration', 0.5), ground: p.ground !== false }); break;
        case 'circle': engine.circle(at, element, { radius: num('radius', 1.3), duration: num('duration', 1.1), spin: num('spin', 1.2) }); break;
        case 'pillar': engine.pillar(at, element, { radius: num('radius', 0.55), height: num('height', 9), duration: num('duration', 0.8) }); break;
        case 'streak': engine.streak(at, this.anchor(step.to, ctx, ctx.targets[0], jitter), element, { width: num('width', 0.35), duration: num('duration', 0.25) }); break;
        case 'bolt': engine.bolt(at, element, { duration: num('duration', 0.35), width: num('width', 0.07) }); break;
        case 'shards': engine.shards(at, element, { count: num('count', 7), radius: num('radius', 0.8), height: num('height', 1.4), duration: num('duration', 0.9) }); break;
        case 'dome': engine.dome(at, element, { radius: num('radius', 1.1), duration: num('duration', 1) }); break;
        case 'orb': engine.orb(at.y < 0.5 ? at.clone().setY(0.9) : at, element, { radius: num('radius', 1.2), duration: num('duration', 0.5), implode: p.implode === true, dark: p.dark === true }); break;
        case 'flame': engine.flame(at, { width: num('width', 1.2), height: num('height', 2.4), duration: num('duration', 0.9) }); break;
        case 'motes': engine.motes(at, element, { count: num('count', 22), radius: num('radius', 0.6), rise: num('rise', 2.2), sink: p.sink === true }); break;
        case 'smoke': engine.smoke(at.y < 0.3 ? at.clone().setY(0.4) : at, { count: num('count', 14), spread: num('spread', 0.35), size: num('size', 0.55) }); break;
        case 'glow': engine.glow(at, element, num('size', 2), num('duration', 0.5)); break;
        case 'decal': engine.decal(at, element, { radius: num('radius', 1) }); break;
        case 'sheet': engine.sheet(at, String(p.id ?? ''), { size: num('size', 3), duration: num('duration', 0.8) }); break;
        case 'light': engine.light(at.y < 0.4 ? at.clone().setY(1.1) : at, engine.palette(element).light, num('intensity', 14), num('duration', 0.5), num('distance', 9)); break;
        default: break;
      }
    }
  }
}
