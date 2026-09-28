import { ROAD_SPACE } from './TraversalRoadSpace';
import type { TraversalRouteHazard, TraversalRouteRiskState } from './TraversalRouteRisk';

const TELEGRAPH_MS = 2800;
const IMPACT_MS = 520;

/** DEV risk marks only. Road coordinates follow TraversalRouteRenderer's visual distance. */
export class TraversalRouteRiskRenderer {
  readonly element = document.createElement('div');
  private readonly marks = new Map<string, HTMLElement>();
  private readonly contactDistances = new Map<string, number>();
  private vehicle: HTMLElement | null = null;
  private impactUntilMs = -1;

  constructor() {
    this.element.className = 'traversal-route-risk';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<span class="traversal-route-risk__impact"><i></i><i></i><i></i></span>';
  }

  bindVehicle(vehicle: HTMLElement): void { this.vehicle = vehicle; }

  reset(hazards: readonly TraversalRouteHazard[]): void {
    for (const mark of this.marks.values()) mark.remove();
    this.marks.clear();
    this.contactDistances.clear();
    this.clearImpact();
    for (const hazard of hazards) {
      const mark = document.createElement('span');
      mark.className = `traversal-route-risk__hazard traversal-route-risk__hazard--${hazard.kind}`;
      mark.dataset.riskHazard = hazard.id;
      mark.dataset.riskLane = String(hazard.lane);
      mark.dataset.riskProgress = String(hazard.progress01);
      mark.innerHTML = '<span class="traversal-route-risk__warning">!</span><span class="traversal-route-risk__bar">DEV</span>';
      mark.hidden = true;
      this.element.append(mark);
      this.marks.set(hazard.id, mark);
    }
  }

  impact(hazard: TraversalRouteHazard, elapsedMs: number): void {
    this.impactUntilMs = elapsedMs + IMPACT_MS;
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
  reforecastUnseen(visualDistance: number, viewportWidth: number): void {
    for (const [id, contactDistance] of this.contactDistances) {
      const screenX = viewportWidth * .25 + (contactDistance - visualDistance)
        * viewportWidth / ROAD_SPACE.referenceWidth;
      if (screenX > viewportWidth + 28) this.contactDistances.delete(id);
    }
  }

  clearImpact(): void {
    this.impactUntilMs = -1;
    this.element.querySelector('.traversal-route-risk__impact')?.classList.remove('is-active');
    this.vehicle?.classList.remove('traversal-vehicle--risk-impact');
  }

  update(hazards: readonly TraversalRouteHazard[], state: TraversalRouteRiskState,
    progress01: number, elapsedMs: number, durationMs: number, visualDistance: number,
    viewportWidth: number, activeDriving: boolean,
    forecastDistance: (contactProgress01: number) => number): void {
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
      const remainingMs = (hazard.progress01 - progress01) * durationMs;
      if (resolved.has(hazard.id) || remainingMs < 0 || remainingMs > TELEGRAPH_MS) {
        mark.hidden = true;
        continue;
      }
      if (!this.contactDistances.has(hazard.id)) {
        this.contactDistances.set(hazard.id, visualDistance + forecastDistance(hazard.progress01));
      }
      const contactDistance = this.contactDistances.get(hazard.id)!;
      const screenX = viewportWidth * .25 + (contactDistance - visualDistance)
        * viewportWidth / ROAD_SPACE.referenceWidth;
      mark.style.left = `${screenX}px`;
      mark.style.top = `${hazard.lane === 0 ? 65 : 81}%`;
      mark.style.setProperty('--telegraph-shift', `${Math.max(0, screenX - (viewportWidth - 28))}px`);
      mark.dataset.telegraph = String(screenX > viewportWidth - 28);
      mark.hidden = false;
    }
  }
}
