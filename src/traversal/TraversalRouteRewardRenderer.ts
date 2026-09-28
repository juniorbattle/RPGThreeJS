import { ROAD_SPACE } from './TraversalRoadSpace';
import type { TraversalRoutePickup, TraversalRouteRewardState } from './TraversalRouteReward';

const APPROACH_MS = 2400;
const COLLECTION_MS = 450;
export const ROUTE_REWARD_POUCH = '/assets/generated/lion-phase/traversal/t0/reward/coin-pouch.png';

/** Route Reward art and local collection feedback. Uses the route's visual road distance. */
export class TraversalRouteRewardRenderer {
  readonly element = document.createElement('div');
  private readonly marks = new Map<string, HTMLElement>();
  private readonly contactDistances = new Map<string, number>();
  private feedbackUntilMs = -1;

  constructor() {
    this.element.className = 'traversal-route-reward';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<span class="traversal-route-reward__pulse"></span><span class="traversal-route-reward__feedback">+5 route</span>';
  }

  reset(pickups: readonly TraversalRoutePickup[]): void {
    for (const mark of this.marks.values()) mark.remove();
    this.marks.clear();
    this.contactDistances.clear();
    this.feedbackUntilMs = -1;
    this.element.querySelector('.traversal-route-reward__pulse')?.classList.remove('is-active');
    this.element.querySelector('.traversal-route-reward__feedback')?.classList.remove('is-active');
    for (const pickup of pickups) {
      const mark = document.createElement('span');
      mark.className = 'traversal-route-reward__pickup';
      mark.dataset.rewardPickup = pickup.id;
      mark.dataset.rewardLane = String(pickup.lane);
      mark.dataset.rewardProgress = String(pickup.progress01);
      mark.innerHTML = `<img src="${ROUTE_REWARD_POUCH}" alt="" draggable="false">`;
      mark.hidden = true;
      this.element.append(mark);
      this.marks.set(pickup.id, mark);
    }
  }

  collect(pickup: TraversalRoutePickup, elapsedMs: number): void {
    this.marks.get(pickup.id)?.setAttribute('hidden', '');
    this.feedbackUntilMs = elapsedMs + COLLECTION_MS;
    const pulse = this.element.querySelector<HTMLElement>('.traversal-route-reward__pulse')!;
    pulse.style.top = `${pickup.lane === 0 ? 65 : 81}%`;
    pulse.classList.remove('is-active');
    void pulse.offsetWidth;
    pulse.classList.add('is-active');
    const feedback = this.element.querySelector<HTMLElement>('.traversal-route-reward__feedback')!;
    feedback.style.top = `${pickup.lane === 0 ? 65 : 81}%`;
    feedback.textContent = `+${pickup.gold} route`;
    feedback.classList.remove('is-active');
    void feedback.offsetWidth;
    feedback.classList.add('is-active');
  }

  reforecastUnseen(visualDistance: number, viewportWidth: number): void {
    for (const [id, contactDistance] of this.contactDistances) {
      const screenX = viewportWidth * .25 + (contactDistance - visualDistance)
        * viewportWidth / ROAD_SPACE.referenceWidth;
      if (screenX > viewportWidth + 28) this.contactDistances.delete(id);
    }
  }

  update(pickups: readonly TraversalRoutePickup[], state: TraversalRouteRewardState,
    progress01: number, elapsedMs: number, durationMs: number, visualDistance: number,
    viewportWidth: number, activeDriving: boolean,
    forecastDistance: (contactProgress01: number) => number): void {
    this.element.hidden = !activeDriving;
    if (elapsedMs >= this.feedbackUntilMs) {
      this.element.querySelector('.traversal-route-reward__pulse')?.classList.remove('is-active');
      this.element.querySelector('.traversal-route-reward__feedback')?.classList.remove('is-active');
    }
    if (!activeDriving) {
      for (const mark of this.marks.values()) mark.hidden = true;
      return;
    }
    const resolved = new Set(state.resolvedPickupIds);
    for (const pickup of pickups) {
      const mark = this.marks.get(pickup.id);
      if (!mark) continue;
      const remainingMs = (pickup.progress01 - progress01) * durationMs;
      if (resolved.has(pickup.id) || remainingMs < 0 || remainingMs > APPROACH_MS) {
        mark.hidden = true;
        continue;
      }
      if (!this.contactDistances.has(pickup.id)) {
        this.contactDistances.set(pickup.id, visualDistance + forecastDistance(pickup.progress01));
      }
      const screenX = viewportWidth * .25 + (this.contactDistances.get(pickup.id)! - visualDistance)
        * viewportWidth / ROAD_SPACE.referenceWidth;
      mark.style.left = `${screenX}px`;
      mark.style.top = `${pickup.lane === 0 ? 65 : 81}%`;
      mark.hidden = false;
    }
  }
}
