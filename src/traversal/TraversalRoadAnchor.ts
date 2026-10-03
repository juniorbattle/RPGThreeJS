import { ROAD_SPACE } from './TraversalRoadSpace';
import { forecastRouteDistance, type TraversalRouteRunState, type TraversalRouteSegment } from './TraversalRouteRun';

export interface RoadContactAnchor { readonly progress01: number; readonly distance: number }

/** Reconcile the shared world, never a visible object or its authored contact clock. */
export function anchoredRoadSpeed(previous: TraversalRouteRunState, next: TraversalRouteRunState,
  segment: TraversalRouteSegment, visualDistance: number, target: RoadContactAnchor | null,
  launchMultiplier: number): number {
  const base = (previous.speed + next.speed) / 2 * launchMultiplier;
  if (!target || target.progress01 <= previous.progress01) return base;
  const remaining = target.distance - visualDistance;
  const forecast = forecastRouteDistance(previous, segment, target.progress01);
  if (!Number.isFinite(remaining) || remaining <= 0 || forecast <= 0) return base;
  const ratio = remaining / forecast;
  // A malformed or incompatible presentation target cannot force a road jump.
  if (!Number.isFinite(ratio) || ratio < .5 || ratio > 2) return base;
  if (next.progress01 >= target.progress01) {
    const afterMs = next.elapsedMs - target.progress01 * segment.durationMs;
    const distance = remaining + Math.max(0, afterMs) * next.speed * .28;
    return distance / ((next.elapsedMs - previous.elapsedMs) * .28);
  }
  return (previous.speed + next.speed) / 2 * ratio;
}

/** Presentation-only world anchors. Once seen, an object cannot move with a new forecast. */
export class TraversalRoadAnchors {
  private readonly anchors = new Map<string, { distance: number; entered: boolean; exited: boolean }>();

  reset(): void { this.anchors.clear(); }

  enteredDistance(id: string): number | null {
    const anchor = this.anchors.get(id);
    return anchor?.entered && !anchor.exited ? anchor.distance : null;
  }

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
