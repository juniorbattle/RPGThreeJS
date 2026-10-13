/** Isolated native-clock candidate lab. No GameApp, run, save or combat owner is instantiated. */
import '../../src/styles/traversal.css';
import '../../src/styles/traversal-pursuit-charge.css';
import { TraversalPursuitChargeRenderer } from '../../src/traversal/TraversalPursuitChargeRenderer';
import { createPursuitCharge, advancePursuitCharge, type TraversalChargeGeometry,
  type TraversalChargeObservation } from '../../src/traversal/TraversalPursuitCharge';
import { buildTraversalCaravan } from '../../src/traversal/TraversalCaravan';
import { TraversalWorldRenderer } from '../../src/traversal/TraversalWorldRenderer';
import { TRAVERSAL_T0_WORLD_PRESENTATION } from '../../src/traversal/TraversalT0World';
import { ROAD_SPACE } from '../../src/traversal/TraversalRoadSpace';
import { pursuerLaneAt } from '../../src/traversal/TraversalRoutePursuit';
import { T0_ROAD_AUTHORING } from '../../src/traversal/TraversalT0Authoring';
import { T1_ROAD_AUTHORING } from '../../src/traversal/TraversalT1Authoring';
import { createT3RoadAuthoring } from '../../src/traversal/TraversalT3Authoring';

const params = new URLSearchParams(location.search);
const leg = params.get('leg') ?? 'T0';
const authoring = leg === 'T1' ? T1_ROAD_AUTHORING : leg === 'T3'
  ? createT3RoadAuthoring(() => { throw new Error('Isolated charge lab cannot read campaign state'); }) : T0_ROAD_AUTHORING;
const windowDefinition = authoring.pursuitWindow(params.get('segment') ?? (leg === 'T0' ? 'route-3' : `${leg.toLowerCase()}-route-4a`))!;
if (!windowDefinition) throw new Error('Missing authored window');
const lane = pursuerLaneAt(windowDefinition, windowDefinition.endProgress01);
const gameReduced = params.get('motion') === 'game';
document.body.innerHTML = `<main class="traversal-t0" data-view="route" data-phase="RUNNING">
  <div class="traversal-world"></div><figure class="traversal-vehicle"></figure>
  <div style="position:absolute;z-index:50;top:10px;left:10px;max-width:calc(100% - 20px)">
  <nav style="display:flex;gap:6px;flex-wrap:wrap">
  <button id="miss">Raté isolé</button><button id="contact">Contact isolé</button>
  <button id="lane">Changer de voie</button><button id="pause">Pause</button><button id="dispose">Retirer</button></nav>
  <p id="status" role="status" aria-live="polite" style="background:#081b27;padding:8px;margin:10px 0 0;box-sizing:border-box;overflow-wrap:anywhere">Charge isolée prête</p></div>
  <script id="proof" type="application/json"></script></main>`;
const root = document.querySelector<HTMLElement>('main')!;
const vehicle = root.querySelector<HTMLElement>('figure')!;
vehicle.style.setProperty('transition', 'none', 'important');
buildTraversalCaravan(vehicle);
const world = new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);
root.querySelector('.traversal-world')!.append(world.routeElement);
const renderer = new TraversalPursuitChargeRenderer();
root.append(renderer.element);
const status = document.querySelector<HTMLElement>('#status')!;
const proof = document.querySelector('#proof')!;
for (const button of root.querySelectorAll('button')) button.style.cssText = 'min-width:44px;min-height:44px;background:#142c40;color:#fff1d1;border:2px solid #c3a56a;border-radius:4px';
const style = document.createElement('style');
style.textContent = 'button:focus-visible{outline:3px solid #fff1ab;outline-offset:2px}';
root.append(style);
let state = createPursuitCharge({ windowId: windowDefinition.id, lane, left: 0, speed: 180, acceleration: 950 });
let caravanLane: 0 | 1 = lane === 0 ? 1 : 0;
let started = false, paused = false, disposed = false, previous = performance.now();
let geometry: TraversalChargeGeometry;
let observations: TraversalChargeObservation[] = [];
let samples: object[] = [];
function measure(): void {
  vehicle.style.setProperty('--traversal-lane-y', `${caravanLane === 0 ? 65 : 81}%`);
  const bounds = vehicle.getBoundingClientRect(), scale = ROAD_SPACE.referenceWidth / innerWidth;
  geometry = { caravanLane, caravanLeft: bounds.left * scale, caravanRight: bounds.right * scale,
    pursuerWidth: bounds.height * scale, viewportRight: ROAD_SPACE.referenceWidth };
  world.updateRoute(0, innerWidth);
}
function advance(now: number): void {
  if (now <= previous) return;
  if (started && !paused && !document.hidden && !disposed) {
    const next = advancePursuitCharge(state, (now - previous) / 1000, geometry);
    state = next.state; observations.push(...next.observations);
    if (next.observations.length) status.textContent = state.phase === 'EXITED'
      ? 'Raté isolé : sortie complète' : 'Contact isolé : mapping canonique manquant';
  }
  previous = now;
}
function render(): void {
  const bounds = vehicle.getBoundingClientRect();
  renderer.update(state, innerWidth, bounds.height, started && !paused && !document.hidden, gameReduced);
  const sprite = renderer.element.getBoundingClientRect();
  if (started && samples.length < 500) samples.push({ time: state.elapsedSeconds, left: state.left,
    speed: state.speed, phase: state.phase, lane: state.lane, caravanLane, width: innerWidth,
    spriteLeft: sprite.left, spriteRight: sprite.right, spriteBottom: sprite.bottom,
    vehicleBottom: bounds.bottom, active: renderer.element.dataset.active, hidden: renderer.element.hidden,
    animation: getComputedStyle(renderer.element.querySelector('img')!).animationName });
  proof.textContent = JSON.stringify({ state, geometry, observations, samples, paused, disposed,
    reduced: renderer.element.dataset.reducedMotion, started, window: windowDefinition.id,
    noOwnersInstantiated: true });
}
function restart(contact: boolean): void {
  if (disposed) return;
  caravanLane = contact ? lane : lane === 0 ? 1 : 0;
  observations = []; samples = []; paused = false; started = true; previous = performance.now();
  status.textContent = `Charge isolée — voie ${lane + 1}`;
  measure();
  state = createPursuitCharge({ windowId: windowDefinition.id, lane, left: -geometry.pursuerWidth,
    speed: 180, acceleration: 950 });
  render();
}
document.querySelector('#miss')!.addEventListener('click', () => restart(false));
document.querySelector('#contact')!.addEventListener('click', () => restart(true));
document.querySelector('#lane')!.addEventListener('click', () => {
  advance(performance.now()); caravanLane = caravanLane === 0 ? 1 : 0; measure(); render();
});
document.querySelector('#pause')!.addEventListener('click', () => { advance(performance.now()); paused = !paused; render(); });
document.querySelector('#dispose')!.addEventListener('click', () => { advance(performance.now()); disposed = true; renderer.dispose(); render(); });
addEventListener('resize', () => { advance(performance.now()); measure(); render(); });
document.addEventListener('visibilitychange', () => { previous = performance.now(); });
measure(); render();
function frame(now: number): void { advance(now); render(); if (!disposed) requestAnimationFrame(frame); }
requestAnimationFrame(frame);
