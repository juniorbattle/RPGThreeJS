import type { SheetArt, ShotPainter } from './openingPainters';
import { createShotPainter } from './openingPainters';
import { resolveCharacterVisualProfile } from '../../render/CharacterVisualRegistry';
import { pixelFigure } from './openingLayer';
import { prefersReducedMotion } from '../ReducedMotion';
import { cameraAt, OPENING_ADVISERS, OPENING_BARS_OPEN_AT, OPENING_CAST, OPENING_POLE_LANDS_AT, OPENING_SHEETS, OPENING_SHOTS, type OpeningShot, type ViewCamera } from './openingShots';
import './opening-sequence.css';

const CUT_SECONDS = 0.5;
const READY_TIMEOUT_MS = 6000;
const LEAVE_MS = 900;
const PARALLAX_NEAR = 0.05;
/** Where the ground meets the horizon: the near layer grows from here, as the ground does when a camera moves in. */
const VANISHING: Partial<Record<OpeningShot['id'], { x: number; y: number }>> = {
  prologue_fall: { x: 1040, y: 470 }, prologue_seals: { x: 1240, y: 430 }, prologue_lion: { x: 948, y: 420 }, prologue_shadow: { x: 700, y: 620 }, prologue_departure: { x: 1000, y: 460 },
};

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/**
 * The opening of a new chronicle (OD-2026-11-02-A): 55 seconds of living tableaux in place of the five read panels.
 * It reads and writes no game state and leaves the music to the `PROLOGUE` mode. A click or Enter moves to the next shot, Passer or Escape leaves. The text runs
 * on the sequence's own clock, never on the sound's, and stays when a picture is slow or missing. Canvas effects are
 * optional: without them the tableaux and the text still play. The heroes of the last shot are drawn in the scene, on
 * the tableau's grain and in its light. Reduced motion, from the system or the game, holds the camera and replaces every
 * fall, march and walk with a fade; fire, light and wind keep moving where they are.
 */
export class OpeningSequence {
  /** Settles once the pictures are in, or after READY_TIMEOUT_MS. Nothing waits on them longer. */
  ready: Promise<void> = Promise.resolve();
  private element: HTMLElement | null = null;
  private leaving: HTMLElement | null = null;
  private leavingTimer = 0;
  private resolveOpen: (() => void) | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private readonly plates = new Map<string, { root: HTMLElement; far: HTMLImageElement; near: HTMLImageElement }>();
  private readonly sheets = new Map<string, SheetArt>();
  private painter: ShotPainter | null = null;
  private index = -1;
  private seconds = 0;
  private lastFrame = 0;
  private frame = 0;
  private lineText = '';
  private reduced = false;
  private width = 0;
  private ratio = 1;
  private height = 0;
  private bar = 0;

  constructor(private readonly root: HTMLElement) {}

  open(options: { reducedMotion?: boolean } = {}): Promise<void> {
    this.close();
    this.reduced = prefersReducedMotion(options.reducedMotion);
    const element = document.createElement('section');
    element.className = 'opening-sequence';
    element.tabIndex = -1;
    element.dataset.reducedMotion = String(this.reduced);
    element.dataset.bars = 'closed';
    element.setAttribute('aria-label', 'Prologue');
    element.innerHTML = `
      <div class="opening-sequence__scene">
        ${OPENING_SHOTS.map(shot => `<div class="opening-sequence__plate" data-plate="${shot.id}"><img alt="" src="${shot.image}"><img class="is-near" alt="" src="${shot.image}"></div>`).join('')}
        <canvas class="opening-sequence__canvas" aria-hidden="true"></canvas>
      </div>
      <div class="opening-sequence__vignette" aria-hidden="true"></div>
      <div class="opening-sequence__veil is-down" data-veil></div>
      <div class="opening-sequence__bar opening-sequence__bar--top" aria-hidden="true"></div>
      <div class="opening-sequence__bar opening-sequence__bar--bottom" aria-hidden="true"></div>
      <p class="opening-sequence__line" data-line aria-live="polite"></p>
      <button class="opening-sequence__skip" type="button" data-skip>Passer</button>`;
    this.root.append(element);
    this.element = element;
    this.canvas = element.querySelector('canvas');
    this.ctx = this.canvas?.getContext('2d') ?? null;
    this.plates.clear();
    for (const shot of OPENING_SHOTS) {
      const root = element.querySelector<HTMLElement>(`[data-plate="${shot.id}"]`);
      const images = root?.querySelectorAll('img');
      if (root && images?.[0] && images[1]) this.plates.set(shot.id, { root, far: images[0], near: images[1] });
    }
    this.measure();
    window.addEventListener('resize', this.measure);
    element.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKey);
    element.focus({ preventScroll: true });
    this.ready = this.prepare();
    return new Promise((resolve) => { this.resolveOpen = resolve; });
  }

  /** Starts the clock. The caller decides when, so the launch transition never eats the first line. */
  start(): void {
    if (!this.element || this.index >= 0) return;
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
    this.settle();
  }

  private settle(): void {
    const resolve = this.resolveOpen;
    this.resolveOpen = null;
    resolve?.();
  }

  private async prepare(): Promise<void> {
    const pictures = [...this.plates.values()].map(({ far }) => far.decode?.().catch(() => undefined));
    const sheets = import('../../combat/pixel/PixelSpriteSheets').then(({ resolvePixelSheet, PIXEL_PX_PER_UNIT }) => Promise.all([
      ...[...OPENING_SHEETS, ...OPENING_CAST.map(hero => hero.id)].map(async (id) => {
        const entry = resolvePixelSheet(id);
        const image = entry && !this.sheets.has(id) ? await loadImage(entry.file) : null;
        if (entry && image) this.sheets.set(id, { entry, image });
      }),
      // The advisers have no combat sheet: their portrait, which the dialogue that follows shows too, is brought down
      // to the heroes' density.
      ...OPENING_ADVISERS.map(async ({ id }) => {
        const profile = resolveCharacterVisualProfile(id);
        const image = profile && !this.sheets.has(id) ? await loadImage(profile.dialogue) : null;
        const figure = profile && image ? pixelFigure(image, id, profile.worldUnitsPerPixel * PIXEL_PX_PER_UNIT) : null;
        if (figure) this.sheets.set(id, figure);
      }),
    ])).catch(() => undefined);
    await Promise.race([Promise.all([...pictures, sheets]), new Promise((resolve) => window.setTimeout(resolve, READY_TIMEOUT_MS))]);
  }

  private readonly measure = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.bar = Math.max(this.height * 0.11, (this.height - this.width / 2) / 2);
    // Drawn at the screen's own resolution, as the painting under it is: never a blurred enlargement.
    this.ratio = Math.min(2, window.devicePixelRatio || 1);
    if (this.canvas) { this.canvas.width = Math.round(this.width * this.ratio); this.canvas.height = Math.round(this.height * this.ratio); }
  };

  private readonly handleClick = (event: MouseEvent): void => {
    if ((event.target as HTMLElement).closest('[data-skip]')) this.finish();
    else this.nextShot();
  };

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (!this.element) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.finish();
      return;
    }
    // Enter on a focused Passer stays the button's own.
    if ((event.key === 'Enter' || event.key === ' ') && !(event.target as HTMLElement | null)?.closest?.('[data-skip]')) {
      event.preventDefault();
      this.nextShot();
    }
  };

  private nextShot(): void {
    const element = this.element;
    if (!element) return;
    const next = OPENING_SHOTS[this.index + 1];
    if (!next) { this.finish(); return; }
    this.index += 1;
    this.seconds = 0;
    this.lineText = '';
    element.querySelector<HTMLElement>('[data-line]')!.textContent = '';
    element.dataset.panel = next.id;
    this.painter = createShotPainter(next.id, this.sheets);
    for (const [id, plate] of this.plates) plate.root.classList.toggle('is-visible', id === next.id);
    this.clearCanvas();
    this.paint(next, 0);
  }

  private readonly tick = (now: number): void => {
    if (this.index < 0 || !this.element) return;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.seconds += dt;
    const shot = OPENING_SHOTS[this.index];
    if (shot && this.seconds >= shot.seconds) this.nextShot();
    else if (shot) this.paint(shot, dt);
    if (this.element) this.frame = requestAnimationFrame(this.tick);
  };

  private paint(shot: OpeningShot, dt: number): void {
    const element = this.element;
    if (!element) return;
    const remaining = shot.seconds - this.seconds;
    const last = shot.id === 'prologue_departure';
    const progress = this.reduced ? 1 : this.seconds / shot.seconds;
    const camera = cameraAt(shot, progress, this.width, this.height, this.bar);
    if (shot.id === 'prologue_fall' && !this.reduced) camera.y += this.landingShake();
    this.placePlate(shot, camera, progress);
    element.querySelector<HTMLElement>('[data-veil]')!.classList.toggle('is-down', !last && remaining < CUT_SECONDS || this.seconds < 0.05);
    const text = this.reduced ? shot.lines.map(line => line.text).join(' ') : shot.lines.filter(line => line.at <= this.seconds).at(-1)?.text ?? '';
    const line = element.querySelector<HTMLElement>('[data-line]')!;
    if (text !== this.lineText) {
      this.lineText = text;
      line.textContent = text;
      if (!this.reduced) line.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' });
    }
    line.classList.toggle('is-out', remaining < CUT_SECONDS + 0.3 || last && this.seconds >= OPENING_BARS_OPEN_AT + 0.6);
    if (last) element.dataset.bars = this.seconds >= OPENING_BARS_OPEN_AT ? 'open' : 'closed';
    if (!this.ctx) return;
    this.clearCanvas();
    this.painter?.({ ctx: this.ctx, width: this.width, height: this.height, seconds: this.seconds, dt, camera, reduced: this.reduced });
  }

  private clearCanvas(): void {
    this.ctx?.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }

  /** The pole hits the ground: two pixels of weight, gone in a third of a second. */
  private landingShake(): number {
    const since = this.seconds - OPENING_POLE_LANDS_AT;
    return since >= 0 && since < 0.32 ? Math.sin(since * 46) * 3 * (1 - since / 0.32) : 0;
  }

  private placePlate(shot: OpeningShot, camera: ViewCamera, progress: number): void {
    const plate = this.plates.get(shot.id);
    if (!plate) return;
    plate.far.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    const vanishing = VANISHING[shot.id] ?? { x: 836, y: 470 };
    const scale = camera.scale * (1 + PARALLAX_NEAR * progress);
    const anchorX = camera.x + vanishing.x * camera.scale, anchorY = camera.y + vanishing.y * camera.scale;
    plate.near.style.transform = `translate(${anchorX - vanishing.x * scale}px,${anchorY - vanishing.y * scale}px) scale(${scale})`;
  }

  private stopClock(): void {
    cancelAnimationFrame(this.frame);
    this.index = -1;
    this.painter = null;
  }

  /** The sequence fades over the dialogue that mounts beneath it, on the same camp. */
  private finish(): void {
    const element = this.element;
    if (!element) return;
    this.stopClock();
    window.removeEventListener('resize', this.measure);
    document.removeEventListener('keydown', this.handleKey);
    element.removeEventListener('click', this.handleClick);
    // The dialogue that follows opens on another cast: the canvas, heroes and all, goes first (see the stylesheet).
    element.classList.add('is-leaving');
    element.dataset.bars = 'open';
    this.leaving = element;
    this.element = null;
    this.leavingTimer = window.setTimeout(() => {
      element.remove();
      if (this.leaving === element) this.leaving = null;
    }, LEAVE_MS);
    this.settle();
  }
}
