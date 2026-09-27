/** T0 Route motion and rush overlay. TraversalWorldRenderer owns all painted scenery. */
export class TraversalRouteRenderer {
  readonly element = document.createElement('div');
  private distancePx = 0;
  readonly ready: Promise<void> = Promise.resolve();
  readonly isReady = true;

  constructor() {
    this.element.className = 'traversal-route-loop';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<div class="traversal-route-loop__speed-lines"></div>';
  }

  advance(deltaMs: number, speed: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !Number.isFinite(speed)) return;
    this.distancePx += speed * deltaMs * .28;
  }

  get distance(): number { return this.distancePx; }
}
