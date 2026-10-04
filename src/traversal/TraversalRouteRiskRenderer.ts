import { TraversalRoadAnchors, roadVehicleHeight, setRoadGroundDepth, type RoadContactAnchor } from './TraversalRoadAnchor';
import type { TraversalRouteHazard, TraversalRouteRiskState } from './TraversalRouteRisk';
import { resolveRouteRiskVisual } from './TraversalRouteRiskVisual';

const IMPACT_MS = 520;

/** Risk obstacle presentation. Road coordinates follow TraversalRouteRenderer's visual distance. */
export class TraversalRouteRiskRenderer {
  readonly element = document.createElement('div');
  private readonly marks = new Map<string, HTMLElement>();
  private readonly anchors = new TraversalRoadAnchors();
  private vehicle: HTMLElement | null = null;
  private impactUntilMs = -1;
  private impactHazardId: string | null = null;

  constructor() {
    this.element.className = 'traversal-route-risk';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<span class="traversal-route-risk__impact"><i></i><i></i><i></i></span>';
  }

  bindVehicle(vehicle: HTMLElement): void { this.vehicle = vehicle; }

  reset(hazards: readonly TraversalRouteHazard[]): void {
    for (const mark of this.marks.values()) mark.remove();
    this.marks.clear();
    this.anchors.reset();
    this.clearImpact();
    for (const hazard of hazards) {
      const visual = resolveRouteRiskVisual(hazard);
      const mark = document.createElement('span');
      mark.className = `traversal-route-risk__hazard traversal-route-risk__hazard--${visual.kind}`;
      mark.dataset.riskHazard = hazard.id;
      mark.dataset.riskLane = String(hazard.lane);
      mark.dataset.riskProgress = String(hazard.progress01);
      mark.dataset.riskVisual = `${visual.kind}-${visual.variant}`;
      mark.innerHTML = `<span class="traversal-route-risk__warning"><i>!</i></span><img src="${visual.src}" alt="" draggable="false">`;
      mark.hidden = true;
      this.element.append(mark);
      this.marks.set(hazard.id, mark);
    }
  }

  impact(hazard: TraversalRouteHazard, elapsedMs: number): void {
    this.impactUntilMs = elapsedMs + IMPACT_MS;
    this.impactHazardId = hazard.id;
    const burst = this.element.querySelector<HTMLElement>('.traversal-route-risk__impact')!;
    burst.style.top = `${hazard.lane === 0 ? 65 : 81}%`;
    burst.classList.remove('is-active');
    this.vehicle?.classList.remove('traversal-vehicle--risk-impact');
    // A second contact during recovery can start a fresh, short impulse.
    void burst.offsetWidth;
    burst.classList.add('is-active');
    this.vehicle?.classList.add('traversal-vehicle--risk-impact');
  }

  /** Reforecast future marks still beyond the viewport after momentum changes. */
  reforecastUnseen(_visualDistance: number, _viewportWidth: number): void {
    this.anchors.reforecastUnseen();
  }

  nextContact(hazards: readonly TraversalRouteHazard[], progress01: number): RoadContactAnchor | null {
    const targets = hazards.flatMap(hazard => {
      const distance = this.anchors.enteredDistance(hazard.id);
      return hazard.progress01 > progress01 && distance !== null ? [{ id: `risk:${hazard.id}`, progress01: hazard.progress01, distance }] : [];
    });
    return targets.sort((a, b) => a.progress01 - b.progress01)[0] ?? null;
  }

  clearImpact(): void {
    this.impactUntilMs = -1;
    this.impactHazardId = null;
    this.element.querySelector('.traversal-route-risk__impact')?.classList.remove('is-active');
    this.vehicle?.classList.remove('traversal-vehicle--risk-impact');
  }

  update(hazards: readonly TraversalRouteHazard[], state: TraversalRouteRiskState,
    progress01: number, elapsedMs: number, durationMs: number, visualDistance: number,
    viewportWidth: number, activeDriving: boolean,
    forecastDistance: (contactProgress01: number) => number, viewportHeight = 823): void {
    this.element.hidden = !activeDriving;
    if (elapsedMs >= this.impactUntilMs) this.clearImpact();
    if (!activeDriving) {
      for (const mark of this.marks.values()) mark.hidden = true;
      return;
    }
    const resolved = new Set(state.resolvedHazardIds);
    for (const hazard of hazards) {
      const mark = this.marks.get(hazard.id);
      if (!mark) continue;
      const halfWidth = roadVehicleHeight(viewportWidth, viewportHeight) * (viewportWidth <= 700 ? 1.26 : .98) / 2;
      const anchor = this.anchors.update(hazard.id, visualDistance, viewportWidth, halfWidth,
        () => forecastDistance(hazard.progress01));
      mark.style.left = `${anchor.x}px`;
      mark.style.top = `${hazard.lane === 0 ? 65 : 81}%`;
      setRoadGroundDepth(mark, viewportHeight * (hazard.lane === 0 ? .65 : .81));
      mark.dataset.roadLeft = String(anchor.left);
      mark.dataset.roadRight = String(anchor.right);
      mark.dataset.warning = String(anchor.x > viewportWidth * .92 && !resolved.has(hazard.id));
      mark.dataset.contact = String(resolved.has(hazard.id));
      mark.hidden = !anchor.visible;
    }
  }
}
