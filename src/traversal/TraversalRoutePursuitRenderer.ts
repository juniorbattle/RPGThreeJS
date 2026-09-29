import type { TraversalLane } from './TraversalRunRuntime';
import type { TraversalRoutePursuitState, TraversalRoutePursuitWindow } from './TraversalRoutePursuit';
import { pursuerLaneAt } from './TraversalRoutePursuit';

const FEEDBACK_MS = 650;
export const TRAVERSAL_PURSUER_IMAGE = '/assets/generated/lion-phase/traversal/t0/pursuit/shadow-pursuer.png';

/** T0 pursuer art in screen space, behind the caravan. No world distance or campaign ownership. */
export class TraversalRoutePursuitRenderer {
  readonly element = document.createElement('div');
  private readonly proxy = document.createElement('span');
  private readonly feedback = document.createElement('span');
  private feedbackUntilMs = -1;
  private feedbackKind: 'caught' | 'escaped' | null = null;
  private feedbackLane: TraversalLane = 0;
  private feedbackPressure = 0;

  constructor() {
    this.element.className = 'traversal-route-pursuit';
    this.element.setAttribute('aria-hidden', 'true');
    this.proxy.className = 'traversal-route-pursuit__proxy';
    const image = document.createElement('img');
    image.className = 'traversal-route-pursuit__image';
    image.src = TRAVERSAL_PURSUER_IMAGE;
    image.alt = '';
    image.draggable = false;
    this.proxy.append(image);
    this.proxy.hidden = true;
    this.feedback.className = 'traversal-route-pursuit__feedback';
    this.feedback.hidden = true;
    this.element.append(this.proxy, this.feedback);
  }

  reset(): void {
    this.feedbackUntilMs = -1;
    this.feedbackKind = null;
    this.proxy.hidden = true;
    this.feedback.hidden = true;
    delete this.proxy.dataset.pursuitActive;
    delete this.proxy.dataset.pursuitLane;
    this.proxy.classList.remove('is-caught', 'is-escaped');
  }

  caught(lane: TraversalLane, elapsedMs: number): void {
    this.feedbackKind = 'caught';
    this.feedbackLane = lane;
    this.feedbackPressure = 1;
    this.feedbackUntilMs = elapsedMs + FEEDBACK_MS;
    this.proxy.classList.remove('is-escaped');
    this.proxy.classList.add('is-caught');
    this.feedback.textContent = 'CAUGHT';
    this.feedback.className = 'traversal-route-pursuit__feedback is-caught';
    this.feedback.hidden = false;
  }

  escaped(lane: TraversalLane, pressure01: number, elapsedMs: number): void {
    this.feedbackKind = 'escaped';
    this.feedbackLane = lane;
    this.feedbackPressure = pressure01;
    this.feedbackUntilMs = elapsedMs + FEEDBACK_MS;
    this.proxy.classList.remove('is-caught');
    this.proxy.classList.add('is-escaped');
    this.feedback.textContent = 'ESCAPED';
    this.feedback.className = 'traversal-route-pursuit__feedback is-escaped';
    this.feedback.hidden = false;
  }

  update(window: TraversalRoutePursuitWindow | undefined, state: TraversalRoutePursuitState,
    progress01: number, elapsedMs: number, viewportWidth: number, vehicleHeight: number,
    activeDriving: boolean): void {
    const active = activeDriving && !!window && state.activeWindowId === window.id;
    const feedbackActive = activeDriving && !!this.feedbackKind && elapsedMs < this.feedbackUntilMs;
    if (!active && !feedbackActive) {
      this.proxy.hidden = true;
      this.feedback.hidden = true;
      delete this.proxy.dataset.pursuitActive;
      delete this.proxy.dataset.pursuitLane;
      if (elapsedMs >= this.feedbackUntilMs) this.feedbackKind = null;
      return;
    }
    const lane = active ? pursuerLaneAt(window!, progress01) : this.feedbackLane;
    const pressure = active ? state.pressure01 : this.feedbackPressure;
    // The caravan is centered at 25vw. Its left edge meets the wider art at pressure 1.
    const contactX = viewportWidth * .25 - vehicleHeight * 1.32;
    const offscreenX = -vehicleHeight * .1;
    const rawX = offscreenX + (contactX - offscreenX) * Math.sqrt(pressure);
    // Narrow screens leave little rear road because the caravan remains at 25vw.
    // Keep the silhouette legible there while retaining pressure-driven approach.
    const mobileX = 23 + 27 * Math.sqrt(pressure);
    const x = viewportWidth <= 700 ? Math.max(rawX, mobileX) : rawX;
    this.proxy.style.left = `${x}px`;
    this.proxy.style.top = `${lane === 0 ? 65 : 81}%`;
    this.proxy.dataset.pursuitLane = String(lane);
    if (active) this.proxy.dataset.pursuitActive = window!.id;
    else delete this.proxy.dataset.pursuitActive;
    this.proxy.hidden = false;
    this.feedback.style.left = `${Math.max(viewportWidth <= 700 ? 35 : 58, x)}px`;
    this.feedback.style.top = `${lane === 0 ? 65 : 81}%`;
    this.feedback.hidden = !feedbackActive;
  }
}
