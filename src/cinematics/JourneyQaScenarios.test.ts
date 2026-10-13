// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatJourneyQaOutcome,
  JOURNEY_QA_MANIFEST,
  JOURNEY_QA_SCENARIOS,
  runJourneyQaScenario,
  type JourneyQaScenarioContext,
  type JourneyQaScenarioOutcome,
} from './JourneyQaScenarios';
import { parseVideoCinematicManifest } from './CinematicRegistry';

/**
 * Clicks whatever affordance the scenario currently exposes: the skip control of a playing
 * cinematic first, then the first enabled Journey affordance. This is the automated stand-in for
 * the human clicking in the DEV QA lab.
 */
function clickInteractive(root: HTMLElement): void {
  const skip = root.querySelector<HTMLButtonElement>('.cinematic-overlay:not(.cinematic-overlay--frozen) .cinematic-overlay__skip');
  if (skip && !skip.hidden) {
    skip.click();
    return;
  }
  root.querySelector<HTMLButtonElement>('.journey-overlay button:not([disabled])')?.click();
}

function context(overrides: Partial<JourneyQaScenarioContext> = {}): JourneyQaScenarioContext {
  return { holdDurationMs: 5, onInteractive: clickInteractive, ...overrides };
}

function run(id: string, overrides: Partial<JourneyQaScenarioContext> = {}): Promise<JourneyQaScenarioOutcome> {
  return runJourneyQaScenario(id, context(overrides));
}

function expectNoResidue(outcome: JourneyQaScenarioOutcome): void {
  expect(outcome.residue).toEqual({ cinematicOverlays: 0, journeyOverlays: 0, journeySurfaces: 0 });
  expect(outcome.trace[outcome.trace.length - 1]).toBe('DISPOSED');
}

describe('journey QA scenarios', () => {
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

  it('exposes exactly the ten CIN-1 scenarios with runnable IDs', async () => {
    expect(JOURNEY_QA_SCENARIOS).toHaveLength(10);
    expect(new Set(JOURNEY_QA_SCENARIOS.map((scenario) => scenario.id)).size).toBe(10);
    for (const scenario of JOURNEY_QA_SCENARIOS) {
      expect(scenario.id.startsWith('journey-')).toBe(true);
      expect(scenario.title.length).toBeGreaterThan(0);
    }
    await expect(runJourneyQaScenario('journey-nope')).resolves.toMatchObject({ summary: expect.stringContaining('inconnu') });
  });

  it('uses a QA-only in-memory manifest that never names a production cinematic', () => {
    expect(parseVideoCinematicManifest(JOURNEY_QA_MANIFEST)).not.toBeNull();
    const ids = JOURNEY_QA_MANIFEST.cinematics.map((descriptor) => descriptor.id);
    expect(ids.every((id) => id.startsWith('journey-qa-'))).toBe(true);
    expect(ids).not.toContain('serpent_general_reveal');
    expect(ids).not.toContain('lion_judgement');
    expect(ids).not.toContain('lion_champion');
  });

  it('1 · proves the full Journey session lifecycle', async () => {
    const outcome = await run('journey-lifecycle');
    expect(outcome.trace).toEqual(['IDLE', 'PLAYING', 'FREEZE', 'AGENCY', 'TRANSITIONING', 'DISPOSED']);
    expect(outcome.commit).toEqual({ kind: 'choice', id: 'qa-continue-route' });
    expect(outcome.details.frozenSurfaceMounted).toBe(true);
    expectNoResidue(outcome);
  });

  it('2 · presents a multi-choice route overlay', async () => {
    const outcome = await run('journey-multi-choice');
    expect(outcome.details).toMatchObject({ choiceButtons: 3, disabledButtons: 1 });
    expect(outcome.commit).toEqual({ kind: 'choice', id: 'qa-route-plains' });
    expectNoResidue(outcome);
  });

  it('3 · presents a single continuation affordance', async () => {
    const outcome = await run('journey-continue');
    expect(outcome.details).toMatchObject({ continueButtons: 1, choiceButtons: 0 });
    expect(outcome.commit).toEqual({ kind: 'continue', id: null });
    expectNoResidue(outcome);
  });

  it('4 · reports secondary action callbacks', async () => {
    const outcome = await run('journey-secondary', {
      onInteractive: (root) => root.querySelector<HTMLButtonElement>('[data-journey-secondary="ROADMAP"]')?.click(),
    });
    expect(outcome.details.secondaryButtons).toBe(5);
    expect(outcome.commit).toEqual({ kind: 'secondary', id: 'ROADMAP' });
    expectNoResidue(outcome);
  });

  it('5 · reaches the same agency boundary after a skip', async () => {
    const outcome = await run('journey-skip');
    expect(outcome.result?.reason).toBe('skipped');
    expect(outcome.details).toMatchObject({ reachedFreeze: true, reachedAgency: true });
    expect(outcome.commit).toEqual({ kind: 'choice', id: 'qa-route-onward' });
    expect(outcome.trace).toEqual(['IDLE', 'PLAYING', 'FREEZE', 'AGENCY', 'TRANSITIONING', 'DISPOSED']);
    expectNoResidue(outcome);
  });

  it('6 · falls back to a neutral surface when media is unavailable', async () => {
    const outcome = await run('journey-unavailable');
    expect(outcome.result?.reason).toBe('unavailable');
    expect(outcome.details).toMatchObject({ neutralFallback: 'unavailable', reachedAgency: true });
    expect(outcome.commit?.kind).toBe('choice');
    expectNoResidue(outcome);
  });

  it('7 · reaches agency under reduced motion', async () => {
    const outcome = await run('journey-reduced-motion');
    expect(outcome.result?.reason).toBe('reduced-motion');
    expect(outcome.details).toMatchObject({ cinematicOverlaysDuringFreeze: 0, reachedAgency: true });
    expectNoResidue(outcome);
  });

  it('8 · cleans up when aborted mid-playback', async () => {
    const outcome = await run('journey-dispose');
    expect(outcome.result?.reason).toBe('aborted');
    expect(outcome.trace).toEqual(['IDLE', 'PLAYING', 'DISPOSED']);
    expect(outcome.commit).toBeUndefined();
    expectNoResidue(outcome);
  });

  it('9 · deduplicates candidate preload requests', async () => {
    const outcome = await run('journey-preload-dedupe');
    expect(outcome.details).toMatchObject({
      videoElementsCreated: 2,
      trackedIds: 4,
      placeholderStatus: 'skipped',
      unknownStatus: 'skipped',
    });
    expectNoResidue(outcome);
  });

  it('10 · releases and clears candidate preloads', async () => {
    const outcome = await run('journey-preload-release');
    expect(outcome.details).toMatchObject({ afterPreload: 2, afterRelease: 1, afterClear: 0, retained: 0 });
    expectNoResidue(outcome);
  });

  it('leaves no residue for any scenario and never mutates a shared registry', async () => {
    for (const scenario of JOURNEY_QA_SCENARIOS) {
      const outcome = await run(scenario.id, {
        onInteractive: (root) => {
          const skip = root.querySelector<HTMLButtonElement>('.cinematic-overlay:not(.cinematic-overlay--frozen) .cinematic-overlay__skip');
          if (skip && !skip.hidden) skip.click();
          else root.querySelector<HTMLButtonElement>('.journey-overlay button:not([disabled])')?.click();
        },
      });
      expectNoResidue(outcome);
      expect(formatJourneyQaOutcome(outcome)).toContain('résidu DOM : cinematic=0');
      expect(document.body.querySelectorAll('.cinematic-overlay, .journey-overlay, .journey-surface')).toHaveLength(0);
    }
    expect(JOURNEY_QA_MANIFEST.cinematics).toHaveLength(4);
  });
});
