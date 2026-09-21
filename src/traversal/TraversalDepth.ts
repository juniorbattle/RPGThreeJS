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

const ROOT = '/assets/generated/lion-phase/traversal/t0/depth-v1/foreground';
export const TRAVERSAL_FOREGROUND_ASSETS = Object.freeze({ fern: `${ROOT}/ferns.png`, roots: `${ROOT}/roots.png` });

/** Camera-side plants rooted BELOW the lower road, not collision/interaction beats.
 * Spacing leaves full-wheel openings; fixed world coordinates survive return/fork.
 */
export const TRAVERSAL_OCCLUDERS = Object.freeze(Array.from({ length: 28 }, (_, index) => ({
  id: `near-road-${index}`,
  worldX: -120 + index * 435 + [0, 60, -35, 110][index % 4]!,
  asset: index % 3 === 1 ? TRAVERSAL_FOREGROUND_ASSETS.roots : TRAVERSAL_FOREGROUND_ASSETS.fern,
  groundPercent: index % 3 === 1 ? 87.6 : 86.1,
  vehicleHeightRatio: index % 3 === 1 ? .24 : [.36, .32, .39][index % 3]!,
  mirror: index % 2 === 1,
})));

export class TraversalForegroundRenderer {
  readonly element = document.createElement('div');
  private readonly pieces: { worldX: number; element: HTMLElement }[];
  private lastCamera = NaN;
  private lastWidth = NaN;
  constructor() {
    this.element.className = 'traversal-world__occlusion';
    this.element.setAttribute('aria-hidden', 'true');
    setTraversalDepth(this.element, 'foreground-occlusion');
    this.pieces = TRAVERSAL_OCCLUDERS.map(definition => {
      const element = createTraversalSprite(definition.asset, 'traversal-near-plant', definition.mirror);
      element.dataset.occluder = definition.id;
      element.dataset.physicalPlacement = 'camera-side-verge';
      element.style.top = `${definition.groundPercent}%`;
      element.style.height = `calc(var(--vehicle-height) * ${definition.vehicleHeightRatio})`;
      this.element.append(element);
      return { worldX: definition.worldX, element };
    });
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
