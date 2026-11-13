import type { SheetArt, SheetBook, ShotPainter } from '../opening/openingPainters';
import { pixelFigure } from '../opening/openingLayer';
import { cameraAt, OPENING_FRAME, type CameraKey, type ImageFrame, type ViewCamera } from '../opening/openingShots';
import { resolveCharacterVisualProfile } from '../../render/CharacterVisualRegistry';
import { prefersReducedMotion } from '../ReducedMotion';
import './living-tableau.css';

/** One shot of a living tableau: an existing approved painted tableau, how long it holds and how the camera moves. */
export interface LivingShot {
  id: string;
  image: string;
  seconds: number;
  from: CameraKey;
  to: CameraKey;
  /** Where the ground meets the horizon: the near layer grows from here as the camera moves in. */
  vanishing: { x: number; y: number };
  /** The painting's size in image pixels when it is not the Lion's 1672 × 941 (the post-demo tableaux are 1536 × 1024). */
  frame?: ImageFrame;
}

/**
 * A living tableau (set 1.13.0, OD-2026-11-04-A): a short sequence animated by code before an existing dialogue. It
 * names its moment by the dialogue's beat id; it has no caption.
 */
export interface LivingScript {
  id: string;
  label: string;
  shots: readonly LivingShot[];
  /** Units drawn from their combat pixel sheets. */
  sheets: readonly string[];
  /** Characters without a combat sheet, brought down from their dialogue portrait as at the opening's camp. */
  portraits: readonly string[];
  painter(shotId: string, sheets: SheetBook): ShotPainter;
  /** The same tableau's light, fire and smoke, kept alive behind the dialogue that follows: no figure. */
  backdrop?(): ShotPainter;
}

/** How a living tableau ended: played to its end, skipped, or never shown because its picture was missing. */
export type LivingOutcome = 'played' | 'skipped' | 'missing';

const CUT_SECONDS = 0.45;
const READY_TIMEOUT_MS = 5000;
const LEAVE_MS = 700;
const PARALLAX_NEAR = 0.05;

/** A plate shows its painting at its own size; the Lion's size stays the stylesheet's, so its tableaux are unchanged. */
function plateSize(shot: LivingShot): string {
  const frame = shot.frame;
  return frame && (frame.width !== OPENING_FRAME.width || frame.height !== OPENING_FRAME.height) ? ` style="width:${frame.width}px;height:${frame.height}px"` : '';
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/**
 * The shared, presentation-only player of the living tableaux. It reads and writes no game state, and never blocks:
 * a click or Enter moves to the next shot, Passer or Escape leaves, and a missing picture ends it at once so the
 * dialogue opens as it would without it. Reduced motion, from the system or the game, holds the camera and turns every
 * walk into a fade; fire, light and wind keep moving where they are. The opening keeps its own player and decision
 * (OD-2026-11-02-A); only drawing code is shared.
 */
export class LivingTableauPlayer {
  /** Settles once the pictures are in, or after READY_TIMEOUT_MS. */
  ready: Promise<void> = Promise.resolve();
  private element: HTMLElement | null = null;
  private script: LivingScript | null = null;
  private resolveOpen: ((outcome: LivingOutcome) => void) | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private readonly plates = new Map<string, { root: HTMLElement; far: HTMLImageElement; near: HTMLImageElement }>();
  private readonly sheets = new Map<string, SheetArt>();
  private painter: ShotPainter | null = null;
  private index = -1;
  private seconds = 0;
  private lastFrame = 0;
  private frame = 0;
  private reduced = false;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private bar = 0;
  private missing = false;
  private leaving: HTMLElement | null = null;
  private leavingTimer = 0;

  constructor(private readonly root: HTMLElement) {}

  open(script: LivingScript, options: { reducedMotion?: boolean } = {}): Promise<LivingOutcome> {
    this.close();
    this.script = script;
    this.missing = false;
    this.reduced = prefersReducedMotion(options.reducedMotion);
    const element = document.createElement('section');
    element.className = 'living-tableau';
    element.tabIndex = -1;
    element.dataset.livingTableau = script.id;
    element.dataset.reducedMotion = String(this.reduced);
    element.setAttribute('aria-label', script.label);
    element.innerHTML = `
      <div class="living-tableau__scene">
        ${script.shots.map(shot => { const size = plateSize(shot); return `<div class="living-tableau__plate" data-plate="${shot.id}"><img alt="" src="${shot.image}"${size}><img class="is-near" alt="" src="${shot.image}"${size}></div>`; }).join('')}
        <canvas class="living-tableau__canvas" aria-hidden="true"></canvas>
      </div>
      <div class="living-tableau__vignette" aria-hidden="true"></div>
      <div class="living-tableau__veil is-down" data-veil></div>
      <div class="living-tableau__bar living-tableau__bar--top" aria-hidden="true"></div>
      <div class="living-tableau__bar living-tableau__bar--bottom" aria-hidden="true"></div>
      <button class="living-tableau__skip" type="button" data-skip>Passer</button>`;
    this.root.append(element);
    this.element = element;
    this.canvas = element.querySelector('canvas');
    this.ctx = this.canvas?.getContext('2d') ?? null;
    this.plates.clear();
    for (const shot of script.shots) {
      const root = element.querySelector<HTMLElement>(`[data-plate="${shot.id}"]`);
      const images = root?.querySelectorAll('img');
      if (root && images?.[0] && images[1]) this.plates.set(shot.id, { root, far: images[0], near: images[1] });
    }
    this.measure();
    window.addEventListener('resize', this.measure);
    element.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKey);
    element.focus({ preventScroll: true });
    this.ready = this.prepare(script);
    return new Promise((resolve) => { this.resolveOpen = resolve; });
  }

  /** Starts the clock once the caller is ready; a picture that failed to load ends the sequence instead. */
  start(): void {
    if (!this.element || this.index >= 0) return;
    if (this.missing) { this.finish('missing'); return; }
    this.nextShot();
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  close(): void {
    this.stopClock();
    window.clearTimeout(this.leavingTimer);
    this.leaving?.remove();
    this.leaving = null;
    window.removeEventListener('resize', this.measure);
    document.removeEventListener('keydown', this.handleKey);
    this.element?.remove();
    this.element = null;
    this.plates.clear();
    this.settle('skipped');
  }

  private settle(outcome: LivingOutcome): void {
    const resolve = this.resolveOpen;
    this.resolveOpen = null;
    resolve?.(outcome);
  }

  private async prepare(script: LivingScript): Promise<void> {
    const pictures = Promise.all(script.shots.map(shot => loadImage(shot.image))).then((images) => { if (images.some(image => !image)) this.missing = true; });
    const sheets = import('../../combat/pixel/PixelSpriteSheets').then(({ resolvePixelSheet, PIXEL_PX_PER_UNIT }) => Promise.all([
      ...script.sheets.map(async (id) => {
        const entry = resolvePixelSheet(id);
        const image = entry && !this.sheets.has(id) ? await loadImage(entry.file) : null;
        if (entry && image) this.sheets.set(id, { entry, image });
      }),
      ...script.portraits.map(async (id) => {
        const profile = resolveCharacterVisualProfile(id);
        const image = profile && !this.sheets.has(id) ? await loadImage(profile.dialogue) : null;
        const figure = profile && image ? pixelFigure(image, id, profile.worldUnitsPerPixel * PIXEL_PX_PER_UNIT) : null;
        if (figure) this.sheets.set(id, figure);
      }),
    ])).catch(() => undefined);
    await Promise.race([Promise.all([pictures, sheets]), new Promise((resolve) => window.setTimeout(resolve, READY_TIMEOUT_MS))]);
  }

  private readonly measure = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.bar = Math.max(this.height * 0.11, (this.height - this.width / 2) / 2);
    this.ratio = Math.min(2, window.devicePixelRatio || 1);
    if (this.canvas) { this.canvas.width = Math.round(this.width * this.ratio); this.canvas.height = Math.round(this.height * this.ratio); }
  };

  private readonly handleClick = (event: MouseEvent): void => {
    if ((event.target as HTMLElement).closest('[data-skip]')) this.finish('skipped');
    else this.nextShot();
  };

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (!this.element) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.finish('skipped');
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && !(event.target as HTMLElement | null)?.closest?.('[data-skip]')) {
      event.preventDefault();
      this.nextShot();
    }
  };

  private nextShot(): void {
    const element = this.element, script = this.script;
    if (!element || !script) return;
    const next = script.shots[this.index + 1];
    if (!next) { this.finish(this.index < 0 ? 'skipped' : 'played'); return; }
    this.index += 1;
    this.seconds = 0;
    element.dataset.shot = next.id;
    this.painter = script.painter(next.id, this.sheets);
    for (const [id, plate] of this.plates) plate.root.classList.toggle('is-visible', id === next.id);
    this.clearCanvas();
    this.paint(next, 0);
  }

  private readonly tick = (now: number): void => {
    const shot = this.script?.shots[this.index];
    if (!shot || !this.element) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.seconds += dt;
    if (this.seconds >= shot.seconds) this.nextShot();
    else this.paint(shot, dt);
    if (this.element) this.frame = requestAnimationFrame(this.tick);
  };

  private paint(shot: LivingShot, dt: number): void {
    const element = this.element;
    if (!element) return;
    const progress = this.reduced ? 1 : this.seconds / shot.seconds;
    const camera = cameraAt(shot, progress, this.width, this.height, this.bar, shot.frame);
    this.placePlate(shot, camera, progress);
    const last = this.script?.shots.at(-1) === shot;
    element.querySelector<HTMLElement>('[data-veil]')!.classList.toggle('is-down', !last && shot.seconds - this.seconds < CUT_SECONDS || this.seconds < 0.05);
    if (!this.ctx) return;
    this.clearCanvas();
    this.painter?.({ ctx: this.ctx, width: this.width, height: this.height, seconds: this.seconds, dt, camera, reduced: this.reduced });
  }

  private clearCanvas(): void {
    this.ctx?.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }

  private placePlate(shot: LivingShot, camera: ViewCamera, progress: number): void {
    const plate = this.plates.get(shot.id);
    if (!plate) return;
    plate.far.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    const scale = camera.scale * (1 + PARALLAX_NEAR * progress);
    const anchorX = camera.x + shot.vanishing.x * camera.scale, anchorY = camera.y + shot.vanishing.y * camera.scale;
    plate.near.style.transform = `translate(${anchorX - shot.vanishing.x * scale}px,${anchorY - shot.vanishing.y * scale}px) scale(${scale})`;
  }

  private stopClock(): void {
    cancelAnimationFrame(this.frame);
    this.index = -1;
    this.painter = null;
  }

  /** The tableau fades over the dialogue that mounts beneath it. */
  private finish(outcome: LivingOutcome): void {
    const element = this.element;
    if (!element) return;
    this.stopClock();
    window.removeEventListener('resize', this.measure);
    document.removeEventListener('keydown', this.handleKey);
    element.removeEventListener('click', this.handleClick);
    element.classList.add('is-leaving');
    this.element = null;
    this.leaving = element;
    this.leavingTimer = window.setTimeout(() => { element.remove(); if (this.leaving === element) this.leaving = null; }, outcome === 'missing' ? 0 : LEAVE_MS);
    this.settle(outcome);
  }
}
