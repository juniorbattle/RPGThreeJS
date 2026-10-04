import { ROAD_SPACE } from './TraversalRoadSpace';
import { advanceRouteRun, createRouteRun, forecastRouteDistance, type TraversalRouteRunState, type TraversalRouteSegment } from './TraversalRouteRun';

export interface RoadContactAnchor { readonly id: string; readonly progress01: number; readonly distance: number }

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

/** Retain a validated camera forecast when a late native reset cannot stop a seen road in time. */
export class TraversalRoadCamera {
  private plan: { segment: TraversalRouteSegment; target: RoadContactAnchor; scale: number;
    referenceReset: number; observedReset: number; resetObserved: boolean; elapsed: number; distance: number } | null = null;

  reset(): void { this.plan = null; }

  speed(previous: TraversalRouteRunState, next: TraversalRouteRunState,
    segment: TraversalRouteSegment, distance: number, target: RoadContactAnchor | null,
    launchMultiplier: number, scale = 1): number {
    const base = anchoredRoadSpeed(previous, next, segment, distance, null, launchMultiplier, scale);
    const limit = 2 * segment.vMax * scale;
    const valid = (state: TraversalRouteRunState): boolean => {
      if (!target || !target.id || !Number.isFinite(target.progress01) || target.progress01 > 1
        || target.progress01 <= previous.progress01 || !Number.isFinite(distance)) return false;
      const remaining = target.distance - distance;
      const forecast = forecastRouteDistance(state, segment, target.progress01) * scale;
      const ratio = remaining / forecast;
      return Number.isFinite(ratio) && remaining > 0 && forecast > 0 && ratio >= .5 && ratio <= 2;
    };
    const cached = this.plan;
    if (!target || launchMultiplier !== 1 || next.elapsedMs <= previous.elapsedMs
      || !Number.isFinite(scale) || scale <= 0 || previous.speedResetAtMs > previous.elapsedMs) { this.reset(); return base; }
    if (cached && (previous.elapsedMs < cached.elapsed || distance < cached.distance - 1e-8)) {
      this.reset(); return base;
    }
    if (cached && (cached.segment !== segment || cached.target.id !== target.id
      || cached.target.distance !== target.distance || cached.target.progress01 !== target.progress01
      || cached.scale !== scale || previous.elapsedMs < cached.elapsed || distance < cached.distance)) this.reset();
    const plan = this.plan;
    const resetObserved = Boolean(plan && (plan.resetObserved || previous.speedResetAtMs > plan.observedReset));
    if (valid(previous)) {
      const speed = anchoredRoadSpeed(previous, next, segment, distance, target, launchMultiplier, scale);
      if (Number.isFinite(speed) && speed > 0 && speed <= limit) {
        this.plan = next.progress01 >= target.progress01 ? null : {
          // Keep the pre-reset reference even if the shortened forecast is still
          // inside the guard now: it can cross that guard just before contact.
          segment, target: { ...target }, scale,
          referenceReset: resetObserved ? plan!.referenceReset : previous.speedResetAtMs,
          observedReset: previous.speedResetAtMs, resetObserved, elapsed: next.elapsedMs,
          distance: distance + speed * (next.elapsedMs - previous.elapsedMs) * .28 };
        return speed;
      }
    }
    if (!plan || !resetObserved) {
      this.reset(); return base;
    }
    // This reconstructed state is used only for the previously accepted camera
    // forecast. The native RouteRun and its resolution/recovery remain untouched.
    const reference = advanceRouteRun({ ...createRouteRun(segment, previous.segmentIndex, previous.lane),
      speedResetAtMs: plan.referenceReset }, segment, previous.elapsedMs);
    if (!valid(reference)) { this.reset(); return base; }
    const contactMs = target.progress01 * segment.durationMs;
    const beforeMs = Math.min(next.elapsedMs, contactMs) - previous.elapsedMs;
    const referenceNext = advanceRouteRun(reference, segment, beforeMs);
    const beforeSpeed = anchoredRoadSpeed(reference, referenceNext, segment, distance, target, 1, scale);
    const afterMs = Math.max(0, next.elapsedMs - contactMs);
    const actualContact = advanceRouteRun(previous, segment, beforeMs);
    const afterSpeed = (actualContact.speed + next.speed) / 2 * scale;
    const speed = (beforeSpeed * beforeMs + afterSpeed * afterMs) / (next.elapsedMs - previous.elapsedMs);
    if (!Number.isFinite(beforeSpeed) || beforeSpeed <= 0 || beforeSpeed > limit
      || !Number.isFinite(speed) || speed <= 0 || speed > limit) { this.reset(); return base; }
    this.plan = afterMs > 0 || next.elapsedMs >= contactMs ? null : {
      ...plan, resetObserved: true, observedReset: previous.speedResetAtMs, elapsed: next.elapsedMs,
      distance: distance + speed * (next.elapsedMs - previous.elapsedMs) * .28 };
    return speed;
  }
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
