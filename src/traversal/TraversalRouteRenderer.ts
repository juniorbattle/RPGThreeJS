/** Side-on T0 fast road. The loop assets are presentation only. */
export class TraversalRouteRenderer {
  readonly element = document.createElement('div');
  private distancePx = 0;

  constructor() {
    this.element.className = 'traversal-route-loop';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<div class="traversal-route-loop__far"></div><div class="traversal-route-loop__road"></div><div class="traversal-route-loop__speed-lines"></div>';
  }

  advance(deltaMs: number, speed: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !Number.isFinite(speed)) return;
    this.distancePx += speed * deltaMs * .28;
    this.render();
  }

  private render(): void {
    this.element.style.setProperty('--route-road-x', `${-this.distancePx}px`);
    this.element.style.setProperty('--route-far-x', `${-this.distancePx * .24}px`);
  }
}
