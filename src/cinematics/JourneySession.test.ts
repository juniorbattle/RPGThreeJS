// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';
import { JourneySession } from './JourneySession';
import {
  canJourneyTransition,
  JOURNEY_STATE_TRANSITIONS,
  type JourneyCommit,
  type JourneySessionState,
} from './JourneyTypes';

const manifest = {
  version: 1 as const,
  cinematics: [
    { id: 'hold', title: 'Hold', sources: [], fallbackText: 'Étape', placeholderOnly: true },
    { id: 'clip', title: 'Clip', sources: [{ src: '/clip.webm', type: 'video/webm' as const }] },
  ],
};

const HOLD = { reducedMotion: false, placeholderDurationMs: 5 } as const;
const LONG_HOLD = { reducedMotion: false, placeholderDurationMs: 5_000 } as const;

function createSession() {
  const registry = new CinematicRegistry(manifest);
  const player = new CinematicPlayer(registry);
  return { registry, player, session: new JourneySession({ player, registry }) };
}

function clickChoice(id: string): void {
  document.querySelector<HTMLButtonElement>(`[data-journey-choice="${id}"]`)?.click();
}

describe('journey session', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('walks IDLE → PLAYING → FREEZE → AGENCY → TRANSITIONING → DISPOSED', async () => {
    const { session } = createSession();
    expect(session.state).toBe('IDLE');
    const present = session.presentCinematic('hold', HOLD);
    expect(session.state).toBe('PLAYING');
    await present;
    expect(session.state).toBe('FREEZE');
    const commit = session.requestAgency({ choices: [{ id: 'route-a', label: 'Route A' }] });
    expect(session.state).toBe('AGENCY');
    clickChoice('route-a');
    await expect(commit).resolves.toEqual({ kind: 'choice', id: 'route-a' });
    expect(session.state).toBe('TRANSITIONING');
    session.dispose();
    expect(session.stateTrace).toEqual(['IDLE', 'PLAYING', 'FREEZE', 'AGENCY', 'TRANSITIONING', 'DISPOSED']);
  });

  it('declares a transition table with no self loops and a terminal DISPOSED state', () => {
    const states: readonly JourneySessionState[] = ['IDLE', 'PLAYING', 'FREEZE', 'AGENCY', 'TRANSITIONING', 'DISPOSED'];
    for (const state of states) {
      expect(canJourneyTransition(state, state)).toBe(false);
      expect(canJourneyTransition(state, 'DISPOSED')).toBe(state !== 'DISPOSED');
    }
    expect(JOURNEY_STATE_TRANSITIONS.DISPOSED).toHaveLength(0);
    expect(canJourneyTransition('IDLE', 'FREEZE')).toBe(false);
    expect(canJourneyTransition('PLAYING', 'AGENCY')).toBe(false);
    expect(canJourneyTransition('AGENCY', 'PLAYING')).toBe(false);
    expect(canJourneyTransition('DISPOSED', 'PLAYING')).toBe(false);
  });

  it('refuses a concurrent presentation instead of completing twice', async () => {
    const { session } = createSession();
    const first = session.presentCinematic('hold', HOLD);
    await expect(session.presentCinematic('hold', HOLD)).resolves.toMatchObject({ reason: 'busy', played: false });
    await first;
    expect(session.state).toBe('FREEZE');
    expect(document.querySelectorAll('.cinematic-overlay')).toHaveLength(1);
  });

  it('reports no decision when agency cannot be presented', async () => {
    const { session } = createSession();
    const present = session.presentCinematic('hold', HOLD);
    await expect(session.requestAgency({ choices: [] })).resolves.toEqual({ kind: 'aborted', id: null });
    expect(document.querySelector('.journey-overlay')).toBeNull();
    await present;
  });

  it('keeps the ended presentation mounted and disposes it when the freeze is released', async () => {
    const { session } = createSession();
    const present = session.presentCinematic('clip', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('loadeddata'));
    document.querySelector('video')?.dispatchEvent(new Event('ended'));
    await expect(present).resolves.toMatchObject({ reason: 'ended', played: true });
    expect(session.state).toBe('FREEZE');
    expect(session.frozenSurface).toBe(document.querySelector('.cinematic-overlay'));
    expect(document.querySelector('.cinematic-overlay--frozen')).not.toBeNull();
    session.releaseFreeze();
    expect(session.frozenSurface).toBeNull();
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(session.state).toBe('IDLE');
  });

  it('reaches the same agency boundary after a skipped clip', async () => {
    const { session } = createSession();
    const present = session.presentCinematic('clip', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('loadeddata'));
    document.querySelector<HTMLButtonElement>('.cinematic-overlay__skip')?.click();
    await expect(present).resolves.toMatchObject({ reason: 'skipped' });
    expect(session.state).toBe('FREEZE');
    const commit = session.requestAgency({ choices: [{ id: 'onward', label: 'Onward' }] });
    expect(session.state).toBe('AGENCY');
    clickChoice('onward');
    await expect(commit).resolves.toEqual({ kind: 'choice', id: 'onward' });
    expect(session.state).toBe('TRANSITIONING');
  });

  it('reaches agency on a neutral surface when the cinematic is unavailable', async () => {
    const { session } = createSession();
    await expect(session.presentCinematic('absent', { reducedMotion: false })).resolves.toMatchObject({ reason: 'unavailable' });
    expect(session.state).toBe('FREEZE');
    expect(document.querySelector<HTMLElement>('.journey-surface')?.dataset.journeyFallback).toBe('unavailable');
    const commit = session.requestAgency({ choices: [] });
    expect(session.state).toBe('AGENCY');
    document.querySelector<HTMLButtonElement>('[data-journey-continue]')?.click();
    await expect(commit).resolves.toEqual({ kind: 'continue', id: null });
  });

  it('reaches agency under reduced motion without mounting a player', async () => {
    const { session } = createSession();
    await expect(session.presentCinematic('clip', { reducedMotion: true })).resolves.toMatchObject({ reason: 'reduced-motion' });
    expect(session.state).toBe('FREEZE');
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(document.querySelector('.journey-surface')).not.toBeNull();
    const commit = session.requestAgency({ choices: [{ id: 'onward', label: 'Onward' }] });
    expect(session.state).toBe('AGENCY');
    clickChoice('onward');
    await expect(commit).resolves.toEqual({ kind: 'choice', id: 'onward' });
  });

  it('reaches a safe agency surface after a media error', async () => {
    const { session } = createSession();
    const present = session.presentCinematic('clip', { reducedMotion: false });
    document.querySelector('video')?.dispatchEvent(new Event('error'));
    await expect(present).resolves.toMatchObject({ reason: 'error', played: false });
    expect(session.state).toBe('FREEZE');
    expect(document.querySelector<HTMLElement>('.cinematic-overlay__fallback')?.hidden).toBe(false);
    const commit = session.requestAgency({ choices: [{ id: 'onward', label: 'Onward' }] });
    clickChoice('onward');
    await expect(commit).resolves.toEqual({ kind: 'choice', id: 'onward' });
  });

  it('commits a route at most once even if buttons are clicked again', async () => {
    const { session } = createSession();
    await session.presentCinematic('hold', HOLD);
    const commits: JourneyCommit[] = [];
    const pending = session.requestAgency({
      choices: [{ id: 'route-a', label: 'A' }, { id: 'route-b', label: 'B' }],
    });
    void pending.then((commit) => commits.push(commit));
    clickChoice('route-a');
    clickChoice('route-a');
    clickChoice('route-b');
    await pending;
    expect(commits).toEqual([{ kind: 'choice', id: 'route-a' }]);
    expect(session.state).toBe('TRANSITIONING');
  });

  it('settles pending agency as a non-decision when the session is disposed', async () => {
    const { session } = createSession();
    await session.presentCinematic('hold', HOLD);
    const pending = session.requestAgency({ choices: [{ id: 'route-a', label: 'A' }] });
    session.dispose();
    await expect(pending).resolves.toEqual({ kind: 'aborted', id: null });
    expect(session.state).toBe('DISPOSED');
    expect(document.querySelector('.journey-overlay')).toBeNull();
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
  });

  it('releases DOM, media and preloads when disposed mid-playback', async () => {
    const { session } = createSession();
    session.preloadCandidates(['clip']);
    expect(session.candidatePreloader.size).toBe(1);
    const present = session.presentCinematic('hold', LONG_HOLD);
    session.dispose();
    await expect(present).resolves.toMatchObject({ reason: 'aborted' });
    expect(session.state).toBe('DISPOSED');
    expect(session.candidatePreloader.size).toBe(0);
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(document.querySelector('.journey-surface')).toBeNull();
    expect(session.stateTrace).toEqual(['IDLE', 'PLAYING', 'DISPOSED']);
  });

  it('is inert after disposal', async () => {
    const { session } = createSession();
    session.dispose();
    await expect(session.presentCinematic('hold', HOLD)).resolves.toMatchObject({ reason: 'aborted' });
    await expect(session.requestAgency({ choices: [] })).resolves.toEqual({ kind: 'aborted', id: null });
    session.preloadCandidates(['clip']);
    expect(session.candidatePreloader.size).toBe(0);
    expect(session.beginTransition()).toBe(false);
    expect(document.querySelector('.cinematic-overlay')).toBeNull();
    expect(document.querySelector('.journey-overlay')).toBeNull();
  });

  it('supports a one-successor continuation without ever showing agency', async () => {
    const { session } = createSession();
    await session.presentCinematic('hold', HOLD);
    expect(session.beginTransition()).toBe(true);
    expect(session.state).toBe('TRANSITIONING');
    expect(session.beginTransition()).toBe(false);
    await session.presentCinematic('hold', HOLD);
    expect(session.state).toBe('FREEZE');
    expect(document.querySelector('.journey-overlay')).toBeNull();
    expect(document.querySelectorAll('.cinematic-overlay')).toHaveLength(1);
    session.dispose();
  });

  it('notifies state changes exactly once per transition', async () => {
    const registry = new CinematicRegistry(manifest);
    const player = new CinematicPlayer(registry);
    const seen: JourneySessionState[] = [];
    const session = new JourneySession({ player, registry, onStateChange: (state) => seen.push(state) });
    await session.presentCinematic('hold', HOLD);
    session.dispose();
    expect(seen).toEqual(['PLAYING', 'FREEZE', 'DISPOSED']);
  });

  it('never depends on gameplay state', () => {
    const sources = ['JourneySession.ts', 'JourneyOverlay.ts', 'JourneyTypes.ts', 'CinematicPreloader.ts', 'JourneyQaScenarios.ts'];
    for (const file of sources) {
      const raw = readFileSync(join(process.cwd(), 'src', 'cinematics', file), 'utf-8');
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      const specifiers = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1] ?? '');
      expect(specifiers.filter((specifier) => !specifier.startsWith('./'))).toEqual([]);
      expect(code).not.toMatch(/GameState|enterRunNode|runSystem|combatConfigs|SaveRepository|DialogueView|TravelView/);
    }
  });
});
