import { ROAD_SPACE } from './TraversalRoadSpace';
import { forecastRouteDistance, type TraversalRouteRunState, type TraversalRouteSegment } from './TraversalRouteRun';

export interface RoadContactAnchor { readonly progress01: number; readonly distance: number }

/** One world-distance scale keeps even the earliest authored mark outside the entry edge. */
export function roadEntryScale(state: TraversalRouteRunState, segment: TraversalRouteSegment,
  viewportWidth: number, contacts: readonly { progress01: number; halfWidth: number }[]): number {
  return Math.max(1, ...contacts.map(contact => {
    const forecast = forecastRouteDistance(state, segment, contact.progress01);
    const entryDistance = ROAD_SPACE.referenceWidth * (.75 + (contact.halfWidth + 8) / viewportWidth);
    return forecast > 0 ? entryDistance / forecast : 1;
  }));
}

/** Reconcile the shared world, never a visible object or its authored contact clock. */
export function anchoredRoadSpeed(previous: TraversalRouteRunState, next: TraversalRouteRunState,
  segment: TraversalRouteSegment, visualDistance: number, target: RoadContactAnchor | null,
  launchMultiplier: number, distanceScale = 1): number {
  const base = (previous.speed + next.speed) / 2 * launchMultiplier * distanceScale;
  if (!target || target.progress01 <= previous.progress01) return base;
  const remaining = target.distance - visualDistance;
  const forecast = forecastRouteDistance(previous, segment, target.progress01) * distanceScale;
  if (!Number.isFinite(remaining) || remaining <= 0 || forecast <= 0) return base;
  const ratio = remaining / forecast;
  // A malformed or incompatible presentation target cannot force a road jump.
  if (!Number.isFinite(ratio) || ratio < .5 || ratio > 2) return base;
  if (next.progress01 >= target.progress01) {
    const afterMs = next.elapsedMs - target.progress01 * segment.durationMs;
    const distance = remaining + Math.max(0, afterMs) * next.speed * distanceScale * .28;
    return distance / ((next.elapsedMs - previous.elapsedMs) * .28);
  }
  return (previous.speed + next.speed) / 2 * distanceScale * ratio;
}

/** Presentation-only world anchors. Once seen, an object cannot move with a new forecast. */
export class TraversalRoadAnchors {
  private readonly anchors = new Map<string, { distance: number; entered: boolean; exited: boolean; reforecast?: boolean }>();

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
    if (anchor.reforecast && !anchor.entered) {
      // A slowdown can shorten the forecast enough to put an unseen mark in the
      // middle of the road. Reintroduce it beyond the full right bound; the shared
      // camera reconciles its existing authored contact once it actually enters.
      const edgeDistance = ROAD_SPACE.referenceWidth * (.75 + (halfWidth + 8) / viewportWidth);
      anchor.distance = visualDistance + Math.max(forecastDistance(), edgeDistance);
      anchor.reforecast = false;
    }
    const x = viewportWidth * .25 + (anchor.distance - visualDistance) * viewportWidth / ROAD_SPACE.referenceWidth;
    const left = x - halfWidth, right = x + halfWidth;
    if (right >= 0 && left <= viewportWidth && !anchor.exited) anchor.entered = true;
    if (anchor.entered && right < 0) anchor.exited = true;
    return { x, left, right, visible: !anchor.exited && right >= 0 && left <= viewportWidth };
  }

  reforecastUnseen(): void {
    for (const anchor of this.anchors.values()) if (!anchor.entered) anchor.reforecast = true;
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
