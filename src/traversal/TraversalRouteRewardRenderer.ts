import { TraversalRoadAnchors, setRoadGroundDepth, type RoadContactAnchor } from './TraversalRoadAnchor';
import type { TraversalRoutePickup, TraversalRouteRewardState } from './TraversalRouteReward';

const COLLECTION_MS = 450;
export const ROUTE_REWARD_POUCH = '/assets/generated/lion-phase/traversal/t0/reward/coin-pouch.png';

/** Route Reward art and local collection feedback. Uses the route's visual road distance. */
export class TraversalRouteRewardRenderer {
  readonly element = document.createElement('div');
  private readonly marks = new Map<string, HTMLElement>();
  private readonly anchors = new TraversalRoadAnchors();
  private feedbackUntilMs = -1;

  constructor() {
    this.element.className = 'traversal-route-reward';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<span class="traversal-route-reward__pulse"></span><span class="traversal-route-reward__feedback">+5 route</span>';
  }

  reset(pickups: readonly TraversalRoutePickup[]): void {
    for (const mark of this.marks.values()) mark.remove();
    this.marks.clear();
    this.anchors.reset();
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
    const mark = this.marks.get(pickup.id);
    if (mark) mark.dataset.collected = 'true';
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

  reforecastUnseen(_visualDistance: number, _viewportWidth: number): void {
    this.anchors.reforecastUnseen();
  }

  nextContact(pickups: readonly TraversalRoutePickup[], progress01: number): RoadContactAnchor | null {
    const targets = pickups.flatMap(pickup => {
      const distance = this.anchors.enteredDistance(pickup.id);
      return pickup.progress01 > progress01 && distance !== null ? [{ id: `reward:${pickup.id}`, progress01: pickup.progress01, distance }] : [];
    });
    return targets.sort((a, b) => a.progress01 - b.progress01)[0] ?? null;
  }

  update(pickups: readonly TraversalRoutePickup[], state: TraversalRouteRewardState,
    progress01: number, elapsedMs: number, durationMs: number, visualDistance: number,
    viewportWidth: number, activeDriving: boolean,
    forecastDistance: (contactProgress01: number) => number, viewportHeight = 823): void {
    this.element.hidden = !activeDriving;
    if (elapsedMs >= this.feedbackUntilMs) {
      this.element.querySelector('.traversal-route-reward__pulse')?.classList.remove('is-active');
      this.element.querySelector('.traversal-route-reward__feedback')?.classList.remove('is-active');
    }
    if (!activeDriving) {
      for (const mark of this.marks.values()) mark.hidden = true;
      return;
    }
    const collected = new Set(state.collectedPickupIds);
    for (const pickup of pickups) {
      const mark = this.marks.get(pickup.id);
      if (!mark) continue;
      const halfWidth = Math.min(72, Math.max(48, viewportWidth * .05)) / 2;
      const anchor = this.anchors.update(pickup.id, visualDistance, viewportWidth, halfWidth,
        () => forecastDistance(pickup.progress01));
      mark.style.left = `${anchor.x}px`;
      mark.style.top = `${pickup.lane === 0 ? 65 : 81}%`;
      setRoadGroundDepth(mark, viewportHeight * (pickup.lane === 0 ? .65 : .81));
      mark.dataset.roadLeft = String(anchor.left);
      mark.dataset.roadRight = String(anchor.right);
      mark.dataset.collected = String(collected.has(pickup.id));
      mark.hidden = !anchor.visible;
    }
  }
}
