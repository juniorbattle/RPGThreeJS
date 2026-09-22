// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState } from './store';
import { getAvailableRunNodes } from './runSystem';
import type { GameState, RunNode } from './types';
import type { JourneyBoundaryOutcome, JourneyBoundaryRequest } from '../journey/JourneyCampaignBoundary';
import { resolveCampaignPresentation } from '../journey/JourneyPresentationPolicy';
import { sceneTransition } from '../ui/SceneTransition';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Exercise the real orchestration methods without constructing unrelated WebGL/combat UI.
interface Harness {
  state: GameState;
  mode: string;
  campaignPresentation: string;
  journeyUnavailable: boolean;
  activeTraversal: ReturnType<typeof traversal> | null;
  journeyBoundary: unknown;
  travel: { open: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  saves: { saveAuto: ReturnType<typeof vi.fn> };
  resolveRunNode: ReturnType<typeof vi.fn>;
  enterCampaignPresentation(): Promise<void>;
  completeTraversalT0Qa(id: string): Promise<void>;
  commitRunNodeChoice(id: string): Promise<boolean>;
}

function traversal(phase = 'ARRIVING', nodeId: string | null = null) {
  const element = document.createElement('div');
  element.className = 'traversal-t0';
  document.body.append(element);
  const scene = {
    element, route: { destinationNodeId: 'lion-first-refuge' },
    session: { phase }, activeNodeId: nodeId,
    completeArrival: vi.fn(() => { scene.session.phase = 'COMPLETE'; }),
    dispose: vi.fn(() => element.remove()),
    canResumeNode: vi.fn((id: string) => scene.session.phase === 'NODE_RESOLUTION' && id === nodeId),
    beginNodeResolution: vi.fn(() => { scene.session.phase = 'NODE_RESOLUTION'; }),
    resumeNode: vi.fn(() => { scene.session.phase = 'RUNNING'; }),
  };
  return scene;
}

function harness() {
  const outcome = deferred<JourneyBoundaryOutcome>();
  const ready = deferred<void>();
  const boundary = {
    present: vi.fn((_request: JourneyBoundaryRequest) => outcome.promise),
    waitUntilSurfaceReady: vi.fn(() => ready.promise),
    dispose: vi.fn(),
  };
  const travelElement = document.createElement('div');
  travelElement.className = 'travel';
  const app = Object.assign(Object.create(GameApp.prototype), {
    state: createInitialState(), mode: 'NARRATIVE',
    campaignPresentation: resolveCampaignPresentation({ search: '', dev: false }),
    journeyUnavailable: false, traversalArrivalInFlight: false, routeCommitInFlight: false,
    activeTraversal: null, activeNarrativeStage: null, journeyBoundary: boundary,
    canvas: document.createElement('canvas'), chrome: document.createElement('div'),
    travel: { open: vi.fn(() => document.body.append(travelElement)), close: vi.fn(() => travelElement.remove()) },
    combat: { close: vi.fn() }, saves: { saveAuto: vi.fn() },
    setMode(mode: string) { this.mode = mode; },
    resolveRunNode: vi.fn(async (_node: RunNode) => undefined),
  }) as Harness;
  return { app, boundary, outcome, ready };
}

const aborted = { kind: 'aborted', id: null } as JourneyBoundaryOutcome;

describe('production campaign presentation migration lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    delete document.body.dataset.campaignSurface;
  });

  it('completes final physical arrival once under cover, waits for Journey readiness and never opens Travel', async () => {
    const { app, boundary, outcome, ready } = harness();
    const scene = traversal();
    app.activeTraversal = scene;
    document.body.dataset.campaignSurface = 'traversal';
    const before = structuredClone(app.state);
    const run = vi.spyOn(sceneTransition, 'run');
    const completion = app.completeTraversalT0Qa('lion-first-refuge');
    await app.completeTraversalT0Qa('lion-first-refuge');
    expect(run).toHaveBeenCalledOnce();
    expect(scene.completeArrival).not.toHaveBeenCalled();
    expect(scene.element.isConnected).toBe(true);
    await vi.advanceTimersByTimeAsync(650);
    expect(scene.completeArrival).toHaveBeenCalledOnce();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(scene.completeArrival.mock.invocationCallOrder[0]).toBeLessThan(scene.dispose.mock.invocationCallOrder[0]!);
    expect(app.activeTraversal).toBeNull();
    expect(document.body.dataset.campaignSurface).toBeUndefined();
    expect(document.querySelector('.traversal-t0')).toBeNull();
    expect(sceneTransition.isActive).toBe(true);
    expect(boundary.present).toHaveBeenCalledOnce();
    expect(boundary.present.mock.calls[0]![0].available).toEqual(getAvailableRunNodes(app.state));
    expect(app.state).toEqual(before);
    expect(app.resolveRunNode).not.toHaveBeenCalled();
    expect(app.travel.open).not.toHaveBeenCalled();
    expect(app.saves.saveAuto).toHaveBeenCalledOnce();
    ready.resolve();
    await vi.runAllTimersAsync();
    expect(sceneTransition.isActive).toBe(false);
    outcome.resolve(aborted);
    await completion;
    await app.completeTraversalT0Qa('lion-first-refuge');
    expect(run).toHaveBeenCalledOnce();
    expect(scene.completeArrival).toHaveBeenCalledOnce();
  });

  it('ignores mismatched and non-arriving callbacks', async () => {
    const { app, boundary } = harness();
    app.activeTraversal = traversal();
    await app.completeTraversalT0Qa('wrong-node');
    app.activeTraversal.session.phase = 'NODE_RESOLUTION';
    await app.completeTraversalT0Qa('lion-first-refuge');
    expect(boundary.present).not.toHaveBeenCalled();
    expect(app.activeTraversal.completeArrival).not.toHaveBeenCalled();
  });

  it('uses authoritative available nodes and commits a Journey outcome through the shared guard exactly once', async () => {
    const { app, boundary, outcome, ready } = harness();
    const available = getAvailableRunNodes(app.state);
    const steps = app.state.stepCounter;
    const commit = vi.spyOn(app, 'commitRunNodeChoice');
    const completion = app.enterCampaignPresentation();
    ready.resolve();
    await vi.runAllTimersAsync();
    expect(boundary.present.mock.calls[0]![0].available).toEqual(available);
    expect(app.state.stepCounter).toBe(steps);
    outcome.resolve({ kind: 'node', id: available[0]!.id } as JourneyBoundaryOutcome);
    await completion;
    expect(commit).toHaveBeenCalledExactlyOnceWith(available[0]!.id);
    expect(app.state.run.currentNodeId).toBe(available[0]!.id);
    expect(app.state.stepCounter).toBe(steps + 1);
    expect(app.resolveRunNode).toHaveBeenCalledOnce();
    expect(app.travel.open).not.toHaveBeenCalled();
    expect(await app.commitRunNodeChoice(available[0]!.id)).toBe(false);
    expect(app.state.stepCounter).toBe(steps + 1);
  });

  it.each(['before-ready', 'after-ready'] as const)('recovers a catastrophic %s failure after releasing the transition lock and latches Journey off', async timing => {
    const { app, boundary, outcome, ready } = harness();
    const scene = traversal();
    app.activeTraversal = scene;
    const completion = app.completeTraversalT0Qa('lion-first-refuge');
    await vi.advanceTimersByTimeAsync(650);
    if (timing === 'after-ready') { ready.resolve(); await vi.runAllTimersAsync(); }
    outcome.reject(new Error('Injected presentation failure'));
    await vi.runAllTimersAsync();
    await completion;
    expect(sceneTransition.isActive).toBe(false);
    expect(app.journeyUnavailable).toBe(true);
    expect(app.mode).toBe('TRAVEL');
    expect(app.travel.open).toHaveBeenCalledOnce();
    expect(scene.completeArrival).toHaveBeenCalledOnce();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(app.activeTraversal).toBeNull();
    const next = app.enterCampaignPresentation();
    await vi.runAllTimersAsync();
    await next;
    expect(app.travel.open).toHaveBeenCalledTimes(2);
    expect(boundary.present).toHaveBeenCalledOnce();
  });

  it('preserves NODE_HANDOFF commitment, resolution and return to the same Traversal session', async () => {
    const { app, boundary } = harness();
    app.state.run.currentNodeId = app.state.currentNodeId = 'lion-audience';
    const node = getAvailableRunNodes(app.state)[0]!;
    const scene = traversal('NODE_HANDOFF', node.id);
    app.activeTraversal = scene;
    app.resolveRunNode.mockImplementation(async (entered: RunNode) => {
      app.state.resolvedNodeIds.push(entered.id);
      await app.enterCampaignPresentation();
    });
    expect(await app.commitRunNodeChoice(node.id)).toBe(true);
    expect(scene.beginNodeResolution).toHaveBeenCalledExactlyOnceWith(node.id);
    await vi.runAllTimersAsync();
    expect(scene.resumeNode).toHaveBeenCalledExactlyOnceWith(node.id);
    expect(app.activeTraversal).toBe(scene);
    expect(scene.element.isConnected).toBe(true);
    expect(scene.completeArrival).not.toHaveBeenCalled();
    expect(scene.dispose).not.toHaveBeenCalled();
    expect(boundary.present).not.toHaveBeenCalled();
    expect(app.travel.open).not.toHaveBeenCalled();
  });

  it('still completes arrival once when the explicit DEV legacy override is selected', async () => {
    const { app, boundary } = harness();
    app.campaignPresentation = resolveCampaignPresentation({ search: '?journey=travel', dev: true });
    const scene = traversal();
    app.activeTraversal = scene;
    const completion = app.completeTraversalT0Qa('lion-first-refuge');
    await vi.runAllTimersAsync();
    await completion;
    expect(scene.completeArrival).toHaveBeenCalledOnce();
    expect(scene.dispose).toHaveBeenCalledOnce();
    expect(boundary.present).not.toHaveBeenCalled();
    expect(app.travel.open).toHaveBeenCalledOnce();
  });
});
