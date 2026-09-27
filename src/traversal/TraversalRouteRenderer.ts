/** Side-on T0 fast road. The loop assets are presentation only. */
export const TRAVERSAL_FOREST_ROUTE_ASSETS = Object.freeze({
  far: '/assets/generated/lion-phase/traversal/t0/forest-v4/far.png',
  trees: '/assets/generated/lion-phase/traversal/t0/forest-v4/trees-loop.png',
  road: '/assets/generated/lion-phase/traversal/t0/forest-v4/road-loop.png',
  foreground: '/assets/generated/lion-phase/traversal/t0/forest-v4/foreground-loop.png',
});

export class TraversalRouteRenderer {
  readonly element = document.createElement('div');
  private distancePx = 0;
  readonly ready: Promise<void>;
  isReady = false;

  constructor() {
    this.element.className = 'traversal-route-loop';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<div class="traversal-route-loop__far"></div><div class="traversal-route-loop__trees"></div><div class="traversal-route-loop__road"></div><div class="traversal-route-loop__median"></div><div class="traversal-route-loop__foreground"></div><div class="traversal-route-loop__speed-lines"></div>';
    // CSS backgrounds cannot be decoded directly. Prime the identical URLs before entry reveal.
    if (typeof Image.prototype.decode !== 'function') {
      this.isReady = true;
      this.ready = Promise.resolve();
    } else {
      this.ready = Promise.all(Object.values(TRAVERSAL_FOREST_ROUTE_ASSETS).map(async src => {
        const image = new Image();
        image.src = src;
        await image.decode();
      })).then(() => { this.isReady = true; }, error => {
        console.error('[Traversal] Forest route art did not decode.', error);
        this.isReady = true;
      });
    }
  }

  advance(deltaMs: number, speed: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !Number.isFinite(speed)) return;
    this.distancePx += speed * deltaMs * .28;
  }

  get distance(): number { return this.distancePx; }

  render(): void {
    this.element.style.setProperty('--route-road-x', `${-this.distancePx}px`);
    this.element.style.setProperty('--route-trees-x', `${-this.distancePx * .28}px`);
    this.element.style.setProperty('--route-median-x', `${-this.distancePx * .86}px`);
    this.element.style.setProperty('--route-foreground-x', `${-this.distancePx * 1.15}px`);
    // The far painting is not a tile. A small bounded drift keeps its edges offscreen.
    this.element.style.setProperty('--route-far-drift', `${Math.sin(this.distancePx * .00035) * 20}px`);
  }
}
