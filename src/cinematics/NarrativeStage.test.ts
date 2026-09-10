// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dialogues } from '../game/content';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';
import { NarrativeStage } from './NarrativeStage';
import { ALARIC_AUDIENCE_TABLEAU, CAMP_DEPARTURE_TABLEAU, type NarrativeTableauSpec } from './NarrativeTableau';

const manifest = {
  version: 1 as const,
  cinematics: [
    { id: 'intro', title: 'Intro', sources: [{ src: '/intro.mp4', type: 'video/mp4' as const }] },
    { id: 'reaction', title: 'Reaction', sources: [{ src: '/reaction.mp4', type: 'video/mp4' as const }] },
  ],
};

function createStage(tableau: NarrativeTableauSpec = CAMP_DEPARTURE_TABLEAU, mediaMode: 'STILL' | 'VIDEO' = 'VIDEO') {
  const registry = new CinematicRegistry(manifest);
  const player = new CinematicPlayer(registry);
  const stage = new NarrativeStage({ player, registry, mediaMode });
  stage.setTableau(tableau);
  return { player, registry, stage };
}

function prepareDecodedFrame(width = 1920, height = 1080): HTMLVideoElement {
  const video = document.querySelector<HTMLVideoElement>('video');
  if (!video) throw new Error('Expected video');
  Object.defineProperties(video, {
    videoWidth: { configurable: true, value: width },
    videoHeight: { configurable: true, value: height },
    readyState: { configurable: true, value: 2 },
  });
  return video;
}

describe('NarrativeStage', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('mounts one stage with explicit media, dialogue, agency, transition, and utility layers', async () => {
    const { stage } = createStage();
    await stage.presentPaintedFallback('Camp');
    expect(document.querySelectorAll('.narrative-stage')).toHaveLength(1);
    expect(stage.element.dataset.narrativeTableau).toBe('CAMP_DEPARTURE_TABLEAU');
    expect([...stage.element.querySelectorAll('[data-narrative-layer]')].map((layer) => (layer as HTMLElement).dataset.narrativeLayer)).toEqual([
      'media', 'dialogue', 'agency', 'transition', 'utility',
    ]);
    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    stage.dispose();
    expect(document.querySelector('.narrative-stage')).toBeNull();
  });

  it('owns the live canvas and settles the same surface to a held frame', async () => {
    const { stage } = createStage(ALARIC_AUDIENCE_TABLEAU);
    stage.bindDialogue(dialogues.get('lion_briefing')!);
    const pending = stage.presentCinematic('intro', { reducedMotion: false, passive: true });
    expect(stage.currentMediaSurfaceKind).toBe('VIDEO');
    expect(document.querySelectorAll('.narrative-stage video')).toHaveLength(1);
    expect(document.querySelectorAll('.narrative-stage canvas')).toHaveLength(1);
    expect(document.querySelectorAll('.narrative-scene-surface, .narrative-cast__actor')).toHaveLength(0);
    expect(document.querySelector('.cinematic-overlay--passive')?.getAttribute('aria-modal')).toBeNull();
    prepareDecodedFrame().dispatchEvent(new Event('ended'));
    await expect(pending).resolves.toMatchObject({ reason: 'ended', played: true });
    expect(stage.currentMediaSurfaceKind).toBe('HELD_VIDEO');
    expect(stage.frozenSurface?.dataset.cinematicFreezeSurface).toBe('canvas');
    expect(document.querySelectorAll('.narrative-stage canvas')).toHaveLength(1);
    expect(document.querySelectorAll('.narrative-scene-surface, .narrative-cast__actor')).toHaveLength(0);
  });

  it('uses a composed static tableau as the primary still authoring surface', async () => {
    const { stage } = createStage(ALARIC_AUDIENCE_TABLEAU, 'STILL');
    stage.bindDialogue({ id: 'test', steps: [] });
    await stage.presentCinematic('intro');
    expect(stage.currentMediaSurfaceKind).toBe('STILL');
    expect(stage.element.dataset.narrativeAuthoringMedia).toBe('STILL');
    expect(document.querySelector('.narrative-scene-surface__environment')).not.toBeNull();
    expect(document.querySelector('video')).toBeNull();
  });

  it('uses a painted scene when media is unavailable and still reaches agency', async () => {
    const { stage } = createStage();
    await expect(stage.presentPaintedFallback('Forest', '/forest.webp')).resolves.toMatchObject({ reason: 'unavailable' });
    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    expect(document.querySelector<HTMLElement>('.narrative-scene-surface__environment')?.style.backgroundImage).toContain('/forest.webp');
    expect(stage.element.dataset.narrativeCastOwnership).toBe('STAGE_OWNS_CAST');
    const commit = stage.requestAgency({ mode: 'single', choices: [], continueLabel: 'Continuer' });
    document.querySelector<HTMLButtonElement>('[data-journey-continue]')?.click();
    await expect(commit).resolves.toEqual({ kind: 'continue', id: null });
  });

  it('owns a passive backdrop and releases its canvas backing memory', async () => {
    const { stage } = createStage();
    const backdrop = document.createElement('canvas');
    backdrop.width = 1920;
    backdrop.height = 1080;
    await stage.presentPassiveBackdrop(backdrop);
    expect(stage.currentMediaSurfaceKind).toBe('PASSIVE_BACKDROP');
    expect(stage.frozenSurface).toBe(backdrop);
    stage.dispose();
    expect(backdrop.width).toBe(0);
    expect(backdrop.height).toBe(0);
    expect(backdrop.isConnected).toBe(false);
  });

  it('keeps utility actions separate and commits only one owner', async () => {
    const { stage } = createStage();
    await stage.presentPaintedFallback('Camp');
    const commit = stage.requestAgency({
      mode: 'single',
      choices: [],
      secondary: [{ id: 'COMPANY', label: 'Compagnie' }, { id: 'SAVE', label: 'Sauvegarder' }, { id: 'MENU', label: 'Menu' }],
    });
    const dock = document.querySelector('.narrative-utility-dock');
    expect(dock?.parentElement).toBe(stage.utilityLayer);
    expect(dock?.getAttribute('aria-label')).toBe('Utilitaires de la chronique');
    document.querySelector<HTMLButtonElement>('[data-journey-secondary="SAVE"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-journey-secondary="MENU"]')?.click();
    await expect(commit).resolves.toEqual({ kind: 'secondary', id: 'SAVE' });
    expect(document.querySelector('.narrative-utility-dock')).toBeNull();
    expect(dock?.classList.contains('narrative-utility-dock')).toBe(false);
    expect(dock?.hasAttribute('role')).toBe(false);
    expect(dock?.hasAttribute('aria-label')).toBe(false);
  });

  it('replaces intro with optional reaction media without leaving duplicate owners', async () => {
    const multi: NarrativeTableauSpec = {
      ...CAMP_DEPARTURE_TABLEAU,
      media: [
        { phase: 'INTRO_MEDIA', cinematicId: 'intro' },
        { phase: 'REACTION_MEDIA', cinematicId: 'reaction', optional: true },
      ],
      beats: [
        { id: 'intro', kind: 'VISUAL', mediaPhase: 'INTRO_MEDIA', skippable: true },
        { id: 'choice', kind: 'SPATIAL_CHOICE', dialogueStepId: '1', skippable: false },
        { id: 'reaction', kind: 'VISUAL', mediaPhase: 'REACTION_MEDIA', skippable: true },
      ],
    };
    const { stage } = createStage(multi);
    const intro = stage.presentCinematic('intro', { reducedMotion: false }, null, 'INTRO_MEDIA');
    prepareDecodedFrame().dispatchEvent(new Event('ended'));
    await intro;
    const reaction = stage.presentCinematic('reaction', { reducedMotion: false }, null, 'REACTION_MEDIA');
    const videos = document.querySelectorAll<HTMLVideoElement>('video');
    const activeVideo = videos[videos.length - 1]!;
    Object.defineProperties(activeVideo, {
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1080 },
      readyState: { configurable: true, value: 2 },
    });
    activeVideo.dispatchEvent(new Event('ended'));
    await reaction;
    expect(stage.element.dataset.narrativeMediaPhase).toBe('REACTION_MEDIA');
    expect(document.querySelectorAll('.cinematic-overlay')).toHaveLength(1);
    expect(document.querySelectorAll('video')).toHaveLength(1);
    expect(document.querySelectorAll('canvas')).toHaveLength(1);
  });

  it('reduced motion reaches a functional painted fallback', async () => {
    const { stage } = createStage();
    await expect(stage.presentCinematic('intro', { reducedMotion: true })).resolves.toMatchObject({ reason: 'reduced-motion' });
    expect(stage.state).toBe('FREEZE');
    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    expect(document.querySelector('video')).toBeNull();
  });

  it('skip advances visual presentation but not input beats', async () => {
    const { stage } = createStage();
    const pending = stage.presentCinematic('intro', { reducedMotion: false });
    prepareDecodedFrame();
    stage.skipPresentation();
    await expect(pending).resolves.toMatchObject({ reason: 'aborted' });
    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    expect(stage.element.dataset.narrativeBeat).toBe('departure-continue');
    stage.skipPresentation();
    expect(stage.element.dataset.narrativeBeat).toBe('departure-continue');
  });

  it('does not skip an unrelated playback on the shared player', async () => {
    const { player, stage } = createStage();
    const unrelated = player.playHeld('intro', { reducedMotion: false });
    stage.skipPresentation();
    expect(player.activeId).toBe('intro');
    player.abort();
    const held = await unrelated;
    expect(held.result).toMatchObject({ reason: 'aborted' });
    held.release();
  });

  it('exposes dialogue beat and restrained transition state', async () => {
    const { stage } = createStage(ALARIC_AUDIENCE_TABLEAU);
    await stage.presentPaintedFallback('Audience');
    stage.activateDialogueStep('3', 'SPATIAL_CHOICE', 'clan-side', undefined, undefined, undefined, undefined, undefined, 'STATIC_TABLEAU');
    expect(stage.element.dataset.narrativeBeat).toBe('maelor-agency');
    expect(stage.element.dataset.narrativeDialogueMode).toBe('SPATIAL_CHOICE');
    expect(stage.element.dataset.narrativeAnchor).toBe('clan-side');
    expect(stage.element.dataset.narrativeDialogueSurfaceMode).toBe('STATIC_TABLEAU');
    stage.beginTransition('ATMOSPHERIC_DISSOLVE');
    expect(stage.transitionLayer.dataset.transition).toBe('ATMOSPHERIC_DISSOLVE');
  });

  it('blocks stale agency while a new surface is preparing and lowers only for a covered handoff', async () => {
    const { stage } = createStage(ALARIC_AUDIENCE_TABLEAU);
    const media = stage.presentCinematic('intro', { reducedMotion: false });
    expect(stage.element.dataset.narrativeInteraction).toBe('LOCKED');
    await expect(stage.requestAgency({ mode: 'single', choices: [] })).resolves.toEqual({ kind: 'aborted', id: null });
    expect(stage.element.dataset.narrativeInteractionBlocked).toBe('agency-before-surface-ready');
    prepareDecodedFrame().dispatchEvent(new Event('ended'));
    await media;
    stage.prepareGlobalHandoff();
    expect(stage.element.classList.contains('narrative-stage--handoff')).toBe(true);
    expect(stage.dialogueLayer.inert).toBe(true);
    expect(stage.agencyLayer.inert).toBe(true);
  });

  it('has explicit responsive and reduced-motion presentation rules', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8');
    expect(css).toContain('@media (max-width:900px),(max-height:780px)');
    expect(css).toContain('@media (max-width:680px)');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.narrative-stage,\.narrative-stage \*/);
    expect(css).toContain('.dialogue--spatial-choice .dialogue__choices');
    expect(css).toContain('.narrative-utility-dock');
    expect(css).toContain('.dialogue--narrative.dialogue--choice-active .dialogue__box { display:none; }');
    expect(css).toMatch(/\.dialogue--narrative \.dialogue__box \{[^}]*overflow:hidden;/);
    expect(css).toContain('content:attr(data-final-text)');
  });

  it('repeated lifecycle leaves no media, canvas, listener-owned surface, or modal residue', async () => {
    for (let index = 0; index < 3; index += 1) {
      const { stage } = createStage();
      await stage.presentPaintedFallback(`Fallback ${index}`);
      const pending = stage.requestAgency({ mode: 'single', choices: [] });
      stage.dispose();
      await expect(pending).resolves.toEqual({ kind: 'aborted', id: null });
    }
    expect(document.querySelectorAll('.narrative-stage, .cinematic-overlay, .journey-overlay, .journey-surface, video, canvas, [aria-modal="true"]')).toHaveLength(0);
  });
});
