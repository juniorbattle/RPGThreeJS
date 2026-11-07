// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState, SaveRepository } from './store';
import { getRunNode, isPoiNeutralized, selectPoiMap, travelToResolvedPoi, enterPoi } from './runSystem';
import { LOT_E_ELITES } from '../campaign/LionPoiAuthoring';
import { PoiMapView } from '../ui/PoiMapView';
import { sceneTransition } from '../ui/SceneTransition';
import type { GameState, RunNode } from './types';

afterEach(() => { document.body.replaceChildren(); localStorage.clear(); vi.restoreAllMocks(); });

/** Every step on the shortest graph path to `target` resolved and visited, as a company that walked there. */
function walkTo(target: string): GameState {
  const state = createInitialState();
  const nodes = new Map(state.run.graph.nodes.map(node => [node.id, node]));
  const previous = new Map<string, string | null>([[state.run.currentNodeId, null]]);
  const queue = [state.run.currentNodeId];
  while (queue.length && !previous.has(target)) {
    const current = queue.shift()!;
    for (const next of nodes.get(current)?.links ?? []) if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
  }
  const path: string[] = [];
  for (let id: string | null | undefined = target; id; id = previous.get(id)) path.unshift(id);
  for (const id of path) {
    if (!state.resolvedNodeIds.includes(id)) state.resolvedNodeIds.push(id);
    if (!state.run.visitedNodeIds.includes(id)) state.run.visitedNodeIds.push(id);
  }
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.run.currentNodeId = state.currentNodeId = target;
  return state;
}
const node = (state: GameState, id: string) => selectPoiMap(state).nodes.find(candidate => candidate.id === id)!;
const occupy = (state: GameState, positionId: string) => {
  const def = LOT_E_ELITES[0]!;
  Object.assign(state.run.poiExpedition!.elites[def.id]!, { active: true, defeated: false, positionId });
  return def;
};

describe('travel to resolved POIs (set 1.16.0)', () => {
  it('offers a resolved, non-adjacent POI over an inert route, and leaves adjacent moves to ordinary movement', () => {
    const state = walkTo('lion-final-refuge');
    const model = selectPoiMap(state);
    const travel = model.nodes.filter(candidate => candidate.canTravel);
    expect(travel.length).toBeGreaterThan(3);
    for (const destination of travel) {
      expect(destination.status).toBe('resolved');
      expect(destination.canMove).toBe(false);
      const route = destination.travelRoute;
      expect(route[0]).toBe('lion-final-refuge');
      expect(route.at(-1)).toBe(destination.id);
      expect(route.length).toBeGreaterThanOrEqual(3);
      for (const id of route.slice(1, -1)) {
        expect(state.resolvedNodeIds.includes(id) || isPoiNeutralized(state, id)).toBe(true);
      }
    }
    const adjacent = model.nodes.filter(candidate => candidate.canMove);
    expect(adjacent.length).toBeGreaterThan(0);
    expect(adjacent.every(candidate => !candidate.canTravel && candidate.travelRoute.length === 0)).toBe(true);
    // Unresolved and locked POIs keep their current rules.
    expect(model.nodes.filter(candidate => candidate.status !== 'resolved').every(candidate => !candidate.canTravel)).toBe(true);
  });

  it('travels in one committed movement counted as one turn, recorded from the route\'s last POI, with no new fact', () => {
    const state = walkTo('lion-final-refuge');
    const destination = node(state, 'lion-first-refuge');
    expect(destination.canTravel).toBe(true);
    const route = destination.travelRoute;
    const before = structuredClone(state);
    const travelled = travelToResolvedPoi(state, 'lion-first-refuge')!;
    expect(travelled.route).toEqual(route);
    expect(travelled.interception).toBeUndefined();
    expect(state.run.currentNodeId).toBe('lion-first-refuge');
    expect(state.currentNodeId).toBe('lion-first-refuge');
    expect(state.run.poiExpedition!.turn).toBe(before.run.poiExpedition!.turn + 1);
    // Set 1.18.0: guardians never move, so a travel leaves no pending step behind.
    expect(state.run.poiExpedition!.pendingStep).toBeUndefined();
    expect(state.run.poiExpedition!.previousSafeNodeId).toBe(route.at(-2));
    expect(state.resolvedNodeIds).toEqual(before.resolvedNodeIds);
    expect(state.run.visitedNodeIds).toEqual(before.run.visitedNodeIds);
    expect(state.stepCounter).toBe(before.stepCounter);
    expect(state.flags).toEqual(before.flags);
    expect(state.gold).toBe(before.gold);
    expect(Object.keys(state.run.poiExpedition!).sort()).toEqual(Object.keys({ ...before.run.poiExpedition!, previousSafeNodeId: 1 }).sort());
  });

  it('saves and reloads a travel exactly, with only the existing V6 fields', () => {
    // A save normalizes the fixture first (it activates the region's mobile elites), as the real game does.
    const saves = new SaveRepository();
    saves.saveAuto(walkTo('lion-final-refuge'));
    const state = saves.loadAuto()!;
    const destination = selectPoiMap(state).nodes.find(candidate => candidate.canTravel && !candidate.reusable)!;
    expect(travelToResolvedPoi(state, destination.id)).not.toBeNull();
    saves.saveAuto(state);
    expect(saves.loadAuto()).toEqual(state);
  });

  it('never crosses a POI held by a mobile elite, and an occupied destination offers the front choice before any move', () => {
    const state = walkTo('lion-final-refuge');
    const route = node(state, 'lion-first-refuge').travelRoute;
    const blocker = route[Math.floor(route.length / 2)]!;
    const def = occupy(state, blocker);
    const model = selectPoiMap(state);
    expect(model.nodes.every(candidate => !candidate.travelRoute.slice(1, -1).includes(blocker))).toBe(true);
    const occupied = model.nodes.find(candidate => candidate.id === blocker)!;
    expect(occupied.canTravel || occupied.canMove).toBe(true);
    if (occupied.canTravel) {
      const before = structuredClone(state);
      const result = travelToResolvedPoi(state, blocker)!;
      expect(result.interception).toBe(true);
      expect(state.run.currentNodeId).toBe(before.run.currentNodeId);
      expect(state.run.poiExpedition!.turn).toBe(before.run.poiExpedition!.turn);
      expect(state.run.poiExpedition!.encounter).toMatchObject({ eliteId: def.id, kind: 'front',
        originNodeId: 'lion-final-refuge', targetNodeId: blocker });
    }
  });

  it('refuses travel to an unresolved, adjacent or current POI, and while an encounter or step is pending', () => {
    const state = walkTo('lion-final-refuge');
    expect(travelToResolvedPoi(state, 'lion-final-judgement')).toBeNull();
    expect(travelToResolvedPoi(state, 'lion-final-refuge')).toBeNull();
    const adjacent = selectPoiMap(state).nodes.find(candidate => candidate.canMove && candidate.status === 'resolved');
    if (adjacent) expect(travelToResolvedPoi(state, adjacent.id)).toBeNull();
    state.run.poiExpedition!.pendingStep = { step: 1, fromNodeId: 'a', toNodeId: 'b' };
    expect(travelToResolvedPoi(state, 'lion-first-refuge')).toBeNull();
    // Ordinary movement keeps refusing a distant POI: travel is its own revalidated intention.
    delete state.run.poiExpedition!.pendingStep;
    expect(enterPoi(state, 'lion-first-refuge')).toBeNull();
  });
});

describe('travel on the map and in GameApp (set 1.16.0)', () => {
  it('enables the move with the approved mention and lights the whole route', () => {
    const state = walkTo('lion-final-refuge');
    const model = selectPoiMap(state);
    const root = document.createElement('div'); document.body.append(root);
    const onMove = vi.fn(async (_id: string) => {});
    new PoiMapView({ root, onMove, onBypass: vi.fn(), onCompany: vi.fn(), onSave: vi.fn(), onMenu: vi.fn() }).open(model, 'lion-final-refuge');
    const destination = model.nodes.find(candidate => candidate.canTravel && candidate.region === 2)!;
    const marker = root.querySelector<HTMLButtonElement>(`[data-poi-id="${destination.id}"]`)!;
    expect(marker.classList.contains('poi-marker--far')).toBe(false);
    expect(marker.getAttribute('aria-label')).toContain('voyage rapide en 1 tour');
    marker.click();
    expect(root.querySelector('.poi-map__selection')!.textContent).toContain('Voyage rapide · 1 tour');
    const move = root.querySelector<HTMLButtonElement>('[data-poi-action="move"]')!;
    expect(move.disabled).toBe(false);
    expect(move.textContent).toBe('Se rendre');
    expect(root.querySelectorAll('.poi-path--selected').length).toBe(destination.travelRoute.length - 1);
    move.click();
    expect(onMove).toHaveBeenCalledWith(destination.id);
  });

  it('commits the travel through RunSystem, saves it, then animates the pawn along its route', async () => {
    const root = document.createElement('div'); document.body.append(root);
    const app = new GameApp(root, document.createElement('canvas'));
    const owner = app as unknown as { state: GameState; mode: string; poiMap: PoiMapView;
      choosePoi(id: string): Promise<void>; resolveRunNode(node: RunNode, initial: boolean): Promise<void>;
      enterCampaignPresentation(): Promise<void> };
    owner.state = walkTo('lion-final-refuge'); owner.mode = 'TRAVEL';
    const route = node(owner.state, 'lion-first-refuge').travelRoute;
    vi.spyOn(sceneTransition, 'run').mockImplementation(async options => { await options.task(); });
    const animation = vi.spyOn(owner.poiMap, 'animateTravel').mockImplementation(() => {
      expect(new SaveRepository().loadAuto()!.currentNodeId).toBe('lion-first-refuge');
      return undefined;
    });
    const presentation = vi.spyOn(owner, 'enterCampaignPresentation').mockResolvedValue();
    const resolve = vi.spyOn(owner, 'resolveRunNode').mockResolvedValue();
    await owner.choosePoi('lion-first-refuge');
    expect(animation).toHaveBeenCalledWith('lion-final-refuge', 'lion-first-refuge', route);
    expect(owner.state.run.currentNodeId).toBe('lion-first-refuge');
    // Not a secured refuge in this fixture: arrival activates nothing and replays nothing.
    expect(resolve).not.toHaveBeenCalled();
    expect(presentation).toHaveBeenCalledOnce();
    expect(getRunNode(owner.state.run, 'lion-first-refuge')).toBeTruthy();
    app.dispose();
  });
});
