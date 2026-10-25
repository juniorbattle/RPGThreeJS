import { onReducedMotionChange, prefersReducedMotion } from '../ui/ReducedMotion';

/** OD-2026-10-24-B: an optional local frame loop for one staged actor; its Character V2 image stays the fallback. */
export interface NarrativeActorFrameAnimation {
  readonly id: string;
  readonly actorId: string;
  /** Processed frames of the master's size and foot anchor, in play order. */
  readonly frames: readonly string[];
  readonly frameMs: number;
}

/** An animation plays only in the listed phases of one tableau. */
export interface NarrativeActorFrameBinding {
  readonly tableauId: string;
  readonly phaseIds: readonly string[];
  readonly animation: NarrativeActorFrameAnimation;
}

/** No production binding until an operator-reviewed candidate exists. */
export const NARRATIVE_ACTOR_FRAME_BINDINGS: readonly NarrativeActorFrameBinding[] = Object.freeze([]);

export const MIN_NARRATIVE_FRAME_MS = 80;
export const MAX_NARRATIVE_FRAME_MS = 2_000;
const MAX_CACHED_FRAMES = 32;

export function resolveNarrativeActorFrameBindings(
  tableauId: string,
  bindings: readonly NarrativeActorFrameBinding[] = NARRATIVE_ACTOR_FRAME_BINDINGS,
): readonly NarrativeActorFrameBinding[] {
  return bindings.filter((binding) => binding.tableauId === tableauId);
}

function bindingErrors({ phaseIds, animation }: NarrativeActorFrameBinding): string[] {
  const errors: string[] = [];
  if (animation.frames.length < 2) errors.push(`${animation.id}: at least two frames are required`);
  if (!(Number.isFinite(animation.frameMs) && animation.frameMs >= MIN_NARRATIVE_FRAME_MS && animation.frameMs <= MAX_NARRATIVE_FRAME_MS)) {
    errors.push(`${animation.id}: frameMs must be between ${MIN_NARRATIVE_FRAME_MS} and ${MAX_NARRATIVE_FRAME_MS}`);
  }
  if (!phaseIds.length) errors.push(`${animation.id}: no phase`);
  return errors;
}

export function validateNarrativeActorFrameBindings(bindings: readonly NarrativeActorFrameBinding[]): string[] {
  const errors: string[] = [];
  const staged = new Set<string>();
  for (const binding of bindings) {
    errors.push(...bindingErrors(binding));
    for (const phaseId of binding.phaseIds) {
      const key = `${binding.tableauId}:${phaseId}:${binding.animation.actorId}`;
      if (staged.has(key)) errors.push(`${key}: more than one animation`);
      staged.add(key);
    }
  }
  return errors;
}

type FrameState = 'LOADING' | 'PLAYING' | 'STILL_REDUCED_MOTION' | 'PAUSED_HIDDEN' | 'FALLBACK_MASTER';

interface AnimatedActor {
  readonly actor: HTMLElement;
  readonly image: HTMLImageElement;
  readonly master: string;
  readonly animation: NarrativeActorFrameAnimation;
  readiness: 'IDLE' | 'LOADING' | 'READY' | 'FAILED';
  frame: number;
  nextAt: number;
}

interface CachedFrame {
  /** Kept referenced until dispose so a frame swap never waits on the network. */
  readonly image: HTMLImageElement;
  readonly ready: Promise<boolean>;
}

/**
 * One bounded clock per narrative surface. It runs only while a bound actor is mounted, visible and allowed to move;
 * it never advances a line, owns focus or writes game state. Any failure leaves the masters in place.
 */
export class NarrativeActorFramePlayer {
  private readonly bindings: readonly NarrativeActorFrameBinding[];
  private readonly animated = new Map<string, AnimatedActor>();
  private readonly cache = new Map<string, CachedFrame>();
  private timer: number | undefined;
  private disposed = false;
  private unsubscribeMotion: (() => void) | undefined;
  private readonly onVisibilityChange = () => this.refresh();

  constructor(
    bindings: readonly NarrativeActorFrameBinding[],
    private readonly gameReducedMotion: boolean,
  ) {
    // A binding that would spin the clock or show nothing is ignored, whoever supplied it.
    this.bindings = bindings.filter((binding) => !bindingErrors(binding).length);
  }

  /** Called after each phase mount, including actors whose DOM is kept between phases. */
  sync(phaseId: string, actors: readonly HTMLElement[]): void {
    if (this.disposed || !this.bindings.length) return;
    this.guard(() => {
      const wanted = new Map(this.bindings
        .filter((binding) => binding.phaseIds.includes(phaseId))
        .map((binding) => [binding.animation.actorId, binding.animation]));
      for (const [actorId, entry] of this.animated) {
        const element = actors.find((actor) => actor.dataset.actorId === actorId);
        if (element !== entry.actor || wanted.get(actorId) !== entry.animation) this.stop(actorId);
      }
      for (const [actorId, animation] of wanted) {
        if (this.animated.has(actorId)) continue;
        const actor = actors.find((candidate) => candidate.dataset.actorId === actorId);
        const image = actor?.querySelector('img');
        if (!actor || !image) continue;
        actor.dataset.frameAnimation = animation.id;
        this.animated.set(actorId, { actor, image, master: image.getAttribute('src') ?? '', animation, readiness: 'IDLE', frame: 0, nextAt: 0 });
      }
      this.listen();
      this.update();
    });
  }

  /** Re-reads motion preference, visibility and mounting, then starts or stops the clock. */
  refresh(): void {
    if (this.disposed || !this.animated.size) return;
    this.guard(() => this.update());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.clearTimeout(this.timer);
    this.timer = undefined;
    for (const actorId of [...this.animated.keys()]) this.stop(actorId);
    this.cache.clear();
    this.unlisten();
  }

  private guard(action: () => void): void {
    try { action(); } catch { this.dispose(); }
  }

  /** Listeners exist only while at least one actor is animated. */
  private listen(): void {
    if (!this.animated.size) { this.unlisten(); return; }
    if (this.unsubscribeMotion) return;
    this.unsubscribeMotion = onReducedMotionChange(() => this.refresh());
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private unlisten(): void {
    if (!this.unsubscribeMotion) return;
    this.unsubscribeMotion();
    this.unsubscribeMotion = undefined;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private update(): void {
    window.clearTimeout(this.timer);
    this.timer = undefined;
    const reduced = prefersReducedMotion(this.gameReducedMotion);
    const hidden = document.visibilityState === 'hidden';
    const now = performance.now();
    let playing = false;
    for (const entry of this.animated.values()) {
      if (entry.readiness === 'FAILED') { this.show(entry, entry.master, 'FALLBACK_MASTER'); continue; }
      if (reduced) { this.show(entry, entry.master, 'STILL_REDUCED_MOTION'); continue; }
      if (hidden) {
        if (entry.readiness === 'READY') entry.actor.dataset.frameAnimationState = 'PAUSED_HIDDEN';
        else this.show(entry, entry.master, 'PAUSED_HIDDEN');
        continue;
      }
      if (entry.readiness === 'IDLE') this.load(entry);
      if (entry.readiness !== 'READY') { this.show(entry, entry.master, 'LOADING'); continue; }
      if (entry.actor.dataset.frameAnimationState !== 'PLAYING') {
        entry.nextAt = now + this.frameMs(entry);
        this.show(entry, entry.animation.frames[entry.frame]!, 'PLAYING');
      } else if (entry.nextAt < now) {
        // The clock was not running for this actor (detached): show its frame a full period before advancing.
        entry.nextAt = now + this.frameMs(entry);
      }
      if (entry.actor.isConnected) playing = true;
    }
    if (playing) this.schedule();
  }

  private schedule(): void {
    let next = Infinity;
    for (const entry of this.animated.values()) {
      if (entry.actor.dataset.frameAnimationState === 'PLAYING' && entry.actor.isConnected) next = Math.min(next, entry.nextAt);
    }
    if (next === Infinity) return;
    this.timer = window.setTimeout(() => this.tick(), Math.max(0, next - performance.now()));
  }

  private tick(): void {
    this.timer = undefined;
    if (this.disposed) return;
    this.guard(() => {
      const now = performance.now();
      for (const entry of this.animated.values()) {
        if (entry.actor.dataset.frameAnimationState !== 'PLAYING' || !entry.actor.isConnected || entry.nextAt > now) continue;
        entry.frame = (entry.frame + 1) % entry.animation.frames.length;
        entry.image.src = entry.animation.frames[entry.frame]!;
        entry.nextAt = now + this.frameMs(entry);
      }
      this.schedule();
    });
  }

  private load(entry: AnimatedActor): void {
    entry.readiness = 'LOADING';
    void Promise.all(entry.animation.frames.map((frame) => this.preload(frame))).then((loaded) => {
      if (this.disposed || this.animated.get(entry.animation.actorId) !== entry) return;
      entry.readiness = loaded.every(Boolean) ? 'READY' : 'FAILED';
      this.refresh();
    });
  }

  private preload(source: string): Promise<boolean> {
    const cached = this.cache.get(source);
    if (cached) return cached.ready;
    const image = new Image();
    const ready: Promise<boolean> = new Promise<boolean>((resolve) => {
      image.addEventListener('load', () => resolve(true), { once: true });
      image.addEventListener('error', () => resolve(false), { once: true });
      image.src = source;
      // Decoding ahead is best-effort: a window that is not painting can hold decode() back indefinitely, and a
      // frame that never arrives only keeps the master on screen.
      if (typeof image.decode === 'function') image.decode().then(() => resolve(true), () => resolve(false));
    }).then((loaded) => {
      // A slow or missing frame is tried again when its phase is entered again.
      if (!loaded && this.cache.get(source)?.ready === ready) this.cache.delete(source);
      return loaded;
    });
    this.cache.set(source, { image, ready });
    while (this.cache.size > MAX_CACHED_FRAMES) this.cache.delete(this.cache.keys().next().value!);
    return ready;
  }

  private frameMs(entry: AnimatedActor): number {
    return Math.min(MAX_NARRATIVE_FRAME_MS, Math.max(MIN_NARRATIVE_FRAME_MS, entry.animation.frameMs));
  }

  private show(entry: AnimatedActor, source: string, state: FrameState): void {
    if (entry.image.getAttribute('src') !== source) entry.image.src = source;
    entry.actor.dataset.frameAnimationState = state;
  }

  private stop(actorId: string): void {
    const entry = this.animated.get(actorId);
    if (!entry) return;
    this.animated.delete(actorId);
    if (entry.image.getAttribute('src') !== entry.master) entry.image.src = entry.master;
    delete entry.actor.dataset.frameAnimation;
    delete entry.actor.dataset.frameAnimationState;
  }
}
