// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CinematicPlayer } from '../cinematics/CinematicPlayer';
import { CinematicRegistry } from '../cinematics/CinematicRegistry';
import { getAvailableRunNodes } from '../game/runSystem';
import { createInitialState } from '../game/store';
import type { GameState, RunNode } from '../game/types';
import { JourneyCampaignBoundary } from './JourneyCampaignBoundary';
import { edgeKey, nodeArrivalKey } from './JourneyPresentationResolver';

const SECONDARY = Object.freeze([
  { id: 'COMPANY', label: 'Compagnie' },
  { id: 'SAVE', label: 'Sauvegarder' },
  { id: 'MENU', label: 'Menu' },
]);

function availableAt(state: GameState, nodeId: string): RunNode[] {
  state.run.currentNodeId = nodeId;
  state.currentNodeId = nodeId;
  return getAvailableRunNodes(state);
}

function createBoundary(options: { registry?: CinematicRegistry; presentationMap?: Record<string, string> } = {}) {
  const registry = options.registry ?? new CinematicRegistry();
  const player = new CinematicPlayer(registry);
  return new JourneyCampaignBoundary({
    player,
    registry,
    ...(options.presentationMap ? { presentationMap: options.presentationMap } : {}),
  });
}

/** Drains the microtask chain the boundary uses to mount its surface and overlay. */
async function flush(times = 12): Promise<void> {
  for (let index = 0; index < times; index += 1) await Promise.resolve();
}

function click(selector: string): void {
  document.querySelector<HTMLButtonElement>(selector)?.click();
}

describe('journey campaign boundary', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('presents a real branch and reports only the chosen node', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    expect(available).toHaveLength(2);
    const boundary = createBoundary();
    const pending = boundary.present({
      currentNodeId: 'lion-refugees',
      currentContentId: 'refugee_trial',
      available,
      secondary: SECONDARY,
      reducedMotion: false,
    });
    await flush();
    const rendered = [...document.querySelectorAll<HTMLElement>('[data-journey-choice]')]
      .map((button) => button.dataset.journeyChoice);
    expect(rendered).toEqual(available.map((node) => node.id));
    expect(document.querySelectorAll('[data-journey-continue]')).toHaveLength(0);
    click(`[data-journey-choice="${available[0]!.id}"]`);
    const outcome = await pending;
    expect(outcome).toMatchObject({ kind: 'node', id: available[0]!.id, boundary: 'branch' });
    expect(outcome.cinematicId).toBe('refugees_approach');
    expect(outcome.presentationKey).toBe('node:lion-refugees:arrival');
    expect(outcome.surfaceReason).toBe('unavailable');
    expect(outcome.trace).toContain('AGENCY');
  });

  it('offers a continuation for a single successor and commits exactly that node', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-nomad-crossroads');
    expect(available).toHaveLength(1);
    const boundary = createBoundary();
    const pending = boundary.present({ currentNodeId: 'lion-nomad-crossroads', available, reducedMotion: false });
    await flush();
    expect(document.querySelectorAll('[data-journey-choice]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-journey-continue]')).toHaveLength(1);
    click('[data-journey-continue]');
    await expect(pending).resolves.toMatchObject({ kind: 'node', id: available[0]!.id, boundary: 'single' });
  });

  it('presents a terminal boundary that can never commit a route', async () => {
    const boundary = createBoundary();
    const pending = boundary.present({ currentNodeId: 'lion-final-judgement', available: [], secondary: SECONDARY, reducedMotion: false });
    await flush();
    expect(document.querySelectorAll('[data-journey-choice]')).toHaveLength(0);
    expect(document.querySelector('[data-journey-continue]')?.textContent).toBe('Retour au menu');
    click('[data-journey-continue]');
    await expect(pending).resolves.toMatchObject({ kind: 'terminal', id: null, boundary: 'terminal' });
  });

  it('commits at most once through repeated clicks and detached callbacks', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const boundary = createBoundary();
    const outcomes: unknown[] = [];
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, reducedMotion: false });
    void pending.then((outcome) => outcomes.push(outcome));
    await flush();
    const first = document.querySelector<HTMLButtonElement>(`[data-journey-choice="${available[0]!.id}"]`);
    const second = document.querySelector<HTMLButtonElement>(`[data-journey-choice="${available[1]!.id}"]`);
    first?.click();
    first?.click();
    second?.click();
    // Detached callbacks: the overlay is already removed from the document here.
    expect(first?.isConnected).toBe(false);
    first?.click();
    second?.click();
    await pending;
    await flush();
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({ kind: 'node', id: available[0]!.id });
    expect(boundary.activeState).toBeNull();
  });

  it('reports secondary actions without committing a route', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const boundary = createBoundary();
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, secondary: SECONDARY, reducedMotion: false });
    await flush();
    expect(document.querySelectorAll('[data-journey-secondary]')).toHaveLength(3);
    expect(document.querySelector('[data-journey-secondary="CAMP"]')).toBeNull();
    click('[data-journey-secondary="COMPANY"]');
    await expect(pending).resolves.toMatchObject({ kind: 'secondary', id: 'COMPANY' });
  });

  it('never mutates campaign truth while presenting', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const before = {
      stepCounter: state.stepCounter,
      currentNodeId: state.run.currentNodeId,
      visited: [...state.run.visitedNodeIds],
      resolved: [...state.resolvedNodeIds],
      gold: state.gold,
    };
    const boundary = createBoundary();
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, reducedMotion: false });
    await flush();
    click(`[data-journey-choice="${available[0]!.id}"]`);
    await pending;
    expect({
      stepCounter: state.stepCounter,
      currentNodeId: state.run.currentNodeId,
      visited: [...state.run.visitedNodeIds],
      resolved: [...state.resolvedNodeIds],
      gold: state.gold,
    }).toEqual(before);
  });

  it('leaves no Journey DOM, media or preload behind', async () => {
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const boundary = createBoundary();
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, reducedMotion: false });
    await flush();
    expect(document.querySelectorAll('.journey-surface')).toHaveLength(1);
    click(`[data-journey-choice="${available[0]!.id}"]`);
    await pending;
    expect(document.querySelectorAll('.journey-overlay, .journey-surface, .cinematic-overlay')).toHaveLength(0);
    expect(boundary.activeState).toBeNull();
    boundary.dispose();
    expect(document.body.children).toHaveLength(0);
  });

  it('preloads only mapped candidates, deduplicated, and clears them on commit', async () => {
    const registry = new CinematicRegistry({
      version: 1,
      cinematics: [
        { id: 'clip-a', title: 'A', sources: [{ src: '/a.webm', type: 'video/webm' }] },
        { id: 'clip-b', title: 'B', sources: [{ src: '/b.webm', type: 'video/webm' }] },
      ],
    });
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const [first, second] = available;
    const boundary = createBoundary({
      registry,
      presentationMap: {
        [edgeKey('lion-refugees', first!.id)]: 'clip-a',
        [nodeArrivalKey(first!.id)]: 'clip-a',
        [nodeArrivalKey(second!.id)]: 'clip-b',
      },
    });
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, reducedMotion: false });
    await flush();
    expect(play).not.toHaveBeenCalled();
    click(`[data-journey-choice="${first!.id}"]`);
    await pending;
    expect(boundary.activeState).toBeNull();
    expect(document.querySelectorAll('video')).toHaveLength(0);
  });

  it('plays a mapped clip for the boundary when one exists', async () => {
    const registry = new CinematicRegistry({
      version: 1,
      cinematics: [{ id: 'clip-arrival', title: 'Arrival', sources: [], placeholderOnly: true }],
    });
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const boundary = createBoundary({
      registry,
      presentationMap: { [nodeArrivalKey('lion-refugees')]: 'clip-arrival' },
    });
    const pending = boundary.present({ currentNodeId: 'lion-refugees', available, reducedMotion: true });
    await flush();
    click(`[data-journey-choice="${available[0]!.id}"]`);
    const outcome = await pending;
    expect(outcome.cinematicId).toBe('clip-arrival');
    expect(outcome.surfaceReason).toBe('reduced-motion');
    expect(outcome.kind).toBe('node');
  });

  it('does not replay the same mapped clip after a secondary-action re-presentation', async () => {
    const registry = new CinematicRegistry({
      version: 1,
      cinematics: [{ id: 'clip-arrival', title: 'Arrival', sources: [], placeholderOnly: true }],
    });
    const state = createInitialState();
    const available = availableAt(state, 'lion-refugees');
    const boundary = createBoundary({
      registry,
      presentationMap: { [nodeArrivalKey('lion-refugees')]: 'clip-arrival' },
    });

    const first = boundary.present({ currentNodeId: 'lion-refugees', available, secondary: SECONDARY, reducedMotion: true });
    await flush();
    click('[data-journey-secondary="COMPANY"]');
    await expect(first).resolves.toMatchObject({ cinematicId: 'clip-arrival', surfaceReason: 'reduced-motion' });

    const second = boundary.present({ currentNodeId: 'lion-refugees', available, secondary: SECONDARY, reducedMotion: false });
    await flush();
    click(`[data-journey-choice="${available[0]!.id}"]`);
    await expect(second).resolves.toMatchObject({ cinematicId: 'clip-arrival', surfaceReason: 'unavailable', kind: 'node' });
  });

  it('propagates catastrophic session failure to the caller', async () => {
    const registry = new CinematicRegistry();
    const boundary = new JourneyCampaignBoundary({
      player: new CinematicPlayer(registry),
      registry,
      createSession: () => { throw new Error('journey session unavailable'); },
    });
    await expect(boundary.present({ currentNodeId: 'lion-camp', available: [], reducedMotion: false }))
      .rejects.toThrow('journey session unavailable');
    expect(document.querySelectorAll('.journey-overlay, .journey-surface')).toHaveLength(0);
    expect(boundary.activeState).toBeNull();
  });
});
