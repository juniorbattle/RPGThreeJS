// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';
import { FINAL_PRESENTATION_BEATS } from './FinalPresentationRegistry.generated';
import {
  NARRATIVE_PRESENTATION_MODES,
  NARRATIVE_VISUAL_FAMILIES,
  PLAYER_FACING_SURFACE_MODES,
  holdContinuityMatches,
  type ResolvedPresentationBeat,
} from './NarrativePresentationMode';
import {
  getResolvedPresentationBeat,
  resolveCinematicPresentation,
  resolveDialoguePresentation,
  resolveEdgePresentation,
  resolvePresentationBeat,
  resolvePresentationCandidates,
} from './NarrativePresentationResolver';
import {
  checkPresentationTransition,
  isEpilogueHoldContinuityValid,
  validatePrimarySurface,
  validateResolvedBeatOwnership,
} from './NarrativePresentationTransition';
import { NarrativeStage } from './NarrativeStage';
import { ALARIC_AUDIENCE_TABLEAU } from './NarrativeTableau';
import { TravelStillSurface } from './TravelStillSurface';

type PlannedAudit = {
  beats: Array<{ beatId: string; targetPresentationMode: string; visualFamily: string }>;
  choiceAudit: Array<{ dialogueId: string; visualOwner: string }>;
  ateAudit: Array<{ dialogueId: string; targetPresentationMode: string }>;
};

const audit = JSON.parse(readFileSync(
  resolve(process.cwd(), 'tools/cinematics/specs/final_presentation_mode_audit.json'),
  'utf8',
)) as PlannedAudit;
const beats: readonly ResolvedPresentationBeat[] = FINAL_PRESENTATION_BEATS;

function beat(id: string): ResolvedPresentationBeat {
  const found = getResolvedPresentationBeat(id);
  if (!found) throw new Error(`Missing runtime beat ${id}`);
  return found;
}

describe('CIN-6D.6 presentation runtime', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('defines exactly four narrative modes and keeps gameplay surfaces outside them', () => {
    expect(NARRATIVE_PRESENTATION_MODES).toEqual([
      'CINEMATIC_VIDEO', 'CINEMATIC_HOLD', 'TRAVEL_STILL', 'STATIC_TABLEAU',
    ]);
    expect(PLAYER_FACING_SURFACE_MODES).toEqual([
      ...NARRATIVE_PRESENTATION_MODES, 'COMBAT', 'GAMEPLAY_UI',
    ]);
  });

  it('matches all 144 planned beat identities and exact mode counts', () => {
    expect(beats).toHaveLength(144);
    const runtime = new Map(beats.map((entry) => [entry.beatId, entry]));
    for (const planned of audit.beats) {
      expect(runtime.get(planned.beatId)?.mode, planned.beatId).toBe(planned.targetPresentationMode);
      expect(runtime.get(planned.beatId)?.visualFamily, planned.beatId).toBe(planned.visualFamily);
    }
    expect(Object.fromEntries(PLAYER_FACING_SURFACE_MODES.map((mode) => [
      mode,
      beats.filter((entry) => entry.mode === mode).length,
    ]))).toEqual({
      CINEMATIC_VIDEO: 29,
      CINEMATIC_HOLD: 28,
      TRAVEL_STILL: 19,
      STATIC_TABLEAU: 49,
      COMBAT: 17,
      GAMEPLAY_UI: 2,
    });
  });

  it('resolves every identity through one pure lookup path', () => {
    expect(resolvePresentationBeat({ dialogueId: 'lion_briefing' })?.mode).toBe('CINEMATIC_HOLD');
    expect(resolvePresentationBeat({ cinematicId: 'alaric_audience_arrival' })?.mode).toBe('CINEMATIC_VIDEO');
    expect(resolvePresentationBeat({ edgeId: 'lion-audience>lion-opening-ambush' })?.mode).toBe('TRAVEL_STILL');
    expect(resolvePresentationBeat({ combatId: 'forest_ambush', expectedMode: 'COMBAT' })?.mode).toBe('COMBAT');
    expect(resolvePresentationCandidates([
      { beatId: 'media:forest_journey_tension' },
      { cinematicId: 'forest_journey_tension' },
    ])).toHaveLength(1);
  });

  it('keeps all 28 choice owners exact and all ten ATEs on tableaux', () => {
    for (const choice of audit.choiceAudit) {
      expect(resolveDialoguePresentation(choice.dialogueId)?.mode, choice.dialogueId).toBe(choice.visualOwner);
    }
    expect(audit.choiceAudit).toHaveLength(28);
    for (const ate of audit.ateAudit) {
      expect(ate.targetPresentationMode, ate.dialogueId).toBe('STATIC_TABLEAU');
      expect(resolveDialoguePresentation(ate.dialogueId)?.mode, ate.dialogueId).toBe('STATIC_TABLEAU');
    }
    expect(audit.ateAudit).toHaveLength(10);
  });

  it('integrates exactly the 13 committed visual families', () => {
    expect(new Set(beats.map((entry) => entry.visualFamily))).toEqual(new Set(NARRATIVE_VISUAL_FAMILIES));
  });

  it('enforces cast and background ownership for every planned beat', () => {
    expect(beats.flatMap(validateResolvedBeatOwnership)).toEqual([]);
    expect(beats.filter((entry) => entry.mode === 'CINEMATIC_VIDEO' && entry.staticCast.length)).toEqual([]);
    expect(beats.filter((entry) => entry.mode === 'CINEMATIC_HOLD' && entry.staticCast.length)).toEqual([]);
    expect(beats.filter((entry) => entry.mode === 'TRAVEL_STILL' && entry.staticCast.length)).toEqual([]);
    expect(beats.filter((entry) => entry.mode === 'STATIC_TABLEAU' && !entry.tableauBackgroundId)).toEqual([]);
  });

  it('validates all 19 Travel Still contracts identity by identity', () => {
    const travelBeats = beats.filter((entry) => entry.mode === 'TRAVEL_STILL');
    expect(travelBeats).toHaveLength(19);
    for (const entry of travelBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('TRAVEL_SURFACE_OWNS_ENVIRONMENT');
      expect(entry.staticCast, entry.beatId).toEqual([]);
      expect(entry.hasDialogue, entry.beatId).toBe(false);
      expect(entry.cinematicId, entry.beatId).toBeUndefined();
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('TRAVEL_FAMILY_STATIC');
      expect(entry.fallbackPolicy.assetId, entry.beatId).toBeTruthy();
      expect(entry.fallbackPolicy.neverReplaysResolvedEvent, entry.beatId).toBe(true);
      expect(entry.fallbackPolicy.mutatesGameTruth, entry.beatId).toBe(false);
    }
  });

  it('validates all 28 Hold contracts identity by identity', () => {
    const holdBeats = beats.filter((entry) => entry.mode === 'CINEMATIC_HOLD');
    expect(holdBeats).toHaveLength(28);
    for (const entry of holdBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('VIDEO_OWNS_CAST');
      expect(entry.staticCast, entry.beatId).toEqual([]);
      expect(entry.holdContinuity, entry.beatId).toBeDefined();
      expect(entry.releaseRule, entry.beatId).toBeDefined();
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('HOLD_FRAME_OR_CONTEXT_STATIC');
      expect(entry.fallbackPolicy.neverReplaysResolvedEvent, entry.beatId).toBe(true);
      expect(entry.fallbackPolicy.mutatesGameTruth, entry.beatId).toBe(false);
    }
  });

  it('validates all 49 Static Tableau contracts identity by identity', () => {
    const tableauBeats = beats.filter((entry) => entry.mode === 'STATIC_TABLEAU');
    expect(tableauBeats).toHaveLength(49);
    for (const entry of tableauBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('STAGE_OWNS_CAST');
      expect(entry.tableauBackgroundId, entry.beatId).toBeTruthy();
      expect(entry.staticCast.length, entry.beatId).toBeGreaterThan(0);
      expect(entry.mediaSubjects, entry.beatId).toEqual([]);
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('TABLEAU_LEGACY_BACKGROUND');
      expect(entry.fallbackPolicy.assetId, entry.beatId).toBeTruthy();
    }
  });

  it('validates all 29 Cinematic Video contracts against the production manifest', () => {
    const manifest = JSON.parse(readFileSync(
      resolve(process.cwd(), 'public/assets/cinematics/manifest.json'),
      'utf8',
    )) as { cinematics: Array<{ id: string }> };
    const manifestIds = new Set(manifest.cinematics.map((entry) => entry.id));
    const videoBeats = beats.filter((entry) => entry.mode === 'CINEMATIC_VIDEO');
    expect(videoBeats).toHaveLength(29);
    for (const entry of videoBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('VIDEO_OWNS_CAST');
      expect(entry.staticCast, entry.beatId).toEqual([]);
      expect(entry.cinematicId, entry.beatId).toBeTruthy();
      expect(manifestIds.has(entry.cinematicId!), entry.beatId).toBe(true);
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('VIDEO_POSTER_OR_CONTEXT_STATIC');
      expect(entry.fallbackPolicy.neverReplaysResolvedEvent, entry.beatId).toBe(true);
    }
  });

  it('locks the audience-to-road reference sequence', () => {
    expect(resolveCinematicPresentation('alaric_audience_arrival')?.mode).toBe('CINEMATIC_VIDEO');
    expect(resolveDialoguePresentation('lion_briefing')?.mode).toBe('CINEMATIC_HOLD');
    expect(resolveEdgePresentation('lion-audience', 'lion-opening-ambush')?.mode).toBe('TRAVEL_STILL');
    expect(resolveCinematicPresentation('forest_journey_tension')?.mode).toBe('CINEMATIC_VIDEO');
    expect(resolveDialoguePresentation('pre_opening_trail')?.mode).toBe('CINEMATIC_HOLD');
    expect(beat('combat:forest_ambush').mode).toBe('COMBAT');
    expect(resolveDialoguePresentation('post_opening_trail')?.mode).toBe('STATIC_TABLEAU');
  });

  it('locks Cedric, Garen, Shadow, refuge departure and epilogue classifications', () => {
    expect(resolveDialoguePresentation('mystery_recruit')?.mode).toBe('STATIC_TABLEAU');
    expect(resolveDialoguePresentation('mystery_lancer_recruit')?.mode).toBe('STATIC_TABLEAU');
    expect(resolveDialoguePresentation('shadow_signs')?.mode).toBe('STATIC_TABLEAU');
    expect(resolveDialoguePresentation('final_refuge')?.mode).toBe('STATIC_TABLEAU');
    expect(beat('media:first_refuge_departure').mode).toBe('TRAVEL_STILL');
    expect(beat('media:second_refuge_departure').mode).toBe('TRAVEL_STILL');
    expect(resolveDialoguePresentation('epilogue')?.mode).toBe('CINEMATIC_HOLD');
  });

  it('centralizes hold continuity and releases it on context change', () => {
    const hold = beat('dialogue:lion_briefing');
    expect(holdContinuityMatches(hold.holdContinuity, hold.holdContinuity!)).toBe(true);
    expect(checkPresentationTransition(hold, beat('edge:lion-audience>lion-opening-ambush'), {
      location: 'forest road', timeContext: 'later', encounter: 'road', activity: 'travel',
    })).toEqual({ allowed: true, releaseHold: true });
  });

  it('fails the current route endings safely to the explicit epilogue static fallback', () => {
    const epilogue = beat('dialogue:epilogue');
    expect(isEpilogueHoldContinuityValid(beat('media:serpent_route_ending'), epilogue)).toBe(false);
    expect(isEpilogueHoldContinuityValid(beat('media:lion_trial_route_ending'), epilogue)).toBe(false);
  });

  it.each([
    ['edge:lion-audience>lion-opening-ambush', 'media:forest_journey_tension'],
    ['media:alaric_audience_arrival', 'dialogue:lion_briefing'],
    ['dialogue:lion_briefing', 'edge:lion-audience>lion-opening-ambush'],
    ['media:cedric_encounter', 'dialogue:mystery_recruit'],
    ['dialogue:post_opening_trail', 'edge:lion-opening-ambush>lion-nomad-crossroads'],
    ['edge:lion-lancer-recruit>lion-witnesses', 'dialogue:witnesses_on_road'],
    ['dialogue:pre_opening_trail', 'combat:forest_ambush'],
    ['dialogue:pre_village_defense', 'combat:village_defense'],
    ['combat:forest_ambush', 'dialogue:post_opening_trail'],
    ['combat:village_defense', 'edge:lion-village-choice>lion-second-refuge'],
    ['media:serpent_route_ending', 'dialogue:epilogue'],
  ])('supports the audited transition %s -> %s', (fromId, toId) => {
    expect(checkPresentationTransition(beat(fromId), beat(toId)).allowed).toBe(true);
  });

  it('renders Travel Still as one complete frame with no dialogue or static cast', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const travel = beat('edge:lion-audience>lion-opening-ambush');
    const surface = new TravelStillSurface(root, travel, { fallbackAsset: '/forest.webp', dev: true });
    surface.mount();
    await surface.whenRenderable();
    expect(root.querySelectorAll('.narrative-media-surface')).toHaveLength(1);
    expect(root.querySelector('.narrative-cast__actor')).toBeNull();
    expect(root.querySelector('.dialogue')).toBeNull();
    expect(surface.element.dataset.presentationMode).toBe('TRAVEL_STILL');
    expect(surface.element.dataset.fallbackActive).toBe('true');
    expect(surface.element.dataset.travelStillAssetPending).toBe('true');
  });

  it('degrades a living-still source to its static source under reduced motion', () => {
    const root = document.createElement('div');
    const travel = beat('edge:lion-audience>lion-opening-ambush');
    const surface = new TravelStillSurface(root, travel, {
      source: { kind: 'LIVING_STILL', assetId: '/living.webp', staticFallbackAssetId: '/static.webp' },
      reducedMotion: true,
    });
    expect(surface.asset).toBe('/static.webp');
  });

  it('keeps one primary surface and cleans it on release/dispose', async () => {
    const registry = new CinematicRegistry({ version: 1, cinematics: [] });
    const stage = new NarrativeStage({
      registry,
      player: new CinematicPlayer(registry),
      transitionRevealMs: 0,
      dev: true,
    });
    await stage.presentTravelStill(beat('edge:lion-audience>lion-opening-ambush'));
    expect(stage.currentMediaSurfaceKind).toBe('TRAVEL_STILL');
    expect(stage.element.querySelectorAll('.narrative-media-surface')).toHaveLength(1);
    expect(validatePrimarySurface('TRAVEL_STILL', 1)).toBeUndefined();
    stage.releaseFreeze();
    expect(stage.element.querySelectorAll('.narrative-media-surface')).toHaveLength(0);
    stage.dispose();
    expect(document.querySelector('.narrative-stage')).toBeNull();
  });

  it('keeps explicit video and hold fallbacks sprite-free, then releases them for Travel Still', async () => {
    const registry = new CinematicRegistry({ version: 1, cinematics: [] });
    const stage = new NarrativeStage({
      registry,
      player: new CinematicPlayer(registry),
      transitionRevealMs: 0,
      dev: true,
    });
    stage.setTableau(ALARIC_AUDIENCE_TABLEAU);
    await stage.presentCinematicBeat(beat('media:alaric_audience_arrival'));
    expect(stage.currentMediaSurfaceKind).toBe('FALLBACK');
    expect(stage.element.querySelector('.narrative-cast__actor')).toBeNull();
    expect(stage.element.dataset.narrativeCastOwnership).toBe('ENVIRONMENT_ONLY');

    await stage.enterCinematicHold(beat('dialogue:lion_briefing'));
    expect(stage.element.dataset.presentationMode).toBe('CINEMATIC_HOLD');
    expect(stage.element.querySelector('.narrative-cast__actor')).toBeNull();

    await stage.presentTravelStill(beat('edge:lion-audience>lion-opening-ambush'));
    expect(stage.currentMediaSurfaceKind).toBe('TRAVEL_STILL');
    expect(stage.element.querySelectorAll('.narrative-media-surface')).toHaveLength(1);
    expect(stage.element.querySelector('.narrative-media-surface--video-fallback')).toBeNull();
    stage.dispose();
  });
});
