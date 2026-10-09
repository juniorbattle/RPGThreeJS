import type { TraversalPursuitCharge } from './TraversalPursuitCharge';
import { ROAD_SPACE } from './TraversalRoadSpace';
import { TraversalPursuerSprite } from './TraversalPursuerSprite';
import { prefersReducedMotion } from '../ui/ReducedMotion';
import { setRoadGroundDepth } from './TraversalRoadAnchor';

/** The model supplies all motion and terminal state.
 * This actor is a sibling of the caravan, so physical lane depth determines stacking.
 * Reduced motion keeps a stationary threat visible through charge/contact until exit.
 */
export class TraversalPursuitChargeRenderer {
  readonly element = document.createElement('div');
  private readonly sprite = new TraversalPursuerSprite();
  private disposed = false;

  constructor() {
    this.element.className = 'traversal-pursuit-charge';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.append(this.sprite.element);
    this.element.hidden = true;
  }

  update(state: TraversalPursuitCharge, viewportWidth: number, vehicleHeight: number,
    active: boolean, reducedMotion = false, viewportHeight?: number): void {
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
    this.sprite.update(state.elapsedSeconds * 1000, active && state.phase === 'CHARGING', reduced);
    this.element.style.width = `${vehicleHeight}px`;
    this.element.style.height = `${vehicleHeight * .48}px`;
    this.element.style.top = `${state.lane === 0 ? 65 : 81}%`;
    if (viewportHeight !== undefined) setRoadGroundDepth(this.element, viewportHeight * (state.lane === 0 ? .65 : .81));
    else this.element.style.zIndex = state.lane === 0 ? '21' : '23';
    this.element.style.left = `${reduced ? viewportWidth * .06 : state.left * viewportWidth / ROAD_SPACE.referenceWidth}px`;
    // A missed charge can last beyond .6s. Do not erase its lane cue before it exits,
    // or flash it back into view when contact freezes the model.
    this.element.style.opacity = '1';
  }

  reset(): void { this.element.hidden = true; }

  dispose(): void { this.disposed = true; this.sprite.dispose(); this.element.remove(); }
}
