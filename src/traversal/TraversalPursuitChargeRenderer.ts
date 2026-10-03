import type { TraversalPursuitCharge } from './TraversalPursuitCharge';
import { ROAD_SPACE } from './TraversalRoadSpace';
import { TRAVERSAL_PURSUER_IMAGE } from './TraversalRoutePursuitRenderer';
import { prefersReducedMotion } from '../ui/ReducedMotion';

/** Unwired presentation candidate. The model supplies all motion and terminal state.
 * This actor is a sibling of the caravan, so physical lane depth determines stacking.
 * Reduced motion retains logical charge/contact/exit boundaries with a stationary fade.
 */
export class TraversalPursuitChargeRenderer {
  readonly element = document.createElement('div');
  private readonly image = document.createElement('img');
  private disposed = false;

  constructor() {
    this.element.className = 'traversal-pursuit-charge';
    this.element.setAttribute('aria-hidden', 'true');
    this.image.src = TRAVERSAL_PURSUER_IMAGE;
    this.image.alt = '';
    this.image.draggable = false;
    this.element.append(this.image);
    this.element.hidden = true;
    this.image.addEventListener('error', () => { this.element.dataset.assetFailed = 'true'; });
  }

  update(state: TraversalPursuitCharge, viewportWidth: number, vehicleHeight: number,
    active: boolean, reducedMotion = false): void {
    if (this.disposed) return;
    if (!Number.isFinite(viewportWidth) || viewportWidth <= 0
      || !Number.isFinite(vehicleHeight) || vehicleHeight <= 0) {
      throw new Error('Invalid Pursuit renderer geometry.');
    }
    const reduced = prefersReducedMotion(reducedMotion);
    this.element.hidden = state.phase === 'EXITED';
    this.element.dataset.phase = state.phase;
    this.element.dataset.lane = String(state.lane);
    this.element.dataset.window = state.windowId;
    this.element.dataset.reducedMotion = String(reduced);
    this.element.dataset.active = String(active && state.phase === 'CHARGING');
    this.element.style.width = `${vehicleHeight}px`;
    this.element.style.height = `${vehicleHeight * .48}px`;
    this.element.style.top = `${state.lane === 0 ? 65 : 81}%`;
    this.element.style.zIndex = state.lane === 0 ? '21' : '23';
    this.element.style.left = `${reduced ? viewportWidth * .06 : state.left * viewportWidth / ROAD_SPACE.referenceWidth}px`;
    this.element.style.opacity = reduced && state.phase === 'CHARGING'
      ? String(Math.max(0, 1 - state.elapsedSeconds / .6)) : '1';
  }

  dispose(): void { this.disposed = true; this.element.remove(); }
}
