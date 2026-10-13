// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CinematicPlayer } from './CinematicPlayer';
import { CinematicRegistry } from './CinematicRegistry';
import { resolveCinematicReduction } from './CinematicReductionPolicy';
import { APPROVED_PRODUCTION_VIDEO_IDS } from './ApprovedProductionVideos';
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
const production = JSON.parse(readFileSync(
  resolve(process.cwd(), 'tools/cinematics/specs/production_presentation_modes.json'),
  'utf8',
)) as { approvedVideoIds: string[]; modeOverrides: Record<string, string> };
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

  it('preserves all 147 historical beat identities with production mode conversions', () => {
    expect(beats).toHaveLength(147);
    const runtime = new Map(beats.map((entry) => [entry.beatId, entry]));
    for (const planned of audit.beats) {
      expect(runtime.get(planned.beatId)?.mode, planned.beatId).toBe(
        production.modeOverrides[planned.beatId] ?? planned.targetPresentationMode,
      );
      expect(runtime.get(planned.beatId)?.visualFamily, planned.beatId).toBe(planned.visualFamily);
    }
    expect(Object.fromEntries(PLAYER_FACING_SURFACE_MODES.map((mode) => [
      mode,
      beats.filter((entry) => entry.mode === mode).length,
    ]))).toEqual({
      CINEMATIC_VIDEO: 8,
      CINEMATIC_HOLD: 5,
      TRAVEL_STILL: 31,
      STATIC_TABLEAU: 77,
      COMBAT: 24,
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
      expect(resolveDialoguePresentation(choice.dialogueId)?.mode, choice.dialogueId).toBe(
        production.modeOverrides[`dialogue:${choice.dialogueId}`] ?? choice.visualOwner,
      );
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

  it('validates all 31 production Travel Still contracts identity by identity', () => {
    const travelBeats = beats.filter((entry) => entry.mode === 'TRAVEL_STILL');
    expect(travelBeats).toHaveLength(31);
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

  it('validates all five approved-video Hold contracts identity by identity', () => {
    const holdBeats = beats.filter((entry) => entry.mode === 'CINEMATIC_HOLD');
    expect(holdBeats).toHaveLength(5);
    expect(holdBeats.every((entry) => !entry.beatId.startsWith('edge:'))).toBe(true);
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

  it('validates all 77 production Static Tableau contracts identity by identity', () => {
    const tableauBeats = beats.filter((entry) => entry.mode === 'STATIC_TABLEAU');
    expect(tableauBeats).toHaveLength(77);
    for (const entry of tableauBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('STAGE_OWNS_CAST');
      expect(entry.tableauBackgroundId, entry.beatId).toBeTruthy();
      expect(entry.staticCast.length, entry.beatId).toBeGreaterThan(0);
      expect(entry.mediaSubjects, entry.beatId).toEqual([]);
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('TABLEAU_LEGACY_BACKGROUND');
      expect(entry.fallbackPolicy.assetId, entry.beatId).toBeTruthy();
    }
  });

  it('limits the runtime registry to exactly the eight approved video slots', () => {
    const manifest = JSON.parse(readFileSync(
      resolve(process.cwd(), 'public/assets/cinematics/manifest.json'),
      'utf8',
    )) as { cinematics: Array<{ id: string }> };
    const manifestIds = new Set(manifest.cinematics.map((entry) => entry.id));
    const videoBeats = beats.filter((entry) => entry.mode === 'CINEMATIC_VIDEO');
    expect(videoBeats.map((entry) => entry.cinematicId).sort()).toEqual([...APPROVED_PRODUCTION_VIDEO_IDS].sort());
    expect(production.approvedVideoIds).toEqual(APPROVED_PRODUCTION_VIDEO_IDS);
    for (const entry of videoBeats) {
      expect(entry.castOwnership, entry.beatId).toBe('VIDEO_OWNS_CAST');
      expect(entry.staticCast, entry.beatId).toEqual([]);
      expect(entry.cinematicId, entry.beatId).toBeTruthy();
      expect(manifestIds.has(entry.cinematicId!), entry.beatId).toBe(true);
      expect(entry.fallbackPolicy.kind, entry.beatId).toBe('VIDEO_POSTER_OR_CONTEXT_STATIC');
      expect(entry.fallbackPolicy.neverReplaysResolvedEvent, entry.beatId).toBe(true);
    }
  });

  it('retires all old MP4 and hold dependencies without losing dialogue identity', () => {
    expect(Object.keys(production.modeOverrides)).toHaveLength(44);
    for (const [beatId, mode] of Object.entries(production.modeOverrides)) {
      const entry = beat(beatId);
      expect(entry.mode, beatId).toBe(mode);
      expect(entry.sourceAsset?.endsWith('.mp4') ?? false, beatId).toBe(false);
      expect(entry.holdSourceCinematicId, beatId).toBeUndefined();
      expect(entry.preloadRefs, beatId).not.toContainEqual(expect.stringMatching(/\.mp4$/));
      if (beatId.startsWith('dialogue:')) {
        expect(entry.dialogueId, beatId).toBe(beatId.slice('dialogue:'.length));
        expect(entry.hasDialogue, beatId).toBe(true);
      }
    }
  });

  it('keeps the production reduction policy aligned with converted media beats', () => {
    const classificationByMode = {
      TRAVEL_STILL: 'CONVERT_TO_TRAVEL_STILL',
      STATIC_TABLEAU: 'CONVERT_TO_STATIC_TABLEAU',
      COMBAT: 'COMBAT_OWNED',
    } as const;
    for (const [beatId, mode] of Object.entries(production.modeOverrides)) {
      if (!beatId.startsWith('media:')) continue;
      expect(resolveCinematicReduction(beatId.slice('media:'.length))?.classification, beatId).toBe(
        classificationByMode[mode as keyof typeof classificationByMode],
      );
    }
  });

  it('locks the audience-to-road reference sequence', () => {
    expect(resolveCinematicPresentation('alaric_audience_arrival')?.mode).toBe('CINEMATIC_VIDEO');
    expect(resolveDialoguePresentation('lion_briefing')?.mode).toBe('CINEMATIC_HOLD');
    expect(resolveEdgePresentation('lion-audience', 'lion-opening-ambush')?.mode).toBe('TRAVEL_STILL');
    expect(resolveCinematicPresentation('forest_journey_tension')?.mode).toBe('TRAVEL_STILL');
    expect(resolveDialoguePresentation('pre_opening_trail')?.mode).toBe('STATIC_TABLEAU');
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

  it('uses static travel art for OS reduced motion with normal graphics', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const surface = new TravelStillSurface(document.createElement('div'), beat('edge:lion-audience>lion-opening-ambush'), {
      source: { kind: 'LIVING_STILL', assetId: '/living.webp', staticFallbackAssetId: '/static.webp' },
      reducedMotion: false,
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
