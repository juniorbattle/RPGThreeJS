/**
 * Combat camera director: tactical overview, short action push-ins, the graded
 * skill focus (`skill` for ordinary skills, `focus` for elite and boss skills
 * and the Fury strike) and the in-arena "spotlight" used for ultimates and boss
 * signatures (it replaces the separate Combat Stage scene). Pure interpolation;
 * the runtime applies the resulting shot to its PerspectiveCamera every frame.
 */
export interface CameraShot {
  /** Look-at target. */
  tx: number;
  ty: number;
  tz: number;
  /** Orbit yaw around the target (radians, 0 = looking toward −z). */
  yaw: number;
  /** Horizontal distance and height above the target. */
  dist: number;
  height: number;
  /** Additive vertical field-of-view offset in degrees. */
  fov: number;
}

export type ShotKind = 'tactical' | 'action' | 'skill' | 'focus' | 'aoe' | 'spotlight' | 'impact' | 'field';

/** Easing of a camera move: `cubic` (action push-ins, spotlight) or the softer `sine` (skill focus). */
export type CameraEase = 'cubic' | 'sine';

export interface ShotPoint {
  x: number;
  z: number;
  y?: number;
}

export function copyShot(shot: CameraShot): CameraShot {
  return { tx: shot.tx, ty: shot.ty, tz: shot.tz, yaw: shot.yaw, dist: shot.dist, height: shot.height, fov: shot.fov };
}

export function lerpShot(a: CameraShot, b: CameraShot, t: number): CameraShot {
  const k = Math.max(0, Math.min(1, t));
  return {
    tx: a.tx + (b.tx - a.tx) * k,
    ty: a.ty + (b.ty - a.ty) * k,
    tz: a.tz + (b.tz - a.tz) * k,
    yaw: a.yaw + (b.yaw - a.yaw) * k,
    dist: a.dist + (b.dist - a.dist) * k,
    height: a.height + (b.height - a.height) * k,
    fov: a.fov + (b.fov - a.fov) * k,
  };
}

/** Camera position for a shot (target + orbit offset). */
export function shotPosition(shot: CameraShot): { x: number; y: number; z: number } {
  return {
    x: shot.tx + Math.sin(shot.yaw) * shot.dist,
    y: shot.ty + shot.height,
    z: shot.tz + Math.cos(shot.yaw) * shot.dist,
  };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Framing rules. Every shot keeps the battle readable: the actor and the
 * target stay inside the frame, yaw never exceeds ±0.24 rad so the painted far
 * plate and the diorama flanks always cover the background.
 */
export function shotFor(kind: ShotKind, base: CameraShot, actor?: ShotPoint, target?: ShotPoint): CameraShot {
  if (kind === 'tactical' || !actor) return copyShot(base);
  const tgt = target ?? actor;
  const mx = (actor.x + tgt.x) / 2;
  const mz = (actor.z + tgt.z) / 2;
  const span = Math.hypot(tgt.x - actor.x, tgt.z - actor.z);
  const side = actor.x <= tgt.x ? -1 : 1;
  if (kind === 'action') {
    return {
      tx: mx * 0.5,
      ty: base.ty - 0.35,
      tz: mz * 0.45,
      yaw: clamp(side * 0.06 - mx * 0.012, -0.12, 0.12),
      dist: base.dist * clamp(0.74 + span * 0.025, 0.74, 0.9),
      height: base.height * 0.84,
      fov: -1,
    };
  }
  if (kind === 'skill') {
    // Ordinary skill: a light push-in, a little closer and lower than a weapon
    // attack, leaning toward the caster, who is the subject of a skill.
    return {
      tx: mx * 0.62 + (actor.x - mx) * 0.1,
      ty: base.ty - 0.42,
      tz: mz * 0.55,
      yaw: clamp(side * 0.07 - mx * 0.012, -0.14, 0.14),
      dist: base.dist * clamp(0.68 + span * 0.025, 0.68, 0.84),
      height: base.height * 0.8,
      fov: -1.5,
    };
  }
  if (kind === 'focus') {
    // Elite and boss skills, the Fury strike: a marked focus between the skill
    // push-in and the spotlight, without its title, letterbox or punch.
    return {
      tx: mx * 0.72 + (actor.x - mx) * 0.16,
      ty: base.ty - 0.55,
      tz: mz * 0.62,
      yaw: clamp(side * (0.1 + span * 0.006) - mx * 0.01, -0.18, 0.18),
      dist: base.dist * clamp(0.58 + span * 0.025, 0.58, 0.74),
      height: base.height * 0.66,
      fov: -2,
    };
  }
  if (kind === 'aoe') {
    return {
      tx: tgt.x * 0.4,
      ty: base.ty - 0.25,
      tz: tgt.z * 0.35,
      yaw: clamp(-tgt.x * 0.015, -0.08, 0.08),
      dist: base.dist * 0.86,
      height: base.height * 0.94,
      fov: 0,
    };
  }
  if (kind === 'field') {
    // Ultimate finale: pull out past the tactical view so the whole battlefield
    // (and the wave rolling across it) is in frame, leaning toward the actor.
    return {
      tx: base.tx + actor.x * 0.06,
      ty: base.ty - 0.15,
      tz: base.tz,
      yaw: clamp(-side * 0.05, -0.08, 0.08),
      dist: base.dist * 1.06,
      height: base.height * 1.1,
      fov: 3,
    };
  }
  if (kind === 'impact') {
    return {
      tx: tgt.x * 0.8,
      ty: (tgt.y ?? 0) + 1.15,
      tz: tgt.z * 0.75,
      yaw: clamp(side * 0.1, -0.16, 0.16),
      dist: base.dist * 0.5,
      height: base.height * 0.36,
      fov: -2,
    };
  }
  // spotlight: low, close and slightly off-axis on the actor's side
  return {
    tx: mx * 0.85 + (actor.x - mx) * 0.2,
    ty: 1.35 + Math.max(actor.y ?? 0, tgt.y ?? 0) * 0.5,
    tz: mz * 0.75,
    yaw: clamp(side * (0.16 + span * 0.008), -0.24, 0.24),
    dist: base.dist * clamp(0.5 + span * 0.03, 0.5, 0.66),
    height: base.height * 0.42,
    fov: -2,
  };
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
const EASES: Record<CameraEase, (t: number) => number> = { cubic: easeInOutCubic, sine: easeInOutSine };

export class CombatCameraDirector {
  private current: CameraShot;
  private from: CameraShot;
  private to: CameraShot;
  private elapsed = 0;
  private duration = 0;
  private resolve: (() => void) | null = null;
  private ease: (t: number) => number = easeInOutCubic;
  private swayTime = 0;
  /** Gentle idle drift (HD-2D cameras breathe a little). 0 disables it (reduced motion). */
  sway = 1;
  kind: ShotKind = 'tactical';

  constructor(private base: CameraShot) {
    this.current = copyShot(base);
    this.from = copyShot(base);
    this.to = copyShot(base);
  }

  get baseShot(): CameraShot {
    return copyShot(this.base);
  }

  setBase(base: CameraShot): void {
    this.base = copyShot(base);
    if (this.kind === 'tactical' && !this.resolve) {
      this.current = copyShot(base);
      this.to = copyShot(base);
    }
  }

  get shot(): CameraShot {
    return copyShot(this.current);
  }

  get moving(): boolean {
    return this.resolve !== null;
  }

  /** Tweens to a framed shot. Resolves when the move ends (or is superseded). */
  frame(kind: ShotKind, actor?: ShotPoint, target?: ShotPoint, seconds = 0.45, ease: CameraEase = 'cubic'): Promise<void> {
    return this.goTo(shotFor(kind, this.base, actor, target), seconds, kind, ease);
  }

  restore(seconds = 0.6, ease: CameraEase = 'cubic'): Promise<void> {
    return this.goTo(copyShot(this.base), seconds, 'tactical', ease);
  }

  /** True when the camera rests on the tactical overview (no move in flight). */
  get atRest(): boolean {
    return this.kind === 'tactical' && this.resolve === null;
  }

  goTo(shot: CameraShot, seconds: number, kind: ShotKind = 'action', ease: CameraEase = 'cubic'): Promise<void> {
    this.resolve?.();
    this.kind = kind;
    this.ease = EASES[ease] ?? easeInOutCubic;
    this.from = copyShot(this.current);
    this.to = copyShot(shot);
    this.elapsed = 0;
    this.duration = Math.max(0, seconds);
    if (this.duration === 0) {
      this.current = copyShot(shot);
      this.resolve = null;
      return Promise.resolve();
    }
    return new Promise((resolve) => { this.resolve = resolve; });
  }

  /** Advances the move; returns the shot to apply this frame (sway included). */
  update(dt: number): CameraShot {
    this.swayTime += dt;
    if (this.resolve) {
      this.elapsed += dt;
      const t = this.duration > 0 ? this.elapsed / this.duration : 1;
      this.current = lerpShot(this.from, this.to, this.ease(Math.min(1, t)));
      if (t >= 1) {
        const done = this.resolve;
        this.resolve = null;
        done();
      }
    }
    const out = copyShot(this.current);
    if (this.sway > 0) {
      const s = this.sway * (this.kind === 'spotlight' || this.kind === 'focus' ? 0.6 : 1);
      out.yaw += Math.sin(this.swayTime * 0.21) * 0.006 * s;
      out.height += Math.sin(this.swayTime * 0.33 + 1.3) * 0.05 * s;
    }
    return out;
  }
}
