export type TransitionVariant = 'fade' | 'dialogue' | 'travel' | 'combat' | 'boss' | 'result';
export type TransitionStyle = 'fade' | 'wipe';

interface TransitionOptions {
  variant: TransitionVariant;
  label?: string;
  task: () => Promise<void>;
}

const WIPE_VARIANTS: TransitionVariant[] = ['combat', 'boss'];

const FADE_IN_MS = 600;
const FADE_HOLD_MS = 500;
const FADE_OUT_MS = 500;

const WIPE_IN_MS = 520;
const WIPE_HOLD_MS = 650;
const WIPE_OUT_MS = 520;

function styleFor(variant: TransitionVariant): TransitionStyle {
  return WIPE_VARIANTS.includes(variant) ? 'wipe' : 'fade';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
    const inMs = style === 'wipe' ? WIPE_IN_MS : FADE_IN_MS;
    const holdMs = style === 'wipe' ? WIPE_HOLD_MS : FADE_HOLD_MS;
    const outMs = style === 'wipe' ? WIPE_OUT_MS : FADE_OUT_MS;
    this.createOverlay(options.variant, style, options.label ?? '');
    try {
      await wait(inMs);
      await options.task();
      await wait(holdMs);
      await this.reveal(outMs);
    } catch (error) {
      this.destroyOverlay();
      throw error;
    } finally {
      document.body.classList.remove('scene-transition--locked');
      this.active = false;
    }
  }

  private createOverlay(variant: TransitionVariant, style: TransitionStyle, label: string): void {
    this.overlay = document.createElement('div');
    this.overlay.className = `scene-transition scene-transition--${variant} scene-transition--${style}`;
    this.overlay.setAttribute('aria-hidden', 'true');
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
