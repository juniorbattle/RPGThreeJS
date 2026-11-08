import { describe, expect, it } from 'vitest';
import { getFinalStats } from './catalog';
import {
  completeCurrentChapter,
  getClanRelation,
  getClanRelationCauses,
  isClanMet,
  meetClan,
  recordCampaignEnding,
  recordPlateauOutcome,
  resolveCampaignEnding,
  selectClansByRelation,
  selectPlateauOutcomes,
  setClanRelation,
} from './runSystem';
import { createInitialState } from './store';
import type { PlateauOutcome } from '../campaign/plateaux/PlateauRegistry';

describe('RunSystem clan relations (set 1.20.0, Lot 0)', () => {
  it('reads an unmet clan as neutral, then records a meeting once', () => {
    const state = createInitialState();
    expect(getClanRelation(state, 'bear')).toBe('neutral');
    expect(isClanMet(state, 'bear')).toBe(false);
    expect(meetClan(state, 'bear', 'bear.arrival')).toBe(true);
    expect(meetClan(state, 'bear', 'bear.other')).toBe(false);
    expect(isClanMet(state, 'bear')).toBe(true);
    expect(getClanRelation(state, 'bear')).toBe('neutral');
    expect(getClanRelationCauses(state, 'bear')).toEqual(['bear.arrival']);
  });

  it('sets a relation for a named cause, idempotently, and keeps every cause for later echoes', () => {
    const state = createInitialState();
    expect(setClanRelation(state, 'lion', 'ally', 'lion.outcome.honour')).toBe(true);
    expect(setClanRelation(state, 'lion', 'ally', 'lion.outcome.honour')).toBe(false);
    expect(setClanRelation(state, 'lion', 'neutral', 'bear.betrayal')).toBe(true);
    expect(getClanRelation(state, 'lion')).toBe('neutral');
    expect(getClanRelationCauses(state, 'lion')).toEqual(['lion.outcome.honour', 'bear.betrayal']);
    expect(() => setClanRelation(state, 'wolf', 'enemy', '')).toThrow(/fact/);
  });

  it('lists met clans by relation for the supports and foes of the final act, without saving any support', () => {
    const state = createInitialState();
    setClanRelation(state, 'lion', 'ally', 'lion.outcome.honour');
    setClanRelation(state, 'serpent', 'enemy', 'lion.outcome.honour');
    meetClan(state, 'bear', 'bear.arrival');
    expect(selectClansByRelation(state, 'ally')).toEqual(['lion']);
    expect(selectClansByRelation(state, 'enemy')).toEqual(['serpent']);
    expect(selectClansByRelation(state, 'neutral')).toEqual(['bear']);
    expect(JSON.stringify(state.campaign)).not.toMatch(/support/i);
  });

  it('gives no combat stat bonus: relations leave every unit stat unchanged', () => {
    const state = createInitialState();
    const before = state.clan.members.map((unit) => getFinalStats(unit));
    setClanRelation(state, 'lion', 'ally', 'lion.outcome.honour');
    setClanRelation(state, 'dragon', 'ally', 'dragon.outcome.honour');
    expect(state.clan.members.map((unit) => getFinalStats(unit))).toEqual(before);
  });
});

describe('RunSystem plateau outcomes and chapter order (set 1.20.0, Lot 0)', () => {
  it('records an outcome once and never changes it', () => {
    const state = createInitialState();
    expect(recordPlateauOutcome(state, 'lion', 'honour')).toBe(true);
    expect(recordPlateauOutcome(state, 'lion', 'force')).toBe(false);
    expect(selectPlateauOutcomes(state)).toEqual([{ chapterId: 'lion', outcome: 'honour' }]);
    expect(() => recordPlateauOutcome(state, 'bear', 'honour')).toThrow(/not open/);
  });

  it('closes a Seal plateau only with an outcome and opens the next chapter in the fixed order', () => {
    const state = createInitialState();
    expect(() => completeCurrentChapter(state)).toThrow(/no recorded outcome/);
    const order: string[] = [];
    for (const [chapter, outcome] of [['lion', 'honour'], ['bear', 'force'], ['dragon', 'honour'], ['scorpion', 'honour']] as const) {
      recordPlateauOutcome(state, chapter, outcome);
      order.push(completeCurrentChapter(state)!);
    }
    expect(order).toEqual(['bear', 'dragon', 'scorpion', 'finale']);
    expect(state.campaign?.chapters.lion.status).toBe('completed');
    expect(state.campaign?.chapters.finale.status).toBe('active');
    expect(completeCurrentChapter(state)).toBeNull();
    expect(state.campaign?.chapters.finale.status).toBe('completed');
  });
});

describe('R4 ending rule (set 1.20.0)', () => {
  const combos: PlateauOutcome[][] = [];
  for (let mask = 0; mask < 16; mask += 1) {
    combos.push([0, 1, 2, 3].map((bit) => (mask >> bit) & 1 ? 'honour' : 'force'));
  }

  it.each(combos)('decides %s, %s, %s, %s by the sheet', (...outcomes) => {
    const honour = outcomes.filter((outcome) => outcome === 'honour').length;
    for (const reputation of [0, 39, 40, 59, 60, 100]) {
      const expected = honour >= 3 ? (reputation < 40 ? 'balance' : 'respect')
        : honour <= 1 ? (reputation >= 60 ? 'balance' : 'fear')
          : 'balance';
      expect(resolveCampaignEnding(outcomes, reputation)).toBe(expected);
    }
  });

  it('applies the thresholds exactly: below 40 tempers Respect, 60 or more tempers Fear', () => {
    expect(resolveCampaignEnding(['honour', 'honour', 'honour', 'force'], 39)).toBe('balance');
    expect(resolveCampaignEnding(['honour', 'honour', 'honour', 'force'], 40)).toBe('respect');
    expect(resolveCampaignEnding(['force', 'force', 'force', 'honour'], 59)).toBe('fear');
    expect(resolveCampaignEnding(['force', 'force', 'force', 'honour'], 60)).toBe('balance');
    expect(resolveCampaignEnding(['honour', 'force', 'honour', 'force'], 100)).toBe('balance');
    expect(() => resolveCampaignEnding(['honour', 'honour', 'honour'], 80)).toThrow(/four/);
  });

  it('records the ending once the four outcomes are known, and only once', () => {
    const state = createInitialState();
    for (const chapter of ['lion', 'bear', 'dragon'] as const) {
      recordPlateauOutcome(state, chapter, 'honour');
      completeCurrentChapter(state);
    }
    expect(recordCampaignEnding(state)).toBeNull();
    recordPlateauOutcome(state, 'scorpion', 'force');
    state.reputation = 82;
    expect(recordCampaignEnding(state)).toBe('respect');
    state.reputation = 10;
    expect(recordCampaignEnding(state)).toBe('respect');
  });
});
