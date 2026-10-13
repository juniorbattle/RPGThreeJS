import { describe, expect, it } from 'vitest';
import {
  CIN6A_JOURNEY_TRIGGERS,
  CIN6C_P1_JOURNEY_TRIGGERS,
  CIN6C_P1_RUNTIME_IDS,
  resolveCin6aBoisClairAftermath,
  resolveCin6aJourneyTrigger,
  resolveCin6aRefugeArrival,
  resolveCin6aRefugeDeparture,
  resolveCin6aSerpentEnding,
  resolveCin6bLionTrialEnding,
  resolveCin6cJourneyTrigger,
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

  it('selects Bois-Clair state media only after the matching authoritative victory', () => {
    expect(resolveCin6aBoisClairAftermath('village_defense', true, { missionSuccess: true })).toBe('bois_clair_saved');
    expect(resolveCin6aBoisClairAftermath('village_defense', true, { missionSuccess: true, missionGreed: true })).toBeUndefined();
    expect(resolveCin6aBoisClairAftermath('village_raid', true, { missionGreed: true })).toBe('bois_clair_sacrificed');
    expect(resolveCin6aBoisClairAftermath('village_raid', true, { missionSuccess: true, missionGreed: true })).toBe('bois_clair_sacrificed');
    expect(resolveCin6aBoisClairAftermath('village_raid', true, {})).toBeUndefined();
    expect(resolveCin6aBoisClairAftermath('village_defense', false, { missionSuccess: true })).toBeUndefined();
    expect(resolveCin6aBoisClairAftermath('village_raid', false, { missionGreed: true })).toBeUndefined();
  });

  it('selects the Serpent ending only after authoritative Serpent victory', () => {
    expect(resolveCin6aSerpentEnding('serpent_captain', true, { serpentGeneralDefeated: true })).toBe('serpent_route_ending');
    expect(resolveCin6aSerpentEnding('serpent_captain', true, {})).toBeUndefined();
    expect(resolveCin6aSerpentEnding('lion_chief', true, { lionTrialWon: true })).toBeUndefined();
    expect(resolveCin6aSerpentEnding('serpent_captain', false, { serpentGeneralDefeated: true })).toBeUndefined();
  });

  it('mutually excludes completed Lion endings using authoritative finale precedence', () => {
    expect(resolveCin6bLionTrialEnding('lion_chief', true, { lionTrialWon: true })).toBe('lion_trial_route_ending');
    expect(resolveCin6bLionTrialEnding('lion_chief', true, { lionTrialWon: true, lionTrialRequested: true })).toBe('lion_trial_route_ending');
    expect(resolveCin6bLionTrialEnding('lion_chief', false, { lionTrialWon: true })).toBeUndefined();
    expect(resolveCin6bLionTrialEnding('serpent_captain', true, { serpentGeneralDefeated: true })).toBeUndefined();
    expect(resolveCin6aSerpentEnding('serpent_captain', true, { serpentGeneralDefeated: true, lionTrialWon: true })).toBe('serpent_route_ending');
    expect(resolveCin6bLionTrialEnding('lion_chief', true, { serpentGeneralDefeated: true, lionTrialWon: true })).toBeUndefined();
  });

  it('declares the exact eleven CIN-6C P1 runtime IDs', () => {
    expect(CIN6C_P1_RUNTIME_IDS).toHaveLength(11);
    expect(new Set(CIN6C_P1_RUNTIME_IDS)).toEqual(new Set([
      'cedric_encounter',
      'garen_encounter',
      'serpent_road_tension',
      'shrine_reveal_context',
      'injured_merchant_encounter',
      'abandoned_cart_reveal',
      'spider_nest_reveal',
      'troll_crossing_reveal',
      'serpent_duelist_reveal',
      'young_dragon_encounter',
      'serpent_informant_encounter',
    ]));
  });

  it.each([
    ['mystery_recruit', 'cedric_encounter'],
    ['mystery_lancer_recruit', 'garen_encounter'],
    ['mystery_help', 'injured_merchant_encounter'],
    ['mystery_treasure', 'abandoned_cart_reveal'],
    ['old_shrine_event', 'shrine_reveal_context'],
    ['mystery_shrine', 'shrine_reveal_context'],
    ['mystery_dragon_roost', 'young_dragon_encounter'],
    ['serpent_informant', 'serpent_informant_encounter'],
  ])('maps resolved dialogue content %s to %s', (dialogueId, cinematicId) => {
    expect(resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId })).toBe(cinematicId);
  });

  it.each([
    ['spider_nest', 'spider_nest_reveal'],
    ['troll_crossing', 'troll_crossing_reveal'],
    ['serpent_duelist_trial', 'serpent_duelist_reveal'],
    ['forest_patrol', 'serpent_road_tension'],
    ['serpent_reprisals', 'serpent_road_tension'],
    ['serpent_checkpoint', 'serpent_road_tension'],
    ['serpent_hunters', 'serpent_road_tension'],
  ])('maps resolved combat content %s to %s with unique precedence', (combatId, cinematicId) => {
    expect(resolveCin6cJourneyTrigger({ hook: 'beforeCombat', combatId })).toBe(cinematicId);
  });

  it('does not broaden the two P1 reuse families', () => {
    expect(Object.keys(CIN6C_P1_JOURNEY_TRIGGERS.beforeDialogue).sort()).toEqual([
      'mystery_dragon_roost', 'mystery_help', 'mystery_lancer_recruit', 'mystery_recruit',
      'mystery_shrine', 'mystery_treasure', 'old_shrine_event', 'serpent_informant',
    ]);
    expect(resolveCin6cJourneyTrigger({ hook: 'beforeCombat', combatId: 'ruins_guardians' })).toBeUndefined();
    expect(resolveCin6cJourneyTrigger({ hook: 'beforeCombat', combatId: 'forest_ambush' })).toBeUndefined();
    expect(resolveCin6cJourneyTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_briefing' })).toBeUndefined();
  });

  it.each([
    ['mystery_recruit', 'recruitedCedric'],
    ['mystery_lancer_recruit', 'recruitedLancer'],
    ['mystery_help', 'helpedMerchant'],
    ['mystery_help', 'abandonedMerchant'],
    ['mystery_treasure', 'returnedLostTreasure'],
    ['mystery_treasure', 'claimedLostTreasure'],
    ['old_shrine_event', 'shrineRested'],
    ['old_shrine_event', 'shrineLooted'],
    ['mystery_shrine', 'preservedShrine'],
    ['mystery_shrine', 'desecratedShrine'],
    ['mystery_dragon_roost', 'challengedYoungDragon'],
    ['mystery_dragon_roost', 'sparedYoungDragon'],
    ['serpent_informant', 'protectedInformant'],
    ['serpent_informant', 'betrayedInformant'],
  ])('suppresses stale %s presentation after %s', (dialogueId, flag) => {
    expect(resolveCin6cJourneyTrigger(
      { hook: 'beforeDialogue', dialogueId },
      { flags: { [flag]: true } },
    )).toBeUndefined();
  });

  it('suppresses a combat reveal when its presentation boundary is already resolved', () => {
    expect(resolveCin6cJourneyTrigger(
      { hook: 'beforeCombat', combatId: 'spider_nest' },
      { boundaryResolved: true },
    )).toBeUndefined();
  });

  it('reads presentation truth without mutating it', () => {
    const flags = Object.freeze({ helpedMerchant: false });
    const before = JSON.stringify(flags);
    expect(resolveCin6cJourneyTrigger(
      { hook: 'beforeDialogue', dialogueId: 'mystery_help' },
      { flags },
    )).toBe('injured_merchant_encounter');
    expect(JSON.stringify(flags)).toBe(before);
  });
});
