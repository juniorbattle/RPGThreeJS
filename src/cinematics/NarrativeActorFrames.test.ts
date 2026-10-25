// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_NARRATIVE_FRAME_MS,
  MIN_NARRATIVE_FRAME_MS,
  NARRATIVE_ACTOR_FRAME_BINDINGS,
  NarrativeActorFramePlayer,
  validateNarrativeActorFrameBindings,
  type NarrativeActorFrameBinding,
} from './NarrativeActorFrames';
import { CAMP_DEPARTURE_TABLEAU, type NarrativeTableauSpec } from './NarrativeTableau';
import { NarrativeSceneSurface } from './NarrativeSceneSurface';

const IDLE: NarrativeActorFrameBinding = {
  tableauId: 'TEST_TABLEAU',
  phaseIds: ['IDLE_PHASE'],
  animation: { id: 'alistair-idle-test', actorId: 'alistair', frames: ['/frames/a0.png', '/frames/a1.png', '/frames/a2.png', '/frames/a3.png'], frameMs: 200 },
};

function stubMotion(initial = false) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return matches; },
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  })));
  return { listeners, set(value: boolean) { matches = value; listeners.forEach((listener) => listener()); } };
}

function stubVisibility(initial: DocumentVisibilityState = 'visible') {
  let state = initial;
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  return (next: DocumentVisibilityState) => { state = next; document.dispatchEvent(new Event('visibilitychange')); };
}

/** Holds every decode back, as a window that is not painting does, until the test settles it. */
function manualDecode() {
  const pending: Array<{ image: HTMLImageElement; resolve: () => void }> = [];
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (this: HTMLImageElement) {
    return new Promise<void>((resolve) => { pending.push({ image: this, resolve }); });
  });
  return {
    pending,
    resolveAll: () => pending.forEach(({ resolve }) => resolve()),
    loadAll: () => pending.forEach(({ image }) => image.dispatchEvent(new Event('load'))),
  };
}

function decodedSources() {
  const sources: string[] = [];
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (this: HTMLImageElement) {
    sources.push(this.src);
    return Promise.resolve();
  });
  return sources;
}

function stagedActor(actorId = 'alistair', master = '/masters/alistair.png', connected = true) {
  const actor = document.createElement('figure');
  actor.dataset.actorId = actorId;
  const image = document.createElement('img');
  image.src = master;
  actor.append(image);
  if (connected) document.body.append(actor);
  return { actor, image };
}

const source = (image: HTMLImageElement) => image.getAttribute('src');
const visibilityCalls = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([type]) => type === 'visibilitychange').length;

function cleanUp() {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'visibilityState');
  document.body.replaceChildren();
}

describe('NarrativeActorFramePlayer', () => {
  afterEach(cleanUp);

  it('ships no production binding yet and rejects malformed bindings', () => {
    expect(NARRATIVE_ACTOR_FRAME_BINDINGS).toEqual([]);
    expect(validateNarrativeActorFrameBindings(NARRATIVE_ACTOR_FRAME_BINDINGS)).toEqual([]);
    expect(validateNarrativeActorFrameBindings([IDLE])).toEqual([]);
    const range = `frameMs must be between ${MIN_NARRATIVE_FRAME_MS} and ${MAX_NARRATIVE_FRAME_MS}`;
    expect(validateNarrativeActorFrameBindings([
      { ...IDLE, animation: { ...IDLE.animation, frames: ['/frames/a0.png'], frameMs: MIN_NARRATIVE_FRAME_MS - 1 } },
      IDLE,
      { ...IDLE, phaseIds: [], animation: { ...IDLE.animation, id: 'endless', frameMs: Infinity } },
      { ...IDLE, phaseIds: ['OTHER'], animation: { ...IDLE.animation, id: 'unset', frameMs: Number.NaN } },
    ])).toEqual([
      'alistair-idle-test: at least two frames are required',
      `alistair-idle-test: ${range}`,
      'TEST_TABLEAU:IDLE_PHASE:alistair: more than one animation',
      `endless: ${range}`,
      'endless: no phase',
      `unset: ${range}`,
    ]);
  });

  it('ignores a binding that would spin the clock or show nothing, whoever supplied it', () => {
    vi.useFakeTimers();
    const motion = stubMotion(false); stubVisibility();
    const decoded = decodedSources();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([
      { ...IDLE, animation: { ...IDLE.animation, frameMs: Number.NaN } },
      { ...IDLE, phaseIds: ['ONE_FRAME'], animation: { ...IDLE.animation, frames: ['/frames/a0.png'] } },
    ], false);
    player.sync('IDLE_PHASE', [actor]);
    player.sync('ONE_FRAME', [actor]);
    expect(actor.dataset.frameAnimation).toBeUndefined();
    expect(source(image)).toBe('/masters/alistair.png');
    expect(decoded).toEqual([]);
    expect(motion.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    player.dispose();
  });

  it('keeps the master until every frame is ready, then loops on one clock and restores the master on dispose', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    const decoded = decodedSources();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    expect(actor.dataset.frameAnimationState).toBe('LOADING');
    expect(source(image)).toBe('/masters/alistair.png');
    await vi.advanceTimersByTimeAsync(0);
    expect(decoded).toHaveLength(4);
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    expect(source(image)).toBe('/frames/a0.png');
    expect(vi.getTimerCount()).toBe(1);
    const seen = [];
    for (let step = 0; step < 4; step++) { await vi.advanceTimersByTimeAsync(200); seen.push(source(image)); }
    expect(seen).toEqual(['/frames/a1.png', '/frames/a2.png', '/frames/a3.png', '/frames/a0.png']);
    expect(vi.getTimerCount()).toBe(1);
    player.dispose();
    expect(source(image)).toBe('/masters/alistair.png');
    expect(actor.dataset.frameAnimation).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('falls back to the master when a frame cannot be loaded, and tries again when the phase returns', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    let missing = true;
    const decode = vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (this: HTMLImageElement) {
      return missing && this.src.endsWith('/a2.png') ? Promise.reject(new Error('missing frame')) : Promise.resolve();
    });
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(actor.dataset.frameAnimationState).toBe('FALLBACK_MASTER');
    expect(source(image)).toBe('/masters/alistair.png');
    expect(vi.getTimerCount()).toBe(0);
    missing = false;
    player.sync('OTHER_PHASE', [actor]);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(0);
    expect(decode).toHaveBeenCalledTimes(5);
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    player.dispose();
  });

  it('keeps the master without a clock while frames have not arrived, then plays once they load even if decode is held back', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    const frames = manualDecode();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(actor.dataset.frameAnimationState).toBe('LOADING');
    expect(source(image)).toBe('/masters/alistair.png');
    expect(vi.getTimerCount()).toBe(0);
    frames.loadAll();
    await vi.advanceTimersByTimeAsync(0);
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    expect(source(image)).toBe('/frames/a0.png');
    await vi.advanceTimersByTimeAsync(200);
    expect(source(image)).toBe('/frames/a1.png');
    player.dispose();
  });

  it('falls back to the master when a frame reports a load error', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    const frames = manualDecode();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    frames.pending[1]!.image.dispatchEvent(new Event('error'));
    frames.loadAll();
    await vi.advanceTimersByTimeAsync(0);
    expect(actor.dataset.frameAnimationState).toBe('FALLBACK_MASTER');
    expect(source(image)).toBe('/masters/alistair.png');
    expect(vi.getTimerCount()).toBe(0);
    player.dispose();
  });

  it('abandons a load still in flight when disposed', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    const frames = manualDecode();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    expect(frames.pending).toHaveLength(4);
    player.dispose();
    expect(vi.getTimerCount()).toBe(0);
    frames.resolveAll();
    await vi.advanceTimersByTimeAsync(1000);
    expect(source(image)).toBe('/masters/alistair.png');
    expect(actor.dataset.frameAnimationState).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows the fixed master under game or OS reduction without loading frames or running a clock', async () => {
    vi.useFakeTimers();
    for (const [game, os] of [[true, false], [false, true]] as const) {
      stubMotion(os); stubVisibility();
      const decoded = decodedSources();
      const { actor, image } = stagedActor();
      const player = new NarrativeActorFramePlayer([IDLE], game);
      player.sync('IDLE_PHASE', [actor]);
      await vi.advanceTimersByTimeAsync(1000);
      expect(actor.dataset.frameAnimationState).toBe('STILL_REDUCED_MOTION');
      expect(source(image)).toBe('/masters/alistair.png');
      expect(decoded).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
      player.dispose();
      vi.restoreAllMocks();
    }
  });

  it('applies an OS preference change at once in both directions and removes both listeners on dispose', async () => {
    vi.useFakeTimers();
    const motion = stubMotion(false); stubVisibility();
    const removed = vi.spyOn(document, 'removeEventListener');
    decodedSources();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(0);
    expect(source(image)).toBe('/frames/a0.png');
    await vi.advanceTimersByTimeAsync(200);
    expect(source(image)).toBe('/frames/a1.png');
    motion.set(true);
    expect(actor.dataset.frameAnimationState).toBe('STILL_REDUCED_MOTION');
    expect(source(image)).toBe('/masters/alistair.png');
    expect(vi.getTimerCount()).toBe(0);
    motion.set(false);
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    expect(source(image)).toBe('/frames/a1.png');
    expect(vi.getTimerCount()).toBe(1);
    player.dispose();
    expect(motion.listeners.size).toBe(0);
    expect(visibilityCalls(removed)).toBe(1);
  });

  it('pauses while the page is hidden, loads nothing before it is visible, and resumes', async () => {
    vi.useFakeTimers();
    stubMotion(false);
    const setVisibility = stubVisibility('hidden');
    const decoded = decodedSources();
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(actor.dataset.frameAnimationState).toBe('PAUSED_HIDDEN');
    expect(source(image)).toBe('/masters/alistair.png');
    expect(decoded).toEqual([]);
    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(0);
    expect(decoded).toHaveLength(4);
    expect(source(image)).toBe('/frames/a0.png');
    setVisibility('hidden');
    expect(actor.dataset.frameAnimationState).toBe('PAUSED_HIDDEN');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(source(image)).toBe('/frames/a0.png');
    setVisibility('visible');
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    await vi.advanceTimersByTimeAsync(200);
    expect(source(image)).toBe('/frames/a1.png');
    player.dispose();
  });

  it('runs no clock for a detached actor until it is mounted and refreshed', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    decodedSources();
    const { actor, image } = stagedActor('alistair', '/masters/alistair.png', false);
    const player = new NarrativeActorFramePlayer([IDLE], false);
    player.sync('IDLE_PHASE', [actor]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
    document.body.append(actor);
    player.refresh();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(source(image)).toBe('/frames/a1.png');
    actor.remove();
    await vi.advanceTimersByTimeAsync(200);
    expect(source(image)).toBe('/frames/a1.png');
    expect(vi.getTimerCount()).toBe(0);
    player.dispose();
  });

  it('switches the appearance of a kept actor when its phase loses, regains or changes the binding', async () => {
    vi.useFakeTimers();
    const motion = stubMotion(false); stubVisibility();
    decodedSources();
    const { actor, image } = stagedActor();
    const marian = stagedActor('marian', '/masters/marian.png');
    const alert: NarrativeActorFrameBinding = { ...IDLE, phaseIds: ['ALERT_PHASE'], animation: { ...IDLE.animation, id: 'alistair-alert-test', frames: ['/frames/b0.png', '/frames/b1.png'] } };
    const player = new NarrativeActorFramePlayer([IDLE, alert], false);
    player.sync('IDLE_PHASE', [actor, marian.actor]);
    await vi.advanceTimersByTimeAsync(0);
    expect(source(image)).toBe('/frames/a0.png');
    expect(marian.actor.dataset.frameAnimation).toBeUndefined();
    player.sync('OTHER_PHASE', [actor, marian.actor]);
    expect(source(image)).toBe('/masters/alistair.png');
    expect(actor.dataset.frameAnimation).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    expect(motion.listeners.size).toBe(0);
    player.sync('IDLE_PHASE', [actor, marian.actor]);
    await vi.advanceTimersByTimeAsync(0);
    expect(actor.dataset.frameAnimationState).toBe('PLAYING');
    player.sync('ALERT_PHASE', [actor, marian.actor]);
    await vi.advanceTimersByTimeAsync(0);
    expect(actor.dataset.frameAnimation).toBe('alistair-alert-test');
    expect(source(image)).toBe('/frames/b0.png');
    expect(source(marian.image)).toBe('/masters/marian.png');
    player.dispose();
  });

  it('adds listeners only while an actor is animated', () => {
    vi.useFakeTimers();
    const motion = stubMotion(false); stubVisibility();
    const added = vi.spyOn(document, 'addEventListener');
    decodedSources();
    const { actor } = stagedActor();
    const unbound = new NarrativeActorFramePlayer([], false);
    unbound.sync('IDLE_PHASE', [actor]);
    unbound.dispose();
    const bound = new NarrativeActorFramePlayer([IDLE], false);
    bound.sync('OTHER_PHASE', [actor]);
    expect(motion.listeners.size).toBe(0);
    expect(visibilityCalls(added)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    bound.sync('IDLE_PHASE', [actor]);
    expect(motion.listeners.size).toBe(1);
    expect(visibilityCalls(added)).toBe(1);
    bound.dispose();
  });

  it('leaves the masters in place when the optional layer fails', () => {
    vi.useFakeTimers();
    stubVisibility();
    // An older WebView whose MediaQueryList has no addEventListener.
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const { actor, image } = stagedActor();
    const player = new NarrativeActorFramePlayer([IDLE], false);
    expect(() => player.sync('IDLE_PHASE', [actor])).not.toThrow();
    expect(source(image)).toBe('/masters/alistair.png');
    expect(actor.dataset.frameAnimation).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => player.sync('IDLE_PHASE', [actor])).not.toThrow();
  });
});

describe('NarrativeSceneSurface frame animation', () => {
  afterEach(cleanUp);

  const CAMP_BINDING: NarrativeActorFrameBinding = { ...IDLE, tableauId: CAMP_DEPARTURE_TABLEAU.id, phaseIds: ['CAMP_DEPARTURE', 'RETURN'] };
  const otherAttributes = (element: Element) => [...element.attributes]
    .filter((attribute) => attribute.name !== 'src' && !attribute.name.startsWith('data-frame-'))
    .map((attribute) => `${attribute.name}=${attribute.value}`);

  function mountedCamp(tableau: NarrativeTableauSpec = CAMP_DEPARTURE_TABLEAU, options: { reducedMotion?: boolean } = {}) {
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, tableau, { ...options, frameBindings: [CAMP_BINDING] });
    surface.mount('/camp.webp');
    const actor = (id = 'alistair') => surface.castLayer.querySelector<HTMLElement>(`[data-actor-id="${id}"]`);
    return { surface, actor };
  }

  it('animates one bound actor by swapping only its image source', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    decodedSources();
    const before = JSON.stringify(CAMP_DEPARTURE_TABLEAU);
    const { surface, actor } = mountedCamp();
    await vi.advanceTimersByTimeAsync(1000);
    const alistair = actor()!;
    const image = alistair.querySelector('img')!;
    expect(alistair.dataset.frameAnimationState).toBe('PLAYING');
    expect(surface.castLayer.querySelectorAll('[data-frame-animation]')).toHaveLength(1);
    expect(surface.castLayer.childElementCount).toBe(3);
    const figure = otherAttributes(alistair);
    const img = otherAttributes(image);
    const shown = image.getAttribute('src');
    await vi.advanceTimersByTimeAsync(200);
    expect(image.getAttribute('src')).not.toBe(shown);
    expect(actor()).toBe(alistair);
    expect(alistair.querySelector('img')).toBe(image);
    expect(otherAttributes(alistair)).toEqual(figure);
    expect(otherAttributes(image)).toEqual(img);
    expect(JSON.stringify(CAMP_DEPARTURE_TABLEAU)).toBe(before);
    surface.dispose();
    await vi.runAllTimersAsync();
    expect(vi.getTimerCount()).toBe(0);
    expect(image.getAttribute('src')).not.toMatch(/\/frames\//);
  });

  it('starts the clock when a surface prepared while detached is mounted', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    decodedSources();
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, CAMP_DEPARTURE_TABLEAU, { frameBindings: [CAMP_BINDING] });
    surface.prepare('/camp.webp');
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
    surface.mount('/camp.webp');
    const image = surface.castLayer.querySelector<HTMLElement>('[data-actor-id="alistair"] img')!;
    const shown = image.getAttribute('src');
    await vi.advanceTimersByTimeAsync(200);
    expect(image.getAttribute('src')).not.toBe(shown);
    expect(image.getAttribute('src')).toMatch(/\/frames\//);
    surface.dispose();
  });

  it('follows phase changes with kept DOM, an exit and a re-entry', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    decodedSources();
    const base = CAMP_DEPARTURE_TABLEAU.phases![0]!;
    const tableau: NarrativeTableauSpec = {
      ...CAMP_DEPARTURE_TABLEAU,
      phases: [
        base,
        { ...base, id: 'UNBOUND' },
        { ...base, id: 'WITHOUT_ALISTAIR', staticCast: base.staticCast.filter((spec) => spec.actorId !== 'alistair') },
        { ...base, id: 'RETURN' },
      ],
    };
    const { surface, actor } = mountedCamp(tableau);
    const change = async (phaseId: string) => { const done = surface.setPhase(phaseId); await vi.advanceTimersByTimeAsync(1000); await done; };
    await vi.advanceTimersByTimeAsync(1000);
    const first = actor()!;
    expect(first.dataset.frameAnimationState).toBe('PLAYING');
    await change('UNBOUND');
    expect(actor()).toBe(first);
    expect(first.dataset.frameAnimation).toBeUndefined();
    expect(first.querySelector('img')!.getAttribute('src')).not.toMatch(/\/frames\//);
    expect(vi.getTimerCount()).toBe(0);
    await change('CAMP_DEPARTURE');
    expect(first.dataset.frameAnimationState).toBe('PLAYING');
    await change('WITHOUT_ALISTAIR');
    expect(actor()).toBeNull();
    expect(first.dataset.frameAnimation).toBeUndefined();
    expect(surface.castLayer.querySelectorAll('[data-frame-animation]')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    await change('RETURN');
    const returned = actor()!;
    expect(returned).not.toBe(first);
    expect(returned.dataset.frameAnimationState).toBe('PLAYING');
    expect(surface.castLayer.childElementCount).toBe(3);
    surface.dispose();
    await vi.runAllTimersAsync();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the master under the game reduced-motion option', async () => {
    vi.useFakeTimers();
    stubMotion(false); stubVisibility();
    const decoded = decodedSources();
    const { surface, actor } = mountedCamp(CAMP_DEPARTURE_TABLEAU, { reducedMotion: true });
    await vi.runAllTimersAsync();
    expect(actor()!.dataset.frameAnimationState).toBe('STILL_REDUCED_MOTION');
    expect(actor()!.querySelector('img')!.getAttribute('src')).not.toMatch(/\/frames\//);
    expect(decoded.filter((decodedSource) => decodedSource.includes('/frames/'))).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    surface.dispose();
  });

  it('keeps every existing tableau inert by default', async () => {
    vi.useFakeTimers();
    const motion = stubMotion(false); stubVisibility();
    const added = vi.spyOn(document, 'addEventListener');
    decodedSources();
    const root = document.createElement('div');
    document.body.append(root);
    const surface = new NarrativeSceneSurface(root, CAMP_DEPARTURE_TABLEAU);
    surface.mount('/camp.webp');
    await vi.runAllTimersAsync();
    expect(surface.castLayer.querySelectorAll('[data-frame-animation], [data-frame-animation-state]')).toHaveLength(0);
    expect(motion.listeners.size).toBe(0);
    expect(visibilityCalls(added)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    surface.dispose();
  });
});
