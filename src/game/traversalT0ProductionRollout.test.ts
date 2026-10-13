// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState, SaveRepository } from './store';
import { enterRunNode, getAvailableRunNodes } from './runSystem';
import type { GameState, RunNode } from './types';
import { TraversalT0Scene } from '../traversal/TraversalT0Scene';
import { TraversalT1Scene } from '../traversal/TraversalT1Scene';
import { TraversalT3Scene } from '../traversal/TraversalT3Scene';
import { sceneTransition } from '../ui/SceneTransition';
import type { JourneyBoundaryOutcome } from '../journey/JourneyCampaignBoundary';

interface Harness {
  state: GameState;
  activeTraversal: TraversalT0Scene | TraversalT1Scene | TraversalT3Scene | null;
  mode: string;
  saves: SaveRepository;
  activeNarrativeStage: { prepareGlobalHandoff: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> } | null;
  journeyBoundary: { dispose: ReturnType<typeof vi.fn>; present: ReturnType<typeof vi.fn>; waitUntilSurfaceReady: ReturnType<typeof vi.fn> } | null;
  travel: { open: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  combat: { start: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  enterJourney: ReturnType<typeof vi.fn>;
  resolveRunNode: ReturnType<typeof vi.fn>;
  enterCampaignPresentation(): Promise<void>;
  continueChronicle(): Promise<void>;
  renderTitle(): void;
  commitRunNodeChoice(id: string): Promise<boolean>;
  acceptTraversalRouteReward(reward: { id: string; gold: number }): boolean;
}

function harness() {
  const state = createInitialState();
  enterRunNode(state.run, 'lion-audience');
  state.currentNodeId = state.run.currentNodeId;
  state.visitedNodeIds = [...state.run.visitedNodeIds];
  state.resolvedNodeIds.push('lion-audience');
  const app = Object.assign(Object.create(GameApp.prototype), {
    state, mode: 'NARRATIVE', root: document.body,
    canvas: document.createElement('canvas'), chrome: document.createElement('div'),
    campaignPresentation: 'journey', journeyUnavailable: false, qaEnabled: false,
    traversalT0QaEnabled: false, traversalEntryInFlight: false, routeCommitInFlight: false,
    activeTraversal: null, traversalArrivalInFlight: false,
    activeNarrativeStage: { prepareGlobalHandoff: vi.fn(), dispose: vi.fn() },
    journeyBoundary: null as Harness['journeyBoundary'],
    ensureJourneyBoundary() {
      return this.journeyBoundary ??= { dispose: vi.fn(),
        present: vi.fn(async () => ({ kind: 'presentation-continue', id: null })),
        waitUntilSurfaceReady: vi.fn(async () => undefined) };
    },
    travel: { open: vi.fn(), close: vi.fn() },
    combat: { start: vi.fn(() => ({ ready: Promise.resolve(), result: Promise.resolve({ victory: true }) })), close: vi.fn() },
    exploration: { close: vi.fn() }, prologue: { close: vi.fn() },
    saves: new SaveRepository(), enterJourney: vi.fn(async () => undefined),
    resolveRunNode: vi.fn(async () => undefined),
  }) as Harness;
  (app as unknown as { ensureJourneyBoundary(): unknown }).ensureJourneyBoundary();
  return app;
}

async function finish(promise: Promise<unknown>) {
  await vi.runAllTimersAsync();
  await promise;
}

describe('production T0 orchestration with real scenes, RunSystem and saves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers(); vi.restoreAllMocks(); document.body.replaceChildren();
    delete document.body.dataset.campaignSurface;
  });

  it.each(['T0', 'T1', 'T3'] as const)('accepts %s route loot only during an authored, enabled running scene', leg => {
    const app = harness();
    const refresh = vi.fn();
    Object.assign(app, { statusHud: { refresh } });
    const before = structuredClone(app.state);
    for (const [legId, phase] of [['T2', 'RUNNING'], ['T4', 'RUNNING'], ['T0', 'NODE_RESOLUTION'], ['T1', 'NODE_RESOLUTION'], ['T3', 'NODE_RESOLUTION']] as const) {
      app.activeTraversal = { session: { legId, phase } } as unknown as TraversalT0Scene;
      expect(app.acceptTraversalRouteReward({ id: 'fixture-pouch', gold: 5 })).toBe(false);
      expect(app.state).toEqual(before);
    }
    app.activeTraversal = { session: { legId: leg, phase: 'RUNNING' } } as unknown as TraversalT0Scene;
    for (const gold of [0, -1, .5, NaN]) {
      expect(app.acceptTraversalRouteReward({ id: 'fixture-pouch', gold })).toBe(false);
    }
    expect(app.acceptTraversalRouteReward({ id: 'fixture-pouch', gold: 5 })).toBe(true);
    const expected = structuredClone(before);
    expected.run.temporaryLoot.gold += 5;
    expect(app.state).toEqual(expected);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('holds at departure without committing, then mounts exactly once under cover', async () => {
    const app = harness();
    const state = structuredClone(app.state);
    const stage = app.activeNarrativeStage!, boundary = app.journeyBoundary!;
    let continueDeparture!: (outcome: JourneyBoundaryOutcome) => void;
    boundary.present.mockReturnValue(new Promise<JourneyBoundaryOutcome>(resolve => { continueDeparture = resolve; }));
    const save = vi.spyOn(app.saves, 'saveAuto');
    const open = vi.spyOn(TraversalT0Scene.prototype, 'open');
    const entry = app.enterCampaignPresentation();
    await app.enterCampaignPresentation();
    expect(app.activeTraversal).toBeNull();
    await vi.runAllTimersAsync();
    expect(app.activeTraversal).toBeNull();
    expect(boundary.present).toHaveBeenCalledOnce();
    expect(boundary.present.mock.calls[0]![0].presentationOnly).toEqual({
      eyebrow: 'Départ',
      title: 'Vers Refuge du Lion',
      continueLabel: 'Prendre la route',
    });
    expect(app.resolveRunNode).not.toHaveBeenCalled();
    expect(app.state).toEqual(state);
    expect(app.saves.loadAuto()?.run.currentNodeId).toBe('lion-audience');
    continueDeparture({ kind: 'presentation-continue', id: null } as JourneyBoundaryOutcome);
    await vi.advanceTimersByTimeAsync(650);
    expect(sceneTransition.isActive).toBe(true);
    expect(app.activeTraversal).toBeInstanceOf(TraversalT0Scene);
    expect(document.querySelectorAll('.traversal-t0')).toHaveLength(1);
    expect(app.state).toEqual(state);
    expect(stage.prepareGlobalHandoff).toHaveBeenCalledOnce();
    expect(stage.dispose).toHaveBeenCalledOnce();
    expect(boundary.dispose).toHaveBeenCalledOnce();
    expect(app.activeNarrativeStage).toBeNull();
    expect(app.journeyBoundary).toBeNull();
    expect(save).toHaveBeenCalledExactlyOnceWith(app.state);
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]!);
    expect(app.saves.loadAuto()?.run.currentNodeId).toBe('lion-audience');
    await finish(entry);
    await app.enterCampaignPresentation();
    expect(open).toHaveBeenCalledOnce();
    expect(app.travel.open).not.toHaveBeenCalled();
    expect(app.enterJourney).not.toHaveBeenCalled();
    app.renderTitle();
  });

  it('rebuilds unchanged departure after Company and Save, then Menu disposes it', async () => {
    const app = harness();
    const before = structuredClone(app.state);
    const boundary = app.journeyBoundary!;
    const resolvers: Array<(outcome: JourneyBoundaryOutcome) => void> = [];
    boundary.present.mockImplementation(() => new Promise<JourneyBoundaryOutcome>(resolve => resolvers.push(resolve)));
    const openManagement = vi.fn(async () => {
      app.mode = 'MANAGEMENT';
      app.saves.saveAuto(app.state);
    });
    Object.assign(app, { openManagement });
    const saveManual = vi.spyOn(app.saves, 'saveManual');
    const commitRoute = vi.spyOn(app, 'commitRunNodeChoice');
    const entry = app.enterCampaignPresentation();
    await vi.runAllTimersAsync();
    expect(boundary.present).toHaveBeenCalledOnce();
    expect(boundary.present.mock.calls[0]![0].secondary.map((action: { id: string }) => action.id))
      .toEqual(['COMPANY', 'SAVE', 'MENU']);

    resolvers.shift()!({ kind: 'secondary', id: 'COMPANY' } as JourneyBoundaryOutcome);
    for (let index = 0; index < 20; index += 1) await Promise.resolve();
    expect(openManagement).toHaveBeenCalledExactlyOnceWith('clan', undefined, 'temporary', false);
    expect(app.mode).toBe('NARRATIVE');
    expect(boundary.present).toHaveBeenCalledTimes(2);
    expect(boundary.present.mock.calls[1]![0]).toEqual(boundary.present.mock.calls[0]![0]);
    expect(app.state).toEqual(before);
    expect(app.travel.open).not.toHaveBeenCalled();

    resolvers.shift()!({ kind: 'secondary', id: 'SAVE' } as JourneyBoundaryOutcome);
    for (let index = 0; index < 20; index += 1) await Promise.resolve();
    expect(saveManual).toHaveBeenCalledOnce();
    expect(boundary.present).toHaveBeenCalledTimes(3);
    expect(app.state).toEqual(before);

    resolvers.shift()!({ kind: 'secondary', id: 'MENU' } as JourneyBoundaryOutcome);
    await finish(entry);
    expect(app.mode).toBe('TITLE');
    expect(boundary.dispose).toHaveBeenCalledOnce();
    expect(app.activeTraversal).toBeNull();
    expect(app.travel.open).not.toHaveBeenCalled();
    expect(app.resolveRunNode).not.toHaveBeenCalled();
    expect(commitRoute).not.toHaveBeenCalled();
    expect(app.state).toEqual(before);
  });

  it.each(['camp', 'unresolved', 'inactive', 'incompatible-route', 'T2', 'T4'])(
    'rejects %s as a new T0 entry', async kind => {
      const app = harness();
      const origins: Record<string, string> = { camp: 'lion-camp',
        T2: 'lion-village-choice', T3: 'lion-second-refuge', T4: 'lion-shadow-signs' };
      if (origins[kind]) {
        app.state.run.currentNodeId = app.state.currentNodeId = origins[kind]!;
        app.state.resolvedNodeIds.push(origins[kind]!);
      }
      if (kind === 'unresolved') app.state.resolvedNodeIds = [];
      if (kind === 'inactive') app.state.run.status = 'completed';
      if (kind === 'incompatible-route') app.state.run.graph.nodes.find(n => n.id === 'lion-audience')!.links = [];
      await app.enterCampaignPresentation();
      expect(app.activeTraversal).toBeNull();
      expect(app.enterJourney).toHaveBeenCalledOnce();
      expect(app.travel.open).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['T1', 'lion-first-refuge', TraversalT1Scene],
    ['T3', 'lion-second-refuge', TraversalT3Scene],
  ] as const)('mounts authored %s from the resolved refuge and restarts from its durable origin', async (legId, origin, Scene) => {
    const app = harness();
    Object.assign(app, { statusHud: { refresh: vi.fn(), show: vi.fn(), hide: vi.fn() } });
    // Durable boundary snapshot; the browser QA separately reaches the real refuge UI.
    app.state.run.currentNodeId = app.state.currentNodeId = origin;
    app.state.resolvedNodeIds.push(origin);
    const before = structuredClone(app.state);
    await finish(app.enterCampaignPresentation());
    const original = app.activeTraversal!;
    expect(original).toBeInstanceOf(Scene);
    expect(document.querySelectorAll(`[data-traversal-leg="${legId}"]`)).toHaveLength(1);
    expect(app.state).toEqual(before);
    expect(app.saves.loadAuto()?.run.currentNodeId).toBe(origin);
    expect(app.acceptTraversalRouteReward({ id: `${legId}-fixture-pouch`, gold: 5 })).toBe(true);
    expect(app.state.run.temporaryLoot.gold).toBe(before.run.temporaryLoot.gold + 5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await finish(app.continueChronicle());
    expect(app.activeTraversal).toBeInstanceOf(Scene);
    expect(app.activeTraversal).not.toBe(original);
    expect(app.state).toEqual(before);
    expect(app.activeTraversal?.session.routeProgress01).toBe(0);
    expect(app.state.run.traversalBranches?.[legId]).toBeUndefined();
    expect(app.travel.open).not.toHaveBeenCalled();
    app.renderTitle();
  });

  it('keeps the origin durable through canonical commitment and restarts cleanly after Escape/Continue', async () => {
    const app = harness();
    await finish(app.enterCampaignPresentation());
    const original = app.activeTraversal!;
    const saved = localStorage.getItem('rpg-threejs:autosave:v6');
    // Simulate the physical stage requesting a node, then execute the real canonical commit.
    const internal = original as unknown as { controller: { sessionState: unknown } };
    internal.controller.sessionState = { ...original.session, phase: 'NODE_HANDOFF', activeNodeId: 'lion-opening-ambush' };
    app.resolveRunNode.mockImplementation(async (node: RunNode) => {
      app.state.resolvedNodeIds.push(node.id);
      await app.enterCampaignPresentation();
    });
    await app.commitRunNodeChoice('lion-opening-ambush');
    await vi.runAllTimersAsync();
    expect(app.activeTraversal).toBe(original);
    expect(original.session.phase).toBe('RUNNING');
    expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(saved);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(app.activeTraversal).toBeNull();
    expect(document.querySelector('.traversal-t0')).toBeNull();
    expect(app.mode).toBe('TITLE');
    await finish(app.continueChronicle());
    expect(app.activeTraversal).not.toBe(original);
    expect(app.activeTraversal?.session.routeProgress01).toBe(0);
    expect(app.state.run.currentNodeId).toBe('lion-audience');
    expect(app.state.resolvedNodeIds).not.toContain('lion-opening-ambush');
    expect(getAvailableRunNodes(app.state).map(n => n.id)).toEqual(['lion-opening-ambush']);
    app.renderTitle();
  });

});
