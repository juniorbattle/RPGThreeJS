import { ROAD_SPACE, roadWorldToScreen } from './TraversalRoadSpace';
import { createTraversalSprite } from './TraversalSprite';

/** Stable compositing planes. Lane changes move actors through a fixed foreground;
 * they never change their relationship to occlusion or interaction UI.
 * Authored forest/road paintings intentionally stay together in road-world.
 */
export const TRAVERSAL_DEPTH = Object.freeze({
  'road-world': 0,
  'road-actors': 20,
  'foreground-occlusion': 30,
  'foreground-extreme': 34,
  'markers': 42,
  'ui': 45,
});

export function setTraversalDepth(element: HTMLElement, plane: keyof typeof TRAVERSAL_DEPTH): void {
  element.dataset.depthPlane = plane;
  element.style.zIndex = String(TRAVERSAL_DEPTH[plane]);
}

export interface TraversalOccluder {
  readonly id: string;
  readonly worldX: number;
  readonly asset: string;
  readonly groundPercent: number;
  readonly vehicleHeightRatio: number;
  readonly mirror: boolean;
}

export class TraversalForegroundRenderer {
  readonly element = document.createElement('div');
  private readonly pieces: { worldX: number; element: HTMLElement }[];
  private lastCamera = NaN;
  private lastWidth = NaN;
  constructor(occluders: readonly TraversalOccluder[]) {
    this.element.className = 'traversal-world__occlusion';
    this.element.setAttribute('aria-hidden', 'true');
    setTraversalDepth(this.element, 'foreground-occlusion');
    this.pieces = occluders.map(definition => {
      const element = createTraversalSprite(definition.asset, 'traversal-near-plant', definition.mirror);
      element.dataset.occluder = definition.id;
      element.dataset.physicalPlacement = 'camera-side-verge';
      element.style.top = `${definition.groundPercent}%`;
      element.style.height = `calc(var(--vehicle-height) * ${definition.vehicleHeightRatio})`;
      this.element.append(element);
      return { worldX: definition.worldX, element };
    });
  }
  readyVisible(): Promise<void> | void {
    if (typeof Image.prototype.decode !== 'function') return;
    const images = this.pieces.filter(piece => !piece.element.hidden)
      .flatMap(piece => Array.from(piece.element.querySelectorAll('img')));
    return Promise.all(images.map(image => image.decode())).then(() => undefined);
  }
  update(camera: number, width: number): void {
    if (camera === this.lastCamera && width === this.lastWidth) return;
    this.lastCamera = camera;
    this.lastWidth = width;
    for (const piece of this.pieces) {
      const x = roadWorldToScreen(piece.worldX, camera, width);
      const hidden = x < -width * .3 || x > width * 1.3;
      if (piece.element.hidden !== hidden) piece.element.hidden = hidden;
      if (!hidden) piece.element.style.left = `${x}px`;
    }
    this.element.dataset.camera = String(camera);
    this.element.dataset.roadScale = String(width / ROAD_SPACE.referenceWidth);
  }
}
