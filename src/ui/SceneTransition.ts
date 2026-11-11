export type TransitionVariant = 'fade' | 'launch' | 'dialogue' | 'travel' | 'combat' | 'boss' | 'result';
export type TransitionStyle = 'fade' | 'wipe';

export interface TransitionOptions {
  variant: TransitionVariant;
  label?: string;
  task: () => Promise<void>;
  interlude?: () => Promise<unknown>;
  holdMs?: number;
}

const WIPE_VARIANTS: TransitionVariant[] = ['combat', 'boss'];

interface TransitionTiming {
  inMs: number;
  holdMs: number;
  outMs: number;
}

const TRANSITION_TIMINGS: Record<TransitionVariant, TransitionTiming> = {
  fade: { inMs: 400, holdMs: 600, outMs: 400 },
  launch: { inMs: 500, holdMs: 1000, outMs: 500 },
  dialogue: { inMs: 500, holdMs: 1200, outMs: 500 },
  travel: { inMs: 450, holdMs: 800, outMs: 450 },
  result: { inMs: 500, holdMs: 1000, outMs: 500 },
  // Combat labels need time to establish the encounter before the battlefield appears.
  combat: { inMs: 600, holdMs: 1400, outMs: 600 },
  boss: { inMs: 600, holdMs: 1400, outMs: 600 },
};

function styleFor(variant: TransitionVariant): TransitionStyle {
  return WIPE_VARIANTS.includes(variant) ? 'wipe' : 'fade';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function timingFor(variant: TransitionVariant): TransitionTiming {
  return TRANSITION_TIMINGS[variant];
}

/** A held curtain never stays up longer than this, whatever the next surface does. */
const HOLD_SAFETY_MS = 6000;

interface HeldCurtain {
  since: number;
  minMs: number;
  outMs: number;
  pending: boolean;
  safety: number;
}

export interface CoverOptions {
  variant: TransitionVariant;
  label?: string;
}

/**
 * The shared black curtain. While it covers the screen, pointer input is blocked by CSS and keyboard or gamepad input
 * (the gamepad navigator dispatches keydown first) by a capture listener, so nothing can start a second screen change
 * underneath it (final audit 2026-11-11, A4).
 */
export class SceneTransition {
  private overlay: HTMLElement | null = null;
  private active = false;
  private held: HeldCurtain | null = null;

  get isActive(): boolean { return this.active; }

  /** A curtain raised by cover() and still waiting for the next surface. */
  get isHeld(): boolean { return this.held !== null; }

  /**
   * Covers, runs the task under black, then lifts the curtain. Returns false only when another transition already
   * runs, without running the task. Under a held curtain, the task runs under it and this call lifts it.
   */
  async run(options: TransitionOptions): Promise<boolean> {
    if (this.held) {
      await this.runUnderHeldCurtain(options);
      return true;
    }
    if (this.active) return false;
    this.active = true;
    this.lock();
    const style = styleFor(options.variant);
    const timing = timingFor(options.variant);
    this.createOverlay(options.variant, style, options.label ?? '', timing);
    try {
      await this.awaitCovered(timing.inMs);
      await this.runInterlude(options);
      await options.task();
      await wait(options.holdMs ?? timing.holdMs);
      await this.reveal(timing.outMs);
    } catch (error) {
      this.destroyOverlay();
      throw error;
    } finally {
      this.unlock();
      this.active = false;
    }
    return true;
  }

  /**
   * Raises the curtain and keeps it up (final audit 2026-11-11, A5): the caller swaps the screen under black, then
   * the next surface calls releaseWhenReady(), or a later run() lifts it. Returns false when a transition already runs.
   */
  async cover(options: CoverOptions): Promise<boolean> {
    if (this.active) return false;
    this.active = true;
    this.lock();
    const timing = timingFor(options.variant);
    this.createOverlay(options.variant, styleFor(options.variant), options.label ?? '', timing);
    await this.awaitCovered(timing.inMs);
    const held: HeldCurtain = {
      since: performance.now(),
      minMs: timing.holdMs,
      outMs: timing.outMs,
      pending: false,
      safety: window.setTimeout(() => { if (this.held === held) void this.release(); }, HOLD_SAFETY_MS),
    };
    this.held = held;
    return true;
  }

  /** Lifts a held curtain once the new surface has painted and the curtain has been seen for its minimum hold. */
  releaseWhenReady(): void {
    const held = this.held;
    if (!held || held.pending) return;
    held.pending = true;
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const remaining = Math.max(0, held.minMs - (performance.now() - held.since));
      window.setTimeout(() => { if (this.held === held) void this.release(); }, remaining);
    }));
  }

  /** Lifts a held curtain now. */
  async release(): Promise<void> {
    const held = this.held;
    if (!held) return;
    this.held = null;
    window.clearTimeout(held.safety);
    try {
      await this.reveal(held.outMs);
    } finally {
      this.unlock();
      this.active = false;
    }
  }

  private async runUnderHeldCurtain(options: TransitionOptions): Promise<void> {
    const held = this.held!;
    this.held = null;
    window.clearTimeout(held.safety);
    try {
      await this.runInterlude(options);
      await options.task();
      await wait(options.holdMs ?? timingFor(options.variant).holdMs);
      await this.reveal(held.outMs);
    } catch (error) {
      this.destroyOverlay();
      throw error;
    } finally {
      this.unlock();
      this.active = false;
    }
  }

  private async runInterlude(options: TransitionOptions): Promise<void> {
    if (!options.interlude) return;
    this.unlock();
    document.body.classList.add('scene-transition--interlude');
    try {
      await options.interlude();
    } catch (error) {
      console.warn('[SceneTransition] Interlude failed safely.', error);
    } finally {
      document.body.classList.remove('scene-transition--interlude');
      this.lock();
    }
  }

  private readonly blockKeys = (event: KeyboardEvent): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private lock(): void {
    document.body.classList.add('scene-transition--locked');
    window.addEventListener('keydown', this.blockKeys, true);
    window.addEventListener('keyup', this.blockKeys, true);
  }

  private unlock(): void {
    document.body.classList.remove('scene-transition--locked', 'scene-transition--interlude');
    window.removeEventListener('keydown', this.blockKeys, true);
    window.removeEventListener('keyup', this.blockKeys, true);
  }

  private createOverlay(
    variant: TransitionVariant,
    style: TransitionStyle,
    label: string,
    timing: TransitionTiming,
  ): void {
    this.overlay = document.createElement('div');
    this.overlay.className = `scene-transition scene-transition--${variant} scene-transition--${style}`;
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.style.setProperty('--scene-transition-in', `${timing.inMs}ms`);
    this.overlay.style.setProperty('--scene-transition-out', `${timing.outMs}ms`);
    const motif = document.createElement('span');
    motif.className = 'scene-transition__motif';
    this.overlay.append(motif);
    if (label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'scene-transition__label';
      labelEl.textContent = label;
      this.overlay.append(labelEl);
    }
    document.body.append(this.overlay);
    void this.overlay.offsetWidth;
    this.overlay.classList.add('scene-transition--visible');
  }

  private async reveal(outMs: number): Promise<void> {
    if (!this.overlay) return;
    this.overlay.classList.remove('scene-transition--visible');
    this.overlay.classList.add('scene-transition--leaving');
    await wait(outMs);
    this.destroyOverlay();
  }

  private awaitCovered(inMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.overlay) { resolve(); return; }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.overlay?.removeEventListener('transitionend', onEnd);
        resolve();
      };
      const onEnd = (event: TransitionEvent) => {
        if (event.target !== this.overlay) return;
        finish();
      };
      this.overlay.addEventListener('transitionend', onEnd);
      window.setTimeout(finish, inMs + 120);
    });
  }

  private destroyOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}

export const sceneTransition = new SceneTransition();
