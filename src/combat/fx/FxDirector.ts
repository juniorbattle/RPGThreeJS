import * as THREE from 'three';
import type { FxEngine } from './FxEngine';
import type { FxElement } from './fxPalettes';
import { recipeImpactTime, type FxAnchor, type FxRecipe, type FxStep } from './fxRecipes';
import { apAccentSteps, fieldBeatFor, fieldWaveCells, fxIntensity, scaleStep, type FieldBeat, type FxField, type FxIntensity } from './fxIntensity';

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
  /** Skill weight: AP cost, ultimate / boss signature. Scales every step. */
  power?: { ap?: number; ultimate?: boolean };
  /** Battle platform of the action. */
  field?: FxField;
}

export interface FxPlayback {
  impactTime: number;
  duration: number;
  completion: Promise<void>;
  cinematic: boolean;
  weight: FxIntensity['weight'];
}

/** Seconds from an ultimate's hit to its field wave (the camera's whip-out to the field shot). */
export const FIELD_WAVE_DELAY = 0.34;
/** Seconds the field shot stays on the wave: it has crossed the grid, and its tail fades as the camera comes back. */
const FIELD_WAVE_HOLD = 0.95;

/** Tallest hero figure: every recipe is written for this size. */
const HERO_HEIGHT = 2.4;
/** What wraps a body, and what it throws. A blow (slash, star, orb, burst) or a crack in the floor keeps its written size. */
const BODY_KINDS: ReadonlySet<FxStep['kind']> = new Set(['circle', 'converge', 'decal', 'dome', 'flame', 'motes', 'orbit', 'ring', 'shards', 'shot', 'smoke']);
/** Sparks keep their pixel size: only what they draw grows. */
const BODY_KEYS = ['radius', 'height', 'width', 'rise', 'spread'];
const bodyScale = (unit: FxUnitRef | undefined) => (unit ? Math.max(1, unit.height / HERO_HEIGHT) : 1);

/** A boss wears the same guard as a hero, drawn to its height. */
function onBody(step: FxStep, body: FxUnitRef | undefined): FxStep {
  const scale = bodyScale(body);
  if (scale === 1 || !step.p || !BODY_KINDS.has(step.kind)) return step;
  const p = { ...step.p };
  for (const key of step.kind === 'shot' ? ['size'] : BODY_KEYS) {
    const value = p[key];
    if (typeof value === 'number') p[key] = value * scale;
  }
  return { ...step, p };
}

/** Plays declarative recipes on the FX engine, resolving anchors per step. */
export class FxDirector {
  constructor(private readonly engine: FxEngine) {}

  play(recipe: FxRecipe, ctx: FxPlayContext): FxPlayback {
    const engine = this.engine;
    const firstTarget = ctx.targets[0];
    const authored = recipe.authored === true;
    const weight = fxIntensity(ctx.power);
    // a signature is played as written: only the shared recipes follow the AP scale
    const intensity = authored ? fxIntensity() : weight;
    // The build-up before the hit grows more gently than the hit itself, so a
    // big charge never swallows the actor.
    const buildUp: FxIntensity = { ...intensity, scale: Math.sqrt(intensity.scale), count: Math.sqrt(intensity.count), glow: Math.sqrt(intensity.glow) };
    let hitTime = 0;
    if (recipe.projectile) {
      const proj = recipe.projectile;
      const from = this.anchor(proj.from, ctx, firstTarget);
      const to = this.anchor(proj.to, ctx, firstTarget);
      hitTime = recipeImpactTime({ ...recipe, impactAt: 0 }, from.distanceTo(to));
      engine.after(proj.at, () => {
        if (proj.sfx) engine.hooks.sfx(proj.sfx);
        void engine.projectile(from, to, proj.element ?? recipe.element, { speed: proj.speed, size: (proj.size ?? 0.7) * intensity.scale * bodyScale(ctx.source), arc: proj.arc, streak: proj.streak, smoke: proj.smoke });
      });
    }
    const impactTime = recipe.projectile ? hitTime + recipe.impactAt : recipe.impactAt;
    const magic = recipe.magic !== false;
    for (const step of recipe.steps) {
      if (!magic && step.kind === 'circle') continue; // seals belong to spells only
      const at = step.at + (step.afterHit ? hitTime : 0);
      const scaled = scaleStep(step, at < impactTime - 0.2 ? buildUp : intensity);
      engine.after(at, () => this.run(scaled, recipe, ctx));
    }
    if (!authored) {
      for (const accent of apAccentSteps(impactTime, recipe.element, intensity, ctx.cells.length > 1)) {
        if (recipe.noFloor && accent.kind === 'ring') continue;
        engine.after(accent.at, () => this.run(accent, recipe, ctx));
      }
    }
    // precision: the exact cells an area action hits flash under it (heavy single hits mark their cell too)
    const flashCells = ctx.cells.length > 1 || (!recipe.noFloor && intensity.weight !== 'light' && intensity.weight !== 'standard' && intensity.weight !== 'strong');
    if (flashCells && ctx.cells.length) {
      const tile = (ctx.field?.tile ?? 1.18) * 0.94;
      engine.after(impactTime, () => { for (const cell of ctx.cells) engine.cellFlash(cell, recipe.flashElement ?? recipe.element, { size: tile, duration: 0.55 }); });
    }
    let duration = recipe.duration + (recipe.projectile ? hitTime : 0);
    if (intensity.field && ctx.cells.length > 1) {
      this.fieldFinale(recipe.element, impactTime, ctx, recipe.fieldBeat);
      duration = Math.max(duration, impactTime + FIELD_WAVE_DELAY + FIELD_WAVE_HOLD);
    }
    return { impactTime, duration, cinematic: Boolean(recipe.cinematic), weight: weight.weight, completion: engine.wait(duration) };
  }

  /**
   * Boss signatures sweep the cells they really hit: a flash on the blow, then
   * a wave of element eruptions rolling away from the impact. The ring belongs
   * to the blow, in the recipe: nothing circular fires here. A single-target
   * signature has no finale.
   */
  private fieldFinale(element: FxElement, at: number, ctx: FxPlayContext, beatOverride?: FieldBeat): void {
    const engine = this.engine;
    const pal = engine.palette(element);
    const origin = new THREE.Vector3(ctx.point.x, 0.06, ctx.point.z);
    const reach = Math.max(...ctx.cells.map((cell) => Math.hypot(cell.x - origin.x, cell.z - origin.z))) + (ctx.field?.tile ?? 1.18);
    const sink = element === 'shadow' || element === 'blood';
    // The hit itself belongs to the recipe (and the close-up punch); the wave
    // starts as the camera pulls out to the field shot, so it is seen whole.
    const wave = at + FIELD_WAVE_DELAY;
    engine.after(at, () => engine.hooks.flash(pal.core, 0.24, 0.32));
    engine.after(wave, () => {
      engine.hooks.sfx('field_wave');
      engine.light(origin.clone().setY(3.4), pal.light, 48, 1.2, 22);
      engine.motes(origin, element, { count: engine.reduced ? 20 : 60, radius: reach * 0.7, rise: 2.8, life: 1.2, size: 0.1, sink });
    });
    const beat = beatOverride ?? fieldBeatFor(element);
    // light columns are additive and tall: fewer of them keep the field readable
    const max = engine.reduced ? 6 : beat === 'pillar' ? 10 : 16;
    for (const { cell, delay } of fieldWaveCells(ctx.cells, origin, max)) {
      engine.after(wave + delay, () => this.fieldBeat(beat, element, new THREE.Vector3(cell.x, 0.02, cell.z)));
    }
  }

  private fieldBeat(beat: FieldBeat, element: FxElement, at: THREE.Vector3): void {
    const engine = this.engine;
    const chest = at.clone().setY(0.9);
    switch (beat) {
      case 'flame':
        engine.flame(at, { width: 1.05, height: 2.1, duration: 1.25 });
        engine.burst(at.clone().setY(0.4), element, { count: 10, speed: 2.2, up: 2.8, size: 0.1 });
        engine.decal(at, element, { radius: 0.6 });
        break;
      case 'pillar':
        engine.pillar(at, element, { radius: 0.28, height: 9, duration: 0.95 });
        engine.motes(at, element, { count: 8, radius: 0.4, rise: 2.6 });
        break;
      case 'arrows':
        for (let i = 0; i < 3; i++) {
          const hit = at.clone().add(new THREE.Vector3((i - 1) * 0.3, 0, ((i * 7) % 3 - 1) * 0.2));
          engine.after(i * 0.05, () => {
            engine.streak(hit.clone().add(new THREE.Vector3(-1.2, 7, -1.6)), hit.clone().setY(0.1), element, { width: 0.1, duration: 0.2 });
            engine.after(0.08, () => engine.impactStar(hit.clone().setY(0.3), element, 0.7, 0.22));
          });
        }
        break;
      case 'blast':
        engine.orb(chest, element, { radius: 0.9, duration: 0.42 });
        engine.burst(chest, element, { count: 14, speed: 3.4, up: 2, size: 0.11 });
        engine.smoke(at.clone().setY(0.5), { count: 6, spread: 0.4 });
        engine.decal(at, element, { radius: 0.7 });
        break;
      case 'bolt':
        engine.bolt(at.clone().setY(0.3), element, { duration: 0.32, width: 0.06 });
        break;
      case 'shards':
        engine.shards(at, element, { count: 4, radius: 0.45, height: 1.2, duration: 0.95 });
        engine.burst(at.clone().setY(0.3), element === 'ice' ? 'ice' : 'earth', { count: 8, speed: 2, up: 3, gravity: 8, size: 0.12 });
        break;
      case 'orb':
        engine.orb(chest, element, { radius: 0.85, duration: 0.5, dark: element === 'shadow' });
        engine.motes(at, element, { count: 8, radius: 0.4, sink: element === 'shadow' });
        break;
      case 'slash':
        engine.slash(chest, element, { size: 1.9, angle: (at.x * 1.7 + at.z) % 1.4 - 0.7, duration: 0.24 });
        break;
      default:
        engine.burst(chest, element, { count: 14, speed: 3, size: 0.1 });
    }
  }

  /** The affected cell farthest from the caster: the end of a line or a cone. */
  private far(ctx: FxPlayContext): THREE.Vector3 {
    const src = ctx.source.position;
    return ctx.cells.reduce((best, cell) => (Math.hypot(cell.x - src.x, cell.z - src.z) > Math.hypot(best.x - src.x, best.z - src.z) ? cell : best), ctx.point).clone();
  }

  /** The unit an anchor sits on; a place on the ground or in the sky has none. */
  private bodyAt(anchor: FxAnchor | undefined, ctx: FxPlayContext, target: FxUnitRef | undefined): FxUnitRef | undefined {
    if (anchor === 'source' || anchor === 'sourceChest' || anchor === 'sourceGround' || anchor === 'sourceMouth') return ctx.source;
    return anchor === 'target' || anchor === 'targetChest' || anchor === 'targetGround' ? target : undefined;
  }

  private anchor(anchor: FxAnchor | undefined, ctx: FxPlayContext, target: FxUnitRef | undefined, jitter = 0, pick = 0): THREE.Vector3 {
    const src = ctx.source;
    const tgt = target ?? { position: ctx.point, height: 1.6 };
    let v: THREE.Vector3;
    switch (anchor) {
      case 'far': v = this.far(ctx).setY(0.02); break;
      case 'farChest': v = this.far(ctx).add(new THREE.Vector3(0, 1.1, 0)); break;
      case 'cell': v = (ctx.cells[Math.min(ctx.cells.length - 1, Math.floor(pick * ctx.cells.length))] ?? ctx.point).clone(); break;
      case 'sourceSky': v = src.position.clone().add(new THREE.Vector3(0, 9, 0)); break;
      case 'targetSky': v = tgt.position.clone().add(new THREE.Vector3(-0.5, 11, -1)); break;
      case 'source': v = src.position.clone(); break;
      case 'sourceChest': v = src.position.clone().add(new THREE.Vector3(0, src.height * 0.55, 0)); break;
      case 'sourceGround': v = new THREE.Vector3(src.position.x, 0.02, src.position.z); break;
      case 'sourceMouth': {
        const ahead = tgt.position.clone().sub(src.position).setY(0).normalize().multiplyScalar(src.height * 0.36);
        v = src.position.clone().add(ahead).add(new THREE.Vector3(0, src.height * 0.78, 0));
        break;
      }
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
      case 'flash': hooks.flash(p.dark === true ? '#06030c' : this.engine.palette(element).core, num('opacity', 0.1), num('duration', 0.18)); return;
      case 'sfx': hooks.sfx(String(p.id ?? 'hit'), { pitch: num('pitch', 1), volume: num('volume', 1) }); return;
      case 'slowmo': hooks.slowmo(num('scale', 0.35), num('duration', 0.3)); return;
      case 'speedLines': hooks.speedLines(num('duration', 0.8), this.engine.palette(element).body); return;
      case 'punch': hooks.punch?.(this.anchor(step.anchor, ctx, ctx.targets[0]), num('duration', 0.45), p.hold === true); return;
      default: break;
    }
    const pick = num('pick', 0);
    const places: Array<{ at: THREE.Vector3; target: FxUnitRef | undefined }> = [];
    if (step.cells && ctx.cells.length) {
      for (const cell of ctx.cells) places.push({ at: new THREE.Vector3(cell.x, 0.02, cell.z), target: undefined });
    } else if (step.each && ctx.targets.length) {
      for (const target of ctx.targets) places.push({ at: this.anchor(step.anchor, ctx, target, jitter), target });
    } else {
      places.push({ at: this.anchor(step.anchor, ctx, ctx.targets[0], jitter, pick), target: ctx.targets[0] });
    }
    const offset = new THREE.Vector3(num('ox', 0), num('oy', 0), num('oz', 0));
    // `stagger`: seconds per world unit from the caster (or the impact), so a step rolls across its places
    const stagger = num('stagger', 0);
    const origin = p.origin === 'point' ? ctx.point : ctx.source.position;
    // `every`: one place out of n, for steps too heavy to repeat on a whole battlefield
    const every = Math.max(1, Math.round(num('every', 1)) * (this.engine.reduced ? 2 : 1));
    places.forEach(({ at, target }, i) => {
      if (i % every) return;
      const placed = step.alternate?.[i % 2] ?? element;
      const fire = () => this.place(onBody(step, this.bodyAt(step.anchor, ctx, target)), at.clone().add(offset), target, placed, ctx);
      const delay = stagger * Math.hypot(at.x - origin.x, at.z - origin.z);
      if (delay > 0) this.engine.after(delay, fire);
      else fire();
    });
  }

  private place(step: FxStep, at: THREE.Vector3, target: FxUnitRef | undefined, element: FxElement, ctx: FxPlayContext): void {
    const p = step.p ?? {};
    const num = (key: string, fallback: number) => (typeof p[key] === 'number' ? (p[key] as number) : fallback);
    const jitter = num('jitter', 0);
    const engine = this.engine;
    const to = () => this.anchor(step.to, ctx, target ?? ctx.targets[0], jitter, num('pickTo', 0));
    switch (step.kind) {
      case 'slash': engine.slash(at, element, { size: num('size', 2.2), angle: num('angle', 0), duration: num('duration', 0.3), flip: p.flip === true, thickness: num('thickness', 0.8) }); break;
      case 'star': engine.impactStar(at, element, num('size', 1.4), num('duration', 0.28)); break;
      case 'burst': {
        const first = ctx.targets[0];
        const direction = p.spray === 'through' && first ? first.position.clone().sub(ctx.source.position).setY(0).normalize()
          : p.spray === 'point' ? ctx.point.clone().sub(ctx.source.position).setY(0).normalize()
          : p.spray === 'target' && first ? first.position.clone().add(new THREE.Vector3(0, first.height * 0.4, 0)).sub(at).normalize()
          : undefined;
        // `reach`: the particles live just long enough to land on the target, however far it stands
        const life = num('life', 0.7);
        const speed = p.reach === true && first ? at.distanceTo(first.position.clone().add(new THREE.Vector3(0, first.height * 0.4, 0))) / life : num('speed', 3);
        engine.burst(at, element, {
          count: num('count', 24), speed, up: num('up', 1.2), gravity: num('gravity', 4), size: num('size', 0.11),
          life, spread: num('spread', 0.15), soft: p.soft === true, cone: num('cone', 1), direction,
        });
        break;
      }
      case 'ring': engine.ring(at, element, { radius: num('radius', 1.6), duration: num('duration', 0.5), ground: p.ground !== false, from: num('from', 0.15), inward: p.inward === true }); break;
      case 'pulse': engine.pulseRings(at, element, { radius: num('radius', 2), duration: num('duration', 1.2) }); break;
      case 'circle': engine.circle(at, element, { radius: num('radius', 1.3), duration: num('duration', 1.1), spin: num('spin', 1.2), pulse: p.pulse === true }); break;
      case 'pillar': engine.pillar(at, element, { radius: num('radius', 0.55), height: num('height', 9), duration: num('duration', 0.8) }); break;
      case 'streak': engine.streak(at, to(), element, { width: num('width', 0.35), duration: num('duration', 0.25) }); break;
      case 'bolt': engine.bolt(at, element, { from: step.to ? to() : undefined, duration: num('duration', 0.35), width: num('width', 0.07) }); break;
      case 'shards': engine.shards(at, element, { count: num('count', 7), radius: num('radius', 0.8), height: num('height', 1.4), duration: num('duration', 0.9) }); break;
      case 'dome': engine.dome(at, element, { radius: num('radius', 1.1), duration: num('duration', 1) }); break;
      case 'orb': engine.orb(at.y < 0.5 ? at.clone().setY(0.9) : at, element, { radius: num('radius', 1.2), duration: num('duration', 0.5), implode: p.implode === true, dark: p.dark === true }); break;
      case 'flame': engine.flame(at, { width: num('width', 1.2), height: num('height', 2.4), duration: num('duration', 0.9) }); break;
      case 'motes': engine.motes(at, element, { count: num('count', 22), radius: num('radius', 0.6), rise: num('rise', 2.2), sink: p.sink === true }); break;
      case 'smoke': engine.smoke(at.y < 0.3 ? at.clone().setY(0.4) : at, { count: num('count', 14), spread: num('spread', 0.35), size: num('size', 0.55) }); break;
      case 'glow': engine.glow(at, element, num('size', 2), num('duration', 0.5)); break;
      case 'decal': engine.decal(at, element, { radius: num('radius', 1) }); break;
      case 'sheet': engine.sheet(at, String(p.id ?? ''), { size: num('size', 3), duration: num('duration', 0.8) }); break;
      case 'shot': void engine.projectile(at, to(), element, { size: num('size', 0.5), speed: num('speed', 14), arc: num('arc', 0.6), streak: p.streak === true, smoke: p.smoke === true, trail: p.trail !== false, duration: typeof p.duration === 'number' ? p.duration : undefined }); break;
      case 'converge': engine.converge(at, element, { count: num('count', 30), radius: num('radius', 2.4), duration: num('duration', 0.7), height: num('height', 1.6), size: num('size', 0.1) }); break;
      case 'orbit': engine.orbit(at, element, { count: num('count', 12), radius: num('radius', 0.8), duration: num('duration', 1), rise: num('rise', 1.4), spin: num('spin', 4.2), size: num('size', 0.11), soft: p.soft === true }); break;
      case 'fissure': engine.fissure(at, element, { radius: num('radius', 2.6), duration: num('duration', 1.6) }); break;
      case 'rain': {
        const width = num('width', 0.1), span = num('spread', 0.32), gap = num('gap', 0.06);
        for (let i = 0; i < num('count', 2); i++) {
          const hit = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * span * 2, 0, (Math.random() - 0.5) * span * 2));
          engine.after(i * gap, () => {
            engine.streak(hit.clone().add(new THREE.Vector3(-1.2, 7, -1.6)), hit.clone().setY(0.1), element, { width, duration: num('duration', 0.2) });
            engine.after(0.1, () => engine.burst(hit.clone().setY(0.2), 'earth', { count: 4, speed: 1.6, up: 1.6, gravity: 7, size: 0.09, life: 0.4 }));
          });
        }
        break;
      }
      case 'light': engine.light(at.y < 0.4 ? at.clone().setY(1.1) : at, engine.palette(element).light, num('intensity', 14), num('duration', 0.5), num('distance', 9)); break;
      default: break;
    }
  }
}
