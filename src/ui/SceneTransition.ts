export type TransitionVariant = 'fade' | 'launch' | 'dialogue' | 'travel' | 'combat' | 'boss' | 'result';
export type TransitionStyle = 'fade' | 'wipe';

interface TransitionOptions {
  variant: TransitionVariant;
  label?: string;
  task: () => Promise<void>;
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

class SceneTransition {
  private overlay: HTMLElement | null = null;
  private active = false;

  get isActive(): boolean { return this.active; }

  async run(options: TransitionOptions): Promise<void> {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('scene-transition--locked');
    const style = styleFor(options.variant);
    const timing = timingFor(options.variant);
    this.createOverlay(options.variant, style, options.label ?? '', timing);
    try {
      await wait(timing.inMs);
      await options.task();
      await wait(timing.holdMs);
      await this.reveal(timing.outMs);
    } catch (error) {
      this.destroyOverlay();
      throw error;
    } finally {
      document.body.classList.remove('scene-transition--locked');
      this.active = false;
    }
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

  private destroyOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}

export const sceneTransition = new SceneTransition();
