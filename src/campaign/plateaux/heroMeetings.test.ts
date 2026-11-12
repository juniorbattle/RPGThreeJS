import { describe, expect, it } from 'vitest';
import { resolveGameDialogue } from '../../game/contextualDialogueContent';
import { canRecruit, hireAtRefuge, RECRUITABLE_HERO_IDS, refugeHireOffers } from '../../game/refugeRecruitment';
import { createInitialState } from '../../game/store';
import { createRecruitInstance } from '../../game/catalog';
import type { DialogueSequence, GameState } from '../../game/types';
import { HERO_MEETINGS } from './heroMeetings';

const HOSTS: Record<string, string> = {
  artillerist: 'bear_ore_convoy', paladin: 'bear_mountain_shrine', red_mage: 'dragon_terrorized_village',
  ninja: 'dragon_wolf_traps', enchanter: 'scorpion_scholars', dark_knight: 'scorpion_buried_library',
};
const sequenceOf = (id: string, state: GameState = createInitialState()): DialogueSequence => resolveGameDialogue(id, state)!.sequence;
const step = (sequence: DialogueSequence, id: string) => sequence.steps.find((candidate) => candidate.id === id)!;

describe('the six heroes’ meetings (OD-2026-11-11-F, F2, lines approved on 2026-11-11)', () => {
  it('leads every outcome of each host scene into its meeting, every original line kept and every link resolved', () => {
    for (const meeting of HERO_MEETINGS) {
      const sequence = sequenceOf(HOSTS[meeting.unitId]!);
      const ids = new Set(sequence.steps.map((candidate) => candidate.id));
      for (const [host, entry] of Object.entries(meeting.links)) expect(step(sequence, host).next, meeting.unitId).toBe(entry);
      for (const candidate of sequence.steps) {
        if (candidate.next) expect(ids.has(candidate.next), `${meeting.unitId}:${candidate.id}`).toBe(true);
        for (const option of candidate.choices ?? []) if (option.next) expect(ids.has(option.next)).toBe(true);
      }
      const recruitChoices = sequence.steps.flatMap((candidate) => candidate.choices ?? [])
        .filter((option) => option.effects.some((effect) => effect.type === 'recruitUnit' && effect.unitId === meeting.unitId));
      expect(recruitChoices.length, meeting.unitId).toBeGreaterThan(0);
    }
  });

  it('keeps the approved conditions: gold for the mercenaries, reputation for the honour heroes, a ceiling for Morvan', () => {
    const choice = (hostId: string, stepId: string) => step(sequenceOf(hostId), stepId).choices![0]!;
    expect(choice('bear_ore_convoy', 'gunnar_choice')).toMatchObject({ text: 'Engager Gunnar — 120 or.', requiresGold: 120 });
    expect(choice('bear_mountain_shrine', 'aldric_choice_h')).toMatchObject({ requiresReputationMin: 55 });
    expect(choice('bear_mountain_shrine', 'aldric_choice_p')).toMatchObject({ text: 'Rendre les 50 or au sanctuaire et accueillir Aldric.', requiresGold: 50, requiresReputationMin: 55 });
    expect(choice('dragon_terrorized_village', 'lyra_choice_e')).toMatchObject({ requiresGold: 60, requiresReputationMin: 45 });
    expect(choice('dragon_wolf_traps', 'talon_choice')).toMatchObject({ requiresGold: 150 });
    expect(choice('scorpion_scholars', 'eldwin_choice')).toMatchObject({ requiresReputationMin: 60 });
    expect(choice('scorpion_buried_library', 'morvan_choice')).toMatchObject({ requiresGold: 180, requiresReputationMax: 65 });
    // Leaving the faithful to the scholars ends Eldwin's meeting without any recruitment.
    expect(step(sequenceOf('scorpion_scholars'), 'eldwin_react_a').next).toBe('eldwin_marian');
    expect(step(sequenceOf('scorpion_scholars'), 'eldwin_marian').next).toBeNull();
  });

  it('lets eight heroes join the four starting members, two per plateau, up to the company’s maximum', () => {
    expect([...RECRUITABLE_HERO_IDS].sort()).toEqual(['artillerist', 'dark_knight', 'enchanter', 'lancer', 'ninja', 'paladin', 'red_mage', 'rogue']);
    const state = createInitialState();
    for (const unitId of RECRUITABLE_HERO_IDS) {
      expect(canRecruit(state, unitId), unitId).toBe(true);
      state.clan.members.push(createRecruitInstance(unitId));
      expect(canRecruit(state, unitId), unitId).toBe(false);
    }
    expect(state.clan.members).toHaveLength(12);
    expect(canRecruit(state, 'warrior')).toBe(false);
  });

  it('gives each of the six a second chance at the refuge their farewell names, under the meeting’s conditions, a repair included, and never reopens Eldwin', () => {
    const state = createInitialState();
    state.gold = 1000; state.reputation = 60;
    state.resolvedNodeIds.push('bear-ore-convoy', 'bear-final-trial-event', 'dragon-terrorized-village', 'dragon-first-trial-event', 'scorpion-scholars', 'scorpion-second-trial-event');
    state.flags.bearShrinePlundered = true;
    const offersAt = (refugeNodeId: string) => refugeHireOffers(state, refugeNodeId).filter((offer) => offer.unitId !== 'rogue' && offer.unitId !== 'lancer');
    const only = (refugeNodeId: string) => { const offers = offersAt(refugeNodeId); expect(offers, refugeNodeId).toHaveLength(1); return offers[0]!; };
    expect(only('bear-second-refuge')).toMatchObject({ unitId: 'artillerist', price: 180, blocked: null });
    expect(only('bear-final-refuge')).toMatchObject({ unitId: 'paladin', price: 110 }); // 60 + the 50 the meeting asked to give back
    expect(only('dragon-first-refuge')).toMatchObject({ unitId: 'red_mage', price: 60 });
    expect(only('dragon-second-refuge')).toMatchObject({ unitId: 'ninja', price: 220 });
    expect(only('scorpion-second-refuge')).toMatchObject({ unitId: 'dark_knight', price: 260, blocked: null });
    // Eldwin stays closed while the faithful was left to the scholars; nobody waits at the first Bear refuge.
    expect(offersAt('scorpion-first-refuge')).toEqual([]);
    expect(offersAt('bear-first-refuge')).toEqual([]);
    state.reputation = 70;
    expect(only('scorpion-second-refuge').blocked).toBe('Réputation trop haute : 65 au plus.');
    state.flags.scorpionFaithfulFreed = true;
    expect(only('scorpion-first-refuge')).toMatchObject({ unitId: 'enchanter', price: 80, blocked: null });
    expect(hireAtRefuge(state, 'paladin', 'dragon-first-refuge')).toBe(false);
    expect(hireAtRefuge(state, 'paladin', 'bear-final-refuge')).toBe(true);
    expect(state.gold).toBe(890);
  });
});
