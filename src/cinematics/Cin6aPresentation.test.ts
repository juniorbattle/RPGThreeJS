import { describe, expect, it } from 'vitest';
import {
  CIN6A_JOURNEY_TRIGGERS,
  resolveCin6aBoisClairAftermath,
  resolveCin6aJourneyTrigger,
  resolveCin6aRefugeArrival,
  resolveCin6aRefugeDeparture,
  resolveCin6aSerpentEnding,
} from './Cin6aPresentation';

describe('CIN-6A Journey-only presentation selection', () => {
  it('uses the same neutral forest family for both seeded creature outcomes', () => {
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId: 'forest_ambush' })).toBe('forest_journey_tension');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId: 'wolf_pack' })).toBe('forest_journey_tension');
    expect(new Set(Object.values(CIN6A_JOURNEY_TRIGGERS.beforeCombat))).toContain('forest_journey_tension');
  });

  it('maps reviewed dialogue and neutral ruins context without adding global triggers', () => {
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_briefing' })).toBe('alaric_audience_arrival');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId: 'village_choice' })).toBe('bois_clair_arrival');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId: 'shadow_signs' })).toBe('shadow_signs');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeDialogue', dialogueId: 'final_refuge' })).toBe('final_refuge_dossier');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId: 'ruins_guardians' })).toBe('ruins_approach_context');
    expect(resolveCin6aJourneyTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' })).toBeUndefined();
  });

  it('keeps refuge arrival and departure presentation separate from refuge gameplay', () => {
    expect(resolveCin6aRefugeArrival('lion-first-refuge')).toBe('first_refuge_arrival');
    expect(resolveCin6aRefugeArrival('lion-second-refuge')).toBeUndefined();
    expect(resolveCin6aRefugeDeparture('lion-first-refuge')).toBe('first_refuge_departure');
    expect(resolveCin6aRefugeDeparture('lion-second-refuge')).toBe('second_refuge_departure');
    expect(resolveCin6aRefugeDeparture('lion-final-refuge')).toBeUndefined();
  });

  it('selects Bois-Clair saved only from compatible deterministic truth', () => {
    expect(resolveCin6aBoisClairAftermath('village_defense', true, { missionSuccess: true })).toBe('bois_clair_saved');
    expect(resolveCin6aBoisClairAftermath('village_defense', true, { missionSuccess: true, missionGreed: true })).toBeUndefined();
    expect(resolveCin6aBoisClairAftermath('village_raid', true, { missionGreed: true })).toBeUndefined();
    expect(resolveCin6aBoisClairAftermath('village_defense', false, { missionSuccess: true })).toBeUndefined();
  });

  it('selects the Serpent ending only after authoritative Serpent victory', () => {
    expect(resolveCin6aSerpentEnding('serpent_captain', true, { serpentGeneralDefeated: true })).toBe('serpent_route_ending');
    expect(resolveCin6aSerpentEnding('serpent_captain', true, {})).toBeUndefined();
    expect(resolveCin6aSerpentEnding('lion_chief', true, { lionTrialWon: true })).toBeUndefined();
    expect(resolveCin6aSerpentEnding('serpent_captain', false, { serpentGeneralDefeated: true })).toBeUndefined();
  });
});
