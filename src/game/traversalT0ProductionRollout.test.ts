// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState, SaveRepository } from './store';
import { enterRunNode, getAvailableRunNodes } from './runSystem';
import type { GameState, RunNode } from './types';
import { TraversalT0Scene } from '../traversal/TraversalT0Scene';
import { sceneTransition } from '../ui/SceneTransition';
import type { JourneyBoundaryOutcome } from '../journey/JourneyCampaignBoundary';

interface Harness {
  state: GameState;
  activeTraversal: TraversalT0Scene | null;
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
  playTraversalRoadCombat(id: string): Promise<boolean>;
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
    expect(boundary.present.mock.calls[0]![0].presentationOnly).toEqual({ continueLabel: 'Prendre la route' });
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

  it.each(['camp', 'unresolved', 'inactive', 'incompatible-route', 'T1', 'T2', 'T3', 'T4'])(
    'rejects %s as a new T0 entry', async kind => {
      const app = harness();
      const origins: Record<string, string> = { camp: 'lion-camp', T1: 'lion-first-refuge',
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

  it.each([true, false])('returns road combat victory=%s locally with no QA privileges or canonical mutations', async victory => {
    const app = harness();
    await finish(app.enterCampaignPresentation());
    const scene = app.activeTraversal!;
    (scene as unknown as { controller: { sessionState: unknown } }).controller.sessionState = {
      ...scene.session, phase: 'LOCAL_INTERACTION',
    };
    app.combat.start.mockReturnValue({ ready: Promise.resolve(), result: Promise.resolve({ victory }) });
    const state = structuredClone(app.state);
    const saved = localStorage.getItem('rpg-threejs:autosave:v6');
    const result = app.playTraversalRoadCombat('wolf_pack');
    await vi.runAllTimersAsync();
    expect(await result).toBe(victory);
    expect(app.combat.start).toHaveBeenCalledOnce();
    expect(app.combat.start.mock.calls[0]![0]).toMatchObject({ devQa: false, config: { rewards: { gold: 0, reputation: 0 } } });
    expect(app.state).toEqual(state);
    expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe(saved);
    expect(app.resolveRunNode).not.toHaveBeenCalled();
    expect(app.activeTraversal).toBe(scene);
    expect(app.mode).toBe('NARRATIVE');
    app.renderTitle();
    await expect(app.playTraversalRoadCombat('wolf_pack')).rejects.toThrow('active T0');
  });
});
