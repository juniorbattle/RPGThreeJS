import { describe, expect, it } from 'vitest';
import { getSkillPresentation } from '../skillPresentation';
import { resolvePresentationRoute } from '../stage/combatStageProfiles';
import { VFX_SPRITE_SHEETS } from './VfxSpriteSheets';
import {
  getMegaPackHeldReviewEntries,
  MEGAPACK_HELD_REVIEW_ROOT,
  type HeldCandidateVerdict,
} from './MegaPackHeldReview';

const allowedVerdicts: readonly HeldCandidateVerdict[] = [
  'LOCK',
  'REJECT',
  'NEEDS_ALT',
  'PRESENTATION_TUNE_ONLY',
];

describe('R2C-A held Mega Pack source review', () => {
  it('keeps all 16 candidate sources dev-only, native, and outside production registries', () => {
    const entries = getMegaPackHeldReviewEntries();

    expect(entries).toHaveLength(16);
    expect(new Set(entries.map((entry) => entry.actionId)).size).toBe(16);
    expect(new Set(entries.map((entry) => entry.sourceId)).size).toBe(16);

    for (const entry of entries) {
      expect(entry.source.url.startsWith(MEGAPACK_HELD_REVIEW_ROOT)).toBe(true);
      expect(entry.source.url).not.toContain('/raw/');
      expect(entry.source.url).not.toContain('/validation/');
      expect(entry.source.url).not.toContain('/processed/');
      expect(entry.source.url).not.toContain('/rejected/');
      expect(entry.source.sheetWidthPx / entry.source.cols).toBe(512);
      expect(entry.source.sheetHeightPx / entry.source.rows).toBe(512);
      expect(entry.source.frameCount).toBe(entry.source.cols * entry.source.rows);
      expect(allowedVerdicts).toContain(entry.provisionalVerdict);
      expect(Object.prototype.hasOwnProperty.call(VFX_SPRITE_SHEETS, entry.source.id)).toBe(false);
    }
  });

  it('derives the real presentation route from the actual action metadata', () => {
    for (const entry of getMegaPackHeldReviewEntries()) {
      const route = resolvePresentationRoute(entry.actionSpec, getSkillPresentation(entry.actionSpec));
      expect(entry.route).toBe(route.route);
      expect(entry.routeReason).toBe(route.reason);
      expect(entry.routeFamily).toBe(route.family);
    }
  });

  it('uses r1_0453 exclusively for Flame Wave and never uses the Dragon Breath reservation', () => {
    const flameWave = getMegaPackHeldReviewEntries().find((entry) => entry.actionId === 'n_flame_wave');

    expect(flameWave?.sourceId).toBe('r1_0453');
    expect(getMegaPackHeldReviewEntries().some((entry) => entry.sourceId === 'r1_0450')).toBe(false);
  });

  it('keeps the source-lock review split between tune-only and alternate-source decisions', () => {
    const verdicts = getMegaPackHeldReviewEntries().map((entry) => entry.provisionalVerdict);

    expect(verdicts.filter((verdict) => verdict === 'PRESENTATION_TUNE_ONLY')).toHaveLength(9);
    expect(verdicts.filter((verdict) => verdict === 'NEEDS_ALT')).toHaveLength(7);
    expect(verdicts).not.toContain('LOCK');
    expect(verdicts).not.toContain('REJECT');
  });
});
