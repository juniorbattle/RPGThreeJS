import { describe, expect, it } from 'vitest';
import { APPROVED_PRODUCTION_VIDEO_IDS, isApprovedProductionVideo } from './ApprovedProductionVideos';
import { shouldPlayDialoguePreludeVideo } from './CinematicReductionPolicy';

describe('production video slots', () => {
  it('recognizes exactly the eight locked slots', () => {
    expect(APPROVED_PRODUCTION_VIDEO_IDS).toEqual([
      'camp_departure', 'alaric_audience_arrival', 'bois_clair_arrival',
      'bois_clair_saved', 'bois_clair_sacrificed', 'lion_judgement',
      'serpent_route_ending', 'lion_trial_route_ending',
    ]);
    expect(isApprovedProductionVideo('serpent_general_reveal')).toBe(false);
    expect(isApprovedProductionVideo('refugees_approach')).toBe(false);
  });

  it('never plays an optional or combat-owned dialogue prelude', () => {
    expect(shouldPlayDialoguePreludeVideo('alaric_audience_arrival')).toBe(true);
    expect(shouldPlayDialoguePreludeVideo('refugees_approach')).toBe(false);
    expect(shouldPlayDialoguePreludeVideo('serpent_general_reveal')).toBe(false);
  });
});
