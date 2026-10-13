/** Isolated scripted reset with native RAF; no GameApp, campaign, save or combat owner. */
import '../../src/styles/traversal.css';
import { T0_ROAD_AUTHORING } from '../../src/traversal/TraversalT0Authoring';
import { TraversalRoadCamera, setRoadGroundDepth } from '../../src/traversal/TraversalRoadAnchor';
import { TraversalRouteRiskRenderer } from '../../src/traversal/TraversalRouteRiskRenderer';
import { TraversalRouteRenderer } from '../../src/traversal/TraversalRouteRenderer';
import { TraversalWorldRenderer } from '../../src/traversal/TraversalWorldRenderer';
import { TRAVERSAL_T0_WORLD_PRESENTATION } from '../../src/traversal/TraversalT0World';
import { buildTraversalCaravan } from '../../src/traversal/TraversalCaravan';
import { createRouteRun, advanceRouteRun, forecastRouteDistance, resetRouteSpeed } from '../../src/traversal/TraversalRouteRun';
import { createRouteRisk, resolveRouteRisk } from '../../src/traversal/TraversalRouteRisk';
import { prefersReducedMotion } from '../../src/ui/ReducedMotion';

const segment = T0_ROAD_AUTHORING.resolveSegment(4, 'lion-first-trial-combat');
const hazard = T0_ROAD_AUTHORING.hazards(segment.id).find(h => h.progress01 === .68)!;
if (!hazard) throw Error('Expected existing .68 branch rock');
const resetMs = 10082.9, scale = 1.686;
document.body.innerHTML = '<main class="traversal-t0" data-view="route" data-phase="RUNNING"><figure class="traversal-vehicle"></figure><button id="start" style="position:absolute;z-index:50000;min-width:44px;min-height:44px">Démarrer</button><script id="proof" type="application/json"></script></main>';
const root = document.querySelector<HTMLElement>('main')!, vehicle = root.querySelector<HTMLElement>('figure')!;
const proof = root.querySelector('#proof')!;
buildTraversalCaravan(vehicle);
vehicle.style.transition = 'none'; vehicle.style.setProperty('--traversal-lane-y', '81%');
const game = new URLSearchParams(location.search).get('motion') === 'game';
root.dataset.reducedMotion = String(prefersReducedMotion(game));
if (game) { const style = document.createElement('style'); style.textContent = '.traversal-t0 *{animation:none!important;transition:none!important}'; root.append(style); }
const camera = new TraversalRoadCamera(), road = new TraversalRouteRenderer();
const risk = new TraversalRouteRiskRenderer(), world = new TraversalWorldRenderer(TRAVERSAL_T0_WORLD_PRESENTATION);
risk.reset([hazard]); root.append(world.routeElement, road.element, risk.element);
let run = advanceRouteRun(createRouteRun(segment, 4, hazard.lane), segment, 9966.1);
let riskState = createRouteRisk(segment.id), resetDone = false, started = false, previous = performance.now(), visualSpeed = 0;
const samples: object[] = [];
function render(): void {
  world.updateRoute(road.distance, innerWidth);
  setRoadGroundDepth(vehicle, innerHeight * .81);
  risk.update([hazard], riskState, run.progress01, run.elapsedMs, segment.durationMs,
    road.distance, innerWidth, true, p => forecastRouteDistance(run, segment, p) * scale, innerHeight);
  const mark = root.querySelector<HTMLElement>('[data-risk-hazard]')!, bounds = mark.getBoundingClientRect();
  const state = { elapsed: run.elapsedMs, reset: run.speedResetAtMs, speed: run.speed,
    distance: road.distance, visualSpeed, x: (Number(mark.dataset.roadLeft) + Number(mark.dataset.roadRight)) / 2,
    left: bounds.left, right: bounds.right, hidden: mark.hidden,
    decoded: mark.querySelector('img')!.complete && mark.querySelector('img')!.naturalWidth > 0 };
  // A RAF timestamp can precede the Start handler's performance.now(). Keep that
  // unchanged start frame out of the moving sequence, without filtering speeds.
  if (started && run.elapsedMs > 9966.1) samples.push(state);
  proof.textContent = JSON.stringify({ state, samples, resetDone, started, risk: riskState,
    resetMs, contactMs: hazard.progress01 * segment.durationMs, target: hazard.id, scale,
    reduced: root.dataset.reducedMotion, scriptedIsolatedReset: true, noOwnersInstantiated: true });
}
function advance(delta: number): void {
  const before = run, next = advanceRouteRun(run, segment, delta);
  const target = risk.nextContact([hazard], before.progress01);
  visualSpeed = camera.speed(before, next, segment, road.distance, target, 1, scale);
  road.advance(next.elapsedMs - before.elapsedMs, visualSpeed);
  riskState = resolveRouteRisk(riskState, [hazard], before.progress01, next.progress01, next.lane, true).state;
  run = next;
}
function frame(now: number): void {
  let delta = Math.min(40, Math.max(0, now - previous)); previous = now;
  if (started && !document.hidden) {
    if (!resetDone && run.elapsedMs + delta >= resetMs) {
      const beforeMs = resetMs - run.elapsedMs;
      advance(beforeMs); delta -= beforeMs;
      run = resetRouteSpeed(run, segment); resetDone = true;
      risk.reforecastUnseen(road.distance, innerWidth);
    }
    if (delta > 0) advance(delta);
    render();
  }
  if (run.elapsedMs < 13000) requestAnimationFrame(frame);
}
document.querySelector('#start')!.addEventListener('click', () => { started = true; previous = performance.now(); });
render(); requestAnimationFrame(frame);
