import { prefersReducedMotion } from '../ui/ReducedMotion';

export const TRAVERSAL_PURSUER_IMAGE = '/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png';
export const TRAVERSAL_PURSUER_RUN = '/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer-run-v1.png';
const FRAME_MS = 85;

/** A pose reader only: the supplied road clock owns cadence, pause and contact. */
export class TraversalPursuerSprite {
  readonly element = document.createElement('span');
  private readonly fallback = document.createElement('img');
  private readonly sheet = document.createElement('img');
  private disposed = false;
  private frame = 0;

  constructor() {
    this.element.className = 'traversal-pursuer-sprite';
    this.element.dataset.asset = 'pending';
    this.element.dataset.frame = '0';
    this.fallback.alt = this.sheet.alt = '';
    this.fallback.draggable = this.sheet.draggable = false;
    this.fallback.className = 'traversal-pursuer-sprite__fallback';
    this.sheet.hidden = true;
    this.sheet.className = 'traversal-pursuer-sprite__loader';
    this.sheet.onload = () => {
      if (this.disposed) return;
      if (this.sheet.naturalWidth !== 1536 || this.sheet.naturalHeight !== 492) {
        this.element.style.backgroundImage = 'none';
        this.element.dataset.asset = 'fallback';
        return;
      }
      this.element.style.backgroundImage = `url("${TRAVERSAL_PURSUER_RUN}")`;
      this.element.dataset.asset = 'sheet';
    };
    this.sheet.onerror = () => {
      if (this.disposed) return;
      this.element.style.backgroundImage = 'none';
      this.element.dataset.asset = 'fallback';
    };
    this.fallback.onerror = () => { if (!this.disposed) this.element.dataset.fallbackFailed = 'true'; };
    this.element.append(this.fallback, this.sheet);
    this.fallback.src = TRAVERSAL_PURSUER_IMAGE;
    this.sheet.src = TRAVERSAL_PURSUER_RUN;
  }

  update(elapsedMs: number, active: boolean, reducedMotion = false): void {
    if (this.disposed) return;
    const reduced = prefersReducedMotion(reducedMotion);
    // Freeze the displayed pose when covered, paused, or in contact. No independent CSS clock.
    if (reduced) this.frame = 0;
    else if (active && Number.isFinite(elapsedMs) && elapsedMs >= 0) this.frame = Math.floor(elapsedMs / FRAME_MS) % 6;
    this.element.dataset.frame = String(this.frame);
    this.element.dataset.reducedMotion = String(reduced);
    this.element.style.backgroundPosition = `${(this.frame % 3) * 50}% ${Math.floor(this.frame / 3) * 100}%`;
  }

  dispose(): void {
    this.disposed = true;
    this.sheet.onload = this.sheet.onerror = this.fallback.onerror = null;
    this.element.remove();
  }
}
