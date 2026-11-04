import type { ShotPainter } from '../opening/openingPainters';
import { IMAGE_HEIGHT, IMAGE_WIDTH, type ViewCamera } from '../opening/openingShots';
import './living-tableau.css';

/**
 * The animated backdrop of a dialogue that follows a living tableau (set 1.13.0): the tableau's light, fire and smoke,
 * drawn inside the dialogue's own environment layer so they share its cover framing, its filter and its slow breathing.
 * No figure, no text; it changes no staging, focus or line, and stops with the stage. Presentation only.
 */
export class LivingBackdrop {
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  private frame = 0;
  private last = 0;
  private seconds = 0;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private disposed = false;

  constructor(private readonly host: HTMLElement, private readonly painter: ShotPainter, private readonly reduced: boolean) {
    this.canvas.className = 'living-backdrop';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    host.append(this.canvas);
    this.measure();
    window.addEventListener('resize', this.measure);
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.measure);
    this.canvas.remove();
  }

  private readonly measure = (): void => {
    this.width = this.host.clientWidth;
    this.height = this.host.clientHeight;
    this.ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.ratio);
    this.canvas.height = Math.round(this.height * this.ratio);
  };

  /** The painting as the layer shows it: `background-size: cover`, centred. */
  private camera(): ViewCamera {
    const scale = Math.max(this.width / IMAGE_WIDTH, this.height / IMAGE_HEIGHT);
    return { scale, x: (this.width - IMAGE_WIDTH * scale) / 2, y: (this.height - IMAGE_HEIGHT * scale) / 2 };
  }

  private readonly tick = (now: number): void => {
    if (this.disposed) return;
    if (!this.host.isConnected) { this.dispose(); return; }
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.seconds += dt;
    if (this.ctx && this.width && this.height) {
      this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.painter({ ctx: this.ctx, width: this.width, height: this.height, seconds: this.seconds, dt, camera: this.camera(), reduced: this.reduced });
    }
    this.frame = requestAnimationFrame(this.tick);
  };
}
