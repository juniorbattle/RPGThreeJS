import { ROAD_SPACE } from './TraversalRoadSpace';

/** Presentation-only world anchors. Once seen, an object cannot move with a new forecast. */
export class TraversalRoadAnchors {
  private readonly anchors = new Map<string, { distance: number; entered: boolean; exited: boolean }>();

  reset(): void { this.anchors.clear(); }

  update(id: string, visualDistance: number, viewportWidth: number, halfWidth: number,
    forecastDistance: () => number): { x: number; left: number; right: number; visible: boolean } {
    let anchor = this.anchors.get(id);
    if (!anchor) {
      anchor = { distance: visualDistance + forecastDistance(), entered: false, exited: false };
      this.anchors.set(id, anchor);
    }
    const x = viewportWidth * .25 + (anchor.distance - visualDistance) * viewportWidth / ROAD_SPACE.referenceWidth;
    const left = x - halfWidth, right = x + halfWidth;
    if (right >= 0 && left <= viewportWidth && !anchor.exited) anchor.entered = true;
    if (anchor.entered && right < 0) anchor.exited = true;
    return { x, left, right, visible: !anchor.exited && right >= 0 && left <= viewportWidth };
  }

  reforecastUnseen(): void {
    for (const [id, anchor] of this.anchors) if (!anchor.entered) this.anchors.delete(id);
  }
}

export function roadVehicleHeight(width: number, height: number): number {
  return Math.min(height * .24, width * (width <= 1000 ? .16 : .14));
}

/** All grounded actors share one stacking plane, below foreground and UI. */
export function setRoadGroundDepth(element: HTMLElement, screenGroundY: number): void {
  element.dataset.screenGroundY = String(screenGroundY);
  element.style.zIndex = String(Math.round(screenGroundY * 10));
}
